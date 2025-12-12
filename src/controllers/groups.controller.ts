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
  ListGroupsQuery 
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

  const members = await prisma.groupMember.findMany({
    where: { groupId: id },
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
