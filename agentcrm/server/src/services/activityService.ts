import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

interface ActivityFilters {
  accountId?: number;
  contactId?: number;
  leadId?: number;
  opportunityId?: number;
  page: number;
  limit: number;
}

export async function getActivities(filters: ActivityFilters) {
  try {
    const where: Record<string, unknown> = {};

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }
    if (filters.contactId) {
      where.contactId = filters.contactId;
    }
    if (filters.leadId) {
      where.leadId = filters.leadId;
    }
    if (filters.opportunityId) {
      where.opportunityId = filters.opportunityId;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.activity.findMany({
        where,
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
      prisma.activity.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch activities.', 500);
  }
}

export async function logActivity(
  data: {
    type: string;
    description: string;
    accountId?: number;
    contactId?: number;
    leadId?: number;
    opportunityId?: number;
    metadata?: string;
  },
  userId: number
) {
  try {
    const activity = await prisma.activity.create({
      data: {
        type: data.type,
        description: data.description,
        userId,
        accountId: data.accountId || null,
        contactId: data.contactId || null,
        leadId: data.leadId || null,
        opportunityId: data.opportunityId || null,
        metadata: data.metadata || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update account.lastActivityAt if accountId provided
    if (data.accountId) {
      await prisma.account.update({
        where: { id: data.accountId },
        data: { lastActivityAt: new Date() },
      });
    }

    // Update contact.lastContactedAt if contactId provided
    if (data.contactId) {
      await prisma.contact.update({
        where: { id: data.contactId },
        data: { lastContactedAt: new Date() },
      });
    }

    return activity;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to log activity.', 500);
  }
}
