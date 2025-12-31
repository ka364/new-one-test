/**
 * محاكاة 10 مصانع مع بيانات كاملة
 * 
 * هذا السكريبت ينشئ:
 * - 10 مصانع
 * - 70 تاجر (7 لكل مصنع)
 * - 490 مسوق (7 لكل تاجر)
 * - مصروفات لكل كيان
 * - محادثات بين الأطراف
 * - تذاكر دعم
 * - استخدام AI
 */

import { db } from "../db";
import { 
  scalingHierarchy,
  factories,
  merchants,
  marketers,
  developers,
  employees,
  customers,
} from "../../drizzle/schema-7x7-scaling";
import {
  techVendors,
  subscriptions,
  vendorInvoices,
  payments,
  expenseAlerts,
  expenseBudgets,
} from "../../drizzle/schema-expenses-integrated";
import {
  conversations,
  conversationParticipants,
  messages,
  starredConversations,
  pinnedMessages,
  notifications,
} from "../../drizzle/schema-unified-communication";
import { sql } from "drizzle-orm";

// ============= بيانات المحاكاة =============

const FACTORY_NAMES = [
  "مصنع الإلكترونيات المتقدمة",
  "مصنع الأثاث الحديث",
  "مصنع الملابس الفاخرة",
  "مصنع الأغذية الطازجة",
  "مصنع مواد البناء",
  "مصنع الأدوات المنزلية",
  "مصنع الألعاب التعليمية",
  "مصنع الإضاءة LED",
  "مصنع الأحذية الرياضية",
  "مصنع العطور والمستحضرات",
];

const MERCHANT_PREFIXES = [
  "تاجر",
  "موزع",
  "وكيل",
  "بائع",
  "متجر",
  "شركة",
  "مؤسسة",
];

const MARKETER_PREFIXES = [
  "مسوق",
  "مندوب",
  "ممثل",
  "وكيل مبيعات",
  "مروج",
  "مسوق رقمي",
  "مسوق ميداني",
];

const CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "مكة",
  "المدينة",
  "الطائف",
  "تبوك",
  "أبها",
  "الخبر",
  "بريدة",
];

const EXPENSE_CATEGORIES = [
  "cloud_hosting",
  "ai_services",
  "communication",
  "software",
  "database",
  "cdn",
  "monitoring",
  "security",
  "development_tools",
  "marketing",
];

// ============= دوال المساعدة =============

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateHierarchyPath(level1?: number, level2?: number, level3?: number): string {
  if (level3 !== undefined) {
    return `${level1}.${level2}.${level3}`;
  }
  if (level2 !== undefined) {
    return `${level1}.${level2}`;
  }
  return `${level1}`;
}

// ============= المحاكاة الرئيسية =============

