/**
 * 📖 Quranic Guidance Router
 * HADEROS AI CLOUD
 * Last Updated: December 29, 2025
 *
 * Provides live ethical guidance using Quranic verses based on
 * business context and management situations.
 */

import { z } from 'zod';
import { router, publicProcedure } from '../_core/trpc';
import { db } from '../db';
import { quranicVerses, managementApplications, guidanceLog } from '../../drizzle/schema-quranic';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';

/**
 * Context Matcher - Simple algorithm to match business context with relevant verses
 */
function matchContextToVerses(context: string, area?: string): {
  keywords: string[];
  contextTypes: string[];
} {
  const contextLower = context.toLowerCase();
  const areaLower = area?.toLowerCase() || '';

  const keywords: string[] = [];
  const contextTypes: string[] = [];

  // HR contexts
  if (contextLower.includes('hire') || contextLower.includes('employ') || contextLower.includes('recruit')) {
    keywords.push('الصدق', 'الأمانة', 'حسن المعاملة');
    contextTypes.push('hiring', 'employee_relations');
  }

  // Finance contexts
  if (contextLower.includes('finance') || contextLower.includes('money') || contextLower.includes('payment') || areaLower === 'finance') {
    keywords.push('الربا', 'المال', 'العدل في التجارة');
    contextTypes.push('financial_decision', 'finance');
  }

  // Contract contexts
  if (contextLower.includes('contract') || contextLower.includes('agreement')) {
    keywords.push('العقود', 'الوفاء', 'الالتزام');
    contextTypes.push('contract_signing', 'contracts');
  }

  // Decision making contexts
  if (contextLower.includes('decision') || contextLower.includes('meeting') || contextLower.includes('strategy')) {
    keywords.push('الشورى', 'المشاورة', 'القرار');
    contextTypes.push('team_meeting', 'decision_making', 'strategy_planning');
  }

  // Quality and measurement
  if (contextLower.includes('quality') || contextLower.includes('measure') || contextLower.includes('product')) {
    keywords.push('الميزان', 'القسط', 'العدل في التجارة');
    contextTypes.push('quality_control', 'fair_measurement');
  }

  // Customer service
  if (contextLower.includes('customer') || contextLower.includes('service') || contextLower.includes('client')) {
    keywords.push('حسن المعاملة', 'الكلام الطيب', 'الإحسان');
    contextTypes.push('customer_service', 'customer_relations');
  }

  // Leadership
  if (contextLower.includes('lead') || contextLower.includes('manage') || contextLower.includes('team')) {
    keywords.push('القيادة', 'الشورى', 'العدل');
    contextTypes.push('leadership', 'team_consultation');
  }

  // Challenges and difficulties
  if (contextLower.includes('challenge') || contextLower.includes('difficult') || contextLower.includes('problem')) {
    keywords.push('الصبر', 'المثابرة', 'التفاؤل');
    contextTypes.push('challenges', 'persistence', 'resilience');
  }

  // Default to general guidance
  if (keywords.length === 0) {
    keywords.push('العدل', 'الإحسان', 'الأخلاق');
    contextTypes.push('general');
  }

  return { keywords, contextTypes };
}

