/**
 * Unified Messaging System for Bio-Modules
 *
 * All bio-modules communicate using this standardized message format
 */

import { createHash } from 'crypto';
import { BioModuleName } from './bio-interaction-matrix';

export type BioMessageType = 'command' | 'query' | 'event' | 'alert';

export type BioMessagePriority = 1 | 2 | 3 | 4 | 5;
// 1 = Critical/Alert (immediate action required)
// 2 = High/Command (should be processed soon)
// 3 = Normal/Event (regular processing)
// 4 = Low/Query (can be delayed)
// 5 = Info (informational only)

export interface BioMessage {
  id: string;
  timestamp: number;
  source: BioModuleName;
  destination: BioModuleName[];
  type: BioMessageType;
  priority: BioMessagePriority;
  payload: any;
  signature: string;
  metadata?: {
    correlationId?: string; // For tracking related messages
    replyTo?: string; // For request-response patterns
    ttl?: number; // Time to live in milliseconds
    retryCount?: number;
  };
}

export interface BioMessageResponse {
  messageId: string;
  success: boolean;
  result?: any;
  error?: string;
  processingTime: number;
  respondedBy: BioModuleName;
  timestamp: number;
}

/**
 * Generate a signature for message authenticity
 */
function generateSignature(source: BioModuleName, payload: any): string {
  const data = `${source}:${JSON.stringify(payload)}:${process.env.BIO_SECRET || 'haderos-bio-secret'}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Verify message signature
 */
export function verifySignature(message: BioMessage): boolean {
  const expectedSignature = generateSignature(message.source, message.payload);
  return message.signature === expectedSignature;
}

/**
 * Create a standardized bio-message
 */
export function createBioMessage(
  source: BioModuleName,
  destination: BioModuleName | BioModuleName[],
  type: BioMessageType,
  payload: any,
  options?: {
    priority?: BioMessagePriority;
    correlationId?: string;
    replyTo?: string;
    ttl?: number;
  }
): BioMessage {
  const destinations = Array.isArray(destination) ? destination : [destination];

  // Auto-assign priority based on type if not specified
  const priority =
    options?.priority ||
    (type === 'alert'
      ? 1
      : type === 'command'
        ? 2
        : type === 'event'
          ? 3
          : type === 'query'
            ? 4
            : 5);

  const message: BioMessage = {
    id: `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    source,
    destination: destinations,
    type,
    priority,
    payload: JSON.parse(JSON.stringify(payload)), // Deep clone to avoid mutations
    signature: '', // Will be set below
    metadata: {
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
      ttl: options?.ttl || 60000, // Default 60 seconds
      retryCount: 0,
    },
  };

  // Generate signature
  message.signature = generateSignature(source, payload);

  return message;
}

/**
 * Create a response to a bio-message
 */
export function createBioResponse(
  originalMessage: BioMessage,
  respondedBy: BioModuleName,
  success: boolean,
  result?: any,
  error?: string,
  processingTime?: number
): BioMessageResponse {
  return {
    messageId: originalMessage.id,
    success,
    result,
    error,
    processingTime: processingTime || 0,
    respondedBy,
    timestamp: Date.now(),
  };
}

/**
 * Check if message has expired
 */
export function isMessageExpired(message: BioMessage): boolean {
  if (!message.metadata?.ttl) return false;
  return Date.now() - message.timestamp > message.metadata.ttl;
}

/**
 * Bio-Message Router
 * Routes messages between bio-modules
 */
export class BioMessageRouter {
  private handlers: Map<BioModuleName, (message: BioMessage) => Promise<BioMessageResponse>> =
    new Map();
  private messageHistory: BioMessage[] = [];
  private responseHistory: BioMessageResponse[] = [];
  private readonly MAX_HISTORY = 1000;

  /**
   * Register a module's message handler
   */
  registerHandler(
    module: BioModuleName,
    handler: (message: BioMessage) => Promise<BioMessageResponse>
  ): void {
    this.handlers.set(module, handler);
    console.log(`[BioMessageRouter] Registered handler for: ${module}`);
  }

  /**
   * Unregister a module's message handler
   */
  unregisterHandler(module: BioModuleName): void {
    this.handlers.delete(module);
    console.log(`[BioMessageRouter] Unregistered handler for: ${module}`);
  }

