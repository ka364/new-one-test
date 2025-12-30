import { int, mysqlTable, text, timestamp, varchar, json, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * Product Image Requests - طلبات صور المنتجات
 * نظام طلب صور المنتجات من فريق الإنتاج
 */
export const productImageRequests = mysqlTable("product_image_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestNumber: varchar("requestNumber", { length: 50 }).notNull().unique(),
  requestedBy: int("requestedBy").notNull().references(() => users.id),
  productName: varchar("productName", { length: 255 }).notNull(),
  productDescription: text("productDescription"),
  productSKU: varchar("productSKU", { length: 100 }),
  
  // تفاصيل الطلب
  imageType: mysqlEnum("imageType", [
    "product_photo",
    "lifestyle",
    "detail_shot",
    "360_view",
    "video",
    "infographic"
  ]).notNull(),
  quantity: int("quantity").default(1).notNull(), // عدد الصور المطلوبة
  specifications: json("specifications"), // مواصفات خاصة (زوايا، خلفية، إلخ)
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  deadline: timestamp("deadline"),
  notes: text("notes"),
  
  // حالة الطلب
  status: mysqlEnum("status", [
    "pending",
    "assigned",
    "in_progress",
    "review",
    "completed",
    "cancelled"
  ]).default("pending").notNull(),
  assignedTo: int("assignedTo").references(() => users.id),
  assignedAt: timestamp("assignedAt"),
  
  // الصور المنجزة
  completedImages: json("completedImages").$type<Array<{
    url: string;
    filename: string;
    uploadedAt: string;
    notes?: string;
  }>>(),
  completedAt: timestamp("completedAt"),
  
  // التقييم
  rating: int("rating"), // 1-5
  feedback: text("feedback"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Content Calendar - تقويم المحتوى
 * جدولة المنشورات والمحتوى
 */
export const contentCalendar = mysqlTable("content_calendar", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  
  // معلومات المحتوى
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  description: text("description"),
  contentType: mysqlEnum("contentType", [
    "social_post",
    "blog_article",
    "video",
    "infographic",
    "newsletter",
    "ad_campaign"
  ]).notNull(),
  platform: varchar("platform", { length: 100 }), // Instagram, Facebook, TikTok, etc.
  
  // الجدولة
  scheduledDate: timestamp("scheduledDate").notNull(),
  publishedDate: timestamp("publishedDate"),
  status: mysqlEnum("status", [
    "draft",
    "scheduled",
    "published",
    "archived"
  ]).default("draft").notNull(),
  
  // المحتوى
  content: text("content"),
  hashtags: json("hashtags").$type<string[]>(),
  mediaFiles: json("mediaFiles").$type<Array<{
    type: string;
    url: string;
    filename: string;
  }>>(),
  
  // الأداء
  views: int("views").default(0),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  clicks: int("clicks").default(0),
  engagementRate: varchar("engagementRate", { length: 10 }), // نسبة التفاعل
  
  // الربط
  relatedCampaignId: int("relatedCampaignId"),
  relatedProductId: int("relatedProductId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Content Templates - قوالب المحتوى
 * قوالب جاهزة للمحتوى
 */
export const contentTemplates = mysqlTable("content_templates", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  
  templateName: varchar("templateName", { length: 255 }).notNull(),
  templateNameAr: varchar("templateNameAr", { length: 255 }),
  description: text("description"),
  category: varchar("category", { length: 100 }), // "promotional", "educational", "engagement", etc.
  
  contentType: mysqlEnum("contentType", [
    "social_post",
    "blog_article",
    "video_script",
    "email",
    "ad_copy"
  ]).notNull(),
  
  templateContent: text("templateContent").notNull(),
  placeholders: json("placeholders").$type<Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
  }>>(),
  
  // الاستخدام
  usageCount: int("usageCount").default(0).notNull(),
  lastUsed: timestamp("lastUsed"),
  
  isPublic: boolean("isPublic").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Team Notifications - إشعارات الفريق
 * نظام إشعارات للتنسيق بين الأقسام
 */
export const teamNotifications = mysqlTable("team_notifications", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull().references(() => users.id),
  toUserId: int("toUserId").references(() => users.id),
  toDepartment: varchar("toDepartment", { length: 100 }), // "production", "marketing", "sales", etc.
  
  notificationType: mysqlEnum("notificationType", [
    "image_request",
    "content_approval",
    "task_assignment",
    "deadline_reminder",
    "feedback_request",
    "general"
  ]).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  message: text("message").notNull(),
  messageAr: text("messageAr"),
  
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // "product_image_request", "content_calendar", etc.
  relatedEntityId: int("relatedEntityId"),
  
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  
  actionRequired: boolean("actionRequired").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductImageRequest = typeof productImageRequests.$inferSelect;
export type InsertProductImageRequest = typeof productImageRequests.$inferInsert;

export type ContentCalendar = typeof contentCalendar.$inferSelect;
export type InsertContentCalendar = typeof contentCalendar.$inferInsert;

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = typeof contentTemplates.$inferInsert;

export type TeamNotification = typeof teamNotifications.$inferSelect;
export type InsertTeamNotification = typeof teamNotifications.$inferInsert;
