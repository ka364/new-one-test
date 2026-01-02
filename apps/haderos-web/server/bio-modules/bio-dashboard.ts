/**
 * Bio-Integration Dashboard
 *
 * Real-time monitoring of bio-module interactions
 * This is the "nervous system monitor" of HaderOS
 */

import {
  BioModuleName,
  getModuleInteractions,
  getInteractionStats,
} from './bio-interaction-matrix';
import { getBioMessageRouter } from './unified-messaging';
import { getConflictEngine } from './conflict-resolution-protocol';

export interface InteractionMetrics {
  path: string; // "arachnid→corvid"
  lastMinute: number;
  lastHour: number;
  lastDay: number;
  averageProcessingTime: number;
  successRate: number;
  totalMessages: number;
}

export interface ModuleHealthStatus {
  name: BioModuleName;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastActive: number; // timestamp
  messageQueueSize: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number; // percentage
}

export interface ConflictHotspot {
  moduleA: BioModuleName;
  moduleB: BioModuleName;
  conflictCount: number;
  lastConflict: number; // timestamp
  resolutionRate: number; // percentage
  avgResolutionTime: number;
}

export interface BioDashboardData {
  timestamp: number;
  liveInteractions: InteractionMetrics[];
  moduleHealth: ModuleHealthStatus[];
  activeModules: ModuleHealthStatus[]; // Alias for moduleHealth
  recentConflicts: any[];
  recentInteractions: any[]; // Added
  conflictHotspots: ConflictHotspot[];
  systemHealth: {
    overall: number; // 0-100
    activeModules: number;
    totalInteractions: number;
    conflictRate: number;
    avgProcessingTime: number;
  };
  interactionMatrix: {
    totalDefined: number;
    activeToday: number;
    coverage: number; // percentage
  };
}

/**
 * Bio-Integration Dashboard
 */
export class BioIntegrationDashboard {
  private static interactions: Map<string, any[]> = new Map();
  private static moduleActivity: Map<BioModuleName, number[]> = new Map();
  private static startTime = Date.now();

  /**
   * Track an interaction between modules
   */
  static trackInteraction(
    from: BioModuleName,
    to: BioModuleName,
    messageType: string,
    payloadSize: number,
    processingTime: number | null = null
  ): void {
    const key = `${from}→${to}`;
    const interaction = {
      timestamp: Date.now(),
      messageType,
      payloadSize,
      processingTime,
    };

    const existing = this.interactions.get(key) || [];
    existing.push(interaction);

    // Keep only last 1000 interactions per path
    if (existing.length > 1000) {
      existing.shift();
    }

    this.interactions.set(key, existing);

    // Track module activity
    this.trackModuleActivity(from);
    this.trackModuleActivity(to);
  }

  /**
   * Track module activity timestamp
   */
  static trackModuleActivity(module: BioModuleName): void {
    const timestamps = this.moduleActivity.get(module) || [];
    timestamps.push(Date.now());

    // Keep only last 1000 timestamps
    if (timestamps.length > 1000) {
      timestamps.shift();
    }

    this.moduleActivity.set(module, timestamps);
  }

  /**
   * Calculate average processing time for interactions
   */
  private static calculateAverageTime(interactions: any[]): number {
    const withTime = interactions.filter((i) => i.processingTime !== null);
    if (withTime.length === 0) return 0;

    const sum = withTime.reduce((acc, i) => acc + i.processingTime, 0);
    return Math.round(sum / withTime.length);
  }

  /**
   * Get interaction metrics for a specific path
   */
  private static getInteractionMetrics(path: string): InteractionMetrics {
    const interactions = this.interactions.get(path) || [];
    const now = Date.now();

    const lastMinute = interactions.filter((i) => now - i.timestamp < 60000).length;
    const lastHour = interactions.filter((i) => now - i.timestamp < 3600000).length;
    const lastDay = interactions.filter((i) => now - i.timestamp < 86400000).length;

    const withTime = interactions.filter((i) => i.processingTime !== null);
    const successfulInteractions = withTime.filter((i) => i.processingTime < 5000); // < 5s = success

    return {
      path,
      lastMinute,
      lastHour,
      lastDay,
      averageProcessingTime: this.calculateAverageTime(interactions),
      successRate:
        withTime.length > 0 ? (successfulInteractions.length / withTime.length) * 100 : 100,
      totalMessages: interactions.length,
    };
  }

