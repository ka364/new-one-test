// @ts-nocheck
import { eq, desc, and, gte, lte, sql, or, like, sum } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {
  users,
  orders,
  transactions,
  ethicalRules,
  auditTrail,
  events,
  notifications,
  reports,
  subscriptions,
  campaigns,
  agentInsights,
  chatMessages,
  investors,
  investorActivity,
} from '../drizzle/schema';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// Type definitions
export type InsertUser = InferInsertModel<typeof users>;
export type User = InferSelectModel<typeof users>;
export type InsertOrder = InferInsertModel<typeof orders>;
export type Order = InferSelectModel<typeof orders>;
export type InsertTransaction = InferInsertModel<typeof transactions>;
export type Transaction = InferSelectModel<typeof transactions>;
export type InsertEthicalRule = InferInsertModel<typeof ethicalRules>;
export type EthicalRule = InferSelectModel<typeof ethicalRules>;
export type InsertAuditTrail = InferInsertModel<typeof auditTrail>;
export type AuditTrail = InferSelectModel<typeof auditTrail>;
export type InsertEvent = InferInsertModel<typeof events>;
export type Event = InferSelectModel<typeof events>;
export type InsertNotification = InferInsertModel<typeof notifications>;
export type Notification = InferSelectModel<typeof notifications>;
export type InsertReport = InferInsertModel<typeof reports>;
export type Report = InferSelectModel<typeof reports>;
export type InsertSubscription = InferInsertModel<typeof subscriptions>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type InsertCampaign = InferInsertModel<typeof campaigns>;
export type Campaign = InferSelectModel<typeof campaigns>;
export type InsertAgentInsight = InferInsertModel<typeof agentInsights>;
export type AgentInsight = InferSelectModel<typeof agentInsights>;
export type InsertChatMessage = InferInsertModel<typeof chatMessages>;
export type ChatMessage = InferSelectModel<typeof chatMessages>;
import { ENV } from './_core/env';

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

// Export db instance for direct access (will be null until getDb() is called)
export { _db as db };

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : false,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn('[Database] Failed to connect:', error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

// Helper to ensure db is not null (for strict mode)
export async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection is not available');
  }
  return db;
}

// ============================================
// USER MANAGEMENT
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error('User openId is required for upsert');
  }

  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot upsert user: database not available');
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ['name', 'email', 'loginMethod'] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.permissions !== undefined) {
      values.permissions = user.permissions;
      updateSet.permissions = user.permissions;
    }
    if (user.isActive !== undefined) {
      values.isActive = user.isActive ? 1 : 0;
      updateSet.isActive = user.isActive ? 1 : 0;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toISOString();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toISOString();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error('[Database] Failed to upsert user:', error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot get user: database not available');
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: 'user' | 'admin') {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============================================
// ORDERS MANAGEMENT
// ============================================

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(orders).values(order);
  return result;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllOrders(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
}

export async function updateOrderStatus(orderId: number, status: Order['status']) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

export async function searchOrders(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(orders)
    .where(
      or(
        like(orders.orderNumber, `%${searchTerm}%`),
        like(orders.customerName, `%${searchTerm}%`),
        like(orders.customerEmail, `%${searchTerm}%`)
      )
    )
    .limit(50);
}

// ============================================
// TRANSACTIONS MANAGEMENT
// ============================================

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(transactions).values(transaction);
  return result;
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTransactions(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit);
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.createdAt, startDate), lte(transactions.createdAt, endDate)))
    .orderBy(desc(transactions.createdAt));
}

export async function updateTransactionEthicalStatus(
  transactionId: number,
  status: Transaction['ethicalCheckStatus'],
  notes?: string,
  checkedBy?: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transactions)
    .set({
      ethicalCheckStatus: status,
      ethicalCheckNotes: notes,
      ethicalCheckBy: checkedBy,
      ethicalCheckAt: new Date().toISOString(),
    })
    .where(eq(transactions.id, transactionId));
}

// ============================================
// ETHICAL RULES MANAGEMENT
// ============================================

export async function createEthicalRule(rule: InsertEthicalRule) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(ethicalRules).values(rule);
  return result;
}

