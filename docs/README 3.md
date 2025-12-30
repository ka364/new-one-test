# 🚀 HaderOS MVP - Ethical AI Platform

**منصة ذكية متكاملة لإدارة الأعمال بضمير - مع نظام إطلاق متقدم**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://reactjs.org/)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596BE)](https://trpc.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 📋 **نظرة عامة**

HaderOS MVP هو منصة شاملة تجمع بين:
- 🧠 **الذكاء الاصطناعي الأخلاقي** - محرك KAIA للامتثال الشرعي
- 📦 **نظام إطلاق متقدم** - إدارة الشحن والتحصيلات والمؤشرات
- 🎯 **لوحة تحكم ذكية** - مؤشرات الأداء السبعة (TCR, TCC, TCS, TCRN, OCR, ADR, FDR)
- 💰 **حاسبة التحصيل المتوقع** - توقع الإيرادات من المصروف الإعلاني

---

## ✨ **المميزات الرئيسية**

### 🎯 **نظام الإطلاق (Launch System)**

#### 1. **لوحة المؤشرات (KPIs Dashboard)**
- **TCR** (Total Conversion Rate): نسبة التحويل الكلية
- **TCC** (Total Confirmed Conversion): نسبة التأكيد
- **TCS** (Total Shipped Conversion): نسبة الشحن
- **TCRN** (Total Conversion Rate Net): نسبة التحويل الصافية
- **OCR** (Order Cancellation Rate): نسبة الإلغاء
- **ADR** (Ad to Delivery Ratio): نسبة الإعلان للتسليم
- **FDR** (Failed Delivery Rate): نسبة فشل التسليم

#### 2. **حاسبة التحصيل المتوقع (Revenue Calculator)**
```
الإنفاق الإعلاني اليومي
→ عدد الطلبات المتوقعة (بناءً على آخر كفاءة)
→ نسبة الخروج الفعلي
→ نسبة التسليم الموقع
→ التحصيل المتوقع
```

**مثال:**
- إنفاق إعلاني: 5,000 جنيه/يوم
- آخر كفاءة: 0.12 جنيه لكل نتيجة
- الطلبات المتوقعة: ~417 طلب
- متوسط سعر الطلب: 700 جنيه
- نسبة الخروج: 90%
- نسبة التسليم الموقع: 50%
- **التحصيل المتوقع**: **131,355 جنيه**

#### 3. **إدارة الشحنات (Shipping Management)**
- إدارة شركات الشحن (J&T، Aramex، فيدكس)
- تسعير تلقائي حسب المنطقة (4 مناطق)
- توزيع تلقائي للطلبات
- تتبع الشحنات والمرتجعات
- حساب التكاليف الفعلية

#### 4. **تتبع التحصيلات (Collections Tracking)**
- تسجيل التحصيلات النقدية من شركات الشحن
- تسجيل التحويلات البنكية
- تأكيد التحصيلات
- ملخص حسب الشركة
- إحصائيات يومية

---

## 🏗️ **البنية التقنية**

### **Frontend**
- **React 19** - مكتبة UI حديثة
- **TypeScript** - Type-safe development
- **tRPC 11** - End-to-end typesafe APIs
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - مكونات UI جاهزة
- **Recharts** - رسوم بيانية تفاعلية

### **Backend**
- **Express 4** - Node.js framework
- **tRPC** - Type-safe API layer
- **Drizzle ORM** - Database toolkit
- **MySQL/TiDB** - قاعدة البيانات
- **Manus Auth** - نظام المصادقة

### **Database Schema**
```sql
-- Shipping System
shipping_companies
shipping_zones
shipments
shipment_returns

-- Collections System
collections
collection_items

-- Metrics & KPIs
daily_operational_metrics
ad_campaign_performance
revenue_forecasts
```

---

## 🚀 **البدء السريع**

### **المتطلبات**
- Node.js 22+
- pnpm 9+
- MySQL/TiDB database

### **التثبيت**

```bash
# Clone the repository
git clone https://github.com/ka364/haderos-mvp.git
cd haderos-mvp

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### **الوصول للتطبيق**
- Frontend: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

---

## 📊 **الصفحات الرئيسية**

| الصفحة | المسار | الوصف |
|--------|--------|-------|
| **الرئيسية** | `/` | الصفحة الرئيسية |
| **Platform Showcase** | `/showcase` | عرض إنجازات HaderOS Platform |
| **لوحة المؤشرات** | `/launch-kpis` | المؤشرات السبعة |
| **حاسبة التحصيل** | `/revenue-calculator` | توقع الإيرادات |
| **إدارة الشحنات** | `/shipping-management` | إدارة الشحن |
| **تتبع التحصيلات** | `/collections-tracking` | التحصيلات |

---

## 🔌 **API Endpoints**

### **Shipping APIs**
```typescript
// Get all shipping companies
trpc.shipping.getAllCompanies.useQuery()

