/**
 * Payment Service
 * خدمة المدفوعات
 *
 * Business logic layer for payment operations.
 * Separates business logic from router layer.
 */

import { db } from '../db';
import { paymentTransactions, paymentProviders } from '../../drizzle/schema-payments';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { logger } from '../_core/logger';
import { getUnifiedPaymentService } from './unified-payment.service';
import {
  validatePaymentWithArachnid,
  trackPaymentLifecycle,
  handlePaymentFailure,
} from '../bio-modules/payment-bio-integration.js';
import { invalidatePaymentCache } from '../_core/cache-manager';
import {
  validatePositiveNumber,
  validateEgyptianPhone,
} from '../_core/validation-utils';

// ============================================
// TYPES
// ============================================

export interface CreatePaymentInput {
  orderId: number;
  orderNumber: string;
  amount: number;
  providerCode: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  returnUrl?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  success: boolean;
  transactionId: number;
  transactionNumber: string;
  paymentUrl?: string;
  qrCode?: string;
  deepLink?: string;
  referenceCode?: string;
  referenceExpiry?: Date;
}

export interface GetPaymentStatusInput {
  transactionId?: number;
  transactionNumber?: string;
}

export interface PaymentStatusResult {
  transactionNumber: string;
  status: string;
  amount: number;
  fee: number;
  providerCode: string;
  paymentUrl?: string;
  qrCode?: string;
  deepLink?: string;
  referenceCode?: string;
  referenceExpiry?: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface CalculateFeeInput {
  amount: number;
  providerCode: string;
}

export interface CalculateFeeResult {
  amount: number;
  fee: number;
  total: number;
  netAmount: number;
}

// ============================================
// PAYMENT SERVICE
// ============================================

export class PaymentService {
  /**
   * Calculate payment fee
   */
  static async calculateFee(input: CalculateFeeInput): Promise<CalculateFeeResult> {
    validatePositiveNumber(input.amount, 'المبلغ');

    const [provider] = await db
      .select()
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
  }

  /**
   * Create payment
   */
  static async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // Input validation
    validatePositiveNumber(input.amount, 'المبلغ');
    validateEgyptianPhone(input.customer.phone);

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
    } catch (serviceError: unknown) {
      logger.error('Payment service failed', serviceError instanceof Error ? serviceError : new Error(String(serviceError)), {
        orderId: input.orderId,
        providerCode: input.providerCode,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في إنشاء الدفعة. يرجى المحاولة مرة أخرى',
        cause: serviceError instanceof Error ? serviceError : new Error(String(serviceError)),
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
      } catch (bioError: unknown) {
        logger.warn('Bio-Module validation failed, continuing anyway', {
          error: bioError instanceof Error ? bioError.message : String(bioError),
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
          'pending'
        );
      } catch (trackError: unknown) {
        logger.warn('Payment lifecycle tracking failed', {
          error: trackError instanceof Error ? trackError.message : String(trackError),
          transactionId: paymentResult.transactionId,
        });
        // Continue even if tracking fails
      }
    }

    logger.info('Payment created successfully', {
      transactionId: paymentResult.transactionId,
      transactionNumber: paymentResult.transactionNumber,
      amount: input.amount,
      providerCode: input.providerCode,
    });

    // Invalidate cache
    if (paymentResult.transactionId) {
      await invalidatePaymentCache({
        transactionId: paymentResult.transactionId,
        orderId: input.orderId,
        customerPhone: input.customer.phone,
      });
    }

    return paymentResult;
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(input: GetPaymentStatusInput): Promise<PaymentStatusResult> {
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

    const [transaction] = await db.select().from(paymentTransactions).where(condition).limit(1);

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
  }

  /**
   * Handle payment webhook
   */
  static async handleWebhook(
    provider: string,
    eventType: string,
    payload: Record<string, unknown>,
    signature?: string
  ): Promise<{ success: boolean }> {
    logger.info('Processing payment webhook', {
      provider,
      eventType,
    });

    const service = getUnifiedPaymentService();

    try {
      await service.handleWebhook(provider, eventType, payload, signature);
    } catch (webhookError: unknown) {
      logger.error('Webhook processing failed', webhookError instanceof Error ? webhookError : new Error(String(webhookError)), {
        provider,
        eventType,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في معالجة webhook. يرجى المحاولة مرة أخرى',
        cause: webhookError instanceof Error ? webhookError : new Error(String(webhookError)),
      });
    }

    // Track webhook with Bio-Modules - with error handling
    try {
      await trackPaymentLifecycle(
        0, // transactionId will be extracted from payload if available
        (payload?.transactionNumber as string) || '',
        eventType === 'payment.completed'
          ? 'completed'
          : eventType === 'payment.failed'
            ? 'failed'
            : eventType === 'payment.refunded'
              ? 'refunded'
              : 'processing'
      );
    } catch (trackError: unknown) {
      logger.warn('Payment lifecycle tracking failed for webhook', {
        error: trackError instanceof Error ? trackError.message : String(trackError),
      });
      // Continue even if tracking fails
    }

    logger.info('Webhook processed successfully', {
      provider,
      eventType,
    });

    return { success: true };
  }

  /**
   * Process refund
   */
  static async processRefund(
    transactionId: number,
    amount: number | undefined,
    reason: string,
    requestedBy: number
  ): Promise<{ success: boolean; refundId?: number; message: string }> {
    if (amount !== undefined) {
      validatePositiveNumber(amount, 'مبلغ الاسترداد');
    }

    if (!reason || reason.trim().length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'يجب توفير سبب الاسترداد',
      });
    }

    logger.info('Processing refund', {
      transactionId,
      amount,
      requestedBy,
    });

    // Verify transaction exists
    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.id, transactionId))
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
        transactionId,
        amount,
        reason,
        requestedBy,
      });
    } catch (refundError: unknown) {
      logger.error('Refund processing failed', refundError instanceof Error ? refundError : new Error(String(refundError)), {
        transactionId,
      });

      // Track failure with Bio-Modules
      try {
        await handlePaymentFailure(
          {
            transactionId,
            transactionNumber: transaction.transactionNumber,
            amount: Number(transaction.amount),
            providerCode: transaction.providerCode,
            customerPhone: transaction.customerPhone || '',
            customerName: transaction.customerName || '',
            orderId: transaction.orderId || 0,
            orderNumber: transaction.orderNumber || '',
          },
          `Refund failed: ${refundError instanceof Error ? refundError.message : String(refundError)}`
        );
      } catch (bioError: unknown) {
        logger.warn('Bio-Module failure tracking failed', {
          error: bioError instanceof Error ? bioError.message : String(bioError),
        });
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في معالجة الاسترداد. يرجى المحاولة مرة أخرى',
        cause: refundError instanceof Error ? refundError : new Error(String(refundError)),
      });
    }

    // Track refund lifecycle
    try {
      await trackPaymentLifecycle(
        transactionId,
        transaction.transactionNumber,
        'refunded'
      );
    } catch (trackError: unknown) {
      logger.warn('Payment lifecycle tracking failed for refund', {
        error: trackError instanceof Error ? trackError.message : String(trackError),
      });
      // Continue even if tracking fails
    }

    logger.info('Refund processed successfully', {
      transactionId,
      refundId: refundResult.refundId,
    });

    // Invalidate cache
    await invalidatePaymentCache({
      transactionId,
    });

    return refundResult;
  }
}

