import { getDb } from "./db";
import {
  productImageRequests,
  InsertProductImageRequest,
  contentCalendar,
  InsertContentCalendar,
  contentTemplates,
  InsertContentTemplate,
  teamNotifications,
  InsertTeamNotification,
} from "../drizzle/schema-content-creator";
import { eq, desc, and, gte, lte, like, or } from "drizzle-orm";

// ============================================
// PRODUCT IMAGE REQUESTS
// ============================================

export async function getAllImageRequests(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(productImageRequests)
    .orderBy(desc(productImageRequests.createdAt))
    .limit(limit);
}

export async function getImageRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(productImageRequests)
    .where(eq(productImageRequests.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getImageRequestsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(productImageRequests)
    .where(eq(productImageRequests.requestedBy, userId))
    .orderBy(desc(productImageRequests.createdAt))
    .limit(limit);
}

export async function getImageRequestsByStatus(status: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(productImageRequests)
    .where(eq(productImageRequests.status, status as any))
    .orderBy(desc(productImageRequests.createdAt))
    .limit(limit);
}

export async function createImageRequest(data: InsertProductImageRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(productImageRequests).values(data);
}

export async function updateImageRequestStatus(
  id: number,
  status: string,
  assignedTo?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };
  
  if (assignedTo) {
    updateData.assignedTo = assignedTo;
    updateData.assignedAt = new Date();
  }
  
  if (status === "completed") {
    updateData.completedAt = new Date();
  }
  
  return await db
    .update(productImageRequests)
    .set(updateData)
    .where(eq(productImageRequests.id, id));
}

export async function addCompletedImages(
  id: number,
  images: Array<{ url: string; filename: string; uploadedAt: string; notes?: string }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(productImageRequests)
    .set({
      completedImages: images as any,
      status: "review" as any,
      updatedAt: new Date(),
    })
    .where(eq(productImageRequests.id, id));
}

export async function rateImageRequest(id: number, rating: number, feedback?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(productImageRequests)
    .set({
      rating,
      feedback,
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(productImageRequests.id, id));
}

// ============================================
// CONTENT CALENDAR
// ============================================

export async function getAllContentCalendar(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(contentCalendar)
    .orderBy(desc(contentCalendar.scheduledDate))
    .limit(limit);
}

export async function getContentCalendarById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(contentCalendar)
    .where(eq(contentCalendar.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getContentCalendarByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(contentCalendar)
    .where(
      and(
        gte(contentCalendar.scheduledDate, startDate),
        lte(contentCalendar.scheduledDate, endDate)
      )
    )
    .orderBy(contentCalendar.scheduledDate);
}

export async function getContentCalendarByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(contentCalendar)
    .where(eq(contentCalendar.createdBy, userId))
    .orderBy(desc(contentCalendar.scheduledDate))
    .limit(limit);
}

export async function createContentCalendar(data: InsertContentCalendar) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(contentCalendar).values(data);
}

export async function updateContentCalendarStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };
  
  if (status === "published") {
    updateData.publishedDate = new Date();
  }
  
  return await db
    .update(contentCalendar)
    .set(updateData)
    .where(eq(contentCalendar.id, id));
}

export async function updateContentMetrics(
  id: number,
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(contentCalendar)
    .set({
      ...metrics,
      updatedAt: new Date(),
    })
    .where(eq(contentCalendar.id, id));
}

// ============================================
// CONTENT TEMPLATES
// ============================================

export async function getAllContentTemplates(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(contentTemplates)
    .where(eq(contentTemplates.isActive, true))
    .orderBy(desc(contentTemplates.usageCount))
    .limit(limit);
}

export async function getContentTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(contentTemplates)
    .where(eq(contentTemplates.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getContentTemplatesByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(contentTemplates)
    .where(
      and(
        eq(contentTemplates.category, category),
        eq(contentTemplates.isActive, true)
      )
    )
    .orderBy(desc(contentTemplates.usageCount));
}

export async function createContentTemplate(data: InsertContentTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(contentTemplates).values(data);
}

export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const template = await getContentTemplateById(id);
  if (!template) return;
  
  return await db
    .update(contentTemplates)
    .set({
      usageCount: (template.usageCount || 0) + 1,
      lastUsed: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(contentTemplates.id, id));
}

// ============================================
// TEAM NOTIFICATIONS
// ============================================

export async function getAllTeamNotifications(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(teamNotifications)
    .orderBy(desc(teamNotifications.createdAt))
    .limit(limit);
}

export async function getTeamNotificationsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(teamNotifications)
    .where(eq(teamNotifications.toUserId, userId))
    .orderBy(desc(teamNotifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(teamNotifications)
    .where(
      and(
        eq(teamNotifications.toUserId, userId),
        eq(teamNotifications.isRead, false)
      )
    )
    .orderBy(desc(teamNotifications.createdAt));
}

export async function createTeamNotification(data: InsertTeamNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(teamNotifications).values(data);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(teamNotifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(eq(teamNotifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(teamNotifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(eq(teamNotifications.toUserId, userId));
}
