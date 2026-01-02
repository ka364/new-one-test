/**
 * @fileoverview COD Tracking Router - HADEROS E-commerce Platform
 * @module server/routers/cod
 * @description Complete Cash on Delivery (COD) order management system
 * for Egypt's e-commerce market. Handles the full COD lifecycle from
 * order creation to final settlement.
 *
 * @author HADEROS Team
 * @version 2.0.0
 * @license MIT
 *
 * تتبع طلبات الدفع عند الاستلام (COD)
 * نظام إدارة شامل للشحن والتوصيل في مصر
 *
 * @example
 * // Create COD order
 * const codOrder = await trpc.cod.createCODOrder.mutate({
 *   orderId: 'ORD-2026-001',
 *   customerName: 'أحمد محمد',
 *   customerPhone: '01012345678',
 *   shippingAddress: { governorate: 'القاهرة', city: 'مدينة نصر', ... },
 *   orderAmount: 599.99,
 *   codAmount: 650.00
 * });
 *
 * @example
 * // Update COD stage
 * await trpc.cod.updateCODStage.mutate({
 *   orderId: 'ORD-2026-001',
 *   newStage: 'shipping',
 *   notes: 'تم تسليم الشحنة للمندوب'
 * });
 *
 * COD Stage Flow:
 * ┌─────────────────┐
 * │ customerService │ → Initial order entry
 * └────────┬────────┘
 *          ↓
 * ┌─────────────────┐
 * │  confirmation   │ → Customer confirms order
 * └────────┬────────┘
 *          ↓
 * ┌─────────────────┐
 * │   preparation   │ → Order being prepared
 * └────────┬────────┘
 *          ↓
 * ┌─────────────────┐
 * │    supplier     │ → Supplier processing
 * └────────┬────────┘
 *          ↓
 * ┌─────────────────┐
 * │    shipping     │ → In transit
 * └────────┬────────┘
 *          ↓
 * ┌─────────────────┐
 * │    delivery     │ → Out for delivery
 * └────────┬────────┘
 *          ↓
 * ┌─────────────────┐
 * │   collection    │ → Cash collected
 * └────────┬────────┘
 *          ↓
 * ┌─────────────────┐
 * │   settlement    │ → Amount settled
 * └─────────────────┘
 */

import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { codWorkflowService } from "../services/cod-workflow.service";
import { shippingAllocatorService } from "../services/shipping-allocator.service";
import { requireDb } from "../db";
import {
  codOrders,
  shippingPartners,
  trackingLogs,
  shippingPerformanceByGovernorate,
  shippingPerformanceByCenter,
  shippingPerformanceByPoint
} from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../_core/logger";

// ============================================
// SCHEMAS
// ============================================

const shippingAddressSchema = z.object({
  governorate: z.string().min(1, 'يجب تحديد المحافظة'),
  city: z.string().min(1, 'يجب تحديد المدينة'),
  area: z.string().min(1, 'يجب تحديد المنطقة'),
  street: z.string().min(1, 'يجب تحديد الشارع'),
  building: z.string(),
  floor: z.string(),
  apartment: z.string(),
  notes: z.string().optional(),
});

const createCODOrderSchema = z.object({
  orderId: z.string().min(1, 'يجب تحديد رقم الطلب'),
  customerName: z.string().min(2, 'اسم العميل يجب أن يكون حرفين على الأقل'),
  customerPhone: z.string().regex(/^01[0-9]{9}$/, 'رقم الهاتف يجب أن يكون رقم مصري صحيح'),
  customerEmail: z.string().email().optional(),
  shippingAddress: shippingAddressSchema,
  orderAmount: z.number().positive('قيمة الطلب يجب أن تكون موجبة'),
  codAmount: z.number().positive('مبلغ COD يجب أن يكون موجباً'),
});

const updateStageSchema = z.object({
  orderId: z.string().min(1, 'يجب تحديد رقم الطلب'),
  stage: z.enum([
    'customerService',
    'confirmation',
    'preparation',
    'supplier',
    'shipping',
    'delivery',
    'collection',
    'settlement',
  ]),
  data: z.any(),
});

// Valid COD stage transitions
const validStageTransitions: Record<string, string[]> = {
  customerService: ['confirmation', 'cancelled'],
  confirmation: ['preparation', 'cancelled'],
  preparation: ['supplier', 'cancelled'],
  supplier: ['shipping', 'cancelled'],
  shipping: ['delivery', 'cancelled'],
  delivery: ['collection', 'cancelled'],
  collection: ['settlement'],
  settlement: [],
  cancelled: [],
};

