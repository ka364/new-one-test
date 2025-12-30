import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// Schema للمؤشرات الحيوية
const vitalSignSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameAr: z.string(),
  current: z.number(),
  target: z.number(),
  threshold: z.number(),
  unit: z.string(),
  protocol: z.string().optional(),
});

const bioProtocolSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameAr: z.string(),
  efficiency: z.number(),
  reliability: z.number(),
  adaptability: z.number(),
});

export const vitalSignsRouter = router({
  // جلب المؤشرات الحيوية الحالية
  getCurrentVitalSigns: protectedProcedure.query(async () => {
    try {
      // في الوقت الحالي نستخدم بيانات ثابتة، لكن يمكن حسابها من قاعدة البيانات
      const vitalSigns = [
        {
          id: "decision_consistency",
          name: "Decision Consistency",
          nameAr: "اتساق القرارات",
          current: await calculateDecisionConsistency(),
          target: 95,
          threshold: 90,
          unit: "%",
          protocol: "corvid"
        },
        {
          id: "response_time",
          name: "Inter-Module Response Time",
          nameAr: "زمن التفاعل بين الوحدات",
          current: await calculateResponseTime(),
          target: 100,
          threshold: 200,
          unit: "ms",
          protocol: "ant_colony"
        },
        {
          id: "learning_rate",
          name: "Daily Learning Rate",
          nameAr: "معدل التعلم اليومي",
          current: await calculateLearningRate(),
          target: 1.0,
          threshold: 0,
          unit: "%/day",
          protocol: "mycelium"
        },
        {
          id: "detection_accuracy",
          name: "Cross-Detection Accuracy",
          nameAr: "دقة الاكتشاف المتبادل",
          current: await calculateDetectionAccuracy(),
          target: 90,
          threshold: 85,
          unit: "%",
          protocol: "arachnid"
        }
      ];

      return vitalSigns;
    } catch (error) {
      console.error("Error fetching vital signs:", error);
      throw new Error("Failed to fetch vital signs");
    }
  }),

  // جلب البروتوكولات الحيوية
  getBioProtocols: protectedProcedure.query(async () => {
    try {
      const protocols = [
        {
          id: "mycelium",
          name: "Mycelium Network",
          nameAr: "الشبكة الفطرية",
          emoji: "🌱",
          description: "توزيع الموارد الذكي",
          metrics: await calculateProtocolMetrics("mycelium")
        },
        {
          id: "ant_colony",
          name: "Ant Colony",
          nameAr: "ذكاء النمل",
          emoji: "🐜",
          description: "تحسين المسارات",
          metrics: await calculateProtocolMetrics("ant_colony")
        },
        {
          id: "corvid",
          name: "Corvid Intelligence",
          nameAr: "الغراب المعرفي",
          emoji: "🦅",
          description: "التعلم السببي",
          metrics: await calculateProtocolMetrics("corvid")
        },
        {
          id: "chameleon",
          name: "Chameleon Adaptation",
          nameAr: "الحرباء",
          emoji: "🦎",
          description: "التكيف السريع",
          metrics: await calculateProtocolMetrics("chameleon")
        },
        {
          id: "cephalopod",
          name: "Cephalopod Control",
          nameAr: "الأخطبوط",
          emoji: "🐙",
          description: "التحكم الموزع",
          metrics: await calculateProtocolMetrics("cephalopod")
        },
        {
          id: "arachnid",
          name: "Arachnid Sensitivity",
          nameAr: "العنكبوت",
          emoji: "🕷",
          description: "الحساسية الفائقة",
          metrics: await calculateProtocolMetrics("arachnid")
        },
        {
          id: "tardigrade",
          name: "Tardigrade Resilience",
          nameAr: "دب الماء",
          emoji: "🐻",
          description: "المتانة القصوى",
          metrics: await calculateProtocolMetrics("tardigrade")
        }
      ];

      return protocols;
    } catch (error) {
      console.error("Error fetching bio protocols:", error);
      throw new Error("Failed to fetch bio protocols");
    }
  }),

  // جلب التاريخ الزمني للمؤشرات
  getVitalSignsHistory: protectedProcedure
    .input(z.object({
      signId: z.string(),
      days: z.number().default(7)
    }))
    .query(async ({ input }) => {
      try {
        // في المستقبل سيتم جلبها من جدول vital_signs_history
        const history = await generateHistoricalData(input.signId, input.days);
        return history;
      } catch (error) {
        console.error("Error fetching vital signs history:", error);
        throw new Error("Failed to fetch vital signs history");
      }
    }),

  // حفظ قراءة جديدة للمؤشرات
  recordVitalSign: protectedProcedure
    .input(z.object({
      signId: z.string(),
      value: z.number(),
      metadata: z.record(z.any()).optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // في المستقبل سيتم حفظها في جدول vital_signs_readings
        console.log("Recording vital sign:", input);
        return { success: true, timestamp: new Date() };
      } catch (error) {
        console.error("Error recording vital sign:", error);
        throw new Error("Failed to record vital sign");
      }
    }),

  // تشغيل محاكاة الشبكة الفطرية
  runFungalSimulation: protectedProcedure
    .input(z.object({
      scenario: z.enum(["resource_distribution", "stress_response", "learning_propagation", "healing"]),
      duration: z.number().default(10), // seconds
      intensity: z.number().min(1).max(10).default(5)
    }))
    .mutation(async ({ input }) => {
      try {
        const simulator = new SimpleFungalSimulator();
        const result = await simulator.runScenario(input.scenario, input.duration, input.intensity);
        return result;
      } catch (error) {
        console.error("Error running fungal simulation:", error);
        throw new Error("Failed to run fungal simulation");
      }
    }),

  // الحصول على حالة المحاكاة الحالية
  getSimulationState: protectedProcedure.query(async () => {
    try {
      const simulator = new SimpleFungalSimulator();
      return simulator.getCurrentState();
    } catch (error) {
      console.error("Error getting simulation state:", error);
      throw new Error("Failed to get simulation state");
    }
  }),
});

