/**
 * Mock Database for Testing
 * قاعدة بيانات وهمية للاختبارات
 *
 * تُستخدم بدلاً من الاتصال الحقيقي بقاعدة البيانات
 */

import { vi } from 'vitest';

// In-memory storage for mock data
const mockStorage = {
  users: new Map<number, any>(),
  orders: new Map<number, any>(),
  products: new Map<number, any>(),
  chatMessages: new Map<number, any>(),
  ethicalRules: new Map<number, any>(),
  userBehavior: new Map<number, any>(),
  googleDriveFiles: new Map<number, any>(),
};

let idCounter = 1;

// Generate unique ID
const generateId = () => idCounter++;

// Reset all mock data
export const resetMockDb = () => {
  mockStorage.users.clear();
  mockStorage.orders.clear();
  mockStorage.products.clear();
  mockStorage.chatMessages.clear();
  mockStorage.ethicalRules.clear();
  mockStorage.userBehavior.clear();
  mockStorage.googleDriveFiles.clear();
  idCounter = 1;
};

// Mock database operations
export const mockDb = {
  // Users
  users: {
    findMany: vi.fn().mockImplementation(async () => Array.from(mockStorage.users.values())),
    findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
      if (where?.id) return mockStorage.users.get(where.id);
      return Array.from(mockStorage.users.values())[0];
    }),
    create: vi.fn().mockImplementation(async ({ data }: any) => {
      const id = generateId();
      const user = { id, ...data, createdAt: new Date() };
      mockStorage.users.set(id, user);
      return user;
    }),
    update: vi.fn().mockImplementation(async ({ where, data }: any) => {
      const user = mockStorage.users.get(where.id);
      if (user) {
        const updated = { ...user, ...data, updatedAt: new Date() };
        mockStorage.users.set(where.id, updated);
        return updated;
      }
      return null;
    }),
    delete: vi.fn().mockImplementation(async ({ where }: any) => {
      return mockStorage.users.delete(where.id);
    }),
  },

  // Orders
  orders: {
    findMany: vi.fn().mockImplementation(async () => Array.from(mockStorage.orders.values())),
    findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
      if (where?.id) return mockStorage.orders.get(where.id);
      return Array.from(mockStorage.orders.values())[0];
    }),
    create: vi.fn().mockImplementation(async ({ data }: any) => {
      const id = generateId();
      const order = { id, orderNumber: `ORD-${Date.now()}`, ...data, createdAt: new Date() };
      mockStorage.orders.set(id, order);
      return order;
    }),
  },

  // Chat Messages
  chatMessages: {
    findMany: vi.fn().mockImplementation(async () => Array.from(mockStorage.chatMessages.values())),
    create: vi.fn().mockImplementation(async ({ data }: any) => {
      const id = generateId();
      const message = { id, ...data, createdAt: new Date() };
      mockStorage.chatMessages.set(id, message);
      return message;
    }),
  },

  // Ethical Rules (KAIA)
  ethicalRules: {
    findMany: vi.fn().mockImplementation(async () => Array.from(mockStorage.ethicalRules.values())),
    create: vi.fn().mockImplementation(async ({ data }: any) => {
      const id = generateId();
      const rule = { id, ...data, createdAt: new Date() };
      mockStorage.ethicalRules.set(id, rule);
      return rule;
    }),
  },

  // User Behavior
  userBehavior: {
    findMany: vi.fn().mockImplementation(async () => Array.from(mockStorage.userBehavior.values())),
    create: vi.fn().mockImplementation(async ({ data }: any) => {
      const id = generateId();
      const behavior = { id, ...data, createdAt: new Date() };
      mockStorage.userBehavior.set(id, behavior);
      return behavior;
    }),
    delete: vi.fn().mockImplementation(async ({ where }: any) => {
      return mockStorage.userBehavior.delete(where.userId);
    }),
  },

  // Google Drive Files
  googleDriveFiles: {
    findMany: vi.fn().mockImplementation(async () => Array.from(mockStorage.googleDriveFiles.values())),
    create: vi.fn().mockImplementation(async ({ data }: any) => {
      const id = generateId();
      const file = { id, ...data, createdAt: new Date() };
      mockStorage.googleDriveFiles.set(id, file);
      return file;
    }),
    delete: vi.fn().mockImplementation(async ({ where }: any) => {
      return mockStorage.googleDriveFiles.delete(where.userId);
    }),
  },

  // Generic query mock
  $queryRaw: vi.fn().mockResolvedValue([]),
  $executeRaw: vi.fn().mockResolvedValue(0),
};

// Mock drizzle query builder
export const mockDrizzleDb = {
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
};

// Factory functions for test data
export const factories = {
  createUser: (overrides = {}) => ({
    id: generateId(),
    openId: `openid-${Date.now()}`,
    name: 'Test User',
    email: 'test@haderos.ai',
    loginMethod: 'email',
    role: 'user',
    permissions: [],
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  }),

  createOrder: (overrides = {}) => ({
    id: generateId(),
    orderNumber: `ORD-${Date.now()}`,
    status: 'pending',
    totalAmount: 599.99,
    customerName: 'Test Customer',
    customerPhone: '01012345678',
    createdAt: new Date(),
    ...overrides,
  }),

  createEthicalRule: (overrides = {}) => ({
    id: generateId(),
    ruleName: 'Test Rule',
    ruleNameAr: 'قاعدة اختبار',
    ruleDescription: 'A test ethical rule',
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

  createChatMessage: (overrides = {}) => ({
    id: generateId(),
    userId: 1,
    role: 'user',
    content: 'Test message',
    conversationId: null,
    parentMessageId: null,
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  }),
};

export default mockDb;
