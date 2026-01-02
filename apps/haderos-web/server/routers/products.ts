/**
 * @fileoverview Products Router - HADEROS E-commerce Platform
 * @module server/routers/products
 * @description Handles all product-related operations including CRUD, search,
 * inventory management, and dynamic pricing through Bio-Modules integration.
 *
 * @author HADEROS Team
 * @version 2.0.0
 * @license MIT
 *
 * @example
 * // Get all products
 * const products = await trpc.products.getAllProducts.query();
 *
 * @example
 * // Search products
 * const results = await trpc.products.searchProducts.query({
 *   query: 'حذاء رياضي',
 *   limit: 10
 * });
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { requireDb } from "../db";
import { products } from "../../drizzle/schema";
import { eq, desc, like, or } from "drizzle-orm";
import { applyDynamicPricing } from "../bio-modules/orders-bio-integration.js";
import { schemas } from "../_core/validation";
import { cache } from "../_core/cache";
import { logger } from "../_core/logger";

/**
 * Products Router - tRPC router for product management
 *
 * @description Provides the following procedures:
 * - `getAllProducts` - Fetch all active products
 * - `getProductById` - Fetch single product by ID
 * - `searchProducts` - Search products by name/SKU
 * - `getProductWithDynamicPrice` - Get product with AI-adjusted pricing
 * - `createProduct` - Create new product (protected)
 * - `updateProduct` - Update existing product (protected)
 * - `deleteProduct` - Soft delete product (protected)
 * - `restoreProduct` - Restore deleted product (protected)
 * - `getProductsByCategory` - Filter products by category
 * - `getProductStats` - Get product statistics (protected)
 *
 * @see {@link https://trpc.io/docs/router tRPC Router Documentation}
 */
