import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import * as XLSX from 'xlsx';
import {
  generateMonthlyAccounts,
  verifyEmployeeLogin,
  getActiveAccountsForMonth,
  deactivateAccount,
  expireOldAccounts,
  submitEmployeeData,
  getEmployeeSubmissions,
  getAllSubmissionsForMonth,
  getGenerationLogs,
} from '../db-employees';

export const employeesRouter = router({
  // Generate monthly accounts (Admin only)
  generateAccounts: protectedProcedure
    .input(
      z.object({
        employeeNames: z.array(z.string()),
        month: z.string(), // Format: YYYY-MM
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admin can generate accounts
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const accounts = await generateMonthlyAccounts(input.employeeNames, input.month, ctx.user.id);

      // Generate Excel file with credentials
      const workbook = XLSX.utils.book_new();
      const worksheetData = [
        ['اسم الموظف', 'اسم المستخدم', 'كلمة المرور المؤقتة', 'الشهر', 'تاريخ الانتهاء'],
        ...accounts.map((acc: any) => [
          acc.employeeName,
          acc.username,
          acc.tempPassword,
          acc.month,
          new Date(acc.expiresAt).toLocaleDateString('ar-EG'),
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'حسابات الموظفين');

      // Convert to buffer
      const excelBuffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      });

      // Convert buffer to base64 for download
      const excelBase64 = excelBuffer.toString('base64');

      return {
        accounts: accounts.map((acc: any) => ({
          id: acc.id,
          employeeName: acc.employeeName,
          username: acc.username,
          month: acc.month,
          expiresAt: acc.expiresAt,
        })),
        excelFile: excelBase64,
        fileName: `employee_accounts_${input.month}.xlsx`,
      };
    }),

  // Employee login
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const account = await verifyEmployeeLogin(input.username, input.password);

      if (!account) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة، أو انتهت صلاحية الحساب',
        });
      }

      return {
        accountId: account.id,
        employeeName: account.employeeName,
        month: account.month,
        expiresAt: account.expiresAt,
      };
    }),

  // Get active accounts for a month (Admin only)
  getActiveAccounts: protectedProcedure
    .input(z.object({ month: z.string() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return await getActiveAccountsForMonth(input.month);
    }),

  // Deactivate account (Admin only)
  deactivateAccount: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await deactivateAccount(input.accountId);
      return { success: true };
    }),

  // Auto-expire old accounts (Admin only)
  expireOldAccounts: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    await expireOldAccounts();
    return { success: true };
  }),

  // Submit employee data
  submitData: publicProcedure
    .input(
      z.object({
        accountId: z.number(),
        dataType: z.string(),
        dataJson: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const data = await submitEmployeeData(input.accountId, input.dataType, input.dataJson);

      return data;
    }),

  // Get employee submissions
  getMySubmissions: publicProcedure
    .input(z.object({ accountId: z.number() }))
    .query(async ({ input }) => {
      return await getEmployeeSubmissions(input.accountId);
    }),

  // Get all submissions for a month (Admin only)
  getAllSubmissions: protectedProcedure
    .input(z.object({ month: z.string() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return await getAllSubmissionsForMonth(input.month);
    }),

  // Get generation logs (Admin only)
  getGenerationLogs: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return await getGenerationLogs(input.limit);
    }),

  // ============================================
  // OTP EMAIL VERIFICATION
  // ============================================

  /**
   * Register employee email (first time)
   */
  registerEmail: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const { generateOTP, saveOTP, saveEmployeeEmail } = await import('../_core/otp');
      const { sendEmailVerificationOTP } = await import('../_core/email');

      // Verify login credentials first
      const employee = await verifyEmployeeLogin(input.username, input.password);

      if (!employee) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }

      // Save email
      await saveEmployeeEmail(input.username, input.email);

      // Generate and save OTP
      const otpCode = generateOTP();
      await saveOTP(input.username, otpCode);

      // Send OTP email
      await sendEmailVerificationOTP(input.email, otpCode, employee.employeeName);

      return {
        success: true,
        message: 'OTP sent to your email',
      };
    }),

  /**
   * Verify email with OTP (first time)
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        username: z.string(),
        otpCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { verifyOTP, markEmailVerified } = await import('../_core/otp');

      const result = await verifyOTP(input.username, input.otpCode);

      if (!result.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message,
        });
      }

      // Mark email as verified
      await markEmailVerified(input.username);

      return {
        success: true,
        message: 'Email verified successfully',
      };
    }),

  /**
   * Login and send OTP (subsequent logins)
   */
  loginWithOTP: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { generateOTP, saveOTP, getEmployeeEmail, hasVerifiedEmail } =
        await import('../_core/otp');
      const { sendOTPEmail } = await import('../_core/email');

      // Verify login credentials
      const employee = await verifyEmployeeLogin(input.username, input.password);

      if (!employee) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }

      // Check if email is verified
      const emailVerified = await hasVerifiedEmail(input.username);

      if (!emailVerified) {
        return {
          success: false,
          requiresEmailSetup: true,
          message: 'Please register your email first',
        };
      }

      // Get employee email
      const email = await getEmployeeEmail(input.username);

      if (!email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No email found for this account',
        });
      }

      // Generate and save OTP
      const otpCode = generateOTP();
      await saveOTP(input.username, otpCode);

      // Send OTP email
      await sendOTPEmail(email, otpCode, employee.employeeName);

      return {
        success: true,
        requiresOTP: true,
        message: 'OTP sent to your email',
      };
    }),

  /**
   * Verify OTP and complete login
   */
  verifyOTPLogin: publicProcedure
    .input(
      z.object({
        username: z.string(),
        otpCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { verifyOTP } = await import('../_core/otp');

      const result = await verifyOTP(input.username, input.otpCode);

      if (!result.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message,
        });
      }

      // Get employee details
      const employee = await getActiveAccountsForMonth(new Date().toISOString().slice(0, 7));
      const emp = employee.find((e: any) => e.username === input.username);

      if (!emp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Employee not found',
        });
      }

      return {
        success: true,
        employee: {
          id: emp.id,
          name: emp.employeeName,
          username: emp.username,
        },
      };
    }),
});
