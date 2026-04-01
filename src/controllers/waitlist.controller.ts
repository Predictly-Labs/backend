import { Request, Response } from 'express';
import * as waitlistService from '../services/waitlist.service.js';
import * as referralService from '../services/referral.service.js';
import {
  ERR_USER_ALREADY_EXISTS,
  ERR_REFERRAL_NOT_FOUND,
} from '../services/waitlist.service.js';
import {
  createdResponse,
  errorResponse,
  notFoundResponse,
  successResponse,
} from '../utils/response.js';

/**
 * Register a new waitlist entry
 * POST /api/waitlist
 */
export async function register(req: Request, res: Response) {
  try {
    const entry = await waitlistService.register(req.body);
    return createdResponse(res, entry, 'Registered successfully');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === ERR_REFERRAL_NOT_FOUND) {
        return notFoundResponse(res, 'Referral code not found');
      }
      if (error.message === ERR_USER_ALREADY_EXISTS) {
        return errorResponse(
          res,
          'This email or wallet address is already registered',
          409
        );
      }
    }
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Get waitlist referral leaderboard
 * GET /api/waitlist/leaderboard
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const result = await referralService.getLeaderboard(page, limit);

    return successResponse(res, result.leaderboard, 'Leaderboard fetched successfully', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500);
  }
}
