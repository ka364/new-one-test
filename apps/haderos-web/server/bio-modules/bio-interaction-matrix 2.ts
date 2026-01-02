/**
 * Bio-Interaction Matrix
 *
 * Defines how the 7 bio-modules interact with each other
 * This is the "nervous system map" of HaderOS
 */

export type BioModuleName =
  | 'arachnid' // Anomaly Detection
  | 'corvid' // Meta-Learning
  | 'mycelium' // Resource Distribution
  | 'ant' // Route Optimization
  | 'tardigrade' // System Resilience
  | 'chameleon' // Adaptive Pricing
  | 'cephalopod'; // Distributed Authority

export type InteractionType =
  | 'trigger' // Module A triggers Module B
  | 'inform' // Module A informs Module B
  | 'request' // Module A requests from Module B
  | 'validate' // Module A validates Module B's decision
  | 'override'; // Module A overrides Module B (rare, high priority)

export interface BioInteraction {
  from: BioModuleName;
  to: BioModuleName;
  type: InteractionType;
  eventType: string;
  priority: number; // 1-10 (10 = highest)
  description: string;
  conflictResolution?: 'from_wins' | 'to_wins' | 'escalate' | 'merge';
}

/**
 * The Bio-Interaction Matrix
 *
 * This matrix defines ALL possible interactions between modules
 * Each module MUST interact with at least 3 other modules
 */
export const BIO_INTERACTION_MATRIX: BioInteraction[] = [
  // ========================================
  // ARACHNID (Anomaly Detection) Interactions
  // ========================================
  {
    from: 'arachnid',
    to: 'tardigrade',
    type: 'trigger',
    eventType: 'anomaly.critical_detected',
    priority: 10,
    description:
      'When Arachnid detects critical anomaly, trigger Tardigrade to enter protective mode',
    conflictResolution: 'from_wins',
  },
  {
    from: 'arachnid',
    to: 'corvid',
    type: 'inform',
    eventType: 'anomaly.pattern_detected',
    priority: 7,
    description: 'Inform Corvid about anomaly patterns for learning',
    conflictResolution: 'merge',
  },
  {
    from: 'arachnid',
    to: 'cephalopod',
    type: 'request',
    eventType: 'anomaly.freeze_account',
    priority: 9,
    description: 'Request Cephalopod to freeze suspicious account',
    conflictResolution: 'escalate',
  },
  {
    from: 'arachnid',
    to: 'chameleon',
    type: 'validate',
    eventType: 'pricing.validation_request',
    priority: 6,
    description: "Validate Chameleon's pricing changes for suspicious patterns",
    conflictResolution: 'from_wins',
  },

  // ========================================
  // CORVID (Meta-Learning) Interactions
  // ========================================
  {
    from: 'corvid',
    to: 'arachnid',
    type: 'inform',
    eventType: 'learning.pattern_extracted',
    priority: 6,
    description: 'Share learned patterns with Arachnid for better detection',
    conflictResolution: 'merge',
  },
  {
    from: 'corvid',
    to: 'ant',
    type: 'inform',
    eventType: 'learning.route_insights',
    priority: 5,
    description: 'Share historical route performance insights',
    conflictResolution: 'merge',
  },
  {
    from: 'corvid',
    to: 'chameleon',
    type: 'inform',
    eventType: 'learning.pricing_insights',
    priority: 5,
    description: 'Share pricing effectiveness insights',
    conflictResolution: 'merge',
  },
  {
    from: 'corvid',
    to: 'mycelium',
    type: 'inform',
    eventType: 'learning.transfer_patterns',
    priority: 5,
    description: 'Share successful resource transfer patterns',
    conflictResolution: 'merge',
  },

  // ========================================
  // MYCELIUM (Resource Distribution) Interactions
  // ========================================
  {
    from: 'mycelium',
    to: 'arachnid',
    type: 'inform',
    eventType: 'resource.unusual_transfer',
    priority: 7,
    description: 'Alert Arachnid about unusual resource transfers',
    conflictResolution: 'escalate',
  },
  {
    from: 'mycelium',
    to: 'ant',
    type: 'request',
    eventType: 'resource.transfer_route',
    priority: 8,
    description: 'Request optimal route for resource transfer',
    conflictResolution: 'to_wins',
  },
  {
    from: 'mycelium',
    to: 'cephalopod',
    type: 'request',
    eventType: 'resource.transfer_approval',
    priority: 7,
    description: 'Request approval for large resource transfers',
    conflictResolution: 'to_wins',
  },
  {
    from: 'mycelium',
    to: 'corvid',
    type: 'inform',
    eventType: 'resource.transfer_completed',
    priority: 4,
    description: 'Inform Corvid about completed transfers for learning',
    conflictResolution: 'merge',
  },

  // ========================================
  // ANT (Route Optimization) Interactions
  // ========================================
  {
    from: 'ant',
    to: 'corvid',
    type: 'inform',
    eventType: 'route.performance_data',
    priority: 5,
    description: 'Share route performance data for learning',
    conflictResolution: 'merge',
  },
  {
    from: 'ant',
    to: 'mycelium',
    type: 'inform',
    eventType: 'route.optimized',
    priority: 6,
    description: 'Inform Mycelium about optimized transfer routes',
    conflictResolution: 'from_wins',
  },
  {
    from: 'ant',
    to: 'tardigrade',
    type: 'request',
    eventType: 'route.carrier_health',
    priority: 7,
    description: 'Request carrier health status before route selection',
    conflictResolution: 'to_wins',
  },
  {
    from: 'ant',
    to: 'chameleon',
    type: 'inform',
    eventType: 'route.delivery_time',
    priority: 5,
    description: 'Inform Chameleon about expected delivery times',
    conflictResolution: 'from_wins',
  },

  // ========================================
  // TARDIGRADE (System Resilience) Interactions
  // ========================================
  {
    from: 'tardigrade',
    to: 'arachnid',
    type: 'inform',
    eventType: 'system.entering_cryptobiosis',
    priority: 10,
    description: 'Alert Arachnid when entering protective mode',
    conflictResolution: 'from_wins',
  },
  {
    from: 'tardigrade',
    to: 'cephalopod',
    type: 'override',
    eventType: 'system.emergency_lockdown',
    priority: 10,
    description: 'Override Cephalopod decisions during emergency',
    conflictResolution: 'from_wins',
  },
  {
    from: 'tardigrade',
    to: 'corvid',
    type: 'inform',
    eventType: 'system.failure_recovered',
    priority: 6,
    description: 'Inform Corvid about failures and recovery for learning',
    conflictResolution: 'merge',
  },
  {
    from: 'tardigrade',
    to: 'ant',
    type: 'inform',
    eventType: 'system.carrier_down',
    priority: 9,
    description: 'Alert Ant about carrier system failures',
    conflictResolution: 'from_wins',
  },

  // ========================================
  // CHAMELEON (Adaptive Pricing) Interactions
  // ========================================
  {
    from: 'chameleon',
    to: 'arachnid',
    type: 'request',
    eventType: 'pricing.validation_request',
    priority: 7,
    description: 'Request validation before applying price changes',
    conflictResolution: 'to_wins',
  },
  {
    from: 'chameleon',
    to: 'corvid',
    type: 'inform',
    eventType: 'pricing.change_applied',
    priority: 4,
    description: 'Inform Corvid about pricing changes for learning',
    conflictResolution: 'merge',
  },
  {
    from: 'chameleon',
    to: 'cephalopod',
    type: 'request',
    eventType: 'pricing.approval_request',
    priority: 6,
    description: 'Request approval for significant price changes',
    conflictResolution: 'to_wins',
  },
  {
    from: 'chameleon',
    to: 'mycelium',
    type: 'inform',
    eventType: 'pricing.demand_shift',
    priority: 5,
    description: 'Inform Mycelium about demand shifts from pricing',
    conflictResolution: 'merge',
  },

  // ========================================
  // CEPHALOPOD (Distributed Authority) Interactions
  // ========================================
  {
    from: 'cephalopod',
    to: 'arachnid',
    type: 'inform',
    eventType: 'authority.decision_made',
    priority: 6,
    description: 'Inform Arachnid about authority decisions for monitoring',
    conflictResolution: 'escalate',
  },
  {
    from: 'cephalopod',
    to: 'corvid',
    type: 'inform',
    eventType: 'authority.delegation_changed',
    priority: 5,
    description: 'Inform Corvid about authority changes for learning',
    conflictResolution: 'merge',
  },
  {
    from: 'cephalopod',
    to: 'mycelium',
    type: 'validate',
    eventType: 'authority.transfer_approval',
    priority: 7,
    description: 'Validate large resource transfers',
    conflictResolution: 'from_wins',
  },
  {
    from: 'cephalopod',
    to: 'chameleon',
    type: 'validate',
    eventType: 'authority.pricing_approval',
    priority: 6,
    description: 'Validate significant pricing changes',
    conflictResolution: 'from_wins',
  },
];

