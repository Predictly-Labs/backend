import { Router } from 'express';
import {
  generateMessage,
  verifySignature,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const generateMessageSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
});

const verifySignatureSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
});

// Public routes with rate limiting
router.post('/wallet/message', authRateLimiter, validateBody(generateMessageSchema), generateMessage);
router.post('/wallet/verify', authRateLimiter, validateBody(verifySignatureSchema), verifySignature);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);

export default router;
