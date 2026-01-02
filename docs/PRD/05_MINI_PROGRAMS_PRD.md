# Product Requirements Document (PRD)
# نظام البرامج المصغرة - Mini Programs Platform

---

## معلومات المستند

| البند | القيمة |
|-------|--------|
| **رقم المستند** | PRD-HADEROS-MP-005 |
| **الإصدار** | 1.0 |
| **تاريخ الإنشاء** | 2 يناير 2026 |
| **الحالة** | مسودة للمراجعة |

---

## 1. نظرة عامة (Overview)

### 1.1 ملخص تنفيذي
نظام البرامج المصغرة (Mini Programs) يتيح للتجار والمطورين إنشاء تطبيقات خفيفة تعمل داخل منصة HADEROS دون الحاجة لتحميلها من متجر التطبيقات، مستوحى من نموذج WeChat Mini Programs الناجح في الصين.

### 1.2 ما هي البرامج المصغرة؟

```
┌─────────────────────────────────────────────────────────────────────┐
│                     تطبيق HADEROS الرئيسي                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │ │
│  │  │ متجر    │  │ حجز     │  │ مطعم    │  │ خدمات   │         │ │
│  │  │ ملابس   │  │ فنادق   │  │ بيتزا   │  │ حكومية  │         │ │
│  │  │         │  │         │  │         │  │         │         │ │
│  │  │ [Mini]  │  │ [Mini]  │  │ [Mini]  │  │ [Mini]  │         │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │ │
│  │                                                               │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │ │
│  │  │ عيادة   │  │ صالون   │  │ لياقة   │  │ تعليم   │         │ │
│  │  │ طبية    │  │ تجميل   │  │ بدنية   │  │ أونلاين │         │ │
│  │  │         │  │         │  │         │  │         │         │ │
│  │  │ [Mini]  │  │ [Mini]  │  │ [Mini]  │  │ [Mini]  │         │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │ │
│  │                                                               │ │
│  │            كل هذه "تطبيقات" تعمل داخل HADEROS                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  المزايا:                                                           │
│  ✓ لا حاجة للتحميل من App Store                                    │
│  ✓ تفتح فوراً                                                       │
│  ✓ مشاركة الدفع والعناوين مع HADEROS                               │
│  ✓ أخف وأسرع من التطبيقات العادية                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 لماذا مهم لمصر؟

```
📱 مشاكل التطبيقات التقليدية في مصر:
   ├── مساحة التخزين محدودة في الهواتف
   ├── سرعة الإنترنت بطيئة للتحميل
   ├── تجربة مفككة (تطبيق لكل خدمة)
   └── تكلفة تطوير عالية للتجار الصغار

💡 الحل مع Mini Programs:
   ├── لا تأخذ مساحة
   ├── تفتح خلال ثواني
   ├── كل الخدمات في مكان واحد
   └── تكلفة تطوير أقل 80%
```

### 1.4 أنواع البرامج المصغرة

| النوع | الوصف | أمثلة |
|-------|-------|-------|
| **E-Commerce** | متاجر إلكترونية | متجر ملابس، محل إلكترونيات |
| **Services** | حجز خدمات | عيادة، صالون، ورشة سيارات |
| **Food & Beverage** | طعام ومشروبات | مطعم، كافيه، بقالة |
| **Entertainment** | ترفيه | ألعاب، مسابقات، بث مباشر |
| **Utilities** | أدوات مساعدة | حاسبة، تحويل عملات |
| **Government** | خدمات حكومية | تجديد رخصة، دفع فواتير |

### 1.5 الجمهور المستهدف

**المطورون:**
| الشريحة | المستوى | الأدوات المناسبة |
|---------|--------|-----------------|
| مطورون محترفون | متقدم | SDK كامل، APIs |
| وكالات تطوير | متوسط-متقدم | Templates + SDK |
| رواد أعمال تقنيون | متوسط | Low-code builder |
| تجار بدون خبرة تقنية | مبتدئ | No-code templates |

**التجار:**
| الحجم | الاحتياج | نوع البرنامج |
|-------|---------|-------------|
| متاجر صغيرة | واجهة بسيطة للبيع | Template جاهز |
| متاجر متوسطة | تخصيص وتكاملات | Low-code + APIs |
| علامات تجارية كبيرة | تجربة مخصصة بالكامل | تطوير كامل |

---

## 2. المتطلبات الوظيفية (Functional Requirements)

### 2.1 منصة التطوير (Developer Platform)

#### FR-MP-001: بيئة التطوير (IDE)
**الوصف:** بيئة تطوير متكاملة لإنشاء البرامج المصغرة

```typescript
interface MiniProgramIDE {
  features: {
    // محرر الكود
    codeEditor: {
      languages: ['typescript', 'javascript', 'html', 'css'];
      intellisense: true;
      autoComplete: true;
      linting: true;
      formatting: true;
    };

    // معاينة مباشرة
    livePreview: {
      simulator: true;           // محاكي الهاتف
      hotReload: true;           // تحديث فوري
      deviceFrames: ['iphone', 'android', 'tablet'];
      debugger: true;            // أدوات التصحيح
    };

    // إدارة الملفات
    fileExplorer: {
      structure: 'project-based';
      templates: true;
      versionControl: 'git';
    };

    // أدوات مساعدة
    tools: {
      componentLibrary: true;    // مكتبة المكونات
      apiExplorer: true;         // مستكشف APIs
      assetManager: true;        // إدارة الصور والملفات
      performanceProfiler: true; // قياس الأداء
    };
  };
}
```

**واجهة بيئة التطوير:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  HADEROS Mini Program IDE                                 [_][□][X] │
├──────────────┬──────────────────────────────┬───────────────────────┤
│ Explorer     │ app.tsx                  [x] │ 📱 Preview           │
│ ────────     │ ─────────────────────────────│ ───────────────────── │
│ 📁 src/      │  1 import { View } from '@h';│ ┌───────────────────┐ │
│   📄 app.tsx │  2                           │ │                   │ │
│   📄 home.tsx│  3 export default function() │ │   متجر الموضة     │ │
│   📄 cart.tsx│  4 {                         │ │   ─────────────   │ │
│ 📁 assets/   │  5   return (                │ │   [صورة منتج]     │ │
│   🖼️ logo.png│  6     <View>                │ │                   │ │
│ 📁 styles/   │  7       <Header />          │ │   قميص قطن        │ │
│   📄 main.css│  8       <Products />        │ │   150 ج.م         │ │
│              │  9     </View>               │ │   [أضف للسلة]     │ │
│              │ 10   );                      │ │                   │ │
│ Components   │ 11 }                         │ └───────────────────┘ │
│ ──────────   │                              │                       │
│ 🔲 Button    │ Problems  Output  Terminal   │ Console:              │
│ 📝 Input     │ ─────────────────────────────│ ───────────────────── │
│ 📋 List      │ ✓ No errors found           │ > App rendered        │
│ 🖼️ Image     │                              │ > API connected       │
│ 📊 Chart     │                              │                       │
├──────────────┴──────────────────────────────┴───────────────────────┤
│ [▶ Run] [🔨 Build] [📤 Publish] [🧪 Test]              Ready ✓     │
└─────────────────────────────────────────────────────────────────────┘
```

#### FR-MP-002: SDK وAPIs
**الوصف:** مجموعة أدوات التطوير والواجهات البرمجية

```typescript
// HADEROS Mini Program SDK
interface HaderosMiniProgramSDK {
  // ==================== Core APIs ====================

  // التنقل
  navigation: {
    navigateTo(path: string): Promise<void>;
    redirectTo(path: string): Promise<void>;
    navigateBack(): Promise<void>;
    switchTab(tabId: string): Promise<void>;
  };

  // التخزين المحلي
  storage: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
  };

  // الشبكة
  network: {
    request(options: RequestOptions): Promise<Response>;
    uploadFile(options: UploadOptions): Promise<UploadResult>;
    downloadFile(url: string): Promise<DownloadResult>;
  };

  // ==================== HADEROS Integration ====================

  // المستخدم
  user: {
    getProfile(): Promise<UserProfile>;
    login(): Promise<LoginResult>;
    isLoggedIn(): boolean;
    getAuthToken(): string;
  };

  // الدفع
  payment: {
    requestPayment(options: PaymentOptions): Promise<PaymentResult>;
    getSavedCards(): Promise<Card[]>;
    getWalletBalance(): Promise<number>;
  };

  // العنوان
  address: {
    getSavedAddresses(): Promise<Address[]>;
    selectAddress(): Promise<Address>;
    getCurrentLocation(): Promise<Location>;
  };

  // السلة المشتركة
  cart: {
    addToGlobalCart(item: CartItem): Promise<void>;
    getGlobalCart(): Promise<CartItem[]>;
    checkout(): Promise<Order>;
  };

  // المشاركة
  share: {
    shareToFeed(content: ShareContent): Promise<void>;
    shareToChat(content: ShareContent): Promise<void>;
    copyLink(): Promise<string>;
  };

  // ==================== Device APIs ====================

  // الكاميرا
  camera: {
    takePhoto(): Promise<Photo>;
    scanQR(): Promise<string>;
    selectFromGallery(): Promise<Photo[]>;
  };

  // الموقع
  location: {
    getCurrentPosition(): Promise<Coordinates>;
    openMap(location: Coordinates): Promise<void>;
    calculateDistance(from: Coordinates, to: Coordinates): number;
  };

  // الإشعارات
  notifications: {
    requestPermission(): Promise<boolean>;
    subscribe(topic: string): Promise<void>;
    unsubscribe(topic: string): Promise<void>;
  };

  // ==================== UI Components ====================

  ui: {
    showToast(message: string): void;
    showLoading(message?: string): void;
    hideLoading(): void;
    showModal(options: ModalOptions): Promise<ModalResult>;
    showActionSheet(options: ActionSheetOptions): Promise<number>;
    showDatePicker(): Promise<Date>;
  };
}

// مثال استخدام
async function handlePurchase(productId: string) {
  // التحقق من تسجيل الدخول
  if (!haderos.user.isLoggedIn()) {
    await haderos.user.login();
  }

  // الحصول على العنوان
  const address = await haderos.address.selectAddress();

  // الدفع
  const paymentResult = await haderos.payment.requestPayment({
    amount: 150,
    currency: 'EGP',
    description: 'شراء قميص قطن',
    orderId: 'ORD-12345',
  });

  if (paymentResult.success) {
    haderos.ui.showToast('تم الشراء بنجاح!');
  }
}
```

#### FR-MP-003: قوالب جاهزة (Templates)
**الوصف:** قوالب جاهزة للاستخدام لمختلف أنواع الأعمال

```typescript
interface MiniProgramTemplate {
  id: string;
  name: string;
  nameAr: string;
  category: 'ecommerce' | 'services' | 'food' | 'entertainment' | 'utilities';
  description: string;

  features: string[];
  pages: string[];
  preview: string[];           // صور المعاينة

  customization: {
    colors: boolean;
    fonts: boolean;
    layout: boolean;
    components: boolean;
  };

  pricing: {
    free: boolean;
    monthlyFee?: number;
    setupFee?: number;
  };
}

// القوالب المتاحة
const availableTemplates: MiniProgramTemplate[] = [
  {
    id: 'tpl-ecommerce-basic',
    name: 'Basic E-Commerce Store',
    nameAr: 'متجر إلكتروني أساسي',
    category: 'ecommerce',
    description: 'متجر بسيط لعرض وبيع المنتجات',
    features: [
      'كتالوج المنتجات',
      'سلة التسوق',
      'الدفع المتكامل',
      'تتبع الطلبات',
      'إشعارات الطلبات',
    ],
    pages: ['home', 'products', 'product-detail', 'cart', 'checkout', 'orders', 'profile'],
    preview: ['/templates/ecommerce-1.png', '/templates/ecommerce-2.png'],
    customization: {
      colors: true,
      fonts: true,
      layout: false,
      components: false,
    },
    pricing: {
      free: true,
    },
  },
  {
    id: 'tpl-restaurant',
    name: 'Restaurant & Cafe',
    nameAr: 'مطعم وكافيه',
    category: 'food',
    description: 'قائمة طعام رقمية مع طلب وتوصيل',
    features: [
      'قائمة الطعام التفاعلية',
      'صور عالية الجودة',
      'تخصيص الطلب',
      'طلب للتوصيل أو الاستلام',
      'حجز طاولة',
      'عروض وخصومات',
    ],
    pages: ['menu', 'item-detail', 'customize', 'cart', 'checkout', 'reservations', 'orders'],
    preview: ['/templates/restaurant-1.png', '/templates/restaurant-2.png'],
    customization: {
      colors: true,
      fonts: true,
      layout: true,
      components: true,
    },
    pricing: {
      free: false,
      monthlyFee: 199,
      setupFee: 0,
    },
  },
  {
    id: 'tpl-booking',
    name: 'Appointment Booking',
    nameAr: 'حجز مواعيد',
    category: 'services',
    description: 'نظام حجز مواعيد للعيادات والصالونات',
    features: [
      'تقويم المواعيد المتاحة',
      'حجز فوري',
      'تذكيرات تلقائية',
      'إدارة الموظفين',
      'دفع مقدم اختياري',
      'تقييمات العملاء',
    ],
    pages: ['services', 'staff', 'calendar', 'booking', 'confirmation', 'my-bookings'],
    preview: ['/templates/booking-1.png', '/templates/booking-2.png'],
    customization: {
      colors: true,
      fonts: true,
      layout: true,
      components: true,
    },
    pricing: {
      free: false,
      monthlyFee: 299,
      setupFee: 500,
    },
  },
];
```

