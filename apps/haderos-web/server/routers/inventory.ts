import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import {
  distributeResources,
  checkInventoryAvailability,
  requestReplenishment,
  makeDistributedDecision,
  delegateAuthority,
  getResourceInsights,
} from '../bio-modules/inventory-bio-integration.js';
import { logger } from '../_core/logger';
import { cache } from '../_core/cache';
import { withErrorHandling } from '../_core/error-handler';
import { withPerformanceTracking } from '../_core/async-performance-wrapper';
import { invalidateInventoryCache } from '../_core/cache-manager';
import {
  validateNonEmptyArray,
  validatePositiveNumber,
} from '../_core/validation-utils';

export const inventoryRouter = router({
  // Distribute resources (Bio-Module: Mycelium)
  distributeResources: publicProcedure
    .input(
      z.object({
        orderId: z.number().positive(),
        requiredItems: z
          .array(
            z.object({
              productId: z.number().positive(),
              quantity: z.number().positive(),
            })
          )
          .min(1),
        deliveryLocation: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      return withPerformanceTracking(
        {
          operation: 'inventory.distributeResources',
          details: {
            orderId: input.orderId,
            itemCount: input.requiredItems.length,
            deliveryLocation: input.deliveryLocation,
          },
        },
        async () => {
          return withErrorHandling(
            'inventory.distributeResources',
            async () => {
              // Input validation using utilities
              validatePositiveNumber(input.orderId, 'معرّف الطلب');
              validateNonEmptyArray(input.requiredItems, 'العناصر المطلوبة');
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

              // Create cache key based on order and items
              const cacheKey = `inventory:distribution:${input.orderId}:${input.requiredItems.map((item) => `${item.productId}-${item.quantity}`).join(',')}`;

              // Try cache first, with fallback to Bio-Module
              const result = await cache.getOrSet(
                cacheKey,
                async () => {
                  // Call Bio-Module (Mycelium) - with error handling
                  try {
                    return await distributeResources(
                      input.orderId,
                      input.requiredItems,
                      input.deliveryLocation
                    );
                  } catch (bioError: unknown) {
                    logger.warn('Bio-Module distribution failed, using fallback', {
                      error: bioError instanceof Error ? bioError.message : String(bioError),
                      orderId: input.orderId,
                    });

                    // Fallback response
                    return {
                      success: false,
                      message: 'فشل في توزيع الموارد. يرجى المحاولة مرة أخرى',
                      allocatedResources: [],
                      alternativeOptions: ['استخدام مستودع افتراضي'],
                    };
                  }
                },
                180 // 3 minutes TTL (distribution results change when inventory changes)
              );

              logger.info('Resource distribution completed', {
                orderId: input.orderId,
                success: result.success,
              });

              // Invalidate cache if resources were allocated
              if (result.success && result.allocatedResources?.length > 0) {
                await invalidateInventoryCache({
                  productId: input.requiredItems[0]?.productId,
                });
              }

              return result;
            },
            {
              orderId: input.orderId,
              itemCount: input.requiredItems.length,
            }
          );
        }
      );
    }),

  // Check inventory availability (Bio-Module: Mycelium)
  checkAvailability: publicProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              productId: z.number().positive(),
              quantity: z.number().positive(),
            })
          )
          .min(1),
      })
    )
    .query(async ({ input }) => {
      return withPerformanceTracking(
        {
          operation: 'inventory.checkAvailability',
          details: {
            itemCount: input.items.length,
          },
        },
        async () => {
          return withErrorHandling(
            'inventory.checkAvailability',
            async () => {
              // Input validation using utilities
              validateNonEmptyArray(input.items, 'العناصر');

              // Validate each item
              for (const item of input.items) {
                validatePositiveNumber(item.productId, 'معرّف المنتج');
                validatePositiveNumber(item.quantity, 'الكمية');
              }

              logger.debug('Checking inventory availability', {
                itemCount: input.items.length,
              });

              // Create cache key based on items
              const cacheKey = `inventory:availability:${input.items.map((item) => `${item.productId}-${item.quantity}`).join(',')}`;

              // Try cache first, with fallback to Bio-Module
              const result = await cache.getOrSet(
                cacheKey,
                async () => {
                  // Call Bio-Module (Mycelium) - with error handling
                  try {
                    return await checkInventoryAvailability(input.items);
                  } catch (bioError: unknown) {
                    logger.warn('Bio-Module availability check failed, using fallback', {
                      error: bioError instanceof Error ? bioError.message : String(bioError),
                    });

                    // Fallback response
                    return {
                      available: false,
                      availableItems: [],
                      missingItems: input.items.map((item) => ({
                        productId: item.productId,
                        requiredQuantity: item.quantity,
                        shortfall: item.quantity,
                      })),
                      recommendations: ['التحقق من المخزون يدوياً'],
                    };
                  }
                },
                300 // 5 minutes TTL (inventory availability changes frequently)
              );

              logger.info('Inventory availability check completed', {
                available: result.available,
                itemCount: input.items.length,
              });

              return result;
            },
            {
              itemCount: input.items.length,
            }
          );
        }
      );
    }),

  // Request replenishment (Bio-Module: Mycelium)
  requestReplenishment: protectedProcedure
    .input(
      z.object({
        productId: z.number().positive(),
        quantity: z.number().positive(),
        urgency: z.enum(['low', 'medium', 'high', 'urgent']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return withPerformanceTracking(
        {
          operation: 'inventory.requestReplenishment',
          details: {
            productId: input.productId,
            quantity: input.quantity,
            urgency: input.urgency,
            requestedBy: ctx.user?.id,
          },
        },
        async () => {
          return withErrorHandling(
            'inventory.requestReplenishment',
            async () => {
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
          result = await requestReplenishment(input.productId, input.quantity, input.urgency);
        } catch (bioError: unknown) {
          logger.warn('Bio-Module replenishment request failed', {
            error: bioError instanceof Error ? bioError.message : String(bioError),
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

              logger.info('Replenishment request completed', {
                productId: input.productId,
                success: result.success,
              });

              // Invalidate cache if replenishment was successful
              if (result.success) {
                await invalidateInventoryCache({
                  productId: input.productId,
                });
              }

              return result;
            },
            {
              productId: input.productId,
              quantity: input.quantity,
              requestedBy: ctx.user?.id,
            }
          );
        }
      );
    }),

  // Make distributed decision (Bio-Module: Cephalopod)
  makeDecision: protectedProcedure
    .input(
      z.object({
        decisionType: z.enum([
          'order_approval',
          'pricing_override',
          'inventory_transfer',
          'supplier_selection',
        ]),
        context: z.record(z.any()),
        requiredApprovers: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return withPerformanceTracking(
        {
          operation: 'inventory.makeDecision',
          details: {
            decisionType: input.decisionType,
            requestedBy: ctx.user?.id,
          },
        },
        async () => {
          return withErrorHandling(
            'inventory.makeDecision',
            async () => {
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
        } catch (bioError: unknown) {
          logger.warn('Bio-Module decision making failed', {
            error: bioError instanceof Error ? bioError.message : String(bioError),
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

              logger.info('Distributed decision completed', {
                decisionType: input.decisionType,
                decision: result.decision,
              });

              return result;
            },
            {
              decisionType: input.decisionType,
              requestedBy: ctx.user?.id,
            }
          );
        }
      );
    }),

  // Delegate authority (Bio-Module: Cephalopod)
  delegateAuthority: protectedProcedure
    .input(
      z.object({
        fromEntity: z.string().min(1),
        toEntity: z.string().min(1),
        authority: z.enum([
          'approve_orders',
          'modify_prices',
          'manage_inventory',
          'select_suppliers',
        ]),
        duration: z.number().positive(), // in hours
      })
    )
    .mutation(async ({ input, ctx }) => {
      return withPerformanceTracking(
        {
          operation: 'inventory.delegateAuthority',
          details: {
            fromEntity: input.fromEntity,
            toEntity: input.toEntity,
            authority: input.authority,
            delegatedBy: ctx.user?.id,
          },
        },
        async () => {
          return withErrorHandling(
            'inventory.delegateAuthority',
            async () => {
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
        } catch (bioError: unknown) {
          logger.warn('Bio-Module authority delegation failed', {
            error: bioError instanceof Error ? bioError.message : String(bioError),
          });

          // Fallback response
          result = {
            success: false,
            message: 'فشل في تفويض الصلاحية. يرجى المحاولة مرة أخرى',
            delegationId: null,
            expiresAt: null,
          };
        }

              logger.info('Authority delegation completed', {
                success: result.success,
              });

              return result;
            },
            {
              fromEntity: input.fromEntity,
              toEntity: input.toEntity,
              authority: input.authority,
              delegatedBy: ctx.user?.id,
            }
          );
        }
      );
    }),

  // Get resource insights (Bio-Modules)
  getInsights: publicProcedure.query(async () => {
    return withErrorHandling(
      'inventory.getInsights',
      async () => {
        logger.debug('Fetching resource insights');

        // Call Bio-Module - with error handling
        let insights;
        try {
          insights = await getResourceInsights();
        } catch (bioError: unknown) {
          logger.warn('Bio-Module insights failed, using fallback', {
            error: bioError instanceof Error ? bioError.message : String(bioError),
          });

          // Fallback response
          insights = {
            overallHealth: 0,
            moduleStatus: {},
            recommendations: ['التحقق من حالة Bio-Modules يدوياً'],
          };
        }

        logger.info('Resource insights fetched successfully');

        return insights;
      }
    );
  }),
});
