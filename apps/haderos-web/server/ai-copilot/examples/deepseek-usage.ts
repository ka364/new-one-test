/**
 * 📚 DEEPSEEK USAGE EXAMPLES
 *
 * أمثلة عملية لاستخدام DeepSeek في HADEROS
 */

import { DeepSeekProvider, getDeepSeek, askDeepSeek } from '../providers/DeepSeekProvider';
import { EnhancedAICoPilot, getEnhancedAI } from '../core/EnhancedAICoPilot';
import { CostOptimizer } from '../utils/CostOptimizer';

// ============================================
// Example 1: Simple Code Analysis
// ============================================

export async function example1_SimpleAnalysis() {
  const deepseek = getDeepSeek();

  const code = `
function processOrder(order) {
  const total = order.items.reduce((sum, item) => sum + item.price, 0);
  return total;
}
  `;

  const result = await deepseek.analyzeCode(code);

  console.log('📊 Analysis Result:');
  console.log(result.text);
  console.log(`\n💰 Cost: $${result.cost.totalCost.toFixed(6)}`);
  console.log(`📝 Tokens: ${result.usage.totalTokens}`);
}

// ============================================
// Example 2: Generate Tests
// ============================================

export async function example2_GenerateTests() {
  const deepseek = getDeepSeek();

  const code = `
export async function createUser(userData: UserData) {
  if (!userData.email) {
    throw new Error('Email is required');
  }

  const user = await db.users.create({ data: userData });
  return user;
}
  `;

  const result = await deepseek.generateTests(code, 'vitest');

  console.log('🧪 Generated Tests:');
  console.log(result.text);
  console.log(`\n💰 Cost: $${result.cost.totalCost.toFixed(6)}`);
}

// ============================================
// Example 3: Security Scan
// ============================================

export async function example3_SecurityScan() {
  const deepseek = getDeepSeek();

  const code = `
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  db.query(query).then(user => res.json(user));
});
  `;

  const result = await deepseek.findSecurityVulnerabilities(code);

  console.log('🔒 Security Analysis:');
  console.log(result.text);
  console.log(`\n💰 Cost: $${result.cost.totalCost.toFixed(6)}`);
}

// ============================================
// Example 4: Performance Optimization
// ============================================

export async function example4_PerformanceOptimization() {
  const deepseek = getDeepSeek();

  const code = `
async function getOrdersWithItems() {
  const orders = await db.orders.findMany();

  for (const order of orders) {
    order.items = await db.orderItems.findMany({
      where: { orderId: order.id }
    });
  }

  return orders;
}
  `;

  const result = await deepseek.suggestPerformanceImprovements(code);

  console.log('⚡ Performance Suggestions:');
  console.log(result.text);
  console.log(`\n💰 Cost: $${result.cost.totalCost.toFixed(6)}`);
}

// ============================================
// Example 5: Enhanced AI Co-Pilot
// ============================================

export async function example5_EnhancedCoPilot() {
  const enhancedAI = getEnhancedAI();

  console.log('🚀 Running enhanced analysis with DeepSeek...\n');

  const analysis = await enhancedAI.analyzeWithDeepSeek();

  console.log(`📊 System Health: ${analysis.systemHealth}%`);
  console.log(`🔴 Critical Issues: ${analysis.criticalIssues.length}`);
  console.log(`💡 Recommendations: ${analysis.recommendations.length}`);
  console.log(`\n💰 AI Cost: $${analysis.cost.totalCost.toFixed(6)}`);
  console.log(`💵 Savings: $${analysis.savings.amount.toFixed(6)} (${analysis.savings.percentage.toFixed(1)}%)`);
}

// ============================================
// Example 6: Cost Analysis
// ============================================

