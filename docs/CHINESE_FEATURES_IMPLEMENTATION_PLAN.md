# خطة تنفيذ الميزات الصينية المفقودة
# Chinese Features Implementation Plan for HADEROS

**تاريخ الإنشاء:** 2 يناير 2026
**الإصدار:** 1.0
**الأولوية:** عالية

---

## 📋 ملخص تنفيذي

هذه الوثيقة تحدد خطة تنفيذ 8 ميزات مفقودة من تقرير السوق الصيني، مرتبة حسب الأولوية للسوق المصري.

---

## 🎯 الميزات المستهدفة (بالأولوية)

| الأولوية | الميزة | التأثير على السوق المصري | الجهد المطلوب |
|----------|--------|--------------------------|---------------|
| 🔴 1 | Group Buying (الشراء الجماعي) | عالي جداً | متوسط |
| 🔴 2 | Crowdsourced Delivery (التوصيل بالجمهور) | عالي جداً | عالي |
| 🔴 3 | Community Buying Groups (مجموعات الشراء) | عالي | متوسط |
| 🟡 4 | Smart Lockers (خزائن ذكية) | متوسط | عالي جداً |
| 🟡 5 | Mini Programs (تطبيقات مصغرة) | متوسط | عالي |
| 🟢 6 | AR/VR Visualization | منخفض | عالي |
| 🟢 7 | Voice Commerce | منخفض | متوسط |
| 🟢 8 | Carbon Footprint Tracking | منخفض | منخفض |

---

# المرحلة الأولى: الأولوية القصوى (3 أشهر)

---

## 1️⃣ نظام الشراء الجماعي (Group Buying System)

### 1.1 الوصف
نظام يسمح للمستخدمين بتشكيل مجموعات للشراء معاً والحصول على خصومات تتناسب مع حجم المجموعة.

### 1.2 لماذا مهم لمصر؟
- ثقافة الشراء الجماعي (العائلات، الجيران، زملاء العمل)
- حساسية السعر العالية
- انتشار مجموعات WhatsApp

### 1.3 المتطلبات الوظيفية

```
FR-GB-001: إنشاء عرض جماعي (Group Deal)
FR-GB-002: تحديد مستويات الخصم (Tier Pricing)
FR-GB-003: الانضمام للمجموعة
FR-GB-004: مشاركة العرض عبر WhatsApp
FR-GB-005: إغلاق تلقائي عند انتهاء الوقت/اكتمال العدد
FR-GB-006: إشعارات التقدم (وصلنا 70%!)
FR-GB-007: استرداد المبلغ إذا لم يكتمل العدد
```

### 1.4 Database Schema

```sql
-- جداول الشراء الجماعي

-- 1. العروض الجماعية
CREATE TABLE group_deals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deal_code VARCHAR(20) UNIQUE NOT NULL,
  product_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description TEXT,
  description_ar TEXT,

  -- السعر الأصلي والحد الأدنى
  original_price DECIMAL(10,2) NOT NULL,
  min_price DECIMAL(10,2) NOT NULL,  -- أقل سعر ممكن

  -- المتطلبات
  min_participants INT DEFAULT 5,     -- الحد الأدنى للتفعيل
  max_participants INT DEFAULT 100,   -- الحد الأقصى
  current_participants INT DEFAULT 0,

  -- التوقيت
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,

  -- الحالة
  status ENUM('draft', 'active', 'success', 'failed', 'cancelled') DEFAULT 'draft',

  -- الإعدادات
  auto_close_on_max BOOLEAN DEFAULT TRUE,
  allow_overfill BOOLEAN DEFAULT FALSE,
  require_payment_upfront BOOLEAN DEFAULT TRUE,

  -- KAIA
  kaia_approved BOOLEAN DEFAULT FALSE,
  kaia_notes TEXT,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 2. مستويات الأسعار
CREATE TABLE group_deal_tiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deal_id INT NOT NULL,
  min_participants INT NOT NULL,      -- من كم شخص
  max_participants INT,               -- إلى كم شخص (NULL = unlimited)
  price DECIMAL(10,2) NOT NULL,       -- السعر في هذا المستوى
  discount_percentage DECIMAL(5,2),   -- نسبة الخصم
  tier_name VARCHAR(50),              -- مثل: "Bronze", "Silver", "Gold"
  tier_name_ar VARCHAR(50),

  FOREIGN KEY (deal_id) REFERENCES group_deals(id) ON DELETE CASCADE
);

-- 3. المشاركين في المجموعة
CREATE TABLE group_deal_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deal_id INT NOT NULL,
  user_id INT,                        -- NULL للزوار

  -- معلومات المشارك
  participant_name VARCHAR(100) NOT NULL,
  participant_phone VARCHAR(20) NOT NULL,
  participant_email VARCHAR(255),

  -- الكمية والسعر
  quantity INT DEFAULT 1,
  locked_price DECIMAL(10,2),         -- السعر المحجوز عند الدفع
  final_price DECIMAL(10,2),          -- السعر النهائي بعد الإغلاق

  -- الدفع
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  paid_at DATETIME,

  -- الإحالة
  referred_by INT,                    -- من دعاه
  referral_code VARCHAR(20),

  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (deal_id) REFERENCES group_deals(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (referred_by) REFERENCES group_deal_participants(id)
);

-- 4. مشاركات WhatsApp
CREATE TABLE group_deal_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deal_id INT NOT NULL,
  shared_by INT NOT NULL,
  share_platform ENUM('whatsapp', 'facebook', 'twitter', 'copy_link') NOT NULL,
  share_code VARCHAR(20) UNIQUE,      -- كود للتتبع
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (deal_id) REFERENCES group_deals(id),
  FOREIGN KEY (shared_by) REFERENCES group_deal_participants(id)
);

-- 5. إشعارات التقدم
CREATE TABLE group_deal_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deal_id INT NOT NULL,
  notification_type ENUM('milestone', 'price_drop', 'ending_soon', 'success', 'failed') NOT NULL,
  milestone_reached INT,              -- مثلاً: 50% أو 10 مشاركين
  message TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (deal_id) REFERENCES group_deals(id)
);
```

