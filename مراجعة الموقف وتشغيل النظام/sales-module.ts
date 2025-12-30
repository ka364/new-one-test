/**
 * Sales Bio-Module
 * Handles customer management, sales invoices, and order processing
 * Based on ERPNext sales standards
 */

import { BaseBioModule } from './base-module';
import type { BioMessage, BioModuleConfig, BioModuleHealth } from './types';

interface Customer {
  id: string;
  customerCode: string;
  customerName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  governorate?: string;
  taxId?: string;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
}

interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: Date;
  dueDate?: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'posted' | 'paid' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  lines: InvoiceLine[];
  notes?: string;
}

interface InvoiceLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export class SalesModule extends BaseBioModule {
  private customers: Map<string, Customer> = new Map();
  private invoices: Map<string, SalesInvoice> = new Map();

  constructor(config: BioModuleConfig) {
    super({
      ...config,
      id: 'sales',
      name: 'Sales Bio-Module',
      type: 'sales',
      capabilities: ['customer-management', 'invoicing', 'order-processing'],
    });

    this.initializeSampleCustomers();
  }

  /**
   * Initialize sample customers for testing
   */
  private initializeSampleCustomers(): void {
    const sampleCustomers: Customer[] = [
      {
        id: 'cust-001',
        customerCode: 'CUST-001',
        customerName: 'شركة النور للتجارة',
        email: 'info@alnoor.com',
        phone: '+20 100 123 4567',
        address: '15 شارع الجمهورية',
        city: 'القاهرة',
        governorate: 'القاهرة',
        taxId: '123-456-789',
        creditLimit: 50000,
        currentBalance: 0,
        isActive: true,
      },
      {
        id: 'cust-002',
        customerCode: 'CUST-002',
        customerName: 'مؤسسة الأمل',
        email: 'contact@alamal.com',
        phone: '+20 100 987 6543',
        address: '42 شارع النيل',
        city: 'الجيزة',
        governorate: 'الجيزة',
        taxId: '987-654-321',
        creditLimit: 30000,
        currentBalance: 0,
        isActive: true,
      },
    ];

    sampleCustomers.forEach(customer => {
      this.customers.set(customer.id, customer);
    });

    this.log('info', `Initialized ${sampleCustomers.length} sample customers`);
  }

