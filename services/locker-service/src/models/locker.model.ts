/**
 * Locker Model
 * Smart Locker Management System
 */

import { z } from 'zod';

// Locker sizes
export const LockerSize = z.enum(['small', 'medium', 'large', 'extra_large']);

// Locker status
export const LockerStatus = z.enum([
  'available',
  'reserved',
  'occupied',
  'maintenance',
  'disabled'
]);

// Locker Location schema
export const LockerLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameAr: z.string(),

  // Address
  address: z.string(),
  addressAr: z.string(),
  city: z.string(),
  district: z.string().optional(),

  // Coordinates
  lat: z.number(),
  lng: z.number(),

  // Operating hours
  operatingHours: z.object({
    open: z.string(), // "06:00"
    close: z.string(), // "23:00"
    is24Hours: z.boolean().default(false)
  }),

  // Capacity
  totalLockers: z.number().int().positive(),
  availableLockers: z.number().int().min(0),

  // Features
  hasParking: z.boolean().default(false),
  isAccessible: z.boolean().default(true),
  hasCamera: z.boolean().default(true),

  // Status
  isActive: z.boolean().default(true),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type LockerLocation = z.infer<typeof LockerLocationSchema>;

// Individual Locker schema
export const LockerSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  lockerNumber: z.string(), // e.g., "A-01", "B-15"

  // Size & dimensions
  size: LockerSize,
  width: z.number().positive().optional(), // cm
  height: z.number().positive().optional(),
  depth: z.number().positive().optional(),

  // Status
  status: LockerStatus.default('available'),

  // Current booking
  currentBookingId: z.string().optional(),

  // Pricing
  pricePerDay: z.number().min(0).default(0),
  pricePerHour: z.number().min(0).optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Locker = z.infer<typeof LockerSchema>;

// Booking status
export const BookingStatus = z.enum([
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'expired'
]);

// Booking schema
export const BookingSchema = z.object({
  id: z.string(),
  lockerId: z.string(),
  locationId: z.string(),
  lockerNumber: z.string(),

  // User info
  userId: z.string(),
  userName: z.string(),
  userPhone: z.string(),

  // Order info
  orderId: z.string().optional(),
  deliveryId: z.string().optional(),

  // Access
  accessCode: z.string(), // 6-digit PIN
  qrCode: z.string().optional(),

  // Status
  status: BookingStatus.default('pending'),

  // Timing
  startTime: z.date(),
  endTime: z.date(),
  actualPickupTime: z.date().optional(),

  // Package info
  packageDescription: z.string().optional(),

  // Pricing
  totalPrice: z.number().min(0).default(0),
  isPaid: z.boolean().default(false),

  // Notifications
  notificationsSent: z.array(z.object({
    type: z.string(),
    sentAt: z.date()
  })).default([]),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Booking = z.infer<typeof BookingSchema>;

// Input schemas
export const CreateLocationInput = z.object({
  name: z.string(),
  nameAr: z.string(),
  address: z.string(),
  addressAr: z.string(),
  city: z.string(),
  district: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  operatingHours: z.object({
    open: z.string(),
    close: z.string(),
    is24Hours: z.boolean().optional()
  }),
  hasParking: z.boolean().optional(),
  isAccessible: z.boolean().optional()
});

export const CreateLockerInput = z.object({
  locationId: z.string(),
  lockerNumber: z.string(),
  size: LockerSize,
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  pricePerDay: z.number().min(0)
});

export const CreateBookingInput = z.object({
  locationId: z.string(),
  lockerId: z.string().optional(), // Auto-assign if not specified
  size: LockerSize.optional(),
  userId: z.string(),
  userName: z.string(),
  userPhone: z.string(),
  orderId: z.string().optional(),
  deliveryId: z.string().optional(),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  packageDescription: z.string().optional()
});
