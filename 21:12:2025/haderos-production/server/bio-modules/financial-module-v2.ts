/**
 * Financial Bio-Module V2
 * Enhanced with KAIA Engine and Pure Message-Based Communication
 * 
 * Principles:
 * 1. ✅ Autonomy: Can run and test independently
 * 2. ✅ Message-Only Communication: No direct function calls to other modules
 * 3. ✅ KAIA Validation: All transactions validated by KAIA Engine
 * 4. ✅ Learning Logs: Errors and decisions logged to Corvid
 */

import { BaseBioModule } from './base-module';
import { KAIAEngine, TransactionValidation } from './kaia-engine';
import type { BioMessage, BioModuleConfig, BioModuleHealth } from './types';

interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  parentAccountId?: string;
  isGroup: boolean;
  balance: number;
  currency: string;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: Date;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'cancelled';
  sourceModule?: string;
  sourceDocumentId?: string;
  lines: JournalEntryLine[];
  kaiaValidation?: TransactionValidation;
}

interface JournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  referenceNumber?: string;
  status: 'draft' | 'posted' | 'cancelled';
  kaiaValidation?: TransactionValidation;
}

export class FinancialModuleV2 extends BaseBioModule {
  private accounts: Map<string, ChartOfAccount> = new Map();
  private journalEntries: Map<string, JournalEntry> = new Map();
  private payments: Map<string, Payment> = new Map();
  private kaiaEngine: KAIAEngine;
  private pendingResponses: Map<string, (response: any) => void> = new Map();

  constructor(config: BioModuleConfig) {
    super({
      ...config,
      name: 'Financial Bio-Module V2',
    });

    this.kaiaEngine = new KAIAEngine();
    this.initializeDefaultAccounts();
    this.logInfo('Financial Module V2 initialized with KAIA Engine');
  }

