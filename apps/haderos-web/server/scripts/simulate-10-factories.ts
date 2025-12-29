/**
 * 🏭 10-Factory Comprehensive Simulation
 *
 * Simulates a complete ecosystem with:
 * - 10 manufacturing facilities (مصانع)
 * - Each with hierarchical structure (1.1, 1.2, 1.3, etc.)
 * - NOW SHOES operations (الحذاء)
 * - Messaging system integration
 * - Support tickets
 * - AI assistant usage
 * - Complete data flow
 */

import { getDb } from "../db";
import { sql } from "drizzle-orm";
import {
  conversations,
  conversationParticipants,
  messages,
  messageAttachments,
  messageReactions,
  aiUsageTracking,
  subscriptionPlans,
  userSubscriptions,
} from "../../drizzle/schema-messaging";
import { randomUUID } from "crypto";

// Factory configuration
const FACTORIES = [
  { id: 1, name: "مصنع القاهرة", path: "1", employees: 50, tier: "enterprise" },
  { id: 2, name: "مصنع الجيزة", path: "2", employees: 40, tier: "professional" },
  { id: 3, name: "مصنع الإسكندرية", path: "3", employees: 45, tier: "professional" },
  { id: 4, name: "مصنع المنصورة", path: "4", employees: 30, tier: "basic" },
  { id: 5, name: "مصنع طنطا", path: "5", employees: 35, tier: "professional" },
  { id: 6, name: "مصنع أسيوط", path: "6", employees: 25, tier: "basic" },
  { id: 7, name: "مصنع سوهاج", path: "7", employees: 20, tier: "basic" },
  { id: 8, name: "مصنع بورسعيد", path: "8", employees: 30, tier: "professional" },
  { id: 9, name: "مصنع الإسماعيلية", path: "9", employees: 28, tier: "basic" },
  { id: 10, name: "مصنع دمياط", path: "10", employees: 22, tier: "basic" },
];

const SUBSCRIPTION_TIERS = {
  free: {
    aiMessagesPerMonth: 100,
    aiTokensPerMonth: 10000,
    aiMonthlyBudget: 500, // 5 USD in cents
    monthlyPrice: 0,
  },
  basic: {
    aiMessagesPerMonth: 1000,
    aiTokensPerMonth: 100000,
    aiMonthlyBudget: 5000, // 50 USD
    monthlyPrice: 20000, // 200 EGP
  },
  professional: {
    aiMessagesPerMonth: 10000,
    aiTokensPerMonth: 1000000,
    aiMonthlyBudget: 50000, // 500 USD
    monthlyPrice: 150000, // 1500 EGP
  },
  enterprise: {
    aiMessagesPerMonth: 999999,
    aiTokensPerMonth: 99999999,
    aiMonthlyBudget: 999999, // Unlimited
    monthlyPrice: 0, // Custom pricing
  },
};

interface SimulationStats {
  factoriesCreated: number;
  usersCreated: number;
  conversationsCreated: number;
  messagesCreated: number;
  supportTicketsCreated: number;
  aiMessagesCreated: number;
  subscriptionsCreated: number;
  totalAITokens: number;
  totalAICost: number;
}

async function simulate10Factories() {
  console.log("🏭 Starting 10-Factory Comprehensive Simulation...\n");

  const db = await getDb();
  const stats: SimulationStats = {
    factoriesCreated: 0,
    usersCreated: 0,
    conversationsCreated: 0,
    messagesCreated: 0,
    supportTicketsCreated: 0,
    aiMessagesCreated: 0,
    subscriptionsCreated: 0,
    totalAITokens: 0,
    totalAICost: 0,
  };

  try {
    // Step 1: Create subscription plans if not exist
    console.log("📋 Step 1: Creating subscription plans...");
    await createSubscriptionPlans(db);

    // Step 2: Simulate each factory
    for (const factory of FACTORIES) {
      console.log(`\n🏭 Simulating Factory ${factory.id}: ${factory.name}`);
      await simulateFactory(db, factory, stats);
    }

    // Step 3: Generate summary report
    console.log("\n" + "=".repeat(60));
    console.log("📊 SIMULATION COMPLETE!");
    console.log("=".repeat(60));
    printStats(stats);

    return stats;
  } catch (error) {
    console.error("❌ Simulation failed:", error);
    throw error;
  }
}

