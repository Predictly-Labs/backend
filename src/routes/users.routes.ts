import { Router } from 'express';
import { 
  authWithPrivy,
  getCurrentUser, 
  updateCurrentUser, 
  getUserById,
  getUserStats,
  getLeaderboard,
} from '../controllers/users.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authSchema, updateUserSchema } from '../validators/users.validator.js';

const router = Router();

// Auth routes
router.post('/auth/privy', validateBody(authSchema), authWithPrivy);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.put('/me', authMiddleware, validateBody(updateUserSchema), updateCurrentUser);

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getUserById);
router.get('/:id/stats', getUserStats);

export default router;
