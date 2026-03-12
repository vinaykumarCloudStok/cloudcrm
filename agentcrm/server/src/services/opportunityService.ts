import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { buildScopeFilter } from '../middleware/rbac';
import { JwtPayload } from '../middleware/auth';

const STAGE_PROBABILITIES: Record<string, number> = {
  DISCOVERY: 10,
  BUSINESS_VALIDATION: 20,
  TECHNICAL_VALIDATION: 30,
  PROPOSAL: 45,
  NEGOTIATION: 70,
  CONTRACT_SENT: 90,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
};

interface OpportunityFilters {
  stage?: string;
  ownerId?: number;
  accountId?: number;
  minDealValue?: number;
  maxDealValue?: number;
  search?: string;
  page: number;
  limit: number;
}

export async function getOpportunities(
  userId: number,
  userRole: string,
  filters: OpportunityFilters
) {
  try {
    const user: JwtPayload = { userId, email: '', role: userRole, managerId: null };
    const scopeFilter = buildScopeFilter(user, 'opportunity');

    const where: Record<string, unknown> = { ...scopeFilter };

    if (filters.stage) {
      where.stage = filters.stage;
    }
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }
    if (filters.accountId) {
      where.accountId = filters.accountId;
    }
    if (filters.minDealValue !== undefined || filters.maxDealValue !== undefined) {
      const dealValueFilter: Record<string, number> = {};
      if (filters.minDealValue !== undefined) dealValueFilter.gte = filters.minDealValue;
      if (filters.maxDealValue !== undefined) dealValueFilter.lte = filters.maxDealValue;
      where.dealValue = dealValueFilter;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          account: {
            select: {
              id: true,
              companyName: true,
              status: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          primaryContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              jobTitle: true,
            },
          },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch opportunities.', 500);
  }
}

export async function getOpportunity(id: number) {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
            status: true,
            industry: true,
          },
        },
        primaryContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            phone: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        dealCoachBriefs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        validationChecklists: true,
      },
    });

    if (!opportunity) {
      throw new AppError('Opportunity not found.', 404);
    }

    return opportunity;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch opportunity.', 500);
  }
}

export async function createOpportunity(
  data: {
    name: string;
    accountId: number;
    primaryContactId?: number;
    dealValue?: number;
    expectedCloseDate?: string;
    stage?: string;
    description?: string;
    solutionArchitectId?: number;
  },
  userId: number
) {
  try {
    const stage = data.stage || 'DISCOVERY';
    const probability = STAGE_PROBABILITIES[stage] ?? 10;

    const opportunity = await prisma.opportunity.create({
      data: {
        name: data.name,
        accountId: data.accountId,
        primaryContactId: data.primaryContactId || null,
        dealValue: data.dealValue || 0,
        expectedCloseDate: data.expectedCloseDate
          ? new Date(data.expectedCloseDate)
          : null,
        stage,
        probability,
        description: data.description || null,
        ownerId: userId,
        solutionArchitectId: data.solutionArchitectId || null,
      },
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return opportunity;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create opportunity.', 500);
  }
}

export async function updateOpportunity(id: number, data: Record<string, unknown>) {
  try {
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Opportunity not found.', 404);
    }

    const updateData = { ...data };

    // If stage changed, auto-update probability
    if (updateData.stage && updateData.stage !== existing.stage) {
      const newStage = updateData.stage as string;
      if (STAGE_PROBABILITIES[newStage] !== undefined) {
        updateData.probability = STAGE_PROBABILITIES[newStage];
      }

      // If stage changed to PROPOSAL and proposalValueAtSubmit is null, save current dealValue
      if (newStage === 'PROPOSAL' && existing.proposalValueAtSubmit === null) {
        const currentDealValue = (updateData.dealValue as number) ?? existing.dealValue;
        updateData.proposalValueAtSubmit = currentDealValue;
      }
    }

    // Handle expectedCloseDate conversion
    if (updateData.expectedCloseDate && typeof updateData.expectedCloseDate === 'string') {
      updateData.expectedCloseDate = new Date(updateData.expectedCloseDate as string);
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        primaryContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return opportunity;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update opportunity.', 500);
  }
}

export async function updateStage(id: number, stage: string) {
  try {
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Opportunity not found.', 404);
    }

    const probability = STAGE_PROBABILITIES[stage];
    if (probability === undefined) {
      throw new AppError(`Invalid stage: ${stage}`, 400);
    }

    const updateData: Record<string, unknown> = { stage, probability };

    // If moving to PROPOSAL and proposalValueAtSubmit is null, save current dealValue
    if (stage === 'PROPOSAL' && existing.proposalValueAtSubmit === null) {
      updateData.proposalValueAtSubmit = existing.dealValue;
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    return opportunity;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update opportunity stage.', 500);
  }
}

export async function getPipeline(userId: number, userRole: string) {
  try {
    const user: JwtPayload = { userId, email: '', role: userRole, managerId: null };
    const scopeFilter = buildScopeFilter(user, 'opportunity');

    const opportunities = await prisma.opportunity.findMany({
      where: {
        ...scopeFilter,
        stage: {
          notIn: ['CLOSED_WON', 'CLOSED_LOST'],
        },
      },
      include: {
        account: { select: { id: true, companyName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dealValue: 'desc' },
    });

    const pipelineMap: Record<string, { count: number; totalValue: number; opportunities: typeof opportunities }> = {};

    for (const opp of opportunities) {
      if (!pipelineMap[opp.stage]) {
        pipelineMap[opp.stage] = { count: 0, totalValue: 0, opportunities: [] };
      }
      pipelineMap[opp.stage].count++;
      pipelineMap[opp.stage].totalValue += opp.dealValue;
      pipelineMap[opp.stage].opportunities.push(opp);
    }

    const pipeline = Object.entries(pipelineMap).map(([stage, data]) => ({
      stage,
      count: data.count,
      totalValue: data.totalValue,
      opportunities: data.opportunities,
    }));

    return pipeline;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch pipeline.', 500);
  }
}

export async function getForecast(userId: number, userRole: string) {
  try {
    const user: JwtPayload = { userId, email: '', role: userRole, managerId: null };
    const scopeFilter = buildScopeFilter(user, 'opportunity');

    const opportunities = await prisma.opportunity.findMany({
      where: {
        ...scopeFilter,
        stage: {
          notIn: ['CLOSED_WON', 'CLOSED_LOST'],
        },
        expectedCloseDate: {
          not: null,
        },
      },
      select: {
        dealValue: true,
        probability: true,
        expectedCloseDate: true,
      },
    });

    const forecastMap: Record<string, number> = {};

    for (const opp of opportunities) {
      if (!opp.expectedCloseDate) continue;
      const date = new Date(opp.expectedCloseDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const weightedValue = (opp.dealValue * opp.probability) / 100;

      if (!forecastMap[monthKey]) {
        forecastMap[monthKey] = 0;
      }
      forecastMap[monthKey] += weightedValue;
    }

    const forecast = Object.entries(forecastMap)
      .map(([month, weightedValue]) => ({
        month,
        weightedValue: Math.round(weightedValue * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return forecast;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch forecast.', 500);
  }
}
