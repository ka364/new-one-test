/**
 * Database functions for product import
 */

import { getDb } from './db';
import * as schema from '../drizzle/schema';

export async function insertProducts(products: any[]) {
  const db = await getDb();
  
  const inserted = [];
  const failed = [];
  
  for (const product of products) {
    try {
      const [result] = await db.insert(schema.nowshoesProducts).values({
        modelCode: product.modelCode,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        costPrice: product.costPrice,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        category: product.category,
        subCategory: product.subCategory,
        brand: product.brand,
        season: product.season,
        gender: product.gender,
        material: product.material,
        description: product.description,
        imageUrl: product.imageUrl,
        images: product.images ? JSON.stringify(product.images) : null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      inserted.push(result);
    } catch (error) {
      failed.push({ product, error: String(error) });
    }
  }
  
  return { inserted, failed };
}

export async function getProductByModelCode(modelCode: string) {
  const db = await getDb();
  
  const [product] = await db
    .select()
    .from(schema.nowshoesProducts)
    .where(schema.eq(schema.nowshoesProducts.modelCode, modelCode))
    .limit(1);
  
  return product;
}

export async function getAllProducts() {
  const db = await getDb();
  
  const products = await db
    .select()
    .from(schema.nowshoesProducts)
    .orderBy(schema.desc(schema.nowshoesProducts.createdAt));
  
  return products;
}

export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  
  await db
    .update(schema.nowshoesProducts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(schema.eq(schema.nowshoesProducts.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  
  await db
    .delete(schema.nowshoesProducts)
    .where(schema.eq(schema.nowshoesProducts.id, id));
}