**واجهة اختيار القالب:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  اختر قالب لبرنامجك المصغر                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [All] [التجارة] [المطاعم] [الخدمات] [الترفيه] [الأدوات]           │
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐│
│  │  ┌─────────────┐  │  │  ┌─────────────┐  │  │  ┌─────────────┐  ││
│  │  │   [صورة]    │  │  │  │   [صورة]    │  │  │  │   [صورة]    │  ││
│  │  │   معاينة    │  │  │  │   معاينة    │  │  │  │   معاينة    │  ││
│  │  └─────────────┘  │  │  └─────────────┘  │  │  └─────────────┘  ││
│  │                   │  │                   │  │                   ││
│  │  متجر إلكتروني   │  │  مطعم وكافيه      │  │  حجز مواعيد       ││
│  │  أساسي           │  │                   │  │                   ││
│  │                   │  │  قائمة طعام      │  │  للعيادات         ││
│  │  ⭐ مجاني        │  │  رقمية تفاعلية   │  │  والصالونات       ││
│  │                   │  │                   │  │                   ││
│  │  [معاينة] [اختر] │  │  💰 199 ج.م/شهر  │  │  💰 299 ج.م/شهر  ││
│  │                   │  │                   │  │                   ││
│  └───────────────────┘  │  [معاينة] [اختر] │  │  [معاينة] [اختر] ││
│                         │                   │  │                   ││
│                         └───────────────────┘  └───────────────────┘│
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐│
│  │  برنامج ولاء     │  │  مسابقات وألعاب   │  │  خدمات حكومية     ││
│  │  ...              │  │  ...              │  │  ...              ││
│  └───────────────────┘  └───────────────────┘  └───────────────────┘│
│                                                                     │
│  [1] [2] [3] [4] [>]                          عرض 12 من أصل 48     │
└─────────────────────────────────────────────────────────────────────┘
```

#### FR-MP-004: No-Code Builder
**الوصف:** أداة بناء بدون كود للتجار غير التقنيين

```
┌─────────────────────────────────────────────────────────────────────┐
│  HADEROS Mini Program Builder                                       │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│  العناصر     │     📱 الصفحة الرئيسية                              │
│  ────────    │     ──────────────────                               │
│              │     ┌────────────────────────────────────┐          │
│  📝 نص       │     │         [شعار المتجر]              │ ← سحب    │
│  ────        │     │                                    │    وإفلات │
│  🖼️ صورة     │     │  ┌──────────┐  ┌──────────┐      │          │
│  ────        │     │  │ [منتج 1] │  │ [منتج 2] │      │          │
│  🔲 زر       │     │  │ 150 ج.م  │  │ 200 ج.م  │      │          │
│  ────        │     │  └──────────┘  └──────────┘      │          │
│  📋 قائمة    │     │                                    │          │
│  ────        │     │  ┌──────────┐  ┌──────────┐      │          │
│  🛒 سلة      │     │  │ [منتج 3] │  │ [منتج 4] │      │          │
│  ────        │     │  │ 175 ج.م  │  │ 250 ج.م  │      │          │
│  📊 إحصائيات │     │  └──────────┘  └──────────┘      │          │
│  ────        │     │                                    │          │
│  📍 خريطة   │     │     [زر عرض المزيد]               │          │
│              │     │                                    │          │
│              │     └────────────────────────────────────┘          │
│              │                                                      │
│  الصفحات     │     خصائص العنصر:                                   │
│  ───────     │     ┌─────────────────────────────────────────────┐ │
│  📄 الرئيسية │     │ 📷 صورة المنتج:  [اختر صورة]               │ │
│  📄 المنتجات│     │ 📝 اسم المنتج:   [قميص قطن أبيض]           │ │
│  📄 السلة    │     │ 💰 السعر:        [150] ج.م                 │ │
│  📄 حسابي    │     │ 🔗 الرابط:       [صفحة المنتج ▼]           │ │
│  + إضافة    │     └─────────────────────────────────────────────┘ │
│              │                                                      │
├──────────────┴──────────────────────────────────────────────────────┤
│  [حفظ] [معاينة] [نشر]                       آخر حفظ: منذ 5 دقائق │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 متجر البرامج المصغرة (Mini Program Store)

#### FR-MP-005: اكتشاف البرامج المصغرة
**الوصف:** واجهة للمستخدمين لاكتشاف واستخدام البرامج المصغرة

**واجهة المتجر:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  🔍 ابحث عن متجر، خدمة، أو تطبيق...                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📍 بالقرب منك                                          [عرض الكل] │
│  ─────────────────────────────────────────────────────────────────  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │[شعار]  │ │[شعار]  │ │[شعار]  │ │[شعار]  │ │[شعار]  │      │
│  │بيتزا   │ │صالون   │ │صيدلية  │ │كافيه   │ │سوبر    │      │
│  │هت      │ │ليلى    │ │العزبي  │ │كوستا   │ │ماركت   │      │
│  │⭐ 4.8  │ │⭐ 4.5  │ │⭐ 4.7  │ │⭐ 4.6  │ │⭐ 4.4  │      │
│  │0.5 كم  │ │0.8 كم  │ │1.2 كم  │ │1.5 كم  │ │2.0 كم  │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                                     │
│  🔥 الأكثر استخداماً                                    [عرض الكل] │
│  ─────────────────────────────────────────────────────────────────  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │[شعار]  │ │[شعار]  │ │[شعار]  │ │[شعار]  │                   │
│  │طلبات   │ │فوري    │ │سوق.كوم │ │أمازون  │                   │
│  │⭐ 4.9  │ │⭐ 4.7  │ │⭐ 4.6  │ │⭐ 4.8  │                   │
│  │50K+    │ │35K+    │ │28K+    │ │25K+    │                   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                   │
│                                                                     │
│  📂 التصنيفات                                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  [🛍️ تسوق] [🍔 طعام] [💄 جمال] [🏥 صحة] [🎮 ترفيه] [🏦 مالية]    │
│                                                                     │
│  🆕 جديد هذا الأسبوع                                    [عرض الكل] │
│  ─────────────────────────────────────────────────────────────────  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                               │
│  │[شعار]  │ │[شعار]  │ │[شعار]  │                               │
│  │متجر    │ │عيادة   │ │ورشة    │                               │
│  │العطور  │ │الأسنان │ │السيارات│                               │
│  │NEW     │ │NEW     │ │NEW     │                               │
│  └─────────┘ └─────────┘ └─────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### FR-MP-006: تشغيل البرنامج المصغر
**الوصف:** آلية تحميل وتشغيل البرنامج المصغر داخل التطبيق

