import { z } from 'zod';
import { router, publicProcedure } from '../_core/trpc';
import { getBioDashboard } from '../bio-modules/bio-dashboard.js';
import { getConflictEngine } from '../bio-modules/conflict-resolution-protocol.js';
import {
  getModuleInteractions,
  getInteractionStats,
  BIO_INTERACTION_MATRIX,
} from '../bio-modules/bio-interaction-matrix.js';

export const bioDashboardRouter = router({
  // Get full dashboard data
  getDashboard: publicProcedure.query(async () => {
    const dashboard = getBioDashboard();
    const dashboardData = dashboard.getDashboardData();
    return dashboardData;
  }),

  // Get system health summary
  getSystemHealth: publicProcedure.query(async () => {
    const dashboard = getBioDashboard();
    const data = dashboard.getDashboardData();
    return data.systemHealth;
  }),

  // Get active modules status
  getActiveModules: publicProcedure.query(async () => {
    const dashboard = getBioDashboard();
    const data = dashboard.getDashboardData();
    return data.activeModules;
  }),

  // Get recent interactions
  getRecentInteractions: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const dashboard = getBioDashboard();
      const interactions = dashboard.getRecentInteractions(input.limit || 20);
      return interactions;
    }),

  // Get conflict resolution history
  getConflictHistory: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const conflictEngine = getConflictEngine();
      const history = conflictEngine.getResolutionHistory(input.limit || 20);
      return history;
    }),

  // Get conflict statistics
  getConflictStats: publicProcedure.query(async () => {
    const conflictEngine = getConflictEngine();
    const stats = conflictEngine.getStats();
    return stats;
  }),

  // Get interaction matrix
  getInteractionMatrix: publicProcedure.query(async () => {
    return BIO_INTERACTION_MATRIX;
  }),

  // Get module interactions
  getModuleInteractions: publicProcedure
    .input(z.object({ moduleName: z.string() }))
    .query(async ({ input }) => {
      const interactions = getModuleInteractions(input.moduleName as any);
      return interactions;
    }),

  // Get interaction statistics
  getInteractionStats: publicProcedure
    .input(z.object({ moduleName: z.string() }))
    .query(async ({ input }) => {
      const interactions = getModuleInteractions(input.moduleName as any);
      return {
        totalInteractions: interactions.length,
        outgoing: interactions.filter((i) => i.from === input.moduleName).length,
        incoming: interactions.filter((i) => i.to === input.moduleName).length,
      };
    }),

  // Track module activity (for testing)
  trackActivity: publicProcedure
    .input(
      z.object({
        moduleName: z.string(),
        count: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const dashboard = getBioDashboard();

      const count = input.count || 1;
      for (let i = 0; i < count; i++) {
        dashboard.trackModuleActivity(input.moduleName as any);
      }

      return {
        success: true,
        message: `Tracked ${count} activities for ${input.moduleName}`,
      };
    }),

  // Get module health
  getModuleHealth: publicProcedure
    .input(z.object({ moduleName: z.string() }))
    .query(async ({ input }) => {
      const dashboard = getBioDashboard();
      const data = dashboard.getDashboardData();

      const module = data.activeModules.find((m) => m.name === input.moduleName);

      if (!module) {
        return {
          name: input.moduleName,
          status: 'inactive',
          health: 0,
          lastActivity: null,
        };
      }

      return module;
    }),

  // Get conflict hotspots
  getConflictHotspots: publicProcedure.query(async () => {
    const dashboard = getBioDashboard();
    const data = dashboard.getDashboardData();
    return data.conflictHotspots;
  }),

  // Get real-time metrics
  getRealTimeMetrics: publicProcedure.query(async () => {
    const dashboard = getBioDashboard();
    const conflictEngine = getConflictEngine();

    const dashboardData = dashboard.getDashboardData();
    const conflictStats = conflictEngine.getStats();

    // Calculate real-time metrics
    const totalInteractions = dashboardData.liveInteractions.reduce(
      (sum, m) => sum + m.totalMessages,
      0
    );

    const avgResponseTime = dashboardData.systemHealth.avgProcessingTime;

    const totalConflicts = conflictStats.totalResolved + conflictStats.activeConflicts;
    const conflictRate = totalInteractions > 0 ? (totalConflicts / totalInteractions) * 100 : 0;

    return {
      timestamp: Date.now(),
      totalInteractions,
      avgResponseTime,
      conflictRate,
      systemHealth: dashboardData.systemHealth.overall,
      activeModulesCount: dashboardData.activeModules.filter((m) => m.status === 'healthy').length,
      totalConflicts: conflictStats.totalResolved + conflictStats.activeConflicts,
      resolvedConflicts: conflictStats.totalResolved,
      escalatedConflicts: conflictStats.resolutionTypes['escalate'] || 0,
    };
  }),

  // Reset dashboard (for testing)
  reset: publicProcedure.mutation(async () => {
    const dashboard = getBioDashboard();
    // Note: This would need to be implemented in bio-dashboard.ts
    // For now, just return success
    return {
      success: true,
      message: 'Dashboard reset (not fully implemented)',
    };
  }),
});
