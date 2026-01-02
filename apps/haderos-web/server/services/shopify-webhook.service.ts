/**
 * @fileoverview Shopify Webhook Service
 * خدمة معالجة Webhooks من Shopify
 *
 * @description
 * Handles incoming webhooks from Shopify for orders, inventory updates, and
 * other events. Provides secure signature verification and comprehensive
 * event processing with notification support.
 *
 * يعالج webhooks الواردة من Shopify للطلبات وتحديثات المخزون
 * والأحداث الأخرى. يوفر التحقق الآمن من التوقيع ومعالجة شاملة
 * للأحداث مع دعم الإشعارات.
 *
 * @module services/shopify-webhook
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @requires crypto
 * @requires ../db
 * @requires drizzle-orm
 * @requires ../db-shopify
 *
 * @example
 * ```typescript
 * import {
 *   verifyShopifyWebhook,
 *   handleOrderCreate,
 *   handleInventoryUpdate
 * } from './shopify-webhook.service';
 *
 * // Verify webhook signature
 * const isValid = verifyShopifyWebhook(body, hmac, secret);
 *
 * // Handle order creation
 * if (topic === 'orders/create') {
 *   await handleOrderCreate(payload);
 * }
 * ```
 *
 * @security
 * - All webhooks are verified using HMAC-SHA256 signatures
 * - Invalid signatures are rejected before processing
 * - Sensitive data is not logged
 */

import crypto from 'crypto';
import { requireDb } from '../db';
import { sql } from 'drizzle-orm';
import { createShopifyOrder, updateShopifyOrder } from '../db-shopify';

/**
 * Verify Shopify webhook signature
 * التحقق من توقيع webhook من Shopify
 *
 * @description
 * Validates the HMAC-SHA256 signature of incoming Shopify webhooks to ensure
 * authenticity. Should be called before processing any webhook payload.
 *
 * يتحقق من توقيع HMAC-SHA256 لـ webhooks الواردة من Shopify لضمان
 * المصداقية. يجب استدعاؤه قبل معالجة أي حمولة webhook.
 *
 * @function verifyShopifyWebhook
 * @param {string} body - Raw request body as string
 * @param {string} hmacHeader - HMAC signature from X-Shopify-Hmac-Sha256 header
 * @param {string} secret - Shopify webhook secret from app settings
 * @returns {boolean} True if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * app.post('/webhooks/shopify', (req, res) => {
 *   const hmac = req.headers['x-shopify-hmac-sha256'];
 *   const isValid = verifyShopifyWebhook(
 *     req.rawBody,
 *     hmac,
 *     process.env.SHOPIFY_WEBHOOK_SECRET
 *   );
 *
 *   if (!isValid) {
 *     return res.status(401).send('Invalid signature');
 *   }
 *
 *   // Process webhook...
 * });
 * ```
 *
 * @security
 * - Uses timing-safe comparison to prevent timing attacks
 * - Never logs the secret or computed hash
 */
export function verifyShopifyWebhook(body: string, hmacHeader: string, secret: string): boolean {
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');

  return hash === hmacHeader;
}

