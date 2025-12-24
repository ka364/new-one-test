import { db } from "../db";
import { 
  dailyOperationalMetrics, 
  adCampaignPerformance, 
  revenueForecasts 
} from "../../drizzle/schema";
import { eq, desc, gte, lte, and, sum, avg } from "drizzle-orm";

// ============================================
// DAILY OPERATIONAL METRICS
// ============================================

export async function getOrCreateDailyMetrics(date: string) {
  const [existing] = await db
    .select()
    .from(dailyOperationalMetrics)
    .where(eq(dailyOperationalMetrics.date, date));
  
  if (existing) {
    return existing;
  }
  
  // Create new metrics for the day
  const [result] = await db.insert(dailyOperationalMetrics).values({ date });
  const [newMetrics] = await db
    .select()
    .from(dailyOperationalMetrics)
    .where(eq(dailyOperationalMetrics.date, date));
  
  return newMetrics;
}

export async function updateDailyMetrics(date: string, data: Partial<{
  ordersCreated: number;
  ordersCreatedValue: string;
  ordersConfirmed: number;
  ordersConfirmedValue: string;
  ordersShipped: number;
  ordersShippedValue: string;
  ordersReturned: number;
  ordersReturnedValue: string;
  ordersDelivered: number;
  ordersDeliveredValue: string;
  totalCollection: string;
  cashCollection: string;
  bankCollection: string;
  operatingExpenses: string;
  adSpend: string;
  treasuryPaid: string;
}>) {
  await db
    .update(dailyOperationalMetrics)
    .set(data)
    .where(eq(dailyOperationalMetrics.date, date));
}

export async function calculateAndUpdateKPIs(date: string) {
  const metrics = await getOrCreateDailyMetrics(date);
  
  const ordersCreatedValue = parseFloat(metrics.ordersCreatedValue);
  const ordersConfirmedValue = parseFloat(metrics.ordersConfirmedValue);
  const ordersShippedValue = parseFloat(metrics.ordersShippedValue);
  const ordersReturnedValue = parseFloat(metrics.ordersReturnedValue);
  const totalCollection = parseFloat(metrics.totalCollection);
  const operatingExpenses = parseFloat(metrics.operatingExpenses);
  const adSpend = parseFloat(metrics.adSpend);
  const treasuryPaid = parseFloat(metrics.treasuryPaid);
  
  // Calculate net shipments value (after returns)
  const netShipmentsValue = ordersShippedValue - ordersReturnedValue;
  
  // Calculate KPIs
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
      calculatedAt: new Date().toISOString()
    })
    .where(eq(dailyOperationalMetrics.date, date));
  
  return {
    tcr, tcc, tcs, tcrn, ocr, adr, fdr
  };
}

export async function getMetricsByDateRange(startDate: string, endDate: string) {
  return await db
    .select()
    .from(dailyOperationalMetrics)
    .where(and(
      gte(dailyOperationalMetrics.date, startDate),
      lte(dailyOperationalMetrics.date, endDate)
    ))
    .orderBy(desc(dailyOperationalMetrics.date));
}

// ============================================
// AD CAMPAIGN PERFORMANCE
// ============================================

export async function createAdCampaign(data: {
  date: string;
  campaignName: string;
  platform: 'facebook' | 'instagram' | 'google' | 'tiktok' | 'snapchat' | 'other';
  spend: string;
  results: number;
  costPerResult: string;
  reach?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  messagesStarted?: number;
  costPerMessage?: string;
  notes?: string;
  createdBy: number;
}) {
  const [result] = await db.insert(adCampaignPerformance).values(data);
  return result;
}

export async function getAdCampaignsByDate(date: string) {
  return await db
    .select()
    .from(adCampaignPerformance)
    .where(eq(adCampaignPerformance.date, date))
    .orderBy(desc(adCampaignPerformance.createdAt));
}

export async function getLastCampaignEfficiency() {
  const [lastCampaign] = await db
    .select()
    .from(adCampaignPerformance)
    .where(eq(adCampaignPerformance.active, 1))
    .orderBy(desc(adCampaignPerformance.date))
    .limit(1);
  
  if (!lastCampaign) {
    return 0.12; // Default efficiency
  }
  
  return parseFloat(lastCampaign.costPerResult);
}

export async function getAverageCampaignEfficiency(days: number = 7) {
  const result = await db
    .select({
      avgCostPerResult: avg(adCampaignPerformance.costPerResult).as('avg_cost')
    })
    .from(adCampaignPerformance)
    .where(eq(adCampaignPerformance.active, 1))
    .limit(days);
  
  return parseFloat(result[0]?.avgCostPerResult || '0.12');
}

// ============================================
// REVENUE FORECASTS
// ============================================

export async function createRevenueForecast(data: {
  date: string;
  adSpend: string;
  lastCampaignEfficiency: string;
  expectedOrders: number;
  averageOrderValue: string;
  shipmentRate: string;
  deliverySuccessRate: string;
  expectedRevenue: string;
  notes?: string;
  createdBy: number;
}) {
  const [result] = await db.insert(revenueForecasts).values(data);
  return result;
}

export async function updateActualRevenue(date: string, actualRevenue: string) {
  const [forecast] = await db
    .select()
    .from(revenueForecasts)
    .where(eq(revenueForecasts.date, date));
  
  if (!forecast) {
    return null;
  }
  
  const expected = parseFloat(forecast.expectedRevenue);
  const actual = parseFloat(actualRevenue);
  const variance = actual - expected;
  const variancePercentage = expected > 0 ? (variance / expected) * 100 : 0;
  
  await db
    .update(revenueForecasts)
    .set({
      actualRevenue,
      variance: variance.toFixed(2),
      variancePercentage: variancePercentage.toFixed(2)
    })
    .where(eq(revenueForecasts.date, date));
  
  return { variance, variancePercentage };
}

export async function getForecastByDate(date: string) {
  const [forecast] = await db
    .select()
    .from(revenueForecasts)
    .where(eq(revenueForecasts.date, date));
  
  return forecast;
}

export async function calculateExpectedRevenue(
  adSpend: number,
  lastCampaignEfficiency: number,
  averageOrderValue: number,
  shipmentRate: number, // percentage (e.g., 90 for 90%)
  deliverySuccessRate: number // percentage (e.g., 50 for 50%)
): Promise<{
  expectedOrders: number;
  expectedRevenue: number;
}> {
  // Calculate expected orders from ad spend
  const expectedOrders = Math.floor(adSpend / lastCampaignEfficiency);
  
  // Calculate expected revenue
  // Formula: Orders × Average Value × Shipment Rate × Delivery Success Rate
  const expectedRevenue = expectedOrders * averageOrderValue * (shipmentRate / 100) * (deliverySuccessRate / 100);
  
  return {
    expectedOrders,
    expectedRevenue: Math.round(expectedRevenue * 100) / 100
  };
}
