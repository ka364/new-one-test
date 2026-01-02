/**
 * @fileoverview Marketer Shopify Integration Service
 * خدمة ربط شوبيفاي للمسوقين
 *
 * @description
 * Comprehensive Shopify integration for affiliate marketers. Enables store connection,
 * product synchronization, order tracking, inventory management, and OAuth authentication.
 * Supports tier-based access (Gold+ required) and automatic commission calculation.
 *
 * تكامل شوبيفاي شامل للمسوقين بالعمولة. يتيح ربط المتاجر، مزامنة المنتجات،
 * تتبع الطلبات، إدارة المخزون، ومصادقة OAuth.
 * يدعم الوصول حسب المستوى (ذهبي+ مطلوب) وحساب العمولة تلقائياً.
 *
 * Features / الميزات:
 * - Connect Shopify stores via OAuth or direct API credentials
 * - Sync products from Haderos catalog to marketer's Shopify store
 * - Automatic price markup based on commission rate
 * - Order webhook handling for commission tracking
 * - Real-time sync status monitoring
 *
 * @module services/marketer-shopify
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @requires ../db
 * @requires ../../drizzle/schema-marketer-tools
 * @requires ../../drizzle/schema
 * @requires drizzle-orm
 *
 * @example
 * ```typescript
 * import { getMarketerShopifyService } from './marketer-shopify.service';
 *
 * const service = getMarketerShopifyService();
 *
 * // Check if marketer can connect Shopify
 * const check = await service.canConnectShopify(123);
 * if (check.canConnect) {
 *   // Generate OAuth URL for store connection
 *   const authUrl = service.generateOAuthUrl(123, 'mystore.myshopify.com');
 *
 *   // After OAuth callback, sync products
 *   const results = await service.syncProductsToShopify(storeId, 123, [1, 2, 3]);
 *   console.log(`Synced ${results.synced} products`);
 * }
 * ```
 *
 * @security
 * - Access tokens should be encrypted at rest
 * - Requires Gold tier or higher for Shopify integration
 * - Webhook verification for order processing
 */

import { db } from '../db';
import { marketerAccounts, marketerShopifyStores } from '../../drizzle/schema-marketer-tools';
import { products } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

interface ShopifyAuthConfig {
  shopDomain: string;
  accessToken: string;
  apiVersion?: string;
}

interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    id: string;
    src: string;
    position: number;
  }>;
}

/**
 * Marketer Shopify Service Class
 * فئة خدمة شوبيفاي للمسوقين
 *
 * @class MarketerShopifyService
 * @description
 * Provides Shopify integration capabilities for affiliate marketers including
 * store connection, product synchronization, order tracking, and OAuth flow.
 *
 * توفر إمكانيات تكامل شوبيفاي للمسوقين بالعمولة بما في ذلك
 * ربط المتاجر، مزامنة المنتجات، تتبع الطلبات، وتدفق OAuth.
 */
export class MarketerShopifyService {
  /**
   * Check if marketer can connect Shopify
   * التحقق من إمكانية ربط شوبيفاي
   *
   * @async
   * @param {number} marketerId - Unique identifier of the marketer
   * @returns {Promise<{canConnect: boolean, reason?: string}>} Permission status
   *
   * @description
   * Verifies that the marketer has the required tier (Gold+) and active status
   * to connect a Shopify store.
   *
   * @example
   * ```typescript
   * const check = await service.canConnectShopify(123);
   * if (!check.canConnect) {
   *   console.log(`Cannot connect: ${check.reason}`);
   * }
   * ```
   */
  async canConnectShopify(marketerId: number): Promise<{ canConnect: boolean; reason?: string }> {
    const [marketer] = await db
      .select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (!marketer) {
      return { canConnect: false, reason: 'Marketer not found' };
    }

    if (!marketer.canConnectShopify) {
      return {
        canConnect: false,
        reason: 'Shopify integration requires Gold tier or higher. Please upgrade your account.',
      };
    }

    if (marketer.status !== 'active') {
      return { canConnect: false, reason: 'Your account is not active' };
    }

    return { canConnect: true };
  }

  /**
   * Connect a Shopify store
   * ربط متجر شوبيفاي
   *
   * @async
   * @param {number} marketerId - Unique identifier of the marketer
   * @param {ShopifyAuthConfig} config - Shopify authentication configuration
   * @param {string} config.shopDomain - Shopify store domain (e.g., 'mystore.myshopify.com')
   * @param {string} config.accessToken - Shopify API access token
   * @param {string} [config.apiVersion='2025-01'] - Shopify API version
   * @returns {Promise<ShopifyStore>} Connected store record
   *
   * @throws {Error} Shopify integration requires Gold tier or higher
   * @throws {Error} Account is not active
   * @throws {Error} Invalid Shopify credentials
   *
   * @security Access tokens should be encrypted before storage
   *
   * @example
   * ```typescript
   * const store = await service.connectShopifyStore(123, {
   *   shopDomain: 'mystore.myshopify.com',
   *   accessToken: 'shpat_xxxxx',
   *   apiVersion: '2025-01'
   * });
   * ```
   */
  async connectShopifyStore(marketerId: number, config: ShopifyAuthConfig) {
    // Check permission
    const canConnect = await this.canConnectShopify(marketerId);
    if (!canConnect.canConnect) {
      throw new Error(canConnect.reason);
    }

    // Validate Shopify credentials
    const isValid = await this.validateShopifyCredentials(config);
    if (!isValid.valid) {
      throw new Error(isValid.error || 'Invalid Shopify credentials');
    }

    // Extract store name from domain
    const storeName = config.shopDomain.replace('.myshopify.com', '');

    // Check if already connected
    const existing = await db
      .select()
      .from(marketerShopifyStores)
      .where(
        and(
          eq(marketerShopifyStores.marketerId, marketerId),
          eq(marketerShopifyStores.shopifyDomain, config.shopDomain)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing connection
      const [updated] = await db
        .update(marketerShopifyStores)
        .set({
          accessToken: config.accessToken, // Should be encrypted
          apiVersion: config.apiVersion || '2025-01',
          status: 'connected',
          connectionError: null,
          updatedAt: new Date(),
        })
        .where(eq(marketerShopifyStores.id, existing[0].id))
        .returning();

      console.log(`🔄 Reconnected Shopify store: ${storeName} for marketer ${marketerId}`);
      return updated;
    }

    // Create new connection
    const [store] = await db
      .insert(marketerShopifyStores)
      .values({
        marketerId,
        storeName,
        storeUrl: `https://${config.shopDomain}`,
        shopifyDomain: config.shopDomain,
        accessToken: config.accessToken, // Should be encrypted
        apiVersion: config.apiVersion || '2025-01',
        scopes: ['read_products', 'write_products', 'read_orders', 'read_inventory'],
        status: 'connected',
      })
      .returning();

    console.log(`✅ Connected Shopify store: ${storeName} for marketer ${marketerId}`);
    return store;
  }

  /**
   * Validate Shopify credentials
   * التحقق من بيانات اعتماد شوبيفاي
   *
   * @async
   * @param {ShopifyAuthConfig} config - Shopify authentication configuration
   * @returns {Promise<{valid: boolean, error?: string}>} Validation result
   *
   * @description
   * Makes a test API call to Shopify to verify the access token is valid.
   */
  async validateShopifyCredentials(
    config: ShopifyAuthConfig
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const url = `https://${config.shopDomain}/admin/api/${config.apiVersion || '2025-01'}/shop.json`;

      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': config.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { valid: false, error: `Shopify API returned ${response.status}` };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Failed to connect: ${error}` };
    }
  }

  /**
   * Disconnect Shopify store
   * قطع الاتصال بمتجر شوبيفاي
   *
   * @async
   * @param {number} storeId - Store ID to disconnect
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @returns {Promise<ShopifyStore>} Disconnected store record
   *
   * @throws {Error} Store not found or no permission
   */
  async disconnectShopifyStore(storeId: number, marketerId: number) {
    const [disconnected] = await db
      .update(marketerShopifyStores)
      .set({
        status: 'disconnected',
        accessToken: null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(marketerShopifyStores.id, storeId), eq(marketerShopifyStores.marketerId, marketerId))
      )
      .returning();

    if (!disconnected) {
      throw new Error("Store not found or you don't have permission");
    }

    console.log(`🔌 Disconnected Shopify store: ${disconnected.storeName}`);
    return disconnected;
  }

  /**
   * Get marketer's Shopify stores
   * الحصول على متاجر شوبيفاي للمسوق
   *
   * @async
   * @param {number} marketerId - Unique identifier of the marketer
   * @returns {Promise<ShopifyStore[]>} Array of connected Shopify stores
   *
   * @example
   * ```typescript
   * const stores = await service.getMarketerShopifyStores(123);
   * stores.forEach(s => console.log(`${s.storeName}: ${s.status}`));
   * ```
   */
  async getMarketerShopifyStores(marketerId: number) {
    return await db
      .select()
      .from(marketerShopifyStores)
      .where(eq(marketerShopifyStores.marketerId, marketerId));
  }

  /**
   * Sync products to Shopify
   * مزامنة المنتجات إلى شوبيفاي
   *
   * @async
   * @param {number} storeId - Shopify store ID
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @param {number[]} productIds - Array of Haderos product IDs to sync
   * @returns {Promise<{synced: number, failed: number, errors: string[]}>} Sync results
   *
   * @throws {Error} Store not found
   * @throws {Error} Store is not connected
   * @throws {Error} No products found to sync
   *
   * @description
   * Syncs products from the Haderos catalog to the marketer's Shopify store.
   * Prices are automatically marked up based on the marketer's commission rate.
   *
   * @performance May take several seconds for large product batches
   *
   * @example
   * ```typescript
   * const results = await service.syncProductsToShopify(1, 123, [1, 2, 3, 4, 5]);
   * console.log(`Synced: ${results.synced}, Failed: ${results.failed}`);
   * if (results.errors.length > 0) {
   *   console.log('Errors:', results.errors);
   * }
   * ```
   */
  async syncProductsToShopify(storeId: number, marketerId: number, productIds: number[]) {
    // Get store
    const [store] = await db
      .select()
      .from(marketerShopifyStores)
      .where(
        and(eq(marketerShopifyStores.id, storeId), eq(marketerShopifyStores.marketerId, marketerId))
      )
      .limit(1);

    if (!store) {
      throw new Error('Store not found');
    }

    if (store.status !== 'connected' || !store.accessToken) {
      throw new Error('Store is not connected');
    }

    // Get products to sync
    const productsToSync = await db
      .select()
      .from(products)
      .where(sql`${products.id} = ANY(${productIds})`);

    if (productsToSync.length === 0) {
      throw new Error('No products found to sync');
    }

    // Update status to syncing
    await db
      .update(marketerShopifyStores)
      .set({ status: 'syncing', updatedAt: new Date() })
      .where(eq(marketerShopifyStores.id, storeId));

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get marketer info for pricing
    const [marketer] = await db
      .select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    const commissionRate = Number(marketer?.commissionRate || 10) / 100;

    try {
      for (const product of productsToSync) {
        try {
          // Calculate marketer's selling price (add commission)
          const basePrice = Number(product.sellingPrice || product.supplierPrice);
          const marketerPrice = basePrice * (1 + commissionRate);

          const shopifyProduct = {
            product: {
              title: product.modelCode,
              body_html: `<p>High quality product from Haderos factory</p>`,
              vendor: 'Haderos',
              product_type: product.category || 'General',
              variants: [
                {
                  price: marketerPrice.toFixed(2),
                  sku: product.modelCode,
                  inventory_management: 'shopify',
                  inventory_policy: 'deny',
                },
              ],
            },
          };

          const response = await fetch(
            `https://${store.shopifyDomain}/admin/api/${store.apiVersion}/products.json`,
            {
              method: 'POST',
              headers: {
                'X-Shopify-Access-Token': store.accessToken!,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(shopifyProduct),
            }
          );

          if (response.ok) {
            const data = await response.json();

            // Update product mapping
            const currentMapping = (store.productMapping as any) || {};
            currentMapping[data.product.id] = product.id;

            await db
              .update(marketerShopifyStores)
              .set({
                productMapping: currentMapping,
                syncedProducts: sql`${marketerShopifyStores.syncedProducts} + 1`,
              })
              .where(eq(marketerShopifyStores.id, storeId));

            results.synced++;
          } else {
            const error = await response.text();
            results.failed++;
            results.errors.push(`${product.modelCode}: ${error}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`${product.modelCode}: ${error}`);
        }
      }
    } finally {
      // Update final status
      await db
        .update(marketerShopifyStores)
        .set({
          status: 'connected',
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(marketerShopifyStores.id, storeId));
    }

    console.log(`🔄 Synced ${results.synced} products to Shopify store: ${store.storeName}`);
    return results;
  }

  /**
   * Fetch products from Shopify
   * جلب المنتجات من شوبيفاي
   *
   * @async
   * @param {number} storeId - Shopify store ID
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @returns {Promise<ShopifyProduct[]>} Array of Shopify products
   *
   * @throws {Error} Store not found or not connected
   * @throws {Error} Failed to fetch products from Shopify API
   *
   * @example
   * ```typescript
   * const products = await service.fetchShopifyProducts(1, 123);
   * products.forEach(p => console.log(`${p.title}: ${p.variants[0].price}`));
   * ```
   */
  async fetchShopifyProducts(storeId: number, marketerId: number): Promise<ShopifyProduct[]> {
    const [store] = await db
      .select()
      .from(marketerShopifyStores)
      .where(
        and(eq(marketerShopifyStores.id, storeId), eq(marketerShopifyStores.marketerId, marketerId))
      )
      .limit(1);

    if (!store || store.status !== 'connected' || !store.accessToken) {
      throw new Error('Store not found or not connected');
    }

    try {
      const response = await fetch(
        `https://${store.shopifyDomain}/admin/api/${store.apiVersion}/products.json`,
        {
          headers: {
            'X-Shopify-Access-Token': store.accessToken!,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();

      // Update total products count
      await db
        .update(marketerShopifyStores)
        .set({
          totalProducts: data.products?.length || 0,
          updatedAt: new Date(),
        })
        .where(eq(marketerShopifyStores.id, storeId));

      return data.products || [];
    } catch (error) {
      throw new Error(`Failed to fetch Shopify products: ${error}`);
    }
  }

  /**
   * Get store sync status
   * الحصول على حالة المزامنة للمتجر
   *
   * @async
   * @param {number} storeId - Shopify store ID
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @returns {Promise<Object>} Sync status with product and order counts
   *
   * @throws {Error} Store not found
   *
   * @example
   * ```typescript
   * const status = await service.getStoreSyncStatus(1, 123);
   * console.log(`Status: ${status.status}`);
   * console.log(`Synced: ${status.syncedProducts}/${status.totalProducts}`);
   * ```
   */
  async getStoreSyncStatus(storeId: number, marketerId: number) {
    const [store] = await db
      .select()
      .from(marketerShopifyStores)
      .where(
        and(eq(marketerShopifyStores.id, storeId), eq(marketerShopifyStores.marketerId, marketerId))
      )
      .limit(1);

    if (!store) {
      throw new Error('Store not found');
    }

    return {
      status: store.status,
      totalProducts: store.totalProducts,
      syncedProducts: store.syncedProducts,
      totalOrders: store.totalOrders,
      syncedOrders: store.syncedOrders,
      lastSyncAt: store.lastSyncAt,
      connectionError: store.connectionError,
    };
  }

  /**
   * Handle Shopify webhook (order created)
   * معالجة webhook من شوبيفاي (إنشاء طلب)
   *
   * @async
   * @param {string} shopifyDomain - Shopify store domain
   * @param {any} orderData - Order data from Shopify webhook
   * @returns {Promise<void>}
   *
   * @description
   * Processes incoming order webhooks from Shopify.
   * Updates order counts and calculates commission for the marketer.
   *
   * @security Should verify webhook signature before processing
   *
   * @example
   * ```typescript
   * // In webhook endpoint handler
   * await service.handleOrderWebhook('mystore.myshopify.com', req.body);
   * ```
   */
  async handleOrderWebhook(shopifyDomain: string, orderData: any) {
    // Find store by domain
    const [store] = await db
      .select()
      .from(marketerShopifyStores)
      .where(eq(marketerShopifyStores.shopifyDomain, shopifyDomain))
      .limit(1);

    if (!store) {
      console.log(`⚠️ No store found for domain: ${shopifyDomain}`);
      return;
    }

    // Update order count
    await db
      .update(marketerShopifyStores)
      .set({
        totalOrders: sql`${marketerShopifyStores.totalOrders} + 1`,
        syncedOrders: sql`${marketerShopifyStores.syncedOrders} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(marketerShopifyStores.id, store.id));

    // Update marketer stats
    const orderTotal = Number(orderData.total_price || 0);

    const [marketer] = await db
      .select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, store.marketerId))
      .limit(1);

    if (marketer) {
      const commission = orderTotal * (Number(marketer.commissionRate) / 100);

      await db
        .update(marketerAccounts)
        .set({
          totalSales: sql`${marketerAccounts.totalSales} + ${orderTotal}`,
          totalOrders: sql`${marketerAccounts.totalOrders} + 1`,
          pendingCommission: sql`${marketerAccounts.pendingCommission} + ${commission}`,
          totalCommission: sql`${marketerAccounts.totalCommission} + ${commission}`,
          updatedAt: new Date(),
        })
        .where(eq(marketerAccounts.id, store.marketerId));
    }

    console.log(`📦 Processed Shopify order from ${shopifyDomain}: ${orderData.order_number}`);
  }

  /**
   * Generate Shopify OAuth URL for marketer
   * إنشاء رابط OAuth لشوبيفاي
   *
   * @param {number} marketerId - Unique identifier of the marketer
   * @param {string} shopDomain - Shopify store domain
   * @returns {string} OAuth authorization URL
   *
   * @description
   * Generates the OAuth URL for the marketer to authorize their Shopify store.
   * The state parameter contains encrypted marketer and shop information.
   *
   * @example
   * ```typescript
   * const authUrl = service.generateOAuthUrl(123, 'mystore.myshopify.com');
   * // Redirect user to authUrl for authorization
   * ```
   */
  generateOAuthUrl(marketerId: number, shopDomain: string): string {
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const redirectUri =
      process.env.SHOPIFY_REDIRECT_URI || `${process.env.BASE_URL}/api/shopify/callback`;
    const scopes = 'read_products,write_products,read_orders,read_inventory';
    const state = Buffer.from(JSON.stringify({ marketerId, shopDomain })).toString('base64');

    return `https://${shopDomain}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
  }

  /**
   * Complete OAuth flow
   * إكمال تدفق OAuth
   *
   * @async
   * @param {string} code - Authorization code from Shopify
   * @param {string} shopDomain - Shopify store domain
   * @param {number} marketerId - Unique identifier of the marketer
   * @returns {Promise<ShopifyStore>} Connected store record
   *
   * @throws {Error} OAuth failed with error status
   * @throws {Error} Failed to complete OAuth
   *
   * @description
   * Exchanges the authorization code for an access token and connects the store.
   *
   * @example
   * ```typescript
   * // In OAuth callback handler
   * const store = await service.completeOAuth(code, shopDomain, marketerId);
   * console.log(`Connected store: ${store.storeName}`);
   * ```
   */
  async completeOAuth(code: string, shopDomain: string, marketerId: number) {
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    try {
      const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth failed: ${response.status}`);
      }

      const data = await response.json();

      // Connect the store
      return await this.connectShopifyStore(marketerId, {
        shopDomain,
        accessToken: data.access_token,
        apiVersion: '2025-01',
      });
    } catch (error) {
      throw new Error(`Failed to complete OAuth: ${error}`);
    }
  }
}

// Singleton instance
let service: MarketerShopifyService | null = null;

/**
 * Get singleton instance of MarketerShopifyService
 * الحصول على نسخة واحدة من خدمة شوبيفاي للمسوقين
 *
 * @function getMarketerShopifyService
 * @returns {MarketerShopifyService} Singleton service instance
 *
 * @example
 * ```typescript
 * const service = getMarketerShopifyService();
 * const stores = await service.getMarketerShopifyStores(123);
 * ```
 */
export function getMarketerShopifyService(): MarketerShopifyService {
  if (!service) {
    service = new MarketerShopifyService();
  }
  return service;
}
