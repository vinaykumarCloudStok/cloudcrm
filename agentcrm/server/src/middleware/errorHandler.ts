import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // AppError (custom application errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: true,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002'
  ) {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    res.status(409).json({
      error: true,
      message: `A record with this ${target} already exists.`,
      statusCode: 409,
    });
    return;
  }

  // Prisma record not found (P2025)
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2025'
  ) {
    res.status(404).json({
      error: true,
      message: 'The requested record was not found.',
      statusCode: 404,
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const messages = err.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`
    );
    res.status(400).json({
      error: true,
      message: `Validation failed: ${messages.join('; ')}`,
      statusCode: 400,
    });
    return;
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      error: true,
      message: 'Token has expired.',
      statusCode: 401,
    });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      error: true,
      message: 'Invalid token.',
      statusCode: 401,
    });
    return;
  }

  // Generic / unknown errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message || 'Internal server error.',
    statusCode: 500,
  });
}
