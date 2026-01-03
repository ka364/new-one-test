/**
 * Notification Model
 * Multi-channel Notifications
 */

import { z } from 'zod';

// Notification channels
export const NotificationChannel = z.enum([
  'push',
  'sms',
  'email',
  'whatsapp',
  'in_app'
]);

// Notification status
export const NotificationStatus = z.enum([
  'pending',
  'sent',
  'delivered',
  'read',
  'failed'
]);

// Notification types
export const NotificationType = z.enum([
  // Order notifications
  'order_placed',
  'order_confirmed',
  'order_shipped',
  'order_delivered',
  'order_cancelled',

  // Payment notifications
  'payment_received',
  'payment_failed',
  'refund_processed',

  // Group buying notifications
  'deal_joined',
  'deal_threshold_reached',
  'deal_successful',
  'deal_failed',
  'deal_reminder',
  'price_dropped',

  // Delivery notifications
  'driver_assigned',
  'driver_arriving',
  'package_picked_up',
  'package_delivered',

  // Locker notifications
  'locker_booked',
  'locker_ready',
  'locker_expiring',
  'locker_code',

  // Promotions & Marketing
  'promo_new',
  'promo_expiring',
  'flash_sale',

  // Account
  'welcome',
  'password_reset',
  'account_verified',

  // General
  'custom'
]);

// Notification schema
export const NotificationSchema = z.object({
  id: z.string(),

  // Target
  userId: z.string(),
  userPhone: z.string().optional(),
  userEmail: z.string().optional(),
  deviceToken: z.string().optional(),

  // Content
  type: NotificationType,
  title: z.string(),
  titleAr: z.string().optional(),
  body: z.string(),
  bodyAr: z.string().optional(),
  imageUrl: z.string().optional(),

  // Channel
  channel: NotificationChannel,
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),

  // Status
  status: NotificationStatus.default('pending'),
  errorMessage: z.string().optional(),

  // Tracking
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  readAt: z.date().optional(),

  // Action
  actionUrl: z.string().optional(),
  actionData: z.record(z.string(), z.any()).optional(),

  // Reference
  referenceType: z.string().optional(), // 'order', 'deal', 'delivery'
  referenceId: z.string().optional(),

  // Metadata
  metadata: z.record(z.string(), z.any()).optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  scheduledAt: z.date().optional()
});

export type Notification = z.infer<typeof NotificationSchema>;

// Template schema
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: NotificationType,
  channel: NotificationChannel,

  // Content templates (with placeholders like {{userName}})
  titleTemplate: z.string(),
  titleTemplateAr: z.string().optional(),
  bodyTemplate: z.string(),
  bodyTemplateAr: z.string().optional(),

  // WhatsApp specific
  whatsappTemplateId: z.string().optional(),

  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Template = z.infer<typeof TemplateSchema>;

// User preferences
export const UserPreferencesSchema = z.object({
  userId: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  deviceTokens: z.array(z.object({
    token: z.string(),
    platform: z.enum(['ios', 'android', 'web']),
    addedAt: z.date()
  })).default([]),
  channels: z.object({
    push: z.boolean().default(true),
    sms: z.boolean().default(true),
    email: z.boolean().default(true),
    whatsapp: z.boolean().default(true),
    in_app: z.boolean().default(true)
  }).default({}),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().optional(), // "22:00"
    end: z.string().optional() // "08:00"
  }).optional(),
  language: z.enum(['ar', 'en']).default('ar'),
  updatedAt: z.date().default(() => new Date())
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Input schemas
export const SendNotificationInput = z.object({
  userId: z.string(),
  type: NotificationType,
  channel: NotificationChannel.optional(), // Auto-select if not specified
  title: z.string().optional(),
  titleAr: z.string().optional(),
  body: z.string().optional(),
  bodyAr: z.string().optional(),
  imageUrl: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  actionUrl: z.string().optional(),
  actionData: z.record(z.string(), z.any()).optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.string(), z.string()).optional(),
  scheduledAt: z.string().or(z.date()).optional()
});

export const BulkNotificationInput = z.object({
  userIds: z.array(z.string()),
  type: NotificationType,
  channel: NotificationChannel.optional(),
  title: z.string(),
  titleAr: z.string().optional(),
  body: z.string(),
  bodyAr: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
});
