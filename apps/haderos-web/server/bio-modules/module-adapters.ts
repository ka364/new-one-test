/**
 * Module Adapters
 *
 * Adapters to convert existing module messages to unified BioMessage format
 * This allows existing modules to communicate using the unified messaging system
 */

import { BioModuleName } from './bio-interaction-matrix';
import { createBioMessage, BioMessage, BioMessageType } from './unified-messaging';

/**
 * Generic adapter interface
 */
export interface ModuleAdapter {
  moduleName: BioModuleName;
  adaptOutgoing(data: any): BioMessage;
  adaptIncoming(message: BioMessage): any;
}

/**
 * Arachnid (Anomaly Detection) Adapter
 */
export class ArachnidAdapter implements ModuleAdapter {
  moduleName: BioModuleName = 'arachnid';

  adaptOutgoing(data: any): BioMessage {
    // Arachnid sends anomaly alerts
    if (data.type === 'anomaly_detected') {
      return createBioMessage(
        'arachnid',
        ['corvid', 'cephalopod'], // Notify learning & decision modules
        'alert',
        {
          anomalyType: data.anomalyType,
          severity: data.severity,
          affectedEntity: data.affectedEntity,
          metrics: data.metrics,
          recommendedAction: data.recommendedAction,
        },
        { priority: data.severity === 'critical' ? 1 : 2 }
      );
    }

    // Default: event
    return createBioMessage('arachnid', [], 'event', data);
  }

  adaptIncoming(message: BioMessage): any {
    // Convert unified message to Arachnid's expected format
    return {
      type: message.type,
      data: message.payload,
      source: message.source,
      timestamp: message.timestamp,
    };
  }
}

/**
 * Corvid (Meta-Learning) Adapter
 */
export class CorvidAdapter implements ModuleAdapter {
  moduleName: BioModuleName = 'corvid';

  adaptOutgoing(data: any): BioMessage {
    // Corvid sends learning insights
    if (data.type === 'pattern_detected') {
      return createBioMessage(
        'corvid',
        ['arachnid', 'chameleon', 'ant'], // Share patterns with relevant modules
        'event',
        {
          patternType: data.patternType,
          confidence: data.confidence,
          occurrences: data.occurrences,
          recommendation: data.recommendation,
        }
      );
    }

    if (data.type === 'prevention_rule') {
      return createBioMessage(
        'corvid',
        ['arachnid'], // Send prevention rules to anomaly detector
        'command',
        {
          ruleType: data.ruleType,
          condition: data.condition,
          action: data.action,
        },
        { priority: 2 }
      );
    }

    return createBioMessage('corvid', [], 'event', data);
  }

  adaptIncoming(message: BioMessage): any {
    return {
      eventType: message.type,
      payload: message.payload,
      source: message.source,
      timestamp: message.timestamp,
    };
  }
}

/**
 * Mycelium (Resource Distribution) Adapter
 */
export class MyceliumAdapter implements ModuleAdapter {
  moduleName: BioModuleName = 'mycelium';

  adaptOutgoing(data: any): BioMessage {
    // Mycelium sends resource transfer requests
    if (data.type === 'transfer_request') {
      return createBioMessage(
        'mycelium',
        ['cephalopod'], // Request approval from decision module
        'command',
        {
          fromBranch: data.fromBranch,
          toBranch: data.toBranch,
          resourceType: data.resourceType,
          quantity: data.quantity,
          urgency: data.urgency,
        },
        { priority: data.urgency === 'critical' ? 1 : 3 }
      );
    }

    if (data.type === 'balance_report') {
      return createBioMessage(
        'mycelium',
        ['corvid'], // Share balance data for learning
        'event',
        {
          networkHealth: data.networkHealth,
          imbalances: data.imbalances,
          transfersCompleted: data.transfersCompleted,
        }
      );
    }

    return createBioMessage('mycelium', [], 'event', data);
  }

  adaptIncoming(message: BioMessage): any {
    return {
      action: message.type,
      data: message.payload,
      from: message.source,
      timestamp: message.timestamp,
    };
  }
}

/**
 * Ant (Route Optimization) Adapter
 */
export class AntAdapter implements ModuleAdapter {
  moduleName: BioModuleName = 'ant';

  adaptOutgoing(data: any): BioMessage {
    // Ant sends optimized routes
    if (data.type === 'route_optimized') {
      return createBioMessage(
        'ant',
        ['corvid'], // Share routing data for learning
        'event',
        {
          deliveryDate: data.deliveryDate,
          totalOrders: data.totalOrders,
          optimizedRoutes: data.optimizedRoutes,
          estimatedSavings: data.estimatedSavings,
        }
      );
    }

    if (data.type === 'route_failure') {
      return createBioMessage(
        'ant',
        ['corvid', 'tardigrade'], // Report failure for learning & resilience
        'alert',
        {
          failedRoute: data.failedRoute,
          reason: data.reason,
          affectedOrders: data.affectedOrders,
        },
        { priority: 2 }
      );
    }

    return createBioMessage('ant', [], 'event', data);
  }