### 1.5 API Endpoints

```typescript
// server/routers/group-buying.ts

groupBuyingRouter = router({
  // إنشاء عرض جماعي جديد
  createDeal: protectedProcedure
    .input(createDealSchema)
    .mutation(async ({ input, ctx }) => { ... }),

  // الحصول على العروض النشطة
  getActiveDeals: publicProcedure
    .query(async () => { ... }),

  // الانضمام لعرض
  joinDeal: publicProcedure
    .input(joinDealSchema)
    .mutation(async ({ input }) => { ... }),

  // الحصول على تفاصيل عرض
  getDealDetails: publicProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => { ... }),

  // مشاركة عرض
  shareDeal: publicProcedure
    .input(shareDealSchema)
    .mutation(async ({ input }) => { ... }),

  // الحصول على رابط WhatsApp
  getWhatsAppShareLink: publicProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => { ... }),

  // إلغاء المشاركة
  cancelParticipation: protectedProcedure
    .input(z.object({ participationId: z.number() }))
    .mutation(async ({ input }) => { ... }),

  // إحصائيات العرض (للبائع)
  getDealStats: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => { ... }),
});
```

### 1.6 Frontend Components

```
components/group-buying/
├── GroupDealCard.tsx           # بطاقة العرض الجماعي
├── GroupDealDetails.tsx        # تفاصيل العرض
├── GroupDealProgress.tsx       # شريط التقدم
├── GroupDealTiers.tsx          # عرض مستويات الأسعار
├── JoinGroupDealForm.tsx       # نموذج الانضمام
├── ShareGroupDeal.tsx          # أزرار المشاركة
├── GroupDealCountdown.tsx      # العد التنازلي
├── ParticipantsList.tsx        # قائمة المشاركين
└── CreateGroupDealForm.tsx     # نموذج إنشاء عرض (للبائع)

pages/
├── group-deals/
│   ├── index.tsx               # قائمة العروض
│   ├── [dealId].tsx            # تفاصيل عرض
│   └── create.tsx              # إنشاء عرض جديد
```

### 1.7 Business Logic

