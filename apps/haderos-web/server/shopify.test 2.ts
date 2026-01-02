/**
 * Shopify API Integration Test
 *
 * Validates Shopify credentials by testing connection
 */

import { describe, it, expect } from 'vitest';
import { shopifyAPI } from './integrations/shopify-api';

describe('Shopify API Integration', () => {
  it('should successfully connect to Shopify store with valid credentials', async () => {
    const result = await shopifyAPI.testConnection();

    expect(result.success).toBe(true);
    expect(result.storeName).toBeTruthy();
    expect(result.storeName.length).toBeGreaterThan(0);

    console.log(`✅ Connected to Shopify store: ${result.storeName}`);
  }, 15000); // 15 second timeout

  it('should retrieve store information', async () => {
    const result = await shopifyAPI.testConnection();

    if (!result.success) {
      throw new Error(`Shopify connection failed: ${result.error}`);
    }

    expect(result.storeName).toContain('HADER');
  });
});
