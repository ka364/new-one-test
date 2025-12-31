/**
 * Orders Bio-Integration Module
 * 
 * Integrates order processing with Bio-Modules for:
 * - Anomaly detection (Arachnid)
 * - Dynamic pricing (Chameleon)
 * - Learning from failures (Corvid)
 * - Resource distribution (Mycelium)
 */

import { sendBioMessage } from "./unified-messaging.js";
import { getBioDashboard } from "./bio-dashboard.js";
import { getConflictEngine } from "./conflict-resolution-protocol.js";

export interface OrderData {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: string;
}

export interface OrderValidationResult {
  isValid: boolean;
  anomalies: string[];
  warnings: string[];
  recommendations: string[];
  confidence: number;
}

/**
 * Validate order using Arachnid (Anomaly Detection)
 */
export async function validateOrderWithArachnid(
  orderData: OrderData
): Promise<OrderValidationResult> {
  const anomalies: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check 1: Unusually large order amount
  if (orderData.totalAmount > 10000) {
    anomalies.push("Large order amount detected");
    warnings.push(`Order amount ${orderData.totalAmount} EGP exceeds normal threshold`);
  }

  // Check 2: Suspicious quantity
  const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity > 50) {
    anomalies.push("Unusually high quantity");
    warnings.push(`Total quantity ${totalQuantity} exceeds normal threshold`);
  }

  // Check 3: Price anomalies
  for (const item of orderData.items) {
    if (item.price < 10) {
      anomalies.push(`Suspiciously low price for ${item.productName}`);
    }
    if (item.price > 5000) {
      warnings.push(`High price detected for ${item.productName}`);
    }
  }

  // Send to Arachnid for analysis
  try {
    await sendBioMessage(
      "arachnid",
      ["corvid"], // Inform Corvid for learning
      "event",
      {
        eventType: "order.validation",
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        totalAmount: orderData.totalAmount,
        anomalies,
        warnings,
      }
    );
  } catch (error) {
    console.error("[OrdersBioIntegration] Error sending to Arachnid:", error);
  }

  // Generate recommendations
  if (anomalies.length > 0) {
    recommendations.push("Manual review recommended");
    recommendations.push("Contact customer for verification");
  }

  const isValid = anomalies.length === 0;
  const confidence = isValid ? 0.95 : 0.6;

  return {
    isValid,
    anomalies,
    warnings,
    recommendations,
    confidence,
  };
}

/**
 * Apply dynamic pricing using Chameleon
 */
export async function applyDynamicPricing(
  productName: string,
  basePrice: number,
  context: {
    customerHistory?: number; // Number of previous orders
    timeOfDay?: number; // Hour of day (0-23)
    dayOfWeek?: number; // Day of week (0-6)
    currentDemand?: "low" | "medium" | "high";
  }
): Promise<{
  adjustedPrice: number;
  discount: number;
  reason: string;
}> {
  let adjustedPrice = basePrice;
  let discount = 0;
  let reason = "Standard pricing";

  // Loyal customer discount
  if (context.customerHistory && context.customerHistory >= 5) {
    discount = 0.1; // 10% discount
    adjustedPrice = basePrice * (1 - discount);
    reason = "Loyal customer discount (10%)";
  }

  // Time-based pricing
  if (context.timeOfDay) {
    // Off-peak hours (2 AM - 6 AM)
    if (context.timeOfDay >= 2 && context.timeOfDay < 6) {
      discount = Math.max(discount, 0.05); // 5% discount
      adjustedPrice = basePrice * (1 - discount);
      reason = "Off-peak hours discount (5%)";
    }
  }

  // Demand-based pricing
  if (context.currentDemand === "high") {
    // No discount during high demand
    discount = 0;
    adjustedPrice = basePrice;
    reason = "High demand - standard pricing";
  } else if (context.currentDemand === "low") {
    // Encourage purchases during low demand
    discount = Math.max(discount, 0.15); // 15% discount
    adjustedPrice = basePrice * (1 - discount);
    reason = "Low demand promotion (15%)";
  }

  // Send to Chameleon for tracking
  try {
    await sendBioMessage(
      "chameleon",
      ["corvid"], // Inform Corvid for learning
      "event",
      {
        eventType: "pricing.adjustment",
        productName,
        basePrice,
        adjustedPrice,
        discount,
        reason,
        context,
      }
    );
  } catch (error) {
    console.error("[OrdersBioIntegration] Error sending to Chameleon:", error);
  }

  return {
    adjustedPrice: Math.round(adjustedPrice * 100) / 100, // Round to 2 decimals
    discount,
    reason,
  };
}

