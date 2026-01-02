/**
 * Shopify Database Functions
 * All database operations for Shopify integration
 */

import { requireDb } from './db';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

// Note: Shopify tables are defined in drizzle/schema.ts
// We'll reference them through the schema imports

/**
 * Shopify Products Sync
 */

export async function createShopifyProductMapping(data: {
  localProductId: number;
  shopifyProductId: string;
  shopifyVariantId?: string;
  shopifyInventoryItemId?: string;
  title: string;
  handle?: string;
  sku?: string;
  barcode?: string;
  price?: number;
  compareAtPrice?: number;
  inventoryQuantity?: number;
  status?: string;
}) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(sql`
    INSERT INTO shopify_products (
      local_product_id, shopify_product_id, shopify_variant_id, 
      shopify_inventory_item_id, title, handle, sku, barcode,
      price, compare_at_price, inventory_quantity, status,
      last_synced_at, sync_status
    ) VALUES (
      ${data.localProductId}, ${data.shopifyProductId}, ${data.shopifyVariantId || null},
      ${data.shopifyInventoryItemId || null}, ${data.title}, ${data.handle || null},
      ${data.sku || null}, ${data.barcode || null}, ${data.price || null},
      ${data.compareAtPrice || null}, ${data.inventoryQuantity || 0}, ${data.status || 'active'},
      NOW(), 'synced'
    )
  `);

  return result;
}

export async function getShopifyProductByLocalId(localProductId: number) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(
    sql`SELECT * FROM shopify_products WHERE local_product_id = ${localProductId} LIMIT 1`
  );

  return result[0] || null;
}

export async function getShopifyProductByShopifyId(shopifyProductId: string) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(
    sql`SELECT * FROM shopify_products WHERE shopify_product_id = ${shopifyProductId} LIMIT 1`
  );

  return result[0] || null;
}

export async function updateShopifyProductSync(
  shopifyProductId: string,
  data: {
    inventoryQuantity?: number;
    price?: number;
    status?: string;
    syncStatus?: string;
    syncError?: string;
  }
) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const updates: string[] = [];
  const args: any[] = [];

  if (data.inventoryQuantity !== undefined) {
    updates.push('inventory_quantity = ?');
    args.push(data.inventoryQuantity);
  }
  if (data.price !== undefined) {
    updates.push('price = ?');
    args.push(data.price);
  }
  if (data.status) {
    updates.push('status = ?');
    args.push(data.status);
  }
  if (data.syncStatus) {
    updates.push('sync_status = ?');
    args.push(data.syncStatus);
  }
  if (data.syncError !== undefined) {
    updates.push('sync_error = ?');
    args.push(data.syncError);
  }

  updates.push('last_synced_at = NOW()');

  const updateQuery = `UPDATE shopify_products SET ${updates.join(', ')} WHERE shopify_product_id = '${shopifyProductId}'`;
  const result: any = await db.execute(sql.raw(updateQuery));

  return result;
}

export async function getAllShopifyProducts() {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(
    sql`SELECT * FROM shopify_products ORDER BY created_at DESC`
  );

  return result;
}

/**
 * Shopify Orders
 */

export async function createShopifyOrder(data: {
  shopifyOrderId: string;
  orderNumber: number; // Changed to number to match Shopify's integer
  orderName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerFirstName?: string;
  customerLastName?: string;
  shippingAddress?: any;
  totalPrice: number;
  subtotalPrice?: number;
  totalShipping?: number;
  currencyCode?: string;
  lineItems?: any;
  financialStatus?: string;
  fulfillmentStatus?: string;
  shopifyCreatedAt?: Date;
  shopifyUpdatedAt?: Date;
}) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const shippingAddressJson = data.shippingAddress ? JSON.stringify(data.shippingAddress) : null;
  const lineItemsJson = data.lineItems ? JSON.stringify(data.lineItems) : null;

  // Build customer data JSON
  const customerData = JSON.stringify({
    first_name: data.customerFirstName || null,
    last_name: data.customerLastName || null,
    email: data.customerEmail || null,
    phone: data.customerPhone || null,
  });

  const result: any = await db.execute(sql`
    INSERT INTO shopify_orders (
      shopify_order_id, order_number, order_name,
      email, phone, customer_data,
      shipping_address, total_price, subtotal_price, total_shipping, currency,
      line_items, financial_status, fulfillment_status,
      created_at, updated_at
    ) VALUES (
      ${data.shopifyOrderId}, ${data.orderNumber}, ${data.orderName || null},
      ${data.customerEmail || null}, ${data.customerPhone || null}, ${customerData},
      ${shippingAddressJson}, ${data.totalPrice}, ${data.subtotalPrice || null},
      ${data.totalShipping || null}, ${data.currencyCode || 'EGP'},
      ${lineItemsJson}, ${data.financialStatus || null}, ${data.fulfillmentStatus || null},
      NOW(), NOW()
    )
  `);

  return result;
}