  /**
   * Initialize default Chart of Accounts (based on ERPNext)
   */
  private initializeDefaultAccounts(): void {
    const defaultAccounts: ChartOfAccount[] = [
      // Assets
      { id: 'acc-1000', accountCode: '1000', accountName: 'Assets', accountType: 'Asset', isGroup: true, balance: 0, currency: 'EGP' },
      { id: 'acc-1100', accountCode: '1100', accountName: 'Current Assets', accountType: 'Asset', parentAccountId: 'acc-1000', isGroup: true, balance: 0, currency: 'EGP' },
      { id: 'acc-1110', accountCode: '1110', accountName: 'Cash', accountType: 'Asset', parentAccountId: 'acc-1100', isGroup: false, balance: 0, currency: 'EGP' },
      { id: 'acc-1120', accountCode: '1120', accountName: 'Bank Account', accountType: 'Asset', parentAccountId: 'acc-1100', isGroup: false, balance: 0, currency: 'EGP' },
      { id: 'acc-1130', accountCode: '1130', accountName: 'Accounts Receivable', accountType: 'Asset', parentAccountId: 'acc-1100', isGroup: false, balance: 0, currency: 'EGP' },
      { id: 'acc-1140', accountCode: '1140', accountName: 'Inventory', accountType: 'Asset', parentAccountId: 'acc-1100', isGroup: false, balance: 0, currency: 'EGP' },

      // Liabilities
      { id: 'acc-2000', accountCode: '2000', accountName: 'Liabilities', accountType: 'Liability', isGroup: true, balance: 0, currency: 'EGP' },
      { id: 'acc-2100', accountCode: '2100', accountName: 'Current Liabilities', accountType: 'Liability', parentAccountId: 'acc-2000', isGroup: true, balance: 0, currency: 'EGP' },
      { id: 'acc-2110', accountCode: '2110', accountName: 'Accounts Payable', accountType: 'Liability', parentAccountId: 'acc-2100', isGroup: false, balance: 0, currency: 'EGP' },
      { id: 'acc-2120', accountCode: '2120', accountName: 'Tax Payable', accountType: 'Liability', parentAccountId: 'acc-2100', isGroup: false, balance: 0, currency: 'EGP' },

      // Equity
      { id: 'acc-3000', accountCode: '3000', accountName: 'Equity', accountType: 'Equity', isGroup: true, balance: 0, currency: 'EGP' },
      { id: 'acc-3100', accountCode: '3100', accountName: 'Capital', accountType: 'Equity', parentAccountId: 'acc-3000', isGroup: false, balance: 0, currency: 'EGP' },
      { id: 'acc-3200', accountCode: '3200', accountName: 'Retained Earnings', accountType: 'Equity', parentAccountId: 'acc-3000', isGroup: false, balance: 0, currency: 'EGP' },

      // Income
      { id: 'acc-4000', accountCode: '4000', accountName: 'Income', accountType: 'Income', isGroup: true, balance: 0, currency: 'EGP' },
      { id: 'acc-4100', accountCode: '4100', accountName: 'Sales Revenue', accountType: 'Income', parentAccountId: 'acc-4000', isGroup: false, balance: 0, currency: 'EGP' },
      { id: 'acc-4200', accountCode: '4200', accountName: 'Service Revenue', accountType: 'Income', parentAccountId: 'acc-4000', isGroup: false, balance: 0, currency: 'EGP' },

      // Expenses
      { id: 'acc-5000', accountCode: '5000', accountName: 'Expenses', accountType: 'Expense', isGroup: true, balance: 0, currency: 'EGP' },
      { id: 'acc-5100', accountCode: '5100', accountName: 'Cost of Goods Sold', accountType: 'Expense', parentAccountId: 'acc-5000', isGroup: false, balance: 0, currency: 'EGP' },
      { id: 'acc-5200', accountCode: '5200', accountName: 'Operating Expenses', accountType: 'Expense', parentAccountId: 'acc-5000', isGroup: false, balance: 0, currency: 'EGP' },
    ];

    defaultAccounts.forEach(account => {
      this.accounts.set(account.id, account);
    });

    this.logInfo(`Initialized ${defaultAccounts.length} default accounts`);
  }

