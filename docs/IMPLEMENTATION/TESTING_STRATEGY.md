# 🧪 استراتيجية الاختبار الشاملة لـ HADEROS

> **الهدف**: ضمان عمل جميع أجزاء النظام معاً قبل الإطلاق

---

## 📊 هرم الاختبار

```
                        ┌───────────────────┐
                        │    E2E Tests      │  10%
                        │  (User Journeys)  │
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │  Integration      │  30%
                        │     Tests         │
                        └─────────┬─────────┘
                                  │
              ┌───────────────────▼───────────────────┐
              │            Unit Tests                 │  60%
              │  (Services, Utils, Bio-Modules)       │
              └───────────────────────────────────────┘
```

---

## 1️⃣ اختبارات الوحدة (Unit Tests)

### الملفات الحالية للاختبار

```yaml
existing_test_files:
  - apps/haderos-web/server/auth.logout.test.ts
  - apps/haderos-web/server/kaia.test.ts
  - apps/haderos-web/server/sendgrid.test.ts
  - apps/haderos-web/server/shopify.test.ts
  - apps/haderos-web/server/shopify-integration.test.ts
  - apps/haderos-web/server/routers/chat.test.ts
  - apps/haderos-web/server/services/adaptiveLearning.test.ts
  - apps/haderos-web/server/services/googleDrive.test.ts
  - apps/haderos-web/server/bio-modules/bio-modules.test.ts
```

### اختبارات مطلوب إضافتها

#### Bio-Modules Tests

```typescript
// tests/unit/bio-modules/arachnid.test.ts
describe('Arachnid Bio-Module - Fraud Detection', () => {
  describe('analyzeTransaction', () => {
    it('should flag high-risk transaction (score > 70)', async () => {
      const transaction = {
        amount: 50000,
        userId: 'new-user',
        deviceFingerprint: 'unknown-device',
        ipAddress: '185.107.x.x', // VPN
        velocity: 10 // 10 transactions in 1 hour
      };

      const result = await arachnid.analyzeTransaction(transaction);

      expect(result.score).toBeGreaterThan(70);
      expect(result.riskLevel).toBe('high');
      expect(result.flags).toContain('velocity_exceeded');
    });

    it('should allow normal transaction (score < 30)', async () => {
      const transaction = {
        amount: 500,
        userId: 'regular-user-123',
        deviceFingerprint: 'known-device',
        ipAddress: '197.52.x.x', // Egypt IP
        velocity: 1
      };

      const result = await arachnid.analyzeTransaction(transaction);

      expect(result.score).toBeLessThan(30);
      expect(result.riskLevel).toBe('low');
    });
  });
});

// tests/unit/bio-modules/chameleon.test.ts
describe('Chameleon Bio-Module - Dynamic Pricing', () => {
  describe('calculateGroupPrice', () => {
    const priceTiers = [
      { min: 1, max: 10, discount: 0 },
      { min: 11, max: 50, discount: 10 },
      { min: 51, max: 100, discount: 20 },
      { min: 101, max: 500, discount: 30 }
    ];

    it('should return base price for tier 1', () => {
      const price = chameleon.calculateGroupPrice({
        basePrice: 100,
        participants: 5,
        tiers: priceTiers
      });

      expect(price).toBe(100);
    });

    it('should apply 10% discount for tier 2', () => {
      const price = chameleon.calculateGroupPrice({
        basePrice: 100,
        participants: 25,
        tiers: priceTiers
      });

      expect(price).toBe(90);
    });

    it('should cap at highest tier discount', () => {
      const price = chameleon.calculateGroupPrice({
        basePrice: 100,
        participants: 1000,
        tiers: priceTiers
      });

      expect(price).toBe(70); // 30% max discount
    });
  });
});

// tests/unit/bio-modules/ant-colony.test.ts
describe('Ant Colony Bio-Module - Route Optimization', () => {
  describe('optimizeRoute', () => {
    it('should find optimal route for 5 delivery points', async () => {
      const startPoint = { lat: 30.0444, lng: 31.2357 }; // Cairo
      const deliveryPoints = [
        { lat: 30.0626, lng: 31.2497, orderId: 'order-1' },
        { lat: 30.0511, lng: 31.2333, orderId: 'order-2' },
        { lat: 30.0589, lng: 31.2200, orderId: 'order-3' },
        { lat: 30.0700, lng: 31.2400, orderId: 'order-4' },
        { lat: 30.0450, lng: 31.2500, orderId: 'order-5' }
      ];

      const result = await antColony.optimizeRoute({
        startPoint,
        deliveryPoints,
        maxIterations: 100,
        antCount: 20
      });

      expect(result.route).toHaveLength(5);
      expect(result.totalDistance).toBeLessThan(20); // km
      expect(result.estimatedTime).toBeLessThan(60); // minutes
    });
  });
});
```