export const quranicGuidanceRouter = router({
  /**
   * Get contextual guidance based on business situation
   */
  getGuidance: publicProcedure
    .input(
      z.object({
        context: z.string(), // e.g., "I'm about to hire a new employee"
        area: z.string().optional(), // e.g., "HR", "Finance", "Operations"
        userId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const { context, area, userId } = input;

      // Match context to keywords and context types
      const { keywords, contextTypes } = matchContextToVerses(context, area);

      // Find relevant verses
      // First try to find by management applications
      let relevantVerses = await db
        .select({
          verse: quranicVerses,
          application: managementApplications,
        })
        .from(managementApplications)
        .innerJoin(quranicVerses, eq(managementApplications.verseId, quranicVerses.id))
        .where(
          inArray(managementApplications.contextType, contextTypes)
        )
        .orderBy(desc(managementApplications.relevanceScore))
        .limit(3);

      // If no specific application matches, search by keywords
      if (relevantVerses.length === 0) {
        const allVerses = await db
          .select()
          .from(quranicVerses)
          .limit(100);

        // Simple keyword matching
        const matchedVerses = allVerses.filter((verse) => {
          const verseKeywords = (verse.keywords as string[]) || [];
          return keywords.some((kw) => verseKeywords.includes(kw));
        });

        relevantVerses = matchedVerses.slice(0, 3).map((verse) => ({
          verse,
          application: null,
        }));
      }

      // Log the guidance shown
      if (relevantVerses.length > 0 && userId) {
        await db.insert(guidanceLog).values({
          userId,
          contextData: {
            context,
            area,
            keywords,
            contextTypes,
          },
          verseId: relevantVerses[0].verse.id,
          userInteraction: 'viewed',
        });
      }

      return {
        verses: relevantVerses.map((rv) => ({
          id: rv.verse.id,
          surahName: rv.verse.surahName,
          surahNameAr: rv.verse.surahNameAr,
          ayahNumber: rv.verse.ayahNumber,
          verseText: rv.verse.verseText,
          reference: `${rv.verse.surahNameAr} ${rv.verse.ayahNumber}`,
          applicationContext: rv.application
            ? {
                situationDescription: rv.application.situationDescription,
                situationDescriptionAr: rv.application.situationDescriptionAr,
                relevanceScore: rv.application.relevanceScore,
              }
            : null,
        })),
        matchedKeywords: keywords,
        contextTypes,
      };
    }),

  /**
   * Get verse by ID
   */
  getVerseById: publicProcedure
    .input(z.object({ verseId: z.number() }))
    .query(async ({ input }) => {
      const verse = await db.query.quranicVerses.findFirst({
        where: eq(quranicVerses.id, input.verseId),
      });

      if (!verse) {
        throw new Error('Verse not found');
      }

      return verse;
    }),

  /**
   * Search verses by surah or keywords
   */
  searchVerses: publicProcedure
    .input(
      z.object({
        query: z.string(),
        surahNumber: z.number().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const { query, surahNumber, limit } = input;

      let results = await db.select().from(quranicVerses).limit(100);

      // Filter by surah if provided
      if (surahNumber) {
        results = results.filter((v) => v.surahNumber === surahNumber);
      }

      // Simple text search in verse text
      if (query) {
        results = results.filter((v) => v.verseText.includes(query));
      }

      return results.slice(0, limit);
    }),

  /**
   * Get all available surahs
   */
  getSurahs: publicProcedure.query(async () => {
    const surahs = await db
      .selectDistinct({
        surahNumber: quranicVerses.surahNumber,
        surahName: quranicVerses.surahName,
        surahNameAr: quranicVerses.surahNameAr,
      })
      .from(quranicVerses)
      .orderBy(quranicVerses.surahNumber);

    return surahs;
  }),

  /**
   * Log user interaction with guidance
   */
  logInteraction: publicProcedure
    .input(
      z.object({
        verseId: z.number(),
        userId: z.number().optional(),
        interaction: z.enum(['viewed', 'dismissed', 'saved', 'shared']),
        feedbackRating: z.number().min(1).max(5).optional(),
        context: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { verseId, userId, interaction, feedbackRating, context } = input;

      await db.insert(guidanceLog).values({
        userId,
        verseId,
        userInteraction: interaction,
        feedbackRating,
        contextData: context || {},
      });

      // Update usage count for management applications
      await db.execute(sql`
        UPDATE management_applications
        SET usage_count = usage_count + 1
        WHERE verse_id = ${verseId}
      `);

      return { success: true };
    }),

  /**
   * Get guidance statistics
   */
  getStatistics: publicProcedure.query(async () => {
    const totalVerses = await db
      .select({ count: sql<number>`count(*)` })
      .from(quranicVerses);

    const totalApplications = await db
      .select({ count: sql<number>`count(*)` })
      .from(managementApplications);

    const totalInteractions = await db
      .select({ count: sql<number>`count(*)` })
      .from(guidanceLog);

    const mostUsedVerses = await db
      .select({
        verse: quranicVerses,
        usageCount: sql<number>`count(${guidanceLog.id})`,
      })
      .from(guidanceLog)
      .innerJoin(quranicVerses, eq(guidanceLog.verseId, quranicVerses.id))
      .groupBy(quranicVerses.id)
      .orderBy(desc(sql`count(${guidanceLog.id})`))
      .limit(5);

    return {
      totalVerses: Number(totalVerses[0]?.count || 0),
      totalApplications: Number(totalApplications[0]?.count || 0),
      totalInteractions: Number(totalInteractions[0]?.count || 0),
      mostUsedVerses: mostUsedVerses.map((item) => ({
        ...item.verse,
        usageCount: Number(item.usageCount),
      })),
    };
  }),
});
