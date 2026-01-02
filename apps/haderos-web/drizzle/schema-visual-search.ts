/**
 * Visual Search Schema
 * Enables image-based product search using AI embeddings
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  index,
} from 'drizzle-orm/mysql-core';
import { products } from './schema-nowshoes';

/**
 * Product Images
 * Stores all product images with metadata
 */
export const productImages = mysqlTable(
  'product_images',
  {
    id: int('id').primaryKey().autoincrement(),
    productId: int('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    // S3 Storage
    s3Url: varchar('s3_url', { length: 500 }).notNull(),
    s3Key: varchar('s3_key', { length: 255 }).notNull(),

    // Image Metadata
    imageType: varchar('image_type', { length: 50 }).notNull().default('product'), // product, detail, lifestyle, 360
    isPrimary: boolean('is_primary').default(false), // Main product image
    sortOrder: int('sort_order').default(0),

    // Original Source
    originalUrl: varchar('original_url', { length: 500 }), // Google Drive or other source

    // Image Properties
    width: int('width'),
    height: int('height'),
    fileSize: int('file_size'), // bytes
    mimeType: varchar('mime_type', { length: 50 }),

    // Timestamps
    uploadedAt: timestamp('uploaded_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    productIdIdx: index('product_id_idx').on(table.productId),
    isPrimaryIdx: index('is_primary_idx').on(table.isPrimary),
  })
);

/**
 * Image Embeddings
 * Stores AI-generated vector embeddings for similarity search
 *
 * Embeddings are numerical representations of images that capture visual features.
 * Similar images have similar embeddings (measured by cosine similarity).
 */
export const imageEmbeddings = mysqlTable(
  'image_embeddings',
  {
    id: int('id').primaryKey().autoincrement(),
    imageId: int('image_id')
      .notNull()
      .references(() => productImages.id, { onDelete: 'cascade' }),

    // Embedding Vector (stored as JSON array)
    // Example: [0.123, -0.456, 0.789, ...] (typically 512 or 1024 dimensions)
    embeddingVector: text('embedding_vector').notNull(),

    // Model Information
    modelName: varchar('model_name', { length: 100 }).notNull(), // e.g., "clip-vit-base-patch32"
    modelVersion: varchar('model_version', { length: 50 }).notNull(),
    vectorDimensions: int('vector_dimensions').notNull(), // e.g., 512, 1024

    // Processing Metadata
    processingTime: int('processing_time'), // milliseconds
    confidence: decimal('confidence', { precision: 5, scale: 4 }), // 0.0000 to 1.0000

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    imageIdIdx: index('image_id_idx').on(table.imageId),
    modelIdx: index('model_idx').on(table.modelName, table.modelVersion),
  })
);

/**
 * Visual Search History
 * Tracks all visual search queries for analytics and improvement
 */
export const visualSearchHistory = mysqlTable(
  'visual_search_history',
  {
    id: int('id').primaryKey().autoincrement(),

    // Search Input
    searchImageUrl: varchar('search_image_url', { length: 500 }),
    searchImageS3Key: varchar('search_image_s3_key', { length: 255 }),

    // Search Results
    topResultProductId: int('top_result_product_id').references(() => products.id),
    topResultSimilarity: decimal('top_result_similarity', { precision: 5, scale: 4 }),
    totalResults: int('total_results'),

    // User Context
    userId: int('user_id'), // From auth system
    userRole: varchar('user_role', { length: 50 }), // warehouse, sales, admin
    searchContext: varchar('search_context', { length: 100 }), // inventory_check, customer_inquiry, returns

    // Performance
    searchDuration: int('search_duration'), // milliseconds

    // User Feedback
    wasHelpful: boolean('was_helpful'),
    selectedProductId: int('selected_product_id').references(() => products.id), // What user actually selected

    // Timestamps
    searchedAt: timestamp('searched_at').defaultNow(),
  },
  (table) => ({
    searchedAtIdx: index('searched_at_idx').on(table.searchedAt),
    userIdIdx: index('user_id_idx').on(table.userId),
    contextIdx: index('context_idx').on(table.searchContext),
  })
);

/**
 * Barcode/QR Code Mappings
 * Maps barcodes and QR codes to products for quick scanning
 */
export const productBarcodes = mysqlTable(
  'product_barcodes',
  {
    id: int('id').primaryKey().autoincrement(),
    productId: int('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    // Barcode Data
    barcodeType: varchar('barcode_type', { length: 50 }).notNull(), // EAN13, UPC, QR, CODE128
    barcodeValue: varchar('barcode_value', { length: 255 }).notNull().unique(),

    // Variant Information (if barcode is for specific size/color)
    size: varchar('size', { length: 10 }),
    color: varchar('color', { length: 50 }),

    // Metadata
    isActive: boolean('is_active').default(true),
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    productIdIdx: index('product_id_idx').on(table.productId),
    barcodeValueIdx: index('barcode_value_idx').on(table.barcodeValue),
  })
);
