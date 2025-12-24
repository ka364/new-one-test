/**
 * Inventory Bio-Integration Module
 * 
 * Integrates inventory management with Bio-Modules for:
 * - Resource distribution (Mycelium)
 * - Distributed authority (Cephalopod)
 * - Learning from patterns (Corvid)
 */

import { sendBioMessage } from "./unified-messaging.js";
import { getBioDashboard } from "./bio-dashboard.js";

export interface InventoryItem {
  productId: number;
  modelCode: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  location: string;
  supplierId?: number;
}

export interface ResourceAllocation {
  productId: number;
  allocatedQuantity: number;
  fromLocation: string;
  toLocation: string;
  priority: "low" | "medium" | "high" | "urgent";
  reason: string;
}

export interface DistributionDecision {
  approved: boolean;
  allocations: ResourceAllocation[];
  reasoning: string;
  confidence: number; // 0-100
  alternativeOptions?: string[];
}

/**
 * Distribute resources using Mycelium (Network-based Distribution)
 */
export async function distributeResources(
  orderId: number,
  requiredItems: Array<{ productId: number; quantity: number }>,
  deliveryLocation: string
): Promise<DistributionDecision> {
  const dashboard = getBioDashboard();
  dashboard.trackModuleActivity("mycelium");

  const allocations: ResourceAllocation[] = [];
  let totalConfidence = 0;

  for (const item of requiredItems) {
    // Simple allocation logic (in production, this would query actual inventory)
    const allocation: ResourceAllocation = {
      productId: item.productId,
      allocatedQuantity: item.quantity,
      fromLocation: selectOptimalWarehouse(deliveryLocation),
      toLocation: deliveryLocation,
      priority: "medium",
      reason: `Allocated ${item.quantity} units from nearest warehouse`,
    };

    allocations.push(allocation);
    totalConfidence += 85; // Simulated confidence
  }

  const avgConfidence = Math.round(totalConfidence / requiredItems.length);

  // Notify Corvid for learning
  await sendBioMessage(
    "mycelium",
    ["corvid"],
    "event",
    {
      eventType: "resource.distributed",
      orderId,
      allocationsCount: allocations.length,
      totalItems: requiredItems.reduce((sum, i) => sum + i.quantity, 0),
      confidence: avgConfidence,
    }
  );

  return {
    approved: true,
    allocations,
    reasoning: `Successfully allocated resources from ${allocations.length} location(s)`,
    confidence: avgConfidence,
    alternativeOptions: allocations.length > 1 
      ? ["يمكن توحيد الشحنة من موقع واحد لتقليل التكلفة"]
      : undefined,
  };
}

/**
 * Select optimal warehouse based on delivery location
 */
function selectOptimalWarehouse(deliveryLocation: string): string {
  // Simple logic - in production, use actual warehouse data and distance calculation
  const warehouses = [
    { name: "المخزن الرئيسي - القاهرة", city: "القاهرة" },
    { name: "مخزن الإسكندرية", city: "الإسكندرية" },
    { name: "مخزن المنصورة", city: "المنصورة" },
    { name: "مخزن أسيوط", city: "أسيوط" },
  ];

  // Try to match city
  const matchingWarehouse = warehouses.find(w => 
    deliveryLocation.includes(w.city)
  );

  return matchingWarehouse?.name || warehouses[0].name;
}

/**
 * Check inventory availability with Mycelium intelligence
 */
export async function checkInventoryAvailability(
  items: Array<{ productId: number; quantity: number }>
): Promise<{
  available: boolean;
  availableItems: Array<{ productId: number; availableQuantity: number; location: string }>;
  missingItems: Array<{ productId: number; requiredQuantity: number; shortfall: number }>;
  recommendations: string[];
}> {
  const dashboard = getBioDashboard();
  dashboard.trackModuleActivity("mycelium");

  // Simulated inventory check (in production, query actual database)
  const availableItems = items.map(item => ({
    productId: item.productId,
    availableQuantity: Math.floor(item.quantity * 1.2), // Simulate 20% extra stock
    location: "المخزن الرئيسي - القاهرة",
  }));

  const missingItems: Array<{ productId: number; requiredQuantity: number; shortfall: number }> = [];
  const recommendations: string[] = [];

  // Check if all items are available
  const allAvailable = items.every((item, index) => 
    availableItems[index].availableQuantity >= item.quantity
  );

  if (!allAvailable) {
    recommendations.push("بعض المنتجات غير متوفرة بالكمية المطلوبة");
    recommendations.push("يمكن تقسيم الطلب إلى شحنات متعددة");
  }

  return {
    available: allAvailable,
    availableItems,
    missingItems,
    recommendations,
  };
}

/**
 * Request inventory replenishment with Mycelium
 */
export async function requestReplenishment(
  productId: number,
  quantity: number,
  urgency: "low" | "medium" | "high" | "urgent"
): Promise<{
  requestId: string;
  approved: boolean;
  estimatedDelivery: string;
  supplier: string;
}> {
  const dashboard = getBioDashboard();
  dashboard.trackModuleActivity("mycelium");

  const requestId = `REP-${Date.now()}-${productId}`;

  // Simulate replenishment request
  const estimatedDays = urgency === "urgent" ? 1 : urgency === "high" ? 2 : urgency === "medium" ? 5 : 10;
  const estimatedDelivery = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000).toLocaleDateString("ar-EG");

  // Notify Corvid for learning
  await sendBioMessage(
    "mycelium",
    ["corvid"],
    "event",
    {
      eventType: "replenishment.requested",
      productId,
      quantity,
      urgency,
      estimatedDays,
    }
  );

  return {
    requestId,
    approved: true,
    estimatedDelivery,
    supplier: "المورد الرئيسي",
  };
}

/**
 * Make distributed decision using Cephalopod (Distributed Authority)
 */
export async function makeDistributedDecision(
  decisionType: "order_approval" | "pricing_override" | "inventory_transfer" | "supplier_selection",
  context: Record<string, any>,
  requiredApprovers: string[] = []
): Promise<{
  decision: "approved" | "rejected" | "pending";
  approvers: Array<{ name: string; role: string; approved: boolean; timestamp: number }>;
  reasoning: string;
  confidence: number;
}> {
  const dashboard = getBioDashboard();
  dashboard.trackModuleActivity("cephalopod");

  // Simulate distributed decision making
  const approvers = requiredApprovers.map(name => ({
    name,
    role: "Manager",
    approved: Math.random() > 0.2, // 80% approval rate
    timestamp: Date.now(),
  }));

  const approvedCount = approvers.filter(a => a.approved).length;
  const totalApprovers = approvers.length;

  let decision: "approved" | "rejected" | "pending";
  let reasoning: string;

  if (totalApprovers === 0) {
    // Auto-approve if no approvers required
    decision = "approved";
    reasoning = "تمت الموافقة تلقائياً - لا يتطلب موافقة إضافية";
  } else if (approvedCount === totalApprovers) {
    decision = "approved";
    reasoning = `تمت الموافقة من جميع المسؤولين (${approvedCount}/${totalApprovers})`;
  } else if (approvedCount >= Math.ceil(totalApprovers / 2)) {
    decision = "approved";
    reasoning = `تمت الموافقة من الأغلبية (${approvedCount}/${totalApprovers})`;
  } else if (approvedCount === 0) {
    decision = "rejected";
    reasoning = `تم الرفض من جميع المسؤولين`;
  } else {
    decision = "pending";
    reasoning = `في انتظار موافقة المزيد من المسؤولين (${approvedCount}/${totalApprovers})`;
  }

  const confidence = Math.round((approvedCount / Math.max(totalApprovers, 1)) * 100);

  // Notify Corvid for learning
  await sendBioMessage(
    "cephalopod",
    ["corvid"],
    "event",
    {
      eventType: "decision.made",
      decisionType,
      decision,
      approversCount: totalApprovers,
      approvedCount,
      confidence,
    }
  );

  return {
    decision,
    approvers,
    reasoning,
    confidence,
  };
}

/**
 * Delegate authority to module or user
 */
export async function delegateAuthority(
  fromEntity: string,
  toEntity: string,
  authority: "approve_orders" | "modify_prices" | "manage_inventory" | "select_suppliers",
  duration: number // in hours
): Promise<{
  delegationId: string;
  success: boolean;
  expiresAt: number;
  limitations: string[];
}> {
  const dashboard = getBioDashboard();
  dashboard.trackModuleActivity("cephalopod");

  const delegationId = `DEL-${Date.now()}-${authority}`;
  const expiresAt = Date.now() + duration * 60 * 60 * 1000;

  const limitations: string[] = [];

  switch (authority) {
    case "approve_orders":
      limitations.push("الموافقة على طلبات حتى 10,000 جنيه فقط");
      break;
    case "modify_prices":
      limitations.push("تعديل الأسعار بحد أقصى ±15%");
      break;
    case "manage_inventory":
      limitations.push("إدارة المخزون في الموقع المحلي فقط");
      break;
    case "supplier_selection":
      limitations.push("اختيار الموردين المعتمدين فقط");
      break;
  }

  // Notify Corvid for learning
  await sendBioMessage(
    "cephalopod",
    ["corvid"],
    "event",
    {
      eventType: "authority.delegated",
      fromEntity,
      toEntity,
      authority,
      duration,
    }
  );

  return {
    delegationId,
    success: true,
    expiresAt,
    limitations,
  };
}

/**
 * Get resource distribution insights
 */
export async function getResourceInsights(): Promise<{
  totalResources: number;
  distributedResources: number;
  utilizationRate: number;
  bottlenecks: string[];
  recommendations: string[];
}> {
  const dashboard = getBioDashboard();
  const data = dashboard.getDashboardData();

  // Simulate resource insights
  const totalResources = 1000;
  const distributedResources = 750;
  const utilizationRate = Math.round((distributedResources / totalResources) * 100);

  const bottlenecks: string[] = [];
  const recommendations: string[] = [];

  if (utilizationRate > 90) {
    bottlenecks.push("استخدام مرتفع للموارد - قد يحدث نقص");
    recommendations.push("طلب المزيد من المخزون");
  } else if (utilizationRate < 50) {
    bottlenecks.push("استخدام منخفض للموارد - تكلفة تخزين عالية");
    recommendations.push("تقليل المخزون أو زيادة المبيعات");
  }

  if (data.systemHealth.overall < 70) {
    recommendations.push("تحسين صحة النظام لتحسين توزيع الموارد");
  }

  return {
    totalResources,
    distributedResources,
    utilizationRate,
    bottlenecks,
    recommendations,
  };
}