export async function getShopifyOrderByShopifyId(shopifyOrderId: string) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(
    sql`SELECT * FROM shopify_orders WHERE shopify_order_id = ${shopifyOrderId} LIMIT 1`
  );

  return result[0] || null;
}

export async function updateShopifyOrder(
  shopifyOrderId: string,
  data: {
    financialStatus?: string;
    fulfillmentStatus?: string;
    localOrderId?: number;
    shippingCompany?: string;
    trackingNumber?: string;
    processedAt?: Date;
  }
) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const updates: string[] = [];
  const args: any[] = [];

  if (data.financialStatus) {
    updates.push('financial_status = ?');
    args.push(data.financialStatus);
  }
  if (data.fulfillmentStatus) {
    updates.push('fulfillment_status = ?');
    args.push(data.fulfillmentStatus);
  }
  if (data.localOrderId) {
    updates.push('local_order_id = ?');
    args.push(data.localOrderId);
  }
  if (data.shippingCompany) {
    updates.push('shipping_company = ?');
    args.push(data.shippingCompany);
  }
  if (data.trackingNumber) {
    updates.push('tracking_number = ?');
    args.push(data.trackingNumber);
  }
  if (data.processedAt) {
    updates.push('processed_at = ?');
    args.push(data.processedAt);
  }

  updates.push('updated_at = NOW()');

  const updateQuery = `UPDATE shopify_orders SET ${updates.join(', ')} WHERE shopify_order_id = '${shopifyOrderId}'`;
  const result: any = await db.execute(sql.raw(updateQuery));

  return result;
}

export async function getAllShopifyOrders(limit: number = 100) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(
    sql`SELECT * FROM shopify_orders ORDER BY created_at DESC LIMIT ${limit}`
  );

  return result;
}

export async function getUnprocessedShopifyOrders() {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(
    sql`SELECT * FROM shopify_orders WHERE processed_at IS NULL ORDER BY created_at ASC`
  );

  return result;
}

/**
 * Shopify Sync Logs
 */

export async function createSyncLog(data: {
  syncType: string;
  direction: string;
  status: string;
  itemsProcessed?: number;
  itemsSucceeded?: number;
  itemsFailed?: number;
  errorMessage?: string;
  errorDetails?: any;
  duration?: number;
}) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const errorDetailsJson = data.errorDetails ? JSON.stringify(data.errorDetails) : null;

  const result: any = await db.execute(sql`
    INSERT INTO shopify_sync_logs (
      sync_type, direction, status,
      items_processed, items_succeeded, items_failed,
      error_message, error_details, duration
    ) VALUES (
      ${data.syncType}, ${data.direction}, ${data.status},
      ${data.itemsProcessed || 0}, ${data.itemsSucceeded || 0}, ${data.itemsFailed || 0},
      ${data.errorMessage || null}, ${errorDetailsJson}, ${data.duration || null}
    )
  `);

  return result;
}

export async function getSyncLogs(limit: number = 50) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(
    sql`SELECT * FROM shopify_sync_logs ORDER BY created_at DESC LIMIT ${limit}`
  );

  return result;
}

/**
 * Shopify Webhooks
 */

export async function createWebhookLog(data: {
  topic: string;
  shopifyId?: string;
  payload: any;
  headers?: any;
}) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const payloadJson = JSON.stringify(data.payload);
  const headersJson = data.headers ? JSON.stringify(data.headers) : null;

  const result: any = await db.execute(sql`
    INSERT INTO shopify_webhook_logs (
      topic, shopify_id, payload, headers
    ) VALUES (
      ${data.topic}, ${data.shopifyId || null}, ${payloadJson}, ${headersJson}
    )
  `);

  return result;
}

export async function markWebhookProcessed(id: number, error?: string) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(sql`
    UPDATE shopify_webhook_logs 
    SET processed = true, processed_at = NOW(), error = ${error || null}
    WHERE id = ${id}
  `);

  return result;
}

export async function getUnprocessedWebhooks() {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result: any = await db.execute(
    sql`SELECT * FROM shopify_webhook_logs WHERE processed = false ORDER BY created_at ASC`
  );

  return result;
}
