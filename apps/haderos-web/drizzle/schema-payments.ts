/**
 * Unified Payment System Schema
 * نظام الدفع الموحد
 *
 * Supports:
 * 1. InstaPay (CBE)
 * 2. Paymob (Cards, Wallets)
 * 3. Mobile Wallets (Vodafone, Orange, Etisalat, WE)
 * 4. Fawry
 * 5. Cash on Delivery (COD)
 */

import { pgTable, serial, varchar, text, timestamp, decimal, integer, jsonb, boolean, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// PAYMENT PROVIDERS CONFIGURATION
// ============================================

export const paymentProviders = pgTable("payment_providers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  // instapay, paymob, vodafone_cash, orange_cash, etisalat_cash, we_pay, fawry, cod

  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),

  type: varchar("type", { length: 30 }).notNull(),
  // instant_payment, card, mobile_wallet, cash, reference_code

  // Configuration
  config: jsonb("config").$type<{
    apiUrl?: string;
    apiKey?: string;
    merchantId?: string;
    integrationId?: string;
    iframeId?: string;
    hmacSecret?: string;
  }>(),

  // Fees
  fixedFee: decimal("fixed_fee", { precision: 10, scale: 2 }).default("0.00"),
  percentageFee: decimal("percentage_fee", { precision: 5, scale: 4 }).default("0.0000"),
  minFee: decimal("min_fee", { precision: 10, scale: 2 }).default("0.00"),
  maxFee: decimal("max_fee", { precision: 10, scale: 2 }),

  // Limits
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).default("1.00"),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }).default("50000.00"),

  // Availability
  isActive: boolean("is_active").default(true),
  supportedCurrencies: jsonb("supported_currencies").$type<string[]>().default(["EGP"]),

  // Display
  logoUrl: varchar("logo_url", { length: 500 }),
  displayOrder: integer("display_order").default(0),
  showOnCheckout: boolean("show_on_checkout").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// PAYMENT TRANSACTIONS
// ============================================

export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  transactionNumber: varchar("transaction_number", { length: 50 }).notNull().unique(),

  // Order Reference
  orderId: integer("order_id").notNull(),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),

  // Provider
  providerId: integer("provider_id").notNull().references(() => paymentProviders.id),
  providerCode: varchar("provider_code", { length: 30 }).notNull(),

  // External References
  providerTransactionId: varchar("provider_transaction_id", { length: 100 }),
  providerReference: varchar("provider_reference", { length: 100 }),

  // Amounts
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EGP"),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0.00"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }), // amount - fee

  // Status
  status: varchar("status", { length: 30 }).default("pending"),
  // pending, processing, completed, failed, cancelled, refunded, partially_refunded

  // Customer
  customerName: varchar("customer_name", { length: 200 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerEmail: varchar("customer_email", { length: 320 }),

  // Payment Details
  paymentMethod: varchar("payment_method", { length: 50 }),
  // mobile_number, card, reference_code, qr_code, deep_link

  // For Mobile Wallets
  walletNumber: varchar("wallet_number", { length: 20 }),

  // For Cards
  cardLastFour: varchar("card_last_four", { length: 4 }),
  cardBrand: varchar("card_brand", { length: 20 }), // visa, mastercard, meeza

  // For Reference Code (Fawry)
  referenceCode: varchar("reference_code", { length: 50 }),
  referenceExpiry: timestamp("reference_expiry"),

  // URLs
  paymentUrl: text("payment_url"),
  qrCode: text("qr_code"),
  deepLink: text("deep_link"),

  // Timestamps
  initiatedAt: timestamp("initiated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),

  // Error Handling
  failureReason: text("failure_reason"),
  failureCode: varchar("failure_code", { length: 50 }),

  // Metadata
  metadata: jsonb("metadata"),
  providerResponse: jsonb("provider_response"),

  // Tracking
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("payment_tx_order_idx").on(table.orderId),
  index("payment_tx_status_idx").on(table.status),
  index("payment_tx_provider_idx").on(table.providerCode),
  index("payment_tx_created_idx").on(table.createdAt),
]);

// ============================================
// PAYMENT REFUNDS
// ============================================

export const paymentRefunds = pgTable("payment_refunds", {
  id: serial("id").primaryKey(),
  refundNumber: varchar("refund_number", { length: 50 }).notNull().unique(),

  // Original Transaction
  transactionId: integer("transaction_id").notNull().references(() => paymentTransactions.id),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),

  // Refund Amount
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull(),
  refundFee: decimal("refund_fee", { precision: 10, scale: 2 }).default("0.00"),

  // Status
  status: varchar("status", { length: 30 }).default("pending"),
  // pending, processing, completed, failed

  // Reason
  reason: text("reason"),
  reasonCode: varchar("reason_code", { length: 50 }),

  // Provider Reference
  providerRefundId: varchar("provider_refund_id", { length: 100 }),

  // Requested By
  requestedBy: integer("requested_by"),
  approvedBy: integer("approved_by"),

  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),

  failureReason: text("failure_reason"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("refund_tx_idx").on(table.transactionId),
  index("refund_status_idx").on(table.status),
]);

