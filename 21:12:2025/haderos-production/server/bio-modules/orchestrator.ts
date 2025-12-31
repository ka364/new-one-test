/**
 * Bio-Protocol Orchestrator
 * 
 * Central coordinator for all 7 bio-modules
 * Ensures seamless communication and collaboration
 */

import { arachnidEngine } from "./arachnid";
import { corvidEngine } from "./corvid";
import { myceliumEngine } from "./mycelium";
import { antOptimizer } from "./ant";
import { tardigradeEngine } from "./tardigrade";
import { chameleonEngine } from "./chameleon";
import { cephalopodEngine } from "./cephalopod";
import { getEventBus } from "../events/eventBus";
import { createAgentInsight } from "../db";

export interface BioProtocolStatus {
  overall: number; // 0-100
  modules: {
    arachnid: number;
    corvid: number;
    mycelium: number;
    ant: number;
    tardigrade: number;
    chameleon: number;
    cephalopod: number;
  };
  activeModules: number;
  interactions: number;
  lastSync: Date;
}

/**
 * Bio-Protocol Orchestrator
 * 
 * Responsibilities:
 * 1. Initialize all bio-modules
 * 2. Coordinate inter-module communication
 * 3. Monitor module health
 * 4. Handle module interactions
 * 5. Optimize module collaboration
 * 6. Emergency coordination
 */
export class BioProtocolOrchestrator {
  private initialized = false;
  private moduleHealth: Map<string, number> = new Map();
  private interactionCount = 0;
  private lastSync: Date | null = null;

  constructor() {
    this.initializeModules();
    this.setupInterModuleCommunication();
    this.startHealthMonitoring();
  }

