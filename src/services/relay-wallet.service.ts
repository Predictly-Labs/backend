import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { env } from '../config/env.js';
import { retry } from '../utils/retry.js';
import { 
  InsufficientBalanceError, 
  TransactionFailedError,
  WalletNotConfiguredError 
} from '../utils/errors.js';

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: Network.CUSTOM, 
  fullnode: env.MOVEMENT_RPC_URL 
});
const aptos = new Aptos(aptosConfig);

// Constants
const OCTAS_PER_MOVE = 100_000_000;
const MIN_BALANCE_THRESHOLD = 10 * OCTAS_PER_MOVE; // 10 MOVE
const CONTRACT_ADDRESS = env.MOVEMENT_CONTRACT_ADDRESS;

// Relay wallet instance (lazy loaded)
let relayWallet: Account | null = null;

/**
 * Initialize relay wallet from private key
 */
function getRelayWallet(): Account {
  if (relayWallet) {
    return relayWallet;
  }

  const privateKeyHex = env.RELAY_WALLET_PRIVATE_KEY || env.MOVEMENT_PRIVATE_KEY;
  
  if (!privateKeyHex) {
    throw new WalletNotConfiguredError('RELAY_WALLET_PRIVATE_KEY or MOVEMENT_PRIVATE_KEY not configured');
  }

  try {
    // Remove 0x prefix if present
    const cleanKey = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    
    // Create private key from hex
    const privateKey = new Ed25519PrivateKey(cleanKey);
    
    // Create account from private key
    relayWallet = Account.fromPrivateKey({ privateKey });
    
    console.log('✅ Relay wallet initialized:', relayWallet.accountAddress.toString());
    
    return relayWallet;
  } catch (error) {
    console.error('❌ Failed to initialize relay wallet:', error);
    throw new Error('Invalid relay wallet private key');
  }
}

/**
 * Get relay wallet address
 */
export function getAddress(): string {
  const wallet = getRelayWallet();
  return wallet.accountAddress.toString();
}

/**
 * Get relay wallet balance in MOVE
 */
export async function getBalance(): Promise<number> {
  try {
    const wallet = getRelayWallet();
    const address = wallet.accountAddress.toString();
    
    // Get account resource for 0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>
    const resource = await aptos.getAccountResource({
      accountAddress: address,
      resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
    });
    
    // Debug: Log the resource structure (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Resource response:', JSON.stringify(resource, null, 2));
    }
    
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
      console.warn('⚠️  Invalid coin data structure in resource response');
      console.warn('⚠️  Data:', JSON.stringify(data, null, 2));
      return 0;
    }
    
    const balance = Number(data.coin.value);
    const balanceInMove = balance / OCTAS_PER_MOVE;
    
    return balanceInMove;
  } catch (error: any) {
    // Check if it's a network timeout or RPC error
    if (error.status === 522 || error.message?.includes('timeout') || error.message?.includes('Connection timed out')) {
      console.warn('⚠️  RPC endpoint timeout - will retry on next monitoring cycle');
      return 0; // Return 0 to avoid crashing, will retry later
    }
    
    // Check if account doesn't exist yet (not funded)
    if (error.status === 404 || error.message?.includes('not found')) {
      console.warn('⚠️  Relay wallet account not found on-chain - needs to be funded');
      return 0;
    }
    
    console.error('Error fetching relay wallet balance:', error);
    return 0; // Return 0 instead of throwing to prevent monitoring crash
  }
}

/**
 * Check if relay wallet has sufficient balance
 */
