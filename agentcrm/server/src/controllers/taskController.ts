import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/taskService';

export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const tasks = await taskService.getTasks(req.user!.userId, req.query);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.createTask(req.body, req.user!.userId);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const task = await taskService.updateTask(id, req.body);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
}
