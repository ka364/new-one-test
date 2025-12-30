import { pgTable, serial, varchar, text, timestamp, decimal, jsonb, integer, bigint, boolean, index, foreignKey, date, primaryKey, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const accountGenerationLogs = pgTable("account_generation_logs", {
	id: serial().notNull(),
	month: varchar({ length: 7 }).notNull(),
	accountsGenerated: integer("accounts_generated").notNull(),
	generatedBy: integer("generated_by").notNull().references(() => users.id),
	excelFilePath: varchar("excel_file_path", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const agentInsights = pgTable("agentInsights", {
	id: serial().notNull(),
	agentType: text().notNull(),
	insightType: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	titleAr: varchar({ length: 200 }),
	description: text().notNull(),
	descriptionAr: text(),
	insightData: jsonb("insight_data").notNull(),
	confidence: decimal({ precision: 5, scale: 2 }),
	priority: text().default('medium').notNull(),
	status: text().default('new').notNull(),
	reviewedBy: integer(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewNotes: text(),
	relatedEntityType: varchar({ length: 100 }),
	relatedEntityId: integer(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const aiSuggestions = pgTable("ai_suggestions", {
	id: serial().notNull(),
	userId: integer().notNull().references(() => users.id),
	suggestionType: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	titleAr: varchar({ length: 255 }),
	description: text(),
	descriptionAr: text(),
	suggestionData: jsonb("suggestion_data").notNull(),
	confidence: decimal({ precision: 5, scale: 2 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	userFeedback: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	respondedAt: timestamp({ mode: 'string' }),
});

export const auditTrail = pgTable("auditTrail", {
	id: serial().notNull(),
	entityType: varchar({ length: 100 }).notNull(),
	entityId: integer().notNull(),
	action: text().notNull(),
	actionDescription: text(),
	kaiaDecision: text(),
	appliedRules: jsonb("applied_rules"),
	decisionReason: text(),
	decisionReasonAr: text(),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	performedBy: integer().notNull(),
	performedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
});

export const campaigns = pgTable("campaigns", {
	id: serial().notNull(),
	campaignName: varchar({ length: 200 }).notNull(),
	campaignNameAr: varchar({ length: 200 }),
	description: text(),
	descriptionAr: text(),
	type: text().notNull(),
	status: text().default('draft').notNull(),
	budget: decimal({ precision: 10, scale: 2 }),
	spent: decimal({ precision: 10, scale: 2 }).default('0.00').notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	impressions: integer().default(0).notNull(),
	clicks: integer().default(0).notNull(),
	conversions: integer().default(0).notNull(),
	revenue: decimal({ precision: 10, scale: 2 }).default('0.00').notNull(),
	aiOptimizationEnabled: integer().default(1).notNull(),
	lastOptimizedAt: timestamp({ mode: 'string' }),
	optimizationNotes: text(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	targetAudience: jsonb("target_audience"),
	campaignConfig: jsonb("campaign_config"),
	createdBy: integer().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chatMessages", {
	id: serial().notNull(),
	userId: integer().notNull(),
	role: text().notNull(),
	content: text().notNull(),