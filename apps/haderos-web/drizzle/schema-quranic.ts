/**
 * 📖 Quranic Guidance Database Schema
 * HADEROS AI CLOUD
 * Last Updated: December 29, 2025
 *
 * This schema defines the structure for storing Quranic verses
 * and their management applications for contextual ethical guidance.
 */

import { pgTable, serial, varchar, text, integer, timestamp, jsonb, decimal, boolean, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ========================================
// Quranic Verses Table
// ========================================
export const quranicVerses = pgTable('quranic_verses', {
  id: serial('id').primaryKey(),
  surahNumber: integer('surah_number').notNull(),
  surahName: varchar('surah_name', { length: 50 }).notNull(),
  surahNameAr: varchar('surah_name_ar', { length: 50 }).notNull(),
  ayahNumber: integer('ayah_number').notNull(),
  verseText: text('verse_text').notNull(), // النص القرآني بالعربية فقط
  juz: integer('juz'),
  page: integer('page'),
  keywords: jsonb('keywords').$type<string[]>(), // كلمات مفتاحية للبحث
  managementContext: jsonb('management_context').$type<{
    contexts?: string[];
    themes?: string[];
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Unique constraint: each verse appears only once
  uniqueVerse: unique().on(table.surahNumber, table.ayahNumber)
}));

// ========================================
// Management Applications Table
// ========================================
export const managementApplications = pgTable('management_applications', {
  id: serial('id').primaryKey(),
  verseId: integer('verse_id').references(() => quranicVerses.id),
  contextType: varchar('context_type', { length: 100 }).notNull(), // e.g., "hiring", "contract_signing"
  applicationArea: varchar('application_area', { length: 100 }).notNull(), // e.g., "HR", "Finance"
  situationDescription: text('situation_description'),
  situationDescriptionAr: text('situation_description_ar'),
  relevanceScore: decimal('relevance_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// ========================================
// Guidance Log Table
// ========================================
export const guidanceLog = pgTable('guidance_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'), // References users table
  contextData: jsonb('context_data').notNull().$type<{
    page?: string;
    action?: string;
    businessContext?: string;
    [key: string]: any;
  }>(),
  verseId: integer('verse_id').references(() => quranicVerses.id),
  shownAt: timestamp('shown_at').defaultNow(),
  userInteraction: varchar('user_interaction', { length: 50 }), // "viewed", "dismissed", "saved"
  feedbackRating: integer('feedback_rating'), // 1-5
  metadata: jsonb('metadata'),
});

// ========================================
// Relations
// ========================================
export const quranicVersesRelations = relations(quranicVerses, ({ many }) => ({
  applications: many(managementApplications),
  guidanceLogs: many(guidanceLog),
}));

export const managementApplicationsRelations = relations(managementApplications, ({ one }) => ({
  verse: one(quranicVerses, {
    fields: [managementApplications.verseId],
    references: [quranicVerses.id],
  }),
}));

export const guidanceLogRelations = relations(guidanceLog, ({ one }) => ({
  verse: one(quranicVerses, {
    fields: [guidanceLog.verseId],
    references: [quranicVerses.id],
  }),
}));

// ========================================
// Types
// ========================================
export type QuranicVerse = typeof quranicVerses.$inferSelect;
export type NewQuranicVerse = typeof quranicVerses.$inferInsert;

export type ManagementApplication = typeof managementApplications.$inferSelect;
export type NewManagementApplication = typeof managementApplications.$inferInsert;

export type GuidanceLog = typeof guidanceLog.$inferSelect;
export type NewGuidanceLog = typeof guidanceLog.$inferInsert;
