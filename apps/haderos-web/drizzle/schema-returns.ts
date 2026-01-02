/**
 * Returns & Refunds Schema
 * نظام الاسترجاع والاستبدال
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Return Reasons
export const returnReasons = pgTable('return_reasons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  nameEn: varchar('name_en', { length: 100 }).notNull(),
  nameAr: varchar('name_ar', { length: 100 }).notNull(),
  description: text('description'),
  requiresPhotos: boolean('requires_photos').default(false),
  requiresDescription: boolean('requires_description').default(true),
  refundPercentage: decimal('refund_percentage', { precision: 5, scale: 2 }).default('100.00'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Return Requests
export const returnRequests = pgTable('return_requests', {
  id: serial('id').primaryKey(),
  returnNumber: varchar('return_number', { length: 50 }).notNull().unique(),
  orderId: integer('order_id').notNull(),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  customerId: integer('customer_id'),
  customerName: varchar('customer_name', { length: 200 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  customerEmail: varchar('customer_email', { length: 200 }),

  // Return Type
  type: varchar('type', { length: 20 }).notNull(), // 'return', 'exchange', 'refund_only'

  // Status
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  // pending, approved, rejected, pickup_scheduled, picked_up,
  // inspection, approved_for_refund, refund_processing, refunded, completed, cancelled

  // Reason
  reasonId: integer('reason_id').references(() => returnReasons.id),
  reasonCode: varchar('reason_code', { length: 50 }),
  customerNotes: text('customer_notes'),

  // Photos
  photos: jsonb('photos').default([]), // Array of photo URLs

  // Pickup Information
  pickupAddress: jsonb('pickup_address'),
  pickupScheduledDate: timestamp('pickup_scheduled_date'),
  pickupCompletedDate: timestamp('pickup_completed_date'),
  pickupShippingCompany: varchar('pickup_shipping_company', { length: 50 }),
  pickupTrackingNumber: varchar('pickup_tracking_number', { length: 100 }),

  // Inspection
  inspectionDate: timestamp('inspection_date'),
  inspectionNotes: text('inspection_notes'),
  inspectionResult: varchar('inspection_result', { length: 30 }), // 'approved', 'partial', 'rejected'
  inspectedBy: integer('inspected_by'),

  // Financial
  originalAmount: decimal('original_amount', { precision: 10, scale: 2 }).notNull(),
  approvedRefundAmount: decimal('approved_refund_amount', { precision: 10, scale: 2 }),
  deductions: decimal('deductions', { precision: 10, scale: 2 }).default('0.00'),
  deductionReason: text('deduction_reason'),
  refundedAmount: decimal('refunded_amount', { precision: 10, scale: 2 }),

  // Refund Method
  refundMethod: varchar('refund_method', { length: 30 }), // 'original_payment', 'wallet', 'bank_transfer', 'cash'
  refundDetails: jsonb('refund_details'),
  refundTransactionId: varchar('refund_transaction_id', { length: 100 }),
  refundedAt: timestamp('refunded_at'),

  // Exchange (if type is 'exchange')
  exchangeOrderId: integer('exchange_order_id'),
  exchangeOrderNumber: varchar('exchange_order_number', { length: 50 }),

  // Staff
  createdBy: integer('created_by'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectedBy: integer('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Return Items
export const returnItems = pgTable('return_items', {
  id: serial('id').primaryKey(),
  returnRequestId: integer('return_request_id')
    .notNull()
    .references(() => returnRequests.id),
  orderItemId: integer('order_item_id').notNull(),

  // Product Info
  productId: integer('product_id').notNull(),
  productName: varchar('product_name', { length: 300 }).notNull(),
  productNameAr: varchar('product_name_ar', { length: 300 }),
  sku: varchar('sku', { length: 100 }),
  variant: varchar('variant', { length: 200 }), // Size, Color, etc.
  imageUrl: varchar('image_url', { length: 500 }),

  // Quantities
  orderedQuantity: integer('ordered_quantity').notNull(),
  returnQuantity: integer('return_quantity').notNull(),

  // Pricing
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),

  // Item-specific reason (optional, if different from main)
  reasonId: integer('reason_id').references(() => returnReasons.id),
  itemNotes: text('item_notes'),

  // Inspection
  inspectionResult: varchar('inspection_result', { length: 30 }), // 'approved', 'rejected', 'partial'
  inspectionNotes: text('inspection_notes'),
  approvedQuantity: integer('approved_quantity'),
  approvedAmount: decimal('approved_amount', { precision: 10, scale: 2 }),

  // Exchange item (if applicable)
  exchangeProductId: integer('exchange_product_id'),
  exchangeVariant: varchar('exchange_variant', { length: 200 }),

  // Restocking
  restocked: boolean('restocked').default(false),
  restockedAt: timestamp('restocked_at'),
  restockedBy: integer('restocked_by'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Return Status History
export const returnStatusHistory = pgTable('return_status_history', {
  id: serial('id').primaryKey(),
  returnRequestId: integer('return_request_id')
    .notNull()
    .references(() => returnRequests.id),
  fromStatus: varchar('from_status', { length: 30 }),
  toStatus: varchar('to_status', { length: 30 }).notNull(),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  changedBy: integer('changed_by'),
  changedAt: timestamp('changed_at').defaultNow(),
});

// Refund Transactions
export const refundTransactions = pgTable('refund_transactions', {
  id: serial('id').primaryKey(),
  transactionId: varchar('transaction_id', { length: 100 }).notNull().unique(),
  returnRequestId: integer('return_request_id')
    .notNull()
    .references(() => returnRequests.id),

  // Amount
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EGP'),

  // Method
  method: varchar('method', { length: 30 }).notNull(), // 'original_payment', 'wallet', 'bank_transfer', 'instapay', 'vodafone_cash'

  // Original Payment Info (for reversals)
  originalPaymentMethod: varchar('original_payment_method', { length: 30 }),
  originalTransactionId: varchar('original_transaction_id', { length: 100 }),

  // Bank Transfer Details
  bankName: varchar('bank_name', { length: 100 }),
  accountNumber: varchar('account_number', { length: 50 }),
  accountHolderName: varchar('account_holder_name', { length: 200 }),
  iban: varchar('iban', { length: 50 }),

  // Mobile Wallet Details
  walletProvider: varchar('wallet_provider', { length: 30 }),
  walletNumber: varchar('wallet_number', { length: 20 }),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // pending, processing, completed, failed, cancelled

  // Gateway Response
  gatewayResponse: jsonb('gateway_response'),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 100 }),

  // Error handling
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').default(0),

  // Timestamps
  initiatedAt: timestamp('initiated_at').defaultNow(),
  completedAt: timestamp('completed_at'),

  // Staff
  initiatedBy: integer('initiated_by'),
  processedBy: integer('processed_by'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Return Policies
export const returnPolicies = pgTable('return_policies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  nameAr: varchar('name_ar', { length: 100 }),
  description: text('description'),
  descriptionAr: text('description_ar'),

  // Time limits
  returnWindowDays: integer('return_window_days').default(14),
  exchangeWindowDays: integer('exchange_window_days').default(30),

  // Conditions
  requiresOriginalPackaging: boolean('requires_original_packaging').default(true),
  requiresTags: boolean('requires_tags').default(true),
  requiresReceipt: boolean('requires_receipt').default(false),

  // Exclusions
  excludedCategories: jsonb('excluded_categories').default([]),
  excludedProducts: jsonb('excluded_products').default([]),

  // Fees
  restockingFeePercentage: decimal('restocking_fee_percentage', { precision: 5, scale: 2 }).default(
    '0.00'
  ),
  returnShippingFee: decimal('return_shipping_fee', { precision: 10, scale: 2 }).default('0.00'),
  freeReturnMinAmount: decimal('free_return_min_amount', { precision: 10, scale: 2 }),

  // Refund options
  allowOriginalPaymentRefund: boolean('allow_original_payment_refund').default(true),
  allowWalletRefund: boolean('allow_wallet_refund').default(true),
  allowBankTransferRefund: boolean('allow_bank_transfer_refund').default(true),
  allowExchange: boolean('allow_exchange').default(true),

  // Status
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const returnRequestRelations = relations(returnRequests, ({ one, many }) => ({
  reason: one(returnReasons, {
    fields: [returnRequests.reasonId],
    references: [returnReasons.id],
  }),
  items: many(returnItems),
  statusHistory: many(returnStatusHistory),
  refundTransactions: many(refundTransactions),
}));

export const returnItemRelations = relations(returnItems, ({ one }) => ({
  returnRequest: one(returnRequests, {
    fields: [returnItems.returnRequestId],
    references: [returnRequests.id],
  }),
  reason: one(returnReasons, {
    fields: [returnItems.reasonId],
    references: [returnReasons.id],
  }),
}));

export const returnStatusHistoryRelations = relations(returnStatusHistory, ({ one }) => ({
  returnRequest: one(returnRequests, {
    fields: [returnStatusHistory.returnRequestId],
    references: [returnRequests.id],
  }),
}));

export const refundTransactionRelations = relations(refundTransactions, ({ one }) => ({
  returnRequest: one(returnRequests, {
    fields: [refundTransactions.returnRequestId],
    references: [returnRequests.id],
  }),
}));

// Default Return Reasons (for seeding)
export const DEFAULT_RETURN_REASONS = [
  { code: 'WRONG_SIZE', nameEn: 'Wrong Size', nameAr: 'مقاس خاطئ', refundPercentage: 100 },
  { code: 'WRONG_COLOR', nameEn: 'Wrong Color', nameAr: 'لون خاطئ', refundPercentage: 100 },
  {
    code: 'DEFECTIVE',
    nameEn: 'Defective Product',
    nameAr: 'منتج معيب',
    refundPercentage: 100,
    requiresPhotos: true,
  },
  {
    code: 'NOT_AS_DESCRIBED',
    nameEn: 'Not as Described',
    nameAr: 'غير مطابق للوصف',
    refundPercentage: 100,
    requiresPhotos: true,
  },
  {
    code: 'DAMAGED_IN_SHIPPING',
    nameEn: 'Damaged in Shipping',
    nameAr: 'تالف أثناء الشحن',
    refundPercentage: 100,
    requiresPhotos: true,
  },
  { code: 'WRONG_ITEM', nameEn: 'Wrong Item Received', nameAr: 'منتج خاطئ', refundPercentage: 100 },
  { code: 'CHANGED_MIND', nameEn: 'Changed Mind', nameAr: 'غيرت رأيي', refundPercentage: 85 },
  {
    code: 'FOUND_BETTER_PRICE',
    nameEn: 'Found Better Price',
    nameAr: 'وجدت سعر أفضل',
    refundPercentage: 85,
  },
  { code: 'LATE_DELIVERY', nameEn: 'Late Delivery', nameAr: 'تأخر التوصيل', refundPercentage: 100 },
  {
    code: 'OTHER',
    nameEn: 'Other',
    nameAr: 'سبب آخر',
    refundPercentage: 85,
    requiresDescription: true,
  },
];
