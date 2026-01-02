/**
 * @fileoverview Performance Benchmarks Module - HADEROS Platform
 * @module server/_core/benchmark
 * @description Provides performance measurement, benchmarking, and
 * baseline comparison tools for API endpoints and database queries.
 *
 * @author HADEROS Team
 * @version 1.0.0
 */

import { logger } from './logger';

/**
 * Benchmark result interface
 */
export interface BenchmarkResult {
  name: string;
  iterations: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  stdDev: number;
  timestamp: Date;
}

/**
 * Performance baseline thresholds
 */
export interface PerformanceBaseline {
  apiResponse: {
    p95: number; // Target: < 50ms
    p99: number; // Target: < 100ms
  };
  dbQuery: {
    p95: number; // Target: < 10ms
    p99: number; // Target: < 25ms
  };
  cacheHit: {
    p95: number; // Target: < 1ms
    p99: number; // Target: < 5ms
  };
}

/**
 * Default performance baselines (Apple-level quality)
 */
export const DEFAULT_BASELINES: PerformanceBaseline = {
  apiResponse: {
    p95: 50,
    p99: 100,
  },
  dbQuery: {
    p95: 10,
    p99: 25,
  },
  cacheHit: {
    p95: 1,
    p99: 5,
  },
};

/**
 * Calculate percentile from sorted array
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[Math.max(0, index)];
}

/**
 * Calculate standard deviation
 */
function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squareDiffs = arr.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Run a benchmark on an async function
 */
export async function runBenchmark(
  name: string,
  fn: () => Promise<void>,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < Math.min(10, iterations); i++) {
    await fn();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1_000_000); // Convert to ms
  }

  // Sort for percentile calculations
  times.sort((a, b) => a - b);

  const result: BenchmarkResult = {
    name,
    iterations,
    min: Math.round(times[0] * 100) / 100,
    max: Math.round(times[times.length - 1] * 100) / 100,
    avg: Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 100) / 100,
    p50: Math.round(percentile(times, 50) * 100) / 100,
    p95: Math.round(percentile(times, 95) * 100) / 100,
    p99: Math.round(percentile(times, 99) * 100) / 100,
    stdDev: Math.round(standardDeviation(times) * 100) / 100,
    timestamp: new Date(),
  };

  logger.info(`[Benchmark] ${name}`, {
    iterations: result.iterations,
    avg: `${result.avg}ms`,
    p95: `${result.p95}ms`,
    p99: `${result.p99}ms`,
  });

  return result;
}

/**
 * Run a sync benchmark
 */
export function runSyncBenchmark(
  name: string,
  fn: () => void,
  iterations: number = 1000
): BenchmarkResult {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < Math.min(100, iterations); i++) {
    fn();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1_000_000);
  }

  times.sort((a, b) => a - b);

  return {
    name,
    iterations,
    min: Math.round(times[0] * 1000) / 1000,
    max: Math.round(times[times.length - 1] * 1000) / 1000,
    avg: Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 1000) / 1000,
    p50: Math.round(percentile(times, 50) * 1000) / 1000,
    p95: Math.round(percentile(times, 95) * 1000) / 1000,
    p99: Math.round(percentile(times, 99) * 1000) / 1000,
    stdDev: Math.round(standardDeviation(times) * 1000) / 1000,
    timestamp: new Date(),
  };
}

/**
 * Compare benchmark result against baseline
 */
export function compareToBaseline(
  result: BenchmarkResult,
  baselineP95: number,
  baselineP99: number
): {
  p95Pass: boolean;
  p99Pass: boolean;
  p95Delta: number;
  p99Delta: number;
  overall: 'pass' | 'warn' | 'fail';
} {
  const p95Pass = result.p95 <= baselineP95;
  const p99Pass = result.p99 <= baselineP99;

  const p95Delta = Math.round((result.p95 - baselineP95) * 100) / 100;
  const p99Delta = Math.round((result.p99 - baselineP99) * 100) / 100;

  let overall: 'pass' | 'warn' | 'fail' = 'pass';
  if (!p95Pass && !p99Pass) {
    overall = 'fail';
  } else if (!p95Pass || !p99Pass) {
    overall = 'warn';
  }

  return { p95Pass, p99Pass, p95Delta, p99Delta, overall };
}

/**
 * Performance timer for tracking operation durations
 */
export class PerformanceTimer {
  private timers: Map<string, bigint> = new Map();
  private results: Map<string, number[]> = new Map();

