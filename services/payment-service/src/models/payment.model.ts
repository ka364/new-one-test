/**
 * Payment Model
 * Egyptian Payment Integration
 */

import { z } from 'zod';

// Payment methods available in Egypt
export const PaymentMethod = z.enum([
  'card',           // Credit/Debit Card
  'fawry',          // Fawry Payment
  'vodafone_cash',  // Vodafone Cash
  'instapay',       // InstaPay
  'meeza',          // Meeza Card
  'cod',            // Cash on Delivery
  'wallet',         // HADEROS Wallet
  'bank_transfer'   // Bank Transfer
]);

// Payment status
export const PaymentStatus = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded'
]);

// Transaction schema
export const TransactionSchema = z.object({
  id: z.string(),

  // Order info
  orderId: z.string(),
  userId: z.string(),
  merchantId: z.string().optional(),

  // Amount
  amount: z.number().positive(),
  currency: z.string().default('EGP'),
  fees: z.number().min(0).default(0),
  netAmount: z.number().positive(),

  // Payment method
  method: PaymentMethod,
  methodDetails: z.object({
    cardLast4: z.string().optional(),
    cardBrand: z.string().optional(),
    fawryCode: z.string().optional(),
    mobileNumber: z.string().optional(),
    walletId: z.string().optional()
  }).optional(),

  // Status
  status: PaymentStatus.default('pending'),
  failureReason: z.string().optional(),

  // External references
  gatewayRef: z.string().optional(),
  gatewayResponse: z.any().optional(),

  // Refund info
  refundedAmount: z.number().min(0).default(0),
  refundReason: z.string().optional(),

  // Metadata
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  processedAt: z.date().optional(),
  updatedAt: z.date().default(() => new Date())
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Wallet schema
export const WalletSchema = z.object({
  userId: z.string(),
  balance: z.number().min(0).default(0),
  currency: z.string().default('EGP'),
  isActive: z.boolean().default(true),
  transactions: z.array(z.object({
    id: z.string(),
    type: z.enum(['credit', 'debit', 'refund']),
    amount: z.number(),
    description: z.string(),
    orderId: z.string().optional(),
    createdAt: z.date()
  })).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Wallet = z.infer<typeof WalletSchema>;

// Fawry Payment Code
export const FawryCodeSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  orderId: z.string(),
  code: z.string(), // 13-digit Fawry code
  amount: z.number().positive(),
  expiresAt: z.date(),
  status: z.enum(['active', 'paid', 'expired', 'cancelled']).default('active'),
  createdAt: z.date().default(() => new Date())
});

export type FawryCode = z.infer<typeof FawryCodeSchema>;

// Input schemas
export const InitiatePaymentInput = z.object({
  orderId: z.string(),
  userId: z.string(),
  merchantId: z.string().optional(),
  amount: z.number().positive(),
  method: PaymentMethod,
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  // Method-specific fields
  cardToken: z.string().optional(),
  mobileNumber: z.string().optional(),
  returnUrl: z.string().optional()
});

export const RefundInput = z.object({
  transactionId: z.string(),
  amount: z.number().positive().optional(), // Full refund if not specified
  reason: z.string()
});

export const WalletTopUpInput = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  method: PaymentMethod.exclude(['wallet', 'cod']),
  cardToken: z.string().optional(),
  mobileNumber: z.string().optional()
});
