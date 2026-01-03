/**
 * User Preferences Routes
 */

import { Router } from 'express';
import { UserPreferences } from '../models/notification.model';
import { userPreferences } from './notification.routes';

export const preferencesRoutes = Router();

// GET /api/preferences/:userId - Get user preferences
preferencesRoutes.get('/:userId', (req, res) => {
  let prefs = userPreferences.get(req.params.userId);

  if (!prefs) {
    prefs = {
      userId: req.params.userId,
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
    userPreferences.set(req.params.userId, prefs);
  }

  res.json({ preferences: prefs });
});

// PUT /api/preferences/:userId - Update preferences
preferencesRoutes.put('/:userId', (req, res) => {
  let prefs = userPreferences.get(req.params.userId);

  if (!prefs) {
    prefs = {
      userId: req.params.userId,
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
  }

  const { email, phone, channels, quietHours, language } = req.body;

  if (email !== undefined) prefs.email = email;
  if (phone !== undefined) prefs.phone = phone;
  if (channels) prefs.channels = { ...prefs.channels, ...channels };
  if (quietHours) prefs.quietHours = quietHours;
  if (language) prefs.language = language;
  prefs.updatedAt = new Date();

  userPreferences.set(req.params.userId, prefs);

  console.log('Event: preferences.updated', { userId: req.params.userId });

  res.json({ preferences: prefs });
});

// POST /api/preferences/:userId/device - Register device token
preferencesRoutes.post('/:userId/device', (req, res) => {
  const { token, platform } = req.body;

  if (!token || !platform) {
    return res.status(400).json({ error: 'Token and platform are required', code: 'VALIDATION_ERROR' });
  }

  let prefs = userPreferences.get(req.params.userId);

  if (!prefs) {
    prefs = {
      userId: req.params.userId,
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
  }

  // Check if token already exists
  const existingIndex = prefs.deviceTokens.findIndex(d => d.token === token);

  if (existingIndex >= 0) {
    // Update existing
    prefs.deviceTokens[existingIndex] = { token, platform, addedAt: new Date() };
  } else {
    // Add new
    prefs.deviceTokens.push({ token, platform, addedAt: new Date() });
  }

  prefs.updatedAt = new Date();
  userPreferences.set(req.params.userId, prefs);

  console.log('Event: device.registered', { userId: req.params.userId, platform });

  res.json({
    success: true,
    deviceCount: prefs.deviceTokens.length
  });
});

// DELETE /api/preferences/:userId/device/:token - Unregister device
preferencesRoutes.delete('/:userId/device/:token', (req, res) => {
  const prefs = userPreferences.get(req.params.userId);

  if (!prefs) {
    return res.status(404).json({ error: 'User preferences not found', code: 'NOT_FOUND' });
  }

  const index = prefs.deviceTokens.findIndex(d => d.token === req.params.token);

  if (index >= 0) {
    prefs.deviceTokens.splice(index, 1);
    prefs.updatedAt = new Date();
    userPreferences.set(req.params.userId, prefs);
  }

  console.log('Event: device.unregistered', { userId: req.params.userId });

  res.json({ success: true, deviceCount: prefs.deviceTokens.length });
});

// PUT /api/preferences/:userId/channels - Update channel preferences
preferencesRoutes.put('/:userId/channels', (req, res) => {
  const { push, sms, email, whatsapp, in_app } = req.body;

  let prefs = userPreferences.get(req.params.userId);

  if (!prefs) {
    prefs = {
      userId: req.params.userId,
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
  }

  if (push !== undefined) prefs.channels.push = push;
  if (sms !== undefined) prefs.channels.sms = sms;
  if (email !== undefined) prefs.channels.email = email;
  if (whatsapp !== undefined) prefs.channels.whatsapp = whatsapp;
  if (in_app !== undefined) prefs.channels.in_app = in_app;
  prefs.updatedAt = new Date();

  userPreferences.set(req.params.userId, prefs);

  res.json({ channels: prefs.channels });
});

// PUT /api/preferences/:userId/quiet-hours - Set quiet hours
preferencesRoutes.put('/:userId/quiet-hours', (req, res) => {
  const { enabled, start, end } = req.body;

  let prefs = userPreferences.get(req.params.userId);

  if (!prefs) {
    prefs = {
      userId: req.params.userId,
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
  }

  prefs.quietHours = { enabled, start, end };
  prefs.updatedAt = new Date();

  userPreferences.set(req.params.userId, prefs);

  res.json({ quietHours: prefs.quietHours });
});

// DELETE /api/preferences/:userId - Reset preferences
preferencesRoutes.delete('/:userId', (req, res) => {
  userPreferences.delete(req.params.userId);

  res.json({ success: true, message: 'Preferences reset' });
});
