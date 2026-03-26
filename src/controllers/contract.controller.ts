import { Request, Response } from 'express';
import {
  getMarketCount,
  getMarketStatus,
  getMarketOutcome,
  getMarketPools,
  getMarketPercentages,
  getParticipantCount,
  getVotePrediction,
  getVoteAmount,
  calculateReward,
  buildCreateMarketPayload,
  buildPlaceVotePayload,
  buildResolvePayload,
  buildClaimRewardPayload,
  CONTRACT_ADDRESS,
  MARKET_TYPE_STANDARD,
  MARKET_TYPE_NO_LOSS,
  PREDICTION_YES,
  PREDICTION_NO,
  OUTCOME_YES,
  OUTCOME_NO,
  OUTCOME_INVALID,
  STATUS_ACTIVE,
  STATUS_RESOLVED,
} from '../services/contract.service.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '../utils/response.js';

/**
 * Get contract info
 * GET /api/contract/info
 */
export async function getContractInfo(req: Request, res: Response) {
  try {
    const marketCount = await getMarketCount();
    
    return successResponse(res, {
      contractAddress: CONTRACT_ADDRESS,
      marketCount,
      constants: {
        MARKET_TYPE_STANDARD,
        MARKET_TYPE_NO_LOSS,
        PREDICTION_YES,
        PREDICTION_NO,
        OUTCOME_YES,
        OUTCOME_NO,
        OUTCOME_INVALID,
        STATUS_ACTIVE,
        STATUS_RESOLVED,
      },
    });
  } catch (error) {
    console.error('Error getting contract info:', error);
    return errorResponse(res, 'Failed to get contract info', 500);
  }
}

/**
 * Get on-chain market data
 * GET /api/contract/markets/:marketId
 */
export async function getOnChainMarket(req: Request, res: Response) {
  try {
    const marketId = parseInt(req.params.marketId);
    
    if (isNaN(marketId)) {
      return errorResponse(res, 'Invalid market ID', 400);
    }

    const [status, outcome, pools, percentages, participantCount] = await Promise.all([
      getMarketStatus(marketId),
      getMarketOutcome(marketId),
      getMarketPools(marketId),
      getMarketPercentages(marketId),
      getParticipantCount(marketId),
    ]);

    return successResponse(res, {
      marketId,
      status,
      outcome,
      yesPool: pools.yesPool,
      noPool: pools.noPool,
      totalPool: pools.yesPool + pools.noPool,
      yesPercentage: percentages.yesPct,
      noPercentage: percentages.noPct,
      participantCount,
    });
  } catch (error) {
    console.error('Error getting on-chain market:', error);
    return notFoundResponse(res, 'Market not found on-chain');
  }
}

/**
 * Get on-chain vote data
 * GET /api/contract/markets/:marketId/votes/:voterAddress
 */
export async function getOnChainVote(req: Request, res: Response) {
  try {
    const marketId = parseInt(req.params.marketId);
    const { voterAddress } = req.params;
    
    if (isNaN(marketId)) {
      return errorResponse(res, 'Invalid market ID', 400);
    }

    const [prediction, amount, reward] = await Promise.all([
      getVotePrediction(marketId, voterAddress),
      getVoteAmount(marketId, voterAddress),
      calculateReward(marketId, voterAddress).catch(() => 0),
    ]);

    return successResponse(res, {
      marketId,
      voterAddress,
      prediction,
      predictionLabel: prediction === PREDICTION_YES ? 'YES' : 'NO',
      amount,
      potentialReward: reward,
    });
  } catch (error) {
    console.error('Error getting on-chain vote:', error);
    return notFoundResponse(res, 'Vote not found on-chain');
  }
}

/**
 * Build create market transaction payload
 * POST /api/contract/build/create-market
 */
export async function buildCreateMarket(req: Request, res: Response) {
  try {
    const { title, description, endTime, minStake, maxStake, resolver, marketType } = req.body;

    if (!title || !description || !endTime || !resolver) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    const payload = buildCreateMarketPayload({
      title,
      description,
      endTime: Math.floor(new Date(endTime).getTime() / 1000),
      minStake: minStake || 10000000, // Default 0.1 MOVE
      maxStake: maxStake || 0, // 0 = no limit
      resolver,
      marketType: marketType ?? MARKET_TYPE_STANDARD,
    });

    return successResponse(res, {
      payload,
      contractAddress: CONTRACT_ADDRESS,
    });
  } catch (error) {
    console.error('Error building create market payload:', error);
    return errorResponse(res, 'Failed to build transaction', 500);
  }
}

/**
 * Build place vote transaction payload
 * POST /api/contract/build/place-vote
 */
export async function buildPlaceVote(req: Request, res: Response) {
  try {
    const { marketId, prediction, amount } = req.body;

    if (marketId === undefined || !prediction || !amount) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    const predictionValue = prediction === 'YES' ? PREDICTION_YES : PREDICTION_NO;

    const payload = buildPlaceVotePayload({
      marketId,
      prediction: predictionValue,
      amount,
    });

    return successResponse(res, {
      payload,
      contractAddress: CONTRACT_ADDRESS,
    });
  } catch (error) {
    console.error('Error building place vote payload:', error);
    return errorResponse(res, 'Failed to build transaction', 500);
  }
}

/**
 * Build resolve market transaction payload
 * POST /api/contract/build/resolve
 */
export async function buildResolve(req: Request, res: Response) {
  try {
    const { marketId, outcome } = req.body;

    if (marketId === undefined || !outcome) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    let outcomeValue: number;
    switch (outcome) {
      case 'YES':
        outcomeValue = OUTCOME_YES;
        break;
      case 'NO':
        outcomeValue = OUTCOME_NO;
        break;
      case 'INVALID':
        outcomeValue = OUTCOME_INVALID;
        break;
      default:
        return errorResponse(res, 'Invalid outcome', 400);
    }

    const payload = buildResolvePayload({
      marketId,
      outcome: outcomeValue,
    });

    return successResponse(res, {
      payload,
      contractAddress: CONTRACT_ADDRESS,
    });
  } catch (error) {
    console.error('Error building resolve payload:', error);
    return errorResponse(res, 'Failed to build transaction', 500);
  }
}

/**
 * Build claim reward transaction payload
 * POST /api/contract/build/claim
 */
export async function buildClaim(req: Request, res: Response) {
  try {
    const { marketId } = req.body;

    if (marketId === undefined) {
      return errorResponse(res, 'Missing market ID', 400);
    }

    const payload = buildClaimRewardPayload({ marketId });

    return successResponse(res, {
      payload,
      contractAddress: CONTRACT_ADDRESS,
    });
  } catch (error) {
    console.error('Error building claim payload:', error);
    return errorResponse(res, 'Failed to build transaction', 500);
  }
}