#### KAIA Engine Tests

```typescript
// tests/unit/kaia/ethical-validation.test.ts
describe('KAIA Engine - Ethical Validation', () => {
  describe('validateTransaction', () => {
    it('should reject interest-based transaction', async () => {
      const transaction = {
        type: 'payment',
        details: {
          hasInterest: true,
          interestRate: 5
        }
      };

      const result = await kaia.evaluate(transaction);

      expect(result.approved).toBe(false);
      expect(result.decision).toBe('rejected');
      expect(result.appliedRules).toContainEqual(
        expect.objectContaining({
          ruleName: 'no_interest',
          result: 'fail'
        })
      );
    });

    it('should approve halal product', async () => {
      const product = {
        type: 'product',
        details: {
          category: 'electronics',
          isHalal: true,
          hasAlcohol: false
        }
      };

      const result = await kaia.evaluate(product);

      expect(result.approved).toBe(true);
      expect(result.decision).toBe('approved');
    });

    it('should flag suspicious high-value transaction for review', async () => {
      const transaction = {
        type: 'payment',
        details: {
          amount: 100000,
          userId: 'new-user',
          isFirstTransaction: true
        }
      };

      const result = await kaia.evaluate(transaction);

      expect(result.decision).toBe('review_required');
      expect(result.requiresHumanReview).toBe(true);
    });
  });
});
```

#### Services Tests

```typescript
// tests/unit/services/orders.service.test.ts
describe('Orders Service', () => {
  describe('createOrder', () => {
    it('should create order with valid items', async () => {
      const orderData = {
        customerId: 'customer-123',
        items: [
          { productId: 'product-1', quantity: 2 },
          { productId: 'product-2', quantity: 1 }
        ],
        deliveryType: 'home',
        paymentMethod: 'cod'
      };

      const order = await ordersService.createOrder(orderData);

      expect(order.id).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.items).toHaveLength(2);
    });

    it('should reject order with insufficient stock', async () => {
      const orderData = {
        customerId: 'customer-123',
        items: [
          { productId: 'product-out-of-stock', quantity: 100 }
        ]
      };

      await expect(ordersService.createOrder(orderData))
        .rejects.toThrow('الكمية المطلوبة غير متوفرة');
    });

    it('should validate Egyptian phone number', async () => {
      const orderData = {
        customerId: 'customer-123',
        customerPhone: '01234567', // invalid - too short
        items: [{ productId: 'product-1', quantity: 1 }]
      };

      await expect(ordersService.createOrder(orderData))
        .rejects.toThrow('رقم هاتف مصري غير صالح');
    });
  });

  describe('calculateDeliveryFee', () => {
    it('should calculate fee for Cairo', () => {
      const fee = ordersService.calculateDeliveryFee({
        governorate: 'cairo',
        deliveryType: 'standard'
      });

      expect(fee).toBe(30);
    });

    it('should apply locker discount', () => {
      const fee = ordersService.calculateDeliveryFee({
        governorate: 'cairo',
        deliveryType: 'locker'
      });

      expect(fee).toBe(15); // 50% discount
    });
  });
});
```

