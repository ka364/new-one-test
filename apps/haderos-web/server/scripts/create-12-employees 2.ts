/**
 * Create 12 employee accounts with passwords
 */

import { getDb } from '../db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const employees = [
  { username: 'ahmed.hassan', name: 'Ahmed Hassan', password: 'Ahmed@2025' },
  { username: 'fatima.ali', name: 'Fatima Ali', password: 'Fatima@2025' },
  { username: 'mohamed.ibrahim', name: 'Mohamed Ibrahim', password: 'Mohamed@2025' },
  { username: 'layla.mahmoud', name: 'Layla Mahmoud', password: 'Layla@2025' },
  { username: 'omar.khalil', name: 'Omar Khalil', password: 'Omar@2025' },
  { username: 'nour.said', name: 'Nour Said', password: 'Nour@2025' },
  { username: 'youssef.adel', name: 'Youssef Adel', password: 'Youssef@2025' },
  { username: 'mona.farid', name: 'Mona Farid', password: 'Mona@2025' },
  { username: 'khaled.mostafa', name: 'Khaled Mostafa', password: 'Khaled@2025' },
  { username: 'heba.nabil', name: 'Heba Nabil', password: 'Heba@2025' },
  { username: 'tarek.samy', name: 'Tarek Samy', password: 'Tarek@2025' },
  { username: 'dina.kamal', name: 'Dina Kamal', password: 'Dina@2025' },
];

async function createEmployees() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    console.log('🚀 Creating 12 employee accounts...\n');

    for (const emp of employees) {
      try {
        // Hash password
        const passwordHash = await bcrypt.hash(emp.password, 10);

        // Insert employee
        await db.execute(
          sql`INSERT INTO monthly_employee_accounts 
              (username, password_hash, employee_name, month, expires_at, is_active, created_at)
              VALUES (${emp.username}, ${passwordHash}, ${emp.name}, '2025-12', '2026-01-31', true, NOW())`
        );

        console.log(`✅ ${emp.name} (${emp.username})`);
      } catch (error: any) {
        if (error.message.includes('Duplicate entry')) {
          console.log(`⚠️  ${emp.name} (${emp.username}) - Already exists`);
        } else {
          console.log(`❌ ${emp.name} (${emp.username}) - Error: ${error.message}`);
        }
      }
    }

    console.log('\n📋 **Employee Credentials:**\n');
    console.log('| Username | Password | Name |');
    console.log('|----------|----------|------|');
    for (const emp of employees) {
      console.log(`| ${emp.username} | ${emp.password} | ${emp.name} |`);
    }

    console.log('\n✅ All done!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

createEmployees();
