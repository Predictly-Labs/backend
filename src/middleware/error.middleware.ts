import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import { isDev } from '../config/env.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('❌ Error:', err);

  // Handle known operational errors
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode);
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return errorResponse(res, 'A record with this value already exists', 409);
      case 'P2025':
        return errorResponse(res, 'Record not found', 404);
      default:
        return errorResponse(res, 'Database error', 500);
    }
  }

  // Handle Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    return errorResponse(res, 'Invalid data provided', 400);
  }

  // Default to 500 internal server error
  const message = isDev ? err.message : 'Internal server error';
  const stack = isDev ? err.stack : undefined;

  return errorResponse(res, message, 500, stack);
}

// 404 handler
export function notFoundHandler(req: Request, res: Response) {
  return errorResponse(res, `Route ${req.originalUrl} not found`, 404);
}
