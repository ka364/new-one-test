/**
 * Set password for employee account
 */

import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';

async function setEmployeePassword() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }

  const username = 'sara.ahmed';
  const password = 'Sara@2025';

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Update database
  await db.execute(
    sql`UPDATE monthly_employee_accounts 
        SET password_hash = ${passwordHash},
            email = NULL,
            email_verified = 0
        WHERE username = ${username}`
  );

  console.log('✅ Password set successfully!');
  console.log('📧 Email reset to NULL (employee will register their Gmail after first login)');
  console.log('');
  console.log('🔐 Employee Credentials:');
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log('');

  process.exit(0);
}

setEmployeePassword().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
