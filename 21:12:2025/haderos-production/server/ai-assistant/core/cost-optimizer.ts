/**
 * Cost-Optimized AI Orchestration
 * Intelligently selects AI providers to minimize costs while maintaining quality
 */

import { AIClient, AIProvider, AIMessage, AIResponse } from './ai-client';

export interface CostOptimizationConfig {
  monthlyBudget: number; // in USD
  preferFreeProviders: boolean;
  qualityThreshold: number; // 0-1, minimum acceptable quality
}

export interface UsageStats {
  provider: AIProvider;
  requests: number;
  estimatedCost: number;
  successRate: number;
}

export class CostOptimizedOrchestrator {
  private aiClient: AIClient;
  private config: CostOptimizationConfig;
  private monthlyUsage: Map<AIProvider, UsageStats>;
  private currentMonth: string;

  // Cost per 1K tokens (approximate)
  private readonly COST_PER_1K_TOKENS: Record<AIProvider, number> = {
    deepseek: 0, // Free!
    gemini: 0.0005,
    anthropic: 0.015,
    openai: 0.03,
    grok: 0.01, // Estimated
  };

  constructor(config?: Partial<CostOptimizationConfig>) {
    this.aiClient = new AIClient();
    this.config = {
      monthlyBudget: 100,
      preferFreeProviders: true,
      qualityThreshold: 0.7,
      ...config,
    };
    this.monthlyUsage = new Map();
    this.currentMonth = this.getCurrentMonth();
    this.initializeUsageTracking();
  }

  /**
   * Execute a task with cost optimization
   */
  async executeOptimized(
    messages: AIMessage[],
    options?: {
      taskType?: string;
      requireHighQuality?: boolean;
      maxCost?: number;
    }
  ): Promise<AIResponse> {
    // Reset usage if new month
    this.checkAndResetMonth();

    // Strategy 1: Try free provider first (DeepSeek)
    if (this.config.preferFreeProviders && !options?.requireHighQuality) {
      try {
        const result = await this.tryFreeProvider(messages);
        if (result) {
          this.updateUsage('deepseek', 0, true);
          return result;
        }
      } catch (error) {
        console.log('Free provider failed, trying paid providers...');
      }
    }

    // Strategy 2: Select best paid provider based on task type and budget
    const provider = this.selectPaidProvider(options?.taskType, options?.maxCost);
    
    // Check budget
    if (!this.canAfford(provider, 2000)) { // Assume 2000 tokens average
      throw new Error(`Monthly budget exceeded. Current usage: $${this.getTotalCost().toFixed(2)}`);
    }

    // Execute with selected provider
    const result = await this.aiClient.chat(messages, provider, {
      temperature: 0.3,
      maxTokens: 4000,
    });

    // Update usage
    const cost = this.calculateCost(provider, result.tokensUsed || 2000);
    this.updateUsage(provider, cost, true);

    return result;
  }

  /**
   * Try free provider (DeepSeek)
   */
  private async tryFreeProvider(messages: AIMessage[]): Promise<AIResponse | null> {
    const availableProviders = this.aiClient.getAvailableProviders();
    
    if (!availableProviders.includes('deepseek')) {
      return null;
    }

    try {
      const result = await this.aiClient.chat(messages, 'deepseek', {
        temperature: 0.3,
        maxTokens: 4000,
      });

      // Validate quality (simple heuristic: check if response is not empty and has reasonable length)
      if (result.content && result.content.length > 50) {
        return result;
      }

      return null;
    } catch (error) {
      console.error('DeepSeek error:', error);
      return null;
    }
  }

