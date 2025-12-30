/**
 * Corvid Learning Module
 * Records all important events, decisions, and errors for future learning
 * 
 * This module acts as the "memory" of the system, storing:
 * - Validation failures and their causes
 * - Business decisions and their outcomes
 * - Error patterns and resolutions
 * - Performance metrics and trends
 */

import { BaseBioModule } from './base-module';
import type { BioMessage, BioModuleConfig, BioModuleHealth } from './types';

export interface LearningEvent {
  id: string;
  timestamp: Date;
  module: string;
  eventType: string;
  category: 'validation' | 'decision' | 'error' | 'success' | 'performance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  data: any;
  tags: string[];
}

export interface LearningInsight {
  pattern: string;
  frequency: number;
  lastOccurrence: Date;
  recommendation: string;
}

export class CorvidLearningModule extends BaseBioModule {
  private events: LearningEvent[] = [];
  private insights: Map<string, LearningInsight> = new Map();

  constructor(config: BioModuleConfig) {
    super({
      ...config,
      name: 'Corvid Learning Module',
    });

    this.logInfo('Corvid Learning Module initialized');
  }

  /**
   * Log a learning event
   */
  async logEvent(event: Omit<LearningEvent, 'id' | 'timestamp'>): Promise<LearningEvent> {
    const learningEvent: LearningEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date(),
      ...event,
    };

    this.events.push(learningEvent);

    // Analyze patterns
    await this.analyzePatterns(learningEvent);

    this.logInfo(`Logged ${event.category} event from ${event.module}: ${event.eventType}`);

    return learningEvent;
  }

  /**
   * Analyze patterns in events
   */
  private async analyzePatterns(event: LearningEvent): Promise<void> {
    // Create pattern key
    const patternKey = `${event.module}:${event.eventType}:${event.category}`;

    const existing = this.insights.get(patternKey);
    if (existing) {
      existing.frequency++;
      existing.lastOccurrence = event.timestamp;
    } else {
      this.insights.set(patternKey, {
        pattern: patternKey,
        frequency: 1,
        lastOccurrence: event.timestamp,
        recommendation: this.generateRecommendation(event),
      });
    }

    // Alert if pattern is concerning
    const insight = this.insights.get(patternKey)!;
    if (insight.frequency >= 5 && event.severity === 'error') {
      this.logWarn(`Pattern detected: ${patternKey} occurred ${insight.frequency} times. ${insight.recommendation}`);
    }
  }

  /**
   * Generate recommendation based on event
   */
  private generateRecommendation(event: LearningEvent): string {
    switch (event.category) {
      case 'validation':
        return 'Review validation rules and consider adjusting thresholds or adding exceptions';
      case 'error':
        return 'Investigate root cause and implement preventive measures';
      case 'performance':
        return 'Consider optimization or scaling if performance degrades';
      default:
        return 'Monitor for recurring patterns';
    }
  }

  /**
   * Get events by module
   */
  getEventsByModule(module: string): LearningEvent[] {
    return this.events.filter(e => e.module === module);
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category: string): LearningEvent[] {
    return this.events.filter(e => e.category === category);
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: string): LearningEvent[] {
    return this.events.filter(e => e.severity === severity);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 10): LearningEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get all insights
   */
  getAllInsights(): LearningInsight[] {
    return Array.from(this.insights.values());
  }

  /**
   * Get top patterns
   */
  getTopPatterns(limit: number = 5): LearningInsight[] {
    return Array.from(this.insights.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const total = this.events.length;
    const byCategory = {
      validation: this.events.filter(e => e.category === 'validation').length,
      decision: this.events.filter(e => e.category === 'decision').length,
      error: this.events.filter(e => e.category === 'error').length,
      success: this.events.filter(e => e.category === 'success').length,
      performance: this.events.filter(e => e.category === 'performance').length,
    };

    const bySeverity = {
      info: this.events.filter(e => e.severity === 'info').length,
      warning: this.events.filter(e => e.severity === 'warning').length,
      error: this.events.filter(e => e.severity === 'error').length,
      critical: this.events.filter(e => e.severity === 'critical').length,
    };

    return {
      total,
      byCategory,
      bySeverity,
      totalPatterns: this.insights.size,
    };
  }

  /**
   * Handle incoming bio-messages
   */
  protected async handleMessage(message: BioMessage): Promise<void> {
    switch (message.action) {
      case 'log_learning_event':
        // Log event from any module
        await this.logEvent({
          module: message.payload.module || message.from,
          eventType: message.payload.eventType,
          category: message.payload.category || 'info',
          severity: message.payload.severity || 'info',
          data: message.payload,
          tags: message.payload.tags || [],
        });
        break;

      case 'get_insights':
        // Send insights back to requester
        this.emit('bio-message', {
          id: `msg-${Date.now()}`,
          from: 'corvid',
          to: message.from,
          action: 'insights_response',
          payload: {
            insights: this.getAllInsights(),
            topPatterns: this.getTopPatterns(),
            statistics: this.getStatistics(),
          },
          timestamp: new Date(),
          priority: message.priority,
        });
        break;

      case 'get_recent_events':
        // Send recent events
        const limit = message.payload.limit || 10;
        this.emit('bio-message', {
          id: `msg-${Date.now()}`,
          from: 'corvid',
          to: message.from,
          action: 'recent_events_response',
          payload: {
            events: this.getRecentEvents(limit),
          },
          timestamp: new Date(),
          priority: message.priority,
        });
        break;

      default:
        this.logWarn(`Unknown action: ${message.action}`);
    }
  }

  /**
   * Get module health status
   */
  getHealth(): BioModuleHealth {
    const stats = this.getStatistics();
    
    return {
      status: 'healthy',
      lastActivity: Date.now(),
      metrics: {
        total_events: stats.total,
        validation_events: stats.byCategory.validation,
        error_events: stats.byCategory.error,
        success_events: stats.byCategory.success,
        total_patterns: stats.totalPatterns,
        critical_events: stats.bySeverity.critical,
      },
    };
  }
}
