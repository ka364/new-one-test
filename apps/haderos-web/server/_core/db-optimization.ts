/**
 * Database Optimization Utilities
 * Phase 3: Database Performance Optimization
 *
 * Provides utilities for database optimization, index management,
 * and query performance monitoring.
 */

import { sql } from 'drizzle-orm';
import { requireDb } from '../db';
import { logger } from './logger';

/**
 * Database optimization configuration
 */
export const dbOptimizationConfig = {
  /**
   * Enable query performance logging
   */
  enableQueryLogging: process.env.ENABLE_QUERY_LOGGING === 'true',

  /**
   * Slow query threshold (milliseconds)
   */
  slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10),

  /**
   * Enable index recommendations
   */
  enableIndexRecommendations: process.env.ENABLE_INDEX_RECOMMENDATIONS === 'true',
};

/**
 * Analyze table statistics for better query planning
 * @param tableName - Name of the table to analyze
 */
export async function analyzeTable(tableName: string): Promise<void> {
  try {
    const db = await requireDb();
    await db.execute(sql.raw(`ANALYZE ${tableName}`));
    logger.info(`Table statistics updated: ${tableName}`);
  } catch (error: unknown) {
    logger.error(
      `Failed to analyze table: ${tableName}`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Analyze all critical tables
 */
export async function analyzeAllTables(): Promise<void> {
  const criticalTables = [
    'orders',
    'order_items',
    'products',
    'payment_transactions',
    'cod_orders',
    'inventory',
    'tracking_logs',
    'shipping_partners',
  ];

  logger.info('Starting table analysis...');

  for (const table of criticalTables) {
    await analyzeTable(table);
  }

  logger.info('Table analysis completed');
}

/**
 * Get index usage statistics
 * @param tableName - Name of the table
 */
export async function getIndexUsageStats(tableName: string): Promise<Array<{
  indexName: string;
  indexScans: number;
  tuplesRead: number;
  tuplesFetched: number;
}>> {
  try {
    const db = await requireDb();
    const result = await db.execute(sql.raw(`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE tablename = '${tableName}'
      ORDER BY idx_scan DESC;
    `));

    return (result.rows || []).map((row: any) => ({
      indexName: row.indexname,
      indexScans: Number(row.index_scans || 0),
      tuplesRead: Number(row.tuples_read || 0),
      tuplesFetched: Number(row.tuples_fetched || 0),
    }));
  } catch (error: unknown) {
    logger.error(
      `Failed to get index usage stats for: ${tableName}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get table size information
 * @param tableName - Name of the table
 */
export async function getTableSize(tableName: string): Promise<{
  tableSize: string;
  indexesSize: string;
  totalSize: string;
  rowCount: number;
}> {
  try {
    const db = await requireDb();
    const result = await db.execute(sql.raw(`
      SELECT
        pg_size_pretty(pg_total_relation_size('${tableName}')) as total_size,
        pg_size_pretty(pg_relation_size('${tableName}')) as table_size,
        pg_size_pretty(pg_indexes_size('${tableName}')) as indexes_size,
        (SELECT COUNT(*) FROM ${tableName}) as row_count;
    `));

    const row = (result.rows || [])[0] as any;

    return {
      tableSize: row.table_size || '0 bytes',
      indexesSize: row.indexes_size || '0 bytes',
      totalSize: row.total_size || '0 bytes',
      rowCount: Number(row.row_count || 0),
    };
  } catch (error: unknown) {
    logger.error(
      `Failed to get table size for: ${tableName}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      tableSize: '0 bytes',
      indexesSize: '0 bytes',
      totalSize: '0 bytes',
      rowCount: 0,
    };
  }
}

/**
 * Get slow queries (requires pg_stat_statements extension)
 */
export async function getSlowQueries(limit: number = 10): Promise<Array<{
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  minTime: number;
  maxTime: number;
}>> {
  try {
    const db = await requireDb();
    const result = await db.execute(sql.raw(`
      SELECT
        query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        min_exec_time as min_time,
        max_exec_time as max_time
      FROM pg_stat_statements
      WHERE mean_exec_time > ${dbOptimizationConfig.slowQueryThreshold}
      ORDER BY mean_exec_time DESC
      LIMIT ${limit};
    `));

    return (result.rows || []).map((row: any) => ({
      query: row.query || '',
      calls: Number(row.calls || 0),
      totalTime: Number(row.total_time || 0),
      meanTime: Number(row.mean_time || 0),
      minTime: Number(row.min_time || 0),
      maxTime: Number(row.max_time || 0),
    }));
  } catch (error: unknown) {
    logger.warn(
      'pg_stat_statements extension not available or not enabled',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get unused indexes (indexes with no scans)
 */
export async function getUnusedIndexes(): Promise<Array<{
  tableName: string;
  indexName: string;
  indexSize: string;
  indexScans: number;
}>> {
  try {
    const db = await requireDb();
    const result = await db.execute(sql.raw(`
      SELECT
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan as index_scans
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_unique'
      ORDER BY pg_relation_size(indexrelid) DESC;
    `));

    return (result.rows || []).map((row: any) => ({
      tableName: row.tablename || '',
      indexName: row.indexname || '',
      indexSize: row.index_size || '0 bytes',
      indexScans: Number(row.index_scans || 0),
    }));
  } catch (error: unknown) {
    logger.error(
      'Failed to get unused indexes',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get database optimization report
 */
export async function getOptimizationReport(): Promise<{
  tableSizes: Array<{
    tableName: string;
    tableSize: string;
    indexesSize: string;
    totalSize: string;
    rowCount: number;
  }>;
  unusedIndexes: Array<{
    tableName: string;
    indexName: string;
    indexSize: string;
    indexScans: number;
  }>;
  slowQueries: Array<{
    query: string;
    calls: number;
    totalTime: number;
    meanTime: number;
    minTime: number;
    maxTime: number;
  }>;
}> {
  const criticalTables = [
    'orders',
    'order_items',
    'products',
    'payment_transactions',
    'cod_orders',
    'inventory',
  ];

  logger.info('Generating database optimization report...');

  const tableSizes = await Promise.all(
    criticalTables.map(async (table) => {
      const size = await getTableSize(table);
      return {
        tableName: table,
        ...size,
      };
    })
  );

  const unusedIndexes = await getUnusedIndexes();
  const slowQueries = await getSlowQueries(20);

  return {
    tableSizes,
    unusedIndexes,
    slowQueries,
  };
}

