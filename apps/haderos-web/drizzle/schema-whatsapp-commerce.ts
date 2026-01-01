/**
 * 💬 WhatsApp Commerce Schema
 * نظام التجارة عبر واتساب - قاعدة البيانات
 *
 * Tables:
 * - whatsapp_catalogs: كتالوجات المنتجات
 * - whatsapp_catalog_items: عناصر الكتالوج
 * - whatsapp_carts: سلات التسوق
 * - whatsapp_cart_items: عناصر السلة
 * - whatsapp_conversations: المحادثات
 * - whatsapp_messages: الرسائل
 * - whatsapp_templates: قوالب الرسائل
 * - whatsapp_broadcasts: البث الجماعي
 * - whatsapp_automations: الردود الآلية
 * - whatsapp_quick_replies: الردود السريعة
 */

import { pgTable, text, timestamp, integer, boolean, decimal, jsonb, uuid, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const waMessageTypeEnum = pgEnum("wa_message_type", [
  "text",
  "image",
  "video",
  "audio",
  "document",
  "sticker",
  "location",
  "contact",
  "product",
  "catalog",
  "order",
  "interactive",
  "template"
]);

export const waMessageStatusEnum = pgEnum("wa_message_status", [
  "pending",
  "sent",
  "delivered",
  "read",
  "failed"
]);

export const waConversationStatusEnum = pgEnum("wa_conversation_status", [
  "active",
  "pending",
  "resolved",
  "archived"
]);

export const waBroadcastStatusEnum = pgEnum("wa_broadcast_status", [
  "draft",
  "scheduled",
  "sending",
  "completed",
  "failed",
  "cancelled"
]);

export const waAutomationTriggerEnum = pgEnum("wa_automation_trigger", [
  "keyword",
  "first_message",
  "order_status",
  "cart_abandoned",
  "payment_received",
  "delivery_update",
  "review_request",
  "custom"
]);

// ============================================
// TABLES
// ============================================

/**
 * كتالوجات واتساب
 */
export const whatsappCatalogs = pgTable("whatsapp_catalogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  whatsappCatalogId: text("whatsapp_catalog_id"), // Meta Catalog ID
  coverImageUrl: text("cover_image_url"),
  isActive: boolean("is_active").default(true),
  itemsCount: integer("items_count").default(0),
  lastSyncedAt: timestamp("last_synced_at"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * عناصر الكتالوج
 */
export const whatsappCatalogItems = pgTable("whatsapp_catalog_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  catalogId: uuid("catalog_id").references(() => whatsappCatalogs.id).notNull(),
  productId: uuid("product_id"), // ربط بالمنتج الأصلي
  whatsappItemId: text("whatsapp_item_id"), // Meta Item ID
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }),
  currency: text("currency").default("EGP"),
  imageUrl: text("image_url"),
  availability: text("availability").default("in_stock"), // in_stock, out_of_stock
  condition: text("condition").default("new"), // new, used, refurbished
  retailerId: text("retailer_id"), // SKU
  url: text("url"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * سلات التسوق عبر واتساب
 */
export const whatsappCarts = pgTable("whatsapp_carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id"),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  status: text("status").default("active"), // active, converted, abandoned
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  couponCode: text("coupon_code"),
  notes: text("notes"),
  shippingAddress: jsonb("shipping_address").$type<{
    governorate: string;
    city: string;
    area: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
    landmark: string;
  }>(),
  convertedOrderId: uuid("converted_order_id"),
  expiresAt: timestamp("expires_at"),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * عناصر سلة التسوق
 */
export const whatsappCartItems = pgTable("whatsapp_cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").references(() => whatsappCarts.id).notNull(),
  catalogItemId: uuid("catalog_item_id").references(() => whatsappCatalogItems.id),
  productId: uuid("product_id"),
  name: text("name").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").default(1),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * المحادثات
 */
export const whatsappConversations = pgTable("whatsapp_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id"),
  phoneNumber: text("phone_number").notNull(),
  customerName: text("customer_name"),
  profilePictureUrl: text("profile_picture_url"),
  status: waConversationStatusEnum("status").default("active"),
  assignedTo: uuid("assigned_to"), // Agent ID
  category: text("category"), // sales, support, general
  tags: jsonb("tags").$type<string[]>(),
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: text("last_message_preview"),
  unreadCount: integer("unread_count").default(0),
  isStarred: boolean("is_starred").default(false),
  isPinned: boolean("is_pinned").default(false),
  isMuted: boolean("is_muted").default(false),
  isBlocked: boolean("is_blocked").default(false),
  relatedOrderId: uuid("related_order_id"),
  relatedCartId: uuid("related_cart_id").references(() => whatsappCarts.id),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * الرسائل
 */
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => whatsappConversations.id).notNull(),
  whatsappMessageId: text("whatsapp_message_id"), // Meta Message ID
  direction: text("direction").notNull(), // inbound, outbound
  type: waMessageTypeEnum("type").notNull(),
  status: waMessageStatusEnum("status").default("pending"),

  // المحتوى
  content: text("content"),
  contentAr: text("content_ar"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  mediaMimeType: text("media_mime_type"),
  mediaSize: integer("media_size"),
  mediaCaption: text("media_caption"),

  // للرسائل التفاعلية
  interactiveType: text("interactive_type"), // button, list, product, product_list
  interactiveData: jsonb("interactive_data").$type<any>(),
  buttonReply: text("button_reply"),
  listReply: jsonb("list_reply").$type<{
    id: string;
    title: string;
    description?: string;
  }>(),

  // للمنتجات
  productId: uuid("product_id"),
  catalogId: uuid("catalog_id"),

  // للقوالب
  templateId: uuid("template_id").references(() => whatsappTemplates.id),
  templateParams: jsonb("template_params").$type<Record<string, string>>(),

  // حالات
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  failedAt: timestamp("failed_at"),
  errorMessage: text("error_message"),

  // الرد
  replyToMessageId: uuid("reply_to_message_id"),
  isForwarded: boolean("is_forwarded").default(false),
  isFromBot: boolean("is_from_bot").default(false),

  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * قوالب الرسائل
 */
export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  whatsappTemplateId: text("whatsapp_template_id"),
  category: text("category").notNull(), // marketing, utility, authentication
  language: text("language").default("ar"),
  status: text("status").default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),

  // المكونات
  headerType: text("header_type"), // text, image, video, document
  headerContent: text("header_content"),
  headerMediaUrl: text("header_media_url"),
  bodyContent: text("body_content").notNull(),
  footerContent: text("footer_content"),
  buttons: jsonb("buttons").$type<{
    type: "quick_reply" | "url" | "phone";
    text: string;
    url?: string;
    phone?: string;
  }[]>(),

  // المتغيرات
  variables: jsonb("variables").$type<{
    name: string;
    example: string;
    type: string;
  }[]>(),

  // الإحصائيات
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  readCount: integer("read_count").default(0),
  clickedCount: integer("clicked_count").default(0),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * البث الجماعي
 */
export const whatsappBroadcasts = pgTable("whatsapp_broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  templateId: uuid("template_id").references(() => whatsappTemplates.id),
  status: waBroadcastStatusEnum("status").default("draft"),

  // الجمهور
  audienceType: text("audience_type"), // all, segment, custom
  audienceFilter: jsonb("audience_filter").$type<{
    governorates?: string[];
    hasOrdered?: boolean;
    totalSpent?: { min?: number; max?: number };
    lastOrderDays?: number;
    tags?: string[];
  }>(),
  recipientPhones: jsonb("recipient_phones").$type<string[]>(),

  // المحتوى
  messageType: text("message_type"), // template, text, image
  messageContent: text("message_content"),
  templateParams: jsonb("template_params").$type<Record<string, string>>(),
  mediaUrl: text("media_url"),

  // الجدولة
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),

  // الإحصائيات
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  readCount: integer("read_count").default(0),
  failedCount: integer("failed_count").default(0),
  clickedCount: integer("clicked_count").default(0),

  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * الردود الآلية (Automations)
 */
export const whatsappAutomations = pgTable("whatsapp_automations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  description: text("description"),
  trigger: waAutomationTriggerEnum("trigger").notNull(),

  // شروط التفعيل
  triggerKeywords: jsonb("trigger_keywords").$type<string[]>(),
  triggerConditions: jsonb("trigger_conditions").$type<{
    orderStatus?: string[];
    cartAbandonedMinutes?: number;
    paymentMethod?: string;
    deliveryStatus?: string;
  }>(),

  // الرد
  responseType: text("response_type"), // text, template, interactive, product
  responseContent: text("response_content"),
  responseContentAr: text("response_content_ar"),
  templateId: uuid("template_id").references(() => whatsappTemplates.id),
  interactiveConfig: jsonb("interactive_config").$type<any>(),
  productCatalogId: uuid("product_catalog_id"),

  // الإجراءات الإضافية
  actions: jsonb("actions").$type<{
    assignTo?: string;
    addTags?: string[];
    updateStatus?: string;
    createTask?: boolean;
    notifyTeam?: boolean;
    delay?: number; // seconds
  }>(),

  // التسلسل
  followUpDelay: integer("follow_up_delay"), // seconds
  followUpMessage: text("follow_up_message"),
  maxFollowUps: integer("max_follow_ups").default(1),

  // الإحصائيات
  triggeredCount: integer("triggered_count").default(0),
  sentCount: integer("sent_count").default(0),
  conversionCount: integer("conversion_count").default(0),

  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * الردود السريعة
 */
export const whatsappQuickReplies = pgTable("whatsapp_quick_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  shortcut: text("shortcut").notNull().unique(), // e.g., /hi, /price
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  content: text("content").notNull(),
  contentAr: text("content_ar"),
  category: text("category"), // greeting, pricing, shipping, support
  mediaUrl: text("media_url"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * سجل البث
 */
export const whatsappBroadcastLogs = pgTable("whatsapp_broadcast_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  broadcastId: uuid("broadcast_id").references(() => whatsappBroadcasts.id).notNull(),
  phoneNumber: text("phone_number").notNull(),
  messageId: uuid("message_id").references(() => whatsappMessages.id),
  status: waMessageStatusEnum("status").default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  clickedAt: timestamp("clicked_at"),
  failedAt: timestamp("failed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const whatsappCatalogsRelations = relations(whatsappCatalogs, ({ many }) => ({
  items: many(whatsappCatalogItems),
}));

export const whatsappCatalogItemsRelations = relations(whatsappCatalogItems, ({ one }) => ({
  catalog: one(whatsappCatalogs, {
    fields: [whatsappCatalogItems.catalogId],
    references: [whatsappCatalogs.id],
  }),
}));

export const whatsappCartsRelations = relations(whatsappCarts, ({ many, one }) => ({
  items: many(whatsappCartItems),
  conversation: one(whatsappConversations, {
    fields: [whatsappCarts.id],
    references: [whatsappConversations.relatedCartId],
  }),
}));

export const whatsappConversationsRelations = relations(whatsappConversations, ({ many, one }) => ({
  messages: many(whatsappMessages),
  cart: one(whatsappCarts, {
    fields: [whatsappConversations.relatedCartId],
    references: [whatsappCarts.id],
  }),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  conversation: one(whatsappConversations, {
    fields: [whatsappMessages.conversationId],
    references: [whatsappConversations.id],
  }),
  template: one(whatsappTemplates, {
    fields: [whatsappMessages.templateId],
    references: [whatsappTemplates.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type WhatsappCatalog = typeof whatsappCatalogs.$inferSelect;
export type NewWhatsappCatalog = typeof whatsappCatalogs.$inferInsert;

export type WhatsappCatalogItem = typeof whatsappCatalogItems.$inferSelect;
export type NewWhatsappCatalogItem = typeof whatsappCatalogItems.$inferInsert;

export type WhatsappCart = typeof whatsappCarts.$inferSelect;
export type NewWhatsappCart = typeof whatsappCarts.$inferInsert;

export type WhatsappCartItem = typeof whatsappCartItems.$inferSelect;
export type NewWhatsappCartItem = typeof whatsappCartItems.$inferInsert;

export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type NewWhatsappConversation = typeof whatsappConversations.$inferInsert;

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type NewWhatsappMessage = typeof whatsappMessages.$inferInsert;

export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type NewWhatsappTemplate = typeof whatsappTemplates.$inferInsert;

export type WhatsappBroadcast = typeof whatsappBroadcasts.$inferSelect;
export type NewWhatsappBroadcast = typeof whatsappBroadcasts.$inferInsert;

export type WhatsappAutomation = typeof whatsappAutomations.$inferSelect;
export type NewWhatsappAutomation = typeof whatsappAutomations.$inferInsert;

export type WhatsappQuickReply = typeof whatsappQuickReplies.$inferSelect;
export type NewWhatsappQuickReply = typeof whatsappQuickReplies.$inferInsert;