export async function example6_CostAnalysis() {
  const apiKey = process.env.DEEPSEEK_API_KEY!;
  const optimizer = new CostOptimizer(apiKey);

  const dailyTasks = [
    {
      type: 'simple' as const,
      description: 'Code review',
      estimatedTokens: 5000,
      priority: 'medium' as const,
    },
    {
      type: 'medium' as const,
      description: 'Security scan',
      estimatedTokens: 10000,
      priority: 'high' as const,
    },
    {
      type: 'simple' as const,
      description: 'Test generation',
      estimatedTokens: 8000,
      priority: 'low' as const,
    },
    {
      type: 'complex' as const,
      description: 'Architecture review',
      estimatedTokens: 20000,
      priority: 'high' as const,
    },
  ];

  const report = optimizer.generateCostReport(dailyTasks);
  console.log(report);

  const simulation = optimizer.simulateMonthlyUsage(dailyTasks);
  console.log('\n📈 Monthly Simulation:');
  console.log(`Daily: $${simulation.daily.toFixed(4)}`);
  console.log(`Weekly: $${simulation.weekly.toFixed(4)}`);
  console.log(`Monthly: $${simulation.monthly.toFixed(4)}`);
  console.log(`\nSavings vs GPT-3.5: ${simulation.savings.vsGPT35.toFixed(1)}%`);
  console.log(`Savings vs GPT-4: ${simulation.savings.vsGPT4.toFixed(1)}%`);
}

// ============================================
// Example 7: Quick Question
// ============================================

export async function example7_QuickQuestion() {
  const answer = await askDeepSeek(
    'What are the best practices for handling errors in Node.js APIs?'
  );

  console.log('💬 DeepSeek Answer:');
  console.log(answer);
}

// ============================================
// Example 8: Code Review
// ============================================

export async function example8_CodeReview() {
  const enhancedAI = getEnhancedAI();

  const code = `
export async function updateUser(userId: number, data: any) {
  const user = await db.users.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  await db.users.update({
    where: { id: userId },
    data: data,
  });

  return user;
}
  `;

  const review = await enhancedAI.smartCodeReview('user-service.ts', code);

  console.log('👨‍💻 Code Review:');
  console.log(review.review);
  console.log(`\n🔴 Issues Found: ${review.issues.length}`);
  console.log(`💰 Cost: $${review.cost.toFixed(6)}`);
}

// ============================================
// Example 9: Smart Test Generation
// ============================================

export async function example9_SmartTestGeneration() {
  const enhancedAI = getEnhancedAI();

  const code = `
export async function calculateOrderTotal(orderId: number) {
  const order = await db.orders.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const total = order.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  return {
    orderId: order.id,
    total,
    itemCount: order.items.length,
  };
}
  `;

  const result = await enhancedAI.smartTestGeneration(code);

  console.log('🧪 Generated Tests:');
  console.log(result.tests);
  console.log(`\n📊 Estimated Coverage: ${result.coverage}%`);
  console.log(`💰 Cost: $${result.cost.toFixed(6)}`);
}

// ============================================
// Example 10: Batch Analysis
// ============================================

export async function example10_BatchAnalysis() {
  const deepseek = getDeepSeek();

  const files = [
    { name: 'auth.ts', code: 'export function login() { /* ... */ }' },
    { name: 'orders.ts', code: 'export function createOrder() { /* ... */ }' },
    { name: 'users.ts', code: 'export function getUser() { /* ... */ }' },
  ];

  console.log('📦 Analyzing batch of files...\n');

  let totalCost = 0;

  for (const file of files) {
    const result = await deepseek.analyzeCode(file.code);
    totalCost += result.cost.totalCost;

    console.log(`✅ ${file.name}: $${result.cost.totalCost.toFixed(6)}`);
  }

  console.log(`\n💰 Total Cost: $${totalCost.toFixed(6)}`);
  console.log(`💵 Would cost with GPT-3.5: ~$${(totalCost * 7.14).toFixed(4)}`);
  console.log(`💸 Savings: ~$${(totalCost * 6.14).toFixed(4)} (86%)`);
}

// ============================================
// Run all examples
// ============================================

export async function runAllExamples() {
  console.log('🚀 DEEPSEEK USAGE EXAMPLES\n');
  console.log('=' .repeat(50) + '\n');

  try {
    console.log('📚 Example 1: Simple Code Analysis');
    await example1_SimpleAnalysis();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('📚 Example 2: Generate Tests');
    await example2_GenerateTests();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('📚 Example 3: Security Scan');
    await example3_SecurityScan();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('📚 Example 4: Performance Optimization');
    await example4_PerformanceOptimization();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('📚 Example 6: Cost Analysis');
    await example6_CostAnalysis();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('✅ All examples completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
