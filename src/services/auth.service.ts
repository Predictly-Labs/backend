import { Aptos, AptosConfig, Network, Ed25519PublicKey, Ed25519Signature } from '@aptos-labs/ts-sdk';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

// Initialize Aptos client
const aptosConfig = new AptosConfig({ network: Network.CUSTOM, fullnode: env.MOVEMENT_RPC_URL });
const aptos = new Aptos(aptosConfig);

// Constants
const NONCE_TTL = 5 * 60; // 5 minutes in seconds
const JWT_EXPIRY = '7d';

interface SignInMessage {
  message: string;
  nonce: string;
  expiresAt: Date;
}

interface AuthResult {
  user: {
    id: string;
    walletAddress: string;
    displayName: string | null;
    avatarUrl: string | null;
    totalPredictions: number;
    correctPredictions: number;
    totalEarnings: number;
    currentStreak: number;
    isPro: boolean;
    proExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  token: string;
}

/**
 * Generate a sign-in message with nonce for wallet authentication
 */
export async function generateSignInMessage(walletAddress: string): Promise<SignInMessage> {
  // Generate unique nonce
  const nonce = nanoid(32);
  const timestamp = Date.now();
  const expiresAt = new Date(timestamp + NONCE_TTL * 1000);

  // Create message to sign
  const message = `Sign in to Predictly

Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;

  // Store nonce in database with TTL
  await prisma.authNonce.create({
    data: {
      walletAddress,
      nonce,
      timestamp: timestamp.toString(),
      expiresAt,
    },
  });

  return {
    message,
    nonce,
    expiresAt,
  };
}

/**
 * Verify wallet signature and authenticate user
 */
export async function verifySignature(
  walletAddress: string,
  signature: string,
  message: string,
  publicKey?: string
): Promise<AuthResult> {
  // Extract nonce from message
  const nonceMatch = message.match(/Nonce: ([^\n]+)/);
  if (!nonceMatch) {
    throw new Error('Invalid message format: nonce not found');
  }
  const nonce = nonceMatch[1];

  // Check if nonce exists and is valid in database
  const storedNonce = await prisma.authNonce.findUnique({
    where: {
      walletAddress_nonce: {
        walletAddress,
        nonce,
      },
    },
  });
  
  if (!storedNonce) {
    throw new Error('Invalid or expired nonce');
  }

  // Check if nonce is expired
  if (new Date() > storedNonce.expiresAt) {
    // Delete expired nonce
    await prisma.authNonce.delete({
      where: { id: storedNonce.id },
    });
    throw new Error('Invalid or expired nonce');
  }

  // Verify the signature using Aptos SDK
  try {
    // Debug logging
    console.log('🔍 Verifying signature...');
    console.log('Wallet:', walletAddress);
    console.log('Signature:', signature);
    console.log('Public Key:', publicKey || 'NOT PROVIDED');
    console.log('Message length:', message.length);
    console.log('Message preview:', message.substring(0, 100) + '...');
    
    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // Parse signature (hex string to Uint8Array)
    const signatureBytes = hexToUint8Array(signature);
    
    console.log('Message bytes length:', messageBytes.length);
    console.log('Signature bytes length:', signatureBytes.length);
    
    // Verify signature
    let isValid = false;
    
    if (publicKey) {
      // If public key is provided, use it for verification
      console.log('✅ Using provided public key for verification');
      isValid = await verifyAptosSignature(walletAddress, messageBytes, signatureBytes, publicKey);
      console.log('Signature valid:', isValid);
      
      if (!isValid) {
        throw new Error('Invalid signature');
      }
    } else {
      // No public key provided - try to verify using on-chain data
      console.log('⚠️  No public key provided, attempting on-chain verification...');
      
      try {
        console.log('Fetching account info from blockchain...');
        const accountData = await aptos.getAccountInfo({ accountAddress: walletAddress });
        
        console.log('Account data:', JSON.stringify(accountData, null, 2));
        
        // For Ed25519, we cannot derive public key from auth key alone
        // In development mode, we'll accept the signature if account exists
        if (env.NODE_ENV === 'development') {
          console.log('⚠️  DEVELOPMENT MODE: Skipping signature verification');
          console.log('⚠️  Account exists on-chain, accepting authentication');
          isValid = true;
        } else {
          throw new Error('Public key required for signature verification in production');
        }
        
      } catch (fetchError: any) {
        console.warn('Could not fetch account data:', fetchError.message);
        
        // In development, accept if signature format is valid
        if (env.NODE_ENV === 'development') {
          console.log('⚠️  DEVELOPMENT MODE: Accepting authentication without full verification');
          isValid = signatureBytes.length === 64; // Valid Ed25519 signature length
        } else {
          throw new Error('Account not found on-chain. Please fund your wallet first or provide public key.');
        }
      }
    }
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
  } catch (error: any) {
    console.error('❌ Signature verification error:', error.message);
    throw new Error('Signature verification failed');
  }

  // Delete nonce to prevent replay attacks
  await prisma.authNonce.delete({
    where: { id: storedNonce.id },
  });

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { walletAddress },
  });

  if (!user) {
    // Create new user
    const displayName = `User_${walletAddress.slice(-6)}`;
    user = await prisma.user.create({
      data: {
        walletAddress,
        displayName,
      },
    });
  }

  // Generate JWT token
  const token = generateToken(user);

  return {
    user,
    token,
  };
}

/**
 * Validate JWT token and return user
 */
export async function validateToken(token: string) {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      walletAddress: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate JWT token for user
 */
function generateToken(user: { id: string; walletAddress: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      walletAddress: user.walletAddress,
    },
    env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Helper: Convert hex string to Uint8Array
 */
function hexToUint8Array(hexString: string): Uint8Array {
  // Remove 0x prefix if present
  const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Helper: Verify Aptos signature
 */
async function verifyAptosSignature(
  walletAddress: string,
  message: Uint8Array,
  signature: Uint8Array,
  publicKeyHex: string
): Promise<boolean> {
  try {
    // Create Ed25519PublicKey from hex string
    const publicKeyBytes = hexToUint8Array(publicKeyHex);
    const publicKey = new Ed25519PublicKey(publicKeyBytes);
    
    // Verify that the public key matches the wallet address
    const derivedAddress = publicKey.authKey().derivedAddress().toString();
    if (derivedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      console.error('Public key does not match wallet address');
      return false;
    }
    
    // Verify the signature
    const ed25519Signature = new Ed25519Signature(signature);
    const isValid = publicKey.verifySignature({ message, signature: ed25519Signature });
    return isValid;
  } catch (error) {
    console.error('Aptos signature verification error:', error);
    return false;
  }
}

/**
 * Clean up expired nonces (should be called periodically)
 */
export async function cleanupExpiredNonces(): Promise<number> {
  const result = await prisma.authNonce.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
