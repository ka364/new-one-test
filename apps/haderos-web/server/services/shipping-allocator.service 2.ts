// @ts-nocheck
/**
 * Shipping Allocator Service
 * Smart allocation of shipping partners based on performance, cost, and coverage
 */

import { requireDb } from '../db';
import { shippingPartners, codOrders, shippingAllocations, fallbackLogs } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

export class ShippingAllocatorService {
  private weights = {
    performance: 0.35,
    cost: 0.25,
    speed: 0.20,
    reliability: 0.15,
    partnership: 0.05,
  };

  /**
   * Allocate shipping partner for an order
   */
  async allocatePartner(orderId: string, shippingAddress: any) {
    try {
      const db = await requireDb();
      
      // Get order
      const [order] = await db.select()
        .from(codOrders)
        .where(eq(codOrders.orderId, orderId));
      
      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      // Get eligible partners
      const eligiblePartners = await this.getEligiblePartners(shippingAddress);
      
      if (eligiblePartners.length === 0) {
        throw new Error('لا توجد شركات شحن متاحة لهذه المنطقة');
      }

      // Score partners
      const scoredPartners = await this.scorePartners(eligiblePartners, order, shippingAddress);
      
      // Apply diversification strategy
      const selectedPartner = await this.applyDiversificationStrategy(scoredPartners);
      
      // Create allocation
      const allocation = await this.createAllocation(order.id, selectedPartner);
      
      // Update order
      await db.update(codOrders)
        .set({
          shippingPartnerId: selectedPartner.id,
          currentStage: 'shipping',
        })
        .where(eq(codOrders.id, order.id));

      return {
        success: true,
        partner: selectedPartner,
        allocation,
      };
    } catch (error) {
      console.error('Error allocating shipping partner:', error);
      throw error;
    }
  }

  /**
   * Get eligible partners for a location
   */
  private async getEligiblePartners(shippingAddress: any) {
    const db = await requireDb();
    const { governorate } = shippingAddress;
    
    // Get active partners that cover the governorate
    const partners = await db.select()
      .from(shippingPartners)
      .where(
        and(
          eq(shippingPartners.active, 1),
          eq(shippingPartners.suspended, 0)
        )
      );

    // Filter by coverage (check JSON field)
    return partners.filter(partner => {
      if (!partner.coverage) return false;
      const coverage = partner.coverage as any;
      return coverage.governorates && coverage.governorates.includes(governorate);
    });
  }

