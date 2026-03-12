import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { buildScopeFilter } from '../middleware/rbac';
import { JwtPayload } from '../middleware/auth';

interface LeadFilters {
  stage?: string;
  assignedRepId?: number;
  scoreMin?: number;
  scoreMax?: number;
  source?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function getLeads(userId: number, userRole: string, filters: LeadFilters) {
  try {
    const user: JwtPayload = { userId, email: '', role: userRole, managerId: null };
    const scopeFilter = buildScopeFilter(user, 'lead');

    const where: Record<string, unknown> = { ...scopeFilter };

    if (filters.stage) {
      where.stage = filters.stage;
    }
    if (filters.assignedRepId) {
      where.assignedRepId = filters.assignedRepId;
    }
    if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
      const aiScoreFilter: Record<string, number> = {};
      if (filters.scoreMin !== undefined) aiScoreFilter.gte = filters.scoreMin;
      if (filters.scoreMax !== undefined) aiScoreFilter.lte = filters.scoreMax;
      where.aiScore = aiScoreFilter;
    }
    if (filters.source) {
      where.source = filters.source;
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { aiScore: 'desc' },
        include: {
          account: {
            select: {
              id: true,
              companyName: true,
              status: true,
            },
          },
          assignedRep: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch leads.', 500);
  }
}

export async function getLead(id: number) {
  try {
    const lead = await prisma.lead.findUnique({
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
        assignedRep: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        scoreLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          take: 10,
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
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new AppError('Lead not found.', 404);
    }

    return lead;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch lead.', 500);
  }
}

export async function createLead(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    accountId?: number;
    source?: string;
    assignedRepId?: number;
    aiScore?: number;
  },
  userId: number
) {
  try {
    // Check for duplicate by email
    const existingLead = await prisma.lead.findFirst({
      where: { email: data.email },
    });
    if (existingLead) {
      throw new AppError('A lead with this email already exists.', 409);
    }

    let assignedRepId = data.assignedRepId;

    // Auto-assign if no assignedRepId provided (round-robin)
    if (!assignedRepId) {
      const reps = await prisma.user.findMany({
        where: { role: 'SALES_REP', isActive: true },
        select: { id: true },
      });

      if (reps.length > 0) {
        // Count leads per rep and assign to one with fewest
        const repLeadCounts = await Promise.all(
          reps.map(async (rep) => {
            const count = await prisma.lead.count({
              where: { assignedRepId: rep.id },
            });
            return { repId: rep.id, count };
          })
        );

        repLeadCounts.sort((a, b) => a.count - b.count);
        assignedRepId = repLeadCounts[0].repId;
      }
    }

    const lead = await prisma.lead.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        accountId: data.accountId || null,
        source: data.source || null,
        assignedRepId: assignedRepId || null,
        aiScore: data.aiScore || 0,
        stage: 'NEW',
      },
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
          },
        },
        assignedRep: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return lead;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create lead.', 500);
  }
}

export async function updateLead(id: number, data: Record<string, unknown>) {
  try {
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Lead not found.', 404);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
          },
        },
        assignedRep: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return lead;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update lead.', 500);
  }
}

export async function updateLeadStage(id: number, stage: string) {
  try {
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Lead not found.', 404);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { stage },
    });

    return lead;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update lead stage.', 500);
  }
}

export async function convertToOpportunity(
  leadId: number,
  oppData: {
    name: string;
    dealValue?: number;
    expectedCloseDate?: string;
    description?: string;
    primaryContactId?: number;
  },
  userId: number
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { account: true },
    });

    if (!lead) {
      throw new AppError('Lead not found.', 404);
    }

    if (lead.stage === 'CONVERTED') {
      throw new AppError('Lead has already been converted.', 400);
    }

    if (!lead.accountId) {
      throw new AppError('Lead must be associated with an account before conversion.', 400);
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        name: oppData.name,
        accountId: lead.accountId,
        primaryContactId: oppData.primaryContactId || null,
        dealValue: oppData.dealValue || 0,
        expectedCloseDate: oppData.expectedCloseDate
          ? new Date(oppData.expectedCloseDate)
          : null,
        description: oppData.description || null,
        stage: 'DISCOVERY',
        probability: 10,
        ownerId: userId,
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

    // Mark lead as converted
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        stage: 'CONVERTED',
        convertedOpportunityId: opportunity.id,
      },
    });

    return opportunity;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to convert lead to opportunity.', 500);
  }
}
