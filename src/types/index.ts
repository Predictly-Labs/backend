// Re-export common types from Prisma for convenience
export type {
  User,
  Group,
  GroupMember,
  GroupRole,
  PredictionMarket,
  MarketType,
  MarketStatus,
  MarketOutcome,
  Vote,
  VotePrediction,
  Badge,
  UserBadge,
} from '@prisma/client';

// Custom types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GroupWithStats {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  stats: {
    memberCount: number;
    activeMarkets: number;
    totalVolume: number;
  };
}

export interface UserWithStats {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  totalPredictions: number;
  correctPredictions: number;
  totalEarnings: number;
  currentStreak: number;
  winRate: number;
}

export interface LeaderboardEntry extends UserWithStats {
  rank: number;
}
