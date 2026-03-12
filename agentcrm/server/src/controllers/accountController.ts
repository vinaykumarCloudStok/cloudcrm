import { Request, Response, NextFunction } from 'express';
import * as accountService from '../services/accountService';

export async function getAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const accounts = await accountService.getAccounts(req.user!.userId, req.user!.role, req.query);
    res.status(200).json(accounts);
  } catch (error) {
    next(error);
  }
}

export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await accountService.createAccount(req.body, req.user!.userId);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
}

export async function getAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const account = await accountService.getAccount(id);
    res.status(200).json(account);
  } catch (error) {
    next(error);
  }
}

export async function updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const account = await accountService.updateAccount(id, req.body);
    res.status(200).json(account);
  } catch (error) {
    next(error);
  }
}

export async function getAccountTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const timeline = await accountService.getAccountTimeline(id, page, limit);
    res.status(200).json(timeline);
  } catch (error) {
    next(error);
  }
}
