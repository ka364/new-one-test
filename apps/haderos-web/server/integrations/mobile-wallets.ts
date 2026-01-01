/**
 * Mobile Wallets Integration - Vodafone Cash, Orange Money, Etisalat Cash, WE Pay
 * تكامل المحافظ الإلكترونية
 *
 * Vodafone Cash is the most popular with 20% discounts on Amazon/Noon
 * Total mobile wallets processed EGP 2.9 trillion in 2024
 */

// Wallet Providers
export enum WalletProvider {
  VODAFONE_CASH = 'VODAFONE_CASH',
  ORANGE_MONEY = 'ORANGE_MONEY',
  ETISALAT_CASH = 'ETISALAT_CASH',
  WE_PAY = 'WE_PAY',
}

// Provider Configurations
const WALLET_CONFIGS = {
  [WalletProvider.VODAFONE_CASH]: {
    production: {
      apiUrl: 'https://api.vodafone.com.eg/vfcash',
    },
    sandbox: {
      apiUrl: 'https://sandbox-api.vodafone.com.eg/vfcash',
    },
    prefix: '010',
  },
  [WalletProvider.ORANGE_MONEY]: {
    production: {
      apiUrl: 'https://api.orange.eg/money',
    },
    sandbox: {
      apiUrl: 'https://sandbox-api.orange.eg/money',
    },
    prefix: '012',
  },
  [WalletProvider.ETISALAT_CASH]: {
    production: {
      apiUrl: 'https://api.etisalat.eg/cash',
    },
    sandbox: {
      apiUrl: 'https://sandbox-api.etisalat.eg/cash',
    },
    prefix: '011',
  },
  [WalletProvider.WE_PAY]: {
    production: {
      apiUrl: 'https://api.te.eg/wepay',
    },
    sandbox: {
      apiUrl: 'https://sandbox-api.te.eg/wepay',
    },
    prefix: '015',
  },
};

// Payment Status
export enum WalletPaymentStatus {
  PENDING = 'PENDING',
  OTP_SENT = 'OTP_SENT',
  OTP_VERIFIED = 'OTP_VERIFIED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

// Interfaces
export interface WalletCredentials {
  provider: WalletProvider;
  merchantId: string;
  merchantCode: string;
  apiKey: string;
  secretKey: string;
  environment: 'production' | 'sandbox';
}

export interface WalletCustomer {
  mobileNumber: string;       // رقم المحفظة
  name?: string;
  nationalId?: string;
}

export interface WalletPaymentRequest {
  amount: number;             // المبلغ بالجنيه
  orderId: string;            // رقم الطلب
  description?: string;
  customer: WalletCustomer;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface WalletPaymentResponse {
  transactionId: string;
  referenceNumber: string;
  status: WalletPaymentStatus;
  otpRequired: boolean;
  message?: string;
}

export interface WalletOTPVerification {
  transactionId: string;
  otp: string;
}

export interface WalletTransaction {
  transactionId: string;
  referenceNumber: string;
  orderId: string;
  amount: number;
  fee?: number;
  netAmount?: number;
  status: WalletPaymentStatus;
  provider: WalletProvider;
  customer: WalletCustomer;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface WalletRefundRequest {
  transactionId: string;
  amount?: number;            // للاسترجاع الجزئي
  reason?: string;
}

export interface WalletWebhookPayload {
  event: 'payment.completed' | 'payment.failed' | 'refund.completed';
  provider: WalletProvider;
  transactionId: string;
  referenceNumber: string;
  orderId: string;
  amount: number;
  status: WalletPaymentStatus;
  timestamp: string;
  signature: string;
}

/**
 * Base Wallet Service
 */
abstract class BaseWalletService {
  protected credentials: WalletCredentials;
  protected accessToken: string | null = null;
  protected tokenExpiry: Date | null = null;

  constructor(credentials: WalletCredentials) {
    this.credentials = credentials;
  }

  protected getConfig() {
    return WALLET_CONFIGS[this.credentials.provider];
  }

  protected getApiUrl(): string {
    const config = this.getConfig();
    return config[this.credentials.environment].apiUrl;
  }

  protected abstract authenticate(): Promise<string>;

