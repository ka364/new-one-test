/**
 * Base Bio Module Class
 * 
 * Abstract base class for all Bio-Modules
 * Provides unified event handling, logging, and metrics tracking
 * Eliminates ~75 lines of boilerplate code per module
 */

import { EventEmitter } from "events";

/**
 * Event Handler Map
 */
export type EventHandlerMap = Record<string, (...args: any[]) => void | Promise<void>>;

/**
 * Module Metrics
 */
export interface ModuleMetrics {
  totalEvents: number;
  totalErrors: number;
  totalProcessed: number;
  averageProcessingTime: number;
  lastActivityTimestamp: number;
}

/**
 * Module Configuration
 */
export interface ModuleConfig {
  name: string;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
}

/**
 * Abstract Base Bio Module
 */
export abstract class BaseBioModule extends EventEmitter {
  protected readonly moduleName: string;
  protected readonly enableLogging: boolean;
  protected readonly enableMetrics: boolean;
  protected readonly logLevel: "debug" | "info" | "warn" | "error";
  
  private metrics: ModuleMetrics = {
    totalEvents: 0,
    totalErrors: 0,
    totalProcessed: 0,
    averageProcessingTime: 0,
    lastActivityTimestamp: Date.now(),
  };
  
  private processingTimes: number[] = [];

  constructor(config: ModuleConfig) {
    super();
    this.moduleName = config.name;
    this.enableLogging = config.enableLogging ?? true;
    this.enableMetrics = config.enableMetrics ?? true;
    this.logLevel = config.logLevel ?? "info";
  }

  /**
   * Initialize the module
   * Override this in child classes for custom initialization
   */
  protected async initialize(): Promise<void> {
    this.logInfo(`Initializing ${this.moduleName}...`);
  }

  /**
   * Register event handlers
   */
  protected registerEventHandlers(handlers: EventHandlerMap): void {
    for (const [eventName, handler] of Object.entries(handlers)) {
      this.on(eventName, async (...args: any[]) => {
        try {
          await handler(...args);
          this.trackMetric("event_handled", eventName);
        } catch (error) {
          this.logError(`Error handling event ${eventName}:`, error);
          this.trackMetric("event_error", eventName);
        }
      });
    }
  }

  /**
   * Emit an event with automatic logging
   */
  protected emitEvent(eventName: string, payload: any): void {
    this.logDebug(`Emitting event: ${eventName}`, payload);
    this.emit(eventName, payload);
    
    if (this.enableMetrics) {
      this.metrics.totalEvents++;
      this.metrics.lastActivityTimestamp = Date.now();
    }
  }

  /**
   * Process with automatic timing and error handling
   */
  protected async processWithTracking<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      this.logDebug(`Starting ${operation}...`);
      const result = await fn();
      
      const processingTime = Date.now() - startTime;
      this.trackProcessingTime(processingTime);
      
      this.logDebug(`Completed ${operation} in ${processingTime}ms`);
      
      if (this.enableMetrics) {
        this.metrics.totalProcessed++;
      }
      
      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logError(`Error in ${operation} after ${processingTime}ms:`, error);
      
      if (this.enableMetrics) {
        this.metrics.totalErrors++;
      }
      
      throw error;
    }
  }

  /**
   * Track processing time
   */
  private trackProcessingTime(time: number): void {
    if (!this.enableMetrics) return;
    
    this.processingTimes.push(time);
    
    // Keep only last 100 measurements
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    
    // Update average
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageProcessingTime = sum / this.processingTimes.length;
  }

  /**
   * Track a custom metric
   */
  protected trackMetric(metricName: string, value: any): void {
    if (!this.enableMetrics) return;
    
    this.logDebug(`Metric: ${metricName} = ${value}`);
    this.metrics.lastActivityTimestamp = Date.now();
  }

  /**
   * Get module metrics
   */
  public getMetrics(): ModuleMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalEvents: 0,
      totalErrors: 0,
      totalProcessed: 0,
      averageProcessingTime: 0,
      lastActivityTimestamp: Date.now(),
    };
    this.processingTimes = [];
  }

  /**
   * Logging methods
   */
  protected logDebug(message: string, ...args: any[]): void {
    if (this.enableLogging && this.logLevel === "debug") {
      console.log(`[${this.moduleName}] [DEBUG]`, message, ...args);
    }
  }

  protected logInfo(message: string, ...args: any[]): void {
    if (this.enableLogging && ["debug", "info"].includes(this.logLevel)) {
      console.log(`[${this.moduleName}] [INFO]`, message, ...args);
    }
  }

  protected logWarn(message: string, ...args: any[]): void {
    if (this.enableLogging && ["debug", "info", "warn"].includes(this.logLevel)) {
      console.warn(`[${this.moduleName}] [WARN]`, message, ...args);
    }
  }

  protected logError(message: string, ...args: any[]): void {
    if (this.enableLogging) {
      console.error(`[${this.moduleName}] [ERROR]`, message, ...args);
    }
  }

  /**
   * Get module status
   */
  public getStatus(): {
    name: string;
    healthy: boolean;
    metrics: ModuleMetrics;
  } {
    const timeSinceLastActivity = Date.now() - this.metrics.lastActivityTimestamp;
    const healthy = timeSinceLastActivity < 60000; // Active in last minute
    
    return {
      name: this.moduleName,
      healthy,
      metrics: this.getMetrics(),
    };
  }

  /**
   * Shutdown the module
   */
  public async shutdown(): Promise<void> {
    this.logInfo(`Shutting down ${this.moduleName}...`);
    this.removeAllListeners();
  }
}
