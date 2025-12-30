/**
 * Scoring Engine
 * 
 * Unified scoring system for all Bio-Modules
 * Eliminates ~80 lines of duplicated scoring logic across modules
 */

/**
 * Scoring Rule
 */
export interface ScoringRule {
  threshold: number;
  weight: number;
  condition: (value: number) => boolean;
  description?: string;
}

/**
 * Scoring Category
 */
export interface ScoringCategory {
  name: string;
  maxScore: number;
  rules: ScoringRule[];
  statistics: {
    totalScores: number;
    averageScore: number;
    minScore: number;
    maxScore: number;
    lastScore: number;
  };
}

/**
 * Scoring Result
 */
export interface ScoringResult {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  matchedRules: Array<{
    threshold: number;
    weight: number;
    description?: string;
  }>;
}

/**
 * Unified Scoring Engine
 */
export class ScoringEngine {
  private categories: Map<string, ScoringCategory> = new Map();

  /**
   * Register a new scoring category
   */
  public registerCategory(
    name: string,
    maxScore: number,
    rules: ScoringRule[]
  ): void {
    this.categories.set(name, {
      name,
      maxScore,
      rules,
      statistics: {
        totalScores: 0,
        averageScore: 0,
        minScore: Infinity,
        maxScore: -Infinity,
        lastScore: 0,
      },
    });
  }

  /**
   * Calculate score for a value in a category
   */
  public calculateScore(category: string, value: number): number {
    const cat = this.categories.get(category);
    if (!cat) {
      throw new Error(`Unknown scoring category: ${category}`);
    }

    let score = 0;
    for (const rule of cat.rules) {
      if (rule.condition(value)) {
        score += rule.weight;
      }
    }

    // Cap score at maxScore
    score = Math.min(score, cat.maxScore);

    // Update statistics
    this.updateStatistics(category, score);

    return score;
  }

  /**
   * Calculate detailed score with matched rules
   */
  public calculateDetailedScore(
    category: string,
    value: number
  ): ScoringResult {
    const cat = this.categories.get(category);
    if (!cat) {
      throw new Error(`Unknown scoring category: ${category}`);
    }

    let score = 0;
    const matchedRules: Array<{
      threshold: number;
      weight: number;
      description?: string;
    }> = [];

    for (const rule of cat.rules) {
      if (rule.condition(value)) {
        score += rule.weight;
        matchedRules.push({
          threshold: rule.threshold,
          weight: rule.weight,
          description: rule.description,
        });
      }
    }

    // Cap score at maxScore
    score = Math.min(score, cat.maxScore);

    // Update statistics
    this.updateStatistics(category, score);

    return {
      category,
      score,
      maxScore: cat.maxScore,
      percentage: (score / cat.maxScore) * 100,
      matchedRules,
    };
  }

  /**
   * Update category statistics
   */
  private updateStatistics(category: string, score: number): void {
    const cat = this.categories.get(category);
    if (!cat) return;

    const stats = cat.statistics;
    stats.totalScores++;
    stats.lastScore = score;
    stats.minScore = Math.min(stats.minScore, score);
    stats.maxScore = Math.max(stats.maxScore, score);
    
    // Update average (running average)
    stats.averageScore =
      (stats.averageScore * (stats.totalScores - 1) + score) /
      stats.totalScores;
  }

  /**
   * Get category statistics
   */
  public getStatistics(category: string) {
    const cat = this.categories.get(category);
    if (!cat) {
      throw new Error(`Unknown scoring category: ${category}`);
    }

    return { ...cat.statistics };
  }

  /**
   * Get all categories
   */
  public getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Reset statistics for a category
   */
  public resetStatistics(category: string): void {
    const cat = this.categories.get(category);
    if (!cat) return;

    cat.statistics = {
      totalScores: 0,
      averageScore: 0,
      minScore: Infinity,
      maxScore: -Infinity,
      lastScore: 0,
    };
  }
}

/**
 * Global Scoring Engine Instance
 */
export const scoringEngine = new ScoringEngine();

