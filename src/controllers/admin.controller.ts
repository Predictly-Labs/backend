import { Request, Response } from 'express';
import * as relayWallet from '../services/relay-wallet.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get relay wallet balance
 * GET /api/admin/relay-wallet/balance
 */
export async function getRelayWalletBalance(req: Request, res: Response) {
  try {
    const address = relayWallet.getAddress();
    const balance = await relayWallet.getBalance();

    return successResponse(res, {
      address,
      balance,
      balanceFormatted: `${balance.toFixed(4)} MOVE`,
    });
  } catch (error) {
    console.error('Error getting relay wallet balance:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Failed to get relay wallet balance');
  }
}

/**
 * Get relay wallet transactions
 * GET /api/admin/relay-wallet/transactions
 * 
 * Note: This is a placeholder. In production, you would:
 * 1. Store transaction logs in database
 * 2. Query blockchain for transaction history
 * 3. Use indexer service for historical data
 */
export async function getRelayWalletTransactions(req: Request, res: Response) {
  try {
    const address = relayWallet.getAddress();
    
    // For now, return empty array with instructions
    // In production, implement proper transaction logging
    return successResponse(res, {
      address,
      transactions: [],
      message: 'Transaction logging not yet implemented. Check blockchain explorer for history.',
      explorerUrl: `https://explorer.movementnetwork.xyz/account/${address}?network=bardock+testnet`,
    });
  } catch (error) {
    console.error('Error getting relay wallet transactions:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Failed to get relay wallet transactions');
  }
}

/**
 * Monitor relay wallet balance (trigger manual check)
 * POST /api/admin/relay-wallet/monitor
 */
export async function monitorRelayWallet(req: Request, res: Response) {
  try {
    await relayWallet.monitorBalance();
    
    const address = relayWallet.getAddress();
    const balance = await relayWallet.getBalance();

    return successResponse(res, {
      address,
      balance,
      status: balance >= 10 ? 'healthy' : 'low',
      message: balance >= 10 
        ? 'Relay wallet balance is healthy' 
        : '⚠️ Relay wallet balance is low. Please top up.',
    });
  } catch (error) {
    console.error('Error monitoring relay wallet:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Failed to monitor relay wallet');
  }
}
