/**
 * سيناريوهات المحاكاة - Simulation Scenarios
 * 8 سيناريوهات جاهزة للاستخدام
 */

export interface Scenario {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  assumptions: ScenarioAssumptions;
  expectedOutcome: ExpectedOutcome;
  riskLevel: 'low' | 'medium' | 'high';
  probability: number; // 0-1
}

export interface ScenarioAssumptions {
  marketGrowth: number; // %
  competitionLevel: 'low' | 'medium' | 'high';
  customerAcquisitionCost: number; // ج.م
  conversionRate: number; // %
  averageOrderValue: number; // ج.م
  churnRate: number; // %
  operatingMargin: number; // %
}

export interface ExpectedOutcome {
  revenueGrowth: number; // %
  customerGrowth: number; // %
  marketShare: number; // %
  profitability: number; // %
}

/**
 * السيناريوهات الثمانية
 */
export const SIMULATION_SCENARIOS: Scenario[] = [
  // 1. السيناريو المحافظ
  {
    id: 'conservative',
    name: 'Conservative Growth',
    nameAr: 'نمو محافظ',
    description: 'Steady, low-risk growth with proven strategies',
    descriptionAr: 'نمو ثابت منخفض المخاطر مع استراتيجيات مجربة',
    assumptions: {
      marketGrowth: 5,
      competitionLevel: 'high',
      customerAcquisitionCost: 150,
      conversionRate: 2.5,
      averageOrderValue: 500,
      churnRate: 15,
      operatingMargin: 25,
    },
    expectedOutcome: {
      revenueGrowth: 5,
      customerGrowth: 8,
      marketShare: 5,
      profitability: 20,
    },
    riskLevel: 'low',
    probability: 0.85,
  },

  // 2. السيناريو المعتدل
  {
    id: 'moderate',
    name: 'Moderate Growth',
    nameAr: 'نمو معتدل',
    description: 'Balanced growth with moderate investment and risk',
    descriptionAr: 'نمو متوازن مع استثمار ومخاطر معتدلة',
    assumptions: {
      marketGrowth: 15,
      competitionLevel: 'medium',
      customerAcquisitionCost: 120,
      conversionRate: 3.5,
      averageOrderValue: 600,
      churnRate: 12,
      operatingMargin: 30,
    },
    expectedOutcome: {
      revenueGrowth: 15,
      customerGrowth: 20,
      marketShare: 10,
      profitability: 25,
    },
    riskLevel: 'medium',
    probability: 0.70,
  },

  // 3. السيناريو القوي
  {
    id: 'aggressive',
    name: 'Aggressive Growth',
    nameAr: 'نمو قوي',
    description: 'High growth through aggressive marketing and expansion',
    descriptionAr: 'نمو مرتفع من خلال تسويق قوي وتوسع',
    assumptions: {
      marketGrowth: 30,
      competitionLevel: 'medium',
      customerAcquisitionCost: 100,
      conversionRate: 5.0,
      averageOrderValue: 700,
      churnRate: 10,
      operatingMargin: 35,
    },
    expectedOutcome: {
      revenueGrowth: 30,
      customerGrowth: 40,
      marketShare: 15,
      profitability: 28,
    },
    riskLevel: 'medium',
    probability: 0.50,
  },

  // 4. السيناريو الأسي
  {
    id: 'exponential',
    name: 'Exponential Growth',
    nameAr: 'نمو أسي',
    description: 'Viral growth through network effects and innovation',
    descriptionAr: 'نمو فيروسي من خلال تأثيرات الشبكة والابتكار',
    assumptions: {
      marketGrowth: 50,
      competitionLevel: 'low',
      customerAcquisitionCost: 80,
      conversionRate: 7.0,
      averageOrderValue: 800,
      churnRate: 8,
      operatingMargin: 40,
    },
    expectedOutcome: {
      revenueGrowth: 50,
      customerGrowth: 60,
      marketShare: 20,
      profitability: 32,
    },
    riskLevel: 'high',
    probability: 0.30,
  },

  // 5. أفضل سيناريو
  {
    id: 'best_case',
    name: 'Best Case Scenario',
    nameAr: 'أفضل سيناريو',
    description: 'Optimal conditions with all factors aligned',
    descriptionAr: 'ظروف مثالية مع توافق جميع العوامل',
    assumptions: {
      marketGrowth: 75,
      competitionLevel: 'low',
      customerAcquisitionCost: 60,
      conversionRate: 10.0,
      averageOrderValue: 1000,
      churnRate: 5,
      operatingMargin: 45,
    },
    expectedOutcome: {
      revenueGrowth: 75,
      customerGrowth: 80,
      marketShare: 25,
      profitability: 38,
    },
    riskLevel: 'high',
    probability: 0.15,
  },

  // 6. أسوأ سيناريو
  {
    id: 'worst_case',
    name: 'Worst Case Scenario',
    nameAr: 'أسوأ سيناريو',
    description: 'Challenging conditions with multiple headwinds',
    descriptionAr: 'ظروف صعبة مع عوائق متعددة',
    assumptions: {
      marketGrowth: -15,
      competitionLevel: 'high',
      customerAcquisitionCost: 200,
      conversionRate: 1.5,
      averageOrderValue: 400,
      churnRate: 25,
      operatingMargin: 15,
    },
    expectedOutcome: {
      revenueGrowth: -15,
      customerGrowth: -10,
      marketShare: 3,
      profitability: 10,
    },
    riskLevel: 'low',
    probability: 0.10,
  },

  // 7. الخط الأساسي
  {
    id: 'baseline',
    name: 'Baseline',
    nameAr: 'الخط الأساسي',
    description: 'Current trajectory with no major changes',
    descriptionAr: 'المسار الحالي بدون تغييرات كبيرة',
    assumptions: {
      marketGrowth: 0,
      competitionLevel: 'medium',
      customerAcquisitionCost: 130,
      conversionRate: 3.0,
      averageOrderValue: 550,
      churnRate: 13,
      operatingMargin: 28,
    },
    expectedOutcome: {
      revenueGrowth: 0,
      customerGrowth: 5,
      marketShare: 7,
      profitability: 22,
    },
    riskLevel: 'low',
    probability: 0.90,
  },

  // 8. الموسم المرتفع
  {
    id: 'seasonal_high',
    name: 'Seasonal Peak',
    nameAr: 'موسم الذروة',
    description: 'High season with increased demand (Ramadan, Eid, etc.)',
    descriptionAr: 'موسم الذروة مع طلب متزايد (رمضان، عيد، إلخ)',
    assumptions: {
      marketGrowth: 40,
      competitionLevel: 'high',
      customerAcquisitionCost: 90,
      conversionRate: 6.0,
      averageOrderValue: 750,
      churnRate: 7,
      operatingMargin: 32,
    },
    expectedOutcome: {
      revenueGrowth: 40,
      customerGrowth: 35,
      marketShare: 12,
      profitability: 30,
    },
    riskLevel: 'medium',
    probability: 0.60,
  },
];