export async function hasSufficientBalance(estimatedGasInMove: number = 0.1): Promise<boolean> {
  try {
    const balance = await getBalance();
    const requiredBalance = estimatedGasInMove + (MIN_BALANCE_THRESHOLD / OCTAS_PER_MOVE);
    
    if (balance < requiredBalance) {
      console.warn(`⚠️  Relay wallet balance low: ${balance} MOVE (required: ${requiredBalance} MOVE)`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking relay wallet balance:', error);
    return false;
  }
}

/**
 * Parameters for creating a market on-chain
 */
export interface OnChainMarketParams {
  title: string;
  description: string;
  endTime: number;           // Unix timestamp
  minStake: number;          // In MOVE
  maxStake: number;          // In MOVE (0 = unlimited)
  resolver: string;          // Address
  marketType: 0 | 1;         // 0 = STANDARD, 1 = NO_LOSS
}

/**
 * Create market on-chain using relay wallet
 */
export async function createMarketOnChain(
  params: OnChainMarketParams
): Promise<{ onChainId: string; txHash: string }> {
  const wallet = getRelayWallet();
  
  // Check balance before attempting transaction
  const hasBalance = await hasSufficientBalance(0.1);
  if (!hasBalance) {
    throw new InsufficientBalanceError('Insufficient relay wallet balance');
  }

  // Convert MOVE to octas
  const minStakeOctas = Math.floor(params.minStake * OCTAS_PER_MOVE);
  const maxStakeOctas = params.maxStake > 0 ? Math.floor(params.maxStake * OCTAS_PER_MOVE) : 0;

  // Retry transaction with exponential backoff
  return await retry(
    async () => {
      console.log('🔄 Creating market on-chain:', {
        title: params.title,
        endTime: new Date(params.endTime * 1000).toISOString(),
        minStake: params.minStake,
        maxStake: params.maxStake,
        marketType: params.marketType,
      });

      // Build transaction
      const transaction = await aptos.transaction.build.simple({
        sender: wallet.accountAddress,
        data: {
          function: `${CONTRACT_ADDRESS}::market::create_market`,
          typeArguments: [],
          functionArguments: [
            CONTRACT_ADDRESS,           // admin_addr
            params.title,               // title
            params.description,         // description
            params.endTime,             // end_time (u64)
            minStakeOctas,              // min_stake (u64 in octas)
            maxStakeOctas,              // max_stake (u64 in octas)
            params.resolver,            // resolver
            params.marketType,          // market_type (u8)
          ],
        },
      });

      // Sign and submit transaction
      const committedTxn = await aptos.signAndSubmitTransaction({
        signer: wallet,
        transaction,
      });

      // Wait for transaction confirmation
      const executedTransaction = await aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      console.log('✅ Market created on-chain:', executedTransaction.hash);

      // Extract market ID from events
      const events = (executedTransaction as any).events || [];
      
      // Debug: Log all events
      console.log('📋 Transaction events count:', events.length);
      if (events.length > 0) {
        console.log('📋 Event types:', events.map((e: any) => e.type));
      }
      
      // Look for MarketCreated event (based on contract)
      const marketCreatedEvent = events.find((e: any) => 
        e.type.includes('::market::MarketCreated')
      );

      if (!marketCreatedEvent) {
        console.warn('⚠️  MarketCreated event not found in transaction');
        console.warn('⚠️  Available events:', JSON.stringify(events, null, 2));
        
        // Fallback: Use transaction hash as onChainId
        console.log('⚠️  Using transaction hash as onChainId (fallback)');
        return {
          onChainId: executedTransaction.hash,
          txHash: executedTransaction.hash,
        };
      }

      // Extract market_id from event data
      const marketId = marketCreatedEvent.data?.market_id;
      
      if (!marketId && marketId !== 0) {
        console.warn('⚠️  market_id not found in event data');
        console.warn('⚠️  Event data:', JSON.stringify(marketCreatedEvent, null, 2));
        // Fallback: return tx hash as onChainId
        return {
          onChainId: executedTransaction.hash,
          txHash: executedTransaction.hash,
        };
      }

      console.log('✅ Market ID from event:', marketId);
      
      return {
        onChainId: marketId.toString(),
        txHash: executedTransaction.hash,
      };
    },
    {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      onRetry: (attempt, error) => {
        console.warn(`⚠️  Retry attempt ${attempt} for market creation:`, error.message);
      },
    }
  ).catch((error) => {
    console.error('❌ Failed to create market on-chain after retries:', error);
    
    // Check if it's a gas-related error
    if (error instanceof Error && error.message.includes('insufficient')) {
      throw new InsufficientBalanceError('Insufficient relay wallet balance for transaction');
    }
    
    throw new TransactionFailedError(`Failed to create market on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  });
}

/**
 * Monitor relay wallet balance and log warnings
 */
export async function monitorBalance(): Promise<void> {
  try {
    const balance = await getBalance();
    const threshold = MIN_BALANCE_THRESHOLD / OCTAS_PER_MOVE;
    
    if (balance < threshold) {
      console.warn(`⚠️  ALERT: Relay wallet balance is low: ${balance.toFixed(4)} MOVE (threshold: ${threshold} MOVE)`);
      console.warn(`⚠️  Please top up relay wallet: ${getAddress()}`);
    } else {
      console.log(`✅ Relay wallet balance: ${balance.toFixed(4)} MOVE`);
    }
  } catch (error) {
    console.error('❌ Failed to monitor relay wallet balance:', error);
  }
}

/**
 * Helper: Convert MOVE to octas
 */
export function moveToOctas(move: number): number {
  return Math.floor(move * OCTAS_PER_MOVE);
}

/**
 * Helper: Convert octas to MOVE
 */
export function octasToMove(octas: number): number {
  return octas / OCTAS_PER_MOVE;
}
