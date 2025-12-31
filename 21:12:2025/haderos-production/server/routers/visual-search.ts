/**
 * Visual Search tRPC Router
 * Handles image-based product search operations
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { generateImageEmbedding, analyzeAndSearchImage } from "../integrations/visual-search";
import { storagePut } from "../storage";
import {
  getAllImageEmbeddings,
  getProductImages,
  getProductsByIds,
  getImageEmbedding,
  createImageEmbedding,
  logVisualSearch,
  getSearchHistory,
  updateSearchFeedback,
} from "../db-visual-search";

export const visualSearchRouter = router({
  /**
   * Search for products by uploading an image
   * Returns similar products ranked by similarity score
   */
  searchByImage: protectedProcedure
    .input(z.object({
      imageData: z.string(), // Base64 encoded image
      topK: z.number().min(1).max(50).default(10),
      minSimilarity: z.number().min(0).max(1).default(0.5),
      includeFeatures: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Upload search image to S3
        const imageBuffer = Buffer.from(input.imageData.split(',')[1], 'base64');
        const timestamp = Date.now();
        const searchImageKey = `visual-search/search-${timestamp}.jpg`;
        
        const { url: searchImageUrl } = await storagePut(
          searchImageKey,
          imageBuffer,
          'image/jpeg'
        );
        
        // 2. Get all product embeddings from database
        const allEmbeddings = await getAllImageEmbeddings();
        
        // 3. Perform visual search
        const searchResult = await analyzeAndSearchImage(
          searchImageUrl,
          allEmbeddings,
          {
            topK: input.topK,
            minSimilarity: input.minSimilarity,
            includeFeatures: input.includeFeatures
          }
        );
        
        // 4. Get full product details for results
        const productIds = searchResult.similarProducts.map(p => p.productId);
        const productDetails = await getProductsByIds(productIds);
        
        // 5. Log search history
        await logVisualSearch({
          searchImageUrl,
          searchImageS3Key: searchImageKey,
          topResultProductId: searchResult.similarProducts[0]?.productId,
          topResultSimilarity: searchResult.similarProducts[0]?.similarity.toString(),
          totalResults: searchResult.similarProducts.length,
          userId: ctx.user.id,
          userRole: ctx.user.role || 'user',
          searchContext: 'manual_search',
          searchDuration: 0, // TODO: Calculate actual duration
        });
        
        return {
          searchImageUrl,
          features: searchResult.features,
          results: searchResult.similarProducts.map(result => ({
            ...result,
            product: productDetails.find(p => p.id === result.productId)
          }))
        };
      } catch (error) {
        console.error('[Visual Search] Error:', error);
        throw new Error('فشل البحث بالصورة. حاول مرة أخرى.');
      }
    }),

  /**
   * Generate embeddings for a product's images
   * Called after uploading new product images
   */
  generateEmbeddings: protectedProcedure
    .input(z.object({
      productId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Get all images for this product
        const images = await getProductImages(input.productId);
        
        const results = [];
        
        for (const image of images) {
          // Check if embedding already exists
          const existing = await getImageEmbedding(image.id);
          
          if (existing) {
            results.push({ imageId: image.id, status: 'skipped', reason: 'already_exists' });
            continue;
          }
          
          // Generate embedding
          const startTime = Date.now();
          const embedding = await generateImageEmbedding(image.s3Url);
          const processingTime = Date.now() - startTime;
          
          // Store embedding
          await createImageEmbedding({
            imageId: image.id,
            embeddingVector: JSON.stringify(embedding.vector),
            modelName: embedding.modelName,
            modelVersion: embedding.modelVersion,
            vectorDimensions: embedding.dimensions,
            processingTime,
            confidence: '0.95', // TODO: Get actual confidence from model
          });
          
          results.push({ imageId: image.id, status: 'success', processingTime });
        }
        
        return {
          productId: input.productId,
          totalImages: images.length,
          results
        };
      } catch (error) {
        console.error('[Visual Search] Embedding generation error:', error);
        throw new Error('فشل إنشاء embeddings');
      }
    }),

  /**
   * Get search history for analytics
   */
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      userId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await getSearchHistory(input.limit, input.userId);
    }),

  /**
   * Mark search result as helpful/not helpful
   * Used to improve search quality
   */
  provideFeedback: protectedProcedure
    .input(z.object({
      searchId: z.number(),
      wasHelpful: z.boolean(),
      selectedProductId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return await updateSearchFeedback(
        input.searchId,
        input.wasHelpful,
        input.selectedProductId
      );
    }),
});
