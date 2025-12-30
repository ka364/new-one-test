/**
 * Live Shopping Bio-Module
 * Integrates with YouTube Live & Facebook Live for real-time shopping
 * 
 * Features:
 * - Multi-platform streaming (YouTube, Facebook)
 * - Real-time product showcase from warehouse
 * - Live chat integration
 * - Real-time cart and checkout
 * - Live analytics
 */

import { BaseBioModule } from './base-module';
import { KAIAEngine } from './kaia-engine';
import type { BioMessage, BioModuleConfig, BioModuleHealth } from './types';

interface LiveSession {
  id: string;
  sessionNumber: string;
  title: string;
  description?: string;
  platform: 'youtube' | 'facebook' | 'both';
  youtubeVideoId?: string;
  youtubeLiveUrl?: string;
  facebookVideoId?: string;
  facebookLiveUrl?: string;
  hostId: string;
  warehouseId?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  endTime?: Date;
  viewersCount: number;
  peakViewers: number;
  totalOrders: number;
  totalRevenue: number;
  allowChat: boolean;
  allowOrders: boolean;
  maxOrdersPerUser: number;
  products: LiveSessionProduct[];
}

interface LiveSessionProduct {
  id: string;
  sessionId: string;
  productId: string;
  displayOrder: number;
  isCurrentlyShowing: boolean;
  showStartTime?: Date;
  showEndTime?: Date;
  livePrice?: number;
  liveDiscount?: number;
  limitedQuantity?: number;
  soldQuantity: number;
  viewCount: number;
  addToCartCount: number;
  purchaseCount: number;
}

interface LiveViewer {
  id: string;
  sessionId: string;
  userId?: string;
  viewerName: string;
  viewerAvatar?: string;
  platform: 'youtube' | 'facebook';
  platformUserId?: string;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  messagesCount: number;
  reactionsCount: number;
  ordersCount: number;
  totalSpent: number;
}

interface LiveShoppingCart {
  id: string;
  sessionId: string;
  viewerId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    livePrice?: number;
    discount?: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'active' | 'checked_out' | 'abandoned';
  expiresAt?: Date;
}

interface LiveOrder {
  id: string;
  orderNumber: string;
  sessionId: string;
  viewerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryGovernorate: string;
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'cod' | 'card' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderedAt: Date;
}

export class LiveShoppingModule extends BaseBioModule {
  private sessions: Map<string, LiveSession> = new Map();
  private viewers: Map<string, LiveViewer> = new Map();
  private carts: Map<string, LiveShoppingCart> = new Map();
  private orders: Map<string, LiveOrder> = new Map();
  private kaiaEngine: KAIAEngine;

  constructor(config: BioModuleConfig) {
    super({
      ...config,
      name: 'Live Shopping Bio-Module',
    });

    this.kaiaEngine = new KAIAEngine();
    this.logInfo('Live Shopping Module initialized');
  }

  /**
   * Create a new live session
   */
  async createSession(session: Omit<LiveSession, 'id' | 'sessionNumber' | 'viewersCount' | 'peakViewers' | 'totalOrders' | 'totalRevenue' | 'products'>): Promise<LiveSession> {
    const sessionNumber = `LIVE-${new Date().getFullYear()}-${String(this.sessions.size + 1).padStart(4, '0')}`;

    const newSession: LiveSession = {
      id: `session-${Date.now()}`,
      sessionNumber,
      ...session,
      viewersCount: 0,
      peakViewers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      products: [],
    };

    this.sessions.set(newSession.id, newSession);
    this.logInfo(`Created live session ${sessionNumber} on ${session.platform}`);

    // Notify other modules
    await this.sendMessage({
      to: 'all',
      action: 'live_session_created',
      payload: newSession,
    });

    return newSession;
  }

