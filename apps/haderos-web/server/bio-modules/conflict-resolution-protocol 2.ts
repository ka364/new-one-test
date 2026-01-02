/**
 * Conflict Resolution Protocol
 *
 * Handles conflicts when two bio-modules make contradictory decisions
 * This is the "immune system" of HaderOS
 */

import { BioModuleName, getInteraction } from './bio-interaction-matrix';
import { createAgentInsight } from '../db';

export type ConflictType =
  | 'decision_contradiction' // Two modules make opposite decisions
  | 'resource_contention' // Two modules want the same resource
  | 'priority_clash' // Two high-priority actions conflict
  | 'validation_failure'; // Module A rejects Module B's decision

export interface BioConflict {
  id: string;
  type: ConflictType;
  moduleA: BioModuleName;
  moduleB: BioModuleName;
  decisionA: any;
  decisionB: any;
  priority: number;
  timestamp: Date;
  context: Record<string, any>;
}

export interface ConflictResolution {
  conflictId: string;
  winner: BioModuleName | 'merge' | 'escalate';
  reason: string;
  finalDecision: any;
  timestamp: Date;
  resolutionTime: number; // milliseconds
}

/**
 * Conflict Resolution Engine
 */
export class ConflictResolutionEngine {
  private activeConflicts: Map<string, BioConflict> = new Map();
  private resolutionHistory: ConflictResolution[] = [];
  private conflictCount = 0;

  /**
   * Register a new conflict
   */
  async registerConflict(conflict: Omit<BioConflict, 'id' | 'timestamp'>): Promise<string> {
    const conflictId = `conflict_${Date.now()}_${++this.conflictCount}`;

    const fullConflict: BioConflict = {
      ...conflict,
      id: conflictId,
      timestamp: new Date(),
    };

    this.activeConflicts.set(conflictId, fullConflict);

    console.log(
      `[ConflictResolution] 🔴 Conflict registered: ${conflict.moduleA} vs ${conflict.moduleB}`
    );

    // Create insight for monitoring (skip if DB not available)
    try {
      await createAgentInsight({
        agentType: 'system',
        insightType: 'bio_conflict_detected',
        title: `⚠️ Bio-Module Conflict: ${conflict.moduleA} vs ${conflict.moduleB}`,
        titleAr: `⚠️ تعارض بين الوحدات: ${conflict.moduleA} و ${conflict.moduleB}`,
        description: `Conflict type: ${conflict.type}. Resolution in progress...`,
        descriptionAr: `نوع التعارض: ${conflict.type}. جاري الحل...`,
        priority: conflict.priority >= 8 ? 'high' : 'medium',
        actionable: true,
        metadata: {
          conflictId,
          moduleA: conflict.moduleA,
          moduleB: conflict.moduleB,
          type: conflict.type,
        },
      });
    } catch (error) {
      // DB not available in test environment - skip insight creation
      console.log(`[ConflictResolution] Skipping insight creation (DB not available)`);
    }

    return conflictId;
  }

  /**
   * Resolve a conflict using the interaction matrix
   */
  async resolveConflict(conflictId: string): Promise<ConflictResolution> {
    const startTime = Date.now();
    const conflict = this.activeConflicts.get(conflictId);

    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    console.log(`[ConflictResolution] 🔧 Resolving conflict: ${conflictId}`);

    // Step 1: Check interaction matrix for predefined resolution
    const interaction = getInteraction(conflict.moduleA, conflict.moduleB);

    let resolution: ConflictResolution;

    if (interaction && interaction.conflictResolution) {
      // Use predefined resolution strategy
      resolution = await this.applyResolutionStrategy(conflict, interaction.conflictResolution);
    } else {
      // Fallback: Use priority-based resolution
      resolution = await this.priorityBasedResolution(conflict);
    }

    resolution.resolutionTime = Date.now() - startTime;
    resolution.timestamp = new Date();

    // Store resolution
    this.resolutionHistory.push(resolution);
    this.activeConflicts.delete(conflictId);

    console.log(
      `[ConflictResolution] ✅ Conflict resolved in ${resolution.resolutionTime}ms: ${resolution.winner}`
    );

    // Create resolution insight (skip if DB not available)
    try {
      await createAgentInsight({
        agentType: 'system',
        insightType: 'bio_conflict_resolved',
        title: `✅ Conflict Resolved: ${resolution.winner}`,
        titleAr: `✅ تم حل التعارض: ${resolution.winner}`,
        description: `Resolved in ${resolution.resolutionTime}ms. Reason: ${resolution.reason}`,
        descriptionAr: `تم الحل في ${resolution.resolutionTime} ميلي ثانية. السبب: ${resolution.reason}`,
        priority: 'low',
        actionable: false,
        metadata: {
          conflictId,
          winner: resolution.winner,
          resolutionTime: resolution.resolutionTime,
        },
      });
    } catch (error) {
      // DB not available in test environment - skip insight creation
      console.log(`[ConflictResolution] Skipping insight creation (DB not available)`);
    }

    return resolution;
  }

