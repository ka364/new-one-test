# 📖 HADEROS Production Deployment Guide

## Quick Start

```bash
# 1. Clone the repository
git clone git@github.com:ka364/HADEROS-AI-CLOUD.git
cd HADEROS-AI-CLOUD

# 2. Check system health
./scripts/health-check.sh

# 3. Verify integrations
./scripts/verify-integrations.sh

# 4. Launch production
./scripts/launch-production.sh
```

---

## 🔧 Environment Setup

### Required Variables

Create a `.env.production` file:

```bash
# Database (Required)
DATABASE_URL="postgresql://user:password@host:5432/haderos"

# Security (Required)
JWT_SECRET="your-secure-jwt-secret-32-chars-min"
SESSION_SECRET="your-secure-session-secret-32-chars"

# Application
NODE_ENV="production"
PORT="3000"
```

### Optional Integrations

```bash
# Shopify
SHOPIFY_SHOP_URL="your-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_xxx"
SHOPIFY_WEBHOOK_SECRET="whsec_xxx"

# WhatsApp Business
WHATSAPP_ACCESS_TOKEN="EAAxx..."
WHATSAPP_PHONE_NUMBER_ID="1234567890"
WHATSAPP_VERIFY_TOKEN="your-verify-token"
WHATSAPP_BUSINESS_ID="your-business-id"

# Shipping - Bosta
BOSTA_API_KEY="your-bosta-api-key"
BOSTA_API_URL="https://app.bosta.co/api/v2"

# Shipping - J&T Express
JNT_API_KEY="your-jnt-api-key"
JNT_API_URL="https://api.jtexpress.eg"

# Payments - InstaPay
INSTAPAY_API_KEY="your-instapay-key"
INSTAPAY_MERCHANT_ID="your-merchant-id"

# Payments - PayMob
PAYMOB_API_KEY="your-paymob-key"
PAYMOB_INTEGRATION_ID="your-integration-id"

# Payments - Fawry
FAWRY_MERCHANT_CODE="your-merchant-code"
FAWRY_SECURITY_KEY="your-security-key"
```

---

## 🗄️ Database Setup

### PostgreSQL Installation

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb haderos
```

### Schema Migration

```bash
cd apps/haderos-web

# Generate migrations
pnpm drizzle-kit generate

# Push to database
pnpm drizzle-kit push
```

### Verify Tables

```bash
psql haderos -c "\dt"
```

Expected tables include:
- users, employees, branches
- products, orders, order_items
- payments, transactions
- shipments, shipping_events
- coupons, loyalty_points
- bnpl_contracts, bnpl_installments
- whatsapp_customers, whatsapp_orders
- And many more...

---

## 🚀 Deployment Options

### Option 1: Direct Node.js

```bash
cd apps/haderos-web
pnpm install
pnpm build
NODE_ENV=production pnpm start
```

### Option 2: PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'haderos',
    script: './apps/haderos-web/.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Option 3: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

```bash
docker build -t haderos .
docker run -p 3000:3000 --env-file .env.production haderos
```

---

## 🔌 Webhook Configuration

### Shopify Webhooks

Register these webhooks in Shopify Admin:

| Topic | Endpoint |
|-------|----------|
| orders/create | `https://your-domain.com/api/webhooks/shopify` |
| orders/updated | `https://your-domain.com/api/webhooks/shopify` |
| orders/cancelled | `https://your-domain.com/api/webhooks/shopify` |
| orders/fulfilled | `https://your-domain.com/api/webhooks/shopify` |
| inventory_levels/update | `https://your-domain.com/api/webhooks/shopify` |

### WhatsApp Webhook

Configure in Meta Business Suite:

- Callback URL: `https://your-domain.com/api/webhooks/whatsapp`
- Verify Token: Same as `WHATSAPP_VERIFY_TOKEN`
- Subscribed Events: `messages`, `message_deliveries`, `message_reads`

---

## 🧬 Bio-Modules Configuration

### Tardigrade (Resilience)

The system automatically activates emergency mode when:
- Memory usage > 90%
- Error rate > 50%
- Database connection fails

Configure thresholds in code if needed.

### Chameleon (Adaptive Pricing)

Pricing adjusts based on:
- Competition analysis (20% weight)
- Demand signals (30% weight)
- Seasonality (20% weight)
- Inventory levels (30% weight)

### Cephalopod (Authority)

Authority levels:
- Level 7: Admin/Founder (unlimited)
- Level 6: Director (10,000 EGP)
- Level 5: Regional Manager (5,000 EGP)
- Level 4: Branch Manager (2,000 EGP)
- Level 3: Supervisor (1,000 EGP)
- Level 2: Senior Staff (500 EGP)
- Level 1: Staff (100 EGP)

---

## 📊 Monitoring

### Health Endpoints

```
GET /api/health          - Basic health check
GET /api/vital-signs     - Detailed system metrics
GET /api/bio/status      - Bio-module status
```

### Logs

```bash
# Application logs
tail -f logs/haderos.log

# Error logs
tail -f logs/error.log

# Bio-module events
tail -f logs/bio-events.log
```

### Metrics to Monitor

- Response time (target: < 200ms)
- Error rate (target: < 1%)
- Database connections
- Memory usage
- CPU usage
- Order processing time

---

## 🔒 Security Checklist

- [ ] SSL/TLS certificate installed
- [ ] All environment secrets are strong
- [ ] Database has restricted access
- [ ] Webhook signatures verified
- [ ] Rate limiting enabled
- [ ] CORS configured for production domains
- [ ] 2FA enabled for admin accounts
- [ ] Regular security updates

---

## 🆘 Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Shopify Sync Issues

```bash
# Check webhook logs
psql $DATABASE_URL -c "SELECT * FROM shopify_webhook_logs ORDER BY created_at DESC LIMIT 10"

# Verify webhook secret matches
echo $SHOPIFY_WEBHOOK_SECRET
```

### Bio-Module Errors

```bash
# Check bio-module status
curl http://localhost:3000/api/bio/status

# Force bio-module restart
curl -X POST http://localhost:3000/api/bio/restart
```

---

## 📞 Support

- **Documentation:** `/docs/` folder
- **API Reference:** Each router file contains inline documentation
- **Bio-Module Guide:** `/apps/haderos-web/server/bio-modules/`

---

## 🎯 Post-Launch Checklist

1. [ ] Verify all webhooks are receiving data
2. [ ] Test a complete order flow
3. [ ] Confirm payment processing works
4. [ ] Check shipping label generation
5. [ ] Verify WhatsApp messages are sending
6. [ ] Monitor vital signs dashboard
7. [ ] Review error logs
8. [ ] Test admin panel access
9. [ ] Verify inventory sync
10. [ ] Check bio-module health status

---

**🎉 Congratulations! HADEROS is now live!**
