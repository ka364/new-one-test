/**
 * HADEROS Order Service
 * Port: 8083
 *
 * Responsibilities:
 * - Shopping cart management
 * - Order creation and processing
 * - Order status tracking
 * - Invoices and receipts
 * - Returns management
 */

import express from 'express';
import cors from 'cors';
import { orderRoutes } from './routes/order.routes';
import { cartRoutes } from './routes/cart.routes';

const app = express();
const PORT = process.env.PORT || 8083;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'order-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
