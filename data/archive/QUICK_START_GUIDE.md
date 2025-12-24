# 🚀 دليل البدء السريع - HaderOS MVP
## Quick Start Guide for Team Handover

**آخر تحديث:** 19 ديسمبر 2024  
**الإصدار:** v1.0 (Commit: 211568a)

---

## 📥 استلام المشروع من Git

### 1. Clone Repository
```bash
git clone <repository-url> haderos-mvp
cd haderos-mvp
```

### 2. التحقق من الإصدار
```bash
git log --oneline -3
# يجب أن ترى:
# 211568a 📋 Add comprehensive handover documentation
# 054f934 Checkpoint: Admin Dashboard Complete
# 9fb3831 Checkpoint: Employee Login Enhancements Complete
```

### 3. التحقق من الملفات
```bash
ls -la
# يجب أن ترى:
# - HANDOVER_REPORT.md (التقرير الشامل)
# - GIT_STATUS_REPORT.md (حالة Git)
# - EMPLOYEE_CREDENTIALS.md (بيانات الموظفين)
# - TODO.md (قائمة المهام)
# - package.json
# - drizzle/ (قاعدة البيانات)
# - server/ (Backend)
# - client/ (Frontend)
```

---

## ⚙️ تثبيت المشروع

### 1. Install Dependencies
```bash
npm install
# أو
pnpm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
# ثم عدّل .env بالقيم الصحيحة
```

### 3. Database Setup
```bash
# Push schema to database
npm run db:push

# أو إذا كنت تريد seed data
npm run db:seed
```

---

## 🏃 تشغيل المشروع

