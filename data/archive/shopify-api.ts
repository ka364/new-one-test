/**
 * Shopify Admin API Client
 * 
 * Complete integration with Shopify REST Admin API for:
 * - Products management
 * - Inventory sync
 * - Orders import
 * - Fulfillments & tracking
 * - Webhooks management
 */

import axios, { AxiosInstance } from 'axios';

const SHOPIFY_STORE_NAME = process.env.SHOPIFY_STORE_NAME || '';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';
const SHOPIFY_API_VERSION = '2025-10';

const BASE_URL = `https://${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}`;

// ============================================
// TYPES
// ============================================

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  tags: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string;
  barcode: string;
  inventory_quantity: number;
  inventory_item_id: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  src: string;
  alt: string | null;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string; // e.g., "#1001"
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_shipping: string;
  currency: string;
  financial_status: 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided';
  fulfillment_status: 'fulfilled' | 'partial' | 'unfulfilled' | 'restocked' | null;
  customer: ShopifyCustomer;
  shipping_address: ShopifyAddress;
  line_items: ShopifyLineItem[];
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
}

export interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
}

export interface ShopifyFulfillment {
  id: number;
  order_id: number;
  status: string;
  tracking_number: string;
  tracking_company: string;
  tracking_url: string;
  line_items: Array<{ id: number }>;
}

export interface ShopifyWebhook {
  id: number;
  topic: string;
  address: string;
  format: 'json' | 'xml';
  created_at: string;
}

// ============================================
// SHOPIFY API CLIENT
// ============================================

class ShopifyAPI {
  private client: AxiosInstance;

