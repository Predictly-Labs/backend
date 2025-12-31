import { z } from 'zod';

// Create group schema
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must be at most 50 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .nullable(),
  iconUrl: z
    .string()
    .url('Invalid icon URL')
    .optional()
    .nullable(),
  isPublic: z
    .boolean()
    .default(true),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

// Update group schema
export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must be at most 50 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .nullable(),
  iconUrl: z
    .string()
    .url('Invalid icon URL')
    .optional()
    .nullable(),
  isPublic: z
    .boolean()
    .optional(),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

// Join group schema
export const joinGroupSchema = z.object({
  inviteCode: z
    .string()
    .length(8, 'Invite code must be 8 characters')
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, 'Invalid invite code format'),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

// Update member role schema
export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'JUDGE', 'MODERATOR', 'MEMBER']),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

// List groups query schema
export const listGroupsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().optional(),
});

export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;

// My groups query schema
export const myGroupsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(['ADMIN', 'JUDGE', 'MODERATOR', 'MEMBER']).optional(),
  search: z.string().optional(),
  sort: z.enum(['recent', 'active', 'members']).optional(),
});

export type MyGroupsQuery = z.infer<typeof myGroupsQuerySchema>;

// Group members query schema
export const groupMembersQuerySchema = z.object({
  role: z.enum(['ADMIN', 'JUDGE', 'MODERATOR', 'MEMBER']).optional(),
});

export type GroupMembersQuery = z.infer<typeof groupMembersQuerySchema>;

// Group settings schema
// NOTE: WITH_YIELD is planned for future but not yet implemented in smart contract
// Contract currently only supports: STANDARD (0) and NO_LOSS (1)
export const groupSettingsSchema = z.object({
  defaultMarketType: z.enum(['STANDARD', 'NO_LOSS']).optional(),
  allowedMarketTypes: z.array(z.enum(['STANDARD', 'NO_LOSS'])).optional(),
});

export type GroupSettingsInput = z.infer<typeof groupSettingsSchema>;

// Bulk assign judges schema
export const bulkAssignJudgesSchema = z.object({
  userIds: z.array(z.string().uuid('Invalid user ID')).min(1, 'At least one user ID is required'),
});

export type BulkAssignJudgesInput = z.infer<typeof bulkAssignJudgesSchema>;
