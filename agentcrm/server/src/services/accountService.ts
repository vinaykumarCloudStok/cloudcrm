import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { buildScopeFilter } from '../middleware/rbac';
import { JwtPayload } from '../middleware/auth';

interface AccountFilters {
  status?: string;
  industry?: string;
  ownerId?: number;
  country?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function getAccounts(userId: number, userRole: string, filters: AccountFilters) {
  try {
    const user: JwtPayload = { userId, email: '', role: userRole, managerId: null };
    const scopeFilter = buildScopeFilter(user, 'account');

    const where: Record<string, unknown> = { ...scopeFilter };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.industry) {
      where.industry = filters.industry;
    }
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }
    if (filters.country) {
      where.country = filters.country;
    }
    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search } },
        { website: { contains: filters.search } },
        { industry: { contains: filters.search } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              contacts: true,
              leads: true,
              opportunities: true,
            },
          },
        },
      }),
      prisma.account.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch accounts.', 500);
  }
}

export async function getAccount(id: number) {
  try {
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            roleType: true,
            phone: true,
          },
        },
        techTags: true,
        signals: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            contacts: true,
            leads: true,
            opportunities: true,
            activities: true,
          },
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found.', 404);
    }

    return account;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch account.', 500);
  }
}

export async function createAccount(
  data: {
    companyName: string;
    website?: string;
    industry?: string;
    companySize?: string;
    country?: string;
    status?: string;
    annualRevenue?: number;
    source?: string;
    notes?: string;
  },
  userId: number
) {
  try {
    const account = await prisma.account.create({
      data: {
        ...data,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            contacts: true,
            leads: true,
            opportunities: true,
          },
        },
      },
    });

    return account;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create account.', 500);
  }
}

export async function updateAccount(id: number, data: Record<string, unknown>) {
  try {
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Account not found.', 404);
    }

    const account = await prisma.account.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            contacts: true,
            leads: true,
            opportunities: true,
          },
        },
      },
    });

    return account;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update account.', 500);
  }
}

export async function getAccountTimeline(accountId: number, page: number = 1, limit: number = 20) {
  try {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new AppError('Account not found.', 404);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.activity.findMany({
        where: { accountId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.activity.count({ where: { accountId } }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch account timeline.', 500);
  }
}
