/**
 * النماذج السلوكية - Behavioral Models
 * نماذج محاكاة لسلوك العملاء والموظفين والسوق
 */

/**
 * نموذج سلوك العميل
 * Customer Behavior Model
 */
export class CustomerModel {
  // خصائص العميل
  private id: string;
  private segment: 'budget' | 'mid-tier' | 'premium';
  private loyalty: number; // 0-1
  private purchaseFrequency: number; // مرات/شهر
  private averageOrderValue: number;
  private churnProbability: number;

  constructor(segment: 'budget' | 'mid-tier' | 'premium') {
    this.id = `customer_${Date.now()}_${Math.random()}`;
    this.segment = segment;
    this.loyalty = this.initializeLoyalty();
    this.purchaseFrequency = this.initializePurchaseFrequency();
    this.averageOrderValue = this.initializeAOV();
    this.churnProbability = this.initializeChurnProbability();
  }

  private initializeLoyalty(): number {
    const baselinesBySegment = {
      budget: 0.4,
      'mid-tier': 0.6,
      premium: 0.8,
    };
    return baselinesBySegment[this.segment] + (Math.random() - 0.5) * 0.2;
  }

  private initializePurchaseFrequency(): number {
    const frequenciesBySegment = {
      budget: 0.5, // مرة كل شهرين
      'mid-tier': 1.0, // مرة شهرياً
      premium: 2.0, // مرتين شهرياً
    };
    return frequenciesBySegment[this.segment] * (0.8 + Math.random() * 0.4);
  }

  private initializeAOV(): number {
    const aovBySegment = {
      budget: 300,
      'mid-tier': 600,
      premium: 1200,
    };
    return aovBySegment[this.segment] * (0.7 + Math.random() * 0.6);
  }

  private initializeChurnProbability(): number {
    const churnBySegment = {
      budget: 0.25,
      'mid-tier': 0.15,
      premium: 0.08,
    };
    return churnBySegment[this.segment];
  }

  /**
   * محاكاة قرار الشراء
   */
  willPurchase(marketConditions: MarketConditions): boolean {
    const baseProbability = (this.loyalty * this.purchaseFrequency) / 2;
    const seasonalFactor = marketConditions.seasonality;
    const competitionFactor = 1 - marketConditions.competitionIntensity * 0.3;
    const priceFactor = 1 - marketConditions.priceIndex * 0.2;

    const purchaseProbability = baseProbability * seasonalFactor * competitionFactor * priceFactor;

    return Math.random() < Math.min(purchaseProbability, 0.95);
  }

  /**
   * حساب قيمة الطلب
   */
  calculateOrderValue(marketConditions: MarketConditions): number {
    const baseValue = this.averageOrderValue;
    const variation = 0.8 + Math.random() * 0.4;
    const seasonalBoost = marketConditions.seasonality > 1.2 ? 1.1 : 1.0;

    return baseValue * variation * seasonalBoost;
  }

  /**
   * محاكاة الولاء
   */
  updateLoyalty(experienceQuality: number): void {
    // experienceQuality: 0-1
    const change = (experienceQuality - 0.7) * 0.1;
    this.loyalty = Math.max(0, Math.min(1, this.loyalty + change));
  }

  /**
   * هل سيغادر العميل؟
   */
  willChurn(): boolean {
    return Math.random() < this.churnProbability * (1 - this.loyalty);
  }

  /**
   * القيمة الدائمة للعميل
   */
  getLifetimeValue(months = 12): number {
    const monthlyValue = this.averageOrderValue * this.purchaseFrequency;
    const retentionRate = 1 - this.churnProbability;
    let ltv = 0;

    for (let i = 0; i < months; i++) {
      ltv += monthlyValue * Math.pow(retentionRate, i);
    }

    return ltv;
  }
}

/**
 * نموذج سلوك الموظف
 * Employee Behavior Model
 */
export class EmployeeModel {
  private id: string;
  private role: 'junior' | 'mid' | 'senior' | 'manager';
  private productivity: number; // 0-1
  private satisfaction: number; // 0-1
  private skillLevel: number; // 0-1
  private burnoutRisk: number; // 0-1