---

## 2️⃣ اختبارات التكامل (Integration Tests)

### Group Buying Integration

```typescript
// tests/integration/group-buying-flow.test.ts
describe('Group Buying Integration Flow', () => {
  let dealId: string;
  let participants: string[] = [];

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();

    // Create test product
    const product = await createTestProduct({
      price: 1000,
      stock: 100
    });

    // Create group deal
    const deal = await groupBuyingService.createDeal({
      productId: product.id,
      minParticipants: 10,
      maxParticipants: 50,
      tiers: [
        { min: 10, max: 20, discount: 10 },
        { min: 21, max: 35, discount: 20 },
        { min: 36, max: 50, discount: 30 }
      ],
      duration: 48 * 60 * 60 * 1000 // 48 hours
    });

    dealId = deal.id;
  });

  it('should allow user to join deal', async () => {
    const user = await createTestUser();

    const result = await groupBuyingService.joinDeal({
      dealId,
      userId: user.id,
      quantity: 1
    });

    expect(result.success).toBe(true);
    expect(result.participantCount).toBe(1);
    participants.push(user.id);
  });

  it('should update price when tier threshold reached', async () => {
    // Add 9 more participants to reach tier 1
    for (let i = 0; i < 9; i++) {
      const user = await createTestUser();
      await groupBuyingService.joinDeal({
        dealId,
        userId: user.id,
        quantity: 1
      });
      participants.push(user.id);
    }

    const deal = await groupBuyingService.getDeal(dealId);

    expect(deal.currentParticipants).toBe(10);
    expect(deal.currentPrice).toBe(900); // 10% discount
    expect(deal.currentTier).toBe(1);
  });

  it('should integrate with Chameleon for dynamic pricing', async () => {
    // Add 11 more participants to reach tier 2
    for (let i = 0; i < 11; i++) {
      const user = await createTestUser();
      await groupBuyingService.joinDeal({
        dealId,
        userId: user.id,
        quantity: 1
      });
    }

    const deal = await groupBuyingService.getDeal(dealId);

    expect(deal.currentParticipants).toBe(21);
    expect(deal.currentPrice).toBe(800); // 20% discount
  });

  it('should integrate with Arachnid to block suspicious participation', async () => {
    const suspiciousUser = await createTestUser({
      metadata: { fraudScore: 85 }
    });

    const result = await groupBuyingService.joinDeal({
      dealId,
      userId: suspiciousUser.id,
      quantity: 10 // suspicious high quantity
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('suspicious_activity');
  });

  it('should create orders when deal closes successfully', async () => {
    // Force close the deal
    await groupBuyingService.closeDeal(dealId);

    const deal = await groupBuyingService.getDeal(dealId);
    expect(deal.status).toBe('closed');

    // Check orders created for all participants
    for (const userId of participants.slice(0, 10)) {
      const orders = await ordersService.getUserOrders(userId);
      expect(orders.length).toBeGreaterThan(0);
      expect(orders[0].type).toBe('group_deal');
    }
  });
});
```

### Delivery Integration

