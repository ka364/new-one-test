import { pgTable, varchar, integer, decimal, timestamp, boolean, text, jsonb, index, foreignKey, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================
// 1. Spreadsheet Sessions (جلسات الجداول)
// ============================================
export const spreadsheetSessions = pgTable('spreadsheet_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  hierarchyPath: varchar('hierarchy_path', { length: 500 }).notNull(),
  hierarchyId: varchar('hierarchy_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'expenses', 'budgets', 'subscriptions'
  config: jsonb('config').default({}), // إعدادات الجدول (columns, filters, etc.)
  snapshot: jsonb('snapshot').default({}), // نسخة من البيانات
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('spreadsheet_sessions_hierarchy_path_idx').on(table.hierarchyPath),
  index('spreadsheet_sessions_hierarchy_id_idx').on(table.hierarchyId),
  index('spreadsheet_sessions_created_by_idx').on(table.createdBy),
  index('spreadsheet_sessions_is_active_idx').on(table.isActive),
]);

// ============================================
// 2. Cell Comments (تعليقات الخلايا)
// ============================================
export const cellComments = pgTable('cell_comments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  hierarchyPath: varchar('hierarchy_path', { length: 500 }).notNull(),
  expenseId: varchar('expense_id', { length: 36 }), // ربط بمصروف محدد
  cellAddress: varchar('cell_address', { length: 20 }).notNull(), // مثل: 'A5', 'B10'
  rowIndex: integer('row_index').notNull(),
  columnKey: varchar('column_key', { length: 50 }).notNull(),
  comment: text('comment').notNull(),
  commentType: varchar('comment_type', { length: 20 }).default('note'), // 'note', 'question', 'warning', 'error'
  isResolved: boolean('is_resolved').default(false).notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: varchar('resolved_by', { length: 36 }),
  parentCommentId: varchar('parent_comment_id', { length: 36 }), // للردود
  mentions: jsonb('mentions').default([]), // مستخدمين تم ذكرهم
  attachments: jsonb('attachments').default([]), // مرفقات
  metadata: jsonb('metadata').default({}),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.sessionId],
    foreignColumns: [spreadsheetSessions.id],
    name: 'fk_cell_comments_session',
  }),
  index('cell_comments_session_id_idx').on(table.sessionId),
  index('cell_comments_hierarchy_path_idx').on(table.hierarchyPath),
  index('cell_comments_expense_id_idx').on(table.expenseId),
  index('cell_comments_cell_address_idx').on(table.cellAddress),
  index('cell_comments_row_index_idx').on(table.rowIndex),
  index('cell_comments_is_resolved_idx').on(table.isResolved),
  index('cell_comments_created_by_idx').on(table.createdBy),
  index('cell_comments_parent_comment_id_idx').on(table.parentCommentId),
]);

// ============================================
// 3. Version History (تاريخ الإصدارات)
// ============================================
export const spreadsheetVersions = pgTable('spreadsheet_versions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  hierarchyPath: varchar('hierarchy_path', { length: 500 }).notNull(),
  versionNumber: integer('version_number').notNull(),
  changeType: varchar('change_type', { length: 50 }).notNull(), // 'create', 'update', 'delete', 'bulk_update'
  changesSummary: text('changes_summary'), // ملخص التغييرات
  changesDetail: jsonb('changes_detail').notNull(), // تفاصيل التغييرات
  affectedRows: jsonb('affected_rows').default([]), // الصفوف المتأثرة
  affectedColumns: jsonb('affected_columns').default([]), // الأعمدة المتأثرة
  snapshot: jsonb('snapshot'), // نسخة كاملة من البيانات (اختياري)
  diffPatch: jsonb('diff_patch'), // Patch للتغييرات (لتوفير المساحة)
  isAutoSave: boolean('is_auto_save').default(false),
  isMajorVersion: boolean('is_major_version').default(false),
  tags: jsonb('tags').default([]), // وسوم للإصدار
  notes: text('notes'), // ملاحظات على الإصدار
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.sessionId],
    foreignColumns: [spreadsheetSessions.id],
    name: 'fk_spreadsheet_versions_session',
  }),
  unique('unique_session_version').on(table.sessionId, table.versionNumber),
  index('spreadsheet_versions_session_id_idx').on(table.sessionId),
  index('spreadsheet_versions_hierarchy_path_idx').on(table.hierarchyPath),
  index('spreadsheet_versions_version_number_idx').on(table.versionNumber),
  index('spreadsheet_versions_created_by_idx').on(table.createdBy),
  index('spreadsheet_versions_created_at_idx').on(table.createdAt),
]);

// ============================================
// 4. Sharing & Permissions (المشاركة والصلاحيات)
// ============================================
export const spreadsheetSharing = pgTable('spreadsheet_sharing', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  permission: varchar('permission', { length: 20 }).notNull(), // 'view', 'comment', 'edit', 'admin'
  canExport: boolean('can_export').default(false),
  canShare: boolean('can_share').default(false),
  canDelete: boolean('can_delete').default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  invitedBy: varchar('invited_by', { length: 36 }).notNull(),
  invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  accessCount: integer('access_count').default(0),
  metadata: jsonb('metadata').default({}),
}, (table) => [
  foreignKey({
    columns: [table.sessionId],
    foreignColumns: [spreadsheetSessions.id],
    name: 'fk_spreadsheet_sharing_session',
  }),
  unique('unique_session_user').on(table.sessionId, table.userId),
  index('spreadsheet_sharing_session_id_idx').on(table.sessionId),
  index('spreadsheet_sharing_user_id_idx').on(table.userId),
  index('spreadsheet_sharing_permission_idx').on(table.permission),
  index('spreadsheet_sharing_is_active_idx').on(table.isActive),
]);

// ============================================
// 5. Collaborative Editing (التحرير التعاوني)
// ============================================
export const spreadsheetEdits = pgTable('spreadsheet_edits', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  editType: varchar('edit_type', { length: 50 }).notNull(), // 'cell_change', 'row_insert', 'row_delete', 'column_change'
  cellAddress: varchar('cell_address', { length: 20 }),
  rowIndex: integer('row_index'),
  columnKey: varchar('column_key', { length: 50 }),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  isApplied: boolean('is_applied').default(true),
  isConflict: boolean('is_conflict').default(false),
  conflictResolution: varchar('conflict_resolution', { length: 50 }), // 'auto', 'manual', 'last_write_wins'
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.sessionId],
    foreignColumns: [spreadsheetSessions.id],
    name: 'fk_spreadsheet_edits_session',
  }),
  index('spreadsheet_edits_session_id_idx').on(table.sessionId),
  index('spreadsheet_edits_user_id_idx').on(table.userId),
  index('spreadsheet_edits_created_at_idx').on(table.createdAt),
  index('spreadsheet_edits_row_index_idx').on(table.rowIndex),
]);

// ============================================
// 6. Formulas & Calculations (الصيغ والحسابات)
// ============================================
export const spreadsheetFormulas = pgTable('spreadsheet_formulas', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  cellAddress: varchar('cell_address', { length: 20 }).notNull(),
  rowIndex: integer('row_index').notNull(),
  columnKey: varchar('column_key', { length: 50 }).notNull(),
  formula: text('formula').notNull(), // مثل: '=SUM(B2:B10)', '=A2*0.15'
  formulaType: varchar('formula_type', { length: 50 }), // 'sum', 'average', 'custom', 'reference'
  dependencies: jsonb('dependencies').default([]), // الخلايا التي تعتمد عليها الصيغة
  result: jsonb('result'), // نتيجة الصيغة
  isValid: boolean('is_valid').default(true),
  errorMessage: text('error_message'),
  recalculateOnChange: boolean('recalculate_on_change').default(true),
  metadata: jsonb('metadata').default({}),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.sessionId],
    foreignColumns: [spreadsheetSessions.id],
    name: 'fk_spreadsheet_formulas_session',
  }),
  unique('unique_session_cell').on(table.sessionId, table.cellAddress),
  index('spreadsheet_formulas_session_id_idx').on(table.sessionId),
  index('spreadsheet_formulas_cell_address_idx').on(table.cellAddress),
  index('spreadsheet_formulas_row_index_idx').on(table.rowIndex),
]);

