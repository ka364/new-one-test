// @ts-nocheck
import { requireDb } from "./db";
import { sql } from "drizzle-orm";

export const otpDb = {
  // Generate 6-digit OTP
  generateOTP: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Create OTP verification record
  createOTP: async (data: {
    phoneNumber: string;
    email?: string;
    otpCode: string;
    method: "email" | "sms";
    expiresAt: Date;
    latitude?: number;
    longitude?: number;
    ipAddress?: string;
  }) => {
    const db = await requireDb();
    if (!db) throw new Error("Database not available");
    const result = await db.execute(sql`
      INSERT INTO otp_verifications (
        phone_number,
        email,
        otp_code,
        method,
        expires_at,
        latitude,
        longitude,
        ip_address
      ) VALUES (
        ${data.phoneNumber},
        ${data.email || null},
        ${data.otpCode},
        ${data.method},
        ${data.expiresAt},
        ${data.latitude || null},
        ${data.longitude || null},
        ${data.ipAddress || null}
      )
    `);
    return result;
  },

  // Verify OTP
  verifyOTP: async (phoneNumber: string, otpCode: string) => {
    const db = await requireDb();
    if (!db) throw new Error("Database not available");
    // Check if OTP exists and not expired
    const result: any = await db.execute(sql`
      SELECT * FROM otp_verifications
      WHERE phone_number = ${phoneNumber}
        AND otp_code = ${otpCode}
        AND expires_at > NOW()
        AND verified_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (!result || result.length === 0) {
      // Increment failed attempts
      const db2 = await getDb();
      if (db2) await db2.execute(sql`
        UPDATE otp_verifications
        SET verification_attempts = verification_attempts + 1
        WHERE phone_number = ${phoneNumber}
          AND verified_at IS NULL
      `);
      return { success: false, message: "رمز OTP غير صحيح أو منتهي الصلاحية" };
    }

    // Mark as verified
    const db3 = await getDb();
    if (db3) await db3.execute(sql`
      UPDATE otp_verifications
      SET verified_at = NOW()
      WHERE phone_number = ${phoneNumber}
        AND otp_code = ${otpCode}
    `);

    return { success: true, message: "تم التحقق بنجاح" };
  },

  // Get OTP verification record
  getOTPRecord: async (phoneNumber: string) => {
    const db = await requireDb();
    if (!db) return null;
    const result: any = await db.execute(sql`
      SELECT * FROM otp_verifications
      WHERE phone_number = ${phoneNumber}
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return result && result.length > 0 ? result[0] : null;
  },

  // Check if phone can request new OTP (rate limiting)
  canRequestOTP: async (phoneNumber: string): Promise<boolean> => {
    const db = await requireDb();
    if (!db) return false;
    const result: any = await db.execute(sql`
      SELECT COUNT(*) as count FROM otp_verifications
      WHERE phone_number = ${phoneNumber}
        AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);
    const count = result && result.length > 0 ? result[0].count : 0;
    return count < 3; // Max 3 OTP requests per hour
  },

  // Get total employee count (for SMS upgrade check)
  getEmployeeCount: async (): Promise<number> => {
    const db = await requireDb();
    if (!db) return 0;
    const result: any = await db.execute(sql`
      SELECT COUNT(*) as count FROM employees
      WHERE is_active = 1
    `);
    return result && result.length > 0 ? result[0].count : 0;
  },

  // Determine OTP method based on employee count
  getOTPMethod: async (): Promise<"email" | "sms"> => {
    const count = await otpDb.getEmployeeCount();
    return count >= 25 ? "sms" : "email";
  },
};
