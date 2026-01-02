/**
 * 📨 Unified Messaging System Router
 *
 * Supports:
 * 1. Team Communication (internal messaging)
 * 2. Customer Support (ticketing system)
 * 3. AI Assistant (subscription-based)
 *
 * Features:
 * - Real-time messaging
 * - File attachments
 * - Reactions & read receipts
 * - Push notifications (FCM)
 * - Subscription management
 * - AI usage tracking
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { and, eq, desc, sql, gte, lte, inArray, or, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';

// Import schema
import {
  conversations,
  conversationParticipants,
  messages,
  messageAttachments,
  messageReactions,
  messageReadReceipts,
  typingIndicators,
  pushNotificationTokens,
  notificationHistory,
  aiUsageTracking,
  subscriptionPlans,
  userSubscriptions,
} from '../../drizzle/schema-messaging';

// ============================================
// TYPES & VALIDATORS
// ============================================

const conversationTypeEnum = z.enum(['team', 'support', 'ai', 'direct']);
const ticketStatusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed']);
const ticketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
const contentTypeEnum = z.enum(['text', 'html', 'markdown']);
const platformEnum = z.enum(['web', 'ios', 'android']);
const subscriptionStatusEnum = z.enum(['active', 'cancelled', 'expired', 'suspended']);
const billingCycleEnum = z.enum(['monthly', 'yearly']);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user has access to conversation
 */
async function checkConversationAccess(
  db: Awaited<ReturnType<typeof getDb>>,
  conversationId: string,
  userId: number
): Promise<boolean> {
  const participant = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt)
      )
    )
    .limit(1);

  return participant.length > 0;
}

/**
 * Check AI subscription limits
 */
async function checkAILimits(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: number
): Promise<{ allowed: boolean; reason?: string; usage?: any }> {
  const usage = await db
    .select()
    .from(aiUsageTracking)
    .where(and(eq(aiUsageTracking.userId, userId), gte(aiUsageTracking.periodEndDate, new Date())))
    .limit(1);

  if (usage.length === 0) {
    return { allowed: false, reason: 'No active AI subscription' };
  }

  const userUsage = usage[0];

  if (userUsage.messagesThisMonth >= userUsage.monthlyMessageLimit) {
    return {
      allowed: false,
      reason: 'Monthly message limit reached',
      usage: userUsage,
    };
  }

  if (userUsage.tokensThisMonth >= userUsage.monthlyTokenLimit) {
    return {
      allowed: false,
      reason: 'Monthly token limit reached',
      usage: userUsage,
    };
  }

  if (userUsage.costThisMonth >= userUsage.monthlyBudget) {
    return {
      allowed: false,
      reason: 'Monthly budget limit reached',
      usage: userUsage,
    };
  }

  return { allowed: true, usage: userUsage };
}

/**
 * Update AI usage statistics
 */
async function trackAIUsage(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: number,
  tokens: number,
  cost: number
) {
  await db.execute(sql`
    UPDATE ${aiUsageTracking}
    SET
      messages_this_month = messages_this_month + 1,
      tokens_this_month = tokens_this_month + ${tokens},
      cost_this_month = cost_this_month + ${cost},
      last_used_at = NOW(),
      updated_at = NOW()
    WHERE user_id = ${userId}
    AND period_end_date >= NOW()
  `);
}

// ============================================
// ROUTER
// ============================================

export const messagingRouter = router({
  // ==========================================
  // CONVERSATIONS
  // ==========================================

  /**
   * Get user's conversations (inbox)
   */
  getConversations: protectedProcedure
    .input(
      z.object({
        type: conversationTypeEnum.optional(),
        includeArchived: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      // Get conversations where user is a participant
      const userConversations = await db
        .select({
          conversation: conversations,
          participant: conversationParticipants,
          unreadCount: sql<number>`
            COUNT(DISTINCT m.id) FILTER (
              WHERE m.created_at > COALESCE(${conversationParticipants.lastReadAt}, '1970-01-01')
              AND m.sender_id != ${ctx.user.id}
            )
          `,
          lastMessage: sql<any>`
            (
              SELECT json_build_object(
                'id', m.id,
                'content', m.content,
                'createdAt', m.created_at,
                'senderId', m.sender_id
              )
              FROM ${messages} m
              WHERE m.conversation_id = ${conversations.id}
              AND m.is_deleted = false
              ORDER BY m.created_at DESC
              LIMIT 1
            )
          `,
        })
        .from(conversations)
        .innerJoin(
          conversationParticipants,
          eq(conversationParticipants.conversationId, conversations.id)
        )
        .leftJoin(messages, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversationParticipants.userId, ctx.user.id),
            isNull(conversationParticipants.leftAt),
            input.type ? eq(conversations.type, input.type) : undefined,
            input.includeArchived ? undefined : eq(conversations.isArchived, false)
          )
        )
        .groupBy(conversations.id, conversationParticipants.id)
        .orderBy(desc(conversations.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      return userConversations;
    }),

  /**
   * Get single conversation details
   */
  getConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      // Check access
      const hasAccess = await checkConversationAccess(db, input.conversationId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have access to this conversation",
        });
      }

      // Get conversation with participants
      const conversation = await db
        .select({
          conversation: conversations,
          participants: sql<any[]>`
            COALESCE(
              json_agg(
                json_build_object(
                  'userId', cp.user_id,
                  'role', cp.role,
                  'isMuted', cp.is_muted,
                  'lastReadAt', cp.last_read_at,
                  'joinedAt', cp.joined_at
                )
              ) FILTER (WHERE cp.left_at IS NULL),
              '[]'
            )
          `,
        })
        .from(conversations)
        .leftJoin(
          conversationParticipants,
          eq(conversationParticipants.conversationId, conversations.id)
        )
        .where(eq(conversations.id, input.conversationId))
        .groupBy(conversations.id)
        .limit(1);

      if (conversation.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        });
      }

      return conversation[0];
    }),

  /**
   * Create new conversation
   */
  createConversation: protectedProcedure
    .input(
      z.object({
        type: conversationTypeEnum,
        title: z.string().max(255),
        description: z.string().optional(),

        // For team conversations
        organizationId: z.number().optional(),
        departmentId: z.string().optional(),
        participantIds: z.array(z.number()).optional(),

        // For support tickets
        ticketCategory: z.string().optional(),
        ticketPriority: ticketPriorityEnum.optional(),

        // For AI conversations
        aiModel: z.string().optional(),
        aiPersona: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const conversationId = uuidv4();

      // Create conversation
      await db.insert(conversations).values({
        id: conversationId,
        type: input.type,
        title: input.title,
        description: input.description,
        organizationId: input.organizationId,
        departmentId: input.departmentId,
        ticketCategory: input.ticketCategory,
        ticketPriority: input.ticketPriority,
        ticketStatus: input.type === 'support' ? 'open' : undefined,
        ticketNumber: input.type === 'support' ? `TICKET-${Date.now()}` : undefined,
        aiModel: input.aiModel,
        aiPersona: input.aiPersona,
        createdById: ctx.user.id,
      });

      // Add creator as participant
      await db.insert(conversationParticipants).values({
        conversationId,
        userId: ctx.user.id,
        role: 'admin',
      });

      // Add other participants
      if (input.participantIds && input.participantIds.length > 0) {
        await db.insert(conversationParticipants).values(
          input.participantIds.map((userId) => ({
            conversationId,
            userId,
            role: 'member' as const,
          }))
        );
      }

      return { conversationId };
    }),

  /**
   * Update conversation
   */
  updateConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        title: z.string().max(255).optional(),
        description: z.string().optional(),
        isArchived: z.boolean().optional(),
        isPinned: z.boolean().optional(),
        ticketStatus: ticketStatusEnum.optional(),
        ticketPriority: ticketPriorityEnum.optional(),
        assignedToId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Check if user is admin of conversation
      const participant = await db
        .select()
        .from(conversationParticipants)
        .where(
          and(
            eq(conversationParticipants.conversationId, input.conversationId),
            eq(conversationParticipants.userId, ctx.user.id),
            eq(conversationParticipants.role, 'admin')
          )
        )
        .limit(1);

      if (participant.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have permission to update this conversation",
        });
      }

      const { conversationId, ...updateData } = input;

      await db
        .update(conversations)
        .set({
          ...updateData,
          updatedAt: new Date(),
          closedAt: input.ticketStatus === 'closed' ? new Date() : undefined,
        })
        .where(eq(conversations.id, conversationId));

      return { success: true };
    }),

  // ==========================================
  // MESSAGES
  // ==========================================

  /**
   * Get messages in a conversation
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        parentMessageId: z.string().optional(), // For thread messages
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      // Check access
      const hasAccess = await checkConversationAccess(db, input.conversationId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have access to this conversation",
        });
      }

      // Get messages with attachments and reactions
      const messageList = await db
        .select({
          message: messages,
          attachments: sql<any[]>`
            COALESCE(
              json_agg(
                json_build_object(
                  'id', ma.id,
                  'fileName', ma.file_name,
                  'fileType', ma.file_type,
                  'fileSize', ma.file_size,
                  'fileUrl', ma.file_url,
                  'thumbnailUrl', ma.thumbnail_url
                )
              ) FILTER (WHERE ma.id IS NOT NULL),
              '[]'
            )
          `,
          reactions: sql<any[]>`
            COALESCE(
              json_agg(
                json_build_object(
                  'emoji', mr.emoji,
                  'userId', mr.user_id,
                  'createdAt', mr.created_at
                )
              ) FILTER (WHERE mr.id IS NOT NULL),
              '[]'
            )
          `,
        })
        .from(messages)
        .leftJoin(messageAttachments, eq(messageAttachments.messageId, messages.id))
        .leftJoin(messageReactions, eq(messageReactions.messageId, messages.id))
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
            eq(messages.isDeleted, false),
            input.parentMessageId
              ? eq(messages.parentMessageId, input.parentMessageId)
              : isNull(messages.parentMessageId)
          )
        )
        .groupBy(messages.id)
        .orderBy(desc(messages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return messageList;
    }),

  /**
   * Send message
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1),
        contentType: contentTypeEnum.default('text'),
        parentMessageId: z.string().optional(), // For threaded replies
        attachments: z
          .array(
            z.object({
              fileName: z.string(),
              fileType: z.string(),
              fileSize: z.number(),
              fileUrl: z.string(),
              thumbnailUrl: z.string().optional(),
              width: z.number().optional(),
              height: z.number().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Check access
      const hasAccess = await checkConversationAccess(db, input.conversationId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have access to this conversation",
        });
      }

      // Check if conversation is locked
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (conversation[0]?.isLocked) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This conversation is locked',
        });
      }

      const messageId = uuidv4();

      // Insert message
      await db.insert(messages).values({
        id: messageId,
        conversationId: input.conversationId,
        senderId: ctx.user.id,
        content: input.content,
        contentType: input.contentType,
        parentMessageId: input.parentMessageId,
      });

      // Insert attachments if any
      if (input.attachments && input.attachments.length > 0) {
        await db.insert(messageAttachments).values(
          input.attachments.map((att) => ({
            id: uuidv4(),
            messageId,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
            fileUrl: att.fileUrl,
            thumbnailUrl: att.thumbnailUrl,
            width: att.width,
            height: att.height,
            uploadedById: ctx.user.id,
          }))
        );
      }

      // Update conversation timestamp
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      // Update thread count if reply
      if (input.parentMessageId) {
        await db.execute(sql`
          UPDATE ${messages}
          SET thread_count = thread_count + 1
          WHERE id = ${input.parentMessageId}
        `);
      }

      // TODO: Send push notifications to other participants

      return { messageId };
    }),

  /**
   * Send AI message (with subscription check)
   */
  sendAIMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        prompt: z.string().min(1),
        model: z.string().default('gpt-3.5-turbo'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Check AI limits
      const limitsCheck = await checkAILimits(db, ctx.user.id);

      if (!limitsCheck.allowed) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: limitsCheck.reason || 'AI access denied',
        });
      }

      // Check conversation access
      const hasAccess = await checkConversationAccess(db, input.conversationId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have access to this conversation",
        });
      }

      // TODO: Call OpenAI API
      // For now, simulate response
      const aiResponse = 'AI response simulation';
      const tokensUsed = 100;
      const costInCents = 1;

      const messageId = uuidv4();

      // Insert AI message
      await db.insert(messages).values({
        id: messageId,
        conversationId: input.conversationId,
        senderId: ctx.user.id, // Could be a special AI user
        content: aiResponse,
        contentType: 'text',
        isAiGenerated: true,
        aiModel: input.model,
        aiTokens: tokensUsed,
        aiCost: costInCents,
      });

      // Track usage
      await trackAIUsage(db, ctx.user.id, tokensUsed, costInCents);

      // Update conversation
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      return { messageId, tokensUsed, cost: costInCents };
    }),

  /**
   * Edit message
   */
  editMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Check if user owns the message
      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, input.messageId))
        .limit(1);

      if (message.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      if (message[0].senderId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own messages',
        });
      }

      await db
        .update(messages)
        .set({
          content: input.content,
          isEdited: true,
          updatedAt: new Date(),
        })
        .where(eq(messages.id, input.messageId));

      return { success: true };
    }),

  /**
   * Delete message
   */
  deleteMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Check ownership
      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, input.messageId))
        .limit(1);

      if (message.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      if (message[0].senderId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own messages',
        });
      }

      await db
        .update(messages)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
        })
        .where(eq(messages.id, input.messageId));

      return { success: true };
    }),

  // ==========================================
  // REACTIONS & READ RECEIPTS
  // ==========================================

  /**
   * Add reaction to message
   */
  addReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        emoji: z.string().max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Insert or ignore if already exists
      try {
        await db.insert(messageReactions).values({
          messageId: input.messageId,
          userId: ctx.user.id,
          emoji: input.emoji,
        });
      } catch (error) {
        // Ignore duplicate reactions
      }

      return { success: true };
    }),

  /**
   * Remove reaction
   */
  removeReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        emoji: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      await db
        .delete(messageReactions)
        .where(
          and(
            eq(messageReactions.messageId, input.messageId),
            eq(messageReactions.userId, ctx.user.id),
            eq(messageReactions.emoji, input.emoji)
          )
        );

      return { success: true };
    }),

  /**
   * Mark messages as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        messageIds: z.array(z.string()).optional(), // If not provided, mark all as read
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      if (input.messageIds) {
        // Mark specific messages
        for (const messageId of input.messageIds) {
          await db
            .insert(messageReadReceipts)
            .values({
              messageId,
              userId: ctx.user.id,
            })
            .onConflictDoNothing();
        }
      }

      // Update last read timestamp in participant record
      await db
        .update(conversationParticipants)
        .set({
          lastReadAt: new Date(),
        })
        .where(
          and(
            eq(conversationParticipants.conversationId, input.conversationId),
            eq(conversationParticipants.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // ==========================================
  // TYPING INDICATORS
  // ==========================================

  /**
   * Set typing indicator
   */
  setTyping: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        isTyping: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      if (input.isTyping) {
        // Add or update typing indicator (expires in 10 seconds)
        await db.insert(typingIndicators).values({
          conversationId: input.conversationId,
          userId: ctx.user.id,
          expiresAt: new Date(Date.now() + 10000),
        });
      } else {
        // Remove typing indicator
        await db
          .delete(typingIndicators)
          .where(
            and(
              eq(typingIndicators.conversationId, input.conversationId),
              eq(typingIndicators.userId, ctx.user.id)
            )
          );
      }

      return { success: true };
    }),

  /**
   * Get typing users
   */
  getTypingUsers: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      // Clean up expired indicators first
      await db.delete(typingIndicators).where(lte(typingIndicators.expiresAt, new Date()));

      // Get active typing users
      const typingUsers = await db
        .select({
          userId: typingIndicators.userId,
        })
        .from(typingIndicators)
        .where(
          and(
            eq(typingIndicators.conversationId, input.conversationId),
            gte(typingIndicators.expiresAt, new Date())
          )
        );

      return typingUsers.map((u) => u.userId);
    }),

  // ==========================================
  // PUSH NOTIFICATIONS
  // ==========================================

  /**
   * Register FCM token
   */
  registerPushToken: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        platform: platformEnum,
        deviceId: z.string().optional(),
        deviceName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Deactivate old tokens for this device
      if (input.deviceId) {
        await db
          .update(pushNotificationTokens)
          .set({ isActive: false })
          .where(
            and(
              eq(pushNotificationTokens.userId, ctx.user.id),
              eq(pushNotificationTokens.deviceId, input.deviceId)
            )
          );
      }

      // Insert new token
      await db
        .insert(pushNotificationTokens)
        .values({
          userId: ctx.user.id,
          token: input.token,
          platform: input.platform,
          deviceId: input.deviceId,
          deviceName: input.deviceName,
        })
        .onConflictDoUpdate({
          target: pushNotificationTokens.token,
          set: {
            isActive: true,
            lastUsedAt: new Date(),
          },
        });

      return { success: true };
    }),

  /**
   * Get notification history
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const notifications = await db
        .select()
        .from(notificationHistory)
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            input.unreadOnly ? eq(notificationHistory.isRead, false) : undefined
          )
        )
        .orderBy(desc(notificationHistory.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return notifications;
    }),

  /**
   * Mark notification as read
   */
  markNotificationRead: protectedProcedure
    .input(
      z.object({
        notificationIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      await db
        .update(notificationHistory)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notificationHistory.userId, ctx.user.id),
            inArray(notificationHistory.id, input.notificationIds)
          )
        );

      return { success: true };
    }),

  // ==========================================
  // SUBSCRIPTION MANAGEMENT
  // ==========================================

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans: protectedProcedure.query(async () => {
    const db = await getDb();

    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.monthlyPrice);

    return plans;
  }),

  /**
   * Get user's current subscription
   */
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const subscription = await db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
        usage: aiUsageTracking,
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, userSubscriptions.planId))
      .leftJoin(
        aiUsageTracking,
        and(
          eq(aiUsageTracking.userId, userSubscriptions.userId),
          gte(aiUsageTracking.periodEndDate, new Date())
        )
      )
      .where(and(eq(userSubscriptions.userId, ctx.user.id), eq(userSubscriptions.status, 'active')))
      .limit(1);

    return subscription[0] || null;
  }),

  /**
   * Get AI usage statistics
   */
  getAIUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const usage = await db
      .select()
      .from(aiUsageTracking)
      .where(
        and(eq(aiUsageTracking.userId, ctx.user.id), gte(aiUsageTracking.periodEndDate, new Date()))
      )
      .limit(1);

    return usage[0] || null;
  }),

  // ==========================================
  // SUPPORT TICKETS (specific endpoints)
  // ==========================================

  /**
   * Get support tickets
   */
  getSupportTickets: protectedProcedure
    .input(
      z.object({
        status: ticketStatusEnum.optional(),
        priority: ticketPriorityEnum.optional(),
        assignedToMe: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const tickets = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.type, 'support'),
            input.status ? eq(conversations.ticketStatus, input.status) : undefined,
            input.priority ? eq(conversations.ticketPriority, input.priority) : undefined,
            input.assignedToMe ? eq(conversations.assignedToId, ctx.user.id) : undefined
          )
        )
        .orderBy(desc(conversations.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return tickets;
    }),

  /**
   * Assign support ticket
   */
  assignTicket: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        assignToId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // TODO: Check if user has permission to assign tickets

      await db
        .update(conversations)
        .set({
          assignedToId: input.assignToId,
          ticketStatus: 'in_progress',
          updatedAt: new Date(),
        })
        .where(and(eq(conversations.id, input.ticketId), eq(conversations.type, 'support')));

      return { success: true };
    }),
});
