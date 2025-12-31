/**
 * OKR (Objectives & Key Results) System
 * نظام تتبع الأهداف كل 90 يوم
 * 
 * This system tracks company objectives and key results
 * on a 90-day cycle to keep the team focused on progress.
 */

export interface KeyResult {
  id: string;
  title: string;
  titleAr: string;
  currentValue: number;
  targetValue: number;
  unit: string; // e.g., "orders", "EGP", "users", "%"
  startValue: number;
  category: 'revenue' | 'growth' | 'operations' | 'product' | 'team';
  lastUpdated: Date;
}

export interface Objective {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  startDate: Date;
  endDate: Date;
  quarterNumber: number; // e.g., Q1 2025
  year: number;
  keyResults: KeyResult[];
  status: 'active' | 'completed' | 'at_risk' | 'failed';
}

export interface QuarterSummary {
  quarter: number;
  year: number;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;
  progressPercentage: number;
  objectives: Objective[];
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

/**
 * OKR Manager
 */
export class OKRManager {
  private objectives: Map<string, Objective> = new Map();

  /**
   * Get current quarter information
   */
  getCurrentQuarter(): { quarter: number; year: number; startDate: Date; endDate: Date } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    
    const quarter = Math.floor(month / 3) + 1;
    
    // Calculate quarter start and end dates
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
    
    return { quarter, year, startDate, endDate };
  }

  /**
   * Initialize with default objectives for current quarter
   */
  initializeCurrentQuarter(): Objective[] {
    const { quarter, year, startDate, endDate } = this.getCurrentQuarter();
    
    // Default objectives for a new quarter
    const defaultObjectives: Objective[] = [
      {
        id: `obj_${quarter}_${year}_revenue`,
        title: 'Revenue Growth',
        titleAr: 'نمو الإيرادات',
        description: 'Achieve sustainable revenue growth through all channels',
        descriptionAr: 'تحقيق نمو مستدام في الإيرادات من خلال جميع القنوات',
        startDate,
        endDate,
        quarterNumber: quarter,
        year,
        status: 'active',
        keyResults: [
          {
            id: 'kr_revenue_total',
            title: 'Total Revenue',
            titleAr: 'إجمالي الإيرادات',
            currentValue: 0,
            targetValue: 1000000, // 1M EGP
            unit: 'EGP',
            startValue: 0,
            category: 'revenue',
            lastUpdated: new Date(),
          },
          {
            id: 'kr_orders_count',
            title: 'Total Orders',
            titleAr: 'إجمالي الطلبات',
            currentValue: 0,
            targetValue: 5000,
            unit: 'orders',
            startValue: 0,
            category: 'growth',
            lastUpdated: new Date(),
          },
        ],
      },
      {
        id: `obj_${quarter}_${year}_customers`,
        title: 'Customer Acquisition & Retention',
        titleAr: 'اكتساب العملاء والاحتفاظ بهم',
        description: 'Grow our customer base and improve retention',
        descriptionAr: 'توسيع قاعدة العملاء وتحسين معدل الاحتفاظ',
        startDate,
        endDate,
        quarterNumber: quarter,
        year,
        status: 'active',
        keyResults: [
          {
            id: 'kr_new_customers',
            title: 'New Customers',
            titleAr: 'عملاء جدد',
            currentValue: 0,
            targetValue: 2000,
            unit: 'customers',
            startValue: 0,
            category: 'growth',
            lastUpdated: new Date(),
          },
          {
            id: 'kr_retention_rate',
            title: 'Retention Rate',
            titleAr: 'معدل الاحتفاظ',
            currentValue: 0,
            targetValue: 85,
            unit: '%',
            startValue: 0,
            category: 'growth',
            lastUpdated: new Date(),
          },
        ],
      },
      {
        id: `obj_${quarter}_${year}_operations`,
        title: 'Operational Excellence',
        titleAr: 'التميز التشغيلي',
        description: 'Improve efficiency and reduce costs',
        descriptionAr: 'تحسين الكفاءة وخفض التكاليف',
        startDate,
        endDate,
        quarterNumber: quarter,
        year,
        status: 'active',
        keyResults: [
          {
            id: 'kr_fulfillment_time',
            title: 'Average Fulfillment Time',
            titleAr: 'متوسط وقت التنفيذ',
            currentValue: 72, // hours
            targetValue: 24,
            unit: 'hours',
            startValue: 72,
            category: 'operations',
            lastUpdated: new Date(),
          },
          {
            id: 'kr_cost_per_order',
            title: 'Cost Per Order',
            titleAr: 'تكلفة الطلب الواحد',
            currentValue: 50,
            targetValue: 35,
            unit: 'EGP',
            startValue: 50,
            category: 'operations',
            lastUpdated: new Date(),
          },
        ],
      },
    ];

    // Store in memory
    defaultObjectives.forEach(obj => this.objectives.set(obj.id, obj));
    
    return defaultObjectives;
  }

