/**
 * 📨 Unified Messaging System Schema
 *
 * Three-tier communication system:
 * 1. Internal Messaging (Team Communication)
 * 2. Customer Support (Support Tickets)
 * 3. AI Assistant (Subscription-based)
 *
 * Features:
 * - Real-time messaging
 * - File attachments
 * - Message reactions
 * - Read receipts
 * - Typing indicators
 * - Message threads
 * - Push notifications (FCM)
 * - Subscription-based AI access
 */

import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  serial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================
// 1. CONVERSATIONS (Channels/Threads)
// ============================================

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    type: varchar("type", { length: 50 }).notNull(), // 'team', 'support', 'ai', 'direct'

    // For team conversations
    organizationId: integer("organization_id").references(() => users.id),
    departmentId: varchar("department_id", { length: 100 }),

    // For support conversations
    ticketNumber: varchar("ticket_number", { length: 50 }),
    ticketStatus: varchar("ticket_status", { length: 50 }), // 'open', 'in_progress', 'resolved', 'closed'
    ticketPriority: varchar("ticket_priority", { length: 20 }), // 'low', 'medium', 'high', 'urgent'
    ticketCategory: varchar("ticket_category", { length: 100 }),
    assignedToId: integer("assigned_to_id").references(() => users.id),

    // For AI conversations
    aiModel: varchar("ai_model", { length: 50 }), // 'gpt-4', 'gpt-3.5-turbo', etc.
    aiPersona: varchar("ai_persona", { length: 100 }), // 'assistant', 'advisor', 'coach'

    title: varchar("title", { length: 255 }),
    description: text("description"),

    // Metadata
    isArchived: boolean("is_archived").default(false),
    isPinned: boolean("is_pinned").default(false),
    isLocked: boolean("is_locked").default(false), // Prevent new messages

    metadata: jsonb("metadata").default("{}"), // Custom fields

    createdById: integer("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    closedAt: timestamp("closed_at"),
  },
  (table) => ({
    typeIdx: index("conversations_type_idx").on(table.type),
    orgIdx: index("conversations_org_idx").on(table.organizationId),
    ticketNumIdx: uniqueIndex("conversations_ticket_num_idx").on(table.ticketNumber),
    statusIdx: index("conversations_status_idx").on(table.ticketStatus),
    assignedIdx: index("conversations_assigned_idx").on(table.assignedToId),
    createdByIdx: index("conversations_created_by_idx").on(table.createdById),
  })
);

// ============================================
// 2. CONVERSATION PARTICIPANTS
// ============================================

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: serial("id").primaryKey(),
    conversationId: varchar("conversation_id", { length: 36 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    role: varchar("role", { length: 50 }).default("member"), // 'admin', 'member', 'viewer'

    // Notification settings
    isMuted: boolean("is_muted").default(false),
    mutedUntil: timestamp("muted_until"),

    // Read status
    lastReadAt: timestamp("last_read_at"),
    lastReadMessageId: varchar("last_read_message_id", { length: 36 }),

    joinedAt: timestamp("joined_at").defaultNow(),
    leftAt: timestamp("left_at"),
  },
  (table) => ({
    conversationIdx: index("participants_conversation_idx").on(table.conversationId),
    userIdx: index("participants_user_idx").on(table.userId),
    uniqueParticipant: uniqueIndex("participants_unique_idx").on(
      table.conversationId,
      table.userId
    ),
  })
);

// ============================================
// 3. MESSAGES
// ============================================

