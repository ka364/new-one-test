/**
 * Advanced Coupons & Promotions Schema
 * نظام الكوبونات والعروض المتقدم
 */

import { pgTable, serial, varchar, text, timestamp, decimal, integer, jsonb, boolean, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Coupon Types
export const couponTypes = pgTable("coupon_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coupons
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 200 }),
  nameAr: varchar("name_ar", { length: 200 }),
  description: text("description"),
  descriptionAr: text("description_ar"),

  // Type
  discountType: varchar("discount_type", { length: 20 }).notNull(),
  // percentage, fixed_amount, free_shipping, buy_x_get_y, fixed_price

  // Value
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),

  // Buy X Get Y
  buyQuantity: integer("buy_quantity"),
  getQuantity: integer("get_quantity"),
  getProductId: integer("get_product_id"),
  getDiscountPercentage: decimal("get_discount_percentage", { precision: 5, scale: 2 }),

  // Conditions
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxOrderAmount: decimal("max_order_amount", { precision: 10, scale: 2 }),
  minQuantity: integer("min_quantity"),

  // Product/Category Restrictions
  applicableProducts: jsonb("applicable_products").default([]),
  excludedProducts: jsonb("excluded_products").default([]),
  applicableCategories: jsonb("applicable_categories").default([]),
  excludedCategories: jsonb("excluded_categories").default([]),
  applicableBrands: jsonb("applicable_brands").default([]),

  // Customer Restrictions
  applicableCustomerGroups: jsonb("applicable_customer_groups").default([]),
  applicableCustomers: jsonb("applicable_customers").default([]), // specific customer IDs
  excludedCustomers: jsonb("excluded_customers").default([]),
  firstOrderOnly: boolean("first_order_only").default(false),
  newCustomersOnly: boolean("new_customers_only").default(false),

  // Usage Limits
  totalUsageLimit: integer("total_usage_limit"),
  perCustomerLimit: integer("per_customer_limit").default(1),
  usageCount: integer("usage_count").default(0),

  // Validity
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),

  // Scheduling
  activeDays: jsonb("active_days").default([]), // ['monday', 'tuesday', etc.]
  activeHoursStart: varchar("active_hours_start", { length: 5 }), // "09:00"
  activeHoursEnd: varchar("active_hours_end", { length: 5 }), // "21:00"

  // Stacking
  stackable: boolean("stackable").default(false),
  stackableWith: jsonb("stackable_with").default([]), // coupon IDs
  priority: integer("priority").default(0), // higher = applied first

  // Status
  status: varchar("status", { length: 20 }).default("active"),
  // draft, scheduled, active, paused, expired, depleted

  // Source
  source: varchar("source", { length: 30 }),
  // manual, campaign, loyalty, influencer, affiliate, auto_generated

  campaignId: integer("campaign_id"),
  affiliateId: integer("affiliate_id"),

  // Display
  showInStorefront: boolean("show_in_storefront").default(false),
  bannerImageUrl: varchar("banner_image_url", { length: 500 }),
  termsAndConditions: text("terms_and_conditions"),
  termsAndConditionsAr: text("terms_and_conditions_ar"),

  // Tracking
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coupon Usage History
export const couponUsage = pgTable("coupon_usage", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => coupons.id),
  couponCode: varchar("coupon_code", { length: 50 }).notNull(),

  // Order
  orderId: integer("order_id").notNull(),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  orderTotal: decimal("order_total", { precision: 10, scale: 2 }).notNull(),

  // Customer
  customerId: integer("customer_id"),
  customerEmail: varchar("customer_email", { length: 200 }),
  customerPhone: varchar("customer_phone", { length: 20 }),

  // Discount Applied
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull(),

  // Status
  status: varchar("status", { length: 20 }).default("applied"),
  // applied, order_completed, order_cancelled, refunded

  // Timestamps
  appliedAt: timestamp("applied_at").defaultNow(),
  orderCompletedAt: timestamp("order_completed_at"),
  refundedAt: timestamp("refunded_at"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Promotional Campaigns
export const promotionalCampaigns = pgTable("promotional_campaigns", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),

  // Type
  type: varchar("type", { length: 30 }).notNull(),
  // sale, flash_sale, seasonal, holiday, clearance, bundle, loyalty

  // Discount
  discountType: varchar("discount_type", { length: 20 }),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),

  // Target
  applicableProducts: jsonb("applicable_products").default([]),
  applicableCategories: jsonb("applicable_categories").default([]),
  applicableBrands: jsonb("applicable_brands").default([]),

  // Validity
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),

  // Flash Sale
  isFlashSale: boolean("is_flash_sale").default(false),
  flashSaleDurationMinutes: integer("flash_sale_duration_minutes"),
  flashSaleQuantityLimit: integer("flash_sale_quantity_limit"),
  flashSalePerCustomerLimit: integer("flash_sale_per_customer_limit"),

  // Display
  bannerImageUrl: varchar("banner_image_url", { length: 500 }),
  bannerImageUrlMobile: varchar("banner_image_url_mobile", { length: 500 }),
  badgeText: varchar("badge_text", { length: 50 }),
  badgeTextAr: varchar("badge_text_ar", { length: 50 }),
  badgeColor: varchar("badge_color", { length: 20 }),

  // Pages
  showOnHomepage: boolean("show_on_homepage").default(false),
  showOnProductPage: boolean("show_on_product_page").default(true),
  showOnCategoryPage: boolean("show_on_category_page").default(true),
  customLandingPageUrl: varchar("custom_landing_page_url", { length: 500 }),

  // Status
  status: varchar("status", { length: 20 }).default("draft"),
  // draft, scheduled, active, paused, ended

  // Tracking
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0.00"),

  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign Products (specific pricing overrides)
