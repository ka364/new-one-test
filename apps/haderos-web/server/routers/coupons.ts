/**
 * 🎟️ Coupons & Promotions Router
 * نظام الكوبونات والعروض المتقدم
 *
 * Features:
 * - Coupon creation & management
 * - Promotional campaigns
 * - Bundle offers
 * - Auto-generated coupons
 * - Coupon validation & application
 * - Analytics & reporting
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { eq, and, desc, sql, gte, lte, lt, or, ne, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// Import schema
import {
  couponTypes,
  coupons,
  couponUsage,
  promotionalCampaigns,
  campaignProducts,
  generatedCoupons,
  couponAnalytics,
  bundleOffers,
} from '../../drizzle/schema-coupons';

// ============================================
// TYPES & VALIDATORS
// ============================================

const discountTypeEnum = z.enum([
  'percentage',
  'fixed_amount',
  'free_shipping',
  'buy_x_get_y',
  'fixed_price',
]);

const couponStatusEnum = z.enum(['draft', 'scheduled', 'active', 'paused', 'expired', 'depleted']);

// ============================================
// ROUTER
// ============================================

export const couponsRouter = router({
  // ==========================================
  // COUPON MANAGEMENT
  // ==========================================

  /**
   * Create new coupon
   */
  createCoupon: protectedProcedure
    .input(
      z.object({
        code: z.string().min(3).max(50),
        nameEn: z.string().optional(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        discountType: discountTypeEnum,
        discountValue: z.number().positive(),
        maxDiscountAmount: z.number().optional(),

        // Buy X Get Y
        buyQuantity: z.number().optional(),
        getQuantity: z.number().optional(),
        getProductId: z.number().optional(),
        getDiscountPercentage: z.number().optional(),

        // Conditions
        minOrderAmount: z.number().optional(),
        maxOrderAmount: z.number().optional(),
        minQuantity: z.number().optional(),

        // Restrictions
        applicableProducts: z.array(z.number()).optional(),
        excludedProducts: z.array(z.number()).optional(),
        applicableCategories: z.array(z.string()).optional(),
        excludedCategories: z.array(z.string()).optional(),

        // Customer restrictions
        applicableCustomerGroups: z.array(z.string()).optional(),
        firstOrderOnly: z.boolean().default(false),
        newCustomersOnly: z.boolean().default(false),

        // Usage limits
        totalUsageLimit: z.number().optional(),
        perCustomerLimit: z.number().default(1),

        // Validity
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),

        // Scheduling
        activeDays: z.array(z.string()).optional(),
        activeHoursStart: z.string().optional(),
        activeHoursEnd: z.string().optional(),

        // Stacking
        stackable: z.boolean().default(false),
        stackableWith: z.array(z.number()).optional(),
        priority: z.number().default(0),

        // Display
        showInStorefront: z.boolean().default(false),
        bannerImageUrl: z.string().optional(),
        termsAndConditions: z.string().optional(),
        termsAndConditionsAr: z.string().optional(),

        status: couponStatusEnum.default('draft'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Check if code already exists
      const existing = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, input.code.toUpperCase()))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'كود الكوبون موجود مسبقاً',
        });
      }

      const result = await db.insert(coupons).values({
        code: input.code.toUpperCase(),
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue.toString(),
        maxDiscountAmount: input.maxDiscountAmount?.toString(),
        buyQuantity: input.buyQuantity,
        getQuantity: input.getQuantity,
        getProductId: input.getProductId,
        getDiscountPercentage: input.getDiscountPercentage?.toString(),
        minOrderAmount: input.minOrderAmount?.toString(),
        maxOrderAmount: input.maxOrderAmount?.toString(),
        minQuantity: input.minQuantity,
        applicableProducts: input.applicableProducts || [],
        excludedProducts: input.excludedProducts || [],
        applicableCategories: input.applicableCategories || [],
        excludedCategories: input.excludedCategories || [],
        applicableCustomerGroups: input.applicableCustomerGroups || [],
        firstOrderOnly: input.firstOrderOnly,
        newCustomersOnly: input.newCustomersOnly,
        totalUsageLimit: input.totalUsageLimit,
        perCustomerLimit: input.perCustomerLimit,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        activeDays: input.activeDays || [],
        activeHoursStart: input.activeHoursStart,
        activeHoursEnd: input.activeHoursEnd,
        stackable: input.stackable,
        stackableWith: input.stackableWith || [],
        priority: input.priority,
        showInStorefront: input.showInStorefront,
        bannerImageUrl: input.bannerImageUrl,
        termsAndConditions: input.termsAndConditions,
        termsAndConditionsAr: input.termsAndConditionsAr,
        status: input.status,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        message: 'تم إنشاء الكوبون بنجاح',
      };
    }),

  /**
   * Get all coupons (admin)
   */
  getAllCoupons: protectedProcedure
    .input(
      z.object({
        status: couponStatusEnum.optional(),
        discountType: discountTypeEnum.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const conditions = [];
      if (input.status) {
        conditions.push(eq(coupons.status, input.status));
      }
      if (input.discountType) {
        conditions.push(eq(coupons.discountType, input.discountType));
      }

      const couponsList = await db
        .select()
        .from(coupons)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(coupons.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return couponsList;
    }),

  /**
   * Get coupon by code
   */
  getCouponByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const coupon = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, input.code.toUpperCase()))
        .limit(1);

      if (coupon.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'الكوبون غير موجود',
        });
      }

      return coupon[0];
    }),

  /**
   * Update coupon
   */
  updateCoupon: protectedProcedure
    .input(
      z.object({
        couponId: z.number(),
        updates: z.object({
          nameEn: z.string().optional(),
          nameAr: z.string().optional(),
          discountValue: z.number().optional(),
          maxDiscountAmount: z.number().optional(),
          totalUsageLimit: z.number().optional(),
          perCustomerLimit: z.number().optional(),
          validFrom: z.date().optional(),
          validUntil: z.date().optional(),
          status: couponStatusEnum.optional(),
          showInStorefront: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      const updateData: any = { ...input.updates, updatedAt: new Date() };

      if (updateData.discountValue) {
        updateData.discountValue = updateData.discountValue.toString();
      }
      if (updateData.maxDiscountAmount) {
        updateData.maxDiscountAmount = updateData.maxDiscountAmount.toString();
      }

      await db.update(coupons).set(updateData).where(eq(coupons.id, input.couponId));

      return { success: true, message: 'تم تحديث الكوبون' };
    }),

  /**
   * Delete coupon
   */
  deleteCoupon: protectedProcedure
    .input(z.object({ couponId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Check if coupon has been used
      const usage = await db
        .select()
        .from(couponUsage)
        .where(eq(couponUsage.couponId, input.couponId))
        .limit(1);

      if (usage.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'لا يمكن حذف كوبون تم استخدامه. يمكنك إيقافه بدلاً من ذلك',
        });
      }

      await db.delete(coupons).where(eq(coupons.id, input.couponId));

      return { success: true, message: 'تم حذف الكوبون' };
    }),

  // ==========================================
  // COUPON VALIDATION & APPLICATION
  // ==========================================

  /**
   * Validate coupon
   */
  validateCoupon: publicProcedure
    .input(
      z.object({
        code: z.string(),
        customerId: z.number().optional(),
        orderAmount: z.number(),
        productIds: z.array(z.number()).optional(),
        categoryIds: z.array(z.string()).optional(),
        isFirstOrder: z.boolean().default(false),
        isNewCustomer: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Get coupon
      const coupon = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, input.code.toUpperCase()))
        .limit(1);

      if (coupon.length === 0) {
        return {
          valid: false,
          message: 'كود الكوبون غير صحيح',
        };
      }

      const c = coupon[0];

      // Check status
      if (c.status !== 'active') {
        return {
          valid: false,
          message: 'الكوبون غير نشط',
        };
      }

      // Check validity period
      const now = new Date();
      if (c.validFrom && now < c.validFrom) {
        return {
          valid: false,
          message: 'الكوبون لم يبدأ بعد',
        };
      }
      if (c.validUntil && now > c.validUntil) {
        return {
          valid: false,
          message: 'انتهت صلاحية الكوبون',
        };
      }

      // Check usage limit
      if (c.totalUsageLimit && c.usageCount >= c.totalUsageLimit) {
        return {
          valid: false,
          message: 'تم استنفاد الكوبون',
        };
      }

      // Check customer usage limit
      if (input.customerId && c.perCustomerLimit) {
        const customerUsage = await db
          .select({ count: sql<number>`count(*)` })
          .from(couponUsage)
          .where(and(eq(couponUsage.couponId, c.id), eq(couponUsage.customerId, input.customerId)));

        if (Number(customerUsage[0]?.count) >= c.perCustomerLimit) {
          return {
            valid: false,
            message: 'لقد استخدمت هذا الكوبون بالفعل',
          };
        }
      }

      // Check minimum order amount
      if (c.minOrderAmount && input.orderAmount < Number(c.minOrderAmount)) {
        return {
          valid: false,
          message: `الحد الأدنى للطلب ${c.minOrderAmount} جنيه`,
        };
      }

      // Check maximum order amount
      if (c.maxOrderAmount && input.orderAmount > Number(c.maxOrderAmount)) {
        return {
          valid: false,
          message: `الحد الأقصى للطلب ${c.maxOrderAmount} جنيه`,
        };
      }

      // Check first order only
      if (c.firstOrderOnly && !input.isFirstOrder) {
        return {
          valid: false,
          message: 'هذا الكوبون للطلب الأول فقط',
        };
      }

      // Check new customers only
      if (c.newCustomersOnly && !input.isNewCustomer) {
        return {
          valid: false,
          message: 'هذا الكوبون للعملاء الجدد فقط',
        };
      }

      // Check product restrictions
      const applicableProducts = (c.applicableProducts as number[]) || [];
      const excludedProducts = (c.excludedProducts as number[]) || [];

      if (applicableProducts.length > 0 && input.productIds) {
        const hasApplicable = input.productIds.some((id) => applicableProducts.includes(id));
        if (!hasApplicable) {
          return {
            valid: false,
            message: 'الكوبون لا ينطبق على هذه المنتجات',
          };
        }
      }

      if (excludedProducts.length > 0 && input.productIds) {
        const hasExcluded = input.productIds.some((id) => excludedProducts.includes(id));
        if (hasExcluded) {
          return {
            valid: false,
            message: 'الكوبون لا ينطبق على بعض المنتجات في سلتك',
          };
        }
      }

      // Check active days
      const activeDays = (c.activeDays as string[]) || [];
      if (activeDays.length > 0) {
        const today = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][now.getDay()];
        if (!activeDays.includes(today)) {
          return {
            valid: false,
            message: 'الكوبون غير متاح اليوم',
          };
        }
      }

      // Check active hours
      if (c.activeHoursStart && c.activeHoursEnd) {
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        if (currentTime < c.activeHoursStart || currentTime > c.activeHoursEnd) {
          return {
            valid: false,
            message: `الكوبون متاح من ${c.activeHoursStart} إلى ${c.activeHoursEnd}`,
          };
        }
      }

      // Calculate discount
      let discountAmount = 0;
      if (c.discountType === 'percentage') {
        discountAmount = (input.orderAmount * Number(c.discountValue)) / 100;
        if (c.maxDiscountAmount && discountAmount > Number(c.maxDiscountAmount)) {
          discountAmount = Number(c.maxDiscountAmount);
        }
      } else if (c.discountType === 'fixed_amount') {
        discountAmount = Number(c.discountValue);
      } else if (c.discountType === 'free_shipping') {
        discountAmount = 0; // Handle in shipping calculation
      }

      return {
        valid: true,
        coupon: c,
        discountAmount,
        discountType: c.discountType,
        message: 'الكوبون صالح',
      };
    }),

  /**
   * Apply coupon to order
   */
  applyCoupon: protectedProcedure
    .input(
      z.object({
        couponCode: z.string(),
        orderId: z.number(),
        orderNumber: z.string(),
        orderTotal: z.number(),
        discountAmount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const coupon = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, input.couponCode.toUpperCase()))
        .limit(1);

      if (coupon.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'الكوبون غير موجود',
        });
      }

      // Record usage
      await db.insert(couponUsage).values({
        couponId: coupon[0].id,
        couponCode: coupon[0].code,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        orderTotal: input.orderTotal.toString(),
        customerId: ctx.user.id,
        discountAmount: input.discountAmount.toString(),
        discountType: coupon[0].discountType,
        status: 'applied',
      });

      // Update usage count
      await db
        .update(coupons)
        .set({
          usageCount: (coupon[0].usageCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, coupon[0].id));

      // Check if depleted
      if (
        coupon[0].totalUsageLimit &&
        (coupon[0].usageCount || 0) + 1 >= coupon[0].totalUsageLimit
      ) {
        await db.update(coupons).set({ status: 'depleted' }).where(eq(coupons.id, coupon[0].id));
      }

      return {
        success: true,
        discountAmount: input.discountAmount,
        message: 'تم تطبيق الكوبون',
      };
    }),

  // ==========================================
  // STOREFRONT COUPONS
  // ==========================================

  /**
   * Get public coupons (shown in storefront)
   */
  getPublicCoupons: publicProcedure.query(async () => {
    const db = await getDb();

    const now = new Date();

    const publicCoupons = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.status, 'active'),
          eq(coupons.showInStorefront, true),
          or(sql`${coupons.validFrom} IS NULL`, lte(coupons.validFrom, now)),
          or(sql`${coupons.validUntil} IS NULL`, gte(coupons.validUntil, now))
        )
      )
      .orderBy(desc(coupons.priority));

    return publicCoupons.map((c) => ({
      code: c.code,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscountAmount: c.maxDiscountAmount,
      minOrderAmount: c.minOrderAmount,
      validUntil: c.validUntil,
      bannerImageUrl: c.bannerImageUrl,
      termsAndConditions: c.termsAndConditions,
      termsAndConditionsAr: c.termsAndConditionsAr,
    }));
  }),

  // ==========================================
  // PROMOTIONAL CAMPAIGNS
  // ==========================================

  /**
   * Create promotional campaign
   */
  createCampaign: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        nameEn: z.string(),
        nameAr: z.string(),
        description: z.string().optional(),
        type: z.enum([
          'sale',
          'flash_sale',
          'seasonal',
          'holiday',
          'clearance',
          'bundle',
          'loyalty',
        ]),
        discountType: discountTypeEnum.optional(),
        discountValue: z.number().optional(),
        maxDiscountAmount: z.number().optional(),
        applicableProducts: z.array(z.number()).optional(),
        applicableCategories: z.array(z.string()).optional(),
        startDate: z.date(),
        endDate: z.date(),
        isFlashSale: z.boolean().default(false),
        flashSaleDurationMinutes: z.number().optional(),
        bannerImageUrl: z.string().optional(),
        showOnHomepage: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const result = await db.insert(promotionalCampaigns).values({
        code: input.code.toUpperCase(),
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        description: input.description,
        type: input.type,
        discountType: input.discountType,
        discountValue: input.discountValue?.toString(),
        maxDiscountAmount: input.maxDiscountAmount?.toString(),
        applicableProducts: input.applicableProducts || [],
        applicableCategories: input.applicableCategories || [],
        startDate: input.startDate,
        endDate: input.endDate,
        isFlashSale: input.isFlashSale,
        flashSaleDurationMinutes: input.flashSaleDurationMinutes,
        bannerImageUrl: input.bannerImageUrl,
        showOnHomepage: input.showOnHomepage,
        status: 'scheduled',
        createdBy: ctx.user.id,
      });

      return { success: true, message: 'تم إنشاء الحملة' };
    }),

  /**
   * Get active campaigns
   */
  getActiveCampaigns: publicProcedure.query(async () => {
    const db = await getDb();

    const now = new Date();

    const campaigns = await db
      .select()
      .from(promotionalCampaigns)
      .where(
        and(
          eq(promotionalCampaigns.status, 'active'),
          lte(promotionalCampaigns.startDate, now),
          gte(promotionalCampaigns.endDate, now)
        )
      );

    return campaigns;
  }),

  // ==========================================
  // BUNDLE OFFERS
  // ==========================================

  /**
   * Create bundle offer
   */
  createBundle: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        nameEn: z.string(),
        nameAr: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        originalPrice: z.number(),
        bundlePrice: z.number(),
        products: z.array(
          z.object({
            productId: z.number(),
            variantId: z.number().optional(),
            quantity: z.number().min(1),
          })
        ),
        quantityLimit: z.number().optional(),
        perCustomerLimit: z.number().optional(),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
        showOnHomepage: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const savingsAmount = input.originalPrice - input.bundlePrice;
      const savingsPercentage = (savingsAmount / input.originalPrice) * 100;

      await db.insert(bundleOffers).values({
        code: input.code.toUpperCase(),
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        description: input.description,
        imageUrl: input.imageUrl,
        originalPrice: input.originalPrice.toString(),
        bundlePrice: input.bundlePrice.toString(),
        savingsAmount: savingsAmount.toString(),
        savingsPercentage: savingsPercentage.toFixed(2),
        products: input.products,
        quantityLimit: input.quantityLimit,
        perCustomerLimit: input.perCustomerLimit,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        showOnHomepage: input.showOnHomepage,
        status: 'active',
        createdBy: ctx.user.id,
      });

      return { success: true, message: 'تم إنشاء عرض الباقة' };
    }),

  /**
   * Get active bundles
   */
  getActiveBundles: publicProcedure.query(async () => {
    const db = await getDb();

    const now = new Date();

    const bundles = await db
      .select()
      .from(bundleOffers)
      .where(
        and(
          eq(bundleOffers.status, 'active'),
          or(sql`${bundleOffers.validFrom} IS NULL`, lte(bundleOffers.validFrom, now)),
          or(sql`${bundleOffers.validUntil} IS NULL`, gte(bundleOffers.validUntil, now)),
          or(
            sql`${bundleOffers.quantityLimit} IS NULL`,
            sql`${bundleOffers.soldQuantity} < ${bundleOffers.quantityLimit}`
          )
        )
      )
      .orderBy(bundleOffers.sortOrder);

    return bundles;
  }),

  // ==========================================
  // ANALYTICS
  // ==========================================

  /**
   * Get coupon statistics
   */
  getCouponStatistics: protectedProcedure
    .input(
      z.object({
        couponId: z.number().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const conditions = [];
      if (input.couponId) {
        conditions.push(eq(couponUsage.couponId, input.couponId));
      }
      if (input.dateFrom) {
        conditions.push(gte(couponUsage.appliedAt, input.dateFrom));
      }
      if (input.dateTo) {
        conditions.push(lte(couponUsage.appliedAt, input.dateTo));
      }

      const stats = await db
        .select({
          totalUsage: sql<number>`count(*)`,
          uniqueCustomers: sql<number>`count(distinct customer_id)`,
          totalOrders: sql<number>`count(distinct order_id)`,
          totalOrderValue: sql<number>`coalesce(sum(cast(order_total as numeric)), 0)`,
          totalDiscount: sql<number>`coalesce(sum(cast(discount_amount as numeric)), 0)`,
        })
        .from(couponUsage)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Top coupons
      const topCoupons = await db
        .select({
          couponId: couponUsage.couponId,
          couponCode: couponUsage.couponCode,
          usageCount: sql<number>`count(*)`,
          totalDiscount: sql<number>`sum(cast(discount_amount as numeric))`,
        })
        .from(couponUsage)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(couponUsage.couponId, couponUsage.couponCode)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      return {
        ...stats[0],
        topCoupons,
      };
    }),
});
