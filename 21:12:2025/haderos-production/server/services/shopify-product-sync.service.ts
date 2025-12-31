/**
 * Shopify Product Sync Service
 * Syncs NOW SHOES products to Shopify store
 */

import { shopifyClient } from "../integrations/shopify-client";
import {
  createShopifyProductMapping,
  getShopifyProductByLocalId,
  updateShopifyProductSync,
  createSyncLog,
} from "../db-shopify";
import { requireDb } from "../db";
import { sql } from "drizzle-orm";

export interface ProductSyncResult {
  success: boolean;
  totalProducts: number;
  synced: number;
  failed: number;
  errors: Array<{ productId: number; error: string }>;
}

/**
 * Sync all NOW SHOES products to Shopify
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
      throw new Error("Database connection failed");
    }

    // Query products using raw SQL
    const productsResult: any = await db.execute(
      sql`SELECT id, model_code, supplier_price, selling_price, category, is_active FROM products WHERE is_active = 1`
    );

    // db.execute returns nested array - first element is the actual data
    const products = Array.isArray(productsResult) && productsResult.length > 0 && Array.isArray(productsResult[0]) 
      ? productsResult[0] 
      : productsResult;
    result.totalProducts = products.length;

    if (products.length === 0) {
      console.log("[Shopify Sync] No products to sync");
      result.success = true;
      return result;
    }

    console.log(`[Shopify Sync] Starting sync of ${products.length} products...`);
    console.log("[DEBUG] First product:", JSON.stringify(products[0]));

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
        console.error(`[Shopify Sync] ✗ Failed to sync product ${product.model_code}:`, error.message);
      }
    }

    result.success = result.failed === 0;
    const duration = Date.now() - startTime;

    // Log sync operation
    await createSyncLog({
      syncType: "products",
      direction: "local_to_shopify",
      status: result.success ? "success" : result.failed < result.totalProducts ? "partial" : "error",
      itemsProcessed: result.totalProducts,
      itemsSucceeded: result.synced,
      itemsFailed: result.failed,
      errorMessage: result.errors.length > 0 ? `${result.failed} products failed to sync` : undefined,
      errorDetails: result.errors.length > 0 ? result.errors : undefined,
      duration,
    });

    console.log(
      `[Shopify Sync] Completed: ${result.synced}/${result.totalProducts} synced, ${result.failed} failed (${duration}ms)`
    );

    return result;
  } catch (error: any) {
    console.error("[Shopify Sync] Fatal error:", error);
    
    await createSyncLog({
      syncType: "products",
      direction: "local_to_shopify",
      status: "error",
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
    vendor: "NOW SHOES",
    productType: product.category || "Shoes",
    tags: buildProductTags(product),
    variants: [
      {
        price: product.selling_price?.toString() || product.supplier_price?.toString() || "0",
        sku: product.model_code,
        barcode: product.model_code,
        inventoryQuantity: 0, // Will be updated from inventory table
        weight: 0.5, // Default weight in kg
        weightUnit: "KILOGRAMS" as const,
      },
    ],
    images: [], // Will be added later from visual search or other sources
  };

  // Create product in Shopify
  const createdProduct = await shopifyClient.createProduct(shopifyProduct);

  if (!createdProduct) {
    throw new Error("Failed to create product in Shopify");
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
    status: "active",
  });

  console.log(`[Shopify Sync] Created product in Shopify: ${shopifyProductId}`);
}

/**
 * Build product description for Shopify
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

  return parts.join("\n");
}

/**
 * Build product tags for Shopify
 */
function buildProductTags(product: any): string[] {
  const tags: string[] = ["NOW SHOES", "Footwear"];

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
    throw new Error("No Shopify location found");
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
    syncStatus: "synced",
  });

  console.log(
    `[Shopify Sync] Updated inventory for product ${localProductId}: ${currentQuantity} → ${newQuantity} (Δ${delta})`
  );
}
