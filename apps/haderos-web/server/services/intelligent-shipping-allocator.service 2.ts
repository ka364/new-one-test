/**
 * Intelligent 3-Level Shipping Allocator
 *
 * Selects the best shipping company based on performance at 3 levels:
 * 1. Administrative Point (6,109 points) - Most accurate
 * 2. Center (365 centers) - Fallback 1
 * 3. Governorate (27 governorates) - Fallback 2
 *
 * Scoring: 50% efficiency + 25% satisfaction + 15% speed + 10% price
 */

import { requireDb } from '../db';
import { eq, and, sql } from 'drizzle-orm';

interface Address {
  pointCode?: string;
  pointName?: string;
  centerCode: string;
  centerName: string;
  governorateCode: string;
  governorateName: string;
}

interface PerformanceMetrics {
  companyId: number;
  companyName: string;
  successRate: number;
  avgDeliveryDays: number;
  customerSatisfaction: number;
  avgPrice: number;
  totalShipments: number;
  level: 'point' | 'center' | 'governorate';
}

interface AllocationResult {
  selectedCompanyId: number;
  selectedCompanyName: string;
  score: number;
  level: 'point' | 'center' | 'governorate';
  reason: string;
  alternatives: Array<{
    companyId: number;
    companyName: string;
    score: number;
  }>;
}

export class IntelligentShippingAllocator {
  /**
   * Get best shipping company for an address
   */
  async getBestCompany(address: Address): Promise<AllocationResult> {
    // Try Level 1: Point (most accurate)
    if (address.pointCode) {
      const pointPerformance = await this.getPerformanceByPoint(address.pointCode);
      if (pointPerformance.length > 0) {
        return this.selectBestCompany(pointPerformance, 'point');
      }
    }

    // Fallback to Level 2: Center
    const centerPerformance = await this.getPerformanceByCenter(address.centerCode);
    if (centerPerformance.length > 0) {
      return this.selectBestCompany(centerPerformance, 'center');
    }

    // Fallback to Level 3: Governorate
    const governoratePerformance = await this.getPerformanceByGovernorate(address.governorateCode);
    if (governoratePerformance.length > 0) {
      return this.selectBestCompany(governoratePerformance, 'governorate');
    }

    // No data available - use default company
    return this.getDefaultCompany();
  }

  /**
   * Level 1: Get performance by administrative point
   */
  private async getPerformanceByPoint(pointCode: string): Promise<PerformanceMetrics[]> {
    const db = await requireDb();
    const results = await db.execute(sql`
      SELECT 
        p.company_id,
        sp.name_ar as company_name,
        p.success_rate,
        p.avg_delivery_days,
        p.customer_satisfaction,
        p.avg_price,
        p.total_shipments
      FROM shipping_performance_by_point p
      JOIN shipping_partners sp ON p.company_id = sp.id
      WHERE p.point_code = ${pointCode}
        AND p.total_shipments >= 5
        AND sp.is_active = 1
      ORDER BY p.success_rate DESC
    `);

    return (results as any[]).map((row: any) => ({
      companyId: row.company_id,
      companyName: row.company_name,
      successRate: parseFloat(row.success_rate),
      avgDeliveryDays: parseFloat(row.avg_delivery_days),
      customerSatisfaction: parseFloat(row.customer_satisfaction),
      avgPrice: parseFloat(row.avg_price),
      totalShipments: row.total_shipments,
      level: 'point' as const,
    }));
  }

  /**
   * Level 2: Get performance by center
   */
  private async getPerformanceByCenter(centerCode: string): Promise<PerformanceMetrics[]> {
    const db = await requireDb();
    const results = await db.execute(sql`
      SELECT 
        c.company_id,
        sp.name_ar as company_name,
        c.success_rate,
        c.avg_delivery_days,
        c.customer_satisfaction,
        c.avg_price,
        c.total_shipments
      FROM shipping_performance_by_center c
      JOIN shipping_partners sp ON c.company_id = sp.id
      WHERE c.center_code = ${centerCode}
        AND c.total_shipments >= 10
        AND sp.is_active = 1
      ORDER BY c.success_rate DESC
    `);

    return (results as any[]).map((row: any) => ({
      companyId: row.company_id,
      companyName: row.company_name,
      successRate: parseFloat(row.success_rate),
      avgDeliveryDays: parseFloat(row.avg_delivery_days),
      customerSatisfaction: parseFloat(row.customer_satisfaction),
      avgPrice: parseFloat(row.avg_price),
      totalShipments: row.total_shipments,
      level: 'center' as const,
    }));
  }

