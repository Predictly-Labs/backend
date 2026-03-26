import { z } from 'zod';

// Auth with Privy schema
export const authSchema = z.object({
  privyId: z.string().min(1, 'Privy ID is required'),
  walletAddress: z.string().optional().nullable(),
  displayName: z.string().max(50).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export type AuthInput = z.infer<typeof authSchema>;

// Update user profile schema
export const updateUserSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL')
    .optional()
    .nullable(),
  walletAddress: z
    .string()
    .optional()
    .nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
