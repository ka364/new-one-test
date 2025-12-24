/**
 * Scoring Engine
 * 
 * Unified scoring system for:
 * - Anomaly detection
 * - Price adjustments
 * - Route quality
 * - Risk assessment
 * 
 * يقلل ~80 سطر من التكرار عبر الـ modules
 */

export interface ScoringRule {
    id: string;
    name: string;
    threshold: number;
    weight: number;
    condition: (value: number) => boolean;
    description?: string;
}

export interface ScoringCategory {
    name: string;
    maxScore: number;
    rules: ScoringRule[];
}

/**
 * Unified Scoring Engine
 * 
 * Provides consistent scoring across all modules
 */
export class ScoringEngine {
    private categories: Map<string, ScoringCategory> = new Map();
    private scoreHistory: Map<string, number[]> = new Map();

    /**
     * Register scoring category with rules
     */
    public registerCategory(
        categoryName: string,
        maxScore: number = 100,
        rules: ScoringRule[] = []
    ): void {
        this.categories.set(categoryName, {
            name: categoryName,
            maxScore,
            rules
        });
    }

    /**
     * Add rules to existing category
     */
    public addRules(categoryName: string, rules: ScoringRule[]): void {
        const category = this.categories.get(categoryName);
        if (!category) {
            throw new Error(`Category "${categoryName}" not found. Register it first.`);
        }
        category.rules.push(...rules);
    }

    /**
     * Calculate score for a value
     * 
     * Returns normalized score (0-100)
     */
    public calculateScore(categoryName: string, value: number): number {
        const category = this.categories.get(categoryName);

        if (!category) {
            console.warn(`[ScoringEngine] Category "${categoryName}" not found`);
            return 0;
        }

        let totalScore = 0;

        for (const rule of category.rules) {
            if (rule.condition(value)) {
                totalScore += rule.weight;
            }
        }

        // Normalize to max score
        const normalizedScore = Math.min(totalScore, category.maxScore);

        // Store in history
        if (!this.scoreHistory.has(categoryName)) {
            this.scoreHistory.set(categoryName, []);
        }
        this.scoreHistory.get(categoryName)!.push(normalizedScore);

        return normalizedScore;
    }

    /**
     * Calculate multi-factor score
     * 
     * Combines multiple values with weighted rules
     */
    public calculateMultiFactorScore(
        categoryName: string,
        factors: Record<string, number>,
        factorWeights?: Record<string, number>
    ): number {
        const category = this.categories.get(categoryName);

        if (!category) {
            console.warn(`[ScoringEngine] Category "${categoryName}" not found`);
            return 0;
        }

        const weights = factorWeights || {};
        let totalScore = 0;
        let totalWeight = 0;

        for (const [factorName, value] of Object.entries(factors)) {
            const weight = weights[factorName] || 1;
            let factorScore = 0;

            for (const rule of category.rules) {
                if (rule.condition(value)) {
                    factorScore += rule.weight;
                }
            }

            totalScore += factorScore * weight;
            totalWeight += weight;
        }

        const normalizedScore = totalWeight > 0
            ? Math.min((totalScore / totalWeight), category.maxScore)
            : 0;

        return normalizedScore;
    }

    /**
     * Get statistical analysis of scores
     */
    public getScoreAnalysis(categoryName: string) {
        const scores = this.scoreHistory.get(categoryName) || [];

        if (scores.length === 0) {
            return { samples: 0, average: 0, min: 0, max: 0, stdDev: 0 };
        }

        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const variance =
            scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) /
            scores.length;
        const stdDev = Math.sqrt(variance);

        return {
            samples: scores.length,
            average: Math.round(average * 100) / 100,
            min,
            max,
            stdDev: Math.round(stdDev * 100) / 100
        };
    }

    /**
     * Clear score history
     */
    public clearHistory(categoryName?: string): void {
        if (categoryName) {
            this.scoreHistory.delete(categoryName);
        } else {
            this.scoreHistory.clear();
        }
    }

    /**
     * Get all registered categories
     */
    public getCategories(): string[] {
        return Array.from(this.categories.keys());
    }

    /**
     * Get category rules
     */
    public getCategoryRules(categoryName: string): ScoringRule[] {
        const category = this.categories.get(categoryName);
        return category?.rules || [];
    }
}

