/**
 * Vitest Setup File
 * ملف إعداد الاختبارات
 */

import { vi, beforeEach, afterEach } from 'vitest';

// ==================== Environment Variables ====================
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing';

// API Keys (mock values to prevent real API calls)
process.env.OPENAI_API_KEY = 'sk-test-mock-openai-key-for-testing';
process.env.DEEPSEEK_API_KEY = 'test-deepseek-key-mock';
process.env.CLAUDE_API_KEY = 'test-claude-key-mock';
process.env.SENDGRID_API_KEY = 'SG.test-mock-sendgrid-key';
process.env.SENDGRID_FROM_EMAIL = 'test@haderos.ai';
process.env.SHOPIFY_STORE_NAME = 'test-store';
process.env.SHOPIFY_ACCESS_TOKEN = 'shpat_test-mock-token';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';

// ==================== Mock Database ====================
// Prevent real database connections in tests
vi.mock('../server/db', () => {
  const createMockDb = () => {
    const mockDb: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      execute: vi.fn().mockResolvedValue([]),
      query: vi.fn().mockResolvedValue([]),
    };
    mockDb.transaction = vi.fn().mockImplementation(async (fn: any) => fn(mockDb));
    return mockDb;
  };

  const mockDb = createMockDb();

  return {
    db: mockDb,
    _db: mockDb,
    getDb: vi.fn().mockResolvedValue(mockDb),
    requireDb: vi.fn().mockResolvedValue(mockDb),
    // User functions
    upsertUser: vi.fn().mockResolvedValue(undefined),
    getUserByOpenId: vi.fn().mockResolvedValue(null),
    getUser: vi.fn().mockResolvedValue(null),
    // Order functions
    createOrder: vi.fn().mockResolvedValue({ id: 1 }),
    getOrder: vi.fn().mockResolvedValue(null),
    getOrders: vi.fn().mockResolvedValue([]),
    updateOrder: vi.fn().mockResolvedValue(undefined),
    // Chat functions
    saveChatMessage: vi.fn().mockResolvedValue({ id: 1 }),
    getChatHistory: vi.fn().mockResolvedValue([]),
    getChatConversations: vi.fn().mockResolvedValue([]),
    // Ethical rules
    getEthicalRules: vi.fn().mockResolvedValue([]),
    createEthicalRule: vi.fn().mockResolvedValue({ id: 1 }),
    // Notifications
    createNotification: vi.fn().mockResolvedValue({ id: 1 }),
    getUserNotifications: vi.fn().mockResolvedValue([]),
    // Audit
    createAuditEntry: vi.fn().mockResolvedValue({ id: 1 }),
    getAuditEntries: vi.fn().mockResolvedValue([]),
  };
});

// ==================== Mock External APIs ====================
// Mock SendGrid
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
  setApiKey: vi.fn(),
  send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

// Mock glob for SystemAnalyzer
vi.mock('glob', () => {
  const mockGlob = vi
    .fn()
    .mockResolvedValue([
      'server/index.ts',
      'server/db.ts',
      'client/App.tsx',
      'tests/example.test.ts',
    ]);
  return {
    glob: mockGlob,
    globSync: vi.fn().mockReturnValue(['server/index.ts', 'client/App.tsx']),
    default: mockGlob,
  };
});

// Mock fs/promises for file reading in tests
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('// Mock file content\nexport default {};'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
  stat: vi.fn().mockResolvedValue({ size: 1000, isFile: () => true, isDirectory: () => false }),
}));

// ==================== Mock tRPC Context ====================
interface MockContext {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  } | null;
  session: {
    userId: number;
    organizationId: number;
  } | null;
  req: Record<string, unknown>;
  res: Record<string, unknown>;
}

// ==================== Test Utilities ====================
export const testUtils = {
  generateTestId: () => 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Mock context for tRPC procedures
  createMockContext: (overrides: Partial<MockContext> = {}): MockContext => ({
    user: {
      id: 1,
      email: 'test@haderos.ai',
      name: 'Test User',
      role: 'admin',
    },
    session: {
      userId: 1,
      organizationId: 1,
    },
    req: {},
    res: {},
    ...overrides,
  }),

  // Mock authenticated context
  createAuthenticatedContext: (userId = 1, role = 'admin') => ({
    user: {
      id: userId,
      email: `user${userId}@haderos.ai`,
      name: `Test User ${userId}`,
      role,
    },
    session: {
      userId,
      organizationId: 1,
    },
    req: {},
    res: {},
  }),

  // Mock unauthenticated context
  createUnauthenticatedContext: (): MockContext => ({
    user: null,
    session: null,
    req: {},
    res: {},
  }),

  createMockOrder: (overrides = {}) => ({
    id: 1,
    orderNumber: 'ORD-TEST-001',
    status: 'pending',
    totalAmount: 599.99,
    customerName: 'Test Customer',
    customerPhone: '01012345678',
    createdAt: new Date(),
    ...overrides,
  }),

  createMockPayment: (overrides = {}) => ({
    id: 1,
    orderId: 1,
    amount: 599.99,
    provider: 'instapay',
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  }),

  createMockUser: (overrides = {}) => ({
    id: 1,
    email: 'test@haderos.ai',
    name: 'Test User',
    role: 'admin',
    createdAt: new Date(),
    ...overrides,
  }),

  createMockProduct: (overrides = {}) => ({
    id: 1,
    name: 'Test Product',
    sku: 'TEST-SKU-001',
    price: 299.99,
    stock: 100,
    category: 'test',
    createdAt: new Date(),
    ...overrides,
  }),

  createMockConversation: (overrides = {}) => ({
    id: 'conv-test-001',
    type: 'team',
    title: 'Test Conversation',
    organizationId: 1,
    createdAt: new Date(),
    ...overrides,
  }),

  createMockEthicalRule: (overrides = {}) => ({
    id: 1,
    ruleName: 'Test Rule',
    ruleNameAr: 'قاعدة اختبار',
    ruleDescription: 'Test ethical rule',
    ruleDescriptionAr: 'قاعدة أخلاقية للاختبار',
    ruleType: 'business',
    category: 'pricing',
    severity: 'medium',
    ruleLogic: {},
    isActive: true,
    autoApply: false,
    requiresReview: true,
    priority: 5,
    createdBy: 1,
    createdAt: new Date(),
    ...overrides,
  }),

  createMockChatMessage: (overrides = {}) => ({
    id: 1,
    userId: 1,
    role: 'user',
    content: 'Test message',
    conversationId: null,
    parentMessageId: null,
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  }),

  // Mock AI response
  createMockAIResponse: (overrides = {}) => ({
    content: 'This is a mock AI response for testing.',
    provider: 'manus',
    tokensUsed: 30,
    cost: 0,
    cached: false,
    ...overrides,
  }),

  // Mock bio-module response
  createMockBioModuleStatus: (overrides = {}) => ({
    overall: 95,
    activeModules: 7,
    modules: {
      arachnid: { active: true, health: 100 },
      corvid: { active: true, health: 95 },
      mycelium: { active: true, health: 90 },
      ant: { active: true, health: 100 },
      tardigrade: { active: true, health: 95 },
      chameleon: { active: true, health: 90 },
      cephalopod: { active: true, health: 95 },
    },
    ...overrides,
  }),
};

// Also set on global for backwards compatibility
(global as any).testUtils = testUtils;

// ==================== Test Lifecycle Hooks ====================
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