  /**
   * Level 3: Get performance by governorate
   */
  private async getPerformanceByGovernorate(
    governorateCode: string
  ): Promise<PerformanceMetrics[]> {
    const db = await requireDb();
    const results = await db.execute(sql`
      SELECT 
        g.company_id,
        sp.name_ar as company_name,
        g.success_rate,
        g.avg_delivery_days,
        g.customer_satisfaction,
        g.avg_price,
        g.total_shipments
      FROM shipping_performance_by_governorate g
      JOIN shipping_partners sp ON g.company_id = sp.id
      WHERE g.governorate_code = ${governorateCode}
        AND g.total_shipments >= 20
        AND sp.is_active = 1
      ORDER BY g.success_rate DESC
    `);

    return (results as any[]).map((row: any) => ({
      companyId: row.company_id,
      companyName: row.company_name,
      successRate: parseFloat(row.success_rate),
      avgDeliveryDays: parseFloat(row.avg_delivery_days),
      customerSatisfaction: parseFloat(row.customer_satisfaction),
      avgPrice: parseFloat(row.avg_price),
      totalShipments: row.total_shipments,
      level: 'governorate' as const,
    }));
  }

  /**
   * Calculate score and select best company
   *
   * Scoring formula:
   * - 50% Success Rate (efficiency)
   * - 25% Customer Satisfaction
   * - 15% Delivery Speed (inverse)
   * - 10% Price (inverse)
   */
  private selectBestCompany(
    performance: PerformanceMetrics[],
    level: 'point' | 'center' | 'governorate'
  ): AllocationResult {
    // Calculate scores
    const scored = performance.map((p) => {
      // Normalize metrics (0-100)
      const efficiencyScore = p.successRate; // Already 0-100
      const satisfactionScore = (p.customerSatisfaction / 5) * 100; // 0-5 → 0-100
      const speedScore = Math.max(0, 100 - p.avgDeliveryDays * 10); // Lower days = higher score
      const priceScore = Math.max(0, 100 - p.avgPrice / 100); // Lower price = higher score

      // Weighted score
      const score =
        efficiencyScore * 0.5 + satisfactionScore * 0.25 + speedScore * 0.15 + priceScore * 0.1;

      return {
        ...p,
        score: Math.round(score * 100) / 100,
      };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    const alternatives = scored.slice(1, 4).map((s) => ({
      companyId: s.companyId,
      companyName: s.companyName,
      score: s.score,
    }));

    const levelNames = {
      point: 'النقطة الإدارية',
      center: 'المركز',
      governorate: 'المحافظة',
    };

    return {
      selectedCompanyId: best.companyId,
      selectedCompanyName: best.companyName,
      score: best.score,
      level,
      reason: `تم الاختيار بناءً على أداء ${best.companyName} في ${levelNames[level]} (كفاءة ${best.successRate}%, رضاء ${best.customerSatisfaction}/5, ${best.avgDeliveryDays} يوم)`,
      alternatives,
    };
  }

  /**
   * Get default company when no data available
   */
  private async getDefaultCompany(): Promise<AllocationResult> {
    const db = await requireDb();
    const results = await db.execute(sql`
      SELECT id, name_ar
      FROM shipping_partners
      WHERE is_active = 1
      ORDER BY id
      LIMIT 1
    `);

    const defaultCompany = (results as any[])[0];

    return {
      selectedCompanyId: defaultCompany.id,
      selectedCompanyName: defaultCompany.name_ar,
      score: 0,
      level: 'governorate',
      reason: 'لا توجد بيانات أداء متاحة - تم اختيار الشركة الافتراضية',
      alternatives: [],
    };
  }

  /**
   * Update performance after delivery
   */
  async updatePerformance(params: {
    companyId: number;
    address: Address;
    status: 'delivered' | 'failed' | 'returned';
    deliveryDays: number;
    customerRating?: number;
    failureReason?: string;
  }) {
    const { companyId, address, status, deliveryDays, customerRating, failureReason } = params;

    // Update all 3 levels
    await Promise.all([
      // Level 1: Point
      address.pointCode &&
        this.updatePointPerformance(
          companyId,
          address,
          status,
          deliveryDays,
          customerRating,
          failureReason
        ),

      // Level 2: Center
      this.updateCenterPerformance(
        companyId,
        address,
        status,
        deliveryDays,
        customerRating,
        failureReason
      ),

      // Level 3: Governorate
      this.updateGovernoratePerformance(
        companyId,
        address,
        status,
        deliveryDays,
        customerRating,
        failureReason
      ),
    ]);
  }

  private async updatePointPerformance(
    companyId: number,
    address: Address,
    status: string,
    deliveryDays: number,
    customerRating?: number,
    failureReason?: string
  ) {
    if (!address.pointCode) return;

    const db = await requireDb();
    await db.execute(sql`
      INSERT INTO shipping_performance_by_point (
        company_id, point_code, point_name, center_code, center_name,
        governorate_code, governorate_name, total_shipments, successful_shipments,
        failed_shipments, returned_shipments, avg_delivery_days, customer_satisfaction
      ) VALUES (
        ${companyId}, ${address.pointCode}, ${address.pointName}, ${address.centerCode},
        ${address.centerName}, ${address.governorateCode}, ${address.governorateName},
        1, ${status === 'delivered' ? 1 : 0}, ${status === 'failed' ? 1 : 0},
        ${status === 'returned' ? 1 : 0}, ${deliveryDays}, ${customerRating || 0}
      )
      ON DUPLICATE KEY UPDATE
        total_shipments = total_shipments + 1,
        successful_shipments = successful_shipments + ${status === 'delivered' ? 1 : 0},
        failed_shipments = failed_shipments + ${status === 'failed' ? 1 : 0},
        returned_shipments = returned_shipments + ${status === 'returned' ? 1 : 0},
        avg_delivery_days = (avg_delivery_days * total_shipments + ${deliveryDays}) / (total_shipments + 1),
        customer_satisfaction = ${customerRating ? sql`(customer_satisfaction * total_shipments + ${customerRating}) / (total_shipments + 1)` : sql`customer_satisfaction`},
        success_rate = (successful_shipments * 100.0) / total_shipments
    `);
  }

  private async updateCenterPerformance(
    companyId: number,
    address: Address,
    status: string,
    deliveryDays: number,
    customerRating?: number,
    failureReason?: string
  ) {
    const db = await requireDb();
    await db.execute(sql`
      INSERT INTO shipping_performance_by_center (
        company_id, center_code, center_name, governorate_code, governorate_name,
        total_shipments, successful_shipments, failed_shipments, returned_shipments,
        avg_delivery_days, customer_satisfaction
      ) VALUES (
        ${companyId}, ${address.centerCode}, ${address.centerName},
        ${address.governorateCode}, ${address.governorateName},
        1, ${status === 'delivered' ? 1 : 0}, ${status === 'failed' ? 1 : 0},
        ${status === 'returned' ? 1 : 0}, ${deliveryDays}, ${customerRating || 0}
      )
      ON DUPLICATE KEY UPDATE
        total_shipments = total_shipments + 1,
        successful_shipments = successful_shipments + ${status === 'delivered' ? 1 : 0},
        failed_shipments = failed_shipments + ${status === 'failed' ? 1 : 0},
        returned_shipments = returned_shipments + ${status === 'returned' ? 1 : 0},
        avg_delivery_days = (avg_delivery_days * total_shipments + ${deliveryDays}) / (total_shipments + 1),
        customer_satisfaction = ${customerRating ? sql`(customer_satisfaction * total_shipments + ${customerRating}) / (total_shipments + 1)` : sql`customer_satisfaction`},
        success_rate = (successful_shipments * 100.0) / total_shipments
    `);
  }

  private async updateGovernoratePerformance(
    companyId: number,
    address: Address,
    status: string,
    deliveryDays: number,
    customerRating?: number,
    failureReason?: string
  ) {
    const db = await requireDb();
    await db.execute(sql`
      INSERT INTO shipping_performance_by_governorate (
        company_id, governorate_code, governorate_name,
        total_shipments, successful_shipments, failed_shipments, returned_shipments,
        avg_delivery_days, customer_satisfaction
      ) VALUES (
        ${companyId}, ${address.governorateCode}, ${address.governorateName},
        1, ${status === 'delivered' ? 1 : 0}, ${status === 'failed' ? 1 : 0},
        ${status === 'returned' ? 1 : 0}, ${deliveryDays}, ${customerRating || 0}
      )
      ON DUPLICATE KEY UPDATE
        total_shipments = total_shipments + 1,
        successful_shipments = successful_shipments + ${status === 'delivered' ? 1 : 0},
        failed_shipments = failed_shipments + ${status === 'failed' ? 1 : 0},
        returned_shipments = returned_shipments + ${status === 'returned' ? 1 : 0},
        avg_delivery_days = (avg_delivery_days * total_shipments + ${deliveryDays}) / (total_shipments + 1),
        customer_satisfaction = ${customerRating ? sql`(customer_satisfaction * total_shipments + ${customerRating}) / (total_shipments + 1)` : sql`customer_satisfaction`},
        success_rate = (successful_shipments * 100.0) / total_shipments
    `);
  }
}

export const intelligentShippingAllocator = new IntelligentShippingAllocator();
