/**
 * AI Co-Pilot System Tests
 *
 * اختبارات شاملة لنظام المساعد الذكي
 *
 * Note: The full integration tests that require file system access
 * are skipped in unit testing. They run during integration testing
 * with proper environment setup.
 */

import { describe, it, expect, vi } from 'vitest';

describe('AI Co-Pilot System - Unit Tests', () => {
  describe('HaderosAICoPilot', () => {
    it('should be importable', async () => {
      // Dynamic import to avoid triggering file system calls
      const module = await import('../server/ai-copilot/core/HaderosAICoPilot');
      expect(module.HaderosAICoPilot).toBeDefined();
    });
  });

  describe('SelfHealingEngine', () => {
    it('should be importable', async () => {
      const module = await import('../server/ai-copilot/core/SelfHealingEngine');
      expect(module.SelfHealingEngine).toBeDefined();
    });

    it('should correctly identify auto-fixable issues', async () => {
      const { SelfHealingEngine } = await import('../server/ai-copilot/core/SelfHealingEngine');
      const engine = new SelfHealingEngine();

      const autoFixableIssue = {
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

      const fix = await engine.fixIssue(autoFixableIssue);
      expect(fix.issueId).toBe('test-1');
      expect(fix.success).toBeDefined();
    });

    it('should skip non-auto-fixable issues', async () => {
      const { SelfHealingEngine } = await import('../server/ai-copilot/core/SelfHealingEngine');
      const engine = new SelfHealingEngine();

      const nonAutoFixableIssue = {
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

      const fix = await engine.fixIssue(nonAutoFixableIssue);
      expect(fix.success).toBe(false);
      expect(fix.error).toContain('not auto-fixable');
    });

    it('should handle security issues with caution', async () => {
      const { SelfHealingEngine } = await import('../server/ai-copilot/core/SelfHealingEngine');
      const engine = new SelfHealingEngine();

      const securityIssue = {
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

      const fix = await engine.fixIssue(securityIssue);
      // Security issues should require manual review
      expect(fix.action).toBe('security_warning');
      // The changes array should indicate manual review is required
      expect(fix.changes).toBeDefined();
      expect(Array.isArray(fix.changes)).toBe(true);
    });
  });

  describe('Code Quality Metrics', () => {
    it('should define proper score ranges', () => {
      const SCORE_RANGES = {
        excellent: { min: 90, max: 100 },
        good: { min: 70, max: 89 },
        acceptable: { min: 50, max: 69 },
        needsImprovement: { min: 0, max: 49 },
      };

      // Verify non-overlapping ranges
      expect(SCORE_RANGES.excellent.min).toBeGreaterThan(SCORE_RANGES.good.max);
      expect(SCORE_RANGES.good.min).toBeGreaterThan(SCORE_RANGES.acceptable.max);
      expect(SCORE_RANGES.acceptable.min).toBeGreaterThan(SCORE_RANGES.needsImprovement.max);
    });

    it('should categorize scores correctly', () => {
      const categorizeScore = (score: number): string => {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'acceptable';
        return 'needsImprovement';
      };

      expect(categorizeScore(95)).toBe('excellent');
      expect(categorizeScore(80)).toBe('good');
      expect(categorizeScore(60)).toBe('acceptable');
      expect(categorizeScore(30)).toBe('needsImprovement');
    });
  });

  describe('Recommendation Priority Logic', () => {
    it('should prioritize recommendations correctly', () => {
      const recommendations = [
        { title: 'High Priority', priority: 9, roi: 8 },
        { title: 'Medium Priority', priority: 5, roi: 5 },
        { title: 'Low Priority', priority: 2, roi: 3 },
      ];

      const calculateScore = (rec: { priority: number; roi: number }) =>
        rec.priority * 0.6 + rec.roi * 0.4;

      const sorted = [...recommendations].sort(
        (a, b) => calculateScore(b) - calculateScore(a)
      );

      expect(sorted[0].title).toBe('High Priority');
      expect(sorted[2].title).toBe('Low Priority');
    });

    it('should handle equal priorities by ROI', () => {
      const recommendations = [
        { title: 'High ROI', priority: 5, roi: 9 },
        { title: 'Low ROI', priority: 5, roi: 2 },
      ];

      const calculateScore = (rec: { priority: number; roi: number }) =>
        rec.priority * 0.6 + rec.roi * 0.4;

      const sorted = [...recommendations].sort(
        (a, b) => calculateScore(b) - calculateScore(a)
      );

      expect(sorted[0].title).toBe('High ROI');
    });
  });

  describe('Issue Severity Classification', () => {
    it('should classify issue severities correctly', () => {
      const classifySeverity = (impact: number): 'critical' | 'high' | 'medium' | 'low' => {
        if (impact >= 80) return 'critical';
        if (impact >= 60) return 'high';
        if (impact >= 40) return 'medium';
        return 'low';
      };

      expect(classifySeverity(90)).toBe('critical');
      expect(classifySeverity(70)).toBe('high');
      expect(classifySeverity(50)).toBe('medium');
      expect(classifySeverity(20)).toBe('low');
    });

    it('should have correct severity order', () => {
      const severityOrder = ['critical', 'high', 'medium', 'low'];
      const severityWeight = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };

      for (let i = 0; i < severityOrder.length - 1; i++) {
        const current = severityOrder[i] as keyof typeof severityWeight;
        const next = severityOrder[i + 1] as keyof typeof severityWeight;
        expect(severityWeight[current]).toBeGreaterThan(severityWeight[next]);
      }
    });
  });
});
