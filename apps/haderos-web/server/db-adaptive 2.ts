import { getDb } from './db.js';
import {
  userBehavior,
  taskPatterns,
  userPreferences,
  dynamicIcons,
  aiSuggestions,
  googleDriveFiles,
} from '../drizzle/schema.js';
import { eq, desc, and, gte } from 'drizzle-orm';

// Helper to ensure db connection
async function getConnection() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return db;
}

// ============================================
// TASK PATTERNS
// ============================================

export async function getAllTaskPatterns(limit?: number) {
  const db = await getConnection();
  const query = db.select().from(taskPatterns).orderBy(desc(taskPatterns.frequency));
  return limit ? query.limit(limit) : query;
}

export async function getTaskPatternsByUser(userId: number) {
  const db = await getConnection();
  return db
    .select()
    .from(taskPatterns)
    .where(eq(taskPatterns.userId, userId))
    .orderBy(desc(taskPatterns.frequency));
}

// ============================================
// AI SUGGESTIONS
// ============================================

export async function getAllAiSuggestions(limit?: number) {
  const db = await getConnection();
  const query = db.select().from(aiSuggestions).orderBy(desc(aiSuggestions.createdAt));
  return limit ? query.limit(limit) : query;
}

export async function getAiSuggestionsByUser(userId: number) {
  const db = await getConnection();
  return db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.userId, userId))
    .orderBy(desc(aiSuggestions.createdAt));
}

export async function getPendingAiSuggestions(userId: number) {
  const db = await getConnection();
  return db
    .select()
    .from(aiSuggestions)
    .where(and(eq(aiSuggestions.userId, userId), eq(aiSuggestions.status, 'pending')))
    .orderBy(desc(aiSuggestions.confidence));
}

// ============================================
// DYNAMIC ICONS
// ============================================

export async function getAllDynamicIcons(limit?: number) {
  const db = await getConnection();
  const query = db.select().from(dynamicIcons).orderBy(desc(dynamicIcons.usageCount));
  return limit ? query.limit(limit) : query;
}

export async function getDynamicIconsByUser(userId: number) {
  const db = await getConnection();
  return db
    .select()
    .from(dynamicIcons)
    .where(eq(dynamicIcons.userId, userId))
    .orderBy(desc(dynamicIcons.usageCount));
}

// ============================================
// USER BEHAVIOR
// ============================================

export async function getUserBehaviorHistory(userId: number, limit: number = 100) {
  const db = await getConnection();
  return db
    .select()
    .from(userBehavior)
    .where(eq(userBehavior.userId, userId))
    .orderBy(desc(userBehavior.timestamp))
    .limit(limit);
}

export async function getRecentUserBehavior(userId: number, hours: number = 24) {
  const db = await getConnection();
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select()
    .from(userBehavior)
    .where(and(eq(userBehavior.userId, userId), gte(userBehavior.timestamp, cutoffTime)))
    .orderBy(desc(userBehavior.timestamp));
}

// ============================================
// USER PREFERENCES
// ============================================

export async function getUserPreferences(userId: number) {
  const db = await getConnection();
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function updateUserPreferences(userId: number, preferences: Record<string, any>) {
  const db = await getConnection();
  const existing = await getUserPreferences(userId);

  if (existing) {
    return db
      .update(userPreferences)
      .set({
        customSettings: preferences,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  } else {
    return db.insert(userPreferences).values({
      userId,
      customSettings: preferences,
    });
  }
}

// ============================================
// GOOGLE DRIVE FILES
// ============================================

export async function getAllGoogleDriveFiles() {
  const db = await getConnection();
  return db.select().from(googleDriveFiles).orderBy(desc(googleDriveFiles.createdAt));
}

export async function getGoogleDriveFilesByUser(userId: number) {
  const db = await getConnection();
  return db
    .select()
    .from(googleDriveFiles)
    .where(eq(googleDriveFiles.userId, userId))
    .orderBy(desc(googleDriveFiles.createdAt));
}

export async function getGoogleDriveFilesByType(fileType: string) {
  const db = await getConnection();
  return db
    .select()
    .from(googleDriveFiles)
    .where(eq(googleDriveFiles.fileType, fileType))
    .orderBy(desc(googleDriveFiles.createdAt));
}
