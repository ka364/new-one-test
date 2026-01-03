/**
 * Affiliate Management System
 * نظام إدارة المسوقين والعمولات
 * 
 * This system manages a large team of marketers/affiliates who promote
 * factory products and earn commissions on sales.
 */

export interface Affiliate {
  id: string;
  code: string; // Unique affiliate code (e.g., "AHMED2025")
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  joinDate: Date;
  factoryId?: string; // Optional: affiliate tied to specific factory
  commissionRate: number; // Percentage (e.g., 10 means 10%)
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSales: number;
  totalCommission: number;
  totalOrders: number;
  pendingCommission: number;
  paidCommission: number;
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  notes?: string;
}

export interface AffiliateOrder {
  id: string;
  orderId: string;
  affiliateId: string;
  affiliateCode: string;
  customerName: string;
  customerPhone: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  orderDate: Date;
  confirmedDate?: Date;
  paidDate?: Date;
  paymentMethod?: 'bank_transfer' | 'cash' | 'wallet';
  paymentReference?: string;
}

export interface CommissionPayout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  orderCount: number;
  paymentMethod: 'bank_transfer' | 'cash' | 'wallet';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestDate: Date;
  processedDate?: Date;
  completedDate?: Date;
  bankAccount?: {
    accountNumber: string;
    bankName: string;
  };
  reference?: string;
  notes?: string;
}

export interface AffiliateTier {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tierAr: string;
  minSales: number;
  commissionRate: number;
  benefits: string[];
  benefitsAr: string[];
  color: string;
  icon: string;
}

export const AFFILIATE_TIERS: AffiliateTier[] = [
  {
    tier: 'bronze',
    tierAr: 'برونزي',
    minSales: 0,
    commissionRate: 10,
    benefits: ['10% commission', 'Basic marketing materials', 'Email support'],
    benefitsAr: ['عمولة 10%', 'مواد تسويقية أساسية', 'دعم عبر البريد'],
    color: '#CD7F32',
    icon: '🥉',
  },
  {
    tier: 'silver',
    tierAr: 'فضي',
    minSales: 50000,
    commissionRate: 12,
    benefits: ['12% commission', 'Premium marketing materials', 'Priority support', 'Monthly bonuses'],
    benefitsAr: ['عمولة 12%', 'مواد تسويقية متميزة', 'دعم أولوية', 'مكافآت شهرية'],
    color: '#C0C0C0',
    icon: '🥈',
  },
  {
    tier: 'gold',
    tierAr: 'ذهبي',
    minSales: 150000,
    commissionRate: 15,
    benefits: ['15% commission', 'Exclusive products', 'Dedicated account manager', 'Special pricing'],
    benefitsAr: ['عمولة 15%', 'منتجات حصرية', 'مدير حساب مخصص', 'أسعار خاصة'],
    color: '#FFD700',
    icon: '🥇',
  },
  {
    tier: 'platinum',
    tierAr: 'بلاتيني',
    minSales: 500000,
    commissionRate: 20,
    benefits: ['20% commission', 'Early access to new products', 'VIP events', 'Custom branding'],
    benefitsAr: ['عمولة 20%', 'وصول مبكر للمنتجات الجديدة', 'فعاليات VIP', 'علامة تجارية مخصصة'],
    color: '#E5E4E2',
    icon: '💎',
  },
];

/**
 * Affiliate Manager
 */
export class AffiliateManager {
  private affiliates: Map<string, Affiliate> = new Map();
  private affiliatesByCode: Map<string, Affiliate> = new Map();
  private orders: Map<string, AffiliateOrder> = new Map();
  private payouts: Map<string, CommissionPayout> = new Map();