export async function getEthicalRuleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ethicalRules).where(eq(ethicalRules.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEthicalRules() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(ethicalRules).orderBy(desc(ethicalRules.priority));
}

export async function getActiveEthicalRules() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(ethicalRules)
    .where(eq(ethicalRules.isActive, 1))
    .orderBy(desc(ethicalRules.priority));
}

export async function updateEthicalRuleStatus(ruleId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(ethicalRules)
    .set({ isActive: isActive ? 1 : 0 })
    .where(eq(ethicalRules.id, ruleId));
}

// ============================================
// AUDIT TRAIL
// ============================================

export async function createAuditLog(log: InsertAuditTrail) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(auditTrail).values(log);
  return result;
}

export async function getAuditLogsByEntity(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(auditTrail)
    .where(and(eq(auditTrail.entityType, entityType), eq(auditTrail.entityId, entityId)))
    .orderBy(desc(auditTrail.performedAt));
}

export async function getAllAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditTrail).orderBy(desc(auditTrail.performedAt)).limit(limit);
}

// ============================================
// EVENTS (Event Bus)
// ============================================

export async function createEvent(event: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(events).values(event);
  return result;
}

export async function getPendingEvents(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(events)
    .where(eq(events.status, 'pending'))
    .orderBy(desc(events.priority), events.createdAt)
    .limit(limit);
}

export async function updateEventStatus(
  eventId: number,
  status: Event['status'],
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(events)
    .set({
      status,
      processedAt: new Date().toISOString(),
      errorMessage,
    })
    .where(eq(events.id, eventId));
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getUserNotifications(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({
      isRead: 1,
      readAt: new Date().toISOString(),
    })
    .where(eq(notifications.id, notificationId));
}

// ============================================
// REPORTS
// ============================================

export async function createReport(report: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(reports).values(report);
  return result;
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllReports() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reports).orderBy(desc(reports.createdAt));
}

// ============================================
// SUBSCRIPTIONS
// ============================================

export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(subscriptions).values(subscription);
  return result;
}

export async function getSubscriptionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));
}

// ============================================
// CAMPAIGNS
// ============================================

export async function createCampaign(campaign: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(campaigns).values(campaign);
  return result;
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function updateCampaignMetrics(
  campaignId: number,
  metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    revenue?: string;
    spent?: string;
  }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(campaigns).set(metrics).where(eq(campaigns.id, campaignId));
}

// ============================================
// AGENT INSIGHTS
// ============================================

export async function createAgentInsight(insight: InsertAgentInsight) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(agentInsights).values(insight);
  return result;
}

export async function getAgentInsightById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agentInsights).where(eq(agentInsights.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAgentInsights(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(agentInsights).orderBy(desc(agentInsights.createdAt)).limit(limit);
}

export async function getAgentInsightsByType(agentType: AgentInsight['agentType']) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(agentInsights)
    .where(eq(agentInsights.agentType, agentType))
    .orderBy(desc(agentInsights.createdAt));
}

// ============================================
// CHAT MESSAGES
// ============================================

export async function createChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(chatMessages).values(message);
  return result;
}

export async function getChatMessagesByConversation(conversationId: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}

export async function getUserChatHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

// ============================================
// ANALYTICS & STATISTICS
// ============================================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalOrders, totalRevenue, pendingTransactions, activeUsers] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db
      .select({ total: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(eq(transactions.type, 'income')),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.status, 'pending')),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, 1)),
  ]);

  return {
    totalOrders: totalOrders[0]?.count || 0,
    totalRevenue: totalRevenue[0]?.total || 0,
    pendingTransactions: pendingTransactions[0]?.count || 0,
    activeUsers: activeUsers[0]?.count || 0,
  };
}

// ============================================
// SHIPPING & LOGISTICS
// ============================================

import {
  shippingCompanies,
  shippingZones,
  shipments,
  shipmentReturns,
  collections,
  collectionItems,
  dailyOperationalMetrics,
  adCampaignPerformance,
  revenueForecasts,
} from '../drizzle/schema';

export async function getAllShippingCompanies() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(shippingCompanies).where(eq(shippingCompanies.active, 1));
}

export async function createShippingCompany(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [result] = await db.insert(shippingCompanies).values(data);
  return result;
}