  abstract createPayment(request: WalletPaymentRequest): Promise<WalletPaymentResponse>;
  abstract verifyOTP(verification: WalletOTPVerification): Promise<WalletTransaction>;
  abstract getPaymentStatus(transactionId: string): Promise<WalletTransaction>;
  abstract refund(request: WalletRefundRequest): Promise<WalletTransaction>;

  /**
   * Detect wallet provider from mobile number
   */
  static detectProvider(mobileNumber: string): WalletProvider | null {
    const cleaned = mobileNumber.replace(/\D/g, '').replace(/^20/, '');
    const prefix = cleaned.substring(0, 3);

    for (const [provider, config] of Object.entries(WALLET_CONFIGS)) {
      if (config.prefix === prefix) {
        return provider as WalletProvider;
      }
    }
    return null;
  }

  /**
   * Validate Egyptian mobile number
   */
  protected validateMobileNumber(number: string): string {
    let cleaned = number.replace(/\D/g, '');

    if (cleaned.startsWith('20')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('+20')) {
      cleaned = cleaned.substring(3);
    }

    if (!cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }

    if (!/^01[0125]\d{8}$/.test(cleaned)) {
      throw new Error('Invalid Egyptian mobile number');
    }

    return cleaned;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: WalletWebhookPayload): boolean {
    const crypto = require('crypto');
    const data = `${payload.transactionId}|${payload.orderId}|${payload.amount}|${payload.timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(data)
      .digest('hex');
    return payload.signature === expectedSignature;
  }
}

/**
 * Vodafone Cash Service
 */
export class VodafoneCashService extends BaseWalletService {
  constructor(credentials: Omit<WalletCredentials, 'provider'>) {
    super({ ...credentials, provider: WalletProvider.VODAFONE_CASH });
  }

  protected async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(`${this.getApiUrl()}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: this.credentials.merchantId,
        apiKey: this.credentials.apiKey,
        secretKey: this.credentials.secretKey,
      }),
    });

    if (!response.ok) {
      throw new Error('Vodafone Cash authentication failed');
    }

    const data = await response.json();
    this.accessToken = data.accessToken;
    this.tokenExpiry = new Date(Date.now() + (data.expiresIn - 60) * 1000);

    return this.accessToken;
  }

  async createPayment(request: WalletPaymentRequest): Promise<WalletPaymentResponse> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getApiUrl()}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        orderId: request.orderId,
        description: request.description,
        walletNumber: this.validateMobileNumber(request.customer.mobileNumber),
        customerName: request.customer.name,
        callbackUrl: request.callbackUrl,
        metadata: request.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vodafone Cash payment failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async verifyOTP(verification: WalletOTPVerification): Promise<WalletTransaction> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getApiUrl()}/payments/${verification.transactionId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp: verification.otp,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vodafone Cash OTP verification failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async getPaymentStatus(transactionId: string): Promise<WalletTransaction> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getApiUrl()}/payments/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vodafone Cash get payment failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async refund(request: WalletRefundRequest): Promise<WalletTransaction> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getApiUrl()}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId: request.transactionId,
        amount: request.amount,
        reason: request.reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vodafone Cash refund failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Check wallet balance
   */
  async checkBalance(walletNumber: string): Promise<{ available: number; pending: number }> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getApiUrl()}/wallets/${this.validateMobileNumber(walletNumber)}/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vodafone Cash balance check failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }
}

/**
 * Orange Money Service
 */
export class OrangeMoneyService extends BaseWalletService {
  constructor(credentials: Omit<WalletCredentials, 'provider'>) {
    super({ ...credentials, provider: WalletProvider.ORANGE_MONEY });
  }

