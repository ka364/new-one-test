import { int, mysqlTable, text, timestamp, varchar, json, boolean, decimal, date } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * User Behavior Tracking - تتبع سلوك المستخدم
 * يسجل كل تفاعل للمستخدم مع النظام للتعلم والتكيف
 */
export const userBehavior = mysqlTable("user_behavior", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  actionType: varchar("actionType", { length: 100 }).notNull(), // "chat_message", "icon_click", "file_create", etc.
  actionData: json("actionData"), // تفاصيل الإجراء
  context: json("context"), // السياق (الوقت، الصفحة، إلخ)
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

/**
 * Task Patterns - أنماط المهام
 * يحلل المهام المتكررة ويقترح أيقونات جديدة
 */
export const taskPatterns = mysqlTable("task_patterns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  taskType: varchar("taskType", { length: 100 }).notNull(), // "create_invoice", "request_images", etc.
  taskName: varchar("taskName", { length: 255 }).notNull(),
  taskNameAr: varchar("taskNameAr", { length: 255 }),
  frequency: int("frequency").default(0).notNull(), // عدد مرات التكرار
  lastUsed: timestamp("lastUsed").defaultNow().notNull(),
  avgTimeSpent: int("avgTimeSpent"), // متوسط الوقت بالثواني
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0.00"), // ثقة النظام في هذا النمط
  suggestedIcon: varchar("suggestedIcon", { length: 50 }), // اسم الأيقونة المقترحة
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * User Preferences - تفضيلات المستخدم
 * يخزن تفضيلات كل مستخدم للواجهة والمهام
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("ar").notNull(),
  theme: varchar("theme", { length: 20 }).default("light").notNull(),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  autoSuggestIcons: boolean("autoSuggestIcons").default(true).notNull(), // السماح بالاقتراحات التلقائية
  customSettings: json("customSettings"), // إعدادات مخصصة إضافية
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Dynamic Icons - الأيقونات الديناميكية
 * الأيقونات المخصصة لكل مستخدم بناءً على سلوكه
 */
export const dynamicIcons = mysqlTable("dynamic_icons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  iconName: varchar("iconName", { length: 100 }).notNull(),
  iconNameAr: varchar("iconNameAr", { length: 100 }),
  iconEmoji: varchar("iconEmoji", { length: 10 }).notNull(), // 📋, 📊, 📸, etc.
  taskType: varchar("taskType", { length: 100 }).notNull(),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  actionConfig: json("actionConfig").notNull(), // تكوين الإجراء عند الضغط
  usageCount: int("usageCount").default(0).notNull(),
  lastUsed: timestamp("lastUsed"),
  isVisible: boolean("isVisible").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(), // ترتيب العرض
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * AI Suggestions - اقتراحات الذكاء الاصطناعي
 * الاقتراحات التي يقدمها النظام للمستخدم
 */
export const aiSuggestions = mysqlTable("ai_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  suggestionType: varchar("suggestionType", { length: 100 }).notNull(), // "new_icon", "workflow_improvement", etc.
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  suggestionData: json("suggestionData").notNull(), // تفاصيل الاقتراح
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // مستوى الثقة
  status: varchar("status", { length: 50 }).default("pending").notNull(), // "pending", "accepted", "rejected", "dismissed"
  userFeedback: text("userFeedback"), // ملاحظات المستخدم
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
});

/**
 * Google Drive Files - ملفات Google Drive
 * تتبع الملفات المنشأة في Google Drive
 */
export const googleDriveFiles = mysqlTable("google_drive_files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // "sheet", "doc", "folder", etc.
  filePath: text("filePath").notNull(), // المسار الكامل في Google Drive
  shareableLink: text("shareableLink"), // رابط المشاركة
  purpose: varchar("purpose", { length: 255 }), // الغرض من الملف
  metadata: json("metadata"), // بيانات إضافية
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastModified: timestamp("lastModified").defaultNow().onUpdateNow().notNull(),
});

export type UserBehavior = typeof userBehavior.$inferSelect;
export type InsertUserBehavior = typeof userBehavior.$inferInsert;

export type TaskPattern = typeof taskPatterns.$inferSelect;
export type InsertTaskPattern = typeof taskPatterns.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

export type DynamicIcon = typeof dynamicIcons.$inferSelect;
export type InsertDynamicIcon = typeof dynamicIcons.$inferInsert;

export type AISuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAISuggestion = typeof aiSuggestions.$inferInsert;

export type GoogleDriveFile = typeof googleDriveFiles.$inferSelect;
export type InsertGoogleDriveFile = typeof googleDriveFiles.$inferInsert;