export async function getZonesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(shippingZones)
    .where(and(eq(shippingZones.companyId, companyId), eq(shippingZones.active, 1)));
}

export async function createShipment(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [result] = await db.insert(shipments).values({ ...data, status: 'pending' });
  return result;
}

export async function getShipmentsByOrder(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(shipments)
    .where(eq(shipments.orderId, orderId))
    .orderBy(desc(shipments.createdAt));
}

export async function updateShipmentStatus(id: number, status: any, updates?: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db
    .update(shipments)
    .set({ status, ...updates })
    .where(eq(shipments.id, id));
}

export async function createShipmentReturn(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [result] = await db.insert(shipmentReturns).values({ ...data, status: 'pending' });
  await updateShipmentStatus(data.shipmentId, 'returned', {
    returnedAt: new Date().toISOString(),
    returnReason: data.returnReason,
  });
  return result;
}

// ============================================
// COLLECTIONS
// ============================================

export async function createCollection(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [result] = await db.insert(collections).values({ ...data, status: 'pending' });
  return result;
}

export async function getCollectionsByCompany(
  companyId: number,
  startDate?: string,
  endDate?: string
) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(collections).where(eq(collections.companyId, companyId));

  if (startDate && endDate) {
    query = query.where(
      and(gte(collections.collectionDate, startDate), lte(collections.collectionDate, endDate))
    );
  }

  return await query.orderBy(desc(collections.collectionDate));
}

export async function confirmCollection(id: number, confirmedBy: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db
    .update(collections)
    .set({
      status: 'confirmed',
      confirmedBy,
      confirmedAt: new Date().toISOString(),
    })
    .where(eq(collections.id, id));
}

export async function addCollectionItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [result] = await db.insert(collectionItems).values(data);
  return result;
}

export async function getCollectionItems(collectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, collectionId));
}

export async function getPendingCollections() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(collections)
    .where(eq(collections.status, 'pending'))
    .orderBy(desc(collections.collectionDate));
}

export async function getTotalCollectionByDate(date: string) {
  const db = await getDb();
  if (!db) return { cashCollection: 0, bankCollection: 0, totalCollection: 0 };

  const result = await db
    .select({ totalCash: sum(collections.amount) })
    .from(collections)
    .where(
      and(
        eq(collections.collectionDate, date),
        eq(collections.collectionType, 'cash'),
        eq(collections.status, 'confirmed')
      )
    );

  const bankResult = await db
    .select({ totalBank: sum(collections.amount) })
    .from(collections)
    .where(
      and(
        eq(collections.collectionDate, date),
        eq(collections.collectionType, 'bank_transfer'),
        eq(collections.status, 'confirmed')
      )
    );

  const cashCollection = parseFloat(result[0]?.totalCash || '0');
  const bankCollection = parseFloat(bankResult[0]?.totalBank || '0');

  return {
    cashCollection,
    bankCollection,
    totalCollection: cashCollection + bankCollection,
  };
}

// ============================================
// METRICS & KPIs
// ============================================

export async function getOrCreateDailyMetrics(date: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [existing] = await db
    .select()
    .from(dailyOperationalMetrics)
    .where(eq(dailyOperationalMetrics.date, date));

  if (existing) return existing;

  await db.insert(dailyOperationalMetrics).values({ date });
  const [newMetrics] = await db
    .select()
    .from(dailyOperationalMetrics)
    .where(eq(dailyOperationalMetrics.date, date));

  return newMetrics;
}

export async function updateDailyMetrics(date: string, data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(dailyOperationalMetrics).set(data).where(eq(dailyOperationalMetrics.date, date));
}