  /**
   * Start a live session
   */
  async startSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status === 'live') {
      throw new Error(`Session ${session.sessionNumber} is already live`);
    }

    session.status = 'live';
    session.actualStartTime = new Date();

    this.logInfo(`Started live session ${session.sessionNumber}`);

    // Notify inventory to prepare products
    await this.sendMessage({
      to: 'inventory',
      action: 'prepare_live_products',
      payload: {
        sessionId: session.id,
        warehouseId: session.warehouseId,
        productIds: session.products.map(p => p.productId),
      },
    });

    // Notify all viewers
    await this.sendMessage({
      to: 'all',
      action: 'live_session_started',
      payload: {
        sessionId: session.id,
        sessionNumber: session.sessionNumber,
        platform: session.platform,
        youtubeUrl: session.youtubeLiveUrl,
        facebookUrl: session.facebookLiveUrl,
      },
    });
  }

  /**
   * Add product to live session
   */
  async addProductToSession(sessionId: string, productId: string, options?: {
    livePrice?: number;
    liveDiscount?: number;
    limitedQuantity?: number;
  }): Promise<LiveSessionProduct> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Get product details from inventory
    const productDetails = await this.requestProductDetails(productId);

    const sessionProduct: LiveSessionProduct = {
      id: `sp-${Date.now()}`,
      sessionId,
      productId,
      displayOrder: session.products.length,
      isCurrentlyShowing: false,
      livePrice: options?.livePrice,
      liveDiscount: options?.liveDiscount,
      limitedQuantity: options?.limitedQuantity,
      soldQuantity: 0,
      viewCount: 0,
      addToCartCount: 0,
      purchaseCount: 0,
    };

    session.products.push(sessionProduct);
    this.logInfo(`Added product ${productId} to session ${session.sessionNumber}`);

    return sessionProduct;
  }

  /**
   * Show product in live stream
   */
  async showProduct(sessionId: string, productId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Hide all currently showing products
    session.products.forEach(p => {
      if (p.isCurrentlyShowing) {
        p.isCurrentlyShowing = false;
        p.showEndTime = new Date();
      }
    });

    // Show the selected product
    const product = session.products.find(p => p.productId === productId);
    if (product) {
      product.isCurrentlyShowing = true;
      product.showStartTime = new Date();
      product.viewCount++;

      this.logInfo(`Now showing product ${productId} in session ${session.sessionNumber}`);

      // Broadcast to all viewers
      await this.sendMessage({
        to: 'all',
        action: 'product_now_showing',
        payload: {
          sessionId,
          productId,
          product: await this.requestProductDetails(productId),
          livePrice: product.livePrice,
          liveDiscount: product.liveDiscount,
          limitedQuantity: product.limitedQuantity,
          soldQuantity: product.soldQuantity,
        },
      });
    }
  }

  /**
   * Add viewer to session
   */
  async addViewer(sessionId: string, viewer: Omit<LiveViewer, 'id' | 'sessionId' | 'joinedAt' | 'isActive' | 'messagesCount' | 'reactionsCount' | 'ordersCount' | 'totalSpent'>): Promise<LiveViewer> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const newViewer: LiveViewer = {
      id: `viewer-${Date.now()}`,
      sessionId,
      ...viewer,
      joinedAt: new Date(),
      isActive: true,
      messagesCount: 0,
      reactionsCount: 0,
      ordersCount: 0,
      totalSpent: 0,
    };

    this.viewers.set(newViewer.id, newViewer);
    session.viewersCount++;

    if (session.viewersCount > session.peakViewers) {
      session.peakViewers = session.viewersCount;
    }

    this.logInfo(`Viewer ${viewer.viewerName} joined session ${session.sessionNumber} from ${viewer.platform}`);

    return newViewer;
  }

  /**
   * Add to cart during live session
   */
  async addToCart(viewerId: string, productId: string, quantity: number): Promise<LiveShoppingCart> {
    const viewer = this.viewers.get(viewerId);
    if (!viewer) {
      throw new Error(`Viewer ${viewerId} not found`);
    }

    const session = this.sessions.get(viewer.sessionId);
    if (!session) {
      throw new Error(`Session ${viewer.sessionId} not found`);
    }

    if (!session.allowOrders) {
      throw new Error('Orders are not allowed in this session');
    }

    // Get or create cart
    let cart = Array.from(this.carts.values()).find(c => c.viewerId === viewerId && c.status === 'active');
    if (!cart) {
      cart = {
        id: `cart-${Date.now()}`,
        sessionId: session.id,
        viewerId,
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };
      this.carts.set(cart.id, cart);
    }

    // Get product details
    const productDetails = await this.requestProductDetails(productId);
    const sessionProduct = session.products.find(p => p.productId === productId);

    // Check stock availability
    const stockAvailable = await this.checkStock(productId, quantity);
    if (!stockAvailable) {
      throw new Error(`Insufficient stock for product ${productId}`);
    }

    // Check limited quantity
    if (sessionProduct?.limitedQuantity) {
      const remaining = sessionProduct.limitedQuantity - sessionProduct.soldQuantity;
      if (quantity > remaining) {
        throw new Error(`Only ${remaining} units available for this live session`);
      }
    }

    // Add to cart
    const existingItem = cart.items.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        productName: productDetails.name,
        quantity,
        unitPrice: productDetails.price,
        livePrice: sessionProduct?.livePrice,
        discount: sessionProduct?.liveDiscount,
      });
    }

    // Recalculate totals
    this.recalculateCart(cart);

    // Update session product stats
    if (sessionProduct) {
      sessionProduct.addToCartCount++;
    }

    this.logInfo(`Added ${quantity}x ${productId} to cart for viewer ${viewerId}`);

    return cart;
  }

  /**
   * Checkout and create order
   */
  async checkout(cartId: string, deliveryInfo: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryGovernorate: string;
    paymentMethod: 'cod' | 'card' | 'wallet';
  }): Promise<LiveOrder> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }

    if (cart.status !== 'active') {
      throw new Error('Cart is not active');
    }

    const session = this.sessions.get(cart.sessionId);
    if (!session) {
      throw new Error(`Session ${cart.sessionId} not found`);
    }

    const viewer = this.viewers.get(cart.viewerId);
    if (!viewer) {
      throw new Error(`Viewer ${cart.viewerId} not found`);
    }

    // KAIA validation
    const validation = this.kaiaEngine.validateTransaction({
      ...deliveryInfo,
      total: cart.total,
      items: cart.items,
    }, 'live_order');

    if (!validation.passed) {
      throw new Error('Order validation failed');
    }

    // Create order
    const orderNumber = `LIVE-ORD-${new Date().getFullYear()}-${String(this.orders.size + 1).padStart(5, '0')}`;

    const order: LiveOrder = {
      id: `order-${Date.now()}`,
      orderNumber,
      sessionId: cart.sessionId,
      viewerId: cart.viewerId,
      ...deliveryInfo,
      items: cart.items,
      subtotal: cart.subtotal,
      discount: cart.discount,
      tax: cart.tax,
      shippingFee: this.calculateShipping(deliveryInfo.deliveryGovernorate),
      total: cart.total + this.calculateShipping(deliveryInfo.deliveryGovernorate),
      paymentStatus: 'pending',
      orderStatus: 'pending',
      orderedAt: new Date(),
    };

    this.orders.set(order.id, order);
    cart.status = 'checked_out';

    // Update session stats
    session.totalOrders++;
    session.totalRevenue += order.total;

    // Update viewer stats
    viewer.ordersCount++;
    viewer.totalSpent += order.total;

    // Update product stats
    cart.items.forEach(item => {
      const sessionProduct = session.products.find(p => p.productId === item.productId);
      if (sessionProduct) {
        sessionProduct.purchaseCount++;
        sessionProduct.soldQuantity += item.quantity;
      }
    });

    this.logInfo(`Created order ${orderNumber} for viewer ${viewer.viewerName}`);

    // Notify inventory to reserve stock
    await this.sendMessage({
      to: 'inventory',
      action: 'reserve_stock_for_live_order',
      payload: {
        orderId: order.id,
        items: order.items,
      },
    });

    // Notify sales module
    await this.sendMessage({
      to: 'sales',
      action: 'live_order_created',
      payload: order,
    });

    return order;
  }

  /**
   * Helper: Request product details from inventory
   */
  private async requestProductDetails(productId: string): Promise<any> {
    // In real implementation, this would send a message and wait for response
    return {
      id: productId,
      name: 'Product Name',
      price: 100,
      stock: 50,
    };
  }

  /**
   * Helper: Check stock availability
   */
  private async checkStock(productId: string, quantity: number): Promise<boolean> {
    // In real implementation, this would send a message to inventory
    return true;
  }

  /**
   * Helper: Recalculate cart totals
   */
  private recalculateCart(cart: LiveShoppingCart): void {
    cart.subtotal = cart.items.reduce((sum, item) => {
      const price = item.livePrice || item.unitPrice;
      return sum + (price * item.quantity);
    }, 0);

    cart.discount = cart.items.reduce((sum, item) => {
      if (item.discount) {
        const price = item.unitPrice;
        return sum + (price * item.quantity * item.discount / 100);
      }
      return sum;
    }, 0);

    cart.tax = (cart.subtotal - cart.discount) * 0.14; // 14% tax
    cart.total = cart.subtotal - cart.discount + cart.tax;
  }

  /**
   * Helper: Calculate shipping fee
   */
  private calculateShipping(governorate: string): number {
    // Simple shipping calculation
    const cairoGovernorates = ['القاهرة', 'الجيزة', 'القليوبية'];
    return cairoGovernorates.includes(governorate) ? 30 : 50;
  }

  /**
   * Send message to other modules
   */
  private async sendMessage(message: { to: string; action: string; payload: any }): Promise<void> {
    this.emit('bio-message', {
      id: `msg-${Date.now()}`,
      from: 'live-shopping',
      to: message.to,
      action: message.action,
      payload: message.payload,
      timestamp: new Date(),
      priority: 1,
    });
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionNumber: session.sessionNumber,
      status: session.status,
      viewersCount: session.viewersCount,
      peakViewers: session.peakViewers,
      totalOrders: session.totalOrders,
      totalRevenue: session.totalRevenue,
      productsShown: session.products.length,
      conversionRate: session.viewersCount > 0 ? (session.totalOrders / session.viewersCount) * 100 : 0,
    };
  }

  /**
   * Get module health
   */
  getHealth(): BioModuleHealth {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'live').length;
    const activeViewers = Array.from(this.viewers.values()).filter(v => v.isActive).length;

    return {
      status: 'healthy',
      lastActivity: Date.now(),
      metrics: {
        total_sessions: this.sessions.size,
        active_sessions: activeSessions,
        total_viewers: this.viewers.size,
        active_viewers: activeViewers,
        total_orders: this.orders.size,
        active_carts: Array.from(this.carts.values()).filter(c => c.status === 'active').length,
      },
    };
  }
}
