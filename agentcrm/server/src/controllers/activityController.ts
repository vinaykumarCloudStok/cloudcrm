import { Request, Response, NextFunction } from 'express';
import * as activityService from '../services/activityService';

export async function getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = {
      accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
      contactId: req.query.contactId ? Number(req.query.contactId) : undefined,
      leadId: req.query.leadId ? Number(req.query.leadId) : undefined,
      opportunityId: req.query.opportunityId ? Number(req.query.opportunityId) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };
    const activities = await activityService.getActivities(filters);
    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
}

export async function logActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activity = await activityService.logActivity(req.body, req.user!.userId);
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
}
