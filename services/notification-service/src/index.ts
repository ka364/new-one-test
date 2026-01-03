/**
 * HADEROS Notification Service
 * Port: 8089
 *
 * Features from PRD:
 * - Multi-channel Notifications (Push, SMS, Email, WhatsApp)
 * - Template Management
 * - User Preferences
 * - Scheduled Notifications
 * - Bilingual Support (Arabic/English)
 */

import express from 'express';
import cors from 'cors';
import { notificationRoutes } from './routes/notification.routes';
import { templateRoutes } from './routes/template.routes';
import { preferencesRoutes } from './routes/preferences.routes';

const app = express();
const PORT = process.env.PORT || 8089;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'notification-service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Push Notifications',
      'SMS Notifications',
      'Email Notifications',
      'WhatsApp Integration',
      'Template Management',
      'User Preferences',
      'Bilingual Support'
    ],
    supportedChannels: ['push', 'sms', 'email', 'whatsapp', 'in_app']
  });
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/preferences', preferencesRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
