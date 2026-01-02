/**
 * @fileoverview Inventory Router - HADEROS E-commerce Platform
 * @module server/routers/inventory
 * @description Manages inventory across multiple branches with Bio-Modules
 * integration for intelligent resource distribution and stock management.
 *
 * @author HADEROS Team
 * @version 2.0.0
 * @license MIT
 *
 * Bio-Modules Integration:
 * - Mycelium: Resource distribution across branches
 * - Cephalopod: Distributed decision making
 *
 * @example
 * // Check inventory availability
 * const availability = await trpc.inventory.checkAvailability.query({
 *   productId: 123,
 *   quantity: 10
 * });
 *
 * @example
 * // Distribute resources
 * const distribution = await trpc.inventory.distributeResources.query({
 *   orderId: 456,
 *   requiredItems: [{ productId: 123, quantity: 5 }],
 *   deliveryLocation: 'القاهرة'
 * });
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  distributeResources,
  checkInventoryAvailability,
  requestReplenishment,
  makeDistributedDecision,
  delegateAuthority,
  getResourceInsights,
} from "../bio-modules/inventory-bio-integration.js";
import { logger } from "../_core/logger";

/**
 * Inventory Router - tRPC router for inventory management
 *
 * @description Provides procedures for:
 * - Resource distribution across branches (Mycelium)
 * - Availability checking
 * - Replenishment requests
 * - Distributed decision making (Cephalopod)
 * - Authority delegation
 *
 * @see {@link ../bio-modules/inventory-bio-integration Bio-Modules Integration}
 */
export const inventoryRouter = router({
  /**
   * Distribute resources using Mycelium Bio-Module
   *
   * @description Intelligently distributes inventory from optimal branches
   * based on distance, availability, and cost optimization.
   */
  distributeResources: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        requiredItems: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number(),
          })
        ),
        deliveryLocation: z.string(),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (!input.requiredItems || input.requiredItems.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب تحديد عنصر واحد على الأقل',
          });
        }

        // Validate quantities
        for (const item of input.requiredItems) {
          if (item.quantity <= 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `الكمية يجب أن تكون أكبر من صفر للمنتج ${item.productId}`,
            });
          }
        }

        if (!input.deliveryLocation || input.deliveryLocation.trim() === '') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب تحديد موقع التسليم',
          });
        }

        logger.info('Distributing resources', {
          orderId: input.orderId,
          itemCount: input.requiredItems.length,
          deliveryLocation: input.deliveryLocation,
        });

        const result = await distributeResources(
          input.orderId,
          input.requiredItems,
          input.deliveryLocation
        );

        const duration = Date.now() - startTime;
        logger.info('Resources distributed successfully', {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Resource distribution failed (TRPCError)', {
            code: error.code,
            message: error.message,
            orderId: input.orderId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Resource distribution failed', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في توزيع الموارد',
          cause: error,
        });
      }
    }),

  // Check inventory availability (Bio-Module: Mycelium)
  checkAvailability: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (!input.items || input.items.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب تحديد عنصر واحد على الأقل للتحقق',
          });
        }

        // Validate quantities
        for (const item of input.items) {
          if (item.quantity <= 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `الكمية يجب أن تكون أكبر من صفر للمنتج ${item.productId}`,
            });
          }
        }

        logger.debug('Checking inventory availability', {
          itemCount: input.items.length,
        });

        const result = await checkInventoryAvailability(input.items);

        const duration = Date.now() - startTime;
        logger.debug('Availability check completed', {
          itemCount: input.items.length,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) throw error;

        logger.error('Availability check failed', error, {
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في التحقق من توفر المخزون',
          cause: error,
        });
      }
    }),

  // Request replenishment (Bio-Module: Mycelium)
  requestReplenishment: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number(),
        urgency: z.enum(["low", "medium", "high", "urgent"]),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (input.quantity <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'الكمية يجب أن تكون أكبر من صفر',
          });
        }

        logger.info('Requesting replenishment', {
          productId: input.productId,
          quantity: input.quantity,
          urgency: input.urgency,
        });

        const result = await requestReplenishment(
          input.productId,
          input.quantity,
          input.urgency
        );

        const duration = Date.now() - startTime;
        logger.info('Replenishment request submitted', {
          productId: input.productId,
          urgency: input.urgency,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          message: 'تم إرسال طلب التجديد بنجاح',
          ...result,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Replenishment request failed (TRPCError)', {
            code: error.code,
            message: error.message,
            productId: input.productId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Replenishment request failed', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في إرسال طلب التجديد',
          cause: error,
        });
      }
    }),

  // Make distributed decision (Bio-Module: Cephalopod)
  makeDecision: protectedProcedure
    .input(
      z.object({
        decisionType: z.enum([
          "order_approval",
          "pricing_override",
          "inventory_transfer",
          "supplier_selection",
        ]),
        context: z.record(z.any()),
        requiredApprovers: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        logger.info('Making distributed decision', {
          decisionType: input.decisionType,
          approversCount: input.requiredApprovers?.length || 0,
        });

        const result = await makeDistributedDecision(
          input.decisionType,
          input.context,
          input.requiredApprovers || []
        );

        const duration = Date.now() - startTime;
        logger.info('Decision made successfully', {
          decisionType: input.decisionType,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          message: 'تم اتخاذ القرار بنجاح',
          ...result,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) throw error;

        logger.error('Decision making failed', error, {
          decisionType: input.decisionType,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في اتخاذ القرار',
          cause: error,
        });
      }
    }),

  // Delegate authority (Bio-Module: Cephalopod)
  delegateAuthority: protectedProcedure
    .input(
      z.object({
        fromEntity: z.string(),
        toEntity: z.string(),
        authority: z.enum([
          "approve_orders",
          "modify_prices",
          "manage_inventory",
          "select_suppliers",
        ]),
        duration: z.number(), // in hours
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Validation
        if (input.fromEntity === input.toEntity) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'لا يمكن تفويض السلطة لنفس الجهة',
          });
        }

        if (input.duration <= 0 || input.duration > 720) { // Max 30 days
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'مدة التفويض يجب أن تكون بين 1 و 720 ساعة',
          });
        }

        logger.info('Delegating authority', {
          from: input.fromEntity,
          to: input.toEntity,
          authority: input.authority,
          duration: input.duration,
        });

        const result = await delegateAuthority(
          input.fromEntity,
          input.toEntity,
          input.authority,
          input.duration
        );

        const duration = Date.now() - startTime;
        logger.info('Authority delegated successfully', {
          from: input.fromEntity,
          to: input.toEntity,
          authority: input.authority,
          duration: `${duration}ms`,
        });

        return {
          success: true,
          message: 'تم تفويض السلطة بنجاح',
          ...result,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Authority delegation failed (TRPCError)', {
            code: error.code,
            message: error.message,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Authority delegation failed', error, {
          from: input.fromEntity,
          to: input.toEntity,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في تفويض السلطة',
          cause: error,
        });
      }
    }),

  // Get resource insights (Bio-Modules)
  getInsights: publicProcedure.query(async () => {
    const startTime = Date.now();

    try {
      logger.debug('Fetching resource insights');

      const insights = await getResourceInsights();

      const duration = Date.now() - startTime;
      logger.debug('Resource insights fetched', {
        duration: `${duration}ms`,
      });

      return insights;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error('Failed to fetch resource insights', error, {
        duration: `${duration}ms`,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في جلب تحليلات الموارد',
        cause: error,
      });
    }
  }),
});
