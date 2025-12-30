/**
 * ⚡ PERFORMANCE OPTIMIZER
 *
 * محسن الأداء الذكي - يحلل ويحسن أداء النظام
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import path from 'path';

export interface PerformanceAnalysis {
  averageResponseTime: number;
  bottlenecks: PerformanceBottleneck[];
  recommendations: PerformanceRecommendation[];
  metrics: PerformanceMetrics;
  criticalIssues: any[];
}

export interface PerformanceBottleneck {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  file: string;
  impact: string;
  fix: string;
}

export interface PerformanceRecommendation {
  priority: number;
  title: string;
  description: string;
  expectedImprovement: string;
  implementation: string;
}

export interface PerformanceMetrics {
  databaseQueries: number;
  nPlusOneQueries: number;
  largePayloads: number;
  memoryLeaks: number;
  inefficientLoops: number;
}

export class PerformanceOptimizer {
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * تحليل الأداء
   */
  async analyzePerformance(): Promise<PerformanceAnalysis> {
    console.log('⚡ Analyzing performance...');

    const bottlenecks: PerformanceBottleneck[] = [];

    // Check for common performance issues
    await this.checkDatabaseQueries(bottlenecks);
    await this.checkNPlusOne(bottlenecks);
    await this.checkLargePayloads(bottlenecks);
    await this.checkMemoryLeaks(bottlenecks);
    await this.checkInefficientLoops(bottlenecks);

    const metrics: PerformanceMetrics = {
      databaseQueries: bottlenecks.filter(b => b.type === 'database').length,
      nPlusOneQueries: bottlenecks.filter(b => b.type === 'n+1').length,
      largePayloads: bottlenecks.filter(b => b.type === 'payload').length,
      memoryLeaks: bottlenecks.filter(b => b.type === 'memory').length,
      inefficientLoops: bottlenecks.filter(b => b.type === 'loop').length,
    };

    const recommendations = this.generatePerformanceRecommendations(bottlenecks);

    return {
      averageResponseTime: this.estimateResponseTime(bottlenecks),
      bottlenecks: bottlenecks.slice(0, 50),
      recommendations,
      metrics,
      criticalIssues: bottlenecks.filter(b => b.severity === 'critical'),
    };
  }

  /**
   * فحص استعلامات قاعدة البيانات
   */
  private async checkDatabaseQueries(bottlenecks: PerformanceBottleneck[]): Promise<void> {
    const files = await glob('**/routers/*.{ts,js}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**'],
    });

    for (const file of files) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Check for SELECT *
          if (line.includes('SELECT *') || line.includes('select *')) {
            bottlenecks.push({
              id: `select-all-${file}-${i}`,
              severity: 'medium',
              type: 'database',
              description: 'SELECT * query found',
              file,
              impact: 'Fetching unnecessary data',
              fix: 'Select only needed columns',
            });
          }

          // Check for missing indexes
          if (line.includes('WHERE') && !content.includes('INDEX')) {
            bottlenecks.push({
              id: `missing-index-${file}`,
              severity: 'high',
              type: 'database',
              description: 'Potential missing database index',
              file,
              impact: 'Slow query performance',
              fix: 'Add database indexes for WHERE clauses',
            });
          }

          // Check for transactions
          if (line.includes('db.query') && !content.includes('transaction')) {
            bottlenecks.push({
              id: `no-transaction-${file}`,
              severity: 'medium',
              type: 'database',
              description: 'Multiple queries without transaction',
              file,
              impact: 'Database consistency risk',
              fix: 'Wrap multiple queries in transaction',
            });
          }
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * فحص N+1 Query Problem
   */
  private async checkNPlusOne(bottlenecks: PerformanceBottleneck[]): Promise<void> {
    const files = await glob('**/routers/*.{ts,js}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**'],
    });

    for (const file of files) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');

        // Look for loop + query pattern
        if (content.includes('for') && content.includes('await') && content.includes('db.')) {
          const forLoops = (content.match(/for\s*\(/g) || []).length;
          const awaitInLoop = (content.match(/for[^{]*{[^}]*await[^}]*db\./g) || []).length;

          if (awaitInLoop > 0) {
            bottlenecks.push({
              id: `n-plus-one-${file}`,
              severity: 'critical',
              type: 'n+1',
              description: 'N+1 query problem detected',
              file,
              impact: 'Exponential database queries',
              fix: 'Use JOIN or batch queries with IN clause',
            });
          }
        }

        // Check for .map with await
        if (content.includes('.map(async') && content.includes('db.')) {
          bottlenecks.push({
            id: `map-async-${file}`,
            severity: 'high',
            type: 'n+1',
            description: 'Async map with database queries',
            file,
            impact: 'Multiple sequential queries',
            fix: 'Use Promise.all or batch queries',
          });
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * فحص الحمولات الكبيرة
   */
  private async checkLargePayloads(bottlenecks: PerformanceBottleneck[]): Promise<void> {
    const files = await glob('**/routers/*.{ts,js}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**'],
    });

    for (const file of files) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');

        // Check for large data returns
        if (content.includes('findMany()') && !content.includes('take') && !content.includes('limit')) {
          bottlenecks.push({
            id: `unlimited-query-${file}`,
            severity: 'high',
            type: 'payload',
            description: 'Query without pagination',
            file,
            impact: 'Large response payloads',
            fix: 'Add pagination (take/skip or limit/offset)',
          });
        }

        // Check for missing compression
        if (content.includes('json()') && !content.includes('compress')) {
          bottlenecks.push({
            id: `no-compression-${file}`,
            severity: 'medium',
            type: 'payload',
            description: 'JSON response without compression',
            file,
            impact: 'Larger network transfer',
            fix: 'Enable gzip/brotli compression',
          });
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * فحص تسريبات الذاكرة
   */
  private async checkMemoryLeaks(bottlenecks: PerformanceBottleneck[]): Promise<void> {
    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**'],
    });

    for (const file of files.slice(0, 100)) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');

        // Check for missing cleanup
        if (content.includes('useEffect') && content.includes('setInterval')) {
          if (!content.includes('clearInterval')) {
            bottlenecks.push({
              id: `missing-cleanup-${file}`,
              severity: 'high',
              type: 'memory',
              description: 'setInterval without cleanup',
              file,
              impact: 'Memory leak in React component',
              fix: 'Add clearInterval in useEffect cleanup',
            });
          }
        }

        // Check for event listener cleanup
        if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
          bottlenecks.push({
            id: `event-listener-${file}`,
            severity: 'medium',
            type: 'memory',
            description: 'Event listener without cleanup',
            file,
            impact: 'Potential memory leak',
            fix: 'Remove event listeners on cleanup',
          });
        }

        // Check for global variables
        if (content.includes('window.') && content.includes('= ')) {
          bottlenecks.push({
            id: `global-variable-${file}`,
            severity: 'low',
            type: 'memory',
            description: 'Global variable assignment',
            file,
            impact: 'Memory not garbage collected',
            fix: 'Use local variables or proper state management',
          });
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * فحص الحلقات غير الفعالة
   */
  private async checkInefficientLoops(bottlenecks: PerformanceBottleneck[]): Promise<void> {
    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**'],
    });

    for (const file of files.slice(0, 100)) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Nested loops
          if (line.includes('for')) {
            const nextLines = lines.slice(i, i + 10).join('\n');
            if ((nextLines.match(/for/g) || []).length > 1) {
              bottlenecks.push({
                id: `nested-loop-${file}-${i}`,
                severity: 'medium',
                type: 'loop',
                description: 'Nested loops detected',
                file,
                impact: 'O(n²) or worse complexity',
                fix: 'Consider using Map/Set for O(n) complexity',
              });
            }
          }

          // Array operations in loops
          if (line.includes('for') && line.includes('.push(')) {
            bottlenecks.push({
              id: `push-in-loop-${file}-${i}`,
              severity: 'low',
              type: 'loop',
              description: 'Array push in loop',
              file,
              impact: 'Potential performance issue',
              fix: 'Pre-allocate array or use map/filter',
            });
          }
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * تقدير وقت الاستجابة
   */
  private estimateResponseTime(bottlenecks: PerformanceBottleneck[]): number {
    let baseTime = 100; // Base 100ms

    for (const bottleneck of bottlenecks) {
      if (bottleneck.severity === 'critical') baseTime += 200;
      else if (bottleneck.severity === 'high') baseTime += 100;
      else if (bottleneck.severity === 'medium') baseTime += 50;
      else baseTime += 20;
    }

    return baseTime;
  }

  /**
   * توليد توصيات الأداء
   */
  private generatePerformanceRecommendations(
    bottlenecks: PerformanceBottleneck[]
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    const types = new Set(bottlenecks.map(b => b.type));

    if (types.has('n+1')) {
      recommendations.push({
        priority: 100,
        title: 'Fix N+1 Query Problems',
        description: 'Eliminate sequential database queries',
        expectedImprovement: '80-90% faster',
        implementation: 'Use JOINs or batch queries with IN clause',
      });
    }

    if (types.has('database')) {
      recommendations.push({
        priority: 95,
        title: 'Optimize Database Queries',
        description: 'Add indexes and optimize queries',
        expectedImprovement: '50-70% faster',
        implementation: 'Add indexes, select specific columns, use query optimization',
      });
    }

    if (types.has('payload')) {
      recommendations.push({
        priority: 90,
        title: 'Implement Pagination & Compression',
        description: 'Reduce response payload size',
        expectedImprovement: '60-80% smaller payloads',
        implementation: 'Add pagination, enable compression, use field selection',
      });
    }

    if (types.has('memory')) {
      recommendations.push({
        priority: 85,
        title: 'Fix Memory Leaks',
        description: 'Cleanup intervals and event listeners',
        expectedImprovement: 'Stable memory usage',
        implementation: 'Add cleanup functions, remove event listeners',
      });
    }

    return recommendations;
  }
}