  /**
   * Check module health status
   */
  private static checkModuleHealth(module: BioModuleName): ModuleHealthStatus {
    const timestamps = this.moduleActivity.get(module) || [];
    const now = Date.now();

    if (timestamps.length === 0) {
      return {
        name: module,
        status: 'offline',
        lastActive: 0,
        messageQueueSize: 0,
        avgResponseTime: 0,
        errorRate: 0,
        uptime: 0,
      };
    }

    const lastActive = timestamps[timestamps.length - 1];
    const timeSinceActive = now - lastActive;

    // Get interactions involving this module
    const moduleInteractions = Array.from(this.interactions.entries())
      .filter(([path]) => path.startsWith(module) || path.endsWith(module))
      .flatMap(([_, interactions]) => interactions);

    const recentInteractions = moduleInteractions.filter((i) => now - i.timestamp < 3600000);
    const avgResponseTime = this.calculateAverageTime(recentInteractions);
    const failedInteractions = recentInteractions.filter(
      (i) => i.processingTime === null || i.processingTime > 5000
    );
    const errorRate =
      recentInteractions.length > 0
        ? (failedInteractions.length / recentInteractions.length) * 100
        : 0;

    // Calculate uptime
    const totalTime = now - this.startTime;
    const activeTime =
      timestamps.length > 1 ? timestamps[timestamps.length - 1] - timestamps[0] : totalTime;
    const uptime = (activeTime / totalTime) * 100;

    // Determine status
    let status: ModuleHealthStatus['status'];
    if (timeSinceActive > 300000) {
      // 5 minutes
      status = 'offline';
    } else if (errorRate > 50 || avgResponseTime > 5000) {
      status = 'critical';
    } else if (errorRate > 20 || avgResponseTime > 2000) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      name: module,
      status,
      lastActive,
      messageQueueSize: 0, // TODO: integrate with message queue
      avgResponseTime,
      errorRate: Math.round(errorRate),
      uptime: Math.round(uptime),
    };
  }

  /**
   * Identify conflict hotspots
   */
  private static identifyConflictHotspots(): ConflictHotspot[] {
    const conflictEngine = getConflictEngine();
    const history = conflictEngine.getResolutionHistory(1000);

    // Group conflicts by module pair
    const conflictPairs = new Map<string, any[]>();

    history.forEach((resolution) => {
      // Extract modules from conflict (assuming they're in metadata)
      const conflict = conflictEngine
        .getActiveConflicts()
        .find((c) => c.id === resolution.conflictId);
      if (!conflict) return;

      const key = [conflict.moduleA, conflict.moduleB].sort().join('↔');
      const existing = conflictPairs.get(key) || [];
      existing.push(resolution);
      conflictPairs.set(key, existing);
    });

    // Calculate hotspot metrics
    const hotspots: ConflictHotspot[] = [];

    conflictPairs.forEach((resolutions, key) => {
      if (!resolutions || resolutions.length === 0) return;

      const [moduleA, moduleB] = key.split('↔') as [BioModuleName, BioModuleName];
      const lastConflict = Math.max(...resolutions.map((r) => r.timestamp.getTime()));
      const successfulResolutions = resolutions.filter((r) => r.winner !== 'escalate');
      const avgResolutionTime =
        resolutions.reduce((sum, r) => sum + r.resolutionTime, 0) / resolutions.length;

      hotspots.push({
        moduleA,
        moduleB,
        conflictCount: resolutions.length,
        lastConflict,
        resolutionRate: (successfulResolutions.length / resolutions.length) * 100,
        avgResolutionTime: Math.round(avgResolutionTime),
      });
    });

    // Sort by conflict count (descending)
    return hotspots.sort((a, b) => b.conflictCount - a.conflictCount);
  }

  /**
   * Get complete dashboard data
   */
  static getDashboardData(): BioDashboardData {
    const router = getBioMessageRouter();
    const conflictEngine = getConflictEngine();
    const routerStats = router.getStats();
    const conflictStats = conflictEngine.getStats();

    // Get all interaction paths
    const liveInteractions = Array.from(this.interactions.keys()).map((path) =>
      this.getInteractionMetrics(path)
    );

    // Get module health for all 7 modules
    const modules: BioModuleName[] = [
      'arachnid',
      'corvid',
      'mycelium',
      'ant',
      'tardigrade',
      'chameleon',
      'cephalopod',
    ];

    const moduleHealth = modules.map((module) => this.checkModuleHealth(module));

    // Get recent conflicts
    const recentConflicts = conflictEngine.getResolutionHistory(10);

    // Get conflict hotspots
    const conflictHotspots = this.identifyConflictHotspots();

    // Calculate system health (weighted average)
    const healthyModules = moduleHealth.filter((m) => m.status === 'healthy').length;
    const degradedModules = moduleHealth.filter((m) => m.status === 'degraded').length;
    const criticalModules = moduleHealth.filter((m) => m.status === 'critical').length;
    const activeModules = modules.filter((m) => this.moduleActivity.has(m)).length;

    // Weighted health calculation
    const moduleHealthScore =
      (healthyModules * 100 + degradedModules * 60 + criticalModules * 20) / modules.length;

    const activityScore = (activeModules / modules.length) * 100;

    // Average success rate across all modules
    const avgSuccessRate =
      moduleHealth.reduce((sum, m) => {
        const successRate = 100 - m.errorRate;
        return sum + successRate;
      }, 0) / modules.length;

    // Average response time score (lower is better, max 5000ms)
    const avgResponseTime =
      moduleHealth.reduce((sum, m) => sum + m.avgResponseTime, 0) / modules.length;
    const responseTimeScore = Math.max(0, 100 - avgResponseTime / 50); // 5000ms = 0%, 0ms = 100%

    // Weighted overall health
    const overall = Math.round(
      moduleHealthScore * 0.35 + // 35% weight on module health
        activityScore * 0.25 + // 25% weight on activity
        avgSuccessRate * 0.25 + // 25% weight on success rate
        responseTimeScore * 0.15 // 15% weight on response time
    );

    const totalInteractions = liveInteractions.reduce((sum, i) => sum + i.totalMessages, 0);
    const conflictRate =
      totalInteractions > 0 ? (conflictStats.totalResolved / totalInteractions) * 100 : 0;

    // Interaction matrix coverage
    const matrixStats = getInteractionStats();
    const activeToday = liveInteractions.filter((i) => i.lastDay > 0).length;
    const coverage = (activeToday / matrixStats.totalInteractions) * 100;

    return {
      timestamp: Date.now(),
      liveInteractions,
      moduleHealth,
      activeModules: moduleHealth, // Alias for moduleHealth
      recentConflicts,
      recentInteractions: this.getRecentInteractions(20), // Added
      conflictHotspots,
      systemHealth: {
        overall,
        activeModules: modules.filter((m) => this.moduleActivity.has(m)).length,
        totalInteractions,
        conflictRate: Math.round(conflictRate * 100) / 100,
        avgProcessingTime: routerStats.avgProcessingTime,
      },
      interactionMatrix: {
        totalDefined: matrixStats.totalInteractions,
        activeToday,
        coverage: Math.round(coverage),
      },
    };
  }

  /**
   * Get recent interactions (for debugging)
   */
  static getRecentInteractions(limit: number = 50): any[] {
    const allInteractions: any[] = [];

    this.interactions.forEach((interactions, path) => {
      interactions.forEach((interaction) => {
        allInteractions.push({
          ...interaction,
          path,
        });
      });
    });

    // Sort by timestamp (descending)
    allInteractions.sort((a, b) => b.timestamp - a.timestamp);

    return allInteractions.slice(0, limit);
  }

  /**
   * Reset dashboard data (for testing)
   */
  static reset(): void {
    this.interactions.clear();
    this.moduleActivity.clear();
    this.startTime = Date.now();
  }
}

// Singleton instance getter
export function getBioDashboard(): typeof BioIntegrationDashboard {
  return BioIntegrationDashboard;
}
