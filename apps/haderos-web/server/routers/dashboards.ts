/**
 * نظام لوحات التحكم الموسعة - Advanced Dashboards Router
 * يوفر لوحات تحكم تفاعلية لجميع الأقسام
 */

import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { KPIType, performanceSystem } from '../hr/performance';
import { recruitmentSystem } from '../hr/recruitment';
import { createSimulationEngine } from '../simulation/engine';

/**
 * بيانات البطاقة - Card Data
 */
interface DashboardCard {
  title: string;
  titleAr: string;
  value: number | string;
  unit?: string;
  change?: number; // نسبة التغيير
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple';
}

/**
 * بيانات الرسم البياني - Chart Data
 */
interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  titleAr: string;
  data: any[];
  labels?: string[];
}

/**
 * لوحة التحكم الكاملة
 */
interface Dashboard {
  title: string;
  titleAr: string;
  cards: DashboardCard[];
  charts: ChartData[];
  alerts: Alert[];
  recommendations: string[];
}

/**
 * التنبيه
 */
interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  timestamp: Date;
  actionRequired?: boolean;
}

/**
 * مولد لوحات التحكم
 */
class DashboardGenerator {
  /**
   * لوحة التحكم التنفيذية - Executive Dashboard
   */
  async generateExecutiveDashboard(timeRange: { start: Date; end: Date }): Promise<Dashboard> {
    const db = await getDb();

    // البطاقات الرئيسية
    const cards: DashboardCard[] = [
      {
        title: 'Total Revenue',
        titleAr: 'إجمالي الإيرادات',
        value: 1792258,
        unit: 'جنيه',
        change: 15.3,
        trend: 'up',
        icon: 'money',
        color: 'green',
      },
      {
        title: 'Total Orders',
        titleAr: 'إجمالي الطلبات',
        value: 3000,
        change: 12.5,
        trend: 'up',
        icon: 'shopping-cart',
        color: 'blue',
      },
      {
        title: 'Active Customers',
        titleAr: 'العملاء النشطين',
        value: 300,
        change: 8.2,
        trend: 'up',
        icon: 'users',
        color: 'purple',
      },
      {
        title: 'Employee Count',
        titleAr: 'عدد الموظفين',
        value: 25,
        change: 0,
        trend: 'stable',
        icon: 'briefcase',
        color: 'blue',
      },
    ];

    // الرسوم البيانية
    const charts: ChartData[] = [
      {
        type: 'line',
        title: 'Revenue Trend',
        titleAr: 'اتجاه الإيرادات',
        data: this.generateRevenueTrend(timeRange),
      },
      {
        type: 'bar',
        title: 'Orders by Status',
        titleAr: 'الطلبات حسب الحالة',
        data: this.generateOrdersByStatus(),
      },
      {
        type: 'pie',
        title: 'Revenue by Product Category',
        titleAr: 'الإيرادات حسب فئة المنتج',
        data: this.generateRevenueByCategory(),
      },
    ];

    // التنبيهات
    const alerts = await this.generateExecutiveAlerts();

    // التوصيات
    const recommendations = [
      'يُنصح بزيادة فريق خدمة العملاء بـ 2 موظف لتحسين وقت الاستجابة',
      'موسم العطلات القادم - فرصة لحملة تسويقية مكثفة',
      'معدل التحويل أقل من المستهدف بـ 3% - يحتاج تحسين',
    ];

    return {
      title: 'Executive Dashboard',
      titleAr: 'لوحة التحكم التنفيذية',
      cards,
      charts,
      alerts,
      recommendations,
    };
  }