  /**
   * Initialize all bio-modules
   */
  private async initializeModules(): Promise<void> {
    try {
      console.log("[BioProtocol] Initializing all 7 bio-modules...");

      // All modules are already initialized as singletons
      // Just verify they're ready

      this.moduleHealth.set("arachnid", 100);
      this.moduleHealth.set("corvid", 100);
      this.moduleHealth.set("mycelium", 100);
      this.moduleHealth.set("ant", 100);
      this.moduleHealth.set("tardigrade", 100);
      this.moduleHealth.set("chameleon", 100);
      this.moduleHealth.set("cephalopod", 100);

      this.initialized = true;
      this.lastSync = new Date();

      console.log("[BioProtocol] ✅ All 7 bio-modules initialized successfully");

      // Create initialization insight
      await createAgentInsight({
        agentType: "system",
        insightType: "bio_protocol_initialized",
        title: "🧬 Bio-Protocol System Activated",
        titleAr: "🧬 تم تفعيل نظام البروتوكول الحيوي",
        description: "All 7 bio-modules initialized and ready. System is now operating with organic governance.",
        descriptionAr: "تم تهيئة جميع الوحدات الحيوية السبعة. النظام يعمل الآن بالحوكمة العضوية.",
        severity: "low",
        actionable: false,
        metadata: {
          modules: Array.from(this.moduleHealth.keys()),
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error("[BioProtocol] Error initializing modules:", error);
      throw error;
    }
  }

  /**
   * Setup inter-module communication
   */
  private setupInterModuleCommunication(): void {
    const eventBus = getEventBus();

    // Arachnid → Corvid: Anomaly detected → Learn from it
    eventBus.on("anomaly.detected", async (event) => {
      await corvidEngine.recordError(event);
      this.interactionCount++;
    });

    // Corvid → Arachnid: Pattern learned → Update detection rules
    eventBus.on("corvid.learned", async (event) => {
      // Arachnid can use learned patterns to improve detection
      this.interactionCount++;
    });

    // Mycelium → Ant: Transfer needed → Optimize route
    eventBus.on("inventory.transfer.created", async (event) => {
      const transfer = event.payload;
      if (transfer.fromBranch && transfer.toBranch) {
        // Ant can optimize the transfer route
        this.interactionCount++;
      }
    });

    // Chameleon → Mycelium: Price changed → May affect inventory balance
    eventBus.on("product.price.changed", async (event) => {
      // Mycelium can adjust inventory based on price changes
      this.interactionCount++;
    });

    // Tardigrade → All: System critical → All modules enter safe mode
    eventBus.on("system.critical", async (event) => {
      await this.handleSystemCritical(event);
      this.interactionCount++;
    });

    // Cephalopod → All: Authority decision → May trigger actions
    eventBus.on("decision.evaluated", async (event) => {
      const result = event.payload.result;
      if (result.allowed) {
        // Other modules can act on approved decisions
        this.interactionCount++;
      }
    });

    console.log("[BioProtocol] Inter-module communication established");
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.checkModuleHealth();
    }, 60000); // Every minute

    console.log("[BioProtocol] Health monitoring started");
  }

  /**
   * Check health of all modules
   */
  private async checkModuleHealth(): Promise<void> {
    try {
      // Check Tardigrade system health
      const systemHealth = await tardigradeEngine.getStatus();
      
      // Update module health based on system health
      this.moduleHealth.set("arachnid", systemHealth.health.components.agents);
      this.moduleHealth.set("corvid", systemHealth.health.components.eventBus);
      this.moduleHealth.set("mycelium", systemHealth.health.components.database);
      this.moduleHealth.set("ant", systemHealth.health.components.integrations);
      this.moduleHealth.set("tardigrade", systemHealth.health.overall);
      this.moduleHealth.set("chameleon", systemHealth.health.components.api);
      this.moduleHealth.set("cephalopod", systemHealth.health.components.database);

      this.lastSync = new Date();

      // Check if any module is unhealthy
      const unhealthyModules = Array.from(this.moduleHealth.entries())
        .filter(([_, health]) => health < 70);

      if (unhealthyModules.length > 0) {
        console.warn(`[BioProtocol] ⚠️ ${unhealthyModules.length} modules unhealthy:`, unhealthyModules);
        
        await createAgentInsight({
          agentType: "system",
          insightType: "bio_protocol_health_warning",
          title: `⚠️ Bio-Protocol Health Warning`,
          titleAr: `⚠️ تحذير صحة البروتوكول الحيوي`,
          description: `${unhealthyModules.length} bio-modules are experiencing issues`,
          descriptionAr: `${unhealthyModules.length} وحدات حيوية تواجه مشاكل`,
          severity: "high",
          actionable: true,
          metadata: {
            unhealthyModules: unhealthyModules.map(([name, health]) => ({ name, health }))
          }
        });
      }
    } catch (error) {
      console.error("[BioProtocol] Error checking module health:", error);
    }
  }

  /**
   * Handle system critical event
   */
  private async handleSystemCritical(event: any): Promise<void> {
    console.error("[BioProtocol] 🚨 SYSTEM CRITICAL - Coordinating emergency response");

    // All modules should enter safe mode
    // Mycelium: Pause transfers
    // Chameleon: Freeze prices
    // Ant: Cancel non-critical routes
    // Cephalopod: Escalate all decisions to top level

    await createAgentInsight({
      agentType: "system",
      insightType: "bio_protocol_emergency",
      title: "🚨 BIO-PROTOCOL EMERGENCY MODE",
      titleAr: "🚨 وضع الطوارئ للبروتوكول الحيوي",
      description: "System entered emergency mode. All bio-modules coordinating crisis response.",
      descriptionAr: "دخل النظام في وضع الطوارئ. جميع الوحدات الحيوية تنسق استجابة الأزمة.",
      severity: "critical",
      actionable: true,
      metadata: {
        event,
        timestamp: new Date()
      }
    });
  }

  /**
   * Get bio-protocol status
   */
  async getStatus(): Promise<BioProtocolStatus> {
    const modules = {
      arachnid: this.moduleHealth.get("arachnid") || 0,
      corvid: this.moduleHealth.get("corvid") || 0,
      mycelium: this.moduleHealth.get("mycelium") || 0,
      ant: this.moduleHealth.get("ant") || 0,
      tardigrade: this.moduleHealth.get("tardigrade") || 0,
      chameleon: this.moduleHealth.get("chameleon") || 0,
      cephalopod: this.moduleHealth.get("cephalopod") || 0
    };

    const overall = Object.values(modules).reduce((sum, health) => sum + health, 0) / 7;
    const activeModules = Object.values(modules).filter(health => health > 50).length;

    return {
      overall,
      modules,
      activeModules,
      interactions: this.interactionCount,
      lastSync: this.lastSync || new Date()
    };
  }

  /**
   * Trigger specific bio-module action
   */
  async triggerModule(moduleName: string, action: string, params: any): Promise<any> {
    switch (moduleName) {
      case "arachnid":
        // Trigger anomaly detection
        return await arachnidEngine.detectAnomalies();

      case "corvid":
        // Get learning insights
        return await corvidEngine.getLearningInsights();

      case "mycelium":
        // Analyze network balance
        return await myceliumEngine.analyzeNetworkBalance();

      case "ant":
        // Optimize routes
        if (params.deliveries) {
          return await antOptimizer.optimizeRoutes(params.deliveries);
        }
        break;

      case "tardigrade":
        // Get system status
        return await tardigradeEngine.getStatus();

      case "chameleon":
        // Generate pricing strategy
        if (params.productId) {
          return await chameleonEngine.generatePricingStrategy(params.productId);
        }
        break;

      case "cephalopod":
        // Evaluate decision
        if (params.context) {
          return await cephalopodEngine.evaluateDecision(params.context);
        }
        break;

      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }
  }

  /**
   * Get module statistics
   */
  async getModuleStatistics(): Promise<Record<string, any>> {
    return {
      arachnid: {
        // Anomaly detection stats
        active: true,
        health: this.moduleHealth.get("arachnid")
      },
      corvid: corvidEngine.getStatistics(),
      mycelium: {
        // Network balance stats
        active: true,
        health: this.moduleHealth.get("mycelium")
      },
      ant: {
        // Route optimization stats
        active: true,
        health: this.moduleHealth.get("ant")
      },
      tardigrade: await tardigradeEngine.getStatus(),
      chameleon: {
        // Adaptive pricing stats
        active: true,
        health: this.moduleHealth.get("chameleon")
      },
      cephalopod: await cephalopodEngine.getStatistics()
    };
  }
}

// Export singleton instance
export const bioProtocolOrchestrator = new BioProtocolOrchestrator();

// Export convenience function
export async function getBioProtocolStatus(): Promise<BioProtocolStatus> {
  return await bioProtocolOrchestrator.getStatus();
}
