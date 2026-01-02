/**
 * Performance Tracker
 * Apple-Level Performance Monitoring
 *
 * Tracks and records performance metrics for all operations
 */

import { monitoring } from './monitoring.js';

export interface PerformanceContext {
  operation: string;
  startTime: number;
  tags?: Record<string, string>;
}

/**
 * Create a performance tracker for an operation
 */
export function trackPerformance(
  operation: string,
  tags?: Record<string, string>
): PerformanceContext {
  return {
    operation,
    startTime: Date.now(),
    tags,
  };
}

/**
 * End performance tracking and record metric
 */
export function endTracking(context: PerformanceContext): number {
  const duration = Date.now() - context.startTime;

  monitoring.recordMetric({
    name: context.operation,
    value: duration,
    unit: 'ms',
    tags: context.tags,
  });

  return duration;
}

/**
 * Track performance with automatic cleanup
 */
export async function trackAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const context = trackPerformance(operation, tags);

  try {
    const result = await fn();
    endTracking(context);
    return result;
  } catch (error) {
    endTracking(context);
    throw error;
  }
}

/**
 * Track synchronous performance
 */
export function trackSync<T>(operation: string, fn: () => T, tags?: Record<string, string>): T {
  const context = trackPerformance(operation, tags);

  try {
    const result = fn();
    endTracking(context);
    return result;
  } catch (error) {
    endTracking(context);
    throw error;
  }
}
