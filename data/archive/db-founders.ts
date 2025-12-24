/**
 * Founder Accounts Database Functions
 * Handles founder authentication, account management, and audit trail
 */

import { getDb } from "./db";
import { founderAccounts, founderLoginHistory } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

// ============================================
// FOUNDER ACCOUNT MANAGEMENT
// ============================================

/**
 * Create a new founder account
 */
export async function createFounderAccount(data: {
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: string;
  title?: string;
  currentMonth: string;
  passwordExpiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  const [account] = await db.insert(founderAccounts).values({
    fullName: data.fullName,
    email: data.email,
    username: data.username,
    passwordHash,
    role: data.role,
    title: data.title,
    currentMonth: data.currentMonth,
    passwordExpiresAt: data.passwordExpiresAt,
    isActive: true,
    permissions: ['*'], // Full admin access
    loginCount: 0,
  });
  
  return account;
}

/**
 * Get founder account by username
 */
export async function getFounderByUsername(username: string) {
  const db = await getDb();
  if (!db) return null;
  const [founder] = await db
    .select()
    .from(founderAccounts)
    .where(eq(founderAccounts.username, username))
    .limit(1);
  
  return founder || null;
}

/**
 * Get founder account by email
 */
export async function getFounderByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const [founder] = await db
    .select()
    .from(founderAccounts)
    .where(eq(founderAccounts.email, email))
    .limit(1);
  
  return founder || null;
}

/**
 * Get founder account by ID
 */
export async function getFounderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [founder] = await db
    .select()
    .from(founderAccounts)
    .where(eq(founderAccounts.id, id))
    .limit(1);
  
  return founder || null;
}

/**
 * Get all founder accounts
 */
export async function getAllFounders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(founderAccounts).orderBy(desc(founderAccounts.createdAt));
}

/**
 * Verify founder password
 */
export async function verifyFounderPassword(username: string, password: string) {
  const founder = await getFounderByUsername(username);
  if (!founder) return null;
  
  const isValid = await bcrypt.compare(password, founder.passwordHash);
  if (!isValid) return null;
  
  // Check if account is active
  if (!founder.isActive) return null;
  
  // Check if password expired
  if (new Date() > new Date(founder.passwordExpiresAt)) {
    return { expired: true, founder };
  }
  
  return { expired: false, founder };
}

/**
 * Update founder last login
 */
export async function updateFounderLastLogin(founderId: number, ipAddress?: string) {
  const db = await getDb();
  if (!db) return;
  const [current] = await db
    .select({ loginCount: founderAccounts.loginCount })
    .from(founderAccounts)
    .where(eq(founderAccounts.id, founderId));
  
  await db
    .update(founderAccounts)
    .set({
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      loginCount: (current?.loginCount || 0) + 1,
    })
    .where(eq(founderAccounts.id, founderId));
}

/**
 * Update founder password
 */
export async function updateFounderPassword(
  founderId: number,
  newPassword: string,
  currentMonth: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) return;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await db
    .update(founderAccounts)
    .set({
      passwordHash,
      currentMonth,
      passwordExpiresAt: expiresAt,
      lastPasswordChangeAt: new Date(),
    })
    .where(eq(founderAccounts.id, founderId));
}

/**
 * Deactivate founder account
 */
export async function deactivateFounderAccount(founderId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(founderAccounts)
    .set({ isActive: false })
    .where(eq(founderAccounts.id, founderId));
}

/**
 * Activate founder account
 */
export async function activateFounderAccount(founderId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(founderAccounts)
    .set({ isActive: true })
    .where(eq(founderAccounts.id, founderId));
}

// ============================================
// LOGIN HISTORY & AUDIT TRAIL
// ============================================

/**
 * Log founder login attempt
 */
export async function logFounderLogin(data: {
  founderId: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
  sessionId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(founderLoginHistory).values({
    founderId: data.founderId,
    success: data.success,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    failureReason: data.failureReason,
    sessionId: data.sessionId,
    loginAt: new Date(),
  });
}

/**
 * Get founder login history
 */
export async function getFounderLoginHistory(founderId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(founderLoginHistory)
    .where(eq(founderLoginHistory.founderId, founderId))
    .orderBy(desc(founderLoginHistory.loginAt))
    .limit(limit);
}

/**
 * Get all login history (admin view)
 */
export async function getAllLoginHistory(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(founderLoginHistory)
    .orderBy(desc(founderLoginHistory.loginAt))
    .limit(limit);
}

// ============================================
// MONTHLY PASSWORD ROTATION
// ============================================

/**
 * Check if any founder passwords need rotation
 */
export async function getFoundersNeedingPasswordRotation() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  
  return db
    .select()
    .from(founderAccounts)
    .where(eq(founderAccounts.isActive, true))
    .then(founders => founders.filter(f => new Date(f.passwordExpiresAt) < now));
}

/**
 * Generate new password for founder (monthly rotation)
 */
export function generateSecurePassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Get current month string (YYYY-MM)
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get password expiry date (end of current month)
 */
export function getPasswordExpiryDate(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Last day of current month
  return new Date(year, month + 1, 0, 23, 59, 59);
}
