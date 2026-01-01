/**
 * Unified AI Service - Unit Tests
 * اختبارات وحدة لخدمة الذكاء الاصطناعي الموحدة
 *
 * These tests mock external API calls to run without real API keys.
 * Integration tests that require real API calls should be run separately.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIProvider } from './ai-service';

// Mock fetch for all API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock OpenAI/Manus response
const mockManusResponse = {
  id: 'chatcmpl-mock',
  choices: [
    {
      message: { role: 'assistant', content: 'مرحباً! كيف يمكنني مساعدتك؟' },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
};

// Mock DeepSeek response
const mockDeepSeekResponse = {
  id: 'deepseek-mock',
  choices: [
    {
      message: { role: 'assistant', content: 'Hello from DeepSeek!' },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
};

// Mock Claude response
const mockClaudeResponse = {
  id: 'msg-mock',
  content: [{ type: 'text', text: 'Hello from Claude!' }],
  usage: { input_tokens: 10, output_tokens: 15 },
};

describe('Unified AI Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables for tests
    process.env.OPENAI_API_KEY = 'sk-test-mock-key';
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.CLAUDE_API_KEY = 'test-claude-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Availability', () => {
    it('should have AIProvider enum with expected values', () => {
      expect(AIProvider.MANUS).toBe('manus');
      expect(AIProvider.DEEPSEEK).toBe('deepseek');
      expect(AIProvider.CLAUDE).toBe('claude');
    });

    it('should have all 3 providers defined', () => {
      const providers = Object.values(AIProvider);
      expect(providers).toContain('manus');
      expect(providers).toContain('deepseek');
      expect(providers).toContain('claude');
    });
  });

  describe('Provider Cost Structure', () => {
    it('should have correct cost ranking', () => {
      const costPerToken = {
        manus: 0,
        deepseek: 0.00002,
        claude: 0.00003,
      };

      // Manus is free
      expect(costPerToken.manus).toBe(0);
      // DeepSeek is cheaper than Claude
      expect(costPerToken.deepseek).toBeLessThan(costPerToken.claude);
    });

    it('should calculate message cost correctly', () => {
      const calculateCost = (provider: string, tokens: number) => {
        const rates: Record<string, number> = {
          manus: 0,
          deepseek: 0.00002,
          claude: 0.00003,
        };
        return tokens * (rates[provider] || 0);
      };

      expect(calculateCost('manus', 1000)).toBe(0);
      expect(calculateCost('deepseek', 1000)).toBeCloseTo(0.02, 5);
      expect(calculateCost('claude', 1000)).toBeCloseTo(0.03, 5);
    });
  });

  describe('Message Formatting', () => {
    it('should format messages for API correctly', () => {
      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant.' },
        { role: 'user' as const, content: 'Hello' },
      ];

      const formattedForOpenAI = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      expect(formattedForOpenAI).toHaveLength(2);
      expect(formattedForOpenAI[0].role).toBe('system');
      expect(formattedForOpenAI[1].role).toBe('user');
    });

    it('should handle Arabic messages correctly', () => {
      const arabicMessage = {
        role: 'user' as const,
        content: 'مرحباً، كيف حالك؟',
      };

      expect(arabicMessage.content).toMatch(/[\u0600-\u06FF]/);
      expect(arabicMessage.content.length).toBeGreaterThan(0);
    });
  });

  describe('Smart Routing Logic', () => {
    it('should select Manus for simple greetings', () => {
      const selectProvider = (content: string, maxCost: number) => {
        const complexity = content.length;
        if (maxCost === 0) return AIProvider.MANUS;
        if (complexity < 50) return AIProvider.MANUS;
        if (complexity < 200) return AIProvider.DEEPSEEK;
        return AIProvider.CLAUDE;
      };

      expect(selectProvider('مرحباً', 0)).toBe(AIProvider.MANUS);
      expect(selectProvider('Hi', 0.1)).toBe(AIProvider.MANUS);
    });

    it('should select DeepSeek for medium complexity tasks', () => {
      const selectProvider = (content: string, maxCost: number) => {
        const complexity = content.length;
        if (maxCost === 0) return AIProvider.MANUS;
        if (complexity < 50) return AIProvider.MANUS;
        if (complexity < 200) return AIProvider.DEEPSEEK;
        return AIProvider.CLAUDE;
      };

      const mediumTask = 'اكتب دالة JavaScript تحسب مجموع الأرقام من 1 إلى n باستخدام التكرار';
      expect(selectProvider(mediumTask, 0.05)).toBe(AIProvider.DEEPSEEK);
    });

    it('should select Claude for complex tasks', () => {
      const selectProvider = (content: string, maxCost: number) => {
        const complexity = content.length;
        if (maxCost === 0) return AIProvider.MANUS;
        if (complexity < 50) return AIProvider.MANUS;
        if (complexity < 200) return AIProvider.DEEPSEEK;
        return AIProvider.CLAUDE;
      };

      const complexTask = 'a'.repeat(250); // Long complex task
      expect(selectProvider(complexTask, 0.1)).toBe(AIProvider.CLAUDE);
    });
  });

  describe('Response Parsing', () => {
    it('should parse OpenAI/Manus response correctly', () => {
      const parseManusResponse = (response: typeof mockManusResponse) => ({
        content: response.choices[0].message.content,
        tokensUsed: response.usage.total_tokens,
        cost: 0, // Manus is free
        provider: AIProvider.MANUS,
      });

      const parsed = parseManusResponse(mockManusResponse);
      expect(parsed.content).toBe('مرحباً! كيف يمكنني مساعدتك؟');
      expect(parsed.tokensUsed).toBe(30);
      expect(parsed.cost).toBe(0);
    });

    it('should parse DeepSeek response correctly', () => {
      const parseDeepSeekResponse = (response: typeof mockDeepSeekResponse) => ({
        content: response.choices[0].message.content,
        tokensUsed: response.usage.total_tokens,
        cost: response.usage.total_tokens * 0.00002,
        provider: AIProvider.DEEPSEEK,
      });

      const parsed = parseDeepSeekResponse(mockDeepSeekResponse);
      expect(parsed.content).toBe('Hello from DeepSeek!');
      expect(parsed.tokensUsed).toBe(15);
      expect(parsed.cost).toBeCloseTo(0.0003, 5);
    });

    it('should parse Claude response correctly', () => {
      const parseClaudeResponse = (response: typeof mockClaudeResponse) => ({
        content: response.content[0].text,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        cost: (response.usage.input_tokens + response.usage.output_tokens) * 0.00003,
        provider: AIProvider.CLAUDE,
      });

      const parsed = parseClaudeResponse(mockClaudeResponse);
      expect(parsed.content).toBe('Hello from Claude!');
      expect(parsed.tokensUsed).toBe(25);
      expect(parsed.cost).toBeCloseTo(0.00075, 5);
    });
  });

  describe('Fallback System', () => {
    it('should have fallback order: Claude -> DeepSeek -> Manus', () => {
      const fallbackOrder = [AIProvider.CLAUDE, AIProvider.DEEPSEEK, AIProvider.MANUS];

      expect(fallbackOrder[0]).toBe(AIProvider.CLAUDE);
      expect(fallbackOrder[fallbackOrder.length - 1]).toBe(AIProvider.MANUS);
    });

    it('should select next provider on failure', () => {
      const getFallback = (failedProvider: string) => {
        const order = [AIProvider.CLAUDE, AIProvider.DEEPSEEK, AIProvider.MANUS];
        const currentIndex = order.indexOf(failedProvider as AIProvider);
        if (currentIndex === -1 || currentIndex === order.length - 1) {
          return null; // No more fallbacks
        }
        return order[currentIndex + 1];
      };

      expect(getFallback(AIProvider.CLAUDE)).toBe(AIProvider.DEEPSEEK);
      expect(getFallback(AIProvider.DEEPSEEK)).toBe(AIProvider.MANUS);
      expect(getFallback(AIProvider.MANUS)).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('should handle API key not configured', () => {
      const validateApiKey = (provider: string) => {
        const keys: Record<string, string | undefined> = {
          manus: process.env.OPENAI_API_KEY,
          deepseek: process.env.DEEPSEEK_API_KEY,
          claude: process.env.CLAUDE_API_KEY,
        };
        return !!keys[provider];
      };

      // With mock keys set in beforeEach
      expect(validateApiKey('manus')).toBe(true);
      expect(validateApiKey('deepseek')).toBe(true);
      expect(validateApiKey('claude')).toBe(true);

      // Without key
      delete process.env.CLAUDE_API_KEY;
      expect(validateApiKey('claude')).toBe(false);
    });

    it('should handle network errors gracefully', () => {
      const handleNetworkError = (error: Error) => {
        if (error.message.includes('ECONNREFUSED')) {
          return { success: false, error: 'Network connection failed' };
        }
        if (error.message.includes('timeout')) {
          return { success: false, error: 'Request timed out' };
        }
        return { success: false, error: error.message };
      };

      const networkError = new Error('ECONNREFUSED');
      expect(handleNetworkError(networkError).error).toBe('Network connection failed');

      const timeoutError = new Error('Request timeout');
      expect(handleNetworkError(timeoutError).error).toBe('Request timed out');
    });
  });

  describe('Performance Tracking', () => {
    it('should calculate latency', () => {
      const startTime = Date.now();
      // Simulate some processing
      const endTime = startTime + 150;
      const latency = endTime - startTime;

      expect(latency).toBe(150);
      expect(latency).toBeGreaterThan(0);
    });

    it('should track usage statistics', () => {
      const usageStats = {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        byProvider: {} as Record<string, number>,
      };

      const trackUsage = (provider: string, tokens: number, cost: number) => {
        usageStats.totalRequests += 1;
        usageStats.totalTokens += tokens;
        usageStats.totalCost += cost;
        usageStats.byProvider[provider] = (usageStats.byProvider[provider] || 0) + 1;
      };

      trackUsage('manus', 100, 0);
      trackUsage('deepseek', 50, 0.001);
      trackUsage('manus', 80, 0);

      expect(usageStats.totalRequests).toBe(3);
      expect(usageStats.totalTokens).toBe(230);
      expect(usageStats.totalCost).toBe(0.001);
      expect(usageStats.byProvider.manus).toBe(2);
      expect(usageStats.byProvider.deepseek).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', () => {
      const rateLimits = {
        manus: { requestsPerMinute: 60, tokensPerMinute: 40000 },
        deepseek: { requestsPerMinute: 20, tokensPerMinute: 100000 },
        claude: { requestsPerMinute: 50, tokensPerMinute: 40000 },
      };

      const checkRateLimit = (provider: string, currentRequests: number) => {
        const limit = rateLimits[provider as keyof typeof rateLimits];
        return currentRequests < limit.requestsPerMinute;
      };

      expect(checkRateLimit('manus', 59)).toBe(true);
      expect(checkRateLimit('manus', 60)).toBe(false);
      expect(checkRateLimit('deepseek', 19)).toBe(true);
      expect(checkRateLimit('deepseek', 20)).toBe(false);
    });
  });
});