/**
 * Get all interactions for a specific module
 */
export function getModuleInteractions(moduleName: BioModuleName): BioInteraction[] {
  // Return all interactions (both outgoing and incoming)
  return BIO_INTERACTION_MATRIX.filter((i) => i.from === moduleName || i.to === moduleName);
}

/**
 * Get interaction between two modules
 */
export function getInteraction(from: BioModuleName, to: BioModuleName): BioInteraction | undefined {
  return BIO_INTERACTION_MATRIX.find((i) => i.from === from && i.to === to);
}

/**
 * Validate that each module interacts with at least 3 others
 */
export function validateInteractionMatrix(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const modules: BioModuleName[] = [
    'arachnid',
    'corvid',
    'mycelium',
    'ant',
    'tardigrade',
    'chameleon',
    'cephalopod',
  ];

  for (const module of modules) {
    const interactions = getModuleInteractions(module);
    const totalInteractions = interactions.outgoing.length + interactions.incoming.length;

    if (totalInteractions < 3) {
      errors.push(
        `Module "${module}" has only ${totalInteractions} interactions (minimum 3 required)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get interaction statistics
 */
export function getInteractionStats() {
  const modules: BioModuleName[] = [
    'arachnid',
    'corvid',
    'mycelium',
    'ant',
    'tardigrade',
    'chameleon',
    'cephalopod',
  ];

  const stats = modules.map((module) => {
    const interactions = getModuleInteractions(module);
    const outgoing = interactions.filter((i) => i.from === module);
    const incoming = interactions.filter((i) => i.to === module);
    return {
      module,
      outgoing: outgoing.length,
      incoming: incoming.length,
      total: interactions.length,
    };
  });

  return {
    totalInteractions: BIO_INTERACTION_MATRIX.length,
    moduleStats: stats,
    averageInteractions: stats.reduce((sum, s) => sum + s.total, 0) / stats.length,
  };
}
