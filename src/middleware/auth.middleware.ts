import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { unauthorizedResponse } from '../utils/response.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        privyId?: string | null;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  walletAddress: string;
  privyId?: string; // Legacy field for backward compatibility
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      
      // Optionally verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, walletAddress: true, privyId: true },
      });

      if (!user) {
        return unauthorizedResponse(res, 'User not found');
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return unauthorizedResponse(res, 'Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Optional auth middleware
 * Attaches user if token is valid, but doesn't require it
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, walletAddress: true, privyId: true },
      });

      if (user) {
        req.user = user;
      }
    } catch (jwtError) {
      // Token invalid, but continue without user
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Generate JWT token for a user
 */
export function generateToken(user: { id: string; walletAddress: string; privyId?: string | null }): string {
  return jwt.sign(
    {
      userId: user.id,
      walletAddress: user.walletAddress,
      privyId: user.privyId, // Include for backward compatibility
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
