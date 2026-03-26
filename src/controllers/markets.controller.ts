import { Request, Response } from 'express';
import * as marketService from '../services/market.service.js';
import * as initializationService from '../services/initialization.service.js';
import { prisma } from '../config/database.js';
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  errorResponse,
  forbiddenResponse,
} from '../utils/response.js';
import { MarketStatus } from '@prisma/client';

/**
 * Create a new prediction market (off-chain)
 * POST /api/markets
 */
export async function createMarket(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const {
      groupId,
      title,
      description,
      imageUrl,
      marketType,
      endDate,
      minStake,
      maxStake,
    } = req.body;

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) {
      return forbiddenResponse(res, 'You must be a group member to create markets');
    }

    // Create market off-chain
    const market = await marketService.createMarket({
      groupId,
      title,
      description,
      imageUrl,
      marketType,
      endDate: new Date(endDate),
      minStake,
      maxStake,
      createdById: userId,
    });

    return createdResponse(res, market, 'Market created successfully (off-chain)');
  } catch (error) {
    console.error('Error creating market:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Failed to create market');
  }
}

/**
 * Initialize market on-chain
 * POST /api/markets/:id/initialize
 */
export async function initializeMarket(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get market and check permissions
    const market = await prisma.predictionMarket.findUnique({
      where: { id },
      include: { group: true },
    });

    if (!market) {
      return notFoundResponse(res, 'Market not found');
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: market.groupId, userId },
    });

    if (!membership) {
      return forbiddenResponse(res, 'You must be a group member to initialize markets');
    }

    // Check if already initializing
    const isInitializing = await initializationService.isInitializing(id);
    if (isInitializing) {
      return errorResponse(res, 'Market initialization already in progress', 409);
    }

    // Initialize market on-chain
    const result = await initializationService.initializeMarket(id);

    if (result.alreadyInitialized) {
      return successResponse(res, result, 'Market already initialized');
    }

    return successResponse(res, result, 'Market initialized on-chain successfully');
  } catch (error) {
    console.error('Error initializing market:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Failed to initialize market');
  }
}

/**
 * Get market by ID with on-chain data
 * GET /api/markets/:id
 */
export async function getMarket(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const fetchOnChain = req.query.fetchOnChain !== 'false'; // Default true

    const market = await marketService.getMarket(id, fetchOnChain);

    return successResponse(res, market);
  } catch (error) {
    console.error('Error getting market:', error);
    
    if (error instanceof Error && error.message === 'Market not found') {
      return notFoundResponse(res, 'Market not found');
    }

    return errorResponse(res, error instanceof Error ? error.message : 'Failed to get market');
  }
}

/**
 * Get markets by group
 * GET /api/groups/:groupId/markets
 */
export async function getGroupMarkets(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    const { status, limit, offset } = req.query;

    // Parse filters
    const filters: any = {};
    
    if (status && typeof status === 'string') {
      filters.status = status as MarketStatus;
    }
    
    if (limit && typeof limit === 'string') {
      filters.limit = parseInt(limit);
    }
    
    if (offset && typeof offset === 'string') {
      filters.offset = parseInt(offset);
    }

    const markets = await marketService.getGroupMarkets(groupId, filters);

    return successResponse(res, markets);
  } catch (error) {
    console.error('Error getting group markets:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Failed to get group markets');
  }
}

/**
 * Sync market data from on-chain
 * POST /api/markets/:id/sync
 */
export async function syncMarketData(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const market = await marketService.syncMarketData(id);

    return successResponse(res, market, 'Market data synced successfully');
  } catch (error) {
    console.error('Error syncing market data:', error);
    
    if (error instanceof Error && error.message === 'Market not found') {
      return notFoundResponse(res, 'Market not found');
    }

    return errorResponse(res, error instanceof Error ? error.message : 'Failed to sync market data');
  }
}
