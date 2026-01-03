/**
 * HADEROS API Gateway
 * Port: 3000
 *
 * Routes requests to appropriate microservices
 * Handles authentication, rate limiting, and logging
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per window
  message: { error: 'Too many requests', code: 'RATE_LIMITED' }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      user: process.env.USER_SERVICE_URL,
      product: process.env.PRODUCT_SERVICE_URL,
      order: process.env.ORDER_SERVICE_URL,
      groupBuying: process.env.GROUP_BUYING_SERVICE_URL,
      delivery: process.env.DELIVERY_SERVICE_URL,
      community: process.env.COMMUNITY_SERVICE_URL,
      locker: process.env.LOCKER_SERVICE_URL,
      payment: process.env.PAYMENT_SERVICE_URL,
      notification: process.env.NOTIFICATION_SERVICE_URL
    }
  });
});

// Service URLs
const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:8081',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8082',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:8083',
  groupBuying: process.env.GROUP_BUYING_SERVICE_URL || 'http://localhost:8084',
  delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:8085',
  community: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:8086',
  locker: process.env.LOCKER_SERVICE_URL || 'http://localhost:8087',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8088',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8089'
};

// Proxy configuration
const createProxy = (target: string) => createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite: (path, req) => path,
  onError: (err, req, res: any) => {
    console.error('Proxy error:', err.message);
    res.status(502).json({
      error: 'Service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
});

// Route proxies
app.use('/api/users', createProxy(services.user));
app.use('/api/auth', createProxy(services.user));
app.use('/api/profile', createProxy(services.user));

app.use('/api/products', createProxy(services.product));
app.use('/api/categories', createProxy(services.product));
app.use('/api/inventory', createProxy(services.product));

app.use('/api/orders', createProxy(services.order));
app.use('/api/cart', createProxy(services.order));

app.use('/api/group-deals', createProxy(services.groupBuying));
app.use('/api/group-buying', createProxy(services.groupBuying));

app.use('/api/delivery', createProxy(services.delivery));
app.use('/api/drivers', createProxy(services.delivery));
app.use('/api/shipments', createProxy(services.delivery));

// Community Service
app.use('/api/reviews', createProxy(services.community));
app.use('/api/referrals', createProxy(services.community));
app.use('/api/loyalty', createProxy(services.community));

// Locker Service
app.use('/api/lockers', createProxy(services.locker));
app.use('/api/locker-locations', createProxy(services.locker));
app.use('/api/bookings', createProxy(services.locker));

// Payment Service
app.use('/api/payments', createProxy(services.payment));
app.use('/api/wallets', createProxy(services.payment));
app.use('/api/transactions', createProxy(services.payment));
app.use('/api/payouts', createProxy(services.payment));

// Notification Service
app.use('/api/notifications', createProxy(services.notification));
app.use('/api/templates', createProxy(services.notification));
app.use('/api/preferences', createProxy(services.notification));

// Delivery Service
app.use('/api/deliveries', createProxy(services.delivery));
app.use('/api/zones', createProxy(services.delivery));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal gateway error',
    code: err.code || 'GATEWAY_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 HADEROS API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log('\n📡 Routing to services:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`   - ${name}: ${url}`);
  });
});

export default app;
