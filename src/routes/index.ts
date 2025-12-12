import { Router } from 'express';
import groupsRouter from './groups.routes.js';
import usersRouter from './users.routes.js';
import uploadRouter from './upload.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'predictly-backend',
  });
});

// API routes
router.use('/groups', groupsRouter);
router.use('/users', usersRouter);
router.use('/upload', uploadRouter);

export default router;
