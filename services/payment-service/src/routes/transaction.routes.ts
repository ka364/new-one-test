/**
 * Transaction Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Transaction, FawryCode, InitiatePaymentInput, RefundInput } from '../models/payment.model';

export const transactionRoutes = Router();

// In-memory stores
const transactions = new Map<string, Transaction>();
const fawryCodes = new Map<string, FawryCode>();

// Calculate fees based on payment method
const calculateFees = (amount: number, method: string): number => {
  const feeRates: { [key: string]: number } = {
    card: 0.025,        // 2.5%
    fawry: 0.02,        // 2%
    vodafone_cash: 0.01, // 1%
    instapay: 0.005,    // 0.5%
    meeza: 0.015,       // 1.5%
    cod: 0,             // No fee
    wallet: 0,          // No fee
    bank_transfer: 0.01 // 1%
  };
  return Math.round(amount * (feeRates[method] || 0.02) * 100) / 100;
};

// Generate Fawry code
const generateFawryCode = (): string => {
  return Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
};

// GET /api/transactions - List transactions
transactionRoutes.get('/', (req, res) => {
  const { userId, orderId, status, method, page = 1, limit = 20 } = req.query;

  let txList = Array.from(transactions.values());

  if (userId) {
    txList = txList.filter(t => t.userId === userId);
  }
  if (orderId) {
    txList = txList.filter(t => t.orderId === orderId);
  }
  if (status) {
    txList = txList.filter(t => t.status === status);
  }
  if (method) {
    txList = txList.filter(t => t.method === method);
  }

  // Sort by date (newest first)
  txList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const start = (Number(page) - 1) * Number(limit);
  const paginated = txList.slice(start, start + Number(limit));

  res.json({
    transactions: paginated,
    total: txList.length,
    page: Number(page)
  });
});

// GET /api/transactions/:id - Get transaction details
transactionRoutes.get('/:id', (req, res) => {
  const transaction = transactions.get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found', code: 'NOT_FOUND' });
  }
  res.json({ transaction });
});

// POST /api/transactions/initiate - Initiate payment
transactionRoutes.post('/initiate', (req, res) => {
  try {
    const input = InitiatePaymentInput.parse(req.body);

    const fees = calculateFees(input.amount, input.method);
    const netAmount = input.amount - fees;

    const transaction: Transaction = {
      id: nanoid(),
      orderId: input.orderId,
      userId: input.userId,
      merchantId: input.merchantId,
      amount: input.amount,
      currency: 'EGP',
      fees,
      netAmount,
      method: input.method,
      status: 'pending',
      description: input.description,
      metadata: input.metadata,
      refundedAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let paymentData: any = { transactionId: transaction.id };

    // Handle different payment methods
    switch (input.method) {
      case 'fawry':
        // Generate Fawry payment code
        const fawryCode: FawryCode = {
          id: nanoid(),
          transactionId: transaction.id,
          orderId: input.orderId,
          code: generateFawryCode(),
          amount: input.amount,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          status: 'active',
          createdAt: new Date()
        };
        fawryCodes.set(fawryCode.id, fawryCode);

        transaction.methodDetails = { fawryCode: fawryCode.code };
        paymentData = {
          ...paymentData,
          fawryCode: fawryCode.code,
          expiresAt: fawryCode.expiresAt,
          paymentInstructions: 'ادفع في أي فرع فوري باستخدام هذا الكود'
        };
        break;

      case 'vodafone_cash':
        transaction.methodDetails = { mobileNumber: input.mobileNumber };
        transaction.status = 'processing';
        paymentData = {
          ...paymentData,
          mobileNumber: input.mobileNumber,
          paymentInstructions: 'ستصلك رسالة على رقمك لتأكيد الدفع'
        };
        break;

      case 'card':
        transaction.status = 'processing';
        paymentData = {
          ...paymentData,
          redirectUrl: `https://payment.haderos.com/checkout/${transaction.id}`,
          returnUrl: input.returnUrl
        };
        break;

      case 'instapay':
        transaction.status = 'processing';
        paymentData = {
          ...paymentData,
          instapayId: 'haderos@instapay',
          amount: input.amount,
          reference: transaction.id
        };
        break;

      case 'cod':
        transaction.status = 'pending';
        paymentData = {
          ...paymentData,
          message: 'الدفع عند الاستلام'
        };
        break;

      case 'wallet':
        // Will be handled by wallet routes
        transaction.status = 'processing';
        break;
    }

    transactions.set(transaction.id, transaction);

    console.log('Event: payment.initiated', { transactionId: transaction.id, method: input.method });

    res.status(201).json({
      transaction,
      paymentData
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/transactions/:id/confirm - Confirm payment
transactionRoutes.post('/:id/confirm', (req, res) => {
  const transaction = transactions.get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found', code: 'NOT_FOUND' });
  }

  if (transaction.status !== 'pending' && transaction.status !== 'processing') {
    return res.status(400).json({ error: 'Transaction cannot be confirmed', code: 'INVALID_STATUS' });
  }

  const { gatewayRef, gatewayResponse } = req.body;

  transaction.status = 'completed';
  transaction.processedAt = new Date();
  transaction.gatewayRef = gatewayRef;
  transaction.gatewayResponse = gatewayResponse;
  transaction.updatedAt = new Date();

  transactions.set(transaction.id, transaction);

  console.log('Event: payment.completed', { transactionId: transaction.id });

  res.json({ transaction });
});

// POST /api/transactions/:id/fail - Mark payment as failed
transactionRoutes.post('/:id/fail', (req, res) => {
  const transaction = transactions.get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found', code: 'NOT_FOUND' });
  }

  const { reason } = req.body;

  transaction.status = 'failed';
  transaction.failureReason = reason;
  transaction.updatedAt = new Date();

  transactions.set(transaction.id, transaction);

  console.log('Event: payment.failed', { transactionId: transaction.id, reason });

  res.json({ transaction });
});

// POST /api/transactions/:id/refund - Refund payment
transactionRoutes.post('/:id/refund', (req, res) => {
  try {
    const input = RefundInput.parse({ ...req.body, transactionId: req.params.id });
    const transaction = transactions.get(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found', code: 'NOT_FOUND' });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed transactions can be refunded', code: 'INVALID_STATUS' });
    }

    const refundAmount = input.amount || transaction.amount - transaction.refundedAmount;

    if (refundAmount > transaction.amount - transaction.refundedAmount) {
      return res.status(400).json({ error: 'Refund amount exceeds available amount', code: 'INVALID_AMOUNT' });
    }

    transaction.refundedAmount += refundAmount;
    transaction.refundReason = input.reason;
    transaction.status = transaction.refundedAmount >= transaction.amount ? 'refunded' : 'partially_refunded';
    transaction.updatedAt = new Date();

    transactions.set(transaction.id, transaction);

    // Create refund transaction
    const refundTx: Transaction = {
      id: nanoid(),
      orderId: transaction.orderId,
      userId: transaction.userId,
      merchantId: transaction.merchantId,
      amount: -refundAmount,
      currency: 'EGP',
      fees: 0,
      netAmount: -refundAmount,
      method: transaction.method,
      status: 'completed',
      description: `Refund for ${transaction.id}: ${input.reason}`,
      refundedAmount: 0,
      createdAt: new Date(),
      processedAt: new Date(),
      updatedAt: new Date()
    };

    transactions.set(refundTx.id, refundTx);

    console.log('Event: payment.refunded', {
      originalTransactionId: transaction.id,
      refundTransactionId: refundTx.id,
      amount: refundAmount
    });

    res.json({
      originalTransaction: transaction,
      refundTransaction: refundTx
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// GET /api/transactions/fawry/:code - Check Fawry code status
transactionRoutes.get('/fawry/:code', (req, res) => {
  const fawryCode = Array.from(fawryCodes.values()).find(f => f.code === req.params.code);

  if (!fawryCode) {
    return res.status(404).json({ error: 'Fawry code not found', code: 'NOT_FOUND' });
  }

  const transaction = transactions.get(fawryCode.transactionId);

  res.json({
    fawryCode,
    transaction: transaction ? {
      id: transaction.id,
      status: transaction.status
    } : null
  });
});

// POST /api/transactions/fawry/callback - Fawry payment callback
transactionRoutes.post('/fawry/callback', (req, res) => {
  const { referenceNumber, paymentStatus, statusDescription } = req.body;

  const fawryCode = Array.from(fawryCodes.values()).find(f => f.code === referenceNumber);

  if (!fawryCode) {
    return res.status(404).json({ error: 'Fawry code not found' });
  }

  const transaction = transactions.get(fawryCode.transactionId);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (paymentStatus === 'PAID') {
    fawryCode.status = 'paid';
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    transaction.gatewayRef = referenceNumber;

    console.log('Event: fawry.payment_received', { transactionId: transaction.id });
  } else if (paymentStatus === 'EXPIRED') {
    fawryCode.status = 'expired';
    transaction.status = 'failed';
    transaction.failureReason = 'Fawry code expired';
  }

  transaction.updatedAt = new Date();
  fawryCodes.set(fawryCode.id, fawryCode);
  transactions.set(transaction.id, transaction);

  res.json({ success: true });
});

// Export for other routes
export { transactions };
