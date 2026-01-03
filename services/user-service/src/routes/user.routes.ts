/**
 * User Routes
 */

import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const userRoutes = Router();

// Public routes
userRoutes.post('/register', userController.register);

// Protected routes (require authentication)
userRoutes.get('/', authMiddleware, userController.list);
userRoutes.get('/:id', authMiddleware, userController.getById);
userRoutes.put('/:id', authMiddleware, userController.update);
userRoutes.delete('/:id', authMiddleware, userController.delete);
