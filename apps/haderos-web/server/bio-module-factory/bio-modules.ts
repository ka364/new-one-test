/**
 * Bio-Module Definitions
 *
 * The 7 biological organisms that inspire HaderOS modules.
 * Each definition includes biological behavior, business problem, and solution approach.
 */

import { BioModule, BioOrganism, HADERPhase } from './types';

/**
 * 1. Mycelium Module - Fungal Network Resource Distribution
 */
const myceliumModule: BioModule = {
  name: 'mycelium',
  displayName: 'Mycelium Module',
  organism: BioOrganism.MYCELIUM,

  behavior: `
Fungal networks (mycelium) form vast underground communication systems that:
- Transfer water, sugars, and minerals between trees
- Move resources from abundant areas to areas of need
- Warn other trees of dangers through chemical signals
- Create decentralized, resilient networks without central control
  `.trim(),

  adminProblem: `
In multi-branch organizations:
- Branch A has excess inventory while Branch B faces stockouts
- Resources are wasted due to poor distribution
- Manual rebalancing is slow and inefficient
- Lost sales due to unavailability
  `.trim(),

  solutionCode: `
async function balanceInventory() {
  const branches = await getAllBranches();
  for (const b of branches) {
    if (b.inventory > b.thresholdHigh) {
      const surplus = b.inventory - b.optimal;
      const target = findNearestUnderstock(branches, b.product);
      const amount = Math.min(surplus, target.optimal - target.inventory);
      if (isCostEffective(b, target, amount)) {
        await transfer(b, target, amount);
      }
    }
  }
}
  `.trim(),

  lifecyclePhase: HADERPhase.ECOMMERCE,
  priority: 1,

  technologies: ['TypeScript', 'Redis', 'WebSocket', 'DePIN'],
  dependencies: [],

  references: {
    papers: [
      'Simard, S. W. (1997). Net transfer of carbon between ectomycorrhizal tree species in the field.',
      'Gorzelak, M. A., et al. (2015). Inter-plant communication through mycorrhizal networks mediates complex adaptive behaviour in plant communities.',
    ],
    videos: [
      'The Wood Wide Web: How Trees Talk to Each Other - BBC',
      'Suzanne Simard: How trees talk to each other - TED',
    ],
  },
};

/**
 * 2. Corvid Module - Crow Intelligence & Meta-Learning
 */
const corvidModule: BioModule = {
  name: 'corvid',
  displayName: 'Corvid Module',
  organism: BioOrganism.CORVID,

  behavior: `
Crows demonstrate remarkable intelligence:
- Learn from mistakes and remember solutions
- Use tools to solve complex problems
- Teach other crows successful strategies
- Recognize individual humans and remember interactions
- Adapt behavior based on past experiences
  `.trim(),

  adminProblem: `
Systems repeat the same errors:
- Data conflicts from multiple sources
- No learning from past mistakes
- Manual error correction is repetitive
- Knowledge is lost when employees leave
  `.trim(),

  solutionCode: `
class CorvidLearningEngine {
  async recordError(error: Error, context: Context) {
    // Store error pattern
    await this.errorMemory.store({
      pattern: extractPattern(error),
      context,
      timestamp: new Date()
    });
    
    // Extract prevention rule
    const rule = await this.extractRule(error, context);
    await this.preventionRules.add(rule);
  }
  
  async preventError(operation: Operation) {
    // Check against learned rules
    const violations = await this.preventionRules.check(operation);
    if (violations.length > 0) {
      throw new PreventableError(violations);
    }
  }
}
  `.trim(),

  lifecyclePhase: HADERPhase.CRM_AGENT,
  priority: 2,

  technologies: ['TypeScript', 'PostgreSQL', 'Machine Learning', 'Pattern Recognition'],
  dependencies: [],

  references: {
    papers: [
      'Emery, N. J., & Clayton, N. S. (2004). The mentality of crows: convergent evolution of intelligence in corvids and apes.',
      'Hunt, G. R. (1996). Manufacture and use of hook-tools by New Caledonian crows.',
    ],
    videos: ['How Smart Are Crows? - National Geographic', 'The Intelligence of Crows - PBS'],
  },
};

/**
 * 3. Chameleon Module - Adaptive Market Response
 */
