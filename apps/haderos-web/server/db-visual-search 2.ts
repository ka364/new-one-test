// @ts-nocheck
/**
 * Database functions for Visual Search
 */

import { requireDb } from './db';
import { productImages, imageEmbeddings, visualSearchHistory, products } from '../drizzle/schema';
import { eq, desc, inArray } from 'drizzle-orm';

/**
 * Get all image embeddings for similarity search
 */
export async function getAllImageEmbeddings() {
  const db = await requireDb();
  if (!db) return [];

  const results = await db
    .select({
      imageId: imageEmbeddings.imageId,
      productId: productImages.productId,
      embedding: imageEmbeddings.embeddingVector,
    })
    .from(imageEmbeddings)
    .innerJoin(productImages, eq(imageEmbeddings.imageId, productImages.id))
    .execute();

  return results.map((item) => ({
    imageId: item.imageId,
    productId: item.productId,
    embedding: JSON.parse(item.embedding as string) as number[],
  }));
}

/**
 * Get product images for a specific product
 */
export async function getProductImages(productId: number) {
  const db = await requireDb();
  if (!db) return [];

  return await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .execute();
}

/**
 * Get products by IDs
 */
export async function getProductsByIds(productIds: number[]) {
  const db = await requireDb();
  if (!db) return [];

  if (productIds.length === 0) return [];

  return await db.select().from(products).where(inArray(products.id, productIds)).execute();
}

/**
 * Check if embedding exists for an image
 */
export async function getImageEmbedding(imageId: number) {
  const db = await requireDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(imageEmbeddings)
    .where(eq(imageEmbeddings.imageId, imageId))
    .execute();

  return results[0] || null;
}

/**
 * Create image embedding
 */
export async function createImageEmbedding(data: {
  imageId: number;
  embeddingVector: string; // JSON string
  modelName: string;
  modelVersion: string;
  vectorDimensions: number;
  processingTime: number;
  confidence: string;
}) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result = await db.insert(imageEmbeddings).values(data).execute();
  return result;
}

/**
 * Log visual search
 */
export async function logVisualSearch(data: {
  searchImageUrl: string;
  searchImageS3Key: string;
  topResultProductId?: number;
  topResultSimilarity?: string;
  totalResults: number;
  userId: number;
  userRole: string;
  searchContext: string;
  searchDuration: number;
}) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  const result = await db.insert(visualSearchHistory).values(data).execute();
  return result;
}

/**
 * Get search history
 */
export async function getSearchHistory(limit: number = 50, userId?: number) {
  const db = await requireDb();
  if (!db) return [];

  let query = db
    .select()
    .from(visualSearchHistory)
    .orderBy(desc(visualSearchHistory.searchedAt))
    .limit(limit);

  if (userId) {
    query = query.where(eq(visualSearchHistory.userId, userId)) as any;
  }

  return await query.execute();
}

/**
 * Update search feedback
 */
export async function updateSearchFeedback(
  searchId: number,
  wasHelpful: boolean,
  selectedProductId?: number
) {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');

  await db
    .update(visualSearchHistory)
    .set({
      wasHelpful,
      selectedProductId,
    })
    .where(eq(visualSearchHistory.id, searchId))
    .execute();

  return { success: true };
}
