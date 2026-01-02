/**
 * 🔄 Returns & Refunds Router
 * نظام الإرجاع والاسترداد المتكامل
 *
 * Features:
 * - Return request creation & management
 * - Return inspection workflow
 * - Refund processing
 * - Return policies
 * - Analytics & reporting
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { eq, and, desc, sql, gte, lte, inArray, or, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';

// Import schema
import {
  returnReasons,
  returnRequests,
  returnItems,
  returnStatusHistory,
  refundTransactions,
  returnPolicies,
} from '../../drizzle/schema-returns';

// ============================================
// TYPES & VALIDATORS
// ============================================

const returnStatusEnum = z.enum([
  'pending',
  'approved',
  'rejected',
  'pickup_scheduled',
  'picked_up',
  'received',
  'inspecting',
  'inspection_passed',
  'inspection_failed',
  'refund_pending',
  'refund_processing',
  'refund_completed',
  'exchange_processing',
  'exchange_completed',
  'closed',
  'cancelled',
]);

const refundMethodEnum = z.enum([
  'original_payment',
  'store_credit',
  'bank_transfer',
  'wallet',
  'cash',
]);

const returnTypeEnum = z.enum(['refund', 'exchange', 'store_credit']);

// ============================================
// ROUTER
// ============================================

export const returnsRouter = router({
  // ==========================================
  // RETURN REASONS
  // ==========================================

  /**
   * Get all active return reasons
   */
  getReturnReasons: publicProcedure.query(async () => {
    const db = await getDb();

    const reasons = await db
      .select()
      .from(returnReasons)
      .where(eq(returnReasons.isActive, true))
      .orderBy(returnReasons.sortOrder);

    return reasons;
  }),

  // ==========================================
  // RETURN REQUESTS
  // ==========================================

  /**
   * Create new return request
   */
  createReturnRequest: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        orderNumber: z.string(),
        returnType: returnTypeEnum,
        preferredRefundMethod: refundMethodEnum,
        items: z.array(
          z.object({
            orderItemId: z.number(),
            productId: z.number(),
            variantId: z.number().optional(),
            productName: z.string(),
            quantity: z.number().min(1),
            unitPrice: z.number(),
            reasonId: z.number(),
            reasonDetails: z.string().optional(),
            photoUrls: z.array(z.string()).optional(),
          })
        ),
        pickupAddress: z
          .object({
            street: z.string(),
            city: z.string(),
            governorate: z.string(),
            phone: z.string(),
          })
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const returnId = uuidv4();
      const requestNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Calculate totals
      const totalAmount = input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      // Create return request
      await db.insert(returnRequests).values({
        id: returnId,
        requestNumber,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        customerId: ctx.user.id,
        customerEmail: ctx.user.email,
        returnType: input.returnType,
        status: 'pending',
        totalAmount: totalAmount.toString(),
        preferredRefundMethod: input.preferredRefundMethod,
        pickupAddress: input.pickupAddress,
        notes: input.notes,
      });

      // Create return items
      for (const item of input.items) {
        await db.insert(returnItems).values({
          returnId,
          orderItemId: item.orderItemId,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          quantityRequested: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: (item.unitPrice * item.quantity).toString(),
          reasonId: item.reasonId,
          reasonDetails: item.reasonDetails,
          photoUrls: item.photoUrls || [],
          status: 'pending',
        });
      }

      // Create status history
      await db.insert(returnStatusHistory).values({
        returnId,
        fromStatus: null,
        toStatus: 'pending',
        changedBy: ctx.user.id,
        notes: 'طلب إرجاع جديد',
      });

      return {
        returnId,
        requestNumber,
        message: 'تم إنشاء طلب الإرجاع بنجاح',
      };
    }),

  /**
   * Get return request by ID
   */
  getReturnRequest: protectedProcedure
    .input(z.object({ returnId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const request = await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.id, input.returnId))
        .limit(1);

      if (request.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'طلب الإرجاع غير موجود',
        });
      }

      // Get items
      const items = await db
        .select()
        .from(returnItems)
        .where(eq(returnItems.returnId, input.returnId));

      // Get status history
      const history = await db
        .select()
        .from(returnStatusHistory)
        .where(eq(returnStatusHistory.returnId, input.returnId))
        .orderBy(desc(returnStatusHistory.createdAt));

      return {
        ...request[0],
        items,
        statusHistory: history,
      };
    }),

  /**
   * Get customer's return requests
   */
  getMyReturnRequests: protectedProcedure
    .input(
      z.object({
        status: returnStatusEnum.optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const requests = await db
        .select()
        .from(returnRequests)
        .where(
          and(
            eq(returnRequests.customerId, ctx.user.id),
            input.status ? eq(returnRequests.status, input.status) : undefined
          )
        )
        .orderBy(desc(returnRequests.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return requests;
    }),

  /**
   * Get all return requests (admin)
   */
  getAllReturnRequests: protectedProcedure
    .input(
      z.object({
        status: returnStatusEnum.optional(),
        returnType: returnTypeEnum.optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const conditions = [];
      if (input.status) {
        conditions.push(eq(returnRequests.status, input.status));
      }
      if (input.returnType) {
        conditions.push(eq(returnRequests.returnType, input.returnType));
      }
      if (input.dateFrom) {
        conditions.push(gte(returnRequests.createdAt, input.dateFrom));
      }
      if (input.dateTo) {
        conditions.push(lte(returnRequests.createdAt, input.dateTo));
      }

      const requests = await db
        .select()
        .from(returnRequests)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(returnRequests.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return requests;
    }),

  // ==========================================
  // RETURN PROCESSING
  // ==========================================

  /**
   * Approve return request
   */
  approveReturn: protectedProcedure
    .input(
      z.object({
        returnId: z.string(),
        notes: z.string().optional(),
        schedulePickup: z.boolean().default(false),
        pickupDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const request = await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.id, input.returnId))
        .limit(1);

      if (request.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'طلب الإرجاع غير موجود',
        });
      }

      const newStatus = input.schedulePickup ? 'pickup_scheduled' : 'approved';

      await db
        .update(returnRequests)
        .set({
          status: newStatus,
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
          pickupScheduledDate: input.pickupDate,
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, input.returnId));

      // Update items status
      await db
        .update(returnItems)
        .set({ status: 'approved' })
        .where(eq(returnItems.returnId, input.returnId));

      // Create status history
      await db.insert(returnStatusHistory).values({
        returnId: input.returnId,
        fromStatus: request[0].status,
        toStatus: newStatus,
        changedBy: ctx.user.id,
        notes: input.notes || 'تمت الموافقة على طلب الإرجاع',
      });

      return { success: true, message: 'تمت الموافقة على طلب الإرجاع' };
    }),

  /**
   * Reject return request
   */
  rejectReturn: protectedProcedure
    .input(
      z.object({
        returnId: z.string(),
        rejectionReason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const request = await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.id, input.returnId))
        .limit(1);

      if (request.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'طلب الإرجاع غير موجود',
        });
      }

      await db
        .update(returnRequests)
        .set({
          status: 'rejected',
          rejectionReason: input.rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, input.returnId));

      // Update items status
      await db
        .update(returnItems)
        .set({ status: 'rejected' })
        .where(eq(returnItems.returnId, input.returnId));

      // Create status history
      await db.insert(returnStatusHistory).values({
        returnId: input.returnId,
        fromStatus: request[0].status,
        toStatus: 'rejected',
        changedBy: ctx.user.id,
        notes: `تم رفض الطلب: ${input.rejectionReason}`,
      });

      return { success: true, message: 'تم رفض طلب الإرجاع' };
    }),

  /**
   * Record inspection results
   */
  recordInspection: protectedProcedure
    .input(
      z.object({
        returnId: z.string(),
        items: z.array(
          z.object({
            itemId: z.number(),
            passed: z.boolean(),
            condition: z.enum(['new', 'like_new', 'good', 'fair', 'damaged']),
            notes: z.string().optional(),
            quantityAccepted: z.number(),
          })
        ),
        overallNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Update each item
      for (const item of input.items) {
        await db
          .update(returnItems)
          .set({
            quantityAccepted: item.quantityAccepted,
            itemCondition: item.condition,
            inspectionPassed: item.passed,
            inspectionNotes: item.notes,
            inspectedBy: ctx.user.id,
            inspectedAt: new Date(),
            status: item.passed ? 'inspection_passed' : 'inspection_failed',
          })
          .where(eq(returnItems.id, item.itemId));
      }

      // Check if all items passed
      const allPassed = input.items.every((item) => item.passed);
      const newStatus = allPassed ? 'inspection_passed' : 'inspection_failed';

      // Calculate refund amount
      const returnItems_ = await db
        .select()
        .from(returnItems)
        .where(eq(returnItems.returnId, input.returnId));

      const refundAmount = returnItems_.reduce((sum, item) => {
        if (item.inspectionPassed) {
          return sum + Number(item.unitPrice) * (item.quantityAccepted || 0);
        }
        return sum;
      }, 0);

      await db
        .update(returnRequests)
        .set({
          status: newStatus,
          refundAmount: refundAmount.toString(),
          inspectionCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, input.returnId));

      // Create status history
      await db.insert(returnStatusHistory).values({
        returnId: input.returnId,
        fromStatus: 'inspecting',
        toStatus: newStatus,
        changedBy: ctx.user.id,
        notes: input.overallNotes || (allPassed ? 'اجتاز الفحص' : 'فشل في الفحص'),
      });

      return {
        success: true,
        allPassed,
        refundAmount,
        message: allPassed ? 'تم اجتياز الفحص بنجاح' : 'بعض المنتجات لم تجتز الفحص',
      };
    }),

  // ==========================================
  // REFUND PROCESSING
  // ==========================================

  /**
   * Process refund
   */
  processRefund: protectedProcedure
    .input(
      z.object({
        returnId: z.string(),
        refundMethod: refundMethodEnum,
        amount: z.number(),
        bankDetails: z
          .object({
            bankName: z.string(),
            accountNumber: z.string(),
            accountName: z.string(),
          })
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const request = await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.id, input.returnId))
        .limit(1);

      if (request.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'طلب الإرجاع غير موجود',
        });
      }

      const transactionId = uuidv4();
      const transactionNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create refund transaction
      await db.insert(refundTransactions).values({
        id: transactionId,
        returnId: input.returnId,
        transactionNumber,
        customerId: request[0].customerId,
        amount: input.amount.toString(),
        refundMethod: input.refundMethod,
        status: 'processing',
        bankDetails: input.bankDetails,
        processedBy: ctx.user.id,
        notes: input.notes,
      });

      // Update return request
      await db
        .update(returnRequests)
        .set({
          status: 'refund_processing',
          actualRefundMethod: input.refundMethod,
          refundAmount: input.amount.toString(),
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, input.returnId));

      // Create status history
      await db.insert(returnStatusHistory).values({
        returnId: input.returnId,
        fromStatus: request[0].status,
        toStatus: 'refund_processing',
        changedBy: ctx.user.id,
        notes: `بدء معالجة الاسترداد: ${input.amount} جنيه`,
      });

      return {
        success: true,
        transactionId,
        transactionNumber,
        message: 'جاري معالجة الاسترداد',
      };
    }),

  /**
   * Complete refund
   */
  completeRefund: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        externalReference: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const transaction = await db
        .select()
        .from(refundTransactions)
        .where(eq(refundTransactions.id, input.transactionId))
        .limit(1);

      if (transaction.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'معاملة الاسترداد غير موجودة',
        });
      }

      // Update transaction
      await db
        .update(refundTransactions)
        .set({
          status: 'completed',
          externalReference: input.externalReference,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(refundTransactions.id, input.transactionId));

      // Update return request
      await db
        .update(returnRequests)
        .set({
          status: 'refund_completed',
          refundCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, transaction[0].returnId));

      // Create status history
      await db.insert(returnStatusHistory).values({
        returnId: transaction[0].returnId,
        fromStatus: 'refund_processing',
        toStatus: 'refund_completed',
        changedBy: ctx.user.id,
        notes: input.notes || 'تم إتمام الاسترداد بنجاح',
      });

      return { success: true, message: 'تم إتمام الاسترداد بنجاح' };
    }),

  // ==========================================
  // POLICIES
  // ==========================================

  /**
   * Get return policies
   */
  getPolicies: publicProcedure.query(async () => {
    const db = await getDb();

    const policies = await db
      .select()
      .from(returnPolicies)
      .where(eq(returnPolicies.isActive, true))
      .orderBy(returnPolicies.priority);

    return policies;
  }),

  /**
   * Check if order is eligible for return
   */
  checkEligibility: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        orderDate: z.date(),
        productCategories: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const policies = await db
        .select()
        .from(returnPolicies)
        .where(eq(returnPolicies.isActive, true));

      // Check against policies
      const applicablePolicy = policies.find((policy) => {
        const categories = (policy.applicableCategories as string[]) || [];
        if (categories.length > 0) {
          return input.productCategories.some((cat) => categories.includes(cat));
        }
        return true;
      });

      if (!applicablePolicy) {
        return {
          eligible: false,
          reason: 'لا توجد سياسة إرجاع متاحة لهذه المنتجات',
        };
      }

      const orderDate = new Date(input.orderDate);
      const now = new Date();
      const daysSinceOrder = Math.floor(
        (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceOrder > applicablePolicy.returnWindowDays) {
        return {
          eligible: false,
          reason: `انتهت فترة الإرجاع (${applicablePolicy.returnWindowDays} يوم)`,
          daysRemaining: 0,
        };
      }

      return {
        eligible: true,
        policy: applicablePolicy,
        daysRemaining: applicablePolicy.returnWindowDays - daysSinceOrder,
      };
    }),

  // ==========================================
  // ANALYTICS
  // ==========================================

  /**
   * Get returns statistics
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const conditions = [];
      if (input.dateFrom) {
        conditions.push(gte(returnRequests.createdAt, input.dateFrom));
      }
      if (input.dateTo) {
        conditions.push(lte(returnRequests.createdAt, input.dateTo));
      }

      const stats = await db
        .select({
          totalRequests: sql<number>`count(*)`,
          pendingRequests: sql<number>`count(*) filter (where status = 'pending')`,
          approvedRequests: sql<number>`count(*) filter (where status = 'approved')`,
          completedRefunds: sql<number>`count(*) filter (where status = 'refund_completed')`,
          totalRefundAmount: sql<number>`coalesce(sum(case when status = 'refund_completed' then cast(refund_amount as numeric) else 0 end), 0)`,
        })
        .from(returnRequests)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Get top return reasons
      const topReasons = await db
        .select({
          reasonId: returnItems.reasonId,
          count: sql<number>`count(*)`,
        })
        .from(returnItems)
        .groupBy(returnItems.reasonId)
        .orderBy(desc(sql`count(*)`))
        .limit(5);

      return {
        ...stats[0],
        topReasons,
      };
    }),
});
