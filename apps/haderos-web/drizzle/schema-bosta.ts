import {
  mysqlTable,
  int,
  varchar,
  decimal,
  boolean,
  datetime,
  text,
  json,
} from 'drizzle-orm/mysql-core';

/**
 * Bosta Integration Schema
 *
 * Tables for managing Bosta shipping integration:
 * - bostaConfig: Bosta API configuration
 * - bostaShipments: Shipment tracking and details
 * - bostaWebhookLogs: Webhook event logs
 * - bostaCodReconciliation: COD collection tracking
 */

// Bosta API Configuration
export const bostaConfig = mysqlTable('bosta_config', {
  id: int('id').primaryKey().autoincrement(),
  apiKey: text('api_key').notNull(),
  apiVersion: varchar('api_version', { length: 50 }).default('v2'),
  isActive: boolean('is_active').default(true),
  businessId: varchar('business_id', { length: 255 }),
  pickupLocationId: varchar('pickup_location_id', { length: 255 }),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

// Bosta Shipments
export const bostaShipments = mysqlTable('bosta_shipments', {
  id: int('id').primaryKey().autoincrement(),

  // Link to local order (if exists)
  orderId: int('order_id'),

  // Bosta API Response Data
  trackingNumber: varchar('tracking_number', { length: 255 }).unique(),
  bostaDeliveryId: varchar('bosta_delivery_id', { length: 255 }),

  // Shipment Status
  status: varchar('status', { length: 50 }).notNull(), // pending, picked_up, in_transit, delivered, failed, cancelled

  // Package Details
  packageType: varchar('package_type', { length: 50 }), // Parcel, Document, Light Bulky, Heavy Bulky
  size: varchar('size', { length: 50 }), // SMALL, MEDIUM, LARGE
  itemsCount: int('items_count'),
  description: text('description'),

  // Customer Details
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerEmail: varchar('customer_email', { length: 255 }),

  // Shipping Address
  shippingAddress: text('shipping_address'),
  city: varchar('city', { length: 100 }),
  zone: varchar('zone', { length: 100 }),
  district: varchar('district', { length: 100 }),

  // COD (Cash on Delivery)
  codAmount: decimal('cod_amount', { precision: 10, scale: 2 }).default('0'),
  codCollected: boolean('cod_collected').default(false),
  codCollectionDate: datetime('cod_collection_date'),

  // Tracking Timeline
  pickupDate: datetime('pickup_date'),
  deliveryDate: datetime('delivery_date'),
  estimatedDeliveryDate: datetime('estimated_delivery_date'),

  // Failure/Return Info
  failureReason: text('failure_reason'),
  returnToSender: boolean('return_to_sender').default(false),
  returnDate: datetime('return_date'),

  // Waybill
  waybillUrl: text('waybill_url'),

  // Notes
  notes: text('notes'),
  allowToOpenPackage: boolean('allow_to_open_package').default(false),

  // Timestamps
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

// Bosta Webhook Logs
export const bostaWebhookLogs = mysqlTable('bosta_webhook_logs', {
  id: int('id').primaryKey().autoincrement(),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  event: varchar('event', { length: 100 }), // delivery.created, delivery.picked_up, delivery.delivered, etc.
  payload: json('payload'),
  processed: boolean('processed').default(false),
  error: text('error'),
  createdAt: datetime('created_at').notNull(),
});

// COD Reconciliation
export const bostaCodReconciliation = mysqlTable('bosta_cod_reconciliation', {
  id: int('id').primaryKey().autoincrement(),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  codAmount: decimal('cod_amount', { precision: 10, scale: 2 }).notNull(),
  collectionDate: datetime('collection_date').notNull(),
  reconciliationDate: datetime('reconciliation_date'),
  reconciliationStatus: varchar('reconciliation_status', { length: 50 }), // pending, reconciled, disputed
  bankTransferDate: datetime('bank_transfer_date'),
  bankTransferAmount: decimal('bank_transfer_amount', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

// Bosta Pricing Cache (optional, for analytics)
export const bostaPricingCache = mysqlTable('bosta_pricing_cache', {
  id: int('id').primaryKey().autoincrement(),
  fromCity: varchar('from_city', { length: 100 }),
  toCity: varchar('to_city', { length: 100 }),
  packageType: varchar('package_type', { length: 50 }),
  size: varchar('size', { length: 50 }),
  price: decimal('price', { precision: 10, scale: 2 }),
  validUntil: datetime('valid_until'),
  createdAt: datetime('created_at').notNull(),
});

// Export types
export type BostaConfig = typeof bostaConfig.$inferSelect;
export type NewBostaConfig = typeof bostaConfig.$inferInsert;

export type BostaShipment = typeof bostaShipments.$inferSelect;
export type NewBostaShipment = typeof bostaShipments.$inferInsert;

export type BostaWebhookLog = typeof bostaWebhookLogs.$inferSelect;
export type NewBostaWebhookLog = typeof bostaWebhookLogs.$inferInsert;

export type BostaCodReconciliation = typeof bostaCodReconciliation.$inferSelect;
export type NewBostaCodReconciliation = typeof bostaCodReconciliation.$inferInsert;
