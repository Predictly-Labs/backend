import { Router } from 'express';
import { getBalance, getBalanceDetailed, getMyBalance } from '../controllers/wallet.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet balance and information endpoints
 */

/**
 * @swagger
 * /api/wallet/balance/me:
 *   get:
 *     tags: [Wallet]
 *     summary: Get current user's wallet balance
 *     description: Get MOVE token balance for the authenticated user's wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     address:
 *                       type: string
 *                     balance:
 *                       type: number
 *                     unit:
 *                       type: string
 *       401:
 *         description: Not authenticated
 *       503:
 *         description: RPC temporarily unavailable
 */
router.get('/balance/me', authMiddleware, getMyBalance);

/**
 * @swagger
 * /api/wallet/balance/{address}:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet balance by address
 *     description: Get MOVE token balance for any wallet address
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address (must start with 0x)
 *         example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     balance:
 *                       type: number
 *                     unit:
 *                       type: string
 *       400:
 *         description: Invalid address format
 *       503:
 *         description: RPC temporarily unavailable
 */
router.get('/balance/:address', getBalance);

/**
 * @swagger
 * /api/wallet/balance/{address}/detailed:
 *   get:
 *     tags: [Wallet]
 *     summary: Get detailed wallet balance by address
 *     description: Get MOVE token balance with detailed information (MOVE, octas, formatted)
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address (must start with 0x)
 *         example: "0x9161980be9b78e96ddae98ceb289f6f4cda5e4af70667667ff9af8438a94e565"
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     balance:
 *                       type: object
 *                       properties:
 *                         move:
 *                           type: number
 *                         octas:
 *                           type: string
 *                         formatted:
 *                           type: string
 *       400:
 *         description: Invalid address format
 *       503:
 *         description: RPC temporarily unavailable
 */
router.get('/balance/:address/detailed', getBalanceDetailed);

export default router;