```typescript
// server/services/group-buying-service.ts

class GroupBuyingService {
  // حساب السعر الحالي بناءً على عدد المشاركين
  calculateCurrentPrice(deal: GroupDeal): number {
    const tier = deal.tiers.find(t =>
      deal.currentParticipants >= t.minParticipants &&
      (!t.maxParticipants || deal.currentParticipants <= t.maxParticipants)
    );
    return tier?.price || deal.originalPrice;
  }

  // التحقق من نجاح العرض
  async checkDealSuccess(dealId: number): Promise<void> {
    const deal = await this.getDeal(dealId);

    if (deal.currentParticipants >= deal.minParticipants) {
      await this.markDealSuccess(dealId);
      await this.notifyAllParticipants(dealId, 'success');
      await this.createOrders(dealId);
    } else {
      await this.markDealFailed(dealId);
      await this.refundAllParticipants(dealId);
      await this.notifyAllParticipants(dealId, 'failed');
    }
  }

  // إنشاء طلبات للمشاركين عند نجاح العرض
  async createOrders(dealId: number): Promise<void> {
    const participants = await this.getParticipants(dealId);
    const finalPrice = this.calculateCurrentPrice(deal);

    for (const participant of participants) {
      await this.ordersService.createOrder({
        customerId: participant.userId,
        customerPhone: participant.participantPhone,
        items: [{
          productId: deal.productId,
          quantity: participant.quantity,
          price: finalPrice,
        }],
        source: 'group_deal',
        sourceId: dealId,
      });
    }
  }

  // إرسال إشعار milestone
  async sendMilestoneNotification(dealId: number, percentage: number): Promise<void> {
    const deal = await this.getDeal(dealId);
    const message = `🎉 وصلنا ${percentage}%! باقي ${deal.minParticipants - deal.currentParticipants} أشخاص فقط!`;

    await this.notificationService.sendToParticipants(dealId, message);
  }
}
```

### 1.8 WhatsApp Integration

```typescript
// server/services/group-buying-whatsapp.ts

class GroupBuyingWhatsAppService {
  generateShareMessage(deal: GroupDeal, shareCode: string): string {
    const currentPrice = this.groupBuyingService.calculateCurrentPrice(deal);
    const savings = deal.originalPrice - currentPrice;
    const progressPercent = (deal.currentParticipants / deal.minParticipants) * 100;

    return `
🛒 *عرض جماعي مميز!*

📦 ${deal.titleAr}

💰 السعر الأصلي: ~${deal.originalPrice} ج.م~
🔥 السعر الحالي: *${currentPrice} ج.م*
💵 توفير: ${savings} ج.م (${Math.round((savings/deal.originalPrice)*100)}%)

👥 المشاركين: ${deal.currentParticipants}/${deal.minParticipants}
📊 التقدم: ${progressPercent.toFixed(0)}%

⏰ ينتهي خلال: ${this.getTimeRemaining(deal.endTime)}

🔗 انضم الآن:
${this.generateJoinLink(deal.id, shareCode)}

