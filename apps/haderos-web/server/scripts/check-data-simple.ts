#!/usr/bin/env tsx
/**
 * فحص البيانات بطريقة مباشرة
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Pool } from 'pg';

async function checkData() {
  console.log('🔍 فحص البيانات في قاعدة البيانات...\n');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ موجود' : '❌ غير موجود'}\n`);

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL غير موجود في .env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // اختبار الاتصال
    await pool.query('SELECT NOW()');
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

    // إحصائيات المستخدمين
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`👥 عدد المستخدمين: ${usersResult.rows[0].count}`);

    // إحصائيات الطلبات
    const ordersResult = await pool.query('SELECT COUNT(*) FROM orders');
    console.log(`🛒 عدد الطلبات: ${ordersResult.rows[0].count}`);

    // إحصائيات المعاملات
    const transactionsResult = await pool.query('SELECT COUNT(*) FROM transactions');
    console.log(`💰 عدد المعاملات المالية: ${transactionsResult.rows[0].count}`);

    // إحصائيات سجل التدقيق
    const auditResult = await pool.query('SELECT COUNT(*) FROM "auditTrail"');
    console.log(`📋 عدد سجلات التدقيق: ${auditResult.rows[0].count}`);

    // إحصائيات الأحداث
    try {
      const eventsResult = await pool.query('SELECT COUNT(*) FROM events');
      console.log(`📅 عدد الأحداث: ${eventsResult.rows[0].count}`);
    } catch (e) {
      console.log(`📅 عدد الأحداث: 0 (الجدول غير موجود)`);
    }

    // إحصائيات رؤى AI
    try {
      const insightsResult = await pool.query('SELECT COUNT(*) FROM "agentInsights"');
      console.log(`🤖 عدد رؤى AI: ${insightsResult.rows[0].count}`);
    } catch (e) {
      console.log(`🤖 عدد رؤى AI: 0 (الجدول غير موجود)`);
    }

    // إحصائيات الإشعارات
    try {
      const notificationsResult = await pool.query('SELECT COUNT(*) FROM notifications');
      console.log(`🔔 عدد الإشعارات: ${notificationsResult.rows[0].count}`);
    } catch (e) {
      console.log(`🔔 عدد الإشعارات: 0 (الجدول غير موجود)`);
    }

    console.log('\n');

    // إجمالي الإيرادات
    const revenueResult = await pool.query(`
      SELECT SUM(CAST("totalAmount" AS DECIMAL)) as total
      FROM orders
      WHERE status = 'completed'
    `);
    const totalRevenue = revenueResult.rows[0]?.total || 0;
    console.log(`💰 إجمالي الإيرادات (الطلبات المكتملة): ${Number(totalRevenue).toFixed(2)} ج.م\n`);

    // توزيع الطلبات حسب الحالة
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('📊 توزيع الطلبات حسب الحالة:');
    statusResult.rows.forEach((row: any) => {
      console.log(`   ${row.status}: ${row.count} طلب`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    await pool.end();
    process.exit(1);
  }
}

checkData();
