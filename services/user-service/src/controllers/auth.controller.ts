/**
 * Auth Controller
 * Handles authentication operations
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginInput, VerifyOtpInput } from '../models/user.model';

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'haderos-jwt-secret-key-2025';
const JWT_EXPIRES_IN = '7d';

// In-memory user store reference (shared with user controller)
const users = new Map<string, any>();

// Session store
const sessions = new Map<string, { userId: string; createdAt: Date; expiresAt: Date }>();

export const authController = {
  /**
   * Login with phone and password
   * POST /api/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      const input = LoginInput.parse(req.body);

      // Find user by phone
      const user = Array.from(users.values()).find(u => u.phone === input.phone);

      if (!user) {
        return res.status(401).json({
          error: 'Invalid phone number or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid phone number or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if phone is verified
      if (!user.isPhoneVerified) {
        return res.status(403).json({
          error: 'Phone number not verified',
          code: 'PHONE_NOT_VERIFIED'
        });
      }

      // Check user status
      if (user.status === 'suspended' || user.status === 'banned') {
        return res.status(403).json({
          error: `Account is ${user.status}`,
          code: 'ACCOUNT_DISABLED'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          phone: user.phone,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Create session
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, {
        userId: user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // Update last login
      user.lastLoginAt = new Date();
      users.set(user.id, user);

      // Return token and user data
      const { passwordHash, otpCode, ...safeUser } = user;
      res.json({
        token,
        sessionId,
        user: safeUser,
        expiresIn: JWT_EXPIRES_IN
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
  },

  /**
   * Verify OTP
   * POST /api/auth/verify
   */
  async verifyOtp(req: Request, res: Response) {
    try {
      const input = VerifyOtpInput.parse(req.body);

      // Find user by phone
      const user = Array.from(users.values()).find(u => u.phone === input.phone);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check OTP
      if (user.otpCode !== input.otp) {
        return res.status(400).json({
          error: 'Invalid OTP',
          code: 'INVALID_OTP'
        });
      }

      // Check OTP expiration
      if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
        return res.status(400).json({
          error: 'OTP has expired',
          code: 'OTP_EXPIRED'
        });
      }

      // Mark phone as verified and activate user
      user.isPhoneVerified = true;
      user.status = 'active';
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      user.updatedAt = new Date();
      users.set(user.id, user);

      // Generate token for auto-login
      const token = jwt.sign(
        {
          userId: user.id,
          phone: user.phone,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { passwordHash, ...safeUser } = user;
      res.json({
        message: 'Phone verified successfully',
        token,
        user: safeUser
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
  },

  /**
   * Resend OTP
   * POST /api/auth/resend-otp
   */
  async resendOtp(req: Request, res: Response) {
    try {
      const { phone } = req.body;

      const user = Array.from(users.values()).find(u => u.phone === phone);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      users.set(user.id, user);

      // TODO: Send OTP via Notification Service

      res.json({
        message: 'OTP sent successfully',
        expiresIn: '10 minutes'
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;

      if (sessionId && sessions.has(sessionId)) {
        sessions.delete(sessionId);
      }

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      // Verify current token
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Generate new token
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          phone: decoded.phone,
          role: decoded.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        token: newToken,
        expiresIn: JWT_EXPIRES_IN
      });
    } catch (error: any) {
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  }
};
