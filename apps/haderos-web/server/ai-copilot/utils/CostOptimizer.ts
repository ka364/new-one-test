/**
 * 💰 COST OPTIMIZER
 *
 * محسن التكاليف - يختار أفضل نموذج AI حسب المهمة
 *
 * استراتيجية التحسين:
 * 1. المهام البسيطة → DeepSeek (87% أرخص)
 * 2. المهام المعقدة → GPT-4 (إذا لزم الأمر)
 * 3. المهام المتوسطة → DeepSeek أو GPT-3.5
 */

import { DeepSeekProvider } from '../providers/DeepSeekProvider';

export interface Task {
  type: 'simple' | 'medium' | 'complex';
  description: string;
  estimatedTokens: number;
  priority: 'low' | 'medium' | 'high';
}

export interface ModelRecommendation {
  model: 'deepseek' | 'gpt-3.5' | 'gpt-4';
  reason: string;
  estimatedCost: number;
  alternative?: {
    model: string;
    cost: number;
    savings: number;
  };
}

export interface CostAnalysis {
  totalTasks: number;
  totalCost: number;
  costByModel: {
    deepseek: number;
    gpt35: number;
    gpt4: number;
  };
  savings: number;
  savingsPercentage: number;
  recommendations: string[];
}

export class CostOptimizer {
  private deepseek: DeepSeekProvider;

  // Pricing per 1M tokens (average of input/output)
  private readonly PRICING = {
    deepseek: 0.21, // ($0.14 + $0.28) / 2
    gpt35: 1.0, // ~$1/M average
    gpt4: 30.0, // ~$30/M average
    gpt4turbo: 15.0, // ~$15/M average
  };

  constructor(deepseekApiKey: string) {
    this.deepseek = new DeepSeekProvider({ apiKey: deepseekApiKey });
  }

  /**
   * توصية بأفضل نموذج للمهمة
   */
  recommendModel(task: Task): ModelRecommendation {
    const tokens = task.estimatedTokens;

    // Simple tasks → Always DeepSeek (cheapest)
    if (task.type === 'simple') {
      const deepseekCost = (tokens / 1_000_000) * this.PRICING.deepseek;
      const gpt35Cost = (tokens / 1_000_000) * this.PRICING.gpt35;

      return {
        model: 'deepseek',
        reason: 'Simple task - DeepSeek is perfect and 87% cheaper',
        estimatedCost: deepseekCost,
        alternative: {
          model: 'gpt-3.5',
          cost: gpt35Cost,
          savings: ((gpt35Cost - deepseekCost) / gpt35Cost) * 100,
        },
      };
    }

    // Medium tasks → DeepSeek unless high priority
    if (task.type === 'medium') {
      if (task.priority === 'high') {
        const gpt4Cost = (tokens / 1_000_000) * this.PRICING.gpt4turbo;
        const deepseekCost = (tokens / 1_000_000) * this.PRICING.deepseek;

        return {
          model: 'gpt-4',
          reason: 'High priority medium task - GPT-4 Turbo for best quality',
          estimatedCost: gpt4Cost,
          alternative: {
            model: 'deepseek',
            cost: deepseekCost,
            savings: ((gpt4Cost - deepseekCost) / gpt4Cost) * 100,
          },
        };
      } else {
        const deepseekCost = (tokens / 1_000_000) * this.PRICING.deepseek;
        const gpt35Cost = (tokens / 1_000_000) * this.PRICING.gpt35;

        return {
          model: 'deepseek',
          reason: 'Medium task - DeepSeek handles well at 79% lower cost',
          estimatedCost: deepseekCost,
          alternative: {
            model: 'gpt-3.5',
            cost: gpt35Cost,
            savings: ((gpt35Cost - deepseekCost) / gpt35Cost) * 100,
          },
        };
      }
    }

    // Complex tasks → GPT-4 if critical, otherwise DeepSeek
    if (task.type === 'complex') {
      if (task.priority === 'high') {
        const gpt4Cost = (tokens / 1_000_000) * this.PRICING.gpt4;
        const deepseekCost = (tokens / 1_000_000) * this.PRICING.deepseek;

        return {
          model: 'gpt-4',
          reason: 'Complex high-priority task - GPT-4 for maximum accuracy',
          estimatedCost: gpt4Cost,
          alternative: {
            model: 'deepseek',
            cost: deepseekCost,
            savings: ((gpt4Cost - deepseekCost) / gpt4Cost) * 100,
          },
        };
      } else {
        const deepseekCost = (tokens / 1_000_000) * this.PRICING.deepseek;
        const gpt4Cost = (tokens / 1_000_000) * this.PRICING.gpt4turbo;

        return {
          model: 'deepseek',
          reason: 'Complex task but not critical - DeepSeek saves 98.6% vs GPT-4',
          estimatedCost: deepseekCost,
          alternative: {
            model: 'gpt-4-turbo',
            cost: gpt4Cost,
            savings: ((gpt4Cost - deepseekCost) / gpt4Cost) * 100,
          },
        };
      }
    }

    // Default to DeepSeek
    return {
      model: 'deepseek',
      reason: 'Default to most cost-effective option',
      estimatedCost: (tokens / 1_000_000) * this.PRICING.deepseek,
    };
  }

