import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
} from 'drizzle-orm/mysql-core';

// ============================================
// NOW SHOES - Financial Management Schema
// ============================================

// ==================== EMPLOYEES ====================

export const employees = mysqlTable(
  'employees',
  {
    id: int('id').primaryKey().autoincrement(),

    // Basic Info
    employeeNumber: varchar('employee_number', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    nationalId: varchar('national_id', { length: 20 }),

    // Employment Details
    department: mysqlEnum('department', [
      'sales',
      'home_based',
      'factory',
      'management',
      'logistics',
    ]).notNull(),
    position: varchar('position', { length: 100 }),
    hireDate: timestamp('hire_date').notNull(),

    // Salary
    baseSalary: decimal('base_salary', { precision: 10, scale: 2 }).notNull(),
    allowances: decimal('allowances', { precision: 8, scale: 2 }).default('0.00'),

    // Commission (for sales team)
    commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }), // percentage
    commissionType: mysqlEnum('commission_type', ['per_order', 'percentage', 'tiered']),

    // Status
    status: mysqlEnum('status', ['active', 'on_leave', 'suspended', 'terminated']).default(
      'active'
    ),

    // Bank Details
    bankName: varchar('bank_name', { length: 100 }),
    bankAccount: varchar('bank_account', { length: 50 }),

    // Insurance
    insuranceNumber: varchar('insurance_number', { length: 50 }),
    insuranceAmount: decimal('insurance_amount', { precision: 8, scale: 2 }),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    employeeNumberIdx: index('employee_number_idx').on(table.employeeNumber),
    departmentIdx: index('department_idx').on(table.department),
    statusIdx: index('status_idx').on(table.status),
  })
);

// ==================== PAYROLL ====================

export const payroll = mysqlTable(
  'payroll',
  {
    id: int('id').primaryKey().autoincrement(),

    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),

    // Period
    month: varchar('month', { length: 7 }).notNull(), // YYYY-MM
    payPeriodStart: timestamp('pay_period_start').notNull(),
    payPeriodEnd: timestamp('pay_period_end').notNull(),

    // Earnings
    baseSalary: decimal('base_salary', { precision: 10, scale: 2 }).notNull(),
    allowances: decimal('allowances', { precision: 8, scale: 2 }).default('0.00'),
    commission: decimal('commission', { precision: 10, scale: 2 }).default('0.00'),
    bonus: decimal('bonus', { precision: 8, scale: 2 }).default('0.00'),
    overtime: decimal('overtime', { precision: 8, scale: 2 }).default('0.00'),

    // Deductions
    absences: decimal('absences', { precision: 8, scale: 2 }).default('0.00'),
    advances: decimal('advances', { precision: 8, scale: 2 }).default('0.00'),
    insurance: decimal('insurance', { precision: 8, scale: 2 }).default('0.00'),
    penalties: decimal('penalties', { precision: 8, scale: 2 }).default('0.00'),

    // Totals
    grossPay: decimal('gross_pay', { precision: 10, scale: 2 }).notNull(),
    totalDeductions: decimal('total_deductions', { precision: 10, scale: 2 }).notNull(),
    netPay: decimal('net_pay', { precision: 10, scale: 2 }).notNull(),

    // Payment
    paymentStatus: mysqlEnum('payment_status', ['pending', 'paid', 'cancelled']).default('pending'),
    paymentDate: timestamp('payment_date'),
    paymentMethod: mysqlEnum('payment_method', ['cash', 'bank_transfer', 'check']),
    paymentReference: varchar('payment_reference', { length: 255 }),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    employeeIdx: index('employee_idx').on(table.employeeId),
    monthIdx: index('month_idx').on(table.month),
    statusIdx: index('status_idx').on(table.paymentStatus),
  })
);

// ==================== ATTENDANCE ====================

export const attendance = mysqlTable(
  'attendance',
  {
    id: int('id').primaryKey().autoincrement(),

    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),

    date: timestamp('date').notNull(),

    status: mysqlEnum('status', [
      'present',
      'absent',
      'late',
      'half_day',
      'leave',
      'holiday',
    ]).notNull(),

    checkIn: timestamp('check_in'),
    checkOut: timestamp('check_out'),

    hoursWorked: decimal('hours_worked', { precision: 5, scale: 2 }),
    overtimeHours: decimal('overtime_hours', { precision: 5, scale: 2 }).default('0.00'),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    employeeIdx: index('employee_idx').on(table.employeeId),
    dateIdx: index('date_idx').on(table.date),
    statusIdx: index('status_idx').on(table.status),
  })
);

