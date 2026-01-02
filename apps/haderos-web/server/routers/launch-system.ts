import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  getAllShippingCompanies,
  createShippingCompany,
  getZonesByCompany,
  createShipment,
  getShipmentsByOrder,
  updateShipmentStatus,
  createShipmentReturn,
  createCollection,
  getCollectionsByCompany,
  confirmCollection,
  addCollectionItem,
  getCollectionItems,
  getPendingCollections,
  getTotalCollectionByDate,
  getOrCreateDailyMetrics,
  updateDailyMetrics,
  calculateAndUpdateKPIs,
  getMetricsByDateRange,
  createAdCampaign,
  getAdCampaignsByDate,
  getLastCampaignEfficiency,
  createRevenueForecast,
  updateActualRevenue,
  getForecastByDate,
  calculateExpectedRevenue,
} from '../db';

// ============================================
// SHIPPING & LOGISTICS ROUTER
// ============================================

export const shippingRouter = router({
  // Shipping Companies
  getAllCompanies: protectedProcedure.query(async () => {
    return await getAllShippingCompanies();
  }),

  createCompany: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        nameAr: z.string().optional(),
        code: z.string(),
        zonesConfig: z.any(),
        codFeeConfig: z.any().optional(),
        insuranceFeeConfig: z.any().optional(),
        returnFeePercentage: z.string().optional(),
        exchangeFeePercentage: z.string().optional(),
        bankTransfersPerWeek: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createShippingCompany(input);
    }),

  // Shipping Zones
  getZonesByCompany: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return await getZonesByCompany(input.companyId);
    }),

  // Shipments
  createShipment: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        companyId: z.number(),
        trackingNumber: z.string().optional(),
        zoneId: z.number(),
        weight: z.string(),
        shippingCost: z.string(),
        codFee: z.string().optional(),
        insuranceFee: z.string().optional(),
        totalCost: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createShipment({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  getShipmentsByOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return await getShipmentsByOrder(input.orderId);
    }),

  updateShipmentStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          'pending',
          'picked_up',
          'in_transit',
          'out_for_delivery',
          'delivered',
          'returned',
          'lost',
          'cancelled',
        ]),
        shippedAt: z.string().optional(),
        deliveredAt: z.string().optional(),
        returnedAt: z.string().optional(),
        returnReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, status, ...updates } = input;
      return await updateShipmentStatus(id, status, updates);
    }),

  // Shipment Returns
  createReturn: protectedProcedure
    .input(
      z.object({
        shipmentId: z.number(),
        returnType: z.enum(['full_return', 'exchange', 'delivery_failed']),
        returnReason: z.string().optional(),
        returnCost: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createShipmentReturn(input);
    }),
});

// ============================================
// COLLECTIONS ROUTER
// ============================================

export const collectionsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        collectionType: z.enum(['cash', 'bank_transfer']),
        companyId: z.number(),
        amount: z.string(),
        collectionDate: z.string(),
        receiptNumber: z.string().optional(),
        bankReference: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createCollection({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  getByCompany: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getCollectionsByCompany(input.companyId, input.startDate, input.endDate);
    }),

  confirm: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return await confirmCollection(input.id, ctx.user.id);
    }),

  addItem: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        orderId: z.number(),
        amount: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await addCollectionItem(input);
    }),

  getItems: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .query(async ({ input }) => {
      return await getCollectionItems(input.collectionId);
    }),

  getPending: protectedProcedure.query(async () => {
    return await getPendingCollections();
  }),

  getTotalByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      return await getTotalCollectionByDate(input.date);
    }),
});

// ============================================
// METRICS & KPIs ROUTER
// ============================================

export const metricsRouter = router({
  getDailyMetrics: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      return await getOrCreateDailyMetrics(input.date);
    }),

  updateMetrics: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        ordersCreated: z.number().optional(),
        ordersCreatedValue: z.string().optional(),
        ordersConfirmed: z.number().optional(),
        ordersConfirmedValue: z.string().optional(),
        ordersShipped: z.number().optional(),
        ordersShippedValue: z.string().optional(),
        ordersReturned: z.number().optional(),
        ordersReturnedValue: z.string().optional(),
        ordersDelivered: z.number().optional(),
        ordersDeliveredValue: z.string().optional(),
        totalCollection: z.string().optional(),
        cashCollection: z.string().optional(),
        bankCollection: z.string().optional(),
        operatingExpenses: z.string().optional(),
        adSpend: z.string().optional(),
        treasuryPaid: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { date, ...data } = input;
      await updateDailyMetrics(date, data);
      return await calculateAndUpdateKPIs(date);
    }),

  calculateKPIs: protectedProcedure
    .input(z.object({ date: z.string() }))
    .mutation(async ({ input }) => {
      return await calculateAndUpdateKPIs(input.date);
    }),

  getMetricsByRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getMetricsByDateRange(input.startDate, input.endDate);
    }),

  // Ad Campaigns
  createAdCampaign: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        campaignName: z.string(),
        platform: z.enum(['facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'other']),
        spend: z.string(),
        results: z.number(),
        costPerResult: z.string(),
        reach: z.number().optional(),
        impressions: z.number().optional(),
        clicks: z.number().optional(),
        conversions: z.number().optional(),
        messagesStarted: z.number().optional(),
        costPerMessage: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createAdCampaign({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  getAdCampaignsByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      return await getAdCampaignsByDate(input.date);
    }),

  // Revenue Forecasts
  calculateExpectedRevenue: protectedProcedure
    .input(
      z.object({
        adSpend: z.number(),
        lastCampaignEfficiency: z.number().optional(),
        averageOrderValue: z.number(),
        shipmentRate: z.number(),
        deliverySuccessRate: z.number(),
      })
    )
    .query(async ({ input }) => {
      const efficiency = input.lastCampaignEfficiency || (await getLastCampaignEfficiency());
      return calculateExpectedRevenue(
        input.adSpend,
        efficiency,
        input.averageOrderValue,
        input.shipmentRate,
        input.deliverySuccessRate
      );
    }),

  createForecast: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        adSpend: z.string(),
        lastCampaignEfficiency: z.string(),
        expectedOrders: z.number(),
        averageOrderValue: z.string(),
        shipmentRate: z.string(),
        deliverySuccessRate: z.string(),
        expectedRevenue: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createRevenueForecast({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  updateActualRevenue: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        actualRevenue: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateActualRevenue(input.date, input.actualRevenue);
    }),

  getForecastByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      return await getForecastByDate(input.date);
    }),
});
