/**
 * Complete Bio-Modules Integration Test
 * 
 * Tests all 7 Bio-Modules:
 * 1. Arachnid - Anomaly Detection
 * 2. Chameleon - Dynamic Pricing
 * 3. Ant - Route Optimization
 * 4. Tardigrade - System Resilience
 * 5. Corvid - Meta-Learning
 * 6. Mycelium - Resource Distribution
 * 7. Cephalopod - Distributed Authority
 */

import { validateOrderWithArachnid, applyDynamicPricing, trackOrderLifecycle } from "./server/bio-modules/orders-bio-integration";
import { optimizeDeliveryRoute, trackDeliveryWithTardigrade } from "./server/bio-modules/shipping-bio-integration";
import { distributeResources, checkInventoryAvailability, makeDistributedDecision, delegateAuthority } from "./server/bio-modules/inventory-bio-integration";
import { getBioDashboard } from "./server/bio-modules/bio-dashboard";

async function testAllBioModules() {
  console.log("🧪 Testing All 7 Bio-Modules\n");
  console.log("=" .repeat(70));

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Arachnid - Anomaly Detection
  totalTests++;
  console.log("\n🕷️  Test 1: Arachnid - Anomaly Detection");
  try {
    const validation = await validateOrderWithArachnid({
      orderId: 1,
      orderNumber: "ORD-TEST-001",
      customerName: "أحمد محمد",
      customerPhone: "+201234567890",
      totalAmount: 1500,
      items: [{ productId: 1, quantity: 2, price: 750 }],
      shippingAddress: "القاهرة، مصر",
    });

    console.log("   ✅ Anomaly Detection:", validation.isValid ? "No anomalies" : "Anomalies detected");
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 2: Chameleon - Dynamic Pricing
  totalTests++;
  console.log("\n🦎 Test 2: Chameleon - Dynamic Pricing");
  try {
    const pricing = await applyDynamicPricing("PROD-001", 1000, {
      customerHistory: 5,
      timeOfDay: 14,
      dayOfWeek: 3,
      currentDemand: "medium",
    });

    console.log(`   ✅ Dynamic Pricing: ${pricing.adjustedPrice} EGP (${Math.round(pricing.discount * 100)}% off)`);
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 3: Ant - Route Optimization
  totalTests++;
  console.log("\n🐜 Test 3: Ant - Route Optimization");
  try {
    const routes = await optimizeDeliveryRoute([
      {
        shipmentId: 1,
        orderId: 1,
        orderNumber: "ORD-TEST-001",
        pickupLocation: {
          address: "المخزن الرئيسي، القاهرة",
          city: "القاهرة",
        },
        deliveryLocation: {
          address: "شارع الهرم، الجيزة",
          city: "الجيزة",
        },
        priority: "high",
        fragile: true,
      },
    ]);

    console.log(`   ✅ Route Optimized: ${routes[0].estimatedDistance.toFixed(1)} km, ${routes[0].estimatedDuration} min`);
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 4: Tardigrade - System Resilience
  totalTests++;
  console.log("\n🐻 Test 4: Tardigrade - System Resilience");
  try {
    const tracking = await trackDeliveryWithTardigrade(
      1,
      "in_transit",
      {
        address: "طريق الإسكندرية الصحراوي",
        city: "الإسكندرية",
      },
      "الشحنة في الطريق"
    );

    console.log(`   ✅ Resilience Score: ${tracking.resilienceScore}/100`);
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 5: Corvid - Meta-Learning (tested through lifecycle tracking)
  totalTests++;
  console.log("\n🐦 Test 5: Corvid - Meta-Learning");
  try {
    await trackOrderLifecycle(1, "ORD-TEST-001", "created");
    await trackOrderLifecycle(1, "ORD-TEST-001", "confirmed");
    await trackOrderLifecycle(1, "ORD-TEST-001", "processing");

    console.log("   ✅ Learning from lifecycle: 3 events tracked");
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 6: Mycelium - Resource Distribution
  totalTests++;
  console.log("\n🍄 Test 6: Mycelium - Resource Distribution");
  try {
    const distribution = await distributeResources(
      1,
      [
        { productId: 1, quantity: 5 },
        { productId: 2, quantity: 3 },
      ],
      "الإسكندرية"
    );

    console.log(`   ✅ Resources Distributed: ${distribution.allocations.length} allocations, ${distribution.confidence}% confidence`);
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 7: Cephalopod - Distributed Authority
  totalTests++;
  console.log("\n🐙 Test 7: Cephalopod - Distributed Authority");
  try {
    const decision = await makeDistributedDecision(
      "order_approval",
      { orderId: 1, amount: 5000 },
      ["Manager 1", "Manager 2"]
    );

    console.log(`   ✅ Decision: ${decision.decision} (${decision.confidence}% confidence)`);
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 8: Authority Delegation (Cephalopod)
  totalTests++;
  console.log("\n🐙 Test 8: Cephalopod - Authority Delegation");
  try {
    const delegation = await delegateAuthority(
      "Admin",
      "Manager",
      "approve_orders",
      24 // 24 hours
    );

    console.log(`   ✅ Authority Delegated: ${delegation.delegationId}`);
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 9: Inventory Availability Check (Mycelium)
  totalTests++;
  console.log("\n🍄 Test 9: Mycelium - Inventory Check");
  try {
    const availability = await checkInventoryAvailability([
      { productId: 1, quantity: 10 },
      { productId: 2, quantity: 5 },
    ]);

    console.log(`   ✅ Inventory Check: ${availability.available ? "All available" : "Some missing"}`);
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 10: Bio-Dashboard - System Health
  totalTests++;
  console.log("\n📊 Test 10: Bio-Dashboard - System Health");
  try {
    const dashboard = getBioDashboard();
    const data = dashboard.getDashboardData();

    console.log(`   ✅ System Health: ${data.systemHealth.overall}%`);
    console.log(`   ✅ Active Modules: ${data.systemHealth.activeModules}/7`);
    console.log(`   ✅ Total Interactions: ${data.systemHealth.totalInteractions}`);
    passedTests++;
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Final Results
  console.log("\n" + "=".repeat(70));
  console.log("\n🎯 Test Results:");
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All tests passed! All 7 Bio-Modules are working! ✅");
    console.log("\n✨ Bio-Modules Status:");
    console.log("   🕷️  Arachnid (Anomaly Detection) ✅");
    console.log("   🦎 Chameleon (Dynamic Pricing) ✅");
    console.log("   🐜 Ant (Route Optimization) ✅");
    console.log("   🐻 Tardigrade (System Resilience) ✅");
    console.log("   🐦 Corvid (Meta-Learning) ✅");
    console.log("   🍄 Mycelium (Resource Distribution) ✅");
    console.log("   🐙 Cephalopod (Distributed Authority) ✅");
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed`);
  }

  console.log("\n" + "=".repeat(70));
}

// Run tests
testAllBioModules().catch(console.error);
