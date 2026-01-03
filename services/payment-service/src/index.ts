/**
 * HADEROS Payment Service
 * Port: 8088
 *
 * Features from PRD:
 * - Egyptian Payment Methods (Fawry, Vodafone Cash, InstaPay)
 * - Card Payments
 * - HADEROS Wallet
 * - Merchant Payouts
 * - Cash on Delivery
 */

import express from 'express';
import cors from 'cors';
import { transactionRoutes } from './routes/transaction.routes';
import { walletRoutes } from './routes/wallet.routes';
import { payoutRoutes } from './routes/payout.routes';

const app = express();
const PORT = process.env.PORT || 8088;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'payment-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Egyptian Payment Methods',
      'Card Payments',
      'HADEROS Wallet',
      'Merchant Payouts',
      'Fawry Integration',
      'Mobile Payments'
    ],
    supportedMethods: [
      'card',
      'fawry',
      'vodafone_cash',
      'instapay',
      'meeza',
      'cod',
      'wallet',
      'bank_transfer'
    ]
  });
});

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/payouts', payoutRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`💳 Payment Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