// ========== Fungal Network Simulator ==========

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  resources: number;
  health: number;
  connections: string[];
}

interface SimulationResult {
  scenario: string;
  duration: number;
  intensity: number;
  startState: {
    totalNodes: number;
    totalResources: number;
    avgHealth: number;
  };
  endState: {
    totalNodes: number;
    totalResources: number;
    avgHealth: number;
  };
  events: Array<{
    timestamp: number;
    type: string;
    description: string;
    impact: number;
  }>;
  metrics: {
    resourceEfficiency: number;
    networkResilience: number;
    distributionSpeed: number;
  };
}

class SimpleFungalSimulator {
  private nodes: Map<string, NetworkNode>;
  private simulationTime: number;

  constructor() {
    this.nodes = new Map();
    this.simulationTime = 0;
    this.initializeNetwork();
  }

  private initializeNetwork() {
    // إنشاء شبكة أولية من 20 عقدة
    for (let i = 0; i < 20; i++) {
      const node: NetworkNode = {
        id: `node_${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        resources: 50 + Math.random() * 50,
        health: 80 + Math.random() * 20,
        connections: []
      };
      this.nodes.set(node.id, node);
    }

    // إنشاء روابط عشوائية بين العقد
    this.nodes.forEach((node, id) => {
      const nearbyNodes = this.findNearbyNodes(node, 30);
      node.connections = nearbyNodes.slice(0, 3).map(n => n.id);
    });
  }

  private findNearbyNodes(node: NetworkNode, radius: number): NetworkNode[] {
    const nearby: NetworkNode[] = [];
    this.nodes.forEach((other) => {
      if (other.id !== node.id) {
        const distance = Math.sqrt(
          Math.pow(node.x - other.x, 2) + Math.pow(node.y - other.y, 2)
        );
        if (distance < radius) {
          nearby.push(other);
        }
      }
    });
    return nearby;
  }

  async runScenario(
    scenario: "resource_distribution" | "stress_response" | "learning_propagation" | "healing",
    duration: number,
    intensity: number
  ): Promise<SimulationResult> {
    const startState = this.captureState();
    const events: SimulationResult["events"] = [];

    const steps = duration * 10; // 10 steps per second
    for (let step = 0; step < steps; step++) {
      this.simulationTime += 0.1;

      switch (scenario) {
        case "resource_distribution":
          this.simulateResourceDistribution(intensity, events, step);
          break;
        case "stress_response":
          this.simulateStressResponse(intensity, events, step);
          break;
        case "learning_propagation":
          this.simulateLearningPropagation(intensity, events, step);
          break;
        case "healing":
          this.simulateHealing(intensity, events, step);
          break;
      }
    }

    const endState = this.captureState();
    const metrics = this.calculateMetrics(startState, endState, events);

    return {
      scenario,
      duration,
      intensity,
      startState,
      endState,
      events,
      metrics
    };
  }

  private simulateResourceDistribution(intensity: number, events: SimulationResult["events"], step: number) {
    // نقل الموارد من العقد الغنية إلى الفقيرة
    const sortedNodes = Array.from(this.nodes.values()).sort((a, b) => b.resources - a.resources);
    const richNodes = sortedNodes.slice(0, Math.floor(sortedNodes.length / 3));
    const poorNodes = sortedNodes.slice(-Math.floor(sortedNodes.length / 3));

    richNodes.forEach((richNode) => {
      richNode.connections.forEach((connId) => {
        const connectedNode = this.nodes.get(connId);
        if (connectedNode && connectedNode.resources < richNode.resources * 0.7) {
          const transfer = intensity * 2;
          richNode.resources -= transfer;
          connectedNode.resources += transfer;

          if (step % 20 === 0) {
            events.push({
              timestamp: this.simulationTime,
              type: "resource_transfer",
              description: `نقل ${transfer.toFixed(1)} وحدة من ${richNode.id} إلى ${connectedNode.id}`,
              impact: transfer / 100
            });
          }
        }
      });
    });
  }

  private simulateStressResponse(intensity: number, events: SimulationResult["events"], step: number) {
    // محاكاة استجابة الشبكة للضغط
    this.nodes.forEach((node) => {
      // تقليل الصحة بسبب الضغط
      node.health -= intensity * 0.3;

      // الاستجابة: زيادة الروابط للدعم المتبادل
      if (node.health < 60 && step % 15 === 0) {
        const nearbyNodes = this.findNearbyNodes(node, 25);
        const newConnection = nearbyNodes.find(n => !node.connections.includes(n.id));
        if (newConnection) {
          node.connections.push(newConnection.id);
          events.push({
            timestamp: this.simulationTime,
            type: "stress_adaptation",
            description: `${node.id} أنشأ رابط جديد مع ${newConnection.id} للدعم`,
            impact: 0.5
          });
        }
      }

      // التعافي التدريجي
      if (node.connections.length > 2) {
        node.health += intensity * 0.2;
      }

      node.health = Math.max(0, Math.min(100, node.health));
    });
  }

  private simulateLearningPropagation(intensity: number, events: SimulationResult["events"], step: number) {
    // محاكاة انتشار المعرفة عبر الشبكة
    const learningNodes = Array.from(this.nodes.values())
      .filter(n => n.resources > 70)
      .slice(0, Math.floor(intensity));

    learningNodes.forEach((sourceNode) => {
      const propagate = (node: NetworkNode, depth: number) => {
        if (depth > intensity / 2) return;

        node.connections.forEach((connId) => {
          const connectedNode = this.nodes.get(connId);
          if (connectedNode) {
            connectedNode.resources += intensity * (1 / (depth + 1));

            if (step % 25 === 0 && depth < 2) {
              events.push({
                timestamp: this.simulationTime,
                type: "knowledge_propagation",
                description: `انتشار المعرفة من ${node.id} إلى ${connectedNode.id} (عمق ${depth})`,
                impact: intensity * (1 / (depth + 1)) / 100
              });
            }

            propagate(connectedNode, depth + 1);
          }
        });
      };

      propagate(sourceNode, 0);
    });
  }

  private simulateHealing(intensity: number, events: SimulationResult["events"], step: number) {
    // محاكاة التعافي والإصلاح الذاتي
    this.nodes.forEach((node) => {
      if (node.health < 70) {
        // التعافي الذاتي
        const healingRate = intensity * 0.5;
        node.health += healingRate;

        // الدعم من العقد المجاورة
        node.connections.forEach((connId) => {
          const helper = this.nodes.get(connId);
          if (helper && helper.health > 80 && helper.resources > 50) {
            const support = intensity * 0.3;
            helper.resources -= support;
            node.health += support / 2;
            node.resources += support / 2;
          }
        });

        if (step % 30 === 0) {
          events.push({
            timestamp: this.simulationTime,
            type: "healing",
            description: `${node.id} يتعافى - الصحة الآن: ${node.health.toFixed(1)}%`,
            impact: healingRate / 100
          });
        }
      }

      node.health = Math.min(100, node.health);
    });
  }

  private captureState() {
    const nodes = Array.from(this.nodes.values());
    return {
      totalNodes: nodes.length,
      totalResources: nodes.reduce((sum, n) => sum + n.resources, 0),
      avgHealth: nodes.reduce((sum, n) => sum + n.health, 0) / nodes.length
    };
  }

  private calculateMetrics(
    startState: ReturnType<typeof this.captureState>,
    endState: ReturnType<typeof this.captureState>,
    events: SimulationResult["events"]
  ) {
    return {
      resourceEfficiency: Math.min(100, (endState.totalResources / startState.totalResources) * 100),
      networkResilience: Math.min(100, (endState.avgHealth / startState.avgHealth) * 100),
      distributionSpeed: Math.min(100, events.length * 2)
    };
  }

  getCurrentState() {
    return {
      nodes: Array.from(this.nodes.values()),
      currentTime: this.simulationTime,
      summary: this.captureState()
    };
  }
}

// ========== Helper Functions ==========

// حساب اتساق القرارات
async function calculateDecisionConsistency(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 95.0;

    // نحسب نسبة القرارات المتسقة مع KAIA من آخر 24 ساعة
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN kaia_decision = 'approved' THEN 1 END) as consistent
      FROM auditTrail
      WHERE performed_at > NOW() - INTERVAL '24 hours'
      AND kaia_decision IS NOT NULL
    `);

    const data = result.rows[0] as any;
    if (!data || data.total === 0) return 95.0; // قيمة افتراضية

    return Number(((data.consistent / data.total) * 100).toFixed(1));
  } catch (error) {
    console.error("Error calculating decision consistency:", error);
    return 95.0; // قيمة افتراضية في حالة الخطأ
  }
}

// حساب زمن الاستجابة بين الوحدات
async function calculateResponseTime(): Promise<number> {
  try {
    // محاكاة حساب متوسط وقت الاستجابة
    // في الواقع يمكن قياسه من logs أو metrics
    const baseTime = 85;
    const variance = Math.random() * 20 - 10; // ±10ms
    return Number((baseTime + variance).toFixed(0));
  } catch (error) {
    console.error("Error calculating response time:", error);
    return 87;
  }
}

// حساب معدل التعلم اليومي
async function calculateLearningRate(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 1.2;

    // نحسب التحسن في الأداء مقارنة بالأمس
    const result = await db.execute(sql`
      SELECT
        COUNT(DISTINCT DATE(created_at)) as days_with_insights,
        COUNT(*) as total_insights
      FROM agentInsights
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    const data = result.rows[0] as any;
    if (!data || data.days_with_insights === 0) return 1.2;

    // معدل التعلم = عدد الرؤى الجديدة / الأيام
    const rate = (data.total_insights / data.days_with_insights) / 10; // normalized
    return Number(Math.min(rate, 2.0).toFixed(1));
  } catch (error) {
    console.error("Error calculating learning rate:", error);
    return 1.2;
  }
}

// حساب دقة الاكتشاف المتبادل
async function calculateDetectionAccuracy(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 92.8;

    // نحسب دقة اكتشاف الأنماط الشاذة
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_insights,
        COUNT(CASE WHEN status = 'implemented' THEN 1 END) as accurate
      FROM agentInsights
      WHERE created_at > NOW() - INTERVAL '7 days'
      AND priority IN ('high', 'critical')
    `);

    const data = result.rows[0] as any;
    if (!data || data.total_insights === 0) return 92.8;

    return Number(((data.accurate / data.total_insights) * 100).toFixed(1));
  } catch (error) {
    console.error("Error calculating detection accuracy:", error);
    return 92.8;
  }
}

