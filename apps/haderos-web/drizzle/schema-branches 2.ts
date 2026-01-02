/**
 * Branches and Inventory Management Schema
 * For Mycelium Module - Resource Distribution
 */

import {
  pgTable,
  serial,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Branches Table
 */
export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(), // e.g., "BR001", "BR002"
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  type: varchar('type', { length: 50 }).notNull().default('retail'), // retail, warehouse, distribution_center
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, inactive, maintenance

  // Location
  address: text('address'),
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }),
  country: varchar('country', { length: 100 }).default('Egypt'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  // Capacity
  maxCapacity: integer('max_capacity').default(1000), // Maximum inventory items
  currentCapacity: integer('current_capacity').default(0),

  // Thresholds for Mycelium balancing
  optimalStock: integer('optimal_stock').default(500),
  thresholdLow: integer('threshold_low').default(200),
  thresholdHigh: integer('threshold_high').default(800),

  // Manager
  managerId: integer('manager_id'),
  managerName: text('manager_name'),
  managerPhone: varchar('manager_phone', { length: 20 }),
  managerEmail: varchar('manager_email', { length: 255 }),

  // Metadata
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Branch Inventory Table
 */
export const branchInventory = pgTable('branch_inventory', {
  id: serial('id').primaryKey(),
  branchId: integer('branch_id')
    .notNull()
    .references(() => branches.id),
  productId: integer('product_id').notNull(), // Reference to products table
  sku: varchar('sku', { length: 100 }).notNull(),

  // Stock levels
  quantity: integer('quantity').notNull().default(0),
  reserved: integer('reserved').notNull().default(0), // Reserved for orders
  available: integer('available').notNull().default(0), // quantity - reserved

  // Thresholds
  minStock: integer('min_stock').default(10),
  maxStock: integer('max_stock').default(100),
  reorderPoint: integer('reorder_point').default(20),

  // Costs
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }),

  // Location in branch
  location: varchar('location', { length: 100 }), // e.g., "Aisle 3, Shelf 2"

  // Metadata
  lastRestocked: timestamp('last_restocked'),
  lastSold: timestamp('last_sold'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Inventory Transfers Table (Mycelium Resource Flow)
 */
export const inventoryTransfers = pgTable('inventory_transfers', {
  id: serial('id').primaryKey(),
  transferNumber: varchar('transfer_number', { length: 50 }).notNull().unique(),

  // Source and destination
  fromBranchId: integer('from_branch_id')
    .notNull()
    .references(() => branches.id),
  toBranchId: integer('to_branch_id')
    .notNull()
    .references(() => branches.id),

  // Product details
  productId: integer('product_id').notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  quantity: integer('quantity').notNull(),

  // Transfer details
  reason: varchar('reason', { length: 100 }).notNull(), // balancing, restock, customer_request, emergency
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, in_transit, completed, cancelled
  priority: varchar('priority', { length: 50 }).default('normal'), // low, normal, high, urgent

  // Mycelium algorithm data
  triggeredBy: varchar('triggered_by', { length: 50 }).default('manual'), // manual, mycelium_auto, demand_forecast
  costEfficiency: decimal('cost_efficiency', { precision: 5, scale: 2 }), // 0-100
  balanceScore: decimal('balance_score', { precision: 5, scale: 2 }), // How much this improves balance

  // Logistics
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
  estimatedDuration: integer('estimated_duration'), // Hours
  shippingMethod: varchar('shipping_method', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),

  // Timestamps
  requestedAt: timestamp('requested_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),

  // Approval
  approvedBy: integer('approved_by'),
  rejectedReason: text('rejected_reason'),

  // Metadata
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Mycelium Balance History
 * Track how the network balances over time
 */
export const myceliumBalanceHistory = pgTable('mycelium_balance_history', {
  id: serial('id').primaryKey(),

  // Snapshot data
  timestamp: timestamp('timestamp').defaultNow(),
  totalBranches: integer('total_branches'),
  totalProducts: integer('total_products'),

  // Balance metrics
  overallBalanceScore: decimal('overall_balance_score', { precision: 5, scale: 2 }), // 0-100
  imbalancedBranches: integer('imbalanced_branches'),
  surplusBranches: integer('surplus_branches'),
  deficitBranches: integer('deficit_branches'),

  // Transfer statistics
  activeTransfers: integer('active_transfers'),
  completedTransfersToday: integer('completed_transfers_today'),
  avgTransferCost: decimal('avg_transfer_cost', { precision: 10, scale: 2 }),

  // Efficiency metrics
  networkEfficiency: decimal('network_efficiency', { precision: 5, scale: 2 }), // 0-100
  wasteReduction: decimal('waste_reduction', { precision: 5, scale: 2 }), // Percentage
  stockoutPrevention: decimal('stockout_prevention', { precision: 5, scale: 2 }), // Percentage

  // Metadata
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Branch Performance Metrics
 */
export const branchPerformance = pgTable('branch_performance', {
  id: serial('id').primaryKey(),
  branchId: integer('branch_id')
    .notNull()
    .references(() => branches.id),

  // Time period
  period: varchar('period', { length: 50 }).notNull(), // daily, weekly, monthly
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  // Sales metrics
  totalSales: decimal('total_sales', { precision: 12, scale: 2 }).default('0'),
  totalOrders: integer('total_orders').default(0),
  avgOrderValue: decimal('avg_order_value', { precision: 10, scale: 2 }),

  // Inventory metrics
  avgStockLevel: decimal('avg_stock_level', { precision: 10, scale: 2 }),
  stockoutEvents: integer('stockout_events').default(0),
  overstockEvents: integer('overstock_events').default(0),
  inventoryTurnover: decimal('inventory_turnover', { precision: 5, scale: 2 }),

  // Transfer metrics
  transfersReceived: integer('transfers_received').default(0),
  transfersSent: integer('transfers_sent').default(0),
  transferCost: decimal('transfer_cost', { precision: 10, scale: 2 }),

  // Balance score
  balanceScore: decimal('balance_score', { precision: 5, scale: 2 }), // 0-100

  // Metadata
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Export types
export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type BranchInventory = typeof branchInventory.$inferSelect;
export type NewBranchInventory = typeof branchInventory.$inferInsert;

export type InventoryTransfer = typeof inventoryTransfers.$inferSelect;
export type NewInventoryTransfer = typeof inventoryTransfers.$inferInsert;

export type MyceliumBalanceHistory = typeof myceliumBalanceHistory.$inferSelect;
export type NewMyceliumBalanceHistory = typeof myceliumBalanceHistory.$inferInsert;

export type BranchPerformance = typeof branchPerformance.$inferSelect;
export type NewBranchPerformance = typeof branchPerformance.$inferInsert;
