// @ts-nocheck
/**
 * محاكي النظام الكامل - Full System Simulator
 * يولد 1500 عملية بيع واقعية مع جميع البيانات المرتبطة
 */

import dotenv from "dotenv";
dotenv.config();

import { getDb } from "../db";
import {
  users,
  orders,
  transactions,
  auditTrail,
  events,
  notifications,
  agentInsights,
  ethicalRules
} from "../../drizzle/schema";
import { sql } from "drizzle-orm";

// ========== تكوين المحاكاة ==========

const SIMULATION_CONFIG = {
  TOTAL_ORDERS: 1500,
  TOTAL_USERS: 300,
  EMPLOYEES: 25,
  DAYS_TO_SIMULATE: 90, // آخر 3 شهور

  // نسب توزيع الطلبات
  ORDER_STATUS_DISTRIBUTION: {
    completed: 0.75,      // 75% مكتملة
    pending: 0.10,        // 10% قيد المعالجة
    processing: 0.08,     // 8% تحت المعالجة
    cancelled: 0.05,      // 5% ملغية
    refunded: 0.02        // 2% مرتجعة
  },

  // نطاقات الأسعار
  PRICE_RANGES: {
    min: 50,
    max: 5000,
    average: 500
  },

  // أنواع المنتجات
  PRODUCT_CATEGORIES: [
    'إلكترونيات',
    'ملابس',
    'كتب',
    'أدوات منزلية',
    'رياضة',
    'طعام صحي',
    'تجميل',
    'أثاث',
    'ألعاب',
    'إكسسوارات'
  ],

  // طرق الدفع
  PAYMENT_METHODS: ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery', 'bank_transfer'],

  // المحافظات المصرية
  GOVERNORATES: [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية',
    'القليوبية', 'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة',
    'الإسماعيلية', 'بورسعيد', 'السويس', 'دمياط', 'أسيوط'
  ]
};

// ========== مولدات البيانات ==========

class DataGenerator {
  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private randomChoice<T>(array: T[]): T {
    return array[this.random(0, array.length - 1)];
  }

  private randomDate(daysAgo: number): Date {
    const now = new Date();
    const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    // إضافة وقت عشوائي خلال اليوم
    date.setHours(this.random(0, 23));
    date.setMinutes(this.random(0, 59));
    date.setSeconds(this.random(0, 59));
    return date;
  }

  generateEgyptianName(): { firstName: string; lastName: string } {
    const firstNames = [
      'محمد', 'أحمد', 'علي', 'حسن', 'عمر', 'خالد', 'يوسف', 'كريم',
      'فاطمة', 'عائشة', 'مريم', 'نور', 'سارة', 'دينا', 'هدى', 'ياسمين',
      'عبدالله', 'إبراهيم', 'مصطفى', 'طارق', 'سامي', 'رامي', 'وليد',
      'منى', 'نهى', 'رنا', 'شيماء', 'إيمان', 'سلمى', 'ريم'
    ];

    const lastNames = [
      'محمود', 'السيد', 'عبدالرحمن', 'حسين', 'عثمان', 'صالح', 'فهمي',
      'الشافعي', 'المصري', 'النجار', 'الحداد', 'العطار', 'البنا',
      'عامر', 'منصور', 'سليمان', 'زكي', 'فوزي', 'شوقي', 'بدوي'
    ];

    return {
      firstName: this.randomChoice(firstNames),
      lastName: this.randomChoice(lastNames)
    };
  }

