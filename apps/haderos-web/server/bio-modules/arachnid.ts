/**
 * Arachnid Module - Spider Web Anomaly Detection (Simplified)
 *
 * Inspired by: Spider's web sensitivity to vibrations
 * Problem: Hidden fraud and accounting errors
 * Solution: Real-time anomaly detection
 */

import { getEventBus } from '../events/eventBus';
import { createAgentInsight } from '../db';

export interface AnomalyDetection {
  transactionId: number;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  timestamp: Date;
}

export interface AnomalyPattern {
  type: string;
  description: string;
  threshold: number;
}

/**
 * Arachnid Anomaly Detection Engine
 */
class ArachnidEngine {
  private anomalies: AnomalyDetection[] = [];

  /**
   * Detect anomalies in recent transactions
   */
  async detectAnomalies(): Promise<AnomalyDetection[]> {
    try {
      const { getDb } = await import('../db');
      const db = await getDb();
      if (!db) return [];

      const { transactions } = await import('../../drizzle/schema');
      const { gte } = await import('drizzle-orm');

      // Get transactions from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentTxs = await db
        .select()
        .from(transactions)
        .where(gte(transactions.createdAt, yesterday.toISOString()))
        .limit(100);

      const detectedAnomalies: AnomalyDetection[] = [];

      for (const tx of recentTxs) {
        const score = this.calculateAnomalyScore(tx);

        if (score > 40) {
          detectedAnomalies.push({
            transactionId: tx.id,
            score,
            severity: this.getSeverity(score),
            factors: this.getFactors(tx, score),
            timestamp: new Date(),
          });
        }
      }

      this.anomalies = detectedAnomalies;
      return detectedAnomalies;
    } catch (error) {
      console.error('[Arachnid] Error detecting anomalies:', error);
      return [];
    }
  }

  /**
   * Calculate anomaly score for a transaction
   */
  private calculateAnomalyScore(tx: any): number {
    let score = 0;

    // Large amount (>10000)
    const amount = parseFloat(tx.amount?.toString() || '0');
    if (amount > 10000) score += 30;
    else if (amount > 5000) score += 15;

    // Round numbers
    if (amount % 1000 === 0 && amount >= 1000) score += 20;

    // Missing description
    if (!tx.description || tx.description.length < 5) score += 15;

    // Pending status
    if (tx.status === 'pending') score += 10;

    // Non-compliant
    if (tx.shariaCompliant === 0) score += 25;

    return Math.min(score, 100);
  }

  /**
   * Get severity level
   */
  private getSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get factors contributing to anomaly
   */
  private getFactors(tx: any, score: number): string[] {
    const factors: string[] = [];

    const amount = parseFloat(tx.amount?.toString() || '0');
    if (amount > 10000) factors.push('Large amount');
    if (amount % 1000 === 0) factors.push('Round number');
    if (!tx.description || tx.description.length < 5) factors.push('Missing description');
    if (tx.status === 'pending') factors.push('Pending status');
    if (tx.shariaCompliant === 0) factors.push('Non-compliant');

    return factors;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalAnomalies: this.anomalies.length,
      criticalCount: this.anomalies.filter((a) => a.severity === 'critical').length,
      highCount: this.anomalies.filter((a) => a.severity === 'high').length,
      mediumCount: this.anomalies.filter((a) => a.severity === 'medium').length,
      averageScore:
        this.anomalies.length > 0
          ? this.anomalies.reduce((sum, a) => sum + a.score, 0) / this.anomalies.length
          : 0,
    };
  }
}

// Export singleton
export const arachnidEngine = new ArachnidEngine();
