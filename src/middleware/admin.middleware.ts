import { Request, Response, NextFunction } from 'express';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response.js';
import { env } from '../config/env.js';

/**
 * Admin authentication middleware
 * Verifies that the request has a valid admin token
 * 
 * For simplicity, we use a static admin token from environment variable
 * In production, you might want to use role-based access control (RBAC)
 */
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'No admin token provided');
    }

    const token = authHeader.split(' ')[1];
    const adminToken = env.ADMIN_TOKEN || env.JWT_SECRET; // Fallback to JWT_SECRET for dev

    if (token !== adminToken) {
      return forbiddenResponse(res, 'Invalid admin token');
    }

    next();
  } catch (error) {
    next(error);
  }
}
