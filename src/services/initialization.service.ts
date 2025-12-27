import { prisma } from '../config/database.js';
import * as relayWallet from './relay-wallet.service.js';
import * as marketService from './market.service.js';
import { MarketStatus, MarketType } from '@prisma/client';

/**
 * Result of initialization attempt
 */
export interface InitializationResult {
  onChainId: string;
  txHash: string;
  status: 'ACTIVE';
  alreadyInitialized: boolean;
}

/**
 * Check if market is currently being initialized
 */
export async function isInitializing(marketId: string): Promise<boolean> {
  const lock = await prisma.initializationLock.findUnique({
    where: { marketId },
  });

  if (!lock) {
    return false;
  }

  // Check if lock has expired (5 minutes)
  const now = new Date();
  if (lock.expiresAt < now) {
    // Lock expired, clean it up
    await prisma.initializationLock.delete({
      where: { marketId },
    }).catch(() => {});
    return false;
  }

  return true;
}

/**
 * Initialize market on-chain with locking to prevent race conditions
 */
export async function initializeMarket(marketId: string): Promise<InitializationResult> {
  // Use transaction with advisory lock
  return await prisma.$transaction(async (tx) => {
    // Acquire advisory lock using market ID hash
    // This prevents concurrent initialization attempts
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${marketId}))`;

    // Check if market exists and get current state
    const market = await tx.predictionMarket.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      throw new Error('Market not found');
    }

    // If already initialized, return existing data
    if (market.onChainId && market.status === MarketStatus.ACTIVE) {
      console.log('✅ Market already initialized:', {
        id: marketId,
        onChainId: market.onChainId,
      });

      return {
        onChainId: market.onChainId,
        txHash: '', // No new transaction
        status: 'ACTIVE',
        alreadyInitialized: true,
      };
    }

    // Check if market is in valid state for initialization
    if (market.status !== MarketStatus.PENDING) {
      throw new Error(`Market cannot be initialized in ${market.status} status`);
    }

    // Check relay wallet balance
    const hasBalance = await relayWallet.hasSufficientBalance(0.1);
    if (!hasBalance) {
      throw new Error('Insufficient relay wallet balance for initialization');
    }

    // Create initialization lock
    const lockExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await tx.initializationLock.create({
      data: {
        marketId,
        lockedBy: process.pid?.toString() || 'unknown',
        expiresAt: lockExpiresAt,
      },
    }).catch(() => {
      // Lock already exists, another process is initializing
      throw new Error('Market initialization already in progress');
    });

    try {
      console.log('🔄 Initializing market on-chain:', {
        id: marketId,
        title: market.title,
      });

      // Convert end date to Unix timestamp
      const endTime = Math.floor(market.endDate.getTime() / 1000);

      // Map market type
      const marketTypeMap: Record<MarketType, 0 | 1> = {
        STANDARD: 0,
        NO_LOSS: 1,
        WITH_YIELD: 0, // Treat WITH_YIELD as STANDARD for now
      };

      // Create market on-chain using relay wallet
      const result = await relayWallet.createMarketOnChain({
        title: market.title,
        description: market.description || '',
        endTime,
        minStake: market.minStake,
        maxStake: market.maxStake || 0,
        resolver: relayWallet.getAddress(), // Use relay wallet as resolver
        marketType: marketTypeMap[market.marketType],
      });

      // Update market with on-chain ID
      await tx.predictionMarket.update({
        where: { id: marketId },
        data: {
          onChainId: result.onChainId,
          status: MarketStatus.ACTIVE,
        },
      });

      // Delete initialization lock
      await tx.initializationLock.delete({
        where: { marketId },
      }).catch(() => {});

      console.log('✅ Market initialized on-chain:', {
        id: marketId,
        onChainId: result.onChainId,
        txHash: result.txHash,
      });

      return {
        onChainId: result.onChainId,
        txHash: result.txHash,
        status: 'ACTIVE',
        alreadyInitialized: false,
      };
    } catch (error) {
      // Clean up lock on error
      await tx.initializationLock.delete({
        where: { marketId },
      }).catch(() => {});

      console.error('❌ Failed to initialize market:', error);
      throw error;
    }
  }, {
    timeout: 60000, // 60 second timeout
    maxWait: 10000, // Wait max 10 seconds for transaction to start
  });
}

/**
 * Clean up expired initialization locks
 * Should be called periodically (e.g., every 5 minutes)
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const now = new Date();
  
  const result = await prisma.initializationLock.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  if (result.count > 0) {
    console.log(`🧹 Cleaned up ${result.count} expired initialization locks`);
  }

  return result.count;
}