export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    conversationId: varchar("conversation_id", { length: 36 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),

    senderId: integer("sender_id").notNull().references(() => users.id),

    // Message content
    content: text("content").notNull(),
    contentType: varchar("content_type", { length: 50 }).default("text"), // 'text', 'html', 'markdown'

    // AI-specific
    isAiGenerated: boolean("is_ai_generated").default(false),
    aiModel: varchar("ai_model", { length: 50 }),
    aiTokens: integer("ai_tokens"),
    aiCost: integer("ai_cost"), // in cents

    // Thread support
    parentMessageId: varchar("parent_message_id", { length: 36 }).references(() => messages.id),
    threadCount: integer("thread_count").default(0),

    // Status
    isEdited: boolean("is_edited").default(false),
    isDeleted: boolean("is_deleted").default(false),
    deletedAt: timestamp("deleted_at"),

    // Metadata
    metadata: jsonb("metadata").default("{}"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    conversationIdx: index("messages_conversation_idx").on(table.conversationId),
    senderIdx: index("messages_sender_idx").on(table.senderId),
    parentIdx: index("messages_parent_idx").on(table.parentMessageId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  })
);

// ============================================
// 4. MESSAGE ATTACHMENTS
// ============================================

export const messageAttachments = pgTable(
  "message_attachments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    messageId: varchar("message_id", { length: 36 })
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),

    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 100 }).notNull(), // MIME type
    fileSize: integer("file_size").notNull(), // bytes
    fileUrl: varchar("file_url", { length: 500 }).notNull(),

    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),

    // For images
    width: integer("width"),
    height: integer("height"),

    uploadedById: integer("uploaded_by_id").notNull().references(() => users.id),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
  },
  (table) => ({
    messageIdx: index("attachments_message_idx").on(table.messageId),
  })
);

// ============================================
// 5. MESSAGE REACTIONS
// ============================================

export const messageReactions = pgTable(
  "message_reactions",
  {
    id: serial("id").primaryKey(),
    messageId: varchar("message_id", { length: 36 })
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    emoji: varchar("emoji", { length: 20 }).notNull(), // '👍', '❤️', '😂', etc.

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    messageIdx: index("reactions_message_idx").on(table.messageId),
    userIdx: index("reactions_user_idx").on(table.userId),
    uniqueReaction: uniqueIndex("reactions_unique_idx").on(
      table.messageId,
      table.userId,
      table.emoji
    ),
  })
);

// ============================================
// 6. READ RECEIPTS
// ============================================

export const messageReadReceipts = pgTable(
  "message_read_receipts",
  {
    id: serial("id").primaryKey(),
    messageId: varchar("message_id", { length: 36 })
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    readAt: timestamp("read_at").defaultNow(),
  },
  (table) => ({
    messageIdx: index("read_receipts_message_idx").on(table.messageId),
    userIdx: index("read_receipts_user_idx").on(table.userId),
    uniqueReceipt: uniqueIndex("read_receipts_unique_idx").on(table.messageId, table.userId),
  })
);

// ============================================
// 7. TYPING INDICATORS
// ============================================

export const typingIndicators = pgTable(
  "typing_indicators",
  {
    id: serial("id").primaryKey(),
    conversationId: varchar("conversation_id", { length: 36 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    startedAt: timestamp("started_at").defaultNow(),
    expiresAt: timestamp("expires_at").notNull(), // Auto-expire after 10 seconds
  },
  (table) => ({
    conversationIdx: index("typing_conversation_idx").on(table.conversationId),
    expiresIdx: index("typing_expires_idx").on(table.expiresAt),
  })
);

// ============================================
// 8. PUSH NOTIFICATION TOKENS (FCM)
// ============================================

export const pushNotificationTokens = pgTable(
  "push_notification_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    token: varchar("token", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 20 }).notNull(), // 'web', 'ios', 'android'
    deviceId: varchar("device_id", { length: 100 }),
    deviceName: varchar("device_name", { length: 255 }),

    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").defaultNow(),
    lastUsedAt: timestamp("last_used_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("push_tokens_user_idx").on(table.userId),
    tokenIdx: uniqueIndex("push_tokens_token_idx").on(table.token),
    activeIdx: index("push_tokens_active_idx").on(table.isActive),
  })
);

// ============================================
// 9. NOTIFICATION HISTORY
// ============================================

export const notificationHistory = pgTable(
  "notification_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

    type: varchar("type", { length: 50 }).notNull(), // 'message', 'mention', 'reaction', 'ticket_update'
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),

    conversationId: varchar("conversation_id", { length: 36 }).references(() => conversations.id),
    messageId: varchar("message_id", { length: 36 }).references(() => messages.id),

    // FCM response
    fcmMessageId: varchar("fcm_message_id", { length: 255 }),
    fcmResponse: jsonb("fcm_response"),

    // Status
    isRead: boolean("is_read").default(false),
    readAt: timestamp("read_at"),

    // Click action
    actionUrl: varchar("action_url", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    conversationIdx: index("notifications_conversation_idx").on(table.conversationId),
  })
);

