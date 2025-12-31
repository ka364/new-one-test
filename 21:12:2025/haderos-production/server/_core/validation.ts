/**
 * Validation Module - Type-Safe Validation with Zod
 * 
 * This module provides comprehensive validation schemas for:
 * - User data
 * - Company data
 * - 7x7 Expansion data
 * - Expense data
 * - Authentication data
 * - API requests
 * 
 * @module validation
 * @version 1.0.0
 */

import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const idSchema = z.string().min(1, 'ID is required');

export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format'
);

export const urlSchema = z.string().url('Invalid URL format');

export const dateSchema = z.string().datetime('Invalid date format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const userSchema = z.object({
  id: idSchema.optional(),
  openId: z.string().min(1, 'OpenID is required'),
  name: z.string().min(1, 'Name is required').max(255).nullable(),
  email: emailSchema.nullable(),
  loginMethod: z.enum(['google', 'github', 'microsoft', 'anonymous']),
  lastSignedIn: dateSchema.optional(),
  createdAt: dateSchema.optional(),
});

export const updateUserSchema = userSchema.partial().omit({ id: true, openId: true });

// ============================================================================
// COMPANY SCHEMAS
// ============================================================================

export const companySchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(1, 'Company name is required').max(255),
  industry: z.string().min(1, 'Industry is required').max(100),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()),
  website: urlSchema.optional(),
  description: z.string().max(1000).optional(),
  ownerId: idSchema,
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
});

export const createCompanySchema = companySchema.omit({ id: true, createdAt: true, updatedAt: true });

export const updateCompanySchema = companySchema.partial().omit({ id: true, ownerId: true });

// ============================================================================
// 7X7 EXPANSION SCHEMAS
// ============================================================================

export const expansionLevelSchema = z.number().int().min(1).max(7);

export const expansionPhaseSchema = z.number().int().min(1).max(7);

export const expansionStatusSchema = z.enum([
  'planning',
  'active',
  'completed',
  'on-hold',
  'cancelled',
]);

export const expansionSchema = z.object({
  id: idSchema.optional(),
  companyId: idSchema,
  level: expansionLevelSchema,
  phase: expansionPhaseSchema,
  name: z.string().min(1, 'Expansion name is required').max(255),
  description: z.string().max(2000).optional(),
  targetMarket: z.string().min(1, 'Target market is required').max(255),
  budget: z.number().positive('Budget must be positive'),
  actualSpent: z.number().nonnegative('Actual spent cannot be negative').default(0),
  startDate: dateSchema,
  targetDate: dateSchema,
  completionDate: dateSchema.optional(),
  status: expansionStatusSchema.default('planning'),
  path: z.string().optional(), // ltree path
  parentId: idSchema.optional(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
});

export const createExpansionSchema = expansionSchema.omit({
  id: true,
  path: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExpansionSchema = expansionSchema
  .partial()
  .omit({ id: true, companyId: true, level: true, phase: true, path: true });

export const expansionQuerySchema = z.object({
  companyId: idSchema.optional(),
  level: expansionLevelSchema.optional(),
  phase: expansionPhaseSchema.optional(),
  status: expansionStatusSchema.optional(),
  ...paginationSchema.shape,
});

// ============================================================================
// EXPENSE SCHEMAS
// ============================================================================

export const expenseCategorySchema = z.enum([
  'marketing',
  'operations',
  'salaries',
  'equipment',
  'travel',
  'utilities',
  'rent',
  'software',
  'other',
]);

export const expenseStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'paid',
]);

export const expenseSchema = z.object({
  id: idSchema.optional(),
  companyId: idSchema,
  expansionId: idSchema.optional(),
  category: expenseCategorySchema,
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., USD)').default('USD'),
  description: z.string().min(1, 'Description is required').max(500),
  date: dateSchema,
  status: expenseStatusSchema.default('pending'),
  approvedBy: idSchema.optional(),
  approvedAt: dateSchema.optional(),
  rejectionReason: z.string().max(500).optional(),
  receiptUrl: urlSchema.optional(),
  createdBy: idSchema,
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
});

export const createExpenseSchema = expenseSchema.omit({
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExpenseSchema = expenseSchema
  .partial()
  .omit({ id: true, companyId: true, createdBy: true });

export const approveExpenseSchema = z.object({
  approvedBy: idSchema,
  comments: z.string().max(500).optional(),
});

export const rejectExpenseSchema = z.object({
  rejectedBy: idSchema,
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export const expenseQuerySchema = z.object({
  companyId: idSchema.optional(),
  expansionId: idSchema.optional(),
  category: expenseCategorySchema.optional(),
  status: expenseStatusSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  ...paginationSchema.shape,
});

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// ============================================================================
// 2FA SCHEMAS
// ============================================================================

export const enable2FASchema = z.object({
  userId: idSchema,
  token: z.string().length(6, 'Token must be 6 digits'),
});

export const verify2FASchema = z.object({
  userId: idSchema,
  token: z.string().length(6, 'Token must be 6 digits'),
});

export const disable2FASchema = z.object({
  userId: idSchema,
  password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: z.ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const validated = schema.parse(data);
      
      // Replace request data with validated data
      (req as any)[target] = validated;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return res.status(500).json({
        error: 'Internal server error during validation',
      });
    }
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateSync<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  return schema.parseAsync(data);
}

export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = z.infer<typeof userSchema>;
export type Company = z.infer<typeof companySchema>;
export type Expansion = z.infer<typeof expansionSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;
export type ExpenseStatus = z.infer<typeof expenseStatusSchema>;
export type ExpansionStatus = z.infer<typeof expansionStatusSchema>;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Common
  idSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  dateSchema,
  paginationSchema,
  
  // User
  userSchema,
  updateUserSchema,
  
  // Company
  companySchema,
  createCompanySchema,
  updateCompanySchema,
  
  // Expansion
  expansionSchema,
  createExpansionSchema,
  updateExpansionSchema,
  expansionQuerySchema,
  expansionLevelSchema,
  expansionPhaseSchema,
  expansionStatusSchema,
  
  // Expense
  expenseSchema,
  createExpenseSchema,
  updateExpenseSchema,
  approveExpenseSchema,
  rejectExpenseSchema,
  expenseQuerySchema,
  expenseCategorySchema,
  expenseStatusSchema,
  
  // Authentication
  loginSchema,
  registerSchema,
  changePasswordSchema,
  resetPasswordSchema,
  
  // 2FA
  enable2FASchema,
  verify2FASchema,
  disable2FASchema,
  
  // Middleware & Helpers
  validate,
  validateSync,
  validateAsync,
  validateSafe,
};
