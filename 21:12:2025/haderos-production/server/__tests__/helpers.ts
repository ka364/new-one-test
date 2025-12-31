/**
 * Test Helpers and Utilities
 * Shared functions for testing across the application
 */

import { type inferAsyncReturnType } from '@trpc/server';

/**
 * Create a test context for tRPC routers
 */
export function createTestContext() {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'admin',
    },
    session: {
      id: 'test-session-id',
      userId: 'test-user-id',
    },
  };
}

export type TestContext = inferAsyncReturnType<typeof createTestContext>;

/**
 * Create a test user with specific role
 */
export function createTestUser(role: 'admin' | 'user' | 'manager' = 'user') {
  return {
    id: `test-${role}-${Date.now()}`,
    email: `${role}@test.com`,
    name: `Test ${role}`,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create test data factories
 */
export const factories = {
  order: (overrides = {}) => ({
    id: `order-${Date.now()}`,
    status: 'pending',
    total: 100,
    items: [],
    createdAt: new Date(),
    ...overrides,
  }),

  product: (overrides = {}) => ({
    id: `product-${Date.now()}`,
    name: 'Test Product',
    sku: `SKU-${Date.now()}`,
    price: 50,
    quantity: 100,
    ...overrides,
  }),

  employee: (overrides = {}) => ({
    id: `emp-${Date.now()}`,
    name: 'Test Employee',
    email: `emp${Date.now()}@test.com`,
    position: 'Developer',
    department: 'Engineering',
    ...overrides,
  }),
};

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Mock database query results
 */
export function mockDbQuery<T>(result: T) {
  return vi.fn().mockResolvedValue(result);
}

/**
 * Mock API call
 */
export function mockApiCall<T>(result: T, delay = 0) {
  return vi.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve(result), delay))
  );
}

/**
 * Generate random test data
 */
export const random = {
  email: () => `test${Date.now()}@example.com`,
  string: (length = 10) => Math.random().toString(36).substring(2, length + 2),
  number: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
  boolean: () => Math.random() > 0.5,
  date: () => new Date(Date.now() - random.number(0, 365) * 24 * 60 * 60 * 1000),
};

/**
 * Assert error thrown with specific message
 */
export async function expectError(
  fn: () => Promise<any>,
  expectedMessage?: string
) {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error: any) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to include "${expectedMessage}", got "${error.message}"`
      );
    }
  }
}
