/**
 * Delivery Model
 * Smart Matching & Real-time Tracking
 */

import { z } from 'zod';

// Location schema
export const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
  addressAr: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional()
});

export type Location = z.infer<typeof LocationSchema>;

// Driver status
export const DriverStatus = z.enum([
  'available',
  'busy',
  'offline',
  'on_break'
]);

// Driver schema
export const DriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameAr: z.string().optional(),
  phone: z.string(),
  email: z.string().email().optional(),

  // Vehicle info
  vehicleType: z.enum(['motorcycle', 'car', 'van', 'truck', 'bicycle']),
  vehiclePlate: z.string().optional(),

  // Status & Location
  status: DriverStatus.default('offline'),
  currentLocation: LocationSchema.optional(),
  lastLocationUpdate: z.date().optional(),

  // Capacity
  maxWeight: z.number().positive().optional(), // kg
  maxVolume: z.number().positive().optional(), // m³

  // Performance
  rating: z.number().min(0).max(5).default(5),
  totalDeliveries: z.number().int().min(0).default(0),
  completionRate: z.number().min(0).max(100).default(100),

  // Settings
  preferredZones: z.array(z.string()).default([]),
  workingHours: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Driver = z.infer<typeof DriverSchema>;

// Delivery status
export const DeliveryStatus = z.enum([
  'pending',
  'assigned',
  'picked_up',
  'in_transit',
  'arrived',
  'delivered',
  'failed',
  'cancelled',
  'returned'
]);

// Delivery schema
export const DeliverySchema = z.object({
  id: z.string(),
  orderId: z.string(),

  // Customer info
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),

  // Locations
  pickupLocation: LocationSchema,
  deliveryLocation: LocationSchema,

  // Driver
  driverId: z.string().optional(),
  driverName: z.string().optional(),

  // Status & Tracking
  status: DeliveryStatus.default('pending'),
  currentLocation: LocationSchema.optional(),

  // Timing
  scheduledPickup: z.date().optional(),
  scheduledDelivery: z.date().optional(),
  actualPickup: z.date().optional(),
  actualDelivery: z.date().optional(),
  estimatedArrival: z.date().optional(),

  // Package info
  packageWeight: z.number().positive().optional(),
  packageVolume: z.number().positive().optional(),
  packageDescription: z.string().optional(),
  specialInstructions: z.string().optional(),

  // Payment
  deliveryFee: z.number().min(0).default(0),
  codAmount: z.number().min(0).default(0), // Cash on Delivery
  isPaid: z.boolean().default(false),

  // Proof
  proofOfDelivery: z.object({
    signature: z.string().optional(),
    photo: z.string().optional(),
    notes: z.string().optional(),
    receiverName: z.string().optional()
  }).optional(),

  // Tracking history
  trackingHistory: z.array(z.object({
    status: DeliveryStatus,
    location: LocationSchema.optional(),
    timestamp: z.date(),
    notes: z.string().optional()
  })).default([]),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Delivery = z.infer<typeof DeliverySchema>;

// Input schemas
export const CreateDriverInput = z.object({
  name: z.string(),
  nameAr: z.string().optional(),
  phone: z.string(),
  email: z.string().email().optional(),
  vehicleType: z.enum(['motorcycle', 'car', 'van', 'truck', 'bicycle']),
  vehiclePlate: z.string().optional(),
  maxWeight: z.number().positive().optional(),
  maxVolume: z.number().positive().optional(),
  preferredZones: z.array(z.string()).optional()
});

export const CreateDeliveryInput = z.object({
  orderId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  pickupLocation: LocationSchema,
  deliveryLocation: LocationSchema,
  scheduledPickup: z.string().or(z.date()).optional(),
  scheduledDelivery: z.string().or(z.date()).optional(),
  packageWeight: z.number().positive().optional(),
  packageVolume: z.number().positive().optional(),
  packageDescription: z.string().optional(),
  specialInstructions: z.string().optional(),
  deliveryFee: z.number().min(0).optional(),
  codAmount: z.number().min(0).optional()
});

export const UpdateLocationInput = z.object({
  lat: z.number(),
  lng: z.number()
});

export const UpdateStatusInput = z.object({
  status: DeliveryStatus,
  notes: z.string().optional(),
  location: LocationSchema.optional()
});
