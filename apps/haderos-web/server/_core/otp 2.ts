/**
 * OTP (One-Time Password) Service
 * Generates and validates OTP codes for employee authentication
 */

import { requireDb } from "../db";
import { monthlyEmployeeAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Save OTP to database for employee
 */
export async function saveOTP(username: string, otpCode: string): Promise<boolean> {
  const db = await requireDb();
  if (!db) throw new Error("Database not connected");

  // OTP expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  try {
    await db
      .update(monthlyEmployeeAccounts)
      .set({
        otpCode,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
      })
      .where(eq(monthlyEmployeeAccounts.username, username));

    return true;
  } catch (error) {
    console.error("[OTP] Failed to save OTP:", error);
    return false;
  }
}

/**
 * Verify OTP code for employee
 */
export async function verifyOTP(
  username: string,
  otpCode: string
): Promise<{ valid: boolean; message: string }> {
  const db = await requireDb();
  if (!db) throw new Error("Database not connected");

  try {
    const employee = await db
      .select()
      .from(monthlyEmployeeAccounts)
      .where(eq(monthlyEmployeeAccounts.username, username))
      .limit(1);

    if (employee.length === 0) {
      return { valid: false, message: "Employee not found" };
    }

    const emp = employee[0];

    // Check if OTP exists
    if (!emp.otpCode) {
      return { valid: false, message: "No OTP generated" };
    }

    // Check if OTP expired
    if (emp.otpExpiresAt && new Date() > new Date(emp.otpExpiresAt)) {
      return { valid: false, message: "OTP expired" };
    }

    // Check attempts
    if (emp.otpAttempts && emp.otpAttempts >= 3) {
      return { valid: false, message: "Too many attempts. Please request a new OTP" };
    }

    // Verify OTP
    if (emp.otpCode === otpCode) {
      // Clear OTP after successful verification
      await db
        .update(monthlyEmployeeAccounts)
        .set({
          otpCode: null,
          otpExpiresAt: null,
          otpAttempts: 0,
        })
        .where(eq(monthlyEmployeeAccounts.username, username));

      return { valid: true, message: "OTP verified successfully" };
    } else {
      // Increment attempts
      await db
        .update(monthlyEmployeeAccounts)
        .set({
          otpAttempts: (emp.otpAttempts || 0) + 1,
        })
        .where(eq(monthlyEmployeeAccounts.username, username));

      return { valid: false, message: "Invalid OTP code" };
    }
  } catch (error) {
    console.error("[OTP] Failed to verify OTP:", error);
    return { valid: false, message: "Verification failed" };
  }
}

/**
 * Save employee email (first time setup)
 */
export async function saveEmployeeEmail(
  username: string,
  email: string
): Promise<boolean> {
  const db = await requireDb();
  if (!db) throw new Error("Database not connected");

  try {
    await db
      .update(monthlyEmployeeAccounts)
      .set({
        email,
        emailVerified: 0,
      })
      .where(eq(monthlyEmployeeAccounts.username, username));

    return true;
  } catch (error) {
    console.error("[OTP] Failed to save email:", error);
    return false;
  }
}

/**
 * Mark employee email as verified
 */
export async function markEmailVerified(username: string): Promise<boolean> {
  const db = await requireDb();
  if (!db) throw new Error("Database not connected");

  try {
    await db
      .update(monthlyEmployeeAccounts)
      .set({
        emailVerified: 1,
      })
      .where(eq(monthlyEmployeeAccounts.username, username));

    return true;
  } catch (error) {
    console.error("[OTP] Failed to mark email verified:", error);
    return false;
  }
}

/**
 * Get employee email
 */
export async function getEmployeeEmail(username: string): Promise<string | null> {
  const db = await requireDb();
  if (!db) throw new Error("Database not connected");

  try {
    const employee = await db
      .select()
      .from(monthlyEmployeeAccounts)
      .where(eq(monthlyEmployeeAccounts.username, username))
      .limit(1);

    if (employee.length === 0) {
      return null;
    }

    return employee[0].email || null;
  } catch (error) {
    console.error("[OTP] Failed to get employee email:", error);
    return null;
  }
}

/**
 * Check if employee has verified email
 */
export async function hasVerifiedEmail(username: string): Promise<boolean> {
  const db = await requireDb();
  if (!db) throw new Error("Database not connected");

  try {
    const employee = await db
      .select()
      .from(monthlyEmployeeAccounts)
      .where(eq(monthlyEmployeeAccounts.username, username))
      .limit(1);

    if (employee.length === 0) {
      return false;
    }

    return employee[0].email !== null && employee[0].emailVerified === 1;
  } catch (error) {
    console.error("[OTP] Failed to check email verification:", error);
    return false;
  }
}
