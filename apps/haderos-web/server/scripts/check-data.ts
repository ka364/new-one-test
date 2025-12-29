#!/usr/bin/env tsx
/**
 * فحص البيانات في قاعدة البيانات
 */

import { getDb } from '../db';
import { users, orders, transactions, auditTrail, events, agentInsights, notifications } from '../../drizzle/schema';
import { sql } from 'drizzle-orm';

async function checkData() {
  console.log('🔍 فحص البيانات في قاعدة البيانات...\n');

  const db = await getDb();

  if (!db) {
    console.error('❌ فشل الاتصال بقاعدة البيانات');
    process.exit(1);
  }

  // إحصائيات المستخدمين
  const usersCount = await db.select({ count: sql`count(*)` }).from(users);
  console.log(`👥 عدد المستخدمين: ${usersCount[0].count}`);

  // إحصائيات الطلبات
  const ordersCount = await db.select({ count: sql`count(*)` }).from(orders);
  console.log(`🛒 عدد الطلبات: ${ordersCount[0].count}`);

  // إحصائيات المعاملات
  const transactionsCount = await db.select({ count: sql`count(*)` }).from(transactions);
  console.log(`💰 عدد المعاملات المالية: ${transactionsCount[0].count}`);

  // إحصائيات سجل التدقيق
  const auditCount = await db.select({ count: sql`count(*)` }).from(auditTrail);
  console.log(`📋 عدد سجلات التدقيق: ${auditCount[0].count}`);

  // إحصائيات الأحداث
  const eventsCount = await db.select({ count: sql`count(*)` }).from(events);
  console.log(`📅 عدد الأحداث: ${eventsCount[0].count}`);

  // إحصائيات رؤى AI
  const insightsCount = await db.select({ count: sql`count(*)` }).from(agentInsights);
  console.log(`🤖 عدد رؤى AI: ${insightsCount[0].count}`);

  // إحصائيات الإشعارات
  const notificationsCount = await db.select({ count: sql`count(*)` }).from(notifications);
  console.log(`🔔 عدد الإشعارات: ${notificationsCount[0].count}\n`);

  // إجمالي الإيرادات
  const revenueResult = await db.execute(sql`
    SELECT SUM(CAST("totalAmount" AS DECIMAL)) as total
    FROM orders
    WHERE status = 'completed'
  `);

  const totalRevenue = revenueResult.rows[0]?.total || 0;
  console.log(`💰 إجمالي الإيرادات (الطلبات المكتملة): ${Number(totalRevenue).toFixed(2)} ج.م\n`);

  // توزيع الطلبات حسب الحالة
  const statusDistribution = await db.execute(sql`
    SELECT status, COUNT(*) as count
    FROM orders
    GROUP BY status
    ORDER BY count DESC
  `);

  console.log('📊 توزيع الطلبات حسب الحالة:');
  statusDistribution.rows.forEach((row: any) => {
    console.log(`   ${row.status}: ${row.count} طلب`);
  });

  process.exit(0);
}

checkData().catch(console.error);
