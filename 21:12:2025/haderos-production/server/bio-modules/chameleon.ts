/**
 * Chameleon Module - Adaptive Response & Dynamic Pricing
 * 
 * Inspired by: Chameleon's ability to change color based on environment
 * Problem: Fixed pricing in dynamic markets
 * Solution: Real-time adaptive pricing and strategy
 */

import { getEventBus } from "../events/eventBus";
import { createAgentInsight } from "../db";

export interface MarketConditions {
  demand: number; // 0-100
  competition: number; // 0-100
  seasonality: number; // 0-100
  inventory: number; // 0-100
  trend: "rising" | "stable" | "falling";
}

export interface PricingStrategy {
  id: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  adjustment: number; // Percentage
  reason: string;
  confidence: number; // 0-100
  expectedImpact: {
    sales: number; // Percentage change
    revenue: number; // Percentage change
    profit: number; // Percentage change
  };
  validUntil: Date;
}

export interface AdaptiveDecision {
  action: "increase_price" | "decrease_price" | "maintain_price" | "promote" | "discount";
  magnitude: number; // Percentage or amount
  reason: string;
  confidence: number;
  marketConditions: MarketConditions;
  timestamp: Date;
}

/**
 * Chameleon Adaptive Engine
 * 
 * Capabilities:
 * 1. Monitor market conditions
 * 2. Analyze competitor pricing
 * 3. Dynamic price optimization
 * 4. Demand forecasting
 * 5. Promotional strategy
 * 6. A/B testing automation
 */
export class ChameleonAdaptiveEngine {
  private readonly PRICE_CHANGE_THRESHOLD = 5; // Minimum % change to trigger
  private readonly MAX_PRICE_INCREASE = 30; // Maximum % increase
  private readonly MAX_PRICE_DECREASE = 40; // Maximum % decrease
  private readonly MONITORING_INTERVAL = 3600000; // 1 hour

  constructor() {
    this.startMarketMonitoring();
    this.registerEventHandlers();
  }

  /**
   * Start market monitoring
   */
  private startMarketMonitoring(): void {
    setInterval(async () => {
      await this.analyzeAndAdapt();
    }, this.MONITORING_INTERVAL);

    console.log("[Chameleon] Market monitoring started");
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    const eventBus = getEventBus();

    // Listen for market signals
    eventBus.on("order.created", async (event) => {
      await this.recordDemandSignal(event);
    });

    eventBus.on("product.viewed", async (event) => {
      await this.recordInterestSignal(event);
    });

    console.log("[Chameleon] Event handlers registered");
  }

  /**
   * Analyze market and adapt strategies
   */
  async analyzeAndAdapt(): Promise<void> {
    try {
      const { db } = await import("../db");
      const { products } = await import("../../drizzle/schema");

      // Get all active products
      const allProducts = await db.select().from(products);

      for (const product of allProducts) {
        // Analyze market conditions
        const conditions = await this.analyzeMarketConditions(product.id);

        // Generate adaptive decision
        const decision = await this.generateAdaptiveDecision(product, conditions);

        if (decision) {
          // Apply decision
          await this.applyAdaptiveDecision(product, decision);
        }
      }
    } catch (error) {
      console.error("[Chameleon] Error in analyzeAndAdapt:", error);
    }
  }

  /**
   * Analyze market conditions for a product
   */
  async analyzeMarketConditions(productId: number): Promise<MarketConditions> {
    // Analyze demand
    const demand = await this.analyzeDemand(productId);

    // Analyze competition
    const competition = await this.analyzeCompetition(productId);

    // Analyze seasonality
    const seasonality = await this.analyzeSeasonality(productId);

    // Analyze inventory
    const inventory = await this.analyzeInventory(productId);

    // Determine trend
    const trend = await this.determineTrend(productId);

    return {
      demand,
      competition,
      seasonality,
      inventory,
      trend
    };
  }

  /**
   * Analyze demand
   */
  private async analyzeDemand(productId: number): Promise<number> {
    try {
      const { db } = await import("../db");
      const { events } = await import("../../drizzle/schema");
      const { eq, and, gte } = await import("drizzle-orm");

      // Count orders in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const orderEvents = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.type, "order.created"),
            gte(events.createdAt, sevenDaysAgo)
          )
        );

      // Filter by product
      const productOrders = orderEvents.filter(e => {
        const payload = e.payload as any;
        return payload.items?.some((item: any) => item.productId === productId);
      });

      // Normalize to 0-100 (assume 100 orders/week is high demand)
      const demand = Math.min(100, (productOrders.length / 100) * 100);

