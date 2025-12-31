import { z } from 'zod';

// Create prediction market schema
export const createPredictionSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable(),
  // NOTE: WITH_YIELD planned for future, contract currently supports STANDARD and NO_LOSS only
  marketType: z
    .enum(['STANDARD', 'NO_LOSS'])
    .default('STANDARD'),
  endDate: z
    .string()
    .datetime('Invalid date format')
    .refine(
      (date) => new Date(date) > new Date(),
      'End date must be in the future'
    ),
  minStake: z
    .number()
    .positive('Minimum stake must be positive')
    .default(0.1),
  maxStake: z
    .number()
    .positive('Maximum stake must be positive')
    .optional()
    .nullable(),
});

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;

// Place vote schema
export const placeVoteSchema = z.object({
  prediction: z.enum(['YES', 'NO']),
  amount: z
    .number()
    .positive('Stake amount must be positive'),
});

export type PlaceVoteInput = z.infer<typeof placeVoteSchema>;

// Resolve market schema
export const resolveMarketSchema = z.object({
  outcome: z.enum(['YES', 'NO', 'INVALID']),
  resolutionNote: z
    .string()
    .max(500, 'Resolution note must be at most 500 characters')
    .optional(),
});

export type ResolveMarketInput = z.infer<typeof resolveMarketSchema>;

// List predictions query schema
export const listPredictionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  groupId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'RESOLVED', 'DISPUTED', 'CANCELLED']).optional(),
  marketType: z.enum(['STANDARD', 'NO_LOSS']).optional(), // WITH_YIELD future feature
});

export type ListPredictionsQuery = z.infer<typeof listPredictionsQuerySchema>;

// My votes query schema
export const myVotesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ACTIVE', 'RESOLVED', 'PENDING']).optional(),
  groupId: z.string().uuid().optional(),
  outcome: z.enum(['won', 'lost', 'pending']).optional(),
});

export type MyVotesQuery = z.infer<typeof myVotesQuerySchema>;
