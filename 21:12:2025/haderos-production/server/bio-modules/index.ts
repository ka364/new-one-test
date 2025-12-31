/**
 * Bio-Modules Index
 * 
 * Central export point for all 7 bio-modules and orchestrator
 */

// Individual modules
export { arachnidEngine, ArachnidAnomalyDetector } from "./arachnid";
export { corvidEngine, CorvidLearningEngine } from "./corvid";
export { myceliumEngine, MyceliumBalancingEngine } from "./mycelium";
export { antOptimizer, AntColonyOptimizer } from "./ant";
export { tardigradeEngine, TardigradeResilienceEngine } from "./tardigrade";
export { chameleonEngine, ChameleonAdaptiveEngine } from "./chameleon";
export { cephalopodEngine, CephalopodDistributedEngine } from "./cephalopod";

// Orchestrator
export { bioProtocolOrchestrator, getBioProtocolStatus, BioProtocolOrchestrator } from "./orchestrator";

// Types
export type { AnomalyDetection, AnomalyPattern } from "./arachnid";
export type { ErrorPattern, PreventionRule, LearningInsight } from "./corvid";
export type { BalanceOpportunity, NetworkBalance } from "./mycelium";
export type { DeliveryPoint, Route, OptimizationResult } from "./ant";
export type { SystemHealth, HealthIssue, BackupSnapshot } from "./tardigrade";
export type { MarketConditions, PricingStrategy, AdaptiveDecision } from "./chameleon";
export type { AuthorityLevel, DecisionContext, DecisionResult, DelegationRule } from "./cephalopod";
export type { BioProtocolStatus } from "./orchestrator";

/**
 * Initialize all bio-modules
 * Call this once at application startup
 */
export async function initializeBioProtocol(): Promise<void> {
  console.log("🧬 Initializing Bio-Protocol System...");
  
  // Modules are initialized as singletons
  // Just verify orchestrator is ready
  const status = await getBioProtocolStatus();
  
  console.log(`✅ Bio-Protocol initialized - Overall health: ${status.overall.toFixed(0)}%`);
  console.log(`   Active modules: ${status.activeModules}/7`);
}

/**
 * Get comprehensive bio-protocol report
 */
export async function getBioProtocolReport(): Promise<{
  status: any;
  statistics: any;
}> {
  const status = await getBioProtocolStatus();
  const statistics = await bioProtocolOrchestrator.getModuleStatistics();

  return {
    status,
    statistics
  };
}
