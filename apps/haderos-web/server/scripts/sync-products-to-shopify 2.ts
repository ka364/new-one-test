/**
 * Sync NOW SHOES Products to Shopify
 * One-time script to push all products to Shopify store
 */

import { syncAllProductsToShopify } from '../services/shopify-product-sync.service';

async function main() {
  console.log('🚀 Starting product sync to Shopify...\n');

  try {
    const result = await syncAllProductsToShopify();

    console.log('\n📊 Sync Results:');
    console.log('================');
    console.log(`Total Products: ${result.totalProducts}`);
    console.log(`✅ Synced: ${result.synced}`);
    console.log(`❌ Failed: ${result.failed}`);
    console.log(`Success Rate: ${((result.synced / result.totalProducts) * 100).toFixed(1)}%`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error) => {
        console.log(`  - Product ${error.productId}: ${error.error}`);
      });
    }

    if (result.success) {
      console.log('\n✅ All products synced successfully!');
    } else {
      console.log('\n⚠️ Some products failed to sync. Check errors above.');
    }

    process.exit(result.success ? 0 : 1);
  } catch (error: any) {
    console.error('\n❌ Fatal error during sync:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