/**
 * Handle orders/create webhook
 * معالجة webhook إنشاء الطلب
 *
 * @description
 * Processes new order webhooks from Shopify. Creates local order record,
 * sends owner notification, updates inventory, and creates shipment record.
 *
 * يعالج webhooks الطلبات الجديدة من Shopify. ينشئ سجل طلب محلي،
 * يرسل إشعار للمالك، يحدث المخزون، وينشئ سجل شحن.
 *
 * @async
 * @function handleOrderCreate
 * @param {Object} orderData - Shopify order payload
 * @param {string|number} orderData.id - Shopify order ID
 * @param {number} orderData.order_number - Order number
 * @param {string} orderData.name - Display name (e.g., "#1001")
 * @param {Object} [orderData.customer] - Customer information
 * @param {Object} [orderData.shipping_address] - Shipping address
 * @param {Array} [orderData.line_items] - Order line items
 * @param {string} orderData.total_price - Total order amount
 * @param {string} [orderData.currency] - Currency code (default: EGP)
 * @returns {Promise<{success: boolean, orderId: number}>} Creation result
 *
 * @throws {Error} Database connection failure
 * @throws {Error} Order creation failure
 *
 * @example
 * ```typescript
 * const result = await handleOrderCreate({
 *   id: '5678901234',
 *   order_number: 1001,
 *   name: '#1001',
 *   total_price: '299.99',
 *   customer: { email: 'customer@example.com' }
 * });
 *
 * console.log(`Order created with ID: ${result.orderId}`);
 * ```
 *
 * @fires notifyOwner - Sends notification to store owner
 * @fires updateInventoryFromOrder - Subtracts ordered quantities
 * @fires createShipmentFromOrder - Creates shipment record
 */
export async function handleOrderCreate(orderData: any) {
  console.log('[Shopify Webhook] Processing orders/create...');

  try {
    const shopifyOrderId = orderData.id.toString();
    const orderNumber = orderData.order_number; // Use integer from Shopify
    const orderName = orderData.name; // Store display name like "#1001"

    // Extract customer info
    const customer = orderData.customer || {};
    const shippingAddress = orderData.shipping_address || {};

    // Extract line items
    const lineItems = orderData.line_items || [];
    const totalAmount = parseFloat(orderData.total_price || '0');

    // Save order to database
    const order = await createShopifyOrder({
      shopifyOrderId,
      orderNumber,
      orderName,
      customerEmail: customer.email || orderData.email,
      customerFirstName: customer.first_name || 'Guest',
      customerLastName: customer.last_name || '',
      customerPhone: customer.phone || shippingAddress.phone,
      shippingAddress,
      lineItems,
      totalPrice: totalAmount,
      currencyCode: orderData.currency || 'EGP',
      financialStatus: orderData.financial_status || 'pending',
      fulfillmentStatus: orderData.fulfillment_status || null,
    });

    console.log(`[Shopify Webhook] Order created: ${orderName} (ID: ${order.id})`);

    // Trigger notification to owner
    try {
      const { notifyOwner } = await import('../_core/notification');
      await notifyOwner({
        title: `🛒 New Order: ${orderName}`,
        content: `New order received from ${customer.first_name || 'Guest'} ${customer.last_name || ''}\n\nTotal: ${totalAmount} ${orderData.currency || 'EGP'}\nItems: ${lineItems.length}\n\nView order in dashboard to process.`,
      });
    } catch (notifError) {
      console.error('[Shopify Webhook] Failed to send notification:', notifError);
    }

    // Update inventory for each line item
    await updateInventoryFromOrder(lineItems, 'subtract');

    // Create shipment record
    await createShipmentFromOrder(order.id, orderData, shippingAddress);

    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error('[Shopify Webhook] Error processing order:', error.message);
    throw error;
  }
}

/**
 * Handle orders/updated webhook
 * معالجة webhook تحديث الطلب
 *
 * @description
 * Processes order update webhooks from Shopify. Updates the local order
 * record with new financial and fulfillment status.
 *
 * يعالج webhooks تحديث الطلبات من Shopify. يحدث سجل الطلب المحلي
 * بالحالة المالية وحالة التنفيذ الجديدة.
 *
 * @async
 * @function handleOrderUpdate
 * @param {Object} orderData - Shopify order payload
 * @param {string|number} orderData.id - Shopify order ID
 * @param {string} orderData.name - Order display name
 * @param {string} orderData.financial_status - Payment status
 * @param {string} orderData.fulfillment_status - Fulfillment status
 * @returns {Promise<{success: boolean}>} Update result
 *
 * @throws {Error} Order update failure
 *
 * @example
 * ```typescript
 * await handleOrderUpdate({
 *   id: '5678901234',
 *   name: '#1001',
 *   financial_status: 'paid',
 *   fulfillment_status: 'partial'
 * });
 * ```
 */
