/**
 * Bio-Modules Integration Test
 * 
 * Tests the integration of Bio-Modules with Orders, Products, and Shipping
 */

import { validateOrderWithArachnid, applyDynamicPricing, trackOrderLifecycle } from "./server/bio-modules/orders-bio-integration";
import { optimizeDeliveryRoute, trackDeliveryWithTardigrade } from "./server/bio-modules/shipping-bio-integration";
import { getBioDashboard } from "./server/bio-modules/bio-dashboard";

async function testBioIntegration() {
  console.log("🧪 Testing Bio-Modules Integration\n");
  console.log("=" .repeat(60));

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Arachnid - Order Validation
  totalTests++;
  console.log("\n📍 Test 1: Arachnid - Order Validation");
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

    console.log("✅ Validation Result:", {
      isValid: validation.isValid,
      warnings: validation.warnings.length,
      recommendations: validation.recommendations.length,
    });
    passedTests++;
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Test 2: Chameleon - Dynamic Pricing
  totalTests++;
  console.log("\n📍 Test 2: Chameleon - Dynamic Pricing");
  try {
    const pricing = await applyDynamicPricing("PROD-001", 1000, {
      customerHistory: 5,
      timeOfDay: 14,
      dayOfWeek: 3,
      currentDemand: "medium",
    });

    console.log("✅ Pricing Result:", {
      basePrice: 1000,
      adjustedPrice: pricing.adjustedPrice,
      discount: pricing.discount,
      reason: pricing.reason,
    });
    passedTests++;
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Test 3: Ant - Route Optimization
  totalTests++;
  console.log("\n📍 Test 3: Ant - Route Optimization");
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

    console.log("✅ Route Optimization:", {
      routesCount: routes.length,
      estimatedDistance: routes[0].estimatedDistance,
      estimatedDuration: routes[0].estimatedDuration,
      optimizationScore: routes[0].optimizationScore,
    });
    passedTests++;
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Test 4: Tardigrade - Delivery Tracking
  totalTests++;
  console.log("\n📍 Test 4: Tardigrade - Delivery Tracking");
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

    console.log("✅ Tracking Result:", {
      success: tracking.success,
      resilienceScore: tracking.resilienceScore,
      recommendations: tracking.recommendations.length,
    });
    passedTests++;
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Test 5: Bio-Dashboard - System Health
  totalTests++;
  console.log("\n📍 Test 5: Bio-Dashboard - System Health");
  try {
    const dashboard = getBioDashboard();
    const data = dashboard.getDashboardData();

    console.log("✅ Dashboard Data:", {
      timestamp: new Date(data.timestamp).toLocaleString(),
      systemHealth: data.systemHealth.overall + "%",
      activeModules: data.systemHealth.activeModules,
      totalInteractions: data.systemHealth.totalInteractions,
      avgProcessingTime: data.systemHealth.avgProcessingTime + "ms",
    });
    passedTests++;
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Test 6: Order Lifecycle Tracking
  totalTests++;
  console.log("\n📍 Test 6: Order Lifecycle Tracking");
  try {
    await trackOrderLifecycle(1, "ORD-TEST-001", "created");
    await trackOrderLifecycle(1, "ORD-TEST-001", "confirmed");
    await trackOrderLifecycle(1, "ORD-TEST-001", "processing");

    console.log("✅ Lifecycle tracking successful");
    passedTests++;
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Final Results
  console.log("\n" + "=".repeat(60));
  console.log("\n🎯 Test Results:");
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All tests passed! Bio-Modules integration is working! ✅");
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed`);
  }

  console.log("\n" + "=".repeat(60));
}

// Run tests
testBioIntegration().catch(console.error);