export async function calculateAndUpdateKPIs(date: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const metrics = await getOrCreateDailyMetrics(date);

  const ordersCreatedValue = parseFloat(metrics.ordersCreatedValue);
  const ordersConfirmedValue = parseFloat(metrics.ordersConfirmedValue);
  const ordersShippedValue = parseFloat(metrics.ordersShippedValue);
  const ordersReturnedValue = parseFloat(metrics.ordersReturnedValue);
  const totalCollection = parseFloat(metrics.totalCollection);
  const operatingExpenses = parseFloat(metrics.operatingExpenses);
  const adSpend = parseFloat(metrics.adSpend);
  const treasuryPaid = parseFloat(metrics.treasuryPaid);

  const netShipmentsValue = ordersShippedValue - ordersReturnedValue;

  const tcr = ordersCreatedValue > 0 ? (totalCollection / ordersCreatedValue) * 100 : 0;
  const tcc = ordersConfirmedValue > 0 ? (totalCollection / ordersConfirmedValue) * 100 : 0;
  const tcs = ordersShippedValue > 0 ? (totalCollection / ordersShippedValue) * 100 : 0;
  const tcrn = netShipmentsValue > 0 ? (totalCollection / netShipmentsValue) * 100 : 0;
  const ocr = totalCollection > 0 ? (operatingExpenses / totalCollection) * 100 : 0;
  const adr = totalCollection > 0 ? (adSpend / totalCollection) * 100 : 0;
  const fdr = totalCollection > 0 ? (treasuryPaid / totalCollection) * 100 : 0;

  await db
    .update(dailyOperationalMetrics)
    .set({
      tcr: tcr.toFixed(2),
      tcc: tcc.toFixed(2),
      tcs: tcs.toFixed(2),
      tcrn: tcrn.toFixed(2),
      ocr: ocr.toFixed(2),
      adr: adr.toFixed(2),
      fdr: fdr.toFixed(2),
      calculatedAt: new Date().toISOString(),
    })
    .where(eq(dailyOperationalMetrics.date, date));

  return { tcr, tcc, tcs, tcrn, ocr, adr, fdr };
}

export async function getMetricsByDateRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(dailyOperationalMetrics)
    .where(
      and(gte(dailyOperationalMetrics.date, startDate), lte(dailyOperationalMetrics.date, endDate))
    )
    .orderBy(desc(dailyOperationalMetrics.date));
}

export async function createAdCampaign(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [result] = await db.insert(adCampaignPerformance).values(data);
  return result;
}

export async function getAdCampaignsByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(adCampaignPerformance)
    .where(eq(adCampaignPerformance.date, date))
    .orderBy(desc(adCampaignPerformance.createdAt));
}

export async function getLastCampaignEfficiency() {
  const db = await getDb();
  if (!db) return 0.12;

  const [lastCampaign] = await db
    .select()
    .from(adCampaignPerformance)
    .where(eq(adCampaignPerformance.active, 1))
    .orderBy(desc(adCampaignPerformance.date))
    .limit(1);

  return lastCampaign ? parseFloat(lastCampaign.costPerResult) : 0.12;
}

export async function createRevenueForecast(data: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [result] = await db.insert(revenueForecasts).values(data);
  return result;
}

export async function updateActualRevenue(date: string, actualRevenue: string) {
  const db = await getDb();
  if (!db) return null;

  const [forecast] = await db
    .select()
    .from(revenueForecasts)
    .where(eq(revenueForecasts.date, date));

  if (!forecast) return null;

  const expected = parseFloat(forecast.expectedRevenue);
  const actual = parseFloat(actualRevenue);
  const variance = actual - expected;
  const variancePercentage = expected > 0 ? (variance / expected) * 100 : 0;

  await db
    .update(revenueForecasts)
    .set({
      actualRevenue,
      variance: variance.toFixed(2),
      variancePercentage: variancePercentage.toFixed(2),
    })
    .where(eq(revenueForecasts.date, date));

  return { variance, variancePercentage };
}

export async function getForecastByDate(date: string) {
  const db = await getDb();
  if (!db) return null;
  const [forecast] = await db
    .select()
    .from(revenueForecasts)
    .where(eq(revenueForecasts.date, date));
  return forecast;
}

export function calculateExpectedRevenue(
  adSpend: number,
  lastCampaignEfficiency: number,
  averageOrderValue: number,
  shipmentRate: number,
  deliverySuccessRate: number
) {
  const expectedOrders = Math.floor(adSpend / lastCampaignEfficiency);
  const expectedRevenue =
    expectedOrders * averageOrderValue * (shipmentRate / 100) * (deliverySuccessRate / 100);

  return {
    expectedOrders,
    expectedRevenue: Math.round(expectedRevenue * 100) / 100,
  };
}
