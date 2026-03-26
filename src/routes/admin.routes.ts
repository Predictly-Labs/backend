import { Router } from 'express';
import {
  getRelayWalletBalance,
  getRelayWalletTransactions,
  monitorRelayWallet,
} from '../controllers/admin.controller.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';

const router = Router();

// All admin routes require admin authentication
router.use(adminMiddleware);

// Relay wallet management
router.get('/relay-wallet/balance', getRelayWalletBalance);
router.get('/relay-wallet/transactions', getRelayWalletTransactions);
router.post('/relay-wallet/monitor', monitorRelayWallet);

export default router;
