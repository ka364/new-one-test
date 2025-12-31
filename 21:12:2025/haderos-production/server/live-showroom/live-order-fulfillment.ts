/**
 * Live Order Fulfillment System
 * نظام تنفيذ الطلبات المباشرة أثناء البث
 * 
 * This system handles the complete transparent order fulfillment process
 * where customers see their order being prepared, packed, and handed to
 * the shipping company - all live on camera.
 */

export interface LiveOrder {
  id: string;
  streamId: string;
  orderNumber: string;
  customerPhone: string;
  customerName: string;
  customerType: 'retail' | 'wholesale';
  products: Array<{
    id: string;
    name: string;
    nameAr: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  totalAmount: number;
  status: 'received' | 'preparing' | 'packing' | 'ready' | 'handed_to_shipping' | 'completed';
  timestamps: {
    received: Date;
    preparing?: Date;
    packing?: Date;
    ready?: Date;
    handedToShipping?: Date;
    completed?: Date;
  };
  shippingCompany?: string;
  trackingNumber?: string;
  notes?: string;
  isLiveDemo: boolean; // Show this order on camera
  cameraTimestamp?: Date; // When it was shown on camera
}

export interface OrderStage {
  stage: 'received' | 'preparing' | 'packing' | 'ready' | 'handed_to_shipping' | 'completed';
  stageAr: string;
  icon: string;
  color: string;
  description: string;
  descriptionAr: string;
}

export const ORDER_STAGES: OrderStage[] = [
  {
    stage: 'received',
    stageAr: 'تم استلام الطلب',
    icon: '📱',
    color: '#3B82F6',
    description: 'Order received from customer',
    descriptionAr: 'تم استلام الطلب من العميل',
  },
  {
    stage: 'preparing',
    stageAr: 'جاري التحضير',
    icon: '📦',
    color: '#F59E0B',
    description: 'Preparing products on camera',
    descriptionAr: 'جاري تحضير المنتجات أمام الكاميرا',
  },
  {
    stage: 'packing',
    stageAr: 'جاري التغليف',
    icon: '📦',
    color: '#8B5CF6',
    description: 'Packing order on camera',
    descriptionAr: 'جاري تغليف الطلب أمام الكاميرا',
  },
  {
    stage: 'ready',
    stageAr: 'جاهز للشحن',
    icon: '✅',
    color: '#10B981',
    description: 'Order ready for shipping',
    descriptionAr: 'الطلب جاهز للشحن',
  },
  {
    stage: 'handed_to_shipping',
    stageAr: 'تم التسليم للشحن',
    icon: '🚚',
    color: '#EF4444',
    description: 'Handed to shipping company on camera',
    descriptionAr: 'تم التسليم لشركة الشحن أمام الكاميرا',
  },
  {
    stage: 'completed',
    stageAr: 'مكتمل',
    icon: '🎉',
    color: '#059669',
    description: 'Order completed',
    descriptionAr: 'الطلب مكتمل',
  },
];

/**
 * Live Order Fulfillment Manager
 */
export class LiveOrderFulfillmentManager {
  private orders: Map<string, LiveOrder> = new Map();
  private activeOrders: Map<string, string[]> = new Map(); // streamId -> orderIds

  /**
   * Create a new live order
   */
  createOrder(
    streamId: string,
    customerPhone: string,
    customerName: string,
    customerType: 'retail' | 'wholesale',
    products: Array<{
      id: string;
      name: string;
      nameAr: string;
      quantity: number;
      price: number;
      image?: string;
    }>,
    notes?: string
  ): LiveOrder {
    const orderId = `LO${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const orderNumber = `#${orderId.slice(-8)}`;

    const totalAmount = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

    const order: LiveOrder = {
      id: orderId,
      streamId,
      orderNumber,
      customerPhone,
      customerName,
      customerType,
      products,
      totalAmount,
      status: 'received',
      timestamps: {
        received: new Date(),
      },
      notes,
      isLiveDemo: true, // By default, show on camera
    };

    this.orders.set(orderId, order);

    // Add to active orders for this stream
    const streamOrders = this.activeOrders.get(streamId) || [];
    streamOrders.push(orderId);
    this.activeOrders.set(streamId, streamOrders);

    console.log(`📱 New live order created: ${orderNumber} from ${customerName}`);
    return order;
  }