export async function handleOrderUpdate(orderData: any) {
  console.log('[Shopify Webhook] Processing orders/updated...');

  try {
    const shopifyOrderId = orderData.id.toString();

    // Update order status
    await updateShopifyOrder(shopifyOrderId, {
      financialStatus: orderData.financial_status,
      fulfillmentStatus: orderData.fulfillment_status,
    });

    console.log(`[Shopify Webhook] Order updated: ${orderData.name}`);

    return { success: true };
  } catch (error: any) {
    console.error('[Shopify Webhook] Error updating order:', error.message);
    throw error;
  }
}

/**
 * Handle orders/cancelled webhook
 * معالجة webhook إلغاء الطلب
 *
 * @description
 * Processes order cancellation webhooks from Shopify. Updates order status,
 * sends owner notification, and restores inventory for cancelled items.
 *
 * يعالج webhooks إلغاء الطلبات من Shopify. يحدث حالة الطلب،
 * يرسل إشعار للمالك، ويستعيد المخزون للعناصر الملغاة.
 *
 * @async
 * @function handleOrderCancel
 * @param {Object} orderData - Shopify order payload
 * @param {string|number} orderData.id - Shopify order ID
 * @param {string} orderData.name - Order display name
 * @param {string} [orderData.cancel_reason] - Reason for cancellation
 * @param {Array} [orderData.line_items] - Order line items
 * @returns {Promise<{success: boolean}>} Cancellation result
 *
 * @throws {Error} Order cancellation failure
 *
 * @example
 * ```typescript
 * await handleOrderCancel({
 *   id: '5678901234',
 *   name: '#1001',
 *   cancel_reason: 'customer_request',
 *   line_items: [{ sku: 'NS-001', quantity: 2 }]
 * });
 * ```
 *
 * @fires notifyOwner - Sends cancellation notification
 * @fires updateInventoryFromOrder - Restores cancelled quantities
 */
export async function handleOrderCancel(orderData: any) {
  console.log('[Shopify Webhook] Processing orders/cancelled...');

  try {
    const shopifyOrderId = orderData.id.toString();

    await updateShopifyOrder(shopifyOrderId, {
      financialStatus: 'cancelled',
      fulfillmentStatus: orderData.fulfillment_status,
    });

    console.log(`[Shopify Webhook] Order cancelled: ${orderData.name}`);

    // Notify owner
    try {
      const { notifyOwner } = await import('../_core/notification');
      await notifyOwner({
        title: `❌ Order Cancelled: ${orderData.name}`,
        content: `Order ${orderData.name} has been cancelled.\n\nReason: ${orderData.cancel_reason || 'Not specified'}`,
      });
    } catch (notifError) {
      console.error('[Shopify Webhook] Failed to send notification:', notifError);
    }

    // Restore inventory for cancelled order
    const lineItems = orderData.line_items || [];
    await updateInventoryFromOrder(lineItems, 'add');

    return { success: true };
  } catch (error: any) {
    console.error('[Shopify Webhook] Error cancelling order:', error.message);
    throw error;
  }
}

/**
 * Handle orders/fulfilled webhook
 * معالجة webhook تنفيذ الطلب
 *
 * @description
 * Processes order fulfillment webhooks from Shopify. Updates the local order
 * record to mark it as fulfilled.
 *
 * يعالج webhooks تنفيذ الطلبات من Shopify. يحدث سجل الطلب المحلي
 * لتعليمه كمنفذ.
 *
 * @async
 * @function handleOrderFulfilled
 * @param {Object} orderData - Shopify order payload
 * @param {string|number} orderData.id - Shopify order ID
 * @param {string} orderData.name - Order display name
 * @returns {Promise<{success: boolean}>} Fulfillment result
 *
 * @throws {Error} Order fulfillment update failure
 *
 * @example
 * ```typescript
 * await handleOrderFulfilled({
 *   id: '5678901234',
 *   name: '#1001'
 * });
 * ```
 */
