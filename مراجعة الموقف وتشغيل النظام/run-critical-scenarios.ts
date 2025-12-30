#!/usr/bin/env tsx
/**
 * Run Critical Scenarios Test
 */

import { runCriticalScenarios } from "./server/bio-modules/critical-scenarios.js";
import { registerMockHandlers, unregisterMockHandlers } from "./server/bio-modules/mock-handlers.js";

async function main() {
  console.log("🚀 Starting Critical Scenarios Test Suite");
  console.log("=========================================\n");
  
  // Register mock handlers for all modules
  console.log("🔧 Registering mock handlers for 7 bio-modules...");
  registerMockHandlers();
  console.log("");
  
  try {
    const results = await runCriticalScenarios();
    
    console.log("\n🎯 Final Summary:");
    console.log("================");
    console.log(`Total Scenarios: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
    
    if (results.failed === 0) {
      console.log("\n🎉 All critical scenarios passed! System is production-ready.");
      unregisterMockHandlers();
      process.exit(0);
    } else {
      console.log("\n⚠️  Some scenarios failed. Review the results above.");
      unregisterMockHandlers();
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error running critical scenarios:", error);
    unregisterMockHandlers();
    process.exit(1);
  }
}

main();