      return demand;
    } catch (error) {
      console.error("[Chameleon] Error analyzing demand:", error);
      return 50; // Default medium demand
    }
  }

  /**
   * Analyze competition
   */
  private async analyzeCompetition(productId: number): Promise<number> {
    // TODO: Implement competitor price monitoring
    // For now, return medium competition
    return 50;
  }

  /**
   * Analyze seasonality
   */
  private async analyzeSeasonality(productId: number): Promise<number> {
    const month = new Date().getMonth();

    // Simple seasonality model
    // TODO: Implement ML-based seasonality prediction
    const seasonalityMap: Record<number, number> = {
      0: 60, // January - Post-holiday
      1: 50, // February
      2: 55, // March
      3: 60, // April
      4: 65, // May
      5: 70, // June - Summer
      6: 75, // July - Peak summer
      7: 70, // August
      8: 65, // September - Back to school
      9: 60, // October
      10: 70, // November - Pre-holiday
      11: 85, // December - Holiday season
    };

    return seasonalityMap[month] || 50;
  }

  /**
   * Analyze inventory
   */
  private async analyzeInventory(productId: number): Promise<number> {
    try {
      const { db } = await import("../db");
      const { branchInventory } = await import("../../drizzle/schema-branches");
      const { eq, sum } = await import("drizzle-orm");

      // Get total inventory across all branches
      const inventory = await db
        .select({ total: sum(branchInventory.available) })
        .from(branchInventory)
        .where(eq(branchInventory.productId, productId));

      const total = parseInt(inventory[0]?.total?.toString() || "0");

      // Normalize to 0-100 (assume 1000 items is high stock)
      return Math.min(100, (total / 1000) * 100);
    } catch (error) {
      console.error("[Chameleon] Error analyzing inventory:", error);
      return 50;
    }
  }

  /**
   * Determine trend
   */
  private async determineTrend(productId: number): Promise<MarketConditions["trend"]> {
    try {
      const { db } = await import("../db");
      const { events } = await import("../../drizzle/schema");
      const { eq, and, gte } = await import("drizzle-orm");

      // Compare last 7 days vs previous 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const recentOrders = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.type, "order.created"),
            gte(events.createdAt, sevenDaysAgo)
          )
        );

      const previousOrders = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.type, "order.created"),
            gte(events.createdAt, fourteenDaysAgo)
          )
        );

      const recentCount = recentOrders.filter(e => {
        const payload = e.payload as any;
        return payload.items?.some((item: any) => item.productId === productId);
      }).length;

      const previousCount = previousOrders.filter(e => {
        const payload = e.payload as any;
        return payload.items?.some((item: any) => item.productId === productId);
      }).length;

      const change = ((recentCount - previousCount) / (previousCount || 1)) * 100;

      if (change > 10) return "rising";
      if (change < -10) return "falling";
      return "stable";
    } catch (error) {
      console.error("[Chameleon] Error determining trend:", error);
      return "stable";
    }
  }

  /**
   * Generate adaptive decision
   */
  async generateAdaptiveDecision(product: any, conditions: MarketConditions): Promise<AdaptiveDecision | null> {
    // Decision matrix based on market conditions
    let action: AdaptiveDecision["action"] = "maintain_price";
    let magnitude = 0;
    let reason = "";
    let confidence = 0;

    // High demand + Low inventory = Increase price
    if (conditions.demand > 70 && conditions.inventory < 30) {
      action = "increase_price";
      magnitude = Math.min(this.MAX_PRICE_INCREASE, 10 + (conditions.demand - conditions.inventory) / 5);
      reason = "High demand with low inventory";
      confidence = 85;
    }
    // Low demand + High inventory = Decrease price or promote
    else if (conditions.demand < 30 && conditions.inventory > 70) {
      action = "decrease_price";
      magnitude = Math.min(this.MAX_PRICE_DECREASE, 15 + (conditions.inventory - conditions.demand) / 5);
      reason = "Low demand with excess inventory";
      confidence = 80;
    }
    // Rising trend + Good seasonality = Moderate increase
    else if (conditions.trend === "rising" && conditions.seasonality > 70) {
      action = "increase_price";
      magnitude = 5;
      reason = "Rising trend in peak season";
      confidence = 70;
    }
    // Falling trend = Promotional strategy
    else if (conditions.trend === "falling") {
      action = "promote";
      magnitude = 10;
      reason = "Falling demand trend";
      confidence = 75;
    }

    // Only return decision if magnitude exceeds threshold
    if (magnitude < this.PRICE_CHANGE_THRESHOLD && action !== "promote") {
      return null;
    }

    return {
      action,
      magnitude,
      reason,
      confidence,
      marketConditions: conditions,
      timestamp: new Date()
    };
  }

  /**
   * Apply adaptive decision
   */
  async applyAdaptiveDecision(product: any, decision: AdaptiveDecision): Promise<void> {
    try {
      const { db } = await import("../db");
      const { products } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const currentPrice = parseFloat(product.price.toString());
      let newPrice = currentPrice;

      switch (decision.action) {
        case "increase_price":
          newPrice = currentPrice * (1 + decision.magnitude / 100);
          break;
        case "decrease_price":
          newPrice = currentPrice * (1 - decision.magnitude / 100);
          break;
        case "promote":
          // Create promotional discount
          // TODO: Implement promotion system
          console.log(`[Chameleon] Creating ${decision.magnitude}% promotion for ${product.name}`);
          return;
        case "maintain_price":
          return;
      }

      // Update product price
      await db
        .update(products)
        .set({ price: newPrice.toString() })
        .where(eq(products.id, product.id));

      console.log(`[Chameleon] ${decision.action}: ${product.name} ${currentPrice} → ${newPrice.toFixed(2)} EGP (${decision.magnitude.toFixed(1)}%)`);

      // Create insight
      await createAgentInsight({
        agentType: "chameleon",
        insightType: "price_adjusted",
        title: `🦎 Price Adjusted: ${product.name}`,
        titleAr: `🦎 تم تعديل السعر: ${product.name}`,
        description: `${decision.action.replace("_", " ")}: ${currentPrice} → ${newPrice.toFixed(2)} EGP (${decision.magnitude.toFixed(1)}%). Reason: ${decision.reason}`,
        descriptionAr: `${decision.action}: ${currentPrice} ← ${newPrice.toFixed(2)} جنيه (${decision.magnitude.toFixed(1)}٪). السبب: ${decision.reason}`,
        severity: "low",
        actionable: false,
        metadata: {
          productId: product.id,
          oldPrice: currentPrice,
          newPrice,
          change: decision.magnitude,
          reason: decision.reason,
          confidence: decision.confidence,
          conditions: decision.marketConditions
        }
      });

      // Emit event
      const eventBus = getEventBus();
      await eventBus.emit({
        type: "product.price.changed",
        entityId: product.id,
        entityType: "product",
        payload: {
          productId: product.id,
          oldPrice: currentPrice,
          newPrice,
          change: decision.magnitude,
          reason: decision.reason,
          triggeredBy: "chameleon_auto"
        }
      });
    } catch (error) {
      console.error("[Chameleon] Error applying adaptive decision:", error);
    }
  }

  /**
   * Record demand signal from order
   */
  private async recordDemandSignal(event: any): Promise<void> {
    // TODO: Store demand signals for ML training
  }

  /**
   * Record interest signal from product view
   */
  private async recordInterestSignal(event: any): Promise<void> {
    // TODO: Store interest signals for ML training
  }

  /**
   * Generate pricing strategy for product
   */
  async generatePricingStrategy(productId: number): Promise<PricingStrategy> {
    const { db } = await import("../db");
    const { products } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      throw new Error("Product not found");
    }

    const conditions = await this.analyzeMarketConditions(productId);
    const decision = await this.generateAdaptiveDecision(product, conditions);

    const basePrice = parseFloat(product.price.toString());
    const adjustment = decision?.magnitude || 0;
    const currentPrice = decision?.action === "increase_price"
      ? basePrice * (1 + adjustment / 100)
      : decision?.action === "decrease_price"
      ? basePrice * (1 - adjustment / 100)
      : basePrice;

    return {
      id: `strategy_${productId}_${Date.now()}`,
      name: `Adaptive Strategy for ${product.name}`,
      basePrice,
      currentPrice,
      adjustment,
      reason: decision?.reason || "No adjustment needed",
      confidence: decision?.confidence || 100,
      expectedImpact: {
        sales: decision?.action === "decrease_price" ? 15 : decision?.action === "increase_price" ? -10 : 0,
        revenue: decision?.action === "increase_price" ? 5 : decision?.action === "decrease_price" ? -5 : 0,
        profit: decision?.action === "increase_price" ? 10 : decision?.action === "decrease_price" ? -10 : 0
      },
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }
}

// Export singleton instance
export const chameleonEngine = new ChameleonAdaptiveEngine();