const chameleonModule: BioModule = {
  name: 'chameleon',
  displayName: 'Chameleon Module',
  organism: BioOrganism.CHAMELEON,

  behavior: `
Chameleons adapt instantly to their environment:
- Change color based on temperature, mood, and surroundings
- Adjust behavior to match context
- React to threats with rapid transformation
- Blend seamlessly with changing conditions
  `.trim(),

  adminProblem: `
Static pricing and interfaces fail to adapt:
- Fixed prices miss market opportunities
- One-size-fits-all UI frustrates users
- Slow response to competitor changes
- Lost sales due to inflexibility
  `.trim(),

  solutionCode: `
class ChameleonPricingEngine {
  async calculatePrice(product: Product, context: Context) {
    const basePrice = product.basePrice;
    
    // Market adaptation
    const marketMultiplier = await this.analyzeMarket(product);
    
    // Demand adaptation
    const demandMultiplier = await this.analyzeDemand(product);
    
    // Customer adaptation
    const customerMultiplier = await this.analyzeCustomer(context.user);
    
    return basePrice * marketMultiplier * demandMultiplier * customerMultiplier;
  }
}
  `.trim(),

  lifecyclePhase: HADERPhase.ECOMMERCE,
  priority: 3,

  technologies: ['TypeScript', 'Generative UI', 'Real-time Analytics', 'A/B Testing'],
  dependencies: [],

  references: {
    papers: [
      'Stuart-Fox, D., & Moussalli, A. (2008). Selection for social signalling drives the evolution of chameleon colour change.',
      'Teyssier, J., et al. (2015). Photonic crystals cause active colour change in chameleons.',
    ],
  },
};

/**
 * 4. Cephalopod Module - Distributed Decision Making
 */
const cephalopodModule: BioModule = {
  name: 'cephalopod',
  displayName: 'Cephalopod Module',
  organism: BioOrganism.CEPHALOPOD,

  behavior: `
Octopuses have distributed intelligence:
- Each arm can make independent decisions
- No central brain controls all actions
- Arms coordinate without direct communication
- Rapid parallel problem-solving
  `.trim(),

  adminProblem: `
Centralized decision-making creates bottlenecks:
- All approvals go through management
- Slow response to local issues
- Employees can't act on obvious problems
- Opportunities missed due to bureaucracy
  `.trim(),

  solutionCode: `
class CephalopodDecisionEngine {
  async makeDecision(context: LocalContext) {
    // Each "arm" (branch/agent) decides independently
    const localDecision = await this.evaluateLocally(context);
    
    // Check if decision is within authority
    if (localDecision.risk <= this.authorityLevel) {
      return await this.execute(localDecision);
    }
    
    // Escalate only if necessary
    return await this.escalate(localDecision);
  }
}
  `.trim(),

  lifecyclePhase: HADERPhase.KEMET_MVP,
  priority: 4,

  technologies: ['TypeScript', 'Edge Computing', 'Distributed Systems', 'ACP'],
  dependencies: [],

  references: {
    papers: [
      'Godfrey-Smith, P. (2016). Other Minds: The Octopus, the Sea, and the Deep Origins of Consciousness.',
      'Sumbre, G., et al. (2006). Control of octopus arm extension by a peripheral motor program.',
    ],
  },
};

/**
 * 5. Arachnid Module - Web-based Anomaly Detection
 */
const arachnidModule: BioModule = {
  name: 'arachnid',
  displayName: 'Arachnid Module',
  organism: BioOrganism.ARACHNID,

  behavior: `
Spiders detect threats through web vibrations:
- Sense tiny disturbances across entire web
- Distinguish between prey, predator, and debris
- React instantly to anomalies
- Maintain constant vigilance
  `.trim(),

  adminProblem: `
Fraud and errors go undetected:
- Manual audits are slow and incomplete
- Fraudulent transactions slip through
- Errors compound before discovery
- Financial losses accumulate
  `.trim(),

  solutionCode: `
class ArachnidAnomalyDetector {
  async monitorTransaction(tx: Transaction) {
    // Create "web" of normal patterns
    const normalPattern = await this.getNormalPattern(tx.type);
    
    // Detect "vibrations" (anomalies)
    const anomalyScore = await this.calculateAnomalyScore(tx, normalPattern);
    
    if (anomalyScore > this.threshold) {
      await this.triggerAlert(tx, anomalyScore);
      await this.freezeTransaction(tx);
    }
  }
}
  `.trim(),

  lifecyclePhase: HADERPhase.CRM_AGENT,
  priority: 5,

  technologies: [
    'TypeScript',
    'Neuromorphic Computing',
    'Anomaly Detection',
    'Real-time Monitoring',
  ],
  dependencies: [],

  references: {
    papers: [
      "Barth, F. G. (2002). A Spider's World: Senses and Behavior.",
      "Mortimer, B., et al. (2014). Tuning the instrument: sonic properties in the spider's web.",
    ],
  },
};

