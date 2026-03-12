import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';

export async function getRepDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await dashboardService.getRepDashboard(req.user!.userId);
    res.status(200).json(dashboard);
  } catch (error) {
    next(error);
  }
}

export async function getManagerDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await dashboardService.getManagerDashboard(req.user!.userId);
    res.status(200).json(dashboard);
  } catch (error) {
    next(error);
  }
}
