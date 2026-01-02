/**
 * Cache Manager Utilities
 * Apple-Level Cache Management
 *
 * Provides utilities for consistent cache invalidation and management
 * across all routers and services.
 */

import { logger } from './logger';
import { cache } from './cache';

export interface CacheKeys {
  all?: string[];
  byId?: (id: number | string) => string;
  byStatus?: (status: string) => string;
  byCustomer?: (customerId: string) => string;
  custom?: string[];
}

export interface CacheInvalidationContext {
  entity: string;
  keys: CacheKeys;
  context?: Record<string, unknown>;
}

/**
 * Safely invalidate cache with error handling
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
 * Invalidate cache based on context
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

