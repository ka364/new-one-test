/**
 * @fileoverview Cache Manager Utilities
 * @description Apple-Level Cache Management
 * 
 * Provides utilities for consistent cache invalidation and management
 * across all routers and services. Includes graceful error handling
 * and comprehensive cache key management.
 * 
 * @module cache-manager
 * @author HADEROS Team
 * @since 1.0.0
 */

import { logger } from './logger';
import { cache } from './cache';

/**
 * Cache key configuration for an entity
 */
export interface CacheKeys {
  /** Array of cache keys for "all" queries */
  all?: string[];
  /** Function to generate cache key by ID */
  byId?: (id: number | string) => string;
  /** Function to generate cache key by status */
  byStatus?: (status: string) => string;
  /** Function to generate cache key by customer */
  byCustomer?: (customerId: string) => string;
  /** Custom cache keys */
  custom?: string[];
}

/**
 * Context for cache invalidation
 */
export interface CacheInvalidationContext {
  /** Entity name (e.g., 'orders', 'products') */
  entity: string;
  /** Cache key configuration */
  keys: CacheKeys;
  /** Additional context for key generation */
  context?: Record<string, unknown>;
}

/**
 * Safely invalidates cache keys with error handling
 *
 * @param {string[]} keys - Array of cache keys to invalidate
 * @returns {Promise<void>}
 *
 * @description
 * Invalidates multiple cache keys with graceful error handling.
 * Continues invalidating remaining keys even if one fails.
 * Logs warnings for failed invalidations but doesn't throw.
 *
 * @example
 * ```typescript
 * await safeCacheInvalidate([
 *   'orders:all',
 *   'orders:123',
 *   'orders:status:pending'
 * ]);
 * ```
 */
export async function safeCacheInvalidate(keys: string[]): Promise<void> {
  for (const key of keys) {
    try {
      cache.delete(key);
    } catch (error: unknown) {
      logger.warn('Cache invalidation failed', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      // Continue even if cache invalidation fails
    }
  }
}

/**
 * Invalidates cache based on context and entity configuration
 *
 * @param {CacheInvalidationContext} context - Cache invalidation context
 * @returns {Promise<void>}
 *
 * @description
 * Intelligently invalidates cache keys based on entity configuration and context.
 * Generates all relevant cache keys (by ID, status, customer, etc.) and invalidates them.
 * Handles errors gracefully and logs invalidation details.
 *
 * @example
 * ```typescript
 * await invalidateCache({
 *   entity: 'orders',
 *   keys: createCacheKeys('orders'),
 *   context: {
 *     id: 123,
 *     status: 'pending',
 *     customerId: '01012345678'
 *   }
 * });
 * ```
 */
export async function invalidateCache(
  context: CacheInvalidationContext
): Promise<void> {
  const { entity, keys, context: ctx = {} } = context;
  const keysToInvalidate: string[] = [];

  // Add all keys
  if (keys.all) {
    keysToInvalidate.push(...keys.all);
  }

  // Add custom keys
  if (keys.custom) {
    keysToInvalidate.push(...keys.custom);
  }

  // Add entity-specific keys
  if (ctx.id && keys.byId) {
    keysToInvalidate.push(keys.byId(ctx.id));
  }

  if (ctx.status && keys.byStatus) {
    keysToInvalidate.push(keys.byStatus(ctx.status));
  }

  if (ctx.customerId && keys.byCustomer) {
    keysToInvalidate.push(keys.byCustomer(ctx.customerId));
  }

  // Add generic entity keys
  keysToInvalidate.push(`${entity}:all`);
  if (ctx.id) {
    keysToInvalidate.push(`${entity}:${ctx.id}`);
  }

  // Remove duplicates
  const uniqueKeys = [...new Set(keysToInvalidate)];

  logger.debug(`Invalidating cache for ${entity}`, {
    keyCount: uniqueKeys.length,
    keys: uniqueKeys,
    context: ctx,
  });

  await safeCacheInvalidate(uniqueKeys);
}

/**
 * Create cache keys configuration for an entity
 */
export function createCacheKeys(entity: string): CacheKeys {
  return {
    all: [`${entity}:all`],
    byId: (id: number | string) => `${entity}:${id}`,
    byStatus: (status: string) => `${entity}:status:${status}`,
    byCustomer: (customerId: string) => `${entity}:customer:${customerId}`,
  };
}

/**
 * Invalidate cache for orders
 */
export async function invalidateOrderCache(context: {
  orderId?: number;
  orderNumber?: string;
  customerPhone?: string;
  status?: string;
}): Promise<void> {
  await invalidateCache({
    entity: 'orders',
    keys: createCacheKeys('orders'),
    context: {
      id: context.orderId || context.orderNumber,
      status: context.status,
      customerId: context.customerPhone,
    },
  });
}

/**
 * Invalidate cache for products
 */
export async function invalidateProductCache(context: {
  productId?: number;
  category?: string;
}): Promise<void> {
  await invalidateCache({
    entity: 'products',
    keys: createCacheKeys('products'),
    context: {
      id: context.productId,
      status: context.category,
    },
  });
}

/**
 * Invalidate cache for payments
 */
export async function invalidatePaymentCache(context: {
  transactionId?: number;
  orderId?: number;
  customerPhone?: string;
}): Promise<void> {
  await invalidateCache({
    entity: 'payments',
    keys: createCacheKeys('payments'),
    context: {
      id: context.transactionId,
      customerId: context.customerPhone,
    },
  });
}

/**
 * Invalidate cache for inventory
 */
export async function invalidateInventoryCache(context: {
  productId?: number;
}): Promise<void> {
  await invalidateCache({
    entity: 'inventory',
    keys: createCacheKeys('inventory'),
    context: {
      id: context.productId,
    },
  });
}

