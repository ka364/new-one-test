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