/**
 * Shopify Webhook Endpoint
 * Express route handler for Shopify webhooks
 */

import { Router, Request, Response } from "express";
import { ENV } from "./env";
import {
  verifyShopifyWebhook,
  handleOrderCreate,
  handleOrderUpdate,
  handleOrderCancel,
  handleOrderFulfilled,
  handleInventoryUpdate,
  logWebhookEvent,
} from "../services/shopify-webhook.service";

const router = Router();

/**
 * Middleware to verify Shopify webhook signature
 */
function verifyWebhookMiddleware(req: Request, res: Response, next: Function) {
  const hmacHeader = req.get("X-Shopify-Hmac-SHA256");
  const topic = req.get("X-Shopify-Topic");
  const shopDomain = req.get("X-Shopify-Shop-Domain");

  if (!hmacHeader || !topic) {
    console.error("[Shopify Webhook] Missing required headers");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get raw body for signature verification
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // Verify signature
  const isValid = verifyShopifyWebhook(
    rawBody,
    hmacHeader,
    ENV.shopifyAdminApiToken
  );

  if (!isValid) {
    console.error("[Shopify Webhook] Invalid signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  console.log(`[Shopify Webhook] Verified webhook: ${topic} from ${shopDomain}`);
  next();
}

/**
 * Main webhook handler
 */
router.post("/webhooks/shopify", verifyWebhookMiddleware, async (req: Request, res: Response) => {
  const topic = req.get("X-Shopify-Topic") as string;
  const shopifyOrderId = req.body.id?.toString() || null;

  try {
    console.log(`[Shopify Webhook] Processing: ${topic}`);

    let result;

    switch (topic) {
      case "orders/create":
        result = await handleOrderCreate(req.body);
        break;

      case "orders/updated":
        result = await handleOrderUpdate(req.body);
        break;

      case "orders/cancelled":
        result = await handleOrderCancel(req.body);
        break;

      case "orders/fulfilled":
        result = await handleOrderFulfilled(req.body);
        break;

      case "inventory_levels/update":
        result = await handleInventoryUpdate(req.body);
        break;

      default:
        console.log(`[Shopify Webhook] Unhandled topic: ${topic}`);
        await logWebhookEvent(topic, shopifyOrderId, req.body, "success");
        return res.status(200).json({ message: "Webhook received but not processed" });
    }

    // Log success
    await logWebhookEvent(topic, shopifyOrderId, req.body, "success");

    res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error(`[Shopify Webhook] Error processing ${topic}:`, error.message);

    // Log failure
    await logWebhookEvent(topic, shopifyOrderId, req.body, "failed", error.message);

    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check endpoint
 */
router.get("/webhooks/shopify/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "shopify-webhooks" });
});

export default router;
