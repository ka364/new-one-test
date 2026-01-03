/**
 * User Model - Database Schema
 * Based on MongoDB-style schema from README
 */

import { z } from 'zod';

// User roles
export const UserRole = z.enum([
  'user',
  'driver',
  'community_leader',
  'merchant',
  'admin',
  'super_admin'
]);

// User status
export const UserStatus = z.enum([
  'pending',
  'active',
  'suspended',
  'banned'
]);

// User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  email: z.string().email().optional(),

  // Names
  fullNameEn: z.string().min(2).max(100),
  fullNameAr: z.string().min(2).max(100).optional(),

  // Verification
  isPhoneVerified: z.boolean().default(false),
  isEmailVerified: z.boolean().default(false),
  otpCode: z.string().optional(),
  otpExpiresAt: z.date().optional(),

  // Location
  location: z.object({
    governorate: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    streetAddress: z.string().optional(),
    buildingNumber: z.string().optional(),
    floorNumber: z.string().optional(),
    apartmentNumber: z.string().optional(),
    landmark: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }).optional(),

  // Preferences
  preferences: z.object({
    language: z.enum(['ar', 'en']).default('ar'),
    notificationChannels: z.array(z.enum(['sms', 'whatsapp', 'email', 'push'])).default(['sms', 'whatsapp'])
  }).optional(),

  // Role and status
  role: UserRole.default('user'),
  status: UserStatus.default('pending'),

  // Statistics
  statistics: z.object({
    totalOrders: z.number().default(0),
    totalSpent: z.number().default(0),
    averageOrderValue: z.number().default(0),
    lastOrderDate: z.date().optional()
  }).optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastLoginAt: z.date().optional()
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRole>;
export type UserStatus = z.infer<typeof UserStatus>;

// Input schemas for API
export const CreateUserInput = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  email: z.string().email().optional(),
  fullNameEn: z.string().min(2).max(100),
  fullNameAr: z.string().min(2).max(100).optional(),
  password: z.string().min(8)
});

export const UpdateUserInput = z.object({
  email: z.string().email().optional(),
  fullNameEn: z.string().min(2).max(100).optional(),
  fullNameAr: z.string().min(2).max(100).optional(),
  location: UserSchema.shape.location.optional(),
  preferences: UserSchema.shape.preferences.optional()
});

export const LoginInput = z.object({
  phone: z.string(),
  password: z.string()
});

export const VerifyOtpInput = z.object({
  phone: z.string(),
  otp: z.string().length(6)
});
