/**
 * Corvid Module - Crow Intelligence & Meta-Learning
 *
 * Inspired by: Crow's remarkable memory and problem-solving
 * Problem: Systems repeat the same errors
 * Solution: Learn from mistakes and prevent recurrence
 */

import { Event } from '../../drizzle/schema';
import { getEventBus } from '../events/eventBus';
import { createAgentInsight } from '../db';

export interface ErrorPattern {
  id: string;
  type: string;
  pattern: string;
  context: Record<string, any>;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  preventionRule?: PreventionRule;
}

export interface PreventionRule {
  id: string;
  name: string;
  description: string;
  condition: string; // JSON logic
  action: 'block' | 'warn' | 'log';
  active: boolean;
  createdFrom: string; // Error pattern ID
  successRate: number; // 0-1
  applicationsCount: number;
}

export interface LearningInsight {
  pattern: ErrorPattern;
  recommendation: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Enhanced Corvid Learning Engine
 *
 * Capabilities:
 * 1. Pattern extraction from errors
 * 2. Prevention rule generation
 * 3. Meta-learning from successes/failures
 * 4. Knowledge transfer across modules
 */
export class CorvidLearningEngine {
  private errorMemory: Map<string, ErrorPattern> = new Map();
  private preventionRules: Map<string, PreventionRule> = new Map();
  private readonly MIN_OCCURRENCES_FOR_RULE = 3;
  private readonly PATTERN_SIMILARITY_THRESHOLD = 0.8;

  constructor() {
    this.loadErrorMemory();
    this.loadPreventionRules();
    this.registerEventHandlers();
  }

  /**
   * Load error memory from database
   */
  private async loadErrorMemory(): Promise<void> {
    try {
      const { db } = await import('../db');
      const { events } = await import('../../drizzle/schema');
      const { eq, gte } = await import('drizzle-orm');

      // Load error events from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const errorEvents = await db
        .select()
        .from(events)
        .where(gte(events.createdAt, ninetyDaysAgo));

      // Extract patterns
      for (const event of errorEvents) {
        if (event.type.includes('error') || event.type.includes('failed')) {
          await this.extractPattern(event);
        }
      }

      console.log(`[Corvid] Loaded ${this.errorMemory.size} error patterns from memory`);
    } catch (error) {
      console.error('[Corvid] Error loading error memory:', error);
    }
  }

  /**
   * Load prevention rules from database
   */
  private async loadPreventionRules(): Promise<void> {
    try {
      // TODO: Load from prevention_rules table when implemented
      console.log(`[Corvid] Loaded ${this.preventionRules.size} prevention rules`);
    } catch (error) {
      console.error('[Corvid] Error loading prevention rules:', error);
    }
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    const eventBus = getEventBus();

    // Listen for all error events
    eventBus.on('*', async (event: Event) => {
      if (event.type.includes('error') || event.type.includes('failed')) {
        await this.recordError(event);
      }
    });

    console.log('[Corvid] Event handlers registered');
  }

  /**
   * Record error and learn from it
   */
  async recordError(event: Event): Promise<void> {
    try {
      // Extract pattern
      const pattern = await this.extractPattern(event);

      // Check if we should create a prevention rule
      if (pattern.occurrences >= this.MIN_OCCURRENCES_FOR_RULE && !pattern.preventionRule) {
        const rule = await this.generatePreventionRule(pattern);
        if (rule) {
          pattern.preventionRule = rule;
          this.preventionRules.set(rule.id, rule);

          // Create insight
          await createAgentInsight({
            agentType: 'corvid',
            insightType: 'prevention_rule_created',
            title: `🧠 New Prevention Rule: ${rule.name}`,
            titleAr: `🧠 قاعدة وقائية جديدة: ${rule.name}`,
            description: `Created prevention rule from ${pattern.occurrences} similar errors: ${rule.description}`,
            descriptionAr: `تم إنشاء قاعدة وقائية من ${pattern.occurrences} أخطاء مشابهة: ${rule.description}`,
            severity: 'medium',
            actionable: true,
            metadata: {
              ruleId: rule.id,
              patternId: pattern.id,
              occurrences: pattern.occurrences,
            },
          });

          console.log(`[Corvid] Created prevention rule: ${rule.name}`);
        }
      }

      // Store in memory
      this.errorMemory.set(pattern.id, pattern);

      // Emit learning event
      const eventBus = getEventBus();
      await eventBus.emit({
        type: 'corvid.learned',
        entityId: event.id,
        entityType: 'event',
        payload: {
          patternId: pattern.id,
          occurrences: pattern.occurrences,
          hasRule: !!pattern.preventionRule,
        },
      });
    } catch (error) {
      console.error('[Corvid] Error recording error:', error);
    }
  }

