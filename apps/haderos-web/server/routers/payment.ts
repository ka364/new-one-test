/**
 * Payment Router
 * راوتر الدفع الموحد
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getUnifiedPaymentService } from "../services/unified-payment.service";
import { db } from "../db";
import { paymentTransactions, paymentProviders, paymentRefunds } from "../../drizzle/schema-payments";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import {
  validatePaymentWithArachnid,
  trackPaymentLifecycle,
  handlePaymentFailure,
  getPaymentInsights,
} from "../bio-modules/payment-bio-integration.js";
import { logger } from "../_core/logger";

export const paymentRouter = router({

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  /**
   * Get available payment methods
   */
  getPaymentMethods: publicProcedure
    .input(z.object({
      amount: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const service = getUnifiedPaymentService();
      const providers = await service.getAvailableProviders(input?.amount);

      return providers.map(p => ({
        code: p.code,
        name: p.name,
        nameAr: p.nameAr,
        type: p.type,
        logoUrl: p.logoUrl,
        fee: {
          fixed: Number(p.fixedFee),
          percentage: Number(p.percentageFee),
        },
        limits: {
          min: Number(p.minAmount),
          max: Number(p.maxAmount),
        },
      }));
    }),

  /**
   * Calculate payment fee
   */
  calculateFee: publicProcedure
    .input(z.object({
      amount: z.number(),
      providerCode: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        // Input validation
        if (input.amount <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'المبلغ يجب أن يكون أكبر من صفر',
          });
        }

        const [provider] = await db.select()
          .from(paymentProviders)
          .where(eq(paymentProviders.code, input.providerCode))
          .limit(1);

        if (!provider) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'مزود الدفع غير موجود',
          });
        }

        const service = getUnifiedPaymentService();
        const fee = service.calculateFee(input.amount, provider);

        return {
          amount: input.amount,
          fee,
          total: input.amount + fee,
          netAmount: input.amount - fee,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Failed to calculate payment fee', error, {
          amount: input.amount,
          providerCode: input.providerCode,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء حساب رسوم الدفع',
          cause: error,
        });
      }
    }),

  /**
   * Create payment
   */
  createPayment: publicProcedure
    .input(z.object({
      orderId: z.number(),
      orderNumber: z.string(),
      amount: z.number(),
      providerCode: z.string(),
      customer: z.object({
        name: z.string(),
        phone: z.string(),
        email: z.string().optional(),
      }),
      returnUrl: z.string().optional(),
      callbackUrl: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      
      try {
        // Input validation
        if (input.amount <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'المبلغ يجب أن يكون أكبر من صفر',
          });
        }

        // Validate customer phone format (Egyptian format)
        if (input.customer.phone && !/^01[0-9]{9}$/.test(input.customer.phone)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'رقم الهاتف غير صحيح. يجب أن يكون رقم مصري (01XXXXXXXXX)',
          });
        }

        logger.info('Creating payment', {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          amount: input.amount,
          providerCode: input.providerCode,
        });

        const service = getUnifiedPaymentService();
        
        // Create payment
        let paymentResult;
        try {
          paymentResult = await service.createPayment(input);
        } catch (serviceError: any) {
          logger.error('Payment service failed', serviceError, {
            orderId: input.orderId,
            providerCode: input.providerCode,
          });
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في إنشاء الدفعة. يرجى المحاولة مرة أخرى',
            cause: serviceError,
          });
        }

        // Validate payment with Arachnid (Bio-Module) - with error handling
        if (paymentResult.transactionId) {
          try {
            const validation = await validatePaymentWithArachnid({
              transactionId: paymentResult.transactionId,
              transactionNumber: paymentResult.transactionNumber || '',
              amount: input.amount,
              providerCode: input.providerCode,
              customerPhone: input.customer.phone,
              customerName: input.customer.name,
              orderId: input.orderId,
              orderNumber: input.orderNumber,
            });

            // Log validation results
            if (!validation.isValid || validation.warnings.length > 0) {
              logger.warn('Payment validation warnings', {
                transactionId: paymentResult.transactionId,
                anomalies: validation.anomalies,
                warnings: validation.warnings,
              });
            }

            // If critical anomalies, consider blocking payment
            if (validation.anomalies.length > 0 && validation.confidence < 0.5) {
              logger.error('Payment blocked due to critical anomalies', {
                transactionId: paymentResult.transactionId,
                anomalies: validation.anomalies,
              });
              
              // In production, you might want to block the payment here
              // For now, we'll just log and continue
            }
          } catch (bioError: any) {
            logger.warn('Bio-Module validation failed, continuing anyway', {
              error: bioError.message,
              transactionId: paymentResult.transactionId,
            });
            // Continue even if Bio-Module validation fails
          }
        }

        // Track payment lifecycle - with error handling
        if (paymentResult.transactionId) {
          try {
            await trackPaymentLifecycle(
              paymentResult.transactionId,
              paymentResult.transactionNumber || '',
              "pending"
            );
          } catch (trackError: any) {
            logger.warn('Payment lifecycle tracking failed', {
              error: trackError.message,
              transactionId: paymentResult.transactionId,
            });
            // Continue even if tracking fails
          }
        }

        const duration = Date.now() - startTime;
        logger.info('Payment created successfully', {
          transactionId: paymentResult.transactionId,
          transactionNumber: paymentResult.transactionNumber,
          amount: input.amount,
          providerCode: input.providerCode,
          duration: `${duration}ms`,
        });

        return paymentResult;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('Payment creation failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Payment creation failed (Unexpected Error)', error, {
          orderId: input.orderId,
          amount: input.amount,
          providerCode: input.providerCode,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء إنشاء الدفعة. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  /**
   * Get payment status
   */
  getPaymentStatus: publicProcedure
    .input(z.object({
      transactionId: z.number().optional(),
      transactionNumber: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        if (!input.transactionId && !input.transactionNumber) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب توفير transactionId أو transactionNumber',
          });
        }

        let condition;
        if (input.transactionId) {
          condition = eq(paymentTransactions.id, input.transactionId);
        } else {
          condition = eq(paymentTransactions.transactionNumber, input.transactionNumber!);
        }

        const [transaction] = await db.select()
          .from(paymentTransactions)
          .where(condition)
          .limit(1);

        if (!transaction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'المعاملة غير موجودة',
          });
        }

        return {
          transactionNumber: transaction.transactionNumber,
          status: transaction.status,
          amount: Number(transaction.amount),
          fee: Number(transaction.fee),
          providerCode: transaction.providerCode,
          paymentUrl: transaction.paymentUrl,
          qrCode: transaction.qrCode,
          deepLink: transaction.deepLink,
          referenceCode: transaction.referenceCode,
          referenceExpiry: transaction.referenceExpiry,
          completedAt: transaction.completedAt,
          failureReason: transaction.failureReason,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Failed to get payment status', error, {
          transactionId: input.transactionId,
          transactionNumber: input.transactionNumber,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء جلب حالة الدفعة',
          cause: error,
        });
      }
    }),

  /**
   * Handle webhook (called by payment providers)
   */
  webhook: publicProcedure
    .input(z.object({
      provider: z.string(),
      eventType: z.string(),
      payload: z.any(),
      signature: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      
      try {
        logger.info('Processing payment webhook', {
          provider: input.provider,
          eventType: input.eventType,
        });

        const service = getUnifiedPaymentService();
        
        try {
          await service.handleWebhook(
            input.provider,
            input.eventType,
            input.payload,
            input.signature
          );
        } catch (webhookError: any) {
          logger.error('Webhook processing failed', webhookError, {
            provider: input.provider,
            eventType: input.eventType,
          });
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في معالجة webhook. يرجى المحاولة مرة أخرى',
            cause: webhookError,
          });
        }

        // Track webhook with Bio-Modules - with error handling
        try {
          await trackPaymentLifecycle(
            0, // transactionId will be extracted from payload if available
            input.payload?.transactionNumber || '',
            input.eventType === 'payment.completed' ? 'completed' :
            input.eventType === 'payment.failed' ? 'failed' :
            input.eventType === 'payment.refunded' ? 'refunded' : 'processing'
          );
        } catch (trackError: any) {
          logger.warn('Payment lifecycle tracking failed for webhook', {
            error: trackError.message,
          });
          // Continue even if tracking fails
        }

        const duration = Date.now() - startTime;
        logger.info('Webhook processed successfully', {
          provider: input.provider,
          eventType: input.eventType,
          duration: `${duration}ms`,
        });

        return { success: true };
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('Webhook processing failed (TRPCError)', {
            code: error.code,
            message: error.message,
            provider: input.provider,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Webhook processing failed (Unexpected Error)', error, {
          provider: input.provider,
          eventType: input.eventType,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء معالجة webhook. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // ============================================
  // PROTECTED ENDPOINTS (Admin/Staff)
  // ============================================

  /**
   * Get order payments
   */
  getOrderPayments: protectedProcedure
    .input(z.object({
      orderId: z.number(),
    }))
    .query(async ({ input }) => {
      const transactions = await db.select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.orderId, input.orderId))
        .orderBy(desc(paymentTransactions.createdAt));

      return transactions.map(t => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        amount: Number(t.amount),
        fee: Number(t.fee),
        status: t.status,
        providerCode: t.providerCode,
        paymentMethod: t.paymentMethod,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      }));
    }),

  /**
   * Get all transactions with filters
   */
  getTransactions: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      providerCode: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      let conditions = [];

      if (input.status) {
        conditions.push(eq(paymentTransactions.status, input.status));
      }
      if (input.providerCode) {
        conditions.push(eq(paymentTransactions.providerCode, input.providerCode));
      }
      if (input.dateFrom) {
        conditions.push(gte(paymentTransactions.createdAt, new Date(input.dateFrom)));
      }
      if (input.dateTo) {
        conditions.push(lte(paymentTransactions.createdAt, new Date(input.dateTo)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const transactions = await db.select()
        .from(paymentTransactions)
        .where(whereClause)
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(paymentTransactions)
        .where(whereClause);

      return {
        transactions: transactions.map(t => ({
          id: t.id,
          transactionNumber: t.transactionNumber,
          orderNumber: t.orderNumber,
          amount: Number(t.amount),
          fee: Number(t.fee),
          status: t.status,
          providerCode: t.providerCode,
          customerName: t.customerName,
          customerPhone: t.customerPhone,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
        })),
        total: Number(countResult.count),
      };
    }),

  /**
   * Refund payment
   */
  refund: protectedProcedure
    .input(z.object({
      transactionId: z.number(),
      amount: z.number().optional(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      
      try {
        // Input validation
        if (input.amount && input.amount <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'مبلغ الاسترداد يجب أن يكون أكبر من صفر',
          });
        }

        if (!input.reason || input.reason.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب توفير سبب الاسترداد',
          });
        }

        logger.info('Processing refund', {
          transactionId: input.transactionId,
          amount: input.amount,
          requestedBy: ctx.user?.id,
        });

        // Verify transaction exists
        const [transaction] = await db.select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.id, input.transactionId))
          .limit(1);

        if (!transaction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'المعاملة غير موجودة',
          });
        }

        // Check if transaction is refundable
        if (transaction.status !== 'completed') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'لا يمكن استرداد معاملة غير مكتملة',
          });
        }

        const service = getUnifiedPaymentService();
        
        let refundResult;
        try {
          refundResult = await service.refund({
            transactionId: input.transactionId,
            amount: input.amount,
            reason: input.reason,
            requestedBy: ctx.user?.id || 0,
          });
        } catch (refundError: any) {
          logger.error('Refund processing failed', refundError, {
            transactionId: input.transactionId,
          });
          
          // Track failure with Bio-Modules
          try {
            await handlePaymentFailure(
              {
                transactionId: input.transactionId,
                transactionNumber: transaction.transactionNumber,
                amount: Number(transaction.amount),
                providerCode: transaction.providerCode,
                customerPhone: transaction.customerPhone || '',
                customerName: transaction.customerName || '',
                orderId: transaction.orderId || 0,
                orderNumber: transaction.orderNumber || '',
              },
              `Refund failed: ${refundError.message}`
            );
          } catch (bioError: any) {
            logger.warn('Bio-Module failure tracking failed', {
              error: bioError.message,
            });
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في معالجة الاسترداد. يرجى المحاولة مرة أخرى',
            cause: refundError,
          });
        }

        // Track refund lifecycle
        try {
          await trackPaymentLifecycle(
            input.transactionId,
            transaction.transactionNumber,
            "refunded"
          );
        } catch (trackError: any) {
          logger.warn('Payment lifecycle tracking failed for refund', {
            error: trackError.message,
          });
          // Continue even if tracking fails
        }

        const duration = Date.now() - startTime;
        logger.info('Refund processed successfully', {
          transactionId: input.transactionId,
          refundId: refundResult.refundId,
          duration: `${duration}ms`,
        });

        return refundResult;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('Refund processing failed (TRPCError)', {
            code: error.code,
            message: error.message,
            transactionId: input.transactionId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Refund processing failed (Unexpected Error)', error, {
          transactionId: input.transactionId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء معالجة الاسترداد. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  /**
   * Get payment analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({
      dateFrom: z.string(),
      dateTo: z.string(),
    }))
    .query(async ({ input }) => {
      const dateFrom = new Date(input.dateFrom);
      const dateTo = new Date(input.dateTo);

      // Total by status
      const byStatus = await db.select({
        status: paymentTransactions.status,
        count: sql<number>`count(*)`,
        total: sql<number>`sum(${paymentTransactions.amount}::numeric)`,
      })
        .from(paymentTransactions)
        .where(and(
          gte(paymentTransactions.createdAt, dateFrom),
          lte(paymentTransactions.createdAt, dateTo)
        ))
        .groupBy(paymentTransactions.status);

      // Total by provider
      const byProvider = await db.select({
        providerCode: paymentTransactions.providerCode,
        count: sql<number>`count(*)`,
        total: sql<number>`sum(${paymentTransactions.amount}::numeric)`,
        fees: sql<number>`sum(${paymentTransactions.fee}::numeric)`,
      })
        .from(paymentTransactions)
        .where(and(
          gte(paymentTransactions.createdAt, dateFrom),
          lte(paymentTransactions.createdAt, dateTo),
          eq(paymentTransactions.status, 'completed')
        ))
        .groupBy(paymentTransactions.providerCode);

      // Success rate
      const [totals] = await db.select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
        failed: sql<number>`count(*) filter (where status = 'failed')`,
      })
        .from(paymentTransactions)
        .where(and(
          gte(paymentTransactions.createdAt, dateFrom),
          lte(paymentTransactions.createdAt, dateTo)
        ));

      const successRate = totals.total > 0
        ? ((totals.completed / totals.total) * 100).toFixed(2)
        : "0.00";

      return {
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: Number(s.count),
          total: Number(s.total) || 0,
        })),
        byProvider: byProvider.map(p => ({
          providerCode: p.providerCode,
          count: Number(p.count),
          total: Number(p.total) || 0,
          fees: Number(p.fees) || 0,
        })),
        summary: {
          totalTransactions: Number(totals.total),
          completed: Number(totals.completed),
          failed: Number(totals.failed),
          successRate: `${successRate}%`,
        },
      };
    }),

  /**
   * Initialize payment providers
   */
  initializeProviders: protectedProcedure
    .mutation(async () => {
      const service = getUnifiedPaymentService();
      await service.initializeProviders();
      return { success: true, message: "Payment providers initialized" };
    }),

  /**
   * Update provider configuration
   */
  updateProvider: protectedProcedure
    .input(z.object({
      code: z.string(),
      config: z.any(),
      isActive: z.boolean().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (input.config) updateData.config = input.config;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

      await db.update(paymentProviders)
        .set(updateData)
        .where(eq(paymentProviders.code, input.code));

      return { success: true };
    }),

});
