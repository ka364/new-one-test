/**
 * Smart Shipping Distributor System
 * نظام موزع الشحن الذكي
 * 
 * This intelligent system automatically assigns delivery orders to the optimal
 * distributor/courier based on location, performance history, capacity, and cost.
 */

export interface Distributor {
  id: string;
  name: string;
  nameAr: string;
  type: 'company' | 'individual' | 'partner';
  phone: string;
  email?: string;
  status: 'active' | 'inactive' | 'busy' | 'offline';
  
  // Coverage
  coverageAreas: string[]; // City/district names
  coverageRadius: number; // In kilometers
  baseLocation: {
    lat: number;
    lng: number;
    address: string;
    addressAr: string;
  };
  
  // Capacity
  maxDailyOrders: number;
  currentDailyOrders: number;
  availableCapacity: number; // maxDailyOrders - currentDailyOrders
  
  // Performance Metrics
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number; // Percentage
  averageDeliveryTime: number; // In hours
  averageRating: number; // 1-5 stars
  totalRatings: number;
  
  // Cost
  baseFee: number;
  perKmFee: number;
  
  // Tier & Rewards
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalEarnings: number;
  pendingPayment: number;
  
  joinDate: Date;
  lastActiveDate: Date;
}

export interface DeliveryAssignment {
  id: string;
  assignmentNumber: string;
  orderId: string;
  distributorId: string;
  distributorName: string;
  
  // Delivery Details
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
    addressAr: string;
  };
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
    addressAr: string;
  };
  distance: number; // In kilometers
  estimatedDeliveryTime: number; // In hours
  
  // Customer Info
  customerName: string;
  customerPhone: string;
  
  // Package Info
  packageDescription: string;
  packageDescriptionAr: string;
  packageValue: number;
  
  // Fees
  deliveryFee: number;
  distributorEarning: number;
  platformFee: number;
  
  // Status
  status: 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  assignedDate: Date;
  acceptedDate?: Date;
  pickedUpDate?: Date;
  deliveredDate?: Date;
  
  // Tracking
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
  
  // Rating
  rating?: number;
  feedback?: string;
  
  notes?: string;
}

export interface DistributorPerformance {
  distributorId: string;
  period: 'daily' | 'weekly' | 'monthly';
  
  deliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  
  averageDeliveryTime: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  onTimeRate: number;
  
  averageRating: number;
  totalRatings: number;
  
  totalEarnings: number;
  averageEarningPerDelivery: number;
  
  score: number; // Overall performance score 0-100
}

/**
 * Smart Distributor Manager
 */
export class SmartDistributorManager {
  private distributors: Map<string, Distributor> = new Map();
  private assignments: Map<string, DeliveryAssignment> = new Map();

