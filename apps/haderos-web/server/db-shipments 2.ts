import { requireDb } from './db';
import { sql } from 'drizzle-orm';

export interface Shipment {
  id?: number;
  company: string;
  trackingNumber?: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  quantity?: number;
  amount?: number;
  shipmentDate?: string;
  status?: string;
  fileSource?: string;
  createdAt?: Date;
}

export interface ShipmentFilters {
  company?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all shipments with filters
 */
export async function getShipments(filters: ShipmentFilters = {}) {
  const db = await requireDb();
  if (!db) return [];

  let query = sql`SELECT * FROM external_shipments WHERE 1=1`;

  if (filters.company) {
    query = sql`${query} AND shipping_company = ${filters.company}`;
  }

  if (filters.startDate) {
    query = sql`${query} AND shipment_date >= ${filters.startDate}`;
  }

  if (filters.endDate) {
    query = sql`${query} AND shipment_date <= ${filters.endDate}`;
  }

  if (filters.status) {
    query = sql`${query} AND status = ${filters.status}`;
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = sql`${query} AND (tracking_number LIKE ${searchTerm} OR order_number LIKE ${searchTerm} OR customer_name LIKE ${searchTerm} OR customer_phone LIKE ${searchTerm})`;
  }

  query = sql`${query} ORDER BY shipment_date DESC, id DESC`;

  if (filters.limit) {
    query = sql`${query} LIMIT ${filters.limit}`;
  }

  if (filters.offset) {
    query = sql`${query} OFFSET ${filters.offset}`;
  }

  const result = await db.execute(query);
  return result as unknown as Shipment[];
}

/**
 * Get shipment statistics
 */
export async function getShipmentStats() {
  const db = await requireDb();
  if (!db) return null;

  const totalResult: any = await db.execute(sql`SELECT COUNT(*) as total FROM external_shipments`);
  const total = totalResult[0]?.total || 0;

  const companyStats: any = await db.execute(
    sql`SELECT shipping_company as company, COUNT(*) as count FROM external_shipments GROUP BY shipping_company`
  );

  const dateStats: any = await db.execute(
    sql`SELECT shipment_date, COUNT(*) as count FROM external_shipments GROUP BY shipment_date ORDER BY shipment_date DESC LIMIT 30`
  );

  const statusStats: any = await db.execute(
    sql`SELECT status, COUNT(*) as count FROM external_shipments GROUP BY status`
  );

  return {
    total,
    byCompany: companyStats,
    byDate: dateStats,
    byStatus: statusStats,
  };
}

/**
 * Bulk insert shipments
 */
export async function bulkInsertShipments(shipments: Shipment[]) {
  const db = await requireDb();
  if (!db) throw new Error('Database not available');

  let inserted = 0;
  for (const shipment of shipments) {
    try {
      await db.execute(sql`
        INSERT INTO external_shipments 
        (shipping_company, tracking_number, order_number, customer_name, customer_phone, 
         quantity, amount, shipment_date, status, file_source)
        VALUES (
          ${shipment.company},
          ${shipment.trackingNumber || null},
          ${shipment.orderNumber || null},
          ${shipment.customerName || null},
          ${shipment.customerPhone || null},
          ${shipment.quantity || 0},
          ${shipment.amount || 0},
          ${shipment.shipmentDate || null},
          ${shipment.status || 'pending'},
          ${shipment.fileSource || null}
        )
      `);
      inserted++;
    } catch (error) {
      console.error('Error inserting shipment:', error);
    }
  }

  return inserted;
}

/**
 * Get shipment count
 */
export async function getShipmentCount(filters: ShipmentFilters = {}) {
  const db = await requireDb();
  if (!db) return 0;

  let query = sql`SELECT COUNT(*) as count FROM external_shipments WHERE 1=1`;

  if (filters.company) {
    query = sql`${query} AND shipping_company = ${filters.company}`;
  }

  if (filters.startDate) {
    query = sql`${query} AND shipment_date >= ${filters.startDate}`;
  }

  if (filters.endDate) {
    query = sql`${query} AND shipment_date <= ${filters.endDate}`;
  }

  if (filters.status) {
    query = sql`${query} AND status = ${filters.status}`;
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = sql`${query} AND (tracking_number LIKE ${searchTerm} OR order_number LIKE ${searchTerm} OR customer_name LIKE ${searchTerm} OR customer_phone LIKE ${searchTerm})`;
  }

  const result: any = await db.execute(query);
  return result[0]?.count || 0;
}
