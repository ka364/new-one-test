/**
 * Integrated Expense Tracking Schema
 * 
 * Links expense management with 7×7 scaling system
 * Tracks expenses for all stakeholders except Founders
 */

import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  jsonb, 
  integer, 
  uuid, 
  decimal, 
  date,
  pgEnum 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../server/db/schema';
import { scalingHierarchy } from './schema-7x7-scaling';

// ============================================================================
// ENUMS
// ============================================================================

// أنواع الاشتراكات
export const subscriptionTypeEnum = pgEnum('subscription_type', [
  'cloud_hosting',
  'ai_service',
  'communication',
  'software',
  'database',
  'cdn',
  'monitoring',
  'security',
  'marketing_tools',
  'development_tools',
  'hr_software',
  'crm',
  'erp',
  'other'
]);

// حالات الدفع
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled',
  'overdue'
]);

// العملات
export const currencyEnum = pgEnum('currency', [
  'EGP',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SAR'
]);

// أنواع المصروفات
export const expenseTypeEnum = pgEnum('expense_type', [
  'subscription',
  'one_time',
  'recurring',
  'operational',
  'capital',
  'salary',
  'commission',
  'marketing',
  'development',
  'infrastructure',
  'other'
]);

// ============================================================================
// VENDORS (الموردين)
// ============================================================================

