/**
 * نظام إدارة الأداء - Performance Management System
 * يشمل: تتبع الأداء، KPIs، المراجعات، الأهداف، التطوير
 */

import { getDb } from '../db';
import type { SQL } from 'drizzle-orm';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

/**
 * مؤشرات الأداء الرئيسية - Key Performance Indicators
 */
export interface KPI {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'average' | 'poor';
}

/**
 * نوع المؤشر حسب الدور
 */
export enum KPIType {
  SALES = 'sales',
  CUSTOMER_SERVICE = 'customer_service',
  WAREHOUSE = 'warehouse',
  DELIVERY = 'delivery',
  MANAGEMENT = 'management',
}

/**
 * تقييم الأداء
 */
export interface PerformanceReview {
  employeeId: number;
  reviewerId: number;
  period: {
    start: Date;
    end: Date;
  };
  ratings: {
    productivity: number; // 1-5
    quality: number; // 1-5
    teamwork: number; // 1-5
    communication: number; // 1-5
    initiative: number; // 1-5
    attendance: number; // 1-5
  };
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  goals: Goal[];
  comments: string;
  reviewDate: Date;
}

/**
 * الهدف
 */
export interface Goal {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  progress: number; // 0-100
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  category: 'sales' | 'quality' | 'development' | 'teamwork' | 'other';
}

/**
 * خطة التطوير
 */
export interface DevelopmentPlan {
  employeeId: number;
  skills: SkillDevelopment[];
  courses: Course[];
  mentorship: {
    mentor?: number;
    mentee?: number[];
  };
  careerPath: string;
  nextReviewDate: Date;
}

/**
 * تطوير المهارة
 */
export interface SkillDevelopment {
  skill: string;
  currentLevel: number; // 1-5
  targetLevel: number; // 1-5
  deadline: Date;
  resources: string[];
}

/**
 * الدورة التدريبية
 */
export interface Course {
  title: string;
  provider: string;
  duration: number; // بالساعات
  completed: boolean;
  completionDate?: Date;
  certificateUrl?: string;
}

/**
 * مدير مؤشرات الأداء - KPI Manager
 */
export class KPIManager {
  /**
   * الحصول على مؤشرات الأداء حسب الدور
   */
  getKPIsByRole(role: KPIType): KPI[] {
    switch (role) {
      case KPIType.SALES:
        return this.getSalesKPIs();
      case KPIType.CUSTOMER_SERVICE:
        return this.getCustomerServiceKPIs();
      case KPIType.WAREHOUSE:
        return this.getWarehouseKPIs();
      case KPIType.DELIVERY:
        return this.getDeliveryKPIs();
      case KPIType.MANAGEMENT:
        return this.getManagementKPIs();
      default:
        return [];
    }
  }

  /**
   * مؤشرات المبيعات
   */
  private getSalesKPIs(): KPI[] {
    return [
      {
        id: 'sales-revenue',
        name: 'Monthly Revenue',
        nameAr: 'الإيرادات الشهرية',
        description: 'إجمالي المبيعات الشهرية',
        target: 100000,
        current: 85000,
        unit: 'جنيه',
        trend: 'up',
        status: 'good',
      },
      {
        id: 'sales-conversion',
        name: 'Conversion Rate',
        nameAr: 'معدل التحويل',
        description: 'نسبة تحويل العملاء المحتملين إلى عملاء',
        target: 25,
        current: 22,
        unit: '%',
        trend: 'stable',
        status: 'good',
      },
      {
        id: 'sales-avg-deal',
        name: 'Average Deal Size',
        nameAr: 'متوسط قيمة الصفقة',
        description: 'متوسط قيمة الطلب الواحد',
        target: 800,
        current: 750,
        unit: 'جنيه',
        trend: 'up',
        status: 'good',
      },
      {
        id: 'sales-customer-acquisition',
        name: 'New Customers',
        nameAr: 'عملاء جدد',
        description: 'عدد العملاء الجدد شهرياً',
        target: 50,
        current: 45,
        unit: 'عميل',
        trend: 'up',
        status: 'good',
      },
    ];
  }

