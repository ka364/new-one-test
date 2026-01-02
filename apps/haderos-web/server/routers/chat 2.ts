import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { requireDb } from '../db';
import { chatMessages } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { UnifiedAIService, AIProvider } from '../_core/ai-service';

export const chatRouter = router({
  // إرسال رسالة مع Unified AI Service
  sendMessage: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(5000),
        provider: z.enum(['auto', 'manus', 'deepseek', 'claude']).optional().default('auto'),
        maxCost: z.number().min(0).max(10).optional().default(0.1),
        model: z.string().optional().default('auto'),
        files: z
          .array(
            z.object({
              name: z.string(),
              url: z.string(),
              type: z.string(),
              size: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { content, provider, maxCost, model, files } = input;
        const userId = ctx.user.id;
        const db = await requireDb();

        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        // 1. حفظ رسالة المستخدم
        await db.insert(chatMessages).values({
          userId,
          role: 'user',
          content,
          metadata: files
            ? JSON.stringify({ files, provider, maxCost })
            : JSON.stringify({ provider, maxCost }),
          createdAt: new Date().toISOString(),
        });

        // 2. الحصول على آخر 10 رسائل للسياق
        const recentMessages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.userId, userId))
          .orderBy(desc(chatMessages.createdAt))
          .limit(10);

        // 3. تحضير الرسائل للنموذج
        const messages = [
          {
            role: 'system' as const,
            content: `أنت مساعد ذكي يتحدث العربية بطلاقة. أنت جزء من نظام HaderOS الأخلاقي. تاريخ اليوم: ${new Date().toLocaleDateString('ar-SA')}`,
          },
          ...recentMessages.reverse().map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
        ];

        // 4. استخدام Unified AI Service
        const aiService = new UnifiedAIService();

        // 5. توليد الرد (مع Smart Routing)
        let aiResponse;

        if (provider === 'auto') {
          // الاختيار الذكي التلقائي
          aiResponse = await aiService.generateResponse(messages, {
            autoSelect: true,
            maxCost,
            model,
            fallback: true,
          });
        } else {
          // استخدام Provider محدد
          const selectedProvider = provider as AIProvider;
          aiResponse = await aiService.generateResponse(messages, {
            provider: selectedProvider,
            autoSelect: false,
            maxCost,
            model,
            fallback: true,
          });
        }

        // 6. حفظ رد الـ AI
        await db.insert(chatMessages).values({
          userId,
          role: 'assistant',
          content: aiResponse.content,
          metadata: JSON.stringify({
            provider: aiResponse.provider,
            model: aiResponse.model,
            cost: aiResponse.cost,
            usage: aiResponse.usage,
            latency: aiResponse.latency,
          }),
          createdAt: new Date().toISOString(),
        });

        // 7. إرجاع النتيجة
        return {
          success: true,
          message: aiResponse.content,
          provider: aiResponse.provider,
          cost: aiResponse.cost,
          latency: aiResponse.latency,
          usage: aiResponse.usage,
          model: aiResponse.model,
          userMessage: {
            id: Date.now(),
            role: 'user' as const,
            content,
            createdAt: new Date().toISOString(),
          },
          aiMessage: {
            id: Date.now() + 1,
            role: 'assistant' as const,
            content: aiResponse.content,
            createdAt: new Date().toISOString(),
          },
        };
      } catch (error: any) {
        console.error('❌ Chat error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'حدث خطأ في المحادثة',
        });
      }
    }),

  // اختبار Unified AI Service
  testAIService: protectedProcedure
    .input(
      z.object({
        message: z.string().optional().default('مرحباً، اختبر النظام'),
        provider: z.enum(['manus', 'deepseek', 'claude', 'auto']).optional().default('auto'),
      })
    )
    .mutation(async ({ input }) => {
      const { message, provider } = input;
      const aiService = new UnifiedAIService();

      const messages = [
        {
          role: 'user' as const,
          content: message,
        },
      ];

      try {
        let result;

        if (provider === 'auto') {
          result = await aiService.generateResponse(messages, {
            autoSelect: true,
            maxCost: 0.05,
          });
        } else {
          result = await aiService.generateResponse(messages, {
            provider: provider as AIProvider,
            autoSelect: false,
            maxCost: 0.05,
          });
        }

        // الحصول على معلومات عن جميع الـ Providers المتاحة
        const availableProviders = aiService.getAvailableProviders();
        const providersInfo = availableProviders.map((p) => aiService.getProviderInfo(p));

        return {
          success: true,
          test: 'Unified AI Service Test',
          provider: result.provider,
          message: result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
          fullMessage: result.content,
          cost: result.cost,
          latency: result.latency,
          availableProviders,
          providersInfo,
          smartRouting: provider === 'auto' ? 'Enabled' : 'Disabled',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          provider,
        };
      }
    }),

  // الحصول على معلومات عن الـ Providers المتاحة
  getAIProviders: protectedProcedure.query(async () => {
    const aiService = new UnifiedAIService();
    const availableProviders = aiService.getAvailableProviders();

    const providersInfo = availableProviders.map((provider) => ({
      id: provider,
      ...aiService.getProviderInfo(provider),
      enabled: true,
    }));

    return {
      availableProviders,
      providersInfo,
      total: availableProviders.length,
      smartRouting: true,
      fallback: true,
      costOptimization: true,
    };
  }),

  // الحصول على تاريخ المحادثة
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await requireDb();

    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed',
      });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(50);

    // حساب التكلفة الإجمالية
    const totalCost = messages.reduce((sum, msg) => {
      try {
        const metadata = msg.metadata ? JSON.parse(msg.metadata as string) : {};
        return sum + (metadata.cost || 0);
      } catch {
        return sum;
      }
    }, 0);

    return {
      messages: messages.reverse(),
      total: messages.length,
      totalCost: parseFloat(totalCost.toFixed(4)),
    };
  }),

  // اختبار بسيط للـ invokeLLM
  test: publicProcedure.query(async () => {
    try {
      const aiService = new UnifiedAIService();
      const response = await aiService.invokeManusLLM([
        {
          role: 'user',
          content: 'قل مرحباً فقط',
        },
      ]);

      return {
        success: true,
        message: 'Unified AI Service يعمل بنجاح!',
        response: response.content,
        provider: response.provider,
        cost: response.cost,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }),

  // مسح المحادثة
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await requireDb();

    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed',
      });
    }

    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));

    return {
      success: true,
      message: 'تم مسح المحادثة',
    };
  }),

  // إحصائيات المحادثة
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await requireDb();

    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed',
      });
    }

    const allMessages = await db.select().from(chatMessages).where(eq(chatMessages.userId, userId));

    const userMessages = allMessages.filter((m) => m.role === 'user');
    const aiMessages = allMessages.filter((m) => m.role === 'assistant');

    // حساب التكلفة الإجمالية
    const totalCost = allMessages.reduce((sum, msg) => {
      try {
        const metadata = msg.metadata ? JSON.parse(msg.metadata as string) : {};
        return sum + (metadata.cost || 0);
      } catch {
        return sum;
      }
    }, 0);

    return {
      total: allMessages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      totalCost: parseFloat(totalCost.toFixed(4)),
      lastMessageAt: allMessages[0]?.createdAt || null,
    };
  }),
});
