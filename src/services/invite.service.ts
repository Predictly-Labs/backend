import { generateInviteCode } from '../utils/helpers.js';
import { prisma } from '../config/database.js';

/**
 * Generate a unique invite code for a group
 * Checks database to ensure uniqueness
 */
export async function generateUniqueInviteCode(): Promise<string> {
  let code: string;
  let exists: boolean;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateInviteCode();
    const existingGroup = await prisma.group.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    exists = !!existingGroup;
    attempts++;
  } while (exists && attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique invite code');
  }

  return code;
}

/**
 * Validate an invite code format
 */
export function isValidInviteCodeFormat(code: string): boolean {
  // 8 characters, uppercase alphanumeric
  return /^[A-Z0-9]{8}$/.test(code);
}
