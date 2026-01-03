/**
 * Payout Routes - Merchant Payouts
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';

export const payoutRoutes = Router();

// Payout type
interface Payout {
  id: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  fees: number;
  netAmount: number;
  method: 'bank_transfer' | 'instapay' | 'vodafone_cash';
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    swiftCode?: string;
  };
  mobileNumber?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference?: string;
  periodStart: Date;
  periodEnd: Date;
  ordersCount: number;
  failureReason?: string;
  createdAt: Date;
  processedAt?: Date;
}

// In-memory store
const payouts = new Map<string, Payout>();
const merchantBalances = new Map<string, number>();

// GET /api/payouts - List payouts
payoutRoutes.get('/', (req, res) => {
  const { merchantId, status, page = 1, limit = 20 } = req.query;

  let payoutList = Array.from(payouts.values());

  if (merchantId) {
    payoutList = payoutList.filter(p => p.merchantId === merchantId);
  }
  if (status) {
    payoutList = payoutList.filter(p => p.status === status);
  }

  // Sort by date (newest first)
  payoutList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const start = (Number(page) - 1) * Number(limit);
  const paginated = payoutList.slice(start, start + Number(limit));

  res.json({
    payouts: paginated,
    total: payoutList.length,
    page: Number(page)
  });
});

// GET /api/payouts/balance/:merchantId - Get merchant balance
payoutRoutes.get('/balance/:merchantId', (req, res) => {
  const balance = merchantBalances.get(req.params.merchantId) || 0;

  // Get pending payouts
  const pendingPayouts = Array.from(payouts.values())
    .filter(p => p.merchantId === req.params.merchantId && p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  res.json({
    merchantId: req.params.merchantId,
    availableBalance: balance,
    pendingPayouts,
    currency: 'EGP'
  });
});

// POST /api/payouts - Create payout request
payoutRoutes.post('/', (req, res) => {
  const {
    merchantId,
    merchantName,
    amount,
    method,
    bankDetails,
    mobileNumber,
    periodStart,
    periodEnd,
    ordersCount
  } = req.body;

  // Check balance
  const balance = merchantBalances.get(merchantId) || 0;
  if (balance < amount) {
    return res.status(400).json({
      error: 'Insufficient balance',
      code: 'INSUFFICIENT_BALANCE',
      availableBalance: balance,
      requested: amount
    });
  }

  // Calculate fees (1% for bank, 0.5% for instapay/vodafone)
  const feeRate = method === 'bank_transfer' ? 0.01 : 0.005;
  const fees = Math.round(amount * feeRate * 100) / 100;
  const netAmount = amount - fees;

  const payout: Payout = {
    id: nanoid(),
    merchantId,
    merchantName,
    amount,
    currency: 'EGP',
    fees,
    netAmount,
    method,
    bankDetails,
    mobileNumber,
    status: 'pending',
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    ordersCount,
    createdAt: new Date()
  };

  // Deduct from balance
  merchantBalances.set(merchantId, balance - amount);
  payouts.set(payout.id, payout);

  console.log('Event: payout.requested', { payoutId: payout.id, merchantId, amount });

  res.status(201).json({ payout });
});

// POST /api/payouts/:id/process - Process payout
payoutRoutes.post('/:id/process', (req, res) => {
  const payout = payouts.get(req.params.id);
  if (!payout) {
    return res.status(404).json({ error: 'Payout not found', code: 'NOT_FOUND' });
  }

  if (payout.status !== 'pending') {
    return res.status(400).json({ error: 'Payout already processed', code: 'INVALID_STATUS' });
  }

  payout.status = 'processing';
  payout.processedAt = new Date();
  payouts.set(payout.id, payout);

  console.log('Event: payout.processing', { payoutId: payout.id });

  res.json({ payout });
});

// POST /api/payouts/:id/complete - Complete payout
payoutRoutes.post('/:id/complete', (req, res) => {
  const { reference } = req.body;
  const payout = payouts.get(req.params.id);

  if (!payout) {
    return res.status(404).json({ error: 'Payout not found', code: 'NOT_FOUND' });
  }

  payout.status = 'completed';
  payout.reference = reference;
  payout.processedAt = new Date();
  payouts.set(payout.id, payout);

  console.log('Event: payout.completed', { payoutId: payout.id, reference });

  res.json({ payout });
});

// POST /api/payouts/:id/fail - Mark payout as failed
payoutRoutes.post('/:id/fail', (req, res) => {
  const { reason } = req.body;
  const payout = payouts.get(req.params.id);

  if (!payout) {
    return res.status(404).json({ error: 'Payout not found', code: 'NOT_FOUND' });
  }

  payout.status = 'failed';
  payout.failureReason = reason;
  payouts.set(payout.id, payout);

  // Refund to merchant balance
  const balance = merchantBalances.get(payout.merchantId) || 0;
  merchantBalances.set(payout.merchantId, balance + payout.amount);

  console.log('Event: payout.failed', { payoutId: payout.id, reason });

  res.json({ payout });
});

// POST /api/payouts/merchant/:merchantId/credit - Add to merchant balance
payoutRoutes.post('/merchant/:merchantId/credit', (req, res) => {
  const { amount, orderId, description } = req.body;

  const balance = merchantBalances.get(req.params.merchantId) || 0;
  merchantBalances.set(req.params.merchantId, balance + amount);

  console.log('Event: merchant.credited', {
    merchantId: req.params.merchantId,
    amount,
    orderId
  });

  res.json({
    success: true,
    newBalance: merchantBalances.get(req.params.merchantId)
  });
});

// GET /api/payouts/stats/:merchantId - Get payout statistics
payoutRoutes.get('/stats/:merchantId', (req, res) => {
  const merchantPayouts = Array.from(payouts.values())
    .filter(p => p.merchantId === req.params.merchantId);

  const stats = {
    totalPayouts: merchantPayouts.length,
    totalAmount: merchantPayouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: merchantPayouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0),
    lastPayout: merchantPayouts
      .filter(p => p.status === 'completed')
      .sort((a, b) => b.processedAt!.getTime() - a.processedAt!.getTime())[0] || null
  };

  res.json(stats);
});
