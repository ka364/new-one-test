/**
 * Wallet Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Wallet, WalletTopUpInput } from '../models/payment.model';
import { transactions } from './transaction.routes';

export const walletRoutes = Router();

// In-memory store
const wallets = new Map<string, Wallet>();

// GET /api/wallets/:userId - Get wallet balance
walletRoutes.get('/:userId', (req, res) => {
  let wallet = wallets.get(req.params.userId);

  if (!wallet) {
    // Create new wallet
    wallet = {
      userId: req.params.userId,
      balance: 0,
      currency: 'EGP',
      isActive: true,
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    wallets.set(req.params.userId, wallet);
  }

  res.json({
    wallet: {
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency,
      isActive: wallet.isActive
    }
  });
});

// GET /api/wallets/:userId/transactions - Get wallet transactions
walletRoutes.get('/:userId/transactions', (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const wallet = wallets.get(req.params.userId);

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found', code: 'NOT_FOUND' });
  }

  let txList = [...wallet.transactions];

  if (type) {
    txList = txList.filter(t => t.type === type);
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

// POST /api/wallets/:userId/topup - Top up wallet
walletRoutes.post('/:userId/topup', (req, res) => {
  try {
    const input = WalletTopUpInput.parse({ ...req.body, userId: req.params.userId });

    let wallet = wallets.get(input.userId);

    if (!wallet) {
      wallet = {
        userId: input.userId,
        balance: 0,
        currency: 'EGP',
        isActive: true,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // In production, this would integrate with actual payment gateway
    // For now, simulate successful top-up

    const txId = nanoid();
    wallet.balance += input.amount;
    wallet.transactions.push({
      id: txId,
      type: 'credit',
      amount: input.amount,
      description: `Top-up via ${input.method}`,
      createdAt: new Date()
    });
    wallet.updatedAt = new Date();

    wallets.set(input.userId, wallet);

    console.log('Event: wallet.topped_up', { userId: input.userId, amount: input.amount });

    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency
      },
      transactionId: txId
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/wallets/:userId/debit - Debit from wallet
walletRoutes.post('/:userId/debit', (req, res) => {
  const { amount, orderId, description } = req.body;
  const wallet = wallets.get(req.params.userId);

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found', code: 'NOT_FOUND' });
  }

  if (!wallet.isActive) {
    return res.status(400).json({ error: 'Wallet is inactive', code: 'WALLET_INACTIVE' });
  }

  if (wallet.balance < amount) {
    return res.status(400).json({
      error: 'Insufficient balance',
      code: 'INSUFFICIENT_BALANCE',
      currentBalance: wallet.balance,
      required: amount
    });
  }

  const txId = nanoid();
  wallet.balance -= amount;
  wallet.transactions.push({
    id: txId,
    type: 'debit',
    amount: -amount,
    description: description || 'Payment',
    orderId,
    createdAt: new Date()
  });
  wallet.updatedAt = new Date();

  wallets.set(req.params.userId, wallet);

  console.log('Event: wallet.debited', { userId: req.params.userId, amount, orderId });

  res.json({
    success: true,
    wallet: {
      balance: wallet.balance,
      currency: wallet.currency
    },
    transactionId: txId
  });
});

// POST /api/wallets/:userId/credit - Credit to wallet (refunds, cashback)
walletRoutes.post('/:userId/credit', (req, res) => {
  const { amount, orderId, description, type = 'refund' } = req.body;

  let wallet = wallets.get(req.params.userId);

  if (!wallet) {
    wallet = {
      userId: req.params.userId,
      balance: 0,
      currency: 'EGP',
      isActive: true,
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  const txId = nanoid();
  wallet.balance += amount;
  wallet.transactions.push({
    id: txId,
    type: type === 'refund' ? 'refund' : 'credit',
    amount,
    description: description || 'Credit',
    orderId,
    createdAt: new Date()
  });
  wallet.updatedAt = new Date();

  wallets.set(req.params.userId, wallet);

  console.log('Event: wallet.credited', { userId: req.params.userId, amount, type });

  res.json({
    success: true,
    wallet: {
      balance: wallet.balance,
      currency: wallet.currency
    },
    transactionId: txId
  });
});

// POST /api/wallets/:userId/transfer - Transfer between wallets
walletRoutes.post('/:userId/transfer', (req, res) => {
  const { toUserId, amount, description } = req.body;
  const fromWallet = wallets.get(req.params.userId);

  if (!fromWallet) {
    return res.status(404).json({ error: 'Source wallet not found', code: 'NOT_FOUND' });
  }

  if (fromWallet.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' });
  }

  let toWallet = wallets.get(toUserId);
  if (!toWallet) {
    toWallet = {
      userId: toUserId,
      balance: 0,
      currency: 'EGP',
      isActive: true,
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Debit from source
  const debitTxId = nanoid();
  fromWallet.balance -= amount;
  fromWallet.transactions.push({
    id: debitTxId,
    type: 'debit',
    amount: -amount,
    description: `Transfer to ${toUserId}: ${description || ''}`,
    createdAt: new Date()
  });
  fromWallet.updatedAt = new Date();

  // Credit to destination
  const creditTxId = nanoid();
  toWallet.balance += amount;
  toWallet.transactions.push({
    id: creditTxId,
    type: 'credit',
    amount,
    description: `Transfer from ${req.params.userId}: ${description || ''}`,
    createdAt: new Date()
  });
  toWallet.updatedAt = new Date();

  wallets.set(req.params.userId, fromWallet);
  wallets.set(toUserId, toWallet);

  console.log('Event: wallet.transferred', {
    from: req.params.userId,
    to: toUserId,
    amount
  });

  res.json({
    success: true,
    fromBalance: fromWallet.balance,
    toBalance: toWallet.balance
  });
});

// PUT /api/wallets/:userId/status - Activate/deactivate wallet
walletRoutes.put('/:userId/status', (req, res) => {
  const { isActive } = req.body;
  const wallet = wallets.get(req.params.userId);

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found', code: 'NOT_FOUND' });
  }

  wallet.isActive = isActive;
  wallet.updatedAt = new Date();
  wallets.set(req.params.userId, wallet);

  console.log('Event: wallet.status_changed', { userId: req.params.userId, isActive });

  res.json({ wallet });
});
