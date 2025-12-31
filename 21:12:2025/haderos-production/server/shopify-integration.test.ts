/**
 * Shopify Integration Tests
 * Comprehensive tests for Shopify integration
 */

import { describe, it, expect } from "vitest";
import { shopifyClient } from "./integrations/shopify-client";
import { syncAllProductsToShopify } from "./services/shopify-product-sync.service";
import {
  getInventorySyncStatus,
  syncInventoryToShopify,
} from "./services/shopify-inventory-sync.service";
import {
  getAllShopifyProducts,
  getAllShopifyOrders,
  getSyncLogs,
} from "./db-shopify";

describe("Shopify Integration", () => {
  describe("1. Connection & Authentication", () => {
    it("should connect to Shopify and get shop info", async () => {
      const shopInfo = await shopifyClient.getShopInfo();
      
      expect(shopInfo).toBeDefined();
      expect(shopInfo.name).toBeDefined();
      expect(shopInfo.email).toBeDefined();
      
      console.log("✓ Connected to shop:", shopInfo.name);
    }, 30000);
  });

  describe("2. Product Sync", () => {
    it("should have synced products in database", async () => {
      const products = await getAllShopifyProducts();
      
      expect(products).toBeDefined();
      expect(products.length).toBeGreaterThan(0);
      
      console.log(`✓ Found ${products.length} synced products`);
    }, 10000);

    it("should have sync logs", async () => {
      const logs = await getSyncLogs(10);
      
      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
      
      console.log(`✓ Found ${logs.length} sync log entries`);
    }, 10000);
  });

  describe("3. Inventory Sync", () => {
    it("should get inventory sync status", async () => {
      const status = await getInventorySyncStatus();
      
      expect(status).toBeDefined();
      expect(status.totalProducts).toBeGreaterThan(0);
      
      console.log("✓ Inventory sync status:", {
        total: status.totalProducts,
        synced: status.syncedProducts,
        outOfSync: status.outOfSync,
      });
    }, 10000);
  });

  describe("4. Orders", () => {
    it("should fetch orders from Shopify", async () => {
      const ordersData = await shopifyClient.getOrders(10);
      
      expect(ordersData).toBeDefined();
      
      const orderCount = ordersData.edges?.length || 0;
      console.log(`✓ Fetched ${orderCount} orders from Shopify`);
    }, 30000);

    it("should have orders in database", async () => {
      const orders = await getAllShopifyOrders(10);
      
      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
      
      console.log(`✓ Found ${orders.length} orders in database`);
    }, 10000);
  });

  describe("5. Webhooks", () => {
    it("should have webhook endpoint available", async () => {
      const response = await fetch("http://localhost:3000/api/webhooks/shopify/health");
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.status).toBe("ok");
      expect(data.service).toBe("shopify-webhooks");
      
      console.log("✓ Webhook endpoint is healthy");
    }, 10000);
  });

  describe("6. Integration Summary", () => {
    it("should provide complete integration summary", async () => {
      const products = await getAllShopifyProducts();
      const orders = await getAllShopifyOrders(100);
      const inventoryStatus = await getInventorySyncStatus();
      const shopInfo = await shopifyClient.getShopInfo();

      const summary = {
        shop: {
          name: shopInfo.name,
          email: shopInfo.email,
          domain: shopInfo.primaryDomain?.url,
        },
        products: {
          total: products.length,
          synced: inventoryStatus.syncedProducts,
          outOfSync: inventoryStatus.outOfSync,
        },
        orders: {
          total: orders.length,
        },
        webhooks: {
          endpoint: "http://localhost:3000/api/webhooks/shopify",
          status: "active",
        },
      };

      console.log("\n📊 Shopify Integration Summary:");
      console.log("================================");
      console.log(`Shop: ${summary.shop.name}`);
      console.log(`Domain: ${summary.shop.domain}`);
      console.log(`Products Synced: ${summary.products.total}`);
      console.log(`Orders: ${summary.orders.total}`);
      console.log(`Webhook Endpoint: ${summary.webhooks.endpoint}`);
      console.log("================================\n");

      expect(summary.products.total).toBeGreaterThan(0);
      expect(summary.shop.name).toBeDefined();
    }, 30000);
  });
});