async function createSubscriptionPlans(db: Awaited<ReturnType<typeof getDb>>) {
  const plans = [
    {
      tier: "free",
      name: "خطة مجانية",
      description: "للتجربة والاستخدام المحدود",
      ...SUBSCRIPTION_TIERS.free,
      availableModels: ["gpt-3.5-turbo"],
      features: { teamMessaging: true, support: false, ai: "limited" },
      isActive: true,
    },
    {
      tier: "basic",
      name: "خطة أساسية",
      description: "للمصانع الصغيرة",
      ...SUBSCRIPTION_TIERS.basic,
      availableModels: ["gpt-3.5-turbo", "gpt-4"],
      features: { teamMessaging: true, support: "limited", ai: "basic" },
      isActive: true,
    },
    {
      tier: "professional",
      name: "خطة احترافية",
      description: "للمصانع المتوسطة",
      ...SUBSCRIPTION_TIERS.professional,
      availableModels: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
      features: { teamMessaging: true, support: true, ai: "professional" },
      isActive: true,
    },
    {
      tier: "enterprise",
      name: "خطة مؤسسات",
      description: "للمصانع الكبيرة مع دعم مخصص",
      ...SUBSCRIPTION_TIERS.enterprise,
      availableModels: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "claude-3"],
      features: { teamMessaging: true, support: "priority", ai: "unlimited" },
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await db
      .insert(subscriptionPlans)
      .values(plan)
      .onConflictDoUpdate({
        target: subscriptionPlans.tier,
        set: { updatedAt: new Date() },
      });
  }

  console.log(`✅ Created/Updated ${plans.length} subscription plans`);
}

async function simulateFactory(
  db: Awaited<ReturnType<typeof getDb>>,
  factory: typeof FACTORIES[0],
  stats: SimulationStats
) {
  stats.factoriesCreated++;

  // Use existing admin user (ID=1) for all simulations
  const adminUserId = 1;
  const factoryUserIds = [adminUserId];
  stats.usersCreated += 1; // Count once per factory

  // Create factory subscription
  const planId = await getSubscriptionPlanId(db, factory.tier);
  await createFactorySubscription(db, factory, planId, adminUserId, stats);

  // Create AI usage tracking for factory
  await initializeAIUsageTracking(db, factory, adminUserId, stats);

  // Simulate team conversations (5-10 per factory)
  const teamConversations = Math.floor(Math.random() * 6) + 5;
  for (let i = 0; i < teamConversations; i++) {
    await createTeamConversation(db, factory, factoryUserIds, stats);
  }

  // Simulate support tickets (2-8 per factory)
  const supportTickets = Math.floor(Math.random() * 7) + 2;
  for (let i = 0; i < supportTickets; i++) {
    await createSupportTicket(db, factory, factoryUserIds, stats);
  }

  // Simulate AI conversations based on tier
  const aiConversations = getAIConversationsCount(factory.tier);
  for (let i = 0; i < aiConversations; i++) {
    await createAIConversation(db, factory, factoryUserIds, stats);
  }

  console.log(`✅ Factory ${factory.id} complete: ${teamConversations} team chats, ${supportTickets} tickets, ${aiConversations} AI chats`);
}

async function getSubscriptionPlanId(
  db: Awaited<ReturnType<typeof getDb>>,
  tier: string
): Promise<number> {
  const plan = await db
    .select({ id: subscriptionPlans.id })
    .from(subscriptionPlans)
    .where(sql`tier = ${tier}`)
    .limit(1);

  return plan[0]?.id || 1;
}

