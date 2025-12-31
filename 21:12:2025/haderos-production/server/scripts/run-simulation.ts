#!/usr/bin/env tsx
/**
 * سكريبت تشغيل المحاكاة الكاملة
 * يولد 1500 عملية بيع وجميع البيانات المرتبطة
 */

import { runFullSystemSimulation } from '../utils/full-system-simulator';

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('        🌱 محاكي نظام HaderOS الكامل 🌱');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    await runFullSystemSimulation();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('        ✅ تمت المحاكاة بنجاح!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('💡 خطوات التالية:');
    console.log('   1. افتح المتصفح: http://localhost:3000/dashboard');
    console.log('   2. انتقل إلى "المؤشرات الحيوية" لرؤية البيانات الحية');
    console.log('   3. جرب "محاكاة الشبكة الفطرية" لاختبار السلوكيات\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ فشلت المحاكاة:', error);
    process.exit(1);
  }
}

main();
