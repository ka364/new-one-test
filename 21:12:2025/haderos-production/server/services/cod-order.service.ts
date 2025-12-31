/**
 * COD Order Service
 * 
 * Handles creation and management of COD orders with:
 * - Strict TypeScript typing (no @ts-nocheck)
 * - Zod validation for all inputs
 * - Comprehensive error handling
 * - Structured logging
 * 
 * @module CODOrderService
 */

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { codOrders, type InsertCODOrder } from '../../drizzle/schema';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Egyptian phone number validation
 * Format: 01XXXXXXXXX (11 digits starting with 01)
 */
const egyptianPhoneSchema = z.string()
  .regex(/^01[0-2,5]\d{8}$/, 'رقم الهاتف يجب أن يكون بصيغة مصرية صحيحة (01XXXXXXXXX)');

/**
 * Shipping address validation schema
 */
const shippingAddressSchema = z.object({
  governorate: z.string().min(1, 'المحافظة مطلوبة'),
  governorateCode: z.string().min(1, 'كود المحافظة مطلوب'),
  city: z.string().min(1, 'المدينة مطلوبة'),
  center: z.string().min(1, 'المركز مطلوب'),
  centerCode: z.string().min(1, 'كود المركز مطلوب'),
  district: z.string().optional(),
  pointCode: z.string().optional(),
  pointName: z.string().optional(),
  street: z.string().min(1, 'الشارع مطلوب'),
  building: z.string().min(1, 'رقم المبنى مطلوب'),
  floor: z.string().min(1, 'الطابق مطلوب'),
  apartment: z.string().min(1, 'رقم الشقة مطلوب'),
  notes: z.string().optional(),
});

/**
 * Create COD order validation schema
 */
export const createCODOrderSchema = z.object({
  orderId: z.string().min(1).max(50, 'رقم الطلب يجب ألا يتجاوز 50 حرف'),
  customerName: z.string().min(2, 'اسم العميل يجب أن يكون حرفين على الأقل').max(255),
  customerPhone: egyptianPhoneSchema,
  customerEmail: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  shippingAddress: shippingAddressSchema,
  orderAmount: z.number().positive('قيمة الطلب يجب أن تكون موجبة'),
  codAmount: z.number().positive('قيمة الدفع عند الاستلام يجب أن تكون موجبة'),
}).refine(
  (data) => data.codAmount <= data.orderAmount,
  {
    message: 'قيمة الدفع عند الاستلام يجب ألا تتجاوز قيمة الطلب',
    path: ['codAmount'],
  }
);

/**
 * Update COD order validation schema
 */
export const updateCODOrderSchema = z.object({
  customerName: z.string().min(2).max(255).optional(),
  customerPhone: egyptianPhoneSchema.optional(),
  customerEmail: z.string().email().optional(),
  shippingAddress: shippingAddressSchema.optional(),
  orderAmount: z.number().positive().optional(),
  codAmount: z.number().positive().optional(),
  trackingNumber: z.string().max(100).optional(),
  shippingCompany: z.string().max(100).optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateCODOrderInput = z.infer<typeof createCODOrderSchema>;
export type UpdateCODOrderInput = z.infer<typeof updateCODOrderSchema>;

/**
 * Custom error class for COD order operations
 */
export class CODOrderError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CODOrderError';
  }
}

/**
 * Order not found error
 */
export class OrderNotFoundError extends CODOrderError {
  constructor(orderId: string) {
    super(
      `الطلب غير موجود: ${orderId}`,
      'ORDER_NOT_FOUND',
      { orderId }
    );
    this.name = 'OrderNotFoundError';
  }
}

/**
 * Duplicate order error
 */
