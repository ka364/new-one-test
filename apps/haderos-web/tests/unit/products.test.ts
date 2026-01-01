/**
 * Products Router Unit Tests
 * Apple-Level Test Coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { appRouter } from '../../server/routers';
import type { TrpcContext } from '../../server/_core/context';

const createMockContext = (overrides: Partial<TrpcContext> = {}): TrpcContext => ({
  user: {
    id: 1,
    email: 'test@haderos.ai',
    name: 'Test User',
    role: 'admin',
  },
  req: {} as any,
  res: {} as any,
  ...overrides,
});

const mockDb = {
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
};

vi.mock('../../server/db', () => ({
  requireDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock('../../server/_core/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../server/_core/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../server/bio-modules/orders-bio-integration', () => ({
  applyDynamicPricing: vi.fn().mockResolvedValue({
    adjustedPrice: 100,
    discount: 0,
    reason: 'No dynamic pricing',
  }),
}));

describe('Products Router - Unit Tests', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TrpcContext;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    caller = appRouter.createCaller(ctx);
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      mockDb.returning.mockResolvedValueOnce([
        {
          id: 1,
          name: 'منتج تجريبي',
          sku: 'SKU-001',
          price: 100,
        },
      ]);

      const result = await caller.products.createProduct({
        name: 'منتج تجريبي',
        sku: 'SKU-001',
        price: 100,
      });

      expect(result.success).toBe(true);
      expect(result.productId).toBeDefined();
    });

    it('should reject product with empty name', async () => {
      await expect(
        caller.products.createProduct({
          name: '',
          sku: 'SKU-001',
          price: 100,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should reject product with zero price', async () => {
      await expect(
        caller.products.createProduct({
          name: 'منتج',
          sku: 'SKU-001',
          price: 0,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should reject product with negative price', async () => {
      await expect(
        caller.products.createProduct({
          name: 'منتج',
          sku: 'SKU-001',
          price: -100,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should reject product with negative stock', async () => {
      await expect(
        caller.products.createProduct({
          name: 'منتج',
          sku: 'SKU-001',
          price: 100,
          stock: -10,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should handle duplicate SKU', async () => {
      const dbError = new Error('Duplicate key');
      (dbError as any).code = '23505';
      mockDb.returning.mockRejectedValueOnce(dbError);

      await expect(
        caller.products.createProduct({
          name: 'منتج',
          sku: 'SKU-001',
          price: 100,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getProductById', () => {
    it('should get product by ID successfully', async () => {
      mockDb.select.mockResolvedValueOnce([
        {
          id: 1,
          name: 'منتج',
          sku: 'SKU-001',
          price: 100,
          stock: 50,
        },
      ]);

      const result = await caller.products.getProductById({ productId: 1 });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw error if product not found', async () => {
      mockDb.select.mockResolvedValueOnce([]);

      await expect(caller.products.getProductById({ productId: 999 })).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      mockDb.select.mockResolvedValueOnce([{ id: 1 }]);
      mockDb.returning.mockResolvedValueOnce([{ id: 1, name: 'منتج محدث' }]);

      const result = await caller.products.updateProduct({
        productId: 1,
        name: 'منتج محدث',
      });

      expect(result.success).toBe(true);
    });

    it('should reject update if product not found', async () => {
      mockDb.select.mockResolvedValueOnce([]);

      await expect(
        caller.products.updateProduct({
          productId: 999,
          name: 'منتج',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      mockDb.select.mockResolvedValueOnce([{ id: 1 }]);
      mockDb.delete.mockResolvedValueOnce({ affectedRows: 1 });

      const result = await caller.products.deleteProduct({ productId: 1 });

      expect(result.success).toBe(true);
    });

    it('should reject delete if product not found', async () => {
      mockDb.select.mockResolvedValueOnce([]);

      await expect(caller.products.deleteProduct({ productId: 999 })).rejects.toThrow(
        TRPCError
      );
    });
  });
});

