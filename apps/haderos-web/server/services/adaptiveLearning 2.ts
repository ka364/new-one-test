import { requireDb } from '../db';
import {
  userBehavior,
  taskPatterns,
  userPreferences,
  dynamicIcons,
  aiSuggestions,
} from '../../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Adaptive Learning Service
 * خدمة التعلم التكيفي - تتبع السلوك واكتشاف الأنماط
 */

/**
 * تسجيل سلوك المستخدم
 */
export async function trackUserBehavior(
  userId: number,
  actionType: string,
  actionData?: any,
  context?: any
): Promise<void> {
  const db = await requireDb();
  if (!db) return;

  const behavior: typeof userBehavior.$inferInsert = {
    userId,
    actionType,
    actionData: actionData ? JSON.stringify(actionData) : null,
    context: context ? JSON.stringify(context) : null,
  };

  await db.insert(userBehavior).values(behavior);

  // تحليل الأنماط بعد كل 10 إجراءات
  const behaviorCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(userBehavior)
    .where(eq(userBehavior.userId, userId));

  if (behaviorCount[0]?.count && behaviorCount[0].count % 10 === 0) {
    await analyzeUserPatterns(userId);
  }
}

/**
 * تحليل أنماط سلوك المستخدم
 */
export async function analyzeUserPatterns(userId: number): Promise<void> {
  const db = await requireDb();
  if (!db) return;

  // الحصول على آخر 100 إجراء
  const recentBehaviors = await db
    .select()
    .from(userBehavior)
    .where(eq(userBehavior.userId, userId))
    .orderBy(desc(userBehavior.timestamp))
    .limit(100);

  // تجميع الإجراءات حسب النوع
  const actionCounts: Record<string, number> = {};
  recentBehaviors.forEach((behavior) => {
    actionCounts[behavior.actionType] = (actionCounts[behavior.actionType] || 0) + 1;
  });

  // اكتشاف الأنماط المتكررة (أكثر من 5 مرات)
  for (const [actionType, count] of Object.entries(actionCounts)) {
    if (count >= 5) {
      await updateOrCreateTaskPattern(userId, actionType, count);
    }
  }

  // اقتراح أيقونات جديدة للمهام المتكررة
  await suggestNewIcons(userId);
}

/**
 * تحديث أو إنشاء نمط مهمة
 */
async function updateOrCreateTaskPattern(
  userId: number,
  taskType: string,
  frequency: number
): Promise<void> {
  const db = await requireDb();
  if (!db) return;

  // البحث عن نمط موجود
  const existing = await db
    .select()
    .from(taskPatterns)
    .where(and(eq(taskPatterns.userId, userId), eq(taskPatterns.taskType, taskType)))
    .limit(1);

  if (existing.length > 0) {
    // تحديث النمط الموجود
    await db
      .update(taskPatterns)
      .set({
        frequency,
        lastUsed: sql`NOW()`,
        confidence: Math.min(99.99, (frequency / 10) * 100).toString(), // زيادة الثقة مع التكرار
      })
      .where(eq(taskPatterns.id, existing[0].id));
  } else {
    // إنشاء نمط جديد
    const pattern: typeof taskPatterns.$inferInsert = {
      userId,
      taskType,
      taskName: formatTaskName(taskType),
      taskNameAr: formatTaskNameAr(taskType),
      frequency,
      confidence: ((frequency / 10) * 100).toString(),
      suggestedIcon: suggestIconForTask(taskType),
    };

    await db.insert(taskPatterns).values(pattern);
  }
}

/**
 * اقتراح أيقونات جديدة بناءً على الأنماط
 */
async function suggestNewIcons(userId: number): Promise<void> {
  const db = await requireDb();
  if (!db) return;

  // الحصول على الأنماط ذات الثقة العالية (> 70%)
  const patterns = await db
    .select()
    .from(taskPatterns)
    .where(
      and(
        eq(taskPatterns.userId, userId),
        eq(taskPatterns.isActive, 1),
        sql`${taskPatterns.confidence} > 70`
      )
    );

  // التحقق من الأيقونات الموجودة
  const existingIcons = await db.select().from(dynamicIcons).where(eq(dynamicIcons.userId, userId));

  const existingTaskTypes = new Set(existingIcons.map((icon) => icon.taskType));

  // اقتراح أيقونات للأنماط الجديدة
  for (const pattern of patterns) {
    if (!existingTaskTypes.has(pattern.taskType)) {
      await createAISuggestion(userId, pattern);
    }
  }
}

/**
 * إنشاء اقتراح ذكي للمستخدم
 */
async function createAISuggestion(
  userId: number,
  pattern: typeof taskPatterns.$inferSelect
): Promise<void> {
  const db = await requireDb();
  if (!db) return;

  const suggestion: typeof aiSuggestions.$inferInsert = {
    userId,
    suggestionType: 'new_icon',
    title: `Add quick action for ${pattern.taskName}`,
    titleAr: `إضافة إجراء سريع لـ ${pattern.taskNameAr}`,
    description: `We noticed you frequently ${pattern.taskName}. Would you like a quick action icon?`,
    descriptionAr: `لاحظنا أنك تقوم بـ ${pattern.taskNameAr} بشكل متكرر. هل تريد أيقونة سريعة؟`,
    suggestionData: JSON.stringify({
      taskType: pattern.taskType,
      frequency: pattern.frequency,
      suggestedIcon: pattern.suggestedIcon,
    }),
    confidence: pattern.confidence || '0',
  };

  await db.insert(aiSuggestions).values(suggestion);
}

/**
 * قبول اقتراح وإنشاء أيقونة ديناميكية
 */
export async function acceptSuggestion(suggestionId: number, userId: number): Promise<void> {
  const db = await requireDb();
  if (!db) return;

  // الحصول على الاقتراح
  const suggestion = await db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.id, suggestionId))
    .limit(1);

  if (suggestion.length === 0 || suggestion[0].userId !== userId) {
    throw new Error('Suggestion not found or unauthorized');
  }

  // Parse suggestion data - handle both string and object
  const suggestionData =
    typeof suggestion[0].suggestionData === 'string'
      ? JSON.parse(suggestion[0].suggestionData)
      : suggestion[0].suggestionData;

  // إنشاء الأيقونة الديناميكية
  const icon: typeof dynamicIcons.$inferInsert = {
    userId,
    iconName: formatTaskName(suggestionData.taskType),
    iconNameAr: formatTaskNameAr(suggestionData.taskType),
    iconEmoji: suggestionData.suggestedIcon || '📋',
    taskType: suggestionData.taskType,
    description: `Quick action for ${formatTaskName(suggestionData.taskType)}`,
    descriptionAr: `إجراء سريع لـ ${formatTaskNameAr(suggestionData.taskType)}`,
    actionConfig: JSON.stringify({ type: suggestionData.taskType }),
    displayOrder: await getNextDisplayOrder(userId),
  };

  await db.insert(dynamicIcons).values(icon);

  // تحديث حالة الاقتراح
  await db
    .update(aiSuggestions)
    .set({ status: 'accepted', respondedAt: sql`NOW()` })
    .where(eq(aiSuggestions.id, suggestionId));
}

/**
 * رفض اقتراح
 */
export async function rejectSuggestion(
  suggestionId: number,
  userId: number,
  feedback?: string
): Promise<void> {
  const db = await requireDb();
  if (!db) return;

  await db
    .update(aiSuggestions)
    .set({
      status: 'rejected',
      respondedAt: sql`NOW()`,
      userFeedback: feedback || null,
    })
    .where(and(eq(aiSuggestions.id, suggestionId), eq(aiSuggestions.userId, userId)));
}

/**
 * الحصول على الأيقونات الديناميكية للمستخدم
 */
export async function getUserDynamicIcons(userId: number) {
  const db = await requireDb();
  if (!db) return [];

  return await db
    .select()
    .from(dynamicIcons)
    .where(and(eq(dynamicIcons.userId, userId), eq(dynamicIcons.isVisible, 1)))
    .orderBy(dynamicIcons.displayOrder);
}

/**
 * الحصول على الاقتراحات المعلقة
 */
export async function getPendingSuggestions(userId: number) {
  const db = await requireDb();
  if (!db) return [];

  return await db
    .select()
    .from(aiSuggestions)
    .where(and(eq(aiSuggestions.userId, userId), eq(aiSuggestions.status, 'pending')))
    .orderBy(desc(aiSuggestions.confidence));
}

/**
 * تحديث عداد استخدام الأيقونة
 */
export async function incrementIconUsage(iconId: number, userId: number): Promise<void> {
  const db = await requireDb();
  if (!db) return;

  await db
    .update(dynamicIcons)
    .set({
      usageCount: sql`${dynamicIcons.usageCount} + 1`,
      lastUsed: sql`NOW()`,
    })
    .where(and(eq(dynamicIcons.id, iconId), eq(dynamicIcons.userId, userId)));
}

// Helper functions

function formatTaskName(taskType: string): string {
  return taskType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTaskNameAr(taskType: string): string {
  const translations: Record<string, string> = {
    create_invoice: 'إنشاء فاتورة',
    request_images: 'طلب صور',
    daily_report: 'تقرير يومي',
    create_content: 'إنشاء محتوى',
    track_order: 'تتبع طلب',
    financial_transaction: 'معاملة مالية',
    performance_analysis: 'تحليل أداء',
  };

  return translations[taskType] || formatTaskName(taskType);
}

function suggestIconForTask(taskType: string): string {
  const iconMap: Record<string, string> = {
    create_invoice: '📋',
    request_images: '📸',
    daily_report: '📊',
    create_content: '📢',
    track_order: '📦',
    financial_transaction: '💰',
    performance_analysis: '📈',
  };

  return iconMap[taskType] || '⚡';
}

async function getNextDisplayOrder(userId: number): Promise<number> {
  const db = await requireDb();
  if (!db) return 0;

  const result = await db
    .select({ maxOrder: sql<number>`MAX(${dynamicIcons.displayOrder})` })
    .from(dynamicIcons)
    .where(eq(dynamicIcons.userId, userId));

  return (result[0]?.maxOrder || 0) + 1;
}

/**
 * Admin functions for manager dashboard
 */
export async function getAllTaskPatterns(limit = 100) {
  const db = await requireDb();
  if (!db) return [];
  return await db.select().from(taskPatterns).orderBy(desc(taskPatterns.frequency)).limit(limit);
}

export async function getAllAiSuggestions(limit = 100) {
  const db = await requireDb();
  if (!db) return [];
  return await db.select().from(aiSuggestions).orderBy(desc(aiSuggestions.createdAt)).limit(limit);
}

export async function getAllDynamicIcons(limit = 100) {
  const db = await requireDb();
  if (!db) return [];
  return await db.select().from(dynamicIcons).orderBy(desc(dynamicIcons.usageCount)).limit(limit);
}
