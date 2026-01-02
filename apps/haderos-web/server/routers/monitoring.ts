/**
 * Monitoring Router
 * Apple-Level Monitoring Endpoints
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { monitoring } from '../_core/monitoring';

export const monitoringRouter = router({
  /**
   * Get system health summary
   */
  getHealth: protectedProcedure.query(async () => {
    return monitoring.getHealthSummary();
  }),

  /**
   * Get all health checks
   */
  getHealthChecks: protectedProcedure.query(async () => {
    return monitoring.getHealthChecks();
  }),

  /**
   * Get performance metrics
   */
  getMetrics: protectedProcedure
    .input(
      z
        .object({
          name: z.string().optional(),
          since: z.string().optional(), // ISO date string
        })
        .optional()
    )
    .query(async ({ input }) => {
      return monitoring.getMetrics({
        name: input?.name,
        since: input?.since ? new Date(input.since) : undefined,
      });
    }),

  /**
   * Get error events
   */
  getErrors: protectedProcedure
    .input(
      z
        .object({
          severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
          since: z.string().optional(), // ISO date string
        })
        .optional()
    )
    .query(async ({ input }) => {
      return monitoring.getErrors({
        severity: input?.severity,
        since: input?.since ? new Date(input.since) : undefined,
      });
    }),

  /**
   * Get metrics summary
   */
  getMetricsSummary: protectedProcedure
    .input(
      z
        .object({
          since: z.string().optional(), // ISO date string
        })
        .optional()
    )
    .query(async ({ input }) => {
      const since = input?.since
        ? new Date(input.since)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const metrics = monitoring.getMetrics({ since });

      const byName = new Map<string, number[]>();
      metrics.forEach((m) => {
        if (!byName.has(m.name)) {
          byName.set(m.name, []);
        }
        byName.get(m.name)!.push(m.value);
      });

      const summary: Record<string, { min: number; max: number; avg: number; count: number }> = {};
      byName.forEach((values, name) => {
        summary[name] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, v) => sum + v, 0) / values.length,
          count: values.length,
        };
      });

      return summary;
    }),
});
