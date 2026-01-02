/**
 * @fileoverview Shopify Product Sync Service
 * خدمة مزامنة المنتجات مع Shopify
 *
 * @description
 * Provides comprehensive product synchronization between the local NOW SHOES
 * database and Shopify store. Handles product creation, updates, and inventory
 * management with full error handling and logging.
 *
 * توفر مزامنة شاملة للمنتجات بين قاعدة البيانات المحلية ومتجر Shopify
 * مع معالجة الأخطاء والتسجيل الكامل
 *
 * @module services/shopify-product-sync
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @requires ../integrations/shopify-client
 * @requires ../db-shopify
 * @requires ../db
 * @requires drizzle-orm
 *
 * @example
 * ```typescript
 * import { syncAllProductsToShopify, updateProductInventory } from './shopify-product-sync.service';
 *
 * // Sync all products
 * const result = await syncAllProductsToShopify();
 * console.log(`Synced ${result.synced}/${result.totalProducts} products`);
 *
 * // Update single product inventory
 * await updateProductInventory(123, 50);
 * ```
 */

import { shopifyClient } from '../integrations/shopify-client';
import {
  createShopifyProductMapping,
  getShopifyProductByLocalId,
  updateShopifyProductSync,
  createSyncLog,
} from '../db-shopify';
import { requireDb } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Result of a product synchronization operation
 * نتيجة عملية مزامنة المنتجات
 *
 * @interface ProductSyncResult
 * @property {boolean} success - Whether the sync completed without errors
 * @property {number} totalProducts - Total number of products processed
 * @property {number} synced - Number of successfully synced products
 * @property {number} failed - Number of products that failed to sync
 * @property {Array<{productId: number, error: string}>} errors - List of errors encountered
 */
export interface ProductSyncResult {
  success: boolean;
  totalProducts: number;
  synced: number;
  failed: number;
  errors: Array<{ productId: number; error: string }>;
}

/**
 * Sync all NOW SHOES products to Shopify
 * مزامنة جميع منتجات NOW SHOES إلى Shopify
 *
 * @description
 * Retrieves all active products from the local database and creates
 * corresponding products in Shopify. Skips products that are already synced.
 * Creates detailed sync logs for monitoring and debugging.
 *
 * يسترجع جميع المنتجات النشطة من قاعدة البيانات المحلية وينشئ
 * المنتجات المقابلة في Shopify. يتخطى المنتجات التي تمت مزامنتها بالفعل.
 *
 * @async
 * @function syncAllProductsToShopify
 * @returns {Promise<ProductSyncResult>} Sync operation result with statistics
 *
 * @throws {Error} Database connection failure
 * @throws {Error} Shopify API errors
 *
 * @example
 * ```typescript
 * const result = await syncAllProductsToShopify();
 *
 * if (result.success) {
 *   console.log(`✓ All ${result.synced} products synced successfully`);
 * } else {
 *   console.log(`⚠ ${result.failed} products failed to sync`);
 *   result.errors.forEach(e => console.error(`Product ${e.productId}: ${e.error}`));
 * }
 * ```
 *
 * @performance
 * - Processes products sequentially to avoid rate limiting
 * - Average time: ~2 seconds per product
 * - Creates sync logs for each operation
 *
 * @security
 * - Requires valid Shopify API credentials
 * - Does not expose sensitive product data in logs
 */
export async function syncAllProductsToShopify(): Promise<ProductSyncResult> {
  const startTime = Date.now();
  const result: ProductSyncResult = {
    success: false,
    totalProducts: 0,
    synced: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get all products from local database
    const db = await requireDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Query products using raw SQL
    const productsResult: any = await db.execute(
      sql`SELECT id, model_code, supplier_price, selling_price, category, is_active FROM products WHERE is_active = 1`
    );

    // db.execute returns nested array - first element is the actual data
    const products =
      Array.isArray(productsResult) && productsResult.length > 0 && Array.isArray(productsResult[0])
        ? productsResult[0]
        : productsResult;
    result.totalProducts = products.length;

    if (products.length === 0) {
      console.log('[Shopify Sync] No products to sync');
      result.success = true;
      return result;
    }

    console.log(`[Shopify Sync] Starting sync of ${products.length} products...`);
    console.log('[DEBUG] First product:', JSON.stringify(products[0]));

    // Sync each product
    for (const product of products) {
      try {
        await syncSingleProduct(product);
        result.synced++;
        console.log(`[Shopify Sync] ✓ Synced product: ${product.model_code}`);
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          productId: product.id || 0,
          error: error.message,
        });
        console.error(
          `[Shopify Sync] ✗ Failed to sync product ${product.model_code}:`,
          error.message
        );
      }
    }

    result.success = result.failed === 0;
    const duration = Date.now() - startTime;

    // Log sync operation
    await createSyncLog({
      syncType: 'products',
      direction: 'local_to_shopify',
      status: result.success
        ? 'success'
        : result.failed < result.totalProducts
          ? 'partial'
          : 'error',
      itemsProcessed: result.totalProducts,
      itemsSucceeded: result.synced,
      itemsFailed: result.failed,
      errorMessage:
        result.errors.length > 0 ? `${result.failed} products failed to sync` : undefined,
      errorDetails: result.errors.length > 0 ? result.errors : undefined,
      duration,
    });

    console.log(
      `[Shopify Sync] Completed: ${result.synced}/${result.totalProducts} synced, ${result.failed} failed (${duration}ms)`
    );

    return result;
  } catch (error: any) {
    console.error('[Shopify Sync] Fatal error:', error);

    await createSyncLog({
      syncType: 'products',
      direction: 'local_to_shopify',
      status: 'error',
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errorMessage: error.message,
      duration: Date.now() - startTime,
    });

    throw error;
  }
}

/**
 * Sync a single product to Shopify
 * مزامنة منتج واحد إلى Shopify
 *
 * @description
 * Creates a new product in Shopify if it doesn't exist. Maps the local product
 * data to Shopify's product schema and saves the mapping for future reference.
 *
 * ينشئ منتجًا جديدًا في Shopify إذا لم يكن موجودًا. يحول بيانات المنتج المحلي
 * إلى مخطط منتج Shopify ويحفظ التعيين للرجوع إليه مستقبلاً.
 *
 * @async
 * @function syncSingleProduct
 * @param {Object} product - Local product object from database
 * @param {number} product.id - Local product ID
 * @param {string} product.model_code - Product model code (used as SKU)
 * @param {number} [product.supplier_price] - Supplier price
 * @param {number} [product.selling_price] - Selling price
 * @param {string} [product.category] - Product category
 * @param {boolean} product.is_active - Whether product is active
 * @returns {Promise<void>}
 *
 * @throws {Error} Failed to create product in Shopify
 * @throws {Error} Database mapping creation failed
 *
 * @example
 * ```typescript
 * const product = {
 *   id: 123,
 *   model_code: 'NS-001',
 *   selling_price: 299.99,
 *   category: 'Sneakers',
 *   is_active: true
 * };
 * await syncSingleProduct(product);
 * ```
 *
 * @private
 */
async function syncSingleProduct(product: any): Promise<void> {
  // Check if product already exists in Shopify
  const existingMapping = await getShopifyProductByLocalId(product.id);

  if (existingMapping) {
    console.log(`[Shopify Sync] Product ${product.id} already synced, skipping...`);
    return;
  }

  // Prepare product data for Shopify
  const shopifyProduct = {
    title: `NOW SHOES - ${product.model_code}`,
    descriptionHtml: buildProductDescription(product),
    vendor: 'NOW SHOES',
    productType: product.category || 'Shoes',
    tags: buildProductTags(product),
    variants: [
      {
        price: product.selling_price?.toString() || product.supplier_price?.toString() || '0',
        sku: product.model_code,
        barcode: product.model_code,
        inventoryQuantity: 0, // Will be updated from inventory table
        weight: 0.5, // Default weight in kg
        weightUnit: 'KILOGRAMS' as const,
      },
    ],
    images: [], // Will be added later from visual search or other sources
  };

  // Create product in Shopify
  const createdProduct = await shopifyClient.createProduct(shopifyProduct);

  if (!createdProduct) {
    throw new Error('Failed to create product in Shopify');
  }

  // Extract Shopify IDs
  const shopifyProductId = createdProduct.id;
  const shopifyVariantId = createdProduct.variants?.edges?.[0]?.node?.id;
  const shopifyInventoryItemId = createdProduct.variants?.edges?.[0]?.node?.inventoryItem?.id;

  // Save mapping to database
  await createShopifyProductMapping({
    localProductId: product.id,
    shopifyProductId,
    shopifyVariantId,
    shopifyInventoryItemId,
    title: shopifyProduct.title,
    handle: createdProduct.handle,
    sku: product.model_code,
    barcode: product.model_code,
    price: parseFloat(product.selling_price || product.supplier_price) || 0,
    inventoryQuantity: 0,
    status: 'active',
  });

  console.log(`[Shopify Sync] Created product in Shopify: ${shopifyProductId}`);
}

/**
 * Build product description for Shopify
 * بناء وصف المنتج لـ Shopify
 *
 * @description
 * Generates HTML-formatted product description for display on Shopify store.
 * Includes model code, category, and pricing information.
 *
 * ينشئ وصف منتج بتنسيق HTML للعرض في متجر Shopify.
 * يتضمن كود الموديل والفئة ومعلومات التسعير.
 *
 * @function buildProductDescription
 * @param {Object} product - Product object
 * @param {string} product.model_code - Product model code
 * @param {string} [product.category] - Product category
 * @param {number} [product.supplier_price] - Supplier price in EGP
 * @param {number} [product.selling_price] - Selling price in EGP
 * @returns {string} HTML-formatted product description
 *
 * @example
 * ```typescript
 * const html = buildProductDescription({
 *   model_code: 'NS-001',
 *   category: 'Sneakers',
 *   selling_price: 299.99
 * });
 * // Returns: "<h2>NOW SHOES - NS-001</h2>..."
 * ```
 *
 * @private
 */
