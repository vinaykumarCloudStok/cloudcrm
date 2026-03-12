import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getNotifications(userId: number, page: number = 1, limit: number = 20) {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: [
          { isRead: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch notifications.', 500);
  }
}

export async function markAsRead(id: number) {
  try {
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Notification not found.', 404);
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return notification;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to mark notification as read.', 500);
  }
}

export async function markAllAsRead(userId: number) {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to mark all notifications as read.', 500);
  }
}

export async function getUnreadCount(userId: number) {
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get unread count.', 500);
  }
}

export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: string = 'GENERAL',
  link?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link: link || null,
      },
    });

    return notification;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create notification.', 500);
  }
}