// ============================================
// 7. Charts & Visualizations (المخططات)
// ============================================
export const spreadsheetCharts = pgTable('spreadsheet_charts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  chartType: varchar('chart_type', { length: 50 }).notNull(), // 'bar', 'line', 'pie', 'area', 'scatter'
  title: varchar('title', { length: 255 }).notNull(),
  dataRange: varchar('data_range', { length: 100 }).notNull(), // مثل: 'A1:D10'
  config: jsonb('config').notNull(), // إعدادات المخطط (colors, labels, axes, etc.)
  position: jsonb('position').default({}), // موقع المخطط في الجدول
  width: integer('width').default(400),
  height: integer('height').default(300),
  isVisible: boolean('is_visible').default(true),
  refreshOnDataChange: boolean('refresh_on_data_change').default(true),
  metadata: jsonb('metadata').default({}),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.sessionId],
    foreignColumns: [spreadsheetSessions.id],
    name: 'fk_spreadsheet_charts_session',
  }),
  index('spreadsheet_charts_session_id_idx').on(table.sessionId),
  index('spreadsheet_charts_chart_type_idx').on(table.chartType),
  index('spreadsheet_charts_is_visible_idx').on(table.isVisible),
]);

// ============================================
// Zod Schemas للتحقق
// ============================================
export const insertSpreadsheetSessionSchema = createInsertSchema(spreadsheetSessions, {
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  type: z.enum(['expenses', 'budgets', 'subscriptions', 'custom']),
});

export const insertCellCommentSchema = createInsertSchema(cellComments, {
  id: z.string().uuid().optional(),
  comment: z.string().min(1),
  commentType: z.enum(['note', 'question', 'warning', 'error']).optional(),
});

export const insertSpreadsheetVersionSchema = createInsertSchema(spreadsheetVersions, {
  id: z.string().uuid().optional(),
  versionNumber: z.number().int().positive(),
  changeType: z.enum(['create', 'update', 'delete', 'bulk_update', 'restore']),
});

export const insertSpreadsheetSharingSchema = createInsertSchema(spreadsheetSharing, {
  id: z.string().uuid().optional(),
  permission: z.enum(['view', 'comment', 'edit', 'admin']),
});

export const insertSpreadsheetFormulaSchema = createInsertSchema(spreadsheetFormulas, {
  id: z.string().uuid().optional(),
  formula: z.string().regex(/^=.+/, 'الصيغة يجب أن تبدأ بـ ='),
});

export const insertSpreadsheetChartSchema = createInsertSchema(spreadsheetCharts, {
  id: z.string().uuid().optional(),
  chartType: z.enum(['bar', 'line', 'pie', 'area', 'scatter', 'column', 'donut']),
  title: z.string().min(1).max(255),
});

// ============================================
// Relations
// ============================================
export const spreadsheetSessionsRelations = relations(spreadsheetSessions, ({ many }) => ({
  comments: many(cellComments),
  versions: many(spreadsheetVersions),
  sharing: many(spreadsheetSharing),
  edits: many(spreadsheetEdits),
  formulas: many(spreadsheetFormulas),
  charts: many(spreadsheetCharts),
}));

export const cellCommentsRelations = relations(cellComments, ({ one, many }) => ({
  session: one(spreadsheetSessions, {
    fields: [cellComments.sessionId],
    references: [spreadsheetSessions.id],
  }),
  parentComment: one(cellComments, {
    fields: [cellComments.parentCommentId],
    references: [cellComments.id],
  }),
  replies: many(cellComments),
}));

export const spreadsheetVersionsRelations = relations(spreadsheetVersions, ({ one }) => ({
  session: one(spreadsheetSessions, {
    fields: [spreadsheetVersions.sessionId],
    references: [spreadsheetSessions.id],
  }),
}));

export const spreadsheetSharingRelations = relations(spreadsheetSharing, ({ one }) => ({
  session: one(spreadsheetSessions, {
    fields: [spreadsheetSharing.sessionId],
    references: [spreadsheetSessions.id],
  }),
}));
