import { z } from 'zod';
import { router, publicProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { eq, desc } from 'drizzle-orm';
import { investors, investorActivity } from '../../drizzle/schema';
import { requireDb } from '../db';
import bcrypt from 'bcryptjs';

export const investorsRouter = router({
  // Login
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      if (!db)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Find investor by email
      const [investor] = await db
        .select()
        .from(investors)
        .where(eq(investors.email, input.email))
        .limit(1);

      if (!investor) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(input.password, investor.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        });
      }

      // Check if investor is active
      if (investor.status !== 'active') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'حسابك غير نشط. يرجى التواصل مع الإدارة',
        });
      }

      // Update last login
      await db
        .update(investors)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(investors.id, investor.id));

      // Log login activity
      await db.insert(investorActivity).values({
        investorId: investor.id,
        actionType: 'login',
        pagePath: '/investor/login',
        pageTitle: 'تسجيل الدخول',
        createdAt: new Date().toISOString(),
      });

      // Return investor data (without password)
      return {
        id: investor.id,
        name: investor.name,
        email: investor.email,
        company: investor.company,
      };
    }),

  // Get investor activity
  getActivity: publicProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    if (!db)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    // Get investor ID from session (stored in localStorage on client)
    // For now, we'll return empty array if no session
    // In production, you'd validate the session token here

    // This is a simplified version - in production, validate session first
    return [];
  }),

  // Track page view
  trackPageView: publicProcedure
    .input(
      z.object({
        investorId: z.number(),
        pagePath: z.string(),
        pageTitle: z.string().optional(),
        timeSpent: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      if (!db)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      await db.insert(investorActivity).values({
        investorId: input.investorId,
        actionType: 'page_view',
        pagePath: input.pagePath,
        pageTitle: input.pageTitle,
        timeSpent: input.timeSpent || 0,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  // Track KAIA test
  trackKAIATest: publicProcedure
    .input(
      z.object({
        investorId: z.number(),
        testData: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      if (!db)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      await db.insert(investorActivity).values({
        investorId: input.investorId,
        actionType: 'kaia_test',
        pagePath: '/investor/kaia-demo',
        pageTitle: 'KAIA Compliance Test',
        actionData: input.testData,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  // Admin: Create investor account
  createInvestor: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        company: z.string().optional(),
        phone: z.string().optional(),
        password: z.string().min(8),
        investmentInterest: z.number().optional(),
        notes: z.string().optional(),
        createdBy: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      if (!db)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Check if email already exists
      const [existing] = await db
        .select()
        .from(investors)
        .where(eq(investors.email, input.email))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'البريد الإلكتروني مستخدم بالفعل',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create investor
      const [newInvestor] = await db.insert(investors).values({
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone,
        passwordHash,
        status: 'active',
        investmentInterest: input.investmentInterest?.toString(),
        notes: input.notes,
        createdBy: input.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        id: newInvestor.insertId,
        email: input.email,
        password: input.password, // Return plain password for admin to share
      };
    }),

  // Admin: Get all investors
  getAllInvestors: publicProcedure.query(async () => {
    const db = await requireDb();
    if (!db)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const allInvestors = await db.select().from(investors).orderBy(desc(investors.createdAt));

    return allInvestors;
  }),

  // Admin: Get investor activity by ID
  getInvestorActivity: publicProcedure
    .input(
      z.object({
        investorId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      if (!db)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const activity = await db
        .select()
        .from(investorActivity)
        .where(eq(investorActivity.investorId, input.investorId))
        .orderBy(desc(investorActivity.createdAt))
        .limit(100);

      return activity;
    }),
});