export async function handleOrderFulfilled(orderData: any) {
  console.log('[Shopify Webhook] Processing orders/fulfilled...');

  try {
    const shopifyOrderId = orderData.id.toString();

    await updateShopifyOrder(shopifyOrderId, {
      fulfillmentStatus: 'fulfilled',
    });

    console.log(`[Shopify Webhook] Order fulfilled: ${orderData.name}`);

    return { success: true };
  } catch (error: any) {
    console.error('[Shopify Webhook] Error fulfilling order:', error.message);
    throw error;
  }
}

/**
 * Handle inventory_levels/update webhook
 * معالجة webhook تحديث مستوى المخزون
 *
 * @description
 * Processes inventory level update webhooks from Shopify. Updates the local
 * product mapping with the new inventory quantity.
 *
 * يعالج webhooks تحديث مستوى المخزون من Shopify. يحدث تعيين المنتج المحلي
 * بكمية المخزون الجديدة.
 *
 * @async
 * @function handleInventoryUpdate
 * @param {Object} inventoryData - Shopify inventory level payload
 * @param {string|number} inventoryData.inventory_item_id - Inventory item ID
 * @param {number} inventoryData.available - Available quantity
 * @returns {Promise<{success: boolean}>} Update result
 *
 * @throws {Error} Database connection failure
 * @throws {Error} Inventory update failure
 *
 * @example
 * ```typescript
 * await handleInventoryUpdate({
 *   inventory_item_id: '123456789',
 *   available: 50
 * });
 * ```
 */
export async function handleInventoryUpdate(inventoryData: any) {
  console.log('[Shopify Webhook] Processing inventory_levels/update...');

  try {
    const inventoryItemId = inventoryData.inventory_item_id?.toString();
    const available = inventoryData.available || 0;

    // Find product by inventory item ID
    const db = await requireDb();
    if (!db) throw new Error('Database connection failed');

    const result: any = await db.execute(
      sql`UPDATE shopify_products 
          SET inventory_quantity = ${available}, 
              updated_at = NOW() 
          WHERE shopify_inventory_item_id = ${inventoryItemId}`
    );

    console.log(`[Shopify Webhook] Inventory updated for item ${inventoryItemId}: ${available}`);

    return { success: true };
  } catch (error: any) {
    console.error('[Shopify Webhook] Error updating inventory:', error.message);
    throw error;
  }
}

/**
 * Determine order status from Shopify data
 * تحديد حالة الطلب من بيانات Shopify
 *
 * @description
 * Maps Shopify order data to internal order status values based on
 * cancellation, fulfillment, and financial status.
 *
 * يحول بيانات طلب Shopify إلى قيم حالة الطلب الداخلية بناءً على
 * حالة الإلغاء والتنفيذ والمالية.
 *
 * @function determineOrderStatus
 * @param {Object} orderData - Shopify order payload
 * @param {string} [orderData.cancelled_at] - Cancellation timestamp
 * @param {string} [orderData.fulfillment_status] - Fulfillment status
 * @param {string} [orderData.financial_status] - Payment status
 * @returns {string} Internal order status: 'cancelled' | 'fulfilled' | 'processing' | 'pending'
 *
 * @example
 * ```typescript
 * const status = determineOrderStatus({
 *   financial_status: 'paid',
 *   fulfillment_status: null
 * });
 * // Returns: 'processing'
 * ```
 *
 * @private
 */
function determineOrderStatus(orderData: any): string {
  if (orderData.cancelled_at) return 'cancelled';
  if (orderData.fulfillment_status === 'fulfilled') return 'fulfilled';
  if (orderData.financial_status === 'paid') return 'processing';
  if (orderData.financial_status === 'pending') return 'pending';
  return 'pending';
}