export const techVendors = pgTable('tech_vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: subscriptionTypeEnum('category').notNull(),
  website: text('website'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  accountManager: text('account_manager'),
  contractStart: date('contract_start'),
  contractEnd: date('contract_end'),
  autoRenew: boolean('auto_renew').default(true),
  paymentMethod: text('payment_method'), // 'credit_card', 'bank_transfer', 'paypal'
  billingCycle: text('billing_cycle'), // 'monthly', 'quarterly', 'annual'
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// SUBSCRIPTIONS (الاشتراكات)
// ============================================================================

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // ربط بالمورد
  vendorId: uuid('vendor_id').references(() => techVendors.id),
  
  // ربط بالكيان في نظام التوسع 7×7
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  
  name: text('name').notNull(),
  description: text('description'),
  subscriptionType: subscriptionTypeEnum('subscription_type').notNull(),
  
  // التكاليف
  monthlyCost: decimal('monthly_cost', { precision: 15, scale: 2 }).notNull(),
  annualCost: decimal('annual_cost', { precision: 15, scale: 2 }),
  currency: currencyEnum('currency').default('USD'),
  
  // التواريخ
  startDate: date('start_date').notNull(),
  renewalDate: date('renewal_date').notNull(),
  nextBillingDate: date('next_billing_date'),
  
  // الحالة
  isActive: boolean('is_active').default(true),
  isAutoRenew: boolean('is_auto_renew').default(true),
  
  // حدود الاستخدام
  usageLimit: jsonb('usage_limit').default({}),
  currentUsage: jsonb('current_usage').default({}),
  alertThreshold: integer('alert_threshold').default(80), // Percentage
  
  tags: text('tags').array(),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// EXPENSES (المصروفات)
// ============================================================================

export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // ربط بالكيان في نظام التوسع 7×7
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id).notNull(),
  
  // ربط بالاشتراك (إن وجد)
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  
  // بيانات المصروف
  title: text('title').notNull(),
  description: text('description'),
  expenseType: expenseTypeEnum('expense_type').notNull(),
  category: subscriptionTypeEnum('category'),
  
  // المبلغ
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum('currency').default('EGP'),
  
  // التواريخ
  expenseDate: date('expense_date').notNull(),
  dueDate: date('due_date'),
  paidDate: date('paid_date'),
  
  // الحالة
  status: paymentStatusEnum('status').default('pending'),
  
  // المرفقات
  receiptUrl: text('receipt_url'),
  invoiceUrl: text('invoice_url'),
  
  // معلومات إضافية
  paymentMethod: text('payment_method'),
  transactionId: text('transaction_id'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  
  tags: text('tags').array(),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// INVOICES (الفواتير)
// ============================================================================

export const vendorInvoices = pgTable('vendor_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // ربط بالمورد
  vendorId: uuid('vendor_id').references(() => techVendors.id).notNull(),
  
  // ربط بالكيان في نظام التوسع 7×7
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  
  invoiceNumber: text('invoice_number').notNull().unique(),
  
  // المبلغ
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum('currency').default('EGP'),
  
  // التواريخ
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  paidDate: date('paid_date'),
  
  // الحالة
  status: paymentStatusEnum('status').default('pending'),
  
  // المرفقات
  pdfUrl: text('pdf_url'),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// PAYMENTS (المدفوعات)
// ============================================================================

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // ربط بالفاتورة أو الاشتراك
  invoiceId: uuid('invoice_id').references(() => vendorInvoices.id),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  expenseId: uuid('expense_id').references(() => expenses.id),
  
  // ربط بالكيان في نظام التوسع 7×7
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  
  // المبلغ
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum('currency').default('USD'),
  
  // تفاصيل الدفع
  paymentDate: timestamp('payment_date').defaultNow(),
  paymentMethod: text('payment_method').notNull(),
  transactionId: text('transaction_id').unique(),
  
  // الحالة
  status: paymentStatusEnum('status').default('paid'),
  
  // معلومات البوابة
  gatewayResponse: jsonb('gateway_response'),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  processedBy: uuid('processed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// EXPENSE ALERTS (إنذارات المصروفات)
// ============================================================================

export const expenseAlerts = pgTable('expense_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // ربط بالكيان في نظام التوسع 7×7
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  
  // ربط بالاشتراك أو المصروف
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  expenseId: uuid('expense_id').references(() => expenses.id),
  
  type: text('type').notNull(), // 'usage_limit', 'renewal_reminder', 'price_increase', 'overdue', 'budget_exceeded'
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity').default('medium'), // 'low', 'medium', 'high', 'critical'
  
  isResolved: boolean('is_resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// EXPENSE BUDGETS (ميزانيات المصروفات)
// ============================================================================

export const expenseBudgets = pgTable('expense_budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // ربط بالكيان في نظام التوسع 7×7
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  
  // الفترة الزمنية
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  quarter: integer('quarter'), // 1, 2, 3, 4
  
  // الفئة
  category: subscriptionTypeEnum('category').notNull(),
  expenseType: expenseTypeEnum('expense_type'),
  
  // المبالغ
  allocatedAmount: decimal('allocated_amount', { precision: 15, scale: 2 }).notNull(),
  spentAmount: decimal('spent_amount', { precision: 15, scale: 2 }).default('0'),
  remainingAmount: decimal('remaining_amount', { precision: 15, scale: 2 }),
  currency: currencyEnum('currency').default('USD'),
  
  // النسب
  utilizationPercentage: decimal('utilization_percentage', { precision: 5, scale: 2 }),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// EXPENSE REPORTS (تقارير المصروفات)
// ============================================================================

export const expenseReports = pgTable('expense_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // ربط بالكيان في نظام التوسع 7×7
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  
  // الفترة الزمنية
  reportPeriod: text('report_period').notNull(), // '2025-01', '2025-Q1', '2025'
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  
  // الإحصائيات
  totalExpenses: decimal('total_expenses', { precision: 15, scale: 2 }).default('0'),
  totalPaid: decimal('total_paid', { precision: 15, scale: 2 }).default('0'),
  totalPending: decimal('total_pending', { precision: 15, scale: 2 }).default('0'),
  totalOverdue: decimal('total_overdue', { precision: 15, scale: 2 }).default('0'),
  
  // التفاصيل
  expensesByCategory: jsonb('expenses_by_category').default({}),
  expensesByType: jsonb('expenses_by_type').default({}),
  topExpenses: jsonb('top_expenses').default([]),
  
  // المقارنة
  comparisonWithPrevious: jsonb('comparison_with_previous').default({}),
  
  currency: currencyEnum('currency').default('USD'),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  generatedBy: uuid('generated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const techVendorsRelations = relations(techVendors, ({ many }) => ({
  invoices: many(vendorInvoices),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  vendor: one(techVendors, {
    fields: [subscriptions.vendorId],
    references: [techVendors.id],
  }),
  hierarchy: one(scalingHierarchy, {
    fields: [subscriptions.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  payments: many(payments),
  alerts: many(expenseAlerts),
  createdByUser: one(users, {
    fields: [subscriptions.createdBy],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  hierarchy: one(scalingHierarchy, {
    fields: [expenses.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  subscription: one(subscriptions, {
    fields: [expenses.subscriptionId],
    references: [subscriptions.id],
  }),
  payments: many(payments),
  alerts: many(expenseAlerts),
  approvedByUser: one(users, {
    fields: [expenses.approvedBy],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
}));

export const vendorInvoicesRelations = relations(vendorInvoices, ({ one, many }) => ({
  vendor: one(techVendors, {
    fields: [vendorInvoices.vendorId],
    references: [techVendors.id],
  }),
  hierarchy: one(scalingHierarchy, {
    fields: [vendorInvoices.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  payments: many(payments),
  createdByUser: one(users, {
    fields: [vendorInvoices.createdBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(vendorInvoices, {
    fields: [payments.invoiceId],
    references: [vendorInvoices.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  expense: one(expenses, {
    fields: [payments.expenseId],
    references: [expenses.id],
  }),
  hierarchy: one(scalingHierarchy, {
    fields: [payments.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  processedByUser: one(users, {
    fields: [payments.processedBy],
    references: [users.id],
  }),
}));

export const expenseAlertsRelations = relations(expenseAlerts, ({ one }) => ({
  hierarchy: one(scalingHierarchy, {
    fields: [expenseAlerts.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  subscription: one(subscriptions, {
    fields: [expenseAlerts.subscriptionId],
    references: [subscriptions.id],
  }),
  expense: one(expenses, {
    fields: [expenseAlerts.expenseId],
    references: [expenses.id],
  }),
  resolvedByUser: one(users, {
    fields: [expenseAlerts.resolvedBy],
    references: [users.id],
  }),
}));

export const expenseBudgetsRelations = relations(expenseBudgets, ({ one }) => ({
  hierarchy: one(scalingHierarchy, {
    fields: [expenseBudgets.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  createdByUser: one(users, {
    fields: [expenseBudgets.createdBy],
    references: [users.id],
  }),
}));

export const expenseReportsRelations = relations(expenseReports, ({ one }) => ({
  hierarchy: one(scalingHierarchy, {
    fields: [expenseReports.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  generatedByUser: one(users, {
    fields: [expenseReports.generatedBy],
    references: [users.id],
  }),
}));
