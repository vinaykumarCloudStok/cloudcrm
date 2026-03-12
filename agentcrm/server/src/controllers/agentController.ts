import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export async function accountIntel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const accountId = parseInt(req.params.accountId);

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { contacts: true, owner: true, techTags: true },
    });

    if (!account) {
      res.status(404).json({ error: true, message: 'Account not found' });
      return;
    }

    // Generate mock signals based on account data
    const signals: Array<{ signalType: string; title: string; summary: string; severity: string }> = [];

    // Dormant check
    if (account.lastActivityAt) {
      const daysSinceActivity = Math.floor((Date.now() - new Date(account.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceActivity > 90) {
        signals.push({
          signalType: 'DORMANT_ALERT',
          title: 'Account Dormant',
          summary: `${account.companyName} has had no activity in ${daysSinceActivity} days - re-engagement needed`,
          severity: 'HIGH',
        });
      }
    }

    // Industry-specific signals
    if (account.industry === 'IT Services' || account.industry === 'SaaS') {
      signals.push({
        signalType: 'HIRING_SURGE',
        title: `${account.companyName} Hiring Surge Detected`,
        summary: `${account.companyName} appears to be expanding their engineering team, indicating potential budget for new tools and services.`,
        severity: 'HIGH',
      });
    }

    if (account.companySize === '201-500' || account.companySize === '500+') {
      signals.push({
        signalType: 'TECH_STACK_CHANGE',
        title: 'Technology Modernization Signal',
        summary: `${account.companyName} shows indicators of evaluating new technology solutions for ${account.industry || 'their sector'}.`,
        severity: 'MEDIUM',
      });
    }

    // Ensure at least one signal
    if (signals.length === 0) {
      signals.push({
        signalType: 'NEWS',
        title: `Market Update for ${account.companyName}`,
        summary: `${account.companyName} operates in the ${account.industry || 'technology'} sector - monitoring for relevant market developments.`,
        severity: 'LOW',
      });
    }

    // Save signals to AccountSignal table
    const savedSignals = [];
    for (const signal of signals) {
      const saved = await prisma.accountSignal.create({
        data: {
          accountId,
          signalType: signal.signalType,
          title: signal.title,
          summary: signal.summary,
          severity: signal.severity,
        },
      });
       // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
      savedSignals.push(saved);
    }

    res.status(200).json({
      success: true,
      accountId,
      signals: savedSignals,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function leadScore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const leadId = parseInt(req.params.leadId);

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { account: true, activities: true },
    });

    if (!lead) {
      res.status(404).json({ error: true, message: 'Lead not found' });
      return;
    }

    let score = 30; // base score

    // Account association
    if (lead.account) score += 10;

    // Industry fit
    if (lead.account?.industry && ['IT Services', 'SaaS', 'Professional Services'].includes(lead.account.industry)) {
      score += 15;
    }

    // Email present
    if (lead.email) score += 5;

    // Company size
    if (lead.account?.companySize === '201-500' || lead.account?.companySize === '500+') {
      score += 10;
    }

    // Activity recency
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = lead.activities?.some((a) => new Date(a.createdAt) > sevenDaysAgo);
    if (recentActivity) {
      score += 10;
    } else if (!lead.activities?.length) {
      score -= 10;
    }

    score = Math.min(100, Math.max(0, score));
    const previousScore = lead.aiScore;

    // Save score
    await prisma.lead.update({
      where: { id: leadId },
      data: { aiScore: score },
    });

    // Log the score change
    await prisma.leadScoreLog.create({
      data: {
        leadId,
        previousScore: previousScore ?? 0,
        newScore: score,
        reason: 'Deterministic scoring based on profile and activity',
      },
    });

    // Hot lead notification
    if (score >= 75 && lead.assignedRepId) {
      await prisma.notification.create({
        data: {
          userId: lead.assignedRepId,
          title: 'Hot Lead Alert',
          message: `${lead.firstName} ${lead.lastName} scored ${score} - engage now!`,
          type: 'HOT_LEAD',
          link: `/leads/${leadId}`,
        },
      });
    }

    res.status(200).json({
      success: true,
      leadId,
      previousScore,
      newScore: score,
      reason: 'Deterministic scoring based on profile and activity',
    });
  } catch (error) {
    next(error);
  }
}