  /**
   * Extract pattern from error event
   */
  private async extractPattern(event: Event): Promise<ErrorPattern> {
    // Generate pattern signature
    const signature = this.generateSignature(event);

    // Check if pattern exists
    let pattern = this.errorMemory.get(signature);

    if (pattern) {
      // Update existing pattern
      pattern.occurrences++;
      pattern.lastSeen = new Date();
    } else {
      // Create new pattern
      pattern = {
        id: signature,
        type: event.type,
        pattern: this.extractPatternString(event),
        context: event.payload as Record<string, any>,
        occurrences: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        severity: this.determineSeverity(event),
      };
    }

    return pattern;
  }

  /**
   * Generate unique signature for error pattern
   */
  private generateSignature(event: Event): string {
    const parts = [
      event.type,
      event.entityType,
      JSON.stringify(this.extractKeyFeatures(event.payload as Record<string, any>)),
    ];
    return Buffer.from(parts.join('|')).toString('base64').substring(0, 32);
  }

  /**
   * Extract key features from error payload
   */
  private extractKeyFeatures(payload: Record<string, any>): Record<string, any> {
    const features: Record<string, any> = {};

    // Extract error type
    if (payload.error) {
      features.errorType =
        typeof payload.error === 'string'
          ? payload.error.split(':')[0]
          : payload.error.name || 'Unknown';
    }

    // Extract error code
    if (payload.code) {
      features.code = payload.code;
    }

    // Extract operation
    if (payload.operation) {
      features.operation = payload.operation;
    }

    // Extract entity type
    if (payload.entityType) {
      features.entityType = payload.entityType;
    }

    return features;
  }

  /**
   * Extract human-readable pattern string
   */
  private extractPatternString(event: Event): string {
    const payload = event.payload as Record<string, any>;
    const features = this.extractKeyFeatures(payload);

    const parts: string[] = [];

    if (features.errorType) {
      parts.push(`Error: ${features.errorType}`);
    }

    if (features.operation) {
      parts.push(`during ${features.operation}`);
    }

    if (features.entityType) {
      parts.push(`on ${features.entityType}`);
    }

    return parts.join(' ') || event.type;
  }