### Development Mode
```bash
npm run dev
# Server: http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

---

## 🔑 بيانات الدخول للاختبار

### حسابات الموظفين (13 حساب):
انظر ملف `EMPLOYEE_CREDENTIALS.md` للحصول على القائمة الكاملة.

**أمثلة:**
- **sara.ahmed** / Sara@2025 (مشرفة مبيعات)
- **mohamed.hassan** / Mohamed@2025 (مشرف مخزون)
- **ahmed.mahmoud** / Ahmed@2025 (موظف مبيعات)

**ملاحظة:** جميع الحسابات تحتاج تسجيل Gmail بعد أول تسجيل دخول.

### حسابات المؤسسين (5 حسابات):
انظر ملف `founder_docs/` للحصول على PDF لكل مؤسس.

---

## 📍 الصفحات الرئيسية

### للموظفين:
- `/employee/login` - تسجيل الدخول
- `/employee/forgot-password` - استعادة كلمة المرور
- `/employee/dashboard` - لوحة التحكم

### للإداريين:
- `/dashboard` - لوحة التحكم الرئيسية
- `/admin/users` - إدارة المستخدمين ✅ NEW
- `/orders` - إدارة الطلبات
- `/transactions` - المعاملات المالية
- `/campaigns` - الحملات التسويقية

### NOW SHOES:
- `/visual-search` - البحث البصري (كاميرا + باركود)
- `/product-import` - استيراد المنتجات
- `/nowshoes` - لوحة تحكم NOW SHOES
- `/shipments` - تتبع الشحنات

---

## 🔧 الإعدادات المطلوبة

### 1. SendGrid (OTP Emails)
```env
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@haderosai.com
SENDGRID_FROM_NAME=HaderOS AI
```
**الحالة:** ✅ يعمل

### 2. Shopify Integration
```env
SHOPIFY_STORE_NAME=hader-egypt
SHOPIFY_ACCESS_TOKEN=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
SHOPIFY_API_VERSION=2025-10
```
**الحالة:** ✅ 73 منتج متزامن

### 3. Bosta API (يحتاج تفعيل)
```env
BOSTA_API_KEY=
BOSTA_BUSINESS_ID=
BOSTA_PICKUP_LOCATION_ID=
```
**الحالة:** ⏳ جاهز للتفعيل

### 4. J&T Express (يحتاج تفعيل)
```env
JNT_API_ACCOUNT=
JNT_PRIVATE_KEY=
JNT_API_ENDPOINT=https://open.jtjms-eg.com
```
**الحالة:** ⏳ جاهز للتفعيل

---

## 🧪 اختبار النظام

### 1. Backend Tests
```bash
npm test
# Expected: 4/4 passing (Auth tests)
```

### 2. Shopify Integration Test
```bash
npm run test:shopify
# Expected: 7/8 passing
```

### 3. Manual Testing Checklist
- [ ] تسجيل دخول موظف
- [ ] استعادة كلمة المرور
- [ ] تسجيل Gmail + OTP
- [ ] البحث البصري (كاميرا)
- [ ] استيراد منتجات من Google Sheets
- [ ] إدارة المستخدمين (Admin)
- [ ] تتبع الشحنات

---

## 📊 إحصائيات المشروع

### الكود:
- **ملفات TypeScript/TSX:** 196 ملف
- **جداول قاعدة البيانات:** 27 جدول
- **APIs (tRPC):** 125+ endpoint
- **صفحات Frontend:** 24 صفحة
- **أسطر الكود:** ~15,000 سطر

### البيانات:
- **منتجات Shopify:** 73 منتج متزامن
- **حسابات موظفين:** 13 حساب نشط
- **حسابات مؤسسين:** 5 حسابات
- **شحنات مستوردة:** 1,289 سجل

---

## 🐛 المشاكل المعروفة

### Minor Issues:
1. **Shopify Webhooks:** تحتاج تسجيل يدوي في Shopify Admin Panel
2. **Visual Search:** تحتاج رفع صور المنتجات وإنشاء embeddings
3. **Mobile Testing:** لم يتم الاختبار الكامل من الموبايل بعد

### Pending Features:
4. **Activity Logs:** سجل تصرفات الإداريين
5. **Rate Limiting:** حد أقصى لمحاولات تسجيل الدخول
6. **2FA:** مصادقة ثنائية (اختياري)

---

## 📞 الدعم الفني

### الوثائق:
- **التقرير الشامل:** `HANDOVER_REPORT.md`
- **حالة Git:** `GIT_STATUS_REPORT.md`
- **قائمة المهام:** `TODO.md`
- **API Reference:** `docs/development/api-reference.md`
- **Operations Manual:** `docs/operations/daily-checklist.md`

### الاتصال:
- **Email:** support@haderosai.com
- **WhatsApp:** [رقم الدعم]

---

## ✅ Checklist للاستلام

### قبل البدء:
- [ ] Clone repository بنجاح
- [ ] التحقق من آخر commit (211568a)
- [ ] قراءة `HANDOVER_REPORT.md`
- [ ] قراءة `EMPLOYEE_CREDENTIALS.md`

### التثبيت:
- [ ] `npm install` بدون أخطاء
- [ ] `.env` تم إعداده بشكل صحيح
- [ ] `npm run db:push` نجح
- [ ] `npm run dev` يعمل

### الاختبار:
- [ ] تسجيل دخول موظف يعمل
- [ ] Admin dashboard يظهر بشكل صحيح
- [ ] Visual search يفتح الكاميرا
- [ ] Shopify sync يعمل

### الفهم:
- [ ] فهم هيكل المشروع
- [ ] فهم نظام المصادقة
- [ ] فهم tRPC APIs
- [ ] فهم قاعدة البيانات

---

## 🎯 الخطوات التالية

### الأسبوع الأول:
1. **اليوم 1-2:** استلام المشروع + التثبيت + الاختبار
2. **اليوم 3-4:** الحصول على API credentials (Bosta + J&T)
3. **اليوم 5:** استيراد صور المنتجات
4. **اليوم 6-7:** اختبار شامل من الموبايل

### الأسبوع الثاني:
5. تسجيل Shopify webhooks
6. اختبار نظام الشحن الكامل
7. إضافة activity logs
8. إضافة rate limiting
9. الإطلاق التجريبي (Soft Launch)

---

## 🚀 جاهز للإطلاق!

النظام جاهز بنسبة **85%**. ما يحتاج فقط:
1. API credentials (Bosta + J&T)
2. Product images import
3. Mobile testing
4. Shopify webhooks registration

**الإطلاق المستهدف:** الأحد 22 ديسمبر 2024

---

**Good Luck! 🎉**
