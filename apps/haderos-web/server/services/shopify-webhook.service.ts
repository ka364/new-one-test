/**
 * Shopify Webhook Service
 * Handles incoming webhooks from Shopify (orders, inventory updates, etc.)
 */

import crypto from "crypto";
import { requireDb } from "../db";
import { sql } from "drizzle-orm";
import { createShopifyOrder, updateShopifyOrder } from "../db-shopify";

/**
 * Verify Shopify webhook signature
 */
export function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  return hash === hmacHeader;
}

/**
 * Handle orders/create webhook
 */
export async function handleOrderCreate(orderData: any) {
  console.log("[Shopify Webhook] Processing orders/create...");

  try {
    const shopifyOrderId = orderData.id.toString();
    const orderNumber = orderData.order_number; // Use integer from Shopify
    const orderName = orderData.name; // Store display name like "#1001"

    // Extract customer info
    const customer = orderData.customer || {};
    const shippingAddress = orderData.shipping_address || {};

    // Extract line items
    const lineItems = orderData.line_items || [];
    const totalAmount = parseFloat(orderData.total_price || "0");

    // Save order to database
    const order = await createShopifyOrder({
      shopifyOrderId,
      orderNumber,
      orderName,
      customerEmail: customer.email || orderData.email,
      customerFirstName: customer.first_name || "Guest",
      customerLastName: customer.last_name || "",
      customerPhone: customer.phone || shippingAddress.phone,
      shippingAddress,
      lineItems,
      totalPrice: totalAmount,
      currencyCode: orderData.currency || "EGP",
      financialStatus: orderData.financial_status || "pending",
      fulfillmentStatus: orderData.fulfillment_status || null,
    });

    console.log(`[Shopify Webhook] Order created: ${orderName} (ID: ${order.id})`);

    // Trigger notification to owner
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: `🛒 New Order: ${orderName}`,
        content: `New order received from ${customer.first_name || "Guest"} ${customer.last_name || ""}\n\nTotal: ${totalAmount} ${orderData.currency || "EGP"}\nItems: ${lineItems.length}\n\nView order in dashboard to process.`,
      });
    } catch (notifError) {
      console.error("[Shopify Webhook] Failed to send notification:", notifError);
    }

    // Update inventory for each line item
    await updateInventoryFromOrder(lineItems, "subtract");

    // Create shipment record
    await createShipmentFromOrder(order.id, orderData, shippingAddress);

    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("[Shopify Webhook] Error processing order:", error.message);
    throw error;
  }
}

/**
 * Handle orders/updated webhook
 */
export async function handleOrderUpdate(orderData: any) {
  console.log("[Shopify Webhook] Processing orders/updated...");

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
    console.error("[Shopify Webhook] Error updating order:", error.message);
    throw error;
  }
}

/**
 * Handle orders/cancelled webhook
 */
export async function handleOrderCancel(orderData: any) {
  console.log("[Shopify Webhook] Processing orders/cancelled...");

  try {
    const shopifyOrderId = orderData.id.toString();

    await updateShopifyOrder(shopifyOrderId, {
      financialStatus: "cancelled",
      fulfillmentStatus: orderData.fulfillment_status,
    });

    console.log(`[Shopify Webhook] Order cancelled: ${orderData.name}`);

    // Notify owner
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: `❌ Order Cancelled: ${orderData.name}`,
        content: `Order ${orderData.name} has been cancelled.\n\nReason: ${orderData.cancel_reason || "Not specified"}`,
      });
    } catch (notifError) {
      console.error("[Shopify Webhook] Failed to send notification:", notifError);
    }

    // Restore inventory for cancelled order
    const lineItems = orderData.line_items || [];
    await updateInventoryFromOrder(lineItems, "add");

    return { success: true };
  } catch (error: any) {
    console.error("[Shopify Webhook] Error cancelling order:", error.message);
    throw error;
  }
}

/**
 * Handle orders/fulfilled webhook
 */
