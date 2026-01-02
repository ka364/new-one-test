/**
 * Orders Service
 * خدمة الطلبات
 *
 * Business logic layer for order operations.
 * Separates business logic from router layer.
 */

import { requireDb } from '../db';
import { orders } from '../../drizzle/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { logger } from '../_core/logger';
import { isDuplicateKeyError } from '../_core/error-handler';
import {
  validateOrderWithArachnid,
  trackOrderLifecycle,
  getOrderInsights,
} from '../bio-modules/orders-bio-integration.js';
import { invalidateOrderCache } from '../_core/cache-manager';

// ============================================
// TYPES
// ============================================

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress?: string;
  notes?: string;
  createdBy: number;
}

export interface CreateOrderResult {
  success: boolean;
  orderId: number;
  orderIds: number[];
  orderNumber: string;
  orderNumbers: string[];
  validationResult?: {
    isValid: boolean;
    confidence: number;
    warnings: string[];
    anomalies: string[];
  };
}

export interface UpdateOrderStatusInput {
  orderId: number;
  status: string;
  updatedBy?: number;
}

export interface UpdatePaymentStatusInput {
  orderId: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  updatedBy?: number;
}

// ============================================
// ORDERS SERVICE
// ============================================

export class OrdersService {
  /**
   * Create a new order with batch insert optimization
   */
  static async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    // Input validation
    if (!input.items || input.items.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'يجب إضافة عنصر واحد على الأقل للطلب',
      });
    }

    // Validate customer phone format (Egyptian format)
    if (input.customerPhone && !/^01[0-9]{9}$/.test(input.customerPhone)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'رقم الهاتف غير صحيح. يجب أن يكون رقم مصري (01XXXXXXXXX)',
      });
    }

    // Calculate total amount
    const calculatedTotal = input.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Validate total amount matches
    if (Math.abs(calculatedTotal - input.totalAmount) > 0.01) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'إجمالي المبلغ غير متطابق مع العناصر',
      });
    }

    logger.info('Creating order', {
      customerName: input.customerName,
      itemCount: input.items.length,
      totalAmount: input.totalAmount,
    });

    const db = await requireDb();

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Prepare batch insert data
    const ordersToInsert = input.items.map((item) => ({
      orderNumber,
      customerName: input.customerName,
      customerEmail: input.customerEmail || null,
      customerPhone: input.customerPhone,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.price.toString(),
      totalAmount: input.totalAmount.toString(),
      currency: 'EGP',
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: input.shippingAddress || null,
      notes: input.notes || null,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Batch insert orders
    let insertedOrders;
    try {
      insertedOrders = await db.insert(orders).values(ordersToInsert).returning();
    } catch (dbError: unknown) {
      // Check for duplicate order number
      if (isDuplicateKeyError(dbError)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'رقم الطلب موجود مسبقاً. يرجى المحاولة مرة أخرى',
        });
      }
      // Re-throw to be handled by error handler
      throw dbError;
    }

    if (!insertedOrders || insertedOrders.length === 0) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في إنشاء الطلب. لم يتم إنشاء أي سجلات',
      });
    }

    const orderIds = insertedOrders.map((order) => order.id);
    const orderId = orderIds[0]!;

    // Validate order with Arachnid (Bio-Module) - with error handling
    let validationResult;
    try {
      validationResult = await validateOrderWithArachnid({
        orderId,
        orderNumber,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        totalAmount: input.totalAmount,
        itemCount: input.items.length,
      });
    } catch (bioError: unknown) {
      logger.warn('Bio-Module validation failed, continuing anyway', {
        error: bioError instanceof Error ? bioError.message : String(bioError),
        orderId,
      });
      // Continue even if Bio-Module validation fails
    }

    // Track order lifecycle - with error handling
    try {
      await trackOrderLifecycle(orderId, orderNumber, 'created');
    } catch (trackError: unknown) {
      logger.warn('Order lifecycle tracking failed', {
        error: trackError instanceof Error ? trackError.message : String(trackError),
        orderId,
      });
      // Continue even if tracking fails
    }

    // Invalidate cache
    await invalidateOrderCache({
      orderNumber,
      orderId,
    });

    logger.info('Order created successfully', {
      orderId,
      orderNumber,
      itemCount: input.items.length,
    });

    return {
      success: true,
      orderId,
      orderIds,
      orderNumber,
      orderNumbers: [orderNumber],
      validationResult,
    };
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: number) {
    if (!orderId || orderId <= 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'معرّف الطلب غير صحيح',
      });
    }

    const db = await requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'الطلب غير موجود',
      });
    }

    return order;
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(input: UpdateOrderStatusInput) {
    const db = await requireDb();

    // Get order to get orderNumber
    const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId));

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'الطلب غير موجود',
      });
    }

    // Update order status
    try {
      await db
        .update(orders)
        .set({
          status: input.status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, input.orderId));
    } catch (dbError: unknown) {
      // Re-throw to be handled by error handler
      throw dbError;
    }

    // Track order lifecycle - with error handling
    try {
      await trackOrderLifecycle(input.orderId, order.orderNumber, input.status);
    } catch (trackError: unknown) {
      logger.warn('Order lifecycle tracking failed', {
        error: trackError instanceof Error ? trackError.message : String(trackError),
        orderId: input.orderId,
      });
      // Continue even if tracking fails
    }

    // Invalidate cache
    await invalidateOrderCache({
      orderNumber: order.orderNumber,
      orderId: input.orderId,
    });

    logger.info('Order status updated successfully', {
      orderId: input.orderId,
      newStatus: input.status,
    });

    return {
      success: true,
      orderId: input.orderId,
      status: input.status,
    };
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(input: UpdatePaymentStatusInput) {
    const db = await requireDb();

    // Verify order exists first
    const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId));

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'الطلب غير موجود',
      });
    }

    // Update payment status
    try {
      await db
        .update(orders)
        .set({
          paymentStatus: input.paymentStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, input.orderId));
    } catch (dbError: unknown) {
      // Re-throw to be handled by error handler
      throw dbError;
    }

    // Track order lifecycle - with error handling
    try {
      await trackOrderLifecycle(input.orderId, order.orderNumber, `payment_${input.paymentStatus}`);
    } catch (trackError: unknown) {
      logger.warn('Order lifecycle tracking failed', {
        error: trackError instanceof Error ? trackError.message : String(trackError),
        orderId: input.orderId,
      });
      // Continue even if tracking fails
    }

    // Invalidate cache
    await invalidateOrderCache({
      orderNumber: order.orderNumber,
      orderId: input.orderId,
    });

    logger.info('Payment status updated successfully', {
      orderId: input.orderId,
      paymentStatus: input.paymentStatus,
    });

    return {
      success: true,
      orderId: input.orderId,
      paymentStatus: input.paymentStatus,
    };
  }

  /**
   * Get order insights (Bio-Module)
   */
  static async getOrderInsights(orderId: number) {
    const db = await requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'الطلب غير موجود',
      });
    }

    // Get insights from Bio-Module - with error handling
    try {
      return await getOrderInsights(orderId, order.orderNumber);
    } catch (bioError: unknown) {
      logger.warn('Bio-Module insights failed', {
        error: bioError instanceof Error ? bioError.message : String(bioError),
        orderId,
      });
      // Return fallback insights
      return {
        orderId,
        orderNumber: order.orderNumber,
        insights: [],
        recommendations: [],
        riskScore: 0.5,
      };
    }
  }
}

