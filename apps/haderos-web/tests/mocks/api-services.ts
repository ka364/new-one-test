/**
 * API Services Mocks for Testing
 * Mocks للخدمات الخارجية
 */

import { vi } from 'vitest';

// ==================== SendGrid Mock ====================
export const mockSendGrid = {
  send: vi.fn().mockResolvedValue([
    { statusCode: 202, body: '', headers: {} }
  ]),
  setApiKey: vi.fn(),
};

// Mock the SendGrid module
vi.mock('@sendgrid/mail', () => ({
  default: mockSendGrid,
  ...mockSendGrid,
}));

// ==================== Shopify Mock ====================
export const mockShopifyClient = {
  product: {
    list: vi.fn().mockResolvedValue([
      { id: 1, title: 'Test Product', price: '29.99', inventory_quantity: 100 }
    ]),
    get: vi.fn().mockResolvedValue({ id: 1, title: 'Test Product' }),
    create: vi.fn().mockResolvedValue({ id: 2, title: 'New Product' }),
    update: vi.fn().mockResolvedValue({ id: 1, title: 'Updated Product' }),
  },
  order: {
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 1, order_number: 1001 }),
  },
  inventoryLevel: {
    list: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue({}),
  },
};

// ==================== OpenAI/Manus Mock ====================
export const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        id: 'chatcmpl-mock',
        choices: [
          {
            message: {
              content: 'This is a mock AI response for testing.',
              role: 'assistant',
            },
            finish_reason: 'stop',
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      }),
    },
  },
};

// ==================== DeepSeek Mock ====================
export const mockDeepSeek = {
  generateResponse: vi.fn().mockResolvedValue({
    content: 'Mock DeepSeek response',
    tokensUsed: 50,
    cost: 0.001,
  }),
};

// ==================== Claude Mock ====================
export const mockClaude = {
  messages: {
    create: vi.fn().mockResolvedValue({
      id: 'msg-mock',
      content: [{ type: 'text', text: 'Mock Claude response' }],
      usage: { input_tokens: 10, output_tokens: 20 },
    }),
  },
};

// ==================== Google Drive Mock ====================
export const mockGoogleDrive = {
  files: {
    list: vi.fn().mockResolvedValue({
      data: {
        files: [
          { id: 'file1', name: 'test.pdf', mimeType: 'application/pdf' }
        ],
      },
    }),
    get: vi.fn().mockResolvedValue({
      data: { id: 'file1', name: 'test.pdf' },
    }),
    create: vi.fn().mockResolvedValue({
      data: { id: 'file2', name: 'new-file.pdf' },
    }),
    delete: vi.fn().mockResolvedValue({}),
  },
};

// ==================== Unified AI Service Mock ====================
export const mockUnifiedAIService = {
  generateResponse: vi.fn().mockResolvedValue({
    content: 'Mock AI response',
    provider: 'manus',
    tokensUsed: 30,
    cost: 0,
    cached: false,
  }),

  invokeManusLLM: vi.fn().mockResolvedValue({
    content: 'Mock Manus response',
    tokensUsed: 20,
    cost: 0,
  }),

  invokeDeepSeek: vi.fn().mockResolvedValue({
    content: 'Mock DeepSeek response',
    tokensUsed: 30,
    cost: 0.001,
  }),

  invokeClaude: vi.fn().mockResolvedValue({
    content: 'Mock Claude response',
    tokensUsed: 25,
    cost: 0.002,
  }),

  selectProvider: vi.fn().mockReturnValue('manus'),

  getUsageStats: vi.fn().mockReturnValue({
    totalTokens: 1000,
    totalCost: 0.05,
    requestCount: 50,
  }),
};

// ==================== Bio-Modules Mock ====================
export const mockBioModules = {
  arachnid: {
    detectAnomalies: vi.fn().mockResolvedValue([]),
    getStatus: vi.fn().mockResolvedValue({ active: true, health: 100 }),
  },
  corvid: {
    getLearningInsights: vi.fn().mockResolvedValue([]),
    getStatistics: vi.fn().mockReturnValue({
      totalPatterns: 10,
      totalRules: 5,
      activeRules: 3,
      averageSuccessRate: 0.85,
    }),
    checkOperation: vi.fn().mockResolvedValue({
      allowed: true,
      violations: [],
      warnings: [],
    }),
  },
  mycelium: {
    analyzeNetworkBalance: vi.fn().mockResolvedValue({
      overallScore: 85,
      imbalancedBranches: [],
      opportunities: [],
    }),
  },
  ant: {
    optimizeRoutes: vi.fn().mockResolvedValue({
      bestRoute: { points: [], distance: 0 },
      improvement: 0,
      computationTime: 10,
    }),
  },
  tardigrade: {
    getStatus: vi.fn().mockResolvedValue({
      inCryptobiosis: false,
      health: { overall: 95, components: { database: 100, api: 90, eventBus: 95 } },
    }),
    createBackup: vi.fn().mockResolvedValue({
      id: 'backup-1',
      timestamp: new Date(),
      type: 'incremental',
    }),
  },
  chameleon: {
    generatePricingStrategy: vi.fn().mockResolvedValue({
      basePrice: 100,
      currentPrice: 95,
      adjustment: -5,
      confidence: 0.8,
    }),
  },
  cephalopod: {
    evaluateDecision: vi.fn().mockResolvedValue({
      allowed: true,
      authorityLevel: 3,
      reason: 'Within authority limits',
      confidence: 0.9,
    }),
    getStatistics: vi.fn().mockResolvedValue({
      totalLevels: 7,
      activeDelegations: 5,
    }),
  },
};

// ==================== Helper to apply all mocks ====================
export const applyAllMocks = () => {
  // Environment variables for API keys
  process.env.SENDGRID_API_KEY = 'SG.mock-key-for-testing';
  process.env.SENDGRID_FROM_EMAIL = 'test@haderos.ai';
  process.env.SHOPIFY_STORE_NAME = 'test-store';
  process.env.SHOPIFY_ACCESS_TOKEN = 'shpat_mock-token';
  process.env.OPENAI_API_KEY = 'sk-mock-openai-key';
  process.env.DEEPSEEK_API_KEY = 'mock-deepseek-key';
  process.env.CLAUDE_API_KEY = 'mock-claude-key';
  process.env.GOOGLE_CLIENT_ID = 'mock-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'mock-google-secret';
};

export default {
  mockSendGrid,
  mockShopifyClient,
  mockOpenAI,
  mockDeepSeek,
  mockClaude,
  mockGoogleDrive,
  mockUnifiedAIService,
  mockBioModules,
  applyAllMocks,
};