  /**
   * Score partners based on multiple criteria
   */
  private async scorePartners(partners: any[], order: any, address: any) {
    return partners.map(partner => {
      const scores = {
        performance: this.calculatePerformanceScore(partner),
        cost: this.calculateCostScore(partner, Number(order.codAmount)),
        speed: this.calculateSpeedScore(partner, address),
        reliability: this.calculateReliabilityScore(partner),
        partnership: this.calculatePartnershipScore(partner),
      };

      const totalScore = 
        scores.performance * this.weights.performance +
        scores.cost * this.weights.cost +
        scores.speed * this.weights.speed +
        scores.reliability * this.weights.reliability +
        scores.partnership * this.weights.partnership;

      return {
        partner,
        scores,
        totalScore,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(partner: any): number {
    const successRate = Number(partner.successRate) || 0;
    return successRate / 100; // Normalize to 0-1
  }

  /**
   * Calculate cost score
   */
  private calculateCostScore(partner: any, codAmount: number): number {
    const deliveryFee = Number(partner.deliveryFee) || 0;
    const codFeePercentage = Number(partner.codFeePercentage) || 0;
    const codFeeFixed = Number(partner.codFeeFixed) || 0;
    
    const totalCost = deliveryFee + (codAmount * codFeePercentage / 100) + codFeeFixed;
    
    // Lower cost = higher score (inverse relationship)
    // Normalize assuming max cost of 100 EGP
    return Math.max(0, 1 - (totalCost / 100));
  }

  /**
   * Calculate speed score
   */
  private calculateSpeedScore(partner: any, address: any): number {
    const avgDeliveryTime = Number(partner.avgDeliveryTime) || 3;
    
    // Faster delivery = higher score (inverse relationship)
    // Normalize assuming max delivery time of 7 days
    return Math.max(0, 1 - (avgDeliveryTime / 7));
  }

  /**
   * Calculate reliability score
   */
  private calculateReliabilityScore(partner: any): number {
    const complaintRate = Number(partner.complaintRate) || 0;
    const rating = Number(partner.rating) || 0;
    
    // Lower complaint rate and higher rating = higher score
    const complaintScore = Math.max(0, 1 - (complaintRate * 10)); // Assuming max 10% complaint rate
    const ratingScore = rating / 5; // Normalize to 0-1
    
    return (complaintScore + ratingScore) / 2;
  }

  /**
   * Calculate partnership score
   */
  private calculatePartnershipScore(partner: any): number {
    const allocationWeight = Number(partner.allocationWeight) || 1;
    const priority = Number(partner.priority) || 1;
    
    // Higher weight and priority = higher score
    return (allocationWeight * priority) / 10; // Normalize
  }

  /**
   * Apply diversification strategy
   */
  private async applyDiversificationStrategy(scoredPartners: any[]) {
    const db = await requireDb();
    
    // Get recent allocations (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentAllocations = await db.select()
      .from(shippingAllocations)
      .where(sql`created_at >= ${yesterday.toISOString()}`);

    // Count allocations per partner
    const allocationCounts: Record<number, number> = {};
    recentAllocations.forEach(allocation => {
      const partnerId = allocation.shippingPartnerId;
      allocationCounts[partnerId] = (allocationCounts[partnerId] || 0) + 1;
    });

    // Apply diversification penalty
    const diversifiedScores = scoredPartners.map(item => {
      const partnerId = item.partner.id;
      const allocationCount = allocationCounts[partnerId] || 0;
      const maxAllocations = Number(item.partner.maxDailyAssignments) || 200;
      
      // Penalty for high allocation count
      const diversificationPenalty = allocationCount / maxAllocations;
      const adjustedScore = item.totalScore * (1 - (diversificationPenalty * 0.2));
      
      return {
        ...item,
        adjustedScore,
        allocationCount,
      };
    }).sort((a, b) => b.adjustedScore - a.adjustedScore);

    return diversifiedScores[0].partner;
  }

  /**
   * Create allocation record
   */
  private async createAllocation(codOrderId: number, partner: any) {
    const db = await requireDb();
    
    const [allocation] = await db.insert(shippingAllocations).values({
      codOrderId,
      shippingPartnerId: partner.id,
      allocationScore: '95.50', // Placeholder
      allocationReason: `Selected based on performance and cost optimization`,
      shipmentStatus: 'pending',
    });

    return allocation;
  }

  /**
   * Handle fallback to another partner
   */
  async fallbackToAlternative(orderId: string, originalPartnerId: number, reason: string) {
    const db = await requireDb();
    
    // Get order
    const [order] = await db.select()
      .from(codOrders)
      .where(eq(codOrders.orderId, orderId));
    
    if (!order) {
      throw new Error('الطلب غير موجود');
    }

    // Get alternative partners
    const shippingAddress = order.shippingAddress as any;
    const eligiblePartners = await this.getEligiblePartners(shippingAddress);
    
    // Exclude original partner
    const alternatives = eligiblePartners.filter(p => p.id !== originalPartnerId);
    
    if (alternatives.length === 0) {
      throw new Error('لا توجد شركات شحن بديلة متاحة');
    }

    // Score and select best alternative
    const scoredPartners = await this.scorePartners(alternatives, order, shippingAddress);
    const newPartner = scoredPartners[0].partner;

    // Log fallback
    await db.insert(fallbackLogs).values({
      originalPartnerId,
      newPartnerId: newPartner.id,
      codOrderId: order.id,
      reason,
      details: { originalPartner: originalPartnerId, newPartner: newPartner.id },
    });

    // Update order
    await db.update(codOrders)
      .set({ shippingPartnerId: newPartner.id })
      .where(eq(codOrders.id, order.id));

    return {
      success: true,
      newPartner,
      reason,
    };
  }
}

export const shippingAllocatorService = new ShippingAllocatorService();
