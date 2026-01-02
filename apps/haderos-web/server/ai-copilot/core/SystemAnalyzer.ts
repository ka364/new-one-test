/**
 * 🔍 SYSTEM ANALYZER
 *
 * محلل النظام الذكي - يحلل البنية والتبعيات والهندسة المعمارية
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import path from 'path';

export interface StructureAnalysis {
  totalFiles: number;
  filesByType: Record<string, number>;
  largestFiles: FileInfo[];
  duplicateCode: DuplicateInfo[];
  warnings: Warning[];
}

export interface ArchitectureAnalysis {
  patterns: string[];
  violations: ArchitectureViolation[];
  suggestions: string[];
  score: number;
}

export interface FileInfo {
  path: string;
  size: number;
  lines: number;
}

export interface DuplicateInfo {
  pattern: string;
  occurrences: number;
  files: string[];
}

export interface ArchitectureViolation {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  location: string;
}

export interface Warning {
  type: string;
  message: string;
  file?: string;
}

export class SystemAnalyzer {
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * تحليل بنية المشروع
   */
  async analyzeStructure(): Promise<StructureAnalysis> {
    console.log('🔍 Analyzing project structure...');

    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**'],
    });

    const filesByType: Record<string, number> = {};
    const largestFiles: FileInfo[] = [];
    const warnings: Warning[] = [];

    for (const file of files.slice(0, 100)) {
      // Sample first 100 files
      const ext = path.extname(file);
      filesByType[ext] = (filesByType[ext] || 0) + 1;

      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');
        const lines = content.split('\n').length;
        const size = Buffer.byteLength(content);

        largestFiles.push({ path: file, size, lines });

        // Warning for very large files
        if (lines > 1000) {
          warnings.push({
            type: 'large_file',
            message: `File has ${lines} lines - consider splitting`,
            file,
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Sort by size
    largestFiles.sort((a, b) => b.size - a.size);

    return {
      totalFiles: files.length,
      filesByType,
      largestFiles: largestFiles.slice(0, 10),
      duplicateCode: await this.findDuplicateCode(files.slice(0, 50)),
      warnings,
    };
  }

  /**
   * تحليل الهندسة المعمارية
   */
  async analyzeArchitecture(): Promise<ArchitectureAnalysis> {
    console.log('🏗️ Analyzing architecture...');

    const patterns: string[] = [];
    const violations: ArchitectureViolation[] = [];
    const suggestions: string[] = [];

    // Check for common patterns
    const hasRouters = await this.checkPattern('**/routers/**/*.ts');
    const hasServices = await this.checkPattern('**/services/**/*.ts');
    const hasComponents = await this.checkPattern('**/components/**/*.tsx');
    const hasTests = await this.checkPattern('**/*.test.ts');

    if (hasRouters) patterns.push('Router Pattern');
    if (hasServices) patterns.push('Service Layer');
    if (hasComponents) patterns.push('Component-Based UI');
    if (hasTests) patterns.push('Testing Infrastructure');

    // Check for violations
    if (!hasTests) {
      violations.push({
        type: 'missing_tests',
        severity: 'high',
        description: 'No test files found',
        location: 'project root',
      });
      suggestions.push('Add comprehensive test coverage');
    }

    // Calculate architecture score
    const score = this.calculateArchitectureScore(patterns, violations);

    return {
      patterns,
      violations,
      suggestions,
      score,
    };
  }

  /**
   * البحث عن الكود المكرر
   */
  private async findDuplicateCode(files: string[]): Promise<DuplicateInfo[]> {
    const duplicates: DuplicateInfo[] = [];
    const codeBlocks = new Map<string, string[]>();

    for (const file of files) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');
        const lines = content.split('\n');

        // Look for function patterns
        const functionPattern = /function\s+(\w+)/g;
        let match;

        while ((match = functionPattern.exec(content)) !== null) {
          const funcName = match[1];
          if (!codeBlocks.has(funcName)) {
            codeBlocks.set(funcName, []);
          }
          codeBlocks.get(funcName)!.push(file);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Find duplicates
    for (const [pattern, occurrenceFiles] of codeBlocks.entries()) {
      if (occurrenceFiles.length > 1) {
        duplicates.push({
          pattern,
          occurrences: occurrenceFiles.length,
          files: occurrenceFiles,
        });
      }
    }

    return duplicates.slice(0, 10); // Top 10 duplicates
  }

  /**
   * التحقق من وجود نمط معين
   */
  private async checkPattern(pattern: string): Promise<boolean> {
    const files = await glob(pattern, {
      cwd: this.projectRoot,
      ignore: ['node_modules/**'],
    });
    return files.length > 0;
  }

  /**
   * حساب درجة الهندسة المعمارية
   */
  private calculateArchitectureScore(
    patterns: string[],
    violations: ArchitectureViolation[]
  ): number {
    let score = 50; // Base score

    // Add points for good patterns
    score += patterns.length * 10;

    // Deduct points for violations
    for (const violation of violations) {
      if (violation.severity === 'high') score -= 20;
      else if (violation.severity === 'medium') score -= 10;
      else score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * تحليل التبعيات
   */
  async analyzeDependencies(): Promise<{
    total: number;
    outdated: number;
    security: number;
  }> {
    try {
      const packageJson = await readFile(path.join(this.projectRoot, 'package.json'), 'utf-8');
      const pkg = JSON.parse(packageJson);

      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      return {
        total: Object.keys(deps).length,
        outdated: 0, // Would need npm outdated
        security: 0, // Would need npm audit
      };
    } catch (error) {
      return { total: 0, outdated: 0, security: 0 };
    }
  }
}