  protected async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(`${this.getApiUrl()}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.credentials.apiKey}:${this.credentials.secretKey}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Orange Money authentication failed');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);

    return this.accessToken;
  }

  async createPayment(request: WalletPaymentRequest): Promise<WalletPaymentResponse> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getApiUrl()}/mp/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantCode: this.credentials.merchantCode,
        amount: {
          value: request.amount,
          currency: 'EGP',
        },
        orderId: request.orderId,
        description: request.description,
        subscriber: {
          msisdn: this.validateMobileNumber(request.customer.mobileNumber),
        },
        callbackUrl: request.callbackUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Orange Money payment failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async verifyOTP(verification: WalletOTPVerification): Promise<WalletTransaction> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getApiUrl()}/mp/pay/${verification.transactionId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp: verification.otp,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Orange Money OTP verification failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async getPaymentStatus(transactionId: string): Promise<WalletTransaction> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getApiUrl()}/mp/pay/${transactionId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Orange Money get payment failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async refund(request: WalletRefundRequest): Promise<WalletTransaction> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getApiUrl()}/mp/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalTransactionId: request.transactionId,
        amount: request.amount,
        reason: request.reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Orange Money refund failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }
}

/**
 * Unified Mobile Wallet Service
 * Automatically routes to the correct provider based on mobile number
 */
export class UnifiedMobileWalletService {
  private providers: Map<WalletProvider, BaseWalletService> = new Map();

  /**
   * Register a wallet provider
   */
  registerProvider(provider: WalletProvider, service: BaseWalletService): void {
    this.providers.set(provider, service);
  }

  /**
   * Get provider service
   */
  private getProviderService(mobileNumber: string): BaseWalletService {
    const provider = BaseWalletService.detectProvider(mobileNumber);
    if (!provider) {
      throw new Error('Cannot detect wallet provider from mobile number');
    }

    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Wallet provider ${provider} is not configured`);
    }

    return service;
  }

  /**
   * Create payment - automatically routes to correct provider
   */
  async createPayment(request: WalletPaymentRequest): Promise<WalletPaymentResponse> {
    const service = this.getProviderService(request.customer.mobileNumber);
    return service.createPayment(request);
  }

  /**
   * Verify OTP
   */
  async verifyOTP(
    mobileNumber: string,
    verification: WalletOTPVerification
  ): Promise<WalletTransaction> {
    const service = this.getProviderService(mobileNumber);
    return service.verifyOTP(verification);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    mobileNumber: string,
    transactionId: string
  ): Promise<WalletTransaction> {
    const service = this.getProviderService(mobileNumber);
    return service.getPaymentStatus(transactionId);
  }

  /**
   * Process refund
   */
  async refund(
    mobileNumber: string,
    request: WalletRefundRequest
  ): Promise<WalletTransaction> {
    const service = this.getProviderService(mobileNumber);
    return service.refund(request);
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(mobileNumber: string): boolean {
    const provider = BaseWalletService.detectProvider(mobileNumber);
    return provider !== null && this.providers.has(provider);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): WalletProvider[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Create unified wallet service with all providers
 */
export function createUnifiedWalletService(): UnifiedMobileWalletService {
  const service = new UnifiedMobileWalletService();

  // Register Vodafone Cash
  if (process.env.VODAFONE_CASH_MERCHANT_ID) {
    service.registerProvider(
      WalletProvider.VODAFONE_CASH,
      new VodafoneCashService({
        merchantId: process.env.VODAFONE_CASH_MERCHANT_ID,
        merchantCode: process.env.VODAFONE_CASH_MERCHANT_CODE || '',
        apiKey: process.env.VODAFONE_CASH_API_KEY || '',
        secretKey: process.env.VODAFONE_CASH_SECRET_KEY || '',
        environment: (process.env.VODAFONE_CASH_ENVIRONMENT as 'production' | 'sandbox') || 'sandbox',
      })
    );
  }

  // Register Orange Money
  if (process.env.ORANGE_MONEY_MERCHANT_ID) {
    service.registerProvider(
      WalletProvider.ORANGE_MONEY,
      new OrangeMoneyService({
        merchantId: process.env.ORANGE_MONEY_MERCHANT_ID,
        merchantCode: process.env.ORANGE_MONEY_MERCHANT_CODE || '',
        apiKey: process.env.ORANGE_MONEY_API_KEY || '',
        secretKey: process.env.ORANGE_MONEY_SECRET_KEY || '',
        environment: (process.env.ORANGE_MONEY_ENVIRONMENT as 'production' | 'sandbox') || 'sandbox',
      })
    );
  }

  return service;
}

export default UnifiedMobileWalletService;
