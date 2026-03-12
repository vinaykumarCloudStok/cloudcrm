import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { JwtPayload } from './auth';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Required role(s): ${roles.join(', ')}`,
        403
      );
    }

    next();
  };
}

type EntityType =
  | 'account'
  | 'lead'
  | 'opportunity'
  | 'task'
  | 'activity'
  | 'campaign'
  | 'contact';

export function buildScopeFilter(
  user: JwtPayload,
  entityType: EntityType
): Record<string, unknown> {
  const { userId, role } = user;

  // ADMIN sees everything
  if (role === 'ADMIN') {
    return {};
  }

  // SALES_MANAGER sees own + direct reports
  if (role === 'SALES_MANAGER') {
    switch (entityType) {
      case 'account':
      case 'opportunity':
        return {
          OR: [
            { ownerId: userId },
            { owner: { managerId: userId } },
          ],
        };
      case 'lead':
        return {
          OR: [
            { assignedRepId: userId },
            { assignedRep: { managerId: userId } },
          ],
        };
      case 'task':
        return {
          OR: [
            { assignedToId: userId },
            { assignedTo: { managerId: userId } },
          ],
        };
      case 'activity':
        return {
          OR: [
            { userId: userId },
            { user: { managerId: userId } },
          ],
        };
      case 'campaign':
        return {};
      case 'contact':
        return {
          account: {
            OR: [
              { ownerId: userId },
              { owner: { managerId: userId } },
            ],
          },
        };
      default:
        return { ownerId: userId };
    }
  }

  // SALES_REP sees only own records
  if (role === 'SALES_REP') {
    switch (entityType) {
      case 'account':
      case 'opportunity':
        return { ownerId: userId };
      case 'lead':
        return { assignedRepId: userId };
      case 'task':
        return { assignedToId: userId };
      case 'activity':
        return { userId: userId };
      case 'campaign':
        return { createdById: userId };
      case 'contact':
        return {
          account: { ownerId: userId },
        };
      default:
        return { ownerId: userId };
    }
  }

  // MARKETING_MANAGER has read access to most, own for campaigns
  if (role === 'MARKETING_MANAGER') {
    switch (entityType) {
      case 'campaign':
        return { createdById: userId };
      case 'account':
      case 'lead':
      case 'contact':
      case 'opportunity':
      case 'activity':
        return {};
      default:
        return {};
    }
  }

  // SOLUTION_ARCHITECT has limited read access
  if (role === 'SOLUTION_ARCHITECT') {
    switch (entityType) {
      case 'opportunity':
        return {
          OR: [
            { ownerId: userId },
            { solutionArchitectId: userId },
          ],
        };
      case 'account':
      case 'contact':
      case 'activity':
        return {};
      case 'task':
        return { assignedToId: userId };
      default:
        return {};
    }
  }

  // Default: restrict to own records
  return { ownerId: userId };
}
