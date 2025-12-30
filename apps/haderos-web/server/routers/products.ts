import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { requireDb } from "../db";
import { products } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { applyDynamicPricing } from "../bio-modules/orders-bio-integration.js";
import { schemas } from "../_core/validation";
import { cache } from "../_core/cache";
import { logger } from "../_core/logger";

export const productsRouter = router({
  // Get all products
  getAllProducts: publicProcedure.query(async () => {
    return cache.getOrSet(
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
  }),

  // Get product by ID
  getProductById: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return cache.getOrSet(
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
            throw new Error("Product not found");
          }

          return product;
        },
        600 // 10 minutes TTL
      );
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
      const db = await requireDb();
      
      // Get product
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId));

      if (!product) {
        throw new Error("Product not found");
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
    .input(schemas.createProduct)
    .mutation(async ({ input }) => {
      logger.info('Creating new product', {
        modelCode: input.name,
        sku: input.sku,
        price: input.price,
      });

      const db = await requireDb();

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
        });

      logger.info('Product created successfully', { sku: input.sku });

      // Invalidate cache
      cache.delete('products:all');

      return {
        success: true,
        message: "تم إنشاء المنتج بنجاح",
      };
    }),

  // Update product (protected - admin only)
  updateProduct: protectedProcedure
    .input(schemas.updateProduct.extend({ productId: z.number() }))
    .mutation(async ({ input }) => {
      logger.info('Updating product', { productId: input.productId });

      const db = await requireDb();

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

      logger.info('Product updated successfully', { productId: input.productId });

      // Invalidate cache
      cache.delete('products:all');
      cache.delete(`products:${input.productId}`);

      return {
        success: true,
        message: "تم تحديث المنتج بنجاح",
      };
    }),

  // Delete product (soft delete - protected - admin only)
  deleteProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      logger.info('Deleting product (soft delete)', { productId: input.productId });

      const db = await requireDb();

      await db
        .update(products)
        .set({
          isActive: 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, input.productId));

      logger.info('Product deleted successfully', { productId: input.productId });

      // Invalidate cache
      cache.delete('products:all');
      cache.delete(`products:${input.productId}`);

      return {
        success: true,
        message: "تم حذف المنتج بنجاح",
      };
    }),
});