  adaptIncoming(message: BioMessage): any {
    return {
      type: message.type,
      payload: message.payload,
      source: message.source,
      timestamp: message.timestamp,
    };
  }
}

/**
 * Tardigrade (Resilience) Adapter
 */
export class TardigradeAdapter implements ModuleAdapter {
  moduleName: BioModuleName = 'tardigrade';

  adaptOutgoing(data: any): BioMessage {
    // Tardigrade sends health alerts
    if (data.type === 'health_critical') {
      return createBioMessage(
        'tardigrade',
        ['cephalopod'], // Escalate to decision module
        'alert',
        {
          component: data.component,
          healthScore: data.healthScore,
          issue: data.issue,
          recommendedAction: data.recommendedAction,
        },
        { priority: 1 }
      );
    }

    if (data.type === 'recovery_complete') {
      return createBioMessage(
        'tardigrade',
        ['corvid'], // Share recovery data for learning
        'event',
        {
          component: data.component,
          recoveryTime: data.recoveryTime,
          method: data.method,
        }
      );
    }

    return createBioMessage('tardigrade', [], 'event', data);
  }

  adaptIncoming(message: BioMessage): any {
    return {
      eventType: message.type,
      data: message.payload,
      from: message.source,
      timestamp: message.timestamp,
    };
  }
}

/**
 * Chameleon (Adaptive Pricing) Adapter
 */
export class ChameleonAdapter implements ModuleAdapter {
  moduleName: BioModuleName = 'chameleon';

  adaptOutgoing(data: any): BioMessage {
    // Chameleon sends pricing changes
    if (data.type === 'price_adjusted') {
      return createBioMessage(
        'chameleon',
        ['arachnid', 'cephalopod'], // Notify for anomaly check & approval
        'command',
        {
          productId: data.productId,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
          reason: data.reason,
          marketConditions: data.marketConditions,
        },
        { priority: 2 }
      );
    }

    return createBioMessage('chameleon', [], 'event', data);
  }

  adaptIncoming(message: BioMessage): any {
    return {
      action: message.type,
      payload: message.payload,
      source: message.source,
      timestamp: message.timestamp,
    };
  }
}

/**
 * Cephalopod (Distributed Intelligence) Adapter
 */
export class CephalopodAdapter implements ModuleAdapter {
  moduleName: BioModuleName = 'cephalopod';

  adaptOutgoing(data: any): BioMessage {
    // Cephalopod sends decisions
    if (data.type === 'decision_made') {
      return createBioMessage(
        'cephalopod',
        [data.targetModule], // Send decision to requesting module
        'command',
        {
          decisionId: data.decisionId,
          decision: data.decision,
          reasoning: data.reasoning,
          confidence: data.confidence,
        },
        { priority: 2 }
      );
    }

    if (data.type === 'authority_delegated') {
      return createBioMessage(
        'cephalopod',
        ['corvid'], // Log delegation for learning
        'event',
        {
          delegatedTo: data.delegatedTo,
          scope: data.scope,
          conditions: data.conditions,
        }
      );
    }

    return createBioMessage('cephalopod', [], 'event', data);
  }

  adaptIncoming(message: BioMessage): any {
    return {
      requestType: message.type,
      data: message.payload,
      from: message.source,
      timestamp: message.timestamp,
    };
  }
}

/**
 * Adapter Factory
 */
export class ModuleAdapterFactory {
  private static adapters: Map<BioModuleName, ModuleAdapter> = new Map([
    ['arachnid', new ArachnidAdapter()],
    ['corvid', new CorvidAdapter()],
    ['mycelium', new MyceliumAdapter()],
    ['ant', new AntAdapter()],
    ['tardigrade', new TardigradeAdapter()],
    ['chameleon', new ChameleonAdapter()],
    ['cephalopod', new CephalopodAdapter()],
  ]);

  /**
   * Get adapter for a module
   */
  static getAdapter(moduleName: BioModuleName): ModuleAdapter {
    const adapter = this.adapters.get(moduleName);
    if (!adapter) {
      throw new Error(`No adapter found for module: ${moduleName}`);
    }
    return adapter;
  }

  /**
   * Convert module data to unified message
   */
  static convertToUnifiedFormat(moduleName: BioModuleName, data: any): BioMessage {
    const adapter = this.getAdapter(moduleName);
    return adapter.adaptOutgoing(data);
  }

  /**
   * Convert unified message to module format
   */
  static convertFromUnifiedFormat(moduleName: BioModuleName, message: BioMessage): any {
    const adapter = this.getAdapter(moduleName);
    return adapter.adaptIncoming(message);
  }
}
