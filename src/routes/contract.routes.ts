import { Router } from 'express';
import {
  getContractInfo,
  getOnChainMarket,
  getOnChainVote,
  buildCreateMarket,
  buildPlaceVote,
  buildResolve,
  buildClaim,
} from '../controllers/contract.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Public endpoints - read on-chain data
router.get('/info', getContractInfo);
router.get('/markets/:marketId', getOnChainMarket);
router.get('/markets/:marketId/votes/:voterAddress', getOnChainVote);

// Protected endpoints - build transaction payloads
router.post('/build/create-market', authMiddleware, buildCreateMarket);
router.post('/build/place-vote', authMiddleware, buildPlaceVote);
router.post('/build/resolve', authMiddleware, buildResolve);
router.post('/build/claim', authMiddleware, buildClaim);

export default router;
