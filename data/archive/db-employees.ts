import { getDb } from "./db";
import { monthlyEmployeeAccounts, employeeMonthlyData, accountGenerationLogs } from "../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

/**
 * Generate monthly accounts for employees
 */
export async function generateMonthlyAccounts(
  employeeNames: string[],
  month: string, // Format: YYYY-MM
  generatedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const accounts = [];
  const expiresAt = new Date(month + '-01');
  expiresAt.setMonth(expiresAt.getMonth() + 1); // Expire at end of month

  for (const name of employeeNames) {
    const username = `${name.toLowerCase().replace(/\s+/g, '_')}_${month.replace('-', '')}`;
    const tempPassword = nanoid(8); // Generate 8-char random password
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await db.insert(monthlyEmployeeAccounts).values({
      employeeName: name,
      username,
      passwordHash,
      month,
      expiresAt,
      isActive: true,
    });

    // Get the inserted account
    const [account] = await db
      .select()
      .from(monthlyEmployeeAccounts)
      .where(eq(monthlyEmployeeAccounts.username, username))
      .limit(1);

    accounts.push({
      ...account,
      tempPassword, // Include temp password for Excel export
    });
  }

  // Log generation
  await db.insert(accountGenerationLogs).values({
    month,
    accountsGenerated: accounts.length,
    generatedBy,
  });

  return accounts;
}

/**
 * Verify employee login
 */
export async function verifyEmployeeLogin(username: string, password: string) {
  const db = await getDb();
  if (!db) return null;

  const [account] = await db
    .select()
    .from(monthlyEmployeeAccounts)
    .where(
      and(
        eq(monthlyEmployeeAccounts.username, username),
        eq(monthlyEmployeeAccounts.isActive, true)
      )
    )
    .limit(1);

  if (!account) {
    return null;
  }

  // Check if account expired
  if (new Date() > new Date(account.expiresAt)) {
    return null;
  }

  // Verify password
  const isValid = await bcrypt.compare(password, account.passwordHash);
  if (!isValid) {
    return null;
  }

  // Update last login
  await db
    .update(monthlyEmployeeAccounts)
    .set({ lastLoginAt: new Date() })
    .where(eq(monthlyEmployeeAccounts.id, account.id));

  return account;
}

/**
 * Get all active accounts for a month
 */
export async function getActiveAccountsForMonth(month: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(monthlyEmployeeAccounts)
    .where(
      and(
        eq(monthlyEmployeeAccounts.month, month),
        eq(monthlyEmployeeAccounts.isActive, true)
      )
    );
}

/**
 * Deactivate account
 */
export async function deactivateAccount(accountId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(monthlyEmployeeAccounts)
    .set({ isActive: false })
    .where(eq(monthlyEmployeeAccounts.id, accountId));
}

/**
 * Auto-expire old accounts
 */
export async function expireOldAccounts() {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  await db
    .update(monthlyEmployeeAccounts)
    .set({ isActive: false })
    .where(
      and(
        eq(monthlyEmployeeAccounts.isActive, true),
        lte(monthlyEmployeeAccounts.expiresAt, now)
      )
    );
}

/**
 * Submit employee data
 */
export async function submitEmployeeData(
  accountId: number,
  dataType: string,
  dataJson: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(employeeMonthlyData).values({
    accountId,
    dataType,
    dataJson,
  });

  // Get the inserted data
  const [data] = await db
    .select()
    .from(employeeMonthlyData)
    .where(eq(employeeMonthlyData.accountId, accountId))
    .orderBy(employeeMonthlyData.submittedAt)
    .limit(1);

  return data;
}

/**
 * Get employee submissions
 */
export async function getEmployeeSubmissions(accountId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(employeeMonthlyData)
    .where(eq(employeeMonthlyData.accountId, accountId));
}

/**
 * Get all submissions for a month
 */
export async function getAllSubmissionsForMonth(month: string) {
  const db = await getDb();
  if (!db) return [];

  const accounts = await getActiveAccountsForMonth(month);
  const accountIds = accounts.map((a: any) => a.id);

  if (accountIds.length === 0) {
    return [];
  }

  // Get all submissions for these accounts
  const allSubmissions = [];
  for (const accountId of accountIds) {
    const submissions = await db
      .select()
      .from(employeeMonthlyData)
      .where(eq(employeeMonthlyData.accountId, accountId));
    allSubmissions.push(...submissions);
  }

  return allSubmissions;
}

/**
 * Get generation logs
 */
export async function getGenerationLogs(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(accountGenerationLogs)
    .orderBy(accountGenerationLogs.createdAt)
    .limit(limit);
}
