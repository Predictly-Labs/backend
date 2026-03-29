import { prisma } from '../config/database.js';
import { ERR_REFERRAL_NOT_FOUND } from './waitlist.service.js';

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
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