```typescript
// tests/integration/delivery-flow.test.ts
describe('Crowdsourced Delivery Integration', () => {
  let orderId: string;
  let driverId: string;
  let trackingId: string;

  beforeAll(async () => {
    // Create test order
    const order = await createTestOrder({
      deliveryType: 'crowdsourced',
      shippingAddress: {
        governorate: 'cairo',
        city: 'nasr_city',
        lat: 30.0626,
        lng: 31.2497
      }
    });
    orderId = order.id;

    // Create and online a test driver
    const driver = await createTestDriver({
      location: { lat: 30.0580, lng: 31.2400 },
      vehicleType: 'motorcycle',
      rating: 4.8
    });
    driverId = driver.id;
    await deliveryService.setDriverOnline(driverId);
  });

  it('should match order to nearest available driver', async () => {
    const result = await deliveryService.assignDriver(orderId);

    expect(result.success).toBe(true);
    expect(result.driverId).toBe(driverId);
    expect(result.estimatedPickup).toBeDefined();
    trackingId = result.trackingId;
  });

  it('should integrate with Ant Colony for route optimization', async () => {
    // Add more orders to the driver
    const additionalOrders = await Promise.all([
      createTestOrder({ deliveryType: 'crowdsourced' }),
      createTestOrder({ deliveryType: 'crowdsourced' })
    ]);

    for (const order of additionalOrders) {
      await deliveryService.assignDriver(order.id, driverId);
    }

    // Get optimized route
    const route = await deliveryService.getOptimizedRoute(driverId);

    expect(route.stops).toHaveLength(3);
    expect(route.optimizedBy).toBe('ant_colony');
    expect(route.totalDistance).toBeDefined();
    expect(route.estimatedDuration).toBeDefined();
  });

  it('should update tracking in real-time', async () => {
    // Simulate driver location updates
    const updates = [
      { lat: 30.0590, lng: 31.2420, status: 'picked_up' },
      { lat: 30.0610, lng: 31.2460, status: 'in_transit' },
      { lat: 30.0626, lng: 31.2497, status: 'arrived' }
    ];

    for (const update of updates) {
      await deliveryService.updateLocation(driverId, update);

      const tracking = await deliveryService.getTracking(trackingId);
      expect(tracking.lastLocation.lat).toBe(update.lat);
      expect(tracking.status).toBe(update.status);
    }
  });

  it('should handle delivery completion and driver payment', async () => {
    await deliveryService.completeDelivery(trackingId, {
      photoProof: 'base64-image-data',
      signature: 'customer-signature',
      receivedBy: 'Customer Name'
    });

    // Check order status
    const order = await ordersService.getOrder(orderId);
    expect(order.status).toBe('delivered');

    // Check driver wallet
    const wallet = await deliveryService.getDriverWallet(driverId);
    expect(wallet.pendingBalance).toBeGreaterThan(0);
  });

  it('should fallback to Bosta when no drivers available', async () => {
    // Set all drivers offline
    await deliveryService.setDriverOffline(driverId);

    const newOrder = await createTestOrder({
      deliveryType: 'crowdsourced'
    });

    const result = await deliveryService.assignDriver(newOrder.id);

    expect(result.success).toBe(true);
    expect(result.fallback).toBe(true);
    expect(result.carrier).toBe('bosta');
  });
});
```

### Community Groups Integration

