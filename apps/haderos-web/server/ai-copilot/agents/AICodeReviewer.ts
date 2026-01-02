/**
 * 👨‍💻 AI CODE REVIEWER & AUTO-FIX
 *
 * مراجع الكود الذكي - يراجع ويصلح الكود تلقائياً
 */

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

export interface CodeReview {
  file: string;
  score: number; // 0-100
  issues: ReviewIssue[];
  suggestions: ReviewSuggestion[];
  autoFixes: AutoFixApplied[];
  metrics: CodeMetrics;
}

export interface ReviewIssue {
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  fix?: string;
  autoFixable: boolean;
}

export interface ReviewSuggestion {
  type: 'refactor' | 'optimization' | 'best_practice' | 'security';
  priority: number;
  description: string;
  before: string;
  after: string;
  impact: string;
}

export interface AutoFixApplied {
  line: number;
  rule: string;
  before: string;
  after: string;
  timestamp: Date;
}

export interface CodeMetrics {
  lines: number;
  complexity: number;
  duplications: number;
  coverage: number;
  maintainability: number;
}

export class AICodeReviewer {
  private projectRoot: string;
  private rules: ReviewRule[];

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.rules = this.initializeRules();
  }

  /**
   * مراجعة ملف واحد
   */
  async reviewFile(filePath: string): Promise<CodeReview> {
    console.log(`📝 Reviewing: ${filePath}`);

    const fullPath = path.join(this.projectRoot, filePath);
    const content = await readFile(fullPath, 'utf-8');
    const lines = content.split('\n');

    const issues: ReviewIssue[] = [];
    const suggestions: ReviewSuggestion[] = [];
    const autoFixes: AutoFixApplied[] = [];

    // Apply all review rules
    for (const rule of this.rules) {
      const ruleResults = await rule.check(content, lines, filePath);
      issues.push(...ruleResults.issues);
      suggestions.push(...ruleResults.suggestions);
    }

    // Auto-fix fixable issues
    let modifiedContent = content;
    const autoFixableIssues = issues.filter((i) => i.autoFixable && i.fix);

    for (const issue of autoFixableIssues) {
      if (issue.fix) {
        const before = lines[issue.line - 1];
        modifiedContent = modifiedContent.replace(before, issue.fix);

        autoFixes.push({
          line: issue.line,
          rule: issue.rule,
          before,
          after: issue.fix,
          timestamp: new Date(),
        });
      }
    }

    // Write back if modified
    if (modifiedContent !== content) {
      await writeFile(fullPath, modifiedContent, 'utf-8');
      console.log(`✅ Auto-fixed ${autoFixes.length} issues in ${filePath}`);
    }

    const metrics = this.calculateMetrics(content, lines);
    const score = this.calculateScore(issues, metrics);

    return {
      file: filePath,
      score,
      issues,
      suggestions,
      autoFixes,
      metrics,
    };
  }

  /**
   * مراجعة المشروع كامل
   */
  async reviewProject(): Promise<{
    totalFiles: number;
    reviews: CodeReview[];
    summary: ReviewSummary;
  }> {
    console.log('🔍 Reviewing entire project...');

    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '**/*.test.ts'],
    });

    const reviews: CodeReview[] = [];

    // Review files in batches
    const batchSize = 20;
    for (let i = 0; i < Math.min(files.length, 100); i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchReviews = await Promise.all(batch.map((file) => this.reviewFile(file)));
      reviews.push(...batchReviews);
    }

    const summary = this.generateSummary(reviews);

    return {
      totalFiles: files.length,
      reviews,
      summary,
    };
  }

  /**
   * تهيئة قواعد المراجعة
   */
  private initializeRules(): ReviewRule[] {
    return [
      // Type Safety Rules
      {
        name: 'no-any-type',
        category: 'type_safety',
        check: async (content, lines, file) => {
          const issues: ReviewIssue[] = [];
          const suggestions: ReviewSuggestion[] = [];

          lines.forEach((line, index) => {
            if (line.includes(': any') && !line.includes('// @ts-expect-error')) {
              issues.push({
                line: index + 1,
                severity: 'warning',
                rule: 'no-any-type',
                message: 'Avoid using "any" type - use specific types instead',
                fix: line.replace(': any', ': unknown'),
                autoFixable: true,
              });

              suggestions.push({
                type: 'best_practice',
                priority: 80,
                description: 'Replace "any" with proper type',
                before: line.trim(),
                after: line.replace(': any', ': unknown').trim(),
                impact: 'Improves type safety',
              });
            }
          });

          return { issues, suggestions };
        },
      },

      // Performance Rules
      {
        name: 'no-inline-functions',
        category: 'performance',
        check: async (content, lines, file) => {
          const issues: ReviewIssue[] = [];
          const suggestions: ReviewSuggestion[] = [];

          if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            lines.forEach((line, index) => {
              if (line.includes('onClick={()') || line.includes('onChange={()')) {
                issues.push({
                  line: index + 1,
                  severity: 'info',
                  rule: 'no-inline-functions',
                  message: 'Inline function in JSX - consider using useCallback',
                  autoFixable: false,
                });

                suggestions.push({
                  type: 'optimization',
                  priority: 60,
                  description: 'Extract inline function to useCallback',
                  before: line.trim(),
                  after: 'const handleClick = useCallback(() => { ... }, [])',
                  impact: 'Prevents unnecessary re-renders',
                });
              }
            });
          }

          return { issues, suggestions };
        },
      },

      // Security Rules
      {
        name: 'no-eval',
        category: 'security',
        check: async (content, lines, file) => {
          const issues: ReviewIssue[] = [];

          lines.forEach((line, index) => {
            if (line.includes('eval(') || line.includes('Function(')) {
              issues.push({
                line: index + 1,
                severity: 'error',
                rule: 'no-eval',
                message: 'Never use eval() - it poses security risks',
                autoFixable: false,
              });
            }
          });

          return { issues, suggestions: [] };
        },
      },

      // Code Quality Rules
      {
        name: 'no-console-log',
        category: 'code_quality',
        check: async (content, lines, file) => {
          const issues: ReviewIssue[] = [];

          lines.forEach((line, index) => {
            if (line.includes('console.log(') && !line.includes('// dev')) {
              issues.push({
                line: index + 1,
                severity: 'warning',
                rule: 'no-console-log',
                message: 'Remove console.log - use proper logging',
                fix: line.replace('console.log(', 'logger.debug('),
                autoFixable: true,
              });
            }
          });

          return { issues, suggestions: [] };
        },
      },

      // React Rules
      {
        name: 'missing-key-prop',
        category: 'react',
        check: async (content, lines, file) => {
          const issues: ReviewIssue[] = [];

          if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            lines.forEach((line, index) => {
              if (line.includes('.map(') && !content.includes('key=')) {
                const nextLines = lines.slice(index, index + 5).join('\n');
                if (!nextLines.includes('key=')) {
                  issues.push({
                    line: index + 1,
                    severity: 'error',
                    rule: 'missing-key-prop',
                    message: 'Missing "key" prop in list - React requires it',
                    autoFixable: false,
                  });
                }
              }
            });
          }

          return { issues, suggestions: [] };
        },
      },

      // Import Rules
      {
        name: 'unused-imports',
        category: 'code_quality',
        check: async (content, lines, file) => {
          const issues: ReviewIssue[] = [];
          const imports: string[] = [];

          lines.forEach((line, index) => {
            const importMatch = line.match(/import\s+(?:{([^}]+)}|(\w+))\s+from/);
            if (importMatch) {
              const imported = importMatch[1] || importMatch[2];
              if (imported) {
                const items = imported.split(',').map((i) => i.trim());
                items.forEach((item) => {
                  const name = item.split(' as ')[0].trim();
                  if (!content.slice(line.length).includes(name)) {
                    issues.push({
                      line: index + 1,
                      severity: 'warning',
                      rule: 'unused-imports',
                      message: `Unused import: ${name}`,
                      autoFixable: true,
                    });
                  }
                });
              }
            }
          });

          return { issues, suggestions: [] };
        },
      },

      // Async Rules
      {
        name: 'missing-await',
        category: 'async',
        check: async (content, lines, file) => {
          const issues: ReviewIssue[] = [];

          lines.forEach((line, index) => {
            if (line.includes('async') && line.includes('function')) {
              const nextLines = lines.slice(index, index + 20).join('\n');
              if (!nextLines.includes('await') && !nextLines.includes('return Promise')) {
                issues.push({
                  line: index + 1,
                  severity: 'info',
                  rule: 'missing-await',
                  message: 'Async function without await - consider removing async',
                  autoFixable: false,
                });
              }
            }
          });

          return { issues, suggestions: [] };
        },
      },
    ];
  }

  /**
   * حساب مقاييس الكود
   */
  private calculateMetrics(content: string, lines: string[]): CodeMetrics {
    const codeLines = lines.filter((l) => l.trim() && !l.trim().startsWith('//')).length;
    const complexity = this.calculateComplexity(content);
    const duplications = this.findDuplications(lines);

    const maintainability = Math.max(0, 100 - complexity - duplications * 5);

    return {
      lines: codeLines,
      complexity,
      duplications,
      coverage: 0, // Would need actual coverage data
      maintainability,
    };
  }

  /**
   * حساب التعقيد الدوري (Cyclomatic Complexity)
   */
  private calculateComplexity(content: string): number {
    let complexity = 1; // Base complexity

    // Count decision points
    const patterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b\?\b/g, // Ternary
      /\b&&\b/g,
      /\b\|\|\b/g,
    ];

    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      complexity += matches ? matches.length : 0;
    });

    return Math.min(complexity, 100);
  }

  /**
   * إيجاد التكرارات
   */
  private findDuplications(lines: string[]): number {
    const blocks = new Map<string, number>();

    // Check for duplicate blocks of 5+ lines
    for (let i = 0; i < lines.length - 5; i++) {
      const block = lines
        .slice(i, i + 5)
        .join('\n')
        .trim();
      if (block.length > 50) {
        blocks.set(block, (blocks.get(block) || 0) + 1);
      }
    }

    return Array.from(blocks.values()).filter((count) => count > 1).length;
  }

  /**
   * حساب الدرجة
   */
  private calculateScore(issues: ReviewIssue[], metrics: CodeMetrics): number {
    let score = metrics.maintainability;

    // Deduct for issues
    const errors = issues.filter((i) => i.severity === 'error').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;

    score -= errors * 10;
    score -= warnings * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * توليد ملخص
   */
  private generateSummary(reviews: CodeReview[]): ReviewSummary {
    const totalIssues = reviews.reduce((sum, r) => sum + r.issues.length, 0);
    const totalAutoFixes = reviews.reduce((sum, r) => sum + r.autoFixes.length, 0);
    const averageScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;

    const issuesByRule = new Map<string, number>();
    reviews.forEach((r) => {
      r.issues.forEach((issue) => {
        issuesByRule.set(issue.rule, (issuesByRule.get(issue.rule) || 0) + 1);
      });
    });

    const topIssues = Array.from(issuesByRule.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([rule, count]) => ({ rule, count }));

    return {
      totalFiles: reviews.length,
      totalIssues,
      totalAutoFixes,
      averageScore: Math.round(averageScore),
      issuesBySeverity: {
        error: reviews.reduce(
          (sum, r) => sum + r.issues.filter((i) => i.severity === 'error').length,
          0
        ),
        warning: reviews.reduce(
          (sum, r) => sum + r.issues.filter((i) => i.severity === 'warning').length,
          0
        ),
        info: reviews.reduce(
          (sum, r) => sum + r.issues.filter((i) => i.severity === 'info').length,
          0
        ),
      },
      topIssues,
    };
  }

  /**
   * توليد تقرير المراجعة
   */
  generateReport(result: {
    totalFiles: number;
    reviews: CodeReview[];
    summary: ReviewSummary;
  }): string {
    return `
# 👨‍💻 AI Code Review Report

**Generated:** ${new Date().toISOString()}

## 📊 Summary

- **Files Reviewed:** ${result.summary.totalFiles}
- **Total Issues:** ${result.summary.totalIssues}
- **Auto-Fixes Applied:** ${result.summary.totalAutoFixes}
- **Average Code Score:** ${result.summary.averageScore}/100

### Issues by Severity

- 🔴 Errors: ${result.summary.issuesBySeverity.error}
- 🟡 Warnings: ${result.summary.issuesBySeverity.warning}
- 🔵 Info: ${result.summary.issuesBySeverity.info}

### Top Issues

${result.summary.topIssues.map((issue, i) => `${i + 1}. **${issue.rule}**: ${issue.count} occurrences`).join('\n')}

## 📁 Files with Issues

${result.reviews
  .filter((r) => r.issues.length > 0)
  .slice(0, 20)
  .map(
    (review) => `
### ${review.file} (Score: ${review.score}/100)

- **Issues:** ${review.issues.length}
- **Auto-Fixes:** ${review.autoFixes.length}
- **Complexity:** ${review.metrics.complexity}
- **Maintainability:** ${review.metrics.maintainability}/100

${review.issues
  .slice(0, 5)
  .map(
    (issue) => `
- Line ${issue.line}: [${issue.severity}] ${issue.message}
  ${issue.fix ? `  ✅ Auto-fixed: \`${issue.fix}\`` : ''}
`
  )
  .join('\n')}
`
  )
  .join('\n')}

## 💡 Recommendations

${result.reviews
  .flatMap((r) => r.suggestions)
  .sort((a, b) => b.priority - a.priority)
  .slice(0, 10)
  .map(
    (sug, i) => `
${i + 1}. **${sug.type}** (Priority: ${sug.priority})
   - ${sug.description}
   - Impact: ${sug.impact}
`
  )
  .join('\n')}

---
*Report generated by HADEROS AI Code Reviewer*
    `.trim();
  }
}

interface ReviewRule {
  name: string;
  category: string;
  check: (
    content: string,
    lines: string[],
    file: string
  ) => Promise<{
    issues: ReviewIssue[];
    suggestions: ReviewSuggestion[];
  }>;
}

interface ReviewSummary {
  totalFiles: number;
  totalIssues: number;
  totalAutoFixes: number;
  averageScore: number;
  issuesBySeverity: {
    error: number;
    warning: number;
    info: number;
  };
  topIssues: { rule: string; count: number }[];
}
