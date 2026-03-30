import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  walletAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, "Invalid Movement wallet address"),
  referralCode: z.string().min(1, "Referral code cannot be empty").optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
