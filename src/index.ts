import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import * as monitoring from './services/monitoring.service.js';

const PORT = parseInt(env.PORT, 10);

let monitoringInterval: NodeJS.Timeout | null = null;
let marketSyncInterval: NodeJS.Timeout | null = null;

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start monitoring
    monitoringInterval = monitoring.startPeriodicMonitoring(60000); // Every 1 minute
    
    // Start market sync (every 1 minute for active markets)
    console.log('🚀 Starting periodic market sync (interval: 60000ms)');
    monitoring.runMarketSync(); // Run immediately
    marketSyncInterval = setInterval(() => {
      monitoring.runMarketSync();
    }, 60000);

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
  if (monitoringInterval) {
    monitoring.stopPeriodicMonitoring(monitoringInterval);
  }
  if (marketSyncInterval) {
    clearInterval(marketSyncInterval);
    console.log('🛑 Stopped market sync');
  }
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  if (monitoringInterval) {
    monitoring.stopPeriodicMonitoring(monitoringInterval);
  }
  if (marketSyncInterval) {
    clearInterval(marketSyncInterval);
    console.log('🛑 Stopped market sync');
  }
  await prisma.$disconnect();
  process.exit(0);
});

main();
