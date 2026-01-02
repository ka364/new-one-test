/**
 * Founder Accounts tRPC Router
 * Handles founder authentication, account management, and monthly password rotation
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import {
  createFounderAccount,
  getFounderByUsername,
  getFounderByEmail,
  getFounderById,
  getAllFounders,
  verifyFounderPassword,
  updateFounderLastLogin,
  updateFounderPassword,
  deactivateFounderAccount,
  activateFounderAccount,
  logFounderLogin,
  getFounderLoginHistory,
  getAllLoginHistory,
  getFoundersNeedingPasswordRotation,
  generateSecurePassword,
  getCurrentMonth,
  getPasswordExpiryDate,
} from '../db-founders';
import { TRPCError } from '@trpc/server';

export const foundersRouter = router({
  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Founder login
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await verifyFounderPassword(input.username, input.password);

      if (!result) {
        // Log failed login
        const founder = await getFounderByUsername(input.username);
        if (founder) {
          await logFounderLogin({
            founderId: founder.id,
            success: false,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            failureReason: 'Invalid credentials',
          });
        }

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        });
      }

      if (result.expired) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'انتهت صلاحية كلمة المرور. يرجى التواصل مع الإدارة لتحديثها',
        });
      }

      const founder = result.founder;

      // Update last login
      await updateFounderLastLogin(founder.id, input.ipAddress);

      // Log successful login
      await logFounderLogin({
        founderId: founder.id,
        success: true,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      // Return founder data (without password hash)
      const { passwordHash, ...founderData } = founder;
      return {
        success: true,
        founder: founderData,
        message: `مرحباً ${founder.fullName}!`,
      };
    }),

  /**
   * Get current founder (from session)
   */
  me: publicProcedure.input(z.object({ founderId: z.number() })).query(async ({ input }) => {
    const founder = await getFounderById(input.founderId);
    if (!founder) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'الحساب غير موجود',
      });
    }

    const { passwordHash, ...founderData } = founder;
    return founderData;
  }),

  // ============================================
  // ACCOUNT MANAGEMENT (Admin Only)
  // ============================================

  /**
   * Create new founder account
   */
  create: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
        username: z.string().min(3),
        role: z.string().min(1),
        title: z.string().optional(),
        generatePassword: z.boolean().default(true),
        customPassword: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if username or email already exists
      const existingByUsername = await getFounderByUsername(input.username);
      if (existingByUsername) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'اسم المستخدم مستخدم بالفعل',
        });
      }

      const existingByEmail = await getFounderByEmail(input.email);
      if (existingByEmail) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'البريد الإلكتروني مستخدم بالفعل',
        });
      }

      // Generate or use custom password
      const password = input.generatePassword ? generateSecurePassword() : input.customPassword!;

      // Create account
      const account = await createFounderAccount({
        fullName: input.fullName,
        email: input.email,
        username: input.username,
        password,
        role: input.role,
        title: input.title,
        currentMonth: getCurrentMonth(),
        passwordExpiresAt: getPasswordExpiryDate(),
      });

      return {
        success: true,
        account,
        temporaryPassword: password,
        message: 'تم إنشاء الحساب بنجاح',
      };
    }),

  /**
   * Get all founders
   */
  getAll: protectedProcedure.query(async () => {
    const founders = await getAllFounders();
    // Remove password hashes
    return founders.map(({ passwordHash, ...founder }) => founder);
  }),

  /**
   * Get founder by ID
   */
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const founder = await getFounderById(input.id);
    if (!founder) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'الحساب غير موجود',
      });
    }

    const { passwordHash, ...founderData } = founder;
    return founderData;
  }),

  /**
   * Update founder password
   */
  updatePassword: protectedProcedure
    .input(
      z.object({
        founderId: z.number(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      await updateFounderPassword(
        input.founderId,
        input.newPassword,
        getCurrentMonth(),
        getPasswordExpiryDate()
      );

      return {
        success: true,
        message: 'تم تحديث كلمة المرور بنجاح',
      };
    }),

  /**
   * Deactivate founder account
   */
  deactivate: protectedProcedure
    .input(z.object({ founderId: z.number() }))
    .mutation(async ({ input }) => {
      await deactivateFounderAccount(input.founderId);
      return {
        success: true,
        message: 'تم تعطيل الحساب بنجاح',
      };
    }),

  /**
   * Activate founder account
   */
  activate: protectedProcedure
    .input(z.object({ founderId: z.number() }))
    .mutation(async ({ input }) => {
      await activateFounderAccount(input.founderId);
      return {
        success: true,
        message: 'تم تفعيل الحساب بنجاح',
      };
    }),

  // ============================================
  // LOGIN HISTORY & AUDIT
  // ============================================

  /**
   * Get login history for a founder
   */
  getLoginHistory: protectedProcedure
    .input(
      z.object({
        founderId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      return getFounderLoginHistory(input.founderId, input.limit);
    }),

  /**
   * Get all login history (admin view)
   */
  getAllLoginHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return getAllLoginHistory(input.limit);
    }),

  // ============================================
  // MONTHLY PASSWORD ROTATION
  // ============================================

  /**
   * Check founders needing password rotation
   */
  checkPasswordRotation: protectedProcedure.query(async () => {
    return getFoundersNeedingPasswordRotation();
  }),

  /**
   * Rotate password for a founder
   */
  rotatePassword: protectedProcedure
    .input(z.object({ founderId: z.number() }))
    .mutation(async ({ input }) => {
      const newPassword = generateSecurePassword();

      await updateFounderPassword(
        input.founderId,
        newPassword,
        getCurrentMonth(),
        getPasswordExpiryDate()
      );

      return {
        success: true,
        newPassword,
        message: 'تم تجديد كلمة المرور بنجاح',
      };
    }),

  /**
   * Rotate passwords for all founders (monthly automation)
   */
  rotateAllPasswords: protectedProcedure.mutation(async () => {
    const founders = await getAllFounders();
    const results = [];

    for (const founder of founders) {
      if (!founder.isActive) continue;

      const newPassword = generateSecurePassword();
      await updateFounderPassword(
        founder.id,
        newPassword,
        getCurrentMonth(),
        getPasswordExpiryDate()
      );

      results.push({
        founderId: founder.id,
        fullName: founder.fullName,
        email: founder.email,
        newPassword,
      });
    }

    return {
      success: true,
      rotatedCount: results.length,
      results,
      message: `تم تجديد كلمات المرور لـ ${results.length} مؤسس`,
    };
  }),
});