  /**
   * Get current quarter summary
   */
  getQuarterSummary(): QuarterSummary {
    const { quarter, year, startDate, endDate } = this.getCurrentQuarter();
    const now = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const progressPercentage = Math.min(100, (daysElapsed / totalDays) * 100);

    // Get all objectives for this quarter
    const objectives = Array.from(this.objectives.values()).filter(
      obj => obj.quarterNumber === quarter && obj.year === year
    );

    // If no objectives exist, initialize them
    if (objectives.length === 0) {
      return {
        quarter,
        year,
        startDate,
        endDate,
        daysRemaining,
        daysElapsed,
        totalDays,
        progressPercentage,
        objectives: this.initializeCurrentQuarter(),
        overallHealth: 'good',
      };
    }

    // Calculate overall health
    const overallHealth = this.calculateOverallHealth(objectives, progressPercentage);

    return {
      quarter,
      year,
      startDate,
      endDate,
      daysRemaining,
      daysElapsed,
      totalDays,
      progressPercentage,
      objectives,
      overallHealth,
    };
  }

  /**
   * Calculate overall health of objectives
   */
  private calculateOverallHealth(
    objectives: Objective[],
    timeProgress: number
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    let totalProgress = 0;
    let totalWeight = 0;

    for (const obj of objectives) {
      for (const kr of obj.keyResults) {
        const range = kr.targetValue - kr.startValue;
        const progress = range !== 0 ? ((kr.currentValue - kr.startValue) / range) * 100 : 0;
        totalProgress += Math.max(0, Math.min(100, progress));
        totalWeight += 1;
      }
    }

    const avgProgress = totalWeight > 0 ? totalProgress / totalWeight : 0;
    const expectedProgress = timeProgress;
    const delta = avgProgress - expectedProgress;

    if (delta >= 10) return 'excellent'; // Ahead of schedule
    if (delta >= -5) return 'good'; // On track
    if (delta >= -15) return 'warning'; // Slightly behind
    return 'critical'; // Significantly behind
  }

  /**
   * Update a key result value
   */
  updateKeyResult(objectiveId: string, keyResultId: string, newValue: number): void {
    const objective = this.objectives.get(objectiveId);
    if (!objective) {
      throw new Error(`Objective ${objectiveId} not found`);
    }

    const keyResult = objective.keyResults.find(kr => kr.id === keyResultId);
    if (!keyResult) {
      throw new Error(`Key Result ${keyResultId} not found`);
    }

    keyResult.currentValue = newValue;
    keyResult.lastUpdated = new Date();

    // Update objective status
    this.updateObjectiveStatus(objective);
  }

  /**
   * Update objective status based on key results
   */
  private updateObjectiveStatus(objective: Objective): void {
    const now = new Date();
    
    if (now > objective.endDate) {
      // Quarter ended - check if completed
      const allCompleted = objective.keyResults.every(kr => kr.currentValue >= kr.targetValue);
      objective.status = allCompleted ? 'completed' : 'failed';
      return;
    }

    // Calculate progress
    const { progressPercentage } = this.getQuarterSummary();
    let totalProgress = 0;
    
    for (const kr of objective.keyResults) {
      const range = kr.targetValue - kr.startValue;
      const progress = range !== 0 ? ((kr.currentValue - kr.startValue) / range) * 100 : 0;
      totalProgress += Math.max(0, Math.min(100, progress));
    }
    
    const avgProgress = objective.keyResults.length > 0 ? totalProgress / objective.keyResults.length : 0;
    
    // If we're significantly behind schedule, mark as at risk
    if (avgProgress < progressPercentage - 20) {
      objective.status = 'at_risk';
    } else {
      objective.status = 'active';
    }
  }

  /**
   * Get all objectives
   */
  getAllObjectives(): Objective[] {
    return Array.from(this.objectives.values());
  }

  /**
   * Get objective by ID
   */
  getObjective(id: string): Objective | undefined {
    return this.objectives.get(id);
  }
}

// Singleton instance
let okrManager: OKRManager | null = null;

/**
 * Get the OKR manager instance
 */
export function getOKRManager(): OKRManager {
  if (!okrManager) {
    okrManager = new OKRManager();
  }
  return okrManager;
}
