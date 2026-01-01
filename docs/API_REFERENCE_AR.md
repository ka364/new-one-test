# مرجع الـ API - HADEROS AI Cloud
## API Reference (Arabic)

---

## معلومات عامة

| المعلومة | القيمة |
|----------|--------|
| Base URL (Development) | `http://localhost:3000/api/trpc` |
| Base URL (Production) | `https://api.haderos.ai/api/trpc` |
| Authentication | Bearer Token (JWT) |
| Content-Type | `application/json` |

---

## المصادقة (Authentication)

### تسجيل الدخول

```http
POST /api/trpc/auth.login
```

**الطلب:**
```json
{
  "email": "admin@haderos.ai",
  "password": "your-password"
}
```

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "user": {
        "id": 1,
        "email": "admin@haderos.ai",
        "name": "Admin",
        "role": "admin"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### الحصول على المستخدم الحالي

```http
GET /api/trpc/auth.me
Authorization: Bearer {token}
```

### تسجيل الخروج

```http
POST /api/trpc/auth.logout
Authorization: Bearer {token}
```

---

## الطلبات (Orders)

### قائمة الطلبات

```http
GET /api/trpc/orders.list?input={"limit":50,"offset":0}
Authorization: Bearer {token}
```

**المعاملات:**
| المعامل | النوع | الوصف |
|---------|-------|-------|
| limit | number | عدد النتائج (افتراضي: 50) |
| offset | number | بداية النتائج (افتراضي: 0) |
| status | string | تصفية بالحالة |
| customerId | number | تصفية بالعميل |

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "orders": [
        {
          "id": 1,
          "orderNumber": "ORD-2024-001234",
          "customerName": "أحمد محمد",
          "customerPhone": "01012345678",
          "totalAmount": 599.99,
          "status": "pending",
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ],
      "total": 150,
      "hasMore": true
    }
  }
}
```

### طلب واحد بالـ ID

```http
GET /api/trpc/orders.getById?input={"id":1}
Authorization: Bearer {token}
```

### إنشاء طلب جديد

```http
POST /api/trpc/orders.create
Authorization: Bearer {token}
Content-Type: application/json
```

**الطلب:**
```json
{
  "customerName": "أحمد محمد",
  "customerPhone": "01012345678",
  "customerEmail": "ahmed@example.com",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 299.99
    }
  ],
  "shippingAddress": "15 شارع التحرير، القاهرة",
  "governorate": "القاهرة",
  "city": "مدينة نصر",
  "paymentMethod": "cod",
  "notes": "التوصيل صباحاً"
}
```

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "id": 123,
      "orderNumber": "ORD-2024-001234",
      "status": "pending",
      "totalAmount": 599.98,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### تحديث حالة الطلب

```http
POST /api/trpc/orders.updateStatus
Authorization: Bearer {token}
```

**الطلب:**
```json
{
  "id": 1,
  "status": "processing"
}
```

**الحالات المتاحة:**
| الحالة | الوصف |
|--------|-------|
| pending | قيد الانتظار |
| confirmed | تم التأكيد |
| processing | قيد التجهيز |
| shipped | تم الشحن |
| delivered | تم التوصيل |
| cancelled | ملغي |
| returned | مرتجع |

---

## المنتجات (Products)

### قائمة المنتجات

```http
GET /api/trpc/products.list?input={"limit":50}
Authorization: Bearer {token}
```

### منتج واحد بالـ ID

```http
GET /api/trpc/products.getById?input={"id":1}
Authorization: Bearer {token}
```

### البحث في المنتجات

```http
GET /api/trpc/products.search?input={"query":"حذاء","category":"shoes"}
Authorization: Bearer {token}
```

### إنشاء منتج

```http
POST /api/trpc/products.create
Authorization: Bearer {token}
```

**الطلب:**
```json
{
  "name": "حذاء رياضي Nike",
  "nameEn": "Nike Sports Shoe",
  "description": "حذاء رياضي مريح للجري",
  "price": 299.99,
  "compareAtPrice": 399.99,
  "sku": "NIKE-001",
  "barcode": "123456789",
  "category": "shoes",
  "inventory": 100,
  "images": ["https://example.com/image1.jpg"],
  "variants": [
    {
      "size": "42",
      "color": "أسود",
      "inventory": 25
    }
  ]
}
```

---

## الشحن (Shipments)

### قائمة الشحنات

```http
GET /api/trpc/shipments.list
Authorization: Bearer {token}
```

### إنشاء شحنة

```http
POST /api/trpc/shipments.create
Authorization: Bearer {token}
```

**الطلب:**
```json
{
  "orderId": 1,
  "provider": "bosta",
  "recipientName": "أحمد محمد",
  "recipientPhone": "01012345678",
  "address": "15 شارع التحرير",
  "city": "مدينة نصر",
  "governorate": "القاهرة",
  "notes": "الطابق الثالث",
  "codAmount": 599.99
}
```

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "id": 1,
      "trackingNumber": "BST-987654321",
      "provider": "bosta",
      "status": "pending",
      "estimatedDelivery": "2024-01-17"
    }
  }
}
```

### تتبع شحنة

```http
GET /api/trpc/shipments.track?input={"trackingNumber":"BST-987654321"}
Authorization: Bearer {token}
```

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "trackingNumber": "BST-987654321",
      "status": "in_transit",
      "currentLocation": "مستودع القاهرة",
      "history": [
        {
          "status": "picked_up",
          "location": "المعادي",
          "timestamp": "2024-01-15T14:00:00Z"
        },
        {
          "status": "in_transit",
          "location": "مستودع القاهرة",
          "timestamp": "2024-01-15T18:00:00Z"
        }
      ]
    }
  }
}
```

---

## المدفوعات (Payments)

### الحصول على البوابات المتاحة

```http
GET /api/trpc/payment.getProviders
Authorization: Bearer {token}
```

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "providers": [
        {
          "id": "instapay",
          "name": "InstaPay",
          "enabled": true,
          "supportedMethods": ["wallet"]
        },
        {
          "id": "paymob",
          "name": "PayMob",
          "enabled": true,
          "supportedMethods": ["card", "wallet"]
        },
        {
          "id": "fawry",
          "name": "Fawry",
          "enabled": true,
          "supportedMethods": ["reference"]
        }
      ]
    }
  }
}
```