```typescript
// tests/integration/community-groups-flow.test.ts
describe('Community Groups Integration', () => {
  let leaderId: string;
  let groupId: string;
  let roundId: string;
  let memberIds: string[] = [];

  beforeAll(async () => {
    // Create and approve leader
    const leader = await createTestLeader({
      governorate: 'cairo',
      district: 'nasr_city'
    });
    leaderId = leader.id;

    // Create group
    const group = await communityService.createGroup({
      leaderId,
      name: 'مجموعة مدينة نصر',
      pickupLocation: {
        lat: 30.0626,
        lng: 31.2497,
        address: 'شارع مكة، مدينة نصر'
      }
    });
    groupId = group.id;

    // Add members
    for (let i = 0; i < 20; i++) {
      const member = await createTestUser();
      await communityService.joinGroup(groupId, member.id);
      memberIds.push(member.id);
    }
  });

  it('should create order round', async () => {
    const round = await communityService.createRound({
      groupId,
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      minOrderValue: 100
    });

    roundId = round.id;
    expect(round.status).toBe('open');
  });

  it('should allow members to add orders to round', async () => {
    for (let i = 0; i < 10; i++) {
      await communityService.addToRound({
        roundId,
        memberId: memberIds[i],
        items: [
          { productId: 'product-1', quantity: 2 }
        ]
      });
    }

    const round = await communityService.getRound(roundId);
    expect(round.orderCount).toBe(10);
    expect(round.totalValue).toBeGreaterThan(0);
  });

  it('should aggregate orders on round close', async () => {
    await communityService.closeRound(roundId);

    const round = await communityService.getRound(roundId);
    expect(round.status).toBe('closed');
    expect(round.consolidatedOrderId).toBeDefined();

    // Check consolidated order
    const consolidatedOrder = await ordersService.getOrder(round.consolidatedOrderId);
    expect(consolidatedOrder.type).toBe('community_group');
    expect(consolidatedOrder.deliveryAddress.lat).toBe(30.0626); // Leader's location
  });

  it('should calculate leader commission correctly', async () => {
    await communityService.completeDistribution(roundId, {
      confirmations: memberIds.slice(0, 10).map(id => ({
        memberId: id,
        confirmed: true
      }))
    });

    const commission = await communityService.getLeaderCommission(leaderId);
    expect(commission.pending).toBeGreaterThan(0);
    expect(commission.calculatedFrom).toBe(roundId);
  });
});
```

### Locker Integration

```typescript
// tests/integration/locker-flow.test.ts
describe('Smart Locker Integration', () => {
  let stationId: string;
  let cellId: string;
  let reservationId: string;
  let orderId: string;
  let pickupCode: string;

  beforeAll(async () => {
    // Create test locker station
    const station = await lockerService.createStation({
      name: 'محطة سيتي ستارز',
      location: {
        lat: 30.0733,
        lng: 31.3456,
        address: 'سيتي ستارز، مدينة نصر'
      },
      cells: [
        { size: 'small', count: 10 },
        { size: 'medium', count: 5 },
        { size: 'large', count: 3 }
      ]
    });
    stationId = station.id;

    // Create test order with locker delivery
    const order = await createTestOrder({
      deliveryType: 'locker',
      lockerStationId: stationId
    });
    orderId = order.id;
  });

  it('should reserve cell for order', async () => {
    const reservation = await lockerService.reserveCell({
      orderId,
      stationId,
      packageSize: 'small',
      expiresIn: 72 * 60 * 60 * 1000 // 72 hours
    });

    reservationId = reservation.id;
    cellId = reservation.cellId;
    expect(reservation.status).toBe('reserved');
    expect(reservation.expiresAt).toBeDefined();
  });

  it('should allow driver to deposit package', async () => {
    const depositResult = await lockerService.depositPackage({
      reservationId,
      driverCode: 'DRIVER123',
      photoProof: 'base64-image'
    });

    expect(depositResult.success).toBe(true);
    pickupCode = depositResult.pickupCode;
    expect(pickupCode).toMatch(/^\d{6}$/); // 6-digit code
  });

  it('should send notification to customer', async () => {
    const notifications = await notificationService.getNotifications(orderId);

    expect(notifications).toContainEqual(
      expect.objectContaining({
        type: 'locker_ready',
        data: expect.objectContaining({
          pickupCode,
          stationName: 'محطة سيتي ستارز'
        })
      })
    );
  });

  it('should allow customer to pickup with code', async () => {
    const pickupResult = await lockerService.pickupPackage({
      reservationId,
      pickupCode,
      customerId: 'customer-123'
    });

    expect(pickupResult.success).toBe(true);
    expect(pickupResult.cellOpened).toBe(true);

    // Check order status updated
    const order = await ordersService.getOrder(orderId);
    expect(order.status).toBe('delivered');
  });

  it('should handle return via locker', async () => {
    // Initiate return
    const returnRequest = await returnsService.createReturn({
      orderId,
      reason: 'size_mismatch',
      returnMethod: 'locker'
    });

    // Reserve cell for return
    const returnReservation = await lockerService.reserveCell({
      returnId: returnRequest.id,
      stationId,
      packageSize: 'small',
      type: 'return'
    });

    expect(returnReservation.depositCode).toBeDefined();

    // Customer deposits return
    await lockerService.depositReturn({
      reservationId: returnReservation.id,
      depositCode: returnReservation.depositCode
    });

    // Check return status
    const returnStatus = await returnsService.getReturn(returnRequest.id);
    expect(returnStatus.status).toBe('deposited');
  });
});
```