// ============================================
// MOBILE WALLET ACCOUNTS
// ============================================

export const mobileWalletAccounts = pgTable("mobile_wallet_accounts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),

  walletProvider: varchar("wallet_provider", { length: 30 }).notNull(),
  // vodafone_cash, orange_cash, etisalat_cash, we_pay, instapay

  mobileNumber: varchar("mobile_number", { length: 20 }).notNull(),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),

  // For recurring payments
  isDefault: boolean("is_default").default(false),

  // Status
  status: varchar("status", { length: 20 }).default("active"),
  // active, inactive, blocked

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("wallet_customer_idx").on(table.customerId),
  unique("wallet_provider_number").on(table.walletProvider, table.mobileNumber),
]);

// ============================================
// SAVED CARDS
// ============================================

export const savedCards = pgTable("saved_cards", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),

  // Card Token (from payment provider)
  cardToken: varchar("card_token", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 30 }).notNull(), // paymob

  // Card Display Info
  lastFour: varchar("last_four", { length: 4 }).notNull(),
  cardBrand: varchar("card_brand", { length: 20 }).notNull(),
  expiryMonth: varchar("expiry_month", { length: 2 }),
  expiryYear: varchar("expiry_year", { length: 4 }),
  cardholderName: varchar("cardholder_name", { length: 100 }),

  // Preferences
  isDefault: boolean("is_default").default(false),

  // Status
  status: varchar("status", { length: 20 }).default("active"),
  // active, expired, revoked

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("saved_card_customer_idx").on(table.customerId),
]);

// ============================================
// PAYMENT WEBHOOKS LOG
// ============================================

export const paymentWebhooks = pgTable("payment_webhooks", {
  id: serial("id").primaryKey(),

  provider: varchar("provider", { length: 30 }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),

  // Reference
  transactionId: integer("transaction_id").references(() => paymentTransactions.id),
  providerTransactionId: varchar("provider_transaction_id", { length: 100 }),

  // Payload
  payload: jsonb("payload").notNull(),
  headers: jsonb("headers"),

  // Verification
  signatureValid: boolean("signature_valid"),
  signature: text("signature"),

  // Processing
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  error: text("error"),
  retryCount: integer("retry_count").default(0),

  receivedAt: timestamp("received_at").defaultNow(),
}, (table) => [
  index("webhook_provider_idx").on(table.provider),
  index("webhook_tx_idx").on(table.transactionId),
  index("webhook_processed_idx").on(table.processed),
]);

// ============================================
// PAYMENT SETTLEMENTS
// ============================================

