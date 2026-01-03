// @ts-nocheck
/**
 * Live Showroom tRPC Router
 * موجه API للمعرض المباشر
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { getLiveShowroomManager } from '../live-showroom/system';
import { getMultiStreamManager } from '../live-showroom/multi-stream';
import { getLiveOrderFulfillmentManager } from '../live-showroom/live-order-fulfillment';
import { getAffiliateManager } from '../affiliate/system';

export const liveShowroomRouter = router({
  /**
   * Create a new live stream
   */
  createStream: protectedProcedure
    .input(
      z.object({
        factoryId: z.string(),
        factoryName: z.string(),
        title: z.string(),
        titleAr: z.string(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        hostName: z.string().optional(),
        hostNameAr: z.string().optional(),
        featuredProducts: z.array(z.string()).optional(),
        enabledPlatforms: z.array(z.enum(['facebook', 'youtube', 'instagram', 'tiktok', 'haderos'])),
      })
    )
    .mutation(async ({ input }) => {
      const showroomManager = getLiveShowroomManager();
      const multiStreamManager = getMultiStreamManager();

      // Create the stream
      const stream = showroomManager.createStream(
        input.factoryId,
        input.factoryName,
        input.title,
        input.titleAr,
        {
          description: input.description,
          descriptionAr: input.descriptionAr,
          hostName: input.hostName,
          hostNameAr: input.hostNameAr,
          featuredProducts: input.featuredProducts,
        }
      );

      // Initialize multi-stream configuration
      const multiStreamConfig = multiStreamManager.initializeStream(
        stream.id,
        input.factoryId,
        input.enabledPlatforms
      );

      return {
        stream,
        multiStreamConfig,
        rtmpInstructions: multiStreamManager.getStreamingInstructions(stream.id),
      };
    }),

  /**
   * Start a stream
   */
  startStream: protectedProcedure
    .input(z.object({ streamId: z.string() }))
    .mutation(async ({ input }) => {
      const showroomManager = getLiveShowroomManager();
      const multiStreamManager = getMultiStreamManager();

      showroomManager.startStream(input.streamId);
      multiStreamManager.startMultiStream(input.streamId);

      return { success: true };
    }),

  /**
   * End a stream
   */
  endStream: protectedProcedure
    .input(z.object({ streamId: z.string() }))
    .mutation(async ({ input }) => {
      const showroomManager = getLiveShowroomManager();
      const multiStreamManager = getMultiStreamManager();

      showroomManager.endStream(input.streamId);
      multiStreamManager.stopMultiStream(input.streamId);

      return { success: true };
    }),

  /**
   * Get active streams
   */
  getActiveStreams: publicProcedure.query(async () => {
    const showroomManager = getLiveShowroomManager();
    return showroomManager.getActiveStreams();
  }),

  /**
   * Get stream by ID
   */
  getStream: publicProcedure
    .input(z.object({ streamId: z.string() }))
    .query(async ({ input }) => {
      const showroomManager = getLiveShowroomManager();
      const stream = showroomManager.getStream(input.streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }

      return stream;
    }),

  /**
   * Place an order during live stream
   */
  placeOrder: publicProcedure
    .input(
      z.object({
        streamId: z.string(),
        customerPhone: z.string(),
        customerName: z.string(),
        customerType: z.enum(['retail', 'wholesale']),
        products: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            nameAr: z.string(),
            quantity: z.number().positive(),
            price: z.number().positive(),
            image: z.string().optional(),
          })
        ),
        notes: z.string().optional(),
        affiliateCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const fulfillmentManager = getLiveOrderFulfillmentManager();
      const showroomManager = getLiveShowroomManager();

      // Create the order
      const order = fulfillmentManager.createOrder(
        input.streamId,
        input.customerPhone,
        input.customerName,
        input.customerType,
        input.products,
        input.notes
      );

      // Also record it in the showroom system
      showroomManager.placeOrder(
        input.streamId,
        input.customerPhone,
        input.customerName,
        input.customerType,
        input.products[0].id,
        input.products[0].nameAr,
        input.products.reduce((sum, p) => sum + p.quantity, 0),
        input.products.reduce((sum, p) => sum + p.price, 0) / input.products.length
      );

      // Track affiliate if code provided
      let affiliateOrder;
      if (input.affiliateCode) {
        try {
          const affiliateManager = getAffiliateManager();
          const totalAmount = input.products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
          affiliateOrder = affiliateManager.trackOrder(
            input.affiliateCode,
            order.id,
            input.customerName,
            input.customerPhone,
            totalAmount
          );
        } catch (error) {
          console.error('Failed to track affiliate order:', error);
        }
      }

      // Generate WhatsApp confirmation message
      const whatsappMessage = fulfillmentManager.generateWhatsAppConfirmation(order.id);

      return {
        order,
        whatsappMessage,
        affiliateOrder,
      };
    }),

  /**
   * Update order status
   */
  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(['received', 'preparing', 'packing', 'ready', 'handed_to_shipping', 'completed']),
        shippingCompany: z.string().optional(),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const fulfillmentManager = getLiveOrderFulfillmentManager();

      const order = fulfillmentManager.updateOrderStatus(input.orderId, input.status, {
        shippingCompany: input.shippingCompany,
        trackingNumber: input.trackingNumber,
      });

      // Generate shipping message if handed to shipping
      let shippingMessage: string | undefined;
      if (input.status === 'handed_to_shipping') {
        shippingMessage = fulfillmentManager.generateShippingHandoverMessage(input.orderId);
      }

      return {
        order,
        shippingMessage,
      };
    }),

  /**
   * Get orders for a stream
   */
  getStreamOrders: protectedProcedure
    .input(z.object({ streamId: z.string() }))
    .query(async ({ input }) => {
      const fulfillmentManager = getLiveOrderFulfillmentManager();
      return fulfillmentManager.getStreamOrders(input.streamId);
    }),

  /**
   * Get current order being shown on camera
   */
  getCurrentCameraOrder: publicProcedure
    .input(z.object({ streamId: z.string() }))
    .query(async ({ input }) => {
      const fulfillmentManager = getLiveOrderFulfillmentManager();
      return fulfillmentManager.getCurrentCameraOrder(input.streamId);
    }),

  /**
   * Get stream statistics
   */
  getStreamStats: protectedProcedure
    .input(z.object({ streamId: z.string() }))
    .query(async ({ input }) => {
      const showroomManager = getLiveShowroomManager();
      const fulfillmentManager = getLiveOrderFulfillmentManager();
      const multiStreamManager = getMultiStreamManager();

      const analytics = showroomManager.getAnalytics(input.streamId);
      const orderStats = fulfillmentManager.getStreamStats(input.streamId);
      const multiStreamStats = multiStreamManager.getStats(input.streamId);

      return {
        analytics,
        orderStats,
        multiStreamStats,
      };
    }),

  /**
   * Add a comment to the stream
   */
  addComment: publicProcedure
    .input(
      z.object({
        streamId: z.string(),
        platform: z.string(),
        userId: z.string(),
        userName: z.string(),
        message: z.string(),
        userAvatar: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const multiStreamManager = getMultiStreamManager();

      const comment = multiStreamManager.addComment(
        input.streamId,
        input.platform,
        input.userId,
        input.userName,
        input.message,
        input.userAvatar
      );

      return comment;
    }),

  /**
   * Get comments for a stream
   */
  getComments: publicProcedure
    .input(
      z.object({
        streamId: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const multiStreamManager = getMultiStreamManager();
      return multiStreamManager.getComments(input.streamId, input.limit);
    }),

  /**
   * Update viewer count for a platform
   */
  updateViewerCount: protectedProcedure
    .input(
      z.object({
        streamId: z.string(),
        platformId: z.string(),
        count: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const multiStreamManager = getMultiStreamManager();
      multiStreamManager.updateViewerCount(input.streamId, input.platformId, input.count);
      return { success: true };
    }),

  /**
   * Get unified feed for a stream (all interactions from all platforms)
   */
  getUnifiedFeed: publicProcedure
    .input(z.object({ streamId: z.string() }))
    .query(async ({ input }) => {
      const { unifiedFeed } = await import('../live-showroom/unified-feed');
      const interactions = unifiedFeed.getFeed(input.streamId);
      const stats = unifiedFeed.getStats(input.streamId);
      
      return {
        interactions,
        stats,
      };
    }),

  /**
   * Get revenue data for a stream (aggregated from all platforms)
   */
  getStreamRevenue: publicProcedure
    .input(z.object({ streamId: z.string() }))
    .query(async ({ input }) => {
      const { revenueAggregator } = await import('../live-showroom/revenue-aggregator');
      return revenueAggregator.getStreamRevenue(input.streamId);
    }),

  /**
   * Get AI-powered insights for the broadcaster
   */
  getStreamInsights: publicProcedure
    .input(z.object({ streamId: z.string() }))
    .query(async ({ input }) => {
      const { unifiedFeed } = await import('../live-showroom/unified-feed');
      const { revenueAggregator } = await import('../live-showroom/revenue-aggregator');
      
      const stats = unifiedFeed.getStats(input.streamId);
      const revenue = revenueAggregator.getStreamRevenue(input.streamId);
      
      // Generate AI-powered suggestions
      const suggestions = [];
      
      // Suggest based on engagement
      if (stats && stats.totalInteractions > 100) {
        suggestions.push({
          icon: '🔥',
          text: 'التفاعل عالي جداً! هذا هو الوقت المثالي لعرض المنتجات الأكثر طلباً.',
        });
      }
      
      // Suggest based on revenue
      if (revenue && revenue.totalRevenue > 1000) {
        suggestions.push({
          icon: '💰',
          text: 'الأرباح ممتازة! فكر في تقديم عرض حصري للمشاهدين الحاليين.',
        });
      }
      
      // Suggest based on questions
      if (stats && stats.topQuestions.length > 5) {
        suggestions.push({
          icon: '❓',
          text: 'هناك العديد من الأسئلة. خصص وقتاً للإجابة عليها لزيادة الثقة.',
        });
      }
      
      return {
        currentViewers: 0, // This would come from streaming platform APIs
        totalOrders: 0,    // This would come from order system
        newOrders: 0,
        suggestions,
        hotProducts: [],   // This would be calculated from order data
        topQuestions: stats?.topQuestions || [],
      };
    }),

  /**
   * Record revenue from external platforms
   */
  recordRevenue: protectedProcedure
    .input(
      z.object({
        streamId: z.string(),
        platform: z.enum(['facebook_stars', 'youtube_superchat', 'tiktok_gifts', 'instagram_badges', 'haderos_orders']),
        amount: z.number(),
        currency: z.string(),
        userId: z.string().optional(),
        username: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { eventBus } = await import('../events/eventBus');
      
      // Emit revenue event
      eventBus.emit('revenue.received', {
        streamId: input.streamId,
        platform: input.platform,
        amount: input.amount,
        currency: input.currency,
        userId: input.userId,
        username: input.username,
        message: input.message,
        timestamp: new Date(),
      });
      
      return { success: true };
    }),

  /**
   * Record interaction from external platforms
   */
  recordInteraction: publicProcedure
    .input(
      z.object({
        streamId: z.string(),
        platform: z.enum(['facebook', 'youtube', 'tiktok', 'instagram', 'haderos']),
        type: z.enum(['comment', 'reaction', 'share', 'gift', 'order', 'question']),
        userId: z.string().optional(),
        username: z.string(),
        userAvatar: z.string().optional(),
        content: z.string(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { eventBus } = await import('../events/eventBus');
      
      // Emit interaction event based on platform
      eventBus.emit(`interaction.${input.platform}`, {
        id: `${Date.now()}-${Math.random()}`,
        streamId: input.streamId,
        type: input.type,
        userId: input.userId,
        username: input.username,
        userAvatar: input.userAvatar,
        content: input.content,
        timestamp: new Date(),
        metadata: input.metadata,
      });
      
      return { success: true };
    }),
});
