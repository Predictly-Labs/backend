import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { env } from '../config/env.js';

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: Network.CUSTOM, 
  fullnode: env.MOVEMENT_RPC_URL 
});
const aptos = new Aptos(aptosConfig);

// Constants
const OCTAS_PER_MOVE = 100_000_000;

/**
 * Get MOVE token balance for any wallet address
 * @param walletAddress - The wallet address to check balance for
 * @returns Balance in MOVE tokens (not octas)
 */
export async function getWalletBalance(walletAddress: string): Promise<number> {
  try {
    // Get account resource for 0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>
    const resource = await aptos.getAccountResource({
      accountAddress: walletAddress,
      resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
    });
    
    // Movement RPC returns data directly, not wrapped in a 'data' field
    // Try both formats for compatibility
    let data: any;
    if (resource.data) {
      // Standard Aptos format: { data: { coin: { value: "..." } } }
      data = resource.data;
    } else if ((resource as any).coin) {
      // Movement format: { coin: { value: "..." } }
      data = resource;
    } else {
      console.warn('⚠️  Invalid resource response format from RPC');
      console.warn('⚠️  Resource:', JSON.stringify(resource, null, 2));
      return 0;
    }
    
    if (!data.coin || typeof data.coin.value === 'undefined') {
      console.warn('⚠️  No coin data found in resource');
      return 0;
    }
    
    // Convert octas to MOVE
    const balanceOctas = BigInt(data.coin.value);
    const balanceMove = Number(balanceOctas) / OCTAS_PER_MOVE;
    
    return balanceMove;
  } catch (error: any) {
    // Handle account not found (new account with 0 balance)
    if (error.status === 404 || error.message?.includes('not found')) {
      return 0;
    }
    
    // Handle RPC errors
    if (error.status === 503) {
      throw new Error('Movement RPC is temporarily unavailable. Please try again later.');
    }
    
    console.error('❌ Error fetching wallet balance:', error);
    throw new Error(`Failed to fetch wallet balance: ${error.message}`);
  }
}

/**
 * Get balance in both MOVE and octas format
 * @param walletAddress - The wallet address to check balance for
 * @returns Object with balance in MOVE and octas
 */
export async function getWalletBalanceDetailed(walletAddress: string): Promise<{
  move: number;
  octas: string;
  formatted: string;
}> {
  try {
    const resource = await aptos.getAccountResource({
      accountAddress: walletAddress,
      resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
    });
    
    let data: any;
    if (resource.data) {
      data = resource.data;
    } else if ((resource as any).coin) {
      data = resource;
    } else {
      return {
        move: 0,
        octas: '0',
        formatted: '0.0000 MOVE'
      };
    }
    
    if (!data.coin || typeof data.coin.value === 'undefined') {
      return {
        move: 0,
        octas: '0',
        formatted: '0.0000 MOVE'
      };
    }
    
    const balanceOctas = data.coin.value;
    const balanceMove = Number(BigInt(balanceOctas)) / OCTAS_PER_MOVE;
    
    return {
      move: balanceMove,
      octas: balanceOctas,
      formatted: `${balanceMove.toFixed(4)} MOVE`
    };
  } catch (error: any) {
    if (error.status === 404 || error.message?.includes('not found')) {
      return {
        move: 0,
        octas: '0',
        formatted: '0.0000 MOVE'
      };
    }
    
    if (error.status === 503) {
      throw new Error('Movement RPC is temporarily unavailable. Please try again later.');
    }
    
    console.error('❌ Error fetching wallet balance:', error);
    throw new Error(`Failed to fetch wallet balance: ${error.message}`);
  }
}
