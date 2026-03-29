import { Request, Response } from 'express';
import * as referralService from '../services/referral.service.js';
import { ERR_REFERRAL_NOT_FOUND } from '../services/waitlist.service.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '../utils/response.js';

/**
 * Get referral stats by referral code
 * GET /api/referral/:code
 */
export async function getStats(req: Request, res: Response) {
  try {
    const stats = await referralService.getStats(req.params.code);
    return successResponse(res, stats);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === ERR_REFERRAL_NOT_FOUND) {
        return notFoundResponse(res, 'Referral code not found');
      }
    }
    return errorResponse(res, 'Internal server error', 500);
  }
}
