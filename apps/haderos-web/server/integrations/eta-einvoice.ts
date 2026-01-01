/**
 * Egyptian Tax Authority (ETA) E-Invoice Integration
 * الفاتورة الإلكترونية - مصلحة الضرائب المصرية
 *
 * This module handles integration with Egypt's mandatory e-invoicing system
 * Required for all B2B and B2C transactions in Egypt
 */

import crypto from 'crypto';

// ETA API Configuration
const ETA_CONFIG = {
  // Production URLs
  production: {
    tokenUrl: 'https://id.eta.gov.eg/connect/token',
    apiUrl: 'https://api.invoicing.eta.gov.eg/api/v1.0',
  },
  // Preprod/Testing URLs
  preprod: {
    tokenUrl: 'https://id.preprod.eta.gov.eg/connect/token',
    apiUrl: 'https://api.preprod.invoicing.eta.gov.eg/api/v1.0',
  },
};

// Invoice Types
export enum InvoiceType {
  INVOICE = 'I',           // فاتورة
  CREDIT_NOTE = 'C',       // إشعار دائن
  DEBIT_NOTE = 'D',        // إشعار مدين
}

// Document Types
export enum DocumentType {
  INVOICE = 'i',           // Invoice
  CREDIT = 'c',            // Credit Note
  DEBIT = 'd',             // Debit Note
}

// Tax Types
export enum TaxType {
  VAT = 'T1',              // Value Added Tax (ضريبة القيمة المضافة)
  TABLE_TAX = 'T2',        // Table Tax (ضريبة الجدول)
  WHT = 'T3',              // Withholding Tax (ضريبة الخصم)
  STAMP_TAX = 'T4',        // Stamp Tax (ضريبة الدمغة)
  ENTERTAINMENT = 'T5',    // Entertainment Tax (ضريبة الملاهي)
  RESOURCE_DEV = 'T6',     // Resource Development Fee (رسم تنمية الموارد)
  SERVICE_CHARGE = 'T7',   // Service Charge (رسم خدمة)
  MUNICIPAL_TAX = 'T8',    // Municipal Tax (ضريبة البلدية)
  MEDICAL_INSURANCE = 'T9', // Medical Insurance (تأمين طبي)
  OTHER = 'T10',           // Other Taxes (ضرائب أخرى)
}

// Tax Subtypes for VAT
export enum VATSubtype {
  VAT_14 = 'V001',         // 14% VAT
  VAT_0 = 'V002',          // 0% VAT (Zero Rated)
  VAT_EXEMPT = 'V003',     // VAT Exempt
  VAT_5 = 'V004',          // 5% VAT (specific goods)
}

// Activity Codes (based on ISIC)
export const ACTIVITY_CODES = {
  RETAIL_FOOTWEAR: '4772',      // Retail sale of footwear in specialized stores
  RETAIL_CLOTHING: '4771',      // Retail sale of clothing
  WHOLESALE_FOOTWEAR: '4641',   // Wholesale of textiles, clothing, footwear
  ECOMMERCE: '4791',            // Retail via mail order or internet
  MANUFACTURING_FOOTWEAR: '1520', // Manufacture of footwear
};

// Interfaces
export interface ETACredentials {
  clientId: string;
  clientSecret: string;
  registrationNumber: string; // الرقم الضريبي
  environment: 'production' | 'preprod';
}

export interface ETAAddress {
  branchId?: string;
  country: string;           // ISO 3166-1 alpha-2 (e.g., 'EG')
  governate: string;         // المحافظة
  regionCity: string;        // المدينة
  street: string;            // الشارع
  buildingNumber: string;    // رقم المبنى
  postalCode?: string;
  floor?: string;
  room?: string;
  landmark?: string;
  additionalInformation?: string;
}

export interface ETATaxpayer {
  rin: string;               // Registration ID Number (الرقم الضريبي)
  companyTradeName: string;  // الاسم التجاري
  branchCode: string;        // كود الفرع
  branchAddress: ETAAddress;
  deviceSerialNumber?: string;
  activityCode: string;      // كود النشاط
  name: string;              // اسم الشركة
  type: 'B' | 'P' | 'F';     // B=Business, P=Person, F=Foreigner
}

export interface ETAInvoiceLine {
  description: string;       // وصف المنتج
  itemType: 'GS1' | 'EGS';   // GS1 = Global, EGS = Egyptian
  itemCode: string;          // كود المنتج
  unitType: string;          // وحدة القياس (e.g., 'EA' = Each)
  quantity: number;
  unitValue: {
    currencySold: string;    // العملة (e.g., 'EGP')
    amountEGP: number;       // المبلغ بالجنيه
    amountSold?: number;     // المبلغ بالعملة الأجنبية (if different)
    currencyExchangeRate?: number;
  };
  salesTotal: number;        // إجمالي المبيعات
  total: number;             // الإجمالي بعد الضريبة
  valueDifference?: number;
  totalTaxableFees?: number;
  netTotal: number;          // الصافي
  itemsDiscount?: number;    // الخصم
  discount?: {
    rate: number;
    amount: number;
  };
  taxableItems: ETATaxItem[];
  internalCode?: string;     // كود داخلي
}

