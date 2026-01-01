/**
 * COD Tracking Router
 * tRPC procedures for COD order management
 */

import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { codWorkflowService } from "../services/cod-workflow.service";
import { shippingAllocatorService } from "../services/shipping-allocator.service";
import { requireDb } from "../db";
import { codOrders, shippingPartners, trackingLogs, shippingPerformanceByGovernorate, shippingPerformanceByCenter, shippingPerformanceByPoint } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { logger } from "../_core/logger";

// ============================================
// SCHEMAS
// ============================================

const shippingAddressSchema = z.object({
  governorate: z.string(),
  city: z.string(),
  area: z.string(),
  street: z.string(),
  building: z.string(),
  floor: z.string(),
  apartment: z.string(),
  notes: z.string().optional(),
});

const createCODOrderSchema = z.object({
  orderId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().optional(),
  shippingAddress: shippingAddressSchema,
  orderAmount: z.number(),
  codAmount: z.number(),
});

const updateStageSchema = z.object({
  orderId: z.string(),
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

// ============================================
// COD ROUTER
// ============================================

export const codRouter = router({
  // ============================================
  // CREATE COD ORDER
  // ============================================
  createOrder: protectedProcedure
    .input(createCODOrderSchema)
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.orderId || input.orderId.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف الطلب مطلوب',
          });
        }

        if (!input.customerName || input.customerName.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'اسم العميل مطلوب',
          });
        }

        if (!input.customerPhone || !/^01[0-9]{9}$/.test(input.customerPhone)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'رقم الهاتف غير صحيح. يجب أن يكون رقم مصري (01XXXXXXXXX)',
          });
        }

        if (!input.orderAmount || input.orderAmount <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'مبلغ الطلب يجب أن يكون أكبر من صفر',
          });
        }

        if (!input.codAmount || input.codAmount <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'مبلغ الدفع عند الاستلام يجب أن يكون أكبر من صفر',
          });
        }

        logger.info('Creating COD order', {
          orderId: input.orderId,
          customerName: input.customerName,
          orderAmount: input.orderAmount,
          createdBy: ctx.user?.id,
        });

        let result;
        try {
          result = await codWorkflowService.createCODOrder(input);
        } catch (serviceError: any) {
          logger.error('COD workflow service failed', serviceError, {
            orderId: input.orderId,
          });
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في إنشاء طلب الدفع عند الاستلام. يرجى المحاولة مرة أخرى',
            cause: serviceError,
          });
        }

        const duration = Date.now() - startTime;
        logger.info('COD order created successfully', {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        return result;
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

        logger.error('COD order creation failed (Unexpected Error)', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء إنشاء طلب الدفع عند الاستلام. يرجى المحاولة مرة أخرى',
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
        limit: z.number().min(1).max(100).optional().default(50),
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

        let orders;
        try {
          let query = db.select().from(codOrders);

          if (status) {
            query = query.where(eq(codOrders.status, status)) as any;
          }

          if (stage) {
            query = query.where(eq(codOrders.currentStage, stage)) as any;
          }

          orders = await query.limit(limit).offset(offset).orderBy(desc(codOrders.createdAt));
        } catch (dbError: any) {
          logger.error('Database query failed', dbError);
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في جلب الطلبات. يرجى المحاولة مرة أخرى',
            cause: dbError,
          });
        }

        const duration = Date.now() - startTime;
        logger.info('COD orders fetched successfully', {
          count: orders.length,
          duration: `${duration}ms`,
        });

        return { orders, total: orders.length };
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('COD orders fetch failed (TRPCError)', {
            code: error.code,
            message: error.message,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('COD orders fetch failed (Unexpected Error)', error, {
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء جلب الطلبات. يرجى المحاولة مرة أخرى',
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
        // Input validation
        if (!input.orderId || input.orderId.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف الطلب مطلوب',
          });
        }

        logger.debug('Fetching COD order by ID', { orderId: input.orderId });

        let result;
        try {
          result = await codWorkflowService.getTrackingStatus(input.orderId);
        } catch (serviceError: any) {
          logger.error('COD workflow service failed', serviceError, {
            orderId: input.orderId,
          });
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في جلب حالة الطلب. يرجى المحاولة مرة أخرى',
            cause: serviceError,
          });
        }

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'الطلب غير موجود',
          });
        }

        const duration = Date.now() - startTime;
        logger.info('COD order fetched successfully', {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('COD order fetch failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('COD order fetch failed (Unexpected Error)', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء جلب حالة الطلب. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // ============================================
  // UPDATE STAGE
  // ============================================
  updateStage: protectedProcedure
    .input(updateStageSchema)
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.orderId || input.orderId.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف الطلب مطلوب',
          });
        }

        if (!input.stage) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'المرحلة مطلوبة',
          });
        }

        // Validate stage transition (basic check)
        const validStages = [
          'customerService',
          'confirmation',
          'preparation',
          'supplier',
          'shipping',
          'delivery',
          'collection',
          'settlement',
        ];

        if (!validStages.includes(input.stage)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'المرحلة غير صالحة',
          });
        }

        logger.info('Updating COD order stage', {
          orderId: input.orderId,
          stage: input.stage,
          updatedBy: ctx.user?.id,
        });

        let result;
        try {
          result = await codWorkflowService.updateStage(input.orderId, input.stage, input.data);
        } catch (serviceError: any) {
          logger.error('COD workflow service failed', serviceError, {
            orderId: input.orderId,
            stage: input.stage,
          });
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في تحديث مرحلة الطلب. يرجى المحاولة مرة أخرى',
            cause: serviceError,
          });
        }

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'الطلب غير موجود',
          });
        }

        const duration = Date.now() - startTime;
        logger.info('COD order stage updated successfully', {
          orderId: input.orderId,
          stage: input.stage,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('COD order stage update failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            stage: input.stage,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('COD order stage update failed (Unexpected Error)', error, {
          orderId: input.orderId,
          stage: input.stage,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء تحديث مرحلة الطلب. يرجى المحاولة مرة أخرى',
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
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.orderId || input.orderId.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف الطلب مطلوب',
          });
        }

        if (!input.shippingAddress) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'عنوان الشحن مطلوب',
          });
        }

        if (!input.shippingAddress.governorate || input.shippingAddress.governorate.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'المحافظة مطلوبة',
          });
        }

        if (!input.shippingAddress.city || input.shippingAddress.city.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'المدينة مطلوبة',
          });
        }

        logger.info('Allocating shipping partner', {
          orderId: input.orderId,
          governorate: input.shippingAddress.governorate,
          city: input.shippingAddress.city,
          allocatedBy: ctx.user?.id,
        });

        let result;
        try {
          result = await shippingAllocatorService.allocatePartner(
            input.orderId,
            input.shippingAddress
          );
        } catch (serviceError: any) {
          logger.error('Shipping allocator service failed', serviceError, {
            orderId: input.orderId,
          });
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في تخصيص شركة الشحن. يرجى المحاولة مرة أخرى',
            cause: serviceError,
          });
        }

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'لم يتم العثور على شركة شحن مناسبة',
          });
        }

        const duration = Date.now() - startTime;
        logger.info('Shipping partner allocated successfully', {
          orderId: input.orderId,
          partnerId: result.partnerId || 'N/A',
          duration: `${duration}ms`,
        });

        return result;
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

        logger.error('Shipping allocation failed (Unexpected Error)', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء تخصيص شركة الشحن. يرجى المحاولة مرة أخرى',
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
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.orderId || input.orderId.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف الطلب مطلوب',
          });
        }

        if (!input.originalPartnerId || input.originalPartnerId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف شركة الشحن الأصلية غير صحيح',
          });
        }

        if (!input.reason || input.reason.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'سبب التبديل مطلوب',
          });
        }

        logger.info('Fallback to alternative shipping partner', {
          orderId: input.orderId,
          originalPartnerId: input.originalPartnerId,
          reason: input.reason,
          initiatedBy: ctx.user?.id,
        });

        let result;
        try {
          result = await shippingAllocatorService.fallbackToAlternative(
            input.orderId,
            input.originalPartnerId,
            input.reason
          );
        } catch (serviceError: any) {
          logger.error('Shipping fallback service failed', serviceError, {
            orderId: input.orderId,
            originalPartnerId: input.originalPartnerId,
          });
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في التبديل إلى شركة شحن بديلة. يرجى المحاولة مرة أخرى',
            cause: serviceError,
          });
        }

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'لم يتم العثور على شركة شحن بديلة',
          });
        }

        const duration = Date.now() - startTime;
        logger.info('Shipping fallback completed successfully', {
          orderId: input.orderId,
          newPartnerId: result.partnerId || 'N/A',
          duration: `${duration}ms`,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('Shipping fallback failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Shipping fallback failed (Unexpected Error)', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء التبديل إلى شركة شحن بديلة. يرجى المحاولة مرة أخرى',
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
      const db = await requireDb();

      let query = db.select().from(shippingPartners);

      if (input.active !== undefined) {
        query = query.where(eq(shippingPartners.active, input.active ? 1 : 0)) as any;
      }

      const partners = await query;
      return { partners };
    }),

  // ============================================
  // UPDATE SHIPPING PARTNER
  // ============================================
  updateShippingPartner: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          active: z.number().optional(),
          suspended: z.number().optional(),
          suspensionReason: z.string().optional(),
          deliveryFee: z.string().optional(),
          codFeePercentage: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();

      await db.update(shippingPartners)
        .set(input.data)
        .where(eq(shippingPartners.id, input.id));

      return { success: true };
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
        // Input validation
        if (!input.orderId || input.orderId.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف الطلب مطلوب',
          });
        }

        logger.debug('Fetching tracking logs', { orderId: input.orderId });

        const db = await requireDb();

        const [order] = await db.select()
          .from(codOrders)
          .where(eq(codOrders.orderId, input.orderId));

        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'الطلب غير موجود',
          });
        }

        let logs;
        try {
          logs = await db.select()
            .from(trackingLogs)
            .where(eq(trackingLogs.codOrderId, order.id))
            .orderBy(desc(trackingLogs.createdAt));
        } catch (dbError: any) {
          logger.error('Database query failed', dbError, { orderId: input.orderId });
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في جلب سجلات التتبع. يرجى المحاولة مرة أخرى',
            cause: dbError,
          });
        }

        const duration = Date.now() - startTime;
        logger.info('Tracking logs fetched successfully', {
          orderId: input.orderId,
          logCount: logs.length,
          duration: `${duration}ms`,
        });

        return { logs };
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('Tracking logs fetch failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Tracking logs fetch failed (Unexpected Error)', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء جلب سجلات التتبع. يرجى المحاولة مرة أخرى',
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
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      return await codWorkflowService.generateReport(startDate, endDate);
    }),

  // ============================================
  // GET DASHBOARD STATS
  // ============================================
  getDashboardStats: protectedProcedure.query(async () => {
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

    const todayOrders = await db.select()
      .from(codOrders)
      .where(gte(codOrders.createdAt, today.toISOString()));

    return {
      stageStats,
      statusStats,
      totalCODValue: totalCOD?.total || 0,
      todayOrdersCount: todayOrders.length,
    };
  }),

  // ============================================
  // GET SHIPPING COMPANIES
  // ============================================
  getShippingCompanies: protectedProcedure.query(async () => {
    const db = await requireDb();
    return await db.select().from(shippingPartners);
  }),

  // ============================================
  // GET PERFORMANCE BY GOVERNORATE
  // ============================================
  getPerformanceByGovernorate: protectedProcedure
    .input(z.object({
      governorateCode: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await requireDb();
      
      if (input.governorateCode) {
        return await db.select()
          .from(shippingPerformanceByGovernorate)
          .where(eq(shippingPerformanceByGovernorate.governorateCode, input.governorateCode))
          .orderBy(desc(shippingPerformanceByGovernorate.totalShipments));
      }
      
      return await db.select()
        .from(shippingPerformanceByGovernorate)
        .orderBy(desc(shippingPerformanceByGovernorate.totalShipments));
    }),

  // ============================================
  // GET PERFORMANCE BY CENTER
  // ============================================
  getPerformanceByCenter: protectedProcedure
    .input(z.object({
      centerCode: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await requireDb();
      
      if (input.centerCode) {
        return await db.select()
          .from(shippingPerformanceByCenter)
          .where(eq(shippingPerformanceByCenter.centerCode, input.centerCode))
          .orderBy(desc(shippingPerformanceByCenter.totalShipments));
      }
      
      return await db.select()
        .from(shippingPerformanceByCenter)
        .orderBy(desc(shippingPerformanceByCenter.totalShipments))
        .limit(50);
    }),

  // ============================================
  // GET PERFORMANCE BY POINT
  // ============================================
  getPerformanceByPoint: protectedProcedure
    .input(z.object({
      pointCode: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await requireDb();
      
      if (input.pointCode) {
        return await db.select()
          .from(shippingPerformanceByPoint)
          .where(eq(shippingPerformanceByPoint.pointCode, input.pointCode))
          .orderBy(desc(shippingPerformanceByPoint.totalShipments));
      }
      
      return await db.select()
        .from(shippingPerformanceByPoint)
        .orderBy(desc(shippingPerformanceByPoint.totalShipments))
        .limit(50);
    }),
});
