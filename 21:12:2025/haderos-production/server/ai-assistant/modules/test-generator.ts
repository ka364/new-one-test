/**
 * AI Test Generator
 * Automatically generates comprehensive tests for code files
 */

import { AIOrchestrator } from '../core/orchestrator';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TestGenerationResult {
  sourceFile: string;
  testFile: string;
  testCode: string;
  coverage: {
    functions: number;
    branches: number;
    lines: number;
  };
  scenarios: string[];
}

export class TestGenerator {
  private orchestrator: AIOrchestrator;

  constructor() {
    this.orchestrator = new AIOrchestrator();
  }

  /**
   * Generate tests for a single file
   */
  async generateTests(filePath: string): Promise<TestGenerationResult> {
    try {
      // Read source file
      const content = await fs.readFile(filePath, 'utf-8');

      // Create test generation task
      const task = {
        id: `test-gen-${Date.now()}`,
        type: 'test-generation' as const,
        input: `Generate comprehensive Vitest tests for the following code.\n\nFile: ${filePath}\n\nCode:\n${content}\n\nRequirements:\n- Use Vitest framework\n- Cover all functions and methods\n- Include edge cases and error scenarios\n- Use proper mocking where needed\n- Follow testing best practices`,
        priority: 'high' as const,
      };

      // Execute generation
      const result = await this.orchestrator.executeTask(task);

      if (!result.success || !result.output) {
        throw new Error(result.error || 'Test generation failed');
      }

      // Parse and save tests
      return await this.parseAndSaveTests(filePath, result.output);
    } catch (error) {
      console.error(`Error generating tests for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Generate tests for multiple files
   */
  async generateTestsForFiles(filePaths: string[]): Promise<TestGenerationResult[]> {
    const tasks = filePaths.map(async (filePath, index) => {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        id: `test-gen-${Date.now()}-${index}`,
        type: 'test-generation' as const,
        input: `Generate comprehensive Vitest tests for the following code.\n\nFile: ${filePath}\n\nCode:\n${content}\n\nRequirements:\n- Use Vitest framework\n- Cover all functions and methods\n- Include edge cases and error scenarios\n- Use proper mocking where needed\n- Follow testing best practices`,
        priority: 'medium' as const,
      };
    });

    const taskList = await Promise.all(tasks);
    const results = await this.orchestrator.executeTasks(taskList);

    const testResults = await Promise.all(
      results.map(async (result, index) => {
        if (!result.success || !result.output) {
          return {
            sourceFile: filePaths[index],
            testFile: '',
            testCode: '',
            coverage: { functions: 0, branches: 0, lines: 0 },
            scenarios: [],
          };
        }
        return await this.parseAndSaveTests(filePaths[index], result.output);
      })
    );

    return testResults;
  }

  /**
   * Generate tests for entire directory
   */
  async generateTestsForDirectory(
    dirPath: string,
    extensions: string[] = ['.ts', '.tsx']
  ): Promise<TestGenerationResult[]> {
    const files = await this.getSourceFiles(dirPath, extensions);
    return this.generateTestsForFiles(files);
  }

  /**
   * Parse AI response and save test file
   */
  private async parseAndSaveTests(
    sourceFile: string,
    response: string
  ): Promise<TestGenerationResult> {
    // Extract test code from response
    const codeMatch = response.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
    const testCode = codeMatch ? codeMatch[1].trim() : response;

    // Generate test file path
    const testFile = this.getTestFilePath(sourceFile);

    // Save test file
    await this.saveTestFile(testFile, testCode);

    // Extract scenarios
    const scenarios = this.extractScenarios(response);

    // Estimate coverage (simplified)
    const coverage = this.estimateCoverage(testCode);

    return {
      sourceFile,
      testFile,
      testCode,
      coverage,
      scenarios,
    };
  }

  /**
   * Get test file path
   */
  private getTestFilePath(sourceFile: string): string {
    const dir = path.dirname(sourceFile);
    const ext = path.extname(sourceFile);
    const base = path.basename(sourceFile, ext);

    // Create __tests__ directory if it doesn't exist
    const testDir = path.join(dir, '__tests__');

    return path.join(testDir, `${base}.test${ext}`);
  }

  /**
   * Save test file
   */
  private async saveTestFile(testFile: string, content: string): Promise<void> {
    const dir = path.dirname(testFile);

    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true });

    // Write test file
    await fs.writeFile(testFile, content, 'utf-8');
  }

  /**
   * Extract test scenarios from response
   */
  private extractScenarios(response: string): string[] {
    const scenarios: string[] = [];

    // Look for describe/it blocks
    const describeMatches = response.matchAll(/describe\(['"](.+?)['"]/g);
    for (const match of describeMatches) {
      scenarios.push(match[1]);
    }

    const itMatches = response.matchAll(/it\(['"](.+?)['"]/g);
    for (const match of itMatches) {
      scenarios.push(match[1]);
    }

    return scenarios;
  }

  /**
   * Estimate test coverage (simplified)
   */
  private estimateCoverage(testCode: string): TestGenerationResult['coverage'] {
    // Count test cases
    const testCases = (testCode.match(/it\(/g) || []).length;

    // Estimate coverage based on number of tests
    const baseCoverage = Math.min(testCases * 10, 90);

    return {
      functions: baseCoverage,
      branches: baseCoverage * 0.8,
      lines: baseCoverage * 0.9,
    };
  }

  /**
   * Get source files recursively
   */
  private async getSourceFiles(dirPath: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    async function traverse(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Skip node_modules, __tests__, and hidden directories
        if (
          entry.isDirectory() &&
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules' &&
          entry.name !== '__tests__'
        ) {
          await traverse(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          // Skip test files
          if (!entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
            files.push(fullPath);
          }
        }
      }
    }

    await traverse(dirPath);
    return files;
  }

  /**
   * Generate summary report
   */
  generateReport(results: TestGenerationResult[]): string {
    const totalFiles = results.length;
    const totalTests = results.reduce((sum, r) => sum + r.scenarios.length, 0);
    const avgCoverage = results.reduce((sum, r) => sum + r.coverage.lines, 0) / totalFiles;

    let report = `# Test Generation Report\n\n`;
    report += `## Summary\n\n`;
    report += `- **Source Files:** ${totalFiles}\n`;
    report += `- **Test Files Generated:** ${results.filter(r => r.testFile).length}\n`;
    report += `- **Total Test Cases:** ${totalTests}\n`;
    report += `- **Average Coverage:** ${avgCoverage.toFixed(1)}%\n\n`;

    report += `## Generated Tests\n\n`;
    for (const result of results) {
      if (result.testFile) {
        report += `### ${result.sourceFile}\n`;
        report += `- **Test File:** ${result.testFile}\n`;
        report += `- **Test Cases:** ${result.scenarios.length}\n`;
        report += `- **Estimated Coverage:** ${result.coverage.lines.toFixed(1)}%\n\n`;
      }
    }

    report += `## Next Steps\n\n`;
    report += `1. Review generated tests for accuracy\n`;
    report += `2. Run tests: \`npm run test\`\n`;
    report += `3. Check actual coverage: \`npm run test:coverage\`\n`;
    report += `4. Refine tests as needed\n`;

    return report;
  }
}