// ==================== ADVERTISING EXPENSES ====================

export const advertisingExpenses = mysqlTable(
  'advertising_expenses',
  {
    id: int('id').primaryKey().autoincrement(),

    // Campaign Details
    platform: mysqlEnum('platform', [
      'facebook',
      'instagram',
      'google',
      'tiktok',
      'snapchat',
      'other',
    ]).notNull(),
    campaignName: varchar('campaign_name', { length: 255 }).notNull(),
    campaignId: varchar('campaign_id', { length: 255 }),

    // Date
    date: timestamp('date').notNull(),

    // Spending
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('EGP'),

    // Performance Metrics
    impressions: int('impressions'),
    clicks: int('clicks'),
    conversions: int('conversions'),
    revenue: decimal('revenue', { precision: 10, scale: 2 }),

    // Calculated Metrics
    cpc: decimal('cpc', { precision: 8, scale: 4 }), // Cost per click
    cpm: decimal('cpm', { precision: 8, scale: 4 }), // Cost per mille (1000 impressions)
    cpa: decimal('cpa', { precision: 10, scale: 2 }), // Cost per acquisition
    roas: decimal('roas', { precision: 8, scale: 2 }), // Return on ad spend

    // Status
    status: mysqlEnum('status', ['active', 'paused', 'completed']).default('active'),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    platformIdx: index('platform_idx').on(table.platform),
    dateIdx: index('date_idx').on(table.date),
    campaignIdx: index('campaign_idx').on(table.campaignId),
  })
);

// ==================== SUBSCRIPTIONS ====================

export const subscriptions = mysqlTable(
  'subscriptions',
  {
    id: int('id').primaryKey().autoincrement(),

    // Service Details
    serviceName: varchar('service_name', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    category: mysqlEnum('category', [
      'software',
      'shipping',
      'marketing',
      'hosting',
      'communication',
      'other',
    ]).notNull(),

    // Subscription Details
    plan: varchar('plan', { length: 100 }),
    billingCycle: mysqlEnum('billing_cycle', [
      'monthly',
      'quarterly',
      'annually',
      'per_transaction',
    ]).notNull(),

    // Cost
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('EGP'),

    // Dates
    startDate: timestamp('start_date').notNull(),
    renewalDate: timestamp('renewal_date'),
    endDate: timestamp('end_date'),

    // Status
    status: mysqlEnum('status', ['active', 'cancelled', 'expired', 'trial']).default('active'),
    autoRenewal: boolean('auto_renewal').default(true),

    // Payment
    paymentMethod: varchar('payment_method', { length: 100 }),
    lastPaymentDate: timestamp('last_payment_date'),
    nextPaymentDate: timestamp('next_payment_date'),

    // Account Details
    accountEmail: varchar('account_email', { length: 255 }),
    accountId: varchar('account_id', { length: 255 }),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    providerIdx: index('provider_idx').on(table.provider),
    categoryIdx: index('category_idx').on(table.category),
    statusIdx: index('status_idx').on(table.status),
    renewalIdx: index('renewal_idx').on(table.renewalDate),
  })
);

// ==================== FACTORY SUPPLY ORDERS ====================

export const factorySupplyOrders = mysqlTable(
  'factory_supply_orders',
  {
    id: int('id').primaryKey().autoincrement(),

    orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),

    // Supplier (Factory)
    supplierName: varchar('supplier_name', { length: 255 }).notNull(),
    supplierContact: varchar('supplier_contact', { length: 20 }),

    // Order Details
    items: json('items')
      .$type<
        Array<{
          modelCode: string;
          quantity: number;
          unitCost: number;
          total: number;
        }>
      >()
      .notNull(),

    // Pricing
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
    shippingCost: decimal('shipping_cost', { precision: 8, scale: 2 }).default('0.00'),
    totalCost: decimal('total_cost', { precision: 12, scale: 2 }).notNull(),

    // Delivery
    expectedDeliveryDate: timestamp('expected_delivery_date'),
    actualDeliveryDate: timestamp('actual_delivery_date'),

    // Status
    status: mysqlEnum('status', [
      'pending',
      'confirmed',
      'in_production',
      'shipped',
      'delivered',
      'cancelled',
    ]).default('pending'),

    // Payment
    paymentStatus: mysqlEnum('payment_status', ['pending', 'partial', 'paid']).default('pending'),
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0.00'),

    // Quality Control
    inspectionStatus: mysqlEnum('inspection_status', ['pending', 'passed', 'failed', 'partial']),
    inspectionNotes: text('inspection_notes'),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    orderNumberIdx: index('order_number_idx').on(table.orderNumber),
    statusIdx: index('status_idx').on(table.status),
    deliveryIdx: index('delivery_idx').on(table.expectedDeliveryDate),
  })
);

