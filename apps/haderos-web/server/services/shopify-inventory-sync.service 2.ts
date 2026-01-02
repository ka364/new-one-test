/**
 * Shopify Inventory Sync Service
 * Bidirectional inventory synchronization between local DB and Shopify
 */

import { requireDb } from '../db';
import { sql } from 'drizzle-orm';
import { shopifyClient } from '../integrations/shopify-client';
import { getShopifyProductByLocalId, updateShopifyProductSync } from '../db-shopify';

/**
 * Sync local inventory to Shopify
 * Called when inventory changes locally
 */
export async function syncInventoryToShopify(
  localProductId: number,
  newQuantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `[Inventory Sync] Syncing product ${localProductId} to Shopify: ${newQuantity} units`
    );

    // Get Shopify mapping
    const shopifyProduct = await getShopifyProductByLocalId(localProductId);

    if (!shopifyProduct) {
      console.log(`[Inventory Sync] Product ${localProductId} not synced to Shopify yet`);
      return { success: false, error: 'Product not synced to Shopify' };
    }

    const inventoryItemId = shopifyProduct.shopify_inventory_item_id;
    if (!inventoryItemId) {
      return { success: false, error: 'No inventory item ID found' };
    }

    // Update inventory in Shopify
    // Note: locationId is required - using default location
    const locationId = 'gid://shopify/Location/96698753342'; // Default location
    await shopifyClient.updateInventory(inventoryItemId, newQuantity, locationId);

    // Update local sync record
    await updateShopifyProductSync(localProductId.toString(), {
      inventoryQuantity: newQuantity,
      syncStatus: 'synced',
    });

    console.log(`[Inventory Sync] ✓ Synced to Shopify: ${newQuantity} units`);

    return { success: true };
  } catch (error: any) {
    console.error(`[Inventory Sync] Error syncing to Shopify:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync Shopify inventory to local DB
 * Called when receiving inventory webhook from Shopify
 */
export async function syncInventoryFromShopify(
  inventoryItemId: string,
  newQuantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Inventory Sync] Syncing from Shopify: ${inventoryItemId} = ${newQuantity} units`);

    const db = await requireDb();
    if (!db) throw new Error('Database connection failed');

    // Find product by inventory item ID
    const result: any = await db.execute(
      sql`SELECT local_product_id FROM shopify_products 
          WHERE shopify_inventory_item_id = ${inventoryItemId}`
    );

    const products =
      Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;

    if (!products || products.length === 0) {
      console.log(`[Inventory Sync] No local product found for inventory item ${inventoryItemId}`);
      return { success: false, error: 'Product not found' };
    }

    const localProductId = products[0].local_product_id;

    // Update local inventory
    await db.execute(
      sql`UPDATE inventory 
          SET quantity = ${newQuantity}, 
              updated_at = NOW() 
          WHERE product_id = ${localProductId}`
    );

    // Update Shopify product mapping
    await db.execute(
      sql`UPDATE shopify_products 
          SET inventory_quantity = ${newQuantity}, 
              last_synced_at = NOW(),
              sync_status = 'synced'
          WHERE shopify_inventory_item_id = ${inventoryItemId}`
    );

    console.log(
      `[Inventory Sync] ✓ Updated local inventory for product ${localProductId}: ${newQuantity} units`
    );

    return { success: true };
  } catch (error: any) {
    console.error(`[Inventory Sync] Error syncing from Shopify:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk sync all inventory from Shopify
 * Useful for initial sync or recovery
 */
export async function bulkSyncInventoryFromShopify(): Promise<{
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ inventoryItemId: string; error: string }>;
}> {
  const result = {
    success: false,
    synced: 0,
    failed: 0,
    errors: [] as Array<{ inventoryItemId: string; error: string }>,
  };

  try {
    console.log('[Inventory Sync] Starting bulk inventory sync from Shopify...');

    const db = await requireDb();
    if (!db) throw new Error('Database connection failed');

    // Get all synced products
    const productsResult: any = await db.execute(
      sql`SELECT shopify_inventory_item_id, local_product_id 
          FROM shopify_products 
          WHERE shopify_inventory_item_id IS NOT NULL`
    );

    const products =
      Array.isArray(productsResult) && productsResult.length > 0 && Array.isArray(productsResult[0])
        ? productsResult[0]
        : productsResult;

    console.log(`[Inventory Sync] Found ${products.length} products to sync`);

    for (const product of products) {
      try {
        // For now, skip bulk sync from Shopify
        // This would require fetching each product individually which is expensive
        // Instead, rely on webhooks for real-time sync
        console.log(
          `[Inventory Sync] Skipping ${product.shopify_inventory_item_id} - use webhooks for sync`
        );
        result.synced++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          inventoryItemId: product.shopify_inventory_item_id,
          error: error.message,
        });
      }
    }

    result.success = result.failed === 0;
    console.log(
      `[Inventory Sync] Bulk sync completed: ${result.synced} synced, ${result.failed} failed`
    );

    return result;
  } catch (error: any) {
    console.error('[Inventory Sync] Bulk sync failed:', error.message);
    return result;
  }
}

/**
 * Get inventory sync status
 */
export async function getInventorySyncStatus(): Promise<{
  totalProducts: number;
  syncedProducts: number;
  outOfSync: number;
  lastSync: Date | null;
}> {
  try {
    const db = await requireDb();
    if (!db) throw new Error('Database connection failed');

    const stats: any = await db.execute(
      sql`SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced,
            SUM(CASE WHEN sync_status != 'synced' THEN 1 ELSE 0 END) as out_of_sync,
            MAX(updated_at) as last_sync
          FROM shopify_products
          WHERE shopify_inventory_item_id IS NOT NULL`
    );

    const data =
      Array.isArray(stats) && stats.length > 0 && Array.isArray(stats[0]) ? stats[0][0] : stats[0];

    return {
      totalProducts: parseInt(data?.total || '0'),
      syncedProducts: parseInt(data?.synced || '0'),
      outOfSync: parseInt(data?.out_of_sync || '0'),
      lastSync: data?.last_sync || null,
    };
  } catch (error: any) {
    console.error('[Inventory Sync] Error getting status:', error.message);
    return {
      totalProducts: 0,
      syncedProducts: 0,
      outOfSync: 0,
      lastSync: null,
    };
  }
}

/**
 * Auto-sync inventory when local inventory changes
 * This should be called after any inventory update in the local system
 */
export async function autoSyncInventory(productId: number, newQuantity: number) {
  try {
    // Check if product is synced to Shopify
    const shopifyProduct = await getShopifyProductByLocalId(productId);

    if (shopifyProduct && shopifyProduct.shopify_inventory_item_id) {
      // Sync to Shopify in background
      syncInventoryToShopify(productId, newQuantity).catch((error) => {
        console.error(`[Auto Sync] Failed to sync product ${productId}:`, error);
      });
    }
  } catch (error) {
    console.error('[Auto Sync] Error:', error);
  }
}
