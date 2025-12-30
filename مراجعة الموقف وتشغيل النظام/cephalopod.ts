/**
 * Cephalopod Module - Octopus Distributed Intelligence
 * 
 * Inspired by: Octopus's decentralized nervous system (neurons in each arm)
 * Problem: Centralized decision-making bottlenecks
 * Solution: Delegated authority with intelligent autonomy
 */

import { getEventBus } from "../events/eventBus";
import { createAgentInsight } from "../db";

export interface AuthorityLevel {
  level: number; // 1-7
  name: string;
  maxTransactionValue: number; // EGP
  maxInventoryTransfer: number; // Items
  maxDiscount: number; // Percentage
  canApproveReturns: boolean;
  canModifyPrices: boolean;
  canCreateOrders: boolean;
  requiresApproval: boolean;
}

export interface DecisionContext {
  branchId: number;
  userId: number;
  userRole: string;
  action: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface DecisionResult {
  allowed: boolean;
  authorityLevel: AuthorityLevel;
  reason: string;
  requiresApproval: boolean;
  approvalChain?: number[]; // User IDs
  confidence: number;
}

export interface DelegationRule {
  id: string;
  fromRole: string;
  toRole: string;
  condition: string; // JSON logic
  temporaryUntil?: Date;
  active: boolean;
}

/**
 * Cephalopod Distributed Intelligence Engine
 * 
 * Capabilities:
 * 1. Hierarchical authority levels
 * 2. Context-aware decision delegation
 * 3. Temporary authority escalation
 * 4. Approval chain management
 * 5. Autonomous branch operations
 * 6. Emergency override protocols
 */
export class CephalopodDistributedEngine {
  private authorityLevels: Map<number, AuthorityLevel> = new Map();
  private delegationRules: Map<string, DelegationRule> = new Map();

  constructor() {
    this.initializeAuthorityLevels();
    this.registerEventHandlers();
  }

  /**
   * Initialize authority levels (7 levels as per 7×7 structure)
   */
  private initializeAuthorityLevels(): void {
    const levels: AuthorityLevel[] = [
      {
        level: 1,
        name: "Branch Staff",
        maxTransactionValue: 500,
        maxInventoryTransfer: 10,
        maxDiscount: 5,
        canApproveReturns: false,
        canModifyPrices: false,
        canCreateOrders: true,
        requiresApproval: true
      },
      {
        level: 2,
        name: "Senior Staff",
        maxTransactionValue: 2000,
        maxInventoryTransfer: 50,
        maxDiscount: 10,
        canApproveReturns: true,
        canModifyPrices: false,
        canCreateOrders: true,
        requiresApproval: true
      },
      {
        level: 3,
        name: "Branch Supervisor",
        maxTransactionValue: 5000,
        maxInventoryTransfer: 100,
        maxDiscount: 15,
        canApproveReturns: true,
        canModifyPrices: true,
        canCreateOrders: true,
        requiresApproval: true
      },
      {
        level: 4,
        name: "Branch Manager",
        maxTransactionValue: 20000,
        maxInventoryTransfer: 500,
        maxDiscount: 25,
        canApproveReturns: true,
        canModifyPrices: true,
        canCreateOrders: true,
        requiresApproval: false
      },
      {
        level: 5,
        name: "Regional Manager",
        maxTransactionValue: 100000,
        maxInventoryTransfer: 2000,
        maxDiscount: 40,
        canApproveReturns: true,
        canModifyPrices: true,
        canCreateOrders: true,
        requiresApproval: false
      },
      {
        level: 6,
        name: "Operations Director",
        maxTransactionValue: 500000,
        maxInventoryTransfer: 10000,
        maxDiscount: 60,
        canApproveReturns: true,
        canModifyPrices: true,
        canCreateOrders: true,
        requiresApproval: false
      },
      {
        level: 7,
        name: "CEO / Founder",
        maxTransactionValue: Infinity,
        maxInventoryTransfer: Infinity,
        maxDiscount: 100,
        canApproveReturns: true,
        canModifyPrices: true,
        canCreateOrders: true,
        requiresApproval: false
      }
    ];

    levels.forEach(level => {
      this.authorityLevels.set(level.level, level);
    });

    console.log("[Cephalopod] Authority levels initialized (7 levels)");
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    const eventBus = getEventBus();

    // Listen for decision requests
    eventBus.on("decision.requested", async (event) => {
      await this.handleDecisionRequest(event);
    });

    console.log("[Cephalopod] Event handlers registered");
  }

  /**
   * Evaluate decision authority
   */
  async evaluateDecision(context: DecisionContext): Promise<DecisionResult> {
    // Get user's authority level
    const authorityLevel = await this.getUserAuthorityLevel(context.userId);

    // Check if action is allowed
    const allowed = await this.checkActionAllowed(context, authorityLevel);

    // Determine if approval is needed
    const requiresApproval = !allowed && authorityLevel.requiresApproval;

    // Generate approval chain if needed
    const approvalChain = requiresApproval 
      ? await this.generateApprovalChain(context, authorityLevel)
      : undefined;

    // Calculate confidence
    const confidence = this.calculateDecisionConfidence(context, authorityLevel, allowed);

    const result: DecisionResult = {
      allowed,
      authorityLevel,
      reason: this.generateDecisionReason(context, authorityLevel, allowed),
      requiresApproval,
      approvalChain,
      confidence
    };

    // Log decision
    console.log(`[Cephalopod] Decision: ${context.action} by ${context.userRole} - ${allowed ? "ALLOWED" : "DENIED"}`);

    // Create insight if decision is significant
    if (!allowed || context.value && context.value > authorityLevel.maxTransactionValue * 0.8) {
      await createAgentInsight({
        agentType: "cephalopod",
        insightType: "authority_decision",
        title: `🐙 Authority Decision: ${context.action}`,
        titleAr: `🐙 قرار السلطة: ${context.action}`,
        description: `${context.userRole} attempted ${context.action}. Result: ${allowed ? "Allowed" : "Requires approval"}`,
        descriptionAr: `${context.userRole} حاول ${context.action}. النتيجة: ${allowed ? "مسموح" : "يتطلب موافقة"}`,
        severity: allowed ? "low" : "medium",
        actionable: requiresApproval,
        metadata: {
          userId: context.userId,
          action: context.action,
          value: context.value,
          allowed,
          requiresApproval,
          authorityLevel: authorityLevel.level
        }
      });
    }

    // Emit event
    const eventBus = getEventBus();
    await eventBus.emit({
      type: "decision.evaluated",
      entityId: context.userId,
      entityType: "user",
      payload: {
        context,
        result
      }
    });

    return result;
  }

  /**
   * Get user's authority level
   */
  private async getUserAuthorityLevel(userId: number): Promise<AuthorityLevel> {
    // TODO: Get from database
    // For now, return default level based on user ID
    const defaultLevel = userId <= 5 ? 7 : 4; // Founders get level 7, others get level 4
    return this.authorityLevels.get(defaultLevel) || this.authorityLevels.get(1)!;
  }

  /**
   * Check if action is allowed
   */
  private async checkActionAllowed(context: DecisionContext, authority: AuthorityLevel): Promise<boolean> {
    switch (context.action) {
      case "create_order":
        return authority.canCreateOrders;

      case "approve_return":
        return authority.canApproveReturns;

      case "modify_price":
        return authority.canModifyPrices;

      case "apply_discount":
        if (!context.value) return false;
        return context.value <= authority.maxDiscount;

      case "transfer_inventory":
        if (!context.value) return false;
        return context.value <= authority.maxInventoryTransfer;

      case "process_transaction":
        if (!context.value) return false;
        return context.value <= authority.maxTransactionValue;

      default:
        return false;
    }
  }

  /**
   * Generate approval chain
   */
  private async generateApprovalChain(context: DecisionContext, currentAuthority: AuthorityLevel): Promise<number[]> {
    const chain: number[] = [];

    // Find next authority level that can approve
    for (let level = currentAuthority.level + 1; level <= 7; level++) {
      const nextAuthority = this.authorityLevels.get(level);
      if (!nextAuthority) continue;

      const canApprove = await this.checkActionAllowed(context, nextAuthority);
      if (canApprove) {
        // TODO: Get actual user ID for this authority level
        chain.push(level * 1000); // Placeholder
        break;
      }
    }

    return chain;
  }

  /**
   * Calculate decision confidence
   */
  private calculateDecisionConfidence(context: DecisionContext, authority: AuthorityLevel, allowed: boolean): number {
    let confidence = 100;

    if (!allowed) {
      confidence = 50;
    } else if (context.value) {
      // Reduce confidence as we approach authority limits
      if (context.action === "process_transaction") {
        const ratio = context.value / authority.maxTransactionValue;
        confidence = Math.max(50, 100 - (ratio * 50));
      } else if (context.action === "transfer_inventory") {
        const ratio = context.value / authority.maxInventoryTransfer;
        confidence = Math.max(50, 100 - (ratio * 50));
      } else if (context.action === "apply_discount") {
        const ratio = context.value / authority.maxDiscount;
        confidence = Math.max(50, 100 - (ratio * 50));
      }
    }

    return confidence;
  }