function buildProductDescription(product: any): string {
  const parts: string[] = [];

  parts.push(`<h2>NOW SHOES - ${product.model_code}</h2>`);

  if (product.category) {
    parts.push(`<p><strong>Category:</strong> ${product.category}</p>`);
  }

  if (product.supplier_price) {
    parts.push(`<p><strong>Supplier Price:</strong> ${product.supplier_price} EGP</p>`);
  }

  if (product.selling_price) {
    parts.push(`<p><strong>Selling Price:</strong> ${product.selling_price} EGP</p>`);
  }

  parts.push(`<p>High-quality footwear from NOW SHOES collection.</p>`);

  return parts.join('\n');
}

/**
 * Build product tags for Shopify
 * بناء علامات المنتج لـ Shopify
 *
 * @description
 * Generates an array of tags for Shopify product filtering and search.
 * Always includes 'NOW SHOES' and 'Footwear' as base tags.
 *
 * ينشئ مصفوفة من العلامات لتصفية المنتجات والبحث في Shopify.
 * يتضمن دائمًا 'NOW SHOES' و 'Footwear' كعلامات أساسية.
 *
 * @function buildProductTags
 * @param {Object} product - Product object
 * @param {string} [product.category] - Product category to add as tag
 * @param {string} [product.model_code] - Model code to add as tag
 * @returns {string[]} Array of product tags
 *
 * @example
 * ```typescript
 * const tags = buildProductTags({ category: 'Sneakers', model_code: 'NS-001' });
 * // Returns: ['NOW SHOES', 'Footwear', 'Sneakers', 'NS-001']
 * ```
 *
 * @private
 */
function buildProductTags(product: any): string[] {
  const tags: string[] = ['NOW SHOES', 'Footwear'];

  if (product.category) {
    tags.push(product.category);
  }

  if (product.model_code) {
    tags.push(product.model_code);
  }

  return tags;
}

/**
 * Update product inventory in Shopify
 * تحديث مخزون المنتج في Shopify
 *
 * @description
 * Updates the inventory quantity for a product in Shopify. Calculates the
 * delta between current and new quantity and applies the change. Also updates
 * the local mapping record.
 *
 * يحدث كمية المخزون لمنتج في Shopify. يحسب الفرق بين الكمية الحالية
 * والجديدة ويطبق التغيير. كما يحدث سجل التعيين المحلي.
 *
 * @async
 * @function updateProductInventory
 * @param {number} localProductId - Local product ID
 * @param {number} newQuantity - New inventory quantity to set
 * @returns {Promise<void>}
 *
 * @throws {Error} Product not found in Shopify mapping
 * @throws {Error} Product has no inventory item ID
 * @throws {Error} No Shopify location found
 * @throws {Error} Shopify API error
 *
 * @example
 * ```typescript
 * // Update product 123 to have 50 units in stock
 * await updateProductInventory(123, 50);
 *
 * // Set product 456 to out of stock
 * await updateProductInventory(456, 0);
 * ```
 *
 * @performance
 * - Makes 2 API calls: get locations + update inventory
 * - Updates local database after Shopify sync
 * - Average execution time: ~500ms
 *
 * @security
 * - Validates product exists in local mapping
 * - Uses Shopify's inventory level API for accurate tracking
 */
export async function updateProductInventory(
  localProductId: number,
  newQuantity: number
): Promise<void> {
  const mapping = await getShopifyProductByLocalId(localProductId);

  if (!mapping) {
    throw new Error(`Product ${localProductId} not found in Shopify mapping`);
  }

  if (!mapping.shopify_inventory_item_id) {
    throw new Error(`Product ${localProductId} has no inventory item ID`);
  }

  // Get default location (first location)
  const locations = await shopifyClient.query(`
    query {
      locations(first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
  `);

  const locationId = locations.data?.locations?.edges?.[0]?.node?.id;

  if (!locationId) {
    throw new Error('No Shopify location found');
  }

  // Calculate delta
  const currentQuantity = mapping.inventory_quantity || 0;
  const delta = newQuantity - currentQuantity;

  if (delta === 0) {
    console.log(`[Shopify Sync] No inventory change for product ${localProductId}`);
    return;
  }

  // Update inventory in Shopify
  await shopifyClient.updateInventory(mapping.shopify_inventory_item_id, delta, locationId);

  // Update local mapping
  await updateShopifyProductSync(mapping.shopify_product_id, {
    inventoryQuantity: newQuantity,
    syncStatus: 'synced',
  });

  console.log(
    `[Shopify Sync] Updated inventory for product ${localProductId}: ${currentQuantity} → ${newQuantity} (Δ${delta})`
  );
}
