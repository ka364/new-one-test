/**
 * Payment Router
 * راوتر الدفع الموحد
 */

import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getUnifiedPaymentService } from "../services/unified-payment.service";
import { db } from "../db";
import { paymentTransactions, paymentProviders, paymentRefunds } from "../../drizzle/schema-payments";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

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
      const [provider] = await db.select()
        .from(paymentProviders)
        .where(eq(paymentProviders.code, input.providerCode))
        .limit(1);

      if (!provider) {
        throw new Error("Payment provider not found");
      }

      const service = getUnifiedPaymentService();
      const fee = service.calculateFee(input.amount, provider);

      return {
        amount: input.amount,
        fee,
        total: input.amount + fee,
        netAmount: input.amount - fee,
      };
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
      const service = getUnifiedPaymentService();
      return await service.createPayment(input);
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
      if (!input.transactionId && !input.transactionNumber) {
        throw new Error("Either transactionId or transactionNumber is required");
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
        throw new Error("Transaction not found");
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
      const service = getUnifiedPaymentService();
      await service.handleWebhook(
        input.provider,
        input.eventType,
        input.payload,
        input.signature
      );
      return { success: true };
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
      const service = getUnifiedPaymentService();
      return await service.refund({
        transactionId: input.transactionId,
        amount: input.amount,
        reason: input.reason,
        requestedBy: ctx.user?.id || 0,
      });
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
