/**
 * Shopify tRPC Router
 * APIs for Shopify integration
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { shopifyClient } from '../integrations/shopify-client';
import {
  syncAllProductsToShopify,
  updateProductInventory,
} from '../services/shopify-product-sync.service';
import {
  syncInventoryToShopify,
  syncInventoryFromShopify,
  bulkSyncInventoryFromShopify,
  getInventorySyncStatus,
} from '../services/shopify-inventory-sync.service';
import {
  getAllShopifyProducts,
  getAllShopifyOrders,
  getUnprocessedShopifyOrders,
  getSyncLogs,
  getShopifyProductByLocalId,
  updateShopifyOrder,
} from '../db-shopify';

export const shopifyRouter = router({
  /**
   * Get Shopify shop information
   */
  getShopInfo: protectedProcedure.query(async () => {
    try {
      const shopInfo = await shopifyClient.getShopInfo();
      return {
        success: true,
        shop: shopInfo,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }),

  /**
   * Sync all products to Shopify
   */
  syncProducts: protectedProcedure.mutation(async () => {
    try {
      const result = await syncAllProductsToShopify();
      return result;
    } catch (error: any) {
      return {
        success: false,
        totalProducts: 0,
        synced: 0,
        failed: 0,
        errors: [{ productId: 0, error: error.message }],
      };
    }
  }),

  /**
   * Get all synced products
   */
  getSyncedProducts: protectedProcedure.query(async () => {
    try {
      const products = await getAllShopifyProducts();
      return {
        success: true,
        products,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        products: [],
      };
    }
  }),

  /**
   * Get all orders from Shopify
   */
  getOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const orders = await getAllShopifyOrders(input.limit);
        return {
          success: true,
          orders,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          orders: [],
        };
      }
    }),

  /**
   * Get unprocessed orders
   */
  getUnprocessedOrders: protectedProcedure.query(async () => {
    try {
      const orders = await getUnprocessedShopifyOrders();
      return {
        success: true,
        orders,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        orders: [],
      };
    }
  }),

  /**
   * Mark order as processed
   */
  markOrderProcessed: protectedProcedure
    .input(
      z.object({
        shopifyOrderId: z.string(),
        localOrderId: z.number().optional(),
        shippingCompany: z.string().optional(),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateShopifyOrder(input.shopifyOrderId, {
          localOrderId: input.localOrderId,
          shippingCompany: input.shippingCompany,
          trackingNumber: input.trackingNumber,
          processedAt: new Date(),
        });

        return {
          success: true,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Update product inventory
   */
  updateInventory: protectedProcedure
    .input(
      z.object({
        localProductId: z.number(),
        quantity: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateProductInventory(input.localProductId, input.quantity);
        return {
          success: true,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get sync logs
   */
  getSyncLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = await getSyncLogs(input.limit);
        return {
          success: true,
          logs,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          logs: [],
        };
      }
    }),

  /**
   * Get sync status
   */
  getSyncStatus: protectedProcedure.query(async () => {
    try {
      const products = await getAllShopifyProducts();
      const orders = await getAllShopifyOrders(10);
      const unprocessedOrders = await getUnprocessedShopifyOrders();

      return {
        success: true,
        status: {
          totalProducts: products.length,
          totalOrders: orders.length,
          unprocessedOrders: unprocessedOrders.length,
          lastSync: products[0]?.last_synced_at || null,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        status: {
          totalProducts: 0,
          totalOrders: 0,
          unprocessedOrders: 0,
          lastSync: null,
        },
      };
    }
  }),

  /**
   * Fetch latest orders from Shopify
   */
  fetchOrders: protectedProcedure.mutation(async () => {
    try {
      const ordersData = await shopifyClient.getOrders(50);

      if (!ordersData?.edges) {
        return {
          success: false,
          error: 'No orders data received from Shopify',
          imported: 0,
        };
      }

      let imported = 0;
      const { createShopifyOrder, getShopifyOrderByShopifyId } = await import('../db-shopify');

      for (const edge of ordersData.edges) {
        const order = edge.node;

        // Check if order already exists
        const existing = await getShopifyOrderByShopifyId(order.id);
        if (existing) {
          continue;
        }

        // Import order
        await createShopifyOrder({
          shopifyOrderId: order.id,
          orderNumber: order.name.replace('#', ''),
          orderName: order.name,
          customerEmail: order.email,
          customerPhone: order.phone,
          customerFirstName: order.customer?.firstName,
          customerLastName: order.customer?.lastName,
          shippingAddress: order.shippingAddress,
          totalPrice: parseFloat(order.totalPriceSet?.shopMoney?.amount || '0'),
          subtotalPrice: parseFloat(order.subtotalPriceSet?.shopMoney?.amount || '0'),
          totalShipping: parseFloat(order.totalShippingPriceSet?.shopMoney?.amount || '0'),
          currencyCode: order.totalPriceSet?.shopMoney?.currencyCode || 'EGP',
          lineItems: order.lineItems?.edges?.map((item: any) => ({
            id: item.node.id,
            title: item.node.title,
            quantity: item.node.quantity,
            sku: item.node.variant?.sku,
            price: item.node.variant?.price,
            variantId: item.node.variant?.id,
          })),
          financialStatus: order.displayFinancialStatus,
          fulfillmentStatus: order.displayFulfillmentStatus,
          shopifyCreatedAt: new Date(order.createdAt),
          shopifyUpdatedAt: new Date(order.updatedAt),
        });

        imported++;
      }

      return {
        success: true,
        imported,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        imported: 0,
      };
    }
  }),

  /**
   * Sync inventory to Shopify
   */
  syncInventoryToShopify: protectedProcedure
    .input(
      z.object({
        localProductId: z.number(),
        quantity: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await syncInventoryToShopify(input.localProductId, input.quantity);
      return result;
    }),

  /**
   * Bulk sync inventory from Shopify
   */
  bulkSyncInventory: protectedProcedure.mutation(async () => {
    const result = await bulkSyncInventoryFromShopify();
    return result;
  }),

  /**
   * Get inventory sync status
   */
  getInventorySyncStatus: protectedProcedure.query(async () => {
    const status = await getInventorySyncStatus();
    return {
      success: true,
      status,
    };
  }),
});
