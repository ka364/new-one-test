
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { KAIAEngine } from './kaia/engine';

// Mock the database dependency
vi.mock('./db', () => ({
  getActiveEthicalRules: vi.fn().mockResolvedValue([
    // Rule 1: Prohibition of Riba (Interest)
    {
      id: 1,
      ruleName: 'Prohibition of Riba',
      ruleDescription: 'Interest-based transactions are prohibited',
      ruleType: 'sharia_financial',
      severity: 'critical',
      ruleLogic: {
        conditions: [
          { field: 'transaction.interest', operator: '>', value: 0 }
        ],
        action: 'reject',
      },
      requiresReview: false,
      priority: 100,
      isActive: true,
    },
    // Rule 2: Avoidance of Gharar (Uncertainty)
    {
      id: 2,
      ruleName: 'Avoidance of Gharar',
      ruleDescription: 'Transactions with significant uncertainty require review',
      ruleType: 'sharia_commercial',
      severity: 'high',
      ruleLogic: {
        conditions: [
          { field: 'transaction.quantity', operator: '==', value: 'غير محدد' }
        ],
        action: 'reject', // Fails the rule
      },
      requiresReview: true, // Forces "review_required" instead of "rejected"
      priority: 90,
      isActive: true,
    },
    // Rule 3: Prohibition of Haram Products
    {
      id: 3,
      ruleName: 'Prohibited Products',
      ruleDescription: 'Alcohol and other restricted items are prohibited',
      ruleType: 'compliance',
      severity: 'critical',
      ruleLogic: {
        conditions: [
          { field: 'transaction.product', operator: '==', value: 'مشروبات كحولية' }
        ],
        action: 'reject',
      },
      requiresReview: false,
      priority: 100,
      isActive: true,
    }
  ]),
}));

describe('KAIA Engine Unit Tests', () => {
  let engine: KAIAEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-instantiate engine to ensure fresh rules load
    engine = new KAIAEngine();
    // We need to wait for the async loadRules to complete in the constructor, 
    // or rely on reloadRules() if we want to be safe, but constructor kicks it off.
    // However, since it is async void in constructor, we might race. 
    // Best practice: await engine.reloadRules() or similar if accessible.
    // The engine calls loadRules() in constructor without await. 
    // We can assume for these unit tests the promise typically resolves quickly 
    // since it's a mocked value, but let's call a method to ensure it's loaded if needed.
    // Actually, KAIAEngine.evaluateTransaction calls refreshRulesIfNeeded which awaits loadRules.
    // So we are safe.
  });

  // Test Case 1: المعاملة الحلال (Halal Transaction)
  it('Test 1: Halal Transaction should be APPROVED', async () => {
    const halalTransaction = {
      type: 'sale',
      product: 'كتاب تعليمي',
      price: 100,
      interest: 0,
      uncertainty: 0
    };

    const result = await engine.evaluateTransaction(halalTransaction);

    expect(result.approved).toBe(true);
    expect(result.decision).toBe('approved');
    console.log('✓ Test 1: Halal Transaction -> APPROVED');
  });

  // Test Case 2: معاملة ربا (Riba Transaction)
  it('Test 2: Riba Transaction should be REJECTED', async () => {
    const ribaTransaction = {
      type: 'loan',
      amount: 1000,
      interest: 50, // Should trigger Rule 1
      period: '1 month'
    };

    const result = await engine.evaluateTransaction(ribaTransaction);

    expect(result.approved).toBe(false);
    expect(result.decision).toBe('rejected');
    expect(result.appliedRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleName: 'Prohibition of Riba', result: 'fail' })
      ])
    );
    console.log('✓ Test 2: Riba Transaction -> REJECTED');
  });

  // Test Case 3: معاملة غرر (Gharar Transaction)
  it('Test 3: Gharar Transaction should be REVIEW_REQUIRED', async () => {
    const ghararTransaction = {
      type: 'future_sale',
      product: 'محصول قادم',
      quantity: 'غير محدد', // Should trigger Rule 2
      delivery: 'غير مؤكد'
    };

    const result = await engine.evaluateTransaction(ghararTransaction);

    expect(result.approved).toBe(false);
    expect(result.decision).toBe('review_required');
    expect(result.requiresHumanReview).toBe(true);
    console.log('✓ Test 3: Gharar Transaction -> REVIEW_REQUIRED');
  });

  // Test Case 4: منتج محرم (Haram Product)
  it('Test 4: Haram Product should be REJECTED', async () => {
    const haramTransaction = {
      type: 'sale',
      product: 'مشروبات كحولية', // Should trigger Rule 3
      price: 200
    };

    const result = await engine.evaluateTransaction(haramTransaction);

    expect(result.approved).toBe(false);
    expect(result.decision).toBe('rejected');
    expect(result.appliedRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleName: 'Prohibited Products', result: 'fail' })
      ])
    );
    console.log('✓ Test 4: Haram Product -> REJECTED');
  });

  // Test Case 5: تجارة إلكترونية عادية (Normal E-commerce)
  it('Test 5: Normal E-commerce Transaction should be APPROVED', async () => {
    const normalTransaction = {
      type: 'ecommerce',
      product: 'هاتف ذكي',
      price: 5000,
      warranty: '1 سنة',
      returnPolicy: '14 يوم',
      interest: 0 // Explicitly 0 to be safe
    };

    const result = await engine.evaluateTransaction(normalTransaction);

    expect(result.approved).toBe(true);
    expect(result.decision).toBe('approved');
    console.log('✓ Test 5: Normal E-commerce -> APPROVED');
  });

});
