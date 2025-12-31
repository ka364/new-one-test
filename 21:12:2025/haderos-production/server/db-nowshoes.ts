import { requireDb } from './db.js';
import { products, productSizeCharts, inventory, orders, orderItems, shipments, returns as returnsTable } from '../drizzle/schema-nowshoes.js';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

// Helper to ensure db connection
async function getConnection() {
  const db = await requireDb();
  if (!db) throw new Error('Database connection failed');
  return db;
}

// ============================================
// PRODUCTS
// ============================================

export async function getAllProducts() {
  const db = await getConnection();
  return db.select().from(products).orderBy(desc(products.id));
}

export async function getProductById(id: number) {
  const db = await getConnection();
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] || null;
}

export async function getProductByCode(code: string) {
  const db = await getConnection();
  const result = await db.select().from(products).where(eq(products.modelCode, code)).limit(1);
  return result[0] || null;
}

// ============================================
// PRODUCT SIZE CHARTS
// ============================================

export async function getProductSizeChart(productId: number) {
  const db = await getConnection();
  return db.select().from(productSizeCharts)
    .where(eq(productSizeCharts.productId, productId))
    .orderBy(productSizeCharts.size);
}

export async function addSizeChartEntry(data: {
  productId: number;
  size: string;
  lengthCm?: number;
  widthCm?: number;
  notes?: string;
}) {
  const db = await getConnection();
  const result = await db.insert(productSizeCharts).values({
    productId: data.productId,
    size: data.size,
    lengthCm: data.lengthCm?.toString(),
    widthCm: data.widthCm?.toString(),
    notes: data.notes,
  });
  return result;
}

export async function updateSizeChartEntry(id: number, data: {
  lengthCm?: number;
  widthCm?: number;
  notes?: string;
}) {
  const db = await getConnection();
  const result = await db.update(productSizeCharts)
    .set({
      lengthCm: data.lengthCm?.toString(),
      widthCm: data.widthCm?.toString(),
      notes: data.notes,
      updatedAt: new Date(),
    })
    .where(eq(productSizeCharts.id, id));
  return result;
}

export async function deleteSizeChartEntry(id: number) {
  const db = await getConnection();
  return db.delete(productSizeCharts).where(eq(productSizeCharts.id, id));
}

// ============================================
// INVENTORY
// ============================================

export async function getInventory() {
  const db = await getConnection();
  return db.select({
    id: inventory.id,
    productId: inventory.productId,
    productCode: products.modelCode,
    size: inventory.size,
    color: inventory.color,
    quantity: inventory.quantity,
    minStockLevel: inventory.minStockLevel,
    location: inventory.location,
    lastRestocked: inventory.lastRestocked,
    supplierPrice: products.supplierPrice,
    sellingPrice: products.sellingPrice,
  })
  .from(inventory)
  .leftJoin(products, eq(inventory.productId, products.id))
  .orderBy(desc(inventory.updatedAt));
}

export async function getInventoryByProduct(productId: number) {
  const db = await getConnection();
  return db.select().from(inventory)
    .where(eq(inventory.productId, productId))
    .orderBy(inventory.size, inventory.color);
}

export async function getLowStockItems() {
  const db = await getConnection();
  return db.select({
    id: inventory.id,
    productId: inventory.productId,
    productCode: products.modelCode,
    size: inventory.size,
    color: inventory.color,
    quantity: inventory.quantity,
    minStockLevel: inventory.minStockLevel,
  })
  .from(inventory)
  .leftJoin(products, eq(inventory.productId, products.id))
  .where(sql`${inventory.quantity} <= ${inventory.minStockLevel}`)
  .orderBy(inventory.quantity);
}

export async function updateInventoryQuantity(id: number, quantity: number) {
  const db = await getConnection();
  return db.update(inventory)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(inventory.id, id));
}

export async function addInventoryItem(data: {
  productId: number;
  size?: string;
  color?: string;
  quantity: number;
  minStockLevel?: number;
  location?: string;
}) {
  const db = await getConnection();
  return db.insert(inventory).values({
    productId: data.productId,
    size: data.size,
    color: data.color,
    quantity: data.quantity,
    minStockLevel: data.minStockLevel || 10,
    location: data.location,
    lastRestocked: new Date(),
  });
}

// ============================================
// ORDERS
// ============================================

export async function getAllOrders() {
  const db = await getConnection();
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getConnection();
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0] || null;
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getConnection();
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result[0] || null;
}

export async function getOrdersByStatus(status: string) {
  const db = await getConnection();
  return db.select().from(orders)
    .where(eq(orders.status, status))
    .orderBy(desc(orders.createdAt));
}

export async function getOrdersByDateRange(startDate: Date, endDate: Date) {
  const db = await getConnection();
  return db.select().from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate)
    ))
    .orderBy(desc(orders.createdAt));
}

export async function createOrder(data: {
  orderNumber: string;
  customerName: string;
  phone1: string;
  phone2?: string;
  city: string;
  address: string;
  source: string;
  brand: string;
  totalAmount: number;
  shippingCost?: number;
  notes?: string;
}) {
  const db = await getConnection();
  return db.insert(orders).values({
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    phone1: data.phone1,
    phone2: data.phone2,
    city: data.city,
    address: data.address,
    source: data.source,
    brand: data.brand,
    status: 'pending',
    totalAmount: data.totalAmount.toString(),
    shippingCost: data.shippingCost?.toString() || '0',
    notes: data.notes,
  });
}

