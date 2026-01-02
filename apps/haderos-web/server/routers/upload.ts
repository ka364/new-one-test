import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { storagePut } from '../storage';

export const uploadRouter = router({
  // رفع ملف واحد
  uploadFile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number().max(10 * 1024 * 1024), // 10MB كحد أقصى
        data: z.string(), // base64
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { name, type, size, data } = input;

        // 1. التحقق من نوع الملف
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (!allowedTypes.includes(type)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'نوع الملف غير مدعوم',
          });
        }

        // 2. تحويل base64 إلى buffer
        const buffer = Buffer.from(data, 'base64');

        // 3. إنشاء اسم فريد للملف
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = name.split('.').pop() || 'bin';
        const uniqueName = `${ctx.user.id}-${timestamp}-${random}.${extension}`;

        // 4. رفع الملف باستخدام storagePut (مدمج في Manus)
        const fileKey = `chat-uploads/${uniqueName}`;
        const result = await storagePut(fileKey, buffer, type);

        // 5. إرجاع النتيجة
        return {
          success: true,
          url: result.url,
          key: fileKey,
          name: uniqueName,
          originalName: name,
          size,
          type,
        };
      } catch (error: any) {
        console.error('❌ Upload error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `فشل رفع الملف: ${error.message}`,
        });
      }
    }),

  // رفع عدة ملفات
  uploadMultiple: protectedProcedure
    .input(
      z
        .array(
          z.object({
            name: z.string(),
            type: z.string(),
            size: z.number().max(10 * 1024 * 1024),
            data: z.string(),
          })
        )
        .optional()
        .default([])
    )
    .mutation(async ({ ctx, input }) => {
      if (input.length === 0) {
        return {
          success: true,
          files: [],
          message: 'No files to upload',
        };
      }

      try {
        const uploadPromises = input.map(async (file) => {
          const buffer = Buffer.from(file.data, 'base64');
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 8);
          const extension = file.name.split('.').pop() || 'bin';
          const uniqueName = `${ctx.user.id}-${timestamp}-${random}.${extension}`;
          const fileKey = `chat-uploads/${uniqueName}`;

          const result = await storagePut(fileKey, buffer, file.type);

          return {
            url: result.url,
            key: fileKey,
            name: uniqueName,
            originalName: file.name,
            size: file.size,
            type: file.type,
          };
        });

        const files = await Promise.all(uploadPromises);

        return {
          success: true,
          files,
        };
      } catch (error: any) {
        console.error('❌ Multiple upload error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `فشل رفع الملفات: ${error.message}`,
        });
      }
    }),

  // اختبار الرفع
  testUpload: publicProcedure.query(async () => {
    try {
      // إنشاء ملف تجريبي (نصي صغير)
      const testContent = 'هذا ملف تجريبي لاختبار نظام الرفع في HaderOS.';
      const buffer = Buffer.from(testContent, 'utf-8');

      const fileKey = `test/test-${Date.now()}.txt`;
      const result = await storagePut(fileKey, buffer, 'text/plain');

      return {
        success: true,
        message: 'نظام رفع الملفات يعمل بنجاح!',
        url: result.url,
        key: fileKey,
      };
    } catch (error: any) {
      console.error('❌ Test upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }),
});
