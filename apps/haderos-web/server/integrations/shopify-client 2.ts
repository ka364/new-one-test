/**
 * Shopify GraphQL Client
 * Handles all communication with Shopify Admin API
 */

import { ENV } from "../_core/env";

interface ShopifyGraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: {
      code: string;
    };
  }>;
  extensions?: {
    cost: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

export class ShopifyClient {
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly isEnabled: boolean;

  constructor() {
    const storeName = ENV.shopifyStoreName;
    const apiVersion = ENV.shopifyApiVersion;
    this.apiUrl = `https://${storeName}.myshopify.com/admin/api/${apiVersion}/graphql.json`;
    this.accessToken = ENV.shopifyAdminApiToken;

    // Allow Shopify to be disabled in development
    this.isEnabled = !!this.accessToken && this.accessToken !== "dummy_token_for_dev";

    if (!this.isEnabled) {
      console.warn("[ShopifyClient] Shopify integration disabled - using dummy token or no token provided");
    }
  }

  /**
   * Execute a GraphQL query or mutation
   */
  async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<ShopifyGraphQLResponse<T>> {
    // Return empty response if Shopify is disabled
    if (!this.isEnabled) {
      return { data: {} as T };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": this.accessToken,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const result: ShopifyGraphQLResponse<T> = await response.json();

      // Check for GraphQL errors
      if (result.errors && result.errors.length > 0) {
        console.error("Shopify GraphQL errors:", result.errors);
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      return result;
    } catch (error) {
      console.error("Shopify API request failed:", error);
      throw error;
    }
  }

  /**
   * Get shop information
   */
  async getShopInfo() {
    const query = `
      query {
        shop {
          id
          name
          email
          currencyCode
          primaryDomain {
            url
            host
          }
        }
      }
    `;

    const result = await this.query(query);
    return result.data?.shop;
  }

  /**
   * Get all products (paginated)
   */
  async getProducts(first: number = 50, after?: string) {
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            cursor
            node {
              id
              title
              descriptionHtml
              handle
              status
              vendor
              productType
              tags
              createdAt
              updatedAt
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    price
                    compareAtPrice
                    sku
                    barcode
                    inventoryQuantity
                    weight
                    weightUnit
                  }
                }
              }
              images(first: 10) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const result = await this.query(query, { first, after });
    return result.data?.products;
  }

  /**
   * Create a new product
   */
  async createProduct(input: {
    title: string;
    descriptionHtml?: string;
    vendor?: string;
    productType?: string;
    tags?: string[];
    variants?: Array<{
      price: string;
      sku?: string;
      barcode?: string;
      inventoryQuantity?: number;
      weight?: number;
      weightUnit?: string;
    }>;
    images?: Array<{
      src: string;
      altText?: string;
    }>;
  }) {
    const mutation = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await this.query(mutation, { input });

    if (result.data?.productCreate?.userErrors?.length > 0) {
      throw new Error(
        `Product creation failed: ${result.data.productCreate.userErrors[0].message}`
      );
    }

    return result.data?.productCreate?.product;
  }

  /**
   * Update product inventory
   */
  async updateInventory(inventoryItemId: string, quantity: number, locationId: string) {
    const mutation = `
      mutation inventoryAdjustQuantity($input: InventoryAdjustQuantityInput!) {
        inventoryAdjustQuantity(input: $input) {
          inventoryLevel {
            id
            available
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input = {
      inventoryLevelId: `gid://shopify/InventoryLevel/${inventoryItemId}?inventory_item_id=${inventoryItemId}`,
      availableDelta: quantity,
    };

    const result = await this.query(mutation, { input });

    if (result.data?.inventoryAdjustQuantity?.userErrors?.length > 0) {
      throw new Error(
        `Inventory update failed: ${result.data.inventoryAdjustQuantity.userErrors[0].message}`
      );
    }

    return result.data?.inventoryAdjustQuantity?.inventoryLevel;
  }

  /**
   * Get orders (paginated)
   */
  async getOrders(first: number = 50, after?: string) {
    const query = `
      query getOrders($first: Int!, $after: String) {
        orders(first: $first, after: $after) {
          edges {
            cursor
            node {
              id
              name
              email
              phone
              createdAt
              updatedAt
              cancelledAt
              closedAt
              processedAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              subtotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              totalShippingPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              displayFinancialStatus
              displayFulfillmentStatus
              customer {
                id
                firstName
                lastName
                email
                phone
              }
              shippingAddress {
                firstName
                lastName
                address1
                address2
                city
                province
                country
                zip
                phone
              }
              lineItems(first: 100) {
                edges {
                  node {
                    id
                    title
                    quantity
                    variant {
                      id
                      title
                      sku
                      price
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const result = await this.query(query, { first, after });
    return result.data?.orders;
  }

  /**
   * Create a webhook subscription
   */
  async createWebhook(topic: string, callbackUrl: string) {
    const mutation = `
      mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const webhookSubscription = {
      callbackUrl,
      format: "JSON",
    };

    const result = await this.query(mutation, { topic, webhookSubscription });

    if (result.data?.webhookSubscriptionCreate?.userErrors?.length > 0) {
      throw new Error(
        `Webhook creation failed: ${result.data.webhookSubscriptionCreate.userErrors[0].message}`
      );
    }

    return result.data?.webhookSubscriptionCreate?.webhookSubscription;
  }

  /**
   * Get existing webhooks
   */
  async getWebhooks() {
    const query = `
      query {
        webhookSubscriptions(first: 50) {
          edges {
            node {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.query(query);
    return result.data?.webhookSubscriptions?.edges?.map((edge: any) => edge.node);
  }
}

// Export singleton instance
export const shopifyClient = new ShopifyClient();