export async function updateOrderStatus(id: number, status: string, notes?: string) {
  const db = await getConnection();
  return db.update(orders)
    .set({ status, notes, updatedAt: new Date() })
    .where(eq(orders.id, id));
}

// ============================================
// ORDER ITEMS
// ============================================

export async function getOrderItems(orderId: number) {
  const db = await getConnection();
  return db.select({
    id: orderItems.id,
    orderId: orderItems.orderId,
    productId: orderItems.productId,
    productCode: products.modelCode,
    size: orderItems.size,
    color: orderItems.color,
    quantity: orderItems.quantity,
    unitPrice: orderItems.unitPrice,
    subtotal: orderItems.subtotal,
  })
  .from(orderItems)
  .leftJoin(products, eq(orderItems.productId, products.id))
  .where(eq(orderItems.orderId, orderId));
}

export async function addOrderItem(data: {
  orderId: number;
  productId: number;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
}) {
  const db = await getConnection();
  const subtotal = data.quantity * data.unitPrice;
  return db.insert(orderItems).values({
    orderId: data.orderId,
    productId: data.productId,
    size: data.size,
    color: data.color,
    quantity: data.quantity,
    unitPrice: data.unitPrice.toString(),
    subtotal: subtotal.toString(),
  });
}

// ============================================
// SHIPMENTS
// ============================================

export async function getShipmentsByOrder(orderId: number) {
  const db = await getConnection();
  return db.select().from(shipments)
    .where(eq(shipments.orderId, orderId))
    .orderBy(desc(shipments.createdAt));
}

export async function getShipmentsByCompany(company: string) {
  const db = await getConnection();
  return db.select().from(shipments)
    .where(eq(shipments.shippingCompany, company))
    .orderBy(desc(shipments.shippingDate));
}

export async function getShipmentsByDateRange(startDate: Date, endDate: Date) {
  const db = await getConnection();
  return db.select().from(shipments)
    .where(and(
      gte(shipments.shippingDate, startDate),
      lte(shipments.shippingDate, endDate)
    ))
    .orderBy(desc(shipments.shippingDate));
}

export async function createShipment(data: {
  orderId: number;
  shippingCompany: string;
  waybillNumber?: string;
  shippingDate?: Date;
  shippingCost?: number;
  notes?: string;
}) {
  const db = await getConnection();
  return db.insert(shipments).values({
    orderId: data.orderId,
    shippingCompany: data.shippingCompany,
    waybillNumber: data.waybillNumber,
    shippingDate: data.shippingDate,
    status: 'pending',
    shippingCost: data.shippingCost?.toString(),
    notes: data.notes,
  });
}

export async function updateShipmentStatus(id: number, status: string, deliveryDate?: Date) {
  const db = await getConnection();
  return db.update(shipments)
    .set({ status, deliveryDate, updatedAt: new Date() })
    .where(eq(shipments.id, id));
}

// ============================================
// RETURNS
// ============================================

export async function getReturnsByShipment(shipmentId: number) {
  const db = await getConnection();
  return db.select().from(returnsTable)
    .where(eq(returnsTable.shipmentId, shipmentId))
    .orderBy(desc(returnsTable.createdAt));
}

export async function getReturnsByDateRange(startDate: Date, endDate: Date) {
  const db = await getConnection();
  return db.select().from(returnsTable)
    .where(and(
      gte(returnsTable.returnDate, startDate),
      lte(returnsTable.returnDate, endDate)
    ))
    .orderBy(desc(returnsTable.returnDate));
}

export async function createReturn(data: {
  shipmentId: number;
  orderId: number;
  returnReason: string;
  returnDate?: Date;
  refundAmount?: number;
  notes?: string;
}) {
  const db = await getConnection();
  return db.insert(returnsTable).values({
    shipmentId: data.shipmentId,
    orderId: data.orderId,
    returnReason: data.returnReason,
    returnDate: data.returnDate,
    refundAmount: data.refundAmount?.toString(),
    status: 'pending',
    notes: data.notes,
  });
}

export async function updateReturnStatus(id: number, status: string) {
  const db = await getConnection();
  return db.update(returnsTable)
    .set({ status })
    .where(eq(returnsTable.id, id));
}

// ============================================
// ANALYTICS
// ============================================

export async function getDailySalesStats(date: Date) {
  const db = await getConnection();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db.select({
    totalOrders: sql<number>`COUNT(*)`,
    totalRevenue: sql<number>`SUM(CAST(${orders.totalAmount} AS DECIMAL(10,2)))`,
    avgOrderValue: sql<number>`AVG(CAST(${orders.totalAmount} AS DECIMAL(10,2)))`,
  })
  .from(orders)
  .where(and(
    gte(orders.createdAt, startOfDay),
    lte(orders.createdAt, endOfDay)
  ));

  return result[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
}

export async function getTopSellingProducts(limit: number = 10) {
  const db = await getConnection();
  return db.select({
    productId: orderItems.productId,
    productCode: products.modelCode,
    totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
    totalRevenue: sql<number>`SUM(CAST(${orderItems.subtotal} AS DECIMAL(10,2)))`,
  })
  .from(orderItems)
  .leftJoin(products, eq(orderItems.productId, products.id))
  .groupBy(orderItems.productId, products.modelCode)
  .orderBy(desc(sql`SUM(${orderItems.quantity})`))
  .limit(limit);
}
