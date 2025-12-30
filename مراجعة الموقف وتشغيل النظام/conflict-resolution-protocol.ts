 * Conflict Resolution Protocol
 * 
 * Handles conflicts when two bio-modules make contradictory decisions
 * This is the "immune system" of HaderOS
 */

import { BioModuleName, getInteraction } from "./bio-interaction-matrix";
import { createAgentInsight } from "../db";

export type ConflictType =
  | "decision_contradiction"  // Two modules make opposite decisions
  | "resource_contention"     // Two modules want the same resource
  | "priority_clash"          // Two high-priority actions conflict
  | "validation_failure";     // Module A rejects Module B's decision

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
  winner: BioModuleName | "merge" | "escalate";
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
  async registerConflict(conflict: Omit<BioConflict, "id" | "timestamp">): Promise<string> {
    const conflictId = `conflict_${Date.now()}_${++this.conflictCount}`;