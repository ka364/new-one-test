// @ts-nocheck
/**
 * Unified Communication Router
 *
 * Supports 3 levels of communication:
 * 1. Team Messaging - Internal communication
 * 2. Customer Support - Support tickets
 * 3. AI Integration - AI-powered assistance
 * 
 * All features are subscription-based
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, asc, inArray, sql, or, not, gte, lte, like } from "drizzle-orm";

const superAdminProcedure = adminProcedure; // alias for compatibility

// Lazy load schema and db
let conversations: any, conversationParticipants: any, messages: any;
let messageReads: any, messageReactions: any, attachments: any;
let typingIndicators: any, aiUsage: any, subscriptionLimits: any;
let starredConversations: any, notifications: any;

type Conversation = any;
type Message = any;

// Try to load schema
try {
  const schema = require("../../drizzle/schema-unified-communication");
  conversations = schema.conversations;
  conversationParticipants = schema.conversationParticipants;
  messages = schema.messages;
  messageReads = schema.messageReads;
  messageReactions = schema.messageReactions;
  attachments = schema.attachments;
  typingIndicators = schema.typingIndicators;
  aiUsage = schema.aiUsage;
  subscriptionLimits = schema.subscriptionLimits;
  starredConversations = schema.starredConversations;
  notifications = schema.notifications;
} catch {
  // Schema not available
}

// Get database instance
let db: any = null;
getDb().then(d => { db = d; }).catch(() => {});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has access to a conversation
 */
async function checkConversationAccess(conversationId: string, userId: string) {
  const participant = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
    .limit(1);

  if (!participant.length) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this conversation",
    });
  }

  return participant[0];
}

/**
 * Check subscription limits
 */
async function checkSubscriptionLimits(
  organizationId: string,
  type: "messages" | "ai" | "support" | "storage"
) {
  const limits = await db
    .select()
    .from(subscriptionLimits)
    .where(eq(subscriptionLimits.organizationId, organizationId))
    .limit(1);

  if (!limits.length) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No subscription found for this organization",
    });
  }

  const limit = limits[0];
  const now = new Date();

  // Check if period has expired
  if (now > limit.periodEnd) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Subscription period has expired",
    });
  }

  // Check specific limits
  switch (type) {
    case "messages":
      if (
        limit.maxMessagesPerMonth &&
        limit.messagesUsedThisMonth >= limit.maxMessagesPerMonth
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Monthly message limit reached",
        });
      }
      break;

    case "ai":
      if (!limit.aiEnabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "AI features are not enabled for your plan",
        });
      }
      if (
        limit.maxAiTokensPerMonth &&
        limit.aiTokensUsedThisMonth >= limit.maxAiTokensPerMonth
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Monthly AI token limit reached",
        });
      }
      break;

    case "support":
      if (!limit.supportEnabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Support features are not enabled for your plan",
        });
      }
      if (
        limit.maxOpenTickets &&
        limit.currentOpenTickets >= limit.maxOpenTickets
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Maximum open tickets limit reached",
        });
      }
      break;

    case "storage":
      if (
        limit.maxStorageGB &&
        limit.storageUsedGB >= limit.maxStorageGB
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Storage limit reached",
        });
      }
      break;
  }

  return limit;
}

/**
 * Increment usage counter
 */