// ============================================
// COD ROUTER
// ============================================

export const codRouter = router({
  // ============================================
  // CREATE COD ORDER
  // ============================================
  createOrder: protectedProcedure
    .input(createCODOrderSchema)
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Validate COD amount doesn't exceed order amount
        if (input.codAmount > input.orderAmount) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'مبلغ COD لا يمكن أن يتجاوز قيمة الطلب',
          });
        }

        logger.info('Creating COD order', {
          orderId: input.orderId,
          customerName: input.customerName,
          codAmount: input.codAmount,
          governorate: input.shippingAddress.governorate,
        });

        const result = await codWorkflowService.createCODOrder(input);

        const duration = Date.now() - startTime;
        logger.info('COD order created successfully', {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          message: 'تم إنشاء طلب COD بنجاح',
          ...result,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('COD order creation failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('COD order creation failed', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في إنشاء طلب COD',
          cause: error,
        });
      }
    }),

  // ============================================
  // GET ALL COD ORDERS
  // ============================================
  getAllOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).optional().default(50),
        offset: z.number().min(0).optional().default(0),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
        stage: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.debug('Fetching COD orders', {
          limit: input.limit,
          offset: input.offset,
          status: input.status,
          stage: input.stage,
        });

        const db = await requireDb();
        const { limit, offset, status, stage } = input;

        let query = db.select().from(codOrders);

        if (status) {
          query = query.where(eq(codOrders.status, status)) as any;
        }

        if (stage) {
          query = query.where(eq(codOrders.currentStage, stage)) as any;
        }

        const orders = await query.limit(limit).offset(offset).orderBy(desc(codOrders.createdAt));

        const duration = Date.now() - startTime;
        logger.debug('COD orders fetched', {
          count: orders.length,
          duration: `${duration}ms`,
        });

        return {
          orders,
          total: orders.length,
          limit,
          offset,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        logger.error('Failed to fetch COD orders', error, {
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب طلبات COD',
          cause: error,
        });
      }
    }),

  // ============================================
  // GET ORDER BY ID
  // ============================================
  getOrderById: protectedProcedure
    .input(z.object({ orderId: z.string().min(1) }))
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.debug('Fetching COD order', { orderId: input.orderId });

        const result = await codWorkflowService.getTrackingStatus(input.orderId);

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'طلب COD غير موجود',
          });
        }

        const duration = Date.now() - startTime;
        logger.debug('COD order fetched', {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) throw error;

        logger.error('Failed to fetch COD order', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب بيانات طلب COD',
          cause: error,
        });
      }
    }),

  // ============================================
  // UPDATE STAGE
  // ============================================
  updateStage: protectedProcedure
    .input(updateStageSchema)
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.info('Updating COD order stage', {
          orderId: input.orderId,
          newStage: input.stage,
        });

        // Get current order to validate transition
        const currentOrder = await codWorkflowService.getTrackingStatus(input.orderId);

        if (!currentOrder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'طلب COD غير موجود',
          });
        }

        // Validate stage transition
        const currentStage = currentOrder.currentStage || 'customerService';
        const allowedStages = validStageTransitions[currentStage] || [];

        if (!allowedStages.includes(input.stage) && input.stage !== currentStage) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `لا يمكن تغيير المرحلة من "${currentStage}" إلى "${input.stage}"`,
          });
        }

        const result = await codWorkflowService.updateStage(input.orderId, input.stage, input.data);

        const duration = Date.now() - startTime;
        logger.info('COD order stage updated', {
          orderId: input.orderId,
          previousStage: currentStage,
          newStage: input.stage,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          message: 'تم تحديث مرحلة الطلب بنجاح',
          previousStage: currentStage,
          newStage: input.stage,
          ...result,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('COD stage update failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('COD stage update failed', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في تحديث مرحلة الطلب',
          cause: error,
        });
      }
    }),

  // ============================================
  // ALLOCATE SHIPPING PARTNER
  // ============================================
  allocateShipping: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
        shippingAddress: shippingAddressSchema,
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.info('Allocating shipping partner', {
          orderId: input.orderId,
          governorate: input.shippingAddress.governorate,
        });

        const result = await shippingAllocatorService.allocatePartner(
          input.orderId,
          input.shippingAddress
        );

        if (!result || !result.partnerId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'لا يوجد شريك شحن متاح لهذه المنطقة',
          });
        }

        const duration = Date.now() - startTime;
        logger.info('Shipping partner allocated', {
          orderId: input.orderId,
          partnerId: result.partnerId,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          message: 'تم تخصيص شريك الشحن بنجاح',
          ...result,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Shipping allocation failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Shipping allocation failed', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في تخصيص شريك الشحن',
          cause: error,
        });
      }
    }),

  // ============================================
  // FALLBACK TO ALTERNATIVE PARTNER
  // ============================================
  fallbackShipping: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
        originalPartnerId: z.number().positive(),
        reason: z.string().min(3, 'يجب توضيح سبب التغيير'),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.info('Fallback to alternative shipping partner', {
          orderId: input.orderId,
          originalPartnerId: input.originalPartnerId,
          reason: input.reason,
        });

        const result = await shippingAllocatorService.fallbackToAlternative(
          input.orderId,
          input.originalPartnerId,
          input.reason
        );

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'لا يوجد شريك شحن بديل متاح',
          });
        }

        const duration = Date.now() - startTime;
        logger.info('Fallback shipping partner assigned', {
          orderId: input.orderId,
          originalPartnerId: input.originalPartnerId,
          newPartnerId: result.partnerId,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          message: 'تم تخصيص شريك شحن بديل بنجاح',
          ...result,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) throw error;

        logger.error('Fallback shipping failed', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في تخصيص شريك شحن بديل',
          cause: error,
        });
      }
    }),

  // ============================================
  // GET SHIPPING PARTNERS
  // ============================================
  getShippingPartners: protectedProcedure
    .input(
      z.object({
        active: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.debug('Fetching shipping partners', { active: input.active });

        const db = await requireDb();

        let query = db.select().from(shippingPartners);

        if (input.active !== undefined) {
          query = query.where(eq(shippingPartners.active, input.active ? 1 : 0)) as any;
        }

        const partners = await query;

        const duration = Date.now() - startTime;
        logger.debug('Shipping partners fetched', {
          count: partners.length,
          duration: `${duration}ms`,
        });

        return {
          partners,
          count: partners.length,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        logger.error('Failed to fetch shipping partners', error, {
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب شركاء الشحن',
          cause: error,
        });
      }
    }),

  // ============================================
  // UPDATE SHIPPING PARTNER
  // ============================================
  updateShippingPartner: protectedProcedure
    .input(
      z.object({
        id: z.number().positive('معرف الشريك غير صحيح'),
        data: z.object({
          active: z.number().min(0).max(1).optional(),
          suspended: z.number().min(0).max(1).optional(),
          suspensionReason: z.string().optional(),
          deliveryFee: z.string().optional(),
          codFeePercentage: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.info('Updating shipping partner', {
          partnerId: input.id,
          updates: Object.keys(input.data),
        });

        const db = await requireDb();

        // Verify partner exists
        const [existingPartner] = await db
          .select()
          .from(shippingPartners)
          .where(eq(shippingPartners.id, input.id));

        if (!existingPartner) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'شريك الشحن غير موجود',
          });
        }

        // Validate suspension reason if suspending
        if (input.data.suspended === 1 && !input.data.suspensionReason) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب توضيح سبب التعليق',
          });
        }

        await db.update(shippingPartners)
          .set({
            ...input.data,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(shippingPartners.id, input.id));

        const duration = Date.now() - startTime;
        logger.info('Shipping partner updated', {
          partnerId: input.id,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          message: 'تم تحديث شريك الشحن بنجاح',
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Shipping partner update failed (TRPCError)', {
            code: error.code,
            message: error.message,
            partnerId: input.id,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Shipping partner update failed', error, {
          partnerId: input.id,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في تحديث شريك الشحن',
          cause: error,
        });
      }
    }),

  // ============================================
  // GET TRACKING LOGS
  // ============================================
  getTrackingLogs: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.debug('Fetching tracking logs', { orderId: input.orderId });

        const db = await requireDb();

        const [order] = await db.select()
          .from(codOrders)
          .where(eq(codOrders.orderId, input.orderId));

        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'طلب COD غير موجود',
          });
        }

        const logs = await db.select()
          .from(trackingLogs)
          .where(eq(trackingLogs.codOrderId, order.id))
          .orderBy(desc(trackingLogs.createdAt));

        const duration = Date.now() - startTime;
        logger.debug('Tracking logs fetched', {
          orderId: input.orderId,
          logsCount: logs.length,
          duration: `${duration}ms`,
        });

        return {
          logs,
          count: logs.length,
          orderId: input.orderId,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) throw error;

        logger.error('Failed to fetch tracking logs', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب سجلات التتبع',
          cause: error,
        });
      }
    }),

  // ============================================
  // GENERATE COD REPORT
  // ============================================
  generateReport: protectedProcedure
    .input(
      z.object({
        startDate: z.string().min(1, 'يجب تحديد تاريخ البداية'),
        endDate: z.string().min(1, 'يجب تحديد تاريخ النهاية'),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        // Validate date range
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'صيغة التاريخ غير صحيحة',
          });
        }

        if (startDate > endDate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
          });
        }

        // Limit report range to 90 days
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 90) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'نطاق التقرير لا يمكن أن يتجاوز 90 يوماً',
          });
        }

        logger.info('Generating COD report', {
          startDate: input.startDate,
          endDate: input.endDate,
          daysDiff,
        });

        const report = await codWorkflowService.generateReport(startDate, endDate);

        const duration = Date.now() - startTime;
        logger.info('COD report generated', {
          startDate: input.startDate,
          endDate: input.endDate,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          period: { startDate: input.startDate, endDate: input.endDate },
          ...report,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) throw error;

        logger.error('Failed to generate COD report', error, {
          startDate: input.startDate,
          endDate: input.endDate,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في إنشاء تقرير COD',
          cause: error,
        });
      }
    }),

  // ============================================
  // GET DASHBOARD STATS
  // ============================================
  getDashboardStats: protectedProcedure.query(async () => {
    const startTime = Date.now();

    try {
      logger.debug('Fetching COD dashboard stats');

      const db = await requireDb();

      // Get counts by stage
      const stageStats = await db.select({
        stage: codOrders.currentStage,
        count: sql<number>`count(*)`,
      })
        .from(codOrders)
        .groupBy(codOrders.currentStage);

      // Get counts by status
      const statusStats = await db.select({
        status: codOrders.status,
        count: sql<number>`count(*)`,
      })
        .from(codOrders)
        .groupBy(codOrders.status);

      // Get total COD value
      const [totalCOD] = await db.select({
        total: sql<number>`SUM(CAST(cod_amount AS DECIMAL(10,2)))`,
      })
        .from(codOrders);

      // Get today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayStats] = await db.select({
        count: sql<number>`count(*)`,
        totalValue: sql<number>`SUM(CAST(cod_amount AS DECIMAL(10,2)))`,
      })
        .from(codOrders)
        .where(sql`${codOrders.createdAt} >= ${today.toISOString()}`);

      const duration = Date.now() - startTime;
      logger.debug('COD dashboard stats fetched', {
        duration: `${duration}ms`,
      });

      return {
        stageStats,
        statusStats,
        totalCODValue: totalCOD?.total || 0,
        todayOrdersCount: todayStats?.count || 0,
        todayOrdersValue: todayStats?.totalValue || 0,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error('Failed to fetch dashboard stats', error, {
        duration: `${duration}ms`,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في جلب إحصائيات لوحة التحكم',
        cause: error,
      });
    }
  }),

  // ============================================
  // GET SHIPPING COMPANIES
  // ============================================
  getShippingCompanies: protectedProcedure.query(async () => {
    const startTime = Date.now();

    try {
      logger.debug('Fetching shipping companies');

      const db = await requireDb();
      const companies = await db.select().from(shippingPartners);

      const duration = Date.now() - startTime;
      logger.debug('Shipping companies fetched', {
        count: companies.length,
        duration: `${duration}ms`,
      });

      return {
        companies,
        count: companies.length,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error('Failed to fetch shipping companies', error, {
        duration: `${duration}ms`,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في جلب شركات الشحن',
        cause: error,
      });
    }
  }),

  // ============================================
  // GET PERFORMANCE BY GOVERNORATE
  // ============================================
  getPerformanceByGovernorate: protectedProcedure
    .input(z.object({
      governorateCode: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.debug('Fetching performance by governorate', {
          governorateCode: input.governorateCode,
        });

        const db = await requireDb();

        let results;
        if (input.governorateCode) {
          results = await db.select()
            .from(shippingPerformanceByGovernorate)
            .where(eq(shippingPerformanceByGovernorate.governorateCode, input.governorateCode))
            .orderBy(desc(shippingPerformanceByGovernorate.totalShipments))
            .limit(input.limit);
        } else {
          results = await db.select()
            .from(shippingPerformanceByGovernorate)
            .orderBy(desc(shippingPerformanceByGovernorate.totalShipments))
            .limit(input.limit);
        }

        const duration = Date.now() - startTime;
        logger.debug('Governorate performance fetched', {
          count: results.length,
          duration: `${duration}ms`,
        });

        return {
          data: results,
          count: results.length,
          governorateCode: input.governorateCode,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        logger.error('Failed to fetch governorate performance', error, {
          governorateCode: input.governorateCode,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب أداء المحافظات',
          cause: error,
        });
      }
    }),

  // ============================================
  // GET PERFORMANCE BY CENTER
  // ============================================
  getPerformanceByCenter: protectedProcedure
    .input(z.object({
      centerCode: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.debug('Fetching performance by center', {
          centerCode: input.centerCode,
        });

        const db = await requireDb();

        let results;
        if (input.centerCode) {
          results = await db.select()
            .from(shippingPerformanceByCenter)
            .where(eq(shippingPerformanceByCenter.centerCode, input.centerCode))
            .orderBy(desc(shippingPerformanceByCenter.totalShipments))
            .limit(input.limit);
        } else {
          results = await db.select()
            .from(shippingPerformanceByCenter)
            .orderBy(desc(shippingPerformanceByCenter.totalShipments))
            .limit(input.limit);
        }

        const duration = Date.now() - startTime;
        logger.debug('Center performance fetched', {
          count: results.length,
          duration: `${duration}ms`,
        });

        return {
          data: results,
          count: results.length,
          centerCode: input.centerCode,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        logger.error('Failed to fetch center performance', error, {
          centerCode: input.centerCode,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب أداء المراكز',
          cause: error,
        });
      }
    }),

  // ============================================
  // GET PERFORMANCE BY POINT
  // ============================================
  getPerformanceByPoint: protectedProcedure
    .input(z.object({
      pointCode: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.debug('Fetching performance by point', {
          pointCode: input.pointCode,
        });

        const db = await requireDb();

        let results;
        if (input.pointCode) {
          results = await db.select()
            .from(shippingPerformanceByPoint)
            .where(eq(shippingPerformanceByPoint.pointCode, input.pointCode))
            .orderBy(desc(shippingPerformanceByPoint.totalShipments))
            .limit(input.limit);
        } else {
          results = await db.select()
            .from(shippingPerformanceByPoint)
            .orderBy(desc(shippingPerformanceByPoint.totalShipments))
            .limit(input.limit);
        }

        const duration = Date.now() - startTime;
        logger.debug('Point performance fetched', {
          count: results.length,
          duration: `${duration}ms`,
        });

        return {
          data: results,
          count: results.length,
          pointCode: input.pointCode,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        logger.error('Failed to fetch point performance', error, {
          pointCode: input.pointCode,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب أداء نقاط التوصيل',
          cause: error,
        });
      }
    }),

  // ============================================
  // CANCEL COD ORDER
  // ============================================
  cancelOrder: protectedProcedure
    .input(z.object({
      orderId: z.string().min(1),
      reason: z.string().min(5, 'يجب توضيح سبب الإلغاء (5 أحرف على الأقل)'),
    }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.info('Cancelling COD order', {
          orderId: input.orderId,
          reason: input.reason,
        });

        // Get current order
        const currentOrder = await codWorkflowService.getTrackingStatus(input.orderId);

        if (!currentOrder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'طلب COD غير موجود',
          });
        }

        // Check if order can be cancelled
        const currentStage = currentOrder.currentStage || 'customerService';
        if (currentStage === 'settlement' || currentStage === 'collection') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'لا يمكن إلغاء الطلب في هذه المرحلة (التحصيل أو التسوية)',
          });
        }

        const db = await requireDb();

        await db.update(codOrders)
          .set({
            status: 'cancelled',
            currentStage: 'cancelled',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(codOrders.orderId, input.orderId));

        const duration = Date.now() - startTime;
        logger.info('COD order cancelled', {
          orderId: input.orderId,
          previousStage: currentStage,
          reason: input.reason,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          message: 'تم إلغاء طلب COD بنجاح',
          orderId: input.orderId,
          reason: input.reason,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('COD order cancellation failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('COD order cancellation failed', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في إلغاء طلب COD',
          cause: error,
        });
      }
    }),
});
