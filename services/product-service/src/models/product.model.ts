/**
 * Product Model
 */

import { z } from 'zod';

export const ProductStatus = z.enum([
  'draft',
  'active',
  'out_of_stock',
  'discontinued'
]);

export const ProductSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),

  // Names
  nameEn: z.string().min(1).max(200),
  nameAr: z.string().min(1).max(200).optional(),

  // Descriptions
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),

  // Pricing
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  discountPercentage: z.number().min(0).max(100).default(0),
  currency: z.string().default('EGP'),

  // Inventory
  stockQuantity: z.number().int().min(0).default(0),
  reservedStock: z.number().int().min(0).default(0),
  minimumStockLevel: z.number().int().min(0).default(5),

  // Categories
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),

  // Images
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    isPrimary: z.boolean().default(false)
  })).default([]),

  // Merchant
  merchantId: z.string().optional(),
  merchantName: z.string().optional(),

  // Specifications
  specifications: z.record(z.string(), z.any()).optional(),

  // Dimensions
  weight: z.number().optional(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.enum(['cm', 'mm', 'm']).default('cm')
  }).optional(),

  // Ratings
  averageRating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),

  // Status
  status: ProductStatus.default('draft'),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Product = z.infer<typeof ProductSchema>;

// Input schemas
export const CreateProductInput = z.object({
  sku: z.string(),
  nameEn: z.string().min(1),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  merchantId: z.string().optional()
});

export const UpdateProductInput = CreateProductInput.partial();

export const ReserveStockInput = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  orderId: z.string().optional()
});