// ==================== OPERATIONAL EXPENSES ====================

export const operationalExpenses = mysqlTable(
  'operational_expenses',
  {
    id: int('id').primaryKey().autoincrement(),

    // Expense Details
    category: mysqlEnum('category', [
      'rent',
      'utilities',
      'maintenance',
      'supplies',
      'transportation',
      'packaging',
      'miscellaneous',
    ]).notNull(),

    description: varchar('description', { length: 500 }).notNull(),

    // Amount
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('EGP'),

    // Date
    expenseDate: timestamp('expense_date').notNull(),

    // Payment
    paymentMethod: mysqlEnum('payment_method', ['cash', 'bank_transfer', 'credit_card', 'check']),
    paymentReference: varchar('payment_reference', { length: 255 }),

    // Approval
    approvedBy: int('approved_by'), // user ID
    approvalDate: timestamp('approval_date'),

    // Receipt
    receiptUrl: text('receipt_url'), // S3 URL

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    categoryIdx: index('category_idx').on(table.category),
    dateIdx: index('date_idx').on(table.expenseDate),
  })
);

// ==================== FINANCIAL SUMMARY ====================

export const financialSummary = mysqlTable(
  'financial_summary',
  {
    id: int('id').primaryKey().autoincrement(),

    // Period
    period: varchar('period', { length: 7 }).notNull(), // YYYY-MM
    periodType: mysqlEnum('period_type', [
      'daily',
      'weekly',
      'monthly',
      'quarterly',
      'yearly',
    ]).default('monthly'),

    // Revenue
    totalRevenue: decimal('total_revenue', { precision: 15, scale: 2 }).notNull(),
    b2cRevenue: decimal('b2c_revenue', { precision: 15, scale: 2 }).default('0.00'),
    b2bRevenue: decimal('b2b_revenue', { precision: 15, scale: 2 }).default('0.00'),

    // Cost of Goods Sold
    cogs: decimal('cogs', { precision: 15, scale: 2 }).notNull(),

    // Gross Profit
    grossProfit: decimal('gross_profit', { precision: 15, scale: 2 }).notNull(),
    grossMargin: decimal('gross_margin', { precision: 5, scale: 2 }), // percentage

    // Operating Expenses
    employeeExpenses: decimal('employee_expenses', { precision: 12, scale: 2 }).default('0.00'),
    advertisingExpenses: decimal('advertising_expenses', { precision: 12, scale: 2 }).default(
      '0.00'
    ),
    subscriptionExpenses: decimal('subscription_expenses', { precision: 10, scale: 2 }).default(
      '0.00'
    ),
    shippingExpenses: decimal('shipping_expenses', { precision: 10, scale: 2 }).default('0.00'),
    operationalExpenses: decimal('operational_expenses', { precision: 10, scale: 2 }).default(
      '0.00'
    ),

    totalExpenses: decimal('total_expenses', { precision: 15, scale: 2 }).notNull(),

    // Net Profit
    netProfit: decimal('net_profit', { precision: 15, scale: 2 }).notNull(),
    netMargin: decimal('net_margin', { precision: 5, scale: 2 }), // percentage

    // Cash Flow
    cashInflow: decimal('cash_inflow', { precision: 15, scale: 2 }).notNull(),
    cashOutflow: decimal('cash_outflow', { precision: 15, scale: 2 }).notNull(),
    netCashFlow: decimal('net_cash_flow', { precision: 15, scale: 2 }).notNull(),

    // Metrics
    totalOrders: int('total_orders').default(0),
    averageOrderValue: decimal('average_order_value', { precision: 10, scale: 2 }),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    periodIdx: index('period_idx').on(table.period),
    periodTypeIdx: index('period_type_idx').on(table.periodType),
  })
);
