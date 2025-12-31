/**
 * HADEROS Simulation Router
 * tRPC API endpoints for simulation engine
 * 
 * @module SimulationRouter
 * @version 1.0.0
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import SimulationEngine, { 
  Scenario, 
  ScenarioParams,
  SimulationConfig,
  SimulationResult,
  createScenarioFromRealData,
  runMonteCarloSimulation
} from '../simulation/engine';
import {
  ALL_SCENARIOS,
  RECOMMENDED_SCENARIOS,
  CURRENT_STATE,
  buildScenario,
  createWhatIfScenario,
  compareScenarios,
  validateScenario
} from '../simulation/scenarios';

// ============================================================================
// Zod Schemas
// ============================================================================

const ScenarioParamsSchema = z.object({
  advertisingBudget: z.number().min(0),
  collectionRate: z.number().min(0).max(1),
  productCategories: z.array(z.string()),
  employeeCount: z.number().int().min(1),
  employeeProductivity: z.number().min(0).max(1),
  employeeErrorRate: z.number().min(0).max(1),
  marketDemand: z.number().min(0),
  seasonality: z.boolean(),
  competitionLevel: z.number().min(0).max(1),
  shippingCost: z.number().min(0),
  returnRate: z.number().min(0).max(1),
  qualityScore: z.number().min(0).max(1)
});

const SimulationConfigSchema = z.object({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  timeStep: z.enum(['hour', 'day', 'week', 'month']),
  iterations: z.number().int().optional(),
  seed: z.number().int().optional()
});

const ScenarioSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  params: ScenarioParamsSchema,
  config: SimulationConfigSchema.optional()
});

// ============================================================================
// Simulation Router
// ============================================================================

export const simulationRouter = router({
  /**
   * Get all predefined scenarios
   */
  getScenarios: publicProcedure
    .query(async () => {
      return {
        all: ALL_SCENARIOS,
        recommended: RECOMMENDED_SCENARIOS,
        current: CURRENT_STATE
      };
    }),
  
  /**
   * Get single scenario by ID
   */
  getScenario: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ input }) => {
      const scenario = ALL_SCENARIOS.find(s => s.id === input.id);
      if (!scenario) {
        throw new Error(`Scenario not found: ${input.id}`);
      }
      return scenario;
    }),
  
  /**
   * Create custom scenario
   */
  createScenario: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      params: ScenarioParamsSchema.partial(),
      baseScenarioId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const baseScenario = input.baseScenarioId
        ? ALL_SCENARIOS.find(s => s.id === input.baseScenarioId)
        : undefined;
      
      const scenario = buildScenario({
        name: input.name,
        description: input.description,
        baseScenario,
        overrides: input.params
      });
      
      // Validate
      const validation = validateScenario(scenario);
      if (!validation.valid) {
        throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
      }
      
      return {
        scenario,
        validation
      };
    }),
  
  /**
   * Create what-if scenario
   */
  createWhatIf: protectedProcedure
    .input(z.object({
      baseScenarioId: z.string(),
      whatIf: z.object({
        advertisingChange: z.number().optional(),
        collectionChange: z.number().optional(),
        demandChange: z.number().optional(),
        employeeChange: z.number().int().optional()
      })
    }))
    .mutation(async ({ input }) => {
      const baseScenario = ALL_SCENARIOS.find(s => s.id === input.baseScenarioId);
      if (!baseScenario) {
        throw new Error(`Base scenario not found: ${input.baseScenarioId}`);
      }
      
      const scenario = createWhatIfScenario(baseScenario, input.whatIf);
      
      return {
        scenario,
        base: baseScenario,
        changes: input.whatIf
      };
    }),
  
  /**
   * Compare multiple scenarios
   */
  compareScenarios: publicProcedure
    .input(z.object({
      scenarioIds: z.array(z.string())
    }))
    .query(async ({ input }) => {
      const scenarios = input.scenarioIds
        .map(id => ALL_SCENARIOS.find(s => s.id === id))
        .filter(s => s !== undefined) as Scenario[];
      
      if (scenarios.length === 0) {
        throw new Error('No valid scenarios found');
      }
      
      return compareScenarios(scenarios);
    }),
  
  /**
   * Validate scenario
   */
  validateScenario: publicProcedure
    .input(ScenarioSchema)
    .query(async ({ input }) => {
      const scenario = input as Scenario;
      return validateScenario(scenario);
    }),
  
  /**
   * Run simulation
   */
  runSimulation: protectedProcedure
    .input(z.object({
      scenarioId: z.string().optional(),
      scenario: ScenarioSchema.optional()
    }))
    .mutation(async ({ input }) => {
      let scenario: Scenario;
      
      if (input.scenarioId) {
        const found = ALL_SCENARIOS.find(s => s.id === input.scenarioId);
        if (!found) {
          throw new Error(`Scenario not found: ${input.scenarioId}`);
        }
        scenario = found;
      } else if (input.scenario) {
        scenario = input.scenario as Scenario;
      } else {
        throw new Error('Must provide either scenarioId or scenario');
      }
      
      // Validate
      const validation = validateScenario(scenario);
      if (!validation.valid) {
        throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
      }
      
      // Run simulation
      const engine = new SimulationEngine();
      engine.initialize(scenario);
      const result = await engine.run();
      
      return result;
    }),
  
  /**
   * Run Monte Carlo simulation
   */
  runMonteCarlo: protectedProcedure
    .input(z.object({
      scenarioId: z.string(),
      iterations: z.number().int().min(100).max(10000).default(1000)
    }))
    .mutation(async ({ input }) => {
      const scenario = ALL_SCENARIOS.find(s => s.id === input.scenarioId);
      if (!scenario) {
        throw new Error(`Scenario not found: ${input.scenarioId}`);
      }
      
      const results = await runMonteCarloSimulation(scenario, input.iterations);
      
      // Calculate statistics
      const profits = results.map(r => r.metrics.netProfit);
      const revenues = results.map(r => r.metrics.totalRevenue);
      
      const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
      const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
      
      const sortedProfits = [...profits].sort((a, b) => a - b);
      const p10 = sortedProfits[Math.floor(profits.length * 0.1)];
      const p50 = sortedProfits[Math.floor(profits.length * 0.5)];
      const p90 = sortedProfits[Math.floor(profits.length * 0.9)];
      
      return {
        scenario,
        iterations: input.iterations,
        results: results.slice(0, 100), // Return first 100 detailed results
        statistics: {
          profit: {
            mean: avgProfit,
            p10,
            p50,
            p90,
            min: Math.min(...profits),
            max: Math.max(...profits)
          },
          revenue: {
            mean: avgRevenue,
            min: Math.min(...revenues),
            max: Math.max(...revenues)
          }
        }
      };
    }),
  
  /**
   * Run batch simulations (compare multiple scenarios)
   */
  runBatchSimulations: protectedProcedure
    .input(z.object({
      scenarioIds: z.array(z.string())
    }))
    .mutation(async ({ input }) => {
      const results: SimulationResult[] = [];
      const engine = new SimulationEngine();
      
      for (const scenarioId of input.scenarioIds) {
        const scenario = ALL_SCENARIOS.find(s => s.id === scenarioId);
        if (!scenario) continue;
        
        engine.initialize(scenario);
        const result = await engine.run();
        results.push(result);
      }
      
      return {
        results,
        comparison: {
          bestProfit: results.reduce((best, r) => 
            r.metrics.netProfit > best.metrics.netProfit ? r : best
          ),
          bestROI: results.reduce((best, r) => 
            r.metrics.roi > best.metrics.roi ? r : best
          ),
          bestRevenue: results.reduce((best, r) => 
            r.metrics.totalRevenue > best.metrics.totalRevenue ? r : best
          )
        }
      };
    }),
  
  /**
   * Get simulation progress (for real-time updates)
   */
  getProgress: publicProcedure
    .input(z.object({
      simulationId: z.string()
    }))
    .query(async ({ input }) => {
      // TODO: Implement real-time progress tracking
      // This would require storing simulation state in memory or database
      return {
        simulationId: input.simulationId,
        progress: 0,
        status: 'pending'
      };
    })
});

export default simulationRouter;