  /**
   * Register a new distributor
   */
  registerDistributor(
    name: string,
    nameAr: string,
    type: 'company' | 'individual' | 'partner',
    phone: string,
    email: string | undefined,
    baseLocation: { lat: number; lng: number; address: string; addressAr: string },
    coverageAreas: string[],
    coverageRadius: number,
    maxDailyOrders: number
  ): Distributor {
    const distributorId = `DIST${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const distributor: Distributor = {
      id: distributorId,
      name,
      nameAr,
      type,
      phone,
      email,
      status: 'active',
      coverageAreas,
      coverageRadius,
      baseLocation,
      maxDailyOrders,
      currentDailyOrders: 0,
      availableCapacity: maxDailyOrders,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      successRate: 100,
      averageDeliveryTime: 24,
      averageRating: 5,
      totalRatings: 0,
      baseFee: 30,
      perKmFee: 2,
      tier: 'bronze',
      totalEarnings: 0,
      pendingPayment: 0,
      joinDate: new Date(),
      lastActiveDate: new Date(),
    };

    this.distributors.set(distributorId, distributor);
    console.log(`✅ Registered new distributor: ${name} (${distributorId})`);
    return distributor;
  }

  /**
   * Find optimal distributor for a delivery
   */
  findOptimalDistributor(
    deliveryLocation: { lat: number; lng: number; address: string },
    pickupLocation: { lat: number; lng: number; address: string },
    packageValue: number,
    urgency: 'standard' | 'express' | 'same_day'
  ): { distributor: Distributor; score: number; estimatedFee: number; estimatedTime: number } | null {
    const activeDistributors = Array.from(this.distributors.values())
      .filter(d => d.status === 'active' && d.availableCapacity > 0);

    if (activeDistributors.length === 0) {
      console.warn('⚠️ No available distributors found');
      return null;
    }

    // Score each distributor
    const scoredDistributors = activeDistributors.map(distributor => {
      // Calculate distance from distributor to pickup location
      const distanceToPickup = this.calculateDistance(
        distributor.baseLocation.lat,
        distributor.baseLocation.lng,
        pickupLocation.lat,
        pickupLocation.lng
      );

      // Calculate distance from pickup to delivery
      const deliveryDistance = this.calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        deliveryLocation.lat,
        deliveryLocation.lng
      );

      // Check if within coverage radius
      const withinCoverage = distanceToPickup <= distributor.coverageRadius;
      if (!withinCoverage) {
        return { distributor, score: 0, estimatedFee: 0, estimatedTime: 0 };
      }

      // Calculate estimated fee
      const estimatedFee = distributor.baseFee + (deliveryDistance * distributor.perKmFee);

      // Calculate estimated time (based on average speed of 30 km/h)
      const estimatedTime = (distanceToPickup + deliveryDistance) / 30;

      // Calculate score (0-100)
      let score = 0;

      // 1. Success rate (30 points)
      score += distributor.successRate * 0.3;

      // 2. Average rating (20 points)
      score += (distributor.averageRating / 5) * 20;

      // 3. Distance (20 points) - closer is better
      const maxDistance = 50; // km
      const distanceScore = Math.max(0, (1 - distanceToPickup / maxDistance)) * 20;
      score += distanceScore;

      // 4. Capacity (15 points)
      const capacityScore = (distributor.availableCapacity / distributor.maxDailyOrders) * 15;
      score += capacityScore;

      // 5. Speed (15 points) - faster is better
      const maxTime = 48; // hours
      const speedScore = Math.max(0, (1 - distributor.averageDeliveryTime / maxTime)) * 15;
      score += speedScore;

      // Urgency adjustments
      if (urgency === 'same_day') {
        // Prioritize speed and proximity
        score += speedScore * 0.5;
        score += distanceScore * 0.5;
      } else if (urgency === 'express') {
        // Balance speed and cost
        score += speedScore * 0.3;
      }

      // Tier bonus
      const tierBonus = {
        bronze: 0,
        silver: 2,
        gold: 5,
        platinum: 10,
      };
      score += tierBonus[distributor.tier];

      return {
        distributor,
        score: Math.min(100, score),
        estimatedFee,
        estimatedTime,
      };
    });

    // Sort by score (highest first)
    scoredDistributors.sort((a, b) => b.score - a.score);

    const best = scoredDistributors[0];
    if (best.score === 0) {
      console.warn('⚠️ No suitable distributor found within coverage area');
      return null;
    }

    console.log(`🎯 Selected distributor: ${best.distributor.name} (Score: ${best.score.toFixed(1)})`);
    return best;
  }

  /**
   * Assign delivery to distributor
   */
  assignDelivery(
    orderId: string,
    distributorId: string,
    pickupLocation: { lat: number; lng: number; address: string; addressAr: string },
    deliveryLocation: { lat: number; lng: number; address: string; addressAr: string },
    customerName: string,
    customerPhone: string,
    packageDescription: string,
    packageDescriptionAr: string,
    packageValue: number,
    deliveryFee: number
  ): DeliveryAssignment {
    const distributor = this.distributors.get(distributorId);
    if (!distributor) {
      throw new Error(`Distributor ${distributorId} not found`);
    }

    if (distributor.availableCapacity <= 0) {
      throw new Error(`Distributor ${distributor.name} has no available capacity`);
    }

    const assignmentId = `ASGN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const assignmentNumber = `#${assignmentId.slice(-8)}`;

    const distance = this.calculateDistance(
      pickupLocation.lat,
      pickupLocation.lng,
      deliveryLocation.lat,
      deliveryLocation.lng
    );

    const estimatedDeliveryTime = distance / 30; // Assuming 30 km/h average speed

    // Calculate earnings (distributor gets 80%, platform gets 20%)
    const distributorEarning = deliveryFee * 0.8;
    const platformFee = deliveryFee * 0.2;

    const assignment: DeliveryAssignment = {
      id: assignmentId,
      assignmentNumber,
      orderId,
      distributorId,
      distributorName: distributor.name,
      pickupLocation,
      deliveryLocation,
      distance,
      estimatedDeliveryTime,
      customerName,
      customerPhone,
      packageDescription,
      packageDescriptionAr,
      packageValue,
      deliveryFee,
      distributorEarning,
      platformFee,
      status: 'assigned',
      assignedDate: new Date(),
    };

    this.assignments.set(assignmentId, assignment);

    // Update distributor capacity
    distributor.currentDailyOrders += 1;
    distributor.availableCapacity -= 1;
    distributor.lastActiveDate = new Date();

    console.log(`📦 Assigned delivery ${assignmentNumber} to ${distributor.name}`);
    return assignment;
  }