  /**
   * مؤشرات خدمة العملاء
   */
  private getCustomerServiceKPIs(): KPI[] {
    return [
      {
        id: 'cs-satisfaction',
        name: 'Customer Satisfaction',
        nameAr: 'رضا العملاء',
        description: 'نسبة رضا العملاء',
        target: 90,
        current: 88,
        unit: '%',
        trend: 'stable',
        status: 'good',
      },
      {
        id: 'cs-response-time',
        name: 'Response Time',
        nameAr: 'وقت الاستجابة',
        description: 'متوسط وقت الرد على الاستفسارات',
        target: 5,
        current: 7,
        unit: 'دقيقة',
        trend: 'down',
        status: 'average',
      },
      {
        id: 'cs-resolution-rate',
        name: 'First Contact Resolution',
        nameAr: 'حل من أول اتصال',
        description: 'نسبة حل المشاكل من أول اتصال',
        target: 80,
        current: 75,
        unit: '%',
        trend: 'up',
        status: 'good',
      },
      {
        id: 'cs-tickets-handled',
        name: 'Tickets Handled',
        nameAr: 'التذاكر المعالجة',
        description: 'عدد التذاكر المعالجة يومياً',
        target: 30,
        current: 28,
        unit: 'تذكرة',
        trend: 'stable',
        status: 'good',
      },
    ];
  }

  /**
   * مؤشرات المخازن
   */
  private getWarehouseKPIs(): KPI[] {
    return [
      {
        id: 'wh-accuracy',
        name: 'Inventory Accuracy',
        nameAr: 'دقة المخزون',
        description: 'نسبة دقة المخزون',
        target: 98,
        current: 96,
        unit: '%',
        trend: 'up',
        status: 'good',
      },
      {
        id: 'wh-fulfillment-time',
        name: 'Order Fulfillment Time',
        nameAr: 'وقت تجهيز الطلب',
        description: 'متوسط وقت تجهيز الطلب',
        target: 2,
        current: 2.5,
        unit: 'ساعة',
        trend: 'stable',
        status: 'average',
      },
      {
        id: 'wh-picking-accuracy',
        name: 'Picking Accuracy',
        nameAr: 'دقة الاختيار',
        description: 'نسبة دقة اختيار المنتجات',
        target: 99,
        current: 97,
        unit: '%',
        trend: 'up',
        status: 'good',
      },
      {
        id: 'wh-utilization',
        name: 'Space Utilization',
        nameAr: 'استغلال المساحة',
        description: 'نسبة استغلال مساحة المخزن',
        target: 85,
        current: 80,
        unit: '%',
        trend: 'stable',
        status: 'good',
      },
    ];
  }

  /**
   * مؤشرات التوصيل
   */
  private getDeliveryKPIs(): KPI[] {
    return [
      {
        id: 'del-on-time',
        name: 'On-Time Delivery',
        nameAr: 'التوصيل في الموعد',
        description: 'نسبة التوصيل في الموعد المحدد',
        target: 95,
        current: 92,
        unit: '%',
        trend: 'up',
        status: 'good',
      },
      {
        id: 'del-per-day',
        name: 'Deliveries per Day',
        nameAr: 'التوصيلات اليومية',
        description: 'عدد التوصيلات اليومية',
        target: 40,
        current: 38,
        unit: 'توصيلة',
        trend: 'stable',
        status: 'good',
      },
      {
        id: 'del-failed',
        name: 'Failed Deliveries',
        nameAr: 'التوصيلات الفاشلة',
        description: 'نسبة التوصيلات الفاشلة',
        target: 5,
        current: 7,
        unit: '%',
        trend: 'down',
        status: 'average',
      },
      {
        id: 'del-cost-per',
        name: 'Cost per Delivery',
        nameAr: 'تكلفة التوصيلة',
        description: 'متوسط تكلفة التوصيلة الواحدة',
        target: 25,
        current: 28,
        unit: 'جنيه',
        trend: 'stable',
        status: 'average',
      },
    ];
  }

