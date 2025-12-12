import { PrismaClient } from '@prisma/client';
import { isDev } from './env.js';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: isDev ? ['query', 'error', 'warn'] : ['error'],
});

if (isDev) {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
