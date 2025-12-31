/**
 * Agent Interface for Simulation Control
 * واجهة الوكيل للتحكم في المحاكاة
 * 
 * This module provides a high-level interface for AI agents
 * to interact with the parallel simulation environment,
 * run experiments, and analyze outcomes.
 */

import { 
  getSimulationEnvironment, 
  SimulationEnvironmentState,
  SimulationSnapshot,
  Modification 
} from './parallel-environment';

/**
 * Experiment Definition
 */
export interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  environmentId: string;
  steps: ExperimentStep[];
  results?: ExperimentResults;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface ExperimentStep {
  stepNumber: number;
  action: 'modify' | 'simulate' | 'observe' | 'compare';
  parameters: Record<string, any>;
  description: string;
}

export interface ExperimentResults {
  hypothesis_validated: boolean;
  confidence: number; // 0-1
  observations: Observation[];
  recommendations: string[];
  risks: Risk[];
}

export interface Observation {
  timestamp: Date;
  metric: string;
  value: number;
  change: number; // percentage change
  significance: 'low' | 'medium' | 'high';
}

export interface Risk {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  description: string;
  mitigation: string;
}

/**
 * Agent Simulation Interface
 */
export class AgentSimulationInterface {
  private agentId: string;
  private experiments: Map<string, Experiment> = new Map();

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  /**
   * Create a new experiment
   */
  async createExperiment(
    name: string,
    description: string,
    hypothesis: string,
    steps: ExperimentStep[]
  ): Promise<Experiment> {
    const envManager = await getSimulationEnvironment();
    
    // Create a new simulation environment for this experiment
    const env = await envManager.createEnvironment(`Experiment: ${name}`, {
      copyFromProduction: true,
      timeMultiplier: 10, // Run 10x faster
    });

    const experiment: Experiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      hypothesis,
      environmentId: env.id,
      steps,
      status: 'pending',
      createdAt: new Date(),
    };

    this.experiments.set(experiment.id, experiment);
    
