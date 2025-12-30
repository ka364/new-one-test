/**
 * 🧪 INTELLIGENT TEST GENERATOR
 *
 * مولد الاختبارات الذكي - يولد اختبارات شاملة تلقائياً
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import { existsSync } from 'fs';

export interface TestGenerationResult {
  sourceFile: string;
  testFile: string;
  testsGenerated: number;
  coverage: TestCoverage;
  tests: GeneratedTest[];
}

export interface TestCoverage {
  functions: number; // Percentage
  lines: number;
  branches: number;
  statements: number;
}

export interface GeneratedTest {
  name: string;
  type: 'unit' | 'integration' | 'edge_case' | 'error_handling';
  description: string;
  code: string;
  priority: number;
}

export class IntelligentTestGenerator {
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * توليد اختبارات لملف
   */
  async generateTestsForFile(sourceFile: string): Promise<TestGenerationResult> {
    console.log(`🧪 Generating tests for: ${sourceFile}`);

    const fullPath = path.join(this.projectRoot, sourceFile);
    const content = await readFile(fullPath, 'utf-8');

    // Analyze source file
    const analysis = this.analyzeSourceFile(content, sourceFile);

    // Generate tests
    const tests = await this.generateTests(analysis);

    // Create test file
    const testFile = this.getTestFilePath(sourceFile);
    const testContent = this.buildTestFile(sourceFile, tests, analysis);

    // Ensure directory exists
    const testDir = path.dirname(path.join(this.projectRoot, testFile));
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }

    await writeFile(path.join(this.projectRoot, testFile), testContent, 'utf-8');

    console.log(`✅ Generated ${tests.length} tests in ${testFile}`);

    return {
      sourceFile,
      testFile,
      testsGenerated: tests.length,
      coverage: this.estimateCoverage(tests, analysis),
      tests,
    };
  }

  /**
   * توليد اختبارات للمشروع كامل
   */
  async generateProjectTests(): Promise<{
    filesProcessed: number;
    totalTests: number;
    results: TestGenerationResult[];
  }> {
    console.log('🔍 Generating tests for entire project...');

    const files = await glob('**/routers/*.ts', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**', '**/*.test.ts'],
    });

    const results: TestGenerationResult[] = [];

    for (const file of files.slice(0, 10)) { // Limit to 10 files for demo
      try {
        const result = await this.generateTestsForFile(file);
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate tests for ${file}:`, error);
      }
    }

    const totalTests = results.reduce((sum, r) => sum + r.testsGenerated, 0);

    return {
      filesProcessed: results.length,
      totalTests,
      results,
    };
  }

  /**
   * تحليل ملف المصدر
   */
  private analyzeSourceFile(content: string, filePath: string): SourceAnalysis {
    const functions: FunctionInfo[] = [];
    const exports: string[] = [];
    const imports: string[] = [];
    const types: string[] = [];

    const lines = content.split('\n');

    // Find functions
    lines.forEach((line, index) => {
      // Export functions
      const exportMatch = line.match(/export\s+(async\s+)?function\s+(\w+)/);
      if (exportMatch) {
        const name = exportMatch[2];
        functions.push({
          name,
          isAsync: !!exportMatch[1],
          line: index + 1,
          isExported: true,
        });
        exports.push(name);
      }

      // Arrow functions
      const arrowMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/);
      if (arrowMatch) {
        const name = arrowMatch[1];
        functions.push({
          name,
          isAsync: line.includes('async'),
          line: index + 1,
          isExported: line.includes('export'),
        });
      }

      // Imports
      if (line.startsWith('import')) {
        const importMatch = line.match(/import\s+(?:{([^}]+)}|(\w+))/);
        if (importMatch) {
          const imported = (importMatch[1] || importMatch[2]).split(',').map(i => i.trim());
          imports.push(...imported);
        }
      }

      // Types/Interfaces
      const typeMatch = line.match(/(?:export\s+)?(?:interface|type)\s+(\w+)/);
      if (typeMatch) {
        types.push(typeMatch[1]);
      }
    });

    // Detect if it's a tRPC router
    const isTRPCRouter = content.includes('publicProcedure') || content.includes('protectedProcedure');
    const isReactComponent = content.includes('return (') && (filePath.endsWith('.tsx') || filePath.endsWith('.jsx'));

    return {
      functions,
      exports,
      imports,
      types,
      isTRPCRouter,
      isReactComponent,
      hasDatabase: content.includes('db.') || content.includes('drizzle'),
      hasAuth: content.includes('ctx.user') || content.includes('session'),
    };
  }

  /**
   * توليد الاختبارات
   */
  private async generateTests(analysis: SourceAnalysis): Promise<GeneratedTest[]> {
    const tests: GeneratedTest[] = [];

    if (analysis.isTRPCRouter) {
      tests.push(...this.generateTRPCTests(analysis));
    } else if (analysis.isReactComponent) {
      tests.push(...this.generateReactTests(analysis));
    } else {
      tests.push(...this.generateUnitTests(analysis));
    }

    // Always add error handling tests
    tests.push(...this.generateErrorTests(analysis));

    // Add edge case tests
    tests.push(...this.generateEdgeCaseTests(analysis));

    return tests;
  }

  /**
   * توليد اختبارات tRPC
   */
  private generateTRPCTests(analysis: SourceAnalysis): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    analysis.functions.forEach(func => {
      if (func.isExported) {
        // Basic success test
        tests.push({
          name: `should ${func.name} successfully`,
          type: 'unit',
          description: `Test ${func.name} endpoint`,
          code: this.generateTRPCTestCode(func.name, 'success'),
          priority: 100,
        });

        // Auth test if needed
        if (analysis.hasAuth) {
          tests.push({
            name: `should require authentication for ${func.name}`,
            type: 'integration',
            description: `Test authentication for ${func.name}`,
            code: this.generateTRPCTestCode(func.name, 'auth'),
            priority: 90,
          });
        }

        // Database test if needed
        if (analysis.hasDatabase) {
          tests.push({
            name: `should handle database errors in ${func.name}`,
            type: 'error_handling',
            description: `Test database error handling for ${func.name}`,
            code: this.generateTRPCTestCode(func.name, 'db_error'),
            priority: 85,
          });
        }
      }
    });

    return tests;
  }

  /**
   * توليد كود اختبار tRPC
   */
  private generateTRPCTestCode(funcName: string, scenario: string): string {
    switch (scenario) {
      case 'success':
        return `
  it('should ${funcName} successfully', async () => {
    const mockContext = testUtils.createMockContext();

    const result = await ${funcName}({ ctx: mockContext });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
        `.trim();

      case 'auth':
        return `
  it('should require authentication for ${funcName}', async () => {
    const mockContext = { ...testUtils.createMockContext(), user: null };

    await expect(async () => {
      await ${funcName}({ ctx: mockContext });
    }).rejects.toThrow('Unauthorized');
  });
        `.trim();

      case 'db_error':
        return `
  it('should handle database errors in ${funcName}', async () => {
    const mockContext = testUtils.createMockContext();

    // Mock database error
    vi.spyOn(db, 'query').mockRejectedValue(new Error('Database error'));

    await expect(async () => {
      await ${funcName}({ ctx: mockContext });
    }).rejects.toThrow('Database error');
  });
        `.trim();

      default:
        return '';
    }
  }

  /**
   * توليد اختبارات React
   */
  private generateReactTests(analysis: SourceAnalysis): GeneratedTest[] {
    return [
      {
        name: 'should render component',
        type: 'unit',
        description: 'Test component renders',
        code: `
  it('should render component', () => {
    render(<Component />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
        `.trim(),
        priority: 100,
      },
    ];
  }

  /**
   * توليد اختبارات Unit
   */
  private generateUnitTests(analysis: SourceAnalysis): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    analysis.functions.forEach(func => {
      if (func.isExported) {
        tests.push({
          name: `should call ${func.name} correctly`,
          type: 'unit',
          description: `Test ${func.name} function`,
          code: `
  it('should call ${func.name} correctly', ${func.isAsync ? 'async ' : ''}() => {
    const result = ${func.isAsync ? 'await ' : ''}${func.name}();
    expect(result).toBeDefined();
  });
          `.trim(),
          priority: 100,
        });
      }
    });

    return tests;
  }

  /**
   * توليد اختبارات الأخطاء
   */
  private generateErrorTests(analysis: SourceAnalysis): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    analysis.functions.forEach(func => {
      if (func.isExported) {
        tests.push({
          name: `should handle errors in ${func.name}`,
          type: 'error_handling',
          description: `Test error handling for ${func.name}`,
          code: `
  it('should handle errors in ${func.name}', async () => {
    await expect(async () => {
      await ${func.name}(invalidInput);
    }).rejects.toThrow();
  });
          `.trim(),
          priority: 80,
        });
      }
    });

    return tests;
  }

  /**
   * توليد اختبارات الحالات الحدية
   */
  private generateEdgeCaseTests(analysis: SourceAnalysis): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    // Empty input test
    tests.push({
      name: 'should handle empty input',
      type: 'edge_case',
      description: 'Test with empty input',
      code: `
  it('should handle empty input', async () => {
    const result = await function({});
    expect(result).toBeDefined();
  });
      `.trim(),
      priority: 70,
    });

    // Null input test
    tests.push({
      name: 'should handle null input',
      type: 'edge_case',
      description: 'Test with null input',
      code: `
  it('should handle null input', async () => {
    await expect(async () => {
      await function(null);
    }).rejects.toThrow();
  });
      `.trim(),
      priority: 70,
    });

    return tests;
  }

  /**
   * بناء ملف الاختبار
   */
  private buildTestFile(sourceFile: string, tests: GeneratedTest[], analysis: SourceAnalysis): string {
    const imports = analysis.exports.length > 0
      ? `import { ${analysis.exports.join(', ')} } from '../${sourceFile.replace(/\.ts$/, '')}';`
      : '';

    return `
/**
 * Generated Tests for ${sourceFile}
 *
 * Auto-generated by HADEROS Intelligent Test Generator
 * Generated: ${new Date().toISOString()}
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testUtils } from '../setup';
${imports}

describe('${sourceFile}', () => {
  beforeEach(() => {
    // Setup
    vi.clearAllMocks();
  });

${tests.map(test => `  ${test.code}`).join('\n\n')}
});
    `.trim();
  }

  /**
   * الحصول على مسار ملف الاختبار
   */
  private getTestFilePath(sourceFile: string): string {
    const dir = path.dirname(sourceFile);
    const name = path.basename(sourceFile, path.extname(sourceFile));
    return path.join('tests', dir, `${name}.test.ts`);
  }

  /**
   * تقدير التغطية
   */
  private estimateCoverage(tests: GeneratedTest[], analysis: SourceAnalysis): TestCoverage {
    const functionsCount = analysis.functions.filter(f => f.isExported).length;
    const testsCount = tests.length;

    // Simple estimation
    const functionsCoverage = Math.min(100, (testsCount / Math.max(functionsCount, 1)) * 100);

    return {
      functions: Math.round(functionsCoverage),
      lines: Math.round(functionsCoverage * 0.8), // Estimate
      branches: Math.round(functionsCoverage * 0.6), // Estimate
      statements: Math.round(functionsCoverage * 0.75), // Estimate
    };
  }
}

interface SourceAnalysis {
  functions: FunctionInfo[];
  exports: string[];
  imports: string[];
  types: string[];
  isTRPCRouter: boolean;
  isReactComponent: boolean;
  hasDatabase: boolean;
  hasAuth: boolean;
}

interface FunctionInfo {
  name: string;
  isAsync: boolean;
  line: number;
  isExported: boolean;
}
