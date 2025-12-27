import { prisma } from '../config/database.js';
import * as contractService from './contract.service.js';
import { MarketStatus, MarketType } from '@prisma/client';

/**
 * Input for creating a market
 */
export interface CreateMarketInput {
  groupId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  marketType: MarketType;
  endDate: Date;
  minStake: number;
  maxStake?: number;
  createdById: string;
}

/**
 * Market with on-chain stats
 */
export interface MarketWithStats {
  id: string;
  onChainId: string | null;
  groupId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  marketType: MarketType;
  endDate: Date;
  minStake: number;
  maxStake: number | null;
  status: MarketStatus;
  outcome: string | null;
  totalVolume: number;
  yesPool: number;
  noPool: number;
  yesPercentage: number;
  noPercentage: number;
  participantCount: number;
  resolvedById: string | null;
  resolvedAt: Date | null;
  resolutionNote: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  onChainData?: {
    status: number;
    outcome: number;
    yesPool: number;
    noPool: number;
    totalVolume: number;
    yesPercentage: number;
    noPercentage: number;
    participantCount: number;
  };
}

/**
 * Create market in database (off-chain)
 */
export async function createMarket(input: CreateMarketInput) {
  // Validate input
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Market title is required');
  }

  if (!input.groupId) {
    throw new Error('Group ID is required');
  }

  if (!input.endDate || input.endDate <= new Date()) {
    throw new Error('End date must be in the future');
  }

  if (input.minStake <= 0) {
    throw new Error('Minimum stake must be greater than 0');
  }

  // Create market with PENDING status
  const market = await prisma.predictionMarket.create({
    data: {
      groupId: input.groupId,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      marketType: input.marketType,
      endDate: input.endDate,
      minStake: input.minStake,
      maxStake: input.maxStake,
      status: MarketStatus.PENDING, // Not on-chain yet
      onChainId: null,
      createdById: input.createdById,
    },
    include: {
      creator: {
        select: {
          id: true,
          walletAddress: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          iconUrl: true,
        },
      },
    },
  });

  console.log('✅ Market created (off-chain):', {
    id: market.id,
    title: market.title,
    status: market.status,
  });

  return market;
}

/**
 * Get market by ID with optional on-chain data
 */
export async function getMarket(marketId: string, fetchOnChainData: boolean = true): Promise<MarketWithStats> {
  const market = await prisma.predictionMarket.findUnique({
    where: { id: marketId },
    include: {
      creator: {
        select: {
          id: true,
          walletAddress: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          iconUrl: true,
        },
      },
    },
  });

  if (!market) {
    throw new Error('Market not found');
  }

  // If market is ACTIVE and has onChainId, fetch on-chain data
  let onChainData;
  if (fetchOnChainData && market.onChainId && market.status === MarketStatus.ACTIVE) {
    try {
      const onChainMarketId = parseInt(market.onChainId);
      onChainData = await contractService.getMarketData(onChainMarketId);
    } catch (error) {
      console.error('Failed to fetch on-chain data:', error);
      // Continue with cached data
    }
  }

  return {
    ...market,
    onChainData,
  } as MarketWithStats;
}

/**
 * Get markets by group with optional filtering
 */
export async function getGroupMarkets(
  groupId: string,
  filters?: {
    status?: MarketStatus;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { groupId };

  if (filters?.status) {
    where.status = filters.status;
  }

  const markets = await prisma.predictionMarket.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          walletAddress: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  });

  // Fetch on-chain data for ACTIVE markets
  const marketsWithData = await Promise.all(
    markets.map(async (market) => {
      if (market.onChainId && market.status === MarketStatus.ACTIVE) {
        try {
          const onChainMarketId = parseInt(market.onChainId);
          const onChainData = await contractService.getMarketData(onChainMarketId);
          return { ...market, onChainData };
        } catch (error) {
          console.error(`Failed to fetch on-chain data for market ${market.id}:`, error);
          return market;
        }
      }
      return market;
    })
  );

  return marketsWithData;
}

/**
 * Sync on-chain data to database cache
 */
export async function syncMarketData(marketId: string) {
  const market = await prisma.predictionMarket.findUnique({
    where: { id: marketId },
  });

  if (!market) {
    throw new Error('Market not found');
  }

  if (!market.onChainId) {
    throw new Error('Market is not on-chain yet');
  }

  if (market.status !== MarketStatus.ACTIVE && market.status !== MarketStatus.RESOLVED) {
    throw new Error('Market is not active or resolved');
  }

  try {
    const onChainMarketId = parseInt(market.onChainId);
    const onChainData = await contractService.getMarketData(onChainMarketId);

    // Map on-chain status to database status
    let status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED' = market.status as 'ACTIVE' | 'RESOLVED';
    if (onChainData.status === contractService.STATUS_RESOLVED) {
      status = 'RESOLVED';
    } else if (onChainData.status === contractService.STATUS_CANCELLED) {
      status = 'CANCELLED';
    }

    // Map on-chain outcome to database outcome
    let outcome = market.outcome;
    if (onChainData.outcome === contractService.OUTCOME_YES) {
      outcome = 'YES';
    } else if (onChainData.outcome === contractService.OUTCOME_NO) {
      outcome = 'NO';
    } else if (onChainData.outcome === contractService.OUTCOME_INVALID) {
      outcome = 'INVALID';
    }

    // Update database with on-chain data
    const updatedMarket = await prisma.predictionMarket.update({
      where: { id: marketId },
      data: {
        status,
        outcome,
        totalVolume: onChainData.totalVolume,
        yesPool: onChainData.yesPool,
        noPool: onChainData.noPool,
        yesPercentage: onChainData.yesPercentage,
        noPercentage: onChainData.noPercentage,
        participantCount: onChainData.participantCount,
      },
    });

    console.log('✅ Market data synced:', {
      id: marketId,
      onChainId: market.onChainId,
      status: updatedMarket.status,
      totalVolume: updatedMarket.totalVolume,
    });

    return updatedMarket;
  } catch (error) {
    console.error('Failed to sync market data:', error);
    throw new Error('Failed to sync market data from blockchain');
  }
}

/**
 * Update market status
 */
export async function updateMarketStatus(marketId: string, status: MarketStatus) {
  return await prisma.predictionMarket.update({
    where: { id: marketId },
    data: { status },
  });
}

/**
 * Update market with on-chain ID
 */
export async function updateMarketOnChainId(marketId: string, onChainId: string, txHash: string) {
  return await prisma.predictionMarket.update({
    where: { id: marketId },
    data: {
      onChainId,
      status: MarketStatus.ACTIVE,
    },
  });
}
