/**
 * Smart Shipping Router
 * موجه نظام التوزيع الذكي
 * 
 * tRPC router for the smart shipping distributor system
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { getSmartDistributorManager } from '../shipping/smart-distributor';

export const smartShippingRouter = router({
  /**
   * Register a new distributor
   */
  registerDistributor: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        nameAr: z.string(),
        type: z.enum(['company', 'individual', 'partner']),
        phone: z.string(),
        email: z.string().optional(),
        baseLocation: z.object({
          lat: z.number(),
          lng: z.number(),
          address: z.string(),
          addressAr: z.string(),
        }),
        coverageAreas: z.array(z.string()),
        coverageRadius: z.number(),
        maxDailyOrders: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getSmartDistributorManager();
      return manager.registerDistributor(
        input.name,
        input.nameAr,
        input.type,
        input.phone,
        input.email,
        input.baseLocation,
        input.coverageAreas,
        input.coverageRadius,
        input.maxDailyOrders
      );
    }),

  /**
   * Find optimal distributor for a delivery
   */
  findOptimalDistributor: protectedProcedure
    .input(
      z.object({
        deliveryLocation: z.object({
          lat: z.number(),
          lng: z.number(),
          address: z.string(),
        }),
        pickupLocation: z.object({
          lat: z.number(),
          lng: z.number(),
          address: z.string(),
        }),
        packageValue: z.number(),
        urgency: z.enum(['standard', 'express', 'same_day']),
      })
    )
    .query(async ({ input }) => {
      const manager = getSmartDistributorManager();
      return manager.findOptimalDistributor(
        input.deliveryLocation,
        input.pickupLocation,
        input.packageValue,
        input.urgency
      );
    }),

  /**
   * Assign delivery to distributor
   */
  assignDelivery: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        distributorId: z.string(),
        pickupLocation: z.object({
          lat: z.number(),
          lng: z.number(),
          address: z.string(),
          addressAr: z.string(),
        }),
        deliveryLocation: z.object({
          lat: z.number(),
          lng: z.number(),
          address: z.string(),
          addressAr: z.string(),
        }),
        customerName: z.string(),
        customerPhone: z.string(),
        packageDescription: z.string(),
        packageDescriptionAr: z.string(),
        packageValue: z.number(),
        deliveryFee: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getSmartDistributorManager();
      return manager.assignDelivery(
        input.orderId,
        input.distributorId,
        input.pickupLocation,
        input.deliveryLocation,
        input.customerName,
        input.customerPhone,
        input.packageDescription,
        input.packageDescriptionAr,
        input.packageValue,
        input.deliveryFee
      );
    }),

  /**
   * Update assignment status
   */
  updateAssignmentStatus: protectedProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        status: z.enum(['accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled']),
        currentLocation: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getSmartDistributorManager();
      manager.updateAssignmentStatus(input.assignmentId, input.status, input.currentLocation);
      return { success: true };
    }),

  /**
   * Rate a delivery
   */
  rateDelivery: protectedProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getSmartDistributorManager();
      manager.rateDelivery(input.assignmentId, input.rating, input.feedback);
      return { success: true };
    }),

  /**
   * Get all distributors
   */
  getAllDistributors: protectedProcedure.query(async () => {
    const manager = getSmartDistributorManager();
    return manager.getAllDistributors();
  }),

  /**
   * Get distributor performance
   */
  getDistributorPerformance: protectedProcedure
    .input(
      z.object({
        distributorId: z.string(),
        period: z.enum(['daily', 'weekly', 'monthly']),
      })
    )
    .query(async ({ input }) => {
      const manager = getSmartDistributorManager();
      return manager.getDistributorPerformance(input.distributorId, input.period);
    }),

  /**
   * Get distributor assignments
   */
  getDistributorAssignments: protectedProcedure
    .input(z.object({ distributorId: z.string() }))
    .query(async ({ input }) => {
      const manager = getSmartDistributorManager();
      return manager.getDistributorAssignments(input.distributorId);
    }),
});