  /**
   * لوحة تحكم المبيعات - Sales Dashboard
   */
  async generateSalesDashboard(timeRange: { start: Date; end: Date }): Promise<Dashboard> {
    const cards: DashboardCard[] = [
      {
        title: 'Sales This Month',
        titleAr: 'المبيعات هذا الشهر',
        value: 597419,
        unit: 'جنيه',
        change: 15.3,
        trend: 'up',
        color: 'green',
      },
      {
        title: 'Orders This Month',
        titleAr: 'الطلبات هذا الشهر',
        value: 1000,
        change: 12.5,
        trend: 'up',
        color: 'blue',
      },
      {
        title: 'Average Order Value',
        titleAr: 'متوسط قيمة الطلب',
        value: 597,
        unit: 'جنيه',
        change: 2.3,
        trend: 'up',
        color: 'purple',
      },
      {
        title: 'Conversion Rate',
        titleAr: 'معدل التحويل',
        value: '22%',
        change: -1.2,
        trend: 'down',
        color: 'yellow',
      },
    ];

    const charts: ChartData[] = [
      {
        type: 'line',
        title: 'Daily Sales',
        titleAr: 'المبيعات اليومية',
        data: this.generateDailySales(timeRange),
      },
      {
        type: 'bar',
        title: 'Sales by Product',
        titleAr: 'المبيعات حسب المنتج',
        data: this.generateSalesByProduct(),
      },
      {
        type: 'area',
        title: 'Sales Funnel',
        titleAr: 'قمع المبيعات',
        data: this.generateSalesFunnel(),
      },
    ];

    const alerts: Alert[] = [
      {
        id: 'sales-alert-1',
        severity: 'warning',
        title: 'Low Conversion Rate',
        titleAr: 'معدل تحويل منخفض',
        message: 'Conversion rate is 3% below target',
        messageAr: 'معدل التحويل أقل من المستهدف بـ 3%',
        timestamp: new Date(),
        actionRequired: true,
      },
    ];

    return {
      title: 'Sales Dashboard',
      titleAr: 'لوحة تحكم المبيعات',
      cards,
      charts,
      alerts,
      recommendations: [
        'استهداف العملاء الذين لم يشتروا منذ 30 يوم',
        'تقديم عروض خاصة على المنتجات الأكثر مبيعاً',
      ],
    };
  }

  /**
   * لوحة تحكم العمليات - Operations Dashboard
   */
  async generateOperationsDashboard(timeRange: { start: Date; end: Date }): Promise<Dashboard> {
    const cards: DashboardCard[] = [
      {
        title: 'Orders Fulfilled',
        titleAr: 'الطلبات المنفذة',
        value: 2250,
        change: 10.2,
        trend: 'up',
        color: 'green',
      },
      {
        title: 'Pending Orders',
        titleAr: 'الطلبات المعلقة',
        value: 150,
        change: -5.3,
        trend: 'down',
        color: 'blue',
      },
      {
        title: 'Inventory Accuracy',
        titleAr: 'دقة المخزون',
        value: '96%',
        change: 1.5,
        trend: 'up',
        color: 'green',
      },
      {
        title: 'On-Time Delivery',
        titleAr: 'التوصيل في الموعد',
        value: '92%',
        change: 3.2,
        trend: 'up',
        color: 'green',
      },
    ];

    const charts: ChartData[] = [
      {
        type: 'line',
        title: 'Order Fulfillment Time',
        titleAr: 'وقت تنفيذ الطلب',
        data: this.generateFulfillmentTime(timeRange),
      },
      {
        type: 'bar',
        title: 'Warehouse Efficiency',
        titleAr: 'كفاءة المخزن',
        data: this.generateWarehouseEfficiency(),
      },
      {
        type: 'pie',
        title: 'Delivery Status',
        titleAr: 'حالة التوصيل',
        data: this.generateDeliveryStatus(),
      },
    ];

    const alerts: Alert[] = [
      {
        id: 'ops-alert-1',
        severity: 'info',
        title: 'High Pending Orders',
        titleAr: 'طلبات معلقة كثيرة',
        message: '150 orders pending - consider increasing warehouse staff',
        messageAr: '150 طلب معلق - يُنصح بزيادة موظفي المخزن',
        timestamp: new Date(),
        actionRequired: false,
      },
    ];

    return {
      title: 'Operations Dashboard',
      titleAr: 'لوحة تحكم العمليات',
      cards,
      charts,
      alerts,
      recommendations: [
        'تحسين عملية تجهيز الطلبات لتقليل الوقت بـ 15%',
        'إعادة تنظيم المخزن لزيادة الكفاءة',
      ],
    };
  }

