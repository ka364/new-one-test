/**
 * نظام التوظيف المتقدم - Advanced Recruitment System
 * يشمل: تحليل السير الذاتية، مطابقة المهارات، جدولة المقابلات، التوظيف الآلي
 */

import { getDb } from '../db';
import type { SQL } from 'drizzle-orm';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

/**
 * أنواع الوظائف المتاحة
 */
export enum JobRole {
  SALES = 'sales',
  CUSTOMER_SERVICE = 'customer_service',
  WAREHOUSE = 'warehouse',
  DELIVERY = 'delivery',
  MANAGER = 'manager',
  TECHNICAL = 'technical',
  MARKETING = 'marketing',
  FINANCE = 'finance',
}

/**
 * مستويات الخبرة
 */
export enum ExperienceLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  EXPERT = 'expert',
}

/**
 * حالة التوظيف
 */
export enum RecruitmentStatus {
  CV_RECEIVED = 'cv_received',
  CV_REVIEWED = 'cv_reviewed',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_COMPLETED = 'interview_completed',
  OFFER_SENT = 'offer_sent',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_REJECTED = 'offer_rejected',
  ONBOARDING = 'onboarding',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

/**
 * بيانات المرشح
 */
export interface Candidate {
  id?: number;
  name: string;
  email: string;
  phone: string;
  role: JobRole;
  experienceLevel: ExperienceLevel;
  skills: string[];
  education: string;
  cvText?: string;
  matchScore?: number;
  status: RecruitmentStatus;
  appliedAt: Date;
  interviewDate?: Date;
  notes?: string;
}

/**
 * متطلبات الوظيفة
 */
export interface JobRequirements {
  role: JobRole;
  experienceLevel: ExperienceLevel;
  requiredSkills: string[];
  preferredSkills: string[];
  minEducation: string;
  minYearsExperience: number;
  salaryRange: {
    min: number;
    max: number;
  };
}

/**
 * نتيجة المطابقة
 */
export interface MatchResult {
  candidate: Candidate;
  score: number;
  breakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
  };
  recommendation: 'strong' | 'moderate' | 'weak' | 'reject';
  reasoning: string;
}

/**
 * محلل السير الذاتية - CV Parser
 */
export class CVParser {
  /**
   * استخراج المهارات من النص
   */
  extractSkills(cvText: string): string[] {
    const skillKeywords = [
      // مهارات المبيعات
      'sales', 'مبيعات', 'بيع', 'customer relations', 'علاقات عملاء',
      'negotiation', 'تفاوض', 'closing', 'إغلاق صفقات',

      // مهارات خدمة العملاء
      'customer service', 'خدمة عملاء', 'support', 'دعم',
      'communication', 'تواصل', 'problem solving', 'حل مشكلات',

      // مهارات المخازن
      'warehouse', 'مخازن', 'inventory', 'مخزون',
      'logistics', 'لوجستيات', 'stock management', 'إدارة مخزون',

      // مهارات التوصيل
      'delivery', 'توصيل', 'driving', 'قيادة',
      'route planning', 'تخطيط مسارات', 'logistics', 'لوجستيات',

      // مهارات إدارية
      'management', 'إدارة', 'leadership', 'قيادة',
      'team building', 'بناء فريق', 'planning', 'تخطيط',

      // مهارات تقنية
      'programming', 'برمجة', 'javascript', 'typescript',
      'react', 'node.js', 'database', 'قواعد بيانات',

      // مهارات تسويقية
      'marketing', 'تسويق', 'social media', 'سوشيال ميديا',
      'content creation', 'إنشاء محتوى', 'SEO', 'analytics', 'تحليلات',

      // مهارات مالية
      'finance', 'مالية', 'accounting', 'محاسبة',
      'budgeting', 'ميزانية', 'financial analysis', 'تحليل مالي',
    ];

    const skills: string[] = [];
    const lowerCaseCV = cvText.toLowerCase();

    for (const keyword of skillKeywords) {
      if (lowerCaseCV.includes(keyword.toLowerCase())) {
        skills.push(keyword);
      }
    }

    return [...new Set(skills)]; // إزالة التكرار
  }

