import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { successResponse, createdResponse, notFoundResponse } from '../utils/response.js';
import type { AuthInput, UpdateUserInput } from '../validators/users.validator.js';

/**
 * Authenticate user with Privy
 * POST /api/auth/privy
 */
export async function authWithPrivy(req: Request, res: Response) {
  const { privyId, walletAddress, displayName, avatarUrl } = req.body as AuthInput;

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { privyId },
  });

  if (user) {
    // Update wallet address if provided
    if (walletAddress && walletAddress !== user.walletAddress) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress },
      });
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        privyId,
        walletAddress,
        displayName: displayName || `User_${privyId.slice(-6)}`,
        avatarUrl,
      },
    });
  }

  // Generate JWT token
  const token = generateToken(user);

  return successResponse(res, {
    user,
    token,
  }, user ? 'Welcome back!' : 'Account created successfully');
}

/**
 * Get current user profile
 * GET /api/users/me
 */
export async function getCurrentUser(req: Request, res: Response) {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
            },
          },
        },
        take: 10,
        orderBy: { joinedAt: 'desc' },
      },
      _count: {
        select: {
          memberships: true,
          votes: true,
          createdMarkets: true,
        },
      },
    },
  });

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  return successResponse(res, user);
}

/**
 * Update current user profile
 * PUT /api/users/me
 */
export async function updateCurrentUser(req: Request, res: Response) {
  const userId = req.user!.id;
  const updateData = req.body as UpdateUserInput;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return successResponse(res, user, 'Profile updated successfully');
}

/**
 * Get user by ID
 * GET /api/users/:id
 */
export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      walletAddress: true,
      totalPredictions: true,
      correctPredictions: true,
      totalEarnings: true,
      currentStreak: true,
      createdAt: true,
    },
  });

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Calculate win rate
  const winRate = user.totalPredictions > 0 
    ? Math.round((user.correctPredictions / user.totalPredictions) * 100) 
    : 0;

  return successResponse(res, {
    ...user,
    winRate,
  });
}

/**
 * Get user stats
 * GET /api/users/:id/stats
 */
export async function getUserStats(req: Request, res: Response) {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      totalPredictions: true,
      correctPredictions: true,
      totalEarnings: true,
      currentStreak: true,
      _count: {
        select: {
          memberships: true,
          createdMarkets: true,
        },
      },
    },
  });

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const winRate = user.totalPredictions > 0 
    ? Math.round((user.correctPredictions / user.totalPredictions) * 100) 
    : 0;

  return successResponse(res, {
    totalPredictions: user.totalPredictions,
    correctPredictions: user.correctPredictions,
    winRate,
    totalEarnings: user.totalEarnings,
    currentStreak: user.currentStreak,
    groupsJoined: user._count.memberships,
    marketsCreated: user._count.createdMarkets,
  });
}

/**
 * Get leaderboard
 * GET /api/leaderboard
 */
export async function getLeaderboard(req: Request, res: Response) {
  const { groupId } = req.query;
  const limit = 20;

  let users;

  if (groupId) {
    // Group-specific leaderboard
    users = await prisma.user.findMany({
      where: {
        memberships: {
          some: { groupId: groupId as string },
        },
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        totalPredictions: true,
        correctPredictions: true,
        totalEarnings: true,
        currentStreak: true,
      },
      orderBy: [
        { totalEarnings: 'desc' },
        { correctPredictions: 'desc' },
      ],
      take: limit,
    });
  } else {
    // Global leaderboard
    users = await prisma.user.findMany({
      where: {
        totalPredictions: { gt: 0 },
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        totalPredictions: true,
        correctPredictions: true,
        totalEarnings: true,
        currentStreak: true,
      },
      orderBy: [
        { totalEarnings: 'desc' },
        { correctPredictions: 'desc' },
      ],
      take: limit,
    });
  }

  const leaderboard = users.map((user, index) => ({
    rank: index + 1,
    ...user,
    winRate: user.totalPredictions > 0 
      ? Math.round((user.correctPredictions / user.totalPredictions) * 100) 
      : 0,
  }));

  return successResponse(res, leaderboard);
}