/**
 * Predefined Scoring Categories
 */

// Transaction Anomaly Detection (Arachnid)
scoringEngine.registerCategory("transaction_anomaly", 100, [
  {
    threshold: 10000,
    weight: 30,
    condition: (amount) => amount > 10000,
    description: "Very high transaction amount",
  },
  {
    threshold: 5000,
    weight: 15,
    condition: (amount) => amount > 5000 && amount <= 10000,
    description: "High transaction amount",
  },
  {
    threshold: 2000,
    weight: 10,
    condition: (amount) => amount > 2000 && amount <= 5000,
    description: "Moderate transaction amount",
  },
  {
    threshold: 1000,
    weight: 5,
    condition: (amount) => amount > 1000 && amount <= 2000,
    description: "Slightly elevated amount",
  },
]);

// Price Adjustment (Chameleon)
scoringEngine.registerCategory("price_adjustment", 100, [
  {
    threshold: 80,
    weight: 20,
    condition: (demand) => demand > 80,
    description: "Very high demand - increase price",
  },
  {
    threshold: 60,
    weight: 10,
    condition: (demand) => demand > 60 && demand <= 80,
    description: "High demand - moderate increase",
  },
  {
    threshold: 40,
    weight: 0,
    condition: (demand) => demand >= 40 && demand <= 60,
    description: "Normal demand - no change",
  },
  {
    threshold: 20,
    weight: -10,
    condition: (demand) => demand >= 20 && demand < 40,
    description: "Low demand - decrease price",
  },
  {
    threshold: 0,
    weight: -20,
    condition: (demand) => demand < 20,
    description: "Very low demand - significant decrease",
  },
]);

// Route Quality (Ant)
scoringEngine.registerCategory("route_quality", 100, [
  {
    threshold: 10,
    weight: -30,
    condition: (distance) => distance > 100,
    description: "Very long route - poor quality",
  },
  {
    threshold: 50,
    weight: -15,
    condition: (distance) => distance > 50 && distance <= 100,
    description: "Long route - below average",
  },
  {
    threshold: 20,
    weight: 0,
    condition: (distance) => distance >= 20 && distance <= 50,
    description: "Medium route - average quality",
  },
  {
    threshold: 10,
    weight: 15,
    condition: (distance) => distance >= 10 && distance < 20,
    description: "Short route - good quality",
  },
  {
    threshold: 0,
    weight: 30,
    condition: (distance) => distance < 10,
    description: "Very short route - excellent quality",
  },
]);

// System Health (Tardigrade)
scoringEngine.registerCategory("system_health", 100, [
  {
    threshold: 90,
    weight: 30,
    condition: (health) => health >= 90,
    description: "Excellent health",
  },
  {
    threshold: 70,
    weight: 20,
    condition: (health) => health >= 70 && health < 90,
    description: "Good health",
  },
  {
    threshold: 50,
    weight: 10,
    condition: (health) => health >= 50 && health < 70,
    description: "Fair health",
  },
  {
    threshold: 30,
    weight: 5,
    condition: (health) => health >= 30 && health < 50,
    description: "Poor health",
  },
  {
    threshold: 0,
    weight: 0,
    condition: (health) => health < 30,
    description: "Critical health",
  },
]);

// Resource Distribution (Mycelium)
scoringEngine.registerCategory("resource_distribution", 100, [
  {
    threshold: 90,
    weight: 30,
    condition: (balance) => balance >= 90,
    description: "Excellent balance",
  },
  {
    threshold: 70,
    weight: 20,
    condition: (balance) => balance >= 70 && balance < 90,
    description: "Good balance",
  },
  {
    threshold: 50,
    weight: 10,
    condition: (balance) => balance >= 50 && balance < 70,
    description: "Fair balance",
  },
  {
    threshold: 30,
    weight: 5,
    condition: (balance) => balance >= 30 && balance < 50,
    description: "Poor balance",
  },
  {
    threshold: 0,
    weight: 0,
    condition: (balance) => balance < 30,
    description: "Critical imbalance",
  },
]);
