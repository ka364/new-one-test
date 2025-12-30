# 🔌 Integrations Setup Guide

**HADEROS Platform - NOW SHOES OMS**

**التاريخ:** 28 ديسمبر 2025

**الحالة:** Complete - Ready for Configuration

---

## ✅ ما تم بناؤه

### **Integration Modules Complete:**

1. ✅ Shopify Integration
2. ✅ Aramex Shipping
3. ✅ SMSA Shipping
4. ✅ SMS Notifications (Unifonic/Twilio)
5. ✅ Email Notifications (SendGrid/SMTP)
6. ✅ Integration API Endpoints

**Total Files:** 6 integration modules + 1 API endpoints file

---

## 📋 Prerequisites

### Required Accounts & API Keys:

1. **Shopify Store**
   - Shopify Partner Account
   - Store URL (e.g., `yourstore.myshopify.com`)
   - Admin API Access Token
   - Webhook Secret

2. **Aramex Shipping**
   - Aramex Account
   - Username, Password, Account Number
   - Account PIN & Entity

3. **SMSA Shipping**
   - SMSA Account
   - Username, Password, Account Number
   - Passkey

4. **SMS Notifications**
   - Unifonic Account (preferred)
   - OR Twilio Account
   - Sender ID / Phone Number

5. **Email Notifications**
   - SendGrid Account (preferred)
   - OR SMTP Server (Gmail, etc.)
   - API Key / Credentials

---

## ⚙️ Configuration Steps

### Step 1: Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### Step 2: Shopify Setup

1. **Create Shopify App:**
   - Go to Shopify Partners → Apps
   - Create new app
   - Add required scopes: `read_orders`, `write_orders`, `read_products`

2. **Install App:**
   - Install app in your store
   - Get Access Token from app settings

3. **Configure Webhooks:**
   - Add webhook for `orders/create`
   - URL: `https://yourdomain.com/api/v1/integrations/shopify/webhook/order-created`
   - Use the webhook secret

### Step 3: Aramex Setup

1. **Get Account Details:**
   - Contact Aramex for API credentials
   - Get Username, Password, Account Number, PIN, Entity

2. **Test Connection:**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/integrations/shipping/rates" \
     -H "Content-Type: application/json" \
     -d '{
       "origin_country": "SA",
       "origin_city": "Riyadh",
       "destination_country": "AE",
       "destination_city": "Dubai",
       "weight": 1.5
     }'
   ```

### Step 4: SMSA Setup

1. **Get Account Details:**
   - Contact SMSA for API credentials
   - Get Username, Password, Account Number, Passkey

2. **Test Connection:**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/integrations/shipping/rates" \
     -H "Content-Type: application/json" \
     -d '{
       "origin_country": "SA",
       "origin_city": "Jeddah",
       "destination_country": "KW",
       "destination_city": "Kuwait City",
       "weight": 2.0
     }'
   ```

### Step 5: SMS Notifications Setup

#### Option A: Unifonic (Recommended for Arabic)
1. **Create Account:** https://unifonic.com
2. **Get API Credentials:** App SID, Auth Token
3. **Configure Sender ID:** Register your sender name

#### Option B: Twilio
1. **Create Account:** https://twilio.com
2. **Get Phone Number:** Purchase SMS-enabled number
3. **Get API Credentials:** Account SID, Auth Token

### Step 6: Email Notifications Setup

#### Option A: SendGrid (Recommended)
1. **Create Account:** https://sendgrid.com
2. **Generate API Key:** Settings → API Keys
3. **Verify Domain:** For production use

#### Option B: SMTP
1. **Gmail Setup:**
   - Enable 2FA
   - Generate App Password
   - Use `smtp.gmail.com:587`

---

## 🧪 Testing Integrations

### Run Integration Tests:

```bash
./verify_integrations.sh
```

### Manual Testing:

#### Test Shopify Webhook:
```bash
curl -X POST "http://localhost:8000/api/v1/integrations/shopify/webhook/order-created" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "email": "customer@example.com",
    "created_at": "2025-12-28T10:00:00Z",
    "total_price": "150.00",
    "currency": "SAR",
    "financial_status": "paid",
    "line_items": [{"title": "Test Product", "quantity": 1}],
    "shipping_address": {"country": "SA", "city": "Riyadh"}
  }'
```

#### Test Notifications:
```bash
curl -X POST "http://localhost:8000/api/v1/integrations/notifications/test"
```

#### Check Integration Status:
```bash
curl "http://localhost:8000/api/v1/integrations/config/status"
```

---

## 🔧 Troubleshooting

### Common Issues:

1. **Shopify Connection Failed:**
   - Check API credentials
   - Verify app scopes
   - Ensure webhook URL is accessible

2. **Shipping API Errors:**
   - Verify account credentials
   - Check country/city codes
   - Ensure weight limits

3. **SMS Not Sending:**
   - Check balance/credits
   - Verify phone number format
   - Check sender ID approval

4. **Email Not Sending:**
   - Verify API key
   - Check domain verification
   - Check spam folder

### Logs Location:
- API logs: `logs/api.log`
- Integration logs: `logs/integrations.log`

---

## 📞 Support

For integration issues:
- Check logs first
- Test with provided curl commands
- Contact integration provider support
- Check HaderOS documentation

---

## ✅ Next Steps

After configuration:
1. Run full integration tests
2. Test end-to-end order flow
3. Monitor logs for errors
4. Set up monitoring alerts
5. Ready for production deployment

---

**🎉 Integration Setup Complete!**