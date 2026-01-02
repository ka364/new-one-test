/**
 * Products Service
 * خدمة المنتجات
 *
 * Business logic layer for product operations.
 * Separates business logic from router layer.
 */

import { requireDb } from '../db';
import { products } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { logger } from '../_core/logger';
import { cache } from '../_core/cache';
import { isDuplicateKeyError } from '../_core/error-handler';
import { applyDynamicPricing } from '../bio-modules/orders-bio-integration.js';
import { invalidateProductCache } from '../_core/cache-manager';
import {
  validatePositiveNumber,
  validateNonEmptyString,
} from '../_core/validation-utils';

// ============================================
// TYPES
// ============================================

export interface CreateProductInput {
  sku: string;
  name?: string;
  price: number;
  costPrice?: number;
  category?: string;
  createdBy: number;
}

export interface CreateProductResult {
  success: boolean;
  productId: number;
  message: string;
}

export interface UpdateProductInput {
  productId: number;
  sku?: string;
  price?: number;
  costPrice?: number;
  category?: string;
  isActive?: boolean;
  updatedBy: number;
}

export interface UpdateProductResult {
  success: boolean;
  message: string;
}

export interface GetDynamicPriceInput {
  productId: number;
  context?: {
    customerHistory?: number;
    timeOfDay?: number;
    dayOfWeek?: number;
    currentDemand?: 'low' | 'medium' | 'high';
  };
}

export interface DynamicPriceResult {
  productId: number;
  modelCode: string | null;
  basePrice: number;
  adjustedPrice: number;
  discount: number;
  discountPercentage: number;
  reason: string;
  savings: number;
}

// ============================================
// PRODUCTS SERVICE
// ============================================

export class ProductsService {
  /**
   * Get all products with caching
   */
  static async getAllProducts() {
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
        600 // 10 minutes TTL
      );
    } catch (cacheError: unknown) {
      logger.warn('Cache failed, fetching from DB', {
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
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

  /**
   * Get product by ID with caching
   */
  static async getProductById(productId: number) {
    validatePositiveNumber(productId, 'معرّف المنتج');

    logger.debug('Fetching product by ID', { productId });

    let product;
    try {
      product = await cache.getOrSet(
        `products:${productId}`,
        async () => {
          logger.debug('Cache miss - fetching product from DB', { productId });
          const db = await requireDb();

          const [productFromDb] = await db
            .select()
            .from(products)
            .where(eq(products.id, productId));

          if (!productFromDb) {
            logger.warn('Product not found', { productId });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'المنتج غير موجود',
            });
          }

          return productFromDb;
        },
        600 // 10 minutes TTL
      );
    } catch (cacheError: unknown) {
      // If cache error is NOT_FOUND, re-throw it
      if (cacheError instanceof TRPCError && cacheError.code === 'NOT_FOUND') {
        throw cacheError;
      }

      logger.warn('Cache failed, fetching from DB', {
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
      const db = await requireDb();
      const [productFromDb] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));

      if (!productFromDb) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'المنتج غير موجود',
        });
      }

      product = productFromDb;
    }

    logger.info('Product fetched successfully', {
      productId,
    });

    return product;
  }

  /**
   * Get dynamic price for a product (with Chameleon integration)
   */
  static async getDynamicPrice(input: GetDynamicPriceInput): Promise<DynamicPriceResult> {
    validatePositiveNumber(input.productId, 'معرّف المنتج');

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
  }

  /**
   * Create new product
   */
  static async createProduct(input: CreateProductInput): Promise<CreateProductResult> {
    // Input validation
    validateNonEmptyString(input.sku, 'رمز المنتج (SKU)');
    validateNonEmptyString(input.name || input.sku, 'اسم المنتج');
    validatePositiveNumber(input.price, 'السعر');

    logger.info('Creating new product', {
      modelCode: input.sku,
      sku: input.sku,
      price: input.price,
      createdBy: input.createdBy,
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
      // Re-throw to be handled by error handler
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
  }

  /**
   * Update product
   */
  static async updateProduct(input: UpdateProductInput): Promise<UpdateProductResult> {
    validatePositiveNumber(input.productId, 'معرّف المنتج');

    if (input.price !== undefined) {
      validatePositiveNumber(input.price, 'السعر');
    }

    if (input.sku !== undefined) {
      validateNonEmptyString(input.sku, 'رمز المنتج (SKU)');
    }

    logger.info('Updating product', {
      productId: input.productId,
      updatedBy: input.updatedBy,
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
    const updateData: Record<string, unknown> = {
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
      // Re-throw to be handled by error handler
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
  }

  /**
   * Delete product (soft delete)
   */
  static async deleteProduct(productId: number, deletedBy: number): Promise<{ success: boolean; message: string }> {
    validatePositiveNumber(productId, 'معرّف المنتج');

    logger.info('Deleting product (soft delete)', {
      productId,
      deletedBy,
    });

    const db = await requireDb();

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

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
      .where(eq(products.id, productId));

    logger.info('Product deleted successfully', {
      productId,
    });

    // Invalidate cache using utility
    await invalidateProductCache({
      productId,
    });

    return {
      success: true,
      message: 'تم حذف المنتج بنجاح',
    };
  }
}