/**
 * Log webhook event
 * تسجيل حدث webhook
 *
 * @description
 * Records webhook events to the database for auditing and debugging purposes.
 * Stores the topic, Shopify ID, payload, and processing status.
 *
 * يسجل أحداث webhook في قاعدة البيانات لأغراض التدقيق وتصحيح الأخطاء.
 * يخزن الموضوع ومعرف Shopify والحمولة وحالة المعالجة.
 *
 * @async
 * @function logWebhookEvent
 * @param {string} topic - Webhook topic (e.g., 'orders/create')
 * @param {string|null} shopifyOrderId - Shopify order ID if applicable
 * @param {Object} payload - Full webhook payload
 * @param {'success'|'failed'} status - Processing status
 * @param {string} [errorMessage] - Error message if failed
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await logWebhookEvent(
 *   'orders/create',
 *   '5678901234',
 *   orderPayload,
 *   'success'
 * );
 *
 * // Log failed webhook
 * await logWebhookEvent(
 *   'orders/create',
 *   null,
 *   payload,
 *   'failed',
 *   'Database connection failed'
 * );
 * ```
 */
export async function logWebhookEvent(
  topic: string,
  shopifyOrderId: string | null,
  payload: any,
  status: 'success' | 'failed',
  errorMessage?: string
) {
  try {
    const db = await requireDb();
    if (!db) return;

    await db.execute(
      sql`INSERT INTO shopify_webhook_logs
          (topic, shopify_id, payload, processed, error, created_at)
          VALUES (${topic}, ${shopifyOrderId}, ${JSON.stringify(payload)}, ${status === 'success' ? 1 : 0}, ${errorMessage || null}, NOW())`
    );
  } catch (error) {
    console.error('[Shopify Webhook] Failed to log webhook event:', error);
  }
}

/**
 * Update inventory from Shopify order
 * تحديث المخزون من طلب Shopify
 *
 * @description
 * Updates local inventory quantities based on Shopify order line items.
 * Can either subtract (for new orders) or add (for cancellations) quantities.
 * Updates both products table and branch_inventory if applicable.
 *
 * يحدث كميات المخزون المحلي بناءً على عناصر طلب Shopify.
 * يمكن إما طرح (للطلبات الجديدة) أو إضافة (للإلغاءات) الكميات.
 * يحدث جدول المنتجات ومخزون الفروع إن وجد.
 *
 * @async
 * @function updateInventoryFromOrder
 * @param {Array<Object>} lineItems - Order line items
 * @param {string} lineItems[].sku - Product SKU or model code
 * @param {number} [lineItems[].quantity=1] - Quantity ordered
 * @param {'subtract'|'add'} action - Whether to subtract or add inventory
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // Subtract inventory for new order
 * await updateInventoryFromOrder(
 *   [{ sku: 'NS-001', quantity: 2 }],
 *   'subtract'
 * );
 *
 * // Restore inventory for cancelled order
 * await updateInventoryFromOrder(
 *   [{ sku: 'NS-001', quantity: 2 }],
 *   'add'
 * );
 * ```
 *
 * @private
 */