export interface ETATaxItem {
  taxType: TaxType;
  amount: number;
  subType: string;
  rate: number;
}

export interface ETAInvoice {
  issuer: ETATaxpayer;
  receiver: ETATaxpayer;
  documentType: DocumentType;
  documentTypeVersion: string;
  dateTimeIssued: string;    // ISO 8601 format
  taxpayerActivityCode: string;
  internalID: string;        // رقم الفاتورة الداخلي
  purchaseOrderReference?: string;
  purchaseOrderDescription?: string;
  salesOrderReference?: string;
  salesOrderDescription?: string;
  proformaInvoiceNumber?: string;
  invoiceLines: ETAInvoiceLine[];
  totalDiscountAmount: number;
  totalSalesAmount: number;
  netAmount: number;
  taxTotals: ETATaxItem[];
  totalAmount: number;
  extraDiscountAmount?: number;
  totalItemsDiscountAmount?: number;
  signatures?: ETASignature[];
}

export interface ETASignature {
  signatureType: 'I' | 'S';  // I=Issuer, S=Submitter
  value: string;
}

export interface ETASubmissionResponse {
  submissionId: string;
  acceptedDocuments: Array<{
    uuid: string;
    longId: string;
    internalId: string;
    hashKey: string;
  }>;
  rejectedDocuments: Array<{
    internalId: string;
    error: {
      code: string;
      message: string;
      target: string;
      details: any[];
    };
  }>;
}

export interface ETADocumentStatus {
  uuid: string;
  status: 'Valid' | 'Invalid' | 'Rejected' | 'Cancelled' | 'Submitted';
  longId: string;
  internalId: string;
  dateTimeIssued: string;
  dateTimeReceived: string;
  totalAmount: number;
  totalTax: number;
  cancelRequestDate?: string;
  rejectRequestDate?: string;
  cancelRequestDelayedDate?: string;
  declineCancelRequestDate?: string;
}

/**
 * ETA E-Invoice Service
 */
export class ETAEInvoiceService {
  private credentials: ETACredentials;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(credentials: ETACredentials) {
    this.credentials = credentials;
  }

  /**
   * Get API URLs based on environment
   */
  private getUrls() {
    return ETA_CONFIG[this.credentials.environment];
  }

  /**
   * Authenticate and get access token
   */
  async authenticate(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const urls = this.getUrls();

    const response = await fetch(urls.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        scope: 'InvoicingAPI',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ETA Authentication failed: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);

    return this.accessToken;
  }

  /**
   * Calculate document hash for signing
   */
  private calculateHash(document: ETAInvoice): string {
    const canonicalString = this.canonicalize(document);
    return crypto.createHash('sha256').update(canonicalString).digest('hex');
  }

  /**
   * Canonicalize document for hashing
   */
  private canonicalize(obj: any): string {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return String(obj);
    if (Array.isArray(obj)) {
      return obj.map(item => this.canonicalize(item)).join('');
    }
    return Object.keys(obj)
      .sort()
      .map(key => `"${key}"${this.canonicalize(obj[key])}`)
      .join('');
  }

  /**
   * Submit invoice to ETA
   */
  async submitInvoice(invoice: ETAInvoice): Promise<ETASubmissionResponse> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    // Add document type version if not set
    if (!invoice.documentTypeVersion) {
      invoice.documentTypeVersion = '1.0';
    }

