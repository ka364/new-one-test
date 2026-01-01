# دليل البدء السريع - HADEROS AI Cloud
## Quick Start Guide (Arabic)

---

## 5 دقائق للبدء

### الخطوة 1: نسخ ملف الإعدادات

```bash
cd apps/haderos-web
cp .env.production.ready .env
```

### الخطوة 2: توليد مفاتيح الأمان

```bash
cd ../..
chmod +x scripts/generate-secrets.sh
./scripts/generate-secrets.sh
```

انسخ المفاتيح المُولَّدة إلى ملف `.env`:
```
JWT_SECRET="المفتاح_المُولَّد"
SESSION_SECRET="المفتاح_المُولَّد"
ENCRYPTION_KEY="المفتاح_المُولَّد"
```

### الخطوة 3: إعداد قاعدة البيانات

```bash
# تأكد من تشغيل PostgreSQL
pg_isready

# ادخل رابط قاعدة البيانات في .env
DATABASE_URL="postgresql://user:password@host:5432/haderos_db"

# تطبيق الـ Schema
cd apps/haderos-web
pnpm drizzle-kit push
```

### الخطوة 4: تثبيت الحزم

```bash
pnpm install
```

### الخطوة 5: تشغيل التطبيق

```bash
# للتطوير
pnpm dev

# للإنتاج
pnpm build && pnpm start
```

---

## إعداد التكاملات

### Shopify (اختياري)

1. اذهب إلى Shopify Admin → Apps → Develop apps
2. أنشئ تطبيقاً جديداً
3. فعّل الصلاحيات: `read_products`, `write_products`, `read_orders`, `write_orders`
4. انسخ Access Token

```env
SHOPIFY_SHOP_URL="your-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_xxxxx"
SHOPIFY_WEBHOOK_SECRET="whsec_xxxxx"
```

### Bosta (شركة الشحن)

1. سجّل في https://business.bosta.co
2. اذهب إلى Settings → API
3. انسخ API Key

```env
BOSTA_API_KEY="your_bosta_api_key"
BOSTA_WEBHOOK_SECRET="your_webhook_secret"
```

### WhatsApp Business (اختياري)

1. أنشئ تطبيقاً في Meta Developer Console
2. أضف WhatsApp product
3. اربط رقم الهاتف

```env
WHATSAPP_ACCESS_TOKEN="your_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_id"
WHATSAPP_BUSINESS_ID="your_business_id"
WHATSAPP_WEBHOOK_SECRET="your_webhook_secret"
```

---

## التحقق من الجاهزية

```bash
# تشغيل فحص الصحة
./scripts/health-check.sh

# التحقق من التكاملات
./scripts/verify-integrations.sh
```

---

## الروابط المهمة

| الوصف | الرابط |
|-------|--------|
| التطبيق | http://localhost:3000 |
| API | http://localhost:3000/api/trpc |
| Health Check | http://localhost:3000/api/health |

---

## أول طلب تجريبي

### عبر API (curl)

```bash
# إنشاء طلب جديد
curl -X POST http://localhost:3000/api/trpc/orders.create \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "أحمد محمد",
    "customerPhone": "01012345678",
    "items": [{"productId": 1, "quantity": 1, "price": 299.99}],
    "shippingAddress": "القاهرة، مدينة نصر",
    "paymentMethod": "cod"
  }'
```

### عبر Postman

1. افتح Postman
2. استورد `docs/HADEROS_API_Postman_Collection.json`
3. عدّل `baseUrl` في المتغيرات
4. جرّب الطلبات

---

## المساعدة

- 📚 الوثائق الكاملة: `docs/`
- 📞 الدعم: support@haderos.ai
- 🐛 الأخطاء: https://github.com/ka364/HADEROS-AI-CLOUD/issues

---

**HADEROS AI Cloud** - جاهز للإطلاق!
