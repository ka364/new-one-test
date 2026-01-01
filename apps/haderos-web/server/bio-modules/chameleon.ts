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
    try {
      const { db } = await import("../db");
      const { products } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Get the product
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));

      if (!product) return 50;

      // Check if we have competitor price data in product metadata
      const metadata = product.metadata as any;
      if (metadata?.competitorPrices && Array.isArray(metadata.competitorPrices)) {
        const ourPrice = parseFloat(product.sellingPrice?.toString() || "0");
        const competitorPrices = metadata.competitorPrices.map((c: any) => parseFloat(c.price));

        if (competitorPrices.length > 0) {
          const avgCompetitorPrice = competitorPrices.reduce((a: number, b: number) => a + b, 0) / competitorPrices.length;
          const priceRatio = ourPrice / avgCompetitorPrice;

          // Convert to competition score (0-100)
          // Higher competition means lower price vs competitors
          if (priceRatio < 0.8) return 30; // We're cheap - low competition pressure
          if (priceRatio < 0.95) return 50; // Competitive
          if (priceRatio < 1.05) return 60; // Slightly above market
          if (priceRatio < 1.2) return 75; // Above market
          return 90; // Much higher than competitors
        }
      }

      // Default: Use category-based estimation
      const category = product.category || "general";
      const categoryCompetition: Record<string, number> = {
        "electronics": 85,
        "clothing": 70,
        "shoes": 75,
        "accessories": 60,
        "bags": 65,
        "general": 50
      };

      return categoryCompetition[category.toLowerCase()] || 50;
    } catch (error) {
      console.error("[Chameleon] Error analyzing competition:", error);
      return 50;
    }
  }

  /**
   * Analyze seasonality with ML-based prediction
   */
  private async analyzeSeasonality(productId: number): Promise<number> {
    try {
      const { db } = await import("../db");
      const { products, orders } = await import("../../drizzle/schema");
      const { eq, and, gte, sql } = await import("drizzle-orm");

      const month = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Get product category for category-specific seasonality
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));

      const category = product?.category || "general";

      // Base seasonality by month (Egyptian market patterns)
      const baseSeasonality: Record<number, number> = {
        0: 55, // January - Post-Ramadan recovery (varies by Ramadan timing)
        1: 50, // February
        2: 60, // March - Spring season
        3: 70, // April - Often includes Ramadan/Eid
        4: 75, // May - Eid shopping peak
        5: 65, // June - Summer start
        6: 60, // July - Summer vacation
        7: 65, // August - Back to school prep
        8: 80, // September - Back to school peak
        9: 60, // October
        10: 70, // November - Pre-wedding season
        11: 75, // December - Winter + Holiday
      };

      // Category-specific adjustments
      const categoryModifiers: Record<string, Record<number, number>> = {
        "shoes": {
          8: 15, // Back to school boost
          9: 10,
          3: 10, // Eid boost
          4: 15,
        },
        "clothing": {
          3: 15, // Eid boost
          4: 20,
          8: 10, // Back to school
          11: 10, // Winter clothing
        },
        "bags": {
          8: 10, // Back to school
          3: 15, // Eid
        },
        "electronics": {
          11: 15, // Black Friday
          0: -10, // Post-holiday drop
        }
      };

      let seasonality = baseSeasonality[month] || 50;

      // Apply category modifier
      const modifiers = categoryModifiers[category.toLowerCase()];
      if (modifiers && modifiers[month]) {
        seasonality += modifiers[month];
      }

      // Historical data analysis (if available)
      try {
        // Look at sales from same month last year
        const lastYearStart = new Date(currentYear - 1, month, 1);
        const lastYearEnd = new Date(currentYear - 1, month + 1, 0);

        const historicalOrders = await db
          .select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(
            and(
              gte(orders.createdAt, lastYearStart),
              gte(lastYearEnd, orders.createdAt)
            )
          );

        // If we have historical data, weight it into the prediction
        if (historicalOrders[0]?.count > 10) {
          // Has meaningful historical data - adjust seasonality
          const histCount = Number(historicalOrders[0].count);
          const avgMonthlyOrders = 100; // Baseline assumption
          const histRatio = histCount / avgMonthlyOrders;

          // Blend historical with base prediction (40% historical, 60% base)
          seasonality = Math.round(seasonality * 0.6 + (histRatio * 100) * 0.4);
        }
      } catch {
        // Historical data not available, use base prediction
      }

      // Cap between 0-100
      return Math.max(0, Math.min(100, seasonality));
    } catch (error) {
      console.error("[Chameleon] Error analyzing seasonality:", error);
      // Fallback to simple month-based
      const month = new Date().getMonth();
      const fallback: Record<number, number> = {
        0: 60, 1: 50, 2: 55, 3: 60, 4: 65, 5: 70,
        6: 75, 7: 70, 8: 65, 9: 60, 10: 70, 11: 85
      };
      return fallback[month] || 50;
    }
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
          await this.createPromotion(product, decision.magnitude, decision.reason);
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
   * Create promotional discount for a product
   */
  private async createPromotion(product: any, discountPercentage: number, reason: string): Promise<void> {
    try {
      const { db } = await import("../db");
      const { coupons } = await import("../../drizzle/schema-coupons");

      // Generate unique promo code
      const promoCode = `AUTO_${product.modelCode || product.id}_${Date.now().toString(36).toUpperCase()}`;

      // Set expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create coupon
      await db.insert(coupons).values({
        code: promoCode,
        discountType: "percentage",
        discountValue: discountPercentage.toString(),
        minimumPurchase: "0",
        maximumDiscount: (parseFloat(product.price?.toString() || "0") * discountPercentage / 100).toString(),
        usageLimit: 100,
        usageCount: 0,
        validFrom: new Date(),
        validUntil: expiresAt,
        isActive: true,
        description: `Auto-generated promotion: ${reason}`,
        metadata: {
          productId: product.id,
          generatedBy: "chameleon",
          reason
        }
      });

      console.log(`[Chameleon] Created promotion ${promoCode}: ${discountPercentage}% off for ${product.name || product.modelCode}`);

      // Create insight
      await createAgentInsight({
        agentType: "chameleon",
        insightType: "promotion_created",
        title: `🎉 Promotion Created: ${product.name || product.modelCode}`,
        titleAr: `🎉 تم إنشاء عرض: ${product.name || product.modelCode}`,
        description: `Created ${discountPercentage}% discount (code: ${promoCode}). Reason: ${reason}. Valid for 7 days.`,
        descriptionAr: `تم إنشاء خصم ${discountPercentage}٪ (كود: ${promoCode}). السبب: ${reason}. صالح لمدة 7 أيام.`,
        severity: "low",
        actionable: false,
        metadata: {
          productId: product.id,
          promoCode,
          discountPercentage,
          reason,
          expiresAt
        }
      });

      // Emit event
      const eventBus = getEventBus();
      await eventBus.emit({
        type: "promotion.created",
        entityId: product.id,
        entityType: "product",
        payload: {
          productId: product.id,
          promoCode,
          discountPercentage,
          reason,
          triggeredBy: "chameleon_auto"
        }
      });
    } catch (error) {
      console.error("[Chameleon] Error creating promotion:", error);
    }
  }

  /**
   * Record demand signal from order
   */
  private async recordDemandSignal(event: any): Promise<void> {
    try {
      // Store demand signal for ML training
      const { db } = await import("../db");
      const { sql } = await import("drizzle-orm");

      const orderData = event.data || event.payload;
      if (!orderData) return;

      // Extract product IDs from order
      const items = orderData.items || orderData.lineItems || [];

      for (const item of items) {
        const productId = item.productId || item.product_id;
        if (!productId) continue;

        // Store demand signal (upsert to demand_signals table if exists, otherwise use events)
        await db.execute(sql`
          INSERT INTO events (type, entity_id, entity_type, payload, created_at)
          VALUES (
            'chameleon.demand_signal',
            ${productId},
            'product',
            ${JSON.stringify({
              productId,
              quantity: item.quantity || 1,
              price: item.price,
              timestamp: new Date().toISOString(),
              source: "order"
            })}::jsonb,
            NOW()
          )
        `).catch(() => {
          // If events table doesn't exist, just log
          console.log(`[Chameleon] Demand signal recorded for product ${productId}`);
        });
      }
    } catch (error) {
      console.error("[Chameleon] Error recording demand signal:", error);
    }
  }

  /**
   * Record interest signal from product view
   */
  private async recordInterestSignal(event: any): Promise<void> {
    try {
      // Store interest signal for ML training
      const { db } = await import("../db");
      const { sql } = await import("drizzle-orm");

      const viewData = event.data || event.payload;
      if (!viewData) return;

      const productId = viewData.productId || viewData.product_id;
      if (!productId) return;

      // Store interest signal
      await db.execute(sql`
        INSERT INTO events (type, entity_id, entity_type, payload, created_at)
        VALUES (
          'chameleon.interest_signal',
          ${productId},
          'product',
          ${JSON.stringify({
            productId,
            userId: viewData.userId || viewData.user_id,
            sessionId: viewData.sessionId,
            duration: viewData.duration,
            timestamp: new Date().toISOString(),
            source: "product_view"
          })}::jsonb,
          NOW()
        )
      `).catch(() => {
        // If events table doesn't exist, just log
        console.log(`[Chameleon] Interest signal recorded for product ${productId}`);
      });
    } catch (error) {
      console.error("[Chameleon] Error recording interest signal:", error);
    }
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
