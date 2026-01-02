# 🚀 HADEROS: الخطة التنفيذية الشاملة
## ضمان توافق النظام والاختبار قبل الإطلاق

> **تاريخ الإنشاء**: 2 يناير 2026
> **الهدف**: ضمان عمل جميع أجزاء النظام معاً بشكل متكامل

---

## 📋 جدول المحتويات

1. [فلسفة التنفيذ](#فلسفة-التنفيذ)
2. [مراحل التنفيذ التفصيلية](#مراحل-التنفيذ)
3. [استراتيجية الاختبار](#استراتيجية-الاختبار)
4. [نقاط التكامل الحرجة](#نقاط-التكامل)
5. [بيئات التطوير والاختبار](#بيئات-التطوير)
6. [قائمة التحقق قبل الإطلاق](#قائمة-التحقق)
7. [خطة الإطلاق المتدرج](#خطة-الإطلاق)

---

## 🎯 فلسفة التنفيذ

### المبدأ الأساسي: "Build → Test → Integrate → Test Again"

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         دورة التطوير المتكاملة                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐         │
│    │  Build  │ ──▶ │  Unit   │ ──▶ │ Integrate│ ──▶ │  E2E    │         │
│    │ Feature │     │  Test   │     │  Test   │     │  Test   │         │
│    └─────────┘     └─────────┘     └─────────┘     └─────────┘         │
│         │                                               │               │
│         │              ◀── Feedback Loop ──◀            │               │
│         └───────────────────────────────────────────────┘               │
│                                                                         │
│    ┌─────────────────────────────────────────────────────────────────┐ │
│    │                    Continuous Integration                       │ │
│    │  Every commit → Build → Test → Deploy to Staging → Smoke Test  │ │
│    └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### قواعد ذهبية

1. **لا ننتقل لمرحلة جديدة إلا بعد اجتياز اختبارات المرحلة الحالية**
2. **كل ميزة جديدة = Unit Tests + Integration Tests + E2E Tests**
3. **الاختبار على بيئة مماثلة للإنتاج قبل الإطلاق**
4. **Feature Flags لكل ميزة جديدة**
5. **Rollback Plan جاهز دائماً**

---

## 📅 مراحل التنفيذ التفصيلية

### المرحلة 0: البنية التحتية والأساسيات (أسبوعان)

#### الأسبوع 1: إعداد البيئات

```yaml
week_1_tasks:
  day_1_2:
    title: "إعداد بيئات التطوير"
    tasks:
      - إعداد Docker Compose للتطوير المحلي
      - تكوين PostgreSQL مع Replicas
      - إعداد Redis للـ Caching
      - تكوين Elasticsearch للبحث
    deliverables:
      - docker-compose.dev.yml
      - docker-compose.staging.yml
      - docker-compose.prod.yml
    tests:
      - ✅ جميع الخدمات تعمل محلياً
      - ✅ الاتصال بقاعدة البيانات ناجح
      - ✅ Redis يستجيب للـ ping

  day_3_4:
    title: "إعداد CI/CD Pipeline"
    tasks:
      - GitHub Actions workflow
      - Automated testing on PR
      - Automated deployment to staging
      - Slack notifications
    deliverables:
      - .github/workflows/ci.yml
      - .github/workflows/deploy-staging.yml
      - .github/workflows/deploy-prod.yml
    tests:
      - ✅ PR يمر بالـ tests تلقائياً
      - ✅ Deploy للـ staging يعمل

  day_5_7:
    title: "إعداد Monitoring"
    tasks:
      - Prometheus metrics collection
      - Grafana dashboards
      - Error tracking (Sentry)
      - Log aggregation (ELK)
    deliverables:
      - monitoring/prometheus.yml
      - monitoring/grafana-dashboards/
      - sentry.io configuration
    tests:
      - ✅ Metrics تظهر في Grafana
      - ✅ Errors تصل لـ Sentry
```

#### الأسبوع 2: التكامل الأساسي

```yaml
week_2_tasks:
  day_1_3:
    title: "API Gateway Setup"
    tasks:
      - إعداد Kong/Traefik
      - Rate limiting configuration
      - Authentication middleware
      - Request/Response logging
    tests:
      - ✅ Rate limiting يعمل
      - ✅ Auth middleware يمنع غير المصرح

  day_4_5:
    title: "Database Migrations Strategy"
    tasks:
      - Drizzle migration scripts
      - Rollback procedures
      - Data seeding scripts
    tests:
      - ✅ Migrations up/down تعمل
      - ✅ Seed data صحيح

  day_6_7:
    title: "Integration Test Framework"
    tasks:
      - Jest + Supertest setup
      - Test database configuration
      - Mock services setup
    deliverables:
      - tests/integration/setup.ts
      - tests/e2e/setup.ts
    tests:
      - ✅ Integration tests تعمل
      - ✅ Test isolation صحيح
```

**✅ معايير الانتقال للمرحلة 1:**
- [ ] جميع الخدمات تعمل في Docker
- [ ] CI/CD Pipeline يعمل بالكامل
- [ ] Monitoring dashboard جاهز
- [ ] 100% من البنية التحتية tests تمر

---

### المرحلة 1: الخدمات الأساسية (4 أسابيع)

#### الأسبوع 3-4: User & Auth Service

```yaml
user_service:
  new_features:
    - Customer registration (not just employees)
    - OAuth integration (Google, Facebook)
    - Phone verification (Egyptian)
    - KYC for drivers/leaders

  existing_assets:
    - ✅ Employee management (schema.ts)
    - ✅ 2FA system (schema-2fa.ts)
    - ✅ Session management (_core/trpc.ts)

  database_changes:
    - Add customers table
    - Add oauth_accounts table
    - Add verification_status to users

  api_endpoints:
    - POST /api/auth/register/customer
    - POST /api/auth/register/driver
    - POST /api/auth/register/leader
    - POST /api/auth/oauth/{provider}
    - POST /api/auth/verify-phone
    - GET /api/users/me
    - PUT /api/users/me

  tests_required:
    unit:
      - Registration validation
      - Password hashing
      - Token generation
    integration:
      - Full registration flow
      - OAuth callback handling
      - Phone verification with OTP
    e2e:
      - Customer can register and login
      - Driver can complete KYC

  integration_points:
    - Notification Service (OTP sending)
    - KAIA Engine (KYC validation)
```

#### الأسبوع 5-6: Product & Order Service Enhancement

```yaml
product_service:
  existing_assets:
    - ✅ Product CRUD (products.service.ts)
    - ✅ Inventory management (inventory.service.ts)
    - ✅ Shopify sync (shopify-*.ts)
    - ✅ Chameleon pricing (bio-modules/chameleon.ts)

  new_features:
    - Product reviews & ratings
    - Group deal products flagging
    - Community group products

  database_changes:
    - Add product_reviews table
    - Add group_deal_eligible flag
    - Add community_group_eligible flag

  tests_required:
    unit:
      - Review submission
      - Rating calculation
    integration:
      - Product with reviews API
      - Chameleon pricing integration
    e2e:
      - Customer can view product with reviews
      - Dynamic pricing updates correctly

order_service:
  existing_assets:
    - ✅ Order creation (orders.service.ts)
    - ✅ COD workflow (cod-workflow.service.ts)
    - ✅ Returns (schema-returns.ts)

  new_features:
    - Group order support
    - Community order aggregation
    - Locker delivery option

  database_changes:
    - Add group_order_id to orders
    - Add community_order_id to orders
    - Add delivery_type ENUM (home, locker, community)

  tests_required:
    unit:
      - Order validation for each type
      - Price calculation
    integration:
      - Order + Payment flow
      - Order + Inventory deduction
      - Order + Shipping creation
    e2e:
      - Complete purchase flow
      - Return flow
```

**✅ معايير الانتقال للمرحلة 2:**
- [ ] Customer registration يعمل
- [ ] OAuth login يعمل
- [ ] Product reviews يعمل
- [ ] Order creation يدعم جميع الأنواع
- [ ] 95%+ test coverage للخدمات الأساسية
- [ ] Integration tests جميعها تمر
- [ ] E2E: مسار الشراء الكامل يعمل

---

### المرحلة 2: الشراء الجماعي (4 أسابيع)

#### الأسبوع 7-8: Group Buying Core

```yaml
group_buying_service:
  new_schemas:
    - group_deals (العروض الجماعية)
    - group_deal_tiers (مستويات الأسعار)
    - group_deal_participants (المشاركين)
    - group_deal_orders (الطلبات)

  new_apis:
    - POST /api/group-deals (create deal)
    - GET /api/group-deals (list deals)
    - GET /api/group-deals/{id} (deal details)
    - POST /api/group-deals/{id}/join (join deal)
    - DELETE /api/group-deals/{id}/leave (leave deal)
    - POST /api/group-deals/{id}/close (close deal)

  bio_module_integration:
    chameleon:
      purpose: "التسعير الديناميكي حسب المستوى"
      integration: |
        // عند وصول مشاركين جدد
        const newPrice = await chameleon.calculateGroupPrice({
          dealId,
          currentParticipants,
          tier: currentTier
        });
    arachnid:
      purpose: "كشف التلاعب والمشاركات المزيفة"
      integration: |
        // فحص كل مشاركة جديدة
        const fraudScore = await arachnid.analyzeParticipation({
          userId,
          dealId,
          deviceFingerprint,
          ipAddress
        });
        if (fraudScore > 70) reject();

  real_time_features:
    - WebSocket for participant count updates
    - Timer countdown for deal closing
    - Price tier progression animation

  tests_required:
    unit:
      - Tier calculation logic
      - Deal closing logic
      - Participant limit enforcement
    integration:
      - Deal lifecycle (create → join → close → fulfill)
      - Bio-module integration
      - Payment integration
    e2e:
      - Complete group buying flow
      - Multiple users joining same deal
      - Deal success and failure scenarios
```

#### الأسبوع 9-10: Group Buying Advanced

```yaml
group_buying_advanced:
  features:
    - WhatsApp sharing integration
    - Smart reminders system
    - Deal recommendations
    - Merchant dashboard

  whatsapp_integration:
    template: |
      🎉 عرض جماعي مميز!

      {product_name}
      السعر العادي: {original_price} ج.م
      السعر الحالي: {current_price} ج.م ({discount}% خصم)

      👥 {current}/{target} مشارك
      ⏰ باقي {time_remaining}

      انضم الآن: {join_link}

  smart_reminders:
    triggers:
      - 80% of target reached
      - 2 hours before closing
      - Friend joined the deal
      - Price tier about to change

  tests_required:
    integration:
      - WhatsApp message sending
      - Reminder scheduling
    e2e:
      - Share deal via WhatsApp
      - Receive and act on reminder
```

**✅ معايير الانتقال للمرحلة 3:**
- [ ] إنشاء عرض جماعي يعمل
- [ ] الانضمام للعرض يعمل
- [ ] التسعير المتدرج يعمل (Chameleon)
- [ ] كشف الاحتيال يعمل (Arachnid)
- [ ] Real-time updates تعمل
- [ ] WhatsApp sharing يعمل
- [ ] E2E: 10 مستخدمين يشاركون في عرض واحد

---

### المرحلة 3: التوصيل التشاركي (5 أسابيع)

#### الأسبوع 11-13: Driver System

```yaml
driver_service:
  new_schemas:
    - drivers (بيانات السائقين)
    - driver_vehicles (المركبات)
    - driver_documents (الوثائق)
    - driver_wallets (المحافظ)
    - driver_payouts (المدفوعات)
    - delivery_assignments (التعيينات)
    - delivery_tracking (التتبع)

  existing_assets:
    - ✅ Bosta integration (bosta-api.ts)
    - ✅ J&T integration (jnt-api.ts)
    - ✅ Ant Colony routing (bio-modules/ant.ts)
    - ✅ Tardigrade resilience (bio-modules/tardigrade.ts)

  new_apis:
    driver_app:
      - POST /api/drivers/register
      - POST /api/drivers/go-online
      - POST /api/drivers/go-offline
      - GET /api/drivers/available-orders
      - POST /api/drivers/accept-order/{id}
      - POST /api/drivers/pickup/{id}
      - POST /api/drivers/deliver/{id}
      - GET /api/drivers/wallet
      - POST /api/drivers/request-payout

    customer_tracking:
      - GET /api/delivery/{id}/track (WebSocket)
      - GET /api/delivery/{id}/eta

  bio_module_integration:
    ant_colony:
      purpose: "تحسين المسارات للتوصيل متعدد النقاط"
      integration: |
        // حساب أفضل ترتيب للتوصيلات
        const optimizedRoute = await antColony.optimize({
          startPoint: driver.currentLocation,
          deliveryPoints: assignedOrders.map(o => o.address),
          constraints: {
            maxTime: 120, // دقيقة
            maxDistance: 50 // كم
          }
        });

    tardigrade:
      purpose: "ضمان استمرارية الخدمة"
      integration: |
        // مراقبة صحة نظام التوصيل
        tardigrade.monitor({
          service: 'delivery',
          checkInterval: 60000,
          onFailure: async () => {
            // تفعيل وضع الطوارئ
            await fallbackToExternalDelivery();
          }
        });
```

#### الأسبوع 14-15: Driver Matching & Tracking

```yaml
driver_matching:
  algorithm:
    factors:
      - distance_to_pickup: weight_0.4
      - driver_rating: weight_0.2
      - vehicle_type_match: weight_0.15
      - completion_rate: weight_0.15
      - current_workload: weight_0.1

    process: |
      1. Filter drivers by: online, available, within_radius
      2. Score each driver using weighted factors
      3. Sort by score descending
      4. Offer to top driver (30 sec timeout)
      5. If declined/timeout → next driver
      6. If no driver after 3 attempts → increase radius + incentive
      7. If still no driver → fallback to Bosta/J&T

  real_time_tracking:
    technology: "WebSocket + Redis Pub/Sub"
    update_frequency: "Every 10 seconds"
    data_points:
      - driver_location
      - eta_to_customer
      - order_status
      - driver_info

  tests_required:
    unit:
      - Matching algorithm scoring
      - ETA calculation
      - Fallback logic
    integration:
      - Full assignment flow
      - Location updates propagation
      - Wallet transactions
    e2e:
      - Order → Driver assigned → Pickup → Delivery
      - Customer tracks order in real-time
      - Driver receives payment
```

**✅ معايير الانتقال للمرحلة 4:**
- [ ] تسجيل السائقين + KYC يعمل
- [ ] Driver matching يعمل
- [ ] Real-time tracking يعمل
- [ ] Ant Colony routing يعمل
- [ ] Driver wallet + payout يعمل
- [ ] Fallback to Bosta/J&T يعمل
- [ ] E2E: 20 طلب متزامن مع 10 سائقين

---

### المرحلة 4: المجموعات المجتمعية (4 أسابيع)

#### الأسبوع 16-17: Community Groups Core

```yaml
community_service:
  new_schemas:
    - community_leaders (القادة)
    - community_groups (المجموعات)
    - community_members (الأعضاء)
    - order_rounds (جولات الطلب)
    - round_orders (طلبات الجولة)
    - leader_commissions (عمولات القادة)

  leader_onboarding:
    steps:
      - Application submission
      - Document verification (ID, address proof)
      - Training completion
      - Test order completion
      - Approval

  group_management:
    features:
      - Create group with location
      - Invite members via WhatsApp/SMS
      - Set pickup location
      - View member list
      - Manage pending requests
```

#### الأسبوع 18-19: Order Rounds & Distribution

```yaml
order_rounds:
  workflow:
    1_round_creation:
      - Leader creates new round
      - Sets deadline (usually 48h)
      - Selects eligible products/categories

    2_member_ordering:
      - Members receive notification
      - Browse products in round
      - Add to cart
      - Confirm order before deadline

    3_round_closing:
      - Auto-close at deadline
      - Aggregate all orders
      - Calculate bulk discount
      - Create consolidated shipment

    4_delivery:
      - Ship to leader's location
      - Leader receives notification
      - Leader confirms receipt

    5_distribution:
      - Leader distributes to members
      - Members confirm receipt
      - Leader marks complete

    6_commission:
      - Calculate leader commission
      - Add to leader wallet

  integration_points:
    - Order Service (individual orders)
    - Payment Service (collect from members)
    - Delivery Service (ship to leader)
    - Notification Service (all updates)
    - KAIA Engine (fair pricing validation)
```

**✅ معايير الانتقال للمرحلة 5:**
- [ ] Leader onboarding يعمل
- [ ] Group creation + member invite يعمل
- [ ] Order round lifecycle يعمل
- [ ] Bulk discount calculation يعمل
- [ ] Leader commission يعمل
- [ ] E2E: جولة طلب كاملة مع 20 عضو

---

### المرحلة 5: الخزائن الذكية (6 أسابيع)

#### الأسبوع 20-22: Locker Infrastructure

```yaml
locker_service:
  new_schemas:
    - locker_stations (المحطات)
    - locker_cells (الخانات)
    - locker_reservations (الحجوزات)
    - locker_access_logs (سجلات الوصول)
    - locker_maintenance (الصيانة)

  hardware_integration:
    protocol: "REST API + MQTT"
    commands:
      - OPEN_CELL
      - LOCK_CELL
      - GET_STATUS
      - SET_TEMPERATURE (for refrigerated)
      - ALARM_ON/OFF

    mock_hardware:
      purpose: "للتطوير والاختبار"
      implementation: |
        // Mock locker hardware for testing
        class MockLockerController {
          async openCell(stationId, cellId) {
            return { success: true, openTime: new Date() };
          }
          async getStatus(stationId) {
            return {
              cells: mockCells,
              temperature: 22,
              power: 'main',
              lastMaintenance: new Date()
            };
          }
        }
```

#### الأسبوع 23-25: Locker Operations

```yaml
locker_operations:
  deposit_flow:
    1. Driver arrives at station
    2. Scans order QR code
    3. System assigns available cell
    4. Cell opens automatically
    5. Driver places package
    6. Driver closes cell + confirms
    7. Customer receives notification + pickup code

  pickup_flow:
    1. Customer arrives at station
    2. Enters pickup code OR scans QR
    3. System validates code
    4. Cell opens
    5. Customer retrieves package
    6. Customer confirms receipt
    7. Cell auto-locks

  return_flow:
    1. Customer initiates return in app
    2. System assigns cell for return
    3. Customer deposits item
    4. Driver collects return
    5. Refund processed

  tests_required:
    unit:
      - Cell assignment logic
      - Code generation/validation
      - Expiry handling
    integration:
      - Full deposit-pickup flow
      - Hardware mock integration
      - Notification sending
    e2e:
      - Order → Locker deposit → Customer pickup
      - Return via locker
```

**✅ معايير الانتقال للمرحلة 6:**
- [ ] Station/Cell management يعمل
- [ ] Deposit flow يعمل (with mock)
- [ ] Pickup flow يعمل (with mock)
- [ ] Return via locker يعمل
- [ ] Notifications تصل صحيحة
- [ ] E2E: 50 طلب عبر الخزائن

---

### المرحلة 6: الميزات المتقدمة (8 أسابيع)

#### الأسبوع 26-29: Mini Programs Platform

```yaml
mini_programs:
  platform_components:
    - Mini Program SDK (JavaScript)
    - Sandbox runtime
    - App Store (discovery)
    - Developer portal
    - Review system

  security:
    - Sandboxed execution
    - Limited API access
    - Resource quotas
    - Content review

  defer_to_phase_2:
    reason: "يمكن إطلاق النظام بدون Mini Programs"
    alternative: "Third-party integrations via webhooks"
```

#### الأسبوع 30-33: AR/VR, Voice, Carbon

```yaml
advanced_features:
  ar_vr:
    priority: "Low - defer to Phase 2"
    existing_assets:
      - Visual Search integration (ready)
    mvp_alternative:
      - 360° product photos
      - Size guide overlay

  voice_commerce:
    priority: "Medium"
    existing_assets:
      - Voice transcription (_core/voiceTranscription.ts)
      - Chat system (routers/chat.ts)
    mvp_features:
      - Voice search for products
      - Voice order status check
      - Defer: full voice ordering

  carbon_footprint:
    priority: "Low - defer to Phase 2"
    mvp_alternative:
      - Show "eco-friendly delivery" option
      - Simple carbon estimate display
```

---

## 🧪 استراتيجية الاختبار الشاملة

### هرم الاختبار

```
                    ┌─────────────────┐
                    │     E2E Tests   │  10%
                    │   (Playwright)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Integration    │  30%
                    │    Tests        │
                    └────────┬────────┘
                             │
            ┌────────────────▼────────────────┐
            │          Unit Tests             │  60%
            │  (Jest, business logic, utils)  │
            └─────────────────────────────────┘
```

### Unit Tests

```typescript
// مثال: اختبار حساب مستوى السعر في الشراء الجماعي
describe('GroupDealPricingService', () => {
  describe('calculateTierPrice', () => {
    it('should return tier 1 price for 1-10 participants', () => {
      const deal = createMockDeal({
        tiers: [
          { min: 1, max: 10, price: 100 },
          { min: 11, max: 50, price: 90 },
          { min: 51, max: 100, price: 80 }
        ]
      });

      expect(calculateTierPrice(deal, 5)).toBe(100);
      expect(calculateTierPrice(deal, 10)).toBe(100);
    });

    it('should return tier 2 price for 11-50 participants', () => {
      const deal = createMockDeal({...});
      expect(calculateTierPrice(deal, 25)).toBe(90);
    });

    it('should handle edge cases', () => {
      expect(calculateTierPrice(deal, 0)).toThrow('Invalid participants');
      expect(calculateTierPrice(deal, 101)).toBe(80); // Cap at highest tier
    });
  });
});
```

### Integration Tests

```typescript
// مثال: اختبار تدفق الانضمام للعرض الجماعي
describe('Group Deal Join Flow', () => {
  let app: INestApplication;
  let db: Database;

  beforeAll(async () => {
    app = await createTestApp();
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.clean();
  });

  it('should allow user to join an active deal', async () => {
    // Arrange
    const user = await db.createUser();
    const deal = await db.createDeal({ status: 'active' });

    // Act
    const response = await request(app.getHttpServer())
      .post(`/api/group-deals/${deal.id}/join`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ quantity: 2 });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.participantCount).toBe(1);

    // Verify side effects
    const participant = await db.findParticipant(deal.id, user.id);
    expect(participant).toBeDefined();
    expect(participant.quantity).toBe(2);

    // Verify notification sent
    const notifications = await db.findNotifications(user.id);
    expect(notifications).toContainEqual(
      expect.objectContaining({ type: 'deal_joined' })
    );
  });

  it('should reject joining a closed deal', async () => {
    const user = await db.createUser();
    const deal = await db.createDeal({ status: 'closed' });

    const response = await request(app.getHttpServer())
      .post(`/api/group-deals/${deal.id}/join`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ quantity: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('deal_closed');
  });

  it('should integrate with Arachnid for fraud detection', async () => {
    const suspiciousUser = await db.createUser({
      metadata: { fraud_score: 85 }
    });
    const deal = await db.createDeal({ status: 'active' });

    const response = await request(app.getHttpServer())
      .post(`/api/group-deals/${deal.id}/join`)
      .set('Authorization', `Bearer ${suspiciousUser.token}`)
      .send({ quantity: 10 });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('suspicious_activity');
  });
});
```

### E2E Tests (Playwright)

```typescript
// مثال: اختبار رحلة المستخدم الكاملة للشراء الجماعي
import { test, expect } from '@playwright/test';

test.describe('Group Buying User Journey', () => {
  test('complete group buying flow', async ({ page, context }) => {
    // === الخطوة 1: تسجيل مستخدم جديد ===
    await page.goto('/register');
    await page.fill('[name="phone"]', '01012345678');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Verify OTP (use test OTP)
    await page.fill('[name="otp"]', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');

    // === الخطوة 2: تصفح العروض الجماعية ===
    await page.goto('/group-deals');
    await expect(page.locator('.deal-card')).toHaveCount(
      { min: 1 }
    );

    // === الخطوة 3: الانضمام لعرض ===
    await page.click('.deal-card:first-child');
    await expect(page.locator('.deal-detail')).toBeVisible();

    // Check current price and participants
    const currentPrice = await page.locator('.current-price').textContent();
    const participants = await page.locator('.participant-count').textContent();

    await page.fill('[name="quantity"]', '2');
    await page.click('button.join-deal');

    // === الخطوة 4: الدفع ===
    await expect(page).toHaveURL(/\/checkout/);
    await page.click('[data-payment="vodafone-cash"]');
    await page.fill('[name="wallet-number"]', '01012345678');
    await page.click('button.confirm-payment');

    // Simulate payment callback
    await page.waitForURL(/\/payment\/success/);

    // === الخطوة 5: التحقق من المشاركة ===
    await page.goto('/my-orders');
    await expect(page.locator('.order-item.group-deal')).toHaveCount(1);

    // === الخطوة 6: محاكاة نجاح العرض ===
    // (Backend simulation - deal reaches minimum)
    await simulateDealSuccess(dealId);

    // === الخطوة 7: التحقق من الطلب النهائي ===
    await page.reload();
    await expect(page.locator('.order-status')).toHaveText('Processing');
  });

  test('multiple users join same deal', async ({ browser }) => {
    // Create 5 browser contexts for 5 users
    const users = await Promise.all(
      Array(5).fill(null).map(() => createUserContext(browser))
    );

    // All join the same deal
    const dealId = await createTestDeal();

    await Promise.all(
      users.map(async ({ page }, index) => {
        await page.goto(`/group-deals/${dealId}`);
        await page.fill('[name="quantity"]', '1');
        await page.click('button.join-deal');

        // Verify real-time participant count updates
        await expect(page.locator('.participant-count')).toHaveText(
          `${index + 1}`
        );
      })
    );

    // Verify all users see final count
    for (const { page } of users) {
      await expect(page.locator('.participant-count')).toHaveText('5');
    }
  });
});
```

### اختبارات التكامل الشاملة

```yaml
integration_test_suites:
  group_buying_integration:
    tests:
      - group_deal_creation_with_product_validation
      - joining_deal_updates_inventory_reservation
      - deal_closing_creates_bulk_order
      - payment_failure_removes_participant
      - chameleon_pricing_integration
      - arachnid_fraud_detection_integration
      - whatsapp_notification_sending

  delivery_integration:
    tests:
      - order_creates_delivery_assignment
      - driver_matching_algorithm
      - real_time_tracking_updates
      - ant_colony_route_optimization
      - fallback_to_bosta_on_no_drivers
      - driver_wallet_transaction

  community_integration:
    tests:
      - leader_creates_order_round
      - members_add_to_round
      - round_closing_aggregates_orders
      - delivery_to_leader_location
      - leader_commission_calculation

  locker_integration:
    tests:
      - order_with_locker_delivery_option
      - cell_reservation_on_order
      - deposit_by_driver
      - pickup_by_customer
      - return_via_locker
      - expiry_handling

  payment_integration:
    tests:
      - paymob_card_payment
      - vodafone_cash_payment
      - fawry_payment
      - refund_processing
      - wallet_transactions
      - arachnid_fraud_blocking

  bio_modules_integration:
    tests:
      - all_modules_health_check
      - arachnid_real_time_monitoring
      - ant_colony_multi_point_routing
      - chameleon_dynamic_pricing
      - mycelium_inventory_distribution
      - tardigrade_failover
      - corvid_learning_integration
```

---

## 🔗 نقاط التكامل الحرجة

### خريطة التكامل بين الخدمات

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Integration Points Map                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐                                   ┌─────────────┐      │
│  │   User      │──────────────────────────────────▶│ Notification│      │
│  │  Service    │◀─────────────────────────────────▶│  Service    │      │
│  └──────┬──────┘                                   └──────┬──────┘      │
│         │                                                 │             │
│         │ auth                                           │ notify      │
│         ▼                                                 ▼             │
│  ┌─────────────┐    create     ┌─────────────┐    ┌─────────────┐      │
│  │   Order     │──────────────▶│   Payment   │◀──▶│   KAIA      │      │
│  │  Service    │◀──────────────│   Service   │    │  Engine     │      │
│  └──────┬──────┘    confirm    └──────┬──────┘    └─────────────┘      │
│         │                             │                                 │
│         │ ship                        │ charge/refund                   │
│         ▼                             ▼                                 │
│  ┌─────────────┐              ┌─────────────┐                          │
│  │  Delivery   │◀────────────▶│  Inventory  │                          │
│  │  Service    │   reserve    │  Service    │                          │
│  └──────┬──────┘              └──────┬──────┘                          │
│         │                            │                                  │
│         │ locate                     │ balance                         │
│         ▼                            ▼                                  │
│  ┌─────────────┐              ┌─────────────┐                          │
│  │   Locker    │              │  Bio-Modules│                          │
│  │  Service    │              │ Orchestrator│                          │
│  └─────────────┘              └─────────────┘                          │
│                                                                         │
│  Legend: ──▶ Primary flow   ◀──▶ Bidirectional                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### عقود التكامل (Integration Contracts)

```typescript
// contracts/order-to-payment.contract.ts
interface OrderToPaymentContract {
  // Order Service calls this
  createPaymentRequest: {
    input: {
      orderId: string;
      amount: number;
      currency: 'EGP';
      customerId: string;
      paymentMethod: PaymentMethod;
    };
    output: {
      paymentId: string;
      redirectUrl?: string;
      expiresAt: Date;
    };
  };

  // Payment Service publishes this event
  paymentCompleted: {
    event: {
      paymentId: string;
      orderId: string;
      status: 'success' | 'failed';
      transactionId: string;
    };
  };
}

// contracts/order-to-delivery.contract.ts
interface OrderToDeliveryContract {
  createDeliveryRequest: {
    input: {
      orderId: string;
      pickupAddress: Address;
      deliveryAddress: Address;
      deliveryType: 'standard' | 'express' | 'locker';
      packageDetails: {
        weight: number;
        dimensions: Dimensions;
        isFragile: boolean;
      };
    };
    output: {
      deliveryId: string;
      estimatedPickup: Date;
      estimatedDelivery: Date;
      trackingUrl: string;
    };
  };

  deliveryStatusUpdate: {
    event: {
      deliveryId: string;
      orderId: string;
      status: DeliveryStatus;
      location?: GeoPoint;
      timestamp: Date;
    };
  };
}
```

### اختبار العقود (Contract Testing)

```typescript
// tests/contracts/order-payment.contract.spec.ts
describe('Order-Payment Contract', () => {
  it('Payment Service fulfills createPaymentRequest contract', async () => {
    const request: OrderToPaymentContract['createPaymentRequest']['input'] = {
      orderId: 'order-123',
      amount: 500,
      currency: 'EGP',
      customerId: 'customer-456',
      paymentMethod: { type: 'vodafone_cash', number: '01012345678' }
    };

    const response = await paymentService.createPayment(request);

    // Verify response matches contract
    expect(response).toMatchObject({
      paymentId: expect.any(String),
      expiresAt: expect.any(Date)
    });
  });

  it('Order Service handles paymentCompleted event correctly', async () => {
    const order = await createTestOrder();

    const event: OrderToPaymentContract['paymentCompleted']['event'] = {
      paymentId: 'pay-789',
      orderId: order.id,
      status: 'success',
      transactionId: 'txn-abc'
    };

    await orderService.handlePaymentCompleted(event);

    const updatedOrder = await getOrder(order.id);
    expect(updatedOrder.status).toBe('paid');
    expect(updatedOrder.paymentId).toBe('pay-789');
  });
});
```

---

## 🖥️ بيئات التطوير والاختبار

### تعريف البيئات

```yaml
environments:
  local:
    purpose: "تطوير المطورين"
    database: "Local PostgreSQL (Docker)"
    cache: "Local Redis (Docker)"
    external_apis: "Mocked"
    bio_modules: "Running locally"

  ci:
    purpose: "اختبار تلقائي على كل PR"
    database: "Ephemeral PostgreSQL"
    cache: "Ephemeral Redis"
    external_apis: "Mocked"
    bio_modules: "Mocked for speed"

  staging:
    purpose: "اختبار شامل قبل الإنتاج"
    database: "Managed PostgreSQL (DigitalOcean)"
    cache: "Managed Redis"
    external_apis: "Sandbox accounts"
    bio_modules: "Full running"
    data: "Seeded test data"

  production:
    purpose: "الإنتاج الفعلي"
    database: "Managed PostgreSQL (DigitalOcean) + Replicas"
    cache: "Redis Cluster"
    external_apis: "Live accounts"
    bio_modules: "Full running + monitoring"
```

### Docker Compose للتطوير

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: haderos_dev
      POSTGRES_USER: haderos
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  elasticsearch:
    image: elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  # Mock external services
  mock-bosta:
    build: ./mocks/bosta
    ports:
      - "3001:3000"

  mock-paymob:
    build: ./mocks/paymob
    ports:
      - "3002:3000"

  mock-lockers:
    build: ./mocks/lockers
    ports:
      - "3003:3000"

volumes:
  postgres_data:
```

---

## ✅ قائمة التحقق قبل الإطلاق

### قائمة التحقق الفنية

```yaml
technical_checklist:
  code_quality:
    - [ ] All ESLint errors resolved
    - [ ] TypeScript strict mode passes
    - [ ] No TODO/FIXME in production code
    - [ ] Code review completed for all features

  testing:
    - [ ] Unit test coverage > 80%
    - [ ] Integration tests pass 100%
    - [ ] E2E tests pass on staging
    - [ ] Load testing completed (target: 1000 concurrent users)
    - [ ] Stress testing passed (2x expected load)

  security:
    - [ ] OWASP Top 10 audit passed
    - [ ] Penetration testing completed
    - [ ] No sensitive data in logs
    - [ ] All secrets in environment variables
    - [ ] HTTPS enforced everywhere
    - [ ] Rate limiting configured
    - [ ] Input validation on all endpoints

  performance:
    - [ ] API response time < 200ms (p95)
    - [ ] Database queries optimized (no N+1)
    - [ ] Caching implemented for hot paths
    - [ ] CDN configured for static assets
    - [ ] Image optimization enabled

  infrastructure:
    - [ ] Database backups configured (hourly)
    - [ ] Disaster recovery tested
    - [ ] Auto-scaling configured
    - [ ] Health checks implemented
    - [ ] Monitoring dashboards ready
    - [ ] Alert rules configured
    - [ ] Log aggregation working
```

### قائمة التحقق الوظيفية

```yaml
functional_checklist:
  user_journeys:
    - [ ] Customer registration → purchase → delivery
    - [ ] Driver registration → accept order → complete delivery
    - [ ] Leader registration → create group → run order round
    - [ ] Group deal creation → participation → success/failure
    - [ ] Locker delivery → deposit → pickup
    - [ ] Return via home pickup
    - [ ] Return via locker

  payment_methods:
    - [ ] Credit/Debit cards (Paymob)
    - [ ] Vodafone Cash
    - [ ] Orange Money
    - [ ] Etisalat Cash
    - [ ] Fawry
    - [ ] Cash on Delivery
    - [ ] Refunds for each method

  notifications:
    - [ ] SMS delivery works
    - [ ] WhatsApp messages work
    - [ ] Push notifications work
    - [ ] Email delivery works

  integrations:
    - [ ] Shopify sync working
    - [ ] Bosta API working
    - [ ] J&T API working
    - [ ] All payment gateways tested

  bio_modules:
    - [ ] Arachnid fraud detection active
    - [ ] Ant Colony routing optimized
    - [ ] Chameleon pricing responsive
    - [ ] Mycelium inventory balanced
    - [ ] Tardigrade monitoring active
    - [ ] KAIA validation working
```

### قائمة التحقق التشغيلية

```yaml
operational_checklist:
  documentation:
    - [ ] API documentation complete
    - [ ] Runbooks for common issues
    - [ ] Incident response procedures
    - [ ] On-call rotation defined

  support:
    - [ ] Support team trained
    - [ ] FAQ prepared
    - [ ] Escalation paths defined
    - [ ] SLA defined and communicated

  legal:
    - [ ] Terms of service published
    - [ ] Privacy policy published
    - [ ] Driver contracts ready
    - [ ] Leader agreements ready
    - [ ] Merchant agreements ready

  business:
    - [ ] Pricing finalized
    - [ ] Commission rates set
    - [ ] Customer support channels ready
    - [ ] Marketing materials ready
```

---

## 🚀 خطة الإطلاق المتدرج

### المرحلة Alpha (أسبوعان)

```yaml
alpha_phase:
  users: 100 (internal team + selected testers)
  features:
    - Core shopping
    - Group buying (limited deals)
    - Standard delivery
  geography: Cairo only
  goals:
    - Find critical bugs
    - Validate core flows
    - Stress test infrastructure
  success_criteria:
    - 0 critical bugs
    - < 5 major bugs
    - 95% transaction success rate
```

### المرحلة Beta (4 أسابيع)

```yaml
beta_phase:
  users: 1,000 (waitlist users)
  features:
    - All core features
    - Group buying (full)
    - Crowdsourced delivery (limited)
    - Community groups (5 pilot groups)
  geography: Cairo + Giza
  goals:
    - Validate product-market fit
    - Test driver supply/demand
    - Community leader feedback
  success_criteria:
    - NPS > 30
    - 80% order completion rate
    - < 3 major bugs
```

### الإطلاق العام (Soft Launch)

```yaml
soft_launch:
  users: Open registration
  features: All features
  geography: Greater Cairo
  marketing: Limited (word of mouth)
  goals:
    - Organic growth validation
    - System scalability proof
    - Unit economics validation
  success_criteria:
    - 10,000 users in first month
    - 500 daily orders
    - CAC within target
```

### الإطلاق الكامل (Hard Launch)

```yaml
hard_launch:
  users: Mass marketing
  features: All features + enhancements
  geography: Cairo, Alexandria, Delta
  marketing: Full campaign
  goals:
    - Market leadership
    - Scale operations
    - Profitability path
```

---

## 📊 مقاييس النجاح

### KPIs الفنية

| المقياس | الهدف Alpha | الهدف Beta | الهدف Production |
|---------|-------------|------------|------------------|
| Uptime | 95% | 99% | 99.9% |
| API Response (p95) | 500ms | 300ms | 200ms |
| Error Rate | < 5% | < 1% | < 0.1% |
| Test Coverage | 70% | 80% | 85% |

### KPIs الأعمال

| المقياس | الهدف Alpha | الهدف Beta | الهدف M1 |
|---------|-------------|------------|----------|
| DAU | 50 | 500 | 2,000 |
| Orders/Day | 10 | 100 | 500 |
| GMV/Month | 10K EGP | 100K EGP | 1M EGP |
| NPS | - | 30+ | 50+ |

---

## 🆘 خطة الطوارئ والتراجع

### سيناريوهات الطوارئ

```yaml
emergency_scenarios:
  database_corruption:
    detection: "Automated data integrity checks"
    response:
      - Activate read-only mode
      - Restore from last backup
      - Notify affected users
    rollback: "Point-in-time recovery"

  payment_gateway_failure:
    detection: "5 consecutive failures"
    response:
      - Switch to backup gateway
      - Queue failed payments
      - Alert on-call team
    rollback: "Retry queued payments"

  massive_traffic_spike:
    detection: "3x normal traffic"
    response:
      - Auto-scale pods
      - Enable aggressive caching
      - Degrade non-essential features
    rollback: "Scale down after 30min stability"

  security_breach:
    detection: "Anomaly detection / Alert"
    response:
      - Isolate affected systems
      - Rotate all credentials
      - Forensic investigation
    rollback: "Restore from verified clean backup"
```

### Feature Flags للتحكم

```typescript
// Feature flags configuration
const featureFlags = {
  // يمكن إيقافها فوراً إذا حدثت مشكلة
  group_buying_enabled: true,
  crowdsourced_delivery_enabled: true,
  community_groups_enabled: true,
  smart_lockers_enabled: false, // Not ready yet

  // يمكن التحكم في النسبة
  new_matching_algorithm_percentage: 50, // 50% of orders
  chameleon_pricing_percentage: 100,

  // يمكن التحكم جغرافياً
  express_delivery_cities: ['cairo', 'giza'],
  locker_delivery_cities: [],
};
```

---

## 📝 الخلاصة

هذه الخطة تضمن:

1. ✅ **التكامل الكامل** - كل خدمة تُختبر مع الخدمات المرتبطة بها
2. ✅ **الاختبار الشامل** - Unit + Integration + E2E tests
3. ✅ **البيئات المتعددة** - Dev → CI → Staging → Production
4. ✅ **الإطلاق المتدرج** - Alpha → Beta → Soft Launch → Hard Launch
5. ✅ **خطط الطوارئ** - Feature Flags + Rollback Plans
6. ✅ **المراقبة المستمرة** - Metrics + Alerts + Dashboards

**الجدول الزمني الإجمالي: 33 أسبوع (~8 أشهر)**

---

**نهاية الخطة التنفيذية**
