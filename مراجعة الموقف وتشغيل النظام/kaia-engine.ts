/**
 * KAIA Engine (Knowledge-Aware Intelligent Agent)
 * Ethical and compliance verification engine for all financial transactions
 * 
 * Based on Islamic finance principles and business ethics
 */

export interface KAIARule {
  id: string;
  name: string;
  category: 'sharia' | 'business' | 'legal' | 'ethical';
  description: string;
  validate: (transaction: any) => KAIAValidationResult;
}

export interface KAIAValidationResult {
  passed: boolean;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  suggestion?: string;
}

export interface TransactionValidation {
  transactionId: string;
  transactionType: string;
  passed: boolean;
  results: KAIAValidationResult[];
  timestamp: Date;
}

/**
 * KAIA Engine - Validates all financial transactions
 */
export class KAIAEngine {
  private rules: Map<string, KAIARule> = new Map();
  private validationHistory: TransactionValidation[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default KAIA rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: KAIARule[] = [
      // Sharia Compliance Rules
      {
        id: 'sharia-001',
        name: 'No Interest (Riba)',
        category: 'sharia',
        description: 'Transactions must not involve interest (riba)',
        validate: (tx) => {
          const hasInterest = tx.interestAmount && tx.interestAmount > 0;
          return {
            passed: !hasInterest,
            ruleId: 'sharia-001',
            ruleName: 'No Interest (Riba)',
            message: hasInterest 
              ? 'Transaction contains interest (riba) which is prohibited'
              : 'Transaction is free from interest (riba)',
            severity: hasInterest ? 'critical' : 'info',
            suggestion: hasInterest 
              ? 'Remove interest component and use profit-sharing or markup instead'
              : undefined,
          };
        },
      },
      {
        id: 'sharia-002',
        name: 'No Gharar (Excessive Uncertainty)',
        category: 'sharia',
        description: 'Transactions must be clear and free from excessive uncertainty',
        validate: (tx) => {
          const hasGharar = !tx.description || tx.description.length < 10;
          return {
            passed: !hasGharar,
            ruleId: 'sharia-002',
            ruleName: 'No Gharar (Excessive Uncertainty)',
            message: hasGharar
              ? 'Transaction lacks clear description (gharar)'
              : 'Transaction is clearly described',
            severity: hasGharar ? 'warning' : 'info',
            suggestion: hasGharar
              ? 'Add detailed description of goods/services and terms'
              : undefined,
          };
        },
      },
      {
        id: 'sharia-003',
        name: 'Halal Products Only',
        category: 'sharia',
        description: 'Products must be halal (permissible)',
        validate: (tx) => {
          const prohibitedKeywords = ['alcohol', 'pork', 'gambling', 'tobacco'];
          const description = (tx.description || '').toLowerCase();
          const hasHaram = prohibitedKeywords.some(kw => description.includes(kw));
          
          return {
            passed: !hasHaram,
            ruleId: 'sharia-003',
            ruleName: 'Halal Products Only',
            message: hasHaram
              ? 'Transaction may involve prohibited (haram) products'
              : 'Products appear to be halal (permissible)',
            severity: hasHaram ? 'critical' : 'info',
            suggestion: hasHaram
              ? 'Verify product compliance with Islamic principles'
              : undefined,
          };
        },
      },

      // Business Ethics Rules
      {
        id: 'business-001',
        name: 'Fair Pricing',
        category: 'business',
        description: 'Prices must be fair and not exploitative',
        validate: (tx) => {
          if (!tx.unitPrice || !tx.costPrice) {
            return {
              passed: true,
              ruleId: 'business-001',
              ruleName: 'Fair Pricing',
              message: 'Cannot verify pricing without cost data',
              severity: 'info',
            };
          }

          const markup = ((tx.unitPrice - tx.costPrice) / tx.costPrice) * 100;
          const isExcessive = markup > 100; // More than 100% markup

          return {
            passed: !isExcessive,
            ruleId: 'business-001',
            ruleName: 'Fair Pricing',
            message: isExcessive
              ? `Markup is ${markup.toFixed(1)}% which may be excessive`
              : `Markup is ${markup.toFixed(1)}% which is reasonable`,
            severity: isExcessive ? 'warning' : 'info',
            suggestion: isExcessive
              ? 'Consider reducing markup to ensure fair pricing'
              : undefined,
          };
        },
      },
      {
        id: 'business-002',
        name: 'Honest Accounting',
        category: 'business',
        description: 'Journal entries must be balanced',
        validate: (tx) => {
          if (!tx.totalDebit || !tx.totalCredit) {
            return {
              passed: true,
              ruleId: 'business-002',
              ruleName: 'Honest Accounting',
              message: 'Not a journal entry',
              severity: 'info',
            };
          }

          const isBalanced = Math.abs(tx.totalDebit - tx.totalCredit) < 0.01;

          return {
            passed: isBalanced,
            ruleId: 'business-002',
            ruleName: 'Honest Accounting',
            message: isBalanced
              ? 'Journal entry is properly balanced'
              : `Journal entry is not balanced: Debit=${tx.totalDebit}, Credit=${tx.totalCredit}`,
            severity: isBalanced ? 'info' : 'critical',
            suggestion: isBalanced
              ? undefined
              : 'Correct the journal entry to balance debits and credits',
          };
        },
      },
      {
        id: 'business-003',
        name: 'Credit Limit Compliance',
        category: 'business',
        description: 'Customer credit limit must not be exceeded',
        validate: (tx) => {
          if (!tx.creditLimit || !tx.currentBalance || !tx.totalAmount) {
            return {
              passed: true,
              ruleId: 'business-003',
              ruleName: 'Credit Limit Compliance',
              message: 'Not a credit transaction',
              severity: 'info',
            };
          }

          const newBalance = tx.currentBalance + tx.totalAmount;
          const withinLimit = newBalance <= tx.creditLimit;

          return {
            passed: withinLimit,
            ruleId: 'business-003',
            ruleName: 'Credit Limit Compliance',
            message: withinLimit
              ? `Credit usage: ${((newBalance / tx.creditLimit) * 100).toFixed(1)}%`
              : `Credit limit exceeded: ${newBalance} > ${tx.creditLimit}`,
            severity: withinLimit ? 'info' : 'error',
            suggestion: withinLimit
              ? undefined
              : 'Request payment or increase credit limit before proceeding',
          };
        },
      },

      // Legal Compliance Rules
      {
        id: 'legal-001',
        name: 'Tax Compliance',
        category: 'legal',
        description: 'Tax must be calculated correctly',
        validate: (tx) => {
          if (!tx.subtotal || tx.taxRate === undefined) {
            return {
              passed: true,
              ruleId: 'legal-001',
              ruleName: 'Tax Compliance',
              message: 'Not a taxable transaction',
              severity: 'info',
            };
          }

          const expectedTax = tx.subtotal * (tx.taxRate / 100);
          const actualTax = tx.taxAmount || 0;
          const isCorrect = Math.abs(expectedTax - actualTax) < 0.01;

          return {
            passed: isCorrect,
            ruleId: 'legal-001',
            ruleName: 'Tax Compliance',
            message: isCorrect
              ? `Tax calculated correctly: ${actualTax.toFixed(2)} EGP`
              : `Tax mismatch: Expected ${expectedTax.toFixed(2)}, Got ${actualTax.toFixed(2)}`,
            severity: isCorrect ? 'info' : 'error',
            suggestion: isCorrect
              ? undefined
              : 'Recalculate tax amount based on current rate',
          };
        },
      },

      // Ethical Rules
      {
        id: 'ethical-001',
        name: 'Transparency',
        category: 'ethical',
        description: 'All transactions must be properly documented',
        validate: (tx) => {
          const hasDocumentation = tx.description && tx.description.length >= 10;
          const hasReference = tx.referenceNumber || tx.invoiceNumber || tx.paymentNumber;

          const passed = hasDocumentation && hasReference;

          return {
            passed,
            ruleId: 'ethical-001',
            ruleName: 'Transparency',
            message: passed
              ? 'Transaction is properly documented'
              : 'Transaction lacks proper documentation',
            severity: passed ? 'info' : 'warning',
            suggestion: passed
              ? undefined
              : 'Add description and reference number for audit trail',
          };
        },
      },
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Validate a transaction against all applicable rules
   */
  validateTransaction(transaction: any, transactionType: string): TransactionValidation {
    const results: KAIAValidationResult[] = [];

    // Run all rules
    for (const rule of this.rules.values()) {
      try {
        const result = rule.validate(transaction);
        results.push(result);
      } catch (error) {
        results.push({
          passed: false,
          ruleId: rule.id,
          ruleName: rule.name,
          message: `Rule validation failed: ${error}`,
          severity: 'error',
        });
      }
    }

    // Determine overall pass/fail
    const criticalFailures = results.filter(r => !r.passed && r.severity === 'critical');
    const errorFailures = results.filter(r => !r.passed && r.severity === 'error');
    
    const passed = criticalFailures.length === 0 && errorFailures.length === 0;

    const validation: TransactionValidation = {
      transactionId: transaction.id || 'unknown',
      transactionType,
      passed,
      results,
      timestamp: new Date(),
    };

    // Store in history
    this.validationHistory.push(validation);

    return validation;
  }

  /**
   * Get validation summary
   */
  getValidationSummary(validation: TransactionValidation): string {
    const critical = validation.results.filter(r => !r.passed && r.severity === 'critical');
    const errors = validation.results.filter(r => !r.passed && r.severity === 'error');
    const warnings = validation.results.filter(r => !r.passed && r.severity === 'warning');

    if (critical.length > 0) {
      return `BLOCKED: ${critical.length} critical issue(s) found`;
    }
    if (errors.length > 0) {
      return `REJECTED: ${errors.length} error(s) found`;
    }
    if (warnings.length > 0) {
      return `APPROVED WITH WARNINGS: ${warnings.length} warning(s)`;
    }
    return 'APPROVED: All checks passed';
  }

  /**
   * Get failed validations with details
   */
  getFailedValidations(validation: TransactionValidation): KAIAValidationResult[] {
    return validation.results.filter(r => !r.passed);
  }

  /**
   * Get validation history
   */
  getValidationHistory(): TransactionValidation[] {
    return this.validationHistory;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const total = this.validationHistory.length;
    const passed = this.validationHistory.filter(v => v.passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
    };
  }
}
