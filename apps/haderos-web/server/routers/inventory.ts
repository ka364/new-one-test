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

export const inventoryRouter = router({
  // Distribute resources (Bio-Module: Mycelium)
  distributeResources: publicProcedure
    .input(
      z.object({
        orderId: z.number().positive(),
        requiredItems: z.array(
          z.object({
            productId: z.number().positive(),
            quantity: z.number().positive(),
          })
        ).min(1),
        deliveryLocation: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.orderId || input.orderId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف الطلب غير صحيح',
          });
        }

        if (!input.requiredItems || input.requiredItems.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب تحديد عنصر واحد على الأقل',
          });
        }

        if (!input.deliveryLocation || input.deliveryLocation.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'موقع التوصيل مطلوب',
          });
        }

        logger.info('Distributing resources', {
          orderId: input.orderId,
          itemCount: input.requiredItems.length,
          deliveryLocation: input.deliveryLocation,
        });

        // Call Bio-Module (Mycelium) - with error handling
        let result;
        try {
          result = await distributeResources(
            input.orderId,
            input.requiredItems,
            input.deliveryLocation
          );
        } catch (bioError: any) {
          logger.warn('Bio-Module distribution failed, using fallback', {
            error: bioError.message,
            orderId: input.orderId,
          });
          
          // Fallback response
          result = {
            success: false,
            message: 'فشل في توزيع الموارد. يرجى المحاولة مرة أخرى',
            allocatedResources: [],
            alternativeOptions: ['استخدام مستودع افتراضي'],
          };
        }

        const duration = Date.now() - startTime;
        logger.info('Resource distribution completed', {
          orderId: input.orderId,
          success: result.success,
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

        logger.error('Resource distribution failed (Unexpected Error)', error, {
          orderId: input.orderId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء توزيع الموارد. يرجى المحاولة مرة أخرى',
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
            productId: z.number().positive(),
            quantity: z.number().positive(),
          })
        ).min(1),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.items || input.items.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب تحديد عنصر واحد على الأقل',
          });
        }

        // Validate each item
        for (const item of input.items) {
          if (!item.productId || item.productId <= 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'معرّف المنتج غير صحيح',
            });
          }
          if (!item.quantity || item.quantity <= 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'الكمية يجب أن تكون أكبر من صفر',
            });
          }
        }

        logger.debug('Checking inventory availability', {
          itemCount: input.items.length,
        });

        // Call Bio-Module (Mycelium) - with error handling
        let result;
        try {
          result = await checkInventoryAvailability(input.items);
        } catch (bioError: any) {
          logger.warn('Bio-Module availability check failed, using fallback', {
            error: bioError.message,
          });
          
          // Fallback response
          result = {
            available: false,
            availableItems: [],
            missingItems: input.items.map(item => ({
              productId: item.productId,
              requiredQuantity: item.quantity,
              shortfall: item.quantity,
            })),
            recommendations: ['التحقق من المخزون يدوياً'],
          };
        }

        const duration = Date.now() - startTime;
        logger.info('Inventory availability check completed', {
          available: result.available,
          itemCount: input.items.length,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('Inventory availability check failed (TRPCError)', {
            code: error.code,
            message: error.message,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Inventory availability check failed (Unexpected Error)', error, {
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء التحقق من توفر المخزون. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // Request replenishment (Bio-Module: Mycelium)
  requestReplenishment: protectedProcedure
    .input(
      z.object({
        productId: z.number().positive(),
        quantity: z.number().positive(),
        urgency: z.enum(["low", "medium", "high", "urgent"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.productId || input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف المنتج غير صحيح',
          });
        }

        if (!input.quantity || input.quantity <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'الكمية يجب أن تكون أكبر من صفر',
          });
        }

        if (!input.urgency) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'مستوى الأولوية مطلوب',
          });
        }

        logger.info('Requesting replenishment', {
          productId: input.productId,
          quantity: input.quantity,
          urgency: input.urgency,
          requestedBy: ctx.user?.id,
        });

        // Call Bio-Module (Mycelium) - with error handling
        let result;
        try {
          result = await requestReplenishment(
            input.productId,
            input.quantity,
            input.urgency
          );
        } catch (bioError: any) {
          logger.warn('Bio-Module replenishment request failed', {
            error: bioError.message,
            productId: input.productId,
          });
          
          // Fallback response
          result = {
            success: false,
            message: 'فشل في طلب إعادة التزويد. يرجى المحاولة مرة أخرى',
            estimatedDelivery: null,
            supplierRecommendations: [],
          };
        }

        const duration = Date.now() - startTime;
        logger.info('Replenishment request completed', {
          productId: input.productId,
          success: result.success,
          duration: `${duration}ms`,
        });

        return result;
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

        logger.error('Replenishment request failed (Unexpected Error)', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء طلب إعادة التزويد. يرجى المحاولة مرة أخرى',
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
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.decisionType) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'نوع القرار مطلوب',
          });
        }

        if (!input.context || Object.keys(input.context).length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'سياق القرار مطلوب',
          });
        }

        logger.info('Making distributed decision', {
          decisionType: input.decisionType,
          requestedBy: ctx.user?.id,
        });

        // Call Bio-Module (Cephalopod) - with error handling
        let result;
        try {
          result = await makeDistributedDecision(
            input.decisionType,
            input.context,
            input.requiredApprovers || []
          );
        } catch (bioError: any) {
          logger.warn('Bio-Module decision making failed', {
            error: bioError.message,
            decisionType: input.decisionType,
          });
          
          // Fallback response
          result = {
            decision: 'pending',
            message: 'فشل في اتخاذ القرار. يرجى المراجعة اليدوية',
            confidence: 0,
            requiredApprovals: input.requiredApprovers || [],
          };
        }

        const duration = Date.now() - startTime;
        logger.info('Distributed decision completed', {
          decisionType: input.decisionType,
          decision: result.decision,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error instanceof TRPCError) {
          logger.error('Distributed decision failed (TRPCError)', {
            code: error.code,
            message: error.message,
            decisionType: input.decisionType,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Distributed decision failed (Unexpected Error)', error, {
          decisionType: input.decisionType,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء اتخاذ القرار. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // Delegate authority (Bio-Module: Cephalopod)
  delegateAuthority: protectedProcedure
    .input(
      z.object({
        fromEntity: z.string().min(1),
        toEntity: z.string().min(1),
        authority: z.enum([
          "approve_orders",
          "modify_prices",
          "manage_inventory",
          "select_suppliers",
        ]),
        duration: z.number().positive(), // in hours
      })
    )
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.fromEntity || input.fromEntity.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'الكيان المصدر مطلوب',
          });
        }

        if (!input.toEntity || input.toEntity.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'الكيان المستلم مطلوب',
          });
        }

        if (!input.authority) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'الصلاحية مطلوبة',
          });
        }

        if (!input.duration || input.duration <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'مدة التفويض يجب أن تكون أكبر من صفر',
          });
        }

        logger.info('Delegating authority', {
          fromEntity: input.fromEntity,
          toEntity: input.toEntity,
          authority: input.authority,
          duration: input.duration,
          delegatedBy: ctx.user?.id,
        });

        // Call Bio-Module (Cephalopod) - with error handling
        let result;
        try {
          result = await delegateAuthority(
            input.fromEntity,
            input.toEntity,
            input.authority,
            input.duration
          );
        } catch (bioError: any) {
          logger.warn('Bio-Module authority delegation failed', {
            error: bioError.message,
          });
          
          // Fallback response
          result = {
            success: false,
            message: 'فشل في تفويض الصلاحية. يرجى المحاولة مرة أخرى',
            delegationId: null,
            expiresAt: null,
          };
        }

        const duration = Date.now() - startTime;
        logger.info('Authority delegation completed', {
          success: result.success,
          duration: `${duration}ms`,
        });

        return result;
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

        logger.error('Authority delegation failed (Unexpected Error)', error, {
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء تفويض الصلاحية. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // Get resource insights (Bio-Modules)
  getInsights: publicProcedure.query(async () => {
    const startTime = Date.now();
    try {
      logger.debug('Fetching resource insights');

      // Call Bio-Module - with error handling
      let insights;
      try {
        insights = await getResourceInsights();
      } catch (bioError: any) {
        logger.warn('Bio-Module insights failed, using fallback', {
          error: bioError.message,
        });
        
        // Fallback response
        insights = {
          overallHealth: 0,
          moduleStatus: {},
          recommendations: ['التحقق من حالة Bio-Modules يدوياً'],
        };
      }

      const duration = Date.now() - startTime;
      logger.info('Resource insights fetched successfully', {
        duration: `${duration}ms`,
      });

      return insights;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error('Resource insights fetch failed', error, {
        duration: `${duration}ms`,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'حدث خطأ أثناء جلب رؤى الموارد. يرجى المحاولة مرة أخرى',
        cause: error,
      });
    }
  }),
});