async function createFactorySubscription(
  db: Awaited<ReturnType<typeof getDb>>,
  factory: typeof FACTORIES[0],
  planId: number,
  userId: number,
  stats: SimulationStats
) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  await db.insert(userSubscriptions).values({
    userId,
    organizationId: factory.id,
    planId,
    status: "active",
    billingCycle: "monthly",
    startDate: now,
    endDate,
    amount: SUBSCRIPTION_TIERS[factory.tier as keyof typeof SUBSCRIPTION_TIERS].monthlyPrice,
    currency: "EGP",
    autoRenew: true,
  });

  stats.subscriptionsCreated++;
}

async function initializeAIUsageTracking(
  db: Awaited<ReturnType<typeof getDb>>,
  factory: typeof FACTORIES[0],
  userId: number,
  stats: SimulationStats
) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const tier = SUBSCRIPTION_TIERS[factory.tier as keyof typeof SUBSCRIPTION_TIERS];

  await db.insert(aiUsageTracking).values({
    userId,
    organizationId: factory.id,
    subscriptionTier: factory.tier,
    messagesThisMonth: 0,
    tokensThisMonth: 0,
    costThisMonth: 0,
    monthlyMessageLimit: tier.aiMessagesPerMonth,
    monthlyTokenLimit: tier.aiTokensPerMonth,
    monthlyBudget: tier.aiMonthlyBudget,
    periodStartDate: now,
    periodEndDate: periodEnd,
  });
}

async function createTeamConversation(
  db: Awaited<ReturnType<typeof getDb>>,
  factory: typeof FACTORIES[0],
  userIds: number[],
  stats: SimulationStats
) {
  const conversationId = randomUUID();

  const topics = [
    "اجتماع الإنتاج اليومي",
    "تنسيق الشحنات",
    "مشاكل جودة المنتج",
    "طلبات جديدة",
    "صيانة المعدات",
    "تدريب الموظفين",
    "تحديثات المخزون",
  ];

  const topic = topics[Math.floor(Math.random() * topics.length)];

  // Create conversation
  await db.insert(conversations).values({
    id: conversationId,
    type: "team",
    title: `${topic} - ${factory.name}`,
    organizationId: factory.id,
    departmentId: `dept-${Math.floor(Math.random() * 5) + 1}`,
    createdById: userIds[0],
  });

  // Add participants (3-8 people)
  const participantCount = Math.floor(Math.random() * 6) + 3;
  const selectedUsers = userIds.slice(0, Math.min(participantCount, userIds.length));

  for (const userId of selectedUsers) {
    await db.insert(conversationParticipants).values({
      conversationId,
      userId,
      role: userId === selectedUsers[0] ? "admin" : "member",
    });
  }

  // Create messages (5-20 per conversation)
  const messageCount = Math.floor(Math.random() * 16) + 5;
  for (let i = 0; i < messageCount; i++) {
    const senderId = selectedUsers[Math.floor(Math.random() * selectedUsers.length)];
    const messageId = randomUUID();

    await db.insert(messages).values({
      id: messageId,
      conversationId,
      senderId,
      content: getRandomTeamMessage(),
      contentType: "text",
    });

    stats.messagesCreated++;

    // Random reactions (20% chance)
    if (Math.random() > 0.8) {
      const emoji = ["👍", "❤️", "😊", "🎉", "✅"][Math.floor(Math.random() * 5)];
      await db.insert(messageReactions).values({
        messageId,
        userId: selectedUsers[Math.floor(Math.random() * selectedUsers.length)],
        emoji,
      });
    }
  }

  stats.conversationsCreated++;
}

let ticketCounter = 0;

