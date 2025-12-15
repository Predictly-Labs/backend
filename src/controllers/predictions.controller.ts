import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  errorResponse,
  forbiddenResponse,
} from '../utils/response.js';
import type {
  CreatePredictionInput,
  PlaceVoteInput,
  ResolveMarketInput,
  ListPredictionsQuery,
} from '../validators/predictions.validator.js';

/**
 * Create a new prediction market
 * POST /api/predictions
 */
export async function createMarket(req: Request, res: Response) {
  const userId = req.user!.id;
  const input = req.body as CreatePredictionInput;

  // Check if user is a member of the group
  const membership = await prisma.groupMember.findFirst({
    where: { groupId: input.groupId, userId },
  });

  if (!membership) {
    return forbiddenResponse(res, 'You must be a group member to create markets');
  }

  const market = await prisma.predictionMarket.create({
    data: {
      groupId: input.groupId,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      marketType: input.marketType,
      endDate: new Date(input.endDate),
      minStake: input.minStake,
      maxStake: input.maxStake,
      createdById: userId,
      status: 'ACTIVE',
      yesPercentage: 50,
      noPercentage: 50,
    },
    include: {
      creator: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      group: {
        select: { id: true, name: true },
      },
    },
  });

  return createdResponse(res, market, 'Market created successfully');
}

/**
 * List prediction markets
 * GET /api/predictions
 */
export async function getMarkets(req: Request, res: Response) {
  const { page, limit, groupId, status } = req.query as unknown as ListPredictionsQuery;
  const skip = (page - 1) * limit;

  const where = {
    ...(groupId && { groupId }),
    ...(status && { status }),
  };

  const [markets, total] = await Promise.all([
    prisma.predictionMarket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        group: {
          select: { id: true, name: true },
        },
        _count: { select: { votes: true } },
      },
    }),
    prisma.predictionMarket.count({ where }),
  ]);

  const result = markets.map((m) => ({
    ...m,
    participantCount: m._count.votes,
  }));

  return successResponse(res, result, undefined, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * Get market by ID
 * GET /api/predictions/:id
 */
export async function getMarketById(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;

  const market = await prisma.predictionMarket.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      group: {
        select: { id: true, name: true },
      },
      votes: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!market) {
    return notFoundResponse(res, 'Market not found');
  }

  // Get user's vote if authenticated
  const userVote = userId
    ? market.votes.find((v) => v.userId === userId)
    : null;

  return successResponse(res, {
    ...market,
    participantCount: market.votes.length,
    userVote: userVote
      ? {
          prediction: userVote.prediction,
          amount: userVote.amount,
          hasClaimedReward: userVote.hasClaimedReward,
          rewardAmount: userVote.rewardAmount,
        }
      : null,
  });
}


/**
 * Place a vote on a market
 * POST /api/predictions/:id/vote
 */
export async function placeVote(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;
  const { prediction, amount } = req.body as PlaceVoteInput;

  // Get market
  const market = await prisma.predictionMarket.findUnique({
    where: { id },
    include: {
      group: {
        include: {
          members: { where: { userId }, select: { id: true } },
        },
      },
    },
  });

  if (!market) {
    return notFoundResponse(res, 'Market not found');
  }

  // Check if user is group member
  if (market.group.members.length === 0) {
    return forbiddenResponse(res, 'You must be a group member to vote');
  }

  // Check market status
  if (market.status !== 'ACTIVE') {
    return errorResponse(res, 'Market is not active', 400);
  }

  // Check if already voted
  const existingVote = await prisma.vote.findUnique({
    where: { marketId_userId: { marketId: id, userId } },
  });

  if (existingVote) {
    return errorResponse(res, 'You have already voted on this market', 400);
  }

  // Validate stake amount
  if (amount < market.minStake) {
    return errorResponse(res, `Minimum stake is ${market.minStake}`, 400);
  }

  if (market.maxStake && amount > market.maxStake) {
    return errorResponse(res, `Maximum stake is ${market.maxStake}`, 400);
  }

  // Create vote and update market pools
  const isYes = prediction === 'YES';
  const newYesPool = market.yesPool + (isYes ? amount : 0);
  const newNoPool = market.noPool + (isYes ? 0 : amount);
  const totalPool = newYesPool + newNoPool;

  const [vote] = await prisma.$transaction([
    prisma.vote.create({
      data: {
        marketId: id,
        userId,
        prediction,
        amount,
      },
    }),
    prisma.predictionMarket.update({
      where: { id },
      data: {
        yesPool: newYesPool,
        noPool: newNoPool,
        totalVolume: totalPool,
        yesPercentage: (newYesPool / totalPool) * 100,
        noPercentage: (newNoPool / totalPool) * 100,
        participantCount: { increment: 1 },
      },
    }),
  ]);

  return createdResponse(res, vote, 'Vote placed successfully');
}

