# 📚 دليل المطورين - HADEROS AI CLOUD

**آخر تحديث:** 1 يناير 2026
**الإصدار:** 2.0
**نسبة الاكتمال:** 95%

---

## 📋 جدول المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [إعداد بيئة التطوير](#2-إعداد-بيئة-التطوير)
3. [هيكل المشروع](#3-هيكل-المشروع)
4. [التقنيات المستخدمة](#4-التقنيات-المستخدمة)
5. [قاعدة البيانات](#5-قاعدة-البيانات)
6. [الـ API و tRPC](#6-الـ-api-و-trpc)
7. [Bio-Modules](#7-bio-modules)
8. [التكاملات الخارجية](#8-التكاملات-الخارجية)
9. [المهام المتبقية](#9-المهام-المتبقية)
10. [معايير الكود](#10-معايير-الكود)
11. [الاختبارات](#11-الاختبارات)
12. [النشر والإنتاج](#12-النشر-والإنتاج)

---

## 1. نظرة عامة على المشروع

### ما هو HADEROS؟
نظام تشغيل اقتصادي ذكي مصمم خصيصاً للسوق المصري والإسلامي، يجمع بين:
- **الذكاء الاصطناعي المستوحى من الطبيعة** (Bio-Inspired AI)
- **محرك الامتثال الشرعي** (KAIA Engine)
- **نظام الدفع عند الاستلام المتقدم** (COD System)
- **نظام الشحن الذكي** (Intelligent Shipping Allocator)

### الإحصائيات
```
📊 إحصائيات المشروع:
├── ملفات TypeScript/TSX:  1,500+ ملف
├── صفحات الواجهة:         64+ صفحة
├── tRPC Routers:          35+ router
├── Bio-Modules:           7 وحدات
├── Database Tables:       78+ جدول
├── التكاملات الخارجية:    10+ تكامل
└── سطور الكود:            85,000+ سطر
```

---

## 2. إعداد بيئة التطوير

### المتطلبات الأساسية
```bash
# Node.js 20+
node --version  # يجب أن يكون 20.x أو أعلى

# pnpm (مدير الحزم)
npm install -g pnpm

# PostgreSQL 15+ (اختياري - يمكن استخدام DigitalOcean)
```

### خطوات التثبيت
```bash
# 1. استنساخ المشروع
git clone https://github.com/ka364/HADEROS-AI-CLOUD.git
cd HADEROS-AI-CLOUD

# 2. الانتقال لمجلد التطبيق الرئيسي
cd apps/haderos-web

# 3. تثبيت المكتبات
pnpm install

# 4. إعداد ملف البيئة
cp .env.example .env
# قم بتعديل القيم حسب بيئتك

# 5. تشغيل التطبيق
pnpm dev
```

### ملف البيئة (.env)
```env
# قاعدة البيانات (DigitalOcean PostgreSQL)
DATABASE_URL="postgresql://doadmin:AVNS_xxx@app-xxx.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

# أو محلياً
# DATABASE_URL="postgresql://user:password@localhost:5432/haderos_dev"

# Session Secret
SESSION_SECRET="your-secret-key-here"

# Shopify (اختياري)
SHOPIFY_SHOP_NAME=""
SHOPIFY_ADMIN_API_TOKEN=""

# شركات الشحن (اختياري)
BOSTA_API_KEY=""
ARAMEX_API_KEY=""

# WhatsApp Business (اختياري)
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_ACCESS_TOKEN=""

# ETA E-Invoice (اختياري)
ETA_CLIENT_ID=""
ETA_CLIENT_SECRET=""
```

### أوامر التطوير المهمة
```bash
# تشغيل التطبيق في وضع التطوير
pnpm dev

# بناء التطبيق للإنتاج
pnpm build

# تشغيل الاختبارات
pnpm test

# فحص الأنواع (TypeScript)
pnpm typecheck

# تحديث قاعدة البيانات
pnpm drizzle-kit push

# إنشاء migration جديد
pnpm drizzle-kit generate
```

---

## 3. هيكل المشروع

```
HADEROS-AI-CLOUD/
├── apps/haderos-web/           # ⭐ التطبيق الرئيسي
│   ├── client/                 # Frontend (React)
│   │   ├── src/
│   │   │   ├── components/     # المكونات المشتركة
│   │   │   │   ├── ui/         # shadcn/ui components
│   │   │   │   ├── layout/     # Header, Sidebar, etc.
│   │   │   │   └── ...
│   │   │   ├── pages/          # صفحات التطبيق
│   │   │   │   ├── cod/        # صفحات COD
│   │   │   │   ├── financial/  # الصفحات المالية
│   │   │   │   ├── shipping/   # صفحات الشحن
│   │   │   │   └── ...
│   │   │   ├── hooks/          # React Hooks مخصصة
│   │   │   ├── lib/            # مكتبات مساعدة
│   │   │   └── styles/         # CSS/Tailwind
│   │   └── index.html
│   │
│   ├── server/                 # Backend (Node.js)
│   │   ├── _core/              # النواة الأساسية
│   │   │   ├── trpc.ts         # إعداد tRPC
│   │   │   ├── validation.ts   # Zod Schemas
│   │   │   ├── cache.ts        # نظام التخزين المؤقت
│   │   │   └── logger.ts       # نظام السجلات
│   │   │
│   │   ├── routers/            # tRPC Routers
│   │   │   ├── orders.ts       # إدارة الطلبات
│   │   │   ├── products.ts     # إدارة المنتجات
│   │   │   ├── employees.ts    # إدارة الموظفين
│   │   │   ├── cod.router.ts   # نظام COD
│   │   │   ├── returns.ts      # نظام المرتجعات
│   │   │   ├── loyalty.ts      # نظام الولاء
│   │   │   ├── coupons.ts      # نظام الكوبونات
│   │   │   ├── kaia.ts         # محرك KAIA
│   │   │   ├── messaging.ts    # نظام الرسائل
│   │   │   └── ...
│   │   │
│   │   ├── bio-modules/        # وحدات الذكاء البيولوجي
│   │   │   ├── arachnid/       # كشف التهديدات
│   │   │   ├── corvid/         # التعلم من الأخطاء
│   │   │   ├── mycelium/       # توزيع الموارد
│   │   │   ├── ant/            # تحسين المسارات
│   │   │   ├── chameleon/      # التكيف الاستراتيجي
│   │   │   ├── tardigrade/     # المرونة والتعافي
│   │   │   └── cephalopod/     # القرارات الموزعة
│   │   │
│   │   ├── integrations/       # التكاملات الخارجية
│   │   │   ├── eta-einvoice.ts # الفاتورة الإلكترونية
│   │   │   ├── instapay.ts     # InstaPay
│   │   │   ├── mobile-wallets.ts # المحافظ الإلكترونية
│   │   │   ├── whatsapp-business.ts # WhatsApp
│   │   │   ├── bosta.ts        # شركة Bosta
│   │   │   └── ...
│   │   │
│   │   ├── kaia/               # محرك KAIA
│   │   │   ├── theology-engine.ts
│   │   │   └── compliance-rules.ts
│   │   │
│   │   ├── services/           # الخدمات
│   │   │   ├── shipping-allocator.ts
│   │   │   └── ...
│   │   │
│   │   └── db.ts               # اتصال قاعدة البيانات
│   │
│   ├── drizzle/                # Database Schemas
│   │   ├── schema.ts           # المخطط الرئيسي
│   │   ├── schema-shopify.ts   # جداول Shopify
│   │   ├── schema-shipping.ts  # جداول الشحن
│   │   ├── schema-returns.ts   # جداول المرتجعات
│   │   ├── schema-loyalty.ts   # جداول الولاء
│   │   ├── schema-coupons.ts   # جداول الكوبونات
│   │   └── ...
│   │
│   ├── drizzle.config.ts       # إعداد Drizzle ORM
│   ├── package.json
│   └── tsconfig.json
│
├── services/api-gateway/       # Python API Gateway (اختياري)
├── docs/                       # التوثيق (224 ملف)
├── infrastructure/             # Docker & DevOps
└── 21:12:2025/                 # ملفات إضافية
```

---

## 4. التقنيات المستخدمة

### Frontend
| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| React | 19.x | إطار العمل الرئيسي |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| TailwindCSS | 4.x | التنسيق |
| shadcn/ui | latest | مكتبة المكونات |
| tRPC Client | 11.x | اتصال API |
| Wouter | 3.x | التوجيه |
| React Query | 5.x | إدارة البيانات |
| Recharts | 2.x | الرسوم البيانية |
| Lucide React | latest | الأيقونات |

### Backend
| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| Node.js | 20.x | Runtime |
| Express | 4.x | HTTP Server |
| tRPC | 11.x | Type-safe API |
| Drizzle ORM | latest | قاعدة البيانات |
| Zod | 3.x | التحقق من البيانات |
| PostgreSQL | 15.x | قاعدة البيانات |

---

## 5. قاعدة البيانات

### الاتصال بقاعدة البيانات
```typescript
// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { ssl: 'require' });
export const db = drizzle(client);
```

### الجداول الرئيسية (78+ جدول)

#### جداول الأساسية
```typescript
// المستخدمين والموظفين
users, employees, roles, permissions

// المنتجات والمخزون
products, product_variants, inventory, warehouses

// الطلبات
orders, order_items, order_status_history

// COD System
cod_orders, cod_collections, cod_settlements
```

#### جداول Shopify
```typescript
shopify_config, shopify_orders, shopify_products,
shopify_variants, shopify_sync_logs
```

#### جداول الشحن
```typescript
shipments, shipping_partners, shipping_rates,
egypt_governorates, egypt_centers, egypt_cities,
shipping_performance_by_point, shipping_performance_by_center
```

#### جداول المرتجعات (جديد)
```typescript
// drizzle/schema-returns.ts
return_reasons, return_requests, return_items,
return_status_history, refund_transactions, return_policies
```

#### جداول الولاء (جديد)
```typescript
// drizzle/schema-loyalty.ts
loyalty_tiers, loyalty_members, points_transactions,
loyalty_rewards, reward_redemptions, points_rules, referral_tracking
```

#### جداول الكوبونات (جديد)
```typescript
// drizzle/schema-coupons.ts
coupon_types, coupons, coupon_usage, promotional_campaigns,
campaign_products, generated_coupons, coupon_analytics, bundle_offers
```

### إنشاء جدول جديد
```typescript
// drizzle/schema-example.ts
import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const myNewTable = pgTable("my_new_table", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ثم قم بتشغيل:
// pnpm drizzle-kit push
```

---

## 6. الـ API و tRPC

### إنشاء Router جديد
```typescript
// server/routers/my-router.ts
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";

export const myRouter = router({
  // Query عام
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(myTable);
  }),

  // Query محمي (يتطلب تسجيل دخول)
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(myTable).where(eq(myTable.id, input.id));
    }),

  // Mutation
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      value: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      await db.insert(myTable).values({
        ...input,
        createdBy: ctx.user.id,
      });
      return { success: true };
    }),
});
```

### تسجيل Router في الـ App
```typescript
// server/index.ts أو server/routers/index.ts
import { myRouter } from "./routers/my-router";

export const appRouter = router({
  // ... existing routers
  myFeature: myRouter,
});
```

### استخدام API في Frontend
```typescript
// في أي مكون React
import { trpc } from "@/lib/trpc";

function MyComponent() {
  // Query
  const { data, isLoading } = trpc.myFeature.getAll.useQuery();

  // Mutation
  const createMutation = trpc.myFeature.create.useMutation({
    onSuccess: () => {
      toast.success("تم الإنشاء بنجاح");
    },
  });

  const handleCreate = () => {
    createMutation.mutate({ name: "Test", value: 100 });
  };

  return (/* JSX */);
}
```

---

## 7. Bio-Modules

### الوحدات السبعة

| الوحدة | المستوحى من | الوظيفة |
|--------|-------------|---------|
| 🕷️ Arachnid | العنكبوت | كشف التهديدات والاحتيال |
| 🦅 Corvid | الغراب | التعلم من الأخطاء |
| 🍄 Mycelium | الفطريات | توزيع الموارد |
| 🐜 Ant | النمل | تحسين المسارات (ACO) |
| 🦎 Chameleon | الحرباء | التكيف الاستراتيجي |
| 🔬 Tardigrade | بطيء الخطو | المرونة والتعافي |
| 🐙 Cephalopod | الأخطبوط | القرارات الموزعة |

### استخدام Bio-Module
```typescript
// مثال: استخدام Arachnid لفحص طلب
import { validateOrderWithArachnid } from "../bio-modules/orders-bio-integration";

const validation = await validateOrderWithArachnid({
  orderId: 123,
  orderNumber: "ORD-001",
  customerName: "أحمد محمد",
  customerPhone: "01012345678",
  totalAmount: 500,
  items: [...],
  shippingAddress: "..."
});

if (!validation.isValid) {
  console.log("تحذيرات:", validation.warnings);
  console.log("توصيات:", validation.recommendations);
}
```

### إضافة وحدة Bio جديدة
```typescript
// server/bio-modules/my-module/index.ts
export interface MyModuleConfig {
  threshold: number;
  enabled: boolean;
}

export class MyBioModule {
  constructor(private config: MyModuleConfig) {}

  async analyze(data: any) {
    // منطق التحليل
    return {
      score: 0.85,
      insights: [],
      recommendations: [],
    };
  }
}
```

---

## 8. التكاملات الخارجية

### التكاملات المتاحة

| التكامل | الملف | الحالة | الوصف |
|---------|-------|--------|-------|
| ETA E-Invoice | `eta-einvoice.ts` | ✅ جاهز | الفاتورة الإلكترونية المصرية |
| InstaPay | `instapay.ts` | ✅ جاهز | الدفع الفوري |
| Vodafone Cash | `mobile-wallets.ts` | ✅ جاهز | المحفظة الإلكترونية |
| Orange Money | `mobile-wallets.ts` | ✅ جاهز | المحفظة الإلكترونية |
| WhatsApp Business | `whatsapp-business.ts` | ✅ جاهز | إشعارات العملاء |
| Bosta | `bosta.ts` | ✅ جاهز | شركة شحن |
| Aramex | `aramex.ts` | ✅ جاهز | شركة شحن |
| Mylerz | `mylerz.ts` | ✅ جاهز | شركة شحن |
| Shopify | `shopify.ts` | ✅ جاهز | تكامل المتجر |

### مثال: استخدام WhatsApp
```typescript
import { WhatsAppBusinessService } from "../integrations/whatsapp-business";

const whatsapp = new WhatsAppBusinessService({
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
});

// إرسال تأكيد طلب
await whatsapp.sendOrderConfirmation(
  "201012345678",
  "ORD-12345",
  500,
  ["حذاء رياضي - مقاس 42", "حقيبة جلد"]
);

// إرسال تحديث شحنة
await whatsapp.sendShippingUpdate(
  "201012345678",
  "ORD-12345",
  "out_for_delivery",
  "https://track.bosta.co/..."
);
```

### إضافة تكامل جديد
```typescript
// server/integrations/my-integration.ts
export interface MyIntegrationConfig {
  apiKey: string;
  baseUrl: string;
}

export class MyIntegrationService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: MyIntegrationConfig) {
    this.baseUrl = config.baseUrl;
    this.headers = {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async doSomething(data: any) {
    const response = await fetch(`${this.baseUrl}/endpoint`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    return response.json();
  }
}
```

---

## 9. المهام المتبقية

### 🔴 أولوية عالية (Critical)

#### 1. تفعيل API Keys للتكاملات
```bash
# في ملف .env أضف:
BOSTA_API_KEY=your_key
WHATSAPP_ACCESS_TOKEN=your_token
ETA_CLIENT_ID=your_id
ETA_CLIENT_SECRET=your_secret
```

#### 2. إضافة Routes للصفحات الجديدة
```typescript
// client/src/App.tsx
import QuranicGuidance from "./pages/QuranicGuidance";
import MessagingPage from "./pages/MessagingPage";
import SpreadsheetsPage from "./pages/SpreadsheetsPage";

// أضف في Router:
<Route path="/quranic-guidance" component={QuranicGuidance} />
<Route path="/messaging" component={MessagingPage} />
<Route path="/spreadsheets" component={SpreadsheetsPage} />
```

#### 3. تطبيق Schemas الجديدة على قاعدة البيانات
```bash
cd apps/haderos-web
pnpm drizzle-kit push
```

### 🟡 أولوية متوسطة (Important)

#### 4. ربط Routers الجديدة بالـ App Router
```typescript
// server/index.ts أو حيث يتم تجميع الـ routers
import { returnsRouter } from "./routers/returns";
import { loyaltyRouter } from "./routers/loyalty";
import { couponsRouter } from "./routers/coupons";

export const appRouter = router({
  // ... existing
  returns: returnsRouter,
  loyalty: loyaltyRouter,
  coupons: couponsRouter,
});
```

#### 5. إضافة صفحات الإدارة
- `pages/admin/ReturnsManagement.tsx` - إدارة المرتجعات
- `pages/admin/LoyaltyManagement.tsx` - إدارة الولاء
- `pages/admin/CouponsManagement.tsx` - إدارة الكوبونات

#### 6. إضافة واجهات العملاء
- `pages/customer/MyReturns.tsx` - طلبات إرجاع العميل
- `pages/customer/MyLoyalty.tsx` - نقاط الولاء
- `pages/customer/MyCoupons.tsx` - كوبوناتي

### 🟢 أولوية منخفضة (Nice to Have)

#### 7. تحسينات UI/UX
- Dark Mode كامل
- Animations
- Loading Skeletons
- Error Boundaries

#### 8. اختبارات
- Unit Tests للـ Routers
- Integration Tests للتكاملات
- E2E Tests للـ Flows الرئيسية

#### 9. تحسينات الأداء
- Redis Caching
- Image Optimization
- Bundle Splitting

---

## 10. معايير الكود

### تسمية الملفات
```
components/    → PascalCase.tsx (Button.tsx)
pages/         → PascalCase.tsx (Dashboard.tsx)
hooks/         → camelCase.ts (useAuth.ts)
utils/         → camelCase.ts (formatDate.ts)
routers/       → kebab-case.ts (order-router.ts)
schemas/       → schema-name.ts (schema-orders.ts)
```

### هيكل المكون
```typescript
// components/MyComponent.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);

  return (
    <div className="p-4">
      <h1>{title}</h1>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
}
```

### التعليقات
```typescript
/**
 * @description وصف الوظيفة
 * @param {string} param1 - وصف البارامتر
 * @returns {Promise<Result>} - وصف النتيجة
 */
async function myFunction(param1: string): Promise<Result> {
  // ...
}
```

### Git Commits
```bash
# الصيغة
<emoji> <type>: <description>

# أمثلة
🚀 feat: إضافة نظام المرتجعات
🐛 fix: إصلاح خطأ في حساب الضريبة
📝 docs: تحديث دليل المطورين
♻️ refactor: إعادة هيكلة router الطلبات
✅ test: إضافة اختبارات للكوبونات
🔧 chore: تحديث المكتبات
```

---

## 11. الاختبارات

### تشغيل الاختبارات
```bash
# جميع الاختبارات
pnpm test

# اختبار ملف معين
pnpm test orders.test.ts

# مع Coverage
pnpm test --coverage
```

### كتابة اختبار
```typescript
// __tests__/orders.test.ts
import { describe, it, expect } from "vitest";
import { ordersRouter } from "../routers/orders";

describe("Orders Router", () => {
  it("should create order successfully", async () => {
    const result = await ordersRouter.createOrder({
      customerName: "Test",
      items: [{ productId: 1, quantity: 2 }],
    });

    expect(result.success).toBe(true);
    expect(result.orderNumber).toBeDefined();
  });
});
```

---

## 12. النشر والإنتاج

### متطلبات الإنتاج
```
✅ Node.js 20+
✅ PostgreSQL 15+ (DigitalOcean جاهز)
✅ SSL Certificate
✅ Environment Variables
```

### خطوات النشر
```bash
# 1. بناء التطبيق
pnpm build

# 2. تشغيل الإنتاج
pnpm start

# أو باستخدام Docker
docker build -t haderos .
docker run -p 3000:3000 haderos
```

### متغيرات البيئة للإنتاج
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=strong-secret-key

# API Keys (مطلوبة)
BOSTA_API_KEY=xxx
WHATSAPP_ACCESS_TOKEN=xxx
ETA_CLIENT_ID=xxx
ETA_CLIENT_SECRET=xxx
```

### Monitoring
```bash
# Logs
pm2 logs haderos

# Status
pm2 status

# Metrics
pm2 monit
```

---

## 📞 الدعم والمساعدة

### الموارد
- **GitHub:** https://github.com/ka364/HADEROS-AI-CLOUD
- **التوثيق:** `/docs/` (224 ملف)
- **API Docs:** `/docs/api/`

### الملفات المهمة للمراجعة
1. `FINAL_DELIVERY_REPORT.md` - تقرير التسليم
2. `SYSTEM_DESCRIPTION_COMPLETE.md` - وصف النظام الكامل
3. `STRATEGIC_ANALYSIS.md` - التحليل الاستراتيجي
4. `START_HERE.md` - دليل البدء السريع

---

**تم إعداد هذا الدليل بواسطة Claude Opus 4.5**
**التاريخ: 1 يناير 2026**
