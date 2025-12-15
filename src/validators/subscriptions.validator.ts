import { z } from 'zod';

export const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']).default('monthly'),
});

export const webhookSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(['monthly', 'yearly']),
  transactionId: z.string(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type WebhookInput = z.infer<typeof webhookSchema>;
