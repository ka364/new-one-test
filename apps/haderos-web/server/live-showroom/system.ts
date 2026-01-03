/**
 * Live Showroom System
 * نظام المعرض المباشر
 * 
 * This system enables factories to broadcast their showrooms live
 * to wholesale and retail customers, allowing them to see products
 * in real-time and place orders during the broadcast.
 */

export interface LiveStream {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  status: 'scheduled' | 'live' | 'ended' | 'paused';
  streamUrl: string; // HLS or WebRTC stream URL
  thumbnailUrl: string;
  startTime: Date;
  endTime?: Date;
  scheduledDuration: number; // minutes
  viewerCount: number;
  peakViewers: number;
  totalOrders: number;
  totalRevenue: number;
  featuredProducts: string[]; // Product IDs
  hostName: string;
  hostNameAr: string;
  language: 'ar' | 'en' | 'both';
  tags: string[];
  isRecorded: boolean;
  recordingUrl?: string;
}

export interface LiveStreamMessage {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'question' | 'order' | 'system';
  metadata?: Record<string, any>;
}

export interface LiveStreamOrder {
  id: string;
  streamId: string;
  customerId: string;
  customerName: string;
  customerType: 'retail' | 'wholesale';
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface StreamAnalytics {
  streamId: string;
  viewersByMinute: { minute: number; count: number }[];
  ordersByMinute: { minute: number; count: number; revenue: number }[];
  topProducts: { productId: string; productName: string; orders: number; revenue: number }[];
  audienceBreakdown: {
    retail: number;
    wholesale: number;
  };
  engagementRate: number; // messages per viewer
  conversionRate: number; // orders per viewer
}

/**
 * Live Showroom Manager
 */
export class LiveShowroomManager {
  private streams: Map<string, LiveStream> = new Map();
  private messages: Map<string, LiveStreamMessage[]> = new Map();
  private orders: Map<string, LiveStreamOrder[]> = new Map();
  private viewers: Map<string, Set<string>> = new Map(); // streamId -> Set of userIds

  /**
   * Create a new live stream
   */
  createStream(
    factoryId: string,
    factoryName: string,
    title: string,
    titleAr: string,
    options: {
      description?: string;
      descriptionAr?: string;
      scheduledStart?: Date;
      duration?: number;
      hostName?: string;
      hostNameAr?: string;
      featuredProducts?: string[];
      language?: 'ar' | 'en' | 'both';
      tags?: string[];
    } = {}
  ): LiveStream {
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stream: LiveStream = {
      id: streamId,
      factoryId,
      factoryName,
      title,
      titleAr,
      description: options.description || '',
      descriptionAr: options.descriptionAr || '',
      status: options.scheduledStart ? 'scheduled' : 'live',
      streamUrl: `https://stream.haderos.com/live/${streamId}`, // Placeholder
      thumbnailUrl: `https://cdn.haderos.com/thumbnails/${streamId}.jpg`,
      startTime: options.scheduledStart || new Date(),
      scheduledDuration: options.duration || 60,
      viewerCount: 0,
      peakViewers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      featuredProducts: options.featuredProducts || [],
      hostName: options.hostName || 'Factory Team',
      hostNameAr: options.hostNameAr || 'فريق المصنع',
      language: options.language || 'both',
      tags: options.tags || [],
      isRecorded: true,
    };

    this.streams.set(streamId, stream);
    this.messages.set(streamId, []);
    this.orders.set(streamId, []);
    this.viewers.set(streamId, new Set());

    console.log(`📡 Created live stream: ${title} (${streamId})`);
    return stream;
  }

  /**
   * Start a scheduled stream
   */
  startStream(streamId: string): void {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    if (stream.status !== 'scheduled') {
      throw new Error(`Stream ${streamId} is not scheduled`);
    }

    stream.status = 'live';
    stream.startTime = new Date();

    // Send system message
    this.addMessage(streamId, {
      userId: 'system',
      userName: 'HADEROS',
      message: `البث المباشر بدأ الآن! مرحباً بكم في معرض ${stream.factoryName}`,
      type: 'system',
    });

    console.log(`▶️ Stream started: ${stream.title}`);
  }

  /**
   * End a live stream
   */
  endStream(streamId: string): void {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    stream.status = 'ended';
    stream.endTime = new Date();

    // Send system message
    this.addMessage(streamId, {
      userId: 'system',
      userName: 'HADEROS',
      message: `انتهى البث المباشر. شكراً لمتابعتكم! إجمالي الطلبات: ${stream.totalOrders}`,
      type: 'system',
    });

    console.log(`⏹️ Stream ended: ${stream.title}`);
  }