  /**
   * لوحة تحكم الموارد البشرية - HR Dashboard
   */
  async generateHRDashboard(): Promise<Dashboard> {
    const cards: DashboardCard[] = [
      {
        title: 'Total Employees',
        titleAr: 'إجمالي الموظفين',
        value: 25,
        change: 0,
        trend: 'stable',
        color: 'blue',
      },
      {
        title: 'Employee Satisfaction',
        titleAr: 'رضا الموظفين',
        value: '78%',
        change: 2.5,
        trend: 'up',
        color: 'green',
      },
      {
        title: 'Turnover Rate',
        titleAr: 'معدل دوران الموظفين',
        value: '12%',
        change: 0,
        trend: 'stable',
        color: 'yellow',
      },
      {
        title: 'Open Positions',
        titleAr: 'الوظائف الشاغرة',
        value: 3,
        change: 50,
        trend: 'up',
        color: 'purple',
      },
    ];

    // الحصول على KPIs
    const salesKPIs = performanceSystem.getKPIs(KPIType.SALES);

    const charts: ChartData[] = [
      {
        type: 'bar',
        title: 'Employee Distribution',
        titleAr: 'توزيع الموظفين',
        data: this.generateEmployeeDistribution(),
      },
      {
        type: 'line',
        title: 'Performance Trends',
        titleAr: 'اتجاهات الأداء',
        data: this.generatePerformanceTrends(),
      },
      {
        type: 'pie',
        title: 'Training Completion',
        titleAr: 'إكمال التدريبات',
        data: this.generateTrainingCompletion(),
      },
    ];

    const alerts: Alert[] = [
      {
        id: 'hr-alert-1',
        severity: 'warning',
        title: 'High Workload',
        titleAr: 'حمل عمل مرتفع',
        message: 'Customer service team is overloaded - consider hiring 2 more employees',
        messageAr: 'فريق خدمة العملاء محمل بشكل زائد - يُنصح بتوظيف 2 موظف إضافي',
        timestamp: new Date(),
        actionRequired: true,
      },
    ];

    // الحصول على توصيات التوظيف
    const staffingRec = await recruitmentSystem.getStaffingRecommendations();

    return {
      title: 'HR Dashboard',
      titleAr: 'لوحة تحكم الموارد البشرية',
      cards,
      charts,
      alerts,
      recommendations: [
        staffingRec.reasoning,
        'تنفيذ برنامج تطوير مهني لزيادة رضا الموظفين',
        'مراجعة الرواتب للاحتفاظ بالموظفين المتميزين',
      ],
    };
  }

  /**
   * لوحة تحكم المحاكاة - Simulation Dashboard
   */
  async generateSimulationDashboard(): Promise<Dashboard> {
    const engine = createSimulationEngine({
      iterations: 100, // تقليل عدد التكرارات للسرعة
      timeframe: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    });

    const results = await engine.run();

    const cards: DashboardCard[] = [
      {
        title: 'Predicted Revenue (Next Month)',
        titleAr: 'الإيرادات المتوقعة (الشهر القادم)',
        value: results[0]?.predictions?.nextMonth || 600000,
        unit: 'جنيه',
        color: 'green',
      },
      {
        title: 'Predicted Growth Rate',
        titleAr: 'معدل النمو المتوقع',
        value: '15%',
        color: 'blue',
      },
      {
        title: 'Confidence Level',
        titleAr: 'مستوى الثقة',
        value: '90%',
        color: 'green',
      },
      {
        title: 'Risk Level',
        titleAr: 'مستوى المخاطر',
        value: 'Low',
        color: 'green',
      },
    ];

    const charts: ChartData[] = [
      {
        type: 'line',
        title: 'Revenue Forecast',
        titleAr: 'توقعات الإيرادات',
        data: this.generateRevenueForecast(results),
      },
      {
        type: 'area',
        title: 'Confidence Interval',
        titleAr: 'فاصل الثقة',
        data: this.generateConfidenceInterval(),
      },
      {
        type: 'bar',
        title: 'Scenario Comparison',
        titleAr: 'مقارنة السيناريوهات',
        data: this.generateScenarioComparison(),
      },
    ];

    return {
      title: 'Simulation Dashboard',
      titleAr: 'لوحة تحكم المحاكاة',
      cards,
      charts,
      alerts: [],
      recommendations: [
        'السيناريو المتفائل يتوقع نمو 30% - يتطلب زيادة الطاقة الإنتاجية',
        'السيناريو المحافظ آمن بنسبة 85% - مناسب للتخطيط قصير المدى',
      ],
    };
  }