  /**
   * Start a timer
   */
  start(name: string): void {
    this.timers.set(name, process.hrtime.bigint());
  }

  /**
   * End a timer and record the duration
   */
  end(name: string): number {
    const start = this.timers.get(name);
    if (!start) {
      logger.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
    this.timers.delete(name);

    // Store result
    const results = this.results.get(name) || [];
    results.push(duration);
    this.results.set(name, results);

    return duration;
  }

  /**
   * Get statistics for a timer
   */
  getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
  } | null {
    const results = this.results.get(name);
    if (!results || results.length === 0) return null;

    const sorted = [...results].sort((a, b) => a - b);

    return {
      count: results.length,
      min: Math.round(sorted[0] * 100) / 100,
      max: Math.round(sorted[sorted.length - 1] * 100) / 100,
      avg: Math.round((results.reduce((a, b) => a + b, 0) / results.length) * 100) / 100,
      p95: Math.round(percentile(sorted, 95) * 100) / 100,
    };
  }

  /**
   * Clear all timers and results
   */
  clear(): void {
    this.timers.clear();
    this.results.clear();
  }

  /**
   * Get all stats
   */
  getAllStats(): Record<string, ReturnType<PerformanceTimer['getStats']>> {
    const stats: Record<string, ReturnType<PerformanceTimer['getStats']>> = {};
    for (const name of this.results.keys()) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }
}

/**
 * Global performance timer instance
 */
export const perfTimer = new PerformanceTimer();

/**
 * Decorator for measuring async function performance
 */
export function measurePerformance(name: string) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      perfTimer.start(name);
      try {
        const result = await originalMethod.apply(this, args);
        perfTimer.end(name);
        return result;
      } catch (error) {
        perfTimer.end(name);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Run comprehensive performance benchmarks
 */
export async function runAllBenchmarks(): Promise<{
  results: BenchmarkResult[];
  summary: {
    passed: number;
    warned: number;
    failed: number;
    overall: 'pass' | 'warn' | 'fail';
  };
}> {
  const results: BenchmarkResult[] = [];
  let passed = 0;
  let warned = 0;
  let failed = 0;

  // Database query benchmark
  try {
    const dbBenchmark = await runBenchmark(
      'database.select',
      async () => {
        const { getDb } = await import('../db');
        const db = await getDb();
        if (db) {
          const { sql } = await import('drizzle-orm');
          await db.execute(sql`SELECT 1`);
        }
      },
      50
    );
    results.push(dbBenchmark);

    const dbComparison = compareToBaseline(
      dbBenchmark,
      DEFAULT_BASELINES.dbQuery.p95,
      DEFAULT_BASELINES.dbQuery.p99
    );
    if (dbComparison.overall === 'pass') passed++;
    else if (dbComparison.overall === 'warn') warned++;
    else failed++;
  } catch (error) {
    logger.error('Database benchmark failed', error);
    failed++;
  }

  // JSON serialization benchmark
  const jsonBenchmark = runSyncBenchmark(
    'json.serialize',
    () => {
      const data = {
        orders: Array(100).fill({ id: 1, name: 'Test', price: 99.99 }),
        timestamp: Date.now(),
      };
      JSON.stringify(data);
    },
    1000
  );
  results.push(jsonBenchmark);
  if (jsonBenchmark.p95 < 1) passed++;
  else if (jsonBenchmark.p95 < 5) warned++;
  else failed++;

  // Memory allocation benchmark
  const memoryBenchmark = runSyncBenchmark(
    'memory.allocation',
    () => {
      const arr = new Array(10000).fill({ data: 'test'.repeat(100) });
      arr.length = 0;
    },
    500
  );
  results.push(memoryBenchmark);
  if (memoryBenchmark.p95 < 5) passed++;
  else if (memoryBenchmark.p95 < 10) warned++;
  else failed++;

  // Determine overall status
  let overall: 'pass' | 'warn' | 'fail' = 'pass';
  if (failed > 0) overall = 'fail';
  else if (warned > 0) overall = 'warn';

  return {
    results,
    summary: { passed, warned, failed, overall },
  };
}

export default {
  runBenchmark,
  runSyncBenchmark,
  compareToBaseline,
  PerformanceTimer,
  perfTimer,
  measurePerformance,
  runAllBenchmarks,
  DEFAULT_BASELINES,
};