  /**
   * Send a message to destination module(s)
   */
  async send(message: BioMessage): Promise<BioMessageResponse[]> {
    // Verify signature
    if (!verifySignature(message)) {
      console.error(`[BioMessageRouter] Invalid signature from: ${message.source}`);
      throw new Error('Invalid message signature');
    }

    // Check expiration
    if (isMessageExpired(message)) {
      console.warn(`[BioMessageRouter] Message expired: ${message.id}`);
      return [];
    }

    // Store in history
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory.shift();
    }

    console.log(
      `[BioMessageRouter] Routing ${message.type} from ${message.source} to ${message.destination.join(', ')}`
    );

    // Send to all destinations
    const responses: BioMessageResponse[] = [];

    for (const dest of message.destination) {
      const handler = this.handlers.get(dest);

      if (!handler) {
        console.warn(`[BioMessageRouter] No handler for destination: ${dest}`);
        responses.push({
          messageId: message.id,
          success: false,
          error: `No handler registered for ${dest}`,
          processingTime: 0,
          respondedBy: dest,
          timestamp: Date.now(),
        });
        continue;
      }

      try {
        const startTime = Date.now();
        const response = await handler(message);
        response.processingTime = Date.now() - startTime;

        responses.push(response);
        this.responseHistory.push(response);

        if (this.responseHistory.length > this.MAX_HISTORY) {
          this.responseHistory.shift();
        }
      } catch (error) {
        console.error(`[BioMessageRouter] Error handling message for ${dest}:`, error);
        responses.push({
          messageId: message.id,
          success: false,
          error: String(error),
          processingTime: Date.now() - Date.now(),
          respondedBy: dest,
          timestamp: Date.now(),
        });
      }
    }

    return responses;
  }

  /**
   * Broadcast a message to all registered modules
   */
  async broadcast(
    source: BioModuleName,
    type: BioMessageType,
    payload: any
  ): Promise<BioMessageResponse[]> {
    const allModules = Array.from(this.handlers.keys()).filter((m) => m !== source);
    const message = createBioMessage(source, allModules, type, payload);
    return this.send(message);
  }

  /**
   * Get message statistics
   */
  getStats() {
    const recentMessages = this.messageHistory.slice(-100);
    const recentResponses = this.responseHistory.slice(-100);

    const messagesByType = recentMessages.reduce(
      (acc, msg) => {
        acc[msg.type] = (acc[msg.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const messagesByPriority = recentMessages.reduce(
      (acc, msg) => {
        acc[msg.priority] = (acc[msg.priority] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    const avgProcessingTime =
      recentResponses.length > 0
        ? recentResponses.reduce((sum, r) => sum + r.processingTime, 0) / recentResponses.length
        : 0;

    const successRate =
      recentResponses.length > 0
        ? recentResponses.filter((r) => r.success).length / recentResponses.length
        : 0;

    return {
      totalMessages: this.messageHistory.length,
      totalResponses: this.responseHistory.length,
      registeredModules: this.handlers.size,
      messagesByType,
      messagesByPriority,
      avgProcessingTime: Math.round(avgProcessingTime),
      successRate: Math.round(successRate * 100),
    };
  }

  /**
   * Get recent messages
   */
  getRecentMessages(limit: number = 50): BioMessage[] {
    return this.messageHistory.slice(-limit);
  }

  /**
   * Get recent responses
   */
  getRecentResponses(limit: number = 50): BioMessageResponse[] {
    return this.responseHistory.slice(-limit);
  }

  /**
   * Get messages between two modules
   */
  getMessagesBetween(
    source: BioModuleName,
    destination: BioModuleName,
    limit: number = 50
  ): BioMessage[] {
    return this.messageHistory
      .filter((msg) => msg.source === source && msg.destination.includes(destination))
      .slice(-limit);
  }
}

// Singleton instance
let routerInstance: BioMessageRouter | null = null;

/**
 * Get the singleton Bio-Message Router
 */
export function getBioMessageRouter(): BioMessageRouter {
  if (!routerInstance) {
    routerInstance = new BioMessageRouter();
  }
  return routerInstance;
}

/**
 * Helper: Send a bio-message
 */
export async function sendBioMessage(
  source: BioModuleName,
  destination: BioModuleName | BioModuleName[],
  type: BioMessageType,
  payload: any,
  options?: Parameters<typeof createBioMessage>[4]
): Promise<BioMessageResponse[]> {
  const router = getBioMessageRouter();
  const message = createBioMessage(source, destination, type, payload, options);
  return router.send(message);
}
