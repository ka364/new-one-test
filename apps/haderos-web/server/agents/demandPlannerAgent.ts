// @ts-nocheck
/**
 * Demand Planner Agent
 * Analyzes demand patterns and forecasts future sales
 */

import { Event } from '../../drizzle/schema';
import { getAllOrders, createAgentInsight } from '../db';
import { getEventBus } from '../events/eventBus';

export interface DemandForecast {
  product: string;
  period: string;
  predictedDemand: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface InventoryRecommendation {
  product: string;
  currentStock: number;
  recommendedStock: number;
  reason: string;
  reasonAr: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Demand Planner Agent Class
 */
export class DemandPlannerAgent {
  constructor() {
    this.registerEventHandlers();
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers() {
    const eventBus = getEventBus();

    // Handle order created events
    eventBus.subscribe('order.created', async (event: Event) => {
      await this.handleOrderCreated(event);
    });

    // Handle demand forecast required events
    eventBus.subscribe('demand.forecast_required', async (event: Event) => {
      await this.handleForecastRequired(event);
    });

    console.log('[DemandPlannerAgent] Event handlers registered');
  }

  /**
   * Handle order created event
   */
  private async handleOrderCreated(event: Event) {
    try {
      const { order } = event.eventData;
      console.log(`[DemandPlannerAgent] Processing new order: ${order.orderNumber}`);

      // Analyze if this triggers any demand patterns
      await this.analyzeDemandPattern(order);
    } catch (error) {
      console.error('[DemandPlannerAgent] Error handling order created:', error);
    }
  }

  /**
   * Handle forecast required event
   */
  private async handleForecastRequired(event: Event) {
    try {
      const { product, period } = event.eventData;
      console.log(`[DemandPlannerAgent] Forecast required for: ${product}`);

      const forecast = await this.forecastDemand(product, period || 3);

      await createAgentInsight({
        agentType: 'demand_planner',
        insightType: 'demand_forecast',
        title: `Demand Forecast: ${product}`,
        titleAr: `توقع الطلب: ${product}`,
        description: `Forecasted demand for the next ${period || 3} months`,
        descriptionAr: `توقع الطلب للأشهر ${period || 3} القادمة`,
        insightData: { product, forecast },
        priority: 'medium',
        status: 'new',
      });
    } catch (error) {
      console.error('[DemandPlannerAgent] Error handling forecast required:', error);
    }
  }

  /**
   * Analyze demand pattern from order
   */
  private async analyzeDemandPattern(order: any) {
    try {
      // Get historical orders for the same product
      const allOrders = await getAllOrders(1000);
      const productOrders = allOrders.filter((o) => o.productName === order.productName);

      if (productOrders.length >= 5) {
        // Calculate trend
        const recentOrders = productOrders.slice(0, 10);
        const quantities = recentOrders.map((o) => o.quantity);
        const avgQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;

        // Detect if current order is significantly higher
        if (order.quantity > avgQuantity * 1.5) {
          await createAgentInsight({
            agentType: 'demand_planner',
            insightType: 'demand_spike',
            title: `Demand Spike Detected: ${order.productName}`,
            titleAr: `ارتفاع في الطلب: ${order.productName}`,
            description: `Order quantity (${order.quantity}) is ${Math.round((order.quantity / avgQuantity - 1) * 100)}% higher than average`,
            descriptionAr: `كمية الطلب (${order.quantity}) أعلى بنسبة ${Math.round((order.quantity / avgQuantity - 1) * 100)}% من المتوسط`,
            insightData: { order, avgQuantity },
            priority: 'high',
            status: 'new',
            relatedEntityType: 'order',
            relatedEntityId: order.id,
          });
        }
      }
    } catch (error) {
      console.error('[DemandPlannerAgent] Error analyzing demand pattern:', error);
    }
  }

  /**
   * Forecast demand for a product
   */
  async forecastDemand(product: string, months: number = 3): Promise<DemandForecast[]> {
    try {
      const allOrders = await getAllOrders(1000);
      const productOrders = allOrders.filter((o) => o.productName === product);

      if (productOrders.length === 0) {
        return [];
      }

      // Group orders by month
      const ordersByMonth = new Map<string, number>();
      productOrders.forEach((order) => {
        const month = new Date(order.createdAt).toISOString().slice(0, 7);
        const currentQty = ordersByMonth.get(month) || 0;
        ordersByMonth.set(month, currentQty + order.quantity);
      });

      // Calculate average monthly demand
      const monthlyDemands = Array.from(ordersByMonth.values());
      const avgDemand = monthlyDemands.reduce((a, b) => a + b, 0) / monthlyDemands.length;

      // Calculate trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (monthlyDemands.length >= 3) {
        const recent = monthlyDemands.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const older =
          monthlyDemands.slice(3, 6).reduce((a, b) => a + b, 0) /
          Math.min(3, monthlyDemands.length - 3);

        if (recent > older * 1.2) trend = 'increasing';
        else if (recent < older * 0.8) trend = 'decreasing';
      }

      // Generate forecasts
      const forecasts: DemandForecast[] = [];
      let trendMultiplier = 1.0;

      for (let i = 1; i <= months; i++) {
        const forecastDate = new Date();
        forecastDate.setMonth(forecastDate.getMonth() + i);
        const period = forecastDate.toISOString().slice(0, 7);

        // Apply trend
        if (trend === 'increasing') trendMultiplier += 0.05;
        else if (trend === 'decreasing') trendMultiplier -= 0.05;

        forecasts.push({
          product,
          period,
          predictedDemand: Math.round(avgDemand * trendMultiplier),
          confidence: 0.7,
          trend,
        });
      }

      return forecasts;
    } catch (error) {
      console.error('[DemandPlannerAgent] Error forecasting demand:', error);
      return [];
    }
  }

  /**
   * Generate inventory recommendations
   */
  async generateInventoryRecommendations(): Promise<InventoryRecommendation[]> {
    try {
      const recommendations: InventoryRecommendation[] = [];
      const allOrders = await getAllOrders(1000);

      // Group by product
      const productMap = new Map<string, any[]>();
      allOrders.forEach((order) => {
        if (!productMap.has(order.productName)) {
          productMap.set(order.productName, []);
        }
        productMap.get(order.productName)!.push(order);
      });

      // Generate recommendations for each product
      for (const [product, orders] of Array.from(productMap.entries())) {
        const recentOrders = orders.slice(0, 30); // Last 30 orders
        const avgQuantity =
          recentOrders.reduce((sum: number, o: any) => sum + o.quantity, 0) / recentOrders.length;

        // Simple recommendation: keep 2x average demand
        const recommendedStock = Math.ceil(avgQuantity * 2);

        recommendations.push({
          product,
          currentStock: 0, // Would come from inventory system
          recommendedStock,
          reason: `Based on average demand of ${Math.round(avgQuantity)} units`,
          reasonAr: `بناءً على متوسط الطلب ${Math.round(avgQuantity)} وحدة`,
          priority: avgQuantity > 10 ? 'high' : 'medium',
        });
      }

      return recommendations;
    } catch (error) {
      console.error('[DemandPlannerAgent] Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Analyze sales trends
   */
  async analyzeSalesTrends(months: number = 6) {
    try {
      const allOrders = await getAllOrders(1000);

      // Group by month
      const salesByMonth = new Map<string, { count: number; revenue: number }>();

      allOrders.forEach((order) => {
        const month = new Date(order.createdAt).toISOString().slice(0, 7);
        const current = salesByMonth.get(month) || { count: 0, revenue: 0 };
        current.count += 1;
        current.revenue += Number(order.totalAmount);
        salesByMonth.set(month, current);
      });

      // Convert to array and sort
      const trends = Array.from(salesByMonth.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, months);

      return trends;
    } catch (error) {
      console.error('[DemandPlannerAgent] Error analyzing sales trends:', error);
      return [];
    }
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(limit: number = 10) {
    try {
      const allOrders = await getAllOrders(1000);

      // Group by product
      const productSales = new Map<string, { quantity: number; revenue: number; orders: number }>();

      allOrders.forEach((order) => {
        const current = productSales.get(order.productName) || {
          quantity: 0,
          revenue: 0,
          orders: 0,
        };
        current.quantity += order.quantity;
        current.revenue += Number(order.totalAmount);
        current.orders += 1;
        productSales.set(order.productName, current);
      });

      // Convert to array and sort by revenue
      const topProducts = Array.from(productSales.entries())
        .map(([product, data]) => ({ product, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      return topProducts;
    } catch (error) {
      console.error('[DemandPlannerAgent] Error getting top products:', error);
      return [];
    }
  }
}

// Singleton instance
let demandPlannerAgentInstance: DemandPlannerAgent | null = null;

/**
 * Get the singleton Demand Planner Agent instance
 */
export function getDemandPlannerAgent(): DemandPlannerAgent {
  if (!demandPlannerAgentInstance) {
    demandPlannerAgentInstance = new DemandPlannerAgent();
  }
  return demandPlannerAgentInstance;
}

// Initialize the agent
getDemandPlannerAgent();
