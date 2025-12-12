import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

const PORT = parseInt(env.PORT, 10);

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Predictly Backend Server                             ║
║                                                           ║
║   - Local:    http://localhost:${PORT}                     ║
║   - API:      http://localhost:${PORT}/api                 ║
║   - Health:   http://localhost:${PORT}/api/health          ║
║                                                           ║
║   Environment: ${env.NODE_ENV.padEnd(40)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
