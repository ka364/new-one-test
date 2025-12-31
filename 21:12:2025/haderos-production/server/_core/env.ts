export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Shopify Integration
  shopifyStoreName: process.env.SHOPIFY_STORE_NAME ?? "hader-egypt",
  shopifyAdminApiToken: process.env.SHOPIFY_ADMIN_API_TOKEN ?? "",
  shopifyStorefrontApiToken: process.env.SHOPIFY_STOREFRONT_API_TOKEN ?? "",
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION ?? "2025-10",
};