كل ما زاد العدد، قل السعر! 📉
    `.trim();
  }

  generateJoinLink(dealId: number, shareCode: string): string {
    return `https://haderos.com/group-deals/${dealId}?ref=${shareCode}`;
  }

  getTimeRemaining(endTime: Date): string {
    const diff = endTime.getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ساعة و ${minutes} دقيقة`;
  }
}
```

---

## 2️⃣ نظام التوصيل بالجمهور (Crowdsourced Delivery)

### 2.1 الوصف
نظام يسمح لأي شخص لديه وسيلة نقل بتوصيل الطلبات مقابل أجر، مما يوفر توصيل أسرع وأرخص.

### 2.2 لماذا مهم لمصر؟
- مشكلة Last-mile delivery
- بطالة الشباب (فرص عمل)
- ارتفاع تكلفة شركات الشحن التقليدية
- الحاجة للتوصيل السريع (نفس اليوم)

### 2.3 المتطلبات الوظيفية

```
FR-CD-001: تسجيل السائقين مع التحقق من الهوية
FR-CD-002: إنشاء طلب توصيل
FR-CD-003: Matching ذكي (المسافة، التوفر، التقييم)
FR-CD-004: تتبع GPS مباشر
FR-CD-005: نظام التسعير الديناميكي
FR-CD-006: نظام التقييم ثنائي الاتجاه
FR-CD-007: المحفظة والدفع للسائقين
FR-CD-008: نظام الشكاوى والنزاعات
FR-CD-009: تأمين الشحنات
FR-CD-010: إشعارات real-time
```

### 2.4 Database Schema

```sql
-- جداول التوصيل بالجمهور

-- 1. السائقين
CREATE TABLE crowd_drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,

  -- معلومات شخصية
  full_name VARCHAR(100) NOT NULL,
  full_name_ar VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  national_id VARCHAR(20) NOT NULL,
  national_id_verified BOOLEAN DEFAULT FALSE,
  profile_photo VARCHAR(500),

  -- معلومات المركبة
  vehicle_type ENUM('bicycle', 'motorcycle', 'car', 'van', 'truck') NOT NULL,
  vehicle_brand VARCHAR(50),
  vehicle_model VARCHAR(50),
  vehicle_year INT,
  vehicle_plate VARCHAR(20),
  vehicle_photo VARCHAR(500),

  -- التحقق والتفعيل
  status ENUM('pending_verification', 'active', 'suspended', 'banned') DEFAULT 'pending_verification',
  verified_at DATETIME,
  verified_by INT,
  suspension_reason TEXT,

  -- الموقع والتوفر
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  last_location_update DATETIME,
  is_online BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  max_delivery_distance_km INT DEFAULT 20,

  -- الإحصائيات
  total_deliveries INT DEFAULT 0,
  successful_deliveries INT DEFAULT 0,
  cancelled_deliveries INT DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 5.00,
  total_ratings INT DEFAULT 0,

  -- المالية
  wallet_balance DECIMAL(10, 2) DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  pending_payout DECIMAL(10, 2) DEFAULT 0,

  -- المناطق المفضلة
  preferred_areas JSON,  -- ["المعادي", "القاهرة الجديدة"]

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. طلبات التوصيل
CREATE TABLE crowd_delivery_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_code VARCHAR(20) UNIQUE NOT NULL,
  order_id INT,  -- ربط بالطلب الأصلي

  -- معلومات الاستلام
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8) NOT NULL,
  pickup_lng DECIMAL(11, 8) NOT NULL,
  pickup_phone VARCHAR(20) NOT NULL,
  pickup_name VARCHAR(100),
  pickup_notes TEXT,

  -- معلومات التسليم
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10, 8) NOT NULL,
  delivery_lng DECIMAL(11, 8) NOT NULL,
  delivery_phone VARCHAR(20) NOT NULL,
  delivery_name VARCHAR(100) NOT NULL,
  delivery_notes TEXT,
  delivery_governorate VARCHAR(50),
  delivery_city VARCHAR(100),

  -- تفاصيل الشحنة
  package_type ENUM('document', 'small_package', 'medium_package', 'large_package', 'fragile', 'food') NOT NULL,
  package_weight_kg DECIMAL(5, 2),
  package_dimensions VARCHAR(50),  -- "30x20x10 cm"
  package_description TEXT,
  package_value DECIMAL(10, 2),  -- قيمة الشحنة للتأمين
  requires_signature BOOLEAN DEFAULT FALSE,

  -- التوقيت
  pickup_time_from DATETIME,
  pickup_time_to DATETIME,
  delivery_time_from DATETIME,
  delivery_time_to DATETIME,
  is_express BOOLEAN DEFAULT FALSE,  -- توصيل سريع

  -- المسافة والتكلفة
  distance_km DECIMAL(6, 2),
  estimated_duration_minutes INT,
  base_fee DECIMAL(10, 2) NOT NULL,
  express_fee DECIMAL(10, 2) DEFAULT 0,
  total_fee DECIMAL(10, 2) NOT NULL,
  driver_payout DECIMAL(10, 2),  -- المبلغ للسائق
  platform_fee DECIMAL(10, 2),   -- عمولة المنصة

  -- الحالة
  status ENUM(
    'pending',           -- في انتظار سائق
    'driver_assigned',   -- تم تعيين سائق
    'driver_heading_pickup', -- السائق في الطريق للاستلام
    'picked_up',         -- تم الاستلام
    'in_transit',        -- في الطريق
    'arrived',           -- وصل للعميل
    'delivered',         -- تم التسليم
    'cancelled',         -- ملغي
    'failed'             -- فشل التوصيل
  ) DEFAULT 'pending',

  -- السائق
  assigned_driver_id INT,
  driver_assigned_at DATETIME,

  -- COD
  cod_amount DECIMAL(10, 2) DEFAULT 0,  -- المبلغ المطلوب من العميل
  cod_collected BOOLEAN DEFAULT FALSE,
  cod_collected_at DATETIME,

  -- التتبع
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  last_tracking_update DATETIME,

  -- التوقيتات الفعلية
  picked_up_at DATETIME,
  delivered_at DATETIME,
  cancelled_at DATETIME,
  cancellation_reason TEXT,
  cancelled_by ENUM('customer', 'driver', 'system'),

  -- إثبات التسليم
  delivery_proof_photo VARCHAR(500),
  recipient_signature VARCHAR(500),
  recipient_name_confirmed VARCHAR(100),

  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (assigned_driver_id) REFERENCES crowd_drivers(id)
);

-- 3. عروض السائقين على الطلبات
CREATE TABLE crowd_delivery_bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  driver_id INT NOT NULL,

  bid_amount DECIMAL(10, 2) NOT NULL,  -- المبلغ المطلوب
  estimated_pickup_time INT,  -- بالدقائق
  estimated_delivery_time INT,
  driver_notes TEXT,

  status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,

  FOREIGN KEY (request_id) REFERENCES crowd_delivery_requests(id),
  FOREIGN KEY (driver_id) REFERENCES crowd_drivers(id),
  UNIQUE KEY unique_bid (request_id, driver_id)
);

-- 4. تتبع الموقع
CREATE TABLE crowd_delivery_tracking (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  driver_id INT NOT NULL,

  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  speed_kmh DECIMAL(5, 2),
  heading INT,  -- الاتجاه بالدرجات
  accuracy_meters INT,

  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES crowd_delivery_requests(id),
  FOREIGN KEY (driver_id) REFERENCES crowd_drivers(id),
  INDEX idx_request_time (request_id, recorded_at)
);

-- 5. التقييمات
CREATE TABLE crowd_delivery_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,

  -- تقييم السائق للعميل
  driver_to_customer_rating INT,  -- 1-5
  driver_to_customer_comment TEXT,

  -- تقييم العميل للسائق
  customer_to_driver_rating INT,  -- 1-5
  customer_to_driver_comment TEXT,
  customer_to_driver_tags JSON,  -- ["سريع", "مهذب", "حافظ على الشحنة"]

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES crowd_delivery_requests(id)
);

-- 6. محفظة السائق
CREATE TABLE crowd_driver_wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,

  transaction_type ENUM('delivery_earning', 'tip', 'bonus', 'payout', 'penalty', 'adjustment') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,

  related_request_id INT,
  description TEXT,
  description_ar TEXT,

  -- للسحب
  payout_method ENUM('bank_transfer', 'wallet', 'vodafone_cash') NULL,
  payout_reference VARCHAR(100),
  payout_status ENUM('pending', 'processing', 'completed', 'failed') NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (driver_id) REFERENCES crowd_drivers(id),
  FOREIGN KEY (related_request_id) REFERENCES crowd_delivery_requests(id)
);

-- 7. مناطق التسعير
CREATE TABLE crowd_delivery_zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  zone_name VARCHAR(100) NOT NULL,
  zone_name_ar VARCHAR(100),
  governorate VARCHAR(50) NOT NULL,

  base_price DECIMAL(10, 2) NOT NULL,
  price_per_km DECIMAL(5, 2) NOT NULL,
  express_multiplier DECIMAL(3, 2) DEFAULT 1.5,
  peak_hour_multiplier DECIMAL(3, 2) DEFAULT 1.3,

  -- أوقات الذروة
  peak_hours JSON,  -- [{"start": "12:00", "end": "14:00"}, {"start": "18:00", "end": "21:00"}]

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.5 API Endpoints

```typescript
// server/routers/crowd-delivery.ts

crowdDeliveryRouter = router({
  // === للسائقين ===

  // تسجيل كسائق
  registerDriver: protectedProcedure
    .input(registerDriverSchema)
    .mutation(async ({ input, ctx }) => { ... }),

  // تحديث الموقع
  updateLocation: protectedProcedure
    .input(z.object({ lat: z.number(), lng: z.number() }))
    .mutation(async ({ input, ctx }) => { ... }),

  // تغيير حالة التوفر
  toggleAvailability: protectedProcedure
    .input(z.object({ isAvailable: z.boolean() }))
    .mutation(async ({ input, ctx }) => { ... }),

  // الحصول على الطلبات القريبة
  getNearbyRequests: protectedProcedure
    .query(async ({ ctx }) => { ... }),

  // تقديم عرض على طلب
  submitBid: protectedProcedure
    .input(submitBidSchema)
    .mutation(async ({ input, ctx }) => { ... }),

  // قبول طلب (للسائق)
  acceptRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ input, ctx }) => { ... }),

  // تحديث حالة الطلب
  updateDeliveryStatus: protectedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ input, ctx }) => { ... }),

  // رفع صورة إثبات التسليم
  uploadDeliveryProof: protectedProcedure
    .input(uploadProofSchema)
    .mutation(async ({ input, ctx }) => { ... }),

  // سحب الأرباح
  requestPayout: protectedProcedure
    .input(payoutSchema)
    .mutation(async ({ input, ctx }) => { ... }),

  // === للعملاء ===

  // إنشاء طلب توصيل
  createDeliveryRequest: protectedProcedure
    .input(createRequestSchema)
    .mutation(async ({ input, ctx }) => { ... }),

  // حساب تكلفة التوصيل
  calculateDeliveryFee: publicProcedure
    .input(calculateFeeSchema)
    .query(async ({ input }) => { ... }),

  // تتبع الشحنة
  trackDelivery: publicProcedure
    .input(z.object({ requestCode: z.string() }))
    .query(async ({ input }) => { ... }),

  // تقييم السائق
  rateDriver: protectedProcedure
    .input(rateDriverSchema)
    .mutation(async ({ input, ctx }) => { ... }),

  // === إدارة ===

  // الموافقة على سائق
  approveDriver: protectedProcedure
    .input(z.object({ driverId: z.number() }))
    .mutation(async ({ input, ctx }) => { ... }),

  // إحصائيات
  getDeliveryStats: protectedProcedure
    .query(async ({ ctx }) => { ... }),
});
```

### 2.6 Matching Algorithm

```typescript
// server/services/crowd-delivery-matching.ts

