/**
 * Event Bus System for HaderOS
 * Handles asynchronous event processing and agent coordination
 */

import { createEvent, getPendingEvents, updateEventStatus } from "../db";
import { Event, InsertEvent } from "../../drizzle/schema";

export type EventType = 
  | "transaction.created"
  | "transaction.updated"
  | "order.created"
  | "order.updated"
  | "campaign.created"
  | "campaign.performance_update"
  | "ethical.violation_detected"
  | "financial.threshold_exceeded"
  | "demand.forecast_required"
  | "system.notification";

export interface EventPayload {
  type: EventType;
  data: Record<string, any>;
  priority?: number;
  userId?: number;
}

export type EventHandler = (event: Event) => Promise<void>;

/**
 * Event Bus Class
 */
export class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeHandlers();
  }

  /**
   * Initialize default event handlers
   */
  private initializeHandlers() {
    // Handlers will be registered by agents and services
  }

  /**
   * Publish an event to the bus
   */
  async publish(payload: EventPayload): Promise<void> {
    try {
      const event: InsertEvent = {
        eventType: payload.type,
        eventName: payload.type,
        eventData: payload.data,
        priority: payload.priority || 100,
        status: "pending",
        createdBy: payload.userId,
      };

      await createEvent(event);
      console.log(`[EventBus] Published event: ${payload.type}`);

      // Trigger immediate processing if not already running
      if (!this.isProcessing) {
        this.processEvents();
      }
    } catch (error) {
      console.error(`[EventBus] Failed to publish event:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to an event type
   */
  subscribe(eventType: EventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    console.log(`[EventBus] Subscribed handler to: ${eventType}`);
  }

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Process pending events
   */
  async processEvents(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing
    }

    this.isProcessing = true;

    try {
      const pendingEvents = await getPendingEvents(20);

      for (const event of pendingEvents) {
        await this.processEvent(event);
      }
    } catch (error) {
      console.error("[EventBus] Error processing events:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: Event): Promise<void> {
    try {
      // Update status to processing
      await updateEventStatus(event.id, "processing");

      // Get handlers for this event type
      const handlers = this.handlers.get(event.eventType as EventType) || [];

      if (handlers.length === 0) {
        console.warn(`[EventBus] No handlers for event type: ${event.eventType}`);
        await updateEventStatus(event.id, "completed");
        return;
      }

      // Execute all handlers
      await Promise.all(handlers.map(handler => handler(event)));

      // Mark as completed
      await updateEventStatus(event.id, "completed");
      console.log(`[EventBus] Processed event ${event.id}: ${event.eventType}`);
    } catch (error) {
      console.error(`[EventBus] Error processing event ${event.id}:`, error);
      
      // Update retry count
      const retryCount = (event.retryCount || 0) + 1;
      
      if (retryCount >= event.maxRetries) {
        await updateEventStatus(event.id, "failed", String(error));
      } else {
        // Reset to pending for retry
        await updateEventStatus(event.id, "pending", String(error));
      }
    }
  }

  /**
   * Start automatic event processing
   */
  startAutoProcessing(intervalMs: number = 5000): void {
    if (this.processingInterval) {
      return; // Already running
    }

    this.processingInterval = setInterval(() => {
      this.processEvents();
    }, intervalMs);

    console.log(`[EventBus] Started auto-processing (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop automatic event processing
   */
  stopAutoProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("[EventBus] Stopped auto-processing");
    }
  }

  /**
   * Get event statistics
   */
  getStats(): {
    subscribedEventTypes: number;
    totalHandlers: number;
    isProcessing: boolean;
    autoProcessingEnabled: boolean;
  } {
    let totalHandlers = 0;
    this.handlers.forEach(handlers => {
      totalHandlers += handlers.length;
    });

    return {
      subscribedEventTypes: this.handlers.size,
      totalHandlers,
      isProcessing: this.isProcessing,
      autoProcessingEnabled: this.processingInterval !== null
    };
  }
}

// Singleton instance
let eventBusInstance: EventBus | null = null;

/**
 * Get the singleton Event Bus instance
 */
export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
    // Start auto-processing by default
    eventBusInstance.startAutoProcessing(10000); // Every 10 seconds
  }
  return eventBusInstance;
}

/**
 * Helper function to publish an event
 */
export async function publishEvent(payload: EventPayload): Promise<void> {
  const bus = getEventBus();
  await bus.publish(payload);
}


// Export eventBus for backward compatibility
export const eventBus = getEventBus();
