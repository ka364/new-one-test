/**
 * Sales Prediction Engine
 * محرك التنبؤ بالمبيعات
 * 
 * This AI-powered engine analyzes historical data and market trends
 * to predict future sales, optimal inventory levels, and profitability.
 */

import type { MerchantInventory, MerchantOrder } from './store-system';

export interface SalesPrediction {
  merchantId: string;
  predictionDate: Date;
  timeframe: 'daily' | 'weekly' | 'monthly';
  predictions: {
    expectedSales: number;
    expectedOrders: number;
    expectedProfit: number;
    confidence: number; // 0-100
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    productNameAr: string;
    expectedSales: number;
    expectedQuantity: number;
    confidence: number;
  }>;
  recommendations: string[];
  recommendationsAr: string[];
}

export interface InventoryRecommendation {
  productId: string;
  productName: string;
  productNameAr: string;
  currentStock: number;
  recommendedStock: number;
  reorderQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  reasonAr: string;
  expectedDaysUntilStockout: number;
  potentialLostSales: number;
}

export interface ProfitabilityAnalysis {
  productId: string;
  productName: string;
  productNameAr: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number; // Percentage
  roi: number; // Return on Investment percentage
  ranking: number; // 1 = best performer
  trend: 'increasing' | 'stable' | 'decreasing';
  recommendation: string;
  recommendationAr: string;
}

/**
 * Sales Prediction Engine
 */