  /**
   * Register a new affiliate
   */
  registerAffiliate(
    name: string,
    phone: string,
    email?: string,
    factoryId?: string
  ): Affiliate {
    const affiliateId = `AFF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Generate unique affiliate code
    const code = this.generateAffiliateCode(name);

    const affiliate: Affiliate = {
      id: affiliateId,
      code,
      name,
      phone,
      email,
      status: 'active',
      joinDate: new Date(),
      factoryId,
      commissionRate: 10, // Start at bronze tier
      tier: 'bronze',
      totalSales: 0,
      totalCommission: 0,
      totalOrders: 0,
      pendingCommission: 0,
      paidCommission: 0,
    };

    this.affiliates.set(affiliateId, affiliate);
    this.affiliatesByCode.set(code, affiliate);

    console.log(`✅ Registered new affiliate: ${name} (${code})`);
    return affiliate;
  }

  /**
   * Generate unique affiliate code
   */
  private generateAffiliateCode(name: string): string {
    // Take first 4 letters of name + random number
    const namePrefix = name
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 4)
      .padEnd(4, 'X');
    
    let code: string;
    let attempts = 0;
    
    do {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      code = `${namePrefix}${randomNum}`;
      attempts++;
    } while (this.affiliatesByCode.has(code) && attempts < 10);

    return code;
  }

  /**
   * Get affiliate by code
   */
  getAffiliateByCode(code: string): Affiliate | undefined {
    return this.affiliatesByCode.get(code.toUpperCase());
  }

  /**
   * Get affiliate by ID
   */
  getAffiliate(affiliateId: string): Affiliate | undefined {
    return this.affiliates.get(affiliateId);
  }

  /**
   * Track an order for an affiliate
   */
  trackOrder(
    affiliateCode: string,
    orderId: string,
    customerName: string,
    customerPhone: string,
    orderAmount: number
  ): AffiliateOrder {
    const affiliate = this.getAffiliateByCode(affiliateCode);
    if (!affiliate) {
      throw new Error(`Affiliate with code ${affiliateCode} not found`);
    }

    const commissionAmount = (orderAmount * affiliate.commissionRate) / 100;

    const affiliateOrder: AffiliateOrder = {
      id: `AO${Date.now()}${Math.floor(Math.random() * 1000)}`,
      orderId,
      affiliateId: affiliate.id,
      affiliateCode: affiliate.code,
      customerName,
      customerPhone,
      orderAmount,
      commissionRate: affiliate.commissionRate,
      commissionAmount,
      status: 'pending',
      orderDate: new Date(),
    };

    this.orders.set(affiliateOrder.id, affiliateOrder);

    // Update affiliate stats
    affiliate.totalOrders += 1;
    affiliate.pendingCommission += commissionAmount;

    console.log(`📊 Tracked order for affiliate ${affiliate.code}: ${orderAmount} EGP (Commission: ${commissionAmount} EGP)`);
    return affiliateOrder;
  }

  /**
   * Confirm an order (move commission from pending to earned)
   */
  confirmOrder(affiliateOrderId: string): void {
    const order = this.orders.get(affiliateOrderId);
    if (!order) {
      throw new Error(`Affiliate order ${affiliateOrderId} not found`);
    }

    const affiliate = this.affiliates.get(order.affiliateId);
    if (!affiliate) {
      throw new Error(`Affiliate ${order.affiliateId} not found`);
    }

    order.status = 'confirmed';
    order.confirmedDate = new Date();

    // Update affiliate stats
    affiliate.totalSales += order.orderAmount;
    affiliate.totalCommission += order.commissionAmount;
    affiliate.pendingCommission -= order.commissionAmount;

    // Check for tier upgrade
    this.updateAffiliateTier(affiliate);

    console.log(`✅ Confirmed order for affiliate ${affiliate.code}`);
  }

  /**
   * Update affiliate tier based on total sales
   */
  private updateAffiliateTier(affiliate: Affiliate): void {
    const oldTier = affiliate.tier;
    
    for (let i = AFFILIATE_TIERS.length - 1; i >= 0; i--) {
      const tier = AFFILIATE_TIERS[i];
      if (affiliate.totalSales >= tier.minSales) {
        affiliate.tier = tier.tier;
        affiliate.commissionRate = tier.commissionRate;
        break;
      }
    }

    if (oldTier !== affiliate.tier) {
      console.log(`🎉 Affiliate ${affiliate.code} upgraded from ${oldTier} to ${affiliate.tier}!`);
    }
  }

  /**
   * Request commission payout
   */
  requestPayout(
    affiliateId: string,
    paymentMethod: 'bank_transfer' | 'cash' | 'wallet',
    bankAccount?: { accountNumber: string; bankName: string }
  ): CommissionPayout {
    const affiliate = this.affiliates.get(affiliateId);
    if (!affiliate) {
      throw new Error(`Affiliate ${affiliateId} not found`);
    }

    const unpaidCommission = affiliate.totalCommission - affiliate.paidCommission;
    if (unpaidCommission <= 0) {
      throw new Error('No commission available for payout');
    }

    // Count orders that are confirmed but not yet paid
    const unpaidOrders = Array.from(this.orders.values()).filter(
      o => o.affiliateId === affiliateId && o.status === 'confirmed'
    );

    const payout: CommissionPayout = {
      id: `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`,
      affiliateId,
      affiliateName: affiliate.name,
      amount: unpaidCommission,
      orderCount: unpaidOrders.length,
      paymentMethod,
      status: 'pending',
      requestDate: new Date(),
      bankAccount,
    };

    this.payouts.set(payout.id, payout);

    console.log(`💰 Payout requested for affiliate ${affiliate.code}: ${unpaidCommission} EGP`);
    return payout;
  }

  /**
   * Process payout
   */
  processPayout(payoutId: string, reference?: string): void {
    const payout = this.payouts.get(payoutId);
    if (!payout) {
      throw new Error(`Payout ${payoutId} not found`);
    }

    const affiliate = this.affiliates.get(payout.affiliateId);
    if (!affiliate) {
      throw new Error(`Affiliate ${payout.affiliateId} not found`);
    }

    payout.status = 'completed';
    payout.completedDate = new Date();
    payout.reference = reference;

    // Update affiliate paid commission
    affiliate.paidCommission += payout.amount;

    // Mark all confirmed orders as paid
    Array.from(this.orders.values())
      .filter(o => o.affiliateId === payout.affiliateId && o.status === 'confirmed')
      .forEach(o => {
        o.status = 'paid';
        o.paidDate = new Date();
      });

    console.log(`✅ Payout completed for affiliate ${affiliate.code}: ${payout.amount} EGP`);
  }

  /**
   * Get affiliate statistics
   */
  getAffiliateStats(affiliateId: string): {
    totalSales: number;
    totalOrders: number;
    totalCommission: number;
    paidCommission: number;
    pendingCommission: number;
    unpaidCommission: number;
    conversionRate: number;
    averageOrderValue: number;
    tier: string;
    nextTier?: string;
    salesUntilNextTier?: number;
  } {
    const affiliate = this.affiliates.get(affiliateId);
    if (!affiliate) {
      throw new Error(`Affiliate ${affiliateId} not found`);
    }

    const unpaidCommission = affiliate.totalCommission - affiliate.paidCommission;
    const averageOrderValue = affiliate.totalOrders > 0 ? affiliate.totalSales / affiliate.totalOrders : 0;

    // Find next tier
    const currentTierIndex = AFFILIATE_TIERS.findIndex(t => t.tier === affiliate.tier);
    const nextTier = currentTierIndex < AFFILIATE_TIERS.length - 1 ? AFFILIATE_TIERS[currentTierIndex + 1] : undefined;
    const salesUntilNextTier = nextTier ? Math.max(0, nextTier.minSales - affiliate.totalSales) : undefined;

    return {
      totalSales: affiliate.totalSales,
      totalOrders: affiliate.totalOrders,
      totalCommission: affiliate.totalCommission,
      paidCommission: affiliate.paidCommission,
      pendingCommission: affiliate.pendingCommission,
      unpaidCommission,
      conversionRate: 0, // TODO: Calculate from tracking data
      averageOrderValue,
      tier: affiliate.tier,
      nextTier: nextTier?.tier,
      salesUntilNextTier,
    };
  }

  /**
   * Get affiliate orders
   */
  getAffiliateOrders(affiliateId: string): AffiliateOrder[] {
    return Array.from(this.orders.values())
      .filter(o => o.affiliateId === affiliateId)
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }

  /**
   * Get affiliate payouts
   */
  getAffiliatePayouts(affiliateId: string): CommissionPayout[] {
    return Array.from(this.payouts.values())
      .filter(p => p.affiliateId === affiliateId)
      .sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
  }

  /**
   * Get all affiliates
   */
  getAllAffiliates(): Affiliate[] {
    return Array.from(this.affiliates.values());
  }

  /**
   * Generate affiliate link
   */
  generateAffiliateLink(affiliateCode: string, productId?: string): string {
    const baseUrl = 'https://haderos.com';
    if (productId) {
      return `${baseUrl}/product/${productId}?ref=${affiliateCode}`;
    }
    return `${baseUrl}?ref=${affiliateCode}`;
  }

  /**
   * Generate live stream affiliate link
   */
  generateLiveStreamLink(affiliateCode: string, streamId: string): string {
    return `https://haderos.com/live/${streamId}?ref=${affiliateCode}`;
  }
}

// Singleton instance
let affiliateManager: AffiliateManager | null = null;

/**
 * Get the affiliate manager instance
 */
export function getAffiliateManager(): AffiliateManager {
  if (!affiliateManager) {
    affiliateManager = new AffiliateManager();
  }
  return affiliateManager;
}
