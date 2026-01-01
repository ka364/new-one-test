import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { requireDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import {
  validateOrderWithArachnid,
  trackOrderLifecycle,
  getOrderInsights
} from "../bio-modules/orders-bio-integration.js";
import { schemas } from "../_core/validation";
import { cache } from "../_core/cache";
import { logger } from "../_core/logger";

export const ordersRouter = router({
  // Create new order
  createOrder: publicProcedure
    .input(schemas.createOrder)
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      
      try {
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
          (sum, item) => sum + (item.price * item.quantity),
          0
        );

        // Validate total amount matches
        if (Math.abs(calculatedTotal - input.totalAmount) > 0.01) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'إجمالي المبلغ غير متطابق مع العناصر',
          });
        }

        logger.info('Creating new order', {
          customerName: input.customerName,
          itemCount: input.items.length,
          totalAmount: calculatedTotal,
        });

        const db = await requireDb();
        
        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // Get user ID (default to 1 if not authenticated)
        const userId = ctx.user?.id || 1;

        // Prepare batch insert data (instead of loop)
        const now = new Date().toISOString();
        const orderValues = input.items.map((item, index) => {
          // Validate item data
          if (item.quantity <= 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `الكمية يجب أن تكون أكبر من صفر للعنصر ${index + 1}`,
            });
          }

          if (item.price <= 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `السعر يجب أن يكون أكبر من صفر للعنصر ${index + 1}`,
            });
          }

          const itemDescription = [
            item.size ? `المقاس: ${item.size}` : null,
            item.color ? `اللون: ${item.color}` : null,
          ]
            .filter(Boolean)
            .join(", ");

          return {
            orderNumber: `${orderNumber}-${index + 1}`,
            customerName: input.customerName,
            customerEmail: input.customerEmail || null,
            customerPhone: input.customerPhone || null,
            productName: item.productName,
            productDescription: itemDescription || null,
            quantity: item.quantity,
            unitPrice: item.price.toString(),
            totalAmount: (item.price * item.quantity).toString(),
            currency: "EGP",
            status: "pending",
            paymentStatus: "pending",
            shippingAddress: input.shippingAddress,
            notes: input.notes || null,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
          };
        });

        // Batch insert all orders at once (much faster!)
        let insertedOrders;
        try {
          insertedOrders = await db
            .insert(orders)
            .values(orderValues)
            .returning();
        } catch (dbError: any) {
          logger.error('Database insert failed', dbError, {
            orderNumber,
            itemCount: input.items.length,
          });
          
          // Check for duplicate order number
          if (dbError.code === '23505' || dbError.message?.includes('duplicate')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'رقم الطلب موجود مسبقاً. يرجى المحاولة مرة أخرى',
            });
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في إنشاء الطلب. يرجى المحاولة مرة أخرى',
            cause: dbError,
          });
        }

        // Extract order IDs
        const orderIds = insertedOrders.map(order => order.id);

        if (orderIds.length === 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في إنشاء الطلب. لم يتم إنشاء أي سجلات',
          });
        }

        // Validate order with Arachnid (Bio-Module) - with error handling
        let validation;
        try {
          validation = await validateOrderWithArachnid({
            orderId: orderIds[0],
            orderNumber,
            customerName: input.customerName,
            customerPhone: input.customerPhone || '',
            totalAmount: input.totalAmount,
            items: input.items,
            shippingAddress: input.shippingAddress || '',
          });
        } catch (bioError: any) {
          logger.warn('Bio-Module validation failed, continuing anyway', {
            error: bioError.message,
            orderId: orderIds[0],
          });
          // Continue with default validation if Bio-Module fails
          validation = {
            isValid: true,
            anomalies: [],
            warnings: ['Bio-Module validation unavailable'],
            recommendations: [],
            confidence: 0.8,
          };
        }

        // Track order lifecycle - with error handling
        try {
          await trackOrderLifecycle(orderIds[0], orderNumber, "created");
        } catch (trackError: any) {
          logger.warn('Order lifecycle tracking failed', {
            error: trackError.message,
            orderId: orderIds[0],
          });
          // Continue even if tracking fails
        }

        const duration = Date.now() - startTime;
        logger.info('Order created successfully', {
          orderId: orderIds[0],
          orderNumber,
          orderIds: orderIds,
          validationWarnings: validation.warnings.length,
          duration: `${duration}ms`,
        });

        // Invalidate cache (multiple keys for better cache invalidation)
        try {
          cache.delete('orders:all');
          if (input.customerPhone) {
            cache.delete(`orders:customer:${input.customerPhone}`);
          }
          cache.delete('orders:status:pending');
        } catch (cacheError: any) {
          logger.warn('Cache invalidation failed', {
            error: cacheError.message,
          });
          // Continue even if cache invalidation fails
        }

        return {
          success: true,
          orderId: orderIds[0], // Primary order ID (for backward compatibility)
          orderIds: orderIds, // All order IDs (useful for multi-item orders)
          orderNumber,
          message: "تم إنشاء الطلب بنجاح",
          validation: {
            isValid: validation.isValid,
            warnings: validation.warnings,
            recommendations: validation.recommendations,
          },
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        // If it's already a TRPCError, re-throw it
        if (error instanceof TRPCError) {
          logger.error('Order creation failed (TRPCError)', {
            code: error.code,
            message: error.message,
            duration: `${duration}ms`,
          });
          throw error;
        }

        // Log unexpected errors
        logger.error('Order creation failed (Unexpected Error)', error, {
          customerName: input.customerName,
          itemCount: input.items?.length || 0,
          duration: `${duration}ms`,
        });

        // Return generic error to client
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // Get all orders (protected - admin only)
  getAllOrders: protectedProcedure.query(async () => {
    return cache.getOrSet(
      'orders:all',
      async () => {
        logger.debug('Cache miss - fetching all orders from DB');
        const db = await requireDb();
        const allOrders = await db
          .select()
          .from(orders)
          .orderBy(desc(orders.createdAt));
        return allOrders;
      },
      300 // 5 minutes TTL
    );
  }),

  // Get order by ID
  getOrderById: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId));

      if (!order) {
        throw new Error("Order not found");
      }

      return order;
    }),

  // Get orders by order number
  getOrdersByNumber: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      
      // Get all orders with same base order number
      const baseOrderNumber = input.orderNumber.split('-').slice(0, -1).join('-');
      
      const ordersList = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, input.orderNumber));

      return ordersList;
    }),

  // Update order status (protected - admin only)
  updateOrderStatus: protectedProcedure
    .input(schemas.updateOrderStatus)
    .mutation(async ({ input }) => {
      logger.info('Updating order status', {
        orderId: input.orderId,
        newStatus: input.status,
      });

      const db = await requireDb();

      // Get order to get orderNumber
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId));

      if (!order) {
        logger.warn('Order not found', { orderId: input.orderId });
        throw new Error("Order not found");
      }

      await db
        .update(orders)
        .set({
          status: input.status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, input.orderId));

      // Track lifecycle with Bio-Modules
      const lifecycleStatus = input.status as "created" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
      await trackOrderLifecycle(input.orderId, order.orderNumber, lifecycleStatus);

      logger.info('Order status updated successfully', {
        orderId: input.orderId,
        oldStatus: order.status,
        newStatus: input.status,
      });

      // Invalidate cache
      cache.delete('orders:all');

      return {
        success: true,
        message: "تم تحديث حالة الطلب",
      };
    }),

  // Update payment status (protected - admin only)
  updatePaymentStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
      })
    )
    .mutation(async ({ input }) => {
      logger.info('Updating payment status', {
        orderId: input.orderId,
        paymentStatus: input.paymentStatus,
      });

      const db = await requireDb();

      await db
        .update(orders)
        .set({
          paymentStatus: input.paymentStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, input.orderId));

      logger.info('Payment status updated successfully', {
        orderId: input.orderId,
        paymentStatus: input.paymentStatus,
      });

      // Invalidate cache
      cache.delete('orders:all');

      return {
        success: true,
        message: "تم تحديث حالة الدفع",
      };
    }),

  // Get Bio-Module insights for an order
  getOrderBioInsights: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const insights = await getOrderInsights(input.orderId);
      return insights;
    }),
});
