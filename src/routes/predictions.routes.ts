import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  createPredictionSchema,
  placeVoteSchema,
  resolveMarketSchema,
  listPredictionsQuerySchema,
} from '../validators/predictions.validator.js';
import {
  createMarket,
  getMarkets,
  getMarketById,
  placeVote,
  resolveMarket,
  claimReward,
  getUserVotes,
} from '../controllers/predictions.controller.js';

const router = Router();

// Public routes
router.get('/', validateQuery(listPredictionsQuerySchema), getMarkets);
router.get('/my-votes', authMiddleware, getUserVotes);
router.get('/:id', optionalAuthMiddleware, getMarketById);

// Protected routes
router.post('/', authMiddleware, validateBody(createPredictionSchema), createMarket);
router.post('/:id/vote', authMiddleware, validateBody(placeVoteSchema), placeVote);
router.post('/:id/resolve', authMiddleware, validateBody(resolveMarketSchema), resolveMarket);
router.post('/:id/claim', authMiddleware, claimReward);

export default router;
