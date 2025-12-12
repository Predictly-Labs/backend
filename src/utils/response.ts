import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 400,
  error?: string
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(response);
}

export function createdResponse<T>(
  res: Response,
  data: T,
  message: string = 'Created successfully'
): Response {
  return successResponse(res, data, message, 201);
}

export function notFoundResponse(
  res: Response,
  message: string = 'Resource not found'
): Response {
  return errorResponse(res, message, 404);
}

export function unauthorizedResponse(
  res: Response,
  message: string = 'Unauthorized'
): Response {
  return errorResponse(res, message, 401);
}

export function forbiddenResponse(
  res: Response,
  message: string = 'Forbidden'
): Response {
  return errorResponse(res, message, 403);
}

export function validationErrorResponse(
  res: Response,
  message: string = 'Validation error',
  errors?: string
): Response {
  return errorResponse(res, message, 422, errors);
}
