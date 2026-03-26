import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { checkoutSchema, webhookSchema } from '../validators/subscriptions.validator.js';
import {
  createCheckout,
  getStatus,
  handleWebhook,
} from '../controllers/subscriptions.controller.js';

const router = Router();

// Protected routes
router.post('/checkout', authMiddleware, validateBody(checkoutSchema), createCheckout);
router.get('/status', authMiddleware, getStatus);

// Webhook (would have signature verification in production)
router.post('/webhook', validateBody(webhookSchema), handleWebhook);

export default router;
