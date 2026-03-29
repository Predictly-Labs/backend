import { prisma } from '../config/database.js';
import type { RegisterInput } from '../validators/waitlist.validator.js';

export const ERR_USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS';
export const ERR_REFERRAL_NOT_FOUND = 'REFERRAL_NOT_FOUND';

const REFERRAL_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const REFERRAL_CODE_LENGTH = 6;
const MAX_CODE_RETRIES = 10;

function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_CODE_CHARSET.charAt(
      Math.floor(Math.random() * REFERRAL_CODE_CHARSET.length)
    );
  }
  return code;
}

async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const candidate = generateReferralCode();
    const existing = await prisma.waitlist.findUnique({
      where: { referralCode: candidate },
    });
    if (!existing) {
      return candidate;
    }
  }
  throw new Error('Failed to generate a unique referral code after maximum retries');
}

async function registerOnce(input: RegisterInput): Promise<{
  id: string;
  email: string;
  walletAddress: string;
  referralCode: string;
  referredBy: string | null;
  createdAt: Date;
}> {
  const email = input.email.toLowerCase();
  const walletAddress = input.walletAddress.toLowerCase();
  const referralCode = input.referralCode?.toUpperCase();

  // Explicit duplicate check
  const duplicate = await prisma.waitlist.findFirst({
    where: {
      OR: [{ email }, { walletAddress }],
    },
  });

  if (duplicate) {
    throw new Error(ERR_USER_ALREADY_EXISTS);
  }

  // Referral code lookup
  let referrerId: string | null = null;
  if (referralCode) {
    const referrer = await prisma.waitlist.findUnique({
      where: { referralCode },
    });
    if (!referrer) {
      throw new Error(ERR_REFERRAL_NOT_FOUND);
    }
    referrerId = referrer.id;
  }

  // Generate a unique referral code for the new user
  const newReferralCode = await generateUniqueReferralCode();

  const entry = await prisma.waitlist.create({
    data: {
      email,
      walletAddress,
      referralCode: newReferralCode,
      referredBy: referrerId,
    },
    select: {
      id: true,
      email: true,
      walletAddress: true,
      referralCode: true,
      referredBy: true,
      createdAt: true,
    },
  });

  return entry;
}

export async function register(input: RegisterInput): Promise<{
  id: string;
  email: string;
  walletAddress: string;
  referralCode: string;
  referredBy: string | null;
  createdAt: Date;
}> {
  try {
    return await registerOnce(input);
  } catch (error: any) {
    // P2002: Unique constraint violation (race condition) — retry once
    if (error?.code === 'P2002') {
      try {
        return await registerOnce(input);
      } catch (retryError: any) {
        if (retryError?.code === 'P2002') {
          throw new Error(ERR_USER_ALREADY_EXISTS);
        }
        throw retryError;
      }
    }
    throw error;
  }
}
