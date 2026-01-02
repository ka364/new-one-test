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
import { withErrorHandling, isDuplicateKeyError } from '../_core/error-handler';
import { withPerformanceTracking } from '../_core/async-performance-wrapper';
import { invalidateProductCache } from '../_core/cache-manager';

export const productsRouter = router({
  // Get all products
  getAllProducts: publicProcedure.query(async () => {
    return withErrorHandling(
      'products.getAllProducts',
      async () => {
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

        logger.info('Products fetched successfully', {
          count: allProducts.length,
        });

        return allProducts;
      }
    );
  }),

  // Get product by ID
  getProductById: publicProcedure
    .input(z.object({ productId: z.number().positive() }))
    .query(async ({ input }) => {
      return withErrorHandling(
        'products.getProductById',
        async () => {
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

          logger.info('Product fetched successfully', {
            productId: input.productId,
          });

          return product;
        },
        {
          productId: input.productId,
        }
      );
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
      return withPerformanceTracking(
        {
          operation: 'products.getDynamicPrice',
          details: {
            productId: input.productId,
          },
        },
        async () => {
          return withErrorHandling(
            'products.getDynamicPrice',
            async () => {
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

              logger.info('Dynamic price calculated successfully', {
                productId: input.productId,
                basePrice,
                adjustedPrice: pricingResult.adjustedPrice,
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
            },
            {
              productId: input.productId,
            }
          );
        }
      );
    }),

  // Create new product (protected - admin only)
  createProduct: protectedProcedure
    .input(schemas.createProduct)
    .mutation(async ({ input, ctx }) => {
      return withPerformanceTracking(
        {
          operation: 'products.createProduct',
          details: {
            sku: input.sku,
            price: input.price,
            createdBy: ctx.user?.id,
          },
        },
        async () => {
          return withErrorHandling(
            'products.createProduct',
            async () => {
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
                // Check for duplicate using utility
                if (isDuplicateKeyError(dbError)) {
                  throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'رمز المنتج (SKU) موجود مسبقاً',
                  });
                }
                // Re-throw to be handled by withErrorHandling
                throw dbError;
              }

        if (!insertedProduct) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'فشل في إنشاء المنتج. لم يتم إنشاء أي سجلات',
          });
        }

              logger.info('Product created successfully', {
                productId: insertedProduct.id,
                sku: input.sku,
              });

              // Invalidate cache using utility
              await invalidateProductCache({
                productId: insertedProduct.id,
              });

              return {
                success: true,
                productId: insertedProduct.id,
                message: 'تم إنشاء المنتج بنجاح',
              };
            },
            {
              sku: input.sku,
              price: input.price,
              createdBy: ctx.user?.id,
            }
          );
        }
      );
    }),

  // Update product (protected - admin only)
  updateProduct: protectedProcedure
    .input(schemas.updateProduct.extend({ productId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      return withPerformanceTracking(
        {
          operation: 'products.updateProduct',
          details: {
            productId: input.productId,
            updatedBy: ctx.user?.id,
          },
        },
        async () => {
          return withErrorHandling(
            'products.updateProduct',
            async () => {
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
                // Check for duplicate using utility
                if (isDuplicateKeyError(dbError)) {
                  throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'رمز المنتج (SKU) موجود مسبقاً',
                  });
                }
                // Re-throw to be handled by withErrorHandling
                throw dbError;
              }

              logger.info('Product updated successfully', {
                productId: input.productId,
              });

              // Invalidate cache using utility
              await invalidateProductCache({
                productId: input.productId,
              });

              return {
                success: true,
                message: 'تم تحديث المنتج بنجاح',
              };
            },
            {
              productId: input.productId,
              updatedBy: ctx.user?.id,
            }
          );
        }
      );
    }),

  // Delete product (soft delete - protected - admin only)
  deleteProduct: protectedProcedure
    .input(z.object({ productId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      return withPerformanceTracking(
        {
          operation: 'products.deleteProduct',
          details: {
            productId: input.productId,
            deletedBy: ctx.user?.id,
          },
        },
        async () => {
          return withErrorHandling(
            'products.deleteProduct',
            async () => {
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
              await db
                .update(products)
                .set({
                  isActive: 0,
                  updatedAt: new Date().toISOString(),
                })
                .where(eq(products.id, input.productId));

              logger.info('Product deleted successfully', {
                productId: input.productId,
              });

              // Invalidate cache using utility
              await invalidateProductCache({
                productId: input.productId,
              });

              return {
                success: true,
                message: 'تم حذف المنتج بنجاح',
              };
            },
            {
              productId: input.productId,
              deletedBy: ctx.user?.id,
            }
          );
        }
      );
    }),
});
