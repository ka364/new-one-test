/**
 * Bio-Module Handler Factory
 *
 * Factory for creating unified handlers for all 7 bio-modules
 * يقلل التكرار بـ 200+ سطر في mock-handlers.ts
 */

import { BioMessage, getBioMessageRouter } from './unified-messaging';
import { getBioDashboard } from './bio-dashboard';
import type { BioModuleName } from './bio-interaction-matrix';

export interface ModuleHandlerConfig {
  name: BioModuleName;
  handleMessage: (msg: BioMessage) => Promise<any>;
  shouldTrackInteraction?: boolean;
}

/**
 * Create a unified handler for a bio-module
 *
 * Handles:
 * - Activity tracking
 * - Interaction metrics
 * - Performance monitoring
 * - Error handling
 * - Response formatting
 */
export function createModuleHandler(config: ModuleHandlerConfig) {
  const shouldTrack = config.shouldTrackInteraction !== false;

  return async (message: BioMessage) => {
    const startTime = Date.now();
    const dashboard = getBioDashboard();

    try {
      // Track activity
      dashboard.trackModuleActivity(config.name);

      // Handle the message with module-specific logic
      const result = await config.handleMessage(message);

      const processingTime = Date.now() - startTime;

      // Track interaction metrics
      if (shouldTrack) {
        dashboard.trackInteraction(
          message.from || 'system',
          config.name,
          message.type,
          JSON.stringify(message.payload || {}).length,
          processingTime
        );
      }

      return {
        status: 'processed',
        module: config.name,
        processingTime,
        ...result,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      console.error(`[${config.name}] Error processing message:`, error);

      if (shouldTrack) {
        dashboard.trackInteraction(
          message.from || 'system',
          config.name,
          message.type,
          JSON.stringify(message.payload || {}).length,
          processingTime
        );
      }

      return {
        status: 'error',
        module: config.name,
        processingTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}

/**
 * Batch register multiple module handlers
 *
 * Usage:
 *   registerModuleHandlers([
 *     { name: "arachnid", handleMessage: arachnidHandler },
 *     { name: "corvid", handleMessage: corvidHandler },
 *     ...
 *   ]);
 */
export function registerModuleHandlers(configs: ModuleHandlerConfig[]): void {
  const router = getBioMessageRouter();

  for (const config of configs) {
    const handler = createModuleHandler(config);
    router.registerHandler(config.name, handler);
  }

  console.log(`[BioModuleFactory] ✅ Registered ${configs.length} bio-module handlers`);
}

/**
 * Create a handler wrapper that adds conditional logic
 *
 * Usage:
 *   withCondition(
 *     (msg) => msg.type === "command",
 *     async (msg) => { ... handle command ... },
 *     async (msg) => { ... fallback handler ... }
 *   )
 */
export function withCondition(
  condition: (msg: BioMessage) => boolean,
  onTrue: (msg: BioMessage) => Promise<any>,
  onFalse?: (msg: BioMessage) => Promise<any>
) {
  return async (message: BioMessage) => {
    if (condition(message)) {
      return await onTrue(message);
    } else if (onFalse) {
      return await onFalse(message);
    }
    return { handled: false };
  };
}

/**
 * Create a handler that routes based on message type
 *
 * Usage:
 *   withTypeRouter({
 *     "command": async (msg) => { ... },
 *     "alert": async (msg) => { ... },
 *     "request": async (msg) => { ... }
 *   })
 */
export function withTypeRouter(handlers: Record<string, (msg: BioMessage) => Promise<any>>) {
  return async (message: BioMessage) => {
    const handler = handlers[message.type];

    if (!handler) {
      console.warn(`[TypeRouter] No handler found for message type: ${message.type}`);
      return { handled: false, type: message.type };
    }

    return await handler(message);
  };
}

/**
 * Create a handler that validates message before processing
 *
 * Usage:
 *   withValidation(
 *     (msg) => msg.payload?.action && msg.payload?.target,
 *     async (msg) => { ... }
 *   )
 */
export function withValidation(
  validator: (msg: BioMessage) => boolean,
  handler: (msg: BioMessage) => Promise<any>,
  onValidationFail?: (msg: BioMessage) => Promise<any>
) {
  return async (message: BioMessage) => {
    if (validator(message)) {
      return await handler(message);
    } else if (onValidationFail) {
      return await onValidationFail(message);
    }
    return { valid: false, message: 'Validation failed' };
  };
}
