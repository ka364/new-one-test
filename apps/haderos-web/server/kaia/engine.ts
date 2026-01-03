
import { llmService, LLMResponse } from '../ai/llm.service';

/**
 * KAIA (Knowledge-Augmented Islamic AI) Ethical Governance Engine
 * Core engine for applying Sharia-compliant and ethical rules to business decisions
 */


import { InferSelectModel } from 'drizzle-orm';
import { ethicalRules, transactions } from '../../drizzle/schema';
import { getActiveEthicalRules } from '../db';
import { aiConfig } from '../ai/config';

export type EthicalRule = InferSelectModel<typeof ethicalRules>;
export type Transaction = InferSelectModel<typeof transactions>;


export interface KAIADecision {
  approved: boolean;
  decision: 'approved' | 'rejected' | 'flagged' | 'review_required';
  appliedRules: Array<{
    ruleId: number;
    ruleName: string;
    result: 'pass' | 'fail' | 'warning';
    reason: string;
    reasonAr?: string;
  }>;
  overallReason: string;
  overallReasonAr?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresHumanReview: boolean;
  aiAnalysis?: string; // New field for LLM insights
}

export interface EvaluationContext {
  transaction?: Partial<Transaction>;
  metadata?: Record<string, any>;
  userId?: number;
  unstructuredData?: string; // New field for text analysis
}

/**
 * Main KAIA Engine Class
 */
