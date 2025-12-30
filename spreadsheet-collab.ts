import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { 
  spreadsheetSessions, cellComments, spreadsheetVersions, 
  spreadsheetSharing, spreadsheetEdits, spreadsheetFormulas, spreadsheetCharts,
  insertCellCommentSchema, insertSpreadsheetVersionSchema,
  insertSpreadsheetSharingSchema, insertSpreadsheetFormulaSchema, insertSpreadsheetChartSchema
} from "../../drizzle/schema-spreadsheet-collab";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const spreadsheetCollabRouter = createTRPCRouter({
  // ============================================
  // 1. Session Management
  // ============================================
  
  /**
   * إنشاء جلسة جدول جديدة
   */
  createSession: protectedProcedure
    .input(z.object({
      hierarchyPath: z.string(),
      hierarchyId: z.string(),
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      type: z.enum(['expenses', 'budgets', 'subscriptions', 'custom']),
      config: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      
      const id = crypto.randomUUID();
      
      await db.insert(spreadsheetSessions).values({
        id,
        hierarchyPath: input.hierarchyPath,
        hierarchyId: input.hierarchyId,
        name: input.name,
        description: input.description,
        type: input.type,
        config: input.config || {},
        snapshot: {},
        isActive: true,
        createdBy: user.id,
      });
      
      return { id, success: true };
    }),
  
  /**
   * الحصول على جلسة محددة
   */
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      
      const session = await db.select()
        .from(spreadsheetSessions)
        .where(eq(spreadsheetSessions.id, input.sessionId))
        .limit(1);
      
      if (!session.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'الجلسة غير موجودة' });
      }
      
      return session[0];
    }),
  
  /**
   * الحصول على جميع جلسات هيكل معين
   */
  getSessions: protectedProcedure
    .input(z.object({
      hierarchyPath: z.string(),
      type: z.enum(['expenses', 'budgets', 'subscriptions', 'custom']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      
      const conditions = [eq(spreadsheetSessions.hierarchyPath, input.hierarchyPath)];
      
      if (input.type) {
        conditions.push(eq(spreadsheetSessions.type, input.type));
      }
      
      return db.select()
        .from(spreadsheetSessions)
        .where(and(...conditions))
        .orderBy(desc(spreadsheetSessions.createdAt));
    }),
  
  // ============================================
  // 2. Comments
  // ============================================
  
  /**
   * إضافة تعليق على خلية
   */
  addComment: protectedProcedure
    .input(insertCellCommentSchema.extend({
      sessionId: z.string(),
      hierarchyPath: z.string(),
      expenseId: z.string().optional(),
      cellAddress: z.string(),
      rowIndex: z.number(),
      columnKey: z.string(),
      comment: z.string().min(1),
      commentType: z.enum(['note', 'question', 'warning', 'error']).optional(),
      parentCommentId: z.string().optional(),
      mentions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      
      const id = crypto.randomUUID();
      
      await db.insert(cellComments).values({
        id,
        sessionId: input.sessionId,
        hierarchyPath: input.hierarchyPath,
        expenseId: input.expenseId,
        cellAddress: input.cellAddress,
        rowIndex: input.rowIndex,
        columnKey: input.columnKey,
        comment: input.comment,
        commentType: input.commentType || 'note',
        isResolved: false,
        parentCommentId: input.parentCommentId,
        mentions: input.mentions || [],
        attachments: [],
        metadata: {},
        createdBy: user.id,
      });
      
      return { id, success: true };
    }),
  
  /**
   * الحصول على تعليقات جلسة
   */
  getComments: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      cellAddress: z.string().optional(),
      isResolved: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      
      const conditions = [eq(cellComments.sessionId, input.sessionId)];
      
      if (input.cellAddress) {
        conditions.push(eq(cellComments.cellAddress, input.cellAddress));
      }
      
      if (input.isResolved !== undefined) {
        conditions.push(eq(cellComments.isResolved, input.isResolved));
      }
      
      return db.select()
        .from(cellComments)
        .where(and(...conditions))
        .orderBy(desc(cellComments.createdAt));
    }),
  
  /**
   * حل تعليق
   */
  resolveComment: protectedProcedure
    .input(z.object({
      commentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      
      await db.update(cellComments)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: user.id,
        })
        .where(eq(cellComments.id, input.commentId));
      
      return { success: true };
    }),
  
  /**
   * حذف تعليق
   */
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      
      await db.delete(cellComments)
        .where(eq(cellComments.id, input.commentId));
      
      return { success: true };
    }),
  
  // ============================================
  // 3. Version History
  // ============================================
  
  /**
   * إنشاء نسخة جديدة
   */
  createVersion: protectedProcedure
    .input(insertSpreadsheetVersionSchema.extend({
      sessionId: z.string(),
      hierarchyPath: z.string(),
      changeType: z.enum(['create', 'update', 'delete', 'bulk_update', 'restore']),
      changesSummary: z.string().optional(),
      changesDetail: z.any(),
      affectedRows: z.array(z.number()).optional(),
      affectedColumns: z.array(z.string()).optional(),
      snapshot: z.any().optional(),
      isMajorVersion: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      
      // الحصول على آخر رقم نسخة
      const lastVersion = await db.select()
        .from(spreadsheetVersions)
        .where(eq(spreadsheetVersions.sessionId, input.sessionId))
        .orderBy(desc(spreadsheetVersions.versionNumber))
        .limit(1);
      
      const versionNumber = lastVersion.length > 0 ? lastVersion[0].versionNumber + 1 : 1;
      
      const id = crypto.randomUUID();
      
      await db.insert(spreadsheetVersions).values({
        id,
        sessionId: input.sessionId,
        hierarchyPath: input.hierarchyPath,
        versionNumber,
        changeType: input.changeType,
        changesSummary: input.changesSummary || `تغيير ${input.changeType}`,
        changesDetail: input.changesDetail,
        affectedRows: input.affectedRows || [],
        affectedColumns: input.affectedColumns || [],
        snapshot: input.snapshot,
        diffPatch: null,
        isAutoSave: false,
        isMajorVersion: input.isMajorVersion || false,
        tags: [],
        notes: input.notes,
        createdBy: user.id,
      });
      
      return { id, versionNumber, success: true };
    }),
  
  /**
   * الحصول على تاريخ الإصدارات
   */
  getVersions: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      
      const query = db.select()
        .from(spreadsheetVersions)
        .where(eq(spreadsheetVersions.sessionId, input.sessionId))
        .orderBy(desc(spreadsheetVersions.versionNumber));
      
      if (input.limit) {
        query.limit(input.limit);
      }
      
      return query;
    }),
  
  /**
   * الحصول على نسخة محددة
   */
  getVersion: protectedProcedure
    .input(z.object({
      versionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      
      const version = await db.select()
        .from(spreadsheetVersions)
        .where(eq(spreadsheetVersions.id, input.versionId))
        .limit(1);
      
      if (!version.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'النسخة غير موجودة' });
      }
      
      return version[0];
    }),
  
  /**
   * استعادة نسخة سابقة
   */
  restoreVersion: protectedProcedure
    .input(z.object({
      versionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      
      // الحصول على النسخة المطلوبة
      const version = await db.select()
        .from(spreadsheetVersions)
        .where(eq(spreadsheetVersions.id, input.versionId))
        .limit(1);
      
      if (!version.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'النسخة غير موجودة' });
      }
      
      // إنشاء نسخة جديدة من الاستعادة
      const lastVersion = await db.select()
        .from(spreadsheetVersions)
        .where(eq(spreadsheetVersions.sessionId, version[0].sessionId))
        .orderBy(desc(spreadsheetVersions.versionNumber))
        .limit(1);
      
      const newVersionNumber = lastVersion[0].versionNumber + 1;
      
      await db.insert(spreadsheetVersions).values({
        id: crypto.randomUUID(),
        sessionId: version[0].sessionId,
        hierarchyPath: version[0].hierarchyPath,
        versionNumber: newVersionNumber,
        changeType: 'restore',
        changesSummary: `استعادة النسخة ${version[0].versionNumber}`,
        changesDetail: version[0].changesDetail,
        affectedRows: version[0].affectedRows,
        affectedColumns: version[0].affectedColumns,
        snapshot: version[0].snapshot,
        diffPatch: null,
        isAutoSave: false,
        isMajorVersion: true,
        tags: ['restored'],
        notes: `تم استعادة النسخة ${version[0].versionNumber}`,
        createdBy: user.id,
      });
      
      return { success: true, newVersionNumber };
    }),
  
  // ============================================
  // 4. Sharing & Permissions
  // ============================================
  
  /**
   * مشاركة جدول مع مستخدم
   */
  share: protectedProcedure
    .input(insertSpreadsheetSharingSchema.extend({
      sessionId: z.string(),
      userEmail: z.string().email(),
      permission: z.enum(['view', 'comment', 'edit', 'admin']),
      canExport: z.boolean().optional(),
      canShare: z.boolean().optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      
      // البحث عن المستخدم بالبريد الإلكتروني
      // (يجب تعديل هذا حسب جدول المستخدمين في HADEROS)
      const targetUserId = input.userEmail; // مؤقتاً
      
      const id = crypto.randomUUID();
      
      await db.insert(spreadsheetSharing).values({
        id,
        sessionId: input.sessionId,
        userId: targetUserId,
        permission: input.permission,
        canExport: input.canExport || false,
        canShare: input.canShare || false,
        canDelete: false,
        expiresAt: input.expiresAt,
        isActive: true,
        invitedBy: user.id,
        invitedAt: new Date(),
        acceptedAt: null,
        lastAccessedAt: null,
        accessCount: 0,
        metadata: {},
      });
      
      return { id, success: true };
    }),
  
  /**
   * الحصول على المستخدمين المشاركين
   */
  getSharing: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      
      return db.select()
        .from(spreadsheetSharing)
        .where(and(
          eq(spreadsheetSharing.sessionId, input.sessionId),
          eq(spreadsheetSharing.isActive, true)
        ))
        .orderBy(desc(spreadsheetSharing.invitedAt));
    }),
  
  /**
   * تحديث صلاحيات مستخدم
   */
  updatePermission: protectedProcedure
    .input(z.object({
      sharingId: z.string(),
      permission: z.enum(['view', 'comment', 'edit', 'admin']),
      canExport: z.boolean().optional(),
      canShare: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      
      await db.update(spreadsheetSharing)
        .set({
          permission: input.permission,
          canExport: input.canExport,
          canShare: input.canShare,
        })
        .where(eq(spreadsheetSharing.id, input.sharingId));
      
      return { success: true };
    }),
  
  /**
   * إلغاء مشاركة
   */
  revokeSharing: protectedProcedure
    .input(z.object({
      sharingId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      
      await db.update(spreadsheetSharing)
        .set({ isActive: false })
        .where(eq(spreadsheetSharing.id, input.sharingId));
      
      return { success: true };
    }),
  
  // ============================================
  // 5. Formulas
  // ============================================
  
  /**
   * إضافة صيغة حسابية
   */
  addFormula: protectedProcedure
    .input(insertSpreadsheetFormulaSchema.extend({
      sessionId: z.string(),
      cellAddress: z.string(),
      rowIndex: z.number(),
      columnKey: z.string(),
      formula: z.string().regex(/^=.+/),
      formulaType: z.string().optional(),
      dependencies: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      
      const id = crypto.randomUUID();
      
      // حساب الصيغة (يمكن استخدام مكتبة مثل formula.js)
      let result: any = null;
      let isValid = true;
      let errorMessage: string | null = null;
      
      try {
        // هنا يمكن إضافة منطق حساب الصيغة
        // result = evaluateFormula(input.formula);
      } catch (error: any) {
        isValid = false;
        errorMessage = error.message;
      }
      
      await db.insert(spreadsheetFormulas).values({
        id,
        sessionId: input.sessionId,
        cellAddress: input.cellAddress,
        rowIndex: input.rowIndex,
        columnKey: input.columnKey,
        formula: input.formula,
        formulaType: input.formulaType,
        dependencies: input.dependencies || [],
        result,
        isValid,
        errorMessage,
        recalculateOnChange: true,
        metadata: {},
        createdBy: user.id,
      });
      
      return { id, result, isValid, success: true };
    }),
  
  /**
   * الحصول على صيغ جلسة
   */
  getFormulas: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      
      return db.select()
        .from(spreadsheetFormulas)
        .where(eq(spreadsheetFormulas.sessionId, input.sessionId))
        .orderBy(asc(spreadsheetFormulas.rowIndex));
    }),
  
  /**
   * حذف صيغة
   */
  deleteFormula: protectedProcedure
    .input(z.object({
      formulaId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      
      await db.delete(spreadsheetFormulas)
        .where(eq(spreadsheetFormulas.id, input.formulaId));
      
      return { success: true };
    }),
  
  // ============================================
  // 6. Charts
  // ============================================
  
  /**
   * إنشاء مخطط
   */
  createChart: protectedProcedure
    .input(insertSpreadsheetChartSchema.extend({
      sessionId: z.string(),
      chartType: z.enum(['bar', 'line', 'pie', 'area', 'scatter', 'column', 'donut']),
      title: z.string().min(1).max(255),
      dataRange: z.string(),
      config: z.any(),
      position: z.any().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      
      const id = crypto.randomUUID();
      
      await db.insert(spreadsheetCharts).values({
        id,
        sessionId: input.sessionId,
        chartType: input.chartType,
        title: input.title,
        dataRange: input.dataRange,
        config: input.config,
        position: input.position || {},
        width: input.width || 400,
        height: input.height || 300,
        isVisible: true,
        refreshOnDataChange: true,
        metadata: {},
        createdBy: user.id,
      });
      
      return { id, success: true };
    }),
  
  /**
   * الحصول على مخططات جلسة
   */
  getCharts: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      
      return db.select()
        .from(spreadsheetCharts)
        .where(and(
          eq(spreadsheetCharts.sessionId, input.sessionId),
          eq(spreadsheetCharts.isVisible, true)
        ))
        .orderBy(desc(spreadsheetCharts.createdAt));
    }),
  
  /**
   * تحديث مخطط
   */
  updateChart: protectedProcedure
    .input(z.object({
      chartId: z.string(),
      title: z.string().optional(),
      dataRange: z.string().optional(),
      config: z.any().optional(),
      position: z.any().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      
      const updates: any = {};
      if (input.title) updates.title = input.title;
      if (input.dataRange) updates.dataRange = input.dataRange;
      if (input.config) updates.config = input.config;
      if (input.position) updates.position = input.position;
      if (input.width) updates.width = input.width;
      if (input.height) updates.height = input.height;
      
      await db.update(spreadsheetCharts)
        .set(updates)
        .where(eq(spreadsheetCharts.id, input.chartId));
      
      return { success: true };
    }),
  
  /**
   * حذف مخطط
   */
  deleteChart: protectedProcedure
    .input(z.object({
      chartId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      
      await db.update(spreadsheetCharts)
        .set({ isVisible: false })
        .where(eq(spreadsheetCharts.id, input.chartId));
      
      return { success: true };
    }),
});
