/**
 * AI Co-Pilot System Tests
 *
 * اختبارات شاملة لنظام المساعد الذكي
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HaderosAICoPilot } from '../server/ai-copilot/core/HaderosAICoPilot';
import { SystemAnalyzer } from '../server/ai-copilot/core/SystemAnalyzer';
import { AICodeGenerator } from '../server/ai-copilot/core/AICodeGenerator';
import { SecurityAuditor } from '../server/ai-copilot/core/SecurityAuditor';
import { PerformanceOptimizer } from '../server/ai-copilot/core/PerformanceOptimizer';
import { SelfHealingEngine } from '../server/ai-copilot/core/SelfHealingEngine';

describe('AI Co-Pilot System', () => {
  describe('HaderosAICoPilot', () => {
    let aiCopilot: HaderosAICoPilot;

    beforeEach(() => {
      aiCopilot = new HaderosAICoPilot();
    });

    it('should initialize successfully', () => {
      expect(aiCopilot).toBeDefined();
    });

    it('should analyze system and return health score', async () => {
      const analysis = await aiCopilot.analyzeSystem();

      expect(analysis).toBeDefined();
      expect(analysis.systemHealth).toBeGreaterThanOrEqual(0);
      expect(analysis.systemHealth).toBeLessThanOrEqual(100);
      expect(analysis.criticalIssues).toBeInstanceOf(Array);
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    it('should generate comprehensive report', async () => {
      const report = await aiCopilot.generateReport();

      expect(report).toContain('HADEROS AI Co-Pilot Report');
      expect(report).toContain('System Health');
      expect(report).toContain('Critical Issues');
      expect(report).toContain('Recommendations');
    });

    it('should calculate system health correctly', async () => {
      const analysis = await aiCopilot.analyzeSystem();

      if (analysis.systemHealth >= 90) {
        expect(analysis.criticalIssues.length).toBeLessThanOrEqual(1);
      }

      if (analysis.systemHealth < 50) {
        expect(analysis.criticalIssues.length).toBeGreaterThan(5);
      }
    });

    it('should provide actionable recommendations', async () => {
      const analysis = await aiCopilot.analyzeSystem();

      for (const rec of analysis.recommendations) {
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.priority).toBeGreaterThan(0);
        expect(rec.roi).toBeGreaterThan(0);
        expect(rec.implementation).toBeDefined();
      }
    });
  });

  describe('SystemAnalyzer', () => {
    let analyzer: SystemAnalyzer;

    beforeEach(() => {
      analyzer = new SystemAnalyzer();
    });

    it('should analyze project structure', async () => {
      const analysis = await analyzer.analyzeStructure();

      expect(analysis.totalFiles).toBeGreaterThan(0);
      expect(analysis.filesByType).toBeDefined();
      expect(analysis.largestFiles).toBeInstanceOf(Array);
    });

    it('should analyze architecture', async () => {
      const analysis = await analyzer.analyzeArchitecture();

      expect(analysis.patterns).toBeInstanceOf(Array);
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });

    it('should detect large files', async () => {
      const analysis = await analyzer.analyzeStructure();

      const largeFiles = analysis.warnings.filter(
        w => w.type === 'large_file'
      );

      // Each large file should have a warning
      for (const warning of largeFiles) {
        expect(warning.message).toContain('lines');
        expect(warning.file).toBeDefined();
      }
    });
  });

  describe('AICodeGenerator', () => {
    let generator: AICodeGenerator;

    beforeEach(() => {
      generator = new AICodeGenerator();
    });

    it('should analyze code quality', async () => {
      const analysis = await generator.analyzeCodeQuality();

      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
      expect(analysis.metrics).toBeDefined();
      expect(analysis.metrics.totalLines).toBeGreaterThan(0);
    });

    it('should detect code quality issues', async () => {
      const analysis = await generator.analyzeCodeQuality();

      for (const issue of analysis.issues) {
        expect(issue.severity).toMatch(/critical|high|medium|low/);
        expect(issue.type).toBeDefined();
        expect(issue.message).toBeDefined();
        expect(issue.file).toBeDefined();
      }
    });

    it('should generate test code', async () => {
      const code = await generator.generateCode({
        type: 'test',
        name: 'userService',
        description: 'should create new user',
      });

      expect(code).toContain('describe');
      expect(code).toContain('it(');
      expect(code).toContain('expect');
      expect(code).toContain('userService');
    });

    it('should generate React component', async () => {
      const code = await generator.generateCode({
        type: 'component',
        name: 'UserProfile',
        description: 'User profile component',
      });

      expect(code).toContain('export function UserProfile');
      expect(code).toContain('interface UserProfileProps');
      expect(code).toContain('useState');
    });

    it('should generate API endpoint', async () => {
      const code = await generator.generateCode({
        type: 'api',
        name: 'user',
        description: 'User management API',
      });

      expect(code).toContain('publicProcedure');
      expect(code).toContain('.query(');
      expect(code).toContain('.mutation(');
      expect(code).toContain('z.object');
    });
  });

  describe('SecurityAuditor', () => {
    let auditor: SecurityAuditor;

    beforeEach(() => {
      auditor = new SecurityAuditor();
    });

    it('should perform security audit', async () => {
      const analysis = await auditor.auditSecurity();

      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
      expect(analysis.vulnerabilities).toBeInstanceOf(Array);
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    it('should categorize vulnerabilities by severity', async () => {
      const analysis = await auditor.auditSecurity();

      const criticalVulns = analysis.vulnerabilities.filter(
        v => v.severity === 'critical'
      );
      const highVulns = analysis.vulnerabilities.filter(
        v => v.severity === 'high'
      );

      // Critical vulnerabilities should have fixes
      for (const vuln of criticalVulns) {
        expect(vuln.fix).toBeDefined();
        expect(vuln.fix.length).toBeGreaterThan(0);
      }

      // High vulnerabilities should have CWE references
      for (const vuln of highVulns) {
        expect(vuln.category).toBeDefined();
      }
    });

    it('should provide security recommendations', async () => {
      const analysis = await auditor.auditSecurity();

      for (const rec of analysis.recommendations) {
        expect(rec.priority).toBeGreaterThan(0);
        expect(rec.title).toBeDefined();
        expect(rec.implementation).toBeDefined();
      }
    });
  });

  describe('PerformanceOptimizer', () => {
    let optimizer: PerformanceOptimizer;

    beforeEach(() => {
      optimizer = new PerformanceOptimizer();
    });

    it('should analyze performance', async () => {
      const analysis = await optimizer.analyzePerformance();

      expect(analysis.averageResponseTime).toBeGreaterThan(0);
      expect(analysis.bottlenecks).toBeInstanceOf(Array);
      expect(analysis.metrics).toBeDefined();
    });

    it('should detect N+1 query problems', async () => {
      const analysis = await optimizer.analyzePerformance();

      const nPlusOneIssues = analysis.bottlenecks.filter(
        b => b.type === 'n+1'
      );

      for (const issue of nPlusOneIssues) {
        expect(issue.severity).toMatch(/critical|high/);
        expect(issue.fix).toContain('JOIN');
      }
    });

    it('should provide performance recommendations', async () => {
      const analysis = await optimizer.analyzePerformance();

      for (const rec of analysis.recommendations) {
        expect(rec.expectedImprovement).toBeDefined();
        expect(rec.implementation).toBeDefined();
      }
    });

    it('should estimate response time based on issues', async () => {
      const analysis = await optimizer.analyzePerformance();

      // More critical issues = higher response time
      const criticalCount = analysis.bottlenecks.filter(
        b => b.severity === 'critical'
      ).length;

      if (criticalCount > 5) {
        expect(analysis.averageResponseTime).toBeGreaterThan(300);
      }
    });
  });

  describe('SelfHealingEngine', () => {
    let engine: SelfHealingEngine;

    beforeEach(() => {
      engine = new SelfHealingEngine();
    });

    it('should identify auto-fixable issues', async () => {
      const issue = {
        id: 'test-1',
        severity: 'medium' as const,
        category: 'type_safety',
        title: 'Test issue',
        description: 'Test description',
        affectedFiles: ['test.ts'],
        suggestedFix: 'Fix it',
        autoFixable: true,
        estimatedImpact: 50,
      };

      const fix = await engine.fixIssue(issue);
      expect(fix.issueId).toBe('test-1');
      expect(fix.success).toBeDefined();
    });

    it('should skip non-auto-fixable issues', async () => {
      const issue = {
        id: 'test-2',
        severity: 'high' as const,
        category: 'architecture',
        title: 'Architecture issue',
        description: 'Needs manual review',
        affectedFiles: [],
        suggestedFix: 'Manual fix required',
        autoFixable: false,
        estimatedImpact: 80,
      };

      const fix = await engine.fixIssue(issue);
      expect(fix.success).toBe(false);
      expect(fix.error).toContain('not auto-fixable');
    });

    it('should handle security issues carefully', async () => {
      const issue = {
        id: 'sec-1',
        severity: 'critical' as const,
        category: 'security',
        title: 'Security vulnerability',
        description: 'SQL Injection',
        affectedFiles: ['api.ts'],
        suggestedFix: 'Use parameterized queries',
        autoFixable: true,
        estimatedImpact: 100,
      };

      const fix = await engine.fixIssue(issue);

      // Security issues should require manual review
      expect(fix.action).toBe('security_warning');
      expect(fix.changes).toContain('Manual review required');
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end', async () => {
      const aiCopilot = new HaderosAICoPilot();

      // Full analysis
      const analysis = await aiCopilot.analyzeSystem();

      // Should have all components
      expect(analysis.systemHealth).toBeDefined();
      expect(analysis.criticalIssues).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.autoFixesApplied).toBeDefined();
      expect(analysis.learningInsights).toBeDefined();

      // Should prioritize recommendations by ROI
      if (analysis.recommendations.length > 1) {
        const first = analysis.recommendations[0];
        const last = analysis.recommendations[analysis.recommendations.length - 1];

        const firstScore = first.priority * 0.6 + first.roi * 0.4;
        const lastScore = last.priority * 0.6 + last.roi * 0.4;

        expect(firstScore).toBeGreaterThanOrEqual(lastScore);
      }
    });

    it('should generate useful report', async () => {
      const aiCopilot = new HaderosAICoPilot();
      const report = await aiCopilot.generateReport();

      // Report should be markdown formatted
      expect(report).toContain('#');
      expect(report).toContain('##');

      // Should include key metrics
      expect(report).toMatch(/\d+%/); // Percentage
      expect(report).toMatch(/\d+\./); // Numbered list
    });
  });
});