/**
 * Process COD payment with bio-modules integration
 */
export async function processCODPayment(
  orderData: OrderData,
  deliveryStatus: "delivered" | "failed" | "returned"
): Promise<{
  success: boolean;
  paymentStatus: "paid" | "failed" | "pending";
  message: string;
}> {
  const dashboard = getBioDashboard();

  // Track activity
  dashboard.trackModuleActivity("mycelium"); // Resource distribution

  if (deliveryStatus === "delivered") {
    // Payment successful
    await sendBioMessage(
      "mycelium",
      ["corvid"],
      "event",
      {
        eventType: "payment.cod_success",
        orderId: orderData.orderId,
        amount: orderData.totalAmount,
        deliveryStatus,
      }
    );

    return {
      success: true,
      paymentStatus: "paid",
      message: "COD payment received successfully",
    };
  } else if (deliveryStatus === "failed" || deliveryStatus === "returned") {
    // Payment failed - learn from it
    await sendBioMessage(
      "corvid",
      ["arachnid", "mycelium"],
      "alert",
      {
        eventType: "payment.cod_failed",
        orderId: orderData.orderId,
        amount: orderData.totalAmount,
        deliveryStatus,
        customerPhone: orderData.customerPhone,
      }
    );

    return {
      success: false,
      paymentStatus: "failed",
      message: "COD payment failed - delivery not completed",
    };
  }

  return {
    success: false,
    paymentStatus: "pending",
    message: "Payment status pending",
  };
}

/**
 * Track order lifecycle with bio-modules
 */
export async function trackOrderLifecycle(
  orderId: number,
  orderNumber: string,
  status: "created" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
): Promise<void> {
  const dashboard = getBioDashboard();

  // Track activity based on status
  switch (status) {
    case "created":
      dashboard.trackModuleActivity("arachnid"); // Anomaly detection
      dashboard.trackModuleActivity("chameleon"); // Pricing
      break;
    case "confirmed":
      dashboard.trackModuleActivity("mycelium"); // Resource allocation
      break;
    case "processing":
      dashboard.trackModuleActivity("ant"); // Route optimization
      break;
    case "shipped":
      dashboard.trackModuleActivity("tardigrade"); // Resilience
      break;
    case "delivered":
      dashboard.trackModuleActivity("corvid"); // Learning
      break;
    case "cancelled":
      dashboard.trackModuleActivity("corvid"); // Learn from cancellation
      break;
  }

  // Send lifecycle event
  await sendBioMessage(
    "corvid",
    ["arachnid", "mycelium"],
    "event",
    {
      eventType: "order.lifecycle",
      orderId,
      orderNumber,
      status,
      timestamp: Date.now(),
    }
  );
}

/**
 * Get order insights from bio-modules
 */
export async function getOrderInsights(orderId: number): Promise<{
  riskScore: number;
  recommendations: string[];
  estimatedDeliveryTime: number; // in hours
  confidence: number;
}> {
  const dashboard = getBioDashboard();
  const dashboardData = dashboard.getDashboardData();

  // Calculate risk score based on system health
  const systemHealth = dashboardData.systemHealth.overall;
  const riskScore = Math.max(0, 100 - systemHealth) / 100;

  const recommendations: string[] = [];

  // Generate recommendations based on system state
  if (systemHealth < 70) {
    recommendations.push("System health below optimal - consider delaying shipment");
  }

  if (dashboardData.systemHealth.conflictRate > 5) {
    recommendations.push("High conflict rate detected - manual review recommended");
  }

  // Estimate delivery time based on system performance
  const avgProcessingTime = dashboardData.systemHealth.avgProcessingTime || 100;
  const estimatedDeliveryTime = Math.round(24 + (avgProcessingTime / 100) * 12); // 24-36 hours

  return {
    riskScore,
    recommendations,
    estimatedDeliveryTime,
    confidence: 0.85,
  };
}
