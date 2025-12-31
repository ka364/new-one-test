/**
 * WebSocket Service for Real-time Updates
 * Handles live shopping events, chat, and notifications
 */

import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  sessionId?: string;
  data: any;
  timestamp: number;
}

export interface WebSocketClient {
  id: string;
  sessionId?: string;
  viewerId?: string;
  send: (message: WebSocketMessage) => void;
}

export class WebSocketService extends EventEmitter {
  private clients: Map<string, WebSocketClient> = new Map();
  private sessionClients: Map<string, Set<string>> = new Map();

  /**
   * Register a new client
   */
  registerClient(client: WebSocketClient): void {
    this.clients.set(client.id, client);
    
    if (client.sessionId) {
      if (!this.sessionClients.has(client.sessionId)) {
        this.sessionClients.set(client.sessionId, new Set());
      }
      this.sessionClients.get(client.sessionId)!.add(client.id);
    }

    this.emit('client-connected', client);
  }

  /**
   * Unregister a client
   */
  unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client && client.sessionId) {
      this.sessionClients.get(client.sessionId)?.delete(clientId);
    }
    this.clients.delete(clientId);
    this.emit('client-disconnected', clientId);
  }

  /**
   * Broadcast to all clients in a session
   */
  broadcastToSession(sessionId: string, message: Omit<WebSocketMessage, 'timestamp'>): void {
    const clientIds = this.sessionClients.get(sessionId);
    if (!clientIds) return;

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now(),
    };

    clientIds.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        client.send(fullMessage);
      }
    });
  }

  /**
   * Send to a specific client
   */
  sendToClient(clientId: string, message: Omit<WebSocketMessage, 'timestamp'>): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.send({
        ...message,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Broadcast viewer joined event
   */
  notifyViewerJoined(sessionId: string, viewer: any): void {
    this.broadcastToSession(sessionId, {
      type: 'viewer-joined',
      sessionId,
      data: viewer,
    });
  }

  /**
   * Broadcast viewer left event
   */
  notifyViewerLeft(sessionId: string, viewerId: string): void {
    this.broadcastToSession(sessionId, {
      type: 'viewer-left',
      sessionId,
      data: { viewerId },
    });
  }

  /**
   * Broadcast product shown event
   */
  notifyProductShown(sessionId: string, product: any): void {
    this.broadcastToSession(sessionId, {
      type: 'product-shown',
      sessionId,
      data: product,
    });
  }

  /**
   * Broadcast cart updated event
   */
  notifyCartUpdated(sessionId: string, viewerId: string, cart: any): void {
    // Send to specific viewer
    const clientIds = this.sessionClients.get(sessionId);
    if (!clientIds) return;

    clientIds.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.viewerId === viewerId) {
        this.sendToClient(clientId, {
          type: 'cart-updated',
          sessionId,
          data: cart,
        });
      }
    });
  }

  /**
   * Broadcast order created event
   */
  notifyOrderCreated(sessionId: string, order: any): void {
    this.broadcastToSession(sessionId, {
      type: 'order-created',
      sessionId,
      data: {
        orderNumber: order.orderNumber,
        total: order.total,
        customerName: order.customerName,
      },
    });
  }

  /**
   * Broadcast chat message
   */
  notifyChatMessage(sessionId: string, message: any): void {
    this.broadcastToSession(sessionId, {
      type: 'chat-message',
      sessionId,
      data: message,
    });
  }

  /**
   * Broadcast reaction
   */
  notifyReaction(sessionId: string, reaction: any): void {
    this.broadcastToSession(sessionId, {
      type: 'reaction',
      sessionId,
      data: reaction,
    });
  }

  /**
   * Broadcast stock updated event
   */
  notifyStockUpdated(sessionId: string, productId: string, stock: number): void {
    this.broadcastToSession(sessionId, {
      type: 'stock-updated',
      sessionId,
      data: { productId, stock },
    });
  }

  /**
   * Broadcast session stats update
   */
  notifyStatsUpdated(sessionId: string, stats: any): void {
    this.broadcastToSession(sessionId, {
      type: 'stats-updated',
      sessionId,
      data: stats,
    });
  }

  /**
   * Get active clients count for a session
   */
  getSessionClientsCount(sessionId: string): number {
    return this.sessionClients.get(sessionId)?.size || 0;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessionClients.keys());
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