  /**
   * استخراج مستوى الخبرة من النص
   */
  extractExperienceLevel(cvText: string): ExperienceLevel {
    const lowerCaseCV = cvText.toLowerCase();

    // البحث عن سنوات الخبرة
    const yearsMatch = lowerCaseCV.match(/(\d+)\s*(year|سنة|عام)/);

    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);

      if (years < 2) return ExperienceLevel.JUNIOR;
      if (years < 5) return ExperienceLevel.MID;
      if (years < 10) return ExperienceLevel.SENIOR;
      return ExperienceLevel.EXPERT;
    }

    // البحث عن كلمات دالة
    if (lowerCaseCV.includes('senior') || lowerCaseCV.includes('كبير')) {
      return ExperienceLevel.SENIOR;
    }
    if (lowerCaseCV.includes('junior') || lowerCaseCV.includes('مبتدئ')) {
      return ExperienceLevel.JUNIOR;
    }
    if (lowerCaseCV.includes('mid') || lowerCaseCV.includes('متوسط')) {
      return ExperienceLevel.MID;
    }

    return ExperienceLevel.JUNIOR; // افتراضي
  }

  /**
   * استخراج التعليم من النص
   */
  extractEducation(cvText: string): string {
    const educationKeywords = [
      { keyword: 'phd', level: 'دكتوراه' },
      { keyword: 'master', level: 'ماجستير' },
      { keyword: 'bachelor', level: 'بكالوريوس' },
      { keyword: 'diploma', level: 'دبلوم' },
      { keyword: 'high school', level: 'ثانوية عامة' },
    ];

    const lowerCaseCV = cvText.toLowerCase();

    for (const { keyword, level } of educationKeywords) {
      if (lowerCaseCV.includes(keyword)) {
        return level;
      }
    }

    return 'غير محدد';
  }

  /**
   * تحليل السيرة الذاتية بالكامل
   */
  parse(cvText: string): Partial<Candidate> {
    return {
      skills: this.extractSkills(cvText),
      experienceLevel: this.extractExperienceLevel(cvText),
      education: this.extractEducation(cvText),
      cvText,
    };
  }
}

/**
 * مطابق المهارات - Skill Matcher
 */
export class SkillMatcher {
  /**
   * حساب نسبة تطابق المهارات
   */
  calculateSkillsMatch(
    candidateSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): number {
    const requiredMatches = requiredSkills.filter(skill =>
      candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
    ).length;

    const preferredMatches = preferredSkills.filter(skill =>
      candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
    ).length;

    const requiredScore = (requiredMatches / requiredSkills.length) * 70;
    const preferredScore = (preferredMatches / Math.max(1, preferredSkills.length)) * 30;

    return requiredScore + preferredScore;
  }

  /**
   * حساب نسبة تطابق الخبرة
   */
  calculateExperienceMatch(
    candidateLevel: ExperienceLevel,
    requiredLevel: ExperienceLevel
  ): number {
    const levels = [
      ExperienceLevel.JUNIOR,
      ExperienceLevel.MID,
      ExperienceLevel.SENIOR,
      ExperienceLevel.EXPERT,
    ];

    const candidateIndex = levels.indexOf(candidateLevel);
    const requiredIndex = levels.indexOf(requiredLevel);

    if (candidateIndex >= requiredIndex) {
      return 100;
    } else {
      const diff = requiredIndex - candidateIndex;
      return Math.max(0, 100 - diff * 25);
    }
  }

  /**
   * حساب نسبة تطابق التعليم
   */
  calculateEducationMatch(
    candidateEducation: string,
    requiredEducation: string
  ): number {
    const educationLevels = [
      'ثانوية عامة',
      'دبلوم',
      'بكالوريوس',
      'ماجستير',
      'دكتوراه',
    ];

    const candidateIndex = educationLevels.findIndex(e =>
      candidateEducation.includes(e)
    );
    const requiredIndex = educationLevels.findIndex(e =>
      requiredEducation.includes(e)
    );

    if (candidateIndex === -1) return 50; // غير محدد
    if (candidateIndex >= requiredIndex) return 100;

    const diff = requiredIndex - candidateIndex;
    return Math.max(0, 100 - diff * 20);
  }

