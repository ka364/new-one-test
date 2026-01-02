import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { requireDb } from '../db';
import { products } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { applyDynamicPricing } from '../bio-modules/orders-bio-integration.js';

export const productsRouter = router({
  // Get all products
  getAllProducts: publicProcedure.query(async () => {
    const db = await requireDb();
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, 1))
      .orderBy(desc(products.createdAt));
    return allProducts;
  }),

  // Get product by ID
  getProductById: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();

      const [product] = await db.select().from(products).where(eq(products.id, input.productId));

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    }),

  // Get dynamic price for a product (with Chameleon integration)
  getDynamicPrice: publicProcedure
    .input(
      z.object({
        productId: z.number(),
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
      const db = await requireDb();

      // Get product
      const [product] = await db.select().from(products).where(eq(products.id, input.productId));

      if (!product) {
        throw new Error('Product not found');
      }

      // Get base price
      const basePrice = product.sellingPrice
        ? parseFloat(product.sellingPrice)
        : parseFloat(product.supplierPrice) * 1.3; // 30% markup if no selling price

      // Apply dynamic pricing with Chameleon
      const pricingResult = await applyDynamicPricing(
        product.modelCode,
        basePrice,
        input.context || {}
      );

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
    }),

  // Create new product (protected - admin only)
  createProduct: protectedProcedure
    .input(
      z.object({
        modelCode: z.string(),
        supplierPrice: z.number(),
        sellingPrice: z.number().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();

      const result = await db.insert(products).values({
        modelCode: input.modelCode,
        supplierPrice: input.supplierPrice.toString(),
        sellingPrice: input.sellingPrice?.toString() || null,
        category: input.category || null,
        isActive: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'تم إنشاء المنتج بنجاح',
      };
    }),

  // Update product (protected - admin only)
  updateProduct: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        modelCode: z.string().optional(),
        supplierPrice: z.number().optional(),
        sellingPrice: z.number().optional(),
        category: z.string().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (input.modelCode !== undefined) updateData.modelCode = input.modelCode;
      if (input.supplierPrice !== undefined)
        updateData.supplierPrice = input.supplierPrice.toString();
      if (input.sellingPrice !== undefined) updateData.sellingPrice = input.sellingPrice.toString();
      if (input.category !== undefined) updateData.category = input.category;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db.update(products).set(updateData).where(eq(products.id, input.productId));

      return {
        success: true,
        message: 'تم تحديث المنتج بنجاح',
      };
    }),

  // Delete product (soft delete - protected - admin only)
  deleteProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();

      await db
        .update(products)
        .set({
          isActive: 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, input.productId));

      return {
        success: true,
        message: 'تم حذف المنتج بنجاح',
      };
    }),
});