  /**
   * مؤشرات الإدارة
   */
  private getManagementKPIs(): KPI[] {
    return [
      {
        id: 'mgmt-team-productivity',
        name: 'Team Productivity',
        nameAr: 'إنتاجية الفريق',
        description: 'إنتاجية الفريق الإجمالية',
        target: 85,
        current: 82,
        unit: '%',
        trend: 'up',
        status: 'good',
      },
      {
        id: 'mgmt-employee-satisfaction',
        name: 'Employee Satisfaction',
        nameAr: 'رضا الموظفين',
        description: 'نسبة رضا الموظفين',
        target: 80,
        current: 78,
        unit: '%',
        trend: 'stable',
        status: 'good',
      },
      {
        id: 'mgmt-turnover',
        name: 'Employee Turnover',
        nameAr: 'دوران الموظفين',
        description: 'نسبة دوران الموظفين',
        target: 10,
        current: 12,
        unit: '%',
        trend: 'stable',
        status: 'average',
      },
      {
        id: 'mgmt-budget-adherence',
        name: 'Budget Adherence',
        nameAr: 'الالتزام بالميزانية',
        description: 'نسبة الالتزام بالميزانية',
        target: 95,
        current: 93,
        unit: '%',
        trend: 'up',
        status: 'good',
      },
    ];
  }

  /**
   * حساب حالة المؤشر
   */
  calculateStatus(current: number, target: number, isHigherBetter: boolean = true): 'excellent' | 'good' | 'average' | 'poor' {
    const percentage = (current / target) * 100;

    if (!isHigherBetter) {
      // للمؤشرات حيث القيمة الأقل أفضل (مثل التكلفة)
      if (percentage <= 90) return 'excellent';
      if (percentage <= 100) return 'good';
      if (percentage <= 110) return 'average';
      return 'poor';
    } else {
      // للمؤشرات حيث القيمة الأعلى أفضل
      if (percentage >= 100) return 'excellent';
      if (percentage >= 90) return 'good';
      if (percentage >= 75) return 'average';
      return 'poor';
    }
  }
}

/**
 * مدير التقييمات - Review Manager
 */
export class ReviewManager {
  /**
   * إنشاء تقييم جديد
   */
  createReview(employeeId: number, reviewerId: number): PerformanceReview {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return {
      employeeId,
      reviewerId,
      period: {
        start: threeMonthsAgo,
        end: now,
      },
      ratings: {
        productivity: 3,
        quality: 3,
        teamwork: 3,
        communication: 3,
        initiative: 3,
        attendance: 3,
      },
      overallScore: 0,
      strengths: [],
      areasForImprovement: [],
      goals: [],
      comments: '',
      reviewDate: now,
    };
  }

  /**
   * حساب الدرجة الإجمالية
   */
  calculateOverallScore(ratings: PerformanceReview['ratings']): number {
    const weights = {
      productivity: 0.25,
      quality: 0.25,
      teamwork: 0.15,
      communication: 0.15,
      initiative: 0.10,
      attendance: 0.10,
    };

    let score = 0;
    score += ratings.productivity * weights.productivity;
    score += ratings.quality * weights.quality;
    score += ratings.teamwork * weights.teamwork;
    score += ratings.communication * weights.communication;
    score += ratings.initiative * weights.initiative;
    score += ratings.attendance * weights.attendance;

    return Math.round(score * 20); // تحويل من 5 إلى 100
  }

  /**
   * توليد نقاط القوة والتحسين بناءً على التقييمات
   */
  analyzeRatings(ratings: PerformanceReview['ratings']): {
    strengths: string[];
    areasForImprovement: string[];
  } {
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];

    const categories = [
      { key: 'productivity' as const, name: 'الإنتاجية' },
      { key: 'quality' as const, name: 'جودة العمل' },
      { key: 'teamwork' as const, name: 'العمل الجماعي' },
      { key: 'communication' as const, name: 'التواصل' },
      { key: 'initiative' as const, name: 'المبادرة' },
      { key: 'attendance' as const, name: 'الحضور والالتزام' },
    ];

    for (const category of categories) {
      const rating = ratings[category.key];
      if (rating >= 4) {
        strengths.push(category.name);
      } else if (rating <= 2) {
        areasForImprovement.push(category.name);
      }
    }