### Payment Integration

```typescript
// tests/integration/payment-flow.test.ts
describe('Payment Integration', () => {
  describe('Vodafone Cash Payment', () => {
    it('should process payment successfully', async () => {
      const order = await createTestOrder({
        total: 500,
        paymentMethod: 'vodafone_cash'
      });

      const paymentResult = await paymentService.processPayment({
        orderId: order.id,
        amount: 500,
        method: 'vodafone_cash',
        walletNumber: '01012345678'
      });

      expect(paymentResult.status).toBe('pending');
      expect(paymentResult.redirectUrl).toBeDefined();

      // Simulate callback
      await paymentService.handleCallback({
        paymentId: paymentResult.id,
        status: 'success',
        transactionId: 'VF-123456'
      });

      const order2 = await ordersService.getOrder(order.id);
      expect(order2.paymentStatus).toBe('paid');
    });
  });

  describe('Arachnid Fraud Detection', () => {
    it('should block suspicious payment', async () => {
      const order = await createTestOrder({
        total: 100000,
        customerId: 'new-suspicious-user'
      });

      const paymentResult = await paymentService.processPayment({
        orderId: order.id,
        amount: 100000,
        method: 'card',
        metadata: {
          deviceFingerprint: 'unknown-device',
          ipAddress: '185.107.x.x', // VPN
          isNewUser: true
        }
      });

      expect(paymentResult.status).toBe('blocked');
      expect(paymentResult.reason).toBe('fraud_suspected');
    });
  });

  describe('Refund Processing', () => {
    it('should process refund to original payment method', async () => {
      const order = await createTestOrder({
        paymentStatus: 'paid',
        paymentMethod: 'card',
        total: 500
      });

      const refundResult = await paymentService.processRefund({
        orderId: order.id,
        amount: 500,
        reason: 'customer_request'
      });

      expect(refundResult.status).toBe('processed');
      expect(refundResult.refundedTo).toBe('original_payment_method');

      const order2 = await ordersService.getOrder(order.id);
      expect(order2.paymentStatus).toBe('refunded');
    });
  });
});
```

---

## 3️⃣ اختبارات End-to-End (E2E Tests)

### رحلة المستخدم الكاملة

