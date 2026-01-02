/**
 * InstaPay Integration - Central Bank of Egypt
 * تكامل InstaPay - البنك المركزي المصري
 *
 * InstaPay is Egypt's instant payment system with 12.5 million users
 * Processing EGP 2.9 trillion in transactions (2024)
 */

// InstaPay Configuration
const INSTAPAY_CONFIG = {
  production: {
    apiUrl: 'https://api.instapay.eg',
    authUrl: 'https://auth.instapay.eg',
  },
  sandbox: {
    apiUrl: 'https://sandbox-api.instapay.eg',
    authUrl: 'https://sandbox-auth.instapay.eg',
  },
};

// Payment Status
export enum InstaPayStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// Transaction Types
export enum InstaPayTransactionType {
  P2P = 'P2P', // Person to Person
  P2M = 'P2M', // Person to Merchant
  M2P = 'M2P', // Merchant to Person (Refund)
  BILL = 'BILL', // Bill Payment
  QR = 'QR', // QR Code Payment
}

// Interfaces
export interface InstaPayCredentials {
  merchantId: string;
  apiKey: string;
  secretKey: string;
  environment: 'production' | 'sandbox';
}

export interface InstaPayCustomer {
  mobileNumber: string; // رقم الموبايل (01xxxxxxxxx)
  nationalId?: string; // الرقم القومي
  name?: string;
  email?: string;
}

export interface InstaPayPaymentRequest {
  amount: number; // المبلغ بالجنيه
  currency?: string; // العملة (default: EGP)
  orderId: string; // رقم الطلب
  description?: string; // وصف المعاملة
  customer: InstaPayCustomer;
  expiryMinutes?: number; // مدة صلاحية الطلب (default: 15)
  callbackUrl?: string; // URL للإشعار
  returnUrl?: string; // URL بعد الدفع
  metadata?: Record<string, any>;
}

export interface InstaPayPaymentResponse {
  transactionId: string;
  paymentUrl: string; // رابط الدفع
  qrCode?: string; // رمز QR
  deepLink?: string; // رابط التطبيق
  expiresAt: string; // تاريخ انتهاء الصلاحية
  status: InstaPayStatus;
}

export interface InstaPayTransaction {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: InstaPayStatus;
  type: InstaPayTransactionType;
  customer: InstaPayCustomer;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface InstaPayRefundRequest {
  transactionId: string; // معرف المعاملة الأصلية
  amount?: number; // المبلغ (للاسترجاع الجزئي)
  reason?: string; // سبب الاسترجاع
}

export interface InstaPayWebhookPayload {
  event: 'payment.completed' | 'payment.failed' | 'payment.expired' | 'refund.completed';
  transactionId: string;
  orderId: string;
  amount: number;
  status: InstaPayStatus;
  timestamp: string;
  signature: string;
}

/**
 * InstaPay Service
 */
export class InstaPayService {
  private credentials: InstaPayCredentials;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(credentials: InstaPayCredentials) {
    this.credentials = credentials;
  }

  /**
   * Get API URLs based on environment
   */
  private getUrls() {
    return INSTAPAY_CONFIG[this.credentials.environment];
  }

  /**
   * Authenticate and get access token
   */
  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const urls = this.getUrls();

    const response = await fetch(`${urls.authUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: this.credentials.merchantId,
        apiKey: this.credentials.apiKey,
        secretKey: this.credentials.secretKey,
        grantType: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`InstaPay authentication failed: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.accessToken;
    this.tokenExpiry = new Date(Date.now() + (data.expiresIn - 60) * 1000);

    return this.accessToken;
  }

  /**
   * Create payment request
   */
  async createPayment(request: InstaPayPaymentRequest): Promise<InstaPayPaymentResponse> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency || 'EGP',
        orderId: request.orderId,
        description: request.description,
        customer: {
          mobileNumber: this.formatMobileNumber(request.customer.mobileNumber),
          nationalId: request.customer.nationalId,
          name: request.customer.name,
          email: request.customer.email,
        },
        expiryMinutes: request.expiryMinutes || 15,
        callbackUrl: request.callbackUrl,
        returnUrl: request.returnUrl,
        metadata: request.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`InstaPay payment creation failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<InstaPayTransaction> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/v1/payments/${transactionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`InstaPay get payment failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<InstaPayTransaction> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/v1/payments/order/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`InstaPay get payment by order failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Process refund
   */
  async refund(request: InstaPayRefundRequest): Promise<InstaPayTransaction> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/v1/refunds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId: request.transactionId,
        amount: request.amount, // null for full refund
        reason: request.reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`InstaPay refund failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Generate QR code for payment
   */
  async generateQRCode(request: InstaPayPaymentRequest): Promise<{
    qrCode: string;
    paymentUrl: string;
    transactionId: string;
  }> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/v1/payments/qr`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency || 'EGP',
        orderId: request.orderId,
        description: request.description,
        expiryMinutes: request.expiryMinutes || 15,
        metadata: request.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`InstaPay QR generation failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(params: {
    startDate?: string;
    endDate?: string;
    status?: InstaPayStatus;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: InstaPayTransaction[]; total: number }> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const response = await fetch(`${urls.apiUrl}/v1/transactions?${queryParams}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`InstaPay get transactions failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: InstaPayWebhookPayload, signature: string): boolean {
    const crypto = require('crypto');
    const data = `${payload.transactionId}|${payload.orderId}|${payload.amount}|${payload.timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(data)
      .digest('hex');
    return signature === expectedSignature;
  }

  /**
   * Format mobile number to Egyptian format
   */
  private formatMobileNumber(number: string): string {
    // Remove any non-digit characters
    let cleaned = number.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('20')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('+20')) {
      cleaned = cleaned.substring(3);
    }

    // Ensure it starts with 0
    if (!cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }

    // Validate Egyptian mobile number
    if (!/^01[0125]\d{8}$/.test(cleaned)) {
      throw new Error('Invalid Egyptian mobile number');
    }

    return cleaned;
  }

  /**
   * Cancel pending payment
   */
  async cancelPayment(transactionId: string): Promise<void> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/v1/payments/${transactionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`InstaPay cancel payment failed: ${JSON.stringify(error)}`);
    }
  }
}

/**
 * Create InstaPay service instance
 */
export function createInstaPayService(): InstaPayService {
  const credentials: InstaPayCredentials = {
    merchantId: process.env.INSTAPAY_MERCHANT_ID || '',
    apiKey: process.env.INSTAPAY_API_KEY || '',
    secretKey: process.env.INSTAPAY_SECRET_KEY || '',
    environment: (process.env.INSTAPAY_ENVIRONMENT as 'production' | 'sandbox') || 'sandbox',
  };

  return new InstaPayService(credentials);
}

export default InstaPayService;
