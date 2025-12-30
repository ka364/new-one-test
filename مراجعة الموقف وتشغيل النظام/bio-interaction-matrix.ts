 * Bio-Interaction Matrix
 * 
 * Defines how the 7 bio-modules interact with each other
 * This is the "nervous system map" of HaderOS
 */

export type BioModuleName = 
  | "arachnid"   // Anomaly Detection
  | "corvid"     // Meta-Learning
  | "mycelium"   // Resource Distribution
  | "ant"        // Route Optimization
  | "tardigrade" // System Resilience
  | "chameleon"  // Adaptive Pricing
  | "cephalopod"; // Distributed Authority

export type InteractionType =
  | "trigger"    // Module A triggers Module B
  | "inform"     // Module A informs Module B
  | "request"    // Module A requests from Module B
  | "validate"   // Module A validates Module B's decision
  | "override";  // Module A overrides Module B (rare, high priority)

export interface BioInteraction {
  from: BioModuleName;
  to: BioModuleName;
  type: InteractionType;
  eventType: string;
  priority: number; // 1-10 (10 = highest)
  description: string;
  conflictResolution?: "from_wins" | "to_wins" | "escalate" | "merge";
}

/**
 * The Bio-Interaction Matrix
 * 
 * This matrix defines ALL possible interactions between modules
 * Each module MUST interact with at least 3 other modules
 */
export const BIO_INTERACTION_MATRIX: BioInteraction[] = [
  
  // ========================================
  // ARACHNID (Anomaly Detection) Interactions
  // ========================================
  {
    from: "arachnid",
    to: "tardigrade",
    type: "trigger",
    eventType: "anomaly.critical_detected",
    priority: 10,