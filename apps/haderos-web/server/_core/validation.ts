/**
 * Enhanced Input Validation using Zod
 * Comprehensive schemas for all API inputs
 */

import { z } from 'zod';

// ============================================
// COMMON SCHEMAS
// ============================================

export const emailSchema = z.string().email('Invalid email address').toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

export const urlSchema = z.string().url('Invalid URL');

export const uuidSchema = z.string().uuid('Invalid UUID');

export const dateSchema = z.coerce.date();

export const positiveIntSchema = z.number().int().positive();

export const nonNegativeIntSchema = z.number().int().nonnegative();

// ============================================
// USER AUTHENTICATION SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: phoneSchema.optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const newPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============================================
// EMPLOYEE SCHEMAS
// ============================================

export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  role: z.enum(['admin', 'manager', 'staff', 'warehouse', 'sales']),
  department: z.string().optional(),
  salary: positiveIntSchema.optional(),
  hireDate: dateSchema.optional(),
  address: z.string().optional(),
  nationalId: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// ============================================
// ORDER SCHEMAS
// ============================================

export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: positiveIntSchema,
  price: positiveIntSchema,
  discount: nonNegativeIntSchema.optional(),
});

export const createOrderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: phoneSchema,
  customerEmail: emailSchema.optional(),
  shippingAddress: z.string().min(5, 'Shipping address is required'),
  city: z.string().min(2, 'City is required'),
  governorate: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['cod', 'card', 'bank_transfer', 'wallet']),
  shippingMethod: z.enum(['standard', 'express', 'pickup']),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
  ]),
  notes: z.string().optional(),
});

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  price: positiveIntSchema,
  costPrice: positiveIntSchema.optional(),
  compareAtPrice: positiveIntSchema.optional(),
  quantity: nonNegativeIntSchema,
  minQuantity: nonNegativeIntSchema.optional(),
  maxQuantity: nonNegativeIntSchema.optional(),
  images: z.array(urlSchema).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ============================================
// SHIPMENT SCHEMAS
// ============================================

export const createShipmentSchema = z.object({
  orderId: z.string(),
  carrier: z.enum(['bosta', 'jnt', 'aramex', 'dhl', 'fedex', 'other']),
  trackingNumber: z.string().optional(),
  estimatedDelivery: dateSchema.optional(),
  shippingCost: nonNegativeIntSchema.optional(),
  notes: z.string().optional(),
});

export const updateShipmentSchema = z.object({
  shipmentId: z.string(),
  status: z.enum([
    'pending',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed',
    'returned',
  ]),
  trackingNumber: z.string().optional(),
  actualDelivery: dateSchema.optional(),
  notes: z.string().optional(),
});

// ============================================
// FINANCIAL SCHEMAS
// ============================================

export const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: positiveIntSchema,
  description: z.string().min(1, 'Description is required'),
  date: dateSchema,
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'cheque']).optional(),
  vendor: z.string().optional(),
  invoice: z.string().optional(),
  attachments: z.array(urlSchema).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  category: z.string().optional(),
  amount: positiveIntSchema,
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: dateSchema,
  endDate: dateSchema,
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// ============================================
// PAGINATION SCHEMA
// ============================================

export const paginationSchema = z.object({
  page: positiveIntSchema.optional().default(1),
  limit: positiveIntSchema.max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================
// SEARCH SCHEMA
// ============================================

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.record(z.any()).optional(),
  ...paginationSchema.shape,
});

// ============================================
// FILE UPLOAD SCHEMA
// ============================================

export const fileUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive().max(10 * 1024 * 1024, 'File size must not exceed 10MB'),
  fileType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ]),
});

// ============================================
// CAMPAIGN SCHEMA
// ============================================

export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['email', 'sms', 'push', 'social', 'multi-channel']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']).optional(),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  budget: positiveIntSchema.optional(),
  targetAudience: z.object({
    ageRange: z.tuple([nonNegativeIntSchema, nonNegativeIntSchema]).optional(),
    gender: z.enum(['male', 'female', 'all']).optional(),
    location: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
  content: z.object({
    subject: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    images: z.array(urlSchema).optional(),
  }).optional(),
}).refine((data) => !data.endDate || data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

/**
 * Validate data against schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Validate and throw on error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Format Zod errors for API response
 */
export function formatZodError(error: z.ZodError): Array<{
  field: string;
  message: string;
}> {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

// ============================================
// EXPORT ALL SCHEMAS
// ============================================

export const schemas = {
  // Auth
  login: loginSchema,
  register: registerSchema,
  resetPassword: resetPasswordSchema,
  newPassword: newPasswordSchema,

  // Employee
  createEmployee: createEmployeeSchema,
  updateEmployee: updateEmployeeSchema,

  // Order
  createOrder: createOrderSchema,
  updateOrderStatus: updateOrderStatusSchema,

  // Product
  createProduct: createProductSchema,
  updateProduct: updateProductSchema,

  // Shipment
  createShipment: createShipmentSchema,
  updateShipment: updateShipmentSchema,

  // Financial
  createExpense: createExpenseSchema,
  createBudget: createBudgetSchema,

  // Campaign
  createCampaign: createCampaignSchema,

  // Common
  pagination: paginationSchema,
  search: searchSchema,
  fileUpload: fileUploadSchema,
};

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

export default schemas;