export const productsRouter = router({
  /**
   * Get all active products
   *
   * @description Fetches all active products from the database with caching.
   * Results are cached for 10 minutes to improve performance.
   *
   * @returns {Promise<Product[]>} Array of active products sorted by creation date
   * @throws {TRPCError} With code 'INTERNAL_SERVER_ERROR' if database operation fails
   *
   * @example
   * const products = await trpc.products.getAllProducts.query();
   * console.log(`Found ${products.length} products`);
   */
  getAllProducts: publicProcedure.query(async () => {
    const startTime = Date.now();

    try {
      const result = await cache.getOrSet(
        'products:all',
        async () => {
          logger.debug('Cache miss - fetching all products from DB');
          const db = await requireDb();
          const allProducts = await db
            .select()
            .from(products)
            .where(eq(products.isActive, 1))
            .orderBy(desc(products.createdAt));
          return allProducts;
        },
        600 // 10 minutes TTL (products change less frequently)
      );

      const duration = Date.now() - startTime;
      logger.debug('Products fetched successfully', {
        count: result.length,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error('Failed to fetch all products', error, {
        duration: `${duration}ms`,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في جلب قائمة المنتجات',
        cause: error,
      });
    }
  }),

  // Get product by ID
  getProductById: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرف المنتج غير صحيح',
          });
        }

        const result = await cache.getOrSet(
          `products:${input.productId}`,
          async () => {
            logger.debug('Cache miss - fetching product from DB', { productId: input.productId });
            const db = await requireDb();

            const [product] = await db
              .select()
              .from(products)
              .where(eq(products.id, input.productId));

            if (!product) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'المنتج غير موجود',
              });
            }

            return product;
          },
          600 // 10 minutes TTL
        );

        const duration = Date.now() - startTime;
        logger.debug('Product fetched successfully', {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Product fetch failed (TRPCError)', {
            code: error.code,
            message: error.message,
            productId: input.productId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Product fetch failed', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب بيانات المنتج',
          cause: error,
        });
      }
    }),

  // Search products by name or SKU
  searchProducts: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().min(1).max(100).optional().default(20),
    }))
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (!input.query || input.query.trim() === '') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب إدخال كلمة البحث',
          });
        }

        const searchTerm = `%${input.query.trim()}%`;

        logger.debug('Searching products', {
          query: input.query,
          limit: input.limit,
        });

        const db = await requireDb();
        const results = await db
          .select()
          .from(products)
          .where(
            or(
              like(products.modelCode, searchTerm),
              like(products.category, searchTerm)
            )
          )
          .limit(input.limit);

        const duration = Date.now() - startTime;
        logger.debug('Product search completed', {
          query: input.query,
          resultsCount: results.length,
          duration: `${duration}ms`,
        });

        return {
          results,
          count: results.length,
          query: input.query,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) throw error;

        logger.error('Product search failed', error, {
          query: input.query,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في البحث عن المنتجات',
          cause: error,
        });
      }
    }),

  // Get dynamic price for a product (with Chameleon integration)
  getDynamicPrice: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        context: z.object({
          customerHistory: z.number().optional(),
          timeOfDay: z.number().optional(),
          dayOfWeek: z.number().optional(),
          currentDemand: z.enum(["low", "medium", "high"]).optional(),
        }).optional(),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرف المنتج غير صحيح',
          });
        }

        logger.debug('Getting dynamic price', {
          productId: input.productId,
          hasContext: !!input.context,
        });

        const db = await requireDb();

        // Get product
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, input.productId));

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'المنتج غير موجود',
          });
        }

        // Get base price
        const basePrice = product.sellingPrice
          ? parseFloat(product.sellingPrice)
          : parseFloat(product.supplierPrice) * 1.3; // 30% markup if no selling price

        // Validate base price
        if (isNaN(basePrice) || basePrice <= 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'سعر المنتج غير صحيح',
          });
        }

        // Apply dynamic pricing with Chameleon (Bio-Module) - with error handling
        let pricingResult;
        try {
          pricingResult = await applyDynamicPricing(
            product.modelCode,
            basePrice,
            input.context || {}
          );
        } catch (bioError: any) {
          logger.warn('Chameleon dynamic pricing failed, using base price', {
            error: bioError.message,
            productId: input.productId,
          });
          // Fallback to base price if Bio-Module fails
          pricingResult = {
            adjustedPrice: basePrice,
            discount: 0,
            reason: 'السعر الأساسي (Bio-Module غير متاح)',
          };
        }

        const duration = Date.now() - startTime;
        logger.debug('Dynamic price calculated', {
          productId: input.productId,
          basePrice,
          adjustedPrice: pricingResult.adjustedPrice,
          duration: `${duration}ms`,
        });

        return {
          productId: product.id,
          modelCode: product.modelCode,
          basePrice,
          adjustedPrice: pricingResult.adjustedPrice,
          discount: pricingResult.discount,
          discountPercentage: Math.round(pricingResult.discount * 100),
          reason: pricingResult.reason,
          savings: basePrice - pricingResult.adjustedPrice,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Dynamic price calculation failed (TRPCError)', {
            code: error.code,
            message: error.message,
            productId: input.productId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Dynamic price calculation failed', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في حساب السعر الديناميكي',
          cause: error,
        });
      }
    }),

  // Create new product (protected - admin only)
  createProduct: protectedProcedure
    .input(schemas.createProduct)
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (!input.sku || input.sku.trim() === '') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب إدخال رمز المنتج (SKU)',
          });
        }

        if (input.price <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'السعر يجب أن يكون أكبر من صفر',
          });
        }

        if (input.costPrice !== undefined && input.costPrice < 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'سعر التكلفة لا يمكن أن يكون سالباً',
          });
        }

        // Validate profit margin
        if (input.costPrice !== undefined && input.price < input.costPrice) {
          logger.warn('Product being created with negative margin', {
            sku: input.sku,
            price: input.price,
            costPrice: input.costPrice,
          });
        }

        logger.info('Creating new product', {
          modelCode: input.name,
          sku: input.sku,
          price: input.price,
        });

        const db = await requireDb();

        // Check for duplicate SKU
        const [existingProduct] = await db
          .select()
          .from(products)
          .where(eq(products.modelCode, input.sku));

        if (existingProduct) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'رمز المنتج (SKU) موجود مسبقاً',
          });
        }

        const now = new Date().toISOString();
        let insertResult;

        try {
          insertResult = await db
            .insert(products)
            .values({
              modelCode: input.sku,
              supplierPrice: input.costPrice?.toString() || input.price.toString(),
              sellingPrice: input.price.toString(),
              category: input.category || null,
              isActive: 1,
              createdAt: now,
              updatedAt: now,
            })
            .returning();
        } catch (dbError: any) {
          logger.error('Database insert failed', dbError, {
            sku: input.sku,
          });

          if (dbError.code === '23505' || dbError.message?.includes('duplicate')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'رمز المنتج (SKU) موجود مسبقاً',
            });
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في إنشاء المنتج. يرجى المحاولة مرة أخرى',
            cause: dbError,
          });
        }

        const duration = Date.now() - startTime;
        logger.info('Product created successfully', {
          sku: input.sku,
          productId: insertResult?.[0]?.id,
          duration: `${duration}ms`,
        });

        // Invalidate cache
        try {
          cache.delete('products:all');
        } catch (cacheError: any) {
          logger.warn('Cache invalidation failed', { error: cacheError.message });
        }

        return {
          success: true,
          message: "تم إنشاء المنتج بنجاح",
          productId: insertResult?.[0]?.id,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Product creation failed (TRPCError)', {
            code: error.code,
            message: error.message,
            sku: input.sku,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Product creation failed', error, {
          sku: input.sku,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء إنشاء المنتج',
          cause: error,
        });
      }
    }),

  // Update product (protected - admin only)
  updateProduct: protectedProcedure
    .input(schemas.updateProduct.extend({ productId: z.number() }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرف المنتج غير صحيح',
          });
        }

        if (input.price !== undefined && input.price <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'السعر يجب أن يكون أكبر من صفر',
          });
        }

        if (input.costPrice !== undefined && input.costPrice < 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'سعر التكلفة لا يمكن أن يكون سالباً',
          });
        }

        logger.info('Updating product', { productId: input.productId });

        const db = await requireDb();

        // Verify product exists
        const [existingProduct] = await db
          .select()
          .from(products)
          .where(eq(products.id, input.productId));

        if (!existingProduct) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'المنتج غير موجود',
          });
        }

        // Check for duplicate SKU if updating SKU
        if (input.sku && input.sku !== existingProduct.modelCode) {
          const [duplicateProduct] = await db
            .select()
            .from(products)
            .where(eq(products.modelCode, input.sku));

          if (duplicateProduct) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'رمز المنتج (SKU) مستخدم بواسطة منتج آخر',
            });
          }
        }

        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };

        if (input.sku !== undefined) updateData.modelCode = input.sku;
        if (input.costPrice !== undefined) updateData.supplierPrice = input.costPrice.toString();
        if (input.price !== undefined) updateData.sellingPrice = input.price.toString();
        if (input.category !== undefined) updateData.category = input.category;
        if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0;

        await db
          .update(products)
          .set(updateData)
          .where(eq(products.id, input.productId));

        const duration = Date.now() - startTime;
        logger.info('Product updated successfully', {
          productId: input.productId,
          updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt'),
          duration: `${duration}ms`,
        });

        // Invalidate cache
        try {
          cache.delete('products:all');
          cache.delete(`products:${input.productId}`);
        } catch (cacheError: any) {
          logger.warn('Cache invalidation failed', { error: cacheError.message });
        }

        return {
          success: true,
          message: "تم تحديث المنتج بنجاح",
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Product update failed (TRPCError)', {
            code: error.code,
            message: error.message,
            productId: input.productId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Product update failed', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في تحديث المنتج',
          cause: error,
        });
      }
    }),

  // Delete product (soft delete - protected - admin only)
  deleteProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرف المنتج غير صحيح',
          });
        }

        logger.info('Deleting product (soft delete)', { productId: input.productId });

        const db = await requireDb();

        // Verify product exists
        const [existingProduct] = await db
          .select()
          .from(products)
          .where(eq(products.id, input.productId));

        if (!existingProduct) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'المنتج غير موجود',
          });
        }

        // Check if already deleted
        if (existingProduct.isActive === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'المنتج محذوف بالفعل',
          });
        }

        await db
          .update(products)
          .set({
            isActive: 0,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(products.id, input.productId));

        const duration = Date.now() - startTime;
        logger.info('Product deleted successfully', {
          productId: input.productId,
          modelCode: existingProduct.modelCode,
          duration: `${duration}ms`,
        });

        // Invalidate cache
        try {
          cache.delete('products:all');
          cache.delete(`products:${input.productId}`);
        } catch (cacheError: any) {
          logger.warn('Cache invalidation failed', { error: cacheError.message });
        }

        return {
          success: true,
          message: "تم حذف المنتج بنجاح",
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Product deletion failed (TRPCError)', {
            code: error.code,
            message: error.message,
            productId: input.productId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Product deletion failed', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في حذف المنتج',
          cause: error,
        });
      }
    }),

  // Restore deleted product (protected - admin only)
  restoreProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرف المنتج غير صحيح',
          });
        }

        logger.info('Restoring product', { productId: input.productId });

        const db = await requireDb();

        // Verify product exists
        const [existingProduct] = await db
          .select()
          .from(products)
          .where(eq(products.id, input.productId));

        if (!existingProduct) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'المنتج غير موجود',
          });
        }

        // Check if already active
        if (existingProduct.isActive === 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'المنتج نشط بالفعل',
          });
        }

        await db
          .update(products)
          .set({
            isActive: 1,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(products.id, input.productId));

        const duration = Date.now() - startTime;
        logger.info('Product restored successfully', {
          productId: input.productId,
          modelCode: existingProduct.modelCode,
          duration: `${duration}ms`,
        });

        // Invalidate cache
        try {
          cache.delete('products:all');
          cache.delete(`products:${input.productId}`);
        } catch (cacheError: any) {
          logger.warn('Cache invalidation failed', { error: cacheError.message });
        }

        return {
          success: true,
          message: "تم استعادة المنتج بنجاح",
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) {
          logger.error('Product restoration failed (TRPCError)', {
            code: error.code,
            message: error.message,
            productId: input.productId,
            duration: `${duration}ms`,
          });
          throw error;
        }

        logger.error('Product restoration failed', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في استعادة المنتج',
          cause: error,
        });
      }
    }),

  // Get products by category
  getProductsByCategory: publicProcedure
    .input(z.object({
      category: z.string().min(1),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        // Input validation
        if (!input.category || input.category.trim() === '') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'يجب تحديد التصنيف',
          });
        }

        const cacheKey = `products:category:${input.category}:${input.limit}`;

        const result = await cache.getOrSet(
          cacheKey,
          async () => {
            logger.debug('Cache miss - fetching products by category', {
              category: input.category,
            });

            const db = await requireDb();
            const categoryProducts = await db
              .select()
              .from(products)
              .where(eq(products.category, input.category))
              .orderBy(desc(products.createdAt))
              .limit(input.limit);

            return categoryProducts;
          },
          300 // 5 minutes TTL
        );

        const duration = Date.now() - startTime;
        logger.debug('Products by category fetched', {
          category: input.category,
          count: result.length,
          duration: `${duration}ms`,
        });

        return {
          category: input.category,
          products: result,
          count: result.length,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error instanceof TRPCError) throw error;

        logger.error('Failed to fetch products by category', error, {
          category: input.category,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب منتجات التصنيف',
          cause: error,
        });
      }
    }),

  // Get product statistics (admin only)
  getProductStats: protectedProcedure.query(async () => {
    const startTime = Date.now();

    try {
      logger.debug('Fetching product statistics');

      const db = await requireDb();

      // Get all products
      const allProducts = await db
        .select()
        .from(products);

      const activeProducts = allProducts.filter(p => p.isActive === 1);
      const inactiveProducts = allProducts.filter(p => p.isActive === 0);

      // Calculate average prices
      const totalSellingPrice = activeProducts.reduce((sum, p) => {
        const price = parseFloat(p.sellingPrice || '0');
        return sum + (isNaN(price) ? 0 : price);
      }, 0);

      const totalCostPrice = activeProducts.reduce((sum, p) => {
        const price = parseFloat(p.supplierPrice || '0');
        return sum + (isNaN(price) ? 0 : price);
      }, 0);

      // Get categories
      const categories = new Set(allProducts.map(p => p.category).filter(Boolean));

      const duration = Date.now() - startTime;
      logger.debug('Product statistics calculated', {
        totalProducts: allProducts.length,
        duration: `${duration}ms`,
      });

      return {
        total: allProducts.length,
        active: activeProducts.length,
        inactive: inactiveProducts.length,
        categoriesCount: categories.size,
        categories: Array.from(categories),
        averageSellingPrice: activeProducts.length > 0
          ? Math.round(totalSellingPrice / activeProducts.length * 100) / 100
          : 0,
        averageCostPrice: activeProducts.length > 0
          ? Math.round(totalCostPrice / activeProducts.length * 100) / 100
          : 0,
        averageMargin: activeProducts.length > 0 && totalCostPrice > 0
          ? Math.round((totalSellingPrice - totalCostPrice) / totalCostPrice * 100 * 100) / 100
          : 0,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error('Failed to fetch product statistics', error, {
        duration: `${duration}ms`,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في جلب إحصائيات المنتجات',
        cause: error,
      });
    }
  }),
});