  /**
   * Add a viewer to a stream
   */
  addViewer(streamId: string, userId: string): void {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const viewers = this.viewers.get(streamId);
    if (viewers) {
      viewers.add(userId);
      stream.viewerCount = viewers.size;
      stream.peakViewers = Math.max(stream.peakViewers, stream.viewerCount);
    }
  }

  /**
   * Remove a viewer from a stream
   */
  removeViewer(streamId: string, userId: string): void {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    const viewers = this.viewers.get(streamId);
    if (viewers) {
      viewers.delete(userId);
      stream.viewerCount = viewers.size;
    }
  }

  /**
   * Add a message to the stream chat
   */
  addMessage(
    streamId: string,
    message: Omit<LiveStreamMessage, 'id' | 'streamId' | 'timestamp'>
  ): LiveStreamMessage {
    const messages = this.messages.get(streamId);
    if (!messages) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const fullMessage: LiveStreamMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      streamId,
      timestamp: new Date(),
      ...message,
    };

    messages.push(fullMessage);
    return fullMessage;
  }

  /**
   * Place an order during a live stream
   */
  placeOrder(
    streamId: string,
    customerId: string,
    customerName: string,
    customerType: 'retail' | 'wholesale',
    productId: string,
    productName: string,
    quantity: number,
    price: number
  ): LiveStreamOrder {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const orders = this.orders.get(streamId);
    if (!orders) {
      throw new Error(`Orders for stream ${streamId} not found`);
    }

    const order: LiveStreamOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      streamId,
      customerId,
      customerName,
      customerType,
      productId,
      productName,
      quantity,
      price,
      totalAmount: quantity * price,
      timestamp: new Date(),
      status: 'pending',
    };

    orders.push(order);
    stream.totalOrders += 1;
    stream.totalRevenue += order.totalAmount;

    // Send system message about the order
    this.addMessage(streamId, {
      userId: 'system',
      userName: 'HADEROS',
      message: `🎉 طلب جديد: ${customerName} طلب ${quantity} من ${productName}`,
      type: 'order',
      metadata: { orderId: order.id },
    });

    console.log(`📦 New order during stream ${streamId}: ${order.id}`);
    return order;
  }

  /**
   * Get all active streams
   */
  getActiveStreams(): LiveStream[] {
    return Array.from(this.streams.values()).filter(
      stream => stream.status === 'live' || stream.status === 'scheduled'
    );
  }

  /**
   * Get stream by ID
   */
  getStream(streamId: string): LiveStream | undefined {
    return this.streams.get(streamId);
  }

  /**
   * Get messages for a stream
   */
  getMessages(streamId: string, limit?: number): LiveStreamMessage[] {
    const messages = this.messages.get(streamId) || [];
    if (limit) {
      return messages.slice(-limit);
    }
    return messages;
  }

  /**
   * Get orders for a stream
   */
  getOrders(streamId: string): LiveStreamOrder[] {
    return this.orders.get(streamId) || [];
  }

  /**
   * Get analytics for a stream
   */
  getAnalytics(streamId: string): StreamAnalytics {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const orders = this.orders.get(streamId) || [];
    const messages = this.messages.get(streamId) || [];

    // Calculate top products
    const productStats = new Map<string, { name: string; orders: number; revenue: number }>();
    for (const order of orders) {
      const existing = productStats.get(order.productId) || { name: order.productName, orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.totalAmount;
      productStats.set(order.productId, existing);
    }

    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => ({ productId, productName: stats.name, orders: stats.orders, revenue: stats.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate audience breakdown
    const retailOrders = orders.filter(o => o.customerType === 'retail').length;
    const wholesaleOrders = orders.filter(o => o.customerType === 'wholesale').length;

    // Calculate engagement and conversion
    const totalViewers = stream.peakViewers || 1;
    const engagementRate = messages.length / totalViewers;
    const conversionRate = (orders.length / totalViewers) * 100;

    return {
      streamId,
      viewersByMinute: [], // TODO: Implement time-series tracking
      ordersByMinute: [],
      topProducts,
      audienceBreakdown: {
        retail: retailOrders,
        wholesale: wholesaleOrders,
      },
      engagementRate,
      conversionRate,
    };
  }

  /**
   * Get streams by factory
   */
  getStreamsByFactory(factoryId: string): LiveStream[] {
    return Array.from(this.streams.values()).filter(
      stream => stream.factoryId === factoryId
    );
  }
}

// Singleton instance
let showroomManager: LiveShowroomManager | null = null;

/**
 * Get the live showroom manager instance
 */
export function getLiveShowroomManager(): LiveShowroomManager {
  if (!showroomManager) {
    showroomManager = new LiveShowroomManager();
  }
  return showroomManager;
}
