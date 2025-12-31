/**
 * Test script for Shopify Webhook endpoint
 * Simulates a Shopify webhook request with proper HMAC signature
 */

import crypto from "crypto";
import { ENV } from "./_core/env";

const WEBHOOK_URL = "http://localhost:3000/api/webhooks/shopify";
const SHOPIFY_SECRET = ENV.shopifyAdminApiToken;

// Sample order payload
const orderPayload = {
  id: 5678901234,
  name: "#TEST1001",
  order_number: 1001,
  email: "customer@example.com",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  total_price: "250.00",
  currency: "EGP",
  financial_status: "paid",
  fulfillment_status: null,
  customer: {
    id: 123456,
    email: "customer@example.com",
    first_name: "Ahmed",
    last_name: "Mohamed",
    phone: "+201234567890",
  },
  shipping_address: {
    first_name: "Ahmed",
    last_name: "Mohamed",
    address1: "123 Test Street",
    city: "Cairo",
    province: "Cairo",
    country: "Egypt",
    zip: "11511",
    phone: "+201234567890",
  },
  line_items: [
    {
      id: 987654321,
      product_id: 111222333,
      variant_id: 444555666,
      title: "Test Product",
      quantity: 2,
      price: "125.00",
      sku: "TEST-SKU-001",
    },
  ],
};

/**
 * Generate HMAC signature for webhook
 */
function generateHmac(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

/**
 * Send test webhook
 */
async function sendTestWebhook() {
  const body = JSON.stringify(orderPayload);
  const hmac = generateHmac(body, SHOPIFY_SECRET);

  console.log("🧪 Testing Shopify Webhook Endpoint");
  console.log("=====================================");
  console.log("URL:", WEBHOOK_URL);
  console.log("Topic: orders/create");
  console.log("HMAC:", hmac);
  console.log("Payload:", JSON.stringify(orderPayload, null, 2));
  console.log("=====================================\n");

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Hmac-SHA256": hmac,
        "X-Shopify-Topic": "orders/create",
        "X-Shopify-Shop-Domain": "haderos-test.myshopify.com",
        "X-Shopify-API-Version": "2024-01",
      },
      body,
    });

    const result = await response.json();

    console.log("✅ Response Status:", response.status);
    console.log("📦 Response Body:", JSON.stringify(result, null, 2));

    if (response.status === 200) {
      console.log("\n🎉 Webhook processed successfully!");
    } else {
      console.log("\n❌ Webhook failed!");
    }
  } catch (error: any) {
    console.error("\n❌ Error sending webhook:", error.message);
  }
}

// Run test
sendTestWebhook().catch(console.error);
