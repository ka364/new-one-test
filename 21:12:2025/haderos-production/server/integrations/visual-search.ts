/**
 * Visual Search Service
 * Enables image-based product search using AI vision embeddings
 */

import { invokeLLM } from "../_core/llm";

interface ImageEmbedding {
  vector: number[];
  dimensions: number;
  modelName: string;
  modelVersion: string;
}

interface SimilarityResult {
  productId: number;
  imageId: number;
  similarity: number;
  product?: any;
}

/**
 * Generate embedding vector for an image
 * Uses AI vision model to convert image to numerical vector
 * 
 * @param imageUrl - Public URL of the image (S3 or uploaded)
 * @returns Embedding vector and metadata
 */
export async function generateImageEmbedding(imageUrl: string): Promise<ImageEmbedding> {
  try {
    // Use LLM with vision capabilities to analyze the image
    // The model will return a description that we can use for embedding
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this product image and describe its visual features in detail: style, color, material, design elements, and distinctive characteristics. Focus on features that would help identify similar products."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ]
    });
    
    const content = response.choices[0]?.message?.content;
    const description = typeof content === 'string' ? content : "";
    
    // Convert description to embedding vector
    // In a production system, you would use a dedicated embedding model
    // For now, we'll create a simple hash-based vector
    const vector = textToVector(description);
    
    return {
      vector,
      dimensions: vector.length,
      modelName: "claude-vision-text-embedding",
      modelVersion: "1.0"
    };
  } catch (error) {
    console.error('[Visual Search] Embedding generation error:', error);
    throw error;
  }
}

/**
 * Convert text description to numerical vector
 * Simple implementation - in production, use proper embedding model
 */
function textToVector(text: string, dimensions: number = 512): number[] {
  const vector: number[] = new Array(dimensions).fill(0);
  
  // Simple hash-based approach
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = (charCode * i) % dimensions;
    vector[index] += charCode / 1000;
  }
  
  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / (magnitude || 1));
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have same dimensions');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find similar products by comparing image embeddings
 * 
 * @param searchEmbedding - Embedding vector of search image
 * @param allEmbeddings - Array of {imageId, productId, embedding} from database
 * @param topK - Number of top results to return
 * @param minSimilarity - Minimum similarity threshold (0-1)
 * @returns Sorted array of similar products
 */
export function findSimilarProducts(
  searchEmbedding: number[],
  allEmbeddings: Array<{ imageId: number; productId: number; embedding: number[] }>,
  topK: number = 10,
  minSimilarity: number = 0.5
): SimilarityResult[] {
  // Calculate similarity for each product
  const similarities = allEmbeddings.map(item => ({
    productId: item.productId,
    imageId: item.imageId,
    similarity: cosineSimilarity(searchEmbedding, item.embedding)
  }));
  
  // Filter by minimum similarity and sort descending
  const filtered = similarities
    .filter(item => item.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity);
  
  // Return top K results
  return filtered.slice(0, topK);
}

/**
 * Extract visual features from image for search
 * Returns structured data about the image
 */
export async function extractVisualFeatures(imageUrl: string): Promise<{
  colors: string[];
  style: string;
  category: string;
  materials: string[];
  description: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this shoe/footwear image and extract: 1) Dominant colors, 2) Style (casual, formal, sport, etc.), 3) Category (sneakers, boots, sandals, etc.), 4) Visible materials (leather, canvas, rubber, etc.), 5) Brief description. Return as JSON."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "visual_features",
          strict: true,
          schema: {
            type: "object",
            properties: {
              colors: {
                type: "array",
                items: { type: "string" },
                description: "List of dominant colors"
              },
              style: {
                type: "string",
                description: "Style category"
              },
              category: {
                type: "string",
                description: "Product category"
              },
              materials: {
                type: "array",
                items: { type: "string" },
                description: "Visible materials"
              },
              description: {
                type: "string",
                description: "Brief description"
              }
            },
            required: ["colors", "style", "category", "materials", "description"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0]?.message?.content;
    const jsonString = typeof content === 'string' ? content : "{}";
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[Visual Search] Feature extraction error:', error);
    return {
      colors: [],
      style: "unknown",
      category: "unknown",
      materials: [],
      description: ""
    };
  }
}

/**
 * Analyze uploaded image and suggest matching products
 * High-level function that combines embedding + feature extraction
 */
export async function analyzeAndSearchImage(
  imageUrl: string,
  allEmbeddings: Array<{ imageId: number; productId: number; embedding: number[] }>,
  options?: {
    topK?: number;
    minSimilarity?: number;
    includeFeatures?: boolean;
  }
): Promise<{
  embedding: ImageEmbedding;
  features?: any;
  similarProducts: SimilarityResult[];
}> {
  const { topK = 10, minSimilarity = 0.5, includeFeatures = true } = options || {};
  
  // Generate embedding
  const embedding = await generateImageEmbedding(imageUrl);
  
  // Find similar products
  const similarProducts = findSimilarProducts(
    embedding.vector,
    allEmbeddings,
    topK,
    minSimilarity
  );
  
  // Extract features if requested
  let features;
  if (includeFeatures) {
    features = await extractVisualFeatures(imageUrl);
  }
  
  return {
    embedding,
    features,
    similarProducts
  };
}

export type { ImageEmbedding, SimilarityResult };
