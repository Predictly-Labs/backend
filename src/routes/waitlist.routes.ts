import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema } from '../validators/waitlist.validator.js';
import { register } from '../controllers/waitlist.controller.js';

const router = Router();

// POST /api/waitlist
router.post('/', validateBody(registerSchema), register);

export default router;
