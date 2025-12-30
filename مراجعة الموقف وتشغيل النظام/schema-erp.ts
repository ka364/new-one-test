/**
 * HaderOS ERP Database Schema
 * Based on ERPNext standards with Bio-Modules architecture
 * 
 * Core Modules:
 * 1. Financial Bio-Module (Accounting)
 * 2. Inventory Bio-Module (Products & Stock)
 * 3. Sales Bio-Module (Customers & Invoices)
 */

import { pgTable, text, integer, decimal, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// 1. CHART OF ACCOUNTS (Financial Bio-Module)
// ============================================

export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountCode: text("account_code").notNull().unique(), // e.g., "1000", "2000"
  accountName: text("account_name").notNull(), // e.g., "Cash", "Accounts Receivable"
  accountType: text("account_type").notNull(), // "Asset", "Liability", "Equity", "Income", "Expense"
  parentAccountId: uuid("parent_account_id"), // For hierarchical structure
  isGroup: boolean("is_group").default(false), // Group account or leaf account
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00"),
  currency: text("currency").default("EGP"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// 2. JOURNAL ENTRIES (Financial Bio-Module)
// ============================================

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryNumber: text("entry_number").notNull().unique(), // e.g., "JE-2025-001"
  entryDate: timestamp("entry_date").notNull(),
  description: text("description").notNull(),
  totalDebit: decimal("total_debit", { precision: 15, scale: 2 }).notNull(),
  totalCredit: decimal("total_credit", { precision: 15, scale: 2 }).notNull(),
  status: text("status").default("draft"), // "draft", "posted", "cancelled"
  postedBy: text("posted_by"),
  postedAt: timestamp("posted_at"),
  sourceModule: text("source_module"), // "sales", "inventory", "manual"
  sourceDocumentId: uuid("source_document_id"), // Link to invoice, payment, etc.
  metadata: jsonb("metadata"), // Additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const journalEntryLines = pgTable("journal_entry_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  journalEntryId: uuid("journal_entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").notNull().references(() => chartOfAccounts.id),
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0.00"),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0.00"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// 3. PRODUCTS (Inventory Bio-Module)
// ============================================

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  productCode: text("product_code").notNull().unique(), // e.g., "PROD-001"
  productName: text("product_name").notNull(),
  description: text("description"),
  category: text("category"), // e.g., "Electronics", "Clothing"
  unit: text("unit").default("piece"), // "piece", "kg", "liter"
  costPrice: decimal("cost_price", { precision: 15, scale: 2 }).default("0.00"),
  sellingPrice: decimal("selling_price", { precision: 15, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"), // e.g., 14.00 for 14%
  stockQuantity: integer("stock_quantity").default(0),
  reorderLevel: integer("reorder_level").default(0), // Alert when stock falls below this
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// 4. STOCK MOVEMENTS (Inventory Bio-Module)
// ============================================

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id),
  movementType: text("movement_type").notNull(), // "in", "out", "adjustment"
  quantity: integer("quantity").notNull(),
  referenceType: text("reference_type"), // "sale", "purchase", "adjustment"
  referenceId: uuid("reference_id"), // Link to invoice, etc.
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// 5. CUSTOMERS (Sales Bio-Module)
// ============================================

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerCode: text("customer_code").notNull().unique(), // e.g., "CUST-001"
  customerName: text("customer_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  governorate: text("governorate"),
  taxId: text("tax_id"), // Tax registration number
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).default("0.00"),
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// 6. SALES INVOICES (Sales Bio-Module)
// ============================================

export const salesInvoices = pgTable("sales_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(), // e.g., "INV-2025-001"
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).default("0.00"),
  status: text("status").default("draft"), // "draft", "posted", "paid", "cancelled"
  paymentStatus: text("payment_status").default("unpaid"), // "unpaid", "partial", "paid"
  notes: text("notes"),
  createdBy: text("created_by"),
  postedAt: timestamp("posted_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salesInvoiceLines = pgTable("sales_invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => salesInvoices.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  lineTotal: decimal("line_total", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// 7. PAYMENTS (Financial Bio-Module)
// ============================================

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentNumber: text("payment_number").notNull().unique(), // e.g., "PAY-2025-001"
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  paymentDate: timestamp("payment_date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // "cash", "bank_transfer", "card"
  referenceNumber: text("reference_number"), // Bank reference, check number, etc.
  notes: text("notes"),
  status: text("status").default("draft"), // "draft", "posted", "cancelled"
  createdBy: text("created_by"),
  postedAt: timestamp("posted_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").notNull().references(() => salesInvoices.id),
  allocatedAmount: decimal("allocated_amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  parentAccount: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentAccountId],
    references: [chartOfAccounts.id],
  }),
  childAccounts: many(chartOfAccounts),
  journalEntryLines: many(journalEntryLines),
}));

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  lines: many(journalEntryLines),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalEntryLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(chartOfAccounts, {
    fields: [journalEntryLines.accountId],
    references: [chartOfAccounts.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  stockMovements: many(stockMovements),
  invoiceLines: many(salesInvoiceLines),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(salesInvoices),
  payments: many(payments),
}));

export const salesInvoicesRelations = relations(salesInvoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [salesInvoices.customerId],
    references: [customers.id],
  }),
  lines: many(salesInvoiceLines),
  paymentAllocations: many(paymentAllocations),
}));

export const salesInvoiceLinesRelations = relations(salesInvoiceLines, ({ one }) => ({
  invoice: one(salesInvoices, {
    fields: [salesInvoiceLines.invoiceId],
    references: [salesInvoices.id],
  }),
  product: one(products, {
    fields: [salesInvoiceLines.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  allocations: many(paymentAllocations),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentAllocations.paymentId],
    references: [payments.id],
  }),
  invoice: one(salesInvoices, {
    fields: [paymentAllocations.invoiceId],
    references: [salesInvoices.id],
  }),
}));
