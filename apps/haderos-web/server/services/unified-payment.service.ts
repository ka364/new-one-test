/**
 * Unified Payment Service
 * خدمة الدفع الموحدة
 *
 * Single interface for all payment methods in Egypt:
 * - InstaPay
 * - Mobile Wallets (Vodafone, Orange, Etisalat, WE)
 * - Cards (via Paymob)
 * - Fawry
 * - COD
 */

import { db } from "../db";
import {
  paymentProviders,
  paymentTransactions,
  paymentRefunds,
  paymentWebhooks,
  DEFAULT_PAYMENT_PROVIDERS
} from "../../drizzle/schema-payments";
import { orders } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { InstaPayService, createInstaPayService } from "../integrations/instapay";

// ============================================
// TYPES
// ============================================

export interface PaymentRequest {
  orderId: number;
  orderNumber: string;
  amount: number;
  currency?: string;
  providerCode: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  returnUrl?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId: number;
  transactionNumber: string;
  providerTransactionId?: string;
  status: string;
  paymentUrl?: string;
  qrCode?: string;
  deepLink?: string;
  referenceCode?: string;
  referenceExpiry?: Date;
  error?: string;
}

export interface RefundRequest {
  transactionId: number;
  amount?: number; // null for full refund
  reason: string;
  requestedBy: number;
}

// ============================================
// UNIFIED PAYMENT SERVICE
// ============================================

export class UnifiedPaymentService {
  private instaPayService: InstaPayService | null = null;

  constructor() {
    // Initialize InstaPay if configured
    if (process.env.INSTAPAY_MERCHANT_ID) {
      this.instaPayService = createInstaPayService();
    }
  }

  /**
   * Get available payment providers
   */
  async getAvailableProviders(amount?: number) {
    let query = db.select()
      .from(paymentProviders)
      .where(eq(paymentProviders.isActive, true))
      .orderBy(paymentProviders.displayOrder);

    const providers = await query;

    // Filter by amount if provided
    if (amount) {
      return providers.filter(p => {
        const min = Number(p.minAmount) || 0;
        const max = Number(p.maxAmount) || Infinity;
        return amount >= min && amount <= max;
      });
    }

    return providers;
  }

