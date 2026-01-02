/**
 * 💬 WhatsApp Commerce Router
 * نظام التجارة عبر واتساب - tRPC Router
 *
 * Features:
 * - Catalog Management (إدارة الكتالوج)
 * - Cart Management (إدارة السلة)
 * - Conversation Management (إدارة المحادثات)
 * - Message Handling (معالجة الرسائل)
 * - Broadcasts (البث الجماعي)
 * - Automations (الردود الآلية)
 * - Templates (القوالب)
 * - Quick Replies (الردود السريعة)
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../_core/trpc';
import { db } from '../db';
import { eq, and, gte, lte, desc, asc, sql, ilike, or, count, sum } from 'drizzle-orm';
import {
  whatsappCatalogs,
  whatsappCatalogItems,
  whatsappCarts,
  whatsappCartItems,
  whatsappConversations,
  whatsappMessages,
  whatsappTemplates,
  whatsappBroadcasts,
  whatsappBroadcastLogs,
  whatsappAutomations,
  whatsappQuickReplies,
} from '../../drizzle/schema-whatsapp-commerce';

// ============================================
// INPUT SCHEMAS
// ============================================

const addToCartSchema = z.object({
  phoneNumber: z.string().min(10),
  customerName: z.string().optional(),
  customerId: z.string().uuid().optional(),
  item: z.object({
    catalogItemId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive().default(1),
    notes: z.string().optional(),
  }),
});

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  type: z.enum(['text', 'image', 'video', 'document', 'template', 'interactive', 'product']),
  content: z.string().optional(),
  mediaUrl: z.string().optional(),
  templateId: z.string().uuid().optional(),
  templateParams: z.record(z.string()).optional(),
  interactiveData: z.any().optional(),
  productId: z.string().uuid().optional(),
  replyToMessageId: z.string().uuid().optional(),
});

const createBroadcastSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  templateId: z.string().uuid().optional(),
  audienceType: z.enum(['all', 'segment', 'custom']),
  audienceFilter: z
    .object({
      governorates: z.array(z.string()).optional(),
      hasOrdered: z.boolean().optional(),
      totalSpent: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      lastOrderDays: z.number().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  recipientPhones: z.array(z.string()).optional(),
  messageType: z.enum(['template', 'text', 'image']),
  messageContent: z.string().optional(),
  templateParams: z.record(z.string()).optional(),
  mediaUrl: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

const createAutomationSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  trigger: z.enum([
    'keyword',
    'first_message',
    'order_status',
    'cart_abandoned',
    'payment_received',
    'delivery_update',
    'review_request',
    'custom',
  ]),
  triggerKeywords: z.array(z.string()).optional(),
  triggerConditions: z
    .object({
      orderStatus: z.array(z.string()).optional(),
      cartAbandonedMinutes: z.number().optional(),
      paymentMethod: z.string().optional(),
      deliveryStatus: z.string().optional(),
    })
    .optional(),
  responseType: z.enum(['text', 'template', 'interactive', 'product']),
  responseContent: z.string().optional(),
  responseContentAr: z.string().optional(),
  templateId: z.string().uuid().optional(),
  interactiveConfig: z.any().optional(),
  actions: z
    .object({
      assignTo: z.string().optional(),
      addTags: z.array(z.string()).optional(),
      updateStatus: z.string().optional(),
      createTask: z.boolean().optional(),
      notifyTeam: z.boolean().optional(),
      delay: z.number().optional(),
    })
    .optional(),
  followUpDelay: z.number().optional(),
  followUpMessage: z.string().optional(),
  priority: z.number().optional(),
});

// ============================================
// ROUTER
// ============================================

export const whatsappCommerceRouter = router({
  // ============================================
  // CATALOG MANAGEMENT
  // ============================================

  /**
   * الحصول على الكتالوجات
   */
  getCatalogs: publicProcedure
    .input(
      z
        .object({
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.isActive !== undefined) {
        conditions.push(eq(whatsappCatalogs.isActive, input.isActive));
      }

      const catalogs = await db
        .select()
        .from(whatsappCatalogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(whatsappCatalogs.createdAt));

      return catalogs;
    }),

  /**
   * الحصول على عناصر الكتالوج
   */
  getCatalogItems: publicProcedure
    .input(
      z.object({
        catalogId: z.string().uuid(),
        search: z.string().optional(),
        isActive: z.boolean().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(whatsappCatalogItems.catalogId, input.catalogId)];

      if (input.isActive !== undefined) {
        conditions.push(eq(whatsappCatalogItems.isActive, input.isActive));
      }
      if (input.search) {
        conditions.push(
          or(
            ilike(whatsappCatalogItems.name, `%${input.search}%`),
            ilike(whatsappCatalogItems.nameAr, `%${input.search}%`)
          )
        );
      }

      const items = await db
        .select()
        .from(whatsappCatalogItems)
        .where(and(...conditions))
        .orderBy(asc(whatsappCatalogItems.name))
        .limit(input.limit)
        .offset(input.offset);

      return items;
    }),

  /**
   * مزامنة الكتالوج مع واتساب
   */
  syncCatalog: publicProcedure
    .input(
      z.object({
        catalogId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      // في الإنتاج، سيتم الاتصال بـ Meta API
      const [catalog] = await db
        .update(whatsappCatalogs)
        .set({
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(whatsappCatalogs.id, input.catalogId))
        .returning();

      return {
        success: true,
        message: 'تم مزامنة الكتالوج بنجاح',
        catalog,
      };
    }),

  // ============================================
  // CART MANAGEMENT
  // ============================================

  /**
   * الحصول على سلة العميل
   */
  getCart: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
      })
    )
    .query(async ({ input }) => {
      const [cart] = await db
        .select()
        .from(whatsappCarts)
        .where(
          and(eq(whatsappCarts.phoneNumber, input.phoneNumber), eq(whatsappCarts.status, 'active'))
        )
        .limit(1);

      if (!cart) {
        return null;
      }

      const items = await db
        .select()
        .from(whatsappCartItems)
        .where(eq(whatsappCartItems.cartId, cart.id));

      return {
        ...cart,
        items,
      };
    }),

  /**
   * إضافة عنصر للسلة
   */
  addToCart: publicProcedure.input(addToCartSchema).mutation(async ({ input }) => {
    // البحث عن سلة موجودة أو إنشاء جديدة
    let [cart] = await db
      .select()
      .from(whatsappCarts)
      .where(
        and(eq(whatsappCarts.phoneNumber, input.phoneNumber), eq(whatsappCarts.status, 'active'))
      )
      .limit(1);

    if (!cart) {
      [cart] = await db
        .insert(whatsappCarts)
        .values({
          phoneNumber: input.phoneNumber,
          customerName: input.customerName,
          customerId: input.customerId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 ساعة
        })
        .returning();
    }

    // إضافة العنصر
    const itemTotal = input.item.price * input.item.quantity;

    const [cartItem] = await db
      .insert(whatsappCartItems)
      .values({
        cartId: cart.id,
        catalogItemId: input.item.catalogItemId,
        productId: input.item.productId,
        name: input.item.name,
        price: input.item.price.toString(),
        quantity: input.item.quantity,
        total: itemTotal.toString(),
        notes: input.item.notes,
      })
      .returning();

    // تحديث إجمالي السلة
    const [{ total }] = await db
      .select({ total: sql<number>`SUM(${whatsappCartItems.total}::numeric)` })
      .from(whatsappCartItems)
      .where(eq(whatsappCartItems.cartId, cart.id));

    await db
      .update(whatsappCarts)
      .set({
        subtotal: total.toString(),
        total: total.toString(),
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsappCarts.id, cart.id));

    return {
      success: true,
      message: 'تم إضافة المنتج للسلة',
      cartItem,
      cartTotal: total,
    };
  }),

  /**
   * تحديث كمية عنصر
   */
  updateCartItem: publicProcedure
    .input(
      z.object({
        cartItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const [item] = await db
        .select()
        .from(whatsappCartItems)
        .where(eq(whatsappCartItems.id, input.cartItemId));

      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'العنصر غير موجود',
        });
      }

      const newTotal = Number(item.price) * input.quantity;

      await db
        .update(whatsappCartItems)
        .set({
          quantity: input.quantity,
          total: newTotal.toString(),
        })
        .where(eq(whatsappCartItems.id, input.cartItemId));

      // تحديث إجمالي السلة
      const [{ total }] = await db
        .select({ total: sql<number>`SUM(${whatsappCartItems.total}::numeric)` })
        .from(whatsappCartItems)
        .where(eq(whatsappCartItems.cartId, item.cartId));

      await db
        .update(whatsappCarts)
        .set({
          subtotal: total.toString(),
          total: total.toString(),
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(whatsappCarts.id, item.cartId));

      return {
        success: true,
        message: 'تم تحديث الكمية',
        newTotal: total,
      };
    }),

  /**
   * حذف عنصر من السلة
   */
  removeFromCart: publicProcedure
    .input(
      z.object({
        cartItemId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const [item] = await db
        .select()
        .from(whatsappCartItems)
        .where(eq(whatsappCartItems.id, input.cartItemId));

      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'العنصر غير موجود',
        });
      }

      await db.delete(whatsappCartItems).where(eq(whatsappCartItems.id, input.cartItemId));

      // تحديث إجمالي السلة
      const [{ total }] = await db
        .select({ total: sql<number>`COALESCE(SUM(${whatsappCartItems.total}::numeric), 0)` })
        .from(whatsappCartItems)
        .where(eq(whatsappCartItems.cartId, item.cartId));

      await db
        .update(whatsappCarts)
        .set({
          subtotal: total.toString(),
          total: total.toString(),
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(whatsappCarts.id, item.cartId));

      return {
        success: true,
        message: 'تم حذف المنتج من السلة',
        newTotal: total,
      };
    }),

  /**
   * تحويل السلة لطلب
   */
  convertCartToOrder: publicProcedure
    .input(
      z.object({
        cartId: z.string().uuid(),
        shippingAddress: z.object({
          governorate: z.string(),
          city: z.string(),
          area: z.string().optional(),
          street: z.string(),
          building: z.string().optional(),
          floor: z.string().optional(),
          apartment: z.string().optional(),
          landmark: z.string().optional(),
        }),
        paymentMethod: z.enum(['cod', 'card', 'instapay', 'vodafone_cash']).default('cod'),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [cart] = await db
        .select()
        .from(whatsappCarts)
        .where(eq(whatsappCarts.id, input.cartId));

      if (!cart) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'السلة غير موجودة',
        });
      }

      if (cart.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'السلة غير نشطة',
        });
      }

      // في الإنتاج، سيتم إنشاء الطلب في جدول orders
      // وربطه بالسلة

      // تحديث السلة
      await db
        .update(whatsappCarts)
        .set({
          status: 'converted',
          shippingAddress: input.shippingAddress,
          notes: input.notes,
          // convertedOrderId: newOrder.id,
          updatedAt: new Date(),
        })
        .where(eq(whatsappCarts.id, input.cartId));

      return {
        success: true,
        message: 'تم إنشاء الطلب بنجاح',
        // orderId: newOrder.id,
      };
    }),

  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  /**
   * الحصول على المحادثات
   */
  getConversations: publicProcedure
    .input(
      z
        .object({
          status: z.enum(['active', 'pending', 'resolved', 'archived']).optional(),
          assignedTo: z.string().uuid().optional(),
          category: z.string().optional(),
          search: z.string().optional(),
          isStarred: z.boolean().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.status) {
        conditions.push(eq(whatsappConversations.status, input.status));
      }
      if (input?.assignedTo) {
        conditions.push(eq(whatsappConversations.assignedTo, input.assignedTo));
      }
      if (input?.category) {
        conditions.push(eq(whatsappConversations.category, input.category));
      }
      if (input?.isStarred) {
        conditions.push(eq(whatsappConversations.isStarred, input.isStarred));
      }
      if (input?.search) {
        conditions.push(
          or(
            ilike(whatsappConversations.customerName, `%${input.search}%`),
            ilike(whatsappConversations.phoneNumber, `%${input.search}%`)
          )
        );
      }

      const conversations = await db
        .select()
        .from(whatsappConversations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(whatsappConversations.isPinned), desc(whatsappConversations.lastMessageAt))
        .limit(input?.limit || 50)
        .offset(input?.offset || 0);

      return conversations;
    }),

  /**
   * الحصول على رسائل المحادثة
   */
  getMessages: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().default(50),
        before: z.string().datetime().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(whatsappMessages.conversationId, input.conversationId)];

      if (input.before) {
        conditions.push(lte(whatsappMessages.createdAt, new Date(input.before)));
      }

      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(and(...conditions))
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(input.limit);

      // تحديث الرسائل كمقروءة
      await db
        .update(whatsappConversations)
        .set({ unreadCount: 0 })
        .where(eq(whatsappConversations.id, input.conversationId));

      return messages.reverse();
    }),

  /**
   * إرسال رسالة
   */
  sendMessage: publicProcedure.input(sendMessageSchema).mutation(async ({ input }) => {
    // في الإنتاج، سيتم إرسال الرسالة عبر WhatsApp Business API

    const [message] = await db
      .insert(whatsappMessages)
      .values({
        conversationId: input.conversationId,
        direction: 'outbound',
        type: input.type,
        status: 'pending',
        content: input.content,
        mediaUrl: input.mediaUrl,
        templateId: input.templateId,
        templateParams: input.templateParams,
        interactiveData: input.interactiveData,
        productId: input.productId,
        replyToMessageId: input.replyToMessageId,
        sentAt: new Date(),
      })
      .returning();

    // تحديث المحادثة
    await db
      .update(whatsappConversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: input.content?.substring(0, 100) || '📷 صورة',
        updatedAt: new Date(),
      })
      .where(eq(whatsappConversations.id, input.conversationId));

    return {
      success: true,
      message,
    };
  }),

  /**
   * تحديث حالة المحادثة
   */
  updateConversationStatus: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        status: z.enum(['active', 'pending', 'resolved', 'archived']),
      })
    )
    .mutation(async ({ input }) => {
      const [conversation] = await db
        .update(whatsappConversations)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(whatsappConversations.id, input.conversationId))
        .returning();

      return {
        success: true,
        conversation,
      };
    }),

  /**
   * تخصيص المحادثة لوكيل
   */
  assignConversation: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        agentId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const [conversation] = await db
        .update(whatsappConversations)
        .set({
          assignedTo: input.agentId,
          updatedAt: new Date(),
        })
        .where(eq(whatsappConversations.id, input.conversationId))
        .returning();

      return {
        success: true,
        conversation,
      };
    }),

  // ============================================
  // BROADCASTS
  // ============================================

  /**
   * إنشاء بث جماعي
   */
  createBroadcast: publicProcedure.input(createBroadcastSchema).mutation(async ({ input }) => {
    const [broadcast] = await db
      .insert(whatsappBroadcasts)
      .values({
        name: input.name,
        description: input.description,
        templateId: input.templateId,
        status: input.scheduledAt ? 'scheduled' : 'draft',
        audienceType: input.audienceType,
        audienceFilter: input.audienceFilter,
        recipientPhones: input.recipientPhones,
        messageType: input.messageType,
        messageContent: input.messageContent,
        templateParams: input.templateParams,
        mediaUrl: input.mediaUrl,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        totalRecipients: input.recipientPhones?.length || 0,
      })
      .returning();

    return {
      success: true,
      message: 'تم إنشاء البث بنجاح',
      broadcast,
    };
  }),

  /**
   * الحصول على البثوث
   */
  getBroadcasts: publicProcedure
    .input(
      z
        .object({
          status: z
            .enum(['draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'])
            .optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.status) {
        conditions.push(eq(whatsappBroadcasts.status, input.status));
      }

      const broadcasts = await db
        .select()
        .from(whatsappBroadcasts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(whatsappBroadcasts.createdAt))
        .limit(input?.limit || 20)
        .offset(input?.offset || 0);

      return broadcasts;
    }),

  /**
   * إرسال البث
   */
  sendBroadcast: publicProcedure
    .input(
      z.object({
        broadcastId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const [broadcast] = await db
        .select()
        .from(whatsappBroadcasts)
        .where(eq(whatsappBroadcasts.id, input.broadcastId));

      if (!broadcast) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'البث غير موجود',
        });
      }

      if (broadcast.status !== 'draft' && broadcast.status !== 'scheduled') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'لا يمكن إرسال هذا البث',
        });
      }

      // في الإنتاج، سيتم إرسال الرسائل عبر WhatsApp Business API
      await db
        .update(whatsappBroadcasts)
        .set({
          status: 'sending',
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(whatsappBroadcasts.id, input.broadcastId));

      return {
        success: true,
        message: 'تم بدء إرسال البث',
      };
    }),

  // ============================================
  // AUTOMATIONS
  // ============================================

  /**
   * إنشاء أتمتة
   */
  createAutomation: publicProcedure.input(createAutomationSchema).mutation(async ({ input }) => {
    const [automation] = await db
      .insert(whatsappAutomations)
      .values({
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        trigger: input.trigger,
        triggerKeywords: input.triggerKeywords,
        triggerConditions: input.triggerConditions,
        responseType: input.responseType,
        responseContent: input.responseContent,
        responseContentAr: input.responseContentAr,
        templateId: input.templateId,
        interactiveConfig: input.interactiveConfig,
        actions: input.actions,
        followUpDelay: input.followUpDelay,
        followUpMessage: input.followUpMessage,
        priority: input.priority,
      })
      .returning();

    return {
      success: true,
      message: 'تم إنشاء الأتمتة بنجاح',
      automation,
    };
  }),

  /**
   * الحصول على الأتمتات
   */
  getAutomations: publicProcedure
    .input(
      z
        .object({
          trigger: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.trigger) {
        conditions.push(eq(whatsappAutomations.trigger, input.trigger as any));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(whatsappAutomations.isActive, input.isActive));
      }

      const automations = await db
        .select()
        .from(whatsappAutomations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(whatsappAutomations.priority), asc(whatsappAutomations.name));

      return automations;
    }),

  /**
   * تفعيل/تعطيل أتمتة
   */
  toggleAutomation: publicProcedure
    .input(
      z.object({
        automationId: z.string().uuid(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const [automation] = await db
        .update(whatsappAutomations)
        .set({
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(whatsappAutomations.id, input.automationId))
        .returning();

      return {
        success: true,
        message: input.isActive ? 'تم تفعيل الأتمتة' : 'تم تعطيل الأتمتة',
        automation,
      };
    }),

  // ============================================
  // TEMPLATES
  // ============================================

  /**
   * الحصول على القوالب
   */
  getTemplates: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          status: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.category) {
        conditions.push(eq(whatsappTemplates.category, input.category));
      }
      if (input?.status) {
        conditions.push(eq(whatsappTemplates.status, input.status));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(whatsappTemplates.isActive, input.isActive));
      }

      const templates = await db
        .select()
        .from(whatsappTemplates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(whatsappTemplates.name));

      return templates;
    }),

  /**
   * إنشاء قالب
   */
  createTemplate: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum(['marketing', 'utility', 'authentication']),
        language: z.string().default('ar'),
        headerType: z.enum(['text', 'image', 'video', 'document']).optional(),
        headerContent: z.string().optional(),
        headerMediaUrl: z.string().optional(),
        bodyContent: z.string().min(1),
        footerContent: z.string().optional(),
        buttons: z
          .array(
            z.object({
              type: z.enum(['quick_reply', 'url', 'phone']),
              text: z.string(),
              url: z.string().optional(),
              phone: z.string().optional(),
            })
          )
          .optional(),
        variables: z
          .array(
            z.object({
              name: z.string(),
              example: z.string(),
              type: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [template] = await db
        .insert(whatsappTemplates)
        .values({
          name: input.name,
          category: input.category,
          language: input.language,
          headerType: input.headerType,
          headerContent: input.headerContent,
          headerMediaUrl: input.headerMediaUrl,
          bodyContent: input.bodyContent,
          footerContent: input.footerContent,
          buttons: input.buttons,
          variables: input.variables,
          status: 'pending',
        })
        .returning();

      return {
        success: true,
        message: 'تم إنشاء القالب، في انتظار موافقة Meta',
        template,
      };
    }),

  // ============================================
  // QUICK REPLIES
  // ============================================

  /**
   * الحصول على الردود السريعة
   */
  getQuickReplies: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [eq(whatsappQuickReplies.isActive, true)];

      if (input?.category) {
        conditions.push(eq(whatsappQuickReplies.category, input.category));
      }
      if (input?.search) {
        conditions.push(
          or(
            ilike(whatsappQuickReplies.shortcut, `%${input.search}%`),
            ilike(whatsappQuickReplies.title, `%${input.search}%`),
            ilike(whatsappQuickReplies.content, `%${input.search}%`)
          )
        );
      }

      const replies = await db
        .select()
        .from(whatsappQuickReplies)
        .where(and(...conditions))
        .orderBy(desc(whatsappQuickReplies.usageCount));

      return replies;
    }),

  /**
   * إنشاء رد سريع
   */
  createQuickReply: publicProcedure
    .input(
      z.object({
        shortcut: z
          .string()
          .min(2)
          .regex(/^\/\w+$/),
        title: z.string().min(1),
        titleAr: z.string().optional(),
        content: z.string().min(1),
        contentAr: z.string().optional(),
        category: z.string().optional(),
        mediaUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [reply] = await db
        .insert(whatsappQuickReplies)
        .values({
          shortcut: input.shortcut,
          title: input.title,
          titleAr: input.titleAr,
          content: input.content,
          contentAr: input.contentAr,
          category: input.category,
          mediaUrl: input.mediaUrl,
        })
        .returning();

      return {
        success: true,
        message: 'تم إنشاء الرد السريع بنجاح',
        reply,
      };
    }),

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * إحصائيات واتساب
   */
  getAnalytics: publicProcedure
    .input(
      z.object({
        dateFrom: z.string(),
        dateTo: z.string(),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date(input.dateFrom);
      const endDate = new Date(input.dateTo);

      // إحصائيات المحادثات
      const [conversationStats] = await db
        .select({
          total: count(),
          active: sql<number>`COUNT(*) FILTER (WHERE ${whatsappConversations.status} = 'active')`,
          resolved: sql<number>`COUNT(*) FILTER (WHERE ${whatsappConversations.status} = 'resolved')`,
        })
        .from(whatsappConversations)
        .where(
          and(
            gte(whatsappConversations.createdAt, startDate),
            lte(whatsappConversations.createdAt, endDate)
          )
        );

      // إحصائيات الرسائل
      const [messageStats] = await db
        .select({
          total: count(),
          sent: sql<number>`COUNT(*) FILTER (WHERE ${whatsappMessages.direction} = 'outbound')`,
          received: sql<number>`COUNT(*) FILTER (WHERE ${whatsappMessages.direction} = 'inbound')`,
          delivered: sql<number>`COUNT(*) FILTER (WHERE ${whatsappMessages.status} = 'delivered')`,
          read: sql<number>`COUNT(*) FILTER (WHERE ${whatsappMessages.status} = 'read')`,
        })
        .from(whatsappMessages)
        .where(
          and(gte(whatsappMessages.createdAt, startDate), lte(whatsappMessages.createdAt, endDate))
        );

      // إحصائيات السلات
      const [cartStats] = await db
        .select({
          total: count(),
          converted: sql<number>`COUNT(*) FILTER (WHERE ${whatsappCarts.status} = 'converted')`,
          abandoned: sql<number>`COUNT(*) FILTER (WHERE ${whatsappCarts.status} = 'abandoned')`,
          totalValue: sql<number>`COALESCE(SUM(${whatsappCarts.total}::numeric) FILTER (WHERE ${whatsappCarts.status} = 'converted'), 0)`,
        })
        .from(whatsappCarts)
        .where(and(gte(whatsappCarts.createdAt, startDate), lte(whatsappCarts.createdAt, endDate)));

      return {
        conversations: {
          total: Number(conversationStats.total) || 0,
          active: Number(conversationStats.active) || 0,
          resolved: Number(conversationStats.resolved) || 0,
        },
        messages: {
          total: Number(messageStats.total) || 0,
          sent: Number(messageStats.sent) || 0,
          received: Number(messageStats.received) || 0,
          delivered: Number(messageStats.delivered) || 0,
          read: Number(messageStats.read) || 0,
          deliveryRate: messageStats.sent
            ? ((Number(messageStats.delivered) / Number(messageStats.sent)) * 100).toFixed(1)
            : '0',
          readRate: messageStats.sent
            ? ((Number(messageStats.read) / Number(messageStats.sent)) * 100).toFixed(1)
            : '0',
        },
        carts: {
          total: Number(cartStats.total) || 0,
          converted: Number(cartStats.converted) || 0,
          abandoned: Number(cartStats.abandoned) || 0,
          conversionRate: cartStats.total
            ? ((Number(cartStats.converted) / Number(cartStats.total)) * 100).toFixed(1)
            : '0',
          totalValue: Number(cartStats.totalValue) || 0,
        },
      };
    }),
});

export type WhatsappCommerceRouter = typeof whatsappCommerceRouter;
