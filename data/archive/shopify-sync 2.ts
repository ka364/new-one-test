/**
 * Simplified Shopify Sync Service
 * Imports orders from Shopify and saves them to local database
 */

import { shopifyAPI } from "./integrations/shopify-api";
import { getDb } from "./db";
import { orders, shopifyOrders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface ShopifyOrder {
  id: string;
  order_number: number;
  name: string;
  email: string;
  phone: string | null;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
  }>;
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Import orders from Shopify and save to local database
 */
export async function importShopifyOrders(options: {
  limit?: number;
  status?: string;
  createdAfter?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch orders from Shopify
  const shopifyResponse = await shopifyAPI.getOrders({
    limit: options.limit || 50,
    status: options.status || "any",
    created_at_min: options.createdAfter?.toISOString(),
  });

  const shopifyOrdersList = shopifyResponse.orders;

  const results = {
    total: shopifyOrdersList.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const shopifyOrder of shopifyOrdersList) {
    try {
      // Check if order already exists
      const existing = await db
        .select()
        .from(shopifyOrders)
        .where(eq(shopifyOrders.shopifyOrderId, shopifyOrder.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing order
        const localOrderId = existing[0].localOrderId;
        if (localOrderId) {
          await db
            .update(orders)
            .set({
              status: mapShopifyStatus(shopifyOrder.fulfillment_status),
              paymentStatus: mapPaymentStatus(shopifyOrder.financial_status),
              updatedAt: new Date(),
            })
            .where(eq(orders.id, localOrderId));

          await db
            .update(shopifyOrders)
            .set({
              orderName: shopifyOrder.name,
              financialStatus: shopifyOrder.financial_status,
              fulfillmentStatus: shopifyOrder.fulfillment_status,
              lastSyncAt: new Date(),
            })
            .where(eq(shopifyOrders.shopifyOrderId, shopifyOrder.id));

          results.updated++;
        } else {
          results.skipped++;
        }
      } else {
        // Create new order
        const customerName = `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`;
        const productNames = shopifyOrder.line_items.map((item: any) => item.title).join(", ");
        const totalQuantity = shopifyOrder.line_items.reduce((sum: number, item: any) => sum + item.quantity, 0);

        const shippingAddr = shopifyOrder.shipping_address
          ? `${shopifyOrder.shipping_address.address1}, ${shopifyOrder.shipping_address.city}, ${shopifyOrder.shipping_address.province}, ${shopifyOrder.shipping_address.country}`
          : "";

        // Insert into orders table
        const [insertResult] = await db.insert(orders).values({
          orderNumber: `SHOP-${shopifyOrder.order_number}`,
          customerName,
          customerEmail: shopifyOrder.email,
          customerPhone: shopifyOrder.phone || shopifyOrder.customer.phone || "",
          productName: productNames,
          productDescription: `Imported from Shopify - ${shopifyOrder.line_items.length} items`,
          quantity: totalQuantity,
          unitPrice: shopifyOrder.total_price,
          totalAmount: shopifyOrder.total_price,
          currency: shopifyOrder.currency || "EGP",
          status: mapShopifyStatus(shopifyOrder.fulfillment_status),
          paymentStatus: mapPaymentStatus(shopifyOrder.financial_status),
          shippingAddress: shippingAddr,
          notes: `Shopify Order: ${shopifyOrder.name}`,
          createdBy: 1, // System user
        });

        const localOrderId = Number(insertResult.insertId);

        // Link in shopify_orders table
        await db.insert(shopifyOrders).values({
          shopifyOrderId: shopifyOrder.id,
          localOrderId,
          orderNumber: shopifyOrder.order_number,
          orderName: shopifyOrder.name,
          email: shopifyOrder.email,
          phone: shopifyOrder.phone,
          totalPrice: shopifyOrder.total_price,
          currency: shopifyOrder.currency,
          financialStatus: shopifyOrder.financial_status as any,
          fulfillmentStatus: shopifyOrder.fulfillment_status as any,
          customerData: {
            id: shopifyOrder.id,
            email: shopifyOrder.customer.email,
            firstName: shopifyOrder.customer.first_name,
            lastName: shopifyOrder.customer.last_name,
            phone: shopifyOrder.customer.phone || "",
          },
          shippingAddress: shopifyOrder.shipping_address || undefined,
          lineItems: shopifyOrder.line_items.map((item) => ({
            id: String(item.id),
            productId: "",
            variantId: "",
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            sku: item.sku,
          })),
          syncStatus: "synced",
          lastSyncAt: new Date(),
        });

        results.imported++;
      }
    } catch (error: any) {
      results.errors.push(`Order ${shopifyOrder.name}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Map Shopify fulfillment status to local order status
 */
function mapShopifyStatus(fulfillmentStatus: string | null): "pending" | "processing" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded" {
  switch (fulfillmentStatus) {
    case "fulfilled":
      return "delivered";
    case "partial":
      return "processing";
    case "restocked":
      return "cancelled";
    case null:
    case "unfulfilled":
    default:
      return "confirmed";
  }
}

/**
 * Map Shopify financial status to local payment status
 */
function mapPaymentStatus(financialStatus: string): "pending" | "paid" | "failed" | "refunded" {
  switch (financialStatus) {
    case "paid":
      return "paid";
    case "refunded":
    case "partially_refunded":
      return "refunded";
    case "voided":
      return "failed";
    case "pending":
    case "authorized":
    case "partially_paid":
    default:
      return "pending";
  }
}

/**
 * Get sync statistics
 */
export async function getShopifySyncStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [totalOrders] = await db
    .select({ count: orders.id })
    .from(shopifyOrders);

  const [lastSync] = await db
    .select({ lastSyncAt: shopifyOrders.lastSyncAt })
    .from(shopifyOrders)
    .orderBy(shopifyOrders.lastSyncAt)
    .limit(1);

  return {
    totalLinkedOrders: totalOrders?.count || 0,
    lastSyncAt: lastSync?.lastSyncAt || null,
  };
}