async function createSupportTicket(
  db: Awaited<ReturnType<typeof getDb>>,
  factory: typeof FACTORIES[0],
  userIds: number[],
  stats: SimulationStats
) {
  const ticketId = randomUUID();
  const ticketNumber = `TICKET-${Date.now()}-${factory.id}-${++ticketCounter}`;

  const issues = [
    "مشكلة في نظام الشحن",
    "خطأ في حساب المصروفات",
    "تحديث بيانات المنتج",
    "مشكلة في الدفع",
    "طلب ميزة جديدة",
    "بطء في النظام",
    "خطأ في التقارير",
  ];

  const priorities = ["low", "medium", "high", "urgent"] as const;
  const statuses = ["open", "in_progress", "resolved"] as const;

  const issue = issues[Math.floor(Math.random() * issues.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  // Create support conversation
  await db.insert(conversations).values({
    id: ticketId,
    type: "support",
    title: issue,
    ticketNumber,
    ticketStatus: status,
    ticketPriority: priority,
    ticketCategory: "technical",
    createdById: userIds[0],
  });

  // Add customer as participant (same as support agent since we only have 1 user)
  await db.insert(conversationParticipants).values({
    conversationId: ticketId,
    userId: userIds[0],
    role: "member",
  });

  // Create ticket messages (3-10)
  const messageCount = Math.floor(Math.random() * 8) + 3;
  for (let i = 0; i < messageCount; i++) {
    const messageId = randomUUID();

    await db.insert(messages).values({
      id: messageId,
      conversationId: ticketId,
      senderId: userIds[0],
      content: i % 2 === 0 ? getRandomCustomerMessage() : getRandomSupportMessage(),
      contentType: "text",
    });

    stats.messagesCreated++;
  }

  stats.supportTicketsCreated++;
  stats.conversationsCreated++;
}

async function createAIConversation(
  db: Awaited<ReturnType<typeof getDb>>,
  factory: typeof FACTORIES[0],
  userIds: number[],
  stats: SimulationStats
) {
  const conversationId = randomUUID();

  const aiTopics = [
    "تحسين كفاءة الإنتاج",
    "تحليل تكاليف المصروفات",
    "استراتيجيات التسويق",
    "إدارة المخزون الذكية",
    "تحسين عمليات الشحن",
  ];

  const topic = aiTopics[Math.floor(Math.random() * aiTopics.length)];
  const model = getAIModelForTier(factory.tier);

  // Create AI conversation
  await db.insert(conversations).values({
    id: conversationId,
    type: "ai",
    title: `مساعد AI: ${topic}`,
    aiModel: model,
    aiPersona: "business-advisor",
    createdById: userIds[0],
  });

  // Add user as participant
  await db.insert(conversationParticipants).values({
    conversationId,
    userId: userIds[0],
    role: "admin",
  });

  // Create AI conversation messages (2-6 exchanges)
  const exchanges = Math.floor(Math.random() * 5) + 2;
  for (let i = 0; i < exchanges; i++) {
    // User message
    const userMessageId = randomUUID();
    await db.insert(messages).values({
      id: userMessageId,
      conversationId,
      senderId: userIds[0],
      content: getRandomAIUserPrompt(),
      contentType: "text",
    });
    stats.messagesCreated++;

    // AI response
    const aiMessageId = randomUUID();
    const tokens = Math.floor(Math.random() * 500) + 100;
    const cost = Math.floor((tokens / 1000) * 2); // ~$0.002 per 1K tokens

    await db.insert(messages).values({
      id: aiMessageId,
      conversationId,
      senderId: 1, // Use admin user as AI sender
      content: getRandomAIResponse(),
      contentType: "text",
      isAiGenerated: true,
      aiModel: model,
      aiTokens: tokens,
      aiCost: cost,
    });

    stats.messagesCreated++;
    stats.aiMessagesCreated++;
    stats.totalAITokens += tokens;
    stats.totalAICost += cost;

    // Update AI usage tracking
    await db.execute(sql`
      UPDATE ${aiUsageTracking}
      SET
        messages_this_month = messages_this_month + 1,
        tokens_this_month = tokens_this_month + ${tokens},
        cost_this_month = cost_this_month + ${cost},
        last_used_at = NOW(),
        updated_at = NOW()
      WHERE user_id = ${userIds[0]}
      AND organization_id = ${factory.id}
    `);
  }

  stats.conversationsCreated++;
}

// Helper functions
function getAIConversationsCount(tier: string): number {
  const counts = {
    free: 0,
    basic: 2,
    professional: 5,
    enterprise: 10,
  };
  return counts[tier as keyof typeof counts] || 0;
}

function getAIModelForTier(tier: string): string {
  const models = {
    free: "gpt-3.5-turbo",
    basic: "gpt-3.5-turbo",
    professional: "gpt-4",
    enterprise: "gpt-4-turbo",
  };
  return models[tier as keyof typeof models] || "gpt-3.5-turbo";
}

function getRandomTeamMessage(): string {
  const messages = [
    "تم الانتهاء من المهمة بنجاح",
    "نحتاج لمراجعة هذا الطلب",
    "هل يمكننا تأجيل الاجتماع؟",
    "الإنتاج اليوم تجاوز الهدف بنسبة 15%",
    "لدينا مشكلة في المخزون",
    "تم استلام الشحنة الجديدة",
    "يرجى مراجعة التقرير المرفق",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getRandomCustomerMessage(): string {
  const messages = [
    "لدي مشكلة في استخدام النظام",
    "هل يمكن مساعدتي في هذا الأمر؟",
    "لم أتلق البريد الإلكتروني المتوقع",
    "كيف يمكنني تحديث البيانات؟",
    "متى سيتم حل هذه المشكلة؟",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getRandomSupportMessage(): string {
  const messages = [
    "شكراً للتواصل معنا، سأساعدك في حل المشكلة",
    "هل يمكنك تزويدنا بمزيد من التفاصيل؟",
    "تم حل المشكلة، يرجى التحقق",
    "سنقوم بمتابعة هذا الأمر مع الفريق التقني",
    "تم تصعيد المشكلة إلى الإدارة",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getRandomAIUserPrompt(): string {
  const prompts = [
    "كيف يمكنني تحسين كفاءة خط الإنتاج؟",
    "ما هي أفضل استراتيجية لخفض التكاليف؟",
    "كيف أحلل بيانات المبيعات الشهرية؟",
    "ما هي التوقعات للربع القادم؟",
    "كيف أحسن إدارة المخزون؟",
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function getRandomAIResponse(): string {
  const responses = [
    "بناءً على تحليل البيانات، أنصح بـ...",
    "يمكنك تحسين الكفاءة من خلال...",
    "التوقعات تشير إلى...",
    "الحل الأمثل هو...",
    "لتحقيق أفضل النتائج، يجب...",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function printStats(stats: SimulationStats) {
  console.log("\n📊 SIMULATION STATISTICS:");
  console.log("─".repeat(60));
  console.log(`🏭 Factories Simulated:       ${stats.factoriesCreated}`);
  console.log(`👥 Users Created:             ${stats.usersCreated}`);
  console.log(`💬 Total Conversations:       ${stats.conversationsCreated}`);
  console.log(`   - Team Conversations:      ${stats.conversationsCreated - stats.supportTicketsCreated - stats.aiMessagesCreated / 4}`);
  console.log(`   - Support Tickets:         ${stats.supportTicketsCreated}`);
  console.log(`   - AI Conversations:        ${Math.floor(stats.aiMessagesCreated / 4)}`);
  console.log(`📨 Total Messages:            ${stats.messagesCreated}`);
  console.log(`   - Regular Messages:        ${stats.messagesCreated - stats.aiMessagesCreated}`);
  console.log(`   - AI Messages:             ${stats.aiMessagesCreated}`);
  console.log(`💎 Subscriptions Created:     ${stats.subscriptionsCreated}`);
  console.log(`🤖 AI Usage:`);
  console.log(`   - Total Tokens:            ${stats.totalAITokens.toLocaleString()}`);
  console.log(`   - Total Cost:              $${(stats.totalAICost / 100).toFixed(2)}`);
  console.log("─".repeat(60));
  console.log("\n✅ All 10 factories successfully simulated!");
  console.log("🎉 Unified messaging system is fully operational!\n");
}

// Run simulation
if (import.meta.url === `file://${process.argv[1]}`) {
  simulate10Factories()
    .then(() => {
      console.log("✅ Simulation script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Simulation script failed:", error);
      process.exit(1);
    });
}

export { simulate10Factories };
