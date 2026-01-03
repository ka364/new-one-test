/**
 * HADEROS User Service
 * Port: 8081
 *
 * Responsibilities:
 * - User registration and verification (KYC/AML)
 * - Profile management
 * - Authentication & Authorization
 * - Role and permission management
 */

import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/user.routes';
import { authRoutes } from './routes/auth.routes';
import { profileRoutes } from './routes/profile.routes';

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'user-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 User Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