class DeliveryMatchingService {
  async findBestDrivers(request: DeliveryRequest, limit: number = 5): Promise<CrowdDriver[]> {
    const nearbyDrivers = await this.getNearbyDrivers(
      request.pickupLat,
      request.pickupLng,
      20 // km radius
    );

    const scoredDrivers = nearbyDrivers.map(driver => ({
      driver,
      score: this.calculateMatchScore(driver, request),
    }));

    return scoredDrivers
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(sd => sd.driver);
  }

  private calculateMatchScore(driver: CrowdDriver, request: DeliveryRequest): number {
    let score = 0;

    // 1. المسافة (0-30 نقطة)
    const distanceKm = this.calculateDistance(
      driver.currentLat, driver.currentLng,
      request.pickupLat, request.pickupLng
    );
    score += Math.max(0, 30 - distanceKm * 2);

    // 2. التقييم (0-25 نقطة)
    score += driver.averageRating * 5;

    // 3. معدل النجاح (0-20 نقطة)
    if (driver.totalDeliveries > 0) {
      const successRate = driver.successfulDeliveries / driver.totalDeliveries;
      score += successRate * 20;
    }

    // 4. نوع المركبة (0-15 نقطة)
    if (this.isVehicleSuitable(driver.vehicleType, request.packageType)) {
      score += 15;
    }

    // 5. المنطقة المفضلة (0-10 نقاط)
    if (driver.preferredAreas?.includes(request.deliveryGovernorate)) {
      score += 10;
    }

    return score;
  }

