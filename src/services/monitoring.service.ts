import * as relayWallet from './relay-wallet.service.js';
import * as initializationService from './initialization.service.js';
import * as marketService from './market.service.js';
import * as authService from './auth.service.js';
import { prisma } from '../config/database.js';

/**
 * Monitor relay wallet balance and log warnings
 */
export async function monitorRelayWallet(): Promise<void> {
  try {
    await relayWallet.monitorBalance();
  } catch (error: any) {
    // Don't crash on monitoring errors, just log
    if (error.message?.includes('timeout') || error.message?.includes('Connection timed out')) {
      console.warn('⚠️  Relay wallet monitoring skipped due to RPC timeout');
    } else {
      console.error('❌ Failed to monitor relay wallet:', error.message || error);
    }
  }
}

/**
 * Cleanup expired initialization locks
 */
export async function cleanupExpiredLocks(): Promise<void> {
  try {
    const count = await initializationService.cleanupExpiredLocks();
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired initialization locks`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup expired locks:', error);
  }
}

/**
 * Sync on-chain data for active markets
 */
export async function syncActiveMarkets(): Promise<void> {
  try {
    // Get all ACTIVE markets with onChainId
    const activeMarkets = await prisma.predictionMarket.findMany({
      where: {
        status: 'ACTIVE',
        onChainId: { not: null },
      },
      select: {
        id: true,
        onChainId: true,
      },
    });

    if (activeMarkets.length === 0) {
      return;
    }

    console.log(`🔄 Syncing ${activeMarkets.length} active markets...`);

    // Sync each market
    let successCount = 0;
    let failCount = 0;

    for (const market of activeMarkets) {
      try {
        await marketService.syncMarketData(market.id);
        successCount++;
      } catch (error: any) {
        failCount++;
        // Check if error is due to market not found on-chain (after contract redeploy)
        if (error.message?.includes('Failed to execute function') || 
            error.message?.includes('RESOURCE_NOT_FOUND') ||
            error.message?.includes('E_MARKET_NOT_FOUND')) {
          console.warn(`⚠️  Market ${market.id} (onChainId: ${market.onChainId}) not found on-chain - may need to be redeployed`);
        } else {
          console.error(`❌ Failed to sync market ${market.id}:`, error.message || error);
        }
      }
    }

    console.log(`✅ Market sync completed: ${successCount} success, ${failCount} failed`);
  } catch (error) {
    console.error('❌ Failed to sync active markets:', error);
  }
}

/**
 * Cleanup expired nonces from database
 */
export async function cleanupExpiredNonces(): Promise<void> {
  try {
    const count = await authService.cleanupExpiredNonces();
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired nonces`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup expired nonces:', error);
  }
}

/**
 * Clean up expired rate limits
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    const result = await prisma.rateLimit.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    
    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} expired rate limit records`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup expired rate limits:', error);
  }
}

/**
 * Run all monitoring tasks
 */
export async function runMonitoring(): Promise<void> {
  console.log('🔍 Running monitoring tasks...');
  
  await Promise.all([
    monitorRelayWallet(),
    cleanupExpiredLocks(),
    cleanupExpiredNonces(),
    cleanupExpiredRateLimits(),
  ]);
  
  console.log('✅ Monitoring tasks completed');
}

/**
 * Run market sync task (separate from monitoring due to different frequency)
 */
export async function runMarketSync(): Promise<void> {
  console.log('🔄 Running market sync task...');
  await syncActiveMarkets();
  console.log('✅ Market sync task completed');
}

/**
 * Start periodic monitoring
 * @param intervalMs Interval in milliseconds (default: 1 minute)
 */
export function startPeriodicMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  console.log(`🚀 Starting periodic monitoring (interval: ${intervalMs}ms)`);
  
  // Run immediately
  runMonitoring();
  
  // Then run periodically
  return setInterval(() => {
    runMonitoring();
  }, intervalMs);
}

/**
 * Stop periodic monitoring
 */
export function stopPeriodicMonitoring(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log('🛑 Stopped periodic monitoring');
}
