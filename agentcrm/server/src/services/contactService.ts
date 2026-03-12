import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

interface ContactFilters {
  accountId?: number;
  roleType?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function getContacts(filters: ContactFilters) {
  try {
    const where: Record<string, unknown> = {};

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }
    if (filters.roleType) {
      where.roleType = filters.roleType;
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { email: { contains: filters.search } },
        { jobTitle: { contains: filters.search } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
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
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch contacts.', 500);
  }
}

export async function getContact(id: number) {
  try {
    const contact = await prisma.contact.findUnique({
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
      },
    });

    if (!contact) {
      throw new AppError('Contact not found.', 404);
    }

    return contact;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch contact.', 500);
  }
}

export async function createContact(data: {
  firstName: string;
  lastName: string;
  accountId: number;
  jobTitle?: string;
  roleType?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  department?: string;
  communicationStyle?: string;
}) {
  try {
    const account = await prisma.account.findUnique({ where: { id: data.accountId } });
    if (!account) {
      throw new AppError('Account not found.', 404);
    }

    const contact = await prisma.contact.create({
      data,
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return contact;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create contact.', 500);
  }
}

export async function updateContact(id: number, data: Record<string, unknown>) {
  try {
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Contact not found.', 404);
    }

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return contact;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update contact.', 500);
  }
}
