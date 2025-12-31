/**
 * Unified Communication System Schema
 * 
 * This schema supports 3 levels of communication:
 * 1. Team Messaging - Internal communication within organizations
 * 2. Customer Support - Support tickets and customer service
 * 3. AI Integration - AI-powered assistance based on subscription plans
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const conversationTypeEnum = pgEnum("conversation_type", [
  "direct",      // محادثة ثنائية
  "group",       // محادثة جماعية
  "support",     // تذكرة دعم
  "ai",          // محادثة مع AI
]);

export const messageTypeEnum = pgEnum("message_type", [
  "text",        // رسالة نصية
  "image",       // صورة
  "file",        // ملف
  "audio",       // صوت
  "video",       // فيديو
  "system",      // رسالة نظامية
]);

export const participantRoleEnum = pgEnum("participant_role", [
  "admin",       // مدير المحادثة
  "member",      // عضو عادي
  "support",     // فريق الدعم
  "customer",    // عميل
]);

export const supportTicketStatusEnum = pgEnum("support_ticket_status", [
  "open",        // مفتوحة
  "in_progress", // قيد المعالجة
  "waiting",     // بانتظار الرد
  "resolved",    // محلولة
  "closed",      // مغلقة
]);

export const supportTicketPriorityEnum = pgEnum("support_ticket_priority", [
  "low",         // منخفضة
  "medium",      // متوسطة
  "high",        // عالية
  "urgent",      // عاجلة
]);

export const aiProviderEnum = pgEnum("ai_provider", [
  "openai",      // OpenAI (GPT-4, GPT-3.5)
  "anthropic",   // Anthropic (Claude)
  "deepseek",    // DeepSeek
  "gemini",      // Google Gemini
  "custom",      // نموذج مخصص
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",        // مجاني - بدون AI
  "basic",       // أساسي - AI محدود
  "professional",// احترافي - AI كامل
  "enterprise",  // مؤسسي - AI + مميزات إضافية
]);

// ============================================================================
// TABLES
// ============================================================================

// 1. جدول المحادثات (Conversations)
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: conversationTypeEnum("type").notNull().default("direct"),
    name: text("name"), // للمجموعات، null للمحادثات الثنائية
    description: text("description"),
    avatar: text("avatar"),
    
    // للتواصل الداخلي
    hierarchyPath: text("hierarchy_path"), // ltree path للكيان
    departmentId: uuid("department_id"), // القسم
    
    // لخدمة العملاء
    ticketNumber: text("ticket_number"), // رقم التذكرة
    ticketStatus: supportTicketStatusEnum("ticket_status"),
    ticketPriority: supportTicketPriorityEnum("ticket_priority"),
    ticketCategory: text("ticket_category"), // فئة المشكلة
    
    // للذكاء الاصطناعي
    aiProvider: aiProviderEnum("ai_provider"),
    aiModel: text("ai_model"), // اسم النموذج المحدد
    aiSystemPrompt: text("ai_system_prompt"), // التعليمات الأساسية للـ AI
    aiContext: jsonb("ai_context").default({}), // سياق المحادثة
    
    // معلومات عامة
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: uuid("created_by").notNull(),
    lastMessageAt: timestamp("last_message_at"),
    lastMessagePreview: text("last_message_preview"),
    
    // الإعدادات
    isArchived: boolean("is_archived").default(false),
    isPinned: boolean("is_pinned").default(false),
    isMuted: boolean("is_muted").default(false),
    
    metadata: jsonb("metadata").default({}),
  },
  (table) => ({
    typeIdx: index("conversations_type_idx").on(table.type),
    hierarchyPathIdx: index("conversations_hierarchy_path_idx").on(table.hierarchyPath),
    ticketNumberIdx: uniqueIndex("conversations_ticket_number_idx").on(table.ticketNumber),
    ticketStatusIdx: index("conversations_ticket_status_idx").on(table.ticketStatus),
    createdByIdx: index("conversations_created_by_idx").on(table.createdBy),
    lastMessageAtIdx: index("conversations_last_message_at_idx").on(table.lastMessageAt),
  })
);

// 2. جدول المشاركين (Conversation Participants)
export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    
    role: participantRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
    
    // إعدادات الإشعارات
    isMuted: boolean("is_muted").default(false),
    mutedUntil: timestamp("muted_until"),
    notificationSettings: jsonb("notification_settings").default({
      desktop: true,
      mobile: true,
      email: false,
    }),
    
    // تتبع القراءة
    lastReadAt: timestamp("last_read_at"),
    lastReadMessageId: uuid("last_read_message_id"),
    
    // الصلاحيات (للمجموعات)
    canSendMessages: boolean("can_send_messages").default(true),
    canAddMembers: boolean("can_add_members").default(false),
    canRemoveMembers: boolean("can_remove_members").default(false),
    canEditConversation: boolean("can_edit_conversation").default(false),
    
    metadata: jsonb("metadata").default({}),
  },
  (table) => ({
    conversationUserIdx: uniqueIndex("conversation_participants_conversation_user_idx").on(
      table.conversationId,
      table.userId
    ),
    userIdIdx: index("conversation_participants_user_id_idx").on(table.userId),
    conversationIdIdx: index("conversation_participants_conversation_id_idx").on(table.conversationId),
  })
);

// 3. جدول الرسائل (Messages)
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull(),
    
    // المحتوى
    content: text("content").notNull(),
    messageType: messageTypeEnum("message_type").notNull().default("text"),
    
    // المرفقات
    attachments: jsonb("attachments").default([]), // [{id, name, type, size, url, thumbnail}]
    
    // الرد على رسالة
    replyToId: uuid("reply_to_id").references((): any => messages.id, { onDelete: "set null" }),
    
    // للرسائل النظامية
    systemAction: text("system_action"), // 'user_added', 'user_removed', 'conversation_created', etc.
    systemData: jsonb("system_data").default({}),
    
    // للذكاء الاصطناعي
    aiGenerated: boolean("ai_generated").default(false),
    aiProvider: aiProviderEnum("ai_provider"),
    aiModel: text("ai_model"),
    aiTokensUsed: integer("ai_tokens_used"),
    aiCost: integer("ai_cost"), // بالسنت
    
    // التحرير والحذف
    edited: boolean("edited").default(false),
    editedAt: timestamp("edited_at"),
    deleted: boolean("deleted").default(false),
    deletedAt: timestamp("deleted_at"),
    deletedBy: uuid("deleted_by"),
    
    // التوقيت
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    
    // الإحصائيات
    readCount: integer("read_count").default(0),
    reactionCount: integer("reaction_count").default(0),
    
    metadata: jsonb("metadata").default({}),
  },
  (table) => ({
    conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
    senderIdIdx: index("messages_sender_id_idx").on(table.senderId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
    replyToIdIdx: index("messages_reply_to_id_idx").on(table.replyToId),
    aiGeneratedIdx: index("messages_ai_generated_idx").on(table.aiGenerated),
  })
);

// 4. جدول حالات القراءة (Message Reads)
export const messageReads = pgTable(
  "message_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    readAt: timestamp("read_at").defaultNow().notNull(),
  },
  (table) => ({
    messageUserIdx: uniqueIndex("message_reads_message_user_idx").on(table.messageId, table.userId),
    messageIdIdx: index("message_reads_message_id_idx").on(table.messageId),
    userIdIdx: index("message_reads_user_id_idx").on(table.userId),
  })
);

// 5. جدول التفاعلات (Message Reactions)
export const messageReactions = pgTable(
  "message_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    messageUserEmojiIdx: uniqueIndex("message_reactions_message_user_emoji_idx").on(
      table.messageId,
      table.userId,
      table.emoji
    ),
    messageIdIdx: index("message_reactions_message_id_idx").on(table.messageId),
  })
);

// 6. جدول المرفقات (Attachments)
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
    
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type"),
    
    fileUrl: text("file_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    
    // للصور
    width: integer("width"),
    height: integer("height"),
    
    // للفيديو/الصوت
    duration: integer("duration"), // بالثواني
    
    metadata: jsonb("metadata").default({}),
  },
  (table) => ({
    messageIdIdx: index("attachments_message_id_idx").on(table.messageId),
    conversationIdIdx: index("attachments_conversation_id_idx").on(table.conversationId),
    uploadedByIdx: index("attachments_uploaded_by_idx").on(table.uploadedBy),
  })
);

// 7. جدول حالة الكتابة (Typing Indicators)
export const typingIndicators = pgTable(
  "typing_indicators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(), // ينتهي بعد 5 ثواني
  },
  (table) => ({
    conversationUserIdx: uniqueIndex("typing_indicators_conversation_user_idx").on(
      table.conversationId,
      table.userId
    ),
    expiresAtIdx: index("typing_indicators_expires_at_idx").on(table.expiresAt),
  })
);

// 8. جدول استخدام AI (AI Usage Tracking)
// Starred Conversations - تثبيت المحادثات
export const starredConversations = pgTable(
  "starred_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    starredAt: timestamp("starred_at").defaultNow().notNull(),
    notes: text("notes"),
    metadata: jsonb("metadata").default({}).notNull(),
  },
  (table) => ({
    conversationIdx: index("starred_conversations_conversation_idx").on(
      table.conversationId
    ),
    userIdx: index("starred_conversations_user_idx").on(table.userId),
    uniqueStarred: uniqueIndex("starred_conversations_unique").on(
      table.conversationId,
      table.userId
    ),
  })
);

// Pinned Messages - تثبيت الرسائل
export const pinnedMessages = pgTable(
  "pinned_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    pinnedBy: uuid("pinned_by").notNull(),
    pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata").default({}).notNull(),
  },
  (table) => ({
    conversationIdx: index("pinned_messages_conversation_idx").on(
      table.conversationId
    ),
    messageIdx: index("pinned_messages_message_idx").on(table.messageId),
    uniquePinned: uniqueIndex("pinned_messages_unique").on(
      table.conversationId,
      table.messageId
    ),
  })
);

// Ticket Notes - ملاحظات داخلية للتذاكر
export const ticketNotes = pgTable(
  "ticket_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").notNull(),
    content: text("content").notNull(),
    isInternal: boolean("is_internal").default(true).notNull(), // Only visible to support team
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
  },
  (table) => ({
    conversationIdx: index("ticket_notes_conversation_idx").on(
      table.conversationId
    ),
    authorIdx: index("ticket_notes_author_idx").on(table.authorId),
    createdAtIdx: index("ticket_notes_created_at_idx").on(table.createdAt),
  })
);

// Ticket History - تاريخ التغييرات
export const ticketHistory = pgTable(
  "ticket_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    action: text("action").notNull(), // 'status_changed', 'priority_changed', 'assigned', 'unassigned', etc.
    oldValue: text("old_value"),
    newValue: text("new_value"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
  },
  (table) => ({
    conversationIdx: index("ticket_history_conversation_idx").on(
      table.conversationId
    ),
    userIdx: index("ticket_history_user_idx").on(table.userId),
    actionIdx: index("ticket_history_action_idx").on(table.action),
    createdAtIdx: index("ticket_history_created_at_idx").on(table.createdAt),
  })
);

// Notifications - إشعارات شاملة
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    type: text("type").notNull(), // 'message', 'mention', 'reaction', 'ticket_assigned', etc.
    title: text("title").notNull(),
    body: text("body").notNull(),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "set null",
    }),
    messageId: uuid("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    actionUrl: text("action_url"),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at"),
    isSent: boolean("is_sent").default(false).notNull(),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    metadata: jsonb("metadata").default({}).notNull(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    typeIdx: index("notifications_type_idx").on(table.type),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    conversationIdx: index("notifications_conversation_idx").on(
      table.conversationId
    ),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  })
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    organizationId: uuid("organization_id"),
    hierarchyPath: text("hierarchy_path"),
    
    conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
    messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
    
    provider: aiProviderEnum("provider").notNull(),
    model: text("model").notNull(),
    
    promptTokens: integer("prompt_tokens").notNull(),
    completionTokens: integer("completion_tokens").notNull(),
    totalTokens: integer("total_tokens").notNull(),
    
    cost: integer("cost").notNull(), // بالسنت
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    
    metadata: jsonb("metadata").default({}),
  },
  (table) => ({
    userIdIdx: index("ai_usage_user_id_idx").on(table.userId),
    organizationIdIdx: index("ai_usage_organization_id_idx").on(table.organizationId),
    hierarchyPathIdx: index("ai_usage_hierarchy_path_idx").on(table.hierarchyPath),
    createdAtIdx: index("ai_usage_created_at_idx").on(table.createdAt),
  })
);

// 9. جدول حدود الاشتراك (Subscription Limits)
export const subscriptionLimits = pgTable(
  "subscription_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    hierarchyPath: text("hierarchy_path"),
    
    plan: subscriptionPlanEnum("plan").notNull().default("free"),
    
    // حدود الرسائل
    maxMessagesPerMonth: integer("max_messages_per_month"),
    messagesUsedThisMonth: integer("messages_used_this_month").default(0),
    
    // حدود المرفقات
    maxStorageGB: integer("max_storage_gb"),
    storageUsedGB: integer("storage_used_gb").default(0),
    
    // حدود AI
    aiEnabled: boolean("ai_enabled").default(false),
    maxAiTokensPerMonth: integer("max_ai_tokens_per_month"),
    aiTokensUsedThisMonth: integer("ai_tokens_used_this_month").default(0),
    allowedAiProviders: jsonb("allowed_ai_providers").default(["openai"]),
    
    // حدود خدمة العملاء
    supportEnabled: boolean("support_enabled").default(false),
    maxOpenTickets: integer("max_open_tickets"),
    currentOpenTickets: integer("current_open_tickets").default(0),
    
    // التواريخ
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    
    metadata: jsonb("metadata").default({}),
  },
  (table) => ({
    organizationIdIdx: index("subscription_limits_organization_id_idx").on(table.organizationId),
    hierarchyPathIdx: index("subscription_limits_hierarchy_path_idx").on(table.hierarchyPath),
    planIdx: index("subscription_limits_plan_idx").on(table.plan),
  })
);

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

// Conversations
export const insertConversationSchema = createInsertSchema(conversations);
export const selectConversationSchema = createSelectSchema(conversations);
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = z.infer<typeof selectConversationSchema>;

// Conversation Participants
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants);
export const selectConversationParticipantSchema = createSelectSchema(conversationParticipants);
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type ConversationParticipant = z.infer<typeof selectConversationParticipantSchema>;

// Messages
export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = z.infer<typeof selectMessageSchema>;

// Message Reads
export const insertMessageReadSchema = createInsertSchema(messageReads);
export const selectMessageReadSchema = createSelectSchema(messageReads);
export type InsertMessageRead = z.infer<typeof insertMessageReadSchema>;
export type MessageRead = z.infer<typeof selectMessageReadSchema>;

// Message Reactions
export const insertMessageReactionSchema = createInsertSchema(messageReactions);
export const selectMessageReactionSchema = createSelectSchema(messageReactions);
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageReaction = z.infer<typeof selectMessageReactionSchema>;

// Attachments
export const insertAttachmentSchema = createInsertSchema(attachments);
export const selectAttachmentSchema = createSelectSchema(attachments);
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = z.infer<typeof selectAttachmentSchema>;

// Typing Indicators
export const insertTypingIndicatorSchema = createInsertSchema(typingIndicators);
export const selectTypingIndicatorSchema = createSelectSchema(typingIndicators);
export type InsertTypingIndicator = z.infer<typeof insertTypingIndicatorSchema>;
export type TypingIndicator = z.infer<typeof selectTypingIndicatorSchema>;

// AI Usage
export const insertAiUsageSchema = createInsertSchema(aiUsage);
export const selectAiUsageSchema = createSelectSchema(aiUsage);
export type InsertAiUsage = z.infer<typeof insertAiUsageSchema>;
export type AiUsage = z.infer<typeof selectAiUsageSchema>;

// Subscription Limits
export const insertSubscriptionLimitSchema = createInsertSchema(subscriptionLimits);
export const selectSubscriptionLimitSchema = createSelectSchema(subscriptionLimits);
export type InsertSubscriptionLimit = z.infer<typeof insertSubscriptionLimitSchema>;
export type SubscriptionLimit = z.infer<typeof selectSubscriptionLimitSchema>;
