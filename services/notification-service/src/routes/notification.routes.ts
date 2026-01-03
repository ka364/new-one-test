/**
 * Notification Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Notification, SendNotificationInput, BulkNotificationInput, UserPreferences } from '../models/notification.model';
import { templates } from './template.routes';

export const notificationRoutes = Router();

// In-memory stores
const notifications = new Map<string, Notification>();
const userPreferences = new Map<string, UserPreferences>();

// Helper: Get user preferences
const getUserPrefs = (userId: string): UserPreferences => {
  let prefs = userPreferences.get(userId);
  if (!prefs) {
    prefs = {
      userId,
      deviceTokens: [],
      channels: {
        push: true,
        sms: true,
        email: true,
        whatsapp: true,
        in_app: true
      },
      language: 'ar',
      updatedAt: new Date()
    };
    userPreferences.set(userId, prefs);
  }
  return prefs;
};

// Helper: Replace template placeholders
const processTemplate = (template: string, data: Record<string, string>): string => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
};

// Helper: Simulate sending notification
const sendToChannel = async (notification: Notification): Promise<{ success: boolean; error?: string }> => {
  // In production, integrate with actual services:
  // - Push: Firebase Cloud Messaging
  // - SMS: Twilio, Vonage
  // - Email: SendGrid, AWS SES
  // - WhatsApp: Twilio WhatsApp Business API

  console.log(`[${notification.channel.toUpperCase()}] Sending to ${notification.userId}: ${notification.title}`);

  // Simulate success (95% success rate)
  const success = Math.random() > 0.05;
  return {
    success,
    error: success ? undefined : 'Simulated delivery failure'
  };
};

// GET /api/notifications - List notifications
notificationRoutes.get('/', (req, res) => {
  const { userId, type, status, channel, page = 1, limit = 20 } = req.query;

  let notifList = Array.from(notifications.values());

  if (userId) {
    notifList = notifList.filter(n => n.userId === userId);
  }
  if (type) {
    notifList = notifList.filter(n => n.type === type);
  }
  if (status) {
    notifList = notifList.filter(n => n.status === status);
  }
  if (channel) {
    notifList = notifList.filter(n => n.channel === channel);
  }

  // Sort by date (newest first)
  notifList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const start = (Number(page) - 1) * Number(limit);
  const paginated = notifList.slice(start, start + Number(limit));

  res.json({
    notifications: paginated,
    total: notifList.length,
    unread: notifList.filter(n => n.status !== 'read').length,
    page: Number(page)
  });
});

// GET /api/notifications/:id - Get notification details
notificationRoutes.get('/:id', (req, res) => {
  const notification = notifications.get(req.params.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found', code: 'NOT_FOUND' });
  }
  res.json({ notification });
});

// POST /api/notifications/send - Send notification
notificationRoutes.post('/send', async (req, res) => {
  try {
    const input = SendNotificationInput.parse(req.body);
    const prefs = getUserPrefs(input.userId);

    // Process template if specified
    let title = input.title || '';
    let titleAr = input.titleAr || '';
    let body = input.body || '';
    let bodyAr = input.bodyAr || '';

    if (input.templateId) {
      const template = templates.get(input.templateId);
      if (template) {
        const data = input.templateData || {};
        title = processTemplate(template.titleTemplate, data);
        titleAr = processTemplate(template.titleTemplateAr || template.titleTemplate, data);
        body = processTemplate(template.bodyTemplate, data);
        bodyAr = processTemplate(template.bodyTemplateAr || template.bodyTemplate, data);
      }
    }

    // Auto-select channel based on preferences
    let channel = input.channel;
    if (!channel) {
      if (prefs.channels.push && prefs.deviceTokens.length > 0) {
        channel = 'push';
      } else if (prefs.channels.sms && prefs.phone) {
        channel = 'sms';
      } else if (prefs.channels.email && prefs.email) {
        channel = 'email';
      } else {
        channel = 'in_app';
      }
    }

    // Check if channel is enabled for user
    if (!prefs.channels[channel as keyof typeof prefs.channels]) {
      return res.status(400).json({
        error: `Channel ${channel} is disabled for this user`,
        code: 'CHANNEL_DISABLED'
      });
    }

    const notification: Notification = {
      id: nanoid(),
      userId: input.userId,
      userPhone: prefs.phone,
      userEmail: prefs.email,
      deviceToken: prefs.deviceTokens[0]?.token,
      type: input.type,
      title: prefs.language === 'ar' && titleAr ? titleAr : title,
      titleAr,
      body: prefs.language === 'ar' && bodyAr ? bodyAr : body,
      bodyAr,
      imageUrl: input.imageUrl,
      channel,
      priority: input.priority || 'normal',
      status: input.scheduledAt ? 'pending' : 'pending',
      actionUrl: input.actionUrl,
      actionData: input.actionData,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      createdAt: new Date()
    };

    notifications.set(notification.id, notification);

    // Send immediately if not scheduled
    if (!input.scheduledAt) {
      const result = await sendToChannel(notification);
      notification.status = result.success ? 'sent' : 'failed';
      notification.sentAt = new Date();
      if (!result.success) {
        notification.errorMessage = result.error;
      }
      notifications.set(notification.id, notification);
    }

    console.log('Event: notification.created', { notificationId: notification.id, channel, type: input.type });

    res.status(201).json({ notification });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/notifications/bulk - Send bulk notifications
notificationRoutes.post('/bulk', async (req, res) => {
  try {
    const input = BulkNotificationInput.parse(req.body);

    const results = {
      total: input.userIds.length,
      sent: 0,
      failed: 0,
      notifications: [] as { userId: string; notificationId: string; status: string }[]
    };

    for (const userId of input.userIds) {
      const prefs = getUserPrefs(userId);

      const channel = input.channel || (
        prefs.channels.push && prefs.deviceTokens.length > 0 ? 'push' :
          prefs.channels.sms && prefs.phone ? 'sms' :
            prefs.channels.email && prefs.email ? 'email' : 'in_app'
      );

      const notification: Notification = {
        id: nanoid(),
        userId,
        userPhone: prefs.phone,
        userEmail: prefs.email,
        deviceToken: prefs.deviceTokens[0]?.token,
        type: input.type,
        title: prefs.language === 'ar' && input.titleAr ? input.titleAr : input.title,
        titleAr: input.titleAr,
        body: prefs.language === 'ar' && input.bodyAr ? input.bodyAr : input.body,
        bodyAr: input.bodyAr,
        channel,
        priority: input.priority || 'normal',
        status: 'pending',
        createdAt: new Date()
      };

      notifications.set(notification.id, notification);

      const result = await sendToChannel(notification);
      notification.status = result.success ? 'sent' : 'failed';
      notification.sentAt = new Date();
      if (!result.success) {
        notification.errorMessage = result.error;
      }
      notifications.set(notification.id, notification);

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
      }

      results.notifications.push({
        userId,
        notificationId: notification.id,
        status: notification.status
      });
    }

    console.log('Event: notification.bulk_sent', { total: results.total, sent: results.sent, failed: results.failed });

    res.json(results);
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PUT /api/notifications/:id/read - Mark as read
notificationRoutes.put('/:id/read', (req, res) => {
  const notification = notifications.get(req.params.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found', code: 'NOT_FOUND' });
  }

  notification.status = 'read';
  notification.readAt = new Date();
  notifications.set(notification.id, notification);

  res.json({ notification });
});

// PUT /api/notifications/user/:userId/read-all - Mark all as read
notificationRoutes.put('/user/:userId/read-all', (req, res) => {
  const userNotifs = Array.from(notifications.values())
    .filter(n => n.userId === req.params.userId && n.status !== 'read');

  let count = 0;
  for (const notif of userNotifs) {
    notif.status = 'read';
    notif.readAt = new Date();
    notifications.set(notif.id, notif);
    count++;
  }

  res.json({ success: true, count });
});

// DELETE /api/notifications/:id - Delete notification
notificationRoutes.delete('/:id', (req, res) => {
  if (!notifications.has(req.params.id)) {
    return res.status(404).json({ error: 'Notification not found', code: 'NOT_FOUND' });
  }

  notifications.delete(req.params.id);

  res.json({ success: true, message: 'Notification deleted' });
});

// GET /api/notifications/user/:userId/unread-count - Get unread count
notificationRoutes.get('/user/:userId/unread-count', (req, res) => {
  const count = Array.from(notifications.values())
    .filter(n => n.userId === req.params.userId && n.status !== 'read')
    .length;

  res.json({ unreadCount: count });
});

// Export for preferences routes
export { userPreferences };