```typescript
interface MiniProgramRuntime {
  // دورة حياة البرنامج
  lifecycle: {
    onLaunch(): void;            // عند الفتح لأول مرة
    onShow(): void;              // عند الظهور
    onHide(): void;              // عند الاختفاء
    onError(error: Error): void; // عند حدوث خطأ
    onUnload(): void;            // عند الإغلاق
  };

  // إدارة الموارد
  resources: {
    maxMemory: '64MB';
    maxStorage: '10MB';
    networkTimeout: 30000;
    cacheStrategy: 'lru';
  };

  // الأمان (Sandbox)
  sandbox: {
    isolatedContext: true;       // بيئة معزولة
    restrictedAPIs: ['filesystem', 'system'];
    permissionsRequired: ['camera', 'location', 'notifications'];
  };

  // التحديثات
  updates: {
    checkOnLaunch: true;
    autoUpdate: true;
    forceUpdateIfCritical: true;
  };
}

// تجربة المستخدم عند فتح برنامج مصغر
async function openMiniProgram(programId: string): Promise<void> {
  // 1. عرض شاشة التحميل
  showLoadingScreen({
    logo: program.logo,
    name: program.name,
    progress: true,
  });

  // 2. التحقق من التحديثات
  const hasUpdate = await checkForUpdates(programId);
  if (hasUpdate) {
    await downloadUpdate(programId);
  }

  // 3. تحميل الموارد
  updateProgress(30);
  const resources = await loadResources(programId);

  // 4. تهيئة البيئة
  updateProgress(60);
  const runtime = initializeRuntime(programId, resources);

  // 5. تشغيل البرنامج
  updateProgress(90);
  await runtime.launch();

  // 6. إخفاء شاشة التحميل
  hideLoadingScreen();

  // متوسط وقت التحميل: 1-2 ثانية
}
```

### 2.3 نظام المراجعة والنشر

#### FR-MP-007: عملية النشر
**الوصف:** خطوات مراجعة ونشر البرنامج المصغر

```
┌─────────────────────────────────────────────────────────────────────┐
│                    رحلة نشر البرنامج المصغر                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1️⃣ التطوير                                                        │
│      ├── المطور يبني البرنامج                                       │
│      ├── اختبار محلي بالمحاكي                                      │
│      └── تحميل النسخة للمراجعة                                     │
│             ↓                                                       │
│  2️⃣ المراجعة التلقائية (5 دقائق)                                  │
│      ├── فحص الكود للثغرات الأمنية                                 │
│      ├── فحص الأداء (سرعة التحميل، الذاكرة)                        │
│      ├── فحص التوافق مع الأجهزة                                    │
│      └── فحص محتوى (كلمات محظورة، صور غير لائقة)                  │
│             ↓                                                       │
│  3️⃣ المراجعة اليدوية (24-48 ساعة)                                 │
│      ├── مراجعة وظائف البرنامج                                     │
│      ├── التحقق من المعلومات التجارية                              │
│      ├── مطابقة المحتوى للسياسات                                   │
│      └── فحص KAIA للامتثال الشرعي                                  │
│             ↓                                                       │
│  4️⃣ القرار                                                         │
│      ├── ✅ موافق → النشر                                          │
│      ├── ⚠️ يحتاج تعديلات → إرجاع مع ملاحظات                       │
│      └── ❌ مرفوض → إرجاع مع السبب                                  │
│             ↓                                                       │
│  5️⃣ النشر                                                          │
│      ├── إتاحة في المتجر                                           │
│      ├── إشعار المتابعين (إن وجدوا)                                │
│      └── بدء جمع الإحصائيات                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**معايير المراجعة:**
```typescript
interface ReviewCriteria {
  // الأمان
  security: {
    noMaliciousCode: true;
    noDataLeaks: true;
    secureAPIUsage: true;
    properPermissionHandling: true;
  };

  // الأداء
  performance: {
    maxLoadTime: 3000;           // 3 ثواني كحد أقصى
    maxPackageSize: '2MB';
    maxMemoryUsage: '64MB';
    smoothAnimations: true;      // 60fps
  };

  // المحتوى
  content: {
    noAdultContent: true;
    noHateSpeech: true;
    noScams: true;
    accurateDescription: true;
  };

  // التوافق الشرعي (KAIA)
  shariahCompliance: {
    noProhibitedProducts: true;  // لا كحول، قمار، إلخ
    transparentPricing: true;
    fairTerms: true;
  };

  // جودة التجربة
  userExperience: {
    clearNavigation: true;
    responsiveDesign: true;
    errorHandling: true;
    arabicSupport: true;
  };
}
```

### 2.4 إدارة التاجر

#### FR-MP-008: لوحة تحكم التاجر
**الوصف:** لوحة تحكم لإدارة البرنامج المصغر

```
┌─────────────────────────────────────────────────────────────────────┐
│  لوحة تحكم: متجر الموضة العصرية                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📊 نظرة عامة اليوم                                                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐         │
│  │ الزيارات    │ الطلبات     │ الإيرادات   │ معدل التحويل│         │
│  │    1,234    │     45      │  6,750 ج.م  │    3.6%     │         │
│  │   ↑ 15%     │   ↑ 20%     │   ↑ 25%     │   ↑ 0.5%    │         │
│  └─────────────┴─────────────┴─────────────┴─────────────┘         │
│                                                                     │
│  📈 الزيارات خلال الأسبوع                                           │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │     ^                                    ___            │       │
│  │  800│                              _____/   \___       │       │
│  │  600│                       ______/             \      │       │
│  │  400│              ________/                          │       │
│  │  200│_____________/                                   │       │
│  │     └────────────────────────────────────────────────→│       │
│  │      السبت  الأحد  الإثنين الثلاثاء الأربعاء الخميس الجمعة     │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                     │
│  🔥 المنتجات الأكثر مبيعاً                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  #  المنتج              المبيعات    الإيرادات    المخزون      │  │
│  │  1  قميص قطن أبيض        45         6,750 ج.م     23         │  │
│  │  2  بنطلون جينز          38         17,100 ج.م    15         │  │
│  │  3  جاكيت شتوي           22         13,200 ج.م    8 ⚠️       │  │
│  │  4  تيشيرت رياضي         18         2,700 ج.م     45         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [إدارة المنتجات] [الطلبات] [العملاء] [التسويق] [الإعدادات]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. مخطط قاعدة البيانات (Database Schema)

