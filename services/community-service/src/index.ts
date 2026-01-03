/**
 * HADEROS Community Service
 * Port: 8086
 *
 * Features from PRD:
 * - Reviews & Ratings
 * - Referral System
 * - Loyalty Points & Rewards
 * - Social Features
 */

import express from 'express';
import cors from 'cors';
import { reviewRoutes } from './routes/review.routes';
import { referralRoutes } from './routes/referral.routes';
import { loyaltyRoutes } from './routes/loyalty.routes';

const app = express();
const PORT = process.env.PORT || 8086;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'community-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Reviews & Ratings',
      'Referral System',
      'Loyalty Points',
      'Social Features'
    ]
  });
});

// Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`👥 Community Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
