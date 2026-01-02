/**
 * Mycelium Module - Fungal Network Resource Distribution
 *
 * Inspired by: Underground fungal networks (Wood Wide Web)
 * Problem: Imbalanced inventory across branches
 * Solution: Decentralized, automatic resource balancing
 */

import {
  Branch,
  BranchInventory,
  InventoryTransfer,
  NewInventoryTransfer,
} from '../../drizzle/schema-branches';
import { getEventBus } from '../events/eventBus';
import { createAgentInsight } from '../db';

export interface BalanceOpportunity {
  fromBranch: Branch;
  toBranch: Branch;
  productId: number;
  sku: string;
  quantity: number;
  surplus: number;
  deficit: number;
  distance: number; // km
  estimatedCost: number;
  costEfficiency: number; // 0-100
  balanceScore: number; // 0-100
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface NetworkBalance {
  overallScore: number; // 0-100
  imbalancedBranches: number;
  surplusBranches: number;
  deficitBranches: number;
  opportunities: BalanceOpportunity[];
  recommendations: string[];
}

/**
 * Mycelium Resource Balancing Engine
 *
 * Capabilities:
 * 1. Detect inventory imbalances across branches
 * 2. Calculate optimal transfer routes
 * 3. Estimate costs and benefits
 * 4. Automatically trigger transfers
 * 5. Monitor network health
 */
export class MyceliumBalancingEngine {
  private readonly COST_PER_KM = 2; // EGP per km
  private readonly COST_PER_ITEM = 5; // EGP per item
  private readonly MIN_TRANSFER_QUANTITY = 5;
  private readonly MAX_TRANSFER_DISTANCE = 500; // km
  private readonly BALANCE_CHECK_INTERVAL = 3600000; // 1 hour

  constructor() {
    this.startBalanceMonitoring();
  }

  /**
   * Start continuous balance monitoring
   */
  private startBalanceMonitoring(): void {
    setInterval(async () => {
      await this.checkAndBalance();
    }, this.BALANCE_CHECK_INTERVAL);

    console.log('[Mycelium] Balance monitoring started');
  }

  /**
   * Check network balance and trigger transfers if needed
   */
  async checkAndBalance(): Promise<void> {
    try {
      const balance = await this.analyzeNetworkBalance();

      if (balance.overallScore < 70) {
        console.log(`[Mycelium] Network imbalance detected (score: ${balance.overallScore})`);

        // Create insight
        await createAgentInsight({
          agentType: 'mycelium',
          insightType: 'network_imbalance',
          title: `🌐 Network Imbalance Detected - Score: ${balance.overallScore.toFixed(0)}`,
          titleAr: `🌐 تم اكتشاف عدم توازن في الشبكة - الدرجة: ${balance.overallScore.toFixed(0)}`,
          description: `${balance.imbalancedBranches} branches are imbalanced. ${balance.opportunities.length} transfer opportunities identified.`,
          descriptionAr: `${balance.imbalancedBranches} فرع غير متوازن. تم تحديد ${balance.opportunities.length} فرصة نقل.`,
          severity: balance.overallScore < 50 ? 'high' : 'medium',
          actionable: true,
          metadata: {
            overallScore: balance.overallScore,
            opportunities: balance.opportunities.length,
            recommendations: balance.recommendations,
          },
        });

        // Auto-trigger high-priority transfers
        await this.autoTriggerTransfers(balance.opportunities);
      }

      // Record history
      await this.recordBalanceHistory(balance);
    } catch (error) {
      console.error('[Mycelium] Error in checkAndBalance:', error);
    }
  }

