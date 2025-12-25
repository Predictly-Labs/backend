import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
  InputViewFunctionData,
  InputEntryFunctionData,
} from '@aptos-labs/ts-sdk';
import { env } from '../config/env.js';

// Contract module addresses
const CONTRACT_ADDRESS = env.MOVEMENT_CONTRACT_ADDRESS;
const MARKET_MODULE = `${CONTRACT_ADDRESS}::market`;

// Market types
export const MARKET_TYPE_STANDARD = 0;
export const MARKET_TYPE_NO_LOSS = 1;

// Prediction types
export const PREDICTION_YES = 1;
export const PREDICTION_NO = 2;

// Outcome types
export const OUTCOME_PENDING = 0;
export const OUTCOME_YES = 1;
export const OUTCOME_NO = 2;
export const OUTCOME_INVALID = 3;

// Status types
export const STATUS_ACTIVE = 0;
export const STATUS_RESOLVED = 1;
export const STATUS_CANCELLED = 2;

// Initialize Aptos client for Movement Network
const config = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: env.MOVEMENT_RPC_URL,
});

const aptos = new Aptos(config);

// Get admin account from private key (for server-side operations)
function getAdminAccount(): Account | null {
  if (!env.MOVEMENT_PRIVATE_KEY) {
    console.warn('MOVEMENT_PRIVATE_KEY not set - admin operations disabled');
    return null;
  }
  
  try {
    const privateKey = new Ed25519PrivateKey(env.MOVEMENT_PRIVATE_KEY);
    return Account.fromPrivateKey({ privateKey });
  } catch (error) {
    console.error('Failed to create admin account:', error);
    return null;
  }
}

// ==================== View Functions ====================

/**
 * Get market count
 */
export async function getMarketCount(): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${MARKET_MODULE}::get_market_count`,
      functionArguments: [CONTRACT_ADDRESS],
    };
    
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Error getting market count:', error);
    throw error;
  }
}

/**
 * Get market status
 */
export async function getMarketStatus(marketId: number): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${MARKET_MODULE}::get_market_status`,
      functionArguments: [CONTRACT_ADDRESS, marketId.toString()],
    };
    
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Error getting market status:', error);
    throw error;
  }
}

/**
 * Get market outcome
 */
export async function getMarketOutcome(marketId: number): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${MARKET_MODULE}::get_market_outcome`,
      functionArguments: [CONTRACT_ADDRESS, marketId.toString()],
    };
    
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Error getting market outcome:', error);
    throw error;
  }
}

/**
 * Get market pools (yes_pool, no_pool)
 */
export async function getMarketPools(marketId: number): Promise<{ yesPool: number; noPool: number }> {
  try {
    const payload: InputViewFunctionData = {
      function: `${MARKET_MODULE}::get_market_pools`,
      functionArguments: [CONTRACT_ADDRESS, marketId.toString()],
    };
    
    const result = await aptos.view({ payload });
    return {
      yesPool: Number(result[0]),
      noPool: Number(result[1]),
    };
  } catch (error) {
    console.error('Error getting market pools:', error);
    throw error;
  }
}

/**
 * Get market percentages (yes_pct, no_pct) in basis points
 */
export async function getMarketPercentages(marketId: number): Promise<{ yesPct: number; noPct: number }> {
  try {
    const payload: InputViewFunctionData = {
      function: `${MARKET_MODULE}::get_percentages`,
      functionArguments: [CONTRACT_ADDRESS, marketId.toString()],
    };
    
    const result = await aptos.view({ payload });
    return {
      yesPct: Number(result[0]) / 100, // Convert basis points to percentage
      noPct: Number(result[1]) / 100,
    };
  } catch (error) {
    console.error('Error getting market percentages:', error);
    throw error;
  }
}

/**
 * Get participant count for a market
 */
export async function getParticipantCount(marketId: number): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${MARKET_MODULE}::get_participant_count`,
      functionArguments: [CONTRACT_ADDRESS, marketId.toString()],
    };
    
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Error getting participant count:', error);
    throw error;
  }
}

/**
 * Get vote prediction for a voter
 */
export async function getVotePrediction(marketId: number, voterAddress: string): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${MARKET_MODULE}::get_vote_prediction`,
      functionArguments: [CONTRACT_ADDRESS, marketId.toString(), voterAddress],
    };
    
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Error getting vote prediction:', error);
    throw error;
  }
}

/**
 * Get vote amount for a voter
 */
export async function getVoteAmount(marketId: number, voterAddress: string): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${MARKET_MODULE}::get_vote_amount`,
      functionArguments: [CONTRACT_ADDRESS, marketId.toString(), voterAddress],
    };
    
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Error getting vote amount:', error);
    throw error;
  }
}