  /**
   * مطابقة المرشح مع الوظيفة
   */
  match(candidate: Candidate, requirements: JobRequirements): MatchResult {
    const skillsMatch = this.calculateSkillsMatch(
      candidate.skills,
      requirements.requiredSkills,
      requirements.preferredSkills
    );

    const experienceMatch = this.calculateExperienceMatch(
      candidate.experienceLevel,
      requirements.experienceLevel
    );

    const educationMatch = this.calculateEducationMatch(
      candidate.education,
      requirements.minEducation
    );

    const score = (skillsMatch * 0.5) + (experienceMatch * 0.3) + (educationMatch * 0.2);

    let recommendation: 'strong' | 'moderate' | 'weak' | 'reject';
    let reasoning: string;

    if (score >= 80) {
      recommendation = 'strong';
      reasoning = 'مرشح ممتاز - يطابق جميع المتطلبات بشكل قوي';
    } else if (score >= 60) {
      recommendation = 'moderate';
      reasoning = 'مرشح جيد - يحتاج مقابلة للتقييم النهائي';
    } else if (score >= 40) {
      recommendation = 'weak';
      reasoning = 'مرشح ضعيف - يحتاج تطوير في بعض المجالات';
    } else {
      recommendation = 'reject';
      reasoning = 'لا يطابق المتطلبات الأساسية';
    }

    return {
      candidate,
      score,
      breakdown: {
        skillsMatch,
        experienceMatch,
        educationMatch,
      },
      recommendation,
      reasoning,
    };
  }

  /**
   * ترتيب المرشحين حسب التطابق
   */
  rankCandidates(
    candidates: Candidate[],
    requirements: JobRequirements
  ): MatchResult[] {
    const results = candidates.map(candidate => this.match(candidate, requirements));
    return results.sort((a, b) => b.score - a.score);
  }
}

/**
 * جدولة المقابلات - Interview Scheduler
 */
export class InterviewScheduler {
  /**
   * إيجاد أقرب موعد متاح
   */
  findNextAvailableSlot(startDate: Date = new Date()): Date {
    const slots = [];
    const current = new Date(startDate);

    // البحث في الأيام الخمسة القادمة
    for (let day = 0; day < 5; day++) {
      const date = new Date(current);
      date.setDate(date.getDate() + day);

      // تجاوز عطلات نهاية الأسبوع
      if (date.getDay() === 5 || date.getDay() === 6) continue;

      // مواعيد من 9 صباحاً إلى 4 مساءً
      for (let hour = 9; hour <= 16; hour++) {
        const slot = new Date(date);
        slot.setHours(hour, 0, 0, 0);
        slots.push(slot);
      }
    }

    // إرجاع أول موعد متاح
    return slots[0] || new Date();
  }

  /**
   * جدولة مقابلة للمرشح
   */
  async scheduleInterview(candidateId: number): Promise<Date> {
    const interviewDate = this.findNextAvailableSlot();

    // تحديث السجل في قاعدة البيانات
    // (هنا يمكن إضافة الكود الفعلي للتحديث)

    return interviewDate;
  }

  /**
   * إرسال تذكير بالمقابلة
   */
  async sendInterviewReminder(candidate: Candidate): Promise<void> {
    // هنا يمكن إضافة منطق إرسال البريد الإلكتروني أو الرسالة النصية
    console.log(`تذكير: مقابلة ${candidate.name} في ${candidate.interviewDate}`);
  }
}

/**
 * مدير التوظيف - Onboarding Manager
 */