  /**
   * Apply resolution strategy from interaction matrix
   */
  private async applyResolutionStrategy(
    conflict: BioConflict,
    strategy: 'from_wins' | 'to_wins' | 'escalate' | 'merge'
  ): Promise<ConflictResolution> {
    switch (strategy) {
      case 'from_wins':
        return {
          conflictId: conflict.id,
          winner: conflict.moduleA,
          reason: `${conflict.moduleA} has authority over ${conflict.moduleB} in this interaction`,
          finalDecision: conflict.decisionA,
          timestamp: new Date(),
          resolutionTime: 0,
        };

      case 'to_wins':
        return {
          conflictId: conflict.id,
          winner: conflict.moduleB,
          reason: `${conflict.moduleB} has authority over ${conflict.moduleA} in this interaction`,
          finalDecision: conflict.decisionB,
          timestamp: new Date(),
          resolutionTime: 0,
        };

      case 'merge':
        return {
          conflictId: conflict.id,
          winner: 'merge',
          reason: 'Both decisions merged into a compromise',
          finalDecision: this.mergeDecisions(conflict.decisionA, conflict.decisionB),
          timestamp: new Date(),
          resolutionTime: 0,
        };

      case 'escalate':
        return {
          conflictId: conflict.id,
          winner: 'escalate',
          reason: 'Conflict escalated to human review',
          finalDecision: {
            status: 'pending_human_review',
            optionA: conflict.decisionA,
            optionB: conflict.decisionB,
          },
          timestamp: new Date(),
          resolutionTime: 0,
        };
    }
  }

  /**
   * Priority-based resolution (fallback)
   */
  private async priorityBasedResolution(conflict: BioConflict): Promise<ConflictResolution> {
    // Module priority hierarchy (based on criticality)
    const priorityHierarchy: Record<BioModuleName, number> = {
      tardigrade: 10, // System resilience is highest priority
      arachnid: 9, // Security/anomaly detection
      cephalopod: 8, // Authority decisions
      mycelium: 7, // Resource distribution
      ant: 6, // Route optimization
      chameleon: 5, // Adaptive pricing
      corvid: 4, // Learning (lowest priority in conflicts)
    };

    const priorityA = priorityHierarchy[conflict.moduleA];
    const priorityB = priorityHierarchy[conflict.moduleB];

    if (priorityA > priorityB) {
      return {
        conflictId: conflict.id,
        winner: conflict.moduleA,
        reason: `${conflict.moduleA} has higher system priority (${priorityA} vs ${priorityB})`,
        finalDecision: conflict.decisionA,
        timestamp: new Date(),
        resolutionTime: 0,
      };
    } else if (priorityB > priorityA) {
      return {
        conflictId: conflict.id,
        winner: conflict.moduleB,
        reason: `${conflict.moduleB} has higher system priority (${priorityB} vs ${priorityA})`,
        finalDecision: conflict.decisionB,
        timestamp: new Date(),
        resolutionTime: 0,
      };
    } else {
      // Equal priority - escalate
      return {
        conflictId: conflict.id,
        winner: 'escalate',
        reason: 'Equal priority modules - requires human decision',
        finalDecision: {
          status: 'pending_human_review',
          optionA: conflict.decisionA,
          optionB: conflict.decisionB,
        },
        timestamp: new Date(),
        resolutionTime: 0,
      };
    }
  }

  /**
   * Merge two decisions into a compromise
   */
  private mergeDecisions(decisionA: any, decisionB: any): any {
    // Simple merge strategy - can be enhanced
    if (typeof decisionA === 'number' && typeof decisionB === 'number') {
      // Average numeric decisions
      return (decisionA + decisionB) / 2;
    }

    if (typeof decisionA === 'object' && typeof decisionB === 'object') {
      // Merge objects
      return { ...decisionA, ...decisionB };
    }

    // Default: prefer decisionA
    return decisionA;
  }

  /**
   * Get conflict statistics
   */
  getStats() {
    const totalResolved = this.resolutionHistory.length;
    const avgResolutionTime =
      totalResolved > 0
        ? this.resolutionHistory.reduce((sum, r) => sum + r.resolutionTime, 0) / totalResolved
        : 0;

    const resolutionTypes = this.resolutionHistory.reduce(
      (acc, r) => {
        const key =
          typeof r.winner === 'string' && (r.winner === 'merge' || r.winner === 'escalate')
            ? r.winner
            : 'module_wins';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      activeConflicts: this.activeConflicts.size,
      totalResolved,
      avgResolutionTime: Math.round(avgResolutionTime),
      resolutionTypes,
      escalationRate: (resolutionTypes['escalate'] || 0) / totalResolved || 0,
    };
  }

  /**
   * Get active conflicts
   */
  getActiveConflicts(): BioConflict[] {
    return Array.from(this.activeConflicts.values());
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(limit: number = 100): ConflictResolution[] {
    return this.resolutionHistory.slice(-limit);
  }
}

// Singleton instance
let conflictEngineInstance: ConflictResolutionEngine | null = null;

/**
 * Get the singleton Conflict Resolution Engine
 */
export function getConflictEngine(): ConflictResolutionEngine {
  if (!conflictEngineInstance) {
    conflictEngineInstance = new ConflictResolutionEngine();
  }
  return conflictEngineInstance;
}