    console.log(`🧪 Agent ${this.agentId} created experiment: ${name}`);
    return experiment;
  }

  /**
   * Run an experiment
   */
  async runExperiment(experimentId: string): Promise<ExperimentResults> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.status = 'running';
    console.log(`▶️ Running experiment: ${experiment.name}`);

    const envManager = await getSimulationEnvironment();
    const observations: Observation[] = [];
    const snapshots: SimulationSnapshot[] = [];

    try {
      // Execute each step
      for (const step of experiment.steps) {
        console.log(`  Step ${step.stepNumber}: ${step.description}`);

        switch (step.action) {
          case 'modify':
            await this.executeModifyStep(envManager, experiment.environmentId, step);
            break;
          
          case 'simulate':
            const snapshot = await this.executeSimulateStep(envManager, experiment.environmentId, step);
            snapshots.push(snapshot);
            break;
          
          case 'observe':
            const observation = await this.executeObserveStep(envManager, experiment.environmentId, step);
            observations.push(observation);
            break;
          
          case 'compare':
            if (snapshots.length >= 2) {
              const comparison = await this.executeCompareStep(
                envManager, 
                snapshots[snapshots.length - 2], 
                snapshots[snapshots.length - 1]
              );
              observations.push(...comparison);
            }
            break;
        }
      }

      // Analyze results
      const results = this.analyzeResults(experiment, observations, snapshots);
      experiment.results = results;
      experiment.status = 'completed';
      experiment.completedAt = new Date();

      console.log(`✅ Experiment completed: ${experiment.name}`);
      console.log(`   Hypothesis validated: ${results.hypothesis_validated}`);
      console.log(`   Confidence: ${(results.confidence * 100).toFixed(1)}%`);

      return results;

    } catch (error) {
      experiment.status = 'failed';
      console.error(`❌ Experiment failed: ${experiment.name}`, error);
      throw error;
    }
  }

  /**
   * Execute a modify step
   */
  private async executeModifyStep(
    envManager: any,
    environmentId: string,
    step: ExperimentStep
  ): Promise<void> {
    const modification: Omit<Modification, 'id' | 'timestamp'> = {
      type: step.parameters.modificationType || 'parameter_change',
      description: step.description,
      parameters: step.parameters,
      appliedBy: this.agentId,
    };

    await envManager.applyModification(environmentId, modification);
  }

  /**
   * Execute a simulate step
   */
  private async executeSimulateStep(
    envManager: any,
    environmentId: string,
    step: ExperimentStep
  ): Promise<SimulationSnapshot> {
    const duration = step.parameters.duration || 86400; // Default 1 day
    return await envManager.runSimulation(environmentId, duration);
  }

  /**
   * Execute an observe step
   */
  private async executeObserveStep(
    envManager: any,
    environmentId: string,
    step: ExperimentStep
  ): Promise<Observation> {
    const env = envManager.getEnvironment(environmentId);
    if (!env) {
      throw new Error(`Environment ${environmentId} not found`);
    }

    const metric = step.parameters.metric;
    const value = env.metrics[metric as keyof typeof env.metrics] || 0;

    return {
      timestamp: new Date(),
      metric,
      value: typeof value === 'number' ? value : 0,
      change: 0, // Will be calculated in analysis
      significance: 'medium',
    };
  }

  /**
   * Execute a compare step
   */
  private async executeCompareStep(
    envManager: any,
    snapshot1: SimulationSnapshot,
    snapshot2: SimulationSnapshot
  ): Promise<Observation[]> {
    const comparison = envManager.compareSnapshots(snapshot1, snapshot2);
    
    return [
      {
        timestamp: new Date(),
        metric: 'orders',
        value: comparison.ordersDiff,
        change: (comparison.ordersDiff / snapshot1.metrics.totalOrders) * 100,
        significance: Math.abs(comparison.ordersDiff) > 100 ? 'high' : 'medium',
      },
      {
        timestamp: new Date(),
        metric: 'revenue',
        value: comparison.revenueDiff,
        change: (comparison.revenueDiff / snapshot1.metrics.totalRevenue) * 100,
        significance: Math.abs(comparison.revenueDiff) > 10000 ? 'high' : 'medium',
      },
    ];
  }

  /**
   * Analyze experiment results
   */
  private analyzeResults(
    experiment: Experiment,
    observations: Observation[],
    snapshots: SimulationSnapshot[]
  ): ExperimentResults {
    // Calculate if hypothesis is validated
    const significantObservations = observations.filter(o => o.significance === 'high');
    const hypothesis_validated = significantObservations.length > 0 && 
                                 significantObservations.every(o => o.change > 0);

    // Calculate confidence based on consistency of results
    const confidence = this.calculateConfidence(observations);

    // Generate recommendations
    const recommendations = this.generateRecommendations(observations, snapshots);

    // Identify risks
    const risks = this.identifyRisks(observations, snapshots);

    return {
      hypothesis_validated,
      confidence,
      observations,
      recommendations,
      risks,
    };
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(observations: Observation[]): number {
    if (observations.length === 0) return 0;

    const positiveChanges = observations.filter(o => o.change > 0).length;
    const consistency = positiveChanges / observations.length;
    
    const highSignificance = observations.filter(o => o.significance === 'high').length;
    const significanceScore = highSignificance / observations.length;

    return (consistency * 0.6 + significanceScore * 0.4);
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    observations: Observation[],
    snapshots: SimulationSnapshot[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze trends
    const revenueObs = observations.filter(o => o.metric === 'revenue');
    if (revenueObs.length > 0 && revenueObs.every(o => o.change > 5)) {
      recommendations.push('تطبيق التغييرات على النظام الحقيقي - النتائج إيجابية بشكل واضح');
    }

    const healthDecline = snapshots.some(s => s.metrics.systemHealth < 70);
    if (healthDecline) {
      recommendations.push('مراجعة صحة النظام قبل التطبيق - هناك تأثير سلبي محتمل');
    }

    if (recommendations.length === 0) {
      recommendations.push('إجراء المزيد من الاختبارات قبل اتخاذ القرار');
    }

    return recommendations;
  }

  /**
   * Identify potential risks
   */
  private identifyRisks(
    observations: Observation[],
    snapshots: SimulationSnapshot[]
  ): Risk[] {
    const risks: Risk[] = [];

    // Check for system health degradation
    const latestSnapshot = snapshots[snapshots.length - 1];
    if (latestSnapshot && latestSnapshot.metrics.systemHealth < 70) {
      risks.push({
        type: 'system_health',
        severity: 'high',
        probability: 0.7,
        description: 'انخفاض صحة النظام بشكل ملحوظ',
        mitigation: 'تطبيق التغييرات بشكل تدريجي مع مراقبة مستمرة',
      });
    }

    // Check for high churn rate
    if (latestSnapshot && latestSnapshot.metrics.churnRate > 0.25) {
      risks.push({
        type: 'customer_churn',
        severity: 'medium',
        probability: 0.6,
        description: 'معدل فقدان العملاء مرتفع',
        mitigation: 'تحسين تجربة العملاء وبرامج الولاء',
      });
    }

    return risks;
  }

  /**
   * Quick test: What if we change a parameter?
   */
  async whatIf(
    scenario: string,
    parameterChanges: Record<string, any>,
    duration: number = 86400 // 1 day
  ): Promise<{
    before: SimulationSnapshot;
    after: SimulationSnapshot;
    impact: string;
    recommendation: string;
  }> {
    console.log(`🤔 What-if analysis: ${scenario}`);

    const envManager = await getSimulationEnvironment();
    const env = await envManager.createEnvironment(`What-if: ${scenario}`, {
      copyFromProduction: true,
      timeMultiplier: 100, // Very fast
    });

    // Take before snapshot
    const before = await envManager.runSimulation(env.id, 1);

    // Apply changes
    await envManager.applyModification(env.id, {
      type: 'parameter_change',
      description: scenario,
      parameters: parameterChanges,
      appliedBy: this.agentId,
    });

    // Run simulation
    const after = await envManager.runSimulation(env.id, duration);

    // Analyze impact
    const comparison = envManager.compareSnapshots(before, after);
    const revenueChange = (comparison.revenueDiff / before.metrics.totalRevenue) * 100;
    
    let impact = '';
    let recommendation = '';

    if (revenueChange > 10) {
      impact = `تأثير إيجابي كبير: زيادة ${revenueChange.toFixed(1)}% في الإيرادات`;
      recommendation = 'يُنصح بتطبيق هذا التغيير';
    } else if (revenueChange > 0) {
      impact = `تأثير إيجابي طفيف: زيادة ${revenueChange.toFixed(1)}% في الإيرادات`;
      recommendation = 'يمكن تطبيق التغيير مع المراقبة';
    } else {
      impact = `تأثير سلبي: انخفاض ${Math.abs(revenueChange).toFixed(1)}% في الإيرادات`;
      recommendation = 'لا يُنصح بتطبيق هذا التغيير';
    }

    // Clean up
    envManager.deleteEnvironment(env.id);

    return { before, after, impact, recommendation };
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * List all experiments
   */
  listExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }
}

/**
 * Create an agent interface instance
 */
export function createAgentInterface(agentId: string): AgentSimulationInterface {
  return new AgentSimulationInterface(agentId);
}
