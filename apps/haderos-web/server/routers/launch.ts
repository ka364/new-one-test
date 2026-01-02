/**
 * نظام الإطلاق والنمو - Launch & Growth System
 * يوفر أدوات لإدارة الإطلاق، تتبع النمو، وتحقيق الأهداف
 */

import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { createSimulationEngine } from '../simulation/engine';
import { recruitmentSystem } from '../hr/recruitment';

/**
 * مرحلة الإطلاق
 */
export enum LaunchPhase {
  PRE_LAUNCH = 'pre_launch',
  SOFT_LAUNCH = 'soft_launch',
  PUBLIC_LAUNCH = 'public_launch',
  GROWTH = 'growth',
  SCALE = 'scale',
}

/**
 * حالة المهمة
 */
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

/**
 * مهمة الإطلاق
 */
export interface LaunchTask {
  id: string;
  phase: LaunchPhase;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  status: TaskStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: Date;
  assignee?: string;
  dependencies: string[];
  checklist: ChecklistItem[];
  progress: number; // 0-100
}

/**
 * عنصر قائمة التحقق
 */
export interface ChecklistItem {
  id: string;
  title: string;
  titleAr: string;
  completed: boolean;
}

/**
 * مؤشرات النمو
 */
export interface GrowthMetrics {
  revenue: {
    current: number;
    target: number;
    growth: number; // %
    trend: 'up' | 'down' | 'stable';
  };
  customers: {
    current: number;
    target: number;
    growth: number;
    churnRate: number;
  };
  orders: {
    current: number;
    target: number;
    growth: number;
    conversionRate: number;
  };
  team: {
    current: number;
    target: number;
    growth: number;
    productivity: number;
  };
}

/**
 * هدف النمو
 */
export interface GrowthGoal {
  id: string;
  title: string;
  titleAr: string;
  metric: 'revenue' | 'customers' | 'orders' | 'team';
  current: number;
  target: number;
  deadline: Date;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  progress: number; // 0-100
  milestones: Milestone[];
}

/**
 * معلم رئيسي
 */
export interface Milestone {
  id: string;
  title: string;
  titleAr: string;
  target: number;
  achieved: boolean;
  date?: Date;
}

/**
 * خطة الإطلاق
 */
export interface LaunchPlan {
  phase: LaunchPhase;
  startDate: Date;
  targetDate: Date;
  tasks: LaunchTask[];
  metrics: GrowthMetrics;
  goals: GrowthGoal[];
  risks: Risk[];
  recommendations: string[];
}

/**
 * مخاطرة
 */
export interface Risk {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: number; // 0-100
  impact: string;
  mitigation: string;
  status: 'identified' | 'mitigating' | 'resolved';
}

/**
 * مدير الإطلاق
 */
class LaunchManager {
  /**
   * إنشاء خطة إطلاق
   */
  createLaunchPlan(phase: LaunchPhase = LaunchPhase.PRE_LAUNCH): LaunchPlan {
    const startDate = new Date();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + this.getPhaseDuration(phase));

