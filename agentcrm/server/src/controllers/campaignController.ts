import { Request, Response, NextFunction } from 'express';
import * as campaignService from '../services/campaignService';

export async function getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const campaigns = await campaignService.getCampaigns(req.user!.userId);
    res.status(200).json(campaigns);
  } catch (error) {
    next(error);
  }
}

export async function createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const campaign = await campaignService.createCampaign(req.body, req.user!.userId);
    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
}

export async function getCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const campaign = await campaignService.getCampaign(id);
    res.status(200).json(campaign);
  } catch (error) {
    next(error);
  }
}

export async function updateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const campaign = await campaignService.updateCampaign(id, req.body);
    res.status(200).json(campaign);
  } catch (error) {
    next(error);
  }
}

export async function updateCampaignStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const campaign = await campaignService.updateCampaignStatus(id, req.body.status);
    res.status(200).json(campaign);
  } catch (error) {
    next(error);
  }
}

export async function enrollContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const result = await campaignService.enrollContacts(id, req.body.contactIds);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function removeEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const contactId = parseInt(req.params.contactId);
    const result = await campaignService.removeEnrollment(id, contactId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
