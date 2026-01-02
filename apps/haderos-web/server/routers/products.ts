import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { requireDb } from '../db';
import { products } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { applyDynamicPricing } from '../bio-modules/orders-bio-integration.js';
import { schemas } from '../_core/validation';
import { cache } from '../_core/cache';
import { logger } from '../_core/logger';

export const productsRouter = router({
  // Get all products
  getAllProducts: publicProcedure.query(async () => {
    const startTime = Date.now();
    try {
      logger.debug('Fetching all products');

      // Try cache first, with fallback to DB
      let allProducts;
      try {
        allProducts = await cache.getOrSet(
          'products:all',
          async () => {
            logger.debug('Cache miss - fetching all products from DB');
            const db = await requireDb();
            const productsList = await db
              .select()
              .from(products)
              .where(eq(products.isActive, 1))
              .orderBy(desc(products.createdAt));
            return productsList;
          },
          600 // 10 minutes TTL (products change less frequently)
        );
      } catch (cacheError: unknown) {
        logger.warn('Cache failed, fetching from DB', { error: cacheError instanceof Error ? cacheError.message : String(cacheError) });
        const db = await requireDb();
        allProducts = await db
          .select()
          .from(products)
          .where(eq(products.isActive, 1))
          .orderBy(desc(products.createdAt));
      }

      const duration = Date.now() - startTime;
      logger.info('Products fetched successfully', {
        count: allProducts.length,
        duration: `${duration}ms`,
      });

      return allProducts;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logger.error('Failed to fetch products', error instanceof Error ? error : new Error(String(error)), { duration: `${duration}ms` });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'فشل في جلب المنتجات. يرجى المحاولة مرة أخرى',
        cause: error,
      });
    }
  }),

  // Get product by ID
  getProductById: publicProcedure
    .input(z.object({ productId: z.number().positive() }))
    .query(async ({ input }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.productId || input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف المنتج غير صحيح',
          });
        }

        logger.debug('Fetching product by ID', { productId: input.productId });

        let product;
        try {
          product = await cache.getOrSet(
            `products:${input.productId}`,
            async () => {
              logger.debug('Cache miss - fetching product from DB', { productId: input.productId });
              const db = await requireDb();

              const [product] = await db
                .select()
                .from(products)
                .where(eq(products.id, input.productId));

              if (!product) {
                logger.warn('Product not found', { productId: input.productId });
                throw new TRPCError({
                  code: 'NOT_FOUND',
                  message: 'المنتج غير موجود',
                });
              }

              return product;
            },
            600 // 10 minutes TTL
          );
        } catch (cacheError: any) {
          // If cache error, try DB directly
          if (cacheError instanceof TRPCError && cacheError.code === 'NOT_FOUND') {
            throw cacheError;
          }

          logger.warn('Cache failed, fetching from DB', { error: cacheError.message });
          const db = await requireDb();
          const [productFromDb] = await db
            .select()
            .from(products)
            .where(eq(products.id, input.productId));

          if (!productFromDb) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'المنتج غير موجود',
            });
          }

          product = productFromDb;
        }

        const duration = Date.now() - startTime;
        logger.info('Product fetched successfully', {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        return product;
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

        logger.error('Product fetch failed (Unexpected Error)', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في جلب المنتج. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // Get dynamic price for a product (with Chameleon integration)
  getDynamicPrice: publicProcedure
    .input(
      z.object({
        productId: z.number().positive(),
        context: z
          .object({
            customerHistory: z.number().optional(),
            timeOfDay: z.number().optional(),
            dayOfWeek: z.number().optional(),
            currentDemand: z.enum(['low', 'medium', 'high']).optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.productId || input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف المنتج غير صحيح',
          });
        }

        logger.debug('Calculating dynamic price', { productId: input.productId });

        const db = await requireDb();

        // Get product
        const [product] = await db.select().from(products).where(eq(products.id, input.productId));

        if (!product) {
          logger.warn('Product not found for dynamic pricing', { productId: input.productId });
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'المنتج غير موجود',
          });
        }

        // Get base price
        const basePrice = product.sellingPrice
          ? parseFloat(product.sellingPrice)
          : parseFloat(product.supplierPrice || '0') * 1.3; // 30% markup if no selling price

        if (basePrice <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'سعر المنتج غير صحيح',
          });
        }

        // Apply dynamic pricing with Chameleon (Bio-Module) - with error handling
        let pricingResult;
        try {
          pricingResult = await applyDynamicPricing(
            product.modelCode || '',
            basePrice,
            input.context || {}
          );
        } catch (bioError: unknown) {
          logger.warn('Bio-Module dynamic pricing failed, using base price', {
            error: bioError instanceof Error ? bioError.message : String(bioError),
            productId: input.productId,
          });
          // Fallback to base price if Bio-Module fails
          pricingResult = {
            adjustedPrice: basePrice,
            discount: 0,
            reason: 'استخدام السعر الأساسي (Bio-Module غير متاح)',
          };
        }

        const duration = Date.now() - startTime;
        logger.info('Dynamic price calculated successfully', {
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
          discountPercentage: Math.round((pricingResult.discount / basePrice) * 100),
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

        logger.error('Dynamic price calculation failed (Unexpected Error)', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'فشل في حساب السعر الديناميكي. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // Create new product (protected - admin only)
  createProduct: protectedProcedure
    .input(schemas.createProduct)
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.name || input.name.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'اسم المنتج مطلوب',
          });
        }

        if (!input.sku || input.sku.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'رمز المنتج (SKU) مطلوب',
          });
        }

        if (!input.price || input.price <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'السعر يجب أن يكون أكبر من صفر',
          });
        }

        logger.info('Creating new product', {
          modelCode: input.name,
          sku: input.sku,
          price: input.price,
          createdBy: ctx.user?.id,
        });

        const db = await requireDb();

        // Check if SKU already exists
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

        // Insert product
        let insertedProduct;
        try {
          const result = await db
            .insert(products)
            .values({
              modelCode: input.sku,
              supplierPrice: input.costPrice?.toString() || input.price.toString(),
              sellingPrice: input.price.toString(),
              category: input.category || null,
              isActive: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning();

          insertedProduct = result[0];
        } catch (dbError: unknown) {
        logger.error('Database insert failed', dbError instanceof Error ? dbError : new Error(String(dbError)), { sku: input.sku });

          if ((dbError instanceof Error && 'code' in dbError && dbError.code === '23505') || (dbError instanceof Error && dbError.message?.includes('duplicate'))) {
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

        if (!insertedProduct) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في إنشاء المنتج. لم يتم إنشاء أي سجلات',
          });
        }

        const duration = Date.now() - startTime;
        logger.info('Product created successfully', {
          productId: insertedProduct.id,
          sku: input.sku,
          duration: `${duration}ms`,
        });

        // Invalidate cache - with error handling
        try {
          cache.delete('products:all');
          cache.delete(`products:${insertedProduct.id}`);
        } catch (cacheError: any) {
          logger.warn('Cache invalidation failed', { error: cacheError.message });
          // Continue even if cache invalidation fails
        }

        return {
          success: true,
          productId: insertedProduct.id,
          message: 'تم إنشاء المنتج بنجاح',
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

        logger.error('Product creation failed (Unexpected Error)', error, {
          sku: input.sku,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء إنشاء المنتج. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // Update product (protected - admin only)
  updateProduct: protectedProcedure
    .input(schemas.updateProduct.extend({ productId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.productId || input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف المنتج غير صحيح',
          });
        }

        if (input.price !== undefined && input.price <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'السعر يجب أن يكون أكبر من صفر',
          });
        }

        if (input.sku !== undefined && input.sku.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'رمز المنتج (SKU) لا يمكن أن يكون فارغاً',
          });
        }

        logger.info('Updating product', {
          productId: input.productId,
          updatedBy: ctx.user?.id,
        });

        const db = await requireDb();

        // Check if product exists
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

        // Check if new SKU conflicts with another product
        if (input.sku && input.sku !== existingProduct.modelCode) {
          const [conflictingProduct] = await db
            .select()
            .from(products)
            .where(eq(products.modelCode, input.sku));

          if (conflictingProduct) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'رمز المنتج (SKU) موجود مسبقاً في منتج آخر',
            });
          }
        }

        // Build update data
        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };

        if (input.sku !== undefined) updateData.modelCode = input.sku;
        if (input.costPrice !== undefined) updateData.supplierPrice = input.costPrice.toString();
        if (input.price !== undefined) updateData.sellingPrice = input.price.toString();
        if (input.category !== undefined) updateData.category = input.category;
        if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0;

        // Update product
        try {
          await db.update(products).set(updateData).where(eq(products.id, input.productId));
        } catch (dbError: unknown) {
          logger.error('Database update failed', dbError instanceof Error ? dbError : new Error(String(dbError)), { productId: input.productId });

          if (dbError.code === '23505' || dbError.message?.includes('duplicate')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'رمز المنتج (SKU) موجود مسبقاً',
            });
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في تحديث المنتج. يرجى المحاولة مرة أخرى',
            cause: dbError,
          });
        }

        const duration = Date.now() - startTime;
        logger.info('Product updated successfully', {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        // Invalidate cache - with error handling
        try {
          cache.delete('products:all');
          cache.delete(`products:${input.productId}`);
        } catch (cacheError: any) {
          logger.warn('Cache invalidation failed', { error: cacheError.message });
          // Continue even if cache invalidation fails
        }

        return {
          success: true,
          message: 'تم تحديث المنتج بنجاح',
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

        logger.error('Product update failed (Unexpected Error)', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء تحديث المنتج. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),

  // Delete product (soft delete - protected - admin only)
  deleteProduct: protectedProcedure
    .input(z.object({ productId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        // Input validation
        if (!input.productId || input.productId <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'معرّف المنتج غير صحيح',
          });
        }

        logger.info('Deleting product (soft delete)', {
          productId: input.productId,
          deletedBy: ctx.user?.id,
        });

        const db = await requireDb();

        // Check if product exists
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

        // Soft delete (set isActive to 0)
        try {
          await db
            .update(products)
            .set({
              isActive: 0,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(products.id, input.productId));
        } catch (dbError: unknown) {
          logger.error('Database update failed', dbError instanceof Error ? dbError : new Error(String(dbError)), { productId: input.productId });

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في حذف المنتج. يرجى المحاولة مرة أخرى',
            cause: dbError,
          });
        }

        const duration = Date.now() - startTime;
        logger.info('Product deleted successfully', {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        // Invalidate cache - with error handling
        try {
          cache.delete('products:all');
          cache.delete(`products:${input.productId}`);
        } catch (cacheError: any) {
          logger.warn('Cache invalidation failed', { error: cacheError.message });
          // Continue even if cache invalidation fails
        }

        return {
          success: true,
          message: 'تم حذف المنتج بنجاح',
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

        logger.error('Product deletion failed (Unexpected Error)', error, {
          productId: input.productId,
          duration: `${duration}ms`,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'حدث خطأ أثناء حذف المنتج. يرجى المحاولة مرة أخرى',
          cause: error,
        });
      }
    }),
});
