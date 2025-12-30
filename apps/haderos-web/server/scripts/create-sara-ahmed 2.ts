/**
 * Create Sara Ahmed employee account with password
 */

import { getDb } from "../db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createSaraAhmed() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const username = "sara.ahmed";
    const password = "Sara@2025";
    const employeeName = "Sara Ahmed";

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert employee
    await db.execute(
      sql`INSERT INTO monthly_employee_accounts 
          (username, password_hash, employee_name, role, is_active, created_at)
          VALUES (${username}, ${passwordHash}, ${employeeName}, 'employee', true, NOW())`
    );

    console.log("✅ Sara Ahmed account created successfully!");
    console.log("Username:", username);
    console.log("Password:", password);
    console.log("Password Hash:", passwordHash);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createSaraAhmed();
