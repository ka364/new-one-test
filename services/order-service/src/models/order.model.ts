/**
 * Order Model
 */

import { z } from 'zod';

export const OrderStatus = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned'
]);

export const PaymentStatus = z.enum([
  'pending',
  'paid',
  'failed',
  'refunded',
  'partial_refund'
]);

export const DeliveryMethod = z.enum([
  'home_delivery',
  'locker_pickup',
  'store_pickup'
]);

export const OrderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
  total: z.number().positive()
});

export const ShippingAddressSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  governorate: z.string(),
  city: z.string(),
  district: z.string().optional(),
  streetAddress: z.string(),
  buildingNumber: z.string().optional(),
  floorNumber: z.string().optional(),
  apartmentNumber: z.string().optional(),
  landmark: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),

  // Customer
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().optional(),

  // Items
  items: z.array(OrderItemSchema),

  // Totals
  subtotal: z.number().positive(),
  discount: z.number().min(0).default(0),
  shippingFee: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().positive(),
  currency: z.string().default('EGP'),

  // Delivery
  deliveryMethod: DeliveryMethod,
  shippingAddress: ShippingAddressSchema.optional(),
  lockerId: z.string().optional(),
  storeId: z.string().optional(),

  // Payment
  paymentMethod: z.string(),
  paymentStatus: PaymentStatus.default('pending'),
  paymentReference: z.string().optional(),

  // Status
  status: OrderStatus.default('pending'),
  statusHistory: z.array(z.object({
    status: OrderStatus,
    timestamp: z.date(),
    note: z.string().optional()
  })).default([]),

  // Notes
  customerNote: z.string().optional(),
  internalNote: z.string().optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  confirmedAt: z.date().optional(),
  shippedAt: z.date().optional(),
  deliveredAt: z.date().optional()
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;

// Input schemas
export const CreateOrderInput = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  })),
  deliveryMethod: DeliveryMethod,
  shippingAddress: ShippingAddressSchema.optional(),
  lockerId: z.string().optional(),
  paymentMethod: z.string(),
  customerNote: z.string().optional()
});

export const UpdateOrderStatusInput = z.object({
  status: OrderStatus,
  note: z.string().optional()
});
