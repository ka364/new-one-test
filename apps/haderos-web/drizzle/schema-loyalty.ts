/**
 * Loyalty & Rewards Schema
 * نظام الولاء والمكافآت
 */

import { pgTable, serial, varchar, text, timestamp, decimal, integer, jsonb, boolean, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Loyalty Tiers
export const loyaltyTiers = pgTable("loyalty_tiers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),

  // Requirements
  minPoints: integer("min_points").default(0),
  minSpend: decimal("min_spend", { precision: 10, scale: 2 }).default("0.00"),
  minOrders: integer("min_orders").default(0),

  // Benefits
  pointsMultiplier: decimal("points_multiplier", { precision: 3, scale: 2 }).default("1.00"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0.00"),
  freeShipping: boolean("free_shipping").default(false),
  freeShippingMinOrder: decimal("free_shipping_min_order", { precision: 10, scale: 2 }),
  prioritySupport: boolean("priority_support").default(false),
  earlyAccess: boolean("early_access").default(false),
  exclusiveOffers: boolean("exclusive_offers").default(false),
  birthdayBonus: integer("birthday_bonus").default(0), // bonus points

  // Visual
  color: varchar("color", { length: 20 }),
  icon: varchar("icon", { length: 50 }),
  badgeUrl: varchar("badge_url", { length: 500 }),

  // Order
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyalty Members
export const loyaltyMembers = pgTable("loyalty_members", {
  id: serial("id").primaryKey(),
  memberId: varchar("member_id", { length: 50 }).notNull().unique(),
  userId: integer("user_id"),
  customerId: integer("customer_id"),

  // Contact Info
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 20 }).notNull(),

  // Tier
  tierId: integer("tier_id").references(() => loyaltyTiers.id),
  tierCode: varchar("tier_code", { length: 30 }),

  // Points
  totalPointsEarned: integer("total_points_earned").default(0),
  totalPointsRedeemed: integer("total_points_redeemed").default(0),
  currentPoints: integer("current_points").default(0),
  pendingPoints: integer("pending_points").default(0), // Points pending confirmation

  // Spend
  totalSpend: decimal("total_spend", { precision: 12, scale: 2 }).default("0.00"),
  totalOrders: integer("total_orders").default(0),

  // Status
  status: varchar("status", { length: 20 }).default("active"), // active, suspended, expired
  isVerified: boolean("is_verified").default(false),

  // Personal
  birthDate: date("birth_date"),
  gender: varchar("gender", { length: 10 }),
  preferences: jsonb("preferences").default({}),

  // Referral
  referralCode: varchar("referral_code", { length: 20 }).unique(),
  referredBy: integer("referred_by"),
  totalReferrals: integer("total_referrals").default(0),

  // Dates
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at"),
  lastPointsEarnedAt: timestamp("last_points_earned_at"),
  nextTierReviewAt: timestamp("next_tier_review_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Points Transactions
export const pointsTransactions = pgTable("points_transactions", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 50 }).notNull().unique(),
  memberId: integer("member_id").notNull().references(() => loyaltyMembers.id),

  // Type
  type: varchar("type", { length: 30 }).notNull(),
  // earn_purchase, earn_referral, earn_review, earn_birthday, earn_signup,
  // earn_bonus, redeem_discount, redeem_product, redeem_shipping, expire, adjust

  // Points
  points: integer("points").notNull(), // Positive for earn, negative for redeem/expire
  balanceAfter: integer("balance_after").notNull(),

  // Reference
  orderId: integer("order_id"),
  orderNumber: varchar("order_number", { length: 50 }),
  orderAmount: decimal("order_amount", { precision: 10, scale: 2 }),
  rewardId: integer("reward_id"),
  couponId: integer("coupon_id"),

  // Details
  description: text("description"),
  descriptionAr: text("description_ar"),
  metadata: jsonb("metadata"),

  // Status
  status: varchar("status", { length: 20 }).default("completed"), // pending, completed, cancelled, expired

  // Expiry
  expiresAt: timestamp("expires_at"),
  expiredAt: timestamp("expired_at"),

  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rewards Catalog
export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  imageUrl: varchar("image_url", { length: 500 }),

  // Type
  type: varchar("type", { length: 30 }).notNull(),
  // discount_percentage, discount_fixed, free_shipping, free_product, gift_card

  // Cost
  pointsCost: integer("points_cost").notNull(),

  // Value
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  productId: integer("product_id"),
  giftCardAmount: decimal("gift_card_amount", { precision: 10, scale: 2 }),

  // Restrictions
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  applicableCategories: jsonb("applicable_categories").default([]),
  excludedProducts: jsonb("excluded_products").default([]),
  minTierRequired: varchar("min_tier_required", { length: 30 }),

  // Limits
  totalQuantity: integer("total_quantity"),
  remainingQuantity: integer("remaining_quantity"),
  perMemberLimit: integer("per_member_limit"),
  redemptionCount: integer("redemption_count").default(0),

  // Validity
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),

  // Status
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reward Redemptions
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  redemptionId: varchar("redemption_id", { length: 50 }).notNull().unique(),
  memberId: integer("member_id").notNull().references(() => loyaltyMembers.id),
  rewardId: integer("reward_id").notNull().references(() => loyaltyRewards.id),
  pointsTransactionId: integer("points_transaction_id").references(() => pointsTransactions.id),

  // Points
  pointsUsed: integer("points_used").notNull(),

  // Generated Benefit
  couponCode: varchar("coupon_code", { length: 50 }),
  giftCardCode: varchar("gift_card_code", { length: 50 }),

  // Usage
  usedOnOrderId: integer("used_on_order_id"),
  usedOnOrderNumber: varchar("used_on_order_number", { length: 50 }),
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }),

  // Status
  status: varchar("status", { length: 20 }).default("active"),
  // active, used, expired, cancelled

  expiresAt: timestamp("expires_at"),
  usedAt: timestamp("used_at"),
  cancelledAt: timestamp("cancelled_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Points Rules (for automatic earning)
export const pointsRules = pgTable("points_rules", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  description: text("description"),

  // Trigger
  triggerType: varchar("trigger_type", { length: 30 }).notNull(),
  // purchase, signup, referral_made, referral_purchase, review, birthday, specific_product, category_purchase

  // Points Calculation
  calculationType: varchar("calculation_type", { length: 20 }).notNull(),
  // fixed, percentage, per_amount

  pointsValue: integer("points_value").notNull(), // Fixed points or points per X amount
  percentageOfSpend: decimal("percentage_of_spend", { precision: 5, scale: 2 }), // % of spend
  amountPerPoint: decimal("amount_per_point", { precision: 10, scale: 2 }), // EGP per 1 point

  // Conditions
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxPoints: integer("max_points"), // Cap per transaction
  applicableTiers: jsonb("applicable_tiers").default([]),
  applicableCategories: jsonb("applicable_categories").default([]),
  applicableProducts: jsonb("applicable_products").default([]),

  // Limits
  oncePerCustomer: boolean("once_per_customer").default(false),
  dailyLimit: integer("daily_limit"),
  monthlyLimit: integer("monthly_limit"),

  // Validity
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),

  // Points Expiry
  pointsExpiryDays: integer("points_expiry_days"), // null = never expire

  // Status
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referral Tracking
export const referralTracking = pgTable("referral_tracking", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => loyaltyMembers.id),
  referredMemberId: integer("referred_member_id").references(() => loyaltyMembers.id),

  // Referral Info
  referralCode: varchar("referral_code", { length: 20 }).notNull(),
  referredEmail: varchar("referred_email", { length: 200 }),
  referredPhone: varchar("referred_phone", { length: 20 }),

  // Status
  status: varchar("status", { length: 20 }).default("pending"),
  // pending, signed_up, first_purchase, completed, expired, cancelled

  // Points Awarded
  referrerPointsAwarded: integer("referrer_points_awarded").default(0),
  referredPointsAwarded: integer("referred_points_awarded").default(0),

  // Tracking
  clickedAt: timestamp("clicked_at"),
  signedUpAt: timestamp("signed_up_at"),
  firstPurchaseAt: timestamp("first_purchase_at"),
  firstPurchaseOrderId: integer("first_purchase_order_id"),
  firstPurchaseAmount: decimal("first_purchase_amount", { precision: 10, scale: 2 }),

  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const loyaltyMemberRelations = relations(loyaltyMembers, ({ one, many }) => ({
  tier: one(loyaltyTiers, {
    fields: [loyaltyMembers.tierId],
    references: [loyaltyTiers.id],
  }),
  referrer: one(loyaltyMembers, {
    fields: [loyaltyMembers.referredBy],
    references: [loyaltyMembers.id],
  }),
  pointsTransactions: many(pointsTransactions),
  redemptions: many(rewardRedemptions),
  referralsMade: many(referralTracking),
}));

export const pointsTransactionRelations = relations(pointsTransactions, ({ one }) => ({
  member: one(loyaltyMembers, {
    fields: [pointsTransactions.memberId],
    references: [loyaltyMembers.id],
  }),
}));

export const rewardRedemptionRelations = relations(rewardRedemptions, ({ one }) => ({
  member: one(loyaltyMembers, {
    fields: [rewardRedemptions.memberId],
    references: [loyaltyMembers.id],
  }),
  reward: one(loyaltyRewards, {
    fields: [rewardRedemptions.rewardId],
    references: [loyaltyRewards.id],
  }),
  transaction: one(pointsTransactions, {
    fields: [rewardRedemptions.pointsTransactionId],
    references: [pointsTransactions.id],
  }),
}));

export const referralTrackingRelations = relations(referralTracking, ({ one }) => ({
  referrer: one(loyaltyMembers, {
    fields: [referralTracking.referrerId],
    references: [loyaltyMembers.id],
  }),
  referred: one(loyaltyMembers, {
    fields: [referralTracking.referredMemberId],
    references: [loyaltyMembers.id],
  }),
}));

// Default Tiers (for seeding)
export const DEFAULT_LOYALTY_TIERS = [
  {
    code: 'BRONZE',
    nameEn: 'Bronze',
    nameAr: 'برونزي',
    minPoints: 0,
    pointsMultiplier: 1.0,
    discountPercentage: 0,
    color: '#CD7F32',
  },
  {
    code: 'SILVER',
    nameEn: 'Silver',
    nameAr: 'فضي',
    minPoints: 500,
    minSpend: 2000,
    pointsMultiplier: 1.25,
    discountPercentage: 5,
    color: '#C0C0C0',
  },
  {
    code: 'GOLD',
    nameEn: 'Gold',
    nameAr: 'ذهبي',
    minPoints: 2000,
    minSpend: 10000,
    pointsMultiplier: 1.5,
    discountPercentage: 10,
    freeShipping: true,
    freeShippingMinOrder: 200,
    prioritySupport: true,
    color: '#FFD700',
  },
  {
    code: 'PLATINUM',
    nameEn: 'Platinum',
    nameAr: 'بلاتيني',
    minPoints: 5000,
    minSpend: 25000,
    pointsMultiplier: 2.0,
    discountPercentage: 15,
    freeShipping: true,
    prioritySupport: true,
    earlyAccess: true,
    exclusiveOffers: true,
    birthdayBonus: 500,
    color: '#E5E4E2',
  },
];

// Default Points Rules
export const DEFAULT_POINTS_RULES = [
  {
    code: 'PURCHASE_EARN',
    nameEn: 'Earn on Purchase',
    nameAr: 'اكسب نقاط على المشتريات',
    triggerType: 'purchase',
    calculationType: 'per_amount',
    pointsValue: 1,
    amountPerPoint: 10, // 1 point per 10 EGP
  },
  {
    code: 'SIGNUP_BONUS',
    nameEn: 'Signup Bonus',
    nameAr: 'مكافأة التسجيل',
    triggerType: 'signup',
    calculationType: 'fixed',
    pointsValue: 100,
    oncePerCustomer: true,
  },
  {
    code: 'REFERRAL_BONUS',
    nameEn: 'Referral Bonus',
    nameAr: 'مكافأة الإحالة',
    triggerType: 'referral_purchase',
    calculationType: 'fixed',
    pointsValue: 200,
  },
  {
    code: 'REVIEW_BONUS',
    nameEn: 'Product Review Bonus',
    nameAr: 'مكافأة التقييم',
    triggerType: 'review',
    calculationType: 'fixed',
    pointsValue: 50,
  },
  {
    code: 'BIRTHDAY_BONUS',
    nameEn: 'Birthday Bonus',
    nameAr: 'مكافأة عيد الميلاد',
    triggerType: 'birthday',
    calculationType: 'fixed',
    pointsValue: 200,
    oncePerCustomer: true, // per year
  },
];
