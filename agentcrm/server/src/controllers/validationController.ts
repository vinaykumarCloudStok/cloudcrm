import { Request, Response, NextFunction } from 'express';
import * as validationService from '../services/validationService';

export async function getChecklists(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
 // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const oppId = parseInt(req.params.id);
    const checklists = await validationService.getChecklists(oppId);
    res.status(200).json(checklists);
  } catch (error) {
    next(error);
  }
}

export async function updateChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const oppId = parseInt(req.params.id);
    const type = req.params.type;
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const checklist = await validationService.updateChecklist(oppId, type, req.body.items, req.user!.userId);
    res.status(200).json(checklist);
  } catch (error) {
    next(error);
  }
}

export async function getHandoff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const oppId = parseInt(req.params.id);
    const handoff = await validationService.getHandoff(oppId);
    res.status(200).json(handoff);
  } catch (error) {
    next(error);
  }
}

export async function createOrUpdateHandoff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const oppId = parseInt(req.params.id);
    const handoff = await validationService.createOrUpdateHandoff(oppId, req.body, req.user!.userId);
    res.status(200).json(handoff);
  } catch (error) {
    next(error);
  }
}
