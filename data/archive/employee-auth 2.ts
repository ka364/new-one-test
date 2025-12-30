/**
 * Employee Authentication Router
 * Username/Password + Gmail OTP authentication for monthly employee accounts
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { sendOTPEmail } from "../_core/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Generate 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const employeeAuthRouter = router({
  /**
   * Login with username and password
   * Returns session token if email is already registered
   * Returns needsEmailRegistration flag if email is not registered
   */
  loginWithPassword: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Get employee account
        const employeeResult: any = await db.execute(
          sql`SELECT id, username, password_hash, employee_name, email, email_verified, is_active
              FROM monthly_employee_accounts 
              WHERE username = ${input.username}
              LIMIT 1`
        );

        const employees = Array.isArray(employeeResult) && employeeResult.length > 0 && Array.isArray(employeeResult[0])
          ? employeeResult[0]
          : employeeResult;

        if (!employees || employees.length === 0) {
          return {
            success: false,
            error: "اسم المستخدم أو كلمة المرور غير صحيحة",
          };
        }

        const employee = employees[0];

        // Check if account is active
        if (!employee.is_active) {
          return {
            success: false,
            error: "الحساب غير نشط",
          };
        }

        // Verify password
        const passwordValid = await bcrypt.compare(input.password, employee.password_hash);
        if (!passwordValid) {
          return {
            success: false,
            error: "اسم المستخدم أو كلمة المرور غير صحيحة",
          };
        }

        // Update last login
        await db.execute(
          sql`UPDATE monthly_employee_accounts 
              SET last_login_at = NOW() 
              WHERE id = ${employee.id}`
        );

        // Check if email is registered
        if (!employee.email || !employee.email_verified) {
          // Need to register email
          const sessionToken = generateSessionToken();
          
          return {
            success: true,
            needsEmailRegistration: true,
            sessionToken,
            employee: {
              id: employee.id,
              username: employee.username,
              name: employee.employee_name,
            },
          };
        }

        // Email is registered - send OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db.execute(
          sql`UPDATE monthly_employee_accounts 
              SET otp_code = ${otp},
                  otp_expires_at = ${expiresAt},
                  otp_attempts = 0
              WHERE id = ${employee.id}`
        );

        // Send OTP to email
        await sendOTPEmail(employee.email, employee.employee_name, otp);

        return {
          success: true,
          needsEmailRegistration: false,
          needsOTP: true,
          message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
          employee: {
            id: employee.id,
            username: employee.username,
            name: employee.employee_name,
            email: employee.email,
          },
        };
      } catch (error: any) {
        console.error("[Employee Auth] Login error:", error.message);
        return {
          success: false,
          error: "حدث خطأ في تسجيل الدخول",
        };
      }
    }),

  /**
   * Register employee's Gmail after first login
   */
  registerEmail: publicProcedure
    .input(
      z.object({
        employeeId: z.number(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Update employee email and send OTP
        await db.execute(
          sql`UPDATE monthly_employee_accounts 
              SET email = ${input.email},
                  email_verified = 0,
                  otp_code = ${otp},
                  otp_expires_at = ${expiresAt},
                  otp_attempts = 0
              WHERE id = ${input.employeeId}`
        );

        // Get employee name
        const employeeResult: any = await db.execute(
          sql`SELECT employee_name FROM monthly_employee_accounts WHERE id = ${input.employeeId}`
        );

        const employees = Array.isArray(employeeResult) && employeeResult.length > 0 && Array.isArray(employeeResult[0])
          ? employeeResult[0]
          : employeeResult;

        const employeeName = employees && employees.length > 0 ? employees[0].employee_name : "موظف";

        // Send OTP
        await sendOTPEmail(input.email, employeeName, otp);

        return {
          success: true,
          message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
        };
      } catch (error: any) {
        console.error("[Employee Auth] Register email error:", error.message);
        return {
          success: false,
          error: "حدث خطأ في تسجيل البريد الإلكتروني",
        };
      }
    }),

  /**
   * Verify OTP and complete email registration or login
   */
  verifyOTP: publicProcedure
    .input(
      z.object({
        employeeId: z.number(),
        otp: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Get employee with OTP
        const employeeResult: any = await db.execute(
          sql`SELECT id, username, employee_name, email, otp_code, otp_expires_at, otp_attempts
              FROM monthly_employee_accounts 
              WHERE id = ${input.employeeId}
              LIMIT 1`
        );

        const employees = Array.isArray(employeeResult) && employeeResult.length > 0 && Array.isArray(employeeResult[0])
          ? employeeResult[0]
          : employeeResult;

        if (!employees || employees.length === 0) {
          return {
            success: false,
            error: "الحساب غير موجود",
          };
        }

        const employee = employees[0];

        // Check attempts
        if (employee.otp_attempts >= 5) {
          return {
            success: false,
            error: "تم تجاوز عدد المحاولات المسموحة",
          };
        }

        // Check OTP expiration
        if (new Date() > new Date(employee.otp_expires_at)) {
          return {
            success: false,
            error: "انتهت صلاحية رمز التحقق",
          };
        }

        // Verify OTP
        if (employee.otp_code !== input.otp) {
          // Increment attempts
          await db.execute(
            sql`UPDATE monthly_employee_accounts 
                SET otp_attempts = otp_attempts + 1 
                WHERE id = ${input.employeeId}`
          );

          return {
            success: false,
            error: "رمز التحقق غير صحيح",
          };
        }

        // OTP is valid - mark email as verified and clear OTP
        await db.execute(
          sql`UPDATE monthly_employee_accounts 
              SET email_verified = 1,
                  otp_code = NULL,
                  otp_expires_at = NULL,
                  otp_attempts = 0
              WHERE id = ${input.employeeId}`
        );

        // Generate session token
        const sessionToken = generateSessionToken();

        return {
          success: true,
          sessionToken,
          employee: {
            id: employee.id,
            username: employee.username,
            name: employee.employee_name,
            email: employee.email,
          },
        };
      } catch (error: any) {
        console.error("[Employee Auth] Verify OTP error:", error.message);
        return {
          success: false,
          error: "حدث خطأ في التحقق من الرمز",
        };
      }
    }),

  /**
   * Request password reset - sends OTP to registered email
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Get employee account
        const employeeResult: any = await db.execute(
          sql`SELECT id, username, employee_name, email, email_verified
              FROM monthly_employee_accounts 
              WHERE username = ${input.username}
              LIMIT 1`
        );

        const employees = Array.isArray(employeeResult) && employeeResult.length > 0 && Array.isArray(employeeResult[0])
          ? employeeResult[0]
          : employeeResult;

        if (!employees || employees.length === 0) {
          return {
            success: false,
            error: "اسم المستخدم غير موجود",
          };
        }

        const employee = employees[0];

        // Check if email is registered
        if (!employee.email || !employee.email_verified) {
          return {
            success: false,
            error: "لم يتم تسجيل بريد إلكتروني لهذا الحساب",
          };
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Update OTP
        await db.execute(
          sql`UPDATE monthly_employee_accounts 
              SET otp_code = ${otp},
                  otp_expires_at = ${expiresAt},
                  otp_attempts = 0
              WHERE id = ${employee.id}`
        );

        // Send OTP
        await sendOTPEmail(employee.email, employee.employee_name, otp);

        return {
          success: true,
          employeeId: employee.id,
          message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
        };
      } catch (error: any) {
        console.error("[Employee Auth] Request password reset error:", error.message);
        return {
          success: false,
          error: "حدث خطأ في إرسال رمز التحقق",
        };
      }
    }),

  /**
   * Verify OTP for password reset
   */
  verifyResetOTP: publicProcedure
    .input(
      z.object({
        employeeId: z.number(),
        otp: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Get employee with OTP
        const employeeResult: any = await db.execute(
          sql`SELECT id, otp_code, otp_expires_at, otp_attempts
              FROM monthly_employee_accounts 
              WHERE id = ${input.employeeId}
              LIMIT 1`
        );

        const employees = Array.isArray(employeeResult) && employeeResult.length > 0 && Array.isArray(employeeResult[0])
          ? employeeResult[0]
          : employeeResult;

        if (!employees || employees.length === 0) {
          return {
            success: false,
            error: "الحساب غير موجود",
          };
        }

        const employee = employees[0];

        // Check attempts
        if (employee.otp_attempts >= 5) {
          return {
            success: false,
            error: "تم تجاوز عدد المحاولات المسموحة",
          };
        }

        // Check OTP expiration
        if (new Date() > new Date(employee.otp_expires_at)) {
          return {
            success: false,
            error: "انتهت صلاحية رمز التحقق",
          };
        }

        // Verify OTP
        if (employee.otp_code !== input.otp) {
          // Increment attempts
          await db.execute(
            sql`UPDATE monthly_employee_accounts 
                SET otp_attempts = otp_attempts + 1 
                WHERE id = ${input.employeeId}`
          );

          return {
            success: false,
            error: "رمز التحقق غير صحيح",
          };
        }

        // OTP verified - clear it
        await db.execute(
          sql`UPDATE monthly_employee_accounts 
              SET otp_code = NULL,
                  otp_expires_at = NULL,
                  otp_attempts = 0
              WHERE id = ${input.employeeId}`
        );

        return {
          success: true,
          message: "تم التحقق بنجاح",
        };
      } catch (error: any) {
        console.error("[Employee Auth] Verify reset OTP error:", error.message);
        return {
          success: false,
          error: "حدث خطأ في التحقق",
        };
      }
    }),

  /**
   * Reset password after OTP verification
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        employeeId: z.number(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Hash new password
        const passwordHash = await bcrypt.hash(input.newPassword, 10);

        // Update password
        await db.execute(
          sql`UPDATE monthly_employee_accounts 
              SET password_hash = ${passwordHash}
              WHERE id = ${input.employeeId}`
        );

        return {
          success: true,
          message: "تم تغيير كلمة المرور بنجاح",
        };
      } catch (error: any) {
        console.error("[Employee Auth] Reset password error:", error.message);
        return {
          success: false,
          error: "حدث خطأ في تغيير كلمة المرور",
        };
      }
    }),
});
