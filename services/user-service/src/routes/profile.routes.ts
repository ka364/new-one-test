/**
 * Profile Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

export const profileRoutes = Router();

// All profile routes require authentication
profileRoutes.use(authMiddleware);

// Get current user profile
profileRoutes.get('/', (req, res) => {
  res.json({ user: (req as any).user });
});

// Update profile
profileRoutes.put('/', (req, res) => {
  // TODO: Implement profile update
  res.json({ message: 'Profile update endpoint' });
});

// Change password
profileRoutes.post('/change-password', (req, res) => {
  // TODO: Implement password change
  res.json({ message: 'Change password endpoint' });
});
