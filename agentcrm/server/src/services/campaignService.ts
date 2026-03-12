import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getCampaigns(userId: number) {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { createdById: userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
    });

    return campaigns;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch campaigns.', 500);
  }
}

export async function getCampaign(id: number) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        enrollments: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
              },
            },
          },
        },
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    return campaign;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch campaign.', 500);
  }
}

export async function createCampaign(
  data: {
    name: string;
    description?: string;
    targetSegment?: string;
    steps?: Array<{
      stepOrder: number;
      subject: string;
      bodyTemplate: string;
      delayDays?: number;
    }>;
  },
  userId: number
) {
  try {
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description || null,
        targetSegment: data.targetSegment || null,
        createdById: userId,
        steps: data.steps
          ? {
              create: data.steps.map((step) => ({
                stepOrder: step.stepOrder,
                subject: step.subject,
                bodyTemplate: step.bodyTemplate,
                delayDays: step.delayDays ?? 1,
              })),
            }
          : undefined,
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
    });

    return campaign;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create campaign.', 500);
  }
}

export async function updateCampaign(id: number, data: Record<string, unknown>) {
  try {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Campaign not found.', 404);
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data,
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
    });

    return campaign;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update campaign.', 500);
  }
}

export async function updateCampaignStatus(id: number, status: string) {
  try {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Campaign not found.', 404);
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status },
    });

    return campaign;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update campaign status.', 500);
  }
}

export async function enrollContacts(campaignId: number, contactIds: number[]) {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    // Get existing enrollments to skip duplicates
    const existingEnrollments = await prisma.campaignEnrollment.findMany({
      where: {
        campaignId,
        contactId: { in: contactIds },
      },
      select: { contactId: true },
    });

    const existingContactIds = new Set(existingEnrollments.map((e) => e.contactId));
    const newContactIds = contactIds.filter((id) => !existingContactIds.has(id));

    if (newContactIds.length === 0) {
      return { enrolled: 0, skipped: contactIds.length };
    }

    await prisma.campaignEnrollment.createMany({
      data: newContactIds.map((contactId) => ({
        campaignId,
        contactId,
        currentStep: 0,
        status: 'ACTIVE',
      })),
    });

    return {
      enrolled: newContactIds.length,
      skipped: contactIds.length - newContactIds.length,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to enroll contacts.', 500);
  }
}

export async function removeEnrollment(campaignId: number, contactId: number) {
  try {
    const enrollment = await prisma.campaignEnrollment.findUnique({
      where: {
        campaignId_contactId: {
          campaignId,
          contactId,
        },
      },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found.', 404);
    }

    const updated = await prisma.campaignEnrollment.update({
      where: {
        campaignId_contactId: {
          campaignId,
          contactId,
        },
      },
      data: { status: 'REMOVED' },
    });

    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to remove enrollment.', 500);
  }
}