export class DuplicateOrderError extends CODOrderError {
  constructor(orderId: string) {
    super(
      `الطلب موجود بالفعل: ${orderId}`,
      'DUPLICATE_ORDER',
      { orderId }
    );
    this.name = 'DuplicateOrderError';
  }
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class CODOrderService {
  /**
   * Create a new COD order
   */
  async createOrder(input: unknown) {
    try {
      const validated = createCODOrderSchema.parse(input);

      const db = await getDb();
      if (!db) {
        throw new CODOrderError(
          'قاعدة البيانات غير متاحة',
          'DATABASE_UNAVAILABLE'
        );
      }

      const existing = await db
        .select()
        .from(codOrders)
        .where(eq(codOrders.orderId, validated.orderId))
        .limit(1);

      if (existing.length > 0) {
        throw new DuplicateOrderError(validated.orderId);
      }

      const orderData: InsertCODOrder = {
        orderId: validated.orderId,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        customerEmail: validated.customerEmail || null,
        shippingAddress: validated.shippingAddress,
        orderAmount: validated.orderAmount.toString(),
        codAmount: validated.codAmount.toString(),
        currentStage: 'pending',
        stages: {},
        notifications: [],
        status: 'pending',
      };

      const [result] = await db.insert(codOrders).values(orderData);

      console.log('[CODOrderService] Order created', {
        orderId: validated.orderId,
        insertId: result.insertId,
      });

      return {
        success: true,
        orderId: validated.orderId,
        id: Number(result.insertId),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new CODOrderError(
          'بيانات الطلب غير صحيحة',
          'VALIDATION_ERROR',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Get COD order by ID
   */
  async getOrder(orderId: string) {
    const db = await getDb();
    if (!db) {
      throw new CODOrderError(
        'قاعدة البيانات غير متاحة',
        'DATABASE_UNAVAILABLE'
      );
    }

    const [order] = await db
      .select()
      .from(codOrders)
      .where(eq(codOrders.orderId, orderId))
      .limit(1);

    return order || null;
  }

  /**
   * Update COD order
   */
  async updateOrder(orderId: string, input: unknown) {
    try {
      const validated = updateCODOrderSchema.parse(input);

      const db = await getDb();
      if (!db) {
        throw new CODOrderError(
          'قاعدة البيانات غير متاحة',
          'DATABASE_UNAVAILABLE'
        );
      }

      const existing = await this.getOrder(orderId);
      if (!existing) {
        throw new OrderNotFoundError(orderId);
      }

      const updateData: Partial<InsertCODOrder> = {};

      if (validated.customerName) updateData.customerName = validated.customerName;
      if (validated.customerPhone) updateData.customerPhone = validated.customerPhone;
      if (validated.customerEmail !== undefined) updateData.customerEmail = validated.customerEmail || null;
      if (validated.shippingAddress) updateData.shippingAddress = validated.shippingAddress;
      if (validated.orderAmount) updateData.orderAmount = validated.orderAmount.toString();
      if (validated.codAmount) updateData.codAmount = validated.codAmount.toString();
      if (validated.trackingNumber !== undefined) updateData.trackingNumber = validated.trackingNumber || null;
      if (validated.shippingCompany !== undefined) updateData.shippingCompany = validated.shippingCompany || null;

      await db
        .update(codOrders)
        .set(updateData)
        .where(eq(codOrders.orderId, orderId));

      console.log('[CODOrderService] Order updated', {
        orderId,
        updatedFields: Object.keys(updateData),
      });

      return await this.getOrder(orderId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new CODOrderError(
          'بيانات التحديث غير صحيحة',
          'VALIDATION_ERROR',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Delete COD order (soft delete)
   */
  async deleteOrder(orderId: string) {
    const db = await getDb();
    if (!db) {
      throw new CODOrderError(
        'قاعدة البيانات غير متاحة',
        'DATABASE_UNAVAILABLE'
      );
    }

    const existing = await this.getOrder(orderId);
    if (!existing) {
      throw new OrderNotFoundError(orderId);
    }

    await db
      .update(codOrders)
      .set({ status: 'cancelled' })
      .where(eq(codOrders.orderId, orderId));

    console.log('[CODOrderService] Order deleted (cancelled)', {
      orderId,
    });

    return { success: true };
  }

  /**
   * List COD orders with pagination
   */
  async listOrders(options: { limit?: number; offset?: number } = {}) {
    const { limit = 50, offset = 0 } = options;

    const db = await getDb();
    if (!db) {
      throw new CODOrderError(
        'قاعدة البيانات غير متاحة',
        'DATABASE_UNAVAILABLE'
      );
    }

    const orders = await db
      .select()
      .from(codOrders)
      .limit(limit)
      .offset(offset);

    return orders;
  }
}

// Export singleton instance
export const codOrderService = new CODOrderService();
