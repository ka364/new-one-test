# 🛒 Shopify Integration - Research & Implementation Plan

Based on official Shopify API documentation at https://shopify.dev/docs/api/admin-rest

---

## 📡 API Base Information

**Base URL:** `https://{store_name}.myshopify.com/admin/api/2025-10/`  
**Authentication:** X-Shopify-Access-Token header  
**API Version:** 2025-10 (versioned quarterly)  
**Rate Limit:** 40 requests/min (400 for Shopify Plus)

---

## ⚠️ Important Note

**Shopify recommends GraphQL Admin API** for all new apps starting April 1, 2025. However, REST API is still fully supported and easier for quick integration.

**Our Approach:** Start with REST API for faster MVP, migrate to GraphQL later if needed.

---

## 🔑 Authentication Setup

### Step 1: Create Custom App in Shopify Admin

1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps"
3. Click "Create an app"
4. Name: "NOW SHOES Integration"
5. Configure API scopes:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`
   - `read_orders`
   - `write_orders`
   - `read_customers`
   - `write_customers`
   - `read_fulfillments`
   - `write_fulfillments`

### Step 2: Get Access Token

1. Click "Install app"
2. Copy the **Admin API access token**
3. Add to environment variables: `SHOPIFY_ACCESS_TOKEN`
4. Add store name: `SHOPIFY_STORE_NAME` (e.g., "nowshoes")

---

## 📦 Core API Endpoints

### 1. **Products API**

#### Get All Products
```http
GET /admin/api/2025-10/products.json
```

**Response:**
```json
{
  "products": [
    {
      "id": 123456789,
      "title": "Nike Air Max",
      "body_html": "Description...",
      "vendor": "Nike",
      "product_type": "Shoes",
      "variants": [
        {
          "id": 987654321,
          "title": "Size 42",
          "price": "500.00",
          "sku": "NIKE-AM-42",
          "inventory_quantity": 10
        }
      ],
      "images": [
        {
          "id": 111222333,
          "src": "https://cdn.shopify.com/..."
        }
      ]
    }
  ]
}
```

#### Create Product
```http
POST /admin/api/2025-10/products.json
```

**Request Body:**
```json
{
  "product": {
    "title": "Nike Air Max",
    "body_html": "Premium running shoes",
    "vendor": "Nike",
    "product_type": "Shoes",
    "variants": [
      {
        "option1": "42",
        "price": "500.00",
        "sku": "NIKE-AM-42",
        "inventory_quantity": 10
      }
    ]
  }
}
```

#### Update Product
```http
PUT /admin/api/2025-10/products/{product_id}.json
```

---

### 2. **Inventory API**

#### Get Inventory Levels
```http
GET /admin/api/2025-10/inventory_levels.json?inventory_item_ids={id1},{id2}
```

#### Update Inventory Level
```http
POST /admin/api/2025-10/inventory_levels/set.json
```

**Request Body:**
```json
{
  "location_id": 123456,
  "inventory_item_id": 987654,
  "available": 50
}
```

---

### 3. **Orders API**

#### Get All Orders
```http
GET /admin/api/2025-10/orders.json?status=any&limit=250
```

**Response:**
```json
{
  "orders": [
    {
      "id": 123456789,
      "order_number": 1001,
      "email": "customer@example.com",
      "created_at": "2025-12-18T10:00:00Z",
      "total_price": "1500.00",
      "financial_status": "paid",
      "fulfillment_status": "unfulfilled",
      "customer": {
        "id": 111222333,
        "email": "customer@example.com",
        "first_name": "Ahmed",
        "last_name": "Mohamed",
        "phone": "+201234567890"
      },
      "shipping_address": {
        "first_name": "Ahmed",
        "last_name": "Mohamed",
        "address1": "123 Main St",
        "city": "Cairo",
        "province": "Cairo",
        "country": "Egypt",
        "zip": "11511",
        "phone": "+201234567890"
      },
      "line_items": [
        {
          "id": 444555666,
          "product_id": 123456789,
          "variant_id": 987654321,
          "title": "Nike Air Max",
          "quantity": 2,
          "price": "500.00",
          "sku": "NIKE-AM-42"
        }
      ]
    }
  ]
}
```

#### Get Single Order
```http
GET /admin/api/2025-10/orders/{order_id}.json
```

#### Update Order (Add Tracking)
```http
POST /admin/api/2025-10/orders/{order_id}/fulfillments.json
```

**Request Body:**
```json
{
  "fulfillment": {
    "location_id": 123456,
    "tracking_number": "BOSTA123456",
    "tracking_company": "Bosta",
    "tracking_url": "https://bosta.co/tracking/BOSTA123456",
    "line_items": [
      {
        "id": 444555666
      }
    ]
  }
}
```

---

### 4. **Webhooks API**

#### Create Webhook
```http
POST /admin/api/2025-10/webhooks.json
```

**Request Body:**
```json
{
  "webhook": {
    "topic": "orders/create",
    "address": "https://nowshoes.manus.space/api/webhooks/shopify",
    "format": "json"
  }
}
```

**Available Topics:**
- `orders/create` - New order created
- `orders/updated` - Order updated
- `orders/cancelled` - Order cancelled
- `products/create` - New product created
- `products/update` - Product updated
- `products/delete` - Product deleted
- `inventory_levels/update` - Inventory changed

---

## 🏗️ Implementation Architecture

### Phase 1: Database Schema

```typescript
// drizzle/schema-shopify.ts

