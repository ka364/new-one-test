/**
 * Monitoring & Observability System
 * Apple-Level Monitoring Implementation
 *
 * Provides comprehensive monitoring, error tracking, and performance metrics
 */

import { logger } from './logger.js';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface ErrorEvent {
  error: Error;
  context: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: number;
  requestId?: string;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  lastCheck: Date;
  details?: Record<string, unknown>;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorEvent[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private maxMetrics = 10000; // Keep last 10k metrics
  private maxErrors = 1000; // Keep last 1k errors

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log important metrics
    if (metric.value > 1000 && metric.unit === 'ms') {
      logger.warn('Slow operation detected', {
        metric: metric.name,
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags,
      });
    }
  }

  /**
   * Record an error event
   */
  recordError(event: Omit<ErrorEvent, 'timestamp'>): void {
    const fullEvent: ErrorEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.errors.push(fullEvent);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log based on severity
    const logLevel = {
      low: 'debug',
      medium: 'warn',
      high: 'error',
      critical: 'error',
    }[event.severity];

    logger[logLevel]('Error recorded', {
      error: event.error.message,
      severity: event.severity,
      context: event.context,
      userId: event.userId,
      requestId: event.requestId,
    });
  }

  /**
   * Update health check status
   */
  updateHealthCheck(service: string, check: Omit<HealthCheck, 'service' | 'lastCheck'>): void {
    this.healthChecks.set(service, {
      ...check,
      service,
      lastCheck: new Date(),
    });

    if (check.status === 'unhealthy') {
      logger.error('Service unhealthy', {
        service,
        status: check.status,
        details: check.details,
      });
    } else if (check.status === 'degraded') {
      logger.warn('Service degraded', {
        service,
        status: check.status,
        details: check.details,
      });
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(filter?: { name?: string; since?: Date }): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (filter?.name) {
      filtered = filtered.filter((m) => m.name === filter.name);
    }

    if (filter?.since) {
      filtered = filtered.filter((m) => m.timestamp >= filter.since!);
    }

    return filtered;
  }

  /**
   * Get error events
   */
  getErrors(filter?: { severity?: ErrorEvent['severity']; since?: Date }): ErrorEvent[] {
    let filtered = [...this.errors];

    if (filter?.severity) {
      filtered = filtered.filter((e) => e.severity === filter.severity);
    }

    if (filter?.since) {
      filtered = filtered.filter((e) => e.timestamp >= filter.since!);
    }

    return filtered;
  }

  /**
   * Get all health checks
   */
  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get system health summary
   */
  getHealthSummary(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheck[];
    metrics: {
      total: number;
      errors: number;
      avgLatency: number;
    };
  } {
    const checks = this.getHealthChecks();
    const unhealthy = checks.filter((c) => c.status === 'unhealthy').length;
    const degraded = checks.filter((c) => c.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthy > 0) {
      overall = 'unhealthy';
    } else if (degraded > 0) {
      overall = 'degraded';
    }

    const recentMetrics = this.getMetrics({
      since: new Date(Date.now() - 60 * 60 * 1000), // Last hour
    });

    const latencyMetrics = recentMetrics.filter((m) => m.unit === 'ms');
    const avgLatency =
      latencyMetrics.length > 0
        ? latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length
        : 0;

    const recentErrors = this.getErrors({
      since: new Date(Date.now() - 60 * 60 * 1000), // Last hour
    });

    return {
      overall,
      services: checks,
      metrics: {
        total: recentMetrics.length,
        errors: recentErrors.length,
        avgLatency: Math.round(avgLatency),
      },
    };
  }

  /**
   * Clear old data (for memory management)
   */
  clearOldData(maxAgeHours = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
    this.errors = this.errors.filter((e) => e.timestamp >= cutoff);
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Auto-cleanup every hour
setInterval(
  () => {
    monitoring.clearOldData(24);
  },
  60 * 60 * 1000
);