    const response = await fetch(`${urls.apiUrl}/documentsubmissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documents: [invoice],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Submission failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Submit multiple invoices
   */
  async submitInvoices(invoices: ETAInvoice[]): Promise<ETASubmissionResponse> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/documentsubmissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documents: invoices,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Bulk Submission failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Get document status by UUID
   */
  async getDocumentStatus(uuid: string): Promise<ETADocumentStatus> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/documents/${uuid}/raw`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Get Document failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Get recent documents
   */
  async getRecentDocuments(
    pageSize: number = 10,
    pageNo: number = 1,
    status?: string
  ): Promise<{ result: ETADocumentStatus[]; metadata: { totalCount: number } }> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const params = new URLSearchParams({
      pageSize: String(pageSize),
      pageNo: String(pageNo),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`${urls.apiUrl}/documents/recent?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Get Recent Documents failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Cancel document
   */
  async cancelDocument(uuid: string, reason: string): Promise<void> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/documents/state/${uuid}/state`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'cancelled',
        reason: reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Cancel Document failed: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Request document rejection
   */
  async rejectDocument(uuid: string, reason: string): Promise<void> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/documents/state/${uuid}/state`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'rejected',
        reason: reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ETA Reject Document failed: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Get document printout (PDF)
   */
  async getDocumentPrintout(uuid: string): Promise<Buffer> {
    const token = await this.authenticate();
    const urls = this.getUrls();

    const response = await fetch(`${urls.apiUrl}/documents/${uuid}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ETA Get PDF failed: ${error}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Validate document before submission
   */
  validateDocument(invoice: ETAInvoice): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate issuer
    if (!invoice.issuer.rin) errors.push('Issuer RIN (Tax ID) is required');
    if (!invoice.issuer.name) errors.push('Issuer name is required');
    if (!invoice.issuer.branchCode) errors.push('Issuer branch code is required');
    if (!invoice.issuer.activityCode) errors.push('Issuer activity code is required');

    // Validate receiver
    if (!invoice.receiver.rin) errors.push('Receiver RIN (Tax ID) is required');
    if (!invoice.receiver.name) errors.push('Receiver name is required');

    // Validate invoice lines
    if (!invoice.invoiceLines || invoice.invoiceLines.length === 0) {
      errors.push('At least one invoice line is required');
    } else {
      invoice.invoiceLines.forEach((line, index) => {
        if (!line.description) errors.push(`Line ${index + 1}: Description is required`);
        if (!line.itemCode) errors.push(`Line ${index + 1}: Item code is required`);
        if (line.quantity <= 0) errors.push(`Line ${index + 1}: Quantity must be positive`);
        if (!line.taxableItems || line.taxableItems.length === 0) {
          errors.push(`Line ${index + 1}: At least one tax item is required`);
        }
      });
    }

    // Validate totals
    if (invoice.totalAmount <= 0) errors.push('Total amount must be positive');
    if (!invoice.dateTimeIssued) errors.push('Date time issued is required');
    if (!invoice.internalID) errors.push('Internal ID is required');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Helper function to create invoice from order
 */
export function createInvoiceFromOrder(
  order: any,
  issuer: ETATaxpayer,
  receiver: ETATaxpayer
): ETAInvoice {
  const invoiceLines: ETAInvoiceLine[] = order.items.map((item: any) => {
    const unitValue = item.price;
    const quantity = item.quantity;
    const salesTotal = unitValue * quantity;
    const discount = item.discount || 0;
    const netTotal = salesTotal - discount;

    // Calculate VAT (14%)
    const vatRate = 0.14;
    const vatAmount = netTotal * vatRate;
    const total = netTotal + vatAmount;

    return {
      description: item.name,
      itemType: 'EGS' as const,
      itemCode: item.sku || item.id.toString(),
      unitType: 'EA', // Each
      quantity,
      unitValue: {
        currencySold: 'EGP',
        amountEGP: unitValue,
      },
      salesTotal,
      total,
      netTotal,
      itemsDiscount: discount,
      taxableItems: [
        {
          taxType: TaxType.VAT,
          amount: vatAmount,
          subType: VATSubtype.VAT_14,
          rate: 14,
        },
      ],
    };
  });

  const totalSalesAmount = invoiceLines.reduce((sum, line) => sum + line.salesTotal, 0);
  const totalDiscountAmount = invoiceLines.reduce((sum, line) => sum + (line.itemsDiscount || 0), 0);
  const netAmount = invoiceLines.reduce((sum, line) => sum + line.netTotal, 0);
  const totalVAT = invoiceLines.reduce((sum, line) =>
    sum + line.taxableItems.reduce((taxSum, tax) => taxSum + tax.amount, 0), 0);
  const totalAmount = invoiceLines.reduce((sum, line) => sum + line.total, 0);

  return {
    issuer,
    receiver,
    documentType: DocumentType.INVOICE,
    documentTypeVersion: '1.0',
    dateTimeIssued: new Date().toISOString(),
    taxpayerActivityCode: issuer.activityCode,
    internalID: order.orderNumber || order.id.toString(),
    invoiceLines,
    totalDiscountAmount,
    totalSalesAmount,
    netAmount,
    taxTotals: [
      {
        taxType: TaxType.VAT,
        amount: totalVAT,
        subType: VATSubtype.VAT_14,
        rate: 14,
      },
    ],
    totalAmount,
  };
}

/**
 * Create E-Invoice service instance
 */
export function createETAService(env: 'production' | 'preprod' = 'preprod'): ETAEInvoiceService {
  const credentials: ETACredentials = {
    clientId: process.env.ETA_CLIENT_ID || '',
    clientSecret: process.env.ETA_CLIENT_SECRET || '',
    registrationNumber: process.env.ETA_REGISTRATION_NUMBER || '',
    environment: env,
  };

  return new ETAEInvoiceService(credentials);
}

export default ETAEInvoiceService;
