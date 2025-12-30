/**
 * Products Router Example - With Caching
 * Demonstrates how to use cache to improve performance
 */

import { router, publicProcedure, protectedProcedure, adminProcedure } from '../_core/trpc';
import { schemas } from '../_core/validation';
import { cache } from '../_core/cache';
import { logger } from '../_core/logger';
import { z } from 'zod';

export const productsCachedExampleRouter = router({
  /**
   * Get all products - with caching (5 minutes TTL)
   */
  getAll: publicProcedure
    .input(schemas.pagination.optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page || 1;
      const limit = input?.limit || 20;

      // Create cache key based on pagination
      const cacheKey = `products:all:page:${page}:limit:${limit}`;

      logger.debug('Fetching products', { page, limit, cacheKey });

      // Try to get from cache first
      return cache.getOrSet(
        cacheKey,
        async () => {
          logger.info('Cache miss - fetching from database', { cacheKey });

          // Expensive database query
          const products = await ctx.db.query.products.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: (products, { desc }) => [desc(products.createdAt)],
          });

          const total = await ctx.db.query.products.findMany();

          return {
            products,
            pagination: {
              page,
              limit,
              total: total.length,
              totalPages: Math.ceil(total.length / limit),
            },
          };
        },
        300 // 5 minutes TTL
      );
    }),

  /**
   * Get single product - with caching
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const cacheKey = `product:${input.id}`;

      logger.debug('Fetching product', { productId: input.id, cacheKey });

      return cache.getOrSet(
        cacheKey,
        async () => {
          logger.info('Cache miss - fetching product from database', { productId: input.id });

          const product = await ctx.db.query.products.findFirst({
            where: (products, { eq }) => eq(products.id, input.id),
          });

          if (!product) {
            throw new Error('Product not found');
          }

          return product;
        },
        600 // 10 minutes TTL (products don't change often)
      );
    }),

  /**
   * Create product - invalidates cache
   */
  create: adminProcedure
    .input(schemas.createProduct)
    .mutation(async ({ input, ctx }) => {
      logger.info('Creating product', { name: input.name });

      const newProduct = await ctx.db.insert(products).values({
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // ⚠️ Important: Invalidate cache when data changes
      cache.delete('products:all:page:1:limit:20'); // Invalidate first page
      // For a more robust solution, you'd invalidate all product list caches

      logger.info('Product created and cache invalidated', { productId: newProduct[0].id });

      return newProduct[0];
    }),

  /**
   * Update product - invalidates cache
   */
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      data: schemas.updateProduct,
    }))
    .mutation(async ({ input, ctx }) => {
      logger.info('Updating product', { productId: input.id });

      const updatedProduct = await ctx.db.update(products)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(products.id, input.id))
        .returning();

      // ⚠️ Invalidate both list and single product caches
      cache.delete(`product:${input.id}`);
      cache.delete('products:all:page:1:limit:20');

      logger.info('Product updated and cache invalidated', { productId: input.id });

      return updatedProduct[0];
    }),

  /**
   * Delete product - invalidates cache
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      logger.info('Deleting product', { productId: input.id });

      await ctx.db.delete(products)
        .where(eq(products.id, input.id));

      // ⚠️ Invalidate caches
      cache.delete(`product:${input.id}`);
      cache.delete('products:all:page:1:limit:20');

      logger.info('Product deleted and cache invalidated', { productId: input.id });

      return { success: true };
    }),

  /**
   * Get cache statistics - admin only
   */
  getCacheStats: adminProcedure
    .query(() => {
      const stats = cache.getStats();
      logger.debug('Cache statistics requested', stats);
      return stats;
    }),

  /**
   * Clear product cache - admin only
   */
  clearCache: adminProcedure
    .mutation(() => {
      cache.clear();
      logger.warn('All cache cleared by admin');
      return { success: true, message: 'Cache cleared successfully' };
    }),
});

// Export type
export type ProductsCachedExampleRouter = typeof productsCachedExampleRouter;

/**
 * 💡 CACHING BEST PRACTICES:
 *
 * 1. Cache Read-Heavy Data
 *    - Product catalogs (high reads, low writes)
 *    - User profiles
 *    - Configuration settings
 *    - Static content
 *
 * 2. Set Appropriate TTL
 *    - Frequently changing data: 1-5 minutes
 *    - Moderately changing: 5-30 minutes
 *    - Rarely changing: 30-60 minutes
 *    - Static data: 1-24 hours
 *
 * 3. Cache Invalidation
 *    - Always invalidate when data changes (create, update, delete)
 *    - Use specific keys for targeted invalidation
 *    - Consider cache namespacing for bulk invalidation
 *
 * 4. Don't Cache
 *    - Sensitive data (passwords, tokens)
 *    - Real-time data (live prices, stock tickers)
 *    - User-specific data (unless user-keyed)
 *    - Very large objects (>1MB)
 *
 * 5. Monitor Cache Performance
 *    - Track hit rate (target: 70-80%+)
 *    - Monitor memory usage
 *    - Log cache misses for optimization
 *    - Use cache.getStats() regularly
 *
 * 6. Production: Use Redis
 *    - In-memory cache is for development
 *    - Redis for production (shared across instances)
 *    - Configure Redis persistence
 *    - Set up Redis sentinel/cluster for HA
 */
