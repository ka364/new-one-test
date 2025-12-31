/**
 * Unified Expense Tracking Schema
 * 
 * Merges two systems:
 * 1. Individual Entity Expenses (linked to 7×7 scaling hierarchy)
 * 2. Department-level Expenses (functional departments)
 * 
 * This allows tracking at both levels:
 * - Individual: Each factory, merchant, marketer, etc. has their own expenses
 * - Department: The entire merchants department, marketers department, etc. has collective expenses
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

// Functional Departments (الأقسام الوظيفية)
export const departmentEnum = pgEnum('department', [
  'merchants',        // قسم التجار
  'marketing',        // قسم المسوقين
  'developers',       // قسم المطورين
  'operations',       // قسم العمليات
  'hr',               // قسم الموارد البشرية
  'finance',          // قسم المالية
  'sales',            // قسم المبيعات
  'customer_support', // قسم خدمة العملاء
  'other'             // أخرى
]);

// Expense Categories (الفئات)
export const expenseCategoryEnum = pgEnum('expense_category', [
  // Technical/Infrastructure
  'cloud_hosting',
  'ai_service',
  'communication',
  'software',
  'database',
  'cdn',
  'monitoring',
  'security',
  
  // Business Operations
  'inventory',
  'shipping',
  'payment_processing',
  'marketplace_fees',
  
  // Marketing
  'advertising',
  'social_media',
  'content_creation',
  'influencers',
  
  // Development
  'development_tools',
  'apis_services',
  'hosting',
  
  // Operations
  'office_supplies',
  'equipment',
  'maintenance',
  'utilities',
  
  // HR
  'salaries',
  'benefits',
  'training',
  'team_building',
  
  // General
  'other'
]);

// Expense Types (الأنواع)
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

// Payment Status (حالات الدفع)
export const paymentStatusEnum = pgEnum('payment_status', [
  'draft',
  'submitted',
  'pending',
  'approved',
  'rejected',
  'paid',
  'failed',
  'refunded',
  'cancelled',
  'overdue'
]);

// Currency (العملات)
export const currencyEnum = pgEnum('currency', [
  'EGP',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SAR'
]);

// ============================================================================
// VENDORS (الموردين)
// ============================================================================

export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: expenseCategoryEnum('category'),
  
  // Department association (optional - vendor can serve multiple departments)
  primaryDepartment: departmentEnum('primary_department'),
  
  contactPerson: text('contact_person'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  website: text('website'),
  
  // Contract details
  contractStart: date('contract_start'),
  contractEnd: date('contract_end'),
  autoRenew: boolean('auto_renew').default(true),
  
  // Payment details
  paymentMethod: text('payment_method'),
  paymentTerms: text('payment_terms'),
  billingCycle: text('billing_cycle'),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// DEPARTMENT BUDGETS (ميزانيات الأقسام)
// ============================================================================

export const departmentBudgets = pgTable('department_budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  department: departmentEnum('department').notNull(),
  
  // Time period
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  quarter: integer('quarter'),
  
  // Category
  category: expenseCategoryEnum('category').notNull(),
  
  // Budget amounts
  allocatedAmount: decimal('allocated_amount', { precision: 15, scale: 2 }).notNull(),
  spentAmount: decimal('spent_amount', { precision: 15, scale: 2 }).default('0'),
  remainingAmount: decimal('remaining_amount', { precision: 15, scale: 2 }),
  currency: currencyEnum('currency').default('EGP'),
  
  // Utilization
  utilizationPercentage: decimal('utilization_percentage', { precision: 5, scale: 2 }),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// UNIFIED EXPENSES (المصروفات الموحدة)
// Supports both individual entity and department-level tracking
// ============================================================================

export const unifiedExpenses = pgTable('unified_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Level 1: Individual Entity (from 7×7 scaling system)
  // Links to specific factory, merchant, marketer, etc.
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  
  // Level 2: Department (functional department)
  // Links to merchants department, marketing department, etc.
  department: departmentEnum('department'),
  
  // Note: An expense can be at entity level, department level, or both
  
  // Basic expense info
  title: text('title').notNull(),
  description: text('description'),
  
  // Classification
  expenseType: expenseTypeEnum('expense_type').notNull(),
  category: expenseCategoryEnum('category').notNull(),
  
  // Amount
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum('currency').default('EGP'),
  
  // Vendor
  vendorId: uuid('vendor_id').references(() => vendors.id),
  
  // Dates
  expenseDate: date('expense_date').notNull(),
  dueDate: date('due_date'),
  paidDate: date('paid_date'),
  
  // Status and approval
  status: paymentStatusEnum('status').default('draft'),
  submittedBy: uuid('submitted_by').references(() => users.id),
  submittedAt: timestamp('submitted_at'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectedBy: uuid('rejected_by').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  rejectedReason: text('rejected_reason'),
  
  // Payment details
  paymentMethod: text('payment_method'),
  transactionId: text('transaction_id'),
  
  // Documents
  invoiceNumber: text('invoice_number'),
  receiptUrl: text('receipt_url'),
  invoiceUrl: text('invoice_url'),
  
  // Additional info
  tags: text('tags').array(),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// SUBSCRIPTIONS (الاشتراكات)
// ============================================================================

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Can be linked to entity or department
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  department: departmentEnum('department'),
  
  vendorId: uuid('vendor_id').references(() => vendors.id),
  
  name: text('name').notNull(),
  description: text('description'),
  category: expenseCategoryEnum('category').notNull(),
  
  // Costs
  monthlyCost: decimal('monthly_cost', { precision: 15, scale: 2 }).notNull(),
  annualCost: decimal('annual_cost', { precision: 15, scale: 2 }),
  currency: currencyEnum('currency').default('USD'),
  
  // Dates
  startDate: date('start_date').notNull(),
  renewalDate: date('renewal_date').notNull(),
  nextBillingDate: date('next_billing_date'),
  
  // Status
  isActive: boolean('is_active').default(true),
  isAutoRenew: boolean('is_auto_renew').default(true),
  
  // Usage tracking
  usageLimit: jsonb('usage_limit').default({}),
  currentUsage: jsonb('current_usage').default({}),
  alertThreshold: integer('alert_threshold').default(80),
  
  tags: text('tags').array(),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// EXPENSE REQUESTS (طلبات المصروفات)
// ============================================================================

export const expenseRequests = pgTable('expense_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Can be for entity or department
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  department: departmentEnum('department'),
  
  requestedBy: uuid('requested_by').references(() => users.id).notNull(),
  
  title: text('title').notNull(),
  description: text('description'),
  justification: text('justification'),
  
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum('currency').default('EGP'),
  
  expenseType: expenseTypeEnum('expense_type').notNull(),
  category: expenseCategoryEnum('category').notNull(),
  
  expectedDate: date('expected_date'),
  attachments: jsonb('attachments').default([]),
  
  status: paymentStatusEnum('status').default('draft'),
  
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectedBy: uuid('rejected_by').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  rejectedReason: text('rejected_reason'),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// INVOICES (الفواتير)
// ============================================================================

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  
  // Can be for entity or department
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  department: departmentEnum('department'),
  
  invoiceNumber: text('invoice_number').notNull().unique(),
  
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum('currency').default('EGP'),
  
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  paidDate: date('paid_date'),
  
  status: paymentStatusEnum('status').default('pending'),
  
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
  
  // Links
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  expenseId: uuid('expense_id').references(() => unifiedExpenses.id),
  
  // Can be for entity or department
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  department: departmentEnum('department'),
  
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum('currency').default('USD'),
  
  paymentDate: timestamp('payment_date').defaultNow(),
  paymentMethod: text('payment_method').notNull(),
  transactionId: text('transaction_id').unique(),
  
  status: paymentStatusEnum('status').default('paid'),
  
  gatewayResponse: jsonb('gateway_response'),
  
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  
  processedBy: uuid('processed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// ALERTS (الإنذارات)
// ============================================================================

export const expenseAlerts = pgTable('expense_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Can be for entity or department
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  department: departmentEnum('department'),
  
  // Related items
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  expenseId: uuid('expense_id').references(() => unifiedExpenses.id),
  budgetId: uuid('budget_id').references(() => departmentBudgets.id),
  
  alertType: text('alert_type').notNull(), // 'budget_exceeded', 'renewal_reminder', 'approval_needed', 'unusual_spending', 'overdue'
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
// REPORTS (التقارير)
// ============================================================================

export const expenseReports = pgTable('expense_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Can be for entity, department, or system-wide
  hierarchyId: uuid('hierarchy_id').references(() => scalingHierarchy.id),
  department: departmentEnum('department'),
  
  reportType: text('report_type').notNull(), // 'monthly', 'quarterly', 'annual', 'category_analysis', 'department_comparison'
  reportPeriod: text('report_period').notNull(), // '2025-01', '2025-Q1', '2025'
  
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  
  // Statistics
  totalExpenses: decimal('total_expenses', { precision: 15, scale: 2 }).default('0'),
  totalPaid: decimal('total_paid', { precision: 15, scale: 2 }).default('0'),
  totalPending: decimal('total_pending', { precision: 15, scale: 2 }).default('0'),
  totalOverdue: decimal('total_overdue', { precision: 15, scale: 2 }).default('0'),
  
  // Detailed data
  expensesByCategory: jsonb('expenses_by_category').default({}),
  expensesByType: jsonb('expenses_by_type').default({}),
  expensesByDepartment: jsonb('expenses_by_department').default({}),
  topExpenses: jsonb('top_expenses').default([]),
  
  // Comparison
  comparisonWithPrevious: jsonb('comparison_with_previous').default({}),
  
  insights: text('insights'),
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

export const vendorsRelations = relations(vendors, ({ many }) => ({
  expenses: many(unifiedExpenses),
  subscriptions: many(subscriptions),
  invoices: many(invoices),
}));

export const departmentBudgetsRelations = relations(departmentBudgets, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [departmentBudgets.createdBy],
    references: [users.id],
  }),
  alerts: many(expenseAlerts),
}));

export const unifiedExpensesRelations = relations(unifiedExpenses, ({ one, many }) => ({
  hierarchy: one(scalingHierarchy, {
    fields: [unifiedExpenses.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  vendor: one(vendors, {
    fields: [unifiedExpenses.vendorId],
    references: [vendors.id],
  }),
  submittedByUser: one(users, {
    fields: [unifiedExpenses.submittedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [unifiedExpenses.approvedBy],
    references: [users.id],
  }),
  rejectedByUser: one(users, {
    fields: [unifiedExpenses.rejectedBy],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [unifiedExpenses.createdBy],
    references: [users.id],
  }),
  payments: many(payments),
  alerts: many(expenseAlerts),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  hierarchy: one(scalingHierarchy, {
    fields: [subscriptions.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  vendor: one(vendors, {
    fields: [subscriptions.vendorId],
    references: [vendors.id],
  }),
  createdByUser: one(users, {
    fields: [subscriptions.createdBy],
    references: [users.id],
  }),
  payments: many(payments),
  alerts: many(expenseAlerts),
}));

export const expenseRequestsRelations = relations(expenseRequests, ({ one }) => ({
  hierarchy: one(scalingHierarchy, {
    fields: [expenseRequests.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  requestedByUser: one(users, {
    fields: [expenseRequests.requestedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [expenseRequests.approvedBy],
    references: [users.id],
  }),
  rejectedByUser: one(users, {
    fields: [expenseRequests.rejectedBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [invoices.vendorId],
    references: [vendors.id],
  }),
  hierarchy: one(scalingHierarchy, {
    fields: [invoices.hierarchyId],
    references: [scalingHierarchy.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  expense: one(unifiedExpenses, {
    fields: [payments.expenseId],
    references: [unifiedExpenses.id],
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
  expense: one(unifiedExpenses, {
    fields: [expenseAlerts.expenseId],
    references: [unifiedExpenses.id],
  }),
  budget: one(departmentBudgets, {
    fields: [expenseAlerts.budgetId],
    references: [departmentBudgets.id],
  }),
  resolvedByUser: one(users, {
    fields: [expenseAlerts.resolvedBy],
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
