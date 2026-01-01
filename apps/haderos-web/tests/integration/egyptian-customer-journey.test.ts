/**
 * Integration Test: Egyptian Customer Journey
 * اختبار تكامل: رحلة العميل المصري الكاملة
 * 
 * يختبر رحلة عميل مصرية كاملة:
 * 1. تصفح المنتجات
 * 2. إنشاء طلب
 * 3. معالجة الدفع (COD)
 * 4. تتبع الطلب
 * 5. تحديث الحالة
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../../server/routers';
import { TRPCError } from '@trpc/server';

// Mock context
const createMockContext = (user?: { id: number; role?: string }) => ({
  user: user || { id: 1, role: 'admin' },
  req: {
    ip: '127.0.0.1',
    headers: {},
  } as any,
  res: {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as any,
});

describe('Integration: Egyptian Customer Journey', () => {
  const caller = appRouter.createCaller(createMockContext());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full Egyptian customer journey', async () => {
    // Step 1: Browse products
    const products = await caller.products.getAllProducts.query();
    expect(products).toBeDefined();
    expect(Array.isArray(products)).toBe(true);

    // Step 2: Get product details
    if (products.length > 0) {
      const product = await caller.products.getProductById.query({
        productId: products[0].id,
      });
      expect(product).toBeDefined();
      expect(product.id).toBe(products[0].id);
    }

    // Step 3: Get dynamic price
    if (products.length > 0) {
      const priceResult = await caller.products.getDynamicPrice.query({
        productId: products[0].id,
        context: {
          customerHistory: 0,
          timeOfDay: 14, // Afternoon
        },
      });
      expect(priceResult.basePrice).toBeDefined();
      expect(priceResult.adjustedPrice).toBeDefined();
    }

    // Step 4: Create order (Egyptian customer)
    const orderResult = await caller.orders.createOrder.mutate({
      customerName: 'أحمد محمد علي',
      customerPhone: '01012345678', // Egyptian phone format
      customerEmail: 'ahmed.mohamed@example.com',
      items: [
        {
          productName: 'حذاء رياضي',
          quantity: 2,
          price: 500,
          size: '42',
          color: 'أسود',
        },
        {
          productName: 'جورب رياضي',
          quantity: 3,
          price: 50,
          size: '42',
          color: 'أبيض',
        },
      ],
      totalAmount: 1150, // (2 * 500) + (3 * 50)
      shippingAddress: 'القاهرة، مصر - حي مصر الجديدة - شارع النصر - عمارة 10 - شقة 5',
      notes: 'يرجى التوصيل في المساء',
    });

    // Verify order creation
    expect(orderResult.success).toBe(true);
    expect(orderResult.orderId).toBeDefined();
    expect(orderResult.orderNumber).toMatch(/^ORD-/);
    expect(orderResult.orderIds.length).toBe(2); // 2 items = 2 orders

    // Verify Bio-Modules validation
    expect(orderResult.validation).toBeDefined();
    expect(orderResult.validation.isValid).toBe(true);

    // Step 5: Create payment (COD - common in Egypt)
    const paymentResult = await caller.payment.createPayment.mutate({
      orderId: orderResult.orderId,
      orderNumber: orderResult.orderNumber,
      amount: 1150,
      providerCode: 'cod',
      customer: {
        name: 'أحمد محمد علي',
        phone: '01012345678',
        email: 'ahmed.mohamed@example.com',
      },
    });

    // Verify payment creation
    expect(paymentResult.success).toBe(true);
    expect(paymentResult.transactionId).toBeDefined();
    expect(paymentResult.transactionNumber).toBeDefined();
    expect(paymentResult.status).toBe('pending');

    // Step 6: Get payment status
    const paymentStatus = await caller.payment.getPaymentStatus.query({
      transactionId: paymentResult.transactionId,
    });

    expect(paymentStatus.status).toBe('pending');
    expect(paymentStatus.amount).toBe(1150);
    expect(paymentStatus.providerCode).toBe('cod');

    // Step 7: Track order
    const orderDetails = await caller.orders.getOrderById.query({
      orderId: orderResult.orderId,
    });

    expect(orderDetails.id).toBe(orderResult.orderId);
    expect(orderDetails.customerName).toBe('أحمد محمد علي');
    expect(orderDetails.customerPhone).toBe('01012345678');
    expect(orderDetails.status).toBe('pending');
    expect(orderDetails.paymentStatus).toBe('pending');

    // Step 8: Update order status (simulating processing)
    const updateStatusResult = await caller.orders.updateOrderStatus.mutate({
      orderId: orderResult.orderId,
      status: 'confirmed',
    });

    expect(updateStatusResult.success).toBe(true);

    // Step 9: Verify status update
    const updatedOrder = await caller.orders.getOrderById.query({
      orderId: orderResult.orderId,
    });

    expect(updatedOrder.status).toBe('confirmed');

    // Step 10: Update payment status (simulating COD collection)
    const updatePaymentResult = await caller.orders.updatePaymentStatus.mutate({
      orderId: orderResult.orderId,
      paymentStatus: 'paid',
    });

    expect(updatePaymentResult.success).toBe(true);

    // Step 11: Verify final state
    const finalOrder = await caller.orders.getOrderById.query({
      orderId: orderResult.orderId,
    });

    expect(finalOrder.status).toBe('confirmed');
    expect(finalOrder.paymentStatus).toBe('paid');
  }, 60000); // 60 second timeout for full journey

  it('should handle multiple orders from same customer', async () => {
    const customerPhone = '01011111111';

    // Create first order
    const order1 = await caller.orders.createOrder.mutate({
      customerName: 'عميل متكرر',
      customerPhone,
      items: [{ productName: 'Product 1', quantity: 1, price: 100 }],
      totalAmount: 100,
      shippingAddress: 'Cairo',
    });

    expect(order1.success).toBe(true);

    // Create second order (same customer)
    const order2 = await caller.orders.createOrder.mutate({
      customerName: 'عميل متكرر',
      customerPhone,
      items: [{ productName: 'Product 2', quantity: 1, price: 200 }],
      totalAmount: 200,
      shippingAddress: 'Cairo',
    });

    expect(order2.success).toBe(true);
    expect(order2.orderId).not.toBe(order1.orderId);
  });

  it('should handle order cancellation flow', async () => {
    // Create order
    const orderResult = await caller.orders.createOrder.mutate({
      customerName: 'Test User',
      customerPhone: '01012345678',
      items: [{ productName: 'Product', quantity: 1, price: 100 }],
      totalAmount: 100,
      shippingAddress: 'Cairo',
    });

    // Cancel order
    const cancelResult = await caller.orders.updateOrderStatus.mutate({
      orderId: orderResult.orderId,
      status: 'cancelled',
    });

    expect(cancelResult.success).toBe(true);

    // Verify cancellation
    const cancelledOrder = await caller.orders.getOrderById.query({
      orderId: orderResult.orderId,
    });

    expect(cancelledOrder.status).toBe('cancelled');
  });
});

