/**
 * HADEROS Group Buying Service
 * Port: 8084
 *
 * Features from PRD:
 * - Dynamic Pricing Engine (price drops as participants increase)
 * - Real-time Progress Updates
 * - WhatsApp Sharing Integration
 * - Smart Reminders System
 * - Automated Deal Closure
 */

import express from 'express';
import cors from 'cors';
import { dealRoutes } from './routes/deal.routes';
import { participantRoutes } from './routes/participant.routes';
import { pricingRoutes } from './routes/pricing.routes';

const app = express();
const PORT = process.env.PORT || 8084;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'group-buying-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Dynamic Pricing Engine',
      'Real-time Progress',
      'WhatsApp Integration',
      'Smart Reminders'
    ]
  });
});

// Routes
app.use('/api/group-deals', dealRoutes);
app.use('/api/group-buying/participants', participantRoutes);
app.use('/api/group-buying/pricing', pricingRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Group Buying Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
