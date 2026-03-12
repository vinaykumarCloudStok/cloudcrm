import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getRepDashboard(userId: number) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Pipeline value: sum dealValue by stage for user's open opportunities
    const openOpportunities = await prisma.opportunity.findMany({
      where: {
        ownerId: userId,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      },
      select: { stage: true, dealValue: true },
    });

    const pipelineValue: Record<string, number> = {};
    for (const opp of openOpportunities) {
      if (!pipelineValue[opp.stage]) pipelineValue[opp.stage] = 0;
      pipelineValue[opp.stage] += opp.dealValue;
    }

    // Leads needing attention: no activity in 7+ days
    const leadsNeedingAttention = await prisma.lead.count({
      where: {
        assignedRepId: userId,
        stage: { notIn: ['CONVERTED', 'DISQUALIFIED'] },
        OR: [
          {
            activities: {
              none: {
                createdAt: { gte: sevenDaysAgo },
              },
            },
          },
        ],
      },
    });

    // Deals at risk: stalled 14+ days in non-closed stages
    const dealsAtRisk = await prisma.opportunity.findMany({
      where: {
        ownerId: userId,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        updatedAt: { lt: fourteenDaysAgo },
      },
      select: {
        id: true,
        name: true,
        stage: true,
        dealValue: true,
        updatedAt: true,
        account: {
          select: { id: true, companyName: true },
        },
      },
    });

    // Upcoming tasks: due today or tomorrow
    const upcomingTasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { not: 'COMPLETED' },
        dueDate: {
          gte: today,
          lt: dayAfterTomorrow,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Recent agent feed: last 10 AGENT_ACTION activities for user's entities
    const recentAgentFeed = await prisma.activity.findMany({
      where: {
        type: 'AGENT_ACTION',
        OR: [
          { userId },
          { account: { ownerId: userId } },
          { lead: { assignedRepId: userId } },
          { opportunity: { ownerId: userId } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Priorities: top 3 items (overdue tasks, hot leads 75+, at-risk deals)
    const priorities: Array<{ type: string; title: string; id: number; entityType: string }> = [];

    // Overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { not: 'COMPLETED' },
        dueDate: { lt: today },
      },
      take: 3,
      orderBy: { dueDate: 'asc' },
    });

    for (const task of overdueTasks) {
      priorities.push({
        type: 'OVERDUE_TASK',
        title: task.title,
        id: task.id,
        entityType: 'task',
      });
    }

    // Hot leads (score 75+)
    const hotLeads = await prisma.lead.findMany({
      where: {
        assignedRepId: userId,
        aiScore: { gte: 75 },
        stage: { notIn: ['CONVERTED', 'DISQUALIFIED'] },
      },
      take: 3,
      orderBy: { aiScore: 'desc' },
    });

    for (const lead of hotLeads) {
      priorities.push({
        type: 'HOT_LEAD',
        title: `${lead.firstName} ${lead.lastName}`,
        id: lead.id,
        entityType: 'lead',
      });
    }

    // At-risk deals (reuse already fetched)
    for (const deal of dealsAtRisk.slice(0, 3)) {
      priorities.push({
        type: 'AT_RISK_DEAL',
        title: deal.name,
        id: deal.id,
        entityType: 'opportunity',
      });
    }

    return {
      pipelineValue,
      leadsNeedingAttention,
      dealsAtRisk,
      upcomingTasks,
      recentAgentFeed,
      priorities: priorities.slice(0, 3),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch rep dashboard.', 500);
  }
}

export async function getManagerDashboard(userId: number) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get team members (user + direct reports)
    const reports = await prisma.user.findMany({
      where: { managerId: userId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    const teamIds = [userId, ...reports.map((r) => r.id)];

    // Team pipeline: pipeline by stage across team
    const teamOpportunities = await prisma.opportunity.findMany({
      where: {
        ownerId: { in: teamIds },
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      },
      select: { stage: true, dealValue: true },
    });

    const teamPipelineMap: Record<string, { count: number; totalValue: number }> = {};
    for (const opp of teamOpportunities) {
      if (!teamPipelineMap[opp.stage]) {
        teamPipelineMap[opp.stage] = { count: 0, totalValue: 0 };
      }
      teamPipelineMap[opp.stage].count++;
      teamPipelineMap[opp.stage].totalValue += opp.dealValue;
    }

    const teamPipeline = Object.entries(teamPipelineMap).map(([stage, data]) => ({
      stage,
      count: data.count,
      totalValue: data.totalValue,
    }));

    // Revenue target: closed this month vs hardcoded target
    const closedWonThisMonth = await prisma.opportunity.findMany({
      where: {
        ownerId: { in: teamIds },
        stage: 'CLOSED_WON',
        updatedAt: { gte: monthStart },
      },
      select: { dealValue: true },
    });

    const closedValue = closedWonThisMonth.reduce((sum, opp) => sum + opp.dealValue, 0);

    const revenueTarget = {
      closed: closedValue,
      target: 1000000, // hardcoded for MVP
    };

    // Top opportunities: top 5 by dealValue in non-closed stages
    const topOpportunities = await prisma.opportunity.findMany({
      where: {
        ownerId: { in: teamIds },
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      },
      take: 5,
      orderBy: { dealValue: 'desc' },
      include: {
        account: {
          select: { id: true, companyName: true },
        },
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Conversion rate: leads created/converted this month
    const leadsCreated = await prisma.lead.count({
      where: {
        assignedRepId: { in: teamIds },
        createdAt: { gte: monthStart },
      },
    });

    const leadsConverted = await prisma.lead.count({
      where: {
        assignedRepId: { in: teamIds },
        stage: 'CONVERTED',
        updatedAt: { gte: monthStart },
      },
    });

    const conversionRate = {
      leadsCreated,
      converted: leadsConverted,
    };

    // Leaderboard: per rep activities this month
    const teamActivities = await prisma.activity.findMany({
      where: {
        userId: { in: teamIds },
        createdAt: { gte: monthStart },
      },
      select: {
        type: true,
        userId: true,
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const leaderboardMap: Record<
      number,
      { name: string; calls: number; emails: number; meetings: number }
    > = {};

    for (const id of teamIds) {
      const rep = reports.find((r) => r.id === id);
      const name = rep
        ? `${rep.firstName} ${rep.lastName}`
        : 'You';
      leaderboardMap[id] = { name, calls: 0, emails: 0, meetings: 0 };
    }

    for (const activity of teamActivities) {
      const entry = leaderboardMap[activity.userId];
      if (!entry) continue;
      const type = activity.type.toUpperCase();
      if (type === 'CALL' || type === 'PHONE_CALL') entry.calls++;
      else if (type === 'EMAIL') entry.emails++;
      else if (type === 'MEETING') entry.meetings++;
    }

    const leaderboard = Object.entries(leaderboardMap).map(([repId, data]) => ({
      repId: Number(repId),
      ...data,
    }));

    // At-risk deals: stalled 14+ days
    const atRiskDeals = await prisma.opportunity.findMany({
      where: {
        ownerId: { in: teamIds },
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        updatedAt: { lt: fourteenDaysAgo },
      },
      include: {
        account: {
          select: { id: true, companyName: true },
        },
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return {
      teamPipeline,
      revenueTarget,
      topOpportunities,
      conversionRate,
      leaderboard,
      atRiskDeals,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch manager dashboard.', 500);
  }
}
