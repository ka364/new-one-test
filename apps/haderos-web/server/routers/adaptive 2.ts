import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import {
  trackUserBehavior,
  analyzeUserPatterns,
  acceptSuggestion,
  rejectSuggestion,
  getUserDynamicIcons,
  getPendingSuggestions,
  incrementIconUsage,
} from '../services/adaptiveLearning';
import { getAllTaskPatterns, getAllAiSuggestions, getAllDynamicIcons } from '../db-adaptive';
import {
  createGoogleSheet,
  createInvoice,
  createDailyReport,
  getShareableLink,
  listFiles,
} from '../services/googleDrive';

/**
 * Adaptive Learning & Dynamic UI Router
 */
export const adaptiveRouter = router({
  // تتبع سلوك المستخدم
  trackBehavior: protectedProcedure
    .input(
      z.object({
        actionType: z.string(),
        actionData: z.record(z.string(), z.any()).optional(),
        context: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackUserBehavior(ctx.user.id, input.actionType, input.actionData, input.context);
      return { success: true };
    }),

  // الحصول على الأيقونات الديناميكية
  getDynamicIcons: protectedProcedure.query(async ({ ctx }) => {
    return await getUserDynamicIcons(ctx.user.id);
  }),

  // الحصول على الاقتراحات المعلقة
  getPendingSuggestions: protectedProcedure.query(async ({ ctx }) => {
    return await getPendingSuggestions(ctx.user.id);
  }),

  // قبول اقتراح
  acceptSuggestion: protectedProcedure
    .input(z.object({ suggestionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await acceptSuggestion(input.suggestionId, ctx.user.id);
      return { success: true };
    }),

  // رفض اقتراح
  rejectSuggestion: protectedProcedure
    .input(
      z.object({
        suggestionId: z.number(),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await rejectSuggestion(input.suggestionId, ctx.user.id, input.feedback);
      return { success: true };
    }),

  // استخدام أيقونة
  useIcon: protectedProcedure
    .input(z.object({ iconId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await incrementIconUsage(input.iconId, ctx.user.id);

      // تتبع الاستخدام
      await trackUserBehavior(ctx.user.id, 'use_icon', { iconId: input.iconId });

      return { success: true };
    }),

  // تحليل الأنماط يدوياً
  analyzePatterns: protectedProcedure.mutation(async ({ ctx }) => {
    await analyzeUserPatterns(ctx.user.id);
    return { success: true };
  }),

  // Admin endpoints for manager dashboard
  getAllPatterns: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await getAllTaskPatterns(input?.limit);
    }),

  getAllSuggestions: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await getAllAiSuggestions(input?.limit);
    }),

  getAllIcons: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await getAllDynamicIcons(input?.limit);
    }),

  // Google Sheets Operations

  // إنشاء فاتورة
  createInvoice: protectedProcedure
    .input(
      z.object({
        invoiceNumber: z.string(),
        customerName: z.string(),
        items: z.array(
          z.object({
            name: z.string(),
            quantity: z.number(),
            price: z.number(),
          })
        ),
        total: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // تتبع السلوك
      await trackUserBehavior(ctx.user.id, 'create_invoice', input);

      // إنشاء الفاتورة
      const result = await createInvoice(ctx.user.name || 'user', input);

      return {
        success: true,
        path: result.path,
        link: result.link,
      };
    }),

  // إنشاء تقرير يومي
  createDailyReport: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        metrics: z.array(
          z.object({
            name: z.string(),
            value: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // تتبع السلوك
      await trackUserBehavior(ctx.user.id, 'daily_report', input);

      // إنشاء التقرير
      const result = await createDailyReport(ctx.user.name || 'user', input);

      return {
        success: true,
        path: result.path,
        link: result.link,
      };
    }),

  // إنشاء Google Sheet مخصص
  createCustomSheet: protectedProcedure
    .input(
      z.object({
        sheetName: z.string(),
        folderPath: z.string(),
        data: z.array(z.array(z.string())),
        taskType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // تتبع السلوك
      if (input.taskType) {
        await trackUserBehavior(ctx.user.id, input.taskType, {
          sheetName: input.sheetName,
        });
      }

      // إنشاء الملف
      const result = await createGoogleSheet(input.sheetName, input.folderPath, input.data);

      return {
        success: true,
        path: result.path,
        link: result.link,
      };
    }),

  // عرض ملفات المستخدم
  listUserFiles: protectedProcedure
    .input(z.object({ folderPath: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const folderPath = input.folderPath || ctx.user.name || 'user';
      return await listFiles(folderPath);
    }),

  // الحصول على رابط مشاركة
  getShareableLink: protectedProcedure
    .input(z.object({ filePath: z.string() }))
    .query(async ({ input }) => {
      const link = await getShareableLink(input.filePath);
      return { link };
    }),
});
