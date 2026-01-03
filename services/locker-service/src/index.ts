/**
 * HADEROS Locker Service
 * Port: 8087
 *
 * Features from PRD:
 * - Smart Locker Network
 * - Location Management
 * - Booking System
 * - Access Code Generation
 */

import express from 'express';
import cors from 'cors';
import { locationRoutes } from './routes/location.routes';
import { lockerRoutes } from './routes/locker.routes';
import { bookingRoutes } from './routes/booking.routes';

const app = express();
const PORT = process.env.PORT || 8087;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'locker-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Smart Locker Network',
      'Location Management',
      'Booking System',
      'Access Code Generation'
    ]
  });
});

// Routes
app.use('/api/locker-locations', locationRoutes);
app.use('/api/lockers', lockerRoutes);
app.use('/api/bookings', bookingRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🔐 Locker Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
