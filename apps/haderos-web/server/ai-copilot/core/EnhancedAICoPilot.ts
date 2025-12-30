/**
 * 🚀 ENHANCED AI CO-PILOT WITH DEEPSEEK
 *
 * نسخة محسّنة من AI Co-Pilot باستخدام DeepSeek
 * توفير 87%+ من التكاليف!
 */

import { HaderosAICoPilot, AIAnalysisResult } from './HaderosAICoPilot';
import { DeepSeekProvider } from '../providers/DeepSeekProvider';
import { CostOptimizer, Task } from '../utils/CostOptimizer';

export interface EnhancedAnalysisResult extends AIAnalysisResult {
  aiProvider: 'deepseek' | 'gpt-3.5' | 'gpt-4';
  cost: {
    totalCost: number;
    breakdown: {
      analysis: number;
      security: number;
      performance: number;
      codeQuality: number;
    };
  };
  savings: {
    amount: number;
    percentage: number;
    comparedTo: 'gpt-3.5' | 'gpt-4';
  };
}

export class EnhancedAICoPilot extends HaderosAICoPilot {
  private deepseek: DeepSeekProvider;
  private costOptimizer: CostOptimizer;
  private totalCost: number = 0;

  constructor(deepseekApiKey?: string) {
    super();

    const apiKey = deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DeepSeek API key is required. Set DEEPSEEK_API_KEY environment variable.');
    }

    this.deepseek = new DeepSeekProvider({ apiKey });
    this.costOptimizer = new CostOptimizer(apiKey);
  }

  /**
   * تحليل متقدم بتكلفة منخفضة
   */
  async analyzeWithDeepSeek(): Promise<EnhancedAnalysisResult> {
    console.log('🚀 Running enhanced analysis with DeepSeek...');

    // Basic analysis (free - using existing code)
    const basicAnalysis = await this.analyzeSystem();

    // Enhanced AI analysis using DeepSeek
    const aiEnhancements = await this.runAIEnhancements(basicAnalysis);

    return {
      ...basicAnalysis,
      ...aiEnhancements,
    };
  }

  /**
   * تحسينات AI باستخدام DeepSeek
   */
  private async runAIEnhancements(basicAnalysis: AIAnalysisResult): Promise<{
    aiProvider: 'deepseek';
    cost: EnhancedAnalysisResult['cost'];
    savings: EnhancedAnalysisResult['savings'];
  }> {
    const costs = {
      analysis: 0,
      security: 0,
      performance: 0,
      codeQuality: 0,
    };

    // 1. AI-powered issue prioritization
    if (basicAnalysis.criticalIssues.length > 0) {
      const prioritizationResult = await this.deepseek.execute(
        `Prioritize these issues by impact and urgency:
${basicAnalysis.criticalIssues.map((issue, i) => `${i + 1}. ${issue.title}: ${issue.description}`).join('\n')}

Provide a ranked list with reasoning.`,
        'You are an expert at issue prioritization. Be concise.'
      );
      costs.analysis += prioritizationResult.cost.totalCost;
    }

    // 2. AI-powered security insights
    const securityIssues = basicAnalysis.criticalIssues.filter(i => i.category === 'security');
    if (securityIssues.length > 0) {
      const securityResult = await this.deepseek.findSecurityVulnerabilities(
        JSON.stringify(securityIssues, null, 2)
      );
      costs.security += securityResult.cost.totalCost;
    }

    // 3. AI-powered performance suggestions
    const perfIssues = basicAnalysis.criticalIssues.filter(i => i.category === 'performance');
    if (perfIssues.length > 0) {
      const perfResult = await this.deepseek.suggestPerformanceImprovements(
        JSON.stringify(perfIssues, null, 2)
      );
      costs.performance += perfResult.cost.totalCost;
    }

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    this.totalCost += totalCost;

    // Calculate savings compared to GPT-3.5
    const gpt35Cost = totalCost / 0.14; // DeepSeek is ~86% cheaper
    const savings = gpt35Cost - totalCost;

    return {
      aiProvider: 'deepseek',
      cost: {
        totalCost,
        breakdown: costs,
      },
      savings: {
        amount: savings,
        percentage: (savings / gpt35Cost) * 100,
        comparedTo: 'gpt-3.5',
      },
    };
  }

  /**
   * مراجعة كود ذكية
   */
  async smartCodeReview(filePath: string, code: string): Promise<{
    review: string;
    issues: Array<{
      line: number;
      severity: 'error' | 'warning' | 'info';
      message: string;
      suggestion: string;
    }>;
    cost: number;
  }> {
    console.log(`🔍 DeepSeek reviewing: ${filePath}`);

    const result = await this.deepseek.analyzeCode(code);

    // Parse the response to extract issues
    const issues = this.parseCodeAnalysis(result.text);

    return {
      review: result.text,
      issues,
      cost: result.cost.totalCost,
    };
  }

  /**
   * توليد اختبارات ذكية
   */
  async smartTestGeneration(code: string, framework: string = 'vitest'): Promise<{
    tests: string;
    coverage: number;
    cost: number;
  }> {
    console.log(`🧪 DeepSeek generating ${framework} tests...`);

    const result = await this.deepseek.generateTests(code, framework);

    // Estimate coverage based on generated tests
    const coverage = this.estimateTestCoverage(result.text);

    return {
      tests: result.text,
      coverage,
      cost: result.cost.totalCost,
    };
  }

  /**
   * فحص أمان متقدم
   */
  async advancedSecurityScan(code: string): Promise<{
    vulnerabilities: Array<{
      type: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      description: string;
      cwe: string;
      fix: string;
    }>;
    score: number;
    cost: number;
  }> {
    console.log('🔒 DeepSeek performing security scan...');

    const result = await this.deepseek.findSecurityVulnerabilities(code);

    const vulnerabilities = this.parseSecurityAnalysis(result.text);
    const score = this.calculateSecurityScore(vulnerabilities);

    return {
      vulnerabilities,
      score,
      cost: result.cost.totalCost,
    };
  }

  /**
   * تحسين أداء ذكي
   */
  async intelligentPerformanceOptimization(code: string): Promise<{
    suggestions: Array<{
      type: string;
      priority: number;
      description: string;
      expectedImprovement: string;
      code?: string;
    }>;
    cost: number;
  }> {
    console.log('⚡ DeepSeek analyzing performance...');

    const result = await this.deepseek.suggestPerformanceImprovements(code);

    const suggestions = this.parsePerformanceSuggestions(result.text);

    return {
      suggestions,
      cost: result.cost.totalCost,
    };
  }

  /**
   * تقرير التكاليف
   */
  getCostReport(): {
    totalSpent: number;
    estimatedMonthly: number;
    savingsVsGPT35: number;
    savingsVsGPT4: number;
  } {
    const dailyAverage = this.totalCost;
    const monthlyEstimate = dailyAverage * 30;

    // GPT-3.5 would cost ~7x more
    const gpt35Monthly = monthlyEstimate * 7.14; // 1/0.14
    const gpt4Monthly = monthlyEstimate * 214; // 30/0.14

    return {
      totalSpent: this.totalCost,
      estimatedMonthly: monthlyEstimate,
      savingsVsGPT35: gpt35Monthly - monthlyEstimate,
      savingsVsGPT4: gpt4Monthly - monthlyEstimate,
    };
  }

  /**
   * تحليل التكاليف المتقدم
   */
  async analyzeCosts(tasks: Task[]): Promise<string> {
    return this.costOptimizer.generateCostReport(tasks);
  }

  // Helper methods

  private parseCodeAnalysis(text: string): Array<{
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }> {
    // Simple parsing - in production, this would be more sophisticated
    const issues: Array<any> = [];

    const lines = text.split('\n');
    let currentIssue: any = null;

    for (const line of lines) {
      if (line.includes('Error') || line.includes('ERROR')) {
        currentIssue = { severity: 'error', message: line, suggestion: '', line: 0 };
      } else if (line.includes('Warning') || line.includes('WARNING')) {
        currentIssue = { severity: 'warning', message: line, suggestion: '', line: 0 };
      } else if (currentIssue && line.trim()) {
        currentIssue.suggestion += line + ' ';
      }

      if (currentIssue && line.trim() === '') {
        issues.push(currentIssue);
        currentIssue = null;
      }
    }

    return issues;
  }

  private estimateTestCoverage(tests: string): number {
    // Estimate coverage based on test patterns
    const testCount = (tests.match(/it\(/g) || []).length;
    const describeCount = (tests.match(/describe\(/g) || []).length;

    // Simple heuristic: more tests = better coverage
    return Math.min(100, (testCount * 10) + (describeCount * 20));
  }

  private parseSecurityAnalysis(text: string): Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    cwe: string;
    fix: string;
  }> {
    const vulnerabilities: Array<any> = [];

    // Simple parsing - look for CWE references
    const cweMatches = text.match(/CWE-\d+/g) || [];

    cweMatches.forEach((cwe, index) => {
      vulnerabilities.push({
        type: `Vulnerability ${index + 1}`,
        severity: index === 0 ? 'critical' : 'high',
        description: `Security issue identified`,
        cwe,
        fix: 'See analysis for details',
      });
    });

    return vulnerabilities;
  }

  private calculateSecurityScore(vulnerabilities: Array<any>): number {
    let score = 100;

    vulnerabilities.forEach(vuln => {
      if (vuln.severity === 'critical') score -= 20;
      else if (vuln.severity === 'high') score -= 10;
      else if (vuln.severity === 'medium') score -= 5;
      else score -= 2;
    });

    return Math.max(0, score);
  }

  private parsePerformanceSuggestions(text: string): Array<{
    type: string;
    priority: number;
    description: string;
    expectedImprovement: string;
  }> {
    const suggestions: Array<any> = [];

    // Simple parsing
    const lines = text.split('\n');
    let priority = 100;

    for (const line of lines) {
      if (line.includes('1.') || line.includes('2.') || line.includes('3.')) {
        suggestions.push({
          type: 'optimization',
          priority: priority--,
          description: line,
          expectedImprovement: 'Significant',
        });
      }
    }

    return suggestions;
  }
}

/**
 * Singleton instance
 */
let enhancedAIInstance: EnhancedAICoPilot | null = null;

export function getEnhancedAI(apiKey?: string): EnhancedAICoPilot {
  if (!enhancedAIInstance) {
    enhancedAIInstance = new EnhancedAICoPilot(apiKey);
  }
  return enhancedAIInstance;
}
