import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { successResponse, createdResponse, unauthorizedResponse } from '../utils/response.js';

/**
 * Generate sign-in message for wallet authentication
 * POST /api/auth/wallet/message
 */
export async function generateMessage(req: Request, res: Response) {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({
      error: {
        code: 'MISSING_WALLET_ADDRESS',
        message: 'Wallet address is required',
        retryable: false,
      },
    });
  }

  const result = await authService.generateSignInMessage(walletAddress);

  return successResponse(res, result, 'Sign-in message generated');
}

/**
 * Verify wallet signature and authenticate user
 * POST /api/auth/wallet/verify
 */
export async function verifySignature(req: Request, res: Response) {
  const { walletAddress, signature, message, publicKey } = req.body;

  if (!walletAddress || !signature || !message) {
    return res.status(400).json({
      error: {
        code: 'MISSING_PARAMETERS',
        message: 'Wallet address, signature, and message are required',
        retryable: false,
      },
    });
  }

  try {
    const result = await authService.verifySignature(walletAddress, signature, message, publicKey);
    
    return successResponse(res, result, 'Authentication successful');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    return unauthorizedResponse(res, errorMessage);
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export async function getCurrentUser(req: Request, res: Response) {
  // User is attached by auth middleware
  const user = req.user;

  if (!user) {
    return unauthorizedResponse(res, 'Not authenticated');
  }

  return successResponse(res, user);
}
