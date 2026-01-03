/**
 * Fetch for Me Service System
 * نظام خدمة "أحضر لي"
 * 
 * This service allows customers to request any product from anywhere in Egypt.
 * Mandatory prepayment is required before processing the request.
 */

export interface FetchRequest {
  id: string;
  requestNumber: string;
  
  // Customer Info
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryAddressAr: string;
  city: string;
  
  // Product Details
  productName: string;
  productNameAr: string;
  productDescription: string;
  productUrl?: string; // Link to the product online
  productImage?: string;
  quantity: number;
  
  // Source Info
  sourceName: string; // Store/website name where product is available
  sourceLocation: string; // City/area where to buy from
  
  // Pricing
  estimatedProductPrice: number; // Customer's estimate or actual price
  serviceFeePercentage: number; // e.g., 15%
  serviceFee: number;
  estimatedShippingFee: number;
  totalEstimatedCost: number;
  
  // Actual costs (filled after procurement)
  actualProductPrice?: number;
  actualShippingFee?: number;
  totalActualCost?: number;
  refundAmount?: number; // If actual < estimated
  
  // Payment
  prepaymentAmount: number; // Must equal totalEstimatedCost
  prepaymentStatus: 'pending' | 'paid' | 'refunded';
  prepaymentDate?: Date;
  paymentMethod: 'card' | 'fawry' | 'wallet' | 'bank_transfer';
  shopifyOrderId?: string; // Link to Shopify order
  
  // Status
  status: 'pending_payment' | 'paid' | 'procurement' | 'purchased' | 'shipping' | 'delivered' | 'cancelled';
  
  // Procurement
  assignedTo?: string; // Employee ID
  procurementNotes?: string;
  purchaseReceipt?: string; // Image URL
  
  // Tracking
  trackingNumber?: string;
  distributorId?: string;
  
  // Dates
  requestDate: Date;
  paidDate?: Date;
  purchasedDate?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
}

export interface FetchServiceConfig {
  serviceFeePercentage: number; // Default 15%
  minServiceFee: number; // Minimum fee in EGP
  shippingFeePerKm: number; // For distance calculation
  baseShippingFee: number;
  maxEstimatedPrice: number; // Maximum allowed estimated price
  refundPolicy: 'full' | 'difference' | 'none';
}

/**
 * Fetch Service Manager
 */
export class FetchServiceManager {
  private requests: Map<string, FetchRequest> = new Map();
  private config: FetchServiceConfig = {
    serviceFeePercentage: 15, // 15% service fee
    minServiceFee: 20, // Minimum 20 EGP
    shippingFeePerKm: 2,
    baseShippingFee: 30,
    maxEstimatedPrice: 10000, // Max 10,000 EGP per item
    refundPolicy: 'difference', // Refund the difference if actual < estimated
  };

  /**
   * Create a new fetch request
   */
  createRequest(
    customerName: string,
    customerPhone: string,
    customerEmail: string | undefined,
    deliveryAddress: string,
    deliveryAddressAr: string,
    city: string,
    productName: string,
    productNameAr: string,
    productDescription: string,
    productUrl: string | undefined,
    quantity: number,
    sourceName: string,
    sourceLocation: string,
    estimatedProductPrice: number,
    estimatedDistance: number,
    customerNotes?: string
  ): FetchRequest {
    // Validate estimated price
    if (estimatedProductPrice > this.config.maxEstimatedPrice) {
      throw new Error(`Estimated price cannot exceed ${this.config.maxEstimatedPrice} EGP per item`);
    }

    const requestId = `FETCH${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const requestNumber = `#F${requestId.slice(-8)}`;

    // Calculate costs
    const totalProductCost = estimatedProductPrice * quantity;
    const serviceFee = Math.max(
      this.config.minServiceFee,
      totalProductCost * (this.config.serviceFeePercentage / 100)
    );
    const estimatedShippingFee = this.config.baseShippingFee + (estimatedDistance * this.config.shippingFeePerKm);
    const totalEstimatedCost = totalProductCost + serviceFee + estimatedShippingFee;

    const request: FetchRequest = {
      id: requestId,
      requestNumber,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryAddressAr,
      city,
      productName,
      productNameAr,
      productDescription,
      productUrl,
      quantity,
      sourceName,
      sourceLocation,
      estimatedProductPrice,
      serviceFeePercentage: this.config.serviceFeePercentage,
      serviceFee,
      estimatedShippingFee,
      totalEstimatedCost,
      prepaymentAmount: totalEstimatedCost,
      prepaymentStatus: 'pending',
      paymentMethod: 'card', // Default, will be updated
      status: 'pending_payment',
      requestDate: new Date(),
      customerNotes,
    };

    this.requests.set(requestId, request);
    console.log(`📝 Created fetch request ${requestNumber} - Total: ${totalEstimatedCost} EGP (Prepayment Required)`);
    return request;
  }