  constructor() {
    if (!SHOPIFY_STORE_NAME || !SHOPIFY_ACCESS_TOKEN) {
      throw new Error('Shopify credentials not configured. Set SHOPIFY_STORE_NAME and SHOPIFY_ACCESS_TOKEN.');
    }

    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  // ============================================
  // PRODUCTS API
  // ============================================

  /**
   * Get all products (paginated)
   * @param limit Max 250 per page
   * @param pageInfo Pagination cursor from previous response
   */
  async getProducts(limit = 250, pageInfo?: string): Promise<{ products: ShopifyProduct[]; pageInfo?: string }> {
    try {
      const params: any = { limit };
      if (pageInfo) params.page_info = pageInfo;

      const response = await this.client.get('/products.json', { params });
      
      // Extract pagination info from Link header
      const linkHeader = response.headers['link'];
      const nextPageInfo = this.extractPageInfo(linkHeader, 'next');

      return {
        products: response.data.products,
        pageInfo: nextPageInfo,
      };
    } catch (error: any) {
      throw this.handleError('getProducts', error);
    }
  }

  /**
   * Get single product by ID
   */
  async getProduct(productId: number): Promise<ShopifyProduct> {
    try {
      const response = await this.client.get(`/products/${productId}.json`);
      return response.data.product;
    } catch (error: any) {
      throw this.handleError('getProduct', error);
    }
  }

  /**
   * Create new product
   */
  async createProduct(product: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    try {
      const response = await this.client.post('/products.json', { product });
      return response.data.product;
    } catch (error: any) {
      throw this.handleError('createProduct', error);
    }
  }

  /**
   * Update existing product
   */
  async updateProduct(productId: number, product: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    try {
      const response = await this.client.put(`/products/${productId}.json`, { product });
      return response.data.product;
    } catch (error: any) {
      throw this.handleError('updateProduct', error);
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: number): Promise<void> {
    try {
      await this.client.delete(`/products/${productId}.json`);
    } catch (error: any) {
      throw this.handleError('deleteProduct', error);
    }
  }

  // ============================================
  // INVENTORY API
  // ============================================

  /**
   * Get inventory levels for items
   */
  async getInventoryLevels(inventoryItemIds: number[]): Promise<ShopifyInventoryLevel[]> {
    try {
      const response = await this.client.get('/inventory_levels.json', {
        params: {
          inventory_item_ids: inventoryItemIds.join(','),
        },
      });
      return response.data.inventory_levels;
    } catch (error: any) {
      throw this.handleError('getInventoryLevels', error);
    }
  }

  /**
   * Update inventory level
   */
  async updateInventoryLevel(locationId: number, inventoryItemId: number, available: number): Promise<ShopifyInventoryLevel> {
    try {
      const response = await this.client.post('/inventory_levels/set.json', {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available,
      });
      return response.data.inventory_level;
    } catch (error: any) {
      throw this.handleError('updateInventoryLevel', error);
    }
  }

  /**
   * Get primary location ID
   */
  async getPrimaryLocationId(): Promise<number> {
    try {
      const response = await this.client.get('/locations.json');
      const locations = response.data.locations;
      
      if (locations.length === 0) {
        throw new Error('No locations found in Shopify store');
      }

      // Return first active location
      const primaryLocation = locations.find((loc: any) => loc.active) || locations[0];
      return primaryLocation.id;
    } catch (error: any) {
      throw this.handleError('getPrimaryLocationId', error);
    }
  }

  // ============================================
  // ORDERS API
  // ============================================

  /**
   * Get all orders (paginated)
   * @param status 'any' | 'open' | 'closed' | 'cancelled'
   * @param limit Max 250 per page
   * @param pageInfo Pagination cursor
   */
  async getOrders(status: 'any' | 'open' | 'closed' | 'cancelled' = 'any', limit = 250, pageInfo?: string): Promise<{ orders: ShopifyOrder[]; pageInfo?: string }> {
    try {
      const params: any = { status, limit };
      if (pageInfo) params.page_info = pageInfo;

      const response = await this.client.get('/orders.json', { params });
      
      const linkHeader = response.headers['link'];
      const nextPageInfo = this.extractPageInfo(linkHeader, 'next');

      return {
        orders: response.data.orders,
        pageInfo: nextPageInfo,
      };
    } catch (error: any) {
      throw this.handleError('getOrders', error);
    }
  }

  /**
   * Get single order by ID
   */
  async getOrder(orderId: number): Promise<ShopifyOrder> {
    try {
      const response = await this.client.get(`/orders/${orderId}.json`);
      return response.data.order;
    } catch (error: any) {
      throw this.handleError('getOrder', error);
    }
  }

  /**
   * Get orders created after a specific date
   */
  async getOrdersSince(createdAtMin: string): Promise<ShopifyOrder[]> {
    try {
      const allOrders: ShopifyOrder[] = [];
      let pageInfo: string | undefined;

      do {
        const response = await this.client.get('/orders.json', {
          params: {
            status: 'any',
            created_at_min: createdAtMin,
            limit: 250,
            page_info: pageInfo,
          },
        });

        allOrders.push(...response.data.orders);
        
        const linkHeader = response.headers['link'];
        pageInfo = this.extractPageInfo(linkHeader, 'next');
      } while (pageInfo);

      return allOrders;
    } catch (error: any) {
      throw this.handleError('getOrdersSince', error);
    }
  }

  // ============================================
  // FULFILLMENTS API
  // ============================================

  /**
   * Create fulfillment for order (add tracking)
   */
  async createFulfillment(
    orderId: number,
    trackingNumber: string,
    trackingCompany: string,
    trackingUrl: string,
    lineItemIds: number[]
  ): Promise<ShopifyFulfillment> {
    try {
      const locationId = await this.getPrimaryLocationId();

      const response = await this.client.post(`/orders/${orderId}/fulfillments.json`, {
        fulfillment: {
          location_id: locationId,
          tracking_number: trackingNumber,
          tracking_company: trackingCompany,
          tracking_url: trackingUrl,
          notify_customer: true,
          line_items: lineItemIds.map(id => ({ id })),
        },
      });

      return response.data.fulfillment;
    } catch (error: any) {
      throw this.handleError('createFulfillment', error);
    }
  }

  /**
   * Update fulfillment tracking
   */
  async updateFulfillment(
    orderId: number,
    fulfillmentId: number,
    trackingNumber: string,
    trackingCompany: string,
    trackingUrl: string
  ): Promise<ShopifyFulfillment> {
    try {
      const response = await this.client.put(`/orders/${orderId}/fulfillments/${fulfillmentId}.json`, {
        fulfillment: {
          tracking_number: trackingNumber,
          tracking_company: trackingCompany,
          tracking_url: trackingUrl,
          notify_customer: true,
        },
      });

      return response.data.fulfillment;
    } catch (error: any) {
      throw this.handleError('updateFulfillment', error);
    }
  }

  // ============================================
  // WEBHOOKS API
  // ============================================

  /**
   * Get all webhooks
   */
  async getWebhooks(): Promise<ShopifyWebhook[]> {
    try {
      const response = await this.client.get('/webhooks.json');
      return response.data.webhooks;
    } catch (error: any) {
      throw this.handleError('getWebhooks', error);
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(topic: string, address: string): Promise<ShopifyWebhook> {
    try {
      const response = await this.client.post('/webhooks.json', {
        webhook: {
          topic,
          address,
          format: 'json',
        },
      });

      return response.data.webhook;
    } catch (error: any) {
      throw this.handleError('createWebhook', error);
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: number): Promise<void> {
    try {
      await this.client.delete(`/webhooks/${webhookId}.json`);
    } catch (error: any) {
      throw this.handleError('deleteWebhook', error);
    }
  }

  /**
   * Register all required webhooks
   */
  async registerWebhooks(baseUrl: string): Promise<void> {
    const topics = [
      'orders/create',
      'orders/updated',
      'orders/cancelled',
      'products/create',
      'products/update',
      'products/delete',
      'inventory_levels/update',
    ];

    const existingWebhooks = await this.getWebhooks();

    for (const topic of topics) {
      const webhookUrl = `${baseUrl}/api/webhooks/shopify`;
      
      // Check if webhook already exists
      const exists = existingWebhooks.some(
        wh => wh.topic === topic && wh.address === webhookUrl
      );

      if (!exists) {
        await this.createWebhook(topic, webhookUrl);
        console.log(`[Shopify] Registered webhook: ${topic}`);
      }
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Extract page_info from Link header
   */
  private extractPageInfo(linkHeader: string | undefined, rel: 'next' | 'previous'): string | undefined {
    if (!linkHeader) return undefined;

    const links = linkHeader.split(',');
    for (const link of links) {
      if (link.includes(`rel="${rel}"`)) {
        const match = link.match(/page_info=([^&>]+)/);
        return match ? match[1] : undefined;
      }
    }

    return undefined;
  }

  /**
   * Handle API errors
   */
  private handleError(method: string, error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error(`[Shopify API Error] ${method}:`, {
        status,
        data,
      });

      if (status === 429) {
        return new Error('Shopify API rate limit exceeded. Please try again later.');
      }

      if (status === 401 || status === 403) {
        return new Error('Shopify API authentication failed. Check your access token.');
      }

      return new Error(`Shopify API error: ${data.errors || data.error || 'Unknown error'}`);
    }

    console.error(`[Shopify API Error] ${method}:`, error.message);
    return new Error(`Shopify API request failed: ${error.message}`);
  }

  /**
   * Test connection to Shopify API
   */
  async testConnection(): Promise<{ success: boolean; storeName: string; error?: string }> {
    try {
      const response = await this.client.get('/shop.json');
      return {
        success: true,
        storeName: response.data.shop.name,
      };
    } catch (error: any) {
      return {
        success: false,
        storeName: '',
        error: error.message,
      };
    }
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const shopifyAPI = new ShopifyAPI();
