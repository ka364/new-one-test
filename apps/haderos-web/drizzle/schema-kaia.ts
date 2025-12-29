/**
 * 🧬 KAIA Database Schema
 * HADEROS AI CLOUD
 * Last Updated: December 29, 2025
 *
 * KAIA = Modern Best Practices + Quranic Filter
 * This schema stores world-class management practices and evaluates
 * them against Quranic principles for ethical governance.
 */

import { pgTable, serial, varchar, text, integer, timestamp, jsonb, decimal, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ========================================
// Modern Best Practices Table
// ========================================
export const modernBestPractices = pgTable('modern_best_practices', {
  id: serial('id').primaryKey(),
  domain: varchar('domain', { length: 100 }).notNull(), // "HR", "Finance", "Operations", etc.
  practiceName: varchar('practice_name', { length: 255 }).notNull(),
  practiceNameAr: varchar('practice_name_ar', { length: 255 }),
  source: varchar('source', { length: 255 }).notNull(), // "Harvard Business Review", "McKinsey", etc.
  sourceUrl: text('source_url'),
  evidenceLevel: varchar('evidence_level', { length: 10 }).default('B'), // "A", "B", "C"
  effectivenessScore: decimal('effectiveness_score', { precision: 3, scale: 2 }), // 0.00 to 10.00
  description: text('description'),
  descriptionAr: text('description_ar'),
  implementationSteps: jsonb('implementation_steps').$type<{
    steps?: string[];
    resources?: string[];
    timeline?: string;
  }>(),
  successMetrics: jsonb('success_metrics').$type<{
    kpis?: string[];
    benchmarks?: Record<string, number>;
  }>(),
  caseStudies: jsonb('case_studies').$type<{
    company?: string;
    results?: string;
    year?: number;
  }[]>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ========================================
// Quranic Principles Table
// ========================================
export const quranicPrinciples = pgTable('quranic_principles', {
  id: serial('id').primaryKey(),
  principleName: varchar('principle_name', { length: 100 }).notNull(),
  principleNameAr: varchar('principle_name_ar', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // "core", "business", "hr", "finance", etc.
  quranicVerses: jsonb('quranic_verses').notNull().$type<{
    verse: string;
    surah: string;
    ayah?: number;
  }[]>(),
  checkCriteria: jsonb('check_criteria').$type<{
    mustHave?: string[];
    mustAvoid?: string[];
    conditions?: Record<string, any>;
  }>(),
  applicationDomains: jsonb('application_domains').$type<string[]>(), // ["HR", "Finance", "Operations"]
  description: text('description'),
  descriptionAr: text('description_ar'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ========================================
// KAIA Decisions Table
// ========================================
export const kaiaDecisions = pgTable('kaia_decisions', {
  id: serial('id').primaryKey(),
  decisionContext: varchar('decision_context', { length: 255 }).notNull(),
  decisionType: varchar('decision_type', { length: 100 }).notNull(), // "hiring", "investment", "product_launch"
  bestPracticeId: integer('best_practice_id').references(() => modernBestPractices.id),
  quranicPrincipleId: integer('quranic_principle_id').references(() => quranicPrinciples.id),
  compatibilityScore: decimal('compatibility_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
  recommendation: text('recommendation'),
  recommendationAr: text('recommendation_ar'),
  reasoning: jsonb('reasoning').$type<{
    bestPracticeRationale?: string;
    quranicAlignment?: string;
    potentialIssues?: string[];
    suggestions?: string[];
  }>(),
  metadata: jsonb('metadata'),
  createdBy: integer('created_by'), // User ID
  createdAt: timestamp('created_at').defaultNow(),
});

// ========================================
// System Metrics Table (for Sentinel integration)
// ========================================
export const systemMetrics = pgTable('system_metrics', {
  id: serial('id').primaryKey(),
  metricType: varchar('metric_type', { length: 100 }).notNull(), // "performance", "business", "quality"
  metricName: varchar('metric_name', { length: 200 }).notNull(),
  metricValue: decimal('metric_value', { precision: 15, scale: 2 }),
  metricData: jsonb('metric_data'),
  timestamp: timestamp('timestamp').defaultNow(),
  source: varchar('source', { length: 100 }), // "web_server", "database", "orders_system"
});

// ========================================
// Alerts Table (for Sentinel integration)
// ========================================
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  alertType: varchar('alert_type', { length: 50 }).notNull(), // "performance", "security", "business"
  severity: varchar('severity', { length: 20 }).default('medium'), // "low", "medium", "high", "critical"
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  messageAr: text('message_ar'),
  metadata: jsonb('metadata'),
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: integer('resolved_by'), // User ID
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ========================================
// Anomalies Table (for Sentinel integration)
// ========================================
export const anomalies = pgTable('anomalies', {
  id: serial('id').primaryKey(),
  anomalyType: varchar('anomaly_type', { length: 100 }).notNull(),
  description: text('description'),
  severity: varchar('severity', { length: 20 }).default('medium'),
  detectedValue: decimal('detected_value', { precision: 15, scale: 2 }),
  expectedValue: decimal('expected_value', { precision: 15, scale: 2 }),
  deviationPercentage: decimal('deviation_percentage', { precision: 5, scale: 2 }),
  metadata: jsonb('metadata'),
  isAcknowledged: boolean('is_acknowledged').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// ========================================
// Relations
// ========================================
export const modernBestPracticesRelations = relations(modernBestPractices, ({ many }) => ({
  decisions: many(kaiaDecisions),
}));

export const quranicPrinciplesRelations = relations(quranicPrinciples, ({ many }) => ({
  decisions: many(kaiaDecisions),
}));

export const kaiaDecisionsRelations = relations(kaiaDecisions, ({ one }) => ({
  bestPractice: one(modernBestPractices, {
    fields: [kaiaDecisions.bestPracticeId],
    references: [modernBestPractices.id],
  }),
  quranicPrinciple: one(quranicPrinciples, {
    fields: [kaiaDecisions.quranicPrincipleId],
    references: [quranicPrinciples.id],
  }),
}));

// ========================================
// Types
// ========================================
export type ModernBestPractice = typeof modernBestPractices.$inferSelect;
export type NewModernBestPractice = typeof modernBestPractices.$inferInsert;

export type QuranicPrinciple = typeof quranicPrinciples.$inferSelect;
export type NewQuranicPrinciple = typeof quranicPrinciples.$inferInsert;

export type KaiaDecision = typeof kaiaDecisions.$inferSelect;
export type NewKaiaDecision = typeof kaiaDecisions.$inferInsert;

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type NewSystemMetric = typeof systemMetrics.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type Anomaly = typeof anomalies.$inferSelect;
export type NewAnomaly = typeof anomalies.$inferInsert;