  /**
   * Determine severity from event
   */
  private determineSeverity(event: Event): ErrorPattern['severity'] {
    const payload = event.payload as Record<string, any>;

    // Check for critical keywords
    const criticalKeywords = ['crash', 'fatal', 'critical', 'security'];
    const eventStr = JSON.stringify(payload).toLowerCase();

    if (criticalKeywords.some((keyword) => eventStr.includes(keyword))) {
      return 'critical';
    }

    // Check for high severity keywords
    const highKeywords = ['failed', 'error', 'exception'];
    if (highKeywords.some((keyword) => eventStr.includes(keyword))) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Generate prevention rule from pattern
   */
  private async generatePreventionRule(pattern: ErrorPattern): Promise<PreventionRule | null> {
    try {
      // Extract condition from pattern
      const condition = this.extractCondition(pattern);
      if (!condition) return null;

      const rule: PreventionRule = {
        id: `rule_${pattern.id}`,
        name: `Prevent: ${pattern.pattern}`,
        description: `Automatically prevent errors matching pattern: ${pattern.pattern}`,
        condition,
        action: pattern.severity === 'critical' ? 'block' : 'warn',
        active: true,
        createdFrom: pattern.id,
        successRate: 0,
        applicationsCount: 0,
      };

      return rule;
    } catch (error) {
      console.error('[Corvid] Error generating prevention rule:', error);
      return null;
    }
  }

  /**
   * Extract condition from pattern
   */
  private extractCondition(pattern: ErrorPattern): string {
    const features = this.extractKeyFeatures(pattern.context);

    // Build JSON logic condition
    const conditions: any[] = [];

    if (features.errorType) {
      conditions.push({
        '==': [{ var: 'error.type' }, features.errorType],
      });
    }

    if (features.operation) {
      conditions.push({
        '==': [{ var: 'operation' }, features.operation],
      });
    }

    if (features.entityType) {
      conditions.push({
        '==': [{ var: 'entityType' }, features.entityType],
      });
    }

    if (conditions.length === 0) return '';

    return JSON.stringify({
      and: conditions,
    });
  }

  /**
   * Check operation against prevention rules
   */
  async checkOperation(operation: Record<string, any>): Promise<{
    allowed: boolean;
    violations: PreventionRule[];
    warnings: PreventionRule[];
  }> {
    const violations: PreventionRule[] = [];
    const warnings: PreventionRule[] = [];

    for (const rule of this.preventionRules.values()) {
      if (!rule.active) continue;

      const matches = await this.evaluateRule(rule, operation);

      if (matches) {
        if (rule.action === 'block') {
          violations.push(rule);
        } else if (rule.action === 'warn') {
          warnings.push(rule);
        }

        // Update rule statistics
        rule.applicationsCount++;
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Evaluate rule against operation
   */
  private async evaluateRule(
    rule: PreventionRule,
    operation: Record<string, any>
  ): Promise<boolean> {
    try {
      // Parse condition
      const condition = JSON.parse(rule.condition);

      // Simple JSON logic evaluation
      return this.evaluateJsonLogic(condition, operation);
    } catch (error) {
      console.error('[Corvid] Error evaluating rule:', error);
      return false;
    }
  }

  /**
   * Simple JSON logic evaluator
   */
  private evaluateJsonLogic(logic: any, data: any): boolean {
    if (typeof logic !== 'object') return false;

    // Handle "and" operator
    if (logic.and) {
      return logic.and.every((condition: any) => this.evaluateJsonLogic(condition, data));
    }

    // Handle "or" operator
    if (logic.or) {
      return logic.or.some((condition: any) => this.evaluateJsonLogic(condition, data));
    }

    // Handle "==" operator
    if (logic['==']) {
      const [left, right] = logic['=='];
      const leftValue = this.resolveValue(left, data);
      const rightValue = this.resolveValue(right, data);
      return leftValue === rightValue;
    }

    return false;
  }

  /**
   * Resolve value from JSON logic
   */
  private resolveValue(value: any, data: any): any {
    if (typeof value !== 'object') return value;

    // Handle "var" operator
    if (value.var) {
      const path = value.var.split('.');
      let result = data;
      for (const key of path) {
        result = result?.[key];
      }
      return result;
    }

    return value;
  }

  /**
   * Get learning insights
   */
  async getLearningInsights(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    for (const pattern of this.errorMemory.values()) {
      if (pattern.occurrences >= this.MIN_OCCURRENCES_FOR_RULE && !pattern.preventionRule) {
        insights.push({
          pattern,
          recommendation: `Create prevention rule for: ${pattern.pattern}`,
          confidence: Math.min(pattern.occurrences / 10, 1),
          impact:
            pattern.severity === 'critical'
              ? 'high'
              : pattern.severity === 'high'
                ? 'medium'
                : 'low',
        });
      }
    }

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get prevention rules statistics
   */
  getStatistics(): {
    totalPatterns: number;
    totalRules: number;
    activeRules: number;
    averageSuccessRate: number;
  } {
    const activeRules = Array.from(this.preventionRules.values()).filter((r) => r.active);
    const avgSuccessRate =
      activeRules.length > 0
        ? activeRules.reduce((sum, r) => sum + r.successRate, 0) / activeRules.length
        : 0;

    return {
      totalPatterns: this.errorMemory.size,
      totalRules: this.preventionRules.size,
      activeRules: activeRules.length,
      averageSuccessRate: avgSuccessRate,
    };
  }
}

// Export singleton instance
export const corvidEngine = new CorvidLearningEngine();
