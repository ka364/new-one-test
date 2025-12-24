/**
 * Create 5 Founder Accounts for HaderOS
 * Run with: node scripts/create-founder-accounts.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { founderAccounts } from '../drizzle/schema.js';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Helper functions
function generateSecurePassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getPasswordExpiryDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Last day of current month
  return new Date(year, month + 1, 0, 23, 59, 59);
}

// Founder accounts data
const founders = [
  {
    fullName: 'أحمد شوقي',
    email: 'ahmed.shawky@haderosai.com',
    username: 'ahmed_shawky',
    role: 'CEO & Founder',
    title: 'المؤسس والرئيس التنفيذي',
  },
  {
    fullName: 'ماطه',
    email: 'mata@haderosai.com',
    username: 'mata',
    role: 'Co-Founder',
    title: 'المؤسس المشارك',
  },
  {
    fullName: 'أحمد حسن',
    email: 'ahmed.hassan@haderosai.com',
    username: 'ahmed_hassan',
    role: 'Co-Founder',
    title: 'المؤسس المشارك',
  },
  {
    fullName: 'م. أحمد عبد الغفار',
    email: 'ahmed.abdelghaffar@haderosai.com',
    username: 'ahmed_abdelghaffar',
    role: 'Technical Co-Founder',
    title: 'المؤسس المشارك - التقني',
  },
  {
    fullName: 'أحمد الديب',
    email: 'ahmed.aldeeb@haderosai.com',
    username: 'ahmed_aldeeb',
    role: 'Co-Founder',
    title: 'المؤسس المشارك',
  },
];

console.log('🚀 Creating 5 Founder Accounts for HaderOS...\n');

const createdAccounts = [];

for (const founder of founders) {
  try {
    // Generate secure password
    const password = generateSecurePassword(16);
    const passwordHash = await bcrypt.hash(password, 10);

    // Create account
    const [result] = await db.insert(founderAccounts).values({
      fullName: founder.fullName,
      email: founder.email,
      username: founder.username,
      passwordHash,
      role: founder.role,
      title: founder.title,
      currentMonth: getCurrentMonth(),
      passwordExpiresAt: getPasswordExpiryDate(),
      isActive: true,
      permissions: JSON.stringify(['*']), // Full admin access
      loginCount: 0,
    });

    createdAccounts.push({
      id: result.insertId,
      fullName: founder.fullName,
      email: founder.email,
      username: founder.username,
      password, // Plain password for PDF generation
      role: founder.role,
      title: founder.title,
    });

    console.log(`✅ Created account for: ${founder.fullName}`);
    console.log(`   Username: ${founder.username}`);
    console.log(`   Email: ${founder.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Expires: ${getPasswordExpiryDate().toLocaleDateString('ar-EG')}\n`);
  } catch (error) {
    console.error(`❌ Failed to create account for ${founder.fullName}:`, error.message);
  }
}

console.log(`\n✅ Successfully created ${createdAccounts.length}/5 founder accounts!`);
console.log('\n📋 Summary:');
console.log('─'.repeat(80));
createdAccounts.forEach((account, index) => {
  console.log(`${index + 1}. ${account.fullName} (${account.username})`);
  console.log(`   Email: ${account.email}`);
  console.log(`   Password: ${account.password}`);
  console.log(`   Role: ${account.role}`);
  console.log('');
});

// Save credentials to JSON file for PDF generation
import { writeFileSync } from 'fs';
writeFileSync(
  '/home/ubuntu/haderos-mvp/founder_credentials.json',
  JSON.stringify(createdAccounts, null, 2),
  'utf-8'
);

console.log('💾 Credentials saved to: /home/ubuntu/haderos-mvp/founder_credentials.json');
console.log('\n🎯 Next Steps:');
console.log('1. Generate personalized PDF documents for each founder');
console.log('2. Send credentials via secure channel (WhatsApp/Email)');
console.log('3. Ensure support contact information is included');

await connection.end();
console.log('\n✨ Done!');
