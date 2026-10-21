import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { prisma } from './prisma/client.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { loansRoutes } from './modules/loans/loans.routes.js';
import { summaryRoutes } from './modules/summary/summary.routes.js';
import { receiptsRoutes } from './modules/receipts/receipts.routes.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/error.js';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','),
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // HTTP request logging
  if (config.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // General rate limiter for all API routes
  app.use('/api', apiRateLimiter);

  // Health check endpoint distinguishing app health & database readiness
  app.get('/api/health', async (_req: Request, res: Response) => {
    let databaseStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch {
      databaseStatus = 'error';
    }

    const isHealthy = databaseStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'miniledger-api',
      environment: config.NODE_ENV,
      database: databaseStatus,
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loansRoutes);
  app.use('/api/loans', receiptsRoutes);
  app.use('/api/summary', summaryRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested API route was not found on this server.',
      },
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