export const shopifyConfig = mysqlTable('shopify_config', {
  id: int('id').primaryKey().autoincrement(),
  storeName: varchar('store_name', { length: 255 }).notNull(),
  accessToken: text('access_token').notNull(),
  apiVersion: varchar('api_version', { length: 50 }).default('2025-10'),
  isActive: boolean('is_active').default(true),
  lastSyncAt: datetime('last_sync_at'),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

export const shopifyProducts = mysqlTable('shopify_products', {
  id: int('id').primaryKey().autoincrement(),
  shopifyProductId: varchar('shopify_product_id', { length: 255 }).unique().notNull(),
  localProductId: int('local_product_id'), // Link to NOW SHOES products table
  
  title: varchar('title', { length: 500 }),
  bodyHtml: text('body_html'),
  vendor: varchar('vendor', { length: 255 }),
  productType: varchar('product_type', { length: 255 }),
  handle: varchar('handle', { length: 255 }),
  
  syncStatus: varchar('sync_status', { length: 50 }), // synced, pending, error
  lastSyncAt: datetime('last_sync_at'),
  
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

export const shopifyVariants = mysqlTable('shopify_variants', {
  id: int('id').primaryKey().autoincrement(),
  shopifyVariantId: varchar('shopify_variant_id', { length: 255 }).unique().notNull(),
  shopifyProductId: varchar('shopify_product_id', { length: 255 }).notNull(),
  localVariantId: int('local_variant_id'),
  
  title: varchar('title', { length: 255 }),
  price: decimal('price', { precision: 10, scale: 2 }),
  sku: varchar('sku', { length: 255 }),
  inventoryQuantity: int('inventory_quantity'),
  
  syncStatus: varchar('sync_status', { length: 50 }),
  lastSyncAt: datetime('last_sync_at'),
  
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

export const shopifyOrders = mysqlTable('shopify_orders', {
  id: int('id').primaryKey().autoincrement(),
  shopifyOrderId: varchar('shopify_order_id', { length: 255 }).unique().notNull(),
  localOrderId: int('local_order_id'), // Link to NOW SHOES orders table
  
  orderNumber: int('order_number'),
  email: varchar('email', { length: 255 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  financialStatus: varchar('financial_status', { length: 50 }),
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }),
  
  customerData: json('customer_data'),
  shippingAddress: json('shipping_address'),
  lineItems: json('line_items'),
  
  syncStatus: varchar('sync_status', { length: 50 }),
  lastSyncAt: datetime('last_sync_at'),
  
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

export const shopifyWebhookLogs = mysqlTable('shopify_webhook_logs', {
  id: int('id').primaryKey().autoincrement(),
  topic: varchar('topic', { length: 100 }),
  shopifyId: varchar('shopify_id', { length: 255 }),
  payload: json('payload'),
  processed: boolean('processed').default(false),
  error: text('error'),
  createdAt: datetime('created_at').notNull(),
});

export const shopifySyncLogs = mysqlTable('shopify_sync_logs', {
  id: int('id').primaryKey().autoincrement(),
  syncType: varchar('sync_type', { length: 50 }), // products, inventory, orders
  direction: varchar('direction', { length: 50 }), // shopify_to_local, local_to_shopify
  status: varchar('status', { length: 50 }), // success, error
  itemsProcessed: int('items_processed'),
  itemsFailed: int('items_failed'),
  errorMessage: text('error_message'),
  duration: int('duration'), // milliseconds
  createdAt: datetime('created_at').notNull(),
});
```

---

### Phase 2: Shopify API Client

**File:** `server/integrations/shopify-api.ts`

```typescript
import axios from 'axios';

const SHOPIFY_STORE_NAME = process.env.SHOPIFY_STORE_NAME || '';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';
const SHOPIFY_API_VERSION = '2025-10';

const BASE_URL = `https://${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}`;

class ShopifyAPI {
  private headers = {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json',
  };

  // Products
  async getProducts(limit = 250, page_info?: string) {
    const url = page_info 
      ? `${BASE_URL}/products.json?limit=${limit}&page_info=${page_info}`
      : `${BASE_URL}/products.json?limit=${limit}`;
    
    const response = await axios.get(url, { headers: this.headers });
    return response.data;
  }

  async getProduct(productId: string) {
    const response = await axios.get(
      `${BASE_URL}/products/${productId}.json`,
      { headers: this.headers }
    );
    return response.data.product;
  }

  async createProduct(product: any) {
    const response = await axios.post(
      `${BASE_URL}/products.json`,
      { product },
      { headers: this.headers }
    );
    return response.data.product;
  }

  async updateProduct(productId: string, product: any) {
    const response = await axios.put(
      `${BASE_URL}/products/${productId}.json`,
      { product },
      { headers: this.headers }
    );
    return response.data.product;
  }

  async deleteProduct(productId: string) {
    await axios.delete(
      `${BASE_URL}/products/${productId}.json`,
      { headers: this.headers }
    );
  }

  // Inventory
  async getInventoryLevels(inventoryItemIds: string[]) {
    const ids = inventoryItemIds.join(',');
    const response = await axios.get(
      `${BASE_URL}/inventory_levels.json?inventory_item_ids=${ids}`,
      { headers: this.headers }
    );
    return response.data.inventory_levels;
  }

  async updateInventoryLevel(locationId: number, inventoryItemId: number, available: number) {
    const response = await axios.post(
      `${BASE_URL}/inventory_levels/set.json`,
      {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available,
      },
      { headers: this.headers }
    );
    return response.data;
  }

  // Orders
  async getOrders(status = 'any', limit = 250) {
    const response = await axios.get(
      `${BASE_URL}/orders.json?status=${status}&limit=${limit}`,
      { headers: this.headers }
    );
    return response.data.orders;
  }

  async getOrder(orderId: string) {
    const response = await axios.get(
      `${BASE_URL}/orders/${orderId}.json`,
      { headers: this.headers }
    );
    return response.data.order;
  }

  async createFulfillment(orderId: string, fulfillment: any) {
    const response = await axios.post(
      `${BASE_URL}/orders/${orderId}/fulfillments.json`,
      { fulfillment },
      { headers: this.headers }
    );
    return response.data.fulfillment;
  }

  // Webhooks
  async createWebhook(topic: string, address: string) {
    const response = await axios.post(
      `${BASE_URL}/webhooks.json`,
      {
        webhook: {
          topic,
          address,
          format: 'json',
        },
      },
      { headers: this.headers }
    );
    return response.data.webhook;
  }

  async getWebhooks() {
    const response = await axios.get(
      `${BASE_URL}/webhooks.json`,
      { headers: this.headers }
    );
    return response.data.webhooks;
  }
}

export const shopifyAPI = new ShopifyAPI();
```

---

### Phase 3: Sync Services
