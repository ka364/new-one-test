/**
 * Seed Demo Data for HaderOS MVP
 * Run with: node scripts/seed-demo-data.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { 
  orders, transactions, ethicalRules, campaigns, agentInsights 
} from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function seedDemoData() {
  console.log("🌱 Seeding demo data...");

  try {
    // Seed Ethical Rules
    console.log("📋 Creating ethical rules...");
    await db.insert(ethicalRules).values([
      {
        ruleName: "Riba (Interest) Prohibition",
        ruleNameAr: "تحريم الربا",
        ruleDescription: "Prohibit any transaction involving interest (riba)",
        ruleDescriptionAr: "منع أي معاملة تتضمن الربا",
        ruleType: "sharia_financial",
        category: "financial",
        severity: "critical",
        ruleLogic: {
          conditions: [
            { field: "transaction.description", operator: "contains", value: "interest" },
          ],
          action: "reject",
        },
        requiresReview: true,
        priority: 1,
        isActive: true,
        referenceSource: "Quran 2:275",
        referenceSourceAr: "القرآن الكريم 2:275",
        createdBy: 1,
      },
      {
        ruleName: "Large Transaction Alert",
        ruleNameAr: "تنبيه المعاملات الكبيرة",
        ruleDescription: "Flag transactions over $10,000 for review",
        ruleDescriptionAr: "وضع علامة على المعاملات التي تزيد عن 10,000 دولار للمراجعة",
        ruleType: "risk_management",
        category: "financial",
        severity: "high",
        ruleLogic: {
          conditions: [
            { field: "transaction.amount", operator: ">", value: 10000 },
          ],
          action: "flag",
        },
        requiresReview: false,
        priority: 50,
        isActive: true,
        createdBy: 1,
      },
      {
        ruleName: "Halal Product Verification",
        ruleNameAr: "التحقق من المنتجات الحلال",
        ruleDescription: "Ensure all products comply with Halal standards",
        ruleDescriptionAr: "التأكد من أن جميع المنتجات تتوافق مع معايير الحلال",
        ruleType: "sharia_commercial",
        category: "products",
        severity: "high",
        ruleLogic: {
          conditions: [
            { field: "transaction.category", operator: "equals", value: "food" },
          ],
          action: "flag",
        },
        requiresReview: true,
        priority: 30,
        isActive: true,
        createdBy: 1,
      },
    ]);

    // Seed Sample Orders
    console.log("📦 Creating sample orders...");
    await db.insert(orders).values([
      {
        orderNumber: "ORD-2024-001",
        customerName: "Ahmed Hassan",
        customerEmail: "ahmed@example.com",
        customerPhone: "+966501234567",
        productName: "Premium Dates Package",
        productDescription: "High-quality Ajwa dates from Madinah",
        quantity: 10,
        unitPrice: "50.00",
        totalAmount: "500.00",
        currency: "USD",
        status: "delivered",
        shippingAddress: "Riyadh, Saudi Arabia",
        createdBy: 1,
      },
      {
        orderNumber: "ORD-2024-002",
        customerName: "Fatima Ali",
        customerEmail: "fatima@example.com",
        customerPhone: "+966507654321",
        productName: "Islamic Books Collection",
        productDescription: "Collection of authentic Islamic literature",
        quantity: 5,
        unitPrice: "30.00",
        totalAmount: "150.00",
        currency: "USD",
        status: "processing",
        shippingAddress: "Jeddah, Saudi Arabia",
        createdBy: 1,
      },
      {
        orderNumber: "ORD-2024-003",
        customerName: "Omar Abdullah",
        customerEmail: "omar@example.com",
        customerPhone: "+966509876543",
        productName: "Prayer Mats",
        productDescription: "Handmade prayer mats with Islamic patterns",
        quantity: 20,
        unitPrice: "25.00",
        totalAmount: "500.00",
        currency: "USD",
        status: "confirmed",
        shippingAddress: "Mecca, Saudi Arabia",
        createdBy: 1,
      },
    ]);

    // Seed Sample Transactions
    console.log("💰 Creating sample transactions...");
    await db.insert(transactions).values([
      {
        transactionNumber: "TXN-2024-001",
        type: "income",
        category: "sales",
        amount: "500.00",
        currency: "USD",
        description: "Payment for Order ORD-2024-001",
        status: "completed",
        shariaCompliant: true,
        ethicalCheckStatus: "approved",
        paymentMethod: "bank_transfer",
        createdBy: 1,
      },
      {
        transactionNumber: "TXN-2024-002",
        type: "expense",
        category: "operations",
        amount: "200.00",
        currency: "USD",
        description: "Supplier payment for raw materials",
        status: "completed",
        shariaCompliant: true,
        ethicalCheckStatus: "approved",
        paymentMethod: "bank_transfer",
        createdBy: 1,
      },
      {
        transactionNumber: "TXN-2024-003",
        type: "income",
        category: "sales",
        amount: "150.00",
        currency: "USD",
        description: "Payment for Order ORD-2024-002",
        status: "pending",
        shariaCompliant: true,
        ethicalCheckStatus: "review_required",
        paymentMethod: "credit_card",
        createdBy: 1,
      },
    ]);

    // Seed Sample Campaigns
    console.log("📢 Creating sample campaigns...");
    await db.insert(campaigns).values([
      {
        campaignName: "Ramadan Special Offer",
        campaignNameAr: "عرض رمضان الخاص",
        description: "Special discounts for Ramadan products",
        descriptionAr: "خصومات خاصة على منتجات رمضان",
        type: "multi_channel",
        budget: "5000.00",
        currency: "USD",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-04-15"),
        status: "active",
        impressions: 15000,
        clicks: 450,
        conversions: 45,
        revenue: "2250.00",
        spent: "1200.00",
        aiOptimizationEnabled: true,
        createdBy: 1,
      },
      {
        campaignName: "Islamic Books Promotion",
        campaignNameAr: "ترويج الكتب الإسلامية",
        description: "Promote Islamic literature collection",
        descriptionAr: "الترويج لمجموعة الأدب الإسلامي",
        type: "social_media",
        budget: "2000.00",
        currency: "USD",
        startDate: new Date("2024-02-15"),
        endDate: new Date("2024-03-31"),
        status: "completed",
        impressions: 8000,
        clicks: 200,
        conversions: 25,
        revenue: "750.00",
        spent: "600.00",
        aiOptimizationEnabled: true,
        createdBy: 1,
      },
    ]);

    // Seed Sample Agent Insights
    console.log("🤖 Creating sample agent insights...");
    await db.insert(agentInsights).values([
      {
        agentType: "financial",
        insightType: "cash_flow_forecast",
        title: "Positive Cash Flow Trend Detected",
        titleAr: "اكتشاف اتجاه إيجابي للتدفق النقدي",
        description: "Cash flow is expected to increase by 15% next month based on current trends",
        descriptionAr: "من المتوقع أن يزيد التدفق النقدي بنسبة 15٪ الشهر القادم بناءً على الاتجاهات الحالية",
        insightData: { forecast: { increase: 15, confidence: 0.85 } },
        confidence: 85.00,
        priority: "medium",
        status: "new",
      },
      {
        agentType: "demand_planner",
        insightType: "demand_spike",
        title: "High Demand for Prayer Mats",
        titleAr: "طلب مرتفع على سجادات الصلاة",
        description: "Demand for prayer mats increased by 40% in the last week",
        descriptionAr: "زاد الطلب على سجادات الصلاة بنسبة 40٪ في الأسبوع الماضي",
        insightData: { product: "Prayer Mats", increase: 40 },
        confidence: 90.00,
        priority: "high",
        status: "new",
      },
      {
        agentType: "campaign_orchestrator",
        insightType: "optimization_recommendations",
        title: "Ramadan Campaign Performing Well",
        titleAr: "حملة رمضان تحقق أداءً جيداً",
        description: "ROI of 187% - Consider increasing budget by 30%",
        descriptionAr: "عائد استثمار 187٪ - فكر في زيادة الميزانية بنسبة 30٪",
        insightData: { roi: 1.87, recommendation: "increase_budget" },
        confidence: 88.00,
        priority: "high",
        status: "new",
      },
    ]);

    console.log("✅ Demo data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
}

seedDemoData()
  .then(() => {
    console.log("🎉 All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
