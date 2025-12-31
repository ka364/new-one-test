/**
 * AI Code Analyzer
 * Analyzes code quality, finds bugs, and suggests improvements
 */

import { AIOrchestrator } from '../core/orchestrator';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CodeAnalysisResult {
  file: string;
  summary: string;
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    line?: number;
    suggestion?: string;
  }>;
  score: number; // 0-100
  recommendations: string[];
}

export class CodeAnalyzer {
  private orchestrator: AIOrchestrator;

  constructor() {
    this.orchestrator = new AIOrchestrator();
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string): Promise<CodeAnalysisResult> {
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Create analysis task
      const task = {
        id: `code-review-${Date.now()}`,
        type: 'code-review' as const,
        input: `File: ${filePath}\n\nCode:\n${content}`,
        priority: 'high' as const,
      };

      // Execute analysis
      const result = await this.orchestrator.executeTask(task);

      if (!result.success || !result.output) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Parse AI response
      return this.parseAnalysisResponse(filePath, result.output);
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Analyze multiple files
   */
  async analyzeFiles(filePaths: string[]): Promise<CodeAnalysisResult[]> {
    const tasks = filePaths.map(async (filePath, index) => {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        id: `code-review-${Date.now()}-${index}`,
        type: 'code-review' as const,
        input: `File: ${filePath}\n\nCode:\n${content}`,
        priority: 'medium' as const,
      };
    });

    const taskList = await Promise.all(tasks);
    const results = await this.orchestrator.executeTasks(taskList);

    return results.map((result, index) => {
      if (!result.success || !result.output) {
        return {
          file: filePaths[index],
          summary: 'Analysis failed',
          issues: [],
          score: 0,
          recommendations: [],
        };
      }
      return this.parseAnalysisResponse(filePaths[index], result.output);
    });
  }

  /**
   * Analyze entire directory
   */
  async analyzeDirectory(dirPath: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): Promise<CodeAnalysisResult[]> {
    const files = await this.getFilesRecursively(dirPath, extensions);
    return this.analyzeFiles(files);
  }

  /**
   * Get all files recursively
   */
  private async getFilesRecursively(dirPath: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    async function traverse(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Skip node_modules and hidden directories
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await traverse(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }

    await traverse(dirPath);
    return files;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAnalysisResponse(filePath: string, response: string): CodeAnalysisResult {
    // Extract sections from AI response
    const summaryMatch = response.match(/Summary:?\s*(.*?)(?=\n\n|Issues Found|$)/is);
    const issuesMatch = response.match(/Issues Found:?\s*(.*?)(?=\n\nRecommendations|$)/is);
    const recommendationsMatch = response.match(/Recommendations:?\s*(.*?)(?=\n\nCode Examples|$)/is);

    const summary = summaryMatch ? summaryMatch[1].trim() : 'No summary available';
    const issuesText = issuesMatch ? issuesMatch[1].trim() : '';
    const recommendationsText = recommendationsMatch ? recommendationsMatch[1].trim() : '';

    // Parse issues
    const issues = this.parseIssues(issuesText);

    // Calculate score based on issues
    const score = this.calculateScore(issues);

    // Parse recommendations
    const recommendations = recommendationsText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-*]\s*/, '').trim());

    return {
      file: filePath,
      summary,
      issues,
      score,
      recommendations,
    };
  }

  /**
   * Parse issues from text
   */
  private parseIssues(issuesText: string): CodeAnalysisResult['issues'] {
    const issues: CodeAnalysisResult['issues'] = [];
    const lines = issuesText.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      // Try to extract severity, type, and description
      const severityMatch = line.match(/\[(critical|high|medium|low)\]/i);
      const severity = (severityMatch ? severityMatch[1].toLowerCase() : 'medium') as 'critical' | 'high' | 'medium' | 'low';

      // Remove severity tag and clean up
      const cleanLine = line.replace(/\[(critical|high|medium|low)\]/i, '').trim();

      if (cleanLine.length > 0) {
        issues.push({
          severity,
          type: 'Code Quality',
          description: cleanLine,
        });
      }
    }

    return issues;
  }

  /**
   * Calculate score based on issues
   */
  private calculateScore(issues: CodeAnalysisResult['issues']): number {
    let score = 100;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Generate summary report
   */
  generateReport(results: CodeAnalysisResult[]): string {
    const totalFiles = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalFiles;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

    const criticalIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0);
    const highIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0);

    let report = `# Code Analysis Report\n\n`;
    report += `## Summary\n\n`;
    report += `- **Files Analyzed:** ${totalFiles}\n`;
    report += `- **Average Score:** ${averageScore.toFixed(1)}/100\n`;
    report += `- **Total Issues:** ${totalIssues}\n`;
    report += `  - Critical: ${criticalIssues}\n`;
    report += `  - High: ${highIssues}\n\n`;

    report += `## Files with Critical Issues\n\n`;
    const criticalFiles = results.filter(r => r.issues.some(i => i.severity === 'critical'));
    if (criticalFiles.length > 0) {
      for (const file of criticalFiles) {
        report += `### ${file.file}\n`;
        report += `Score: ${file.score}/100\n\n`;
        const critical = file.issues.filter(i => i.severity === 'critical');
        for (const issue of critical) {
          report += `- **[CRITICAL]** ${issue.description}\n`;
        }
        report += `\n`;
      }
    } else {
      report += `No critical issues found! 🎉\n\n`;
    }

    report += `## Top Recommendations\n\n`;
    const allRecommendations = results.flatMap(r => r.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 10);
    for (const rec of uniqueRecommendations) {
      report += `- ${rec}\n`;
    }

    return report;
  }
}
