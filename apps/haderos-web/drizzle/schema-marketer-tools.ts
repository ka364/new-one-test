/**
 * Marketer Tools Schema
 * نظام أدوات المسوقين الشامل
 *
 * Features:
 * 1. Landing Page Builder - منشئ صفحات الهبوط
 * 2. Shopify Store Integration - ربط متاجر شوبيفاي
 * 3. Ad Campaign Templates - قوالب الحملات الإعلانية
 * 4. Marketing Materials - المواد التسويقية
 * 5. Website Builder - منشئ المواقع
 * 6. Analytics & Tracking - التحليلات والتتبع
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  jsonb,
  boolean,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// MARKETER ACCOUNTS
// ============================================

export const marketerAccounts = pgTable(
  'marketer_accounts',
  {
    id: serial('id').primaryKey(),

    // Basic Info
    code: varchar('code', { length: 20 }).notNull().unique(), // Unique marketer code (e.g., "MKT001")
    name: varchar('name', { length: 200 }).notNull(),
    nameAr: varchar('name_ar', { length: 200 }),
    email: varchar('email', { length: 320 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }).notNull(),

    // Authentication
    passwordHash: varchar('password_hash', { length: 255 }),
    isVerified: boolean('is_verified').default(false),
    verificationToken: varchar('verification_token', { length: 255 }),

    // Profile
    avatarUrl: varchar('avatar_url', { length: 500 }),
    bio: text('bio'),
    bioAr: text('bio_ar'),
    socialLinks: jsonb('social_links').$type<{
      facebook?: string;
      instagram?: string;
      tiktok?: string;
      youtube?: string;
      twitter?: string;
      linkedin?: string;
    }>(),

    // Tier & Commission
    tier: varchar('tier', { length: 20 }).default('bronze').notNull(),
    // bronze, silver, gold, platinum, diamond
    commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('10.00'),
    bonusRate: decimal('bonus_rate', { precision: 5, scale: 2 }).default('0.00'),

    // Stats
    totalSales: decimal('total_sales', { precision: 15, scale: 2 }).default('0.00'),
    totalCommission: decimal('total_commission', { precision: 15, scale: 2 }).default('0.00'),
    pendingCommission: decimal('pending_commission', { precision: 15, scale: 2 }).default('0.00'),
    paidCommission: decimal('paid_commission', { precision: 15, scale: 2 }).default('0.00'),
    totalOrders: integer('total_orders').default(0),
    totalLeads: integer('total_leads').default(0),
    conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }).default('0.00'),

    // Capabilities - What can this marketer do?
    canCreateLandingPages: boolean('can_create_landing_pages').default(true),
    canCreateWebsites: boolean('can_create_websites').default(false),
    canConnectShopify: boolean('can_connect_shopify').default(false),
    canAccessAdTemplates: boolean('can_access_ad_templates').default(true),
    canUseAITools: boolean('can_use_ai_tools').default(false),
    maxLandingPages: integer('max_landing_pages').default(5),
    maxWebsites: integer('max_websites').default(0),

    // Bank Info for Payouts
    bankAccount: jsonb('bank_account').$type<{
      bankName: string;
      accountNumber: string;
      accountName: string;
      iban?: string;
    }>(),

    // Status
    status: varchar('status', { length: 20 }).default('active'),
    // active, inactive, suspended, pending_review

    // Metadata
    referredBy: integer('referred_by'), // Another marketer who referred them
    factoryId: integer('factory_id'), // Associated factory if any

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    lastLoginAt: timestamp('last_login_at'),
  },
  (table) => [
    index('marketer_code_idx').on(table.code),
    index('marketer_email_idx').on(table.email),
    index('marketer_status_idx').on(table.status),
  ]
);

// ============================================
// LANDING PAGE BUILDER
// ============================================

export const marketerLandingPages = pgTable(
  'marketer_landing_pages',
  {
    id: serial('id').primaryKey(),
    marketerId: integer('marketer_id')
      .notNull()
      .references(() => marketerAccounts.id),

    // Basic Info
    slug: varchar('slug', { length: 100 }).notNull().unique(), // URL slug (e.g., "my-awesome-product")
    title: varchar('title', { length: 200 }).notNull(),
    titleAr: varchar('title_ar', { length: 200 }),
    description: text('description'),
    descriptionAr: text('description_ar'),

    // Template
    templateId: varchar('template_id', { length: 50 }).notNull(),
    // modern_product, classic_offer, video_sales, testimonials, countdown, etc.

    // Content
    content: jsonb('content')
      .$type<{
        hero: {
          headline: string;
          headlineAr?: string;
          subheadline?: string;
          subheadlineAr?: string;
          ctaText: string;
          ctaTextAr?: string;
          ctaLink?: string;
          backgroundImage?: string;
          backgroundVideo?: string;
        };
        sections: Array<{
          id: string;
          type:
            | 'features'
            | 'benefits'
            | 'testimonials'
            | 'pricing'
            | 'faq'
            | 'video'
            | 'gallery'
            | 'countdown'
            | 'custom';
          title?: string;
          titleAr?: string;
          content: any;
          order: number;
        }>;
        footer: {
          text?: string;
          textAr?: string;
          links?: Array<{ label: string; url: string }>;
        };
      }>()
      .notNull(),

    // Design
    design: jsonb('design').$type<{
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      textColor: string;
      fontFamily: string;
      fontFamilyAr: string;
      buttonStyle: 'rounded' | 'sharp' | 'pill';
      direction: 'ltr' | 'rtl';
    }>(),

    // Product Integration
    productIds: jsonb('product_ids').$type<number[]>().default([]),
    showPricing: boolean('show_pricing').default(true),
    showInventory: boolean('show_inventory').default(false),

    // SEO
    metaTitle: varchar('meta_title', { length: 100 }),
    metaDescription: varchar('meta_description', { length: 300 }),
    metaKeywords: varchar('meta_keywords', { length: 300 }),
    ogImage: varchar('og_image', { length: 500 }),

    // Tracking
    facebookPixelId: varchar('facebook_pixel_id', { length: 50 }),
    googleAnalyticsId: varchar('google_analytics_id', { length: 50 }),
    tiktokPixelId: varchar('tiktok_pixel_id', { length: 50 }),
    customTrackingCode: text('custom_tracking_code'),

    // Domain
    customDomain: varchar('custom_domain', { length: 200 }),
    sslEnabled: boolean('ssl_enabled').default(true),

    // Stats
    views: integer('views').default(0),
    uniqueVisitors: integer('unique_visitors').default(0),
    clicks: integer('clicks').default(0),
    conversions: integer('conversions').default(0),
    conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }).default('0.00'),
    revenue: decimal('revenue', { precision: 15, scale: 2 }).default('0.00'),

    // Status
    status: varchar('status', { length: 20 }).default('draft'),
    // draft, published, paused, archived

    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('landing_page_marketer_idx').on(table.marketerId),
    index('landing_page_slug_idx').on(table.slug),
    index('landing_page_status_idx').on(table.status),
  ]
);

// ============================================
// LANDING PAGE TEMPLATES
// ============================================

export const landingPageTemplates = pgTable('landing_page_templates', {
  id: varchar('id', { length: 50 }).primaryKey(),

  name: varchar('name', { length: 100 }).notNull(),
  nameAr: varchar('name_ar', { length: 100 }),
  description: text('description'),
  descriptionAr: text('description_ar'),

  category: varchar('category', { length: 50 }).notNull(),
  // product, offer, lead_capture, video_sales, coming_soon, event

  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  previewUrl: varchar('preview_url', { length: 500 }),

  // Default content structure
  defaultContent: jsonb('default_content').notNull(),
  defaultDesign: jsonb('default_design').notNull(),

  // Features
  features: jsonb('features').$type<string[]>().default([]),
  // responsive, rtl_support, countdown, video_background, animations, etc.

  // Requirements
  tier: varchar('tier', { length: 20 }).default('bronze'),
  // Minimum tier required to use this template

  isPremium: boolean('is_premium').default(false),
  isActive: boolean('is_active').default(true),

  usageCount: integer('usage_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// MARKETER WEBSITES
// ============================================

export const marketerWebsites = pgTable(
  'marketer_websites',
  {
    id: serial('id').primaryKey(),
    marketerId: integer('marketer_id')
      .notNull()
      .references(() => marketerAccounts.id),

    // Domain
    subdomain: varchar('subdomain', { length: 50 }).notNull().unique(), // marketer.haderos.store
    customDomain: varchar('custom_domain', { length: 200 }),
    sslEnabled: boolean('ssl_enabled').default(true),

    // Basic Info
    name: varchar('name', { length: 200 }).notNull(),
    nameAr: varchar('name_ar', { length: 200 }),
    description: text('description'),
    descriptionAr: text('description_ar'),
    logoUrl: varchar('logo_url', { length: 500 }),
    faviconUrl: varchar('favicon_url', { length: 500 }),

    // Theme
    theme: jsonb('theme').$type<{
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      headerStyle: 'default' | 'transparent' | 'sticky';
      footerStyle: 'minimal' | 'full' | 'none';
      fontFamily: string;
      fontFamilyAr: string;
    }>(),

    // Pages
    pages: jsonb('pages').$type<
      Array<{
        id: string;
        slug: string;
        title: string;
        titleAr?: string;
        type: 'home' | 'products' | 'about' | 'contact' | 'custom';
        content: any;
        isVisible: boolean;
        order: number;
      }>
    >(),

    // Navigation
    navigation: jsonb('navigation').$type<
      Array<{
        label: string;
        labelAr?: string;
        url: string;
        target?: '_blank' | '_self';
        children?: Array<{ label: string; url: string }>;
      }>
    >(),

    // Products
    productCategories: jsonb('product_categories').$type<string[]>().default([]),
    featuredProducts: jsonb('featured_products').$type<number[]>().default([]),
    showAllProducts: boolean('show_all_products').default(true),

    // SEO
    metaTitle: varchar('meta_title', { length: 100 }),
    metaDescription: varchar('meta_description', { length: 300 }),

    // Tracking
    facebookPixelId: varchar('facebook_pixel_id', { length: 50 }),
    googleAnalyticsId: varchar('google_analytics_id', { length: 50 }),

    // Stats
    totalViews: integer('total_views').default(0),
    totalOrders: integer('total_orders').default(0),
    totalRevenue: decimal('total_revenue', { precision: 15, scale: 2 }).default('0.00'),

    // Status
    status: varchar('status', { length: 20 }).default('draft'),
    // draft, published, maintenance, suspended

    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('website_marketer_idx').on(table.marketerId),
    index('website_subdomain_idx').on(table.subdomain),
  ]
);

// ============================================
// SHOPIFY INTEGRATION FOR MARKETERS
// ============================================

export const marketerShopifyStores = pgTable(
  'marketer_shopify_stores',
  {
    id: serial('id').primaryKey(),
    marketerId: integer('marketer_id')
      .notNull()
      .references(() => marketerAccounts.id),

    // Shopify Store Info
    storeName: varchar('store_name', { length: 200 }).notNull(),
    storeUrl: varchar('store_url', { length: 500 }).notNull(),
    shopifyDomain: varchar('shopify_domain', { length: 200 }).notNull(), // store.myshopify.com

    // Authentication
    accessToken: text('access_token'), // Encrypted
    apiVersion: varchar('api_version', { length: 20 }).default('2025-01'),
    scopes: jsonb('scopes').$type<string[]>().default([]),

    // Sync Settings
    autoSyncProducts: boolean('auto_sync_products').default(true),
    autoSyncOrders: boolean('auto_sync_orders').default(true),
    autoSyncInventory: boolean('auto_sync_inventory').default(true),
    syncIntervalMinutes: integer('sync_interval_minutes').default(30),

    // Mapping
    productMapping: jsonb('product_mapping').$type<{
      [shopifyProductId: string]: number; // maps to local product ID
    }>(),

    // Stats
    totalProducts: integer('total_products').default(0),
    syncedProducts: integer('synced_products').default(0),
    totalOrders: integer('total_orders').default(0),
    syncedOrders: integer('synced_orders').default(0),

    // Status
    status: varchar('status', { length: 20 }).default('pending'),
    // pending, connected, syncing, error, disconnected
    connectionError: text('connection_error'),

    lastSyncAt: timestamp('last_sync_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('shopify_store_marketer_idx').on(table.marketerId),
    unique('shopify_store_unique').on(table.marketerId, table.shopifyDomain),
  ]
);

// ============================================
// AD CAMPAIGN TEMPLATES
// ============================================

export const adCampaignTemplates = pgTable(
  'ad_campaign_templates',
  {
    id: serial('id').primaryKey(),

    name: varchar('name', { length: 200 }).notNull(),
    nameAr: varchar('name_ar', { length: 200 }),
    description: text('description'),
    descriptionAr: text('description_ar'),

    platform: varchar('platform', { length: 30 }).notNull(),
    // facebook, instagram, tiktok, google, snapchat, twitter

    campaignType: varchar('campaign_type', { length: 50 }).notNull(),
    // awareness, consideration, conversion, traffic, lead_generation

    // Content Templates
    headlines: jsonb('headlines')
      .$type<
        Array<{
          text: string;
          textAr?: string;
          charLimit: number;
        }>
      >()
      .notNull(),

    descriptions: jsonb('descriptions')
      .$type<
        Array<{
          text: string;
          textAr?: string;
          charLimit: number;
        }>
      >()
      .notNull(),

    callToActions: jsonb('call_to_actions')
      .$type<
        Array<{
          text: string;
          textAr?: string;
          type: string;
        }>
      >()
      .notNull(),

    // Creative Guidelines
    imageSpecs: jsonb('image_specs').$type<{
      dimensions: { width: number; height: number }[];
      maxFileSize: string;
      formats: string[];
      tips: string[];
      tipsAr?: string[];
    }>(),

    videoSpecs: jsonb('video_specs').$type<{
      dimensions: { width: number; height: number }[];
      duration: { min: number; max: number };
      maxFileSize: string;
      formats: string[];
      tips: string[];
      tipsAr?: string[];
    }>(),

    // Targeting Suggestions
    targetingTips: jsonb('targeting_tips').$type<{
      ageRange: { min: number; max: number };
      interests: string[];
      behaviors: string[];
      locations: string[];
      tips: string[];
      tipsAr?: string[];
    }>(),

    // Budget Recommendations
    budgetRecommendations: jsonb('budget_recommendations').$type<{
      daily: { min: number; recommended: number; currency: string };
      lifetime: { min: number; recommended: number; currency: string };
      tips: string[];
      tipsAr?: string[];
    }>(),

    // Example Creative
    exampleImages: jsonb('example_images').$type<string[]>().default([]),
    exampleVideos: jsonb('example_videos').$type<string[]>().default([]),

    // Requirements
    tier: varchar('tier', { length: 20 }).default('bronze'),
    isPremium: boolean('is_premium').default(false),
    isActive: boolean('is_active').default(true),

    // Stats
    usageCount: integer('usage_count').default(0),
    successRate: decimal('success_rate', { precision: 5, scale: 2 }),
    avgROAS: decimal('avg_roas', { precision: 5, scale: 2 }),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('ad_template_platform_idx').on(table.platform),
    index('ad_template_type_idx').on(table.campaignType),
  ]
);

// ============================================
// MARKETING MATERIALS
// ============================================

export const marketingMaterials = pgTable(
  'marketing_materials',
  {
    id: serial('id').primaryKey(),

    title: varchar('title', { length: 200 }).notNull(),
    titleAr: varchar('title_ar', { length: 200 }),
    description: text('description'),
    descriptionAr: text('description_ar'),

    type: varchar('type', { length: 30 }).notNull(),
    // image, video, text_template, banner, social_post, story, reel

    category: varchar('category', { length: 50 }).notNull(),
    // product_promotion, sale, seasonal, brand, testimonial, how_to

    // Content
    content: jsonb('content')
      .$type<{
        text?: string;
        textAr?: string;
        mediaUrl?: string;
        thumbnailUrl?: string;
        hashtags?: string[];
        emojis?: string[];
      }>()
      .notNull(),

    // Dimensions (for images/videos)
    dimensions: jsonb('dimensions').$type<{
      width: number;
      height: number;
      aspectRatio: string;
    }>(),

    // For which platform?
    platforms: jsonb('platforms').$type<string[]>().default([]),
    // facebook, instagram, tiktok, whatsapp, website

    // Product association
    productIds: jsonb('product_ids').$type<number[]>().default([]),

    // Requirements
    tier: varchar('tier', { length: 20 }).default('bronze'),
    isPremium: boolean('is_premium').default(false),
    isActive: boolean('is_active').default(true),

    // Stats
    downloadCount: integer('download_count').default(0),
    usageCount: integer('usage_count').default(0),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('material_type_idx').on(table.type),
    index('material_category_idx').on(table.category),
  ]
);

// ============================================
// MARKETER LEADS
// ============================================

export const marketerLeads = pgTable(
  'marketer_leads',
  {
    id: serial('id').primaryKey(),
    marketerId: integer('marketer_id')
      .notNull()
      .references(() => marketerAccounts.id),

    // Lead Source
    sourceType: varchar('source_type', { length: 30 }).notNull(),
    // landing_page, website, shopify, facebook_ad, instagram_ad, direct
    sourceId: integer('source_id'), // ID of landing page, website, etc.

    // Lead Info
    name: varchar('name', { length: 200 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 320 }),

    // Details
    message: text('message'),
    productInterest: jsonb('product_interest').$type<number[]>().default([]),

    // Tracking
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),
    utmTerm: varchar('utm_term', { length: 100 }),
    utmContent: varchar('utm_content', { length: 100 }),

    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    referrer: text('referrer'),

    // Status
    status: varchar('status', { length: 20 }).default('new'),
    // new, contacted, interested, converted, lost

    notes: text('notes'),

    convertedToOrderId: integer('converted_to_order_id'),
    convertedAt: timestamp('converted_at'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('lead_marketer_idx').on(table.marketerId),
    index('lead_status_idx').on(table.status),
    index('lead_source_idx').on(table.sourceType),
  ]
);

// ============================================
// MARKETER ANALYTICS
// ============================================

export const marketerAnalytics = pgTable(
  'marketer_analytics',
  {
    id: serial('id').primaryKey(),
    marketerId: integer('marketer_id')
      .notNull()
      .references(() => marketerAccounts.id),
    date: date('date').notNull(),

    // Traffic
    pageViews: integer('page_views').default(0),
    uniqueVisitors: integer('unique_visitors').default(0),

    // Engagement
    clicks: integer('clicks').default(0),
    leads: integer('leads').default(0),
    leadsValue: decimal('leads_value', { precision: 10, scale: 2 }).default('0.00'),

    // Conversions
    orders: integer('orders').default(0),
    ordersValue: decimal('orders_value', { precision: 10, scale: 2 }).default('0.00'),
    conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }).default('0.00'),

    // Revenue
    revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0.00'),
    commission: decimal('commission', { precision: 10, scale: 2 }).default('0.00'),

    // By Source
    trafficBySource: jsonb('traffic_by_source').$type<{
      [source: string]: {
        views: number;
        clicks: number;
        leads: number;
        orders: number;
        revenue: number;
      };
    }>(),

    // By Landing Page
    trafficByPage: jsonb('traffic_by_page').$type<{
      [pageId: string]: {
        views: number;
        clicks: number;
        leads: number;
        orders: number;
        revenue: number;
      };
    }>(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    unique('marketer_analytics_unique').on(table.marketerId, table.date),
    index('analytics_marketer_idx').on(table.marketerId),
    index('analytics_date_idx').on(table.date),
  ]
);

// ============================================
// MARKETER TIER DEFINITIONS
// ============================================

export const marketerTiers = pgTable('marketer_tiers', {
  id: varchar('id', { length: 20 }).primaryKey(),
  // bronze, silver, gold, platinum, diamond

  name: varchar('name', { length: 50 }).notNull(),
  nameAr: varchar('name_ar', { length: 50 }),

  // Requirements
  minSales: decimal('min_sales', { precision: 15, scale: 2 }).notNull(),
  minOrders: integer('min_orders').notNull(),

  // Benefits
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull(),
  bonusRate: decimal('bonus_rate', { precision: 5, scale: 2 }).default('0.00'),

  // Capabilities
  maxLandingPages: integer('max_landing_pages').notNull(),
  maxWebsites: integer('max_websites').default(0),
  canConnectShopify: boolean('can_connect_shopify').default(false),
  canUseAITools: boolean('can_use_ai_tools').default(false),
  premiumTemplatesAccess: boolean('premium_templates_access').default(false),
  prioritySupport: boolean('priority_support').default(false),

  // Display
  color: varchar('color', { length: 20 }),
  icon: varchar('icon', { length: 10 }),
  badgeUrl: varchar('badge_url', { length: 500 }),

  benefits: jsonb('benefits').$type<string[]>().default([]),
  benefitsAr: jsonb('benefits_ar').$type<string[]>().default([]),

  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const marketerAccountsRelations = relations(marketerAccounts, ({ many, one }) => ({
  landingPages: many(marketerLandingPages),
  websites: many(marketerWebsites),
  shopifyStores: many(marketerShopifyStores),
  leads: many(marketerLeads),
  analytics: many(marketerAnalytics),
  referrer: one(marketerAccounts, {
    fields: [marketerAccounts.referredBy],
    references: [marketerAccounts.id],
  }),
}));

export const marketerLandingPagesRelations = relations(marketerLandingPages, ({ one }) => ({
  marketer: one(marketerAccounts, {
    fields: [marketerLandingPages.marketerId],
    references: [marketerAccounts.id],
  }),
}));

export const marketerWebsitesRelations = relations(marketerWebsites, ({ one }) => ({
  marketer: one(marketerAccounts, {
    fields: [marketerWebsites.marketerId],
    references: [marketerAccounts.id],
  }),
}));

export const marketerShopifyStoresRelations = relations(marketerShopifyStores, ({ one }) => ({
  marketer: one(marketerAccounts, {
    fields: [marketerShopifyStores.marketerId],
    references: [marketerAccounts.id],
  }),
}));

export const marketerLeadsRelations = relations(marketerLeads, ({ one }) => ({
  marketer: one(marketerAccounts, {
    fields: [marketerLeads.marketerId],
    references: [marketerAccounts.id],
  }),
}));

export const marketerAnalyticsRelations = relations(marketerAnalytics, ({ one }) => ({
  marketer: one(marketerAccounts, {
    fields: [marketerAnalytics.marketerId],
    references: [marketerAccounts.id],
  }),
}));

// ============================================
// DEFAULT TIERS
// ============================================

export const DEFAULT_MARKETER_TIERS = [
  {
    id: 'bronze',
    name: 'Bronze',
    nameAr: 'برونزي',
    minSales: 0,
    minOrders: 0,
    commissionRate: 10,
    bonusRate: 0,
    maxLandingPages: 5,
    maxWebsites: 0,
    canConnectShopify: false,
    canUseAITools: false,
    premiumTemplatesAccess: false,
    prioritySupport: false,
    color: '#CD7F32',
    icon: '🥉',
    benefits: [
      '10% commission rate',
      'Up to 5 landing pages',
      'Basic marketing materials',
      'Email support',
    ],
    benefitsAr: ['عمولة 10%', 'حتى 5 صفحات هبوط', 'مواد تسويقية أساسية', 'دعم عبر البريد'],
  },
  {
    id: 'silver',
    name: 'Silver',
    nameAr: 'فضي',
    minSales: 50000,
    minOrders: 100,
    commissionRate: 12,
    bonusRate: 1,
    maxLandingPages: 15,
    maxWebsites: 1,
    canConnectShopify: false,
    canUseAITools: false,
    premiumTemplatesAccess: false,
    prioritySupport: false,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: [
      '12% commission + 1% bonus',
      'Up to 15 landing pages',
      '1 personal website',
      'Premium marketing materials',
      'Priority email support',
    ],
    benefitsAr: [
      'عمولة 12% + 1% مكافأة',
      'حتى 15 صفحة هبوط',
      'موقع شخصي واحد',
      'مواد تسويقية متميزة',
      'دعم أولوية عبر البريد',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    nameAr: 'ذهبي',
    minSales: 150000,
    minOrders: 300,
    commissionRate: 15,
    bonusRate: 2,
    maxLandingPages: 30,
    maxWebsites: 3,
    canConnectShopify: true,
    canUseAITools: false,
    premiumTemplatesAccess: true,
    prioritySupport: true,
    color: '#FFD700',
    icon: '🥇',
    benefits: [
      '15% commission + 2% bonus',
      'Up to 30 landing pages',
      'Up to 3 websites',
      'Shopify integration',
      'Premium templates',
      'Priority phone support',
    ],
    benefitsAr: [
      'عمولة 15% + 2% مكافأة',
      'حتى 30 صفحة هبوط',
      'حتى 3 مواقع',
      'ربط شوبيفاي',
      'قوالب متميزة',
      'دعم أولوية عبر الهاتف',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    nameAr: 'بلاتيني',
    minSales: 500000,
    minOrders: 800,
    commissionRate: 18,
    bonusRate: 3,
    maxLandingPages: 50,
    maxWebsites: 5,
    canConnectShopify: true,
    canUseAITools: true,
    premiumTemplatesAccess: true,
    prioritySupport: true,
    color: '#E5E4E2',
    icon: '💎',
    benefits: [
      '18% commission + 3% bonus',
      'Up to 50 landing pages',
      'Up to 5 websites',
      'Shopify integration',
      'AI content tools',
      'All premium templates',
      'Dedicated account manager',
    ],
    benefitsAr: [
      'عمولة 18% + 3% مكافأة',
      'حتى 50 صفحة هبوط',
      'حتى 5 مواقع',
      'ربط شوبيفاي',
      'أدوات محتوى ذكية',
      'جميع القوالب المتميزة',
      'مدير حساب مخصص',
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    nameAr: 'ماسي',
    minSales: 1000000,
    minOrders: 1500,
    commissionRate: 20,
    bonusRate: 5,
    maxLandingPages: -1, // Unlimited
    maxWebsites: -1, // Unlimited
    canConnectShopify: true,
    canUseAITools: true,
    premiumTemplatesAccess: true,
    prioritySupport: true,
    color: '#B9F2FF',
    icon: '💠',
    benefits: [
      '20% commission + 5% bonus',
      'Unlimited landing pages',
      'Unlimited websites',
      'Full Shopify integration',
      'Advanced AI tools',
      'Custom branding',
      'VIP support 24/7',
      'Early access to features',
    ],
    benefitsAr: [
      'عمولة 20% + 5% مكافأة',
      'صفحات هبوط غير محدودة',
      'مواقع غير محدودة',
      'ربط شوبيفاي كامل',
      'أدوات ذكاء اصطناعي متقدمة',
      'علامة تجارية مخصصة',
      'دعم VIP على مدار الساعة',
      'وصول مبكر للميزات الجديدة',
    ],
  },
];

// ============================================
// DEFAULT LANDING PAGE TEMPLATES
// ============================================

export const DEFAULT_LANDING_PAGE_TEMPLATES = [
  {
    id: 'modern_product',
    name: 'Modern Product Showcase',
    nameAr: 'عرض منتج عصري',
    category: 'product',
    features: ['responsive', 'rtl_support', 'animations', 'video_background'],
    tier: 'bronze',
  },
  {
    id: 'flash_sale',
    name: 'Flash Sale Countdown',
    nameAr: 'تخفيضات مع عداد',
    category: 'offer',
    features: ['responsive', 'rtl_support', 'countdown', 'urgency_triggers'],
    tier: 'bronze',
  },
  {
    id: 'video_sales_letter',
    name: 'Video Sales Letter',
    nameAr: 'صفحة فيديو مبيعات',
    category: 'video_sales',
    features: ['responsive', 'rtl_support', 'video_embed', 'testimonials'],
    tier: 'silver',
  },
  {
    id: 'lead_capture',
    name: 'Lead Capture Form',
    nameAr: 'صفحة جمع بيانات',
    category: 'lead_capture',
    features: ['responsive', 'rtl_support', 'form_validation', 'thank_you_page'],
    tier: 'bronze',
  },
  {
    id: 'testimonials_focus',
    name: 'Testimonials Focused',
    nameAr: 'صفحة آراء العملاء',
    category: 'product',
    features: ['responsive', 'rtl_support', 'testimonials_slider', 'trust_badges'],
    tier: 'silver',
  },
  {
    id: 'minimal_elegant',
    name: 'Minimal & Elegant',
    nameAr: 'أناقة بسيطة',
    category: 'product',
    features: ['responsive', 'rtl_support', 'animations', 'gallery'],
    tier: 'gold',
  },
  {
    id: 'coming_soon',
    name: 'Coming Soon',
    nameAr: 'قريباً',
    category: 'coming_soon',
    features: ['responsive', 'rtl_support', 'countdown', 'email_capture'],
    tier: 'bronze',
  },
  {
    id: 'event_registration',
    name: 'Event Registration',
    nameAr: 'تسجيل فعالية',
    category: 'event',
    features: ['responsive', 'rtl_support', 'countdown', 'form_validation', 'calendar_integration'],
    tier: 'gold',
  },
];

// ============================================
// DEFAULT AD TEMPLATES
// ============================================

export const DEFAULT_AD_TEMPLATES = [
  {
    platform: 'facebook',
    campaignType: 'conversion',
    name: 'Product Launch',
    nameAr: 'إطلاق منتج',
    headlines: [
      {
        text: '🔥 New Arrival - Limited Stock!',
        textAr: '🔥 وصل حديثاً - كمية محدودة!',
        charLimit: 40,
      },
      { text: "Get Yours Before It's Gone!", textAr: 'احصل عليه قبل نفاد الكمية!', charLimit: 40 },
    ],
    descriptions: [
      {
        text: 'High quality, factory direct prices. Order now!',
        textAr: 'جودة عالية، أسعار المصنع مباشرة. اطلب الآن!',
        charLimit: 125,
      },
    ],
    callToActions: [
      { text: 'Shop Now', textAr: 'تسوق الآن', type: 'SHOP_NOW' },
      { text: 'Learn More', textAr: 'اعرف المزيد', type: 'LEARN_MORE' },
    ],
  },
  {
    platform: 'instagram',
    campaignType: 'traffic',
    name: 'Story Ad',
    nameAr: 'إعلان ستوري',
    headlines: [
      {
        text: '✨ Swipe Up for Exclusive Deals!',
        textAr: '✨ اسحب للأعلى للعروض الحصرية!',
        charLimit: 30,
      },
    ],
    descriptions: [
      {
        text: 'Premium quality at unbeatable prices',
        textAr: 'جودة متميزة بأسعار لا تُقاوم',
        charLimit: 90,
      },
    ],
    callToActions: [{ text: 'Swipe Up', textAr: 'اسحب للأعلى', type: 'SWIPE_UP' }],
  },
  {
    platform: 'tiktok',
    campaignType: 'conversion',
    name: 'Product Demo',
    nameAr: 'عرض منتج',
    headlines: [{ text: 'This is going viral! 🔥', textAr: 'هذا ينتشر بسرعة! 🔥', charLimit: 25 }],
    descriptions: [
      {
        text: 'Factory direct | Best quality | Fast shipping',
        textAr: 'من المصنع مباشرة | أفضل جودة | شحن سريع',
        charLimit: 80,
      },
    ],
    callToActions: [{ text: 'Shop Now', textAr: 'تسوق الآن', type: 'SHOP_NOW' }],
  },
];