```typescript
// tests/e2e/user-journey.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Complete User Journey', () => {
  let page: Page;
  let userPhone: string;
  let orderNumber: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    userPhone = `010${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
  });

  test('1. User Registration', async () => {
    await page.goto('/register');

    await page.fill('[name="phone"]', userPhone);
    await page.fill('[name="fullName"]', 'مستخدم تجريبي');
    await page.selectOption('[name="governorate"]', 'cairo');
    await page.click('button[type="submit"]');

    // Verify OTP page
    await expect(page.locator('.otp-input')).toBeVisible();

    // Enter test OTP
    await page.fill('.otp-input', '123456');
    await page.click('button.verify');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('2. Browse Products', async () => {
    await page.goto('/products');

    // Wait for products to load
    await expect(page.locator('.product-card').first()).toBeVisible();

    // Search for product
    await page.fill('[name="search"]', 'قميص');
    await page.keyboard.press('Enter');

    // Verify search results
    await expect(page.locator('.product-card')).toHaveCount({ min: 1 });
  });

  test('3. Add to Cart', async () => {
    // Click on first product
    await page.click('.product-card:first-child');

    // Verify product page
    await expect(page.locator('.product-detail')).toBeVisible();

    // Select size and quantity
    await page.click('[data-size="L"]');
    await page.fill('[name="quantity"]', '2');

    // Add to cart
    await page.click('button.add-to-cart');

    // Verify cart updated
    await expect(page.locator('.cart-count')).toHaveText('2');
  });

  test('4. Checkout Process', async () => {
    await page.click('.cart-icon');
    await page.click('button.checkout');

    // Fill shipping address
    await page.fill('[name="city"]', 'مدينة نصر');
    await page.fill('[name="street"]', 'شارع مكة');
    await page.fill('[name="building"]', '15');

    // Select delivery method
    await page.click('[data-delivery="home"]');

    // Select payment method
    await page.click('[data-payment="cod"]');

    // Place order
    await page.click('button.place-order');

    // Verify order confirmation
    await expect(page).toHaveURL(/\/orders\/\w+/);
    orderNumber = await page.locator('.order-number').textContent();
    expect(orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
  });

  test('5. Track Order', async () => {
    await page.goto('/my-orders');

    // Find the order
    await page.click(`[data-order="${orderNumber}"]`);

    // Verify tracking page
    await expect(page.locator('.order-status')).toBeVisible();
    await expect(page.locator('.tracking-timeline')).toBeVisible();
  });
});
```

### رحلة الشراء الجماعي

```typescript
// tests/e2e/group-buying-journey.spec.ts
test.describe('Group Buying User Journey', () => {
  test('Complete group buying flow with multiple users', async ({ browser }) => {
    // Create multiple browser contexts for multiple users
    const contexts = await Promise.all(
      Array(5).fill(null).map(() => browser.newContext())
    );
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    // User 1: Create or view deal
    const dealPage = pages[0];
    await dealPage.goto('/group-deals');
    await dealPage.click('.deal-card:first-child');
    const dealUrl = dealPage.url();
    const dealId = dealUrl.split('/').pop();

    // All users join the deal
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      await page.goto(dealUrl);

      // Login if needed
      if (await page.locator('.login-prompt').isVisible()) {
        await loginTestUser(page, `user${i}@test.com`);
      }

      // Join deal
      await page.fill('[name="quantity"]', '1');
      await page.click('button.join-deal');

      // Verify participation
      await expect(page.locator('.participation-confirmed')).toBeVisible();
    }

    // Verify participant count updates for all users
    for (const page of pages) {
      await page.reload();
      const count = await page.locator('.participant-count').textContent();
      expect(parseInt(count)).toBe(pages.length);
    }

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });
});
```

### رحلة السائق

```typescript
// tests/e2e/driver-journey.spec.ts
test.describe('Driver App Journey', () => {
  test('Complete delivery flow', async ({ page }) => {
    // Login as driver
    await page.goto('/driver/login');
    await page.fill('[name="phone"]', '01098765432');
    await page.fill('[name="otp"]', '123456');
    await page.click('button.login');

    // Go online
    await page.click('button.go-online');
    await expect(page.locator('.status-badge')).toHaveText('متاح');

    // Wait for order notification
    await page.waitForSelector('.order-notification', { timeout: 60000 });

    // Accept order
    await page.click('.order-notification .accept');

    // Navigate to pickup
    await expect(page.locator('.navigation-active')).toBeVisible();
    await page.click('button.arrived-pickup');

    // Confirm pickup
    await page.click('button.confirm-pickup');
    await page.setInputFiles('input[type="file"]', './test-photo.jpg');
    await page.click('button.submit-pickup');

    // Navigate to delivery
    await page.click('button.start-delivery');
    await expect(page.locator('.delivery-in-progress')).toBeVisible();

    // Complete delivery
    await page.click('button.arrived-delivery');
    await page.setInputFiles('input[type="file"]', './test-delivery-photo.jpg');
    await page.fill('[name="receivedBy"]', 'اسم المستلم');
    await page.click('button.complete-delivery');

    // Verify completion
    await expect(page.locator('.delivery-complete')).toBeVisible();
    await expect(page.locator('.earnings-update')).toBeVisible();
  });
});
```

---

## 4️⃣ اختبارات الأداء (Load Tests)

```javascript
// tests/load/group-buying-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '3m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '3m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '3m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    errors: ['rate<0.05'],              // Error rate should be below 5%
  },
};