  /**
   * Calculate payment fee
   */
  calculateFee(amount: number, provider: typeof paymentProviders.$inferSelect): number {
    const fixedFee = Number(provider.fixedFee) || 0;
    const percentageFee = Number(provider.percentageFee) || 0;
    const minFee = Number(provider.minFee) || 0;
    const maxFee = provider.maxFee ? Number(provider.maxFee) : Infinity;

    let fee = fixedFee + (amount * percentageFee);
    fee = Math.max(fee, minFee);
    fee = Math.min(fee, maxFee);

    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate transaction number
   */
  private generateTransactionNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `PAY-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Create payment
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Get provider
    const [provider] = await db.select()
      .from(paymentProviders)
      .where(and(
        eq(paymentProviders.code, request.providerCode),
        eq(paymentProviders.isActive, true)
      ))
      .limit(1);

    if (!provider) {
      throw new Error(`Payment provider '${request.providerCode}' not found or inactive`);
    }

    // Validate amount
    const minAmount = Number(provider.minAmount) || 0;
    const maxAmount = Number(provider.maxAmount) || Infinity;

    if (request.amount < minAmount || request.amount > maxAmount) {
      throw new Error(`Amount must be between ${minAmount} and ${maxAmount} EGP for ${provider.name}`);
    }

    // Calculate fee
    const fee = this.calculateFee(request.amount, provider);
    const netAmount = request.amount - fee;

    // Create transaction record
    const transactionNumber = this.generateTransactionNumber();

    const [transaction] = await db.insert(paymentTransactions)
      .values({
        transactionNumber,
        orderId: request.orderId,
        orderNumber: request.orderNumber,
        providerId: provider.id,
        providerCode: provider.code,
        amount: String(request.amount),
        currency: request.currency || "EGP",
        fee: String(fee),
        netAmount: String(netAmount),
        status: "pending",
        customerName: request.customer.name,
        customerPhone: request.customer.phone,
        customerEmail: request.customer.email,
        metadata: request.metadata,
      })
      .returning();

    try {
      // Process based on provider type
      let result: Partial<PaymentResult> = {};

      switch (provider.type) {
        case "instant_payment":
          result = await this.processInstaPay(transaction, request, provider);
          break;

        case "mobile_wallet":
          result = await this.processMobileWallet(transaction, request, provider);
          break;

        case "card":
          result = await this.processCard(transaction, request, provider);
          break;

        case "reference_code":
          result = await this.processFawry(transaction, request, provider);
          break;

        case "cash":
          result = await this.processCOD(transaction, request);
          break;

        default:
          throw new Error(`Unsupported provider type: ${provider.type}`);
      }

      // Update transaction with provider response
      await db.update(paymentTransactions)
        .set({
          providerTransactionId: result.providerTransactionId,
          paymentUrl: result.paymentUrl,
          qrCode: result.qrCode,
          deepLink: result.deepLink,
          referenceCode: result.referenceCode,
          referenceExpiry: result.referenceExpiry,
          status: "processing",
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, transaction.id));

      return {
        success: true,
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        status: "processing",
        ...result,
      };

    } catch (error: any) {
      // Update transaction with error
      await db.update(paymentTransactions)
        .set({
          status: "failed",
          failureReason: error.message,
          failedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, transaction.id));

      return {
        success: false,
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        status: "failed",
        error: error.message,
      };
    }
  }

  /**
   * Process InstaPay payment
   */
  private async processInstaPay(
    transaction: typeof paymentTransactions.$inferSelect,
    request: PaymentRequest,
    provider: typeof paymentProviders.$inferSelect
  ): Promise<Partial<PaymentResult>> {
    if (!this.instaPayService) {
      throw new Error("InstaPay is not configured");
    }

    const response = await this.instaPayService.createPayment({
      amount: request.amount,
      orderId: request.orderNumber,
      description: `Order ${request.orderNumber}`,
      customer: {
        mobileNumber: request.customer.phone,
        name: request.customer.name,
        email: request.customer.email,
      },
      callbackUrl: request.callbackUrl,
      returnUrl: request.returnUrl,
      metadata: {
        transactionId: transaction.id,
        ...request.metadata,
      },
    });

    return {
      providerTransactionId: response.transactionId,
      paymentUrl: response.paymentUrl,
      qrCode: response.qrCode,
      deepLink: response.deepLink,
    };
  }

  /**
   * Process Mobile Wallet payment (Paymob)
   */
  private async processMobileWallet(
    transaction: typeof paymentTransactions.$inferSelect,
    request: PaymentRequest,
    provider: typeof paymentProviders.$inferSelect
  ): Promise<Partial<PaymentResult>> {
    const config = provider.config as any;

    if (!config?.apiKey) {
      throw new Error(`${provider.name} is not configured`);
    }

    // Step 1: Get auth token
    const authResponse = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: config.apiKey }),
    });

    if (!authResponse.ok) {
      throw new Error("Paymob authentication failed");
    }

    const { token } = await authResponse.json();

    // Step 2: Create order
    const orderResponse = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: Math.round(request.amount * 100),
        currency: "EGP",
        merchant_order_id: request.orderNumber,
        items: [],
      }),
    });

    if (!orderResponse.ok) {
      throw new Error("Paymob order creation failed");
    }

    const orderData = await orderResponse.json();

    // Step 3: Get payment key
    const walletIntegrationId = this.getWalletIntegrationId(provider.code, config);

    const paymentKeyResponse = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: Math.round(request.amount * 100),
        expiration: 3600,
        order_id: orderData.id,
        billing_data: {
          first_name: request.customer.name.split(" ")[0] || "Customer",
          last_name: request.customer.name.split(" ").slice(1).join(" ") || "Customer",
          phone_number: request.customer.phone,
          email: request.customer.email || "customer@example.com",
          apartment: "NA",
          floor: "NA",
          street: "NA",
          building: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "Cairo",
          country: "EG",
          state: "NA",
        },
        currency: "EGP",
        integration_id: walletIntegrationId,
      }),
    });

    if (!paymentKeyResponse.ok) {
      throw new Error("Paymob payment key generation failed");
    }

    const { token: paymentKey } = await paymentKeyResponse.json();

    // Step 4: Initiate wallet payment
    const walletResponse = await fetch("https://accept.paymob.com/api/acceptance/payments/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: {
          identifier: request.customer.phone,
          subtype: "WALLET",
        },
        payment_token: paymentKey,
      }),
    });

    if (!walletResponse.ok) {
      throw new Error("Wallet payment initiation failed");
    }

    const walletData = await walletResponse.json();

    return {
      providerTransactionId: String(orderData.id),
      paymentUrl: walletData.redirect_url,
      deepLink: walletData.redirect_url,
    };
  }

  /**
   * Get wallet integration ID based on provider
   */
  private getWalletIntegrationId(providerCode: string, config: any): number {
    switch (providerCode) {
      case "vodafone_cash":
        return config.vodafoneIntegrationId;
      case "orange_cash":
        return config.orangeIntegrationId;
      case "etisalat_cash":
        return config.etisalatIntegrationId;
      case "we_pay":
        return config.wePayIntegrationId;
      default:
        return config.walletIntegrationId;
    }
  }

  /**
   * Process Card payment (Paymob)
   */
  private async processCard(
    transaction: typeof paymentTransactions.$inferSelect,
    request: PaymentRequest,
    provider: typeof paymentProviders.$inferSelect
  ): Promise<Partial<PaymentResult>> {
    const config = provider.config as any;

    if (!config?.apiKey || !config?.iframeId) {
      throw new Error("Paymob card payment is not configured");
    }

    // Step 1: Get auth token
    const authResponse = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: config.apiKey }),
    });

    const { token } = await authResponse.json();

    // Step 2: Create order
    const orderResponse = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: Math.round(request.amount * 100),
        currency: "EGP",
        merchant_order_id: request.orderNumber,
        items: [],
      }),
    });

    const orderData = await orderResponse.json();

    // Step 3: Get payment key
    const paymentKeyResponse = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: Math.round(request.amount * 100),
        expiration: 3600,
        order_id: orderData.id,
        billing_data: {
          first_name: request.customer.name.split(" ")[0] || "Customer",
          last_name: request.customer.name.split(" ").slice(1).join(" ") || "Customer",
          phone_number: request.customer.phone,
          email: request.customer.email || "customer@example.com",
          apartment: "NA",
          floor: "NA",
          street: "NA",
          building: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "Cairo",
          country: "EG",
          state: "NA",
        },
        currency: "EGP",
        integration_id: config.cardIntegrationId,
      }),
    });

    const { token: paymentKey } = await paymentKeyResponse.json();

    // Generate iframe URL
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${config.iframeId}?payment_token=${paymentKey}`;

    return {
      providerTransactionId: String(orderData.id),
      paymentUrl,
    };
  }