  /**
   * Update order status
   */
  updateOrderStatus(
    orderId: string,
    status: 'received' | 'preparing' | 'packing' | 'ready' | 'handed_to_shipping' | 'completed',
    metadata?: {
      shippingCompany?: string;
      trackingNumber?: string;
    }
  ): LiveOrder {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    order.status = status;
    order.timestamps[status] = new Date();

    if (metadata?.shippingCompany) {
      order.shippingCompany = metadata.shippingCompany;
    }

    if (metadata?.trackingNumber) {
      order.trackingNumber = metadata.trackingNumber;
    }

    console.log(`📦 Order ${order.orderNumber} status updated to: ${status}`);
    return order;
  }

  /**
   * Mark order as shown on camera
   */
  markAsShownOnCamera(orderId: string): void {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    order.cameraTimestamp = new Date();
    console.log(`📹 Order ${order.orderNumber} shown on camera`);
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): LiveOrder | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Get all orders for a stream
   */
  getStreamOrders(streamId: string): LiveOrder[] {
    const orderIds = this.activeOrders.get(streamId) || [];
    return orderIds
      .map(id => this.orders.get(id))
      .filter((order): order is LiveOrder => order !== undefined);
  }

  /**
   * Get orders by status for a stream
   */
  getOrdersByStatus(
    streamId: string,
    status: 'received' | 'preparing' | 'packing' | 'ready' | 'handed_to_shipping' | 'completed'
  ): LiveOrder[] {
    return this.getStreamOrders(streamId).filter(order => order.status === status);
  }

  /**
   * Get current order being shown on camera
   */
  getCurrentCameraOrder(streamId: string): LiveOrder | undefined {
    const orders = this.getStreamOrders(streamId);
    
    // Get the order that's currently being prepared or packed
    return orders.find(order => 
      (order.status === 'preparing' || order.status === 'packing') && 
      order.isLiveDemo
    );
  }

  /**
   * Get next order to process
   */
  getNextOrder(streamId: string): LiveOrder | undefined {
    const orders = this.getStreamOrders(streamId);
    return orders.find(order => order.status === 'received');
  }

  /**
   * Generate order summary for display on stream
   */
  getOrderSummaryForDisplay(orderId: string): {
    orderNumber: string;
    customerName: string;
    products: string[];
    totalAmount: number;
    status: string;
    statusAr: string;
  } {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const stage = ORDER_STAGES.find(s => s.stage === order.status);

    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      products: order.products.map(p => `${p.nameAr} x${p.quantity}`),
      totalAmount: order.totalAmount,
      status: stage?.description || order.status,
      statusAr: stage?.stageAr || order.status,
    };
  }

  /**
   * Get stream statistics
   */
  getStreamStats(streamId: string): {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  } {
    const orders = this.getStreamOrders(streamId);
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => 
      o.status !== 'completed' && o.status !== 'handed_to_shipping'
    ).length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue,
    };
  }

  /**
   * Generate WhatsApp message for customer confirmation
   */
  generateWhatsAppConfirmation(orderId: string): string {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const productsText = order.products
      .map(p => `- ${p.nameAr} x${p.quantity} = ${p.quantity * p.price} ج.م`)
      .join('\n');

    return `
🎉 شكراً لك ${order.customerName}!

تم استلام طلبك ${order.orderNumber} بنجاح

📦 المنتجات:
${productsText}

💰 الإجمالي: ${order.totalAmount} ج.م

📹 يمكنك متابعة تحضير طلبك مباشرة على البث المباشر!

${order.trackingNumber ? `🚚 رقم التتبع: ${order.trackingNumber}` : ''}

شكراً لثقتك بنا! 🙏
    `.trim();
  }

  /**
   * Generate shipping handover message
   */
  generateShippingHandoverMessage(orderId: string): string {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return `
✅ تم تسليم طلبك ${order.orderNumber} لشركة الشحن!

🚚 شركة الشحن: ${order.shippingCompany || 'قيد التحديد'}
📍 رقم التتبع: ${order.trackingNumber || 'قيد الإصدار'}

سيصلك الطلب خلال 2-3 أيام عمل إن شاء الله

شكراً لك! 🙏
    `.trim();
  }
}

// Singleton instance
let fulfillmentManager: LiveOrderFulfillmentManager | null = null;

/**
 * Get the live order fulfillment manager instance
 */
export function getLiveOrderFulfillmentManager(): LiveOrderFulfillmentManager {
  if (!fulfillmentManager) {
    fulfillmentManager = new LiveOrderFulfillmentManager();
  }
  return fulfillmentManager;
}