export class OnboardingManager {
  /**
   * إنشاء خطة التوظيف
   */
  createOnboardingPlan(role: JobRole): OnboardingTask[] {
    const commonTasks: OnboardingTask[] = [
      {
        id: 1,
        title: 'استكمال الأوراق الرسمية',
        description: 'عقد العمل، بطاقة الهوية، شهادات',
        dueDate: 1, // يوم 1
        completed: false,
      },
      {
        id: 2,
        title: 'تسليم معدات العمل',
        description: 'حاسوب، هاتف، بطاقة دخول',
        dueDate: 1,
        completed: false,
      },
      {
        id: 3,
        title: 'جولة في المكتب',
        description: 'التعريف بالأقسام والمرافق',
        dueDate: 1,
        completed: false,
      },
      {
        id: 4,
        title: 'لقاء مع الفريق',
        description: 'التعريف بأعضاء الفريق',
        dueDate: 2,
        completed: false,
      },
      {
        id: 5,
        title: 'تدريب على الأنظمة الداخلية',
        description: 'HaderOS، البريد الإلكتروني، الأدوات',
        dueDate: 3,
        completed: false,
      },
    ];

    const roleTasks = this.getRoleSpecificTasks(role);

    return [...commonTasks, ...roleTasks];
  }

  /**
   * مهام خاصة بالدور الوظيفي
   */
  private getRoleSpecificTasks(role: JobRole): OnboardingTask[] {
    switch (role) {
      case JobRole.SALES:
        return [
          {
            id: 101,
            title: 'تدريب على المنتجات',
            description: 'التعرف على جميع المنتجات والأسعار',
            dueDate: 5,
            completed: false,
          },
          {
            id: 102,
            title: 'تدريب على أساليب البيع',
            description: 'تقنيات البيع والإقناع',
            dueDate: 7,
            completed: false,
          },
        ];

      case JobRole.CUSTOMER_SERVICE:
        return [
          {
            id: 201,
            title: 'تدريب على نظام CRM',
            description: 'كيفية استخدام نظام إدارة العملاء',
            dueDate: 4,
            completed: false,
          },
          {
            id: 202,
            title: 'سيناريوهات خدمة العملاء',
            description: 'التدريب على التعامل مع الشكاوى',
            dueDate: 6,
            completed: false,
          },
        ];

      case JobRole.WAREHOUSE:
        return [
          {
            id: 301,
            title: 'تدريب على نظام المخزون',
            description: 'كيفية إدارة وتتبع المخزون',
            dueDate: 3,
            completed: false,
          },
          {
            id: 302,
            title: 'إجراءات السلامة',
            description: 'قواعد السلامة في المخزن',
            dueDate: 2,
            completed: false,
          },
        ];

      default:
        return [];
    }
  }

  /**
   * تتبع تقدم التوظيف
   */
  trackProgress(tasks: OnboardingTask[]): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = (completed / total) * 100;

    return { completed, total, percentage };
  }
}

/**
 * مهمة التوظيف
 */
export interface OnboardingTask {
  id: number;
  title: string;
  description: string;
  dueDate: number; // يوم من بداية التوظيف
  completed: boolean;
}

/**
 * محرك التوظيف الآلي - Auto Scaler
 * يحلل الطلب على العمالة ويوصي بالتوظيف
 */
export class AutoScaler {
  /**
   * حساب الحاجة للموظفين بناءً على حجم الأعمال
   */
  async calculateStaffingNeeds(): Promise<StaffingRecommendation> {
    const db = await getDb();

    // الحصول على إحصائيات آخر 30 يوم
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // حساب متوسط الطلبات اليومية (محاكاة)
    const avgDailyOrders = 100; // يمكن حسابها من قاعدة البيانات
    const avgOrdersPerEmployee = 10; // معيار الأداء

    // حساب العدد المطلوب
    const recommendedStaff = Math.ceil(avgDailyOrders / avgOrdersPerEmployee);

    // الحصول على العدد الحالي (محاكاة)
    const currentStaff = 8;

    // الفارق
    const gap = recommendedStaff - currentStaff;

    let action: 'hire' | 'maintain' | 'reduce';
    let urgency: 'high' | 'medium' | 'low';

    if (gap > 2) {
      action = 'hire';
      urgency = 'high';
    } else if (gap > 0) {
      action = 'hire';
      urgency = 'medium';
    } else if (gap < -2) {
      action = 'reduce';
      urgency = 'medium';
    } else {
      action = 'maintain';
      urgency = 'low';
    }

    return {
      current: currentStaff,
      recommended: recommendedStaff,
      gap,
      action,
      urgency,
      reasoning: this.generateReasoning(gap, avgDailyOrders),
    };
  }