async function incrementUsage(
  organizationId: string,
  type: "messages" | "ai" | "storage",
  amount: number = 1
) {
  const field =
    type === "messages"
      ? subscriptionLimits.messagesUsedThisMonth
      : type === "ai"
      ? subscriptionLimits.aiTokensUsedThisMonth
      : subscriptionLimits.storageUsedGB;

  await db
    .update(subscriptionLimits)
    .set({
      [field.name]: sql`${field} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionLimits.organizationId, organizationId));
}

// ============================================================================
// ROUTER
// ============================================================================

export const unifiedCommunicationRouter = router({
  // ========================================================================
  // CONVERSATIONS
  // ========================================================================

  /**
   * Create a new conversation
   */
  createConversation: protectedProcedure
    .input(
      z.object({
        type: z.enum(["direct", "group", "support", "ai"]),
        name: z.string().optional(),
        description: z.string().optional(),
        userIds: z.array(z.string().uuid()).optional(),
        hierarchyPath: z.string().optional(),
        departmentId: z.string().uuid().optional(),
        
        // For support tickets
        ticketPriority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        ticketCategory: z.string().optional(),
        
        // For AI conversations
        aiProvider: z.enum(["openai", "anthropic", "deepseek", "gemini", "custom"]).optional(),
        aiModel: z.string().optional(),
        aiSystemPrompt: z.string().optional(),
        
        initialMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const organizationId = ctx.user.organizationId;

      // Check subscription limits
      if (input.type === "support") {
        await checkSubscriptionLimits(organizationId, "support");
      } else if (input.type === "ai") {
        await checkSubscriptionLimits(organizationId, "ai");
      } else {
        await checkSubscriptionLimits(organizationId, "messages");
      }

      // For direct conversations, check if conversation already exists
      if (input.type === "direct" && input.userIds && input.userIds.length === 1) {
        const otherUserId = input.userIds[0];
        const allUserIds = [userId, otherUserId].sort();

        const existing = await db
          .select({ id: conversations.id })
          .from(conversations)
          .innerJoin(
            conversationParticipants,
            eq(conversations.id, conversationParticipants.conversationId)
          )
          .where(
            and(
              eq(conversations.type, "direct"),
              inArray(conversationParticipants.userId, allUserIds)
            )
          )
          .groupBy(conversations.id)
          .having(sql`COUNT(DISTINCT ${conversationParticipants.userId}) = 2`);

        if (existing.length > 0) {
          return { conversation: existing[0], isNew: false };
        }
      }

      // Generate ticket number for support conversations
      let ticketNumber: string | undefined;
      if (input.type === "support") {
        const count = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(conversations)
          .where(eq(conversations.type, "support"));
        ticketNumber = `TICKET-${String(count[0].count + 1).padStart(6, "0")}`;
      }

      // Create conversation
      const [conversation] = await db
        .insert(conversations)
        .values({
          type: input.type,
          name: input.name,
          description: input.description,
          hierarchyPath: input.hierarchyPath,
          departmentId: input.departmentId,
          ticketNumber,
          ticketStatus: input.type === "support" ? "open" : undefined,
          ticketPriority: input.ticketPriority,
          ticketCategory: input.ticketCategory,
          aiProvider: input.aiProvider,
          aiModel: input.aiModel,
          aiSystemPrompt: input.aiSystemPrompt,
          createdBy: userId,
          lastMessageAt: new Date(),
        })
        .returning();

      // Add participants
      const participantIds = input.userIds || [];
      if (!participantIds.includes(userId)) {
        participantIds.push(userId);
      }

      const participantsData = participantIds.map((id) => ({
        conversationId: conversation.id,
        userId: id,
        role:
          id === userId && input.type === "group"
            ? ("admin" as const)
            : input.type === "support" && id !== userId
            ? ("support" as const)
            : ("member" as const),
      }));

      await db.insert(conversationParticipants).values(participantsData);

      // Add initial message if provided
      if (input.initialMessage) {
        await db.insert(messages).values({
          conversationId: conversation.id,
          senderId: userId,
          content: input.initialMessage,
          messageType: "text",
        });

        // Increment usage
        await incrementUsage(organizationId, "messages");
      }

      // Increment support ticket counter
      if (input.type === "support") {
        await db
          .update(subscriptionLimits)
          .set({
            currentOpenTickets: sql`${subscriptionLimits.currentOpenTickets} + 1`,
          })
          .where(eq(subscriptionLimits.organizationId, organizationId));
      }

      return { conversation, isNew: true };
    }),

  /**
   * Get user's conversations
   */
  getConversations: protectedProcedure
    .input(
      z.object({
        type: z.enum(["direct", "group", "support", "ai", "all"]).default("all"),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
        hierarchyPath: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Build query
      let query = db
        .select({
          conversation: conversations,
          participant: conversationParticipants,
          unreadCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${messages}
            WHERE ${messages.conversationId} = ${conversations.id}
              AND ${messages.createdAt} > COALESCE(${conversationParticipants.lastReadAt}, '1970-01-01'::timestamp)
              AND ${messages.senderId} != ${userId}
          )`,
        })
        .from(conversationParticipants)
        .innerJoin(
          conversations,
          eq(conversationParticipants.conversationId, conversations.id)
        )
        .where(eq(conversationParticipants.userId, userId))
        .orderBy(desc(conversations.lastMessageAt))
        .limit(input.limit)
        .offset(input.offset);

      // Apply filters
      const conditions: any[] = [eq(conversationParticipants.userId, userId)];

      if (input.type !== "all") {
        conditions.push(eq(conversations.type, input.type));
      }

      if (input.hierarchyPath) {
        conditions.push(eq(conversations.hierarchyPath, input.hierarchyPath));
      }

      if (input.search) {
        conditions.push(
          or(
            like(conversations.name, `%${input.search}%`),
            like(conversations.description, `%${input.search}%`),
            like(conversations.ticketNumber, `%${input.search}%`)
          )
        );
      }

      const results = await db
        .select({
          conversation: conversations,
          participant: conversationParticipants,
          unreadCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${messages}
            WHERE ${messages.conversationId} = ${conversations.id}
              AND ${messages.createdAt} > COALESCE(${conversationParticipants.lastReadAt}, '1970-01-01'::timestamp)
              AND ${messages.senderId} != ${userId}
          )`,
        })
        .from(conversationParticipants)
        .innerJoin(
          conversations,
          eq(conversationParticipants.conversationId, conversations.id)
        )
        .where(and(...conditions))
        .orderBy(desc(conversations.lastMessageAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Get conversation details
   */
  getConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access
      await checkConversationAccess(input.conversationId, userId);

      // Get conversation with participants
      const result = await db
        .select({
          conversation: conversations,
          participants: sql<any[]>`JSON_AGG(
            JSON_BUILD_OBJECT(
              'userId', ${conversationParticipants.userId},
              'role', ${conversationParticipants.role},
              'joinedAt', ${conversationParticipants.joinedAt},
              'isMuted', ${conversationParticipants.isMuted},
              'lastReadAt', ${conversationParticipants.lastReadAt}
            )
          )`,
        })
        .from(conversations)
        .leftJoin(
          conversationParticipants,
          eq(conversations.id, conversationParticipants.conversationId)
        )
        .where(eq(conversations.id, input.conversationId))
        .groupBy(conversations.id);

      if (!result.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      return result[0];
    }),

  /**
   * Update conversation
   */
  updateConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        avatar: z.string().optional(),
        ticketStatus: z.enum(["open", "in_progress", "waiting", "resolved", "closed"]).optional(),
        ticketPriority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access and permissions
      const participant = await checkConversationAccess(input.conversationId, userId);

      if (!participant.canEditConversation && participant.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to edit this conversation",
        });
      }

      // Update conversation
      const [updated] = await db
        .update(conversations)
        .set({
          name: input.name,
          description: input.description,
          avatar: input.avatar,
          ticketStatus: input.ticketStatus,
          ticketPriority: input.ticketPriority,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, input.conversationId))
        .returning();

      // If closing a support ticket, decrement counter
      if (input.ticketStatus === "closed") {
        const conv = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, input.conversationId))
          .limit(1);

        if (conv[0].type === "support") {
          await db
            .update(subscriptionLimits)
            .set({
              currentOpenTickets: sql`GREATEST(0, ${subscriptionLimits.currentOpenTickets} - 1)`,
            })
            .where(eq(subscriptionLimits.organizationId, ctx.user.organizationId));
        }
      }

      return updated;
    }),

  /**
   * Delete/Archive conversation
   */
  deleteConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        archive: z.boolean().default(true), // Archive instead of delete
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access
      const participant = await checkConversationAccess(input.conversationId, userId);

      if (participant.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete conversations",
        });
      }

      if (input.archive) {
        // Archive conversation
        await db
          .update(conversations)
          .set({
            isArchived: true,
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, input.conversationId));
      } else {
        // Delete conversation (cascade will handle related records)
        await db
          .delete(conversations)
          .where(eq(conversations.id, input.conversationId));
      }

      return { success: true };
    }),

  // ========================================================================
  // MESSAGES
  // ========================================================================

  /**
   * Send a message
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1),
        messageType: z.enum(["text", "image", "file", "audio", "video"]).default("text"),
        attachments: z.array(z.object({
          fileName: z.string(),
          fileType: z.string(),
          fileSize: z.number(),
          fileUrl: z.string(),
          thumbnailUrl: z.string().optional(),
        })).optional(),
        replyToId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const organizationId = ctx.user.organizationId;

      // Check access
      const participant = await checkConversationAccess(input.conversationId, userId);

      if (!participant.canSendMessages) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to send messages",
        });
      }

      // Check subscription limits
      await checkSubscriptionLimits(organizationId, "messages");

      // Create message
      const [message] = await db
        .insert(messages)
        .values({
          conversationId: input.conversationId,
          senderId: userId,
          content: input.content,
          messageType: input.messageType,
          attachments: input.attachments || [],
          replyToId: input.replyToId,
        })
        .returning();

      // Update conversation last message
      await db
        .update(conversations)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: input.content.substring(0, 100),
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, input.conversationId));

      // Increment usage
      await incrementUsage(organizationId, "messages");

      return message;
    }),

  /**
   * Get messages for a conversation
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        before: z.string().uuid().optional(), // Message ID for pagination
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access
      await checkConversationAccess(input.conversationId, userId);

      // Build query
      const conditions: any[] = [eq(messages.conversationId, input.conversationId)];

      if (input.before) {
        const beforeMessage = await db
          .select({ createdAt: messages.createdAt })
          .from(messages)
          .where(eq(messages.id, input.before))
          .limit(1);

        if (beforeMessage.length) {
          conditions.push(lte(messages.createdAt, beforeMessage[0].createdAt));
        }
      }

      // Get messages
      const results = await db
        .select({
          message: messages,
          readBy: sql<any[]>`(
            SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'userId', ${messageReads.userId},
                'readAt', ${messageReads.readAt}
              )
            )
            FROM ${messageReads}
            WHERE ${messageReads.messageId} = ${messages.id}
          )`,
          reactions: sql<any[]>`(
            SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'userId', ${messageReactions.userId},
                'emoji', ${messageReactions.emoji},
                'createdAt', ${messageReactions.createdAt}
              )
            )
            FROM ${messageReactions}
            WHERE ${messageReactions.messageId} = ${messages.id}
          )`,
        })
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(input.limit);

      return results;
    }),

  // ========================================================================
  // STARRED CONVERSATIONS
  // ========================================================================

  /**
   * Star a conversation
   */
  starConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access
      await checkConversationAccess(input.conversationId, userId);

      // Star conversation
      const [starred] = await db
        .insert(starredConversations)
        .values({
          conversationId: input.conversationId,
          userId,
          notes: input.notes,
        })
        .onConflictDoUpdate({
          target: [starredConversations.conversationId, starredConversations.userId],
          set: {
            notes: input.notes,
            starredAt: new Date(),
          },
        })
        .returning();

      return starred;
    }),

  /**
   * Unstar a conversation
   */
  unstarConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      await db
        .delete(starredConversations)
        .where(
          and(
            eq(starredConversations.conversationId, input.conversationId),
            eq(starredConversations.userId, userId)
          )
        );

      return { success: true };
    }),

  /**
   * Get starred conversations
   */
  getStarredConversations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const results = await db
        .select({
          starred: starredConversations,
          conversation: conversations,
        })
        .from(starredConversations)
        .innerJoin(
          conversations,
          eq(starredConversations.conversationId, conversations.id)
        )
        .where(eq(starredConversations.userId, userId))
        .orderBy(desc(starredConversations.starredAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  // ========================================================================
  // PINNED MESSAGES
  // ========================================================================

  /**
   * Pin a message
   */
  pinMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        messageId: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access and permissions
      const participant = await checkConversationAccess(input.conversationId, userId);

      if (participant.role !== "admin" && !participant.canEditConversation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to pin messages",
        });
      }

      // Pin message
      const [pinned] = await db
        .insert(pinnedMessages)
        .values({
          conversationId: input.conversationId,
          messageId: input.messageId,
          pinnedBy: userId,
          reason: input.reason,
        })
        .onConflictDoUpdate({
          target: [pinnedMessages.conversationId, pinnedMessages.messageId],
          set: {
            pinnedBy: userId,
            pinnedAt: new Date(),
            reason: input.reason,
          },
        })
        .returning();

      return pinned;
    }),

  /**
   * Unpin a message
   */
  unpinMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        messageId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access and permissions
      const participant = await checkConversationAccess(input.conversationId, userId);

      if (participant.role !== "admin" && !participant.canEditConversation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to unpin messages",
        });
      }

      await db
        .delete(pinnedMessages)
        .where(
          and(
            eq(pinnedMessages.conversationId, input.conversationId),
            eq(pinnedMessages.messageId, input.messageId)
          )
        );

      return { success: true };
    }),

  /**
   * Get pinned messages for a conversation
   */
  getPinnedMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access
      await checkConversationAccess(input.conversationId, userId);

      const results = await db
        .select({
          pinned: pinnedMessages,
          message: messages,
        })
        .from(pinnedMessages)
        .innerJoin(messages, eq(pinnedMessages.messageId, messages.id))
        .where(eq(pinnedMessages.conversationId, input.conversationId))
        .orderBy(desc(pinnedMessages.pinnedAt));

      return results;
    }),

  // ========================================================================
  // TICKET NOTES (Internal Notes for Support Tickets)
  // ========================================================================

  /**
   * Add internal note to support ticket
   */
  addTicketNote: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1),
        isInternal: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access
      const participant = await checkConversationAccess(input.conversationId, userId);

      // Only support team can add internal notes
      if (input.isInternal && participant.role !== "support" && participant.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only support team can add internal notes",
        });
      }

      // Verify it's a support conversation
      const conv = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conv.length || conv[0].type !== "support") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This is not a support conversation",
        });
      }

      // Add note
      const [note] = await db
        .insert(ticketNotes)
        .values({
          conversationId: input.conversationId,
          authorId: userId,
          content: input.content,
          isInternal: input.isInternal,
        })
        .returning();

      return note;
    }),

  /**
   * Get ticket notes
   */
  getTicketNotes: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        includeInternal: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access
      const participant = await checkConversationAccess(input.conversationId, userId);

      // Build query
      const conditions: any[] = [eq(ticketNotes.conversationId, input.conversationId)];

      // Only support team can see internal notes
      if (!input.includeInternal || (participant.role !== "support" && participant.role !== "admin")) {
        conditions.push(eq(ticketNotes.isInternal, false));
      }

      const results = await db
        .select()
        .from(ticketNotes)
        .where(and(...conditions))
        .orderBy(desc(ticketNotes.createdAt));

      return results;
    }),

  // ========================================================================
  // TICKET HISTORY
  // ========================================================================

  /**
   * Add ticket history entry
   */
  addTicketHistory: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        action: z.string(),
        oldValue: z.string().optional(),
        newValue: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access
      await checkConversationAccess(input.conversationId, userId);

      const [history] = await db
        .insert(ticketHistory)
        .values({
          conversationId: input.conversationId,
          userId,
          action: input.action,
          oldValue: input.oldValue,
          newValue: input.newValue,
          description: input.description,
        })
        .returning();

      return history;
    }),

  /**
   * Get ticket history
   */
  getTicketHistory: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check access
      await checkConversationAccess(input.conversationId, userId);

      const results = await db
        .select()
        .from(ticketHistory)
        .where(eq(ticketHistory.conversationId, input.conversationId))
        .orderBy(desc(ticketHistory.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  // ========================================================================
  // NOTIFICATIONS
  // ========================================================================

  /**
   * Create notification
   */
  createNotification: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.string(),
        title: z.string(),
        body: z.string(),
        conversationId: z.string().uuid().optional(),
        messageId: z.string().uuid().optional(),
        actionUrl: z.string().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          conversationId: input.conversationId,
          messageId: input.messageId,
          actionUrl: input.actionUrl,
          expiresAt: input.expiresAt,
        })
        .returning();

      return notification;
    }),

  /**
   * Get user notifications
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const conditions: any[] = [eq(notifications.userId, userId)];

      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      // Don't show expired notifications
      conditions.push(
        or(
          eq(notifications.expiresAt, null),
          gte(notifications.expiresAt, new Date())
        )
      );

      const results = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Mark notification as read
   */
  markNotificationAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const [updated] = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, userId)
          )
        )
        .returning();

      return updated;
    }),

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return { success: true };
  }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          or(
            eq(notifications.expiresAt, null),
            gte(notifications.expiresAt, new Date())
          )
        )
      );

    return { count: result[0].count };
  }),

  // Continue in next part...
});
