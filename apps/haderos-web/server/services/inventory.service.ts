/**
 * Inventory Service
 * خدمة المخزون
 *
 * Business logic layer for inventory operations.
 * Separates business logic from router layer.
 */

import { TRPCError } from '@trpc/server';
import { logger } from '../_core/logger';
import { cache } from '../_core/cache';
import {
  distributeResources,
  checkInventoryAvailability,
  requestReplenishment,
  makeDistributedDecision,
  delegateAuthority,
  getResourceInsights,
} from '../bio-modules/inventory-bio-integration.js';
import { invalidateInventoryCache } from '../_core/cache-manager';
import {
  validatePositiveNumber,
  validateNonEmptyArray,
  validateNonEmptyString,
} from '../_core/validation-utils';

// ============================================
// TYPES
// ============================================

export interface DistributeResourcesInput {
  orderId: number;
  requiredItems: Array<{
    productId: number;
    quantity: number;
  }>;
  deliveryLocation: string;
}

export interface DistributeResourcesResult {
  success: boolean;
  message: string;
  allocatedResources: Array<{
    productId: number;
    quantity: number;
    location: string;
  }>;
  alternativeOptions: string[];
}

export interface CheckAvailabilityInput {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface CheckAvailabilityResult {
  available: boolean;
  availableItems: Array<{
    productId: number;
    quantity: number;
  }>;
  missingItems: Array<{
    productId: number;
    requiredQuantity: number;
    shortfall: number;
  }>;
  recommendations: string[];
}

export interface RequestReplenishmentInput {
  productId: number;
  quantity: number;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
}

export interface RequestReplenishmentResult {
  success: boolean;
  message: string;
  estimatedDelivery?: Date;
  supplierRecommendations: string[];
}

export interface MakeDecisionInput {
  decisionType: 'order_approval' | 'pricing_override' | 'inventory_transfer' | 'supplier_selection';
  context: Record<string, unknown>;
  requiredApprovers?: string[];
}

export interface MakeDecisionResult {
  decision: string;
  message: string;
  confidence: number;
  requiredApprovals: string[];
}

export interface DelegateAuthorityInput {
  fromEntity: string;
  toEntity: string;
  authority: 'approve_orders' | 'modify_prices' | 'manage_inventory' | 'select_suppliers';
  duration: number; // in hours
}

export interface DelegateAuthorityResult {
  success: boolean;
  message: string;
  delegationId?: string;
  expiresAt?: Date;
}

// ============================================
// INVENTORY SERVICE
// ============================================

export class InventoryService {
  /**
   * Distribute resources (Bio-Module: Mycelium)
   */
  static async distributeResources(input: DistributeResourcesInput): Promise<DistributeResourcesResult> {
    // Input validation using utilities
    validatePositiveNumber(input.orderId, 'معرّف الطلب');
    validateNonEmptyArray(input.requiredItems, 'العناصر المطلوبة');
    validateNonEmptyString(input.deliveryLocation, 'موقع التوصيل');

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
  }

  /**
   * Check inventory availability (Bio-Module: Mycelium)
   */
  static async checkAvailability(input: CheckAvailabilityInput): Promise<CheckAvailabilityResult> {
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
  }

  /**
   * Request replenishment (Bio-Module: Mycelium)
   */
  static async requestReplenishment(input: RequestReplenishmentInput): Promise<RequestReplenishmentResult> {
    validatePositiveNumber(input.productId, 'معرّف المنتج');
    validatePositiveNumber(input.quantity, 'الكمية');

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
        estimatedDelivery: undefined,
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
  }

  /**
   * Make distributed decision (Bio-Module: Cephalopod)
   */
  static async makeDecision(input: MakeDecisionInput): Promise<MakeDecisionResult> {
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
  }

  /**
   * Delegate authority (Bio-Module: Cephalopod)
   */
  static async delegateAuthority(input: DelegateAuthorityInput): Promise<DelegateAuthorityResult> {
    validateNonEmptyString(input.fromEntity, 'الكيان المصدر');
    validateNonEmptyString(input.toEntity, 'الكيان المستلم');
    validatePositiveNumber(input.duration, 'مدة التفويض');

    if (!input.authority) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'الصلاحية مطلوبة',
      });
    }

    logger.info('Delegating authority', {
      fromEntity: input.fromEntity,
      toEntity: input.toEntity,
      authority: input.authority,
      duration: input.duration,
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
        delegationId: undefined,
        expiresAt: undefined,
      };
    }

    logger.info('Authority delegation completed', {
      success: result.success,
    });

    return result;
  }

  /**
   * Get resource insights (Bio-Modules)
   */
  static async getInsights(): Promise<{
    overallHealth: number;
    moduleStatus: Record<string, unknown>;
    recommendations: string[];
  }> {
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
}

