import {
  pgTable,
  serial,
  varchar,
  decimal,
  text,
  boolean,
  timestamp,
  json,
  integer,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Products - قائمة المنتجات من المصنع
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  modelCode: varchar('model_code', { length: 50 }).notNull().unique(),
  supplierPrice: decimal('supplier_price', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }),
  category: varchar('category', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Inventory - المخزون الحالي
export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  size: varchar('size', { length: 10 }),
  color: varchar('color', { length: 50 }),
  quantity: integer('quantity').notNull().default(0),
  minStockLevel: integer('min_stock_level').default(10),
  location: varchar('location', { length: 100 }),
  lastRestocked: timestamp('last_restocked'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Factory Batches - دفعات المصنع
export const factoryBatches = pgTable('factory_batches', {
  id: serial('id').primaryKey(),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  supplierPrice: decimal('supplier_price', { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }).notNull(),
  deliveryDate: timestamp('delivery_date'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Orders - الطلبات
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  phone1: varchar('phone1', { length: 20 }).notNull(),
  phone2: varchar('phone2', { length: 20 }),
  city: varchar('city', { length: 100 }).notNull(),
  address: text('address').notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  brand: varchar('brand', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Order Items - تفاصيل الطلبات
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  size: varchar('size', { length: 10 }),
  color: varchar('color', { length: 50 }),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
});

// Shipments - الشحنات
export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  shippingCompany: varchar('shipping_company', { length: 50 }).notNull(),
  waybillNumber: varchar('waybill_number', { length: 100 }),
  shippingDate: timestamp('shipping_date'),
  deliveryDate: timestamp('delivery_date'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Returns - المرتجعات
export const returns = pgTable('returns', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id')
    .notNull()
    .references(() => shipments.id),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  returnReason: varchar('return_reason', { length: 255 }).notNull(),
  returnDate: timestamp('return_date'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Replacements - الاستبدالات
export const replacements = pgTable('replacements', {
  id: serial('id').primaryKey(),
  originalOrderId: integer('original_order_id')
    .notNull()
    .references(() => orders.id),
  newOrderId: integer('new_order_id').references(() => orders.id),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Daily Sales Reports - التقرير اليومي
export const dailySalesReports = pgTable('daily_sales_reports', {
  id: serial('id').primaryKey(),
  reportDate: timestamp('report_date').notNull(),

  nowOrdersCount: integer('now_orders_count').default(0),
  nowPiecesCount: integer('now_pieces_count').default(0),
  nowRevenue: decimal('now_revenue', { precision: 10, scale: 2 }).default('0'),

  oneOrdersCount: integer('one_orders_count').default(0),
  onePiecesCount: integer('one_pieces_count').default(0),
  oneRevenue: decimal('one_revenue', { precision: 10, scale: 2 }).default('0'),

  factoryOrdersCount: integer('factory_orders_count').default(0),
  factoryPiecesCount: integer('factory_pieces_count').default(0),
  factoryRevenue: decimal('factory_revenue', { precision: 10, scale: 2 }).default('0'),

  externalOrdersCount: integer('external_orders_count').default(0),
  externalPiecesCount: integer('external_pieces_count').default(0),
  externalRevenue: decimal('external_revenue', { precision: 10, scale: 2 }).default('0'),

  websiteOrdersCount: integer('website_orders_count').default(0),
  websitePiecesCount: integer('website_pieces_count').default(0),
  websiteRevenue: decimal('website_revenue', { precision: 10, scale: 2 }).default('0'),

  totalOrdersCount: integer('total_orders_count').default(0),
  totalPiecesCount: integer('total_pieces_count').default(0),
  totalRevenue: decimal('total_revenue', { precision: 10, scale: 2 }).default('0'),

  shippedOrdersCount: integer('shipped_orders_count').default(0),
  shippedPiecesCount: integer('shipped_pieces_count').default(0),

  createdAt: timestamp('created_at').defaultNow(),
});

// Stock Alerts - تنبيهات المخزون
export const stockAlerts = pgTable('stock_alerts', {
  id: serial('id').primaryKey(),
  inventoryId: integer('inventory_id')
    .notNull()
    .references(() => inventory.id),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  message: text('message').notNull(),
  isResolved: boolean('is_resolved').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// Order Status History - تاريخ حالة الطلب
export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  oldStatus: varchar('old_status', { length: 50 }),
  newStatus: varchar('new_status', { length: 50 }).notNull(),
  changedBy: integer('changed_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Product Size Charts - مقاسات المنتجات
export const productSizeCharts = pgTable('product_size_charts', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  size: varchar('size', { length: 10 }).notNull(),
  lengthCm: decimal('length_cm', { precision: 5, scale: 2 }),
  widthCm: decimal('width_cm', { precision: 5, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// SHOPIFY INTEGRATION TABLES
// ============================================

// Shopify Products - ربط المنتجات مع Shopify
export const shopifyProducts = pgTable('shopify_products', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  shopifyProductId: varchar('shopify_product_id', { length: 50 }).notNull().unique(),
  nameAr: varchar('name_ar', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),
  images: json('images').$type<string[]>(),
  sizes: json('sizes').$type<string[]>(),
  colors: json('colors').$type<string[]>(),
  barcode: varchar('barcode', { length: 100 }),
  shopifyUrl: varchar('shopify_url', { length: 500 }),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
  syncStatus: varchar('sync_status', { length: 50 }).notNull().default('synced'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Shopify Variants - متغيرات المنتجات على Shopify
export const shopifyVariants = pgTable('shopify_variants', {
  id: serial('id').primaryKey(),
  shopifyProductTableId: integer('shopify_product_table_id')
    .notNull()
    .references(() => shopifyProducts.id),
  shopifyVariantId: varchar('shopify_variant_id', { length: 50 }).notNull().unique(),
  inventoryId: integer('inventory_id').references(() => inventory.id),
  sku: varchar('sku', { length: 100 }).notNull(),
  size: varchar('size', { length: 50 }),
  color: varchar('color', { length: 50 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  inventoryQuantity: integer('inventory_quantity').notNull().default(0),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Shopify Orders - الطلبات من Shopify
export const shopifyOrders = pgTable('shopify_orders', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  shopifyOrderId: varchar('shopify_order_id', { length: 50 }).notNull().unique(),
  shopifyOrderNumber: varchar('shopify_order_number', { length: 100 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('EGP'),
  financialStatus: varchar('financial_status', { length: 50 }),
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }),
  orderData: json('order_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
