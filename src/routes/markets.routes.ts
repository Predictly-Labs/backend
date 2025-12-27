import { Router } from 'express';
import {
  createMarket,
  initializeMarket,
  getMarket,
  getGroupMarkets,
  syncMarketData,
} from '../controllers/markets.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  marketCreationRateLimiter,
  marketInitializationRateLimiter,
} from '../middleware/rate-limit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createMarketSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  marketType: z.enum(['STANDARD', 'NO_LOSS', 'WITH_YIELD']),
  endDate: z.string().datetime('Invalid end date'),
  minStake: z.number().positive('Minimum stake must be positive'),
  maxStake: z.number().positive('Maximum stake must be positive').optional(),
});

// Protected routes (require authentication)
router.post('/', authMiddleware, marketCreationRateLimiter, validateBody(createMarketSchema), createMarket);
router.post('/:id/initialize', authMiddleware, marketInitializationRateLimiter, initializeMarket);
router.post('/:id/sync', authMiddleware, syncMarketData);

// Public routes
router.get('/:id', getMarket);

export default router;
