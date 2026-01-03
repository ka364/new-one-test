/**
 * HADEROS Product Service
 * Port: 8082
 *
 * Responsibilities:
 * - Product catalog CRUD
 * - Inventory management
 * - Categories and tags
 * - Search and filtering
 * - Stock reservation
 */

import express from 'express';
import cors from 'cors';
import { productRoutes } from './routes/product.routes';
import { categoryRoutes } from './routes/category.routes';
import { inventoryRoutes } from './routes/inventory.routes';

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'product-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Product Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
