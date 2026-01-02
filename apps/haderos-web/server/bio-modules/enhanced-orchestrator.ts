/**
 * Enhanced Bio-Protocol Orchestrator
 *
 * Integrates all bio-modules with:
 * - Unified messaging
 * - Conflict resolution
 * - Real-time monitoring
 * - Module adapters
 */

import { BioModuleName, getModuleInteractions } from './bio-interaction-matrix';
import {
  getBioMessageRouter,
  BioMessage,
  BioMessageResponse,
  sendBioMessage,
} from './unified-messaging';
import { getConflictEngine, ConflictType } from './conflict-resolution-protocol';
import { getBioDashboard } from './bio-dashboard';
import { ModuleAdapterFactory } from './module-adapters';

export interface OrchestrationConfig {
  enableConflictResolution: boolean;
  enableDashboard: boolean;
  enableAdapters: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Enhanced Bio-Protocol Orchestrator
 */
export class EnhancedBioOrchestrator {
  private config: OrchestrationConfig;
  private router = getBioMessageRouter();
  private conflictEngine = getConflictEngine();
  private dashboard = getBioDashboard();
  private moduleHandlers: Map<BioModuleName, (data: any) => Promise<any>> = new Map();

  constructor(config: Partial<OrchestrationConfig> = {}) {
    this.config = {
      enableConflictResolution: true,
      enableDashboard: true,
      enableAdapters: true,
      logLevel: 'info',
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize the orchestrator
   */
  private initialize(): void {
    this.log('info', 'Initializing Enhanced Bio-Protocol Orchestrator...');

    // Register message handlers for all modules
    const modules: BioModuleName[] = [
      'arachnid',
      'corvid',
      'mycelium',
      'ant',
      'tardigrade',
      'chameleon',
      'cephalopod',
    ];

    modules.forEach((module) => {
      this.router.registerHandler(module, async (message: BioMessage) => {
        return this.handleModuleMessage(module, message);
      });
    });

    this.log('info', 'Enhanced Bio-Protocol Orchestrator initialized successfully');
  }

  /**
   * Handle incoming message for a module
   */
  private async handleModuleMessage(
    module: BioModuleName,
    message: BioMessage
  ): Promise<BioMessageResponse> {
    const startTime = Date.now();

    try {
      this.log('debug', `Handling message for ${module} from ${message.source}`);

      // 1. Track interaction in dashboard
      if (this.config.enableDashboard) {
        this.dashboard.trackInteraction(
          message.source,
          module,
          message.type,
          JSON.stringify(message.payload).length,
          null
        );
      }

      // 2. Check for conflicts
      if (this.config.enableConflictResolution) {
        await this.checkForConflicts(message);
      }

      // 3. Convert message to module format using adapter
      let moduleData = message.payload;
      if (this.config.enableAdapters) {
        moduleData = ModuleAdapterFactory.convertFromUnifiedFormat(module, message);
      }

      // 4. Call module handler
      const handler = this.moduleHandlers.get(module);
      let result = null;

      if (handler) {
        result = await handler(moduleData);
      } else {
        this.log('warn', `No handler registered for module: ${module}`);
      }

      // 5. Update dashboard with processing time
      const processingTime = Date.now() - startTime;
      if (this.config.enableDashboard) {
        this.dashboard.trackInteraction(
          message.source,
          module,
          message.type,
          JSON.stringify(message.payload).length,
          processingTime
        );
      }

      return {
        messageId: message.id,
        success: true,
        result,
        processingTime,
        respondedBy: module,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.log('error', `Error handling message for ${module}: ${error}`);

      return {
        messageId: message.id,
        success: false,
        error: String(error),
        processingTime: Date.now() - startTime,
        respondedBy: module,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check for conflicts between modules
   */
  private async checkForConflicts(message: BioMessage): Promise<void> {
    // Check if this message might conflict with recent messages
    const recentMessages = this.router.getRecentMessages(10);

    for (const recentMsg of recentMessages) {
      if (recentMsg.id === message.id) continue;

      // Check if messages target the same resource
      const conflictType = this.detectConflictType(message, recentMsg);

      if (conflictType) {
        this.log('warn', `Conflict detected: ${message.source} vs ${recentMsg.source}`);

        // Register conflict
        const conflictId = await this.conflictEngine.registerConflict(
          message.source,
          recentMsg.source,
          conflictType,
          {
            message1: message,
            message2: recentMsg,
          }
        );

        // Resolve conflict
        const resolution = await this.conflictEngine.resolveConflict(conflictId);

        this.log('info', `Conflict resolved: ${resolution.winner} won`);
      }
    }
  }

  /**
   * Detect conflict type between two messages
   */
  private detectConflictType(msg1: BioMessage, msg2: BioMessage): ConflictType | null {
    // Resource conflict: both messages target the same resource
    if (
      msg1.payload.productId &&
      msg2.payload.productId &&
      msg1.payload.productId === msg2.payload.productId
    ) {
      return 'resource';
    }

    // Priority conflict: both messages have high priority
    if (msg1.priority <= 2 && msg2.priority <= 2) {
      return 'priority';
    }

    // Authority conflict: both messages are commands to the same destination
    if (
      msg1.type === 'command' &&
      msg2.type === 'command' &&
      msg1.destination.some((d) => msg2.destination.includes(d))
    ) {
      return 'authority';
    }

    return null;
  }

  /**
   * Register a module handler
   */
  registerModuleHandler(module: BioModuleName, handler: (data: any) => Promise<any>): void {
    this.moduleHandlers.set(module, handler);
    this.log('info', `Registered handler for module: ${module}`);
  }

  /**
   * Send a message from a module
   */
  async sendFromModule(
    source: BioModuleName,
    destination: BioModuleName | BioModuleName[],
    data: any
  ): Promise<BioMessageResponse[]> {
    // Convert module data to unified message using adapter
    let message: BioMessage;

    if (this.config.enableAdapters) {
      message = ModuleAdapterFactory.convertToUnifiedFormat(source, data);
    } else {
      // Fallback: create simple message
      message = await sendBioMessage(source, destination, 'event', data);
      return [];
    }

    // Send through router
    return this.router.send(message);
  }

  /**
   * Get orchestrator stats
   */
  getStats() {
    return {
      router: this.router.getStats(),
      conflicts: this.conflictEngine.getStats(),
      dashboard: this.config.enableDashboard ? this.dashboard.getDashboardData() : null,
    };
  }

  /**
   * Get system health
   */
  getSystemHealth() {
    if (!this.config.enableDashboard) {
      return { overall: 100, message: 'Dashboard disabled' };
    }

    const dashboardData = this.dashboard.getDashboardData();
    return dashboardData.systemHealth;
  }

  /**
   * Log message
   */
  private log(level: OrchestrationConfig['logLevel'], message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex >= currentLevelIndex) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [BioOrchestrator] [${level.toUpperCase()}] ${message}`);
    }
  }
}

// Singleton instance
let orchestratorInstance: EnhancedBioOrchestrator | null = null;

/**
 * Get the singleton Enhanced Bio-Protocol Orchestrator
 */
export function getEnhancedOrchestrator(
  config?: Partial<OrchestrationConfig>
): EnhancedBioOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new EnhancedBioOrchestrator(config);
  }
  return orchestratorInstance;
}

/**
 * Initialize the orchestrator with default config
 */
export function initializeBioOrchestrator(
  config?: Partial<OrchestrationConfig>
): EnhancedBioOrchestrator {
  orchestratorInstance = new EnhancedBioOrchestrator(config);
  return orchestratorInstance;
}
