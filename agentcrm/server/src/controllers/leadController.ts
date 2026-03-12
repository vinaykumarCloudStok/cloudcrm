import { Request, Response, NextFunction } from 'express';
import * as leadService from '../services/leadService';

export async function getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const leads = await leadService.getLeads(req.user!.userId, req.user!.role, req.query);
    res.status(200).json(leads);
  } catch (error) {
    next(error);
  }
}

export async function createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await leadService.createLead(req.body, req.user!.userId);
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
}

export async function getLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const lead = await leadService.getLead(id);
    res.status(200).json(lead);
  } catch (error) {
    next(error);
  }
}

export async function updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const lead = await leadService.updateLead(id, req.body);
    res.status(200).json(lead);
  } catch (error) {
    next(error);
  }
}

export async function updateLeadStage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const lead = await leadService.updateLeadStage(id, req.body.stage);
    res.status(200).json(lead);
  } catch (error) {
    next(error);
  }
}

export async function convertToOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const result = await leadService.convertToOpportunity(id, req.body, req.user!.userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
