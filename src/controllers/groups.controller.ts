import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { generateUniqueInviteCode, isValidInviteCodeFormat } from '../services/invite.service.js';
import { 
  successResponse, 
  createdResponse, 
  notFoundResponse, 
  errorResponse,
  forbiddenResponse 
} from '../utils/response.js';
import { AppError } from '../middleware/error.middleware.js';
import type { 
  CreateGroupInput, 
  UpdateGroupInput, 
  JoinGroupInput,
  UpdateMemberRoleInput,
  ListGroupsQuery,
  MyGroupsQuery,
  GroupMembersQuery,
  GroupSettingsInput,
  BulkAssignJudgesInput 
} from '../validators/groups.validator.js';

/**
 * Create a new group
 * POST /api/groups
 */
export async function createGroup(req: Request, res: Response) {
  const userId = req.user!.id;
  const { name, description, iconUrl, isPublic } = req.body as CreateGroupInput;

  // Generate unique invite code
  const inviteCode = await generateUniqueInviteCode();

  // Create group with creator as admin
  const group = await prisma.group.create({
    data: {
      name,
      description,
      iconUrl,
      isPublic,
      inviteCode,
      createdById: userId,
      members: {
        create: {
          userId,
          role: 'ADMIN',
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          markets: true,
        },
      },
    },
  });

  return createdResponse(res, group, 'Group created successfully');
}

/**
 * Get all public groups
 * GET /api/groups
 */
export async function getGroups(req: Request, res: Response) {
  const { page, limit, search } = req.query as unknown as ListGroupsQuery;
  const skip = (page - 1) * limit;

  const where = {
    isPublic: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            members: true,
            markets: true,
          },
        },
        markets: {
          where: { status: 'ACTIVE' },
          select: { totalVolume: true },
        },
      },
    }),
    prisma.group.count({ where }),
  ]);

  // Transform to include stats
  const groupsWithStats = groups.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description,
    iconUrl: group.iconUrl,
    isPublic: group.isPublic,
    createdAt: group.createdAt,
    stats: {
      memberCount: group._count.members,
      activeMarkets: group._count.markets,
      totalVolume: group.markets.reduce((sum, m) => sum + m.totalVolume, 0),
    },
  }));

  return successResponse(res, groupsWithStats, undefined, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * Get group by ID
 * GET /api/groups/:id
 */
export async function getGroupById(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              walletAddress: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { joinedAt: 'asc' },
        ],
      },
      markets: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          yesPercentage: true,
          noPercentage: true,
          totalVolume: true,
          participantCount: true,
          endDate: true,
        },
      },
      _count: {
        select: {
          members: true,
          markets: true,
        },
      },
    },
  });

  if (!group) {
    return notFoundResponse(res, 'Group not found');
  }

  // Check if user is a member (for private groups)
  const isMember = userId 
    ? group.members.some(m => m.userId === userId) 
    : false;

  if (!group.isPublic && !isMember) {
    return forbiddenResponse(res, 'This is a private group');
  }

  // Get user's role if member
  const userMembership = userId 
    ? group.members.find(m => m.userId === userId)
    : null;

  const result = {
    ...group,
    userRole: userMembership?.role || null,
    isMember,
    stats: {
      memberCount: group._count.members,
      totalMarkets: group._count.markets,
    },
  };

  return successResponse(res, result);
}

/**
 * Join group with invite code
 * POST /api/groups/join
 */
export async function joinGroup(req: Request, res: Response) {
  const userId = req.user!.id;
  const { inviteCode } = req.body as JoinGroupInput;

  if (!isValidInviteCodeFormat(inviteCode)) {
    return errorResponse(res, 'Invalid invite code format', 400);
  }

  // Find group by invite code
  const group = await prisma.group.findUnique({
    where: { inviteCode },
    select: {
      id: true,
      name: true,
      members: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!group) {
    return notFoundResponse(res, 'Invalid invite code');
  }

  // Check if already a member
  if (group.members.length > 0) {
    return errorResponse(res, 'You are already a member of this group', 400);
  }

  // Add user as member
  const membership = await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId,
      role: 'MEMBER',
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          iconUrl: true,
        },
      },
    },
  });

  return createdResponse(res, membership, `Successfully joined ${group.name}`);
}

/**
 * Update group
 * PUT /api/groups/:id
 */