/**
 * 6. Ant Module - Swarm Logistics Optimization
 */
const antModule: BioModule = {
  name: 'ant',
  displayName: 'Ant Module',
  organism: BioOrganism.ANT,

  behavior: `
Ant colonies optimize logistics through swarm intelligence:
- Find shortest paths using pheromone trails
- Adapt routes based on collective feedback
- No central planner, yet highly efficient
- Self-organize to solve complex problems
  `.trim(),

  adminProblem: `
Delivery routes are suboptimal:
- Manual route planning is time-consuming
- Traffic and delays not accounted for
- Drivers waste time and fuel
- Customer satisfaction suffers
  `.trim(),

  solutionCode: `
class AntColonyOptimizer {
  async optimizeRoutes(deliveries: Delivery[]) {
    // Initialize pheromone trails
    const trails = this.initializeTrails(deliveries);
    
    // Simulate ant agents
    for (let i = 0; i < this.iterations; i++) {
      const routes = await this.simulateAnts(deliveries, trails);
      this.updatePheromones(trails, routes);
      this.evaporatePheromones(trails);
    }
    
    return this.getBestRoute(trails);
  }
}
  `.trim(),

  lifecyclePhase: HADERPhase.ECOMMERCE,
  priority: 6,

  technologies: ['TypeScript', 'Swarm Intelligence', 'Route Optimization', 'Robotics'],
  dependencies: ['mycelium'],

  references: {
    papers: [
      'Dorigo, M., & Stützle, T. (2004). Ant Colony Optimization.',
      'Hölldobler, B., & Wilson, E. O. (1990). The Ants.',
    ],
  },
};

/**
 * 7. Tardigrade Module - Extreme Resilience
 */
const tardigradeModule: BioModule = {
  name: 'tardigrade',
  displayName: 'Tardigrade Module',
  organism: BioOrganism.TARDIGRADE,

  behavior: `
Water bears (tardigrades) survive extreme conditions:
- Enter cryptobiosis (suspended animation) under stress
- Survive extreme temperatures, radiation, vacuum
- Revive when conditions improve
- Protect DNA with unique proteins
  `.trim(),

  adminProblem: `
Systems fail during crises:
- Server crashes lose data
- Network outages halt operations
- No disaster recovery plan
- Business continuity at risk
  `.trim(),

  solutionCode: `
class TardigradeResilienceEngine {
  async handleCrisis(crisis: Crisis) {
    // Enter "cryptobiosis" mode
    await this.saveState();
    await this.minimizeOperations();
    
    // Protect critical data
    await this.protectCriticalData();
    
    // Wait for conditions to improve
    await this.monitorConditions();
    
    // Revive when safe
    if (await this.isSafeToRevive()) {
      await this.restoreState();
      await this.resumeOperations();
    }
  }
}
  `.trim(),

  lifecyclePhase: HADERPhase.INTEGRATION_LAUNCH,
  priority: 7,

  technologies: ['TypeScript', 'Self-Healing Systems', 'Digital Twins', 'Disaster Recovery'],
  dependencies: ['corvid'],

  references: {
    papers: [
      'Guidetti, R., & Jönsson, K. I. (2002). Long-term anhydrobiotic survival in semi-terrestrial micrometazoans.',
      'Hashimoto, T., et al. (2016). Extremotolerant tardigrade genome and improved radiotolerance of human cultured cells by tardigrade-unique protein.',
    ],
  },
};

/**
 * Export all bio-module definitions
 */
export const bioModuleDefinitions = new Map<BioOrganism, BioModule>([
  [BioOrganism.MYCELIUM, myceliumModule],
  [BioOrganism.CORVID, corvidModule],
  [BioOrganism.CHAMELEON, chameleonModule],
  [BioOrganism.CEPHALOPOD, cephalopodModule],
  [BioOrganism.ARACHNID, arachnidModule],
  [BioOrganism.ANT, antModule],
  [BioOrganism.TARDIGRADE, tardigradeModule],
]);

/**
 * Get module build order (respecting dependencies)
 */
export function getModuleBuildOrder(): BioModule[] {
  return [
    myceliumModule, // No dependencies
    corvidModule, // No dependencies
    chameleonModule, // No dependencies
    cephalopodModule, // No dependencies
    arachnidModule, // No dependencies
    antModule, // Depends on mycelium
    tardigradeModule, // Depends on corvid
  ];
}
