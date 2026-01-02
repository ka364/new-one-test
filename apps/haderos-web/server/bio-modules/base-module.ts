/**
 * Base Bio Module Class
 *
 * Abstract base class for all bio-modules
 * Provides common functionality:
 * - Event handling
 * - Logging
 * - Metrics tracking
 */

import { getEventBus } from '../events/eventBus';
import { getBioDashboard } from './bio-dashboard';
import type { BioModuleName } from './bio-interaction-matrix';

export interface EventHandlerMap {
  [eventName: string]: (event: any) => Promise<void>;
}

/**
 * Abstract base class for all bio-modules
 *
 * Usage:
 *   export class MyModule extends BaseBioModule {
 *     constructor() {
 *       super("my_module");
 *       this.registerEventHandlers({
 *         "event.one": this.handleEventOne,
 *         "event.two": this.handleEventTwo
 *       });
 *     }
 *
 *     private async handleEventOne(event: any) { ... }
 *   }
 */
export abstract class BaseBioModule {
  protected moduleName: BioModuleName;
  protected eventBus = getEventBus();
  protected dashboard = getBioDashboard();
  protected registeredHandlers: string[] = [];

  constructor(moduleName: BioModuleName) {
    this.moduleName = moduleName;
  }

  /**
   * Register event handlers
   *
   * Maps event names to handler methods
   */
  protected registerEventHandlers(handlers: EventHandlerMap): void {
    for (const [eventName, handler] of Object.entries(handlers)) {
      this.eventBus.on(eventName, handler.bind(this));
      this.registeredHandlers.push(eventName);
    }

    console.log(
      `[${this.moduleName}] ✅ Registered ${this.registeredHandlers.length} event handlers`
    );
  }

  /**
   * Emit an event
   */
  protected emitEvent(eventName: string, payload: any): void {
    this.eventBus.emit(eventName, {
      source: this.moduleName,
      timestamp: new Date(),
      payload,
    });
  }

  /**
   * Log activity
   */
  protected logActivity(message: string, metadata?: Record<string, any>): void {
    console.log(`[${this.moduleName}] ${message}`, metadata ? JSON.stringify(metadata) : '');
  }

  /**
   * Log error
   */
  protected logError(message: string, error: Error, metadata?: Record<string, any>): void {
    console.error(
      `[${this.moduleName}] ❌ ${message}`,
      error.message,
      metadata ? JSON.stringify(metadata) : ''
    );
  }

  /**
   * Track metrics
   */
  protected trackMetric(metricName: string, value: number, metadata?: Record<string, any>): void {
    this.dashboard.trackMetric?.(metricName, value, {
      module: this.moduleName,
      ...metadata,
    });
  }

  /**
   * Get module info
   */
  public getModuleInfo() {
    return {
      name: this.moduleName,
      registeredHandlers: this.registeredHandlers.length,
      handlers: this.registeredHandlers,
    };
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log(`[${this.moduleName}] Cleaning up...`);
    // Override in subclasses if needed
  }
}