  /**
   * Process Fawry payment
   */
  private async processFawry(
    transaction: typeof paymentTransactions.$inferSelect,
    request: PaymentRequest,
    provider: typeof paymentProviders.$inferSelect
  ): Promise<Partial<PaymentResult>> {
    const config = provider.config as any;

    if (!config?.merchantCode) {
      throw new Error("Fawry is not configured");
    }

    // Generate reference code
    const referenceCode = `FWRY${Date.now()}${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
    const expiryHours = 48;
    const referenceExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // In production, you would call Fawry API here
    // For now, we generate a reference code

    return {
      providerTransactionId: referenceCode,
      referenceCode,
      referenceExpiry,
    };
  }

  /**
   * Process COD payment
   */
  private async processCOD(
    transaction: typeof paymentTransactions.$inferSelect,
    request: PaymentRequest
  ): Promise<Partial<PaymentResult>> {
    // COD doesn't need external processing
    // Just mark as pending until delivery

    return {
      providerTransactionId: `COD-${transaction.transactionNumber}`,
    };
  }

  /**
   * Handle webhook from payment provider
   */
  async handleWebhook(provider: string, eventType: string, payload: any, signature?: string): Promise<void> {
    // Log webhook
    const [webhook] = await db.insert(paymentWebhooks)
      .values({
        provider,
        eventType,
        payload,
        signature,
        signatureValid: null, // Will be updated after verification
      })
      .returning();

    try {
      // Find transaction
      let transactionId: number | undefined;

      if (provider === "instapay" && payload.orderId) {
        const [tx] = await db.select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.orderNumber, payload.orderId))
          .limit(1);
        transactionId = tx?.id;
      } else if (provider === "paymob" && payload.obj?.order?.merchant_order_id) {
        const [tx] = await db.select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.orderNumber, payload.obj.order.merchant_order_id))
          .limit(1);
        transactionId = tx?.id;
      }

      if (transactionId) {
        // Update webhook with transaction reference
        await db.update(paymentWebhooks)
          .set({ transactionId })
          .where(eq(paymentWebhooks.id, webhook.id));

        // Process based on event type
        const newStatus = this.mapEventToStatus(provider, eventType, payload);

        if (newStatus) {
          await db.update(paymentTransactions)
            .set({
              status: newStatus,
              completedAt: newStatus === "completed" ? new Date() : undefined,
              failedAt: newStatus === "failed" ? new Date() : undefined,
              failureReason: newStatus === "failed" ? payload.failure_reason : undefined,
              providerResponse: payload,
              updatedAt: new Date(),
            })
            .where(eq(paymentTransactions.id, transactionId));

          // Update order status if payment completed
          if (newStatus === "completed") {
            const [tx] = await db.select()
              .from(paymentTransactions)
              .where(eq(paymentTransactions.id, transactionId))
              .limit(1);

            if (tx) {
              await db.update(orders)
                .set({
                  paymentStatus: "paid",
                  updatedAt: new Date(),
                })
                .where(eq(orders.id, tx.orderId));
            }
          }
        }
      }

      // Mark webhook as processed
      await db.update(paymentWebhooks)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(paymentWebhooks.id, webhook.id));

    } catch (error: any) {
      // Log error
      await db.update(paymentWebhooks)
        .set({
          error: error.message,
          retryCount: sql`${paymentWebhooks.retryCount} + 1`,
        })
        .where(eq(paymentWebhooks.id, webhook.id));

      throw error;
    }
  }

  /**
   * Map webhook event to transaction status
   */
  private mapEventToStatus(provider: string, eventType: string, payload: any): string | null {
    if (provider === "instapay") {
      switch (eventType) {
        case "payment.completed": return "completed";
        case "payment.failed": return "failed";
        case "payment.expired": return "failed";
        case "refund.completed": return "refunded";
        default: return null;
      }
    }

    if (provider === "paymob") {
      if (payload.obj?.success === true) return "completed";
      if (payload.obj?.success === false) return "failed";
      return null;
    }

    return null;
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: number) {
    const [transaction] = await db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.id, transactionId))
      .limit(1);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return {
      transactionNumber: transaction.transactionNumber,
      status: transaction.status,
      amount: transaction.amount,
      fee: transaction.fee,
      netAmount: transaction.netAmount,
      providerCode: transaction.providerCode,
      paymentUrl: transaction.paymentUrl,
      referenceCode: transaction.referenceCode,
      referenceExpiry: transaction.referenceExpiry,
      completedAt: transaction.completedAt,
      failureReason: transaction.failureReason,
    };
  }

  /**
   * Process refund
   */
  async refund(request: RefundRequest): Promise<{ success: boolean; refundId?: number; error?: string }> {
    const [transaction] = await db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.id, request.transactionId))
      .limit(1);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "completed") {
      throw new Error("Can only refund completed transactions");
    }

    const refundAmount = request.amount || Number(transaction.amount);
    const refundNumber = `REF-${Date.now().toString(36)}`.toUpperCase();

    // Create refund record
    const [refund] = await db.insert(paymentRefunds)
      .values({
        refundNumber,
        transactionId: transaction.id,
        originalAmount: transaction.amount,
        refundAmount: String(refundAmount),
        reason: request.reason,
        requestedBy: request.requestedBy,
        status: "pending",
      })
      .returning();

    try {
      // Process refund with provider
      if (transaction.providerCode === "instapay" && this.instaPayService) {
        await this.instaPayService.refund({
          transactionId: transaction.providerTransactionId!,
          amount: refundAmount,
          reason: request.reason,
        });
      }
      // Add other provider refund logic here

      // Update refund status
      await db.update(paymentRefunds)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentRefunds.id, refund.id));

      // Update transaction status
      const newStatus = refundAmount >= Number(transaction.amount) ? "refunded" : "partially_refunded";
      await db.update(paymentTransactions)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, transaction.id));

      return { success: true, refundId: refund.id };

    } catch (error: any) {
      await db.update(paymentRefunds)
        .set({
          status: "failed",
          failureReason: error.message,
          failedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentRefunds.id, refund.id));

      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize default providers
   */
  async initializeProviders(): Promise<void> {
    for (const provider of DEFAULT_PAYMENT_PROVIDERS) {
      const existing = await db.select()
        .from(paymentProviders)
        .where(eq(paymentProviders.code, provider.code))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(paymentProviders)
          .values({
            code: provider.code,
            name: provider.name,
            nameAr: provider.nameAr,
            type: provider.type,
            fixedFee: String(provider.fixedFee),
            percentageFee: String(provider.percentageFee),
            minAmount: String(provider.minAmount),
            maxAmount: String(provider.maxAmount),
            displayOrder: provider.displayOrder,
            isActive: true,
          });
      }
    }

    console.log("✅ Payment providers initialized");
  }
}

// Singleton
let service: UnifiedPaymentService | null = null;

export function getUnifiedPaymentService(): UnifiedPaymentService {
  if (!service) {
    service = new UnifiedPaymentService();
  }
  return service;
}