```sql
-- جدول البرامج المصغرة
CREATE TABLE mini_programs (
  id VARCHAR(36) PRIMARY KEY,
  app_id VARCHAR(50) NOT NULL UNIQUE,          -- mp_abc123
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,           -- fashion-store

  -- المالك
  owner_id VARCHAR(36) NOT NULL,
  owner_type ENUM('merchant', 'developer', 'agency') NOT NULL,

  -- التصنيف
  category ENUM('ecommerce', 'services', 'food', 'entertainment', 'utilities', 'government') NOT NULL,
  subcategory VARCHAR(50),
  tags JSON,                                   -- ["ملابس", "موضة", "نسائي"]

  -- الوصف
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  short_description VARCHAR(255),

  -- الأصول
  logo_url VARCHAR(255) NOT NULL,
  cover_image_url VARCHAR(255),
  screenshots JSON,                            -- ["url1", "url2", ...]
  icon_url VARCHAR(255),

  -- التقنية
  template_id VARCHAR(36),                     -- إذا مبني على قالب
  package_url VARCHAR(255),                    -- رابط الحزمة المضغوطة
  version VARCHAR(20) NOT NULL,                -- 1.0.0
  min_sdk_version VARCHAR(20) NOT NULL,        -- 2.0.0

  -- الإعدادات
  settings JSON,                               -- إعدادات البرنامج
  permissions JSON,                            -- الصلاحيات المطلوبة

  -- الحالة
  status ENUM('draft', 'pending_review', 'rejected', 'published', 'suspended') DEFAULT 'draft',
  published_at TIMESTAMP,
  review_notes TEXT,

  -- الإحصائيات
  total_users INT DEFAULT 0,
  daily_active_users INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  average_rating DECIMAL(2, 1) DEFAULT 0,
  total_reviews INT DEFAULT 0,

  -- KAIA
  kaia_compliance_status ENUM('pending', 'compliant', 'non_compliant') DEFAULT 'pending',
  kaia_last_check TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (owner_id) REFERENCES users(id),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_owner (owner_id),
  FULLTEXT idx_search (name, name_ar, description, description_ar)
);

-- جدول إصدارات البرنامج
CREATE TABLE mini_program_versions (
  id VARCHAR(36) PRIMARY KEY,
  program_id VARCHAR(36) NOT NULL,
  version VARCHAR(20) NOT NULL,
  version_code INT NOT NULL,

  -- الحزمة
  package_url VARCHAR(255) NOT NULL,
  package_size INT NOT NULL,                   -- بالبايت
  checksum VARCHAR(64) NOT NULL,

  -- ملاحظات الإصدار
  release_notes TEXT,
  release_notes_ar TEXT,

  -- المراجعة
  review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewer_id VARCHAR(36),
  reviewed_at TIMESTAMP,
  review_comments TEXT,

  -- النشر
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (program_id) REFERENCES mini_programs(id) ON DELETE CASCADE,
  UNIQUE KEY uk_program_version (program_id, version)
);

-- جدول مستخدمي البرنامج
CREATE TABLE mini_program_users (
  id VARCHAR(36) PRIMARY KEY,
  program_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,

  first_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_sessions INT DEFAULT 1,
  total_time_spent INT DEFAULT 0,              -- بالثواني

  -- المفضلة
  is_favorited BOOLEAN DEFAULT FALSE,
  favorited_at TIMESTAMP,

  -- البيانات المحلية
  local_storage_size INT DEFAULT 0,            -- بالبايت

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (program_id) REFERENCES mini_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_program_user (program_id, user_id),
  INDEX idx_last_used (last_used_at)
);

-- جدول جلسات البرنامج
CREATE TABLE mini_program_sessions (
  id VARCHAR(36) PRIMARY KEY,
  program_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,

  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  duration INT,                                -- بالثواني

  -- معلومات الجهاز
  device_type VARCHAR(20),                     -- iphone, android, tablet
  os_version VARCHAR(20),
  app_version VARCHAR(20),

  -- مصدر الدخول
  entry_source ENUM('search', 'qr_code', 'share', 'history', 'favorites', 'push', 'direct') NOT NULL,
  referrer_program_id VARCHAR(36),             -- إذا جاء من برنامج آخر

  -- الصفحات
  pages_visited JSON,                          -- [{"page": "/home", "time": 5}, ...]
  exit_page VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (program_id) REFERENCES mini_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_program_date (program_id, started_at)
);

-- جدول تقييمات البرنامج
CREATE TABLE mini_program_reviews (
  id VARCHAR(36) PRIMARY KEY,
  program_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,

  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  -- الردود
  merchant_reply TEXT,
  merchant_reply_at TIMESTAMP,

  -- الإشراف
  is_visible BOOLEAN DEFAULT TRUE,
  moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  moderation_reason TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (program_id) REFERENCES mini_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_program_user_review (program_id, user_id)
);

-- جدول القوالب
CREATE TABLE mini_program_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,

  description TEXT,
  description_ar TEXT,

  features JSON,                               -- ["ميزة 1", "ميزة 2"]
  pages JSON,                                  -- ["home", "products", "cart"]

  -- الأصول
  preview_images JSON,
  package_url VARCHAR(255) NOT NULL,

  -- التخصيص
  customization_options JSON,                  -- {"colors": true, "fonts": true}

  -- التسعير
  is_free BOOLEAN DEFAULT FALSE,
  monthly_fee DECIMAL(10, 2) DEFAULT 0,
  setup_fee DECIMAL(10, 2) DEFAULT 0,

  -- الإحصائيات
  usage_count INT DEFAULT 0,

  status ENUM('draft', 'active', 'deprecated') DEFAULT 'active',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول صلاحيات المطورين
CREATE TABLE mini_program_developers (
  id VARCHAR(36) PRIMARY KEY,
  program_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,

  role ENUM('owner', 'admin', 'developer', 'viewer') NOT NULL,
  permissions JSON,                            -- ["edit", "publish", "analytics"]

  invited_by VARCHAR(36),
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,

  status ENUM('pending', 'active', 'revoked') DEFAULT 'pending',

  FOREIGN KEY (program_id) REFERENCES mini_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_program_developer (program_id, user_id)
);
```

