/**
 * Shopify Integration for NOW SHOES
 * 
 * Features:
 * - Product sync (HaderOS → Shopify)
 * - Order management (Shopify → HaderOS)
 * - Inventory sync
 * - Webhook handling
 */

// Shopify API Configuration
const SHOPIFY_STORE_NAME = process.env.SHOPIFY_STORE_NAME || "";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "";
const SHOPIFY_API_VERSION = "2024-01";

const SHOPIFY_API_URL = `https://${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}`;

interface ShopifyProduct {
  id?: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  status: "active" | "draft" | "archived";
}

interface ShopifyVariant {
  id?: number;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  inventory_management: "shopify" | null;
  fulfillment_service: "manual";
  requires_shipping: boolean;
  taxable: boolean;
  barcode?: string;
  weight?: number;
  weight_unit?: "kg" | "g";
  option1?: string;
  option2?: string;
  option3?: string;
}

interface ShopifyImage {
  src: string;
  alt?: string;
  position?: number;
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
  }>;
}

/**
 * Make authenticated request to Shopify API
 */
async function shopifyRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any
): Promise<T> {
  if (!SHOPIFY_STORE_NAME || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error(
      "Shopify credentials not configured. " +
      "Please set SHOPIFY_STORE_NAME and SHOPIFY_ACCESS_TOKEN via Settings → Secrets in the Manus UI."
    );
  }

  const url = `${SHOPIFY_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Create or update product on Shopify
 */
export async function syncProductToShopify(product: {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  code: string;
  price: number;
  salePrice?: number;
  category?: string;
  sizes?: string[];
  colors?: string[];
  quantity: number;
  images?: string[];
  barcode?: string;
}): Promise<{ shopifyProductId: number; shopifyVariantIds: number[] }> {
  
  // Prepare product data
  const shopifyProduct: ShopifyProduct = {
    title: product.nameEn || product.nameAr,
    body_html: product.descriptionEn || product.descriptionAr || "",
    vendor: "NOW SHOES",
    product_type: product.category || "Shoes",
    tags: ["NOW SHOES", product.category || ""].filter(Boolean),
    status: "active",
    variants: [],
    images: (product.images || []).map((url, index) => ({
      src: url,
      alt: product.nameEn,
      position: index + 1,
    })),
  };

  // Create variants for each size/color combination
  const sizes = product.sizes || ["Default"];
  const colors = product.colors || ["Default"];

  for (const size of sizes) {
    for (const color of colors) {
      const variantTitle = sizes.length > 1 || colors.length > 1
        ? `${size} / ${color}`
        : "Default";

      shopifyProduct.variants.push({
        title: variantTitle,
        price: (product.salePrice || product.price).toString(),
        sku: `${product.code}-${size}-${color}`.replace(/\s+/g, "-"),
        inventory_quantity: Math.floor(product.quantity / (sizes.length * colors.length)),
        inventory_management: "shopify",
        fulfillment_service: "manual",
        requires_shipping: true,
        taxable: true,
        barcode: product.barcode,
        option1: sizes.length > 1 ? size : undefined,
        option2: colors.length > 1 ? color : undefined,
      });
    }
  }

  // Create product on Shopify
  const response = await shopifyRequest<{ product: ShopifyProduct }>(
    "/products.json",
    "POST",
    { product: shopifyProduct }
  );

  return {
    shopifyProductId: response.product.id!,
    shopifyVariantIds: response.product.variants.map(v => v.id!),
  };
}

/**
 * Update product inventory on Shopify
 */
export async function updateShopifyInventory(
  variantId: number,
  quantity: number
): Promise<void> {
  // Get inventory item ID
  const variantResponse = await shopifyRequest<{ variant: { inventory_item_id: number } }>(
    `/variants/${variantId}.json`
  );

  const inventoryItemId = variantResponse.variant.inventory_item_id;

  // Get location ID (first location)
  const locationsResponse = await shopifyRequest<{ locations: Array<{ id: number }> }>(
    "/locations.json"
  );

  const locationId = locationsResponse.locations[0]?.id;

  if (!locationId) {
    throw new Error("No Shopify location found");
  }

  // Update inventory level
  await shopifyRequest(
    "/inventory_levels/set.json",
    "POST",
    {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available: quantity,
    }
  );
}

/**
 * Get product from Shopify
 */
export async function getShopifyProduct(productId: number): Promise<ShopifyProduct> {
  const response = await shopifyRequest<{ product: ShopifyProduct }>(
    `/products/${productId}.json`
  );
  return response.product;
}

/**
 * Get orders from Shopify
 */
export async function getShopifyOrders(params: {
  status?: "open" | "closed" | "cancelled" | "any";
  limit?: number;
  since_id?: number;
  created_at_min?: string;
  created_at_max?: string;
} = {}): Promise<ShopifyOrder[]> {
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append("status", params.status);
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.since_id) queryParams.append("since_id", params.since_id.toString());
  if (params.created_at_min) queryParams.append("created_at_min", params.created_at_min);
  if (params.created_at_max) queryParams.append("created_at_max", params.created_at_max);

  const response = await shopifyRequest<{ orders: ShopifyOrder[] }>(
    `/orders.json?${queryParams.toString()}`
  );
  
  return response.orders;
}

/**
 * Get single order from Shopify
 */
export async function getShopifyOrder(orderId: number): Promise<ShopifyOrder> {
  const response = await shopifyRequest<{ order: ShopifyOrder }>(
    `/orders/${orderId}.json`
  );
  return response.order;
}

/**
 * Verify Shopify webhook signature
 */
export function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  
  return hash === hmacHeader;
}

/**
 * Test Shopify connection
 */
export async function testShopifyConnection(): Promise<{
  success: boolean;
  shop?: {
    name: string;
    email: string;
    domain: string;
    currency: string;
  };
  error?: string;
}> {
  try {
    const response = await shopifyRequest<{ shop: any }>("/shop.json");
    
    return {
      success: true,
      shop: {
        name: response.shop.name,
        email: response.shop.email,
        domain: response.shop.domain,
        currency: response.shop.currency,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