  private isVehicleSuitable(vehicleType: string, packageType: string): boolean {
    const suitability = {
      document: ['bicycle', 'motorcycle', 'car', 'van'],
      small_package: ['motorcycle', 'car', 'van'],
      medium_package: ['car', 'van'],
      large_package: ['van', 'truck'],
      fragile: ['car', 'van'],
      food: ['motorcycle', 'car'],
    };
    return suitability[packageType]?.includes(vehicleType) || false;
  }
}
```

---

## 3️⃣ نظام مجموعات الشراء المجتمعية (Community Buying Groups)

### 3.1 الوصف
نظام يسمح بإنشاء مجموعات شراء في الأحياء/العمارات، مع قائد محلي (Leader) يجمع الطلبات ويوزعها.

### 3.2 لماذا مهم لمصر؟
- ثقافة الجيرة والتعاون في مصر
- توفير مصاريف الشحن (توصيل واحد للمجموعة)
- الثقة (الشراء من خلال شخص معروف)
- فرصة دخل للـ Leaders

### 3.3 Database Schema

```sql
-- جداول مجموعات الشراء المجتمعية

-- 1. المجموعات
CREATE TABLE community_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_code VARCHAR(20) UNIQUE NOT NULL,

  -- معلومات المجموعة
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  description TEXT,
  description_ar TEXT,
  group_type ENUM('residential', 'office', 'university', 'club', 'other') NOT NULL,

  -- الموقع
  governorate VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  area VARCHAR(100) NOT NULL,
  address TEXT,
  address_ar TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),

  -- القائد
  leader_id INT NOT NULL,
  leader_commission_rate DECIMAL(4, 2) DEFAULT 5.00,  -- نسبة العمولة

  -- الإعدادات
  min_order_amount DECIMAL(10, 2) DEFAULT 100,  -- الحد الأدنى للطلب
  collection_day ENUM('saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'),
  collection_time_from TIME,
  collection_time_to TIME,
  max_members INT DEFAULT 50,

  -- الإحصائيات
  members_count INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,

  -- الحالة
  status ENUM('pending_approval', 'active', 'paused', 'closed') DEFAULT 'pending_approval',
  approved_at DATETIME,
  approved_by INT,

  -- الصور
  group_photo VARCHAR(500),
  leader_photo VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (leader_id) REFERENCES users(id)
);