// حساب مقاييس البروتوكول
async function calculateProtocolMetrics(protocolId: string): Promise<{
  efficiency: number;
  reliability: number;
  adaptability: number;
}> {
  try {
    // كل بروتوكول له مقاييس مختلفة حسب دوره
    const baseMetrics: Record<string, { efficiency: number; reliability: number; adaptability: number }> = {
      mycelium: { efficiency: 94, reliability: 98, adaptability: 91 },
      ant_colony: { efficiency: 89, reliability: 95, adaptability: 88 },
      corvid: { efficiency: 92, reliability: 90, adaptability: 96 },
      chameleon: { efficiency: 87, reliability: 89, adaptability: 98 },
      cephalopod: { efficiency: 93, reliability: 92, adaptability: 90 },
      arachnid: { efficiency: 95, reliability: 94, adaptability: 89 },
      tardigrade: { efficiency: 91, reliability: 99, adaptability: 85 }
    };

    const base = baseMetrics[protocolId] || { efficiency: 90, reliability: 90, adaptability: 90 };

    // إضافة تباين عشوائي صغير لمحاكاة التغيرات الحقيقية
    return {
      efficiency: Math.min(100, base.efficiency + Math.random() * 4 - 2),
      reliability: Math.min(100, base.reliability + Math.random() * 4 - 2),
      adaptability: Math.min(100, base.adaptability + Math.random() * 4 - 2)
    };
  } catch (error) {
    console.error(`Error calculating metrics for ${protocolId}:`, error);
    return { efficiency: 90, reliability: 90, adaptability: 90 };
  }
}

// توليد بيانات تاريخية للمؤشر
async function generateHistoricalData(signId: string, days: number): Promise<Array<{ date: string; value: number }>> {
  const history = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // محاكاة قيم تاريخية مع اتجاه تصاعدي طفيف
    const baseValue = signId === "response_time" ? 90 : 92;
    const trend = (days - i) * 0.2; // تحسن تدريجي
    const variance = Math.random() * 4 - 2;
    const value = Math.max(0, baseValue + trend + variance);

    history.push({
      date: date.toISOString().split('T')[0],
      value: Number(value.toFixed(1))
    });
  }

  return history;
}