export async function dealCoachBrief(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        account: { include: { techTags: true } },
        primaryContact: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!opportunity) {
      res.status(404).json({ error: true, message: 'Opportunity not found' });
      return;
    }

    const contactName = opportunity.primaryContact
      ? `${opportunity.primaryContact.firstName} ${opportunity.primaryContact.lastName}`
      : 'the key contact';
    const companyName = opportunity.account?.companyName || 'the organization';
    const techStack = opportunity.account?.techTags?.map((t) => t.tag).join(', ') || 'not documented';

    const brief = {
      personaSnapshot: `${contactName} at ${companyName} (${opportunity.primaryContact?.jobTitle || 'Unknown role'}). Industry: ${opportunity.account?.industry || 'Unknown'}. Tech stack: ${techStack}. Deal stage: ${opportunity.stage}, value: $${opportunity.dealValue.toLocaleString()}.`,
      painHypotheses: [
        {
          hypothesis: `${companyName} is struggling with manual processes that slow delivery`,
          confidence: 'High',
          question: `How is ${companyName} currently handling this workflow?`,
        },
        {
          hypothesis: 'Looking to modernize their tech stack for competitive advantage',
          confidence: 'Medium',
          question: 'What tools are you currently evaluating?',
        },
        {
          hypothesis: 'Need to scale operations efficiently without proportional headcount growth',
          confidence: 'Medium',
          question: 'What are your growth targets for the next 12 months?',
        },
      ],
      discoveryQuestions: [
        `What's the biggest challenge ${companyName} faces today in this area?`,
        'Walk me through your current workflow end-to-end',
        'What would success look like in 6 months?',
        'Who else is involved in this decision?',
        "What's your timeline for making a change?",
      ],
      valueBridge: [
        {
          ifTheySay: 'We need faster delivery',
          respondWith: 'Our DevOps acceleration service has helped similar companies reduce deployment time by 60%',
        },
        {
          ifTheySay: 'We need to reduce costs',
          respondWith: `Companies similar to ${companyName} typically see 30-40% cost reduction within the first year`,
        },
      ],
      objectionPrep: [
        {
          objection: "We're already working with another vendor",
          response: "That's great - many of our best clients started as second-opinion engagements",
        },
        {
          objection: 'Budget is tight this quarter',
          response: 'We offer phased implementation that spreads investment across quarters',
        },
        {
          objection: 'We need to see ROI first',
          response: `Let me share a case study from a similar company in the ${opportunity.account?.industry || 'technology'} space`,
        },
      ],
      howToClose: `Suggest a 30-minute technical deep-dive with ${contactName} and their team lead next week. Offer to prepare a custom demo based on ${companyName}'s specific use case.`,
    };

    // Save brief to DealCoachBrief table
    const savedBrief = await prisma.dealCoachBrief.create({
      data: {
        opportunityId: id,
        briefType: 'PRE_CALL',
        content: JSON.stringify(brief),
      },
    });

    res.status(200).json({
      success: true,
      opportunityId: id,
      briefId: savedBrief.id,
      brief,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function dealCoachFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const opportunityId = parseInt(req.params.opportunityId);

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        account: true,
        primaryContact: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });

    if (!opportunity) {
      res.status(404).json({ error: true, message: 'Opportunity not found' });
      return;
    }

    const contactName = opportunity.primaryContact
      ? `${opportunity.primaryContact.firstName}`
      : 'there';
    const companyName = opportunity.account?.companyName || 'your organization';

    const lastActivity = opportunity.activities?.[0];
    const lastActivityDesc = lastActivity
      ? `our ${lastActivity.type.toLowerCase()} on ${new Date(lastActivity.createdAt).toLocaleDateString()}`
      : 'our last conversation';

    const followUpEmail = {
      subject: `Following up - ${opportunity.name}`,
      body: `Hi ${contactName},\n\nI wanted to follow up on ${lastActivityDesc} regarding ${opportunity.name}.\n\nI've been thinking about how we can best support ${companyName} and wanted to share a few thoughts:\n\n1. Based on what you shared, I believe we can deliver significant value in the first 90 days\n2. I'd love to schedule a brief call to discuss next steps\n3. If timing has changed, I completely understand - just let me know what works better\n\nWould you have 15 minutes this week for a quick check-in?\n\nBest regards`,
      tone: 'professional',
      suggestedSendTime: 'Tuesday or Wednesday morning, 9-10 AM recipient timezone',
    };

    res.status(200).json({
      success: true,
      opportunityId,
      followUpEmail,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function followUpScan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);

    const tasksCreated: Array<{ title: string; relatedEntityType: string; relatedEntityId: number }> = [];

    // Find leads with no recent activity (21+ days)
    const staleLeads = await prisma.lead.findMany({
      where: {
        assignedRepId: userId,
        stage: { in: ['NEW', 'CONTACTED', 'ENGAGED'] },
        updatedAt: { lt: twentyOneDaysAgo },
      },
      include: { account: true },
      take: 10,
    });

    for (const lead of staleLeads) {
      // Check if a follow-up task already exists
      const existingTask = await prisma.task.findFirst({
        where: {
          assignedToId: userId,
          relatedEntityType: 'lead',
          relatedEntityId: lead.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      });

      if (!existingTask) {
        await prisma.task.create({
          data: {
            title: `Follow up with ${lead.firstName} ${lead.lastName}${lead.account ? ` (${lead.account.companyName})` : ''}`,
            description: 'Auto-generated: Lead has had no activity for 21+ days',
            assignedToId: userId,
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            priority: 'HIGH',
            status: 'PENDING',
            relatedEntityType: 'lead',
            relatedEntityId: lead.id,
          },
        });
        tasksCreated.push({ title: `Follow up with ${lead.firstName} ${lead.lastName}`, relatedEntityType: 'lead', relatedEntityId: lead.id });
      }
    }

    // Find opportunities with no recent activity (14+ days)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const staleOpps = await prisma.opportunity.findMany({
      where: {
        ownerId: userId,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        updatedAt: { lt: fourteenDaysAgo },
      },
      include: { account: true },
      take: 10,
    });

    for (const opp of staleOpps) {
      const existingTask = await prisma.task.findFirst({
        where: {
          assignedToId: userId,
          relatedEntityType: 'opportunity',
          relatedEntityId: opp.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      });

      if (!existingTask) {
        await prisma.task.create({
          data: {
            title: `Re-engage on ${opp.name}`,
            description: `Auto-generated: Deal at ${opp.account.companyName} has been stale for 14+ days`,
            assignedToId: userId,
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            priority: opp.dealValue >= 200000 ? 'URGENT' : 'HIGH',
            status: 'PENDING',
            relatedEntityType: 'opportunity',
            relatedEntityId: opp.id,
          },
        });
        tasksCreated.push({ title: `Re-engage on ${opp.name}`, relatedEntityType: 'opportunity', relatedEntityId: opp.id });
      }
    }

    // Find overdue tasks and escalate
    const overdueTasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: 'PENDING',
        dueDate: { lt: threeDaysAgo },
      },
      take: 10,
    });

    for (const task of overdueTasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: { priority: 'URGENT' },
      });
    }

    res.status(200).json({
      success: true,
      scan: {
        staleLeadsFound: staleLeads.length,
        staleOpportunitiesFound: staleOpps.length,
        overdueTasksEscalated: overdueTasks.length,
        tasksCreated: tasksCreated.length,
        details: tasksCreated,
      },
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
