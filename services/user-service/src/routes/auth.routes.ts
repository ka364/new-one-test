/**
 * Auth Routes
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

export const authRoutes = Router();

// All auth routes are public
authRoutes.post('/login', authController.login);
authRoutes.post('/verify', authController.verifyOtp);
authRoutes.post('/resend-otp', authController.resendOtp);
authRoutes.post('/logout', authController.logout);
authRoutes.post('/refresh', authController.refreshToken);