-- 2. أعضاء المجموعة
CREATE TABLE community_group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,

  member_name VARCHAR(100) NOT NULL,
  member_phone VARCHAR(20) NOT NULL,
  apartment_number VARCHAR(20),  -- رقم الشقة/الوحدة
  floor_number VARCHAR(10),
  building_number VARCHAR(20),

  -- الحالة
  status ENUM('pending', 'active', 'removed') DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- الإحصائيات
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,

  FOREIGN KEY (group_id) REFERENCES community_groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_membership (group_id, user_id)
);

-- 3. جولات الطلب
CREATE TABLE community_order_rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  round_code VARCHAR(20) UNIQUE NOT NULL,
  group_id INT NOT NULL,

  -- الفترة
  title VARCHAR(100),
  title_ar VARCHAR(100),
  order_start DATETIME NOT NULL,
  order_deadline DATETIME NOT NULL,
  collection_date DATE NOT NULL,
  collection_time_from TIME,
  collection_time_to TIME,

  -- الإحصائيات
  orders_count INT DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,

  -- الحالة
  status ENUM('open', 'closed', 'processing', 'ready', 'distributed', 'completed') DEFAULT 'open',

  -- القائد
  leader_commission DECIMAL(10, 2) DEFAULT 0,
  leader_paid BOOLEAN DEFAULT FALSE,
  leader_paid_at DATETIME,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (group_id) REFERENCES community_groups(id)
);

-- 4. طلبات الأعضاء
CREATE TABLE community_member_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(20) UNIQUE NOT NULL,
  round_id INT NOT NULL,
  member_id INT NOT NULL,

  -- المنتجات
  items JSON NOT NULL,  -- [{productId, name, quantity, price}]
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- الحالة
  status ENUM('pending', 'confirmed', 'cancelled', 'picked_up') DEFAULT 'pending',
  confirmed_at DATETIME,
  picked_up_at DATETIME,
  picked_up_signature VARCHAR(500),

  -- الدفع
  payment_method ENUM('cash_on_collection', 'wallet', 'card') DEFAULT 'cash_on_collection',
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  paid_at DATETIME,

  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (round_id) REFERENCES community_order_rounds(id),
  FOREIGN KEY (member_id) REFERENCES community_group_members(id)
);

-- 5. عمولات القائد
CREATE TABLE community_leader_earnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leader_id INT NOT NULL,
  group_id INT NOT NULL,
  round_id INT NOT NULL,

  round_total DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(4, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,

  -- السحب
  payout_status ENUM('pending', 'requested', 'paid') DEFAULT 'pending',
  payout_method VARCHAR(50),
  payout_reference VARCHAR(100),
  paid_at DATETIME,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (leader_id) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES community_groups(id),
  FOREIGN KEY (round_id) REFERENCES community_order_rounds(id)
);
```

### 3.4 Frontend Components

```
components/community-groups/
├── GroupCard.tsx              # بطاقة المجموعة
├── GroupDetails.tsx           # تفاصيل المجموعة
├── JoinGroupForm.tsx          # الانضمام لمجموعة
├── CreateGroupForm.tsx        # إنشاء مجموعة جديدة
├── OrderRoundCard.tsx         # بطاقة جولة الطلب
├── MemberOrderForm.tsx        # نموذج طلب العضو
├── LeaderDashboard.tsx        # لوحة تحكم القائد
├── MembersList.tsx            # قائمة الأعضاء
├── OrdersDistribution.tsx     # توزيع الطلبات
├── LeaderEarnings.tsx         # أرباح القائد
└── NearbyGroups.tsx           # المجموعات القريبة

pages/
├── community/
│   ├── index.tsx              # استكشاف المجموعات
│   ├── [groupId]/
│   │   ├── index.tsx          # تفاصيل المجموعة
│   │   ├── order.tsx          # صفحة الطلب
│   │   └── manage.tsx         # إدارة (للقائد)
│   ├── create.tsx             # إنشاء مجموعة
│   └── my-groups.tsx          # مجموعاتي
```

---

# المرحلة الثانية: الأولوية المتوسطة (6 أشهر)

---

## 4️⃣ نظام الخزائن الذكية (Smart Lockers)

### 4.1 الوصف
نقاط استلام ذاتية في المولات والمحطات والجامعات.

### 4.2 المتطلبات
```
- شراكات مع مشغلي المولات
- أجهزة IoT للخزائن
- نظام OTP للفتح
- تكامل مع نظام الشحن
```

### 4.3 Database Schema (مختصر)

```sql
-- مواقع الخزائن
CREATE TABLE smart_locker_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_code VARCHAR(20) UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  location_type ENUM('mall', 'metro', 'university', 'residential', 'office'),
  total_lockers INT,
  available_lockers INT,
  is_active BOOLEAN DEFAULT TRUE
);