/**
 * Pre-configured scoring rules
 */
export const PREDEFINED_RULES = {
    // Transaction anomaly detection rules
    TRANSACTION_ANOMALY: {
        LARGE_AMOUNT: {
            id: "txn_large_amt",
            name: "Large Amount",
            threshold: 10000,
            weight: 30,
            condition: (amount: number) => amount > 10000,
            description: "Transaction amount exceeds 10,000"
        } as ScoringRule,

        MEDIUM_AMOUNT: {
            id: "txn_medium_amt",
            name: "Medium Amount",
            threshold: 5000,
            weight: 15,
            condition: (amount: number) => amount > 5000,
            description: "Transaction amount exceeds 5,000"
        } as ScoringRule,

        ROUND_NUMBER: {
            id: "txn_round_num",
            name: "Round Number",
            threshold: 1000,
            weight: 20,
            condition: (amount: number) => amount >= 1000 && amount % 1000 === 0,
            description: "Amount is a round number (potential manipulation)"
        } as ScoringRule,

        MISSING_DESCRIPTION: {
            id: "txn_no_desc",
            name: "Missing Description",
            threshold: 0,
            weight: 15,
            condition: () => true, // Check externally
            description: "Transaction lacks proper description"
        } as ScoringRule
    },

    // Price adjustment rules
    PRICE_ADJUSTMENT: {
        HIGH_DEMAND: {
            id: "price_high_demand",
            name: "High Demand",
            threshold: 80,
            weight: 20,
            condition: (demand: number) => demand > 80,
            description: "Demand exceeds 80 (justify price increase)"
        } as ScoringRule,

        MEDIUM_DEMAND: {
            id: "price_medium_demand",
            name: "Medium Demand",
            threshold: 50,
            weight: 10,
            condition: (demand: number) => demand > 50,
            description: "Demand between 50-80"
        } as ScoringRule,

        HIGH_COMPETITION: {
            id: "price_high_comp",
            name: "High Competition",
            threshold: 80,
            weight: 15,
            condition: (competition: number) => competition > 80,
            description: "High competition (justify price decrease)"
        } as ScoringRule
    },

    // Route quality rules
    ROUTE_QUALITY: {
        SHORT_DISTANCE: {
            id: "route_short",
            name: "Short Distance",
            threshold: 10,
            weight: 30,
            condition: (distance: number) => distance < 10,
            description: "Short delivery distance (<10km)"
        } as ScoringRule,

        OPTIMAL_STOPS: {
            id: "route_optimal_stops",
            name: "Optimal Stops",
            threshold: 15,
            weight: 25,
            condition: (stops: number) => stops > 0 && stops <= 15,
            description: "Optimal number of delivery stops"
        } as ScoringRule,

        LOW_COST: {
            id: "route_low_cost",
            name: "Low Cost",
            threshold: 100,
            weight: 20,
            condition: (cost: number) => cost < 100,
            description: "Low delivery cost"
        } as ScoringRule
    }
};

// Export singleton instance
export const scoringEngine = new ScoringEngine();

// Pre-register common categories
scoringEngine.registerCategory("transaction_anomaly", 100, [
    PREDEFINED_RULES.TRANSACTION_ANOMALY.LARGE_AMOUNT,
    PREDEFINED_RULES.TRANSACTION_ANOMALY.MEDIUM_AMOUNT,
    PREDEFINED_RULES.TRANSACTION_ANOMALY.ROUND_NUMBER,
    PREDEFINED_RULES.TRANSACTION_ANOMALY.MISSING_DESCRIPTION
]);

scoringEngine.registerCategory("price_adjustment", 100, [
    PREDEFINED_RULES.PRICE_ADJUSTMENT.HIGH_DEMAND,
    PREDEFINED_RULES.PRICE_ADJUSTMENT.MEDIUM_DEMAND,
    PREDEFINED_RULES.PRICE_ADJUSTMENT.HIGH_COMPETITION
]);

scoringEngine.registerCategory("route_quality", 100, [
    PREDEFINED_RULES.ROUTE_QUALITY.SHORT_DISTANCE,
    PREDEFINED_RULES.ROUTE_QUALITY.OPTIMAL_STOPS,
    PREDEFINED_RULES.ROUTE_QUALITY.LOW_COST
]);