### إنشاء عملية دفع

```http
POST /api/trpc/payment.create
Authorization: Bearer {token}
```

**الطلب:**
```json
{
  "orderId": 1,
  "amount": 599.99,
  "provider": "instapay",
  "customerPhone": "01012345678",
  "customerName": "أحمد محمد"
}
```

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "transactionId": "TXN-123456",
      "paymentUrl": "https://pay.instapay.eg/...",
      "status": "pending",
      "expiresAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

### حالة الدفع

```http
GET /api/trpc/payment.getStatus?input={"transactionId":"TXN-123456"}
Authorization: Bearer {token}
```

---

## التقسيط (BNPL)

### التحقق من الأهلية

```http
POST /api/trpc/bnpl.checkEligibility
Authorization: Bearer {token}
```

**الطلب:**
```json
{
  "customerPhone": "01012345678",
  "amount": 1500
}
```

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "eligible": true,
      "maxAmount": 15000,
      "availableAmount": 12000,
      "plans": [
        {
          "months": 3,
          "monthlyPayment": 500,
          "totalAmount": 1500,
          "fees": 0
        },
        {
          "months": 6,
          "monthlyPayment": 255,
          "totalAmount": 1530,
          "fees": 30
        }
      ]
    }
  }
}
```

### إنشاء عقد تقسيط

```http
POST /api/trpc/bnpl.createContract
Authorization: Bearer {token}
```

**الطلب:**
```json
{
  "orderId": 1,
  "customerId": 1,
  "totalAmount": 1500,
  "installments": 3,
  "nationalId": "29001011234567",
  "collectionMethod": "vodafone_cash",
  "collectionPhone": "01012345678"
}
```

### جدول الأقساط

```http
GET /api/trpc/bnpl.getSchedule?input={"contractId":1}
Authorization: Bearer {token}
```

---

## WhatsApp Commerce

### إرسال كتالوج

```http
POST /api/trpc/whatsappCommerce.sendCatalog
Authorization: Bearer {token}
```

**الطلب:**
```json
{
  "phone": "201012345678",
  "catalogId": 1
}
```

### إنشاء طلب من واتساب

```http
POST /api/trpc/whatsappCommerce.createOrder
Authorization: Bearer {token}
```

**الطلب:**
```json
{
  "customerPhone": "201012345678",
  "items": [
    {"productId": 1, "quantity": 1}
  ],
  "address": "القاهرة، مدينة نصر"
}
```

---

## Shopify

### مزامنة المنتجات

```http
POST /api/trpc/shopify.syncProducts
Authorization: Bearer {token}
```

### مزامنة الطلبات

```http
POST /api/trpc/shopify.syncOrders
Authorization: Bearer {token}
```

### حالة المزامنة

```http
GET /api/trpc/shopify.getSyncStatus
Authorization: Bearer {token}
```

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "lastSync": "2024-01-15T10:00:00Z",
      "productsCount": 150,
      "ordersCount": 1200,
      "status": "synced"
    }
  }
}
```

---

## Bio Dashboard

### صحة النظام

```http
GET /api/trpc/bio.getHealth
Authorization: Bearer {token}
```

**الاستجابة:**
```json
{
  "result": {
    "data": {
      "overall": "healthy",
      "uptime": "99.9%",
      "modules": {
        "tardigrade": "active",
        "chameleon": "active",
        "cephalopod": "active",
        "mycelium": "active"
      },
      "metrics": {
        "ordersToday": 45,
        "revenue": 25000,
        "activeUsers": 120
      }
    }
  }
}
```

### حالة الوحدات

```http
GET /api/trpc/bio.getModuleStatus
Authorization: Bearer {token}
```

---

## Webhooks

### Shopify Webhook

```http
POST /api/webhooks/shopify
X-Shopify-Topic: orders/create
X-Shopify-Hmac-Sha256: {signature}
```

### Bosta Webhook

```http
POST /api/webhooks/bosta
X-Bosta-Signature: {signature}
```

### Payment Webhook

```http
POST /api/webhooks/payment/{provider}
```

---

## أكواد الخطأ

| الكود | الوصف |
|-------|-------|
| 400 | طلب غير صالح |
| 401 | غير مصرح |
| 403 | ممنوع |
| 404 | غير موجود |
| 422 | بيانات غير صالحة |
| 429 | تجاوز الحد المسموح |
| 500 | خطأ في الخادم |

**شكل رسالة الخطأ:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "رقم الهاتف غير صالح",
    "details": {
      "field": "customerPhone",
      "expected": "Egyptian phone number"
    }
  }
}
```

---

## Rate Limiting

| النوع | الحد |
|-------|------|
| API العادي | 100 طلب/دقيقة |
| Webhooks | 1000 طلب/دقيقة |
| File Upload | 10 طلب/دقيقة |

---

## SDKs

### JavaScript/TypeScript
```typescript
import { createTRPCClient } from '@trpc/client';

const client = createTRPCClient<AppRouter>({
  url: 'http://localhost:3000/api/trpc',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// استخدام
const orders = await client.orders.list.query({ limit: 10 });
```

---

**HADEROS AI Cloud** - مرجع الـ API الكامل