  generateEmail(name: { firstName: string; lastName: string }): string {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const userName = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}`;
    return `${userName}${this.random(1, 999)}@${this.randomChoice(domains)}`;
  }

  generatePhoneNumber(): string {
    const prefixes = ['010', '011', '012', '015'];
    return `${this.randomChoice(prefixes)}${this.random(10000000, 99999999)}`;
  }

  generateOrderAmount(): number {
    // توزيع Pareto للأسعار (80/20)
    const r = Math.random();
    if (r < 0.8) {
      // 80% من الطلبات بين 50-500 جنيه
      return this.randomFloat(50, 500);
    } else {
      // 20% من الطلبات بين 500-5000 جنيه
      return this.randomFloat(500, 5000);
    }
  }

  generateOrderStatus(): string {
    const r = Math.random();
    let cumulative = 0;

    for (const [status, probability] of Object.entries(SIMULATION_CONFIG.ORDER_STATUS_DISTRIBUTION)) {
      cumulative += probability;
      if (r <= cumulative) return status;
    }

    return 'completed';
  }

  generateProductName(): string {
    const category = this.randomChoice(SIMULATION_CONFIG.PRODUCT_CATEGORIES);
    const adjectives = ['ممتاز', 'فاخر', 'عملي', 'عصري', 'كلاسيكي', 'جديد'];
    const numbers = this.random(100, 999);

    return `${this.randomChoice(adjectives)} ${category} - موديل ${numbers}`;
  }
}

// ========== محاكي النظام الكامل ==========

export class FullSystemSimulator {
  private generator: DataGenerator;
  private db: any;
  private userIds: number[] = [];
  private employeeIds: number[] = [];
  private orderIds: number[] = [];

  constructor() {
    this.generator = new DataGenerator();
  }

  async initialize() {
    console.log('🔌 جاري الاتصال بقاعدة البيانات...');
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ موجود' : '❌ غير موجود');

    this.db = await getDb();
    if (!this.db) {
      console.error('❌ فشل الاتصال بقاعدة البيانات');
      console.error('   تأكد من:');
      console.error('   1. ملف .env موجود');
      console.error('   2. DATABASE_URL محدد في .env');
      console.error('   3. PostgreSQL يعمل');
      throw new Error("Database connection failed");
    }
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
  }

  // ========== المرحلة 1: إنشاء المستخدمين ==========

  async generateUsers() {
    console.log('📝 جاري إنشاء المستخدمين...');

    const usersData = [];

    // إنشاء الموظفين
    for (let i = 0; i < SIMULATION_CONFIG.EMPLOYEES; i++) {
      const name = this.generator.generateEgyptianName();
      usersData.push({
        openId: `employee_${i + 1}`,
        name: `${name.firstName} ${name.lastName}`,
        email: this.generator.generateEmail(name),
        role: this.generator.randomChoice<any>(['employee', 'manager', 'admin']),
        loginMethod: 'email'
      });
    }

    // إنشاء العملاء
    for (let i = 0; i < SIMULATION_CONFIG.TOTAL_USERS; i++) {
      const name = this.generator.generateEgyptianName();
      usersData.push({
        openId: `customer_${i + 1}`,
        name: `${name.firstName} ${name.lastName}`,
        email: this.generator.generateEmail(name),
        role: 'customer',
        loginMethod: this.generator.randomChoice<any>(['email', 'google', 'facebook'])
      });
    }

    // إدراج المستخدمين
    for (const userData of usersData) {
      try {
        const result = await this.db.insert(users).values(userData).returning({ id: users.id });

        if (userData.role !== 'customer') {
          this.employeeIds.push(result[0].id);
        } else {
          this.userIds.push(result[0].id);
        }
      } catch (error) {
        console.warn(`تخطي مستخدم موجود: ${userData.email}`);
      }
    }

    console.log(`✅ تم إنشاء ${this.userIds.length} عميل و ${this.employeeIds.length} موظف`);
  }

  // ========== المرحلة 2: إنشاء الطلبات ==========

  async generateOrders() {
    console.log('🛒 جاري إنشاء الطلبات...');

    let ordersCreated = 0;

    for (let i = 0; i < SIMULATION_CONFIG.TOTAL_ORDERS; i++) {
      const daysAgo = this.generator.random(0, SIMULATION_CONFIG.DAYS_TO_SIMULATE);
      const createdAt = this.generator.randomDate(daysAgo);

      const userId = this.generator.randomChoice(this.userIds);
      const status = this.generator.generateOrderStatus();
      const amount = this.generator.generateOrderAmount();

      const orderData = {
        userId,
        status,
        totalAmount: amount.toFixed(2),
        paymentMethod: this.generator.randomChoice(SIMULATION_CONFIG.PAYMENT_METHODS),
        shippingAddress: `${this.generator.randomChoice(SIMULATION_CONFIG.GOVERNORATES)}, مصر`,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + this.generator.random(1, 48) * 60 * 60 * 1000)
      };

      try {
        const result = await this.db.insert(orders).values(orderData).returning({ id: orders.id });
        this.orderIds.push(result[0].id);
        ordersCreated++;

        // إنشاء معاملة مالية للطلب
        await this.generateTransaction(result[0].id, userId, amount, status, createdAt);

        // إنشاء سجل تدقيق للطلب
        await this.generateAuditTrail(result[0].id, userId, 'order_created', createdAt);

        if (ordersCreated % 100 === 0) {
          console.log(`  ⏳ تم إنشاء ${ordersCreated} طلب...`);
        }
      } catch (error) {
        console.error(`خطأ في إنشاء الطلب ${i}:`, error);
      }
    }

    console.log(`✅ تم إنشاء ${ordersCreated} طلب`);
  }

  // ========== المرحلة 3: إنشاء المعاملات المالية ==========

  async generateTransaction(orderId: number, userId: number, amount: number, status: string, createdAt: Date) {
    const transactionData = {
      userId,
      orderId,
      amount: amount.toFixed(2),
      type: status === 'refunded' ? 'refund' : 'payment',
      status: status === 'completed' ? 'completed' : status === 'cancelled' ? 'failed' : 'pending',
      paymentMethod: this.generator.randomChoice(SIMULATION_CONFIG.PAYMENT_METHODS),
      createdAt
    };

    try {
      await this.db.insert(transactions).values(transactionData);
    } catch (error) {
      console.error('خطأ في إنشاء المعاملة:', error);
    }
  }

  // ========== المرحلة 4: إنشاء سجلات التدقيق ==========

  async generateAuditTrail(orderId: number, userId: number, action: string, performedAt: Date) {
    const employeeId = this.generator.randomChoice(this.employeeIds);

    // قرار KAIA (95% موافقة للطلبات الصغيرة، 85% للكبيرة)
    const order = await this.db.query.orders.findFirst({ where: (orders: any, { eq }: any) => eq(orders.id, orderId) });
    const kaiaDecision = parseFloat(order?.totalAmount || '0') < 1000
      ? (Math.random() < 0.95 ? 'approved' : 'rejected')
      : (Math.random() < 0.85 ? 'approved' : 'needs_review');

    const auditData = {
      userId: employeeId,
      action,
      relatedEntityType: 'order',
      relatedEntityId: orderId,
      kaiaDecision,
      performedAt
    };

    try {
      await this.db.insert(auditTrail).values(auditData);
    } catch (error) {
      console.error('خطأ في إنشاء سجل التدقيق:', error);
    }
  }

  // ========== المرحلة 5: إنشاء الأحداث ==========

  async generateEvents() {
    console.log('📅 جاري إنشاء الأحداث...');

    const eventTypes = [
      { type: 'order_placed', titleAr: 'تم تقديم طلب جديد', priority: 'low' },
      { type: 'order_completed', titleAr: 'تم إتمام الطلب', priority: 'low' },
      { type: 'payment_received', titleAr: 'تم استلام الدفع', priority: 'medium' },
      { type: 'shipping_dispatched', titleAr: 'تم شحن الطلب', priority: 'medium' },
      { type: 'order_delivered', titleAr: 'تم توصيل الطلب', priority: 'high' },
      { type: 'refund_requested', titleAr: 'طلب استرجاع', priority: 'high' },
      { type: 'system_alert', titleAr: 'تنبيه النظام', priority: 'critical' }
    ];

    let eventsCreated = 0;

    // إنشاء حدث لكل طلب
    for (const orderId of this.orderIds.slice(0, 500)) { // أول 500 طلب
      const eventType = this.generator.randomChoice(eventTypes);
      const daysAgo = this.generator.random(0, SIMULATION_CONFIG.DAYS_TO_SIMULATE);

      const eventData = {
        title: eventType.titleAr,
        type: eventType.type,
        priority: eventType.priority,
        relatedEntityType: 'order',
        relatedEntityId: orderId,
        createdAt: this.generator.randomDate(daysAgo)
      };

      try {
        await this.db.insert(events).values(eventData);
        eventsCreated++;
      } catch (error) {
        // تجاهل الأخطاء
      }
    }

    console.log(`✅ تم إنشاء ${eventsCreated} حدث`);
  }

  // ========== المرحلة 6: إنشاء رؤى AI ==========

  async generateAgentInsights() {
    console.log('🤖 جاري إنشاء رؤى الذكاء الاصطناعي...');

    const insightTemplates = [
      {
        titleAr: 'اكتشاف نمط شراء متكرر',
        descriptionAr: 'تم اكتشاف أن {percentage}% من العملاء يشترون {category} في نهاية الأسبوع',
        agentType: 'Ant Colony',
        insightType: 'pattern',
        priority: 'medium'
      },
      {
        titleAr: 'فرصة لزيادة المبيعات',
        descriptionAr: 'يمكن زيادة المبيعات بنسبة {percentage}% من خلال تقديم عروض على {category}',
        agentType: 'Corvid',
        insightType: 'opportunity',
        priority: 'high'
      },
      {
        titleAr: 'تحذير من انخفاض المخزون',
        descriptionAr: 'المخزون المتبقي من {category} قد ينفذ خلال {days} أيام',
        agentType: 'Arachnid',
        insightType: 'warning',
        priority: 'critical'
      },
      {
        titleAr: 'توصية بتحسين تجربة العميل',
        descriptionAr: 'تحسين وقت التوصيل في {governorate} قد يزيد رضا العملاء بنسبة {percentage}%',
        agentType: 'Mycelium',
        insightType: 'recommendation',
        priority: 'medium'
      }
    ];

    let insightsCreated = 0;

    for (let i = 0; i < 200; i++) {
      const template = this.generator.randomChoice(insightTemplates);
      const daysAgo = this.generator.random(0, SIMULATION_CONFIG.DAYS_TO_SIMULATE);

      const descriptionAr = template.descriptionAr
        .replace('{percentage}', this.generator.random(10, 40).toString())
        .replace('{category}', this.generator.randomChoice(SIMULATION_CONFIG.PRODUCT_CATEGORIES))
        .replace('{days}', this.generator.random(3, 14).toString())
        .replace('{governorate}', this.generator.randomChoice(SIMULATION_CONFIG.GOVERNORATES));

      const insightData = {
        title: template.titleAr,
        description: descriptionAr,
        descriptionAr,
        agentType: template.agentType,
        insightType: template.insightType,
        priority: template.priority,
        status: this.generator.randomChoice<any>(['new', 'reviewed', 'implemented', 'dismissed']),
        insightData: {},
        createdAt: this.generator.randomDate(daysAgo)
      };

      try {
        await this.db.insert(agentInsights).values(insightData);
        insightsCreated++;
      } catch (error) {
        // تجاهل الأخطاء
      }
    }

    console.log(`✅ تم إنشاء ${insightsCreated} رؤية من AI Agents`);
  }

  // ========== المرحلة 7: إنشاء الإشعارات ==========

  async generateNotifications() {
    console.log('🔔 جاري إنشاء الإشعارات...');

    let notificationsCreated = 0;

    // إشعارات للموظفين
    for (const employeeId of this.employeeIds) {
      for (let i = 0; i < this.generator.random(10, 30); i++) {
        const daysAgo = this.generator.random(0, 30);

        const notificationData = {
          userId: employeeId,
          title: this.generator.randomChoice([
            'طلب جديد يحتاج مراجعة',
            'تم إتمام عملية بيع',
            'رؤية جديدة من النظام',
            'تحذير: مخزون منخفض',
            'تقرير يومي جاهز'
          ]),
          message: 'تفاصيل الإشعار هنا...',
          type: this.generator.randomChoice<any>(['info', 'warning', 'success', 'error']),
          read: Math.random() > 0.3, // 70% مقروءة
          createdAt: this.generator.randomDate(daysAgo)
        };

        try {
          await this.db.insert(notifications).values(notificationData);
          notificationsCreated++;
        } catch (error) {
          // تجاهل الأخطاء
        }
      }
    }

    console.log(`✅ تم إنشاء ${notificationsCreated} إشعار`);
  }

  // ========== تشغيل المحاكاة الكاملة ==========

  async runFullSimulation() {
    console.log('\n🚀 بدء محاكاة النظام الكامل...\n');
    console.log(`📊 التكوين:`);
    console.log(`   - عدد الطلبات: ${SIMULATION_CONFIG.TOTAL_ORDERS}`);
    console.log(`   - عدد العملاء: ${SIMULATION_CONFIG.TOTAL_USERS}`);
    console.log(`   - عدد الموظفين: ${SIMULATION_CONFIG.EMPLOYEES}`);
    console.log(`   - الفترة الزمنية: ${SIMULATION_CONFIG.DAYS_TO_SIMULATE} يوم\n`);

    const startTime = Date.now();

    try {
      await this.initialize();

      // المرحلة 1: المستخدمون
      await this.generateUsers();

      // المرحلة 2: الطلبات
      await this.generateOrders();

      // المرحلة 3: الأحداث
      await this.generateEvents();

      // المرحلة 4: رؤى AI
      await this.generateAgentInsights();

      // المرحلة 5: الإشعارات
      await this.generateNotifications();

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log('\n✅ اكتملت المحاكاة بنجاح!');
      console.log(`⏱️  الوقت المستغرق: ${duration} ثانية\n`);

      // عرض الإحصائيات
      await this.displayStatistics();

    } catch (error) {
      console.error('❌ خطأ في المحاكاة:', error);
      throw error;
    }
  }

  // ========== عرض الإحصائيات ==========

  async displayStatistics() {
    console.log('📊 إحصائيات النظام:\n');

    try {
      // إحصائيات الطلبات
      const orderStats = await this.db.execute(sql`
        SELECT
          status,
          COUNT(*) as count,
          SUM(CAST(total_amount AS DECIMAL)) as total_revenue
        FROM orders
        GROUP BY status
      `);

      console.log('🛒 الطلبات حسب الحالة:');
      orderStats.rows.forEach((row: any) => {
        console.log(`   ${row.status}: ${row.count} طلب (${Number(row.total_revenue || 0).toFixed(2)} ج.م)`);
      });

      // إجمالي الإيرادات
      const totalRevenue = await this.db.execute(sql`
        SELECT SUM(CAST(total_amount AS DECIMAL)) as total
        FROM orders
        WHERE status = 'completed'
      `);

      console.log(`\n💰 إجمالي الإيرادات: ${Number(totalRevenue.rows[0]?.total || 0).toFixed(2)} ج.م`);

      // متوسط قيمة الطلب
      const avgOrder = await this.db.execute(sql`
        SELECT AVG(CAST(total_amount AS DECIMAL)) as average
        FROM orders
      `);

      console.log(`📈 متوسط قيمة الطلب: ${Number(avgOrder.rows[0]?.average || 0).toFixed(2)} ج.م`);

      // عدد العملاء النشطين
      const activeUsers = await this.db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM orders
      `);

      console.log(`👥 عدد العملاء النشطين: ${activeUsers.rows[0]?.count || 0}`);

      // رؤى AI
      const aiInsights = await this.db.execute(sql`
        SELECT
          agent_type,
          COUNT(*) as count
        FROM agentInsights
        GROUP BY agent_type
      `);

      console.log('\n🤖 رؤى AI Agents:');
      aiInsights.rows.forEach((row: any) => {
        console.log(`   ${row.agent_type}: ${row.count} رؤية`);
      });

    } catch (error) {
      console.error('خطأ في عرض الإحصائيات:', error);
    }
  }
}

// ========== تصدير ==========

export async function runFullSystemSimulation() {
  const simulator = new FullSystemSimulator();
  await simulator.runFullSimulation();
}