  /**
   * Select best paid provider based on task type and budget
   */
  private selectPaidProvider(taskType?: string, maxCost?: number): AIProvider {
    const availableProviders = this.aiClient.getAvailableProviders()
      .filter(p => p !== 'deepseek'); // Exclude free provider

    if (availableProviders.length === 0) {
      throw new Error('No paid AI providers available');
    }

    // Task-specific provider selection
    const taskProviderMap: Record<string, AIProvider> = {
      'code-review': 'openai',
      'test-generation': 'openai',
      'security-audit': 'gemini', // Gemini is good for security and cheap
      'performance-analysis': 'openai',
      'documentation': 'anthropic', // Claude is great for writing
      'creative': 'anthropic',
      'data-analysis': 'grok',
    };

    let preferredProvider = taskProviderMap[taskType || ''] || 'openai';

    // Check if preferred provider is available
    if (!availableProviders.includes(preferredProvider)) {
      preferredProvider = availableProviders[0];
    }

    // Check cost constraint
    if (maxCost !== undefined) {
      const estimatedCost = this.COST_PER_1K_TOKENS[preferredProvider] * 2; // Assume 2K tokens
      if (estimatedCost > maxCost) {
        // Find cheaper alternative
        const cheaperProvider = availableProviders
          .filter(p => this.COST_PER_1K_TOKENS[p] * 2 <= maxCost)
          .sort((a, b) => this.COST_PER_1K_TOKENS[b] - this.COST_PER_1K_TOKENS[a])[0];
        
        if (cheaperProvider) {
          preferredProvider = cheaperProvider;
        }
      }
    }

    return preferredProvider;
  }

  /**
   * Calculate cost for a request
   */
  private calculateCost(provider: AIProvider, tokens: number): number {
    return (tokens / 1000) * this.COST_PER_1K_TOKENS[provider];
  }

  /**
   * Check if we can afford a request
   */
  private canAfford(provider: AIProvider, estimatedTokens: number): boolean {
    const estimatedCost = this.calculateCost(provider, estimatedTokens);
    const currentCost = this.getTotalCost();
    return (currentCost + estimatedCost) <= this.config.monthlyBudget;
  }

  /**
   * Get total cost for current month
   */
  private getTotalCost(): number {
    let total = 0;
    for (const stats of this.monthlyUsage.values()) {
      total += stats.estimatedCost;
    }
    return total;
  }

  /**
   * Update usage statistics
   */
  private updateUsage(provider: AIProvider, cost: number, success: boolean): void {
    const stats = this.monthlyUsage.get(provider) || {
      provider,
      requests: 0,
      estimatedCost: 0,
      successRate: 1,
    };

    stats.requests++;
    stats.estimatedCost += cost;
    stats.successRate = (stats.successRate * (stats.requests - 1) + (success ? 1 : 0)) / stats.requests;

    this.monthlyUsage.set(provider, stats);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): UsageStats[] {
    return Array.from(this.monthlyUsage.values());
  }

  /**
   * Get usage summary
   */
  getUsageSummary(): {
    totalCost: number;
    remainingBudget: number;
    totalRequests: number;
    providerBreakdown: UsageStats[];
  } {
    const totalCost = this.getTotalCost();
    const totalRequests = Array.from(this.monthlyUsage.values())
      .reduce((sum, stats) => sum + stats.requests, 0);

    return {
      totalCost,
      remainingBudget: this.config.monthlyBudget - totalCost,
      totalRequests,
      providerBreakdown: this.getUsageStats(),
    };
  }

  /**
   * Initialize usage tracking
   */
  private initializeUsageTracking(): void {
    const providers = this.aiClient.getAvailableProviders();
    for (const provider of providers) {
      if (!this.monthlyUsage.has(provider)) {
        this.monthlyUsage.set(provider, {
          provider,
          requests: 0,
          estimatedCost: 0,
          successRate: 1,
        });
      }
    }
  }

  /**
   * Get current month string
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Check and reset usage if new month
   */
  private checkAndResetMonth(): void {
    const currentMonth = this.getCurrentMonth();
    if (currentMonth !== this.currentMonth) {
      this.currentMonth = currentMonth;
      this.monthlyUsage.clear();
      this.initializeUsageTracking();
    }
  }
}