export async function updateGroup(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;
  const updateData = req.body as UpdateGroupInput;

  // Check if user is admin
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId: id,
      userId,
      role: 'ADMIN',
    },
  });

  if (!membership) {
    return forbiddenResponse(res, 'Only admins can update the group');
  }

  const group = await prisma.group.update({
    where: { id },
    data: updateData,
  });

  return successResponse(res, group, 'Group updated successfully');
}

/**
 * Delete group
 * DELETE /api/groups/:id
 */
export async function deleteGroup(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check if user is the creator/admin
  const group = await prisma.group.findUnique({
    where: { id },
    select: {
      createdById: true,
      members: {
        where: { userId, role: 'ADMIN' },
        select: { id: true },
      },
    },
  });

  if (!group) {
    return notFoundResponse(res, 'Group not found');
  }

  if (group.createdById !== userId && group.members.length === 0) {
    return forbiddenResponse(res, 'Only the creator or admin can delete the group');
  }

  await prisma.group.delete({ where: { id } });

  return successResponse(res, null, 'Group deleted successfully');
}

/**
 * Get group members
 * GET /api/groups/:id/members
 */
export async function getGroupMembers(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.query as unknown as GroupMembersQuery;

  const members = await prisma.groupMember.findMany({
    where: { 
      groupId: id,
      ...(role && { role }),
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          walletAddress: true,
          totalPredictions: true,
          correctPredictions: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' },
      { joinedAt: 'asc' },
    ],
  });

  return successResponse(res, members);
}

/**
 * Update member role
 * PUT /api/groups/:groupId/members/:userId/role
 */
export async function updateMemberRole(req: Request, res: Response) {
  const { groupId, userId: targetUserId } = req.params;
  const currentUserId = req.user!.id;
  const { role } = req.body as UpdateMemberRoleInput;

  // Check if current user is admin
  const currentMembership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: currentUserId,
      role: 'ADMIN',
    },
  });

  if (!currentMembership) {
    return forbiddenResponse(res, 'Only admins can change roles');
  }

  // Cannot change own role
  if (currentUserId === targetUserId) {
    return errorResponse(res, 'Cannot change your own role', 400);
  }

  // Update the target user's role
  const membership = await prisma.groupMember.update({
    where: {
      groupId_userId: {
        groupId,
        userId: targetUserId,
      },
    },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });

  return successResponse(res, membership, 'Role updated successfully');
}

/**
 * Remove member from group
 * DELETE /api/groups/:groupId/members/:userId
 */
export async function removeMember(req: Request, res: Response) {
  const { groupId, userId: targetUserId } = req.params;
  const currentUserId = req.user!.id;

  // Check if current user is admin or removing themselves
  const currentMembership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: currentUserId,
    },
  });

  if (!currentMembership) {
    return forbiddenResponse(res, 'You are not a member of this group');
  }

  // Allow self-removal or admin removal
  const canRemove = 
    currentUserId === targetUserId || 
    currentMembership.role === 'ADMIN';

  if (!canRemove) {
    return forbiddenResponse(res, 'Only admins can remove other members');
  }

  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: targetUserId,
      },
    },
  });

  const message = currentUserId === targetUserId 
    ? 'You have left the group' 
    : 'Member removed successfully';

  return successResponse(res, null, message);
}


/**
 * Get user's groups
 * GET /api/groups/my-groups
 */
