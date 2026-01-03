/**
 * Order Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Order, CreateOrderInput, UpdateOrderStatusInput, OrderStatus } from '../models/order.model';

export const orderRoutes = Router();

// In-memory store
const orders = new Map<string, Order>();

// Generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const prefix = 'HDR';
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${year}${month}-${random}`;
};

// POST /api/orders - Create order
orderRoutes.post('/', async (req, res) => {
  try {
    const input = CreateOrderInput.parse(req.body);

    // TODO: Validate products and get prices from Product Service
    // TODO: Reserve stock via Product Service

    const order: Order = {
      id: nanoid(),
      orderNumber: generateOrderNumber(),
      customerId: input.customerId,
      customerName: 'Customer Name', // TODO: Get from User Service
      customerPhone: '+201234567890',
      items: input.items.map(item => ({
        productId: item.productId,
        productName: 'Product Name', // TODO: Get from Product Service
        quantity: item.quantity,
        unitPrice: 100, // TODO: Get from Product Service
        discount: 0,
        total: item.quantity * 100
      })),
      subtotal: input.items.reduce((sum, item) => sum + item.quantity * 100, 0),
      discount: 0,
      shippingFee: input.deliveryMethod === 'home_delivery' ? 30 : 0,
      tax: 0,
      total: input.items.reduce((sum, item) => sum + item.quantity * 100, 0) + (input.deliveryMethod === 'home_delivery' ? 30 : 0),
      currency: 'EGP',
      deliveryMethod: input.deliveryMethod,
      shippingAddress: input.shippingAddress,
      lockerId: input.lockerId,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      statusHistory: [{ status: 'pending' as const, timestamp: new Date() }],
      customerNote: input.customerNote,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    orders.set(order.id, order);

    // Emit event: order.created
    console.log('Event: order.created', { orderId: order.id, orderNumber: order.orderNumber });

    res.status(201).json({ order });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// GET /api/orders - List orders
orderRoutes.get('/', (req, res) => {
  const { customerId, status, page = 1, limit = 20 } = req.query;

  let orderList = Array.from(orders.values());

  if (customerId) {
    orderList = orderList.filter(o => o.customerId === customerId);
  }
  if (status) {
    orderList = orderList.filter(o => o.status === status);
  }

  // Sort by date (newest first)
  orderList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const start = (Number(page) - 1) * Number(limit);
  const paginated = orderList.slice(start, start + Number(limit));

  res.json({
    orders: paginated,
    total: orderList.length,
    page: Number(page),
    totalPages: Math.ceil(orderList.length / Number(limit))
  });
});

// GET /api/orders/:id - Get order
orderRoutes.get('/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found', code: 'NOT_FOUND' });
  }
  res.json({ order });
});

// PUT /api/orders/:id/status - Update order status
orderRoutes.put('/:id/status', (req, res) => {
  try {
    const order = orders.get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found', code: 'NOT_FOUND' });
    }

    const input = UpdateOrderStatusInput.parse(req.body);

    // Update status
    order.status = input.status;
    order.statusHistory.push({
      status: input.status,
      timestamp: new Date(),
      note: input.note
    });
    order.updatedAt = new Date();

    // Set specific timestamps
    if (input.status === 'confirmed') order.confirmedAt = new Date();
    if (input.status === 'shipped') order.shippedAt = new Date();
    if (input.status === 'delivered') order.deliveredAt = new Date();

    orders.set(order.id, order);

    // Emit event
    console.log(`Event: order.${input.status}`, { orderId: order.id });

    res.json({ order });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/orders/:id/return - Request return
orderRoutes.post('/:id/return', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found', code: 'NOT_FOUND' });
  }

  if (order.status !== 'delivered') {
    return res.status(400).json({
      error: 'Only delivered orders can be returned',
      code: 'INVALID_STATUS'
    });
  }

  const { reason, items } = req.body;

  // TODO: Create return request
  console.log('Event: order.return_requested', { orderId: order.id, reason, items });

  res.json({
    success: true,
    message: 'Return request submitted',
    returnId: nanoid()
  });
});

// GET /api/orders/:id/invoice - Get invoice
orderRoutes.get('/:id/invoice', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found', code: 'NOT_FOUND' });
  }

  // Generate invoice data
  const invoice = {
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    date: order.createdAt,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail
    },
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shippingFee,
    tax: order.tax,
    total: order.total,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus
  };

  res.json({ invoice });
});