/**
 * Calculate potential reward for a voter
 */
export async function calculateReward(marketId: number, voterAddress: string): Promise<number> {
  try {
    const payload: InputViewFunctionData = {
      function: `${MARKET_MODULE}::calculate_reward`,
      functionArguments: [CONTRACT_ADDRESS, marketId.toString(), voterAddress],
    };
    
    const result = await aptos.view({ payload });
    return Number(result[0]);
  } catch (error) {
    console.error('Error calculating reward:', error);
    throw error;
  }
}

// ==================== Transaction Builders ====================
// These return transaction payloads that frontend can sign

/**
 * Build create market transaction payload
 */
export function buildCreateMarketPayload(params: {
  title: string;
  description: string;
  endTime: number;
  minStake: number;
  maxStake: number;
  resolver: string;
  marketType?: number;
}): InputEntryFunctionData {
  return {
    function: `${MARKET_MODULE}::create_market`,
    functionArguments: [
      CONTRACT_ADDRESS,
      params.title,
      params.description,
      params.endTime.toString(),
      params.minStake.toString(),
      params.maxStake.toString(),
      params.resolver,
      (params.marketType ?? MARKET_TYPE_STANDARD).toString(),
    ],
  };
}

/**
 * Build place vote transaction payload
 */
export function buildPlaceVotePayload(params: {
  marketId: number;
  prediction: number;
  amount: number;
}): InputEntryFunctionData {
  return {
    function: `${MARKET_MODULE}::place_vote`,
    functionArguments: [
      CONTRACT_ADDRESS,
      params.marketId.toString(),
      params.prediction.toString(),
      params.amount.toString(),
    ],
  };
}

/**
 * Build resolve market transaction payload
 */
export function buildResolvePayload(params: {
  marketId: number;
  outcome: number;
}): InputEntryFunctionData {
  return {
    function: `${MARKET_MODULE}::resolve`,
    functionArguments: [
      CONTRACT_ADDRESS,
      params.marketId.toString(),
      params.outcome.toString(),
    ],
  };
}

/**
 * Build claim reward transaction payload
 */
export function buildClaimRewardPayload(params: {
  marketId: number;
}): InputEntryFunctionData {
  return {
    function: `${MARKET_MODULE}::claim_reward`,
    functionArguments: [
      CONTRACT_ADDRESS,
      params.marketId.toString(),
    ],
  };
}

// ==================== Admin Functions (Server-side) ====================

/**
 * Create market on-chain (admin only)
 */
export async function createMarketOnChain(params: {
  title: string;
  description: string;
  endTime: number;
  minStake: number;
  maxStake: number;
  resolver: string;
  marketType?: number;
}): Promise<{ txHash: string; marketId: number }> {
  const admin = getAdminAccount();
  if (!admin) {
    throw new Error('Admin account not configured');
  }

  const payload = buildCreateMarketPayload(params);
  
  const transaction = await aptos.transaction.build.simple({
    sender: admin.accountAddress,
    data: payload,
  });

  const pendingTx = await aptos.signAndSubmitTransaction({
    signer: admin,
    transaction,
  });

  const result = await aptos.waitForTransaction({
    transactionHash: pendingTx.hash,
  });

  // Get new market count to determine market ID
  const marketCount = await getMarketCount();
  
  return {
    txHash: pendingTx.hash,
    marketId: marketCount - 1,
  };
}

/**
 * Resolve market on-chain (resolver only)
 */
export async function resolveMarketOnChain(params: {
  marketId: number;
  outcome: number;
}): Promise<{ txHash: string }> {
  const admin = getAdminAccount();
  if (!admin) {
    throw new Error('Admin account not configured');
  }

  const payload = buildResolvePayload(params);
  
  const transaction = await aptos.transaction.build.simple({
    sender: admin.accountAddress,
    data: payload,
  });

  const pendingTx = await aptos.signAndSubmitTransaction({
    signer: admin,
    transaction,
  });

  await aptos.waitForTransaction({
    transactionHash: pendingTx.hash,
  });

  return {
    txHash: pendingTx.hash,
  };
}

// Export aptos client for advanced usage
export { aptos, CONTRACT_ADDRESS };