    return { strengths, areasForImprovement };
  }

  /**
   * اقتراح أهداف بناءً على التقييم
   */
  suggestGoals(review: PerformanceReview): Goal[] {
    const goals: Goal[] = [];
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    // أهداف بناءً على نقاط التحسين
    if (review.ratings.productivity < 4) {
      goals.push({
        id: `goal-${Date.now()}-1`,
        title: 'تحسين الإنتاجية',
        description: 'زيادة معدل إنجاز المهام بنسبة 20%',
        dueDate: threeMonthsLater,
        progress: 0,
        status: 'not_started',
        priority: 'high',
        category: 'development',
      });
    }

    if (review.ratings.quality < 4) {
      goals.push({
        id: `goal-${Date.now()}-2`,
        title: 'تحسين جودة العمل',
        description: 'تقليل الأخطاء بنسبة 30%',
        dueDate: threeMonthsLater,
        progress: 0,
        status: 'not_started',
        priority: 'high',
        category: 'quality',
      });
    }

    if (review.ratings.teamwork < 4) {
      goals.push({
        id: `goal-${Date.now()}-3`,
        title: 'تعزيز العمل الجماعي',
        description: 'المشاركة في 3 مشاريع جماعية على الأقل',
        dueDate: threeMonthsLater,
        progress: 0,
        status: 'not_started',
        priority: 'medium',
        category: 'teamwork',
      });
    }

    // هدف عام للجميع
    goals.push({
      id: `goal-${Date.now()}-4`,
      title: 'التطوير المهني',
      description: 'إكمال دورة تدريبية واحدة على الأقل',
      dueDate: threeMonthsLater,
      progress: 0,
      status: 'not_started',
      priority: 'medium',
      category: 'development',
    });

    return goals;
  }
}

/**
 * مدير التطوير - Development Manager
 */
export class DevelopmentManager {
  /**
   * إنشاء خطة تطوير
   */
  createDevelopmentPlan(employeeId: number, currentRole: string): DevelopmentPlan {
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    return {
      employeeId,
      skills: this.recommendSkills(currentRole),
      courses: this.recommendCourses(currentRole),
      mentorship: {
        mentor: undefined,
        mentee: [],
      },
      careerPath: this.suggestCareerPath(currentRole),
      nextReviewDate: sixMonthsLater,
    };
  }

  /**
   * التوصية بالمهارات للتطوير
   */
  private recommendSkills(role: string): SkillDevelopment[] {
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const skillsByRole: Record<string, SkillDevelopment[]> = {
      sales: [
        {
          skill: 'تقنيات البيع المتقدمة',
          currentLevel: 3,
          targetLevel: 4,
          deadline: threeMonthsLater,
          resources: ['كورس Udemy: Advanced Sales Techniques'],
        },
        {
          skill: 'إدارة علاقات العملاء',
          currentLevel: 2,
          targetLevel: 4,
          deadline: threeMonthsLater,
          resources: ['كتاب: The Psychology of Selling'],
        },
      ],
      customer_service: [
        {
          skill: 'حل المشكلات المعقدة',
          currentLevel: 3,
          targetLevel: 4,
          deadline: threeMonthsLater,
          resources: ['دورة: Customer Service Excellence'],
        },
        {
          skill: 'التعامل مع الشكاوى',
          currentLevel: 3,
          targetLevel: 5,
          deadline: threeMonthsLater,
          resources: ['كورس LinkedIn Learning: Handling Complaints'],
        },
      ],
      warehouse: [
        {
          skill: 'إدارة المخزون المتقدمة',
          currentLevel: 2,
          targetLevel: 4,
          deadline: threeMonthsLater,
          resources: ['دورة: Warehouse Management Systems'],
        },
        {
          skill: 'السلامة والصحة المهنية',
          currentLevel: 3,
          targetLevel: 5,
          deadline: threeMonthsLater,
          resources: ['شهادة OSHA Safety'],
        },
      ],
    };

    return skillsByRole[role] || [];
  }

  /**
   * التوصية بالدورات
   */
  private recommendCourses(role: string): Course[] {
    const coursesByRole: Record<string, Course[]> = {
      sales: [
        {
          title: 'Consultative Selling',
          provider: 'Coursera',
          duration: 20,
          completed: false,
        },
        {
          title: 'Digital Marketing for Sales',
          provider: 'Udemy',
          duration: 15,
          completed: false,
        },
      ],
      customer_service: [
        {
          title: 'Customer Experience Management',
          provider: 'LinkedIn Learning',
          duration: 12,
          completed: false,
        },
        {
          title: 'Emotional Intelligence',
          provider: 'Coursera',
          duration: 18,
          completed: false,
        },
      ],
      warehouse: [
        {
          title: 'Supply Chain Management',
          provider: 'edX',
          duration: 25,
          completed: false,
        },
        {
          title: 'Lean Six Sigma',
          provider: 'Udemy',
          duration: 30,
          completed: false,
        },
      ],
    };

    return coursesByRole[role] || [];
  }

