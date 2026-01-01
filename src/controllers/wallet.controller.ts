import { Request, Response } from 'express';
import { getWalletBalance, getWalletBalanceDetailed } from '../services/wallet-balance.service.js';

/**
 * Get wallet balance by address
 * GET /api/wallet/balance/:address
 */
export async function getBalance(req: Request, res: Response) {
  try {
    const { address } = req.params;
    
    // Validate address format (basic check)
    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format. Address must start with 0x'
      });
    }
    
    // Get balance
    const balance = await getWalletBalance(address);
    
    return res.json({
      success: true,
      data: {
        address,
        balance,
        unit: 'MOVE'
      }
    });
  } catch (error: any) {
    console.error('❌ Error in getBalance controller:', error);
    
    // Handle RPC unavailable
    if (error.message?.includes('temporarily unavailable')) {
      return res.status(503).json({
        success: false,
        message: 'Movement RPC is temporarily unavailable. Please try again later.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch wallet balance'
    });
  }
}

/**
 * Get detailed wallet balance by address
 * GET /api/wallet/balance/:address/detailed
 */
export async function getBalanceDetailed(req: Request, res: Response) {
  try {
    const { address } = req.params;
    
    // Validate address format (basic check)
    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format. Address must start with 0x'
      });
    }
    
    // Get detailed balance
    const balanceData = await getWalletBalanceDetailed(address);
    
    return res.json({
      success: true,
      data: {
        address,
        balance: {
          move: balanceData.move,
          octas: balanceData.octas,
          formatted: balanceData.formatted
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error in getBalanceDetailed controller:', error);
    
    // Handle RPC unavailable
    if (error.message?.includes('temporarily unavailable')) {
      return res.status(503).json({
        success: false,
        message: 'Movement RPC is temporarily unavailable. Please try again later.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch wallet balance'
    });
  }
}

/**
 * Get current user's wallet balance
 * GET /api/wallet/balance/me
 */
export async function getMyBalance(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    if (!user || !user.walletAddress) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or wallet address not found'
      });
    }
    
    // Get balance
    const balance = await getWalletBalance(user.walletAddress);
    
    return res.json({
      success: true,
      data: {
        userId: user.id,
        address: user.walletAddress,
        balance,
        unit: 'MOVE'
      }
    });
  } catch (error: any) {
    console.error('❌ Error in getMyBalance controller:', error);
    
    // Handle RPC unavailable
    if (error.message?.includes('temporarily unavailable')) {
      return res.status(503).json({
        success: false,
        message: 'Movement RPC is temporarily unavailable. Please try again later.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch wallet balance'
    });
  }
}