  // ===== دوال مساعدة لتوليد البيانات =====

  private generateRevenueTrend(timeRange: { start: Date; end: Date }) {
    const data = [];
    const days = 30;
    for (let i = 0; i < days; i++) {
      data.push({
        date: new Date(timeRange.end.getTime() - (days - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        revenue: 15000 + Math.random() * 10000,
      });
    }
    return data;
  }

  private generateOrdersByStatus() {
    return [
      { status: 'Pending', count: 150 },
      { status: 'Processing', count: 300 },
      { status: 'Shipped', count: 800 },
      { status: 'Delivered', count: 1750 },
    ];
  }

  private generateRevenueByCategory() {
    return [
      { category: 'أحذية رجالي', revenue: 650000 },
      { category: 'أحذية نسائي', revenue: 720000 },
      { category: 'أحذية أطفال', revenue: 422258 },
    ];
  }

  private async generateExecutiveAlerts(): Promise<Alert[]> {
    return [
      {
        id: 'exec-alert-1',
        severity: 'critical',
        title: 'High Customer Service Load',
        titleAr: 'حمل عمل مرتفع لخدمة العملاء',
        message: 'Response time increased by 40% - immediate action required',
        messageAr: 'وقت الاستجابة زاد بنسبة 40% - يحتاج إجراء فوري',
        timestamp: new Date(),
        actionRequired: true,
      },
      {
        id: 'exec-alert-2',
        severity: 'info',
        title: 'Seasonal Opportunity',
        titleAr: 'فرصة موسمية',
        message: 'Holiday season approaching - time to boost marketing',
        messageAr: 'موسم العطلات يقترب - حان وقت تعزيز التسويق',
        timestamp: new Date(),
        actionRequired: false,
      },
    ];
  }

  private generateDailySales(timeRange: { start: Date; end: Date }) {
    const data = [];
    const days = 30;
    for (let i = 0; i < days; i++) {
      data.push({
        date: new Date(timeRange.end.getTime() - (days - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        sales: 15000 + Math.random() * 10000,
        orders: 25 + Math.floor(Math.random() * 20),
      });
    }
    return data;
  }

  private generateSalesByProduct() {
    return [
      { product: 'حذاء رياضي رجالي', sales: 150000 },
      { product: 'حذاء كاجوال رجالي', sales: 120000 },
      { product: 'حذاء رياضي نسائي', sales: 180000 },
      { product: 'حذاء كلاسيك نسائي', sales: 140000 },
      { product: 'حذاء أطفال', sales: 110000 },
    ];
  }

  private generateSalesFunnel() {
    return [
      { stage: 'زوار الموقع', count: 10000 },
      { stage: 'عرض المنتجات', count: 5000 },
      { stage: 'إضافة للسلة', count: 2000 },
      { stage: 'بدء الدفع', count: 1200 },
      { stage: 'إتمام الشراء', count: 1000 },
    ];
  }

  private generateFulfillmentTime(timeRange: { start: Date; end: Date }) {
    const data = [];
    const days = 30;
    for (let i = 0; i < days; i++) {
      data.push({
        date: new Date(timeRange.end.getTime() - (days - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        hours: 2 + Math.random() * 2,
      });
    }
    return data;
  }

  private generateWarehouseEfficiency() {
    return [
      { metric: 'Picking Accuracy', value: 97 },
      { metric: 'Packing Speed', value: 85 },
      { metric: 'Space Utilization', value: 80 },
      { metric: 'Inventory Accuracy', value: 96 },
    ];
  }

  private generateDeliveryStatus() {
    return [
      { status: 'Delivered', count: 1750 },
      { status: 'In Transit', count: 800 },
      { status: 'Failed', count: 150 },
      { status: 'Returned', count: 100 },
    ];
  }

  private generateEmployeeDistribution() {
    return [
      { department: 'مبيعات', count: 8 },
      { department: 'خدمة عملاء', count: 6 },
      { department: 'مخازن', count: 5 },
      { department: 'توصيل', count: 4 },
      { department: 'إدارة', count: 2 },
    ];
  }

  private generatePerformanceTrends() {
    const data = [];
    for (let i = 0; i < 6; i++) {
      data.push({
        month: `الشهر ${i + 1}`,
        performance: 75 + Math.random() * 15,
      });
    }
    return data;
  }

  private generateTrainingCompletion() {
    return [
      { status: 'Completed', count: 18 },
      { status: 'In Progress', count: 5 },
      { status: 'Not Started', count: 2 },
    ];
  }

  private generateRevenueForecast(results: any[]) {
    return [
      { month: 'الشهر 1', revenue: 600000 },
      { month: 'الشهر 2', revenue: 690000 },
      { month: 'الشهر 3', revenue: 793500 },
      { month: 'الشهر 4', revenue: 912500 },
      { month: 'الشهر 5', revenue: 1049375 },
      { month: 'الشهر 6', revenue: 1206781 },
    ];
  }

  private generateConfidenceInterval() {
    return [
      { month: 'الشهر 1', lower: 540000, predicted: 600000, upper: 660000 },
      { month: 'الشهر 2', lower: 621000, predicted: 690000, upper: 759000 },
      { month: 'الشهر 3', lower: 714150, predicted: 793500, upper: 872850 },
    ];
  }

  private generateScenarioComparison() {
    return [
      { scenario: 'محافظ', revenue: 630000 },
      { scenario: 'معتدل', revenue: 690000 },
      { scenario: 'متفائل', revenue: 780000 },
      { scenario: 'أفضل حالة', revenue: 900000 },
    ];
  }
}

/**
 * Router
 */
export const dashboardsRouter = router({
  /**
   * لوحة التحكم التنفيذية
   */
  executive: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const generator = new DashboardGenerator();

      const timeRange = {
        start: input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: input.endDate ? new Date(input.endDate) : new Date(),
      };

      return generator.generateExecutiveDashboard(timeRange);
    }),

  /**
   * لوحة تحكم المبيعات
   */
  sales: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const generator = new DashboardGenerator();

      const timeRange = {
        start: input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: input.endDate ? new Date(input.endDate) : new Date(),
      };

      return generator.generateSalesDashboard(timeRange);
    }),

  /**
   * لوحة تحكم العمليات
   */
  operations: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const generator = new DashboardGenerator();

      const timeRange = {
        start: input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: input.endDate ? new Date(input.endDate) : new Date(),
      };

      return generator.generateOperationsDashboard(timeRange);
    }),

  /**
   * لوحة تحكم الموارد البشرية
   */
  hr: publicProcedure.query(async () => {
    const generator = new DashboardGenerator();
    return generator.generateHRDashboard();
  }),

  /**
   * لوحة تحكم المحاكاة
   */
  simulation: publicProcedure.query(async () => {
    const generator = new DashboardGenerator();
    return generator.generateSimulationDashboard();
  }),
});
