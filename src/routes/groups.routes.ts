import { Router } from 'express';
import { 
  createGroup, 
  getGroups, 
  getGroupById, 
  joinGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  updateMemberRole,
  removeMember,
  getMyGroups,
  getGroupSettings,
  updateGroupSettings,
  bulkAssignJudges,
} from '../controllers/groups.controller.js';
import { getGroupMarkets } from '../controllers/markets.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import { 
  createGroupSchema, 
  updateGroupSchema, 
  joinGroupSchema,
  updateMemberRoleSchema,
  listGroupsQuerySchema,
  myGroupsQuerySchema,
  groupMembersQuerySchema,
  groupSettingsSchema,
  bulkAssignJudgesSchema,
} from '../validators/groups.validator.js';

const router = Router();

// Public routes (with optional auth for better UX)
router.get('/', validateQuery(listGroupsQuerySchema), getGroups);

// Protected routes (require auth) - MUST be before /:id to avoid conflicts
router.get('/my-groups', authMiddleware, validateQuery(myGroupsQuerySchema), getMyGroups);

// Public routes continued
router.get('/:id', optionalAuthMiddleware, getGroupById);
router.get('/:id/members', validateQuery(groupMembersQuerySchema), getGroupMembers);
router.get('/:groupId/markets', getGroupMarkets); // Get markets in group

// Protected routes continued
router.post('/', authMiddleware, validateBody(createGroupSchema), createGroup);
router.post('/join', authMiddleware, validateBody(joinGroupSchema), joinGroup);
router.put('/:id', authMiddleware, validateBody(updateGroupSchema), updateGroup);
router.delete('/:id', authMiddleware, deleteGroup);

// Member management (require auth)
router.put('/:groupId/members/:userId/role', authMiddleware, validateBody(updateMemberRoleSchema), updateMemberRole);
router.delete('/:groupId/members/:userId', authMiddleware, removeMember);
router.post('/:groupId/judges/bulk', authMiddleware, validateBody(bulkAssignJudgesSchema), bulkAssignJudges);

// Group settings (require auth)
router.get('/:id/settings', authMiddleware, getGroupSettings);
router.put('/:id/settings', authMiddleware, validateBody(groupSettingsSchema), updateGroupSettings);

export default router;