/**
 * الحصول على سيناريو بالـ ID
 */
export function getScenarioById(id: string): Scenario | undefined {
  return SIMULATION_SCENARIOS.find(s => s.id === id);
}

/**
 * الحصول على السيناريوهات حسب مستوى المخاطر
 */
export function getScenariosByRisk(riskLevel: 'low' | 'medium' | 'high'): Scenario[] {
  return SIMULATION_SCENARIOS.filter(s => s.riskLevel === riskLevel);
}

/**
 * الحصول على السيناريوهات الأكثر احتمالاً
 */
export function getMostLikelyScenarios(threshold = 0.5): Scenario[] {
  return SIMULATION_SCENARIOS.filter(s => s.probability >= threshold).sort(
    (a, b) => b.probability - a.probability
  );
}

/**
 * مقارنة سيناريوهات
 */
export function compareScenarios(scenarioIds: string[]): any {
  const scenarios = scenarioIds
    .map(id => getScenarioById(id))
    .filter((s): s is Scenario => s !== undefined);

  if (scenarios.length < 2) {
    throw new Error('Need at least 2 scenarios to compare');
  }

  return {
    scenarios: scenarios.map(s => ({
      id: s.id,
      name: s.nameAr,
      risk: s.riskLevel,
      probability: s.probability,
    })),
    comparison: {
      revenueGrowth: scenarios.map(s => ({
        scenario: s.nameAr,
        value: s.expectedOutcome.revenueGrowth,
      })),
      customerGrowth: scenarios.map(s => ({
        scenario: s.nameAr,
        value: s.expectedOutcome.customerGrowth,
      })),
      marketShare: scenarios.map(s => ({
        scenario: s.nameAr,
        value: s.expectedOutcome.marketShare,
      })),
      profitability: scenarios.map(s => ({
        scenario: s.nameAr,
        value: s.expectedOutcome.profitability,
      })),
    },
    recommendation: getBestScenario(scenarios),
  };
}

