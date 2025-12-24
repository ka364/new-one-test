/**
 * Database functions for NOW SHOES Products
 * Using existing schema from schema-nowshoes.ts
 */

import { getDb } from "./db";
import { products, inventory } from "../drizzle/schema";
import { eq, and, like, sql } from "drizzle-orm";

const db = await getDb();

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;

// ==================== PRODUCTS ====================

/**
 * Create a new product
 */
export async function createProduct(product: NewProduct) {
  const [newProduct] = await db.insert(products).values(product);
  return newProduct;
}

/**
 * Create multiple products in bulk
 */
export async function createProductsBulk(productList: NewProduct[]) {
  if (productList.length === 0) return [];
  
  const result = await db.insert(products).values(productList);
  return result;
}

/**
 * Get product by ID
 */
export async function getProductById(id: number) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));
  
  return product;
}

/**
 * Get product by model code
 */
export async function getProductByModelCode(modelCode: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.modelCode, modelCode));
  
  return product;
}

/**
 * Get all products with optional filters
 */
export async function getProducts(filters?: {
  category?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = db.select().from(products);
  
  // Apply filters
  const conditions = [];
  
  if (filters?.category) {
    conditions.push(eq(products.category, filters.category));
  }
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  
  if (filters?.search) {
    conditions.push(
      sql`${products.modelCode} LIKE ${`%${filters.search}%`}`
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  // Apply pagination
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const results = await query;
  return results;
}

/**
 * Update product
 */
export async function updateProduct(id: number, updates: Partial<NewProduct>) {
  const [updated] = await db
    .update(products)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(products.id, id));
  
  return updated;
}

/**
 * Delete product
 */
export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id));
}

/**
 * Check if model code exists
 */
export async function modelCodeExists(modelCode: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.modelCode, modelCode));
  
  return !!existing;
}

/**
 * Get products count
 */
export async function getProductsCount(filters?: {
  category?: string;
  isActive?: boolean;
}) {
  const conditions = [];
  
  if (filters?.category) {
    conditions.push(eq(products.category, filters.category));
  }
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  return result?.count || 0;
}

// ==================== INVENTORY ====================

/**
 * Create inventory record
 */
export async function createInventory(inventoryData: NewInventory) {
  const [newInventory] = await db.insert(inventory).values(inventoryData);
  return newInventory;
}

/**
 * Create multiple inventory records in bulk
 */
export async function createInventoryBulk(inventoryList: NewInventory[]) {
  if (inventoryList.length === 0) return [];
  
  const result = await db.insert(inventory).values(inventoryList);
  return result;
}

/**
 * Get inventory for a product
 */
export async function getProductInventory(productId: number) {
  const results = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId));
  
  return results;
}

/**
 * Get specific inventory item
 */
export async function getInventoryItem(
  productId: number,
  size?: string,
  color?: string
) {
  const conditions = [eq(inventory.productId, productId)];
  
  if (size) {
    conditions.push(eq(inventory.size, size));
  }
  
  if (color) {
    conditions.push(eq(inventory.color, color));
  }
  
  const [item] = await db
    .select()
    .from(inventory)
    .where(and(...conditions));
  
  return item;
}

/**
 * Update inventory quantity
 */
export async function updateInventoryQuantity(
  id: number,
  quantity: number
) {
  const [updated] = await db
    .update(inventory)
    .set({
      quantity,
      updatedAt: new Date()
    })
    .where(eq(inventory.id, id));
  
  return updated;
}

/**
 * Get low stock items
 */
export async function getLowStockItems(threshold?: number) {
  const results = await db
    .select()
    .from(inventory)
    .where(
      threshold
        ? sql`${inventory.quantity} < ${threshold}`
        : sql`${inventory.quantity} < ${inventory.minStockLevel}`
    );
  
  return results;
}

/**
 * Get total inventory value
 */
export async function getTotalInventoryValue() {
  const results = await db
    .select({
      productId: inventory.productId,
      quantity: inventory.quantity,
      supplierPrice: products.supplierPrice
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id));
  
  const totalValue = results.reduce((sum: number, item: any) => {
    return sum + (item.quantity * parseFloat(item.supplierPrice.toString()));
  }, 0);
  
  return totalValue;
}

/**
 * Search products with inventory
 */
export async function searchProductsWithInventory(searchTerm: string) {
  const results = await db
    .select({
      product: products,
      inventory: inventory
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .where(
      sql`${products.modelCode} LIKE ${`%${searchTerm}%`}`
    );
  
  return results;
}
