/**
 * HADEROS Delivery Service
 * Port: 8085
 *
 * Features from PRD:
 * - Driver Management
 * - Smart Matching Algorithm
 * - Real-time Tracking
 * - Delivery Optimization
 * - Zone Management
 */

import express from 'express';
import cors from 'cors';
import { driverRoutes } from './routes/driver.routes';
import { deliveryRoutes } from './routes/delivery.routes';
import { zoneRoutes } from './routes/zone.routes';

const app = express();
const PORT = process.env.PORT || 8085;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'delivery-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Driver Management',
      'Smart Matching',
      'Real-time Tracking',
      'Zone Management'
    ]
  });
});

// Routes
app.use('/api/drivers', driverRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/zones', zoneRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🚚 Delivery Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
