import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const notifications = await notificationService.getNotifications(req.user!.userId, page, limit);
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    res.status(200).json(count);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const notification = await notificationService.markAsRead(id);
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await notificationService.markAllAsRead(req.user!.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
