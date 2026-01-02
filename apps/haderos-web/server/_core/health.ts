/**
 * @fileoverview Health Check & Monitoring Module - HADEROS Platform
 * @module server/_core/health
 * @description Provides health checks, system monitoring, and alerting
 * capabilities for production environments.
 *
 * @author HADEROS Team
 * @version 1.0.0
 */

import { logger } from './logger';

/**
 * Health status interface
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: HealthCheck[];
}

/**
 * Individual health check result
 */
export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  duration: number;
  message?: string;
  details?: Record<string, any>;
}

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Store for alerts (in production, use Redis or database)
const alertStore: Alert[] = [];
const MAX_ALERTS = 1000;

// Track server start time
const serverStartTime = Date.now();

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const { getDb } = await import('../db');
    const db = await getDb();

    if (!db) {
      return {
        name: 'database',
        status: 'fail',
        duration: Date.now() - start,
        message: 'Database connection not available',
      };
    }

    // Simple query to verify connection
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`SELECT 1`);

    return {
      name: 'database',
      status: 'pass',
      duration: Date.now() - start,
      message: 'Database connection healthy',
    };
  } catch (error: any) {
    return {
      name: 'database',
      status: 'fail',
      duration: Date.now() - start,
      message: error.message || 'Database check failed',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const start = Date.now();
  const used = process.memoryUsage();

  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const usagePercent = Math.round((used.heapUsed / used.heapTotal) * 100);

  let status: HealthCheck['status'] = 'pass';
  let message = `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`;

  if (usagePercent > 90) {
    status = 'fail';
    message = `Critical memory usage: ${usagePercent}%`;
  } else if (usagePercent > 75) {
    status = 'warn';
    message = `High memory usage: ${usagePercent}%`;
  }

  return {
    name: 'memory',
    status,
    duration: Date.now() - start,
    message,
    details: {
      heapUsedMB,
      heapTotalMB,
      usagePercent,
      rss: Math.round(used.rss / 1024 / 1024),
    },
  };
}

/**
 * Check event loop lag
 */
async function checkEventLoop(): Promise<HealthCheck> {
  const start = Date.now();

  return new Promise((resolve) => {
    const expected = 10; // Expected setTimeout delay
    setTimeout(() => {
      const actual = Date.now() - start;
      const lag = actual - expected;

      let status: HealthCheck['status'] = 'pass';
      let message = `Event loop lag: ${lag}ms`;

      if (lag > 100) {
        status = 'fail';
        message = `Critical event loop lag: ${lag}ms`;
      } else if (lag > 50) {
        status = 'warn';
        message = `High event loop lag: ${lag}ms`;
      }

      resolve({
        name: 'eventLoop',
        status,
        duration: Date.now() - start,
        message,
        details: { lagMs: lag },
      });
    }, expected);
  });
}

/**
 * Check disk space (simplified - just check if temp dir is writable)
 */
async function checkDisk(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const fs = await import('fs/promises');
    const os = await import('os');
    const path = await import('path');

    const testFile = path.join(os.tmpdir(), `haderos-health-${Date.now()}.tmp`);
    await fs.writeFile(testFile, 'health-check');
    await fs.unlink(testFile);

    return {
      name: 'disk',
      status: 'pass',
      duration: Date.now() - start,
      message: 'Disk write test passed',
    };
  } catch (error: any) {
    return {
      name: 'disk',
      status: 'fail',
      duration: Date.now() - start,
      message: error.message || 'Disk check failed',
    };
  }
}

/**
 * Perform comprehensive health check
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    checkEventLoop(),
    checkDisk(),
  ]);

  // Determine overall status
  const hasFailure = checks.some((c) => c.status === 'fail');
  const hasWarning = checks.some((c) => c.status === 'warn');

  let status: HealthStatus['status'] = 'healthy';
  if (hasFailure) {
    status = 'unhealthy';
  } else if (hasWarning) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.round((Date.now() - serverStartTime) / 1000),
    version: process.env.APP_VERSION || '2.0.0',
    checks,
  };
}

/**
 * Create and store an alert
 */
export function createAlert(
  severity: AlertSeverity,
  title: string,
  message: string,
  source: string,
  metadata?: Record<string, any>
): Alert {
  const alert: Alert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    severity,
    title,
    message,
    source,
    timestamp: new Date(),
    metadata,
  };

  // Add to store
  alertStore.unshift(alert);

  // Trim old alerts
  if (alertStore.length > MAX_ALERTS) {
    alertStore.splice(MAX_ALERTS);
  }

  // Log the alert
  const logFn = severity === 'critical' || severity === 'error' ? 'error' : 'warn';
  logger[logFn](`[Alert] ${title}: ${message}`, { source, severity, metadata });

  return alert;
}

/**
 * Get recent alerts
 */
export function getAlerts(options?: {
  severity?: AlertSeverity;
  limit?: number;
  since?: Date;
}): Alert[] {
  let alerts = [...alertStore];

  if (options?.severity) {
    alerts = alerts.filter((a) => a.severity === options.severity);
  }

  if (options?.since) {
    alerts = alerts.filter((a) => a.timestamp >= options.since);
  }

  if (options?.limit) {
    alerts = alerts.slice(0, options.limit);
  }

  return alerts;
}

/**
 * Clear all alerts
 */
export function clearAlerts(): void {
  alertStore.length = 0;
}

/**
 * System metrics interface
 */
export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
  requests: {
    total: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

// Request tracking
let requestCount = 0;
let totalResponseTime = 0;
let errorCount = 0;

/**
 * Track a request
 */
export function trackRequest(responseTime: number, isError: boolean = false): void {
  requestCount++;
  totalResponseTime += responseTime;
  if (isError) {
    errorCount++;
  }
}

/**
 * Get system metrics
 */
export function getMetrics(): SystemMetrics {
  const os = require('os');
  const mem = process.memoryUsage();

  return {
    cpu: {
      usage: os.loadavg()[0] / os.cpus().length * 100,
      cores: os.cpus().length,
    },
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024),
      used: Math.round(mem.heapUsed / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
      usagePercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
    },
    uptime: Math.round((Date.now() - serverStartTime) / 1000),
    requests: {
      total: requestCount,
      avgResponseTime: requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0,
      errorRate: requestCount > 0 ? Math.round((errorCount / requestCount) * 100 * 100) / 100 : 0,
    },
  };
}

/**
 * Express middleware for health endpoint
 */
export function healthMiddleware(req: any, res: any, next: any): void {
  if (req.path === '/health' || req.path === '/api/health') {
    getHealthStatus()
      .then((status) => {
        const httpStatus = status.status === 'healthy' ? 200 : status.status === 'degraded' ? 200 : 503;
        res.status(httpStatus).json(status);
      })
      .catch((error) => {
        res.status(500).json({
          status: 'unhealthy',
          error: error.message,
        });
      });
  } else if (req.path === '/metrics' || req.path === '/api/metrics') {
    res.json(getMetrics());
  } else if (req.path === '/alerts' || req.path === '/api/alerts') {
    res.json(getAlerts({ limit: 100 }));
  } else {
    next();
  }
}

export default {
  getHealthStatus,
  createAlert,
  getAlerts,
  clearAlerts,
  getMetrics,
  trackRequest,
  healthMiddleware,
};