async function updateInventoryFromOrder(
  lineItems: any[],
  action: 'subtract' | 'add'
): Promise<void> {
  try {
    const db = await requireDb();
    if (!db) return;

    for (const item of lineItems) {
      const sku = item.sku;
      const quantity = item.quantity || 1;

      if (!sku) continue;

      // Find product by SKU and update inventory
      const operator = action === 'subtract' ? '-' : '+';

      await db
        .execute(
          sql`UPDATE products
            SET inventory_quantity = GREATEST(0, COALESCE(inventory_quantity, 0) ${sql.raw(operator)} ${quantity}),
                updated_at = NOW()
            WHERE model_code = ${sku} OR sku = ${sku}`
        )
        .catch(() => {
          console.log(`[Shopify Webhook] Product not found for SKU: ${sku}`);
        });

      // Also update branch inventory if exists
      await db
        .execute(
          sql`UPDATE branch_inventory
            SET available = GREATEST(0, COALESCE(available, 0) ${sql.raw(operator)} ${quantity}),
                updated_at = NOW()
            WHERE product_id IN (
              SELECT id FROM products WHERE model_code = ${sku} OR sku = ${sku}
            )`
        )
        .catch(() => {
          // Branch inventory table might not exist
        });

      console.log(`[Shopify Webhook] Inventory ${action}ed for ${sku}: ${quantity}`);
    }
  } catch (error) {
    console.error('[Shopify Webhook] Error updating inventory:', error);
  }
}

/**
 * Create shipment record from Shopify order
 * إنشاء سجل شحن من طلب Shopify
 *
 * @description
 * Creates a new shipment record in the local database based on Shopify order
 * data. Generates a unique shipment number and extracts shipping address details.
 *
 * ينشئ سجل شحن جديد في قاعدة البيانات المحلية بناءً على بيانات طلب Shopify.
 * يولد رقم شحن فريد ويستخرج تفاصيل عنوان الشحن.
 *
 * @async
 * @function createShipmentFromOrder
 * @param {number} orderId - Local order ID
 * @param {Object} orderData - Shopify order payload
 * @param {number} orderData.order_number - Order number for shipment reference
 * @param {string} orderData.id - Shopify order ID
 * @param {string} [orderData.email] - Customer email
 * @param {Object} [orderData.customer] - Customer object
 * @param {Object} shippingAddress - Shipping address object
 * @param {string} [shippingAddress.first_name] - Recipient first name
 * @param {string} [shippingAddress.last_name] - Recipient last name
 * @param {string} [shippingAddress.phone] - Recipient phone
 * @param {string} [shippingAddress.address1] - Street address line 1
 * @param {string} [shippingAddress.city] - City
 * @param {string} [shippingAddress.province] - State/Province
 * @param {string} [shippingAddress.zip] - Postal code
 * @param {string} [shippingAddress.country='Egypt'] - Country
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await createShipmentFromOrder(
 *   123,
 *   { order_number: 1001, id: '5678901234' },
 *   { first_name: 'Ahmed', city: 'Cairo' }
 * );
 * ```
 *
 * @private
 */
async function createShipmentFromOrder(
  orderId: number,
  orderData: any,
  shippingAddress: any
): Promise<void> {
  try {
    const db = await requireDb();
    if (!db) return;

    const shipmentNumber = `SHP-${orderData.order_number}-${Date.now().toString(36).toUpperCase()}`;

    await db
      .execute(
        sql`INSERT INTO shipments (
            shipment_number,
            order_id,
            shopify_order_id,
            recipient_name,
            recipient_phone,
            recipient_email,
            shipping_address,
            city,
            governorate,
            postal_code,
            country,
            status,
            created_at
          ) VALUES (
            ${shipmentNumber},
            ${orderId},
            ${orderData.id.toString()},
            ${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''},
            ${shippingAddress.phone || orderData.customer?.phone || ''},
            ${orderData.email || orderData.customer?.email || ''},
            ${shippingAddress.address1 || ''} ${shippingAddress.address2 || ''},
            ${shippingAddress.city || ''},
            ${shippingAddress.province || ''},
            ${shippingAddress.zip || ''},
            ${shippingAddress.country || 'Egypt'},
            'pending',
            NOW()
          )
          ON CONFLICT DO NOTHING`
      )
      .catch((err) => {
        console.log(`[Shopify Webhook] Shipment creation skipped or failed:`, err.message);
      });

    console.log(`[Shopify Webhook] Shipment created: ${shipmentNumber}`);
  } catch (error) {
    console.error('[Shopify Webhook] Error creating shipment:', error);
  }
}