  /**
   * Confirm payment for a fetch request
   */
  confirmPayment(
    requestId: string,
    shopifyOrderId: string,
    paymentMethod: 'card' | 'fawry' | 'wallet' | 'bank_transfer'
  ): void {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    if (request.prepaymentStatus === 'paid') {
      throw new Error(`Request ${request.requestNumber} is already paid`);
    }

    request.prepaymentStatus = 'paid';
    request.paidDate = new Date();
    request.shopifyOrderId = shopifyOrderId;
    request.paymentMethod = paymentMethod;
    request.status = 'paid';

    console.log(`✅ Payment confirmed for ${request.requestNumber} - ${request.prepaymentAmount} EGP`);
  }

  /**
   * Assign request to procurement team member
   */
  assignToProcurement(requestId: string, employeeId: string): void {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    if (request.prepaymentStatus !== 'paid') {
      throw new Error(`Request ${request.requestNumber} must be paid before assignment`);
    }

    request.assignedTo = employeeId;
    request.status = 'procurement';

    console.log(`👤 Assigned ${request.requestNumber} to employee ${employeeId}`);
  }

  /**
   * Mark product as purchased
   */
  markAsPurchased(
    requestId: string,
    actualProductPrice: number,
    purchaseReceipt: string,
    procurementNotes?: string
  ): void {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    const totalActualProductCost = actualProductPrice * request.quantity;
    request.actualProductPrice = actualProductPrice;
    request.actualShippingFee = request.estimatedShippingFee; // Will be updated after shipping
    request.totalActualCost = totalActualProductCost + request.serviceFee + request.estimatedShippingFee;
    request.purchaseReceipt = purchaseReceipt;
    request.procurementNotes = procurementNotes;
    request.purchasedDate = new Date();
    request.status = 'purchased';

    // Calculate refund if actual cost is less than estimated
    if (this.config.refundPolicy === 'difference' && request.totalActualCost < request.totalEstimatedCost) {
      request.refundAmount = request.totalEstimatedCost - request.totalActualCost;
      console.log(`💰 Refund of ${request.refundAmount} EGP will be issued for ${request.requestNumber}`);
    }

    console.log(`🛍️ Product purchased for ${request.requestNumber} - Actual: ${totalActualProductCost} EGP`);
  }

  /**
   * Assign to shipping
   */
  assignToShipping(requestId: string, distributorId: string, trackingNumber: string): void {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    request.distributorId = distributorId;
    request.trackingNumber = trackingNumber;
    request.shippedDate = new Date();
    request.status = 'shipping';

    console.log(`🚚 ${request.requestNumber} assigned to distributor ${distributorId}`);
  }

  /**
   * Mark as delivered
   */
  markAsDelivered(requestId: string): void {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    request.deliveredDate = new Date();
    request.status = 'delivered';

    console.log(`✅ ${request.requestNumber} delivered successfully`);
  }

  /**
   * Cancel request
   */
  cancelRequest(requestId: string, reason: string): void {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    if (request.status === 'delivered') {
      throw new Error('Cannot cancel a delivered request');
    }

    request.status = 'cancelled';
    request.internalNotes = `Cancelled: ${reason}`;

    // Issue full refund if payment was made
    if (request.prepaymentStatus === 'paid') {
      request.refundAmount = request.prepaymentAmount;
      request.prepaymentStatus = 'refunded';
      console.log(`💰 Full refund of ${request.refundAmount} EGP issued for ${request.requestNumber}`);
    }

    console.log(`❌ ${request.requestNumber} cancelled: ${reason}`);
  }

  /**
   * Get request by ID
   */
  getRequest(requestId: string): FetchRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get all requests
   */
  getAllRequests(): FetchRequest[] {
    return Array.from(this.requests.values())
      .sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
  }

  /**
   * Get requests by status
   */
  getRequestsByStatus(status: FetchRequest['status']): FetchRequest[] {
    return Array.from(this.requests.values())
      .filter(r => r.status === status)
      .sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
  }

  /**
   * Get requests assigned to employee
   */
  getRequestsByEmployee(employeeId: string): FetchRequest[] {
    return Array.from(this.requests.values())
      .filter(r => r.assignedTo === employeeId)
      .sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
  }

  /**
   * Calculate estimated cost for a request
   */
  calculateEstimatedCost(
    productPrice: number,
    quantity: number,
    estimatedDistance: number
  ): {
    productCost: number;
    serviceFee: number;
    shippingFee: number;
    total: number;
  } {
    const productCost = productPrice * quantity;
    const serviceFee = Math.max(
      this.config.minServiceFee,
      productCost * (this.config.serviceFeePercentage / 100)
    );
    const shippingFee = this.config.baseShippingFee + (estimatedDistance * this.config.shippingFeePerKm);
    const total = productCost + serviceFee + shippingFee;

    return {
      productCost,
      serviceFee,
      shippingFee,
      total,
    };
  }

  /**
   * Get service configuration
   */
  getConfig(): FetchServiceConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  updateConfig(updates: Partial<FetchServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('⚙️ Fetch service configuration updated');
  }
}

// Singleton instance
let fetchServiceManager: FetchServiceManager | null = null;

/**
 * Get the fetch service manager instance
 */
export function getFetchServiceManager(): FetchServiceManager {
  if (!fetchServiceManager) {
    fetchServiceManager = new FetchServiceManager();
  }
  return fetchServiceManager;
}
