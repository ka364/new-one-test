/**
 * Test Setup File
 *
 * This file runs before all tests to set up the testing environment.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/haderos_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-only';

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite completed!');
});

// Setup before each test
beforeEach(() => {
  // Reset mocks before each test
});

// Cleanup after each test
afterEach(() => {
  // Clean up any test data
});

// Export test utilities
export const testUtils = {
  createMockContext: () => ({
    user: {
      id: 1,
      email: 'test@example.com',
      role: 'admin',
    },
    session: {
      id: 'test-session-id',
    },
  }),

  createMockUser: (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    ...overrides,
  }),

  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};
