/**
 * Mock Handlers for Bio-Modules (Testing)
 * 
 * Simple mock handlers to simulate module responses for testing
 * Using the handler factory to reduce code duplication
 */

import { registerModuleHandlers, withCondition, withTypeRouter } from "./base-handler-factory";
import { getConflictEngine } from "./conflict-resolution-protocol";
import type { BioMessage } from "./unified-messaging";

/**
 * Register all mock handlers for the 7 bio-modules
 */
export function registerMockHandlers(): void {
  const conflictEngine = getConflictEngine();

  // Handler configurations for all 7 bio-modules
  registerModuleHandlers([
    {
      name: "arachnid",
      handleMessage: withCondition(
        (msg) => msg.type === "command" && msg.payload?.action === "adjust_price",
        async (msg) => {
          const priceChange = msg.payload?.priceChange || 0;

          if (Math.abs(priceChange) > 20) {
            const conflictId = await conflictEngine.registerConflict({
              type: "priority_clash",
              moduleA: "arachnid",
              moduleB: msg.source || "unknown",
              decisionA: { action: "block_price_change", reason: "anomaly_detected" },
              decisionB: { action: "adjust_price", priceChange },
              priority: 9,
              context: { reason: "Large price change detected as anomaly", priceChange }
            });
            await conflictEngine.resolveConflict(conflictId);
          }
          return { anomalyDetected: Math.abs(priceChange) > 20 };
        },
        async () => ({ anomalyDetected: false })
      )
    },

    {
      name: "corvid",
      handleMessage: withCondition(
        (msg) => msg.type === "alert",
        async (msg) => {
          console.log(`[Corvid] Learning from alert: ${msg.payload?.anomalyType || "unknown"}`);
          return { learned: true, anomalyType: msg.payload?.anomalyType };
        }
      )
    },

    {
      name: "mycelium",
      handleMessage: withCondition(
        (msg) => msg.type === "request" && msg.payload?.resource,
        async (msg) => {
          console.log(`[Mycelium] Distributing resource: ${msg.payload?.resource}`);
          return { distributed: true, resource: msg.payload?.resource };
        }
      )
    },

    {
      name: "cephalopod",
      handleMessage: withCondition(
        (msg) => msg.type === "request" && msg.payload?.action === "freeze_account",
        async (msg) => {
          console.log("[Cephalopod] Authority decision: freeze account");
          return { decision: "freeze_account", approved: true };
        }
      )
    },

    {
      name: "chameleon",
      handleMessage: withCondition(
        (msg) => msg.type === "validate" && msg.payload?.priceChange,
        async (msg) => {
          console.log(`[Chameleon] Validating price change: ${msg.payload?.priceChange}%`);
          return { validated: true, priceChange: msg.payload?.priceChange };
        }
      )
    },

    {
      name: "tardigrade",
      handleMessage: withCondition(
        (msg) => msg.type === "trigger" && msg.payload?.anomaly === "critical",
        async (msg) => {
          console.log("[Tardigrade] Entering protective mode");
          return { protectiveMode: true, anomaly: msg.payload?.anomaly };
        }
      )
    },

    {
      name: "ant",
      handleMessage: withCondition(
        (msg) => msg.type === "coordinate",
        async (msg) => {
          console.log(`[Ant] Coordinating task: ${msg.payload?.task || "unknown"}`);
          return { coordinated: true, task: msg.payload?.task };
        }
      )
    }
  ]);

  console.log("✅ Mock handlers registered for all 7 bio-modules");
}

/**
 * Unregister all mock handlers (cleanup)
 */
export function unregisterMockHandlers(): void {
  const { getBioMessageRouter } = require("./unified-messaging");
  const router = getBioMessageRouter();

  const modules = ["arachnid", "corvid", "mycelium", "cephalopod", "chameleon", "tardigrade", "ant"];
  modules.forEach(module => router.unregisterHandler(module));

  console.log("✅ Mock handlers unregistered");
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
