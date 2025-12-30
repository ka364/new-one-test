/**
 * Shipping Bio-Integration Module
 * 
 * Integrates shipping and delivery with Bio-Modules for:
 * - Route optimization (Ant)
 * - Resilience and recovery (Tardigrade)
 * - Learning from delivery patterns (Corvid)
 */

import { sendBioMessage } from "./unified-messaging.js";
import { getBioDashboard } from "./bio-dashboard.js";

export interface DeliveryLocation {
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
}

export interface ShipmentData {
  shipmentId: number;
  orderId: number;
  orderNumber: string;
  pickupLocation: DeliveryLocation;
  deliveryLocation: DeliveryLocation;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedWeight?: number; // in kg
  fragile?: boolean;
}

export interface OptimizedRoute {
  shipmentId: number;
  routeId: string;
  estimatedDistance: number; // in km
  estimatedDuration: number; // in minutes
  estimatedCost: number; // in EGP
  waypoints: string[];
  optimizationScore: number; // 0-100
  recommendations: string[];
}

/**
 * Optimize delivery route using Ant (Swarm Intelligence)
 */
export async function optimizeDeliveryRoute(
  shipments: ShipmentData[]
): Promise<OptimizedRoute[]> {
  const dashboard = getBioDashboard();
  dashboard.trackModuleActivity("ant");

  const optimizedRoutes: OptimizedRoute[] = [];

  for (const shipment of shipments) {
    // Simple route optimization algorithm
    // In production, this would use real mapping APIs (Google Maps, etc.)
    
    const baseDistance = calculateDistance(
      shipment.pickupLocation,
      shipment.deliveryLocation
    );

    // Apply priority-based optimization
    let optimizationFactor = 1.0;
    const recommendations: string[] = [];

    switch (shipment.priority) {
      case "urgent":
        optimizationFactor = 0.8; // 20% faster route
        recommendations.push("استخدم أسرع طريق متاح");
        break;
      case "high":
        optimizationFactor = 0.9; // 10% faster route
        recommendations.push("تجنب الطرق المزدحمة");
        break;
      case "medium":
        optimizationFactor = 1.0; // Standard route
        recommendations.push("استخدم الطريق الأمثل");
        break;
      case "low":
        optimizationFactor = 1.1; // 10% longer but cheaper
        recommendations.push("يمكن استخدام طريق أطول لتوفير التكلفة");
        break;
    }

    // Fragile items need special handling
    if (shipment.fragile) {
      recommendations.push("تعامل بحذر - منتج قابل للكسر");
      optimizationFactor *= 1.1; // Add 10% time for careful handling
    }

    const estimatedDistance = baseDistance * optimizationFactor;
    const estimatedDuration = Math.round((estimatedDistance / 30) * 60); // Assume 30 km/h average
    const estimatedCost = Math.round(estimatedDistance * 5); // 5 EGP per km

    // Calculate optimization score (higher is better)
    const optimizationScore = Math.round(
      (100 - (optimizationFactor - 1) * 100) * 
      (shipment.priority === "urgent" ? 1.2 : 1.0)
    );

    optimizedRoutes.push({
      shipmentId: shipment.shipmentId,
      routeId: `ROUTE-${shipment.shipmentId}-${Date.now()}`,
      estimatedDistance,
      estimatedDuration,
      estimatedCost,
      waypoints: [
        shipment.pickupLocation.address,
        shipment.deliveryLocation.address,
      ],
      optimizationScore,
      recommendations,
    });
  }

  // Send optimization results to Corvid for learning
  await sendBioMessage(
    "ant",
    ["corvid"],
    "event",
    {
      eventType: "route.optimization",
      shipmentsCount: shipments.length,
      totalDistance: optimizedRoutes.reduce((sum, r) => sum + r.estimatedDistance, 0),
      totalDuration: optimizedRoutes.reduce((sum, r) => sum + r.estimatedDuration, 0),
      avgOptimizationScore: optimizedRoutes.reduce((sum, r) => sum + r.optimizationScore, 0) / optimizedRoutes.length,
    }
  );

  return optimizedRoutes;
}

/**
 * Calculate distance between two locations (simplified)
 * In production, use real geocoding and distance calculation
 */
function calculateDistance(
  location1: DeliveryLocation,
  location2: DeliveryLocation
): number {
  // If we have lat/lng, use Haversine formula
  if (
    location1.latitude &&
    location1.longitude &&
    location2.latitude &&
    location2.longitude
  ) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(location2.latitude - location1.latitude);
    const dLon = toRad(location2.longitude - location1.longitude);
    const lat1 = toRad(location1.latitude);
    const lat2 = toRad(location2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Fallback: estimate based on city/district
  if (location1.city && location2.city) {
    if (location1.city === location2.city) {
      // Same city - 5-15 km
      return 10;
    } else {
      // Different cities - 50-200 km
      return 100;
    }
  }

  // Default estimate
  return 20;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Track delivery status with Tardigrade (Resilience)
 */
export async function trackDeliveryWithTardigrade(
  shipmentId: number,
  status: "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned",
  location?: DeliveryLocation,
  notes?: string
): Promise<{
  success: boolean;
  resilienceScore: number;
  recommendations: string[];
}> {
  const dashboard = getBioDashboard();
  dashboard.trackModuleActivity("tardigrade");

  const recommendations: string[] = [];
  let resilienceScore = 100;

  // Handle failure scenarios
  if (status === "failed") {
    resilienceScore = 50;
    recommendations.push("إعادة المحاولة خلال 24 ساعة");
    recommendations.push("التواصل مع العميل لتحديد موعد جديد");
    
    // Learn from failure
    await sendBioMessage(
      "tardigrade",
      ["corvid", "ant"],
      "alert",
      {
        eventType: "delivery.failed",
        shipmentId,
        location,
        notes,
        timestamp: Date.now(),
      }
    );
  } else if (status === "returned") {
    resilienceScore = 30;
    recommendations.push("تحليل سبب الإرجاع");
    recommendations.push("تحديث معلومات العميل");
    
    await sendBioMessage(
      "tardigrade",
      ["corvid", "arachnid"],
      "alert",
      {
        eventType: "delivery.returned",
        shipmentId,
        location,
        notes,
        timestamp: Date.now(),
      }
    );
  } else if (status === "delivered") {
    resilienceScore = 100;
    recommendations.push("تم التوصيل بنجاح");
    
    await sendBioMessage(
      "tardigrade",
      ["corvid"],
      "event",
      {
        eventType: "delivery.success",
        shipmentId,
        location,
        timestamp: Date.now(),
      }
    );
  }

  return {
    success: true,
    resilienceScore,
    recommendations,
  };
}

/**
 * Batch optimize multiple shipments (Ant swarm behavior)
 */
export async function batchOptimizeShipments(
  shipments: ShipmentData[]
): Promise<{
  routes: OptimizedRoute[];
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  efficiency: number; // 0-100
}> {
  // Group shipments by area/city for better optimization
  const groupedShipments = groupShipmentsByArea(shipments);
  
  const allRoutes: OptimizedRoute[] = [];
  
  for (const [area, areaShipments] of Object.entries(groupedShipments)) {
    const routes = await optimizeDeliveryRoute(areaShipments);
    allRoutes.push(...routes);
  }

  const totalDistance = allRoutes.reduce((sum, r) => sum + r.estimatedDistance, 0);
  const totalDuration = allRoutes.reduce((sum, r) => sum + r.estimatedDuration, 0);
  const totalCost = allRoutes.reduce((sum, r) => sum + r.estimatedCost, 0);
  
  // Calculate efficiency (higher is better)
  const avgDistance = totalDistance / allRoutes.length;
  const efficiency = Math.min(100, Math.round((20 / avgDistance) * 100));

  return {
    routes: allRoutes,
    totalDistance,
    totalDuration,
    totalCost,
    efficiency,
  };
}

/**
 * Group shipments by delivery area
 */
function groupShipmentsByArea(
  shipments: ShipmentData[]
): Record<string, ShipmentData[]> {
  const grouped: Record<string, ShipmentData[]> = {};

  for (const shipment of shipments) {
    const area = shipment.deliveryLocation.city || shipment.deliveryLocation.district || "unknown";
    
    if (!grouped[area]) {
      grouped[area] = [];
    }
    
    grouped[area].push(shipment);
  }

  return grouped;
}

/**
 * Get delivery insights from Bio-Modules
 */
export async function getDeliveryInsights(shipmentId: number): Promise<{
  estimatedDeliveryTime: string;
  successProbability: number;
  riskFactors: string[];
  recommendations: string[];
}> {
  const dashboard = getBioDashboard();
  const dashboardData = dashboard.getDashboardData();

  const systemHealth = dashboardData.systemHealth.overall;
  const successProbability = Math.min(95, systemHealth);

  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  if (systemHealth < 70) {
    riskFactors.push("صحة النظام منخفضة");
    recommendations.push("مراقبة الشحنة عن كثب");
  }

  if (dashboardData.systemHealth.avgProcessingTime > 200) {
    riskFactors.push("وقت المعالجة أعلى من المعتاد");
    recommendations.push("قد يحدث تأخير في التوصيل");
  }

  // Estimate delivery time based on system performance
  const baseDeliveryHours = 24;
  const delayFactor = (100 - systemHealth) / 100;
  const estimatedHours = Math.round(baseDeliveryHours * (1 + delayFactor));
  
  const estimatedDeliveryTime = `${estimatedHours} ساعة`;

  return {
    estimatedDeliveryTime,
    successProbability,
    riskFactors,
    recommendations,
  };
}
