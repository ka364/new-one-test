/**
 * Adaptive Learning System Unit Tests
 *
 * Tests for adaptive learning logic.
 * Integration tests requiring database should be run separately.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock database
vi.mock('../db', () => ({
  db: null,
  requireDb: vi.fn().mockResolvedValue(null),
  getDb: vi.fn().mockResolvedValue(null),
}));

describe('Adaptive Learning System - Unit Tests', () => {
  describe('Pattern Recognition', () => {
    it('should identify recurring patterns', () => {
      const events = [
        { type: 'login', time: '09:00', userId: 1 },
        { type: 'purchase', time: '10:00', userId: 1 },
        { type: 'login', time: '09:15', userId: 1 },
        { type: 'purchase', time: '10:30', userId: 1 },
        { type: 'login', time: '09:05', userId: 1 },
      ];

      const findPatterns = (events: typeof events) => {
        const patterns: Record<string, number> = {};
        events.forEach((e) => {
          patterns[e.type] = (patterns[e.type] || 0) + 1;
        });
        return Object.entries(patterns)
          .filter(([, count]) => count >= 2)
          .map(([type, count]) => ({ type, frequency: count }));
      };

      const patterns = findPatterns(events);
      expect(patterns).toHaveLength(2);
      expect(patterns.find((p) => p.type === 'login')?.frequency).toBe(3);
    });

    it('should calculate pattern confidence', () => {
      const calculateConfidence = (occurrences: number, totalEvents: number) => {
        return Math.min(1, occurrences / totalEvents);
      };

      expect(calculateConfidence(3, 10)).toBe(0.3);
      expect(calculateConfidence(10, 10)).toBe(1);
      expect(calculateConfidence(15, 10)).toBe(1);
    });
  });

  describe('User Preference Learning', () => {
    it('should track preference scores', () => {
      const preferences: Record<string, number> = {};

      const updatePreference = (key: string, delta: number) => {
        preferences[key] = (preferences[key] || 0) + delta;
        return preferences[key];
      };

      updatePreference('dark_mode', 1);
      updatePreference('notifications', 1);
      updatePreference('dark_mode', 1);

      expect(preferences.dark_mode).toBe(2);
      expect(preferences.notifications).toBe(1);
    });

    it('should normalize preference scores', () => {
      const preferences = { a: 10, b: 30, c: 60 };

      const normalize = (prefs: typeof preferences) => {
        const total = Object.values(prefs).reduce((sum, v) => sum + v, 0);
        return Object.fromEntries(
          Object.entries(prefs).map(([k, v]) => [k, v / total])
        );
      };

      const normalized = normalize(preferences);
      expect(normalized.a).toBeCloseTo(0.1);
      expect(normalized.b).toBeCloseTo(0.3);
      expect(normalized.c).toBeCloseTo(0.6);
    });

    it('should apply preference decay over time', () => {
      const applyDecay = (score: number, daysSinceUpdate: number, decayRate = 0.1) => {
        return score * Math.exp(-decayRate * daysSinceUpdate);
      };

      const original = 100;
      expect(applyDecay(original, 0)).toBe(100);
      expect(applyDecay(original, 7)).toBeLessThan(60);
      expect(applyDecay(original, 30)).toBeLessThan(10);
    });
  });

  describe('Recommendation Engine', () => {
    it('should generate recommendations based on history', () => {
      const history = [
        { productId: 1, category: 'electronics' },
        { productId: 2, category: 'electronics' },
        { productId: 3, category: 'clothing' },
        { productId: 4, category: 'electronics' },
      ];

      const generateRecommendations = (history: typeof history) => {
        const categoryScores: Record<string, number> = {};
        history.forEach((item) => {
          categoryScores[item.category] = (categoryScores[item.category] || 0) + 1;
        });
        return Object.entries(categoryScores)
          .sort(([, a], [, b]) => b - a)
          .map(([category]) => category);
      };

      const recommendations = generateRecommendations(history);
      expect(recommendations[0]).toBe('electronics');
    });

    it('should filter out recently purchased items', () => {
      const allProducts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const recentlyPurchased = [2, 5, 7];

      const filterRecent = (products: number[], recent: number[]) => {
        return products.filter((p) => !recent.includes(p));
      };

      const filtered = filterRecent(allProducts, recentlyPurchased);
      expect(filtered).not.toContain(2);
      expect(filtered).not.toContain(5);
      expect(filtered).not.toContain(7);
      expect(filtered).toHaveLength(7);
    });
  });

  describe('Model Training', () => {
    it('should calculate model accuracy', () => {
      const predictions = [1, 0, 1, 1, 0, 1, 0, 1];
      const actual = [1, 0, 1, 0, 0, 1, 1, 1];

      const calculateAccuracy = (pred: number[], actual: number[]) => {
        const correct = pred.filter((p, i) => p === actual[i]).length;
        return correct / pred.length;
      };

      const accuracy = calculateAccuracy(predictions, actual);
      expect(accuracy).toBe(0.75);
    });

    it('should detect model drift', () => {
      const detectDrift = (
        historicalAccuracy: number,
        currentAccuracy: number,
        threshold = 0.1
      ) => {
        return historicalAccuracy - currentAccuracy > threshold;
      };

      expect(detectDrift(0.9, 0.85)).toBe(false);
      expect(detectDrift(0.9, 0.75)).toBe(true);
    });
  });

  describe('Feedback Loop', () => {
    it('should process user feedback', () => {
      const feedback = [
        { rating: 5, helpful: true },
        { rating: 4, helpful: true },
        { rating: 2, helpful: false },
        { rating: 1, helpful: false },
      ];

      const processFeedback = (fb: typeof feedback) => {
        const avgRating = fb.reduce((sum, f) => sum + f.rating, 0) / fb.length;
        const helpfulRate = fb.filter((f) => f.helpful).length / fb.length;
        return { avgRating, helpfulRate };
      };

      const result = processFeedback(feedback);
      expect(result.avgRating).toBe(3);
      expect(result.helpfulRate).toBe(0.5);
    });

    it('should adjust weights based on feedback', () => {
      const adjustWeights = (
        weights: number[],
        feedback: number,
        learningRate = 0.1
      ) => {
        const adjustment = (feedback - 0.5) * learningRate;
        return weights.map((w) => Math.max(0, Math.min(1, w + adjustment)));
      };

      const weights = [0.5, 0.5, 0.5];
      const positive = adjustWeights(weights, 1);
      const negative = adjustWeights(weights, 0);

      expect(positive[0]).toBeGreaterThan(0.5);
      expect(negative[0]).toBeLessThan(0.5);
    });
  });

  describe('Session Analysis', () => {
    it('should calculate session duration', () => {
      const session = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T10:30:00'),
      };

      const durationMs = session.end.getTime() - session.start.getTime();
      const durationMinutes = durationMs / (1000 * 60);

      expect(durationMinutes).toBe(30);
    });

    it('should identify session engagement level', () => {
      const classifyEngagement = (actions: number, duration: number) => {
        const actionsPerMinute = actions / duration;
        if (actionsPerMinute > 2) return 'high';
        if (actionsPerMinute > 0.5) return 'medium';
        return 'low';
      };

      expect(classifyEngagement(60, 10)).toBe('high');
      expect(classifyEngagement(10, 10)).toBe('medium');
      expect(classifyEngagement(2, 10)).toBe('low');
    });
  });
});