// ============================================
// 10. AI USAGE TRACKING (for subscription limits)
// ============================================

export const aiUsageTracking = pgTable(
  "ai_usage_tracking",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id").references(() => users.id),

    // Subscription info
    subscriptionTier: varchar("subscription_tier", { length: 50 }).notNull(), // 'free', 'basic', 'premium', 'enterprise'

    // Usage
    messagesThisMonth: integer("messages_this_month").default(0),
    tokensThisMonth: integer("tokens_this_month").default(0),
    costThisMonth: integer("cost_this_month").default(0), // in cents

    // Limits
    monthlyMessageLimit: integer("monthly_message_limit").notNull(),
    monthlyTokenLimit: integer("monthly_token_limit").notNull(),
    monthlyBudget: integer("monthly_budget").notNull(), // in cents

    // Reset date
    periodStartDate: timestamp("period_start_date").notNull(),
    periodEndDate: timestamp("period_end_date").notNull(),

    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("ai_usage_user_idx").on(table.userId),
    orgIdx: index("ai_usage_org_idx").on(table.organizationId),
    tierIdx: index("ai_usage_tier_idx").on(table.subscriptionTier),
    periodIdx: index("ai_usage_period_idx").on(table.periodStartDate, table.periodEndDate),
  })
);

// ============================================
// 11. SUBSCRIPTION PLANS
// ============================================

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),

  tier: varchar("tier", { length: 50 }).notNull().unique(), // 'free', 'basic', 'premium', 'enterprise'
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),

  // AI Limits
  aiMessagesPerMonth: integer("ai_messages_per_month").notNull(),
  aiTokensPerMonth: integer("ai_tokens_per_month").notNull(),
  aiMonthlyBudget: integer("ai_monthly_budget").notNull(), // in cents

  // Available AI models
  availableModels: jsonb("available_models").default("[]"), // ['gpt-3.5-turbo', 'gpt-4']

  // Features
  features: jsonb("features").default("{}"),

  // Pricing
  monthlyPrice: integer("monthly_price").notNull(), // in cents
  yearlyPrice: integer("yearly_price"),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// 12. USER SUBSCRIPTIONS
// ============================================

export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id").references(() => users.id),

    planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),

    status: varchar("status", { length: 50 }).notNull(), // 'active', 'cancelled', 'expired', 'suspended'
    billingCycle: varchar("billing_cycle", { length: 20 }).notNull(), // 'monthly', 'yearly'

    // Dates
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    cancelledAt: timestamp("cancelled_at"),

    // Payment
    amount: integer("amount").notNull(), // in cents
    currency: varchar("currency", { length: 3 }).default("EGP"),

    paymentMethod: varchar("payment_method", { length: 50 }),
    lastPaymentDate: timestamp("last_payment_date"),
    nextPaymentDate: timestamp("next_payment_date"),

    // Auto-renewal
    autoRenew: boolean("auto_renew").default(true),

    metadata: jsonb("metadata").default("{}"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdx: index("subscriptions_user_idx").on(table.userId),
    orgIdx: index("subscriptions_org_idx").on(table.organizationId),
    statusIdx: index("subscriptions_status_idx").on(table.status),
    endDateIdx: index("subscriptions_end_date_idx").on(table.endDate),
  })
);

// Reference to users table (should exist in main schema)
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // ... other user fields
});