---

## 4. واجهات برمجة التطبيقات (API Specification)

```typescript
// ==================== Mini Program Management ====================

/**
 * @api {get} /api/mini-programs البحث في البرامج المصغرة
 * @apiQuery {string} [search] - نص البحث
 * @apiQuery {string} [category] - التصنيف
 * @apiQuery {number} [lat] - خط العرض (للقرب)
 * @apiQuery {number} [lng] - خط الطول
 */
GET /api/mini-programs

/**
 * @api {get} /api/mini-programs/:id تفاصيل برنامج مصغر
 */
GET /api/mini-programs/:id

/**
 * @api {get} /api/mini-programs/:id/launch تحميل وتشغيل البرنامج
 */
GET /api/mini-programs/:id/launch

/**
 * @api {post} /api/mini-programs/:id/favorite إضافة للمفضلة
 */
POST /api/mini-programs/:id/favorite

/**
 * @api {post} /api/mini-programs/:id/reviews إضافة تقييم
 * @apiBody {number} rating - التقييم (1-5)
 * @apiBody {string} [review_text] - نص التقييم
 */
POST /api/mini-programs/:id/reviews


// ==================== Developer APIs ====================

/**
 * @api {post} /api/developer/mini-programs إنشاء برنامج جديد
 */
POST /api/developer/mini-programs

/**
 * @api {put} /api/developer/mini-programs/:id تحديث البرنامج
 */
PUT /api/developer/mini-programs/:id

/**
 * @api {post} /api/developer/mini-programs/:id/versions رفع إصدار جديد
 * @apiBody {file} package - الحزمة المضغوطة
 * @apiBody {string} version - رقم الإصدار
 * @apiBody {string} release_notes - ملاحظات الإصدار
 */
POST /api/developer/mini-programs/:id/versions

/**
 * @api {post} /api/developer/mini-programs/:id/submit تقديم للمراجعة
 */
POST /api/developer/mini-programs/:id/submit

/**
 * @api {get} /api/developer/mini-programs/:id/analytics إحصائيات البرنامج
 * @apiQuery {string} period - الفترة (today, week, month)
 */
GET /api/developer/mini-programs/:id/analytics


// ==================== Template APIs ====================

/**
 * @api {get} /api/templates القوالب المتاحة
 * @apiQuery {string} [category] - التصنيف
 */
GET /api/templates

/**
 * @api {post} /api/templates/:id/use استخدام قالب
 */
POST /api/templates/:id/use


// ==================== Mini Program SDK APIs ====================
// (هذه APIs يستخدمها البرنامج المصغر أثناء التشغيل)

/**
 * @api {get} /api/mp-sdk/user الحصول على بيانات المستخدم
 */
GET /api/mp-sdk/user

/**
 * @api {post} /api/mp-sdk/payment طلب دفع
 */
POST /api/mp-sdk/payment

/**
 * @api {get} /api/mp-sdk/addresses عناوين المستخدم
 */
GET /api/mp-sdk/addresses

/**
 * @api {post} /api/mp-sdk/share مشاركة محتوى
 */
POST /api/mp-sdk/share
```

---

## 5. التكامل مع KAIA

```typescript
interface MiniProgramKAIACompliance {
  // فحص المحتوى
  contentCheck: {
    // فحص تلقائي عند النشر
    automaticScan: true;
    scanAreas: ['products', 'images', 'descriptions', 'pricing'];

    // منع المحتوى المحرم
    prohibitedContent: [
      'alcohol',
      'gambling',
      'pork',
      'adult_content',
      'interest_based_loans',
    ];
  };

  // فحص المعاملات
  transactionCheck: {
    // التحقق من كل عملية دفع
    validateBeforePayment: true;

    // منع المعاملات المشبوهة
    blockSuspiciousTransactions: true;

    // التسعير الشفاف
    requireTransparentPricing: true;
  };

  // شهادة التوافق
  certification: {
    levels: ['basic', 'standard', 'premium'];
    displayBadge: true;
    renewalPeriod: '6 months';
  };
}
```

