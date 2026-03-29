import { Router } from 'express';
import { getStats } from '../controllers/referral.controller.js';

const router = Router();

// GET /api/referral/:code
router.get('/:code', getStats);

export default router;
