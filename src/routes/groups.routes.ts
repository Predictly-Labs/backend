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
} from '../controllers/groups.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import { 
  createGroupSchema, 
  updateGroupSchema, 
  joinGroupSchema,
  updateMemberRoleSchema,
  listGroupsQuerySchema,
} from '../validators/groups.validator.js';

const router = Router();

// Public routes (with optional auth for better UX)
router.get('/', validateQuery(listGroupsQuerySchema), getGroups);
router.get('/:id', optionalAuthMiddleware, getGroupById);
router.get('/:id/members', getGroupMembers);

// Protected routes (require auth)
router.post('/', authMiddleware, validateBody(createGroupSchema), createGroup);
router.post('/join', authMiddleware, validateBody(joinGroupSchema), joinGroup);
router.put('/:id', authMiddleware, validateBody(updateGroupSchema), updateGroup);
router.delete('/:id', authMiddleware, deleteGroup);

// Member management (require auth)
router.put('/:groupId/members/:userId/role', authMiddleware, validateBody(updateMemberRoleSchema), updateMemberRole);
router.delete('/:groupId/members/:userId', authMiddleware, removeMember);

export default router;