export async function getMyGroups(req: Request, res: Response) {
  const userId = req.user!.id;
  const { page, limit, role, search, sort } = req.query as unknown as MyGroupsQuery;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    userId,
    ...(role && { role }),
    ...(search && {
      group: {
        name: { contains: search, mode: 'insensitive' as const },
      },
    }),
  };

  // Build orderBy clause
  let orderBy: any;
  if (sort === 'recent') {
    orderBy = { joinedAt: 'desc' };
  } else if (sort === 'members') {
    // Will sort by member count in post-processing
    orderBy = { joinedAt: 'desc' };
  } else if (sort === 'active') {
    // Will sort by active markets in post-processing
    orderBy = { joinedAt: 'desc' };
  } else {
    orderBy = { joinedAt: 'desc' };
  }

  // Fetch memberships with group details
  const [memberships, total] = await Promise.all([
    prisma.groupMember.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: true,
                markets: true,
              },
            },
            markets: {
              where: { status: 'ACTIVE' },
              select: { totalVolume: true },
            },
          },
        },
      },
    }),
    prisma.groupMember.count({ where }),
  ]);

  // Transform to response format
  let groupsWithStats = memberships.map((membership) => ({
    id: membership.group.id,
    name: membership.group.name,
    description: membership.group.description,
    iconUrl: membership.group.iconUrl,
    isPublic: membership.group.isPublic,
    userRole: membership.role,
    joinedAt: membership.joinedAt,
    stats: {
      memberCount: membership.group._count.members,
      activeMarkets: membership.group._count.markets,
      totalVolume: membership.group.markets.reduce((sum, m) => sum + m.totalVolume, 0),
    },
  }));

  // Apply sorting if needed
  if (sort === 'members') {
    groupsWithStats = groupsWithStats.sort((a, b) => b.stats.memberCount - a.stats.memberCount);
  } else if (sort === 'active') {
    groupsWithStats = groupsWithStats.sort((a, b) => b.stats.activeMarkets - a.stats.activeMarkets);
  }

  return successResponse(res, groupsWithStats, undefined, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}


/**
 * Get group settings
 * GET /api/groups/:id/settings
 */
export async function getGroupSettings(req: Request, res: Response) {
  const { id } = req.params;

  const group = await prisma.group.findUnique({
    where: { id },
    select: {
      id: true,
      defaultMarketType: true,
      allowedMarketTypes: true,
    },
  });

  if (!group) {
    return notFoundResponse(res, 'Group not found');
  }

  const settings = {
    defaultMarketType: group.defaultMarketType,
    allowedMarketTypes: group.allowedMarketTypes,
  };

  return successResponse(res, settings, 'Settings retrieved successfully');
}

/**
 * Update group settings
 * PUT /api/groups/:id/settings
 */
export async function updateGroupSettings(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;
  const { defaultMarketType, allowedMarketTypes } = req.body as GroupSettingsInput;

  // Check if user is admin
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId: id,
      userId,
      role: 'ADMIN',
    },
  });

  if (!membership) {
    return forbiddenResponse(res, 'Only admins can update group settings');
  }

  // Validate that defaultMarketType is in allowedMarketTypes if both are provided
  if (defaultMarketType && allowedMarketTypes) {
    if (!allowedMarketTypes.includes(defaultMarketType)) {
      return errorResponse(res, 'Default market type must be in allowed market types', 400);
    }
  }

  // Update settings
  const group = await prisma.group.update({
    where: { id },
    data: {
      ...(defaultMarketType && { defaultMarketType }),
      ...(allowedMarketTypes && { allowedMarketTypes }),
    },
    select: {
      id: true,
      defaultMarketType: true,
      allowedMarketTypes: true,
    },
  });

  const settings = {
    defaultMarketType: group.defaultMarketType,
    allowedMarketTypes: group.allowedMarketTypes,
  };

  return successResponse(res, settings, 'Settings updated successfully');
}


/**
 * Bulk assign judges to a group
 * POST /api/groups/:groupId/judges/bulk
 */
export async function bulkAssignJudges(req: Request, res: Response) {
  const { groupId } = req.params;
  const currentUserId = req.user!.id;
  const { userIds } = req.body as BulkAssignJudgesInput;

  // Check if current user is admin
  const currentMembership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: currentUserId,
      role: 'ADMIN',
    },
  });

  if (!currentMembership) {
    return forbiddenResponse(res, 'Only admins can assign judges');
  }

  // Process each user ID
  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      // Check if user is a member
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error(`User ${userId} is not a member of this group`);
      }

      // Update role to JUDGE
      const updated = await prisma.groupMember.update({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
        data: { role: 'JUDGE' },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      return updated;
    })
  );

  // Format results
  const successful = results
    .filter((r) => r.status === 'fulfilled')
    .map((r: any) => r.value);

  const failed = results
    .filter((r) => r.status === 'rejected')
    .map((r: any, index) => ({
      userId: userIds[index],
      error: r.reason.message,
    }));

  return successResponse(
    res,
    {
      successful,
      failed,
      summary: {
        total: userIds.length,
        succeeded: successful.length,
        failed: failed.length,
      },
    },
    'Bulk judge assignment completed'
  );
}