  /**
   * Generate decision reason
   */
  private generateDecisionReason(context: DecisionContext, authority: AuthorityLevel, allowed: boolean): string {
    if (allowed) {
      return `${authority.name} has authority to ${context.action}`;
    }

    if (context.value) {
      if (context.action === "process_transaction") {
        return `Transaction value (${context.value} EGP) exceeds ${authority.name} limit (${authority.maxTransactionValue} EGP)`;
      } else if (context.action === "transfer_inventory") {
        return `Transfer quantity (${context.value}) exceeds ${authority.name} limit (${authority.maxInventoryTransfer})`;
      } else if (context.action === "apply_discount") {
        return `Discount (${context.value}%) exceeds ${authority.name} limit (${authority.maxDiscount}%)`;
      }
    }

    return `${authority.name} does not have authority to ${context.action}`;
  }

  /**
   * Create delegation rule
   */
  async createDelegation(
    fromRole: string,
    toRole: string,
    condition: string,
    temporaryUntil?: Date
  ): Promise<DelegationRule> {
    const rule: DelegationRule = {
      id: `delegation_${Date.now()}`,
      fromRole,
      toRole,
      condition,
      temporaryUntil,
      active: true
    };

    this.delegationRules.set(rule.id, rule);

    console.log(`[Cephalopod] Created delegation: ${fromRole} → ${toRole}`);

    // Create insight
    await createAgentInsight({
      agentType: "cephalopod",
      insightType: "delegation_created",
      title: `🐙 Authority Delegated: ${fromRole} → ${toRole}`,
      titleAr: `🐙 تم تفويض السلطة: ${fromRole} ← ${toRole}`,
      description: `Authority delegated from ${fromRole} to ${toRole}${temporaryUntil ? ` until ${temporaryUntil.toISOString()}` : ""}`,
      descriptionAr: `تم تفويض السلطة من ${fromRole} إلى ${toRole}${temporaryUntil ? ` حتى ${temporaryUntil.toISOString()}` : ""}`,
      severity: "low",
      actionable: false,
      metadata: {
        fromRole,
        toRole,
        condition,
        temporaryUntil
      }
    });

    return rule;
  }

  /**
   * Handle decision request event
   */
  private async handleDecisionRequest(event: any): Promise<void> {
    const context: DecisionContext = event.payload;
    const result = await this.evaluateDecision(context);

    // Emit result
    const eventBus = getEventBus();
    await eventBus.emit({
      type: "decision.result",
      entityId: context.userId,
      entityType: "user",
      payload: result
    });
  }

  /**
   * Get authority statistics
   */
  async getStatistics(): Promise<{
    totalLevels: number;
    activeDelegations: number;
    decisionsToday: number;
    approvalRate: number;
  }> {
    // TODO: Implement actual statistics from database
    return {
      totalLevels: this.authorityLevels.size,
      activeDelegations: Array.from(this.delegationRules.values()).filter(r => r.active).length,
      decisionsToday: 0,
      approvalRate: 0
    };
  }

  /**
   * Emergency override (CEO/Founder only)
   */
  async emergencyOverride(userId: number, context: DecisionContext, reason: string): Promise<DecisionResult> {
    const authority = await this.getUserAuthorityLevel(userId);

    if (authority.level !== 7) {
      throw new Error("Emergency override requires CEO/Founder authority");
    }

    console.log(`[Cephalopod] 🚨 EMERGENCY OVERRIDE by user ${userId}: ${context.action}`);

    // Create critical insight
    await createAgentInsight({
      agentType: "cephalopod",
      insightType: "emergency_override",
      title: "🚨 EMERGENCY OVERRIDE ACTIVATED",
      titleAr: "🚨 تم تفعيل التجاوز الطارئ",
      description: `CEO/Founder activated emergency override for: ${context.action}. Reason: ${reason}`,
      descriptionAr: `قام المؤسس بتفعيل التجاوز الطارئ لـ: ${context.action}. السبب: ${reason}`,
      severity: "critical",
      actionable: false,
      metadata: {
        userId,
        context,
        reason,
        timestamp: new Date()
      }
    });

    return {
      allowed: true,
      authorityLevel: authority,
      reason: `Emergency override by CEO/Founder: ${reason}`,
      requiresApproval: false,
      confidence: 100
    };
  }
}

// Export singleton instance
export const cephalopodEngine = new CephalopodDistributedEngine();
