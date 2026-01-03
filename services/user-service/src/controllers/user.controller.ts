/**
 * User Controller
 * Handles user CRUD operations
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { CreateUserInput, UpdateUserInput, User } from '../models/user.model';

// In-memory store (replace with database in production)
const users = new Map<string, User & { passwordHash: string }>();

export const userController = {
  /**
   * Register a new user
   * POST /api/users/register
   */
  async register(req: Request, res: Response) {
    try {
      const input = CreateUserInput.parse(req.body);

      // Check if phone already exists
      const existingUser = Array.from(users.values()).find(u => u.phone === input.phone);
      if (existingUser) {
        return res.status(409).json({
          error: 'Phone number already registered',
          code: 'PHONE_EXISTS'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Generate OTP for phone verification
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Create user
      const user: User & { passwordHash: string } = {
        id: nanoid(),
        phone: input.phone,
        email: input.email,
        fullNameEn: input.fullNameEn,
        fullNameAr: input.fullNameAr,
        isPhoneVerified: false,
        isEmailVerified: false,
        otpCode,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        role: 'user',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHash
      };

      users.set(user.id, user);

      // TODO: Send OTP via SMS/WhatsApp using Notification Service

      // Return user without sensitive data
      const { passwordHash: _, otpCode: __, ...safeUser } = user;
      res.status(201).json({
        user: safeUser,
        message: 'Registration successful. Please verify your phone number.',
        otpSent: true
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
  },

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = users.get(id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const { passwordHash, otpCode, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * Update user
   * PUT /api/users/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const input = UpdateUserInput.parse(req.body);

      const user = users.get(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Update user
      const updatedUser = {
        ...user,
        ...input,
        updatedAt: new Date()
      };

      users.set(id, updatedUser);

      const { passwordHash, otpCode, ...safeUser } = updatedUser;
      res.json({ user: safeUser });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
  },

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!users.has(id)) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      users.delete(id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * List all users (admin only)
   * GET /api/users
   */
  async list(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, role, status } = req.query;

      let userList = Array.from(users.values());

      // Filter by role
      if (role) {
        userList = userList.filter(u => u.role === role);
      }

      // Filter by status
      if (status) {
        userList = userList.filter(u => u.status === status);
      }

      // Pagination
      const start = (Number(page) - 1) * Number(limit);
      const paginated = userList.slice(start, start + Number(limit));

      // Remove sensitive data
      const safeUsers = paginated.map(({ passwordHash, otpCode, ...u }) => u);

      res.json({
        users: safeUsers,
        total: userList.length,
        page: Number(page),
        totalPages: Math.ceil(userList.length / Number(limit))
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  }
};
