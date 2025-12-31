/**
 * Mock Handlers for Bio-Modules (Testing)
 * 
 * Refactored using Base Handler Factory
 * Reduced from ~170 lines to ~80 lines (52% reduction)
 */

import { getBioMessageRouter, BioMessage } from "./unified-messaging.js";
import { getBioDashboard } from "./bio-dashboard.js";
import { getConflictEngine } from "./conflict-resolution-protocol.js";
import type { BioModuleName } from "./bio-interaction-matrix.js";
import { registerModuleHandlers, withCondition, withTypeRouter } from "./base-handler-factory.js";
import { scoringEngine } from "./scoring-engine.js";

/**
 * Register all mock handlers for the 7 bio-modules
 */
export function registerMockHandlers(): void {
  const router = getBioMessageRouter();
  const dashboard = getBioDashboard();
  const conflictEngine = getConflictEngine();

  // Register all handlers using the factory
  registerModuleHandlers(router, [
    // 1. Arachnid (Web Intelligence - Security)
    {
      name: "arachnid",
      dashboard,
      handleMessage: async (message: BioMessage) => {
        // Detect pricing anomalies
        if (message.type === "command" && message.payload?.action === "adjust_price") {
          const priceChange = message.payload.priceChange || 0;
          
          // Use scoring engine
          const anomalyScore = scoringEngine.calculateScore("transaction_anomaly", Math.abs(priceChange * 100));
          
          if (anomalyScore > 20) {
            // Register and resolve conflict
            const conflictId = await conflictEngine.registerConflict({
              type: "priority_clash",
              moduleA: "arachnid",
              moduleB: message.source,
              decisionA: { action: "block_price_change", reason: "anomaly_detected", score: anomalyScore },
              decisionB: { action: "adjust_price", priceChange },
              priority: 9,
              context: { reason: "Large price change detected", priceChange, anomalyScore },
            });
            
            await conflictEngine.resolveConflict(conflictId);
          }
        }
        
        return { status: "processed", anomalyChecked: true };
      },
    },

    // 2. Corvid (Problem Solving - Learning)
    {
      name: "corvid",
      dashboard,
      handleMessage: withTypeRouter({
        alert: async (message: BioMessage) => {
          console.log(`[Corvid] Learning from alert: ${message.payload?.anomalyType || "unknown"}`);
          return { learned: true, alertType: message.payload?.anomalyType };
        },
        default: async () => ({ status: "processed" }),
      }),
    },

    // 3. Mycelium (Network Intelligence - Resource Distribution)
    {
      name: "mycelium",
      dashboard,
      handleMessage: withCondition(
        (msg) => msg.type === "request" && msg.payload?.resource,
        async (message: BioMessage) => {
          const resource = message.payload.resource;
          console.log(`[Mycelium] Distributing resource: ${resource}`);
          
          // Use scoring engine for distribution quality
          const distributionScore = scoringEngine.calculateScore("resource_distribution", 75);
          
          return { distributed: true, resource, score: distributionScore };
        }
      ),
    },

    // 4. Cephalopod (Adaptive Camouflage - Authority)
    {
      name: "cephalopod",
      dashboard,
      handleMessage: withCondition(
        (msg) => msg.type === "request" && msg.payload?.action === "freeze_account",
        async (message: BioMessage) => {
          console.log(`[Cephalopod] Authority decision: freeze account`);
          return { decision: "approved", action: "freeze_account" };
        }
      ),
    },

    // 5. Chameleon (Adaptive Pricing)
    {
      name: "chameleon",
      dashboard,
      handleMessage: async (message: BioMessage) => {
        if (message.type === "validate" && message.payload?.priceChange) {
          const priceChange = message.payload.priceChange;
          
          // Use scoring engine for price adjustment
          const adjustmentScore = scoringEngine.calculateScore("price_adjustment", Math.abs(priceChange * 100));
          
          console.log(`[Chameleon] Validating price change: ${priceChange}% (score: ${adjustmentScore})`);
          
          return { validated: true, priceChange, score: adjustmentScore };
        }
        
        return { status: "processed" };
      },
    },

    // 6. Tardigrade (Resilience - Survival)
    {
      name: "tardigrade",
      dashboard,
      handleMessage: withCondition(
        (msg) => msg.type === "trigger" && msg.payload?.anomaly === "critical",
        async (message: BioMessage) => {
          console.log(`[Tardigrade] Entering protective mode`);
          
          // Use scoring engine for system health
          const healthScore = scoringEngine.calculateScore("system_health", 45);
          
          return { protectiveMode: true, healthScore };
        }
      ),
    },

    // 7. Ant (Pack Coordination - Collaboration)
    {
      name: "ant",
      dashboard,
      handleMessage: withCondition(
        (msg) => msg.type === "coordinate",
        async (message: BioMessage) => {
          const task = message.payload?.task || "unknown";
          console.log(`[Ant] Coordinating task: ${task}`);
          
          // Use scoring engine for route quality
          const routeScore = scoringEngine.calculateScore("route_quality", 25);
          
          return { coordinated: true, task, routeScore };
        }
      ),
    },
  ]);

  console.log("✅ Mock handlers registered for all 7 bio-modules (using Base Handler Factory)");
}

/**
 * Unregister all mock handlers (cleanup)
 */
export function unregisterMockHandlers(): void {
  const router = getBioMessageRouter();
  
  const modules: BioModuleName[] = [
    "arachnid",
    "corvid",
    "mycelium",
    "cephalopod",
    "chameleon",
    "tardigrade",
    "ant",
  ];
  
  modules.forEach(module => {
    router.unregisterHandler(module);
  });
  
  console.log("✅ Mock handlers unregistered");
}
