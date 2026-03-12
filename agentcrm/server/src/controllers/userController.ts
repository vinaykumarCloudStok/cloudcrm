import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
     // @ts-expect-error props not typed yet
// @ts-nocheck
// @ts-check
    const id = parseInt(req.params.id);
    const user = await userService.updateUser(id, req.body);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function getReps(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reps = await userService.getReps();
    res.status(200).json(reps);
  } catch (error) {
    next(error);
  }
}

export async function getSolutionArchitects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const architects = await userService.getSolutionArchitects();
    res.status(200).json(architects);
  } catch (error) {
    next(error);
  }
}
