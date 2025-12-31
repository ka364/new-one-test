/**
 * AI Security Auditor
 * Performs comprehensive security audits on code
 */

import { AIOrchestrator } from '../core/orchestrator';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  file: string;
  line?: number;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration
}

export interface SecurityAuditResult {
  file: string;
  rating: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  score: number; // 0-100
  issues: SecurityIssue[];
  summary: string;
}

export class SecurityAuditor {
  private orchestrator: AIOrchestrator;

  constructor() {
    this.orchestrator = new AIOrchestrator();
  }

  /**
   * Audit a single file
   */
  async auditFile(filePath: string): Promise<SecurityAuditResult> {
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Create security audit task
      const task = {
        id: `security-audit-${Date.now()}`,
        type: 'security-audit' as const,
        input: `Perform a comprehensive security audit on the following code.\n\nFile: ${filePath}\n\nCode:\n${content}\n\nCheck for:\n- OWASP Top 10 vulnerabilities\n- SQL Injection\n- XSS (Cross-Site Scripting)\n- CSRF (Cross-Site Request Forgery)\n- Authentication/Authorization issues\n- Data validation and sanitization\n- Secure communication\n- Sensitive data exposure\n- Insecure dependencies`,
        priority: 'high' as const,
      };

      // Execute audit
      const result = await this.orchestrator.executeTask(task);

      if (!result.success || !result.output) {
        throw new Error(result.error || 'Security audit failed');
      }

      // Parse audit results
      return this.parseAuditResponse(filePath, result.output);
    } catch (error) {
      console.error(`Error auditing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Audit multiple files
   */
  async auditFiles(filePaths: string[]): Promise<SecurityAuditResult[]> {
    const tasks = filePaths.map(async (filePath, index) => {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        id: `security-audit-${Date.now()}-${index}`,
        type: 'security-audit' as const,
        input: `Perform a comprehensive security audit on the following code.\n\nFile: ${filePath}\n\nCode:\n${content}\n\nCheck for:\n- OWASP Top 10 vulnerabilities\n- SQL Injection\n- XSS (Cross-Site Scripting)\n- CSRF (Cross-Site Request Forgery)\n- Authentication/Authorization issues\n- Data validation and sanitization\n- Secure communication\n- Sensitive data exposure\n- Insecure dependencies`,
        priority: 'high' as const,
      };
    });

    const taskList = await Promise.all(tasks);
    const results = await this.orchestrator.executeTasks(taskList);

    return results.map((result, index) => {
      if (!result.success || !result.output) {
        return {
          file: filePaths[index],
          rating: 'F' as const,
          score: 0,
          issues: [],
          summary: 'Audit failed',
        };
      }
      return this.parseAuditResponse(filePaths[index], result.output);
    });
  }

  /**
   * Audit entire directory
   */
  async auditDirectory(
    dirPath: string,
    extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']
  ): Promise<SecurityAuditResult[]> {
    const files = await this.getFilesRecursively(dirPath, extensions);
    return this.auditFiles(files);
  }

  /**
   * Parse AI audit response
   */
  private parseAuditResponse(filePath: string, response: string): SecurityAuditResult {
    // Extract rating
    const ratingMatch = response.match(/Security Rating:?\s*([A-F][+]?)/i);
    const rating = (ratingMatch ? ratingMatch[1] : 'C') as SecurityAuditResult['rating'];

    // Extract summary
    const summaryMatch = response.match(/Summary:?\s*(.*?)(?=\n\n|Critical Issues|$)/is);
    const summary = summaryMatch ? summaryMatch[1].trim() : 'No summary available';

    // Extract issues
    const issuesMatch = response.match(/(?:Critical Issues|Issues Found):?\s*(.*?)(?=\n\nRecommendations|$)/is);
    const issuesText = issuesMatch ? issuesMatch[1].trim() : '';

    const issues = this.parseSecurityIssues(filePath, issuesText);

    // Calculate score
    const score = this.calculateSecurityScore(rating, issues);

    return {
      file: filePath,
      rating,
      score,
      issues,
      summary,
    };
  }

  /**
   * Parse security issues from text
   */
  private parseSecurityIssues(filePath: string, issuesText: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = issuesText.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      // Extract severity
      const severityMatch = line.match(/\[(critical|high|medium|low)\]/i);
      const severity = (severityMatch ? severityMatch[1].toLowerCase() : 'medium') as SecurityIssue['severity'];

      // Extract category (e.g., SQL Injection, XSS, etc.)
      const categoryMatch = line.match(/(?:SQL Injection|XSS|CSRF|Authentication|Authorization|Validation|Encryption|Data Exposure)/i);
      const category = categoryMatch ? categoryMatch[0] : 'Security';

      // Clean description
      const description = line
        .replace(/\[(critical|high|medium|low)\]/i, '')
        .replace(/(?:SQL Injection|XSS|CSRF|Authentication|Authorization|Validation|Encryption|Data Exposure)/i, '')
        .trim();

      if (description.length > 0) {
        issues.push({
          severity,
          category,
          description,
          file: filePath,
          recommendation: `Review and fix ${category.toLowerCase()} issue`,
        });
      }
    }

    return issues;
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(rating: SecurityAuditResult['rating'], issues: SecurityIssue[]): number {
    // Base score from rating
    const ratingScores: Record<SecurityAuditResult['rating'], number> = {
      'A+': 100,
      'A': 95,
      'B+': 85,
      'B': 75,
      'C': 65,
      'D': 50,
      'F': 30,
    };

    let score = ratingScores[rating] || 50;

    // Deduct points for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 15;
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

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get files recursively
   */
  private async getFilesRecursively(dirPath: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    async function traverse(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

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
   * Generate security report
   */
  generateReport(results: SecurityAuditResult[]): string {
    const totalFiles = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalFiles;

    const criticalIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0);
    const highIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0);
    const mediumIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'medium').length, 0);
    const lowIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'low').length, 0);

    // Overall rating
    const overallRating = this.getOverallRating(averageScore);

    let report = `# Security Audit Report\n\n`;
    report += `## Overall Security Rating: ${overallRating}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Files Audited:** ${totalFiles}\n`;
    report += `- **Average Score:** ${averageScore.toFixed(1)}/100\n`;
    report += `- **Total Issues:** ${criticalIssues + highIssues + mediumIssues + lowIssues}\n`;
    report += `  - 🔴 Critical: ${criticalIssues}\n`;
    report += `  - 🟠 High: ${highIssues}\n`;
    report += `  - 🟡 Medium: ${mediumIssues}\n`;
    report += `  - 🟢 Low: ${lowIssues}\n\n`;

    if (criticalIssues > 0) {
      report += `## 🚨 Critical Issues (Immediate Action Required)\n\n`;
      for (const result of results) {
        const critical = result.issues.filter(i => i.severity === 'critical');
        if (critical.length > 0) {
          report += `### ${result.file}\n`;
          for (const issue of critical) {
            report += `- **${issue.category}:** ${issue.description}\n`;
            report += `  - *Recommendation:* ${issue.recommendation}\n`;
          }
          report += `\n`;
        }
      }
    }

    if (highIssues > 0) {
      report += `## ⚠️ High Priority Issues\n\n`;
      for (const result of results) {
        const high = result.issues.filter(i => i.severity === 'high');
        if (high.length > 0) {
          report += `### ${result.file}\n`;
          for (const issue of high) {
            report += `- **${issue.category}:** ${issue.description}\n`;
          }
          report += `\n`;
        }
      }
    }

    report += `## Recommendations\n\n`;
    report += `1. Address all critical issues immediately\n`;
    report += `2. Implement input validation and sanitization\n`;
    report += `3. Use parameterized queries to prevent SQL injection\n`;
    report += `4. Implement proper authentication and authorization\n`;
    report += `5. Enable HTTPS for all communications\n`;
    report += `6. Regular security audits and penetration testing\n`;

    return report;
  }

  /**
   * Get overall rating from average score
   */
  private getOverallRating(score: number): SecurityAuditResult['rating'] {
    if (score >= 98) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }
}