const BASE_URL = 'https://api.haderos.com';

export default function () {
  // 1. Get active group deals
  const dealsResponse = http.get(`${BASE_URL}/api/group-deals?status=active`);
  check(dealsResponse, {
    'deals loaded': (r) => r.status === 200,
    'has deals': (r) => JSON.parse(r.body).data.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // 2. Join a random deal
  const deals = JSON.parse(dealsResponse.body).data;
  if (deals.length > 0) {
    const randomDeal = deals[Math.floor(Math.random() * deals.length)];

    const joinResponse = http.post(
      `${BASE_URL}/api/group-deals/${randomDeal.id}/join`,
      JSON.stringify({ quantity: 1 }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(joinResponse, {
      'joined successfully': (r) => r.status === 200 || r.status === 400,
    }) || errorRate.add(1);
  }

  sleep(2);

  // 3. Get deal real-time updates
  const dealId = deals[0]?.id;
  if (dealId) {
    const statusResponse = http.get(`${BASE_URL}/api/group-deals/${dealId}/status`);
    check(statusResponse, {
      'status loaded': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(1);
}
```

---

## 5️⃣ اختبارات الأمان (Security Tests)

```yaml
# tests/security/owasp-zap-config.yaml
name: HADEROS Security Scan
target: https://api.haderos.com
scan_types:
  - passive
  - active

rules:
  - id: 10020  # Anti-CSRF Tokens
    enabled: true
  - id: 10021  # X-Content-Type-Options Header Missing
    enabled: true
  - id: 10035  # Strict-Transport-Security Header Not Set
    enabled: true
  - id: 10038  # Content Security Policy Header Not Set
    enabled: true

api_endpoints:
  - /api/auth/register
  - /api/auth/login
  - /api/orders
  - /api/payments
  - /api/users/me

authentication:
  type: bearer
  token: ${AUTH_TOKEN}
```

```typescript
// tests/security/injection.test.ts
describe('Security - SQL/NoSQL Injection', () => {
  const injectionPayloads = [
    "'; DROP TABLE users; --",
    "{ $gt: '' }",
    "<script>alert('xss')</script>",
    "1 OR 1=1",
    "admin'--"
  ];

  it('should reject SQL injection in search', async () => {
    for (const payload of injectionPayloads) {
      const response = await request(app)
        .get('/api/products')
        .query({ search: payload });

      expect(response.status).not.toBe(500);
      expect(response.body.error).not.toContain('SQL');
    }
  });

  it('should sanitize user input', async () => {
    const response = await request(app)
      .post('/api/users/update')
      .send({
        fullName: "<script>alert('xss')</script>"
      });

    expect(response.body.data.fullName).not.toContain('<script>');
  });
});
```

---

## 📋 Test Coverage Requirements

```yaml
coverage_requirements:
  overall:
    statements: 80%
    branches: 75%
    functions: 80%
    lines: 80%

  critical_paths:
    # These require 95%+ coverage
    - services/payment/*.ts
    - services/orders/*.ts
    - bio-modules/arachnid.ts
    - kaia/engine.ts

  integration_tests:
    - All service-to-service calls
    - All bio-module integrations
    - All payment gateway flows
    - All notification channels
```

---

## 🏃 Running Tests

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# All tests with coverage
pnpm test:coverage

# Load tests
pnpm test:load

# Security scan
pnpm test:security
```

---

**نهاية وثيقة استراتيجية الاختبار**
