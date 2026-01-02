/**
 * 🤖 AI CODE GENERATOR
 *
 * مولد ومحلل الكود الذكي
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import path from 'path';

export interface CodeQualityAnalysis {
  score: number;
  issues: CodeIssue[];
  metrics: CodeMetrics;
  testCoverage: number;
  criticalIssues: any[];
}

export interface CodeIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  message: string;
  file: string;
  line?: number;
  suggestedFix?: string;
}

export interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  complexity: number;
  maintainabilityIndex: number;
}

export class AICodeGenerator {
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * تحليل جودة الكود
   */
  async analyzeCodeQuality(): Promise<CodeQualityAnalysis> {
    console.log('📊 Analyzing code quality...');

    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.ts'],
    });

    const issues: CodeIssue[] = [];
    let totalLines = 0;
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    let complexity = 0;

    // Analyze sample of files
    for (const file of files.slice(0, 100)) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');
        const lines = content.split('\n');

        totalLines += lines.length;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (!line) {
            blankLines++;
          } else if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
            commentLines++;
          } else {
            codeLines++;

            // Check for code quality issues
            if (line.includes('any')) {
              issues.push({
                id: `any-${file}-${i}`,
                severity: 'medium',
                type: 'type_safety',
                message: 'Use of "any" type - prefer specific types',
                file,
                line: i + 1,
                suggestedFix: 'Replace "any" with proper type definition',
              });
            }

            if (line.includes('console.log')) {
              issues.push({
                id: `console-${file}-${i}`,
                severity: 'low',
                type: 'debugging',
                message: 'console.log found - should use proper logging',
                file,
                line: i + 1,
                suggestedFix: 'Replace with structured logging',
              });
            }

            if (line.includes('TODO') || line.includes('FIXME')) {
              issues.push({
                id: `todo-${file}-${i}`,
                severity: 'low',
                type: 'technical_debt',
                message: 'TODO/FIXME comment found',
                file,
                line: i + 1,
              });
            }

            // Complexity metrics
            if (line.includes('if') || line.includes('for') || line.includes('while')) {
              complexity++;
            }
          }
        }

        // Check file size
        if (lines.length > 500) {
          issues.push({
            id: `large-file-${file}`,
            severity: 'medium',
            type: 'maintainability',
            message: `File is too large (${lines.length} lines)`,
            file,
            suggestedFix: 'Consider splitting into smaller modules',
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    const metrics: CodeMetrics = {
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      complexity,
      maintainabilityIndex: this.calculateMaintainabilityIndex(codeLines, commentLines, complexity),
    };

    const score = this.calculateQualityScore(metrics, issues);

    return {
      score,
      issues: issues.slice(0, 50), // Top 50 issues
      metrics,
      testCoverage: 20, // Mock value - would need actual coverage data
      criticalIssues: issues.filter((i) => i.severity === 'critical'),
    };
  }

  /**
   * توليد كود تلقائياً
   */
  async generateCode(spec: {
    type: 'test' | 'component' | 'api' | 'migration';
    name: string;
    description: string;
  }): Promise<string> {
    console.log(`🔧 Generating ${spec.type}: ${spec.name}...`);

    switch (spec.type) {
      case 'test':
        return this.generateTest(spec);
      case 'component':
        return this.generateComponent(spec);
      case 'api':
        return this.generateAPI(spec);
      case 'migration':
        return this.generateMigration(spec);
      default:
        throw new Error(`Unknown code type: ${spec.type}`);
    }
  }

  /**
   * توليد اختبار
   */
  private generateTest(spec: { name: string; description: string }): string {
    return `
import { describe, it, expect, beforeEach } from 'vitest';
import { testUtils } from '../setup';

describe('${spec.name}', () => {
  beforeEach(() => {
    // Setup
  });

  it('${spec.description}', async () => {
    // Arrange
    const mockContext = testUtils.createMockContext();

    // Act
    const result = await ${spec.name}(mockContext);

    // Assert
    expect(result).toBeDefined();
  });

  it('should handle errors', async () => {
    // Test error handling
    await expect(async () => {
      // Error scenario
    }).rejects.toThrow();
  });
});
    `.trim();
  }

  /**
   * توليد مكون React
   */
  private generateComponent(spec: { name: string; description: string }): string {
    return `
import { useState } from 'react';

interface ${spec.name}Props {
  // Props here
}

/**
 * ${spec.description}
 */
export function ${spec.name}(props: ${spec.name}Props) {
  const [state, setState] = useState();

  return (
    <div className="container">
      <h2>${spec.name}</h2>
      {/* Component content */}
    </div>
  );
}
    `.trim();
  }

  /**
   * توليد API endpoint
   */
  private generateAPI(spec: { name: string; description: string }): string {
    return `
import { publicProcedure } from '../trpc';
import { z } from 'zod';

/**
 * ${spec.description}
 */
export const ${spec.name}Router = {
  get: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      // Implementation
      return { success: true };
    }),

  create: publicProcedure
    .input(z.object({
      // Schema here
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
      return { success: true };
    }),
};
    `.trim();
  }

  /**
   * توليد migration
   */
  private generateMigration(spec: { name: string; description: string }): string {
    return `
-- ${spec.description}
-- Generated: ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS ${spec.name} (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_${spec.name}_created ON ${spec.name}(created_at);
    `.trim();
  }

  /**
   * حساب مؤشر قابلية الصيانة
   */
  private calculateMaintainabilityIndex(
    codeLines: number,
    commentLines: number,
    complexity: number
  ): number {
    // Simplified maintainability index
    const commentRatio = commentLines / (codeLines + 1);
    const complexityPenalty = Math.min(complexity / 100, 0.5);

    let index = 100;
    index -= complexityPenalty * 50; // High complexity reduces maintainability
    index += commentRatio * 20; // Good comments improve maintainability

    return Math.max(0, Math.min(100, index));
  }

  /**
   * حساب درجة الجودة
   */
  private calculateQualityScore(metrics: CodeMetrics, issues: CodeIssue[]): number {
    let score = metrics.maintainabilityIndex;

    // Deduct for issues
    const criticalIssues = issues.filter((i) => i.severity === 'critical').length;
    const highIssues = issues.filter((i) => i.severity === 'high').length;
    const mediumIssues = issues.filter((i) => i.severity === 'medium').length;

    score -= criticalIssues * 10;
    score -= highIssues * 5;
    score -= mediumIssues * 2;

    return Math.max(0, Math.min(100, score));
  }
}