export class KAIAEngine {
  private rules: EthicalRule[] = [];
  private lastRulesUpdate: Date | null = null;
  private readonly RULES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadRules();
  }

  /**
   * Load active ethical rules from database
   */
  private async loadRules() {
    try {
      this.rules = await getActiveEthicalRules();
      this.lastRulesUpdate = new Date();
      console.log(`[KAIA] Loaded ${this.rules.length} active ethical rules`);
    } catch (error) {
      console.error('[KAIA] Failed to load ethical rules:', error);
      this.rules = [];
    }
  }

  /**
   * Refresh rules if cache is stale
   */
  private async refreshRulesIfNeeded() {
    if (
      !this.lastRulesUpdate ||
      Date.now() - this.lastRulesUpdate.getTime() > this.RULES_CACHE_TTL
    ) {
      await this.loadRules();
    }
  }

  /**
   * Evaluate a transaction against all active ethical rules
   */
  async evaluateTransaction(transaction: Partial<Transaction>, unstructuredData?: string): Promise<KAIADecision> {
    await this.refreshRulesIfNeeded();

    const context: EvaluationContext = { transaction, unstructuredData };
    const appliedRules: KAIADecision['appliedRules'] = [];
    let highestSeverity: KAIADecision['severity'] = 'low';
    let requiresReview = false;

    // Apply each rule
    for (const rule of this.rules) {
      const ruleResult = this.evaluateRule(rule, context);

      if (ruleResult) {
        appliedRules.push(ruleResult);

        // Track highest severity
        if (this.compareSeverity(rule.severity, highestSeverity) > 0) {
          highestSeverity = rule.severity;
        }

        // Check if review is required
        if (rule.requiresReview && ruleResult.result !== 'pass') {
          requiresReview = true;
        }
      }
    }

    // AI Semantic Analysis (if unstructured data is present)
    let aiAnalysis = '';
    if (unstructuredData && aiConfig.openaiApiKey) {
      try {
        const aiResult = await this.analyzeEthicalCompliance(unstructuredData);
        aiAnalysis = aiResult.content;

        // If AI flags a major issue, force review
        if (aiAnalysis.toLowerCase().includes('violation') || aiAnalysis.toLowerCase().includes('haram')) {
          requiresReview = true;
          highestSeverity = 'high';
        }
      } catch (err) {
        console.error('[KAIA] AI Analysis failed:', err);
      }
    }

    // Determine overall decision
    const hasFailures = appliedRules.some((r) => r.result === 'fail');
    const hasWarnings = appliedRules.some((r) => r.result === 'warning');

    let decision: KAIADecision['decision'];
    let approved: boolean;

    if (hasFailures) {
      decision = requiresReview ? 'review_required' : 'rejected';
      approved = false;
    } else if (hasWarnings) {
      decision = 'flagged';
      approved = true; // Approved with warnings
    } else {
      decision = 'approved';
      approved = true;
    }

    // Generate overall reason
    const overallReason = this.generateOverallReason(decision, appliedRules);
    const overallReasonAr = this.generateOverallReasonAr(decision, appliedRules);

    return {
      approved,
      decision,
      appliedRules,
      overallReason,
      overallReasonAr,
      severity: highestSeverity,
      requiresHumanReview: requiresReview || decision === 'review_required',
      aiAnalysis
    };
  }

  /**
   * Perform Semantic Analysis using LLM
   */
  async analyzeEthicalCompliance(text: string): Promise<LLMResponse> {
    const systemPrompt = `
      You are KAIA (Knowledge-Augmented Islamic AI), an expert in Sharia-compliant finance and ethics.
      Analyze the following text (e.g., contract clause, product description) for ethical or Sharia violations.
      Focus on: Riba (Interest), Gharar (Uncertainty), Haram products (Alcohol, Gambling, Pork), and Unethical labor.
      
      Response Format:
      - Brief Summary (1 sentence).
      - Verdict: COMPLIANT | SUSPICIOUS | NON-COMPLIANT.
      - Reason.
      `;

    return await llmService.generateCompletion(systemPrompt, text);
  }

  /**
   * Evaluate a single rule against the context
   */
  private evaluateRule(
    rule: EthicalRule,
    context: EvaluationContext
  ): KAIADecision['appliedRules'][0] | null {
    try {
      const { conditions, action } = rule.ruleLogic;

      // Evaluate all conditions
      const conditionResults = conditions.map((condition) =>
        this.evaluateCondition(condition, context)
      );

      // All conditions must pass for the rule to apply
      const allConditionsMet = conditionResults.every((r) => r);

      if (!allConditionsMet) {
        return null; // Rule doesn't apply to this context
      }

      // Determine result based on action
      let result: 'pass' | 'fail' | 'warning';
      let reason: string;
      let reasonAr: string;

      switch (action) {
        case 'reject':
          result = 'fail';
          reason = rule.ruleDescription;
          reasonAr = rule.ruleDescriptionAr || reason;
          break;
        case 'flag':
          result = 'warning';
          reason = `Warning: ${rule.ruleDescription}`;
          reasonAr = `تحذير: ${rule.ruleDescriptionAr || rule.ruleDescription}`;
          break;
        case 'approve':
        default:
          result = 'pass';
          reason = `Complies with: ${rule.ruleName}`;
          reasonAr = `متوافق مع: ${rule.ruleNameAr || rule.ruleName}`;
          break;
      }

      return {
        ruleId: rule.id,
        ruleName: rule.ruleName,
        result,
        reason,
        reasonAr,
      };
    } catch (error) {
      console.error(`[KAIA] Error evaluating rule ${rule.id}:`, error);
      return null;
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: { field: string; operator: string; value: any },
    context: EvaluationContext
  ): boolean {
    const { field, operator, value } = condition;

    // Get the actual value from context
    const actualValue = this.getFieldValue(field, context);

    // Evaluate based on operator
    switch (operator) {
      case 'equals':
      case '==':
        return actualValue === value;
      case 'not_equals':
      case '!=':
        return actualValue !== value;
      case 'greater_than':
      case '>':
        return Number(actualValue) > Number(value);
      case 'less_than':
      case '<':
        return Number(actualValue) < Number(value);
      case 'greater_than_or_equal':
      case '>=':
        return Number(actualValue) >= Number(value);
      case 'less_than_or_equal':
      case '<=':
        return Number(actualValue) <= Number(value);
      case 'contains':
        return String(actualValue).includes(String(value));
      case 'not_contains':
        return !String(actualValue).includes(String(value));
      case 'in':
        return Array.isArray(value) && value.includes(actualValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(actualValue);
      default:
        console.warn(`[KAIA] Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Get field value from context
   */
  private getFieldValue(field: string, context: EvaluationContext): any {
    // Support nested field access with dot notation
    const parts = field.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Compare severity levels
   */
  private compareSeverity(
    severity1: 'low' | 'medium' | 'high' | 'critical',
    severity2: 'low' | 'medium' | 'high' | 'critical'
  ): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity1] - levels[severity2];
  }

  /**
   * Generate overall reason in English
   */
  private generateOverallReason(
    decision: KAIADecision['decision'],
    appliedRules: KAIADecision['appliedRules']
  ): string {
    const failures = appliedRules.filter((r) => r.result === 'fail');
    const warnings = appliedRules.filter((r) => r.result === 'warning');

    if (decision === 'rejected') {
      return `Transaction rejected due to ${failures.length} ethical rule violation(s): ${failures.map((r) => r.ruleName).join(', ')}`;
    } else if (decision === 'review_required') {
      return `Transaction requires human review due to ${failures.length} critical rule violation(s)`;
    } else if (decision === 'flagged') {
      return `Transaction approved with ${warnings.length} warning(s): ${warnings.map((r) => r.ruleName).join(', ')}`;
    } else {
      return `Transaction approved - complies with all ${appliedRules.length} applicable ethical rules`;
    }
  }

  /**
   * Generate overall reason in Arabic
   */
  private generateOverallReasonAr(
    decision: KAIADecision['decision'],
    appliedRules: KAIADecision['appliedRules']
  ): string {
    const failures = appliedRules.filter((r) => r.result === 'fail');
    const warnings = appliedRules.filter((r) => r.result === 'warning');

    if (decision === 'rejected') {
      return `تم رفض المعاملة بسبب ${failures.length} انتهاك للقواعد الأخلاقية`;
    } else if (decision === 'review_required') {
      return `تتطلب المعاملة مراجعة بشرية بسبب ${failures.length} انتهاك حرج للقواعد`;
    } else if (decision === 'flagged') {
      return `تمت الموافقة على المعاملة مع ${warnings.length} تحذير`;
    } else {
      return `تمت الموافقة على المعاملة - متوافقة مع جميع القواعد الأخلاقية المطبقة (${appliedRules.length})`;
    }
  }

  /**
   * Quick check if a transaction is Sharia-compliant
   */
  async isTransactionShariaCompliant(transaction: Partial<Transaction>, unstructuredData?: string): Promise<boolean> {
    const decision = await this.evaluateTransaction(transaction, unstructuredData);
    return (
      decision.approved &&
      !decision.appliedRules.some(
        (r) => r.result === 'fail' && r.ruleName.toLowerCase().includes('sharia')
      )
    );
  }

  /**
   * Get all loaded rules
   */
  getRules(): EthicalRule[] {
    return this.rules;
  }

  /**
   * Force reload rules from database
   */
  async reloadRules(): Promise<void> {
    await this.loadRules();
  }
}

// Singleton instance
let kaiaEngineInstance: KAIAEngine | null = null;

/**
 * Get the singleton KAIA Engine instance
 */
export function getKAIAEngine(): KAIAEngine {
  if (!kaiaEngineInstance) {
    kaiaEngineInstance = new KAIAEngine();
  }
  return kaiaEngineInstance;
}

/**
 * Helper function to evaluate a transaction
 */
export async function evaluateTransactionWithKAIA(
  transaction: Partial<Transaction>,
  unstructuredData?: string
): Promise<KAIADecision> {
  const engine = getKAIAEngine();
  return await engine.evaluateTransaction(transaction, unstructuredData);
}
