/**
 * Base Handler Factory
 * 
 * Factory pattern for creating unified Bio-Module message handlers
 * Eliminates ~180 lines of boilerplate code across all modules
 */

import { BioMessage } from "./unified-messaging";
import { BioDashboard } from "./bio-dashboard";

/**
 * Module Handler Configuration
 */
export interface ModuleHandlerConfig {
  name: string;
  handleMessage: (message: BioMessage) => Promise<any>;
  dashboard?: BioDashboard;
  enableTracking?: boolean;
  enableLogging?: boolean;
}

/**
 * Handler Response Format
 */
export interface HandlerResponse {
  status: "processed" | "error" | "skipped";
  module: string;
  processingTime: number;
  result?: any;
  error?: string;
}

/**
 * Create a unified module handler with automatic tracking and logging
 */
export function createModuleHandler(config: ModuleHandlerConfig) {
  const {
    name,
    handleMessage,
    dashboard,
    enableTracking = true,
    enableLogging = true,
  } = config;

  return async (message: BioMessage): Promise<HandlerResponse> => {
    const startTime = Date.now();

    try {
      // Track module activity
      if (enableTracking && dashboard) {
        dashboard.trackModuleActivity(name);
      }

      // Log incoming message
      if (enableLogging) {
        console.log(`[${name}] Processing message from ${message.source}`);
      }

      // Execute custom handler logic
      const result = await handleMessage(message);

      // Track interaction
      if (enableTracking && dashboard) {
        dashboard.trackInteraction(message.source, name, message.type, "success");
      }

      const processingTime = Date.now() - startTime;

      // Log success
      if (enableLogging) {
        console.log(`[${name}] Processed in ${processingTime}ms`);
      }

      return {
        status: "processed",
        module: name,
        processingTime,
        result,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Track failed interaction
      if (enableTracking && dashboard) {
        dashboard.trackInteraction(message.source, name, message.type, "error");
      }

      // Log error
      if (enableLogging) {
        console.error(`[${name}] Error:`, error);
      }

      return {
        status: "error",
        module: name,
        processingTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}

/**
 * Register multiple module handlers at once
 */
export function registerModuleHandlers(
  router: any,
  configs: ModuleHandlerConfig[]
) {
  for (const config of configs) {
    const handler = createModuleHandler(config);
    router.registerHandler(config.name, handler);
  }
}

/**
 * Helper: Create a conditional handler
 */
export function withCondition(
  condition: (message: BioMessage) => boolean,
  handler: (message: BioMessage) => Promise<any>
): (message: BioMessage) => Promise<any> {
  return async (message: BioMessage) => {
    if (condition(message)) {
      return await handler(message);
    }
    return { skipped: true, reason: "Condition not met" };
  };
}

/**
 * Helper: Create a type-based router
 */
export function withTypeRouter(
  routes: Record<string, (message: BioMessage) => Promise<any>>
): (message: BioMessage) => Promise<any> {
  return async (message: BioMessage) => {
    const handler = routes[message.type];
    if (handler) {
      return await handler(message);
    }
    return { skipped: true, reason: `No handler for type: ${message.type}` };
  };
}

/**
 * Helper: Add validation to a handler
 */
export function withValidation(
  validator: (message: BioMessage) => boolean | string,
  handler: (message: BioMessage) => Promise<any>
): (message: BioMessage) => Promise<any> {
  return async (message: BioMessage) => {
    const validationResult = validator(message);
    
    if (validationResult === true) {
      return await handler(message);
    }
    
    const reason = typeof validationResult === "string" 
      ? validationResult 
      : "Validation failed";
    
    throw new Error(reason);
  };
}

/**
 * Helper: Add retry logic to a handler
 */
export function withRetry(
  handler: (message: BioMessage) => Promise<any>,
  maxRetries: number = 3,
  delayMs: number = 1000
): (message: BioMessage) => Promise<any> {
  return async (message: BioMessage) => {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await handler(message);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    throw lastError || new Error("All retries failed");
  };
}

/**
 * Helper: Add timeout to a handler
 */
export function withTimeout(
  handler: (message: BioMessage) => Promise<any>,
  timeoutMs: number
): (message: BioMessage) => Promise<any> {
  return async (message: BioMessage) => {
    return Promise.race([
      handler(message),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Handler timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  };
}