  /**
   * اقتراح المسار الوظيفي
   */
  private suggestCareerPath(currentRole: string): string {
    const careerPaths: Record<string, string> = {
      sales: 'مندوب مبيعات → كبير مندوبي المبيعات → مدير مبيعات → مدير عام المبيعات',
      customer_service: 'موظف خدمة عملاء → كبير موظفي الخدمة → مشرف خدمة العملاء → مدير خدمة العملاء',
      warehouse: 'موظف مخزن → كبير موظفي المخزن → مشرف مخزن → مدير المخازن',
      delivery: 'سائق توصيل → كبير السائقين → مشرف التوصيل → مدير العمليات',
      manager: 'مدير قسم → مدير عام → مدير تنفيذي',
    };

    return careerPaths[currentRole] || 'مسار وظيفي مخصص';
  }

  /**
   * تتبع تقدم المهارة
   */
  trackSkillProgress(skill: SkillDevelopment): {
    progress: number;
    isOnTrack: boolean;
    daysRemaining: number;
  } {
    const now = new Date();
    const daysRemaining = Math.ceil(
      (skill.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const expectedProgress = skill.targetLevel - skill.currentLevel;
    const progress = Math.min(100, ((skill.targetLevel - skill.currentLevel) / expectedProgress) * 100);

    const isOnTrack = daysRemaining > 0 && progress >= 50;

    return {
      progress,
      isOnTrack,
      daysRemaining,
    };
  }
}

/**
 * نظام إدارة الأداء المتكامل
 */
export class PerformanceManagementSystem {
  private kpiManager: KPIManager;
  private reviewManager: ReviewManager;
  private developmentManager: DevelopmentManager;

  constructor() {
    this.kpiManager = new KPIManager();
    this.reviewManager = new ReviewManager();
    this.developmentManager = new DevelopmentManager();
  }

  /**
   * الحصول على مؤشرات الأداء
   */
  getKPIs(role: KPIType): KPI[] {
    return this.kpiManager.getKPIsByRole(role);
  }

  /**
   * إنشاء تقييم أداء
   */
  createPerformanceReview(employeeId: number, reviewerId: number): PerformanceReview {
    return this.reviewManager.createReview(employeeId, reviewerId);
  }

  /**
   * حفظ تقييم الأداء
   */
  submitPerformanceReview(review: PerformanceReview): PerformanceReview {
    // حساب الدرجة الإجمالية
    review.overallScore = this.reviewManager.calculateOverallScore(review.ratings);

    // تحليل التقييمات
    const analysis = this.reviewManager.analyzeRatings(review.ratings);
    review.strengths = analysis.strengths;
    review.areasForImprovement = analysis.areasForImprovement;

    // اقتراح أهداف
    review.goals = this.reviewManager.suggestGoals(review);

    return review;
  }

  /**
   * إنشاء خطة تطوير
   */
  createDevelopmentPlan(employeeId: number, currentRole: string): DevelopmentPlan {
    return this.developmentManager.createDevelopmentPlan(employeeId, currentRole);
  }

  /**
   * تقرير الأداء الشامل
   */
  async generatePerformanceReport(employeeId: number): Promise<{
    kpis: KPI[];
    latestReview?: PerformanceReview;
    developmentPlan?: DevelopmentPlan;
    summary: string;
  }> {
    // هنا يمكن إضافة جلب البيانات الفعلية من قاعدة البيانات
    const kpis = this.kpiManager.getKPIsByRole(KPIType.SALES);

    return {
      kpis,
      latestReview: undefined,
      developmentPlan: undefined,
      summary: 'تقرير الأداء قيد الإعداد',
    };
  }
}

/**
 * تصدير النظام
 */
export const performanceSystem = new PerformanceManagementSystem();
