/**
 * 🎁 Loyalty & Rewards Router
 * نظام الولاء والمكافآت
 *
 * Features:
 * - Points earning & redemption
 * - Tier management
 * - Rewards catalog
 * - Referral program
 * - Points expiry management
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { eq, and, desc, sql, gte, lte, lt, asc, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// Import schema
import {
  loyaltyTiers,
  loyaltyMembers,
  pointsTransactions,
  loyaltyRewards,
  rewardRedemptions,
  pointsRules,
  referralTracking,
} from '../../drizzle/schema-loyalty';

// ============================================
// TYPES & VALIDATORS
// ============================================

const transactionTypeEnum = z.enum([
  'earn',
  'redeem',
  'expire',
  'adjust',
  'transfer',
  'bonus',
  'refund',
]);

const redemptionStatusEnum = z.enum([
  'pending',
  'approved',
  'processing',
  'completed',
  'cancelled',
  'expired',
]);

// ============================================
// ROUTER
// ============================================

export const loyaltyRouter = router({
  // ==========================================
  // TIERS
  // ==========================================

  /**
   * Get all loyalty tiers
   */
  getTiers: publicProcedure.query(async () => {
    const db = await getDb();

    const tiers = await db
      .select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.isActive, true))
      .orderBy(asc(loyaltyTiers.minPoints));

    return tiers;
  }),

  // ==========================================
  // MEMBER MANAGEMENT
  // ==========================================

  /**
   * Get member's loyalty status
   */
  getMyLoyaltyStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const member = await db
      .select()
      .from(loyaltyMembers)
      .where(eq(loyaltyMembers.customerId, ctx.user.id))
      .limit(1);

    if (member.length === 0) {
      // Auto-enroll new member
      const memberNumber = `LM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      await db.insert(loyaltyMembers).values({
        customerId: ctx.user.id,
        memberNumber,
        currentTierId: 1, // Bronze tier
        currentPoints: 0,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        totalPointsExpired: 0,
        referralCode: `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        isActive: true,
      });

      return {
        isNew: true,
        memberNumber,
        currentPoints: 0,
        tierId: 1,
        tierName: 'Bronze',
        tierNameAr: 'برونزي',
        nextTierPoints: 1000,
        referralCode: `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      };
    }

    // Get current tier details
    const tier = await db
      .select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.id, member[0].currentTierId || 1))
      .limit(1);

    // Get next tier
    const nextTier = await db
      .select()
      .from(loyaltyTiers)
      .where(
        and(
          eq(loyaltyTiers.isActive, true),
          sql`${loyaltyTiers.minPoints} > ${member[0].currentPoints}`
        )
      )
      .orderBy(asc(loyaltyTiers.minPoints))
      .limit(1);

    // Get points expiring soon (next 30 days)
    const expiringPoints = await db
      .select({
        total: sql<number>`coalesce(sum(points), 0)`,
      })
      .from(pointsTransactions)
      .where(
        and(
          eq(pointsTransactions.memberId, member[0].id),
          eq(pointsTransactions.transactionType, 'earn'),
          lt(pointsTransactions.expiresAt, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          gte(pointsTransactions.expiresAt, new Date())
        )
      );

    return {
      isNew: false,
      memberId: member[0].id,
      memberNumber: member[0].memberNumber,
      currentPoints: member[0].currentPoints,
      totalPointsEarned: member[0].totalPointsEarned,
      totalPointsRedeemed: member[0].totalPointsRedeemed,
      tier: tier[0],
      nextTier: nextTier[0] || null,
      pointsToNextTier: nextTier[0] ? nextTier[0].minPoints - member[0].currentPoints : 0,
      expiringPoints: Number(expiringPoints[0]?.total || 0),
      referralCode: member[0].referralCode,
      referralCount: member[0].referralCount,
    };
  }),

  /**
   * Get points history
   */
  getPointsHistory: protectedProcedure
    .input(
      z.object({
        transactionType: transactionTypeEnum.optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      // Get member
      const member = await db
        .select()
        .from(loyaltyMembers)
        .where(eq(loyaltyMembers.customerId, ctx.user.id))
        .limit(1);

      if (member.length === 0) {
        return [];
      }

      const conditions = [eq(pointsTransactions.memberId, member[0].id)];
      if (input.transactionType) {
        conditions.push(eq(pointsTransactions.transactionType, input.transactionType));
      }

      const transactions = await db
        .select()
        .from(pointsTransactions)
        .where(and(...conditions))
        .orderBy(desc(pointsTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return transactions;
    }),

  // ==========================================
  // POINTS EARNING
  // ==========================================

  /**
   * Earn points from purchase
   */
  earnFromPurchase: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        orderNumber: z.string(),
        orderAmount: z.number(),
        productIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Get member
      const member = await db
        .select()
        .from(loyaltyMembers)
        .where(eq(loyaltyMembers.customerId, ctx.user.id))
        .limit(1);

      if (member.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'عضوية الولاء غير موجودة',
        });
      }

      // Get applicable points rule
      const rules = await db
        .select()
        .from(pointsRules)
        .where(and(eq(pointsRules.ruleType, 'purchase'), eq(pointsRules.isActive, true)))
        .limit(1);

      const rule = rules[0];
      if (!rule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'لا توجد قاعدة لاحتساب النقاط',
        });
      }

      // Calculate points
      const pointsPerUnit = Number(rule.pointsPerUnit);
      const earnedPoints = Math.floor(input.orderAmount * pointsPerUnit);

      // Get tier multiplier
      const tier = await db
        .select()
        .from(loyaltyTiers)
        .where(eq(loyaltyTiers.id, member[0].currentTierId || 1))
        .limit(1);

      const multiplier = Number(tier[0]?.pointsMultiplier || 1);
      const finalPoints = Math.floor(earnedPoints * multiplier);

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (rule.expiryMonths || 12));

      // Create transaction
      await db.insert(pointsTransactions).values({
        memberId: member[0].id,
        transactionType: 'earn',
        points: finalPoints,
        balanceAfter: member[0].currentPoints + finalPoints,
        sourceType: 'order',
        sourceId: input.orderId.toString(),
        description: `نقاط من طلب #${input.orderNumber}`,
        descriptionAr: `نقاط من طلب #${input.orderNumber}`,
        ruleId: rule.id,
        multiplierApplied: multiplier,
        expiresAt,
        metadata: {
          orderNumber: input.orderNumber,
          orderAmount: input.orderAmount,
          basePoints: earnedPoints,
          multiplier,
        },
      });

      // Update member points
      await db
        .update(loyaltyMembers)
        .set({
          currentPoints: member[0].currentPoints + finalPoints,
          totalPointsEarned: member[0].totalPointsEarned + finalPoints,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(loyaltyMembers.id, member[0].id));

      // Check tier upgrade
      await checkAndUpgradeTier(db, member[0].id);

      return {
        success: true,
        pointsEarned: finalPoints,
        multiplier,
        newBalance: member[0].currentPoints + finalPoints,
        message: `تم إضافة ${finalPoints} نقطة`,
      };
    }),

  /**
   * Earn bonus points (signup, review, etc.)
   */
  earnBonus: protectedProcedure
    .input(
      z.object({
        bonusType: z.enum(['signup', 'review', 'birthday', 'referral', 'social_share']),
        referenceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Get member
      const member = await db
        .select()
        .from(loyaltyMembers)
        .where(eq(loyaltyMembers.customerId, ctx.user.id))
        .limit(1);

      if (member.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'عضوية الولاء غير موجودة',
        });
      }

      // Get bonus rule
      const rule = await db
        .select()
        .from(pointsRules)
        .where(and(eq(pointsRules.ruleType, input.bonusType), eq(pointsRules.isActive, true)))
        .limit(1);

      if (rule.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'لا توجد قاعدة للمكافأة',
        });
      }

      const bonusPoints = rule[0].fixedPoints || 0;

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (rule[0].expiryMonths || 12));

      // Create transaction
      await db.insert(pointsTransactions).values({
        memberId: member[0].id,
        transactionType: 'bonus',
        points: bonusPoints,
        balanceAfter: member[0].currentPoints + bonusPoints,
        sourceType: input.bonusType,
        sourceId: input.referenceId,
        description: `مكافأة ${input.bonusType}`,
        descriptionAr: `مكافأة ${input.bonusType}`,
        ruleId: rule[0].id,
        expiresAt,
      });

      // Update member points
      await db
        .update(loyaltyMembers)
        .set({
          currentPoints: member[0].currentPoints + bonusPoints,
          totalPointsEarned: member[0].totalPointsEarned + bonusPoints,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(loyaltyMembers.id, member[0].id));

      return {
        success: true,
        pointsEarned: bonusPoints,
        newBalance: member[0].currentPoints + bonusPoints,
        message: `تم إضافة ${bonusPoints} نقطة كمكافأة`,
      };
    }),

  // ==========================================
  // REWARDS & REDEMPTION
  // ==========================================

  /**
   * Get available rewards
   */
  getRewards: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        maxPoints: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const conditions = [
        eq(loyaltyRewards.isActive, true),
        or(
          sql`${loyaltyRewards.quantityLimit} IS NULL`,
          sql`${loyaltyRewards.quantityRedeemed} < ${loyaltyRewards.quantityLimit}`
        ),
      ];

      if (input.category) {
        conditions.push(eq(loyaltyRewards.category, input.category));
      }

      if (input.maxPoints) {
        conditions.push(lte(loyaltyRewards.pointsCost, input.maxPoints));
      }

      const rewards = await db
        .select()
        .from(loyaltyRewards)
        .where(and(...conditions))
        .orderBy(asc(loyaltyRewards.pointsCost));

      return rewards;
    }),

  /**
   * Redeem reward
   */
  redeemReward: protectedProcedure
    .input(
      z.object({
        rewardId: z.number(),
        quantity: z.number().min(1).default(1),
        deliveryDetails: z
          .object({
            address: z.string(),
            phone: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Get member
      const member = await db
        .select()
        .from(loyaltyMembers)
        .where(eq(loyaltyMembers.customerId, ctx.user.id))
        .limit(1);

      if (member.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'عضوية الولاء غير موجودة',
        });
      }

      // Get reward
      const reward = await db
        .select()
        .from(loyaltyRewards)
        .where(eq(loyaltyRewards.id, input.rewardId))
        .limit(1);

      if (reward.length === 0 || !reward[0].isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'المكافأة غير متاحة',
        });
      }

      const totalPointsNeeded = reward[0].pointsCost * input.quantity;

      // Check points balance
      if (member[0].currentPoints < totalPointsNeeded) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `رصيد النقاط غير كافي. تحتاج ${totalPointsNeeded} نقطة`,
        });
      }

      // Check quantity
      if (
        reward[0].quantityLimit &&
        reward[0].quantityRedeemed + input.quantity > reward[0].quantityLimit
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'الكمية المتاحة غير كافية',
        });
      }

      // Check tier requirement
      if (reward[0].minTierId && (member[0].currentTierId || 1) < reward[0].minTierId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'مستوى العضوية غير كافٍ',
        });
      }

      const redemptionCode = `RDM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Calculate expiry for coupon type rewards
      let expiresAt = null;
      if (reward[0].rewardType === 'coupon') {
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      }

      // Create redemption
      await db.insert(rewardRedemptions).values({
        memberId: member[0].id,
        rewardId: reward[0].id,
        quantity: input.quantity,
        pointsSpent: totalPointsNeeded,
        redemptionCode,
        status: 'pending',
        deliveryDetails: input.deliveryDetails,
        expiresAt,
      });

      // Deduct points
      await db.insert(pointsTransactions).values({
        memberId: member[0].id,
        transactionType: 'redeem',
        points: -totalPointsNeeded,
        balanceAfter: member[0].currentPoints - totalPointsNeeded,
        sourceType: 'reward_redemption',
        sourceId: redemptionCode,
        description: `استبدال: ${reward[0].nameAr || reward[0].nameEn}`,
        descriptionAr: `استبدال: ${reward[0].nameAr || reward[0].nameEn}`,
      });

      // Update member
      await db
        .update(loyaltyMembers)
        .set({
          currentPoints: member[0].currentPoints - totalPointsNeeded,
          totalPointsRedeemed: member[0].totalPointsRedeemed + totalPointsNeeded,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(loyaltyMembers.id, member[0].id));

      // Update reward quantity
      await db
        .update(loyaltyRewards)
        .set({
          quantityRedeemed: (reward[0].quantityRedeemed || 0) + input.quantity,
          updatedAt: new Date(),
        })
        .where(eq(loyaltyRewards.id, reward[0].id));

      return {
        success: true,
        redemptionCode,
        pointsSpent: totalPointsNeeded,
        newBalance: member[0].currentPoints - totalPointsNeeded,
        message: 'تم استبدال المكافأة بنجاح',
      };
    }),

  /**
   * Get my redemptions
   */
  getMyRedemptions: protectedProcedure
    .input(
      z.object({
        status: redemptionStatusEnum.optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      // Get member
      const member = await db
        .select()
        .from(loyaltyMembers)
        .where(eq(loyaltyMembers.customerId, ctx.user.id))
        .limit(1);

      if (member.length === 0) {
        return [];
      }

      const conditions = [eq(rewardRedemptions.memberId, member[0].id)];
      if (input.status) {
        conditions.push(eq(rewardRedemptions.status, input.status));
      }

      const redemptions = await db
        .select()
        .from(rewardRedemptions)
        .where(and(...conditions))
        .orderBy(desc(rewardRedemptions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return redemptions;
    }),

  // ==========================================
  // REFERRALS
  // ==========================================

  /**
   * Track referral
   */
  trackReferral: protectedProcedure
    .input(
      z.object({
        referralCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Find referrer by code
      const referrer = await db
        .select()
        .from(loyaltyMembers)
        .where(eq(loyaltyMembers.referralCode, input.referralCode))
        .limit(1);

      if (referrer.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'كود الإحالة غير صحيح',
        });
      }

      // Check if already referred
      const existingReferral = await db
        .select()
        .from(referralTracking)
        .where(eq(referralTracking.referredCustomerId, ctx.user.id))
        .limit(1);

      if (existingReferral.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'لقد تم إحالتك مسبقاً',
        });
      }

      // Create referral tracking
      const referralCode = `TRACK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      await db.insert(referralTracking).values({
        referrerId: referrer[0].id,
        referredCustomerId: ctx.user.id,
        referralCode,
        status: 'pending',
      });

      return {
        success: true,
        message: 'تم تسجيل الإحالة. ستحصل على مكافأتك بعد إتمام أول عملية شراء',
      };
    }),

  /**
   * Get my referrals
   */
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    // Get member
    const member = await db
      .select()
      .from(loyaltyMembers)
      .where(eq(loyaltyMembers.customerId, ctx.user.id))
      .limit(1);

    if (member.length === 0) {
      return {
        referralCode: null,
        referrals: [],
        totalEarned: 0,
      };
    }

    const referrals = await db
      .select()
      .from(referralTracking)
      .where(eq(referralTracking.referrerId, member[0].id))
      .orderBy(desc(referralTracking.createdAt));

    const totalEarned = referrals.reduce((sum, ref) => sum + (ref.referrerPointsEarned || 0), 0);

    return {
      referralCode: member[0].referralCode,
      referrals,
      totalEarned,
    };
  }),

  // ==========================================
  // ANALYTICS (Admin)
  // ==========================================

  /**
   * Get loyalty program statistics
   */
  getStatistics: protectedProcedure.query(async () => {
    const db = await getDb();

    const stats = await db
      .select({
        totalMembers: sql<number>`count(*)`,
        activeMembers: sql<number>`count(*) filter (where is_active = true)`,
        totalPointsCirculating: sql<number>`coalesce(sum(current_points), 0)`,
        totalPointsEverEarned: sql<number>`coalesce(sum(total_points_earned), 0)`,
        totalPointsRedeemed: sql<number>`coalesce(sum(total_points_redeemed), 0)`,
      })
      .from(loyaltyMembers);

    const tierDistribution = await db
      .select({
        tierId: loyaltyMembers.currentTierId,
        count: sql<number>`count(*)`,
      })
      .from(loyaltyMembers)
      .where(eq(loyaltyMembers.isActive, true))
      .groupBy(loyaltyMembers.currentTierId);

    const recentRedemptions = await db
      .select()
      .from(rewardRedemptions)
      .orderBy(desc(rewardRedemptions.createdAt))
      .limit(10);

    return {
      ...stats[0],
      tierDistribution,
      recentRedemptions,
    };
  }),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkAndUpgradeTier(db: Awaited<ReturnType<typeof getDb>>, memberId: number) {
  const member = await db
    .select()
    .from(loyaltyMembers)
    .where(eq(loyaltyMembers.id, memberId))
    .limit(1);

  if (member.length === 0) return;

  const eligibleTier = await db
    .select()
    .from(loyaltyTiers)
    .where(
      and(eq(loyaltyTiers.isActive, true), lte(loyaltyTiers.minPoints, member[0].currentPoints))
    )
    .orderBy(desc(loyaltyTiers.minPoints))
    .limit(1);

  if (eligibleTier.length > 0 && eligibleTier[0].id !== member[0].currentTierId) {
    await db
      .update(loyaltyMembers)
      .set({
        currentTierId: eligibleTier[0].id,
        tierAchievedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loyaltyMembers.id, memberId));
  }
}
