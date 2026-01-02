import { describe, it, expect, beforeAll } from 'vitest';
import { UnifiedAIService, AIProvider } from './ai-service';

describe('Unified AI Service', () => {
  let aiService: UnifiedAIService;

  beforeAll(() => {
    aiService = new UnifiedAIService();
  });

  describe('Provider Availability', () => {
    it('should have at least Manus provider available', () => {
      const providers = aiService.getAvailableProviders();
      expect(providers).toContain(AIProvider.MANUS);
      expect(providers.length).toBeGreaterThanOrEqual(1);
    });

    it('should return provider info for all available providers', () => {
      const providers = aiService.getAvailableProviders();

      providers.forEach((provider) => {
        const info = aiService.getProviderInfo(provider);
        expect(info).toHaveProperty('name');
        expect(info).toHaveProperty('cost');
        expect(info).toHaveProperty('bestFor');
        expect(info).toHaveProperty('maxTokens');
      });
    });
  });

  describe('Manus invokeLLM', () => {
    it('should successfully call Manus invokeLLM', async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'قل "مرحباً" فقط',
        },
      ];

      const response = await aiService.invokeManusLLM(messages);

      expect(response).toHaveProperty('provider', AIProvider.MANUS);
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('cost', 0); // Manus is free
      expect(response).toHaveProperty('latency');
      expect(response.content).toBeTruthy();
      expect(typeof response.content).toBe('string');
    }, 15000); // 15 second timeout

    it('should have zero cost for Manus', async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'test',
        },
      ];

      const response = await aiService.invokeManusLLM(messages);
      expect(response.cost).toBe(0);
    }, 15000);
  });

  describe('Smart Routing', () => {
    it('should select Manus for simple tasks', async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'مرحباً',
        },
      ];

      const response = await aiService.generateResponse(messages, {
        autoSelect: true,
        maxCost: 0.1,
      });

      expect(response.provider).toBe(AIProvider.MANUS);
      expect(response.cost).toBe(0);
    }, 15000);

    it('should work with auto-select enabled', async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'اكتب دالة JavaScript بسيطة',
        },
      ];

      const response = await aiService.generateResponse(messages, {
        autoSelect: true,
        maxCost: 0.05,
      });

      expect(response).toHaveProperty('provider');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('cost');
      expect(response.cost).toBeLessThanOrEqual(0.05);
    }, 15000);
  });

  describe('DeepSeek Integration', () => {
    it('should check if DeepSeek is available', () => {
      const providers = aiService.getAvailableProviders();
      const hasDeepSeek = providers.includes(AIProvider.DEEPSEEK);

      if (process.env.DEEPSEEK_API_KEY) {
        expect(hasDeepSeek).toBe(true);
      } else {
        console.log('⚠️ DEEPSEEK_API_KEY not set, skipping DeepSeek tests');
      }
    });

    it('should call DeepSeek if API key is available', async () => {
      if (!process.env.DEEPSEEK_API_KEY) {
        console.log('⚠️ Skipping DeepSeek test - no API key');
        return;
      }

      const messages = [
        {
          role: 'user' as const,
          content: 'Say hello in one word',
        },
      ];

      try {
        const response = await aiService.invokeDeepSeek(messages);

        expect(response.provider).toBe(AIProvider.DEEPSEEK);
        expect(response.content).toBeTruthy();
        expect(response.cost).toBeGreaterThanOrEqual(0);
      } catch (error: any) {
        // If API key is invalid, that's expected
        if (error.message.includes('401') || error.message.includes('403')) {
          console.log('⚠️ DeepSeek API key invalid or expired');
        } else {
          throw error;
        }
      }
    }, 20000);
  });

  describe('Claude Integration', () => {
    it('should check if Claude is available', () => {
      const providers = aiService.getAvailableProviders();
      const hasClaude = providers.includes(AIProvider.CLAUDE);

      if (process.env.CLAUDE_API_KEY) {
        expect(hasClaude).toBe(true);
      } else {
        console.log('⚠️ CLAUDE_API_KEY not set, skipping Claude tests');
      }
    });

    it('should call Claude if API key is available', async () => {
      if (!process.env.CLAUDE_API_KEY) {
        console.log('⚠️ Skipping Claude test - no API key');
        return;
      }

      const messages = [
        {
          role: 'user' as const,
          content: 'Say hello in one word',
        },
      ];

      try {
        const response = await aiService.invokeClaude(messages);

        expect(response.provider).toBe(AIProvider.CLAUDE);
        expect(response.content).toBeTruthy();
        expect(response.cost).toBeGreaterThanOrEqual(0);
      } catch (error: any) {
        // If API key is invalid, that's expected
        if (error.message.includes('401') || error.message.includes('403')) {
          console.log('⚠️ Claude API key invalid or expired');
        } else {
          throw error;
        }
      }
    }, 20000);
  });

  describe('Fallback System', () => {
    it('should fallback to Manus if specified provider fails', async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'test fallback',
        },
      ];

      // Force using a provider that might not be available
      const response = await aiService.generateResponse(messages, {
        provider: AIProvider.DEEPSEEK,
        autoSelect: false,
        fallback: true, // Enable fallback
        maxCost: 0.1,
      });

      // Should get a response from either DeepSeek or fallback to Manus
      expect(response).toHaveProperty('provider');
      expect(response).toHaveProperty('content');
      expect(response.content).toBeTruthy();
    }, 20000);
  });

  describe('Performance Monitoring', () => {
    it('should track latency', async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'quick test',
        },
      ];

      const response = await aiService.invokeManusLLM(messages);

      expect(response.latency).toBeGreaterThan(0);
      expect(typeof response.latency).toBe('number');
    }, 15000);
  });
});
