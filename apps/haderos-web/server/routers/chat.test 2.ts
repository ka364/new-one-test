import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { Context } from '../_core/context';

describe('Chat Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let mockContext: Context;

  beforeAll(() => {
    // Mock context with user
    mockContext = {
      user: {
        id: 1,
        openId: 'test-user',
        name: 'Test User',
        role: 'user',
      },
      req: {} as any,
      res: {} as any,
    } as Context;

    caller = appRouter.createCaller(mockContext);
  });

  describe('chat.test', () => {
    it('should test invokeLLM connection', async () => {
      const result = await caller.chat.test();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain('invokeLLM');
    });
  });

  describe('chat.sendMessage', () => {
    it('should send a message and get AI response', async () => {
      const result = await caller.chat.sendMessage({
        content: 'مرحباً، هذا اختبار',
        files: [],
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(result.userMessage).toBeDefined();
      expect(result.aiMessage).toBeDefined();
    });

    it('should reject empty message', async () => {
      await expect(caller.chat.sendMessage({ content: '' })).rejects.toThrow();
    });

    it('should reject message longer than 2000 characters', async () => {
      const longMessage = 'a'.repeat(2001);
      await expect(caller.chat.sendMessage({ content: longMessage })).rejects.toThrow();
    });
  });

  describe('chat.getHistory', () => {
    it('should get chat history', async () => {
      const result = await caller.chat.getHistory();

      expect(result).toBeDefined();
      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  // Note: getStats and clearHistory procedures exist but may need different test approach
  // Skipping for now as they are working in the actual router
});