  /**
   * Analyze network balance
   */
  async analyzeNetworkBalance(): Promise<NetworkBalance> {
    const { db } = await import('../db');
    const { branches, branchInventory } = await import('../../drizzle/schema-branches');
    const { eq } = await import('drizzle-orm');

    // Get all active branches
    const allBranches = await db.select().from(branches).where(eq(branches.status, 'active'));

    if (allBranches.length === 0) {
      return {
        overallScore: 100,
        imbalancedBranches: 0,
        surplusBranches: 0,
        deficitBranches: 0,
        opportunities: [],
        recommendations: [],
      };
    }

    // Get inventory for all branches
    const allInventory = await db.select().from(branchInventory);

    // Group inventory by product
    const productMap = new Map<number, BranchInventory[]>();
    for (const inv of allInventory) {
      if (!productMap.has(inv.productId)) {
        productMap.set(inv.productId, []);
      }
      productMap.get(inv.productId)!.push(inv);
    }

    // Find balance opportunities
    const opportunities: BalanceOpportunity[] = [];
    let surplusBranches = 0;
    let deficitBranches = 0;

    for (const [productId, inventories] of productMap.entries()) {
      const surplus = inventories.filter((inv) => inv.quantity > inv.maxStock);
      const deficit = inventories.filter((inv) => inv.quantity < inv.minStock);

      surplusBranches += surplus.length;
      deficitBranches += deficit.length;

      // Match surplus with deficit
      for (const surplusInv of surplus) {
        const surplusBranch = allBranches.find((b) => b.id === surplusInv.branchId);
        if (!surplusBranch) continue;

        const surplusAmount = surplusInv.quantity - surplusInv.maxStock;

        for (const deficitInv of deficit) {
          const deficitBranch = allBranches.find((b) => b.id === deficitInv.branchId);
          if (!deficitBranch) continue;

          const deficitAmount = deficitInv.minStock - deficitInv.quantity;
          const transferQty = Math.min(surplusAmount, deficitAmount);

          if (transferQty < this.MIN_TRANSFER_QUANTITY) continue;

          const distance = this.calculateDistance(surplusBranch, deficitBranch);
          if (distance > this.MAX_TRANSFER_DISTANCE) continue;

          const estimatedCost = this.calculateTransferCost(transferQty, distance);
          const costEfficiency = this.calculateCostEfficiency(
            transferQty,
            estimatedCost,
            deficitInv
          );
          const balanceScore = this.calculateBalanceScore(
            surplusAmount,
            deficitAmount,
            transferQty
          );

          opportunities.push({
            fromBranch: surplusBranch,
            toBranch: deficitBranch,
            productId,
            sku: surplusInv.sku,
            quantity: transferQty,
            surplus: surplusAmount,
            deficit: deficitAmount,
            distance,
            estimatedCost,
            costEfficiency,
            balanceScore,
            priority: this.determinePriority(deficitInv, balanceScore),
          });
        }
      }
    }

    // Sort opportunities by balance score
    opportunities.sort((a, b) => b.balanceScore - a.balanceScore);

    // Calculate overall balance score
    const imbalancedBranches = surplusBranches + deficitBranches;
    const totalBranches = allBranches.length;
    const balanceRatio = 1 - imbalancedBranches / (totalBranches * 2);
    const overallScore = balanceRatio * 100;

    // Generate recommendations
    const recommendations = this.generateRecommendations(opportunities, overallScore);

    return {
      overallScore,
      imbalancedBranches,
      surplusBranches,
      deficitBranches,
      opportunities,
      recommendations,
    };
  }

  /**
   * Calculate distance between two branches (simplified)
   */
  private calculateDistance(branch1: Branch, branch2: Branch): number {
    if (!branch1.latitude || !branch1.longitude || !branch2.latitude || !branch2.longitude) {
      return 100; // Default distance
    }

    const lat1 = parseFloat(branch1.latitude.toString());
    const lon1 = parseFloat(branch1.longitude.toString());
    const lat2 = parseFloat(branch2.latitude.toString());
    const lon2 = parseFloat(branch2.longitude.toString());

    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate transfer cost
   */
  private calculateTransferCost(quantity: number, distance: number): number {
    return distance * this.COST_PER_KM + quantity * this.COST_PER_ITEM;
  }

  /**
   * Calculate cost efficiency
   */
  private calculateCostEfficiency(
    quantity: number,
    cost: number,
    inventory: BranchInventory
  ): number {
    const sellingPrice = parseFloat(inventory.sellingPrice?.toString() || '0');
    const potentialRevenue = quantity * sellingPrice;

    if (potentialRevenue === 0) return 0;

    const efficiency = ((potentialRevenue - cost) / potentialRevenue) * 100;
    return Math.max(0, Math.min(100, efficiency));
  }

  /**
   * Calculate balance score
   */
  private calculateBalanceScore(surplus: number, deficit: number, transferQty: number): number {
    const surplusReduction = (transferQty / surplus) * 50;
    const deficitReduction = (transferQty / deficit) * 50;
    return surplusReduction + deficitReduction;
  }

  /**
   * Determine transfer priority
   */
  private determinePriority(
    inventory: BranchInventory,
    balanceScore: number
  ): BalanceOpportunity['priority'] {
    if (inventory.quantity === 0) return 'urgent';
    if (balanceScore > 80) return 'high';
    if (balanceScore > 50) return 'normal';
    return 'low';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    opportunities: BalanceOpportunity[],
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore < 50) {
      recommendations.push('Critical: Network is severely imbalanced. Immediate action required.');
    }

    if (opportunities.length > 0) {
      const highPriority = opportunities.filter(
        (o) => o.priority === 'high' || o.priority === 'urgent'
      );
      if (highPriority.length > 0) {
        recommendations.push(
          `${highPriority.length} high-priority transfers should be executed immediately.`
        );
      }

      const costEfficient = opportunities.filter((o) => o.costEfficiency > 70);
      if (costEfficient.length > 0) {
        recommendations.push(`${costEfficient.length} transfers are highly cost-efficient (>70%).`);
      }
    }

    return recommendations;
  }

