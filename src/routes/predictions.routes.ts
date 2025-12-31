import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  createPredictionSchema,
  placeVoteSchema,
  resolveMarketSchema,
  listPredictionsQuerySchema,
  myVotesQuerySchema,
} from '../validators/predictions.validator.js';
import {
  createMarket,
  getMarkets,
  getMarketById,
  placeVote,
  resolveMarket,
  claimReward,
  getUserVotes,
  getMyVotesStats,
  getMyVoteOnMarket,
} from '../controllers/predictions.controller.js';
import { getResolvedMarkets } from '../controllers/predictions.controller.js';

const router = Router();

// Public routes
router.get('/', validateQuery(listPredictionsQuerySchema), getMarkets);
router.get('/my-votes', authMiddleware, validateQuery(myVotesQuerySchema), getUserVotes);
router.get('/my-votes/stats', authMiddleware, getMyVotesStats);
router.get('/resolved-by/:userId', getResolvedMarkets);
router.get('/:id', optionalAuthMiddleware, getMarketById);
router.get('/:marketId/my-vote', authMiddleware, getMyVoteOnMarket);

// Protected routes
router.post('/', authMiddleware, validateBody(createPredictionSchema), createMarket);
router.post('/:id/vote', authMiddleware, validateBody(placeVoteSchema), placeVote);
router.post('/:id/resolve', authMiddleware, validateBody(resolveMarketSchema), resolveMarket);
router.post('/:id/claim', authMiddleware, claimReward);

export default router;
