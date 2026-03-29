import { Request, Response } from 'express';
import * as waitlistService from '../services/waitlist.service.js';
import {
  ERR_USER_ALREADY_EXISTS,
  ERR_REFERRAL_NOT_FOUND,
} from '../services/waitlist.service.js';
import {
  createdResponse,
  errorResponse,
  notFoundResponse,
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
