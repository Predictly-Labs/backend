import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { errorResponse } from '../utils/response.js';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix: string; // Key prefix for identification
  message?: string; // Custom error message
}

/**
 * Create a rate limiter middleware using PostgreSQL
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Determine the key based on IP or user ID
      const identifier = req.user?.id || req.ip || 'unknown';
      const endpoint = config.keyPrefix;

      // Get or create rate limit record
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      let rateLimit = await prisma.rateLimit.findUnique({
        where: {
          identifier_endpoint: {
            identifier,
            endpoint,
          },
        },
      });

      // Check if window has expired
      if (rateLimit && rateLimit.windowStart < windowStart) {
        // Reset counter for new window
        rateLimit = await prisma.rateLimit.update({
          where: { id: rateLimit.id },
          data: {
            count: 1,
            windowStart: now,
            expiresAt: new Date(now.getTime() + config.windowMs),
          },
        });
      } else if (rateLimit) {
        // Check if limit exceeded
        if (rateLimit.count >= config.maxRequests) {
          const retryAfter = Math.ceil((rateLimit.expiresAt.getTime() - now.getTime()) / 1000);
          
          res.setHeader('Retry-After', retryAfter.toString());
          
          return errorResponse(
            res,
            config.message || 'Too many requests, please try again later',
            429
          );
        }

        // Increment counter
        rateLimit = await prisma.rateLimit.update({
          where: { id: rateLimit.id },
          data: {
            count: { increment: 1 },
          },
        });
      } else {
        // Create new rate limit record
        rateLimit = await prisma.rateLimit.create({
          data: {
            identifier,
            endpoint,
            count: 1,
            windowStart: now,
            expiresAt: new Date(now.getTime() + config.windowMs),
          },
        });
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (config.maxRequests - rateLimit.count).toString());

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Don't block request on rate limit error
      next();
    }
  };
}

/**
 * Rate limiter for authentication attempts
 * Limit: 5 attempts per 15 minutes per IP
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: 'ratelimit:auth',
  message: 'Too many authentication attempts, please try again in 15 minutes',
});

/**
 * Rate limiter for market creation
 * Limit: 10 markets per hour per user
 */
export const marketCreationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyPrefix: 'ratelimit:market:create',
  message: 'Too many markets created, please try again in an hour',
});

/**
 * Rate limiter for market initialization
 * Limit: 3 attempts per 5 minutes per market
 */
export const marketInitializationRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const marketId = req.params.id;
    if (!marketId) {
      return next();
    }

    const identifier = `market:${marketId}`;
    const endpoint = 'market:init';
    const windowMs = 5 * 60 * 1000; // 5 minutes
    const maxRequests = 3;

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    let rateLimit = await prisma.rateLimit.findUnique({
      where: {
        identifier_endpoint: {
          identifier,
          endpoint,
        },
      },
    });

    if (rateLimit && rateLimit.windowStart < windowStart) {
      rateLimit = await prisma.rateLimit.update({
        where: { id: rateLimit.id },
        data: {
          count: 1,
          windowStart: now,
          expiresAt: new Date(now.getTime() + windowMs),
        },
      });
    } else if (rateLimit) {
      if (rateLimit.count >= maxRequests) {
        const retryAfter = Math.ceil((rateLimit.expiresAt.getTime() - now.getTime()) / 1000);
        
        res.setHeader('Retry-After', retryAfter.toString());
        
        return errorResponse(
          res,
          'Too many initialization attempts for this market, please try again later',
          429
        );
      }

      rateLimit = await prisma.rateLimit.update({
        where: { id: rateLimit.id },
        data: {
          count: { increment: 1 },
        },
      });
    } else {
      rateLimit = await prisma.rateLimit.create({
        data: {
          identifier,
          endpoint,
          count: 1,
          windowStart: now,
          expiresAt: new Date(now.getTime() + windowMs),
        },
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - rateLimit.count).toString());

    next();
  } catch (error) {
    console.error('Market initialization rate limit error:', error);
    next();
  }
};

/**
 * General API rate limiter
 * Limit: 100 requests per minute per IP
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyPrefix: 'ratelimit:api',
  message: 'Too many requests, please slow down',
});
