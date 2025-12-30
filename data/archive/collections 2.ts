import { db } from "../db";
import { collections, collectionItems } from "../../drizzle/schema";
import { eq, and, desc, sum, gte, lte } from "drizzle-orm";

// ============================================
// COLLECTIONS
// ============================================

export async function createCollection(data: {
  collectionType: 'cash' | 'bank_transfer';
  companyId: number;
  amount: string;
  collectionDate: string;
  receiptNumber?: string;
  bankReference?: string;
  notes?: string;
  createdBy: number;
}) {
  const [result] = await db.insert(collections).values({
    ...data,
    status: 'pending'
  });
  return result;
}

export async function getCollectionById(id: number) {
  const [collection] = await db.select().from(collections).where(eq(collections.id, id));
  return collection;
}

export async function getCollectionsByCompany(companyId: number, startDate?: string, endDate?: string) {
  let query = db.select().from(collections).where(eq(collections.companyId, companyId));
  
  if (startDate && endDate) {
    query = query.where(and(
      gte(collections.collectionDate, startDate),
      lte(collections.collectionDate, endDate)
    ));
  }
  
  return await query.orderBy(desc(collections.collectionDate));
}

export async function confirmCollection(id: number, confirmedBy: number) {
  await db.update(collections)
    .set({
      status: 'confirmed',
      confirmedBy,
      confirmedAt: new Date().toISOString()
    })
    .where(eq(collections.id, id));
}

export async function reconcileCollection(id: number) {
  await db.update(collections)
    .set({ status: 'reconciled' })
    .where(eq(collections.id, id));
}

// ============================================
// COLLECTION ITEMS
// ============================================

export async function addCollectionItem(data: {
  collectionId: number;
  orderId: number;
  amount: string;
}) {
  const [result] = await db.insert(collectionItems).values(data);
  return result;
}

export async function getCollectionItems(collectionId: number) {
  return await db
    .select()
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, collectionId));
}

export async function getCollectionsByOrder(orderId: number) {
  return await db
    .select()
    .from(collectionItems)
    .where(eq(collectionItems.orderId, orderId));
}

// ============================================
// COLLECTION ANALYTICS
// ============================================

export async function getTotalCollectionByDate(date: string) {
  const result = await db
    .select({
      totalCash: sum(collections.amount).as('total_cash'),
    })
    .from(collections)
    .where(and(
      eq(collections.collectionDate, date),
      eq(collections.collectionType, 'cash'),
      eq(collections.status, 'confirmed')
    ));
  
  const bankResult = await db
    .select({
      totalBank: sum(collections.amount).as('total_bank'),
    })
    .from(collections)
    .where(and(
      eq(collections.collectionDate, date),
      eq(collections.collectionType, 'bank_transfer'),
      eq(collections.status, 'confirmed')
    ));
  
  return {
    cashCollection: parseFloat(result[0]?.totalCash || '0'),
    bankCollection: parseFloat(bankResult[0]?.totalBank || '0'),
    totalCollection: parseFloat(result[0]?.totalCash || '0') + parseFloat(bankResult[0]?.totalBank || '0')
  };
}

export async function getPendingCollections() {
  return await db
    .select()
    .from(collections)
    .where(eq(collections.status, 'pending'))
    .orderBy(desc(collections.collectionDate));
}