    return {
      phase,
      startDate,
      targetDate,
      tasks: this.getTasksForPhase(phase),
      metrics: this.getCurrentMetrics(),
      goals: this.getGoalsForPhase(phase),
      risks: this.identifyRisks(phase),
      recommendations: this.getRecommendations(phase),
    };
  }

  /**
   * الحصول على مهام المرحلة
   */
  private getTasksForPhase(phase: LaunchPhase): LaunchTask[] {
    const tasksByPhase: Record<LaunchPhase, LaunchTask[]> = {
      [LaunchPhase.PRE_LAUNCH]: this.getPreLaunchTasks(),
      [LaunchPhase.SOFT_LAUNCH]: this.getSoftLaunchTasks(),
      [LaunchPhase.PUBLIC_LAUNCH]: this.getPublicLaunchTasks(),
      [LaunchPhase.GROWTH]: this.getGrowthTasks(),
      [LaunchPhase.SCALE]: this.getScaleTasks(),
    };

    return tasksByPhase[phase];
  }

  /**
   * مهام ما قبل الإطلاق
   */
  private getPreLaunchTasks(): LaunchTask[] {
    return [
      {
        id: 'pre-1',
        phase: LaunchPhase.PRE_LAUNCH,
        title: 'Complete System Testing',
        titleAr: 'إكمال اختبار النظام',
        description: 'Test all systems thoroughly',
        descriptionAr: 'اختبار جميع الأنظمة بدقة',
        status: TaskStatus.COMPLETED,
        priority: 'critical',
        dependencies: [],
        checklist: [
          { id: 'c1', title: 'Unit tests', titleAr: 'اختبارات الوحدة', completed: true },
          { id: 'c2', title: 'Integration tests', titleAr: 'اختبارات التكامل', completed: true },
          { id: 'c3', title: 'Performance tests', titleAr: 'اختبارات الأداء', completed: false },
        ],
        progress: 66,
      },
      {
        id: 'pre-2',
        phase: LaunchPhase.PRE_LAUNCH,
        title: 'Setup Production Infrastructure',
        titleAr: 'إعداد البنية التحتية الإنتاجية',
        description: 'Deploy to production servers',
        descriptionAr: 'النشر على الخوادم الإنتاجية',
        status: TaskStatus.IN_PROGRESS,
        priority: 'critical',
        dependencies: ['pre-1'],
        checklist: [
          { id: 'c1', title: 'Server setup', titleAr: 'إعداد الخادم', completed: true },
          {
            id: 'c2',
            title: 'Database migration',
            titleAr: 'ترحيل قاعدة البيانات',
            completed: false,
          },
          { id: 'c3', title: 'SSL certificate', titleAr: 'شهادة SSL', completed: false },
        ],
        progress: 33,
      },
      {
        id: 'pre-3',
        phase: LaunchPhase.PRE_LAUNCH,
        title: 'Train Initial Team',
        titleAr: 'تدريب الفريق الأولي',
        description: 'Train all team members on systems',
        descriptionAr: 'تدريب جميع أعضاء الفريق على الأنظمة',
        status: TaskStatus.NOT_STARTED,
        priority: 'high',
        dependencies: [],
        checklist: [
          { id: 'c1', title: 'Sales training', titleAr: 'تدريب المبيعات', completed: false },
          { id: 'c2', title: 'CS training', titleAr: 'تدريب خدمة العملاء', completed: false },
          { id: 'c3', title: 'Operations training', titleAr: 'تدريب العمليات', completed: false },
        ],
        progress: 0,
      },
      {
        id: 'pre-4',
        phase: LaunchPhase.PRE_LAUNCH,
        title: 'Prepare Marketing Materials',
        titleAr: 'إعداد المواد التسويقية',
        description: 'Create marketing content and campaigns',
        descriptionAr: 'إنشاء المحتوى والحملات التسويقية',
        status: TaskStatus.NOT_STARTED,
        priority: 'high',
        dependencies: [],
        checklist: [
          { id: 'c1', title: 'Website content', titleAr: 'محتوى الموقع', completed: false },
          { id: 'c2', title: 'Social media', titleAr: 'وسائل التواصل', completed: false },
          { id: 'c3', title: 'Email campaigns', titleAr: 'حملات البريد', completed: false },
        ],
        progress: 0,
      },
    ];
  }

  /**
   * مهام الإطلاق التجريبي
   */
  private getSoftLaunchTasks(): LaunchTask[] {
    return [
      {
        id: 'soft-1',
        phase: LaunchPhase.SOFT_LAUNCH,
        title: 'Launch to Beta Users',
        titleAr: 'إطلاق للمستخدمين التجريبيين',
        description: 'Launch to limited user base',
        descriptionAr: 'إطلاق لقاعدة محدودة من المستخدمين',
        status: TaskStatus.NOT_STARTED,
        priority: 'critical',
        dependencies: [],
        checklist: [
          {
            id: 'c1',
            title: 'Select beta users',
            titleAr: 'اختيار المستخدمين التجريبيين',
            completed: false,
          },
          { id: 'c2', title: 'Send invitations', titleAr: 'إرسال الدعوات', completed: false },
          { id: 'c3', title: 'Monitor feedback', titleAr: 'مراقبة الملاحظات', completed: false },
        ],
        progress: 0,
      },
      {
        id: 'soft-2',
        phase: LaunchPhase.SOFT_LAUNCH,
        title: 'Gather Feedback',
        titleAr: 'جمع الملاحظات',
        description: 'Collect and analyze user feedback',
        descriptionAr: 'جمع وتحليل ملاحظات المستخدمين',
        status: TaskStatus.NOT_STARTED,
        priority: 'high',
        dependencies: ['soft-1'],
        checklist: [
          {
            id: 'c1',
            title: 'Setup feedback channels',
            titleAr: 'إعداد قنوات الملاحظات',
            completed: false,
          },
          { id: 'c2', title: 'Conduct surveys', titleAr: 'إجراء استطلاعات', completed: false },
          { id: 'c3', title: 'Analyze results', titleAr: 'تحليل النتائج', completed: false },
        ],
        progress: 0,
      },
      {
        id: 'soft-3',
        phase: LaunchPhase.SOFT_LAUNCH,
        title: 'Fix Critical Issues',
        titleAr: 'إصلاح المشاكل الحرجة',
        description: 'Address bugs and critical feedback',
        descriptionAr: 'معالجة الأخطاء والملاحظات الحرجة',
        status: TaskStatus.NOT_STARTED,
        priority: 'critical',
        dependencies: ['soft-2'],
        checklist: [
          {
            id: 'c1',
            title: 'Prioritize issues',
            titleAr: 'ترتيب المشاكل حسب الأولوية',
            completed: false,
          },
          { id: 'c2', title: 'Fix bugs', titleAr: 'إصلاح الأخطاء', completed: false },
          { id: 'c3', title: 'Verify fixes', titleAr: 'التحقق من الإصلاحات', completed: false },
        ],
        progress: 0,
      },
    ];
  }

  /**
   * مهام الإطلاق العام
   */
  private getPublicLaunchTasks(): LaunchTask[] {
    return [
      {
        id: 'pub-1',
        phase: LaunchPhase.PUBLIC_LAUNCH,
        title: 'Launch Marketing Campaign',
        titleAr: 'إطلاق الحملة التسويقية',
        description: 'Execute full marketing campaign',
        descriptionAr: 'تنفيذ الحملة التسويقية الكاملة',
        status: TaskStatus.NOT_STARTED,
        priority: 'critical',
        dependencies: [],
        checklist: [
          {
            id: 'c1',
            title: 'Social media ads',
            titleAr: 'إعلانات وسائل التواصل',
            completed: false,
          },
          { id: 'c2', title: 'Email campaign', titleAr: 'حملة البريد', completed: false },
          { id: 'c3', title: 'Press release', titleAr: 'بيان صحفي', completed: false },
        ],
        progress: 0,
      },
      {
        id: 'pub-2',
        phase: LaunchPhase.PUBLIC_LAUNCH,
        title: 'Open to Public',
        titleAr: 'الفتح للجمهور',
        description: 'Remove access restrictions',
        descriptionAr: 'إزالة قيود الوصول',
        status: TaskStatus.NOT_STARTED,
        priority: 'critical',
        dependencies: ['pub-1'],
        checklist: [
          { id: 'c1', title: 'Update website', titleAr: 'تحديث الموقع', completed: false },
          { id: 'c2', title: 'Enable registrations', titleAr: 'تفعيل التسجيلات', completed: false },
          { id: 'c3', title: 'Announce publicly', titleAr: 'الإعلان العام', completed: false },
        ],
        progress: 0,
      },
      {
        id: 'pub-3',
        phase: LaunchPhase.PUBLIC_LAUNCH,
        title: 'Monitor Performance',
        titleAr: 'مراقبة الأداء',
        description: 'Track metrics and system health',
        descriptionAr: 'تتبع المؤشرات وصحة النظام',
        status: TaskStatus.NOT_STARTED,
        priority: 'high',
        dependencies: ['pub-2'],
        checklist: [
          { id: 'c1', title: 'Setup monitoring', titleAr: 'إعداد المراقبة', completed: false },
          { id: 'c2', title: 'Daily reports', titleAr: 'تقارير يومية', completed: false },
          {
            id: 'c3',
            title: 'Response team ready',
            titleAr: 'فريق الاستجابة جاهز',
            completed: false,
          },
        ],
        progress: 0,
      },
    ];
  }

  /**
   * مهام النمو
   */
  private getGrowthTasks(): LaunchTask[] {
    return [
      {
        id: 'growth-1',
        phase: LaunchPhase.GROWTH,
        title: 'Optimize Conversion',
        titleAr: 'تحسين التحويل',
        description: 'Improve conversion rates',
        descriptionAr: 'تحسين معدلات التحويل',
        status: TaskStatus.NOT_STARTED,
        priority: 'high',
        dependencies: [],
        checklist: [
          { id: 'c1', title: 'A/B testing', titleAr: 'اختبار A/B', completed: false },
          {
            id: 'c2',
            title: 'UX improvements',
            titleAr: 'تحسينات تجربة المستخدم',
            completed: false,
          },
          { id: 'c3', title: 'Checkout optimization', titleAr: 'تحسين الدفع', completed: false },
        ],
        progress: 0,
      },
      {
        id: 'growth-2',
        phase: LaunchPhase.GROWTH,
        title: 'Expand Marketing',
        titleAr: 'توسيع التسويق',
        description: 'Scale marketing efforts',
        descriptionAr: 'توسيع الجهود التسويقية',
        status: TaskStatus.NOT_STARTED,
        priority: 'high',
        dependencies: [],
        checklist: [
          {
            id: 'c1',
            title: 'Increase ad spend',
            titleAr: 'زيادة الإنفاق الإعلاني',
            completed: false,
          },
          { id: 'c2', title: 'New channels', titleAr: 'قنوات جديدة', completed: false },
          {
            id: 'c3',
            title: 'Influencer partnerships',
            titleAr: 'شراكات المؤثرين',
            completed: false,
          },
        ],
        progress: 0,
      },
      {
        id: 'growth-3',
        phase: LaunchPhase.GROWTH,
        title: 'Improve Retention',
        titleAr: 'تحسين الاحتفاظ',
        description: 'Reduce customer churn',
        descriptionAr: 'تقليل فقدان العملاء',
        status: TaskStatus.NOT_STARTED,
        priority: 'high',
        dependencies: [],
        checklist: [
          { id: 'c1', title: 'Loyalty program', titleAr: 'برنامج الولاء', completed: false },
          { id: 'c2', title: 'Email automation', titleAr: 'أتمتة البريد', completed: false },
          { id: 'c3', title: 'Customer support', titleAr: 'دعم العملاء', completed: false },
        ],
        progress: 0,
      },
    ];
  }

  /**
   * مهام التوسع
   */
  private getScaleTasks(): LaunchTask[] {
    return [
      {
        id: 'scale-1',
        phase: LaunchPhase.SCALE,
        title: 'Scale Infrastructure',
        titleAr: 'توسيع البنية التحتية',
        description: 'Upgrade servers and systems',
        descriptionAr: 'ترقية الخوادم والأنظمة',
        status: TaskStatus.NOT_STARTED,
        priority: 'critical',
        dependencies: [],
        checklist: [
          { id: 'c1', title: 'Server capacity', titleAr: 'سعة الخوادم', completed: false },
          {
            id: 'c2',
            title: 'Database optimization',
            titleAr: 'تحسين قاعدة البيانات',
            completed: false,
          },
          { id: 'c3', title: 'CDN setup', titleAr: 'إعداد CDN', completed: false },
        ],
        progress: 0,
      },
      {
        id: 'scale-2',
        phase: LaunchPhase.SCALE,
        title: 'Expand Team',
        titleAr: 'توسيع الفريق',
        description: 'Hire more team members',
        descriptionAr: 'توظيف المزيد من أعضاء الفريق',
        status: TaskStatus.NOT_STARTED,
        priority: 'high',
        dependencies: [],
        checklist: [
          { id: 'c1', title: 'Hiring plan', titleAr: 'خطة التوظيف', completed: false },
          { id: 'c2', title: 'Recruitment', titleAr: 'التوظيف', completed: false },
          { id: 'c3', title: 'Onboarding', titleAr: 'الإدماج', completed: false },
        ],
        progress: 0,
      },
      {
        id: 'scale-3',
        phase: LaunchPhase.SCALE,
        title: 'Automate Processes',
        titleAr: 'أتمتة العمليات',
        description: 'Implement automation',
        descriptionAr: 'تطبيق الأتمتة',
        status: TaskStatus.NOT_STARTED,
        priority: 'medium',
        dependencies: [],
        checklist: [
          { id: 'c1', title: 'Order processing', titleAr: 'معالجة الطلبات', completed: false },
          { id: 'c2', title: 'Customer support', titleAr: 'دعم العملاء', completed: false },
          { id: 'c3', title: 'Reporting', titleAr: 'التقارير', completed: false },
        ],
        progress: 0,
      },
    ];
  }

  /**
   * الحصول على مدة المرحلة (بالأيام)
   */
  private getPhaseDuration(phase: LaunchPhase): number {
    const durations: Record<LaunchPhase, number> = {
      [LaunchPhase.PRE_LAUNCH]: 30,
      [LaunchPhase.SOFT_LAUNCH]: 14,
      [LaunchPhase.PUBLIC_LAUNCH]: 7,
      [LaunchPhase.GROWTH]: 90,
      [LaunchPhase.SCALE]: 180,
    };

    return durations[phase];
  }

  /**
   * الحصول على المؤشرات الحالية
   */
  private getCurrentMetrics(): GrowthMetrics {
    return {
      revenue: {
        current: 1792258,
        target: 2500000,
        growth: 15.3,
        trend: 'up',
      },
      customers: {
        current: 300,
        target: 500,
        growth: 8.2,
        churnRate: 12,
      },
      orders: {
        current: 3000,
        target: 5000,
        growth: 12.5,
        conversionRate: 22,
      },
      team: {
        current: 25,
        target: 35,
        growth: 0,
        productivity: 82,
      },
    };
  }

  /**
   * الحصول على أهداف المرحلة
   */
  private getGoalsForPhase(phase: LaunchPhase): GrowthGoal[] {
    const baseGoals: GrowthGoal[] = [
      {
        id: 'goal-revenue',
        title: 'Revenue Goal',
        titleAr: 'هدف الإيرادات',
        metric: 'revenue',
        current: 1792258,
        target: 2500000,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'on_track',
        progress: 71.7,
        milestones: [
          { id: 'm1', title: '2M EGP', titleAr: '2 مليون ج.م', target: 2000000, achieved: false },
          {
            id: 'm2',
            title: '2.5M EGP',
            titleAr: '2.5 مليون ج.م',
            target: 2500000,
            achieved: false,
          },
        ],
      },
      {
        id: 'goal-customers',
        title: 'Customer Goal',
        titleAr: 'هدف العملاء',
        metric: 'customers',
        current: 300,
        target: 500,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'on_track',
        progress: 60,
        milestones: [
          { id: 'm1', title: '400 Customers', titleAr: '400 عميل', target: 400, achieved: false },
          { id: 'm2', title: '500 Customers', titleAr: '500 عميل', target: 500, achieved: false },
        ],
      },
    ];

    return baseGoals;
  }

  /**
   * تحديد المخاطر
   */
  private identifyRisks(phase: LaunchPhase): Risk[] {
    return [
      {
        id: 'risk-1',
        title: 'Server Capacity',
        titleAr: 'سعة الخادم',
        description: 'Server may not handle increased traffic',
        severity: 'high',
        probability: 30,
        impact: 'System downtime during peak hours',
        mitigation: 'Upgrade server capacity before launch',
        status: 'identified',
      },
      {
        id: 'risk-2',
        title: 'Market Competition',
        titleAr: 'المنافسة في السوق',
        description: 'Strong competition from established players',
        severity: 'medium',
        probability: 70,
        impact: 'Slower customer acquisition',
        mitigation: 'Focus on unique value proposition and customer service',
        status: 'mitigating',
      },
      {
        id: 'risk-3',
        title: 'Team Capacity',
        titleAr: 'طاقة الفريق',
        description: 'Team may be overwhelmed with increased demand',
        severity: 'high',
        probability: 50,
        impact: 'Decreased service quality',
        mitigation: 'Hire additional staff proactively',
        status: 'mitigating',
      },
    ];
  }

  /**
   * الحصول على التوصيات
   */
  private getRecommendations(phase: LaunchPhase): string[] {
    const recommendations: Record<LaunchPhase, string[]> = {
      [LaunchPhase.PRE_LAUNCH]: [
        'أكمل جميع الاختبارات قبل الإطلاق التجريبي',
        'تأكد من تدريب الفريق بالكامل',
        'راجع خطة الطوارئ',
      ],
      [LaunchPhase.SOFT_LAUNCH]: [
        'اختر المستخدمين التجريبيين بعناية',
        'اجمع الملاحظات بشكل منظم',
        'كن مستعداً للتعديلات السريعة',
      ],
      [LaunchPhase.PUBLIC_LAUNCH]: [
        'راقب الأداء عن كثب',
        'كن جاهزاً للتعامل مع الطلب المرتفع',
        'تواصل مع العملاء بانتظام',
      ],
      [LaunchPhase.GROWTH]: [
        'ركز على تحسين معدل التحويل',
        'استثمر في التسويق بشكل استراتيجي',
        'حافظ على جودة الخدمة أثناء النمو',
      ],
      [LaunchPhase.SCALE]: [
        'وسّع البنية التحتية مسبقاً',
        'وظف واحتفظ بأفضل المواهب',
        'أتمت العمليات للكفاءة',
      ],
    };

    return recommendations[phase];
  }

  /**
   * تحديث حالة المهمة
   */
  updateTaskStatus(taskId: string, status: TaskStatus, progress: number): LaunchTask | null {
    // في التطبيق الفعلي، سيتم التحديث في قاعدة البيانات
    return null;
  }

  /**
   * تتبع تقدم الهدف
   */
  async trackGoalProgress(goalId: string): Promise<{
    current: number;
    target: number;
    progress: number;
    daysRemaining: number;
    onTrack: boolean;
  }> {
    // محاكاة بيانات
    const goal = this.getGoalsForPhase(LaunchPhase.GROWTH)[0];

    const daysRemaining = Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const requiredDailyProgress = (goal.target - goal.current) / daysRemaining;
    const actualDailyProgress = 15000; // افتراضي
    const onTrack = actualDailyProgress >= requiredDailyProgress;

    return {
      current: goal.current,
      target: goal.target,
      progress: goal.progress,
      daysRemaining,
      onTrack,
    };
  }
}

