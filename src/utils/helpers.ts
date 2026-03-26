import { customAlphabet } from 'nanoid';

// Generate invite codes (8 characters, uppercase alphanumeric)
const generateInviteCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

// Generate short IDs (12 characters)
const generateShortId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);

export { generateInviteCode, generateShortId };

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate percentage with 2 decimal places
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 50; // Default to 50% if no votes
  return Math.round((part / total) * 10000) / 100;
}

/**
 * Paginate results
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 10
): { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const data = items.slice(startIndex, startIndex + limit);
  
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Sanitize string for safe display
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}