export async function handleOrderFulfilled(orderData: any) {
  console.log("[Shopify Webhook] Processing orders/fulfilled...");

  try {
    const shopifyOrderId = orderData.id.toString();

    await updateShopifyOrder(shopifyOrderId, {
      fulfillmentStatus: "fulfilled",
    });

    console.log(`[Shopify Webhook] Order fulfilled: ${orderData.name}`);

    return { success: true };
  } catch (error: any) {
    console.error("[Shopify Webhook] Error fulfilling order:", error.message);
    throw error;
  }
}

/**
 * Handle inventory_levels/update webhook
 */
export async function handleInventoryUpdate(inventoryData: any) {
  console.log("[Shopify Webhook] Processing inventory_levels/update...");

  try {
    const inventoryItemId = inventoryData.inventory_item_id?.toString();
    const available = inventoryData.available || 0;

    // Find product by inventory item ID
    const db = await requireDb();
    if (!db) throw new Error("Database connection failed");

    const result: any = await db.execute(
      sql`UPDATE shopify_products 
          SET inventory_quantity = ${available}, 
              updated_at = NOW() 
          WHERE shopify_inventory_item_id = ${inventoryItemId}`
    );

    console.log(`[Shopify Webhook] Inventory updated for item ${inventoryItemId}: ${available}`);

    return { success: true };
  } catch (error: any) {
    console.error("[Shopify Webhook] Error updating inventory:", error.message);
    throw error;
  }
}

/**
 * Determine order status from Shopify data
 */
function determineOrderStatus(orderData: any): string {
  if (orderData.cancelled_at) return "cancelled";
  if (orderData.fulfillment_status === "fulfilled") return "fulfilled";
  if (orderData.financial_status === "paid") return "processing";
  if (orderData.financial_status === "pending") return "pending";
  return "pending";
}

/**
 * Log webhook event
 */
export async function logWebhookEvent(
  topic: string,
  shopifyOrderId: string | null,
  payload: any,
  status: "success" | "failed",
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
    console.error("[Shopify Webhook] Failed to log webhook event:", error);
  }
}

/**
 * Update inventory from Shopify order
 */
async function updateInventoryFromOrder(
  lineItems: any[],
  action: "subtract" | "add"
): Promise<void> {
  try {
    const db = await requireDb();
    if (!db) return;

    for (const item of lineItems) {
      const sku = item.sku;
      const quantity = item.quantity || 1;

      if (!sku) continue;

      // Find product by SKU and update inventory
      const operator = action === "subtract" ? "-" : "+";

      await db.execute(
        sql`UPDATE products
            SET inventory_quantity = GREATEST(0, COALESCE(inventory_quantity, 0) ${sql.raw(operator)} ${quantity}),
                updated_at = NOW()
            WHERE model_code = ${sku} OR sku = ${sku}`
      ).catch(() => {
        console.log(`[Shopify Webhook] Product not found for SKU: ${sku}`);
      });

      // Also update branch inventory if exists
      await db.execute(
        sql`UPDATE branch_inventory
            SET available = GREATEST(0, COALESCE(available, 0) ${sql.raw(operator)} ${quantity}),
                updated_at = NOW()
            WHERE product_id IN (
              SELECT id FROM products WHERE model_code = ${sku} OR sku = ${sku}
            )`
      ).catch(() => {
        // Branch inventory table might not exist
      });

      console.log(`[Shopify Webhook] Inventory ${action}ed for ${sku}: ${quantity}`);
    }
  } catch (error) {
    console.error("[Shopify Webhook] Error updating inventory:", error);
  }
}

/**
 * Create shipment record from Shopify order
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

    await db.execute(
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
    ).catch((err) => {
      console.log(`[Shopify Webhook] Shipment creation skipped or failed:`, err.message);
    });

    console.log(`[Shopify Webhook] Shipment created: ${shipmentNumber}`);
  } catch (error) {
    console.error("[Shopify Webhook] Error creating shipment:", error);
  }
}