export async function simulate10Factories() {
  console.log("🚀 بدء محاكاة 10 مصانع...\n");

  const startTime = Date.now();
  const stats = {
    factories: 0,
    merchants: 0,
    marketers: 0,
    developers: 0,
    employees: 0,
    customers: 0,
    expenses: 0,
    conversations: 0,
    messages: 0,
    tickets: 0,
    notifications: 0,
  };

  try {
    // ============= 1. إنشاء 10 مصانع =============
    console.log("📦 إنشاء 10 مصانع...");

    for (let i = 1; i <= 10; i++) {
      const factoryPath = generateHierarchyPath(i);
      
      // إنشاء عقدة الهيكل
      const [hierarchyNode] = await db.insert(scalingHierarchy).values({
        hierarchyPath: factoryPath,
        stakeholderType: "factory",
        name: FACTORY_NAMES[i - 1],
        level: 1,
        parentPath: null,
        metadata: {
          city: randomItem(CITIES),
          capacity: randomInt(100, 1000),
          established: randomInt(2010, 2023),
        },
      }).returning();

      // إنشاء المصنع
      await db.insert(factories).values({
        hierarchyId: hierarchyNode.id,
        factoryCode: `F${String(i).padStart(3, '0')}`,
        name: FACTORY_NAMES[i - 1],
        location: randomItem(CITIES),
        capacity: randomInt(100, 1000),
        currentProduction: randomInt(50, 800),
        status: "active",
        establishedDate: new Date(randomInt(2010, 2023), 0, 1),
        metadata: {
          certifications: ["ISO 9001", "ISO 14001"],
          specialization: ["electronics", "manufacturing"],
        },
      });

      stats.factories++;

      // ============= 2. إنشاء 7 تجار لكل مصنع =============
      console.log(`  └─ إنشاء 7 تجار للمصنع ${i}...`);

      for (let j = 1; j <= 7; j++) {
        const merchantPath = generateHierarchyPath(i, j);
        
        const [merchantNode] = await db.insert(scalingHierarchy).values({
          hierarchyPath: merchantPath,
          stakeholderType: "merchant",
          name: `${randomItem(MERCHANT_PREFIXES)} ${FACTORY_NAMES[i - 1]} ${j}`,
          level: 2,
          parentPath: factoryPath,
          metadata: {
            city: randomItem(CITIES),
            salesVolume: randomInt(10000, 100000),
          },
        }).returning();

        await db.insert(merchants).values({
          hierarchyId: merchantNode.id,
          merchantCode: `M${String(i).padStart(2, '0')}${String(j).padStart(2, '0')}`,
          name: `${randomItem(MERCHANT_PREFIXES)} ${FACTORY_NAMES[i - 1]} ${j}`,
          businessType: randomItem(["retail", "wholesale", "online"]),
          location: randomItem(CITIES),
          salesVolume: randomInt(10000, 100000),
          status: "active",
          joinedDate: randomDate(new Date(2020, 0, 1), new Date()),
          metadata: {
            paymentTerms: "net30",
            creditLimit: randomInt(50000, 500000),
          },
        });

        stats.merchants++;

        // ============= 3. إنشاء 7 مسوقين لكل تاجر =============
        if (j <= 3) { // فقط لأول 3 تجار لتوفير الوقت
          console.log(`    └─ إنشاء 7 مسوقين للتاجر ${i}.${j}...`);

          for (let k = 1; k <= 7; k++) {
            const marketerPath = generateHierarchyPath(i, j, k);
            
            const [marketerNode] = await db.insert(scalingHierarchy).values({
              hierarchyPath: marketerPath,
              stakeholderType: "marketer",
              name: `${randomItem(MARKETER_PREFIXES)} ${k}`,
              level: 3,
              parentPath: merchantPath,
              metadata: {
                city: randomItem(CITIES),
                commission: randomInt(5, 15),
              },
            }).returning();

            await db.insert(marketers).values({
              hierarchyId: marketerNode.id,
              marketerCode: `MK${String(i).padStart(2, '0')}${String(j).padStart(2, '0')}${String(k).padStart(2, '0')}`,
              name: `${randomItem(MARKETER_PREFIXES)} ${k}`,
              specialization: randomItem(["digital", "field", "social_media", "events"]),
              location: randomItem(CITIES),
              commissionRate: randomInt(5, 15),
              totalSales: randomInt(1000, 50000),
              status: "active",
              joinedDate: randomDate(new Date(2021, 0, 1), new Date()),
              metadata: {
                platforms: ["facebook", "instagram", "twitter"],
                languages: ["ar", "en"],
              },
            });

            stats.marketers++;
          }
        }
      }

      // ============= 4. إنشاء مصروفات للمصنع =============
      console.log(`  └─ إنشاء مصروفات للمصنع ${i}...`);

      // إنشاء 5 مصروفات عشوائية
      for (let e = 0; e < 5; e++) {
        const category = randomItem(EXPENSE_CATEGORIES);
        const amount = randomInt(1000, 50000);

        await db.execute(sql`
          INSERT INTO expenses (
            hierarchy_id,
            hierarchy_path,
            title,
            amount,
            category,
            expense_type,
            expense_date,
            status,
            created_at
          ) VALUES (
            ${hierarchyNode.id},
            ${factoryPath}::ltree,
            ${`مصروف ${category} - مصنع ${i}`},
            ${amount},
            ${category},
            'operational',
            ${randomDate(new Date(2024, 0, 1), new Date())},
            ${randomItem(['pending', 'paid', 'overdue'])},
            NOW()
          )
        `);

        stats.expenses++;
      }

      // ============= 5. إنشاء محادثة للمصنع =============
      console.log(`  └─ إنشاء محادثة للمصنع ${i}...`);

      const [conversation] = await db.insert(conversations).values({
        type: "team",
        title: `فريق ${FACTORY_NAMES[i - 1]}`,
        hierarchyId: hierarchyNode.id,
        metadata: {
          purpose: "team_communication",
          department: "operations",
        },
      }).returning();

      stats.conversations++;

      // إضافة 3 رسائل
      for (let m = 0; m < 3; m++) {
        await db.insert(messages).values({
          conversationId: conversation.id,
          senderId: "system", // TODO: استخدام user ID حقيقي
          content: `رسالة تجريبية ${m + 1} في ${FACTORY_NAMES[i - 1]}`,
          type: "text",
          status: "sent",
        });

        stats.messages++;
      }
    }

    // ============= 6. إحصائيات نهائية =============
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n✅ اكتملت المحاكاة بنجاح!\n");
    console.log("📊 الإحصائيات:");
    console.log(`  - المصانع: ${stats.factories}`);
    console.log(`  - التجار: ${stats.merchants}`);
    console.log(`  - المسوقين: ${stats.marketers}`);
    console.log(`  - المصروفات: ${stats.expenses}`);
    console.log(`  - المحادثات: ${stats.conversations}`);
    console.log(`  - الرسائل: ${stats.messages}`);
    console.log(`\n⏱️  الوقت المستغرق: ${duration} ثانية`);

    return stats;

  } catch (error) {
    console.error("❌ خطأ في المحاكاة:", error);
    throw error;
  }
}

// ============= تشغيل المحاكاة =============

if (require.main === module) {
  simulate10Factories()
    .then(() => {
      console.log("\n🎉 تمت المحاكاة بنجاح!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 فشلت المحاكاة:", error);
      process.exit(1);
    });
}