export class SalesPredictionEngine {
  /**
   * Predict future sales based on historical data
   */
  predictSales(
    merchantId: string,
    historicalOrders: MerchantOrder[],
    timeframe: 'daily' | 'weekly' | 'monthly'
  ): SalesPrediction {
    // Simple moving average prediction (in production, use ML models)
    const recentOrders = this.getRecentOrders(historicalOrders, timeframe);
    
    const avgSales = recentOrders.reduce((sum, ord) => sum + ord.total, 0) / Math.max(recentOrders.length, 1);
    const avgOrders = recentOrders.length;
    const avgProfit = recentOrders.reduce((sum, ord) => sum + ord.profit, 0) / Math.max(recentOrders.length, 1);

    // Calculate confidence based on data consistency
    const salesVariance = this.calculateVariance(recentOrders.map(o => o.total));
    const confidence = Math.max(50, Math.min(95, 100 - (salesVariance / avgSales) * 100));

    // Identify top products
    const productSales = new Map<string, { name: string, nameAr: string, sales: number, quantity: number }>();
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = productSales.get(item.productId) || { 
          name: item.productName, 
          nameAr: item.productNameAr, 
          sales: 0, 
          quantity: 0 
        };
        existing.sales += item.price * item.quantity;
        existing.quantity += item.quantity;
        productSales.set(item.productId, existing);
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        productNameAr: data.nameAr,
        expectedSales: data.sales / Math.max(recentOrders.length, 1),
        expectedQuantity: Math.ceil(data.quantity / Math.max(recentOrders.length, 1)),
        confidence: confidence * 0.9, // Slightly lower confidence for individual products
      }))
      .sort((a, b) => b.expectedSales - a.expectedSales)
      .slice(0, 5);

    // Generate recommendations
    const recommendations: string[] = [];
    const recommendationsAr: string[] = [];

    if (avgSales > 0) {
      const growthRate = this.calculateGrowthRate(recentOrders);
      if (growthRate > 10) {
        recommendations.push(`Sales are growing at ${growthRate.toFixed(1)}%! Consider increasing inventory.`);
        recommendationsAr.push(`المبيعات تنمو بمعدل ${growthRate.toFixed(1)}%! فكر في زيادة المخزون.`);
      } else if (growthRate < -10) {
        recommendations.push(`Sales are declining. Review pricing and marketing strategy.`);
        recommendationsAr.push(`المبيعات تتراجع. راجع استراتيجية التسعير والتسويق.`);
      }
    }

    if (topProducts.length > 0) {
      recommendations.push(`Focus on ${topProducts[0].productName} - it's your best seller!`);
      recommendationsAr.push(`ركز على ${topProducts[0].productNameAr} - إنه الأكثر مبيعاً!`);
    }

    return {
      merchantId,
      predictionDate: new Date(),
      timeframe,
      predictions: {
        expectedSales: avgSales,
        expectedOrders: avgOrders,
        expectedProfit: avgProfit,
        confidence,
      },
      topProducts,
      recommendations,
      recommendationsAr,
    };
  }

  /**
   * Generate inventory recommendations
   */
  generateInventoryRecommendations(
    inventory: MerchantInventory[],
    historicalOrders: MerchantOrder[]
  ): InventoryRecommendation[] {
    const recommendations: InventoryRecommendation[] = [];

    inventory.forEach(item => {
      // Calculate average daily sales
      const productOrders = historicalOrders.filter(order =>
        order.items.some(i => i.productId === item.productId)
      );

      const totalQuantitySold = productOrders.reduce((sum, order) => {
        const orderItem = order.items.find(i => i.productId === item.productId);
        return sum + (orderItem?.quantity || 0);
      }, 0);

      const daysSinceFirstSale = item.lastSaleDate
        ? Math.max(1, (Date.now() - item.purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        : 1;

      const avgDailySales = totalQuantitySold / daysSinceFirstSale;
      const daysUntilStockout = avgDailySales > 0 ? item.availableQuantity / avgDailySales : 999;

      let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let reason = '';
      let reasonAr = '';
      let recommendedStock = Math.ceil(avgDailySales * 30); // 30 days supply

      if (daysUntilStockout < 3) {
        urgency = 'critical';
        reason = 'Stock will run out in less than 3 days!';
        reasonAr = 'المخزون سينفد في أقل من 3 أيام!';
      } else if (daysUntilStockout < 7) {
        urgency = 'high';
        reason = 'Stock running low, reorder soon';
        reasonAr = 'المخزون ينخفض، اطلب قريباً';
      } else if (daysUntilStockout < 14) {
        urgency = 'medium';
        reason = 'Consider reordering to maintain stock levels';
        reasonAr = 'فكر في إعادة الطلب للحفاظ على مستويات المخزون';
      } else {
        urgency = 'low';
        reason = 'Stock levels are healthy';
        reasonAr = 'مستويات المخزون جيدة';
      }

      const reorderQuantity = Math.max(0, recommendedStock - item.quantity);
      const potentialLostSales = Math.max(0, avgDailySales * Math.max(0, 7 - daysUntilStockout)) * item.sellingPrice;

      if (urgency !== 'low' || reorderQuantity > 0) {
        recommendations.push({
          productId: item.productId,
          productName: item.productName,
          productNameAr: item.productNameAr,
          currentStock: item.quantity,
          recommendedStock,
          reorderQuantity,
          urgency,
          reason,
          reasonAr,
          expectedDaysUntilStockout: Math.ceil(daysUntilStockout),
          potentialLostSales,
        });
      }
    });

    // Sort by urgency
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  }

  /**
   * Analyze product profitability
   */
  analyzeProfitability(
    inventory: MerchantInventory[],
    historicalOrders: MerchantOrder[]
  ): ProfitabilityAnalysis[] {
    const analysis: ProfitabilityAnalysis[] = [];

    inventory.forEach(item => {
      const productOrders = historicalOrders.filter(order =>
        order.items.some(i => i.productId === item.productId)
      );

      let totalRevenue = 0;
      let totalCost = 0;
      let totalQuantity = 0;

      productOrders.forEach(order => {
        const orderItem = order.items.find(i => i.productId === item.productId);
        if (orderItem) {
          totalRevenue += orderItem.price * orderItem.quantity;
          totalCost += orderItem.cost * orderItem.quantity;
          totalQuantity += orderItem.quantity;
        }
      });

      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      const roi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

      // Determine trend (simple: compare first half vs second half of orders)
      const midpoint = Math.floor(productOrders.length / 2);
      const firstHalfSales = productOrders.slice(0, midpoint).reduce((sum, order) => {
        const orderItem = order.items.find(i => i.productId === item.productId);
        return sum + (orderItem ? orderItem.quantity : 0);
      }, 0);
      const secondHalfSales = productOrders.slice(midpoint).reduce((sum, order) => {
        const orderItem = order.items.find(i => i.productId === item.productId);
        return sum + (orderItem ? orderItem.quantity : 0);
      }, 0);

      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (secondHalfSales > firstHalfSales * 1.2) trend = 'increasing';
      else if (secondHalfSales < firstHalfSales * 0.8) trend = 'decreasing';

      let recommendation = '';
      let recommendationAr = '';

      if (profitMargin > 30 && trend === 'increasing') {
        recommendation = 'Excellent performer! Increase stock and promote heavily.';
        recommendationAr = 'أداء ممتاز! زد المخزون وروج بقوة.';
      } else if (profitMargin < 10) {
        recommendation = 'Low margin. Consider increasing price or finding cheaper supplier.';
        recommendationAr = 'هامش ربح منخفض. فكر في زيادة السعر أو إيجاد مورد أرخص.';
      } else if (trend === 'decreasing') {
        recommendation = 'Sales declining. Review marketing strategy or consider discontinuing.';
        recommendationAr = 'المبيعات تتراجع. راجع استراتيجية التسويق أو فكر في التوقف عن بيعه.';
      } else {
        recommendation = 'Solid performer. Maintain current strategy.';
        recommendationAr = 'أداء جيد. حافظ على الاستراتيجية الحالية.';
      }

      analysis.push({
        productId: item.productId,
        productName: item.productName,
        productNameAr: item.productNameAr,
        totalSold: totalQuantity,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        roi,
        ranking: 0, // Will be set after sorting
        trend,
        recommendation,
        recommendationAr,
      });
    });

    // Sort by total profit and assign rankings
    analysis.sort((a, b) => b.totalProfit - a.totalProfit);
    analysis.forEach((item, index) => {
      item.ranking = index + 1;
    });

    return analysis;
  }

  /**
   * Get recent orders based on timeframe
   */
  private getRecentOrders(orders: MerchantOrder[], timeframe: 'daily' | 'weekly' | 'monthly'): MerchantOrder[] {
    const now = Date.now();
    const cutoff = timeframe === 'daily' 
      ? now - (7 * 24 * 60 * 60 * 1000) // Last 7 days
      : timeframe === 'weekly'
      ? now - (4 * 7 * 24 * 60 * 60 * 1000) // Last 4 weeks
      : now - (3 * 30 * 24 * 60 * 60 * 1000); // Last 3 months

    return orders.filter(order => order.orderDate.getTime() >= cutoff);
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length);
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(orders: MerchantOrder[]): number {
    if (orders.length < 2) return 0;

    const midpoint = Math.floor(orders.length / 2);
    const firstHalf = orders.slice(0, midpoint);
    const secondHalf = orders.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((sum, o) => sum + o.total, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, o) => sum + o.total, 0) / secondHalf.length;

    if (firstHalfAvg === 0) return 0;
    return ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  }
}

// Singleton instance
let predictionEngine: SalesPredictionEngine | null = null;

/**
 * Get the sales prediction engine instance
 */
export function getSalesPredictionEngine(): SalesPredictionEngine {
  if (!predictionEngine) {
    predictionEngine = new SalesPredictionEngine();
  }
  return predictionEngine;
}
