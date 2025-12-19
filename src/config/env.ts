import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Pinata (IPFS)
  PINATA_API_KEY: z.string().min(1, 'PINATA_API_KEY is required'),
  PINATA_SECRET_KEY: z.string().min(1, 'PINATA_SECRET_KEY is required'),
  PINATA_GATEWAY_URL: z.string().default('https://gateway.pinata.cloud/ipfs'),
  
  // Privy Auth
  PRIVY_APP_ID: z.string().min(1, 'PRIVY_APP_ID is required'),
  PRIVY_APP_SECRET: z.string().min(1, 'PRIVY_APP_SECRET is required'),
  
  // Movement Network
  MOVEMENT_RPC_URL: z.string().default('https://testnet.movementnetwork.xyz/v1'),
  MOVEMENT_PRIVATE_KEY: z.string().optional(),
  MOVEMENT_CONTRACT_ADDRESS: z.string().default('0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565'),
  
  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  
  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  
  // In development, allow partial env for easier setup
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  }
}

// Export with defaults for development
export const env = {
  PORT: process.env.PORT || '3001',
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  PINATA_API_KEY: process.env.PINATA_API_KEY || '',
  PINATA_SECRET_KEY: process.env.PINATA_SECRET_KEY || '',
  PINATA_GATEWAY_URL: process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs',
  PRIVY_APP_ID: process.env.PRIVY_APP_ID || '',
  PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET || '',
  MOVEMENT_RPC_URL: process.env.MOVEMENT_RPC_URL || 'https://testnet.movementnetwork.xyz/v1',
  MOVEMENT_PRIVATE_KEY: process.env.MOVEMENT_PRIVATE_KEY || '',
  MOVEMENT_CONTRACT_ADDRESS: process.env.MOVEMENT_CONTRACT_ADDRESS || '0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