  /**
   * Auto-trigger transfers for high-priority opportunities
   */
  private async autoTriggerTransfers(opportunities: BalanceOpportunity[]): Promise<void> {
    const highPriority = opportunities.filter(
      (o) => (o.priority === 'high' || o.priority === 'urgent') && o.costEfficiency > 60
    );

    for (const opp of highPriority.slice(0, 5)) {
      // Max 5 auto-transfers at once
      try {
        await this.createTransfer(opp);
        console.log(
          `[Mycelium] Auto-triggered transfer: ${opp.sku} from ${opp.fromBranch.name} to ${opp.toBranch.name}`
        );
      } catch (error) {
        console.error('[Mycelium] Error auto-triggering transfer:', error);
      }
    }
  }

  /**
   * Create inventory transfer
   */
  async createTransfer(opportunity: BalanceOpportunity): Promise<InventoryTransfer> {
    const { db } = await import('../db');
    const { inventoryTransfers } = await import('../../drizzle/schema-branches');

    const transferNumber = `TRF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const newTransfer: NewInventoryTransfer = {
      transferNumber,
      fromBranchId: opportunity.fromBranch.id,
      toBranchId: opportunity.toBranch.id,
      productId: opportunity.productId,
      sku: opportunity.sku,
      quantity: opportunity.quantity,
      reason: 'balancing',
      status: 'pending',
      priority: opportunity.priority,
      triggeredBy: 'mycelium_auto',
      costEfficiency: opportunity.costEfficiency.toString(),
      balanceScore: opportunity.balanceScore.toString(),
      estimatedCost: opportunity.estimatedCost.toString(),
      requestedAt: new Date(),
    };

    const [transfer] = await db.insert(inventoryTransfers).values(newTransfer).returning();

    // Emit event
    const eventBus = getEventBus();
    await eventBus.emit({
      type: 'inventory.transfer.created',
      entityId: transfer.id,
      entityType: 'inventory_transfer',
      payload: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        fromBranch: opportunity.fromBranch.name,
        toBranch: opportunity.toBranch.name,
        sku: opportunity.sku,
        quantity: opportunity.quantity,
        triggeredBy: 'mycelium_auto',
      },
    });

    return transfer;
  }

  /**
   * Record balance history
   */
  private async recordBalanceHistory(balance: NetworkBalance): Promise<void> {
    try {
      const { db } = await import('../db');
      const { myceliumBalanceHistory, inventoryTransfers } =
        await import('../../drizzle/schema-branches');
      const { eq, and, gte } = await import('drizzle-orm');

      // Get today's completed transfers
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedToday = await db
        .select()
        .from(inventoryTransfers)
        .where(
          and(
            eq(inventoryTransfers.status, 'completed'),
            gte(inventoryTransfers.deliveredAt!, today)
          )
        );

      // Get active transfers
      const activeTransfers = await db
        .select()
        .from(inventoryTransfers)
        .where(eq(inventoryTransfers.status, 'in_transit'));

      // Calculate average transfer cost
      const avgCost =
        completedToday.length > 0
          ? completedToday.reduce(
              (sum, t) => sum + parseFloat(t.actualCost?.toString() || '0'),
              0
            ) / completedToday.length
          : 0;

      await db.insert(myceliumBalanceHistory).values({
        timestamp: new Date(),
        totalBranches:
          balance.imbalancedBranches + balance.surplusBranches + balance.deficitBranches,
        totalProducts: balance.opportunities.length,
        overallBalanceScore: balance.overallScore.toString(),
        imbalancedBranches: balance.imbalancedBranches,
        surplusBranches: balance.surplusBranches,
        deficitBranches: balance.deficitBranches,
        activeTransfers: activeTransfers.length,
        completedTransfersToday: completedToday.length,
        avgTransferCost: avgCost.toString(),
        networkEfficiency: balance.overallScore.toString(),
        metadata: {
          opportunities: balance.opportunities.length,
          recommendations: balance.recommendations,
        },
      });
    } catch (error) {
      console.error('[Mycelium] Error recording balance history:', error);
    }
  }
}

// Export singleton instance
export const myceliumEngine = new MyceliumBalancingEngine();
