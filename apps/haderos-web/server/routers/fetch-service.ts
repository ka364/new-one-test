/**
 * Fetch Service Router
 * موجه خدمة "أحضر لي"
 * 
 * tRPC router for the "Fetch for Me" service with Shopify integration
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { getFetchServiceManager } from '../fetch-service/system';

export const fetchServiceRouter = router({
  /**
   * Calculate estimated cost for a fetch request
   */
  calculateCost: publicProcedure
    .input(
      z.object({
        productPrice: z.number(),
        quantity: z.number(),
        estimatedDistance: z.number(),
      })
    )
    .query(async ({ input }) => {
      const manager = getFetchServiceManager();
      return manager.calculateEstimatedCost(input.productPrice, input.quantity, input.estimatedDistance);
    }),

  /**
   * Create a new fetch request
   */
  createRequest: publicProcedure
    .input(
      z.object({
        customerName: z.string(),
        customerPhone: z.string(),
        customerEmail: z.string().optional(),
        deliveryAddress: z.string(),
        deliveryAddressAr: z.string(),
        city: z.string(),
        productName: z.string(),
        productNameAr: z.string(),
        productDescription: z.string(),
        productUrl: z.string().optional(),
        quantity: z.number(),
        sourceName: z.string(),
        sourceLocation: z.string(),
        estimatedProductPrice: z.number(),
        estimatedDistance: z.number(),
        customerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getFetchServiceManager();
      return manager.createRequest(
        input.customerName,
        input.customerPhone,
        input.customerEmail,
        input.deliveryAddress,
        input.deliveryAddressAr,
        input.city,
        input.productName,
        input.productNameAr,
        input.productDescription,
        input.productUrl,
        input.quantity,
        input.sourceName,
        input.sourceLocation,
        input.estimatedProductPrice,
        input.estimatedDistance,
        input.customerNotes
      );
    }),

  /**
   * Shopify webhook: Order created
   * This is called when a customer completes payment on Shopify
   */
  shopifyOrderCreated: publicProcedure
    .input(
      z.object({
        shopifyOrderId: z.string(),
        requestId: z.string(),
        paymentMethod: z.enum(['card', 'fawry', 'wallet', 'bank_transfer']),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getFetchServiceManager();
      manager.confirmPayment(input.requestId, input.shopifyOrderId, input.paymentMethod);
      return { success: true };
    }),

  /**
   * Assign request to procurement team member
   */
  assignToProcurement: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        employeeId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getFetchServiceManager();
      manager.assignToProcurement(input.requestId, input.employeeId);
      return { success: true };
    }),

  /**
   * Mark product as purchased
   */
  markAsPurchased: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        actualProductPrice: z.number(),
        purchaseReceipt: z.string(),
        procurementNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getFetchServiceManager();
      manager.markAsPurchased(
        input.requestId,
        input.actualProductPrice,
        input.purchaseReceipt,
        input.procurementNotes
      );
      return { success: true };
    }),

  /**
   * Assign to shipping
   */
  assignToShipping: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        distributorId: z.string(),
        trackingNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getFetchServiceManager();
      manager.assignToShipping(input.requestId, input.distributorId, input.trackingNumber);
      return { success: true };
    }),

  /**
   * Mark as delivered
   */
  markAsDelivered: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ input }) => {
      const manager = getFetchServiceManager();
      manager.markAsDelivered(input.requestId);
      return { success: true };
    }),

  /**
   * Cancel request
   */
  cancelRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getFetchServiceManager();
      manager.cancelRequest(input.requestId, input.reason);
      return { success: true };
    }),

  /**
   * Get request by ID
   */
  getRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input }) => {
      const manager = getFetchServiceManager();
      return manager.getRequest(input.requestId);
    }),

  /**
   * Get all requests
   */
  getAllRequests: protectedProcedure.query(async () => {
    const manager = getFetchServiceManager();
    return manager.getAllRequests();
  }),

  /**
   * Get requests by status
   */
  getRequestsByStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(['pending_payment', 'paid', 'procurement', 'purchased', 'shipping', 'delivered', 'cancelled']),
      })
    )
    .query(async ({ input }) => {
      const manager = getFetchServiceManager();
      return manager.getRequestsByStatus(input.status);
    }),

  /**
   * Get requests assigned to employee
   */
  getRequestsByEmployee: protectedProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ input }) => {
      const manager = getFetchServiceManager();
      return manager.getRequestsByEmployee(input.employeeId);
    }),

  /**
   * Get service configuration
   */
  getConfig: protectedProcedure.query(async () => {
    const manager = getFetchServiceManager();
    return manager.getConfig();
  }),

  /**
   * Update service configuration
   */
  updateConfig: protectedProcedure
    .input(
      z.object({
        serviceFeePercentage: z.number().optional(),
        minServiceFee: z.number().optional(),
        shippingFeePerKm: z.number().optional(),
        baseShippingFee: z.number().optional(),
        maxEstimatedPrice: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const manager = getFetchServiceManager();
      manager.updateConfig(input);
      return { success: true };
    }),
});