export const paymentSettlements = pgTable("payment_settlements", {
  id: serial("id").primaryKey(),
  settlementNumber: varchar("settlement_number", { length: 50 }).notNull().unique(),

  provider: varchar("provider", { length: 30 }).notNull(),

  // Period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),

  // Amounts
  grossAmount: decimal("gross_amount", { precision: 12, scale: 2 }).notNull(),
  totalFees: decimal("total_fees", { precision: 12, scale: 2 }).notNull(),
  totalRefunds: decimal("total_refunds", { precision: 12, scale: 2 }).default("0.00"),
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull(),

  // Counts
  transactionCount: integer("transaction_count").notNull(),
  refundCount: integer("refund_count").default(0),

  // Status
  status: varchar("status", { length: 30 }).default("pending"),
  // pending, processing, completed, failed

  // Bank Transfer
  bankReference: varchar("bank_reference", { length: 100 }),
  transferredAt: timestamp("transferred_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("settlement_provider_idx").on(table.provider),
  index("settlement_status_idx").on(table.status),
  index("settlement_period_idx").on(table.periodStart, table.periodEnd),
]);

// ============================================
// FAWRY REFERENCE CODES
// ============================================

export const fawryReferences = pgTable("fawry_references", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => paymentTransactions.id),

  referenceCode: varchar("reference_code", { length: 50 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  expiresAt: timestamp("expires_at").notNull(),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),

  // Payment Location
  paidAtLocation: varchar("paid_at_location", { length: 200 }),

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("fawry_ref_code_idx").on(table.referenceCode),
  index("fawry_expires_idx").on(table.expiresAt),
]);

// ============================================
// RELATIONS
// ============================================

export const paymentProvidersRelations = relations(paymentProviders, ({ many }) => ({
  transactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one, many }) => ({
  provider: one(paymentProviders, {
    fields: [paymentTransactions.providerId],
    references: [paymentProviders.id],
  }),
  refunds: many(paymentRefunds),
  webhooks: many(paymentWebhooks),
}));

export const paymentRefundsRelations = relations(paymentRefunds, ({ one }) => ({
  transaction: one(paymentTransactions, {
    fields: [paymentRefunds.transactionId],
    references: [paymentTransactions.id],
  }),
}));

// ============================================
// DEFAULT PROVIDERS
// ============================================

export const DEFAULT_PAYMENT_PROVIDERS = [
  {
    code: "instapay",
    name: "InstaPay",
    nameAr: "إنستاباي",
    type: "instant_payment",
    fixedFee: 0,
    percentageFee: 0.01, // 1%
    minAmount: 1,
    maxAmount: 50000,
    displayOrder: 1,
  },
  {
    code: "vodafone_cash",
    name: "Vodafone Cash",
    nameAr: "فودافون كاش",
    type: "mobile_wallet",
    fixedFee: 0,
    percentageFee: 0.015, // 1.5%
    minAmount: 1,
    maxAmount: 30000,
    displayOrder: 2,
  },
  {
    code: "orange_cash",
    name: "Orange Cash",
    nameAr: "أورنج كاش",
    type: "mobile_wallet",
    fixedFee: 0,
    percentageFee: 0.015,
    minAmount: 1,
    maxAmount: 30000,
    displayOrder: 3,
  },
  {
    code: "etisalat_cash",
    name: "Etisalat Cash",
    nameAr: "اتصالات كاش",
    type: "mobile_wallet",
    fixedFee: 0,
    percentageFee: 0.015,
    minAmount: 1,
    maxAmount: 30000,
    displayOrder: 4,
  },
  {
    code: "we_pay",
    name: "WE Pay",
    nameAr: "وي باي",
    type: "mobile_wallet",
    fixedFee: 0,
    percentageFee: 0.015,
    minAmount: 1,
    maxAmount: 30000,
    displayOrder: 5,
  },
  {
    code: "paymob_card",
    name: "Credit/Debit Card",
    nameAr: "بطاقة ائتمان/خصم",
    type: "card",
    fixedFee: 0,
    percentageFee: 0.0275, // 2.75%
    minAmount: 10,
    maxAmount: 100000,
    displayOrder: 6,
  },
  {
    code: "fawry",
    name: "Fawry",
    nameAr: "فوري",
    type: "reference_code",
    fixedFee: 5,
    percentageFee: 0,
    minAmount: 10,
    maxAmount: 10000,
    displayOrder: 7,
  },
  {
    code: "cod",
    name: "Cash on Delivery",
    nameAr: "الدفع عند الاستلام",
    type: "cash",
    fixedFee: 10, // COD fee
    percentageFee: 0,
    minAmount: 0,
    maxAmount: 50000,
    displayOrder: 8,
  },
];