/**
 * أفضل سيناريو
 */
function getBestScenario(scenarios: Scenario[]): any {
  // حساب النقاط لكل سيناريو
  const scored = scenarios.map(s => {
    const score =
      s.expectedOutcome.revenueGrowth * 0.3 +
      s.expectedOutcome.customerGrowth * 0.2 +
      s.expectedOutcome.marketShare * 0.2 +
      s.expectedOutcome.profitability * 0.15 +
      s.probability * 100 * 0.15;

    return { scenario: s, score };
  });

  // الترتيب حسب النقاط
  scored.sort((a, b) => b.score - a.score);

  return {
    best: scored[0].scenario.nameAr,
    score: scored[0].score.toFixed(2),
    reason: `أعلى مزيج من النمو (${scored[0].scenario.expectedOutcome.revenueGrowth}%) والاحتمالية (${(scored[0].scenario.probability * 100).toFixed(0)}%)`,
  };
}

/**
 * سيناريوهات مخصصة
 */
export function createCustomScenario(params: Partial<Scenario>): Scenario {
  const defaultScenario = SIMULATION_SCENARIOS[6]; // baseline

  return {
    ...defaultScenario,
    ...params,
    id: params.id || `custom_${Date.now()}`,
  };
}

/**
 * تحليل الحساسية للسيناريو
 */
export function scenarioSensitivityAnalysis(scenarioId: string): any {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} not found`);
  }

  // المتغيرات الحساسة
  const variables = [
    { name: 'تكلفة اكتساب العميل', key: 'customerAcquisitionCost', range: 0.2 },
    { name: 'معدل التحويل', key: 'conversionRate', range: 0.3 },
    { name: 'متوسط قيمة الطلب', key: 'averageOrderValue', range: 0.15 },
    { name: 'معدل الفقد', key: 'churnRate', range: 0.25 },
  ];

  return variables.map(v => {
    const baseValue = scenario.assumptions[v.key as keyof ScenarioAssumptions] as number;
    const impact = calculateVariableImpact(v.key, baseValue, v.range, scenario);

    return {
      variable: v.name,
      baseValue,
      sensitivity: impact,
      elasticity: impact.high / baseValue,
    };
  });
}

/**
 * حساب تأثير المتغير
 */
function calculateVariableImpact(key: string, baseValue: number, range: number, scenario: Scenario): any {
  const low = baseValue * (1 - range);
  const high = baseValue * (1 + range);

  // تقدير بسيط للتأثير على الإيرادات
  const impactFactor: Record<string, number> = {
    customerAcquisitionCost: -0.5,
    conversionRate: 1.5,
    averageOrderValue: 1.0,
    churnRate: -0.8,
  };

  const factor = impactFactor[key] || 0;
  const baseRevenue = scenario.expectedOutcome.revenueGrowth;

  return {
    low: baseRevenue + (low - baseValue) * factor * 0.1,
    base: baseRevenue,
    high: baseRevenue + (high - baseValue) * factor * 0.1,
  };
}