// Create shipment
trpc.shipping.createShipment.useMutation()

// Update shipment status
trpc.shipping.updateShipmentStatus.useMutation()

// Get shipment by tracking number
trpc.shipping.getShipmentByTracking.useQuery({ trackingNumber })
```

### **Collections APIs**
```typescript
// Create collection
trpc.collections.create.useMutation()

// Get pending collections
trpc.collections.getPending.useQuery()

// Confirm collection
trpc.collections.confirm.useMutation()

// Get summary by company
trpc.collections.getSummaryByCompany.useQuery({ companyId })
```

### **Metrics APIs**
```typescript
// Get daily metrics
trpc.metrics.getDailyMetrics.useQuery({ date })

// Calculate expected revenue
trpc.metrics.calculateExpectedRevenue.useMutation()

// Record ad campaign
trpc.metrics.recordAdCampaign.useMutation()

// Get KPIs
trpc.metrics.getKPIs.useQuery({ startDate, endDate })
```

---

## 📈 **المؤشرات السبعة (7 KPIs)**

### **1. TCR (Total Conversion Rate)**
```
TCR = (التحصيل الفعلي ÷ الطلبات المنشأة) × 100
المستهدف: 45-55%
```

### **2. TCC (Total Confirmed Conversion)**
```
TCC = (الطلبات المؤكدة ÷ الطلبات المنشأة) × 100
المستهدف: 85-95%
```

### **3. TCS (Total Shipped Conversion)**
```
TCS = (الطلبات المشحونة ÷ الطلبات المؤكدة) × 100
المستهدف: 95-100%
```

### **4. TCRN (Total Conversion Rate Net)**
```
TCRN = (التحصيل الفعلي ÷ الطلبات المشحونة) × 100
المستهدف: 80-90%
```

### **5. OCR (Order Cancellation Rate)**
```
OCR = ((الطلبات المنشأة - الطلبات المؤكدة) ÷ الطلبات المنشأة) × 100
المستهدف: < 10%
```

### **6. ADR (Ad to Delivery Ratio)**
```
ADR = (المصروف الإعلاني ÷ التحصيل الفعلي) × 100
المستهدف: 15-25%
```

### **7. FDR (Failed Delivery Rate)**
```
FDR = (المرتجعات ÷ الطلبات المشحونة) × 100
المستهدف: < 30%
```

---

## 🧪 **الاختبار**

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/auth.logout.test.ts

# Watch mode
pnpm test:watch
```

---

## 📦 **البناء والنشر**

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Preview production build
pnpm preview
```

---

## 🔗 **المشاريع المرتبطة**

- **[haderos-platform](https://github.com/ka364/haderos-platform)** - Python/FastAPI Backend مع KAIA Engine
- **[haderosai](https://github.com/ka364/haderosai)** - موقع HaderOS الرسمي

---

## 📚 **التوثيق**

- [Quick Start Guide](QUICK_START_GUIDE.md)
- [Handover Report](HANDOVER_REPORT.md)
- [Priority Tasks](PRIORITY_TASKS_FOR_LAUNCH.md)
- [Team Access](HaderOS_Team_Access.md)

---

## 👥 **الفريق**

**Maintained by:** NOW SHOES Development Team

**Contributors:**
- Backend Development
- Frontend Development
- UI/UX Design
- Quality Assurance

---

## 📄 **الترخيص**

MIT License - see [LICENSE](LICENSE) file for details

---

## 🤝 **المساهمة**

نرحب بالمساهمات! يرجى قراءة [CONTRIBUTING.md](CONTRIBUTING.md) للتفاصيل.

---

## 📞 **الدعم**

- **Email:** support@haderosai.com
- **Website:** https://haderosai.com
- **GitHub Issues:** https://github.com/ka364/haderos-mvp/issues

---

## 🌟 **النجوم والمتابعة**

إذا أعجبك المشروع، لا تنسَ إعطاءه ⭐ على GitHub!

---

**Built with ❤️ by HaderOS Team**

*Last Updated: December 20, 2025*