/**
 * Resolve a market (Judge/Admin only)
 * POST /api/predictions/:id/resolve
 */
export async function resolveMarket(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;
  const { outcome, resolutionNote } = req.body as ResolveMarketInput;

  // Get market with group membership
  const market = await prisma.predictionMarket.findUnique({
    where: { id },
    include: {
      group: {
        include: {
          members: {
            where: { userId, role: { in: ['ADMIN', 'JUDGE'] } },
          },
        },
      },
      votes: true,
    },
  });

  if (!market) {
    return notFoundResponse(res, 'Market not found');
  }

  // Check if user is judge or admin
  if (market.group.members.length === 0) {
    return forbiddenResponse(res, 'Only judges or admins can resolve markets');
  }

  // Check if market has ended
  if (new Date() < market.endDate) {
    return errorResponse(res, 'Market has not ended yet', 400);
  }

  // Check if already resolved
  if (market.status === 'RESOLVED') {
    return errorResponse(res, 'Market is already resolved', 400);
  }

  // Calculate rewards
  const totalPool = market.yesPool + market.noPool;
  const winningPool = outcome === 'YES' ? market.yesPool : market.noPool;
  const winningVotes = market.votes.filter((v) => v.prediction === outcome);

  // Update votes with rewards
  const rewardUpdates = market.votes.map((vote) => {
    let rewardAmount = 0;

    if (outcome === 'INVALID') {
      // Refund original amount
      rewardAmount = vote.amount;
    } else if (vote.prediction === outcome) {
      // Winner gets proportional share of total pool
      rewardAmount = (vote.amount / winningPool) * totalPool;
    }

    return prisma.vote.update({
      where: { id: vote.id },
      data: { rewardAmount },
    });
  });

  // Update user stats
  const statsUpdates = market.votes.map((vote) => {
    const isWinner = outcome !== 'INVALID' && vote.prediction === outcome;
    return prisma.user.update({
      where: { id: vote.userId },
      data: {
        totalPredictions: { increment: 1 },
        ...(isWinner && { correctPredictions: { increment: 1 } }),
      },
    });
  });

  // Execute all updates
  await prisma.$transaction([
    prisma.predictionMarket.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        outcome,
        resolvedById: userId,
        resolvedAt: new Date(),
        resolutionNote,
      },
    }),
    ...rewardUpdates,
    ...statsUpdates,
  ]);

  return successResponse(res, { outcome, resolvedAt: new Date() }, 'Market resolved successfully');
}

/**
 * Claim reward for a resolved market
 * POST /api/predictions/:id/claim
 */
export async function claimReward(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  // Get user's vote
  const vote = await prisma.vote.findUnique({
    where: { marketId_userId: { marketId: id, userId } },
    include: { market: true },
  });

  if (!vote) {
    return notFoundResponse(res, 'You have not voted on this market');
  }

  if (vote.market.status !== 'RESOLVED') {
    return errorResponse(res, 'Market is not resolved yet', 400);
  }

  if (vote.hasClaimedReward) {
    return errorResponse(res, 'Reward already claimed', 400);
  }

  if (!vote.rewardAmount || vote.rewardAmount <= 0) {
    return errorResponse(res, 'You are not eligible for a reward', 400);
  }

  // Mark as claimed and update user earnings
  await prisma.$transaction([
    prisma.vote.update({
      where: { id: vote.id },
      data: { hasClaimedReward: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totalEarnings: { increment: vote.rewardAmount } },
    }),
  ]);

  return successResponse(res, { rewardAmount: vote.rewardAmount }, 'Reward claimed successfully');
}

/**
 * Get user's votes
 * GET /api/predictions/my-votes
 */
export async function getUserVotes(req: Request, res: Response) {
  const userId = req.user!.id;

  const votes = await prisma.vote.findMany({
    where: { userId },
    include: {
      market: {
        select: {
          id: true,
          title: true,
          status: true,
          outcome: true,
          endDate: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate mock yield for each vote
  const DAILY_YIELD_RATE = 0.05 / 365;
  const votesWithYield = votes.map((vote) => {
    const daysSinceVote = Math.floor(
      (Date.now() - vote.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const mockYield = vote.amount * DAILY_YIELD_RATE * daysSinceVote;

    return {
      ...vote,
      mockYield: Math.round(mockYield * 10000) / 10000,
      daysSinceVote,
    };
  });

  return successResponse(res, votesWithYield);
}