/**
 * Router
 */
export const launchRouter = router({
  /**
   * الحصول على خطة الإطلاق
   */
  getPlan: publicProcedure
    .input(
      z.object({
        phase: z.nativeEnum(LaunchPhase).optional(),
      })
    )
    .query(async ({ input }) => {
      const manager = new LaunchManager();
      return manager.createLaunchPlan(input.phase || LaunchPhase.PRE_LAUNCH);
    }),

  /**
   * تحديث حالة المهمة
   */
  updateTask: publicProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.nativeEnum(TaskStatus),
        progress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const manager = new LaunchManager();
      return manager.updateTaskStatus(input.taskId, input.status, input.progress);
    }),

  /**
   * تتبع تقدم الهدف
   */
  trackGoal: publicProcedure
    .input(
      z.object({
        goalId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const manager = new LaunchManager();
      return manager.trackGoalProgress(input.goalId);
    }),

  /**
   * الحصول على توصيات النمو
   */
  getGrowthRecommendations: publicProcedure.query(async () => {
    const engine = createSimulationEngine({ iterations: 100 });
    const results = await engine.run();
    const staffingRec = await recruitmentSystem.getStaffingRecommendations();

    return {
      simulation: results[0]?.predictions,
      staffing: staffingRec,
      marketing: {
        recommended: 'Invest in digital marketing for 15% growth',
        recommendedAr: 'استثمر في التسويق الرقمي لنمو 15%',
        budget: 150000,
      },
      operations: {
        recommended: 'Optimize warehouse processes',
        recommendedAr: 'حسّن عمليات المخزن',
        expectedImprovement: 20,
      },
    };
  }),
});
