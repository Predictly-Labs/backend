import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  errorResponse,
} from '../utils/response.js';
import type { CheckoutInput, WebhookInput } from '../validators/subscriptions.validator.js';

const PLANS = {
  monthly: { price: 9.99, days: 30 },
  yearly: { price: 99.99, days: 365 },
};

/**
 * Create checkout session (mock)
 * POST /api/subscriptions/checkout
 */
export async function createCheckout(req: Request, res: Response) {
  const userId = req.user!.id;
  const { plan } = req.body as CheckoutInput;

  const planDetails = PLANS[plan];

  // Mock checkout URL - in production this would be Stripe/crypto payment
  const checkoutUrl = `https://checkout.predictly.app/mock?userId=${userId}&plan=${plan}&amount=${planDetails.price}`;

  return successResponse(res, {
    checkoutUrl,
    plan,
    price: planDetails.price,
    currency: 'USD',
  });
}

/**
 * Get subscription status
 * GET /api/subscriptions/status
 */
export async function getStatus(req: Request, res: Response) {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      proExpiresAt: true,
    },
  });

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const isActive = user.isPro && user.proExpiresAt && user.proExpiresAt > new Date();

  return successResponse(res, {
    isPro: isActive,
    expiresAt: user.proExpiresAt,
    daysRemaining: isActive && user.proExpiresAt
      ? Math.ceil((user.proExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0,
  });
}

/**
 * Webhook to activate subscription (mock)
 * POST /api/subscriptions/webhook
 */
export async function handleWebhook(req: Request, res: Response) {
  const { userId, plan, transactionId } = req.body as WebhookInput;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const planDetails = PLANS[plan];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + planDetails.days);

  await prisma.user.update({
    where: { id: userId },
    data: {
      isPro: true,
      proExpiresAt: expiresAt,
    },
  });

  return successResponse(res, {
    activated: true,
    plan,
    expiresAt,
    transactionId,
  }, 'Subscription activated');
}
