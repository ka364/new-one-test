/**
 * Live Shopping Database Schema
 * For YouTube Live & Facebook Live integration
 */

import { pgTable, text, integer, timestamp, boolean, jsonb, real, uuid } from 'drizzle-orm/pg-core';

/**
 * Live Sessions - البث المباشر
 */
export const liveSessions = pgTable('live_sessions', {
  id: text('id').primaryKey(),
  sessionNumber: text('session_number').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  
  // Platform integration
  platform: text('platform').notNull(), // 'youtube' | 'facebook' | 'both'
  youtubeVideoId: text('youtube_video_id'),
  youtubeLiveUrl: text('youtube_live_url'),
  facebookVideoId: text('facebook_video_id'),
  facebookLiveUrl: text('facebook_live_url'),
  
  // Session info
  hostId: text('host_id').notNull(), // البائع/المذيع
  warehouseId: text('warehouse_id'), // المخزن المرتبط
  status: text('status').notNull().default('scheduled'), // scheduled, live, ended, cancelled
  
  // Timing
  scheduledStartTime: timestamp('scheduled_start_time'),
  actualStartTime: timestamp('actual_start_time'),
  endTime: timestamp('end_time'),
  
  // Statistics
  viewersCount: integer('viewers_count').default(0),
  peakViewers: integer('peak_viewers').default(0),
  totalOrders: integer('total_orders').default(0),
  totalRevenue: real('total_revenue').default(0),
  
  // Settings
  allowChat: boolean('allow_chat').default(true),
  allowOrders: boolean('allow_orders').default(true),
  maxOrdersPerUser: integer('max_orders_per_user').default(10),
  
  // Metadata
  thumbnailUrl: text('thumbnail_url'),
  tags: jsonb('tags').$type<string[]>(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Live Session Products - المنتجات المعروضة في البث
 */
export const liveSessionProducts = pgTable('live_session_products', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => liveSessions.id),
  productId: text('product_id').notNull(),
  
  // Display info
  displayOrder: integer('display_order').default(0),
  isCurrentlyShowing: boolean('is_currently_showing').default(false),
  showStartTime: timestamp('show_start_time'),
  showEndTime: timestamp('show_end_time'),
  
  // Special pricing for live session
  livePrice: real('live_price'),
  liveDiscount: real('live_discount'), // percentage
  limitedQuantity: integer('limited_quantity'),
  soldQuantity: integer('sold_quantity').default(0),
  
  // Stats
  viewCount: integer('view_count').default(0),
  addToCartCount: integer('add_to_cart_count').default(0),
  purchaseCount: integer('purchase_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Live Viewers - المشاهدين
 */
export const liveViewers = pgTable('live_viewers', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => liveSessions.id),
  
  // User info
  userId: text('user_id'), // null for anonymous
  viewerName: text('viewer_name'),
  viewerAvatar: text('viewer_avatar'),
  
  // Platform info
  platform: text('platform').notNull(), // 'youtube' | 'facebook'
  platformUserId: text('platform_user_id'),
  
  // Session info
  joinedAt: timestamp('joined_at').defaultNow(),
  leftAt: timestamp('left_at'),
  isActive: boolean('is_active').default(true),
  
  // Engagement
  messagesCount: integer('messages_count').default(0),
  reactionsCount: integer('reactions_count').default(0),
  ordersCount: integer('orders_count').default(0),
  totalSpent: real('total_spent').default(0),
});

/**
 * Live Chat Messages - الرسائل
 */
export const liveChatMessages = pgTable('live_chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => liveSessions.id),
  viewerId: text('viewer_id').references(() => liveViewers.id),
  
  // Message content
  message: text('message').notNull(),
  messageType: text('message_type').default('text'), // text, emoji, sticker
  
  // Platform info
  platform: text('platform').notNull(),
  platformMessageId: text('platform_message_id'),
  
  // Moderation
  isVisible: boolean('is_visible').default(true),
  isHighlighted: boolean('is_highlighted').default(false),
  isPinned: boolean('is_pinned').default(false),
  
  timestamp: timestamp('timestamp').defaultNow(),
});

/**
 * Live Reactions - التفاعلات
 */
export const liveReactions = pgTable('live_reactions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => liveSessions.id),
  viewerId: text('viewer_id').references(() => liveViewers.id),
  productId: text('product_id'),
  
  // Reaction type
  reactionType: text('reaction_type').notNull(), // like, love, wow, fire, heart
  
  // Platform info
  platform: text('platform').notNull(),
  
  timestamp: timestamp('timestamp').defaultNow(),
});