  /**
   * Create a journal entry with KAIA validation
   */
  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'entryNumber' | 'kaiaValidation'>): Promise<JournalEntry> {
    // Calculate totals
    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

    // KAIA Validation
    const validation = this.kaiaEngine.validateTransaction({
      ...entry,
      totalDebit,
      totalCredit,
    }, 'journal_entry');

    if (!validation.passed) {
      const failures = this.kaiaEngine.getFailedValidations(validation);
      const errorMsg = `KAIA validation failed: ${failures.map(f => f.message).join(', ')}`;
      
      // Log to Corvid for learning
      await this.sendMessageToCorvid('validation_failed', {
        module: 'financial',
        transactionType: 'journal_entry',
        validation,
        timestamp: new Date(),
      });

      throw new Error(errorMsg);
    }

    // Generate entry number
    const entryNumber = `JE-${new Date().getFullYear()}-${String(this.journalEntries.size + 1).padStart(4, '0')}`;

    const journalEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      entryNumber,
      ...entry,
      totalDebit,
      totalCredit,
      kaiaValidation: validation,
    };

    this.journalEntries.set(journalEntry.id, journalEntry);
    this.logInfo(`Created journal entry ${entryNumber} (KAIA: ${this.kaiaEngine.getValidationSummary(validation)})`);

    // Log success to Corvid
    await this.sendMessageToCorvid('transaction_created', {
      module: 'financial',
      transactionType: 'journal_entry',
      transactionId: journalEntry.id,
      kaiaStatus: 'approved',
      timestamp: new Date(),
    });

    return journalEntry;
  }

  /**
   * Post a journal entry (update account balances)
   */
  async postJournalEntry(entryId: string): Promise<void> {
    const entry = this.journalEntries.get(entryId);
    if (!entry) {
      throw new Error(`Journal entry ${entryId} not found`);
    }

    if (entry.status === 'posted') {
      throw new Error(`Journal entry ${entry.entryNumber} already posted`);
    }

    // Update account balances
    for (const line of entry.lines) {
      const account = this.accounts.get(line.accountId);
      if (!account) {
        throw new Error(`Account ${line.accountId} not found`);
      }

      // Debit increases: Assets, Expenses
      // Credit increases: Liabilities, Equity, Income
      if (account.accountType === 'Asset' || account.accountType === 'Expense') {
        account.balance += line.debit - line.credit;
      } else {
        account.balance += line.credit - line.debit;
      }
    }

    entry.status = 'posted';
    this.logInfo(`Posted journal entry ${entry.entryNumber}`);

    // Log to Corvid
    await this.sendMessageToCorvid('transaction_posted', {
      module: 'financial',
      transactionType: 'journal_entry',
      transactionId: entry.id,
      timestamp: new Date(),
    });
  }

  /**
   * Create a payment with KAIA validation
   */
  async createPayment(payment: Omit<Payment, 'id' | 'paymentNumber' | 'kaiaValidation'>): Promise<Payment> {
    // KAIA Validation
    const validation = this.kaiaEngine.validateTransaction(payment, 'payment');

    if (!validation.passed) {
      const failures = this.kaiaEngine.getFailedValidations(validation);
      const errorMsg = `KAIA validation failed: ${failures.map(f => f.message).join(', ')}`;
      
      await this.sendMessageToCorvid('validation_failed', {
        module: 'financial',
        transactionType: 'payment',
        validation,
        timestamp: new Date(),
      });

      throw new Error(errorMsg);
    }

    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(this.payments.size + 1).padStart(4, '0')}`;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      paymentNumber,
      ...payment,
      kaiaValidation: validation,
    };

    this.payments.set(newPayment.id, newPayment);
    this.logInfo(`Created payment ${paymentNumber} (KAIA: ${this.kaiaEngine.getValidationSummary(validation)})`);

    // Generate journal entry for payment
    if (newPayment.status === 'posted') {
      await this.createJournalEntry({
        entryDate: newPayment.paymentDate,
        description: `Payment ${paymentNumber} from customer`,
        status: 'posted',
        sourceModule: 'financial',
        sourceDocumentId: newPayment.id,
        lines: [
          {
            accountId: 'acc-1110', // Cash (or Bank)
            debit: newPayment.amount,
            credit: 0,
            description: `Payment received`,
          },
          {
            accountId: 'acc-1130', // Accounts Receivable
            debit: 0,
            credit: newPayment.amount,
            description: `Payment from customer`,
          },
        ],
        totalDebit: newPayment.amount,
        totalCredit: newPayment.amount,
      });

      await this.postJournalEntry((await this.getLastJournalEntry()).id);
    }

    return newPayment;
  }

  /**
   * Get last journal entry
   */
  private async getLastJournalEntry(): Promise<JournalEntry> {
    const entries = Array.from(this.journalEntries.values());
    return entries[entries.length - 1];
  }

  /**
   * Send message to Corvid for learning
   */
  private async sendMessageToCorvid(eventType: string, data: any): Promise<void> {
    this.emit('bio-message', {
      id: `msg-${Date.now()}`,
      from: 'financial',
      to: 'corvid',
      action: 'log_learning_event',
      payload: {
        eventType,
        ...data,
      },
      timestamp: new Date(),
      priority: 2,
    });
  }

  /**
   * Get account balance
   */
  getAccountBalance(accountId: string): number {
    const account = this.accounts.get(accountId);
    return account ? account.balance : 0;
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): ChartOfAccount[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get KAIA statistics
   */
  getKAIAStatistics() {
    return this.kaiaEngine.getStatistics();
  }

  /**
   * Handle incoming bio-messages (Message-Only Communication)
   */
  protected async handleMessage(message: BioMessage): Promise<void> {
    switch (message.action) {
      case 'create_invoice_entry':
        // When Sales module creates an invoice, create journal entry
        try {
          await this.handleInvoiceCreated(message.payload);
          
          // Send success response
          this.emit('bio-message', {
            id: `msg-${Date.now()}`,
            from: 'financial',
            to: message.from,
            action: 'invoice_entry_created',
            payload: { success: true, invoiceId: message.payload.id },
            timestamp: new Date(),
            priority: message.priority,
          });
        } catch (error: any) {
          // Send error response
          this.emit('bio-message', {
            id: `msg-${Date.now()}`,
            from: 'financial',
            to: message.from,
            action: 'invoice_entry_failed',
            payload: { success: false, error: error.message },
            timestamp: new Date(),
            priority: message.priority,
          });
        }
        break;

      case 'create_payment':
        // When payment is received
        try {
          const payment = await this.createPayment(message.payload);
          
          this.emit('bio-message', {
            id: `msg-${Date.now()}`,
            from: 'financial',
            to: message.from,
            action: 'payment_created',
            payload: { success: true, payment },
            timestamp: new Date(),
            priority: message.priority,
          });
        } catch (error: any) {
          this.emit('bio-message', {
            id: `msg-${Date.now()}`,
            from: 'financial',
            to: message.from,
            action: 'payment_failed',
            payload: { success: false, error: error.message },
            timestamp: new Date(),
            priority: message.priority,
          });
        }
        break;

      case 'get_account_balance':
        // Query account balance
        const balance = this.getAccountBalance(message.payload.accountId);
        this.emit('bio-message', {
          id: `msg-${Date.now()}`,
          from: 'financial',
          to: message.from,
          action: 'account_balance_response',
          payload: { accountId: message.payload.accountId, balance },
          timestamp: new Date(),
          priority: message.priority,
        });
        break;

      default:
        this.logWarn(`Unknown action: ${message.action}`);
    }
  }

  /**
   * Handle invoice created event from Sales module
   */
  private async handleInvoiceCreated(invoice: any): Promise<void> {
    // Create journal entry for invoice
    const entry = await this.createJournalEntry({
      entryDate: new Date(invoice.invoiceDate),
      description: `Sales Invoice ${invoice.invoiceNumber}`,
      status: 'posted',
      sourceModule: 'sales',
      sourceDocumentId: invoice.id,
      lines: [
        {
          accountId: 'acc-1130', // Accounts Receivable
          debit: invoice.totalAmount,
          credit: 0,
          description: `Invoice ${invoice.invoiceNumber}`,
        },
        {
          accountId: 'acc-4100', // Sales Revenue
          debit: 0,
          credit: invoice.subtotal,
          description: `Sales revenue`,
        },
        {
          accountId: 'acc-2120', // Tax Payable
          debit: 0,
          credit: invoice.taxAmount,
          description: `Sales tax`,
        },
      ],
      totalDebit: invoice.totalAmount,
      totalCredit: invoice.totalAmount,
    });

    await this.postJournalEntry(entry.id);
    this.logInfo(`Created and posted journal entry for invoice ${invoice.invoiceNumber}`);
  }

  /**
   * Get module health status
   */
  getHealth(): BioModuleHealth {
    const kaiaStats = this.kaiaEngine.getStatistics();
    
    return {
      status: 'healthy',
      lastActivity: Date.now(),
      metrics: {
        total_accounts: this.accounts.size,
        total_journal_entries: this.journalEntries.size,
        total_payments: this.payments.size,
        kaia_validations_total: kaiaStats.total,
        kaia_validations_passed: kaiaStats.passed,
        kaia_validations_failed: kaiaStats.failed,
        kaia_pass_rate: kaiaStats.passRate,
      },
    };
  }
}