  /**
   * تحليل تكاليف مجموعة من المهام
   */
  analyzeCosts(tasks: Task[]): CostAnalysis {
    let totalCostOptimized = 0;
    let totalCostGPT35 = 0;
    let totalCostGPT4 = 0;

    const costByModel = {
      deepseek: 0,
      gpt35: 0,
      gpt4: 0,
    };

    const recommendations: string[] = [];

    for (const task of tasks) {
      const recommendation = this.recommendModel(task);
      const tokens = task.estimatedTokens;

      // Actual cost with optimization
      totalCostOptimized += recommendation.estimatedCost;

      // Cost if we used GPT-3.5 for everything
      totalCostGPT35 += (tokens / 1_000_000) * this.PRICING.gpt35;

      // Cost if we used GPT-4 for everything
      totalCostGPT4 += (tokens / 1_000_000) * this.PRICING.gpt4;

      // Track by model
      if (recommendation.model === 'deepseek') {
        costByModel.deepseek += recommendation.estimatedCost;
      } else if (recommendation.model === 'gpt-3.5') {
        costByModel.gpt35 += recommendation.estimatedCost;
      } else {
        costByModel.gpt4 += recommendation.estimatedCost;
      }

      recommendations.push(
        `${task.description}: ${recommendation.model} ($${recommendation.estimatedCost.toFixed(4)})`
      );
    }

    const savings = totalCostGPT35 - totalCostOptimized;
    const savingsPercentage = (savings / totalCostGPT35) * 100;

    return {
      totalTasks: tasks.length,
      totalCost: totalCostOptimized,
      costByModel,
      savings,
      savingsPercentage,
      recommendations,
    };
  }

  /**
   * محاكاة تكاليف شهرية
   */
  simulateMonthlyUsage(dailyTasks: Task[]): {
    daily: number;
    weekly: number;
    monthly: number;
    savings: {
      vsGPT35: number;
      vsGPT4: number;
    };
  } {
    const analysis = this.analyzeCosts(dailyTasks);

    const daily = analysis.totalCost;
    const weekly = daily * 7;
    const monthly = daily * 30;

    // Calculate what it would cost with GPT-3.5 and GPT-4
    const gpt35Monthly =
      dailyTasks.reduce((sum, task) => {
        return sum + (task.estimatedTokens / 1_000_000) * this.PRICING.gpt35;
      }, 0) * 30;

    const gpt4Monthly =
      dailyTasks.reduce((sum, task) => {
        return sum + (task.estimatedTokens / 1_000_000) * this.PRICING.gpt4;
      }, 0) * 30;

    return {
      daily,
      weekly,
      monthly,
      savings: {
        vsGPT35: ((gpt35Monthly - monthly) / gpt35Monthly) * 100,
        vsGPT4: ((gpt4Monthly - monthly) / gpt4Monthly) * 100,
      },
    };
  }

  /**
   * توليد تقرير تحسين التكاليف
   */
  generateCostReport(tasks: Task[]): string {
    const analysis = this.analyzeCosts(tasks);
    const simulation = this.simulateMonthlyUsage(tasks);

    return `
# 💰 Cost Optimization Report

## 📊 Task Analysis

- **Total Tasks**: ${analysis.totalTasks}
- **Optimized Cost**: $${analysis.totalCost.toFixed(4)}
- **Would cost with GPT-3.5**: $${(analysis.totalCost + analysis.savings).toFixed(4)}
- **Savings**: $${analysis.savings.toFixed(4)} (${analysis.savingsPercentage.toFixed(1)}%)

## 🎯 Model Distribution

- **DeepSeek**: $${analysis.costByModel.deepseek.toFixed(4)}
- **GPT-3.5**: $${analysis.costByModel.gpt35.toFixed(4)}
- **GPT-4**: $${analysis.costByModel.gpt4.toFixed(4)}

## 📈 Monthly Projection

### Current Daily Usage
- **Daily Cost**: $${simulation.daily.toFixed(4)}
- **Weekly Cost**: $${simulation.weekly.toFixed(4)}
- **Monthly Cost**: $${simulation.monthly.toFixed(4)}

### Savings vs Alternatives
- **vs GPT-3.5**: ${simulation.savings.vsGPT35.toFixed(1)}% cheaper
- **vs GPT-4**: ${simulation.savings.vsGPT4.toFixed(1)}% cheaper

## 💡 Recommendations

${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## 🎉 Bottom Line

By using smart model selection with DeepSeek as the primary model:
- **Save ${simulation.savings.vsGPT35.toFixed(1)}% compared to GPT-3.5 only**
- **Save ${simulation.savings.vsGPT4.toFixed(1)}% compared to GPT-4 only**
- **Monthly savings: $${((analysis.totalCost + analysis.savings) * 30 - simulation.monthly).toFixed(2)}**

---
*Generated by HADEROS Cost Optimizer*
    `.trim();
  }

  /**
   * اقتراحات لتقليل التكاليف
   */
  suggestCostReductions(currentMonthlySpend: number): string[] {
    const suggestions: string[] = [];

    if (currentMonthlySpend > 100) {
      suggestions.push('🔴 HIGH COST ALERT: Consider using DeepSeek for 80%+ of tasks → Save ~87%');
    }

    if (currentMonthlySpend > 50) {
      suggestions.push('🟡 Batch similar tasks together to reduce API calls');
      suggestions.push('🟡 Cache common analysis results');
      suggestions.push('🟡 Use DeepSeek for code analysis, reviews, and test generation');
    }

    suggestions.push(
      '✅ DeepSeek is excellent for: Code analysis, testing, reviews, documentation'
    );
    suggestions.push(
      '✅ Reserve GPT-4 for: Critical decisions, complex reasoning, important content'
    );
    suggestions.push('💡 Monitor token usage and adjust max_tokens to avoid waste');

    return suggestions;
  }
}