  /**
   * Update assignment status
   */
  updateAssignmentStatus(
    assignmentId: string,
    status: 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled',
    currentLocation?: { lat: number; lng: number }
  ): void {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    const distributor = this.distributors.get(assignment.distributorId);
    if (!distributor) {
      throw new Error(`Distributor ${assignment.distributorId} not found`);
    }

    assignment.status = status;

    switch (status) {
      case 'accepted':
        assignment.acceptedDate = new Date();
        break;
      case 'picked_up':
        assignment.pickedUpDate = new Date();
        break;
      case 'delivered':
        assignment.deliveredDate = new Date();
        distributor.totalDeliveries += 1;
        distributor.successfulDeliveries += 1;
        distributor.pendingPayment += assignment.distributorEarning;
        this.updateDistributorMetrics(distributor);
        break;
      case 'failed':
        distributor.totalDeliveries += 1;
        distributor.failedDeliveries += 1;
        this.updateDistributorMetrics(distributor);
        break;
    }

    if (currentLocation) {
      assignment.currentLocation = {
        ...currentLocation,
        timestamp: new Date(),
      };
    }

    console.log(`📍 Updated assignment ${assignment.assignmentNumber} status to: ${status}`);
  }

  /**
   * Rate a delivery
   */
  rateDelivery(assignmentId: string, rating: number, feedback?: string): void {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    const distributor = this.distributors.get(assignment.distributorId);
    if (!distributor) {
      throw new Error(`Distributor ${assignment.distributorId} not found`);
    }

    assignment.rating = rating;
    assignment.feedback = feedback;

    // Update distributor rating
    const totalRatingPoints = distributor.averageRating * distributor.totalRatings;
    distributor.totalRatings += 1;
    distributor.averageRating = (totalRatingPoints + rating) / distributor.totalRatings;

    this.updateDistributorTier(distributor);

    console.log(`⭐ Rated delivery ${assignment.assignmentNumber}: ${rating}/5`);
  }

  /**
   * Update distributor metrics
   */
  private updateDistributorMetrics(distributor: Distributor): void {
    distributor.successRate = distributor.totalDeliveries > 0
      ? (distributor.successfulDeliveries / distributor.totalDeliveries) * 100
      : 100;
  }

  /**
   * Update distributor tier based on performance
   */
  private updateDistributorTier(distributor: Distributor): void {
    const oldTier = distributor.tier;

    if (distributor.totalDeliveries >= 1000 && distributor.successRate >= 98 && distributor.averageRating >= 4.8) {
      distributor.tier = 'platinum';
    } else if (distributor.totalDeliveries >= 500 && distributor.successRate >= 95 && distributor.averageRating >= 4.5) {
      distributor.tier = 'gold';
    } else if (distributor.totalDeliveries >= 200 && distributor.successRate >= 90 && distributor.averageRating >= 4.0) {
      distributor.tier = 'silver';
    } else {
      distributor.tier = 'bronze';
    }

    if (oldTier !== distributor.tier) {
      console.log(`🎉 Distributor ${distributor.name} upgraded from ${oldTier} to ${distributor.tier}!`);
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get distributor performance
   */
  getDistributorPerformance(distributorId: string, period: 'daily' | 'weekly' | 'monthly'): DistributorPerformance {
    const distributor = this.distributors.get(distributorId);
    if (!distributor) {
      throw new Error(`Distributor ${distributorId} not found`);
    }

    // In a real system, this would filter assignments by date range
    const assignments = Array.from(this.assignments.values())
      .filter(a => a.distributorId === distributorId);

    const delivered = assignments.filter(a => a.status === 'delivered');
    const failed = assignments.filter(a => a.status === 'failed');

    const totalEarnings = delivered.reduce((sum, a) => sum + a.distributorEarning, 0);
    const avgEarning = delivered.length > 0 ? totalEarnings / delivered.length : 0;

    // Calculate performance score
    const score = Math.min(100,
      (distributor.successRate * 0.4) +
      (distributor.averageRating * 20 * 0.3) +
      ((distributor.totalDeliveries / 100) * 0.3)
    );

    return {
      distributorId,
      period,
      deliveries: assignments.length,
      successfulDeliveries: delivered.length,
      failedDeliveries: failed.length,
      successRate: distributor.successRate,
      averageDeliveryTime: distributor.averageDeliveryTime,
      onTimeDeliveries: delivered.length, // Simplified
      lateDeliveries: 0,
      onTimeRate: 100,
      averageRating: distributor.averageRating,
      totalRatings: distributor.totalRatings,
      totalEarnings,
      averageEarningPerDelivery: avgEarning,
      score,
    };
  }

  /**
   * Get all distributors
   */
  getAllDistributors(): Distributor[] {
    return Array.from(this.distributors.values());
  }

  /**
   * Get distributor assignments
   */
  getDistributorAssignments(distributorId: string): DeliveryAssignment[] {
    return Array.from(this.assignments.values())
      .filter(a => a.distributorId === distributorId)
      .sort((a, b) => b.assignedDate.getTime() - a.assignedDate.getTime());
  }
}

// Singleton instance
let smartDistributorManager: SmartDistributorManager | null = null;

/**
 * Get the smart distributor manager instance
 */
export function getSmartDistributorManager(): SmartDistributorManager {
  if (!smartDistributorManager) {
    smartDistributorManager = new SmartDistributorManager();
  }
  return smartDistributorManager;
}
