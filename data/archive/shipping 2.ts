import { getDb } from "../db";
import { 
  shippingCompanies, 
  shippingZones, 
  shipments, 
  shipmentReturns 
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// ============================================
// SHIPPING COMPANIES
// ============================================

export async function getAllShippingCompanies() {
  const db = await getDb();
  return await db.select().from(shippingCompanies).where(eq(shippingCompanies.active, 1));
}

export async function getShippingCompanyById(id: number) {
  const db = await getDb();
  const [company] = await db.select().from(shippingCompanies).where(eq(shippingCompanies.id, id));
  return company;
}

export async function createShippingCompany(data: {
  name: string;
  nameAr?: string;
  code: string;
  zonesConfig: any;
  codFeeConfig?: any;
  insuranceFeeConfig?: any;
  returnFeePercentage?: string;
  exchangeFeePercentage?: string;
  bankTransfersPerWeek?: number;
  notes?: string;
}) {
  const db = await getDb();
  const [result] = await db.insert(shippingCompanies).values(data);
  return result;
}

// ============================================
// SHIPPING ZONES
// ============================================

export async function getZonesByCompany(companyId: number) {
  return await db
    .select()
    .from(shippingZones)
    .where(and(
      eq(shippingZones.companyId, companyId),
      eq(shippingZones.active, 1)
    ));
}

export async function createShippingZone(data: {
  companyId: number;
  zoneName: string;
  zoneNumber: number;
  basePriceUpTo3Kg: string;
  additionalKgPrice: string;
  areas: any;
}) {
  const [result] = await db.insert(shippingZones).values(data);
  return result;
}

export async function findZoneByArea(companyId: number, area: string) {
  const zones = await getZonesByCompany(companyId);
  
  for (const zone of zones) {
    const areas = zone.areas as string[];
    if (areas.some(a => a.toLowerCase().includes(area.toLowerCase()))) {
      return zone;
    }
  }
  
  return null;
}

// ============================================
// SHIPMENTS
// ============================================

export async function createShipment(data: {
  orderId: number;
  companyId: number;
  trackingNumber?: string;
  zoneId: number;
  weight: string;
  shippingCost: string;
  codFee?: string;
  insuranceFee?: string;
  totalCost: string;
  createdBy: number;
  notes?: string;
}) {
  const [result] = await db.insert(shipments).values({
    ...data,
    status: 'pending'
  });
  return result;
}

export async function getShipmentById(id: number) {
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
  return shipment;
}

export async function getShipmentsByOrder(orderId: number) {
  return await db
    .select()
    .from(shipments)
    .where(eq(shipments.orderId, orderId))
    .orderBy(desc(shipments.createdAt));
}

export async function updateShipmentStatus(
  id: number, 
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'lost' | 'cancelled',
  updates?: {
    shippedAt?: string;
    deliveredAt?: string;
    returnedAt?: string;
    returnReason?: string;
  }
) {
  await db.update(shipments)
    .set({ status, ...updates })
    .where(eq(shipments.id, id));
}

// ============================================
// SHIPMENT RETURNS
// ============================================

export async function createShipmentReturn(data: {
  shipmentId: number;
  returnType: 'full_return' | 'exchange' | 'delivery_failed';
  returnReason?: string;
  returnCost: string;
  notes?: string;
}) {
  const [result] = await db.insert(shipmentReturns).values({
    ...data,
    status: 'pending'
  });
  
  // Update shipment status
  await updateShipmentStatus(data.shipmentId, 'returned', {
    returnedAt: new Date().toISOString(),
    returnReason: data.returnReason
  });
  
  return result;
}

export async function getReturnsByShipment(shipmentId: number) {
  return await db
    .select()
    .from(shipmentReturns)
    .where(eq(shipmentReturns.shipmentId, shipmentId));
}

export async function processReturn(
  id: number,
  processedBy: number
) {
  await db.update(shipmentReturns)
    .set({
      status: 'processed',
      processedBy,
      processedAt: new Date().toISOString()
    })
    .where(eq(shipmentReturns.id, id));
}

// ============================================
// SHIPPING COST CALCULATOR
// ============================================

export async function calculateShippingCost(
  companyId: number,
  area: string,
  weight: number,
  orderValue: number
): Promise<{
  zone: any;
  shippingCost: number;
  codFee: number;
  insuranceFee: number;
  totalCost: number;
}> {
  // Find zone
  const zone = await findZoneByArea(companyId, area);
  if (!zone) {
    throw new Error(`No shipping zone found for area: ${area}`);
  }
  
  // Calculate base shipping cost
  let shippingCost = parseFloat(zone.basePriceUpTo3Kg);
  if (weight > 3) {
    const additionalKg = Math.ceil(weight - 3);
    shippingCost += additionalKg * parseFloat(zone.additionalKgPrice);
  }
  
  // Get company config
  const company = await getShippingCompanyById(companyId);
  if (!company) {
    throw new Error(`Shipping company not found: ${companyId}`);
  }
  
  // Calculate COD fee
  let codFee = 0;
  if (company.codFeeConfig) {
    const codConfig = company.codFeeConfig as { threshold: number; percentage: number };
    if (orderValue > codConfig.threshold) {
      codFee = orderValue * (codConfig.percentage / 100);
    }
  }
  
  // Calculate insurance fee
  let insuranceFee = 0;
  if (company.insuranceFeeConfig) {
    const insuranceConfig = company.insuranceFeeConfig as { percentage: number };
    insuranceFee = orderValue * (insuranceConfig.percentage / 100);
  }
  
  const totalCost = shippingCost + codFee + insuranceFee;
  
  return {
    zone,
    shippingCost,
    codFee,
    insuranceFee,
    totalCost
  };
}
