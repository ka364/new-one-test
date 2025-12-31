/**
 * Parallel Simulation Examples
 * أمثلة على استخدام نظام المحاكاة الموازية
 * 
 * This file contains practical examples of how agents can use
 * the parallel simulation environment for analysis and prediction.
 */

import { createAgentInterface } from './agent-interface';
import { getSimulationEnvironment } from './parallel-environment';

/**
 * Example 1: Test impact of price change
 * مثال 1: اختبار تأثير تغيير السعر
 */
export async function examplePriceChangeImpact() {
  console.log('\n📊 Example 1: Testing Price Change Impact\n');

  const agentInterface = createAgentInterface('financial-agent-001');

  // Run a what-if analysis
  const result = await agentInterface.whatIf(
    'زيادة الأسعار بنسبة 10%',
    {
      avgOrderValue: 550, // Increased from 500
      conversionRate: 0.025, // Might decrease slightly
    },
    86400 * 7 // Simulate 1 week
  );

  console.log('📈 Results:');
  console.log(`   Impact: ${result.impact}`);
  console.log(`   Recommendation: ${result.recommendation}`);
  console.log(`   Revenue Before: ${result.before.metrics.totalRevenue.toFixed(2)}`);
  console.log(`   Revenue After: ${result.after.metrics.totalRevenue.toFixed(2)}`);
}

/**
 * Example 2: Test new marketing campaign
 * مثال 2: اختبار حملة تسويقية جديدة
 */
export async function exampleMarketingCampaign() {
  console.log('\n📊 Example 2: Testing Marketing Campaign\n');

  const agentInterface = createAgentInterface('marketing-agent-001');

  // Create a full experiment
  const experiment = await agentInterface.createExperiment(
    'حملة رمضان التسويقية',
    'اختبار تأثير حملة تسويقية مكثفة خلال شهر رمضان',
    'ستزيد الحملة من الطلبات بنسبة 40% والإيرادات بنسبة 35%',
    [
      {
        stepNumber: 1,
        action: 'observe',
        parameters: { metric: 'totalOrders' },
        description: 'قياس الطلبات الحالية',
      },
      {
        stepNumber: 2,
        action: 'modify',
        parameters: {
          modificationType: 'market_condition',
          impact: 1.4, // 40% increase
        },
        description: 'تطبيق تأثير الحملة التسويقية',
      },
      {
        stepNumber: 3,
        action: 'simulate',
        parameters: { duration: 86400 * 30 }, // 30 days
        description: 'محاكاة شهر كامل',
      },
      {
        stepNumber: 4,
        action: 'observe',
        parameters: { metric: 'totalOrders' },
        description: 'قياس الطلبات بعد الحملة',
      },
      {
        stepNumber: 5,
        action: 'compare',
        parameters: {},
        description: 'مقارنة النتائج',
      },
    ]
  );

  console.log(`✅ Created experiment: ${experiment.name}`);

  // Run the experiment
  const results = await agentInterface.runExperiment(experiment.id);

  console.log('\n📈 Experiment Results:');
  console.log(`   Hypothesis Validated: ${results.hypothesis_validated ? 'نعم ✅' : 'لا ❌'}`);
  console.log(`   Confidence: ${(results.confidence * 100).toFixed(1)}%`);
  console.log(`\n   Recommendations:`);
  results.recommendations.forEach(rec => console.log(`   - ${rec}`));
  
  if (results.risks.length > 0) {
    console.log(`\n   Identified Risks:`);
    results.risks.forEach(risk => {
      console.log(`   - [${risk.severity.toUpperCase()}] ${risk.description}`);
      console.log(`     Mitigation: ${risk.mitigation}`);
    });
  }
}

/**
 * Example 3: Stress test system capacity
 * مثال 3: اختبار قدرة النظام تحت الضغط
 */
