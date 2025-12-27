import { Router } from 'express';
import authRouter from './auth.routes.js';
import groupsRouter from './groups.routes.js';
import usersRouter from './users.routes.js';
import uploadRouter from './upload.routes.js';
import predictionsRouter from './predictions.routes.js';
import subscriptionsRouter from './subscriptions.routes.js';
import contractRouter from './contract.routes.js';
import marketsRouter from './markets.routes.js';
import adminRouter from './admin.routes.js';

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
router.use('/auth', authRouter);
router.use('/groups', groupsRouter);
router.use('/users', usersRouter);
router.use('/upload', uploadRouter);
router.use('/predictions', predictionsRouter);
router.use('/subscriptions', subscriptionsRouter);
router.use('/contract', contractRouter);
router.use('/markets', marketsRouter);
router.use('/admin', adminRouter);

export default router;
