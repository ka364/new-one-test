/**
 * Affiliate tRPC Router
 * موجه API لنظام المسوقين
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { getAffiliateManager, AFFILIATE_TIERS } from '../affiliate/system';
import { getMarketingToolsManager } from '../affiliate/marketing-tools';

export const affiliateRouter = router({
  /**
   * Register a new affiliate
   */
  register: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        phone: z.string(),
        email: z.string().email().optional(),
        factoryId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getAffiliateManager();
      const affiliate = manager.registerAffiliate(
        input.name,
        input.phone,
        input.email,
        input.factoryId
      );
      return affiliate;
    }),

  /**
   * Get affiliate by code
   */
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const manager = getAffiliateManager();
      const affiliate = manager.getAffiliateByCode(input.code);
      if (!affiliate) {
        throw new Error('Affiliate not found');
      }
      return affiliate;
    }),

  /**
   * Get affiliate by ID
   */
  getById: protectedProcedure
    .input(z.object({ affiliateId: z.string() }))
    .query(async ({ input }) => {
      const manager = getAffiliateManager();
      const affiliate = manager.getAffiliate(input.affiliateId);
      if (!affiliate) {
        throw new Error('Affiliate not found');
      }
      return affiliate;
    }),

  /**
   * Track an order for an affiliate
   */
  trackOrder: publicProcedure
    .input(
      z.object({
        affiliateCode: z.string(),
        orderId: z.string(),
        customerName: z.string(),
        customerPhone: z.string(),
        orderAmount: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getAffiliateManager();
      const order = manager.trackOrder(
        input.affiliateCode,
        input.orderId,
        input.customerName,
        input.customerPhone,
        input.orderAmount
      );
      return order;
    }),

  /**
   * Confirm an order
   */
  confirmOrder: protectedProcedure
    .input(z.object({ affiliateOrderId: z.string() }))
    .mutation(async ({ input }) => {
      const manager = getAffiliateManager();
      manager.confirmOrder(input.affiliateOrderId);
      return { success: true };
    }),

  /**
   * Request commission payout
   */
  requestPayout: protectedProcedure
    .input(
      z.object({
        affiliateId: z.string(),
        paymentMethod: z.enum(['bank_transfer', 'cash', 'wallet']),
        bankAccount: z
          .object({
            accountNumber: z.string(),
            bankName: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getAffiliateManager();
      const payout = manager.requestPayout(
        input.affiliateId,
        input.paymentMethod,
        input.bankAccount
      );
      return payout;
    }),

  /**
   * Process payout (admin only)
   */
  processPayout: protectedProcedure
    .input(
      z.object({
        payoutId: z.string(),
        reference: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getAffiliateManager();
      manager.processPayout(input.payoutId, input.reference);
      return { success: true };
    }),

  /**
   * Get affiliate statistics
   */
  getStats: protectedProcedure
    .input(z.object({ affiliateId: z.string() }))
    .query(async ({ input }) => {
      const manager = getAffiliateManager();
      return manager.getAffiliateStats(input.affiliateId);
    }),

  /**
   * Get affiliate orders
   */
  getOrders: protectedProcedure
    .input(z.object({ affiliateId: z.string() }))
    .query(async ({ input }) => {
      const manager = getAffiliateManager();
      return manager.getAffiliateOrders(input.affiliateId);
    }),

  /**
   * Get affiliate payouts
   */
  getPayouts: protectedProcedure
    .input(z.object({ affiliateId: z.string() }))
    .query(async ({ input }) => {
      const manager = getAffiliateManager();
      return manager.getAffiliatePayouts(input.affiliateId);
    }),

  /**
   * Get all affiliates (admin only)
   */
  getAll: protectedProcedure.query(async () => {
    const manager = getAffiliateManager();
    return manager.getAllAffiliates();
  }),

  /**
   * Generate affiliate link
   */
  generateLink: protectedProcedure
    .input(
      z.object({
        affiliateCode: z.string(),
        productId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const manager = getAffiliateManager();
      return {
        link: manager.generateAffiliateLink(input.affiliateCode, input.productId),
      };
    }),

  /**
   * Generate live stream affiliate link
   */
  generateLiveStreamLink: protectedProcedure
    .input(
      z.object({
        affiliateCode: z.string(),
        streamId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const manager = getAffiliateManager();
      return {
        link: manager.generateLiveStreamLink(input.affiliateCode, input.streamId),
      };
    }),

  /**
   * Get affiliate tiers information
   */
  getTiers: publicProcedure.query(async () => {
    return AFFILIATE_TIERS;
  }),

  /**
   * Get all marketing assets
   */
  getMarketingAssets: protectedProcedure.query(async () => {
    const manager = getMarketingToolsManager();
    return manager.getAllAssets();
  }),

  /**
   * Get marketing assets by type
   */
  getMarketingAssetsByType: protectedProcedure
    .input(z.object({ type: z.enum(['image', 'video', 'text', 'template']) }))
    .query(async ({ input }) => {
      const manager = getMarketingToolsManager();
      return manager.getAssetsByType(input.type);
    }),

  /**
   * Get social media templates
   */
  getSocialMediaTemplates: protectedProcedure.query(async () => {
    const manager = getMarketingToolsManager();
    return manager.getSocialMediaTemplates();
  }),

  /**
   * Generate personalized marketing content
   */
  generatePersonalizedContent: protectedProcedure
    .input(
      z.object({
        affiliateCode: z.string(),
        affiliateName: z.string(),
        productName: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const manager = getMarketingToolsManager();
      return manager.generatePersonalizedContent(
        input.affiliateCode,
        input.affiliateName,
        input.productName
      );
    }),
});