/**
 * Live Shopping Carts - السلة أثناء البث
 */
export const liveShoppingCarts = pgTable('live_shopping_carts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => liveSessions.id),
  viewerId: text('viewer_id').notNull().references(() => liveViewers.id),
  
  // Cart items (stored as JSON for real-time updates)
  items: jsonb('items').$type<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    livePrice?: number;
    discount?: number;
  }[]>(),
  
  // Totals
  subtotal: real('subtotal').default(0),
  discount: real('discount').default(0),
  tax: real('tax').default(0),
  total: real('total').default(0),
  
  // Status
  status: text('status').default('active'), // active, checked_out, abandoned
  
  // Timing
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  expiresAt: timestamp('expires_at'), // Cart expires after session ends
});

/**
 * Live Orders - الطلبات أثناء البث
 */
export const liveOrders = pgTable('live_orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  sessionId: text('session_id').notNull().references(() => liveSessions.id),
  viewerId: text('viewer_id').notNull().references(() => liveViewers.id),
  cartId: text('cart_id').references(() => liveShoppingCarts.id),
  
  // Customer info
  customerId: text('customer_id'), // If registered
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  
  // Delivery info
  deliveryAddress: text('delivery_address').notNull(),
  deliveryCity: text('delivery_city').notNull(),
  deliveryGovernorate: text('delivery_governorate').notNull(),
  deliveryNotes: text('delivery_notes'),
  
  // Order details
  items: jsonb('items').$type<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    livePrice?: number;
    discount?: number;
    total: number;
  }[]>(),
  
  // Amounts
  subtotal: real('subtotal').notNull(),
  discount: real('discount').default(0),
  tax: real('tax').default(0),
  shippingFee: real('shipping_fee').default(0),
  total: real('total').notNull(),
  
  // Payment
  paymentMethod: text('payment_method').notNull(), // cod, card, wallet
  paymentStatus: text('payment_status').default('pending'), // pending, paid, failed
  
  // Order status
  orderStatus: text('order_status').default('pending'), // pending, confirmed, shipped, delivered, cancelled
  
  // Timestamps
  orderedAt: timestamp('ordered_at').defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
});

/**
 * Live Session Analytics - التحليلات
 */
export const liveSessionAnalytics = pgTable('live_session_analytics', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => liveSessions.id),
  
  // Viewer metrics
  totalViewers: integer('total_viewers').default(0),
  uniqueViewers: integer('unique_viewers').default(0),
  peakViewers: integer('peak_viewers').default(0),
  averageWatchTime: integer('average_watch_time').default(0), // seconds
  
  // Engagement metrics
  totalMessages: integer('total_messages').default(0),
  totalReactions: integer('total_reactions').default(0),
  engagementRate: real('engagement_rate').default(0), // percentage
  
  // Sales metrics
  totalOrders: integer('total_orders').default(0),
  totalRevenue: real('total_revenue').default(0),
  averageOrderValue: real('average_order_value').default(0),
  conversionRate: real('conversion_rate').default(0), // percentage
  
  // Product metrics
  topSellingProductId: text('top_selling_product_id'),
  mostViewedProductId: text('most_viewed_product_id'),
  
  // Platform breakdown
  youtubeViewers: integer('youtube_viewers').default(0),
  facebookViewers: integer('facebook_viewers').default(0),
  
  updatedAt: timestamp('updated_at').defaultNow(),
});
