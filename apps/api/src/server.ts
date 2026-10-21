import http from 'http';
import { app } from './app.js';
import { config } from './config/index.js';
import { prisma } from './prisma/client.js';
import { logger } from './utils/logger.js';

const server = http.createServer(app);

server.listen(config.PORT, config.HOST, () => {
  logger.info(`====================================================`);
  logger.info(`🚀 MiniLedger API Server running in ${config.NODE_ENV} mode`);
  logger.info(`📡 Listening on: http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${config.PORT}`);
  logger.info(`🩺 Health check: http://localhost:${config.PORT}/api/health`);
  logger.info(`📱 Mock OTPs will be printed in this terminal console`);
  logger.info(`====================================================`);
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down MiniLedger server gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connections closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force shutdown after timeout if pending connections hang
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