  constructor(role: 'junior' | 'mid' | 'senior' | 'manager') {
    this.id = `employee_${Date.now()}_${Math.random()}`;
    this.role = role;
    this.productivity = this.initializeProductivity();
    this.satisfaction = 0.7 + Math.random() * 0.2;
    this.skillLevel = this.initializeSkillLevel();
    this.burnoutRisk = 0.2 + Math.random() * 0.1;
  }

  private initializeProductivity(): number {
    const baselinesByRole = {
      junior: 0.6,
      mid: 0.8,
      senior: 0.9,
      manager: 0.85,
    };
    return baselinesByRole[this.role] + (Math.random() - 0.5) * 0.1;
  }

  private initializeSkillLevel(): number {
    const skillsByRole = {
      junior: 0.5,
      mid: 0.7,
      senior: 0.9,
      manager: 0.85,
    };
    return skillsByRole[this.role];
  }

  /**
   * الإنتاجية اليومية
   */
  getDailyOutput(workload: number): number {
    const baseOutput = this.productivity * this.skillLevel;
    const motivationFactor = this.satisfaction;
    const fatigueenalty = this.burnoutRisk > 0.7 ? 0.7 : 1.0;

    return baseOutput * motivationFactor * fatiguePenalty * (1 - workload * 0.3);
  }

  /**
   * تحديث الرضا الوظيفي
   */
  updateSatisfaction(factors: {
    salary: number;
    workLifeBalance: number;
    recognition: number;
  }): void {
    const salaryImpact = factors.salary * 0.3;
    const balanceImpact = factors.workLifeBalance * 0.4;
    const recognitionImpact = factors.recognition * 0.3;

    const newSatisfaction = salaryImpact + balanceImpact + recognitionImpact;
    this.satisfaction = 0.7 * this.satisfaction + 0.3 * newSatisfaction;
  }

  /**
   * احتمال المغادرة
   */
  getTurnoverProbability(): number {
    const baseTurnover = 0.15; // 15% سنوياً
    const satisfactionFactor = 1 - this.satisfaction;
    const burnoutFactor = this.burnoutRisk;

    return baseTurnover * (1 + satisfactionFactor + burnoutFactor);
  }

  /**
   * النمو المهني
   */
  developSkills(trainingQuality: number): void {
    const growthRate = trainingQuality * 0.01;
    this.skillLevel = Math.min(1, this.skillLevel + growthRate);
  }
}

/**
 * نموذج السوق
 * Market Model
 */
export class MarketModel {
  private totalAddressableMarket: number; // TAM
  private currentMarketShare: number;
  private growthRate: number;
  private competitionIntensity: number;
  private seasonalityFactors: Map<number, number>; // month -> factor

  constructor() {
    this.totalAddressableMarket = 10000000000; // 10 مليار ج.م
    this.currentMarketShare = 0.001; // 0.1%
    this.growthRate = 0.15; // 15% سنوياً
    this.competitionIntensity = 0.7;
    this.seasonalityFactors = this.initializeSeasonality();
  }

  private initializeSeasonality(): Map<number, number> {
    return new Map([
      [1, 1.1], // يناير
      [2, 1.0],
      [3, 1.2], // رمضان (متغير)
      [4, 1.3], // عيد (متغير)
      [5, 1.0],
      [6, 0.9],
      [7, 0.9],
      [8, 0.9],
      [9, 1.0],
      [10, 1.1],
      [11, 1.2],
      [12, 1.4], // موسم الأعياد
    ]);
  }

  /**
   * الحصول على ظروف السوق
   */
  getMarketConditions(month: number): MarketConditions {
    return {
      size: this.totalAddressableMarket * (1 + this.growthRate / 12) ** month,
      share: this.currentMarketShare,
      seasonality: this.seasonalityFactors.get((month % 12) + 1) || 1.0,
      competitionIntensity: this.competitionIntensity,
      priceIndex: 1.0 + (Math.random() - 0.5) * 0.1,
    };
  }

  /**
   * محاكاة نمو السوق
   */
  simulateGrowth(months: number): MarketGrowthResult[] {
    const results: MarketGrowthResult[] = [];

    for (let month = 0; month < months; month++) {
      const conditions = this.getMarketConditions(month);
      const potentialRevenue = conditions.size * conditions.share * conditions.seasonality;

      results.push({
        month,
        marketSize: conditions.size,
        marketShare: conditions.share,
        revenue: potentialRevenue,
        seasonalityFactor: conditions.seasonality,
      });

      // تحديث الحصة السوقية
      this.currentMarketShare *= 1 + this.growthRate / 12;
    }

    return results;
  }