  /**
   * Create a new customer
   */
  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      ...customer,
    };

    this.customers.set(newCustomer.id, newCustomer);
    this.incrementMetric('customers_created');
    this.log('info', `Created customer ${newCustomer.customerCode}`);

    return newCustomer;
  }

  /**
   * Get customer by ID
   */
  getCustomer(customerId: string): Customer | undefined {
    return this.customers.get(customerId);
  }

  /**
   * Get all customers
   */
  getAllCustomers(): Customer[] {
    return Array.from(this.customers.values()).filter(c => c.isActive);
  }

  /**
   * Create a sales invoice
   */
  async createInvoice(invoice: Omit<SalesInvoice, 'id' | 'invoiceNumber'>): Promise<SalesInvoice> {
    const customer = this.customers.get(invoice.customerId);
    if (!customer) {
      throw new Error(`Customer ${invoice.customerId} not found`);
    }

    // Check credit limit
    if (customer.currentBalance + invoice.totalAmount > customer.creditLimit) {
      throw new Error(`Credit limit exceeded for customer ${customer.customerName}. Limit: ${customer.creditLimit}, Current: ${customer.currentBalance}, New: ${invoice.totalAmount}`);
    }

    // Validate stock availability for all products
    for (const line of invoice.lines) {
      const stockCheck = await this.checkStock(line.productId, line.quantity);
      if (!stockCheck.available) {
        throw new Error(`Insufficient stock for product ${line.productName}. Available: ${stockCheck.currentStock}, Required: ${line.quantity}`);
      }
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.invoices.size + 1).padStart(4, '0')}`;

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      ...invoice,
    };

    this.invoices.set(newInvoice.id, newInvoice);
    this.incrementMetric('invoices_created');
    this.log('info', `Created invoice ${invoiceNumber} for customer ${customer.customerName}`);

    return newInvoice;
  }

  /**
   * Post an invoice (finalize and update balances)
   */
  async postInvoice(invoiceId: string): Promise<void> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status === 'posted') {
      throw new Error(`Invoice ${invoice.invoiceNumber} already posted`);
    }

    const customer = this.customers.get(invoice.customerId);
    if (!customer) {
      throw new Error(`Customer ${invoice.customerId} not found`);
    }

    // Deduct stock for all products
    for (const line of invoice.lines) {
      await this.sendMessage({
        to: 'inventory',
        action: 'deduct_stock',
        payload: {
          productId: line.productId,
          quantity: line.quantity,
          referenceType: 'sale',
          referenceId: invoice.id,
          notes: `Invoice ${invoice.invoiceNumber}`,
        },
      });
    }

    // Update customer balance
    customer.currentBalance += invoice.totalAmount;

    // Create journal entry in Financial module
    await this.sendMessage({
      to: 'financial',
      action: 'create_invoice_entry',
      payload: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
      },
    });

    invoice.status = 'posted';
    this.incrementMetric('invoices_posted');
    this.log('info', `Posted invoice ${invoice.invoiceNumber}`);
  }

  /**
   * Check stock availability
   */
  private async checkStock(productId: string, quantity: number): Promise<{ available: boolean; currentStock: number }> {
    return new Promise((resolve) => {
      // Send message to inventory module
      this.sendMessage({
        to: 'inventory',
        action: 'check_stock',
        payload: { productId, quantity },
      });

      // In a real implementation, you would wait for response
      // For now, we'll assume stock is available
      resolve({ available: true, currentStock: 100 });
    });
  }

  /**
   * Get invoice by ID
   */
  getInvoice(invoiceId: string): SalesInvoice | undefined {
    return this.invoices.get(invoiceId);
  }

  /**
   * Get all invoices
   */
  getAllInvoices(): SalesInvoice[] {
    return Array.from(this.invoices.values());
  }

  /**
   * Get invoices for a customer
   */
  getCustomerInvoices(customerId: string): SalesInvoice[] {
    return Array.from(this.invoices.values()).filter(inv => inv.customerId === customerId);
  }

  /**
   * Get total sales
   */
  getTotalSales(): number {
    return Array.from(this.invoices.values())
      .filter(inv => inv.status === 'posted')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  }

  /**
   * Get outstanding balance (unpaid invoices)
   */
  getOutstandingBalance(): number {
    return Array.from(this.invoices.values())
      .filter(inv => inv.status === 'posted' && inv.paymentStatus !== 'paid')
      .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
  }

  /**
   * Handle incoming bio-messages
   */
  protected async handleMessage(message: BioMessage): Promise<void> {
    switch (message.action) {
      case 'create_invoice':
        // Create a new invoice
        const invoice = await this.createInvoice(message.payload);
        await this.sendMessage({
          to: message.from,
          action: 'invoice_created',
          payload: invoice,
        });
        break;

      case 'post_invoice':
        // Post an invoice
        await this.postInvoice(message.payload.invoiceId);
        await this.sendMessage({
          to: message.from,
          action: 'invoice_posted',
          payload: { invoiceId: message.payload.invoiceId },
        });
        break;

      case 'get_customer':
        // Get customer details
        const customer = this.customers.get(message.payload.customerId);
        await this.sendMessage({
          to: message.from,
          action: 'customer_response',
          payload: customer,
        });
        break;

      case 'get_all_customers':
        // Get all customers
        await this.sendMessage({
          to: message.from,
          action: 'customers_list_response',
          payload: this.getAllCustomers(),
        });
        break;

      case 'payment_received':
        // Update invoice payment status
        const inv = this.invoices.get(message.payload.invoiceId);
        if (inv) {
          inv.paidAmount += message.payload.amount;
          if (inv.paidAmount >= inv.totalAmount) {
            inv.paymentStatus = 'paid';
            inv.status = 'paid';
          } else {
            inv.paymentStatus = 'partial';
          }
          
          // Update customer balance
          const cust = this.customers.get(inv.customerId);
          if (cust) {
            cust.currentBalance -= message.payload.amount;
          }
          
          this.log('info', `Payment received for invoice ${inv.invoiceNumber}: ${message.payload.amount}`);
        }
        break;

      default:
        this.log('warn', `Unknown action: ${message.action}`);
    }
  }

  /**
   * Get module health status
   */
  getHealth(): BioModuleHealth {
    return {
      ...super.getHealth(),
      metrics: {
        ...this.metrics,
        total_customers: this.customers.size,
        active_customers: this.getAllCustomers().length,
        total_invoices: this.invoices.size,
        posted_invoices: Array.from(this.invoices.values()).filter(i => i.status === 'posted').length,
        total_sales: this.getTotalSales(),
        outstanding_balance: this.getOutstandingBalance(),
      },
    };
  }
}
