/**
 * Quick Integration Test
 * 
 * Fast test to verify the 4 core components work together
 */

import { getModuleInteractions } from "./bio-interaction-matrix";
import { createBioMessage, getBioMessageRouter } from "./unified-messaging";
import { getConflictEngine } from "./conflict-resolution-protocol";
import { getBioDashboard } from "./bio-dashboard";

/**
 * Quick Integration Test
 */
export async function runQuickIntegrationTest() {
  console.log("\n🧪 === اختبار التكامل السريع ===\n");

  const results = {
    matrix: false,
    messaging: false,
    conflicts: false,
    dashboard: false,
    integration: false,
  };

  // Test 1: Bio-Interaction Matrix
  console.log("1️⃣  اختبار مصفوفة التفاعل...");
  try {
    const arachnidInteractions = getModuleInteractions("arachnid");
    if (arachnidInteractions && arachnidInteractions.length > 0) {
      console.log(`   ✅ المصفوفة تعمل: ${arachnidInteractions.length} تفاعلات لـ Arachnid`);
      results.matrix = true;
    } else {
      console.log("   ❌ المصفوفة فارغة");
    }
  } catch (error) {
    console.log(`   ❌ خطأ في المصفوفة: ${error}`);
  }

  // Test 2: Unified Messaging
  console.log("\n2️⃣  اختبار نظام الرسائل الموحد...");
  try {
    const testMessage = createBioMessage(
      "arachnid",
      ["cephalopod"],
      "alert",
      { test: "quick_test", timestamp: Date.now() }
    );
    
    if (testMessage && testMessage.id) {
      console.log(`   ✅ نظام الرسائل يعمل: تم إنشاء رسالة ${testMessage.id}`);
      results.messaging = true;
    } else {
      console.log("   ❌ فشل إنشاء الرسالة");
    }
  } catch (error) {
    console.log(`   ❌ خطأ في نظام الرسائل: ${error}`);
  }

  // Test 3: Conflict Resolution
  console.log("\n3️⃣  اختبار بروتوكول حل التعارضات...");
  try {
    const conflictEngine = getConflictEngine();
    const stats = conflictEngine.getStats();
    
    console.log(`   ✅ محرك التعارضات يعمل:`);
    console.log(`      - التعارضات النشطة: ${stats.activeConflicts}`);
    console.log(`      - تم الحل: ${stats.totalResolved}`);
    console.log(`      - متوسط وقت الحل: ${stats.avgResolutionTime}ms`);
    results.conflicts = true;
  } catch (error) {
    console.log(`   ❌ خطأ في محرك التعارضات: ${error}`);
  }

  // Test 4: Bio Dashboard
  console.log("\n4️⃣  اختبار لوحة التحكم...");
  try {
    const dashboard = getBioDashboard();
    const data = dashboard.getDashboardData();
    
    if (data && data.systemHealth) {
      console.log(`   ✅ لوحة التحكم تعمل:`);
      console.log(`      - صحة النظام: ${data.systemHealth.overall}%`);
      console.log(`      - الوحدات: ${data.moduleHealth ? data.moduleHealth.length : 0}`);
      console.log(`      - التفاعلات: ${data.recentInteractions ? data.recentInteractions.length : 0}`);
      results.dashboard = true;
    } else {
      console.log("   ❌ لوحة التحكم لا تعمل");
    }
  } catch (error) {
    console.log(`   ❌ خطأ في لوحة التحكم: ${error}`);
  }

  // Test 5: Integration Test (send message through router)
  console.log("\n5️⃣  اختبار التكامل الكامل...");
  try {
    const router = getBioMessageRouter();
    
    // Register a test handler
    router.registerHandler("cephalopod", async (message) => {
      return {
        messageId: message.id,
        success: true,
        result: { received: true },
        processingTime: 10,
        respondedBy: "cephalopod",
        timestamp: Date.now(),
      };
    });

    // Send a test message
    const testMessage = createBioMessage(
      "arachnid",
      ["cephalopod"],
      "alert",
      { test: "integration_test" }
    );

    const responses = await router.send(testMessage);
    
    if (responses && responses.length > 0 && responses[0].success) {
      console.log(`   ✅ التكامل يعمل: تم إرسال واستقبال الرسالة بنجاح`);
      console.log(`      - زمن المعالجة: ${responses[0].processingTime}ms`);
      results.integration = true;
    } else {
      console.log("   ❌ فشل التكامل");
    }
  } catch (error) {
    console.log(`   ❌ خطأ في التكامل: ${error}`);
  }

  // Summary
  console.log("\n📊 === النتائج ===\n");
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  console.log(`إجمالي الاختبارات: ${totalTests}`);
  console.log(`نجح: ${passedTests}`);
  console.log(`فشل: ${totalTests - passedTests}`);
  console.log(`معدل النجاح: ${successRate}%\n`);

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? "✅" : "❌"} ${test}`);
  });

  console.log("\n");

  // Decision
  if (successRate === 100) {
    console.log("🎉 === النظام جاهز للإنتاج ===\n");
    console.log("جميع الاختبارات نجحت. يمكنك المضي قدماً بثقة.\n");
  } else if (successRate >= 80) {
    console.log("⚠️  === النظام يعمل لكن يحتاج تحسينات ===\n");
    console.log("معظم الاختبارات نجحت. أصلح الفشل البسيط قبل الإنتاج.\n");
  } else {
    console.log("❌ === النظام غير جاهز ===\n");
    console.log("الكثير من الاختبارات فشلت. أصلح الأساسيات أولاً.\n");
  }

  return {
    results,
    totalTests,
    passedTests,
    successRate,
    ready: successRate >= 80,
  };
}

// Run test if executed directly
// Auto-run when imported
runQuickIntegrationTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
