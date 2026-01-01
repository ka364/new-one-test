# دليل حل المشاكل - HADEROS AI Cloud
## Troubleshooting Guide (Arabic)

---

## المشاكل الشائعة وحلولها

### 1. مشاكل قاعدة البيانات

#### خطأ: Cannot connect to database

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**الحل:**
```bash
# تأكد من تشغيل PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux

# تحقق من الاتصال
pg_isready -h localhost -p 5432
```

#### خطأ: relation does not exist

```
Error: relation "orders" does not exist
```

**الحل:**
```bash
cd apps/haderos-web
pnpm drizzle-kit push --force
```

#### خطأ: authentication failed

```
Error: password authentication failed for user
```

**الحل:**
1. تحقق من `DATABASE_URL` في ملف `.env`
2. تأكد من صحة اسم المستخدم وكلمة المرور
3. تأكد من أن المستخدم لديه صلاحيات على قاعدة البيانات

---

### 2. مشاكل الـ Build

#### خطأ: Module not found

```
Error: Cannot find module 'xxx'
```

**الحل:**
```bash
# حذف وإعادة تثبيت الحزم
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

#### خطأ: Type errors

```
Type 'xxx' is not assignable to type 'yyy'
```

**الحل:**
```bash
# تحقق من الأنواع
pnpm tsc --noEmit

# إصلاح تلقائي إن أمكن
pnpm lint --fix
```

#### خطأ: Out of memory

```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```

**الحل:**
```bash
# زيادة الذاكرة المتاحة لـ Node
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build
```

---

### 3. مشاكل Shopify

#### خطأ: 401 Unauthorized

```
Shopify API: 401 Unauthorized
```

**الحل:**
1. تحقق من `SHOPIFY_ACCESS_TOKEN`
2. تأكد من صلاحيات التطبيق في Shopify Admin
3. جدد الـ Token إذا انتهت صلاحيته

#### خطأ: Rate limit exceeded

```
Shopify API: 429 Too Many Requests
```

**الحل:**
- النظام يتعامل تلقائياً مع Rate Limiting
- إذا استمرت المشكلة، قلل عدد الطلبات المتزامنة

#### Webhook لا يعمل

**الحل:**
1. تأكد من أن الـ URL عام (ليس localhost)
2. تحقق من `SHOPIFY_WEBHOOK_SECRET`
3. استخدم ngrok للتطوير المحلي:
```bash
ngrok http 3000
# استخدم الرابط الناتج في Shopify
```

---

### 4. مشاكل الشحن (Bosta/J&T)

#### خطأ: Invalid API Key

```
Bosta API: Authentication failed
```

**الحل:**
1. تحقق من `BOSTA_API_KEY`
2. تأكد من تفعيل الحساب في Bosta
3. استخدم API key للبيئة الصحيحة (sandbox/production)

#### خطأ: Invalid address

```
Error: Cannot validate address
```

**الحل:**
1. تأكد من صحة المحافظة والمنطقة
2. استخدم API `/cities` للحصول على القيم الصحيحة:
```bash
curl -H "Authorization: YOUR_API_KEY" \
  https://app.bosta.co/api/v2/cities
```

---

### 5. مشاكل WhatsApp

#### خطأ: Message failed to send

```
WhatsApp API: Message sending failed
```

**الحل:**
1. تحقق من `WHATSAPP_ACCESS_TOKEN`
2. تأكد من تفعيل الرقم في Meta Business
3. تحقق من صحة رقم المستلم (صيغة دولية)

#### Template message rejected

```
Error: Template not approved
```

**الحل:**
1. استخدم قوالب معتمدة فقط
2. انتظر موافقة Meta على القوالب الجديدة
3. تجنب المحتوى المخالف للسياسات

---

### 6. مشاكل الدفع

#### خطأ: Payment failed

```
InstaPay: Transaction failed
```

**الحل:**
1. تحقق من صحة رقم المحفظة
2. تأكد من وجود رصيد كافي
3. تحقق من `INSTAPAY_API_KEY`

#### خطأ: Callback not received

```
Payment completed but status not updated
```

**الحل:**
1. تحقق من إعدادات Webhook في بوابة الدفع
2. تأكد من أن الـ URL عام
3. راجع logs الخادم للتحقق من استلام الـ callback

---

### 7. مشاكل الأداء

#### التطبيق بطيء

**الحل:**
```bash
# تحقق من استخدام الذاكرة
htop  # أو Activity Monitor على macOS

# تفعيل التخزين المؤقت
REDIS_URL="redis://localhost:6379"

# تحسين قاعدة البيانات
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

#### API بطيء

**الحل:**
1. أضف indexes لقاعدة البيانات
2. استخدم pagination للقوائم الكبيرة
3. فعّل Redis للتخزين المؤقت

---

### 8. مشاكل التشغيل

#### التطبيق لا يبدأ

```
Error: Port 3000 is already in use
```

**الحل:**
```bash
# ابحث عن العملية التي تستخدم المنفذ
lsof -i :3000

# أوقفها
kill -9 <PID>

# أو استخدم منفذ آخر
PORT=3001 pnpm dev
```

#### خطأ: Environment variable not set

```
Error: DATABASE_URL is required
```

**الحل:**
1. تأكد من وجود ملف `.env`
2. تحقق من تحميل المتغيرات:
```bash
source .env
echo $DATABASE_URL
```

---

## أوامر التشخيص

### فحص الصحة العامة
```bash
./scripts/health-check.sh
```

### التحقق من التكاملات
```bash
./scripts/verify-integrations.sh
```

### فحص قاعدة البيانات
```bash
psql $DATABASE_URL -c "\dt"  # عرض الجداول
psql $DATABASE_URL -c "SELECT count(*) FROM orders;"
```

### فحص الـ API
```bash
curl http://localhost:3000/api/health
```

### عرض Logs
```bash
# للتطوير
pnpm dev 2>&1 | tee app.log

# للإنتاج (PM2)
pm2 logs haderos
```

---

## إعادة التعيين الكامل

إذا استمرت المشاكل:

```bash
# 1. إيقاف التطبيق
pm2 stop haderos  # أو Ctrl+C

# 2. حذف الملفات المؤقتة
rm -rf node_modules
rm -rf .next
rm -rf dist

# 3. إعادة التثبيت
pnpm install

# 4. إعادة بناء قاعدة البيانات
pnpm drizzle-kit push --force

# 5. إعادة التشغيل
pnpm build
pnpm start
```

---

## الدعم الفني

إذا لم تجد حلاً:

1. **افتح Issue على GitHub:**
   https://github.com/ka364/HADEROS-AI-CLOUD/issues

2. **أرفق المعلومات التالية:**
   - رسالة الخطأ كاملة
   - خطوات إعادة إنتاج المشكلة
   - نظام التشغيل والإصدارات
   - ملفات الـ logs ذات الصلة

3. **تواصل مباشرة:**
   - 📧 support@haderos.ai
   - 📱 واتساب: 01000000000

---

**HADEROS AI Cloud** - دليل حل المشاكل