export async function exampleStressTest() {
  console.log('\n📊 Example 3: System Stress Test\n');

  const agentInterface = createAgentInterface('operations-agent-001');

  const experiment = await agentInterface.createExperiment(
    'اختبار الضغط - يوم الجمعة البيضاء',
    'محاكاة حمل كبير على النظام خلال يوم الجمعة البيضاء',
    'النظام سيتحمل زيادة 300% في الطلبات دون تدهور كبير في الأداء',
    [
      {
        stepNumber: 1,
        action: 'observe',
        parameters: { metric: 'systemHealth' },
        description: 'قياس صحة النظام الحالية',
      },
      {
        stepNumber: 2,
        action: 'modify',
        parameters: {
          modificationType: 'parameter_change',
          orderFrequency: 30, // 3x normal load
        },
        description: 'زيادة معدل الطلبات 3 أضعاف',
      },
      {
        stepNumber: 3,
        action: 'simulate',
        parameters: { duration: 86400 }, // 1 day
        description: 'محاكاة يوم كامل تحت الضغط',
      },
      {
        stepNumber: 4,
        action: 'observe',
        parameters: { metric: 'systemHealth' },
        description: 'قياس صحة النظام بعد الضغط',
      },
    ]
  );

  const results = await agentInterface.runExperiment(experiment.id);

  console.log('\n📈 Stress Test Results:');
  console.log(`   System Can Handle Load: ${results.hypothesis_validated ? 'نعم ✅' : 'لا ❌'}`);
  console.log(`   Confidence: ${(results.confidence * 100).toFixed(1)}%`);
  
  const healthObs = results.observations.find(o => o.metric === 'systemHealth');
  if (healthObs) {
    console.log(`   System Health Impact: ${healthObs.change.toFixed(1)}%`);
  }
}

/**
 * Example 4: Compare multiple strategies
 * مثال 4: مقارنة استراتيجيات متعددة
 */
export async function exampleCompareStrategies() {
  console.log('\n📊 Example 4: Comparing Multiple Strategies\n');

  const agentInterface = createAgentInterface('strategy-agent-001');

  // Strategy A: Focus on customer acquisition
  const resultA = await agentInterface.whatIf(
    'استراتيجية أ: التركيز على اكتساب عملاء جدد',
    {
      conversionRate: 0.05, // Higher conversion
      churnRate: 0.18, // Slightly higher churn
      avgOrderValue: 450, // Lower AOV
    },
    86400 * 30
  );

  // Strategy B: Focus on customer retention
  const resultB = await agentInterface.whatIf(
    'استراتيجية ب: التركيز على الاحتفاظ بالعملاء',
    {
      conversionRate: 0.025, // Lower conversion
      churnRate: 0.08, // Much lower churn
      avgOrderValue: 600, // Higher AOV
    },
    86400 * 30
  );

  console.log('\n📊 Strategy Comparison:');
  console.log('\n   Strategy A (Acquisition Focus):');
  console.log(`   ${resultA.impact}`);
  console.log(`   Revenue: ${resultA.after.metrics.totalRevenue.toFixed(2)}`);
  
  console.log('\n   Strategy B (Retention Focus):');
  console.log(`   ${resultB.impact}`);
  console.log(`   Revenue: ${resultB.after.metrics.totalRevenue.toFixed(2)}`);

  const winner = resultB.after.metrics.totalRevenue > resultA.after.metrics.totalRevenue ? 'B' : 'A';
  console.log(`\n   🏆 Winner: Strategy ${winner}`);
}

/**
 * Example 5: Predict problem before it happens
 * مثال 5: التنبؤ بمشكلة قبل حدوثها
 */
export async function examplePredictProblem() {
  console.log('\n📊 Example 5: Predicting Future Problems\n');

  const agentInterface = createAgentInterface('predictive-agent-001');

  // Simulate a scenario where churn is increasing
  const result = await agentInterface.whatIf(
    'سيناريو: زيادة تدريجية في معدل فقدان العملاء',
    {
      churnRate: 0.30, // High churn
      conversionRate: 0.02, // Lower conversion
    },
    86400 * 60 // 2 months
  );

  console.log('\n⚠️ Prediction Results:');
  console.log(`   ${result.impact}`);
  console.log(`   ${result.recommendation}`);
  
  if (result.after.metrics.systemHealth < 70) {
    console.log('\n   🚨 WARNING: System health will degrade significantly!');
    console.log('   Recommended Actions:');
    console.log('   - Implement customer retention program immediately');
    console.log('   - Improve customer service quality');
    console.log('   - Launch loyalty rewards program');
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PARALLEL SIMULATION ENVIRONMENT - EXAMPLES');
  console.log('='.repeat(60));

  try {
    await examplePriceChangeImpact();
    await exampleMarketingCampaign();
    await exampleStressTest();
    await exampleCompareStrategies();
    await examplePredictProblem();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Uncomment to run examples directly
// runAllExamples().catch(console.error);