  /**
   * تأثير المنافسة
   */
  simulateCompetition(newEntrants: number): void {
    this.competitionIntensity = Math.min(1, this.competitionIntensity + newEntrants * 0.05);
    this.currentMarketShare *= 1 - newEntrants * 0.02;
  }
}

/**
 * Interfaces
 */
export interface MarketConditions {
  size: number;
  share: number;
  seasonality: number;
  competitionIntensity: number;
  priceIndex: number;
}

export interface MarketGrowthResult {
  month: number;
  marketSize: number;
  marketShare: number;
  revenue: number;
  seasonalityFactor: number;
}

/**
 * مصنع النماذج
 * Model Factory
 */
export class ModelFactory {
  static createCustomerCohort(size: number): CustomerModel[] {
    const distribution = {
      budget: 0.5,
      'mid-tier': 0.35,
      premium: 0.15,
    };

    const customers: CustomerModel[] = [];

    for (let i = 0; i < size; i++) {
      const rand = Math.random();
      let segment: 'budget' | 'mid-tier' | 'premium';

      if (rand < distribution.budget) {
        segment = 'budget';
      } else if (rand < distribution.budget + distribution['mid-tier']) {
        segment = 'mid-tier';
      } else {
        segment = 'premium';
      }

      customers.push(new CustomerModel(segment));
    }

    return customers;
  }

  static createEmployeePool(size: number): EmployeeModel[] {
    const distribution = {
      junior: 0.4,
      mid: 0.35,
      senior: 0.2,
      manager: 0.05,
    };

    const employees: EmployeeModel[] = [];

    for (let i = 0; i < size; i++) {
      const rand = Math.random();
      let role: 'junior' | 'mid' | 'senior' | 'manager';

      if (rand < distribution.junior) {
        role = 'junior';
      } else if (rand < distribution.junior + distribution.mid) {
        role = 'mid';
      } else if (rand < distribution.junior + distribution.mid + distribution.senior) {
        role = 'senior';
      } else {
        role = 'manager';
      }

      employees.push(new EmployeeModel(role));
    }

    return employees;
  }
}

/**
 * محاكاة متكاملة
 * Integrated Simulation
 */
export async function runIntegratedSimulation(months: number = 12): Promise<any> {
  const market = new MarketModel();
  const customers = ModelFactory.createCustomerCohort(1000);
  const employees = ModelFactory.createEmployeePool(50);

  const results = [];

  for (let month = 0; month < months; month++) {
    const conditions = market.getMarketConditions(month);

    // محاكاة سلوك العملاء
    let monthlyRevenue = 0;
    let monthlyOrders = 0;

    for (const customer of customers) {
      if (customer.willPurchase(conditions)) {
        const orderValue = customer.calculateOrderValue(conditions);
        monthlyRevenue += orderValue;
        monthlyOrders++;

        // تحديث الولاء
        const experienceQuality = 0.7 + Math.random() * 0.2;
        customer.updateLoyalty(experienceQuality);
      }

      // فحص الفقد
      if (customer.willChurn()) {
        // العميل غادر - استبداله بعميل جديد
        const newCustomer = new CustomerModel(Math.random() < 0.5 ? 'budget' : 'mid-tier');
        customers[customers.indexOf(customer)] = newCustomer;
      }
    }

    // محاكاة أداء الموظفين
    const workload = monthlyOrders / employees.length / 30; // طلبات/موظف/يوم
    let totalProductivity = 0;

    for (const employee of employees) {
      totalProductivity += employee.getDailyOutput(workload);

      // تحديث الرضا
      employee.updateSatisfaction({
        salary: 0.7 + Math.random() * 0.2,
        workLifeBalance: workload < 10 ? 0.8 : 0.5,
        recognition: 0.6 + Math.random() * 0.3,
      });
    }

    results.push({
      month,
      revenue: monthlyRevenue,
      orders: monthlyOrders,
      averageOrderValue: monthlyOrders > 0 ? monthlyRevenue / monthlyOrders : 0,
      customers: customers.length,
      employees: employees.length,
      productivity: totalProductivity / employees.length,
      marketConditions: conditions,
    });
  }

  return results;
}
