import { prisma } from '../config/database.js';
import { ERR_REFERRAL_NOT_FOUND } from './waitlist.service.js';

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  referralCode: string;
  totalReferrals: number;
}

export interface LeaderboardResult {
  leaderboard: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getStats(code: string): Promise<ReferralStats> {
  const entry = await prisma.waitlist.findUnique({
    where: { referralCode: code },
  });

  if (!entry) {
    throw new Error(ERR_REFERRAL_NOT_FOUND);
  }

  const totalReferrals = await prisma.waitlist.count({
    where: { referredBy: entry.id },
  });

  return {
    referralCode: entry.referralCode,
    totalReferrals,
  };
}

export async function getLeaderboard(
  page: number = 1,
  limit: number = 10
): Promise<LeaderboardResult> {
  // Get all waitlist entries that have at least 1 referral
  const referrers = await prisma.waitlist.findMany({
    where: {
      referrals: { some: {} },
    },
    select: {
      walletAddress: true,
      referralCode: true,
      _count: {
        select: { referrals: true },
      },
    },
    orderBy: {
      referrals: { _count: 'desc' },
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.waitlist.count({
    where: {
      referrals: { some: {} },
    },
  });

  const leaderboard: LeaderboardEntry[] = referrers.map((entry, index) => ({
    rank: (page - 1) * limit + index + 1,
    walletAddress: maskWalletAddress(entry.walletAddress),
    referralCode: entry.referralCode,
    totalReferrals: entry._count.referrals,
  }));

  return {
    leaderboard,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

function maskWalletAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
