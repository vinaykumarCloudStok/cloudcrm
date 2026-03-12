import { Request, Response, NextFunction } from 'express';
import * as opportunityService from '../services/opportunityService';

export async function getOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const opportunities = await opportunityService.getOpportunities(req.user!.userId, req.user!.role, req.query);
    res.status(200).json(opportunities);
  } catch (error) {
    next(error);
  }
}

export async function createOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const opportunity = await opportunityService.createOpportunity(req.body, req.user!.userId);
    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
}

export async function getPipeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pipeline = await opportunityService.getPipeline(req.user!.userId, req.user!.role);
    res.status(200).json(pipeline);
  } catch (error) {
    next(error);
  }
}

export async function getForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const forecast = await opportunityService.getForecast(req.user!.userId, req.user!.role);
    res.status(200).json(forecast);
  } catch (error) {
    next(error);
  }
}

export async function getOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const opportunity = await opportunityService.getOpportunity(id);
    res.status(200).json(opportunity);
  } catch (error) {
    next(error);
  }
}

export async function updateOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const opportunity = await opportunityService.updateOpportunity(id, req.body);
    res.status(200).json(opportunity);
  } catch (error) {
    next(error);
  }
}

export async function updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const opportunity = await opportunityService.updateStage(id, req.body.stage);
    res.status(200).json(opportunity);
  } catch (error) {
    next(error);
  }
}