export const campaignProducts = pgTable("campaign_products", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => promotionalCampaigns.id),
  productId: integer("product_id").notNull(),

  // Price Override
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),

  // Limits
  quantityLimit: integer("quantity_limit"),
  soldQuantity: integer("sold_quantity").default(0),
  perCustomerLimit: integer("per_customer_limit"),

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auto-Generated Coupons (for campaigns, loyalty, etc.)
export const generatedCoupons = pgTable("generated_coupons", {
  id: serial("id").primaryKey(),
  batchId: varchar("batch_id", { length: 50 }).notNull(),
  couponCode: varchar("coupon_code", { length: 50 }).notNull().unique(),

  // Template
  templateCouponId: integer("template_coupon_id").references(() => coupons.id),

  // Assignment
  assignedTo: integer("assigned_to"), // customer ID
  assignedEmail: varchar("assigned_email", { length: 200 }),
  assignedPhone: varchar("assigned_phone", { length: 20 }),

  // Source
  source: varchar("source", { length: 30 }).notNull(),
  // loyalty_reward, referral, influencer, affiliate, bulk_generate

  sourceReferenceId: integer("source_reference_id"),
  sourceReferenceType: varchar("source_reference_type", { length: 50 }),

  // Usage
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  usedOnOrderId: integer("used_on_order_id"),

  // Validity
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),

  // Status
  status: varchar("status", { length: 20 }).default("active"),
  // active, used, expired, revoked

  createdAt: timestamp("created_at").defaultNow(),
});

// Coupon Analytics
export const couponAnalytics = pgTable("coupon_analytics", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => coupons.id),
  date: date("date").notNull(),

  // Usage
  usageCount: integer("usage_count").default(0),
  uniqueCustomers: integer("unique_customers").default(0),

  // Orders
  ordersCount: integer("orders_count").default(0),
  ordersTotal: decimal("orders_total", { precision: 12, scale: 2 }).default("0.00"),
  discountTotal: decimal("discount_total", { precision: 12, scale: 2 }).default("0.00"),

  // Average
  avgOrderValue: decimal("avg_order_value", { precision: 10, scale: 2 }),
  avgDiscountAmount: decimal("avg_discount_amount", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bundle Offers
export const bundleOffers = pgTable("bundle_offers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  imageUrl: varchar("image_url", { length: 500 }),

  // Pricing
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  bundlePrice: decimal("bundle_price", { precision: 10, scale: 2 }).notNull(),
  savingsAmount: decimal("savings_amount", { precision: 10, scale: 2 }),
  savingsPercentage: decimal("savings_percentage", { precision: 5, scale: 2 }),

  // Products
  products: jsonb("products").notNull(), // [{productId, variantId, quantity}]

  // Limits
  quantityLimit: integer("quantity_limit"),
  soldQuantity: integer("sold_quantity").default(0),
  perCustomerLimit: integer("per_customer_limit"),

  // Validity
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),

  // Display
  showOnHomepage: boolean("show_on_homepage").default(false),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),

  // Status
  status: varchar("status", { length: 20 }).default("active"),
  // draft, active, paused, ended, sold_out

  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const couponRelations = relations(coupons, ({ many }) => ({
  usage: many(couponUsage),
  analytics: many(couponAnalytics),
  generatedCoupons: many(generatedCoupons),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsage.couponId],
    references: [coupons.id],
  }),
}));

export const campaignRelations = relations(promotionalCampaigns, ({ many }) => ({
  products: many(campaignProducts),
}));

export const campaignProductRelations = relations(campaignProducts, ({ one }) => ({
  campaign: one(promotionalCampaigns, {
    fields: [campaignProducts.campaignId],
    references: [promotionalCampaigns.id],
  }),
}));

export const generatedCouponRelations = relations(generatedCoupons, ({ one }) => ({
  template: one(coupons, {
    fields: [generatedCoupons.templateCouponId],
    references: [coupons.id],
  }),
}));

// Default Coupon Types
export const DEFAULT_COUPON_TYPES = [
  { code: 'PERCENTAGE', nameEn: 'Percentage Discount', nameAr: 'خصم بالنسبة المئوية' },
  { code: 'FIXED', nameEn: 'Fixed Amount Discount', nameAr: 'خصم مبلغ ثابت' },
  { code: 'FREE_SHIPPING', nameEn: 'Free Shipping', nameAr: 'شحن مجاني' },
  { code: 'BUY_X_GET_Y', nameEn: 'Buy X Get Y', nameAr: 'اشتري X واحصل على Y' },
  { code: 'BUNDLE', nameEn: 'Bundle Discount', nameAr: 'خصم على الباقة' },
  { code: 'FIRST_ORDER', nameEn: 'First Order Discount', nameAr: 'خصم الطلب الأول' },
];
