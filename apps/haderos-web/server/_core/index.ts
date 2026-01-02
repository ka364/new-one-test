import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import net from 'net';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { registerOAuthRoutes } from './oauth';
import { appRouter } from '../routers';
import { createContext } from './context';
import { serveStatic, setupVite } from './vite';
import { initializeDatabase } from './init-db';
import { securityMiddleware } from './security';
import { logger } from './logger';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize database tables on first run
  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');
  } catch (error: any) {
    logger.error('Database initialization failed, continuing in offline mode', error);
    // Continue anyway - frontend can still load without data
  }

  const app = express();
  const server = createServer(app);

  // ============================================
  // 🔒 SECURITY MIDDLEWARE (Priority 1)
  // ============================================

  // 1. Helmet - Security Headers
  app.use(securityMiddleware.helmet);

  // 2. CORS - Cross-Origin Resource Sharing
  app.use(cors(securityMiddleware.cors));

  // 3. Request Logging
  app.use(logger.requestLogger());

  // Raw body middleware for Shopify webhook signature verification
  app.use('/api/webhooks/shopify', express.raw({ type: 'application/json' }), (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      (req as any).rawBody = req.body.toString('utf8');
      req.body = JSON.parse((req as any).rawBody);
    }
    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 4. Input Validation Middleware
  app.use(securityMiddleware.validateBody);
  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Basic health check
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ============================================
  // 🛡️ RATE LIMITING (Priority 2)
  // ============================================

  // Auth endpoints - strict rate limiting
  app.use('/api/oauth', securityMiddleware.rateLimit.auth);

  // Upload endpoints - file upload rate limiting
  app.use('/api/upload', securityMiddleware.rateLimit.upload);

  // API endpoints - general API rate limiting
  app.use('/api/trpc', securityMiddleware.rateLimit.api);

  // General rate limiting for all other routes
  app.use(securityMiddleware.rateLimit.general);

  // ============================================
  // 🌐 APPLICATION ROUTES
  // ============================================

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Shopify webhooks endpoint
  const shopifyWebhookRouter = (await import('./shopify-webhook-endpoint')).default;
  app.use('/api', shopifyWebhookRouter);

  // tRPC API
  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || '3000');
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    logger.info(`🚀 Server started successfully`, {
      port,
      environment: process.env.NODE_ENV || 'development',
      url: `http://localhost:${port}/`,
      securityEnabled: true,
      rateLimitingEnabled: true,
      loggingEnabled: true,
    });
    console.log(`✅ Server running on http://localhost:${port}/`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

startServer().catch(console.error);