-- الخزائن الفردية
CREATE TABLE smart_lockers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT NOT NULL,
  locker_number VARCHAR(10),
  size ENUM('small', 'medium', 'large', 'extra_large'),
  status ENUM('available', 'occupied', 'maintenance'),
  current_order_id INT,
  FOREIGN KEY (location_id) REFERENCES smart_locker_locations(id)
);

-- حجوزات الخزائن
CREATE TABLE locker_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  locker_id INT NOT NULL,
  order_id INT NOT NULL,
  otp_code VARCHAR(6),
  reserved_at DATETIME,
  expires_at DATETIME,
  collected_at DATETIME,
  status ENUM('reserved', 'stored', 'collected', 'expired'),
  FOREIGN KEY (locker_id) REFERENCES smart_lockers(id)
);
```

---

## 5️⃣ Mini Programs (تطبيقات مصغرة)

### 5.1 الوصف
تطبيقات خفيفة تعمل داخل HADEROS بدون تحميل.

### 5.2 المتطلبات
```
- Mini App Framework (مثل iframe sandbox)
- SDK للمطورين
- Marketplace للتطبيقات
- نظام الصلاحيات
```

### 5.3 أمثلة للتطبيقات
```
- تطبيق حجز المواعيد
- تطبيق المقارنة
- تطبيق الضمان والصيانة
- ألعاب ترويجية (Spin Wheel)
```

---

# المرحلة الثالثة: الأولوية المستقبلية

---

## 6️⃣ AR/VR Visualization

```
- Three.js للعرض ثلاثي الأبعاد
- AR.js للواقع المعزز
- تجربة الملابس/الأثاث افتراضياً
- يحتاج هواتف حديثة
```

## 7️⃣ Voice Commerce

```
- تكامل مع Google Speech API (للعربية)
- الطلب عبر الصوت
- البحث الصوتي
- مساعد صوتي (KAIA Voice)
```

## 8️⃣ Carbon Footprint Tracking

```
- حساب البصمة الكربونية للشحن
- خيار الشحن الأخضر
- شهادات المنتجات الصديقة للبيئة
- برنامج تعويض الكربون
```

---

# 📊 الجدول الزمني المقترح

```
                    2026
      Q1          Q2          Q3          Q4
  ─────────────────────────────────────────────

  المرحلة 1 (أولوية قصوى):
  ├─ Group Buying ────────┤
  │     ├─ Schema Design   │
  │     ├─ Backend API     │
  │     ├─ Frontend        │
  │     └─ Testing         │
  │
  ├─ Crowdsourced Delivery ──────────┤
  │     ├─ Driver App               │
  │     ├─ Matching System          │
  │     ├─ Tracking & GPS           │
  │     └─ Payments                 │
  │
  └─ Community Groups ────────────┤
        ├─ Leader Portal          │
        ├─ Member Portal          │
        └─ Distribution System    │

                              المرحلة 2:
                              ├─ Smart Lockers ─────────┤
                              └─ Mini Programs ─────────┤

                                              المرحلة 3:
                                              ├─ AR/VR ──┤
                                              ├─ Voice ──┤
                                              └─ Green ──┤
```

---

# 💰 تقدير التكلفة

| الميزة | الجهد (أيام مطور) | التكلفة التقديرية |
|--------|-------------------|-------------------|
| Group Buying | 30 يوم | 60,000 ج.م |
| Crowdsourced Delivery | 60 يوم | 120,000 ج.م |
| Community Groups | 40 يوم | 80,000 ج.م |
| Smart Lockers | 50 يوم + Hardware | 200,000+ ج.م |
| Mini Programs | 45 يوم | 90,000 ج.م |
| AR/VR | 40 يوم | 80,000 ج.م |
| Voice Commerce | 30 يوم | 60,000 ج.م |
| Carbon Tracking | 15 يوم | 30,000 ج.م |

**الإجمالي التقريبي: 720,000+ ج.م**

---

# ✅ الخطوات التالية

1. [ ] الموافقة على الأولويات
2. [ ] تخصيص الموارد (مطورين)
3. [ ] إنشاء ملفات Schema الفعلية
4. [ ] بدء تطوير Group Buying
5. [ ] اختبار مع مجموعة محدودة
6. [ ] الإطلاق التدريجي

---

**تم إعداد هذه الخطة بواسطة:** Claude AI
**تاريخ:** 2 يناير 2026
