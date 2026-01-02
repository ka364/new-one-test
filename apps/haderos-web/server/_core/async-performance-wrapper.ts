/**
 * @fileoverview Async Performance Wrapper
 * @description Apple-Level Performance Tracking
 * 
 * Provides utilities for tracking performance of async operations
 * with automatic logging and metrics collection using high-resolution timers.
 * 
 * @module async-performance-wrapper
 * @author HADEROS Team
 * @since 1.0.0
 */

import { logger } from './logger';
import { monitoring } from './monitoring';

/**
 * Performance context for tracking operations
 */
export interface PerformanceContext {
  /** Name of the operation being tracked */
  operation: string;
  /** Additional context details for logging */
  details?: Record<string, unknown>;
}

/**
 * Wraps an async function with performance tracking
 *
 * @template T
 * @param {PerformanceContext} context - Performance tracking context
 * @param {() => Promise<T>} fn - Async function to track
 * @returns {Promise<T>} Result of the async function
 *
 * @description
 * Tracks performance of async operations using high-resolution timers (hrtime).
 * Automatically logs performance metrics and records them in the monitoring system.
 * Tracks both successful and failed operations.
 *
 * @example
 * ```typescript
 * const result = await withPerformanceTracking(
 *   {
 *     operation: 'orders.createOrder',
 *     details: { customerPhone: '01012345678' }
 *   },
 *   async () => {
 *     return await OrdersService.createOrder(input);
 *   }
 * );
 * ```
 *
 * @performance
 * - Uses hrtime for nanosecond precision
 * - Minimal overhead: <1ms per operation
 * - Automatic metric recording
 */
export async function withPerformanceTracking<T>(
  context: PerformanceContext,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = process.hrtime.bigint();
  const { operation, details = {} } = context;

  try {
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    // Record metric
    monitoring.recordMetric({
      name: operation,
      duration: durationMs,
      timestamp: new Date().toISOString(),
      type: 'performance',
      metadata: details,
    });

    // Log performance
    logger.info(`Performance: ${operation}`, {
      duration: `${durationMs.toFixed(2)}ms`,
      ...details,
    });

    return result;
  } catch (error: unknown) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    // Record failed metric
    monitoring.recordMetric({
      name: `${operation}_failed`,
      duration: durationMs,
      timestamp: new Date().toISOString(),
      type: 'error',
      metadata: {
        ...details,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    // Log failed performance
    logger.warn(`Performance: ${operation} failed`, {
      duration: `${durationMs.toFixed(2)}ms`,
      error: error instanceof Error ? error.message : String(error),
      ...details,
    });

    throw error;
  }
}

/**
 * Creates a performance-tracked async function
 *
 * @template TArgs
 * @template TReturn
 * @param {string} operation - Name of the operation
 * @param {(...args: TArgs) => Promise<TReturn>} fn - Async function to wrap
 * @returns {(...args: TArgs) => Promise<TReturn>} Wrapped function with performance tracking
 *
 * @description
 * Creates a new function that automatically tracks performance for every call.
 * Useful for wrapping existing functions without modifying their implementation.
 *
 * @example
 * ```typescript
 * const trackedCreateOrder = createTrackedAsyncFunction(
 *   'orders.createOrder',
 *   OrdersService.createOrder
 * );
 * 
 * // Now every call is automatically tracked
 * const result = await trackedCreateOrder(input);
 * ```
 */
export function createTrackedAsyncFunction<TArgs extends unknown[], TReturn>(
  operation: string,
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    return withPerformanceTracking(
      {
        operation,
        details: {
          argsCount: args.length,
        },
      },
      () => fn(...args)
    );
  };
}

/**
 * Tracks performance of multiple operations executed in parallel
 *
 * @template T
 * @param {Array<{name: string; fn: () => Promise<T>; details?: Record<string, unknown>}>} operations - Array of operations to track
 * @returns {Promise<T[]>} Array of results from all operations
 *
 * @description
 * Executes multiple async operations in parallel and tracks their individual
 * and combined performance. Useful for batch operations.
 *
 * @example
 * ```typescript
 * const results = await trackParallelOperations([
 *   { name: 'fetchUser', fn: () => fetchUser(1) },
 *   { name: 'fetchOrder', fn: () => fetchOrder(123) },
 *   { name: 'fetchProduct', fn: () => fetchProduct(456) }
 * ]);
 * ```
 *
 * @performance
 * - Executes operations in parallel (Promise.all)
 * - Tracks individual operation performance
 * - Tracks total execution time
 */
export async function trackParallelOperations<T>(
  operations: Array<{
    name: string;
    fn: () => Promise<T>;
    details?: Record<string, unknown>;
  }>
): Promise<T[]> {
  const startTime = process.hrtime.bigint();

  const results = await Promise.all(
    operations.map((op) =>
      withPerformanceTracking(
        {
          operation: op.name,
          details: op.details,
        },
        op.fn
      )
    )
  );

  const endTime = process.hrtime.bigint();
  const totalDurationMs = Number(endTime - startTime) / 1_000_000;

  logger.info('Parallel operations completed', {
    operationCount: operations.length,
    totalDuration: `${totalDurationMs.toFixed(2)}ms`,
    operations: operations.map((op) => op.name),
  });

  return results;
}

/**
 * Tracks performance of multiple operations executed sequentially
 *
 * @template T
 * @param {Array<{name: string; fn: () => Promise<T>; details?: Record<string, unknown>}>} operations - Array of operations to track
 * @returns {Promise<T[]>} Array of results from all operations
 *
 * @description
 * Executes multiple async operations sequentially and tracks their individual
 * performance. Useful when operations depend on each other.
 *
 * @example
 * ```typescript
 * const results = await trackSequentialOperations([
 *   { name: 'createOrder', fn: () => createOrder(input) },
 *   { name: 'createPayment', fn: () => createPayment(orderId) },
 *   { name: 'sendNotification', fn: () => sendNotification(orderId) }
 * ]);
 * ```
 *
 * @performance
 * - Executes operations sequentially (for loop)
 * - Tracks individual operation performance
 * - Total time = sum of all operation times
 */
export async function trackSequentialOperations<T>(
  operations: Array<{
    name: string;
    fn: () => Promise<T>;
    details?: Record<string, unknown>;
  }>
): Promise<T[]> {
  const results: T[] = [];

  for (const op of operations) {
    const result = await withPerformanceTracking(
      {
        operation: op.name,
        details: op.details,
      },
      op.fn
    );
    results.push(result);
  }

  return results;
}

