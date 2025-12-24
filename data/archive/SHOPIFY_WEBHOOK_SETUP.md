# 🔗 Shopify Webhook Registration Guide

**Status:** ✅ Webhook endpoint is ready and tested  
**Endpoint:** `https://your-domain.manus.space/api/webhooks/shopify`

---

## 📋 Prerequisites

Before registering webhooks, you need:

1. ✅ **Shopify Store Admin Access**
2. ✅ **Webhook Endpoint URL** (from Manus deployment)
3. ✅ **Admin API Access Token** (already in ENV: `SHOPIFY_ADMIN_API_TOKEN`)

---

## 🚀 Method 1: Register via Shopify Admin UI (Easiest)

### Step 1: Access Webhooks Settings
1. Log in to your Shopify Admin: `https://admin.shopify.com/store/YOUR_STORE`
2. Navigate to: **Settings** → **Notifications**
3. Scroll down to **Webhooks** section
4. Click **Create webhook**

### Step 2: Create Each Webhook

#### Webhook 1: Order Created
- **Event:** `Order creation`
- **Format:** `JSON`
- **URL:** `https://your-domain.manus.space/api/webhooks/shopify`
- **API Version:** `2024-01` (or latest)
- Click **Save**

#### Webhook 2: Order Updated
- **Event:** `Order updated`
- **Format:** `JSON`
- **URL:** `https://your-domain.manus.space/api/webhooks/shopify`
- **API Version:** `2024-01`
- Click **Save**

#### Webhook 3: Order Cancelled
- **Event:** `Order cancelled`
- **Format:** `JSON`
- **URL:** `https://your-domain.manus.space/api/webhooks/shopify`
- **API Version:** `2024-01`
- Click **Save**

#### Webhook 4: Order Fulfilled
- **Event:** `Order fulfilled`
- **Format:** `JSON`
- **URL:** `https://your-domain.manus.space/api/webhooks/shopify`
- **API Version:** `2024-01`
- Click **Save**

#### Webhook 5: Inventory Updated
- **Event:** `Inventory level updated`
- **Format:** `JSON`
- **URL:** `https://your-domain.manus.space/api/webhooks/shopify`
- **API Version:** `2024-01`
- Click **Save**

---

## 🔧 Method 2: Register via API (Programmatic)

### Using the Shopify Admin API

Create a script to register all webhooks at once:

```bash
# File: scripts/register-shopify-webhooks.sh

SHOPIFY_STORE="your-store-name"
ACCESS_TOKEN="your-admin-api-token"
WEBHOOK_URL="https://your-domain.manus.space/api/webhooks/shopify"

# Register Order Created webhook
curl -X POST "https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "orders/create",
      "address": "'${WEBHOOK_URL}'",
      "format": "json"
    }
  }'

# Register Order Updated webhook
curl -X POST "https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "orders/update",
      "address": "'${WEBHOOK_URL}'",
      "format": "json"
    }
  }'

# Register Order Cancelled webhook
curl -X POST "https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "orders/cancelled",
      "address": "'${WEBHOOK_URL}'",
      "format": "json"
    }
  }'

# Register Order Fulfilled webhook
curl -X POST "https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "orders/fulfilled",
      "address": "'${WEBHOOK_URL}'",
      "format": "json"
    }
  }'

# Register Inventory Updated webhook
curl -X POST "https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "inventory_levels/update",
      "address": "'${WEBHOOK_URL}'",
      "format": "json"
    }
  }'

echo "✅ All webhooks registered!"
```

---

## ✅ Verification

### 1. Check Registered Webhooks

**Via Shopify Admin:**
- Go to **Settings** → **Notifications** → **Webhooks**
- You should see 5 webhooks listed

**Via API:**
```bash
curl -X GET "https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: ${ACCESS_TOKEN}"
```

### 2. Test Webhook Delivery

**Option A: Create a test order in Shopify**
1. Go to **Orders** → **Create order**
2. Fill in test data
3. Click **Create order**
4. Check your HaderOS logs for webhook receipt

**Option B: Use Shopify's webhook test**
1. In **Settings** → **Notifications** → **Webhooks**
2. Click on a webhook
3. Click **Send test notification**

### 3. Monitor Webhook Logs

Check the `shopify_webhook_logs` table:
```sql
SELECT * FROM shopify_webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔐 Security Notes

### HMAC Verification
All webhooks are automatically verified using HMAC-SHA256 signature:

```typescript
// Automatic verification in server/_core/shopify-webhook-endpoint.ts
const isValid = verifyShopifyWebhook(
  rawBody,
  hmacHeader,
  ENV.shopifyAdminApiToken
);
```

### Headers Received
```
X-Shopify-Hmac-SHA256: <signature>
X-Shopify-Topic: orders/create
X-Shopify-Shop-Domain: your-store.myshopify.com
X-Shopify-API-Version: 2024-01
```

---

## 📊 Webhook Topics Reference

| Topic | Description | Handler Function |
|-------|-------------|------------------|
| `orders/create` | New order placed | `handleOrderCreate()` |
| `orders/update` | Order details changed | `handleOrderUpdate()` |
| `orders/cancelled` | Order cancelled | `handleOrderCancel()` |
| `orders/fulfilled` | Order shipped/delivered | `handleOrderFulfill()` |
| `inventory_levels/update` | Stock quantity changed | `handleInventoryUpdate()` |

---

## 🐛 Troubleshooting

### Webhook not received?
1. Check webhook URL is correct
2. Verify endpoint is publicly accessible
3. Check firewall/security settings
4. Review Shopify webhook delivery logs

### HMAC verification failed?
1. Verify `SHOPIFY_ADMIN_API_TOKEN` is correct
2. Check raw body is being captured
3. Review middleware order in Express

### Database errors?
1. Check database connection
2. Verify schema is up to date
3. Review column types match data

---

## 📞 Support

If webhooks are not working:
1. Check server logs: `tail -f /tmp/server.log`
2. Check database logs: `SELECT * FROM shopify_webhook_logs`
3. Test endpoint manually: `curl -X POST https://your-domain/api/webhooks/shopify`

---

**Last Updated:** December 19, 2024  
**Webhook Version:** 1.0  
**Shopify API Version:** 2024-01