---

## 6. الأمان

### 6.1 Sandbox (البيئة المعزولة)

```typescript
interface MiniProgramSandbox {
  // عزل الكود
  codeIsolation: {
    separateContext: true;       // سياق JavaScript منفصل
    noDirectDOMAccess: true;     // لا وصول مباشر لـ DOM
    noNetworkBypass: true;       // كل الشبكة عبر APIs
  };

  // حدود الموارد
  resourceLimits: {
    maxMemory: '64MB';
    maxCPU: '50%';
    maxStorage: '10MB';
    maxNetworkRequests: '100/minute';
  };

  // صلاحيات
  permissions: {
    camera: 'ask';               // يطلب من المستخدم
    location: 'ask';
    notifications: 'ask';
    contacts: 'deny';            // غير مسموح
    microphone: 'ask';
  };

  // مراقبة
  monitoring: {
    logAllAPICalls: true;
    detectAnomalies: true;
    rateLimit: true;
  };
}
```

---

## 7. مقاييس النجاح (KPIs)

| المقياس | الهدف | طريقة القياس |
|---------|-------|-------------|
| عدد البرامج المنشورة | 500 في السنة الأولى | إجمالي البرامج |
| المستخدمين النشطين يومياً | 100,000 | DAU |
| متوسط وقت التحميل | < 2 ثانية | من الضغط للعرض |
| معدل الاحتفاظ (7 أيام) | > 40% | المستخدمون العائدون |
| رضا المطورين | > 4.0/5 | استطلاعات |
| معدل قبول المراجعة | > 80% | المقبولة / المقدمة |

---

## 8. خطة التنفيذ

### المرحلة 1: الأساسيات (3 أشهر)
- بناء SDK الأساسي
- 10 قوالب جاهزة
- بيئة التطوير الأساسية
- نظام المراجعة
- 50 برنامج تجريبي

### المرحلة 2: التوسع (6 أشهر)
- No-code builder كامل
- 30 قالب إضافي
- APIs متقدمة (كاميرا، موقع، دفع)
- متجر البرامج المصغرة
- 200 برنامج منشور

### المرحلة 3: النضج (12 شهر)
- تكاملات خارجية (WhatsApp, Facebook)
- أدوات تحليلات متقدمة
- نظام إعلانات داخل البرامج
- 500+ برنامج منشور
- 100,000+ مستخدم نشط

---

## 9. تقدير التكاليف

| البند | التكلفة (جنيه) |
|-------|---------------|
| **تطوير المنصة** | |
| SDK وRuntime | 400,000 |
| بيئة التطوير (IDE) | 300,000 |
| No-code Builder | 250,000 |
| متجر البرامج | 150,000 |
| نظام المراجعة | 100,000 |
| **المجموع** | **1,200,000** |
| | |
| **القوالب والمحتوى** | |
| تصميم 30 قالب | 150,000 |
| توثيق المطورين | 50,000 |
| فيديوهات تعليمية | 30,000 |
| **المجموع** | **230,000** |
| | |
| **التشغيل الشهري** | |
| سيرفرات وبنية تحتية | 25,000 |
| فريق المراجعة | 30,000 |
| دعم المطورين | 20,000 |
| **المجموع الشهري** | **75,000** |

---

## 10. الملاحق

### 10.1 بنية مشروع برنامج مصغر

```
my-mini-program/
├── app.json              # إعدادات التطبيق
├── app.tsx               # نقطة الدخول
├── app.css               # أنماط عامة
│
├── pages/
│   ├── home/
│   │   ├── index.tsx     # الصفحة الرئيسية
│   │   └── index.css
│   ├── products/
│   │   ├── index.tsx     # قائمة المنتجات
│   │   └── [id].tsx      # تفاصيل المنتج
│   └── cart/
│       └── index.tsx     # سلة التسوق
│
├── components/
│   ├── Header.tsx
│   ├── ProductCard.tsx
│   └── CartButton.tsx
│
├── assets/
│   ├── images/
│   └── icons/
│
├── utils/
│   ├── api.ts
│   └── helpers.ts
│
└── package.json
```

### 10.2 مثال app.json

```json
{
  "name": "متجر الموضة",
  "appId": "mp_fashion_store",
  "version": "1.0.0",
  "minSDKVersion": "2.0.0",

  "pages": [
    "pages/home/index",
    "pages/products/index",
    "pages/products/[id]",
    "pages/cart/index",
    "pages/checkout/index",
    "pages/orders/index",
    "pages/profile/index"
  ],

  "tabBar": {
    "items": [
      { "page": "pages/home/index", "icon": "home", "label": "الرئيسية" },
      { "page": "pages/products/index", "icon": "grid", "label": "المنتجات" },
      { "page": "pages/cart/index", "icon": "cart", "label": "السلة" },
      { "page": "pages/profile/index", "icon": "user", "label": "حسابي" }
    ]
  },

  "permissions": [
    "user.profile",
    "payment",
    "address",
    "camera"
  ],

  "window": {
    "navigationBarTitleText": "متجر الموضة",
    "navigationBarBackgroundColor": "#1a73e8",
    "backgroundColor": "#f5f5f5"
  }
}
```

---

**نهاية المستند**
