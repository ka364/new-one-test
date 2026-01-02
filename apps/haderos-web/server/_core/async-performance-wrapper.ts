/**
 * Async Performance Wrapper
 * Apple-Level Performance Tracking
 *
 * Provides utilities for tracking performance of async operations
 * with automatic logging and metrics collection.
 */

import { logger } from './logger';
import { monitoring } from './monitoring';

export interface PerformanceContext {
  operation: string;
  details?: Record<string, unknown>;
}

/**
 * Wrap async function with performance tracking
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
 * Create a performance-tracked async function
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
 * Track performance of multiple operations in parallel
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
 * Track performance of sequential operations
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