  /**
   * توليد التوضيح
   */
  private generateReasoning(gap: number, avgDailyOrders: number): string {
    if (gap > 2) {
      return `حجم الطلبات مرتفع (${avgDailyOrders} طلب/يوم). يُنصح بتوظيف ${gap} موظف إضافي فوراً لتجنب التأخير.`;
    } else if (gap > 0) {
      return `حجم الطلبات في ازدياد. يُنصح بتوظيف ${gap} موظف لتحسين الأداء.`;
    } else if (gap < -2) {
      return `حجم الطلبات منخفض. يمكن تقليل العدد بـ ${Math.abs(gap)} موظف.`;
    } else {
      return 'العدد الحالي للموظفين مناسب لحجم الأعمال.';
    }
  }

  /**
   * التوصية بالأدوار المطلوبة
   */
  recommendRoles(): JobRole[] {
    // يمكن تطوير هذه الدالة لتحليل أكثر تفصيلاً
    return [JobRole.SALES, JobRole.CUSTOMER_SERVICE, JobRole.WAREHOUSE];
  }
}

/**
 * توصية التوظيف
 */
export interface StaffingRecommendation {
  current: number;
  recommended: number;
  gap: number;
  action: 'hire' | 'maintain' | 'reduce';
  urgency: 'high' | 'medium' | 'low';
  reasoning: string;
}

/**
 * نظام التوظيف المتكامل
 */
export class RecruitmentSystem {
  private cvParser: CVParser;
  private skillMatcher: SkillMatcher;
  private interviewScheduler: InterviewScheduler;
  private onboardingManager: OnboardingManager;
  private autoScaler: AutoScaler;

  constructor() {
    this.cvParser = new CVParser();
    this.skillMatcher = new SkillMatcher();
    this.interviewScheduler = new InterviewScheduler();
    this.onboardingManager = new OnboardingManager();
    this.autoScaler = new AutoScaler();
  }

  /**
   * معالجة طلب توظيف جديد
   */
  async processApplication(
    candidateData: Omit<Candidate, 'id' | 'status' | 'appliedAt'>,
    requirements: JobRequirements
  ): Promise<MatchResult> {
    // تحليل السيرة الذاتية
    const parsedData = this.cvParser.parse(candidateData.cvText || '');

    // دمج البيانات
    const candidate: Candidate = {
      ...candidateData,
      ...parsedData,
      status: RecruitmentStatus.CV_RECEIVED,
      appliedAt: new Date(),
    };

    // مطابقة مع الوظيفة
    const matchResult = this.skillMatcher.match(candidate, requirements);

    // إذا كان المرشح قوي، جدولة مقابلة تلقائياً
    if (matchResult.recommendation === 'strong') {
      const interviewDate = await this.interviewScheduler.scheduleInterview(
        candidate.id || 0
      );
      candidate.interviewDate = interviewDate;
      candidate.status = RecruitmentStatus.INTERVIEW_SCHEDULED;
    }

    return matchResult;
  }

  /**
   * الحصول على توصيات التوظيف
   */
  async getStaffingRecommendations(): Promise<StaffingRecommendation> {
    return this.autoScaler.calculateStaffingNeeds();
  }

  /**
   * إنشاء خطة توظيف لموظف جديد
   */
  createOnboardingPlan(role: JobRole): OnboardingTask[] {
    return this.onboardingManager.createOnboardingPlan(role);
  }
}

/**
 * تصدير النظام
 */
export const recruitmentSystem = new RecruitmentSystem();
