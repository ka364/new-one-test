/**
 * Shopify Integration Schema
 * Tables for syncing products, orders, and inventory with Shopify
 */

import { mysqlTable, varchar, text, int, decimal, datetime, json, index } from "drizzle-orm/mysql-core";

/**
 * Shopify Products Sync
 * Maps HaderOS products to Shopify products
 */
export const shopifyProducts = mysqlTable(
  "shopify_products",
  {
    id: int("id").primaryKey().autoincrement(),
    // HaderOS product reference
    localProductId: int("local_product_id").notNull(),
    // Shopify IDs
    shopifyProductId: varchar("shopify_product_id", { length: 255 }).notNull().unique(),
    shopifyVariantId: varchar("shopify_variant_id", { length: 255 }),
    shopifyInventoryItemId: varchar("shopify_inventory_item_id", { length: 255 }),
    // Product details
    title: varchar("title", { length: 500 }).notNull(),
    handle: varchar("handle", { length: 255 }),
    sku: varchar("sku", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    // Pricing
    price: decimal("price", { precision: 10, scale: 2 }),
    compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
    // Inventory
    inventoryQuantity: int("inventory_quantity").default(0),
    // Status
    status: varchar("status", { length: 50 }).default("active"), // active, draft, archived
    // Sync metadata
    lastSyncedAt: datetime("last_synced_at"),
    syncStatus: varchar("sync_status", { length: 50 }).default("pending"), // pending, synced, error
    syncError: text("sync_error"),
    // Timestamps
    createdAt: datetime("created_at").notNull().defaultNow(),
    updatedAt: datetime("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    localProductIdx: index("local_product_idx").on(table.localProductId),
    shopifyProductIdx: index("shopify_product_idx").on(table.shopifyProductId),
    skuIdx: index("sku_idx").on(table.sku),
    syncStatusIdx: index("sync_status_idx").on(table.syncStatus),
  })
);

/**
 * Shopify Orders
 * Orders received from Shopify store
 */
export const shopifyOrders = mysqlTable(
  "shopify_orders",
  {
    id: int("id").primaryKey().autoincrement(),
    // Shopify order details
    shopifyOrderId: varchar("shopify_order_id", { length: 255 }).notNull().unique(),
    orderNumber: varchar("order_number", { length: 100 }).notNull(),
    orderName: varchar("order_name", { length: 100 }), // e.g., #1001
    // Customer info
    customerEmail: varchar("customer_email", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 50 }),
    customerFirstName: varchar("customer_first_name", { length: 255 }),
    customerLastName: varchar("customer_last_name", { length: 255 }),
    // Shipping address
    shippingAddress: json("shipping_address").$type<{
      firstName?: string;
      lastName?: string;
      address1?: string;
      address2?: string;
      city?: string;
      province?: string;
      country?: string;
      zip?: string;
      phone?: string;
    }>(),
    // Order totals
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    subtotalPrice: decimal("subtotal_price", { precision: 10, scale: 2 }),
    totalShipping: decimal("total_shipping", { precision: 10, scale: 2 }),
    currencyCode: varchar("currency_code", { length: 10 }).default("EGP"),
    // Order items
    lineItems: json("line_items").$type<
      Array<{
        id: string;
        title: string;
        quantity: number;
        sku?: string;
        price: string;
        variantId?: string;
      }>
    >(),
    // Status
    financialStatus: varchar("financial_status", { length: 50 }), // pending, paid, refunded
    fulfillmentStatus: varchar("fulfillment_status", { length: 50 }), // unfulfilled, partial, fulfilled
    // Local order reference (after processing)
    localOrderId: int("local_order_id"),
    // Shipping integration
    shippingCompany: varchar("shipping_company", { length: 50 }), // bosta, jnt, gt, eshhnly
    trackingNumber: varchar("tracking_number", { length: 255 }),
    // Timestamps
    shopifyCreatedAt: datetime("shopify_created_at"),
    shopifyUpdatedAt: datetime("shopify_updated_at"),
    processedAt: datetime("processed_at"),
    createdAt: datetime("created_at").notNull().defaultNow(),
    updatedAt: datetime("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    shopifyOrderIdx: index("shopify_order_idx").on(table.shopifyOrderId),
    orderNumberIdx: index("order_number_idx").on(table.orderNumber),
    customerEmailIdx: index("customer_email_idx").on(table.customerEmail),
    financialStatusIdx: index("financial_status_idx").on(table.financialStatus),
    fulfillmentStatusIdx: index("fulfillment_status_idx").on(table.fulfillmentStatus),
    localOrderIdx: index("local_order_idx").on(table.localOrderId),
  })
);

/**
 * Shopify Sync Logs
 * Track all sync operations for debugging
 */
export const shopifySyncLogs = mysqlTable(
  "shopify_sync_logs",
  {
    id: int("id").primaryKey().autoincrement(),
    // Sync details
    syncType: varchar("sync_type", { length: 50 }).notNull(), // product_sync, order_sync, inventory_sync, webhook
    operation: varchar("operation", { length: 50 }).notNull(), // create, update, delete, fetch
    entityType: varchar("entity_type", { length: 50 }), // product, order, inventory
    entityId: varchar("entity_id", { length: 255 }),
    // Status
    status: varchar("status", { length: 50 }).notNull(), // success, error, pending
    errorMessage: text("error_message"),
    // Request/Response data
    requestData: json("request_data"),
    responseData: json("response_data"),
    // Metrics
    duration: int("duration"), // milliseconds
    // Timestamps
    createdAt: datetime("created_at").notNull().defaultNow(),
  },
  (table) => ({
    syncTypeIdx: index("sync_type_idx").on(table.syncType),
    statusIdx: index("status_idx").on(table.status),
    entityTypeIdx: index("entity_type_idx").on(table.entityType),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);

/**
 * Shopify Webhooks
 * Track webhook events received from Shopify
 */
export const shopifyWebhooks = mysqlTable(
  "shopify_webhooks",
  {
    id: int("id").primaryKey().autoincrement(),
    // Webhook details
    topic: varchar("topic", { length: 100 }).notNull(), // orders/create, orders/updated, etc.
    shopifyWebhookId: varchar("shopify_webhook_id", { length: 255 }),
    // Payload
    payload: json("payload").notNull(),
    // Processing
    processed: int("processed").default(0), // 0 = pending, 1 = processed
    processedAt: datetime("processed_at"),
    processingError: text("processing_error"),
    // Timestamps
    receivedAt: datetime("received_at").notNull().defaultNow(),
  },
  (table) => ({
    topicIdx: index("topic_idx").on(table.topic),
    processedIdx: index("processed_idx").on(table.processed),
    receivedAtIdx: index("received_at_idx").on(table.receivedAt),
  })
);

// Export types
export type ShopifyProduct = typeof shopifyProducts.$inferSelect;
export type NewShopifyProduct = typeof shopifyProducts.$inferInsert;
export type ShopifyOrder = typeof shopifyOrders.$inferSelect;
export type NewShopifyOrder = typeof shopifyOrders.$inferInsert;
export type ShopifySyncLog = typeof shopifySyncLogs.$inferSelect;
export type NewShopifySyncLog = typeof shopifySyncLogs.$inferInsert;
export type ShopifyWebhook = typeof shopifyWebhooks.$inferSelect;
export type NewShopifyWebhook = typeof shopifyWebhooks.$inferInsert;
