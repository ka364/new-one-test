# دليل النشر - HADEROS AI Cloud
## Deployment Guide (Arabic)

---

## خيارات النشر

| الخيار | الصعوبة | التكلفة | الموصى به |
|--------|---------|---------|-----------|
| DigitalOcean App Platform | سهل | $12/شهر | للبداية |
| Vercel | سهل | مجاني - $20/شهر | للتطوير |
| Railway | سهل | $5/شهر | للمشاريع الصغيرة |
| AWS EC2 | متوسط | متغير | للإنتاج الكبير |
| VPS (Hetzner/Contabo) | متوسط | $5-20/شهر | توازن جيد |

---

## 1. النشر على DigitalOcean App Platform

### المتطلبات
- حساب DigitalOcean
- قاعدة بيانات PostgreSQL (DigitalOcean Managed Database)

### الخطوات

#### أ. إنشاء قاعدة البيانات

1. اذهب إلى DigitalOcean Dashboard
2. Create → Databases → PostgreSQL
3. اختر:
   - الخطة: Basic ($15/شهر)
   - المنطقة: Frankfurt (قريبة من مصر)
   - الإصدار: PostgreSQL 15

4. انتظر الإنشاء واحفظ Connection String

#### ب. إنشاء التطبيق

1. Create → Apps
2. اختر GitHub واربط المستودع
3. الإعدادات:

```yaml
# app.yaml
name: haderos
region: fra
services:
  - name: web
    source:
      repo: ka364/HADEROS-AI-CLOUD
      branch: main
      path: apps/haderos-web
    build_command: pnpm install && pnpm build
    run_command: pnpm start
    envs:
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: NODE_ENV
        value: production
    instance_count: 1
    instance_size: basic-xxs
    http_port: 3000

databases:
  - name: db
    engine: PG
```

#### ج. إعداد المتغيرات

في App Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
SESSION_SECRET=your-secret
ENCRYPTION_KEY=your-secret
SHOPIFY_SHOP_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxx
```

#### د. النشر

```bash
# أو من الداشبورد: Deploy → Deploy Now
doctl apps create --spec app.yaml
```

---

## 2. النشر على Vercel

### المتطلبات
- حساب Vercel
- قاعدة بيانات خارجية (Supabase, Neon, PlanetScale)

### الخطوات

#### أ. إعداد Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# الربط بالمشروع
cd apps/haderos-web
vercel link
```

#### ب. إعداد vercel.json

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["fra1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

#### ج. إضافة المتغيرات

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add SESSION_SECRET
# ... باقي المتغيرات
```

#### د. النشر

```bash
vercel --prod
```

---

## 3. النشر على Railway

### الخطوات

#### أ. إنشاء المشروع

1. اذهب إلى railway.app
2. New Project → Deploy from GitHub
3. اختر المستودع

#### ب. إضافة PostgreSQL

1. في المشروع: Add Service → Database → PostgreSQL
2. انسخ `DATABASE_URL`

#### ج. إعداد الخدمة

```bash
# railway.json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "always"
  }
}
```

#### د. المتغيرات

في Settings → Variables:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=xxx
NODE_ENV=production
```

---

## 4. النشر على VPS (Ubuntu)

### المتطلبات
- VPS بـ Ubuntu 22.04
- 2GB RAM minimum
- 20GB SSD

### الخطوات

#### أ. إعداد الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت pnpm
npm install -g pnpm

# تثبيت PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# تثبيت Nginx
sudo apt install -y nginx

# تثبيت PM2
npm install -g pm2
```

#### ب. إعداد PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE haderos_db;
CREATE USER haderos_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE haderos_db TO haderos_user;
\q
```

#### ج. نسخ الكود

```bash
cd /var/www
git clone https://github.com/ka364/HADEROS-AI-CLOUD.git
cd HADEROS-AI-CLOUD/apps/haderos-web
```

#### د. إعداد البيئة

```bash
cp .env.production.ready .env
nano .env
# أضف جميع المتغيرات
```

#### هـ. البناء والتشغيل

```bash
pnpm install
pnpm build

# تشغيل مع PM2
pm2 start pnpm --name "haderos" -- start
pm2 save
pm2 startup
```

#### و. إعداد Nginx

```nginx
# /etc/nginx/sites-available/haderos
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/haderos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### ز. إعداد SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 5. Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app
RUN npm install -g pnpm

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/haderos
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=haderos
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    restart: always

volumes:
  postgres_data:
```

### التشغيل

```bash
docker-compose up -d
```

---

## 6. إعداد CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: |
          cd apps/haderos-web
          pnpm install

      - name: Build
        run: |
          cd apps/haderos-web
          pnpm build

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/HADEROS-AI-CLOUD
            git pull origin main
            cd apps/haderos-web
            pnpm install
            pnpm build
            pm2 restart haderos
```

---

## المراقبة والصيانة

### إعداد المراقبة

```bash
# تثبيت PM2 Monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# مراقبة النظام
pm2 monit
```

### النسخ الاحتياطي

```bash
# نسخ قاعدة البيانات
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# أتمتة النسخ الاحتياطي
# في crontab -e
0 2 * * * pg_dump $DATABASE_URL > /backups/backup_$(date +\%Y\%m\%d).sql
```

### التحديث

```bash
cd /var/www/HADEROS-AI-CLOUD
git pull origin main
cd apps/haderos-web
pnpm install
pnpm build
pm2 restart haderos
```

---

## قائمة التحقق قبل الإطلاق

- [ ] قاعدة البيانات جاهزة ومتصلة
- [ ] جميع المتغيرات البيئية معدة
- [ ] SSL مفعل (HTTPS)
- [ ] النسخ الاحتياطي مجدول
- [ ] المراقبة مفعلة
- [ ] اختبار الـ Webhooks
- [ ] اختبار الدفع
- [ ] اختبار الشحن
- [ ] فحص الأداء

---

## الدعم

للمساعدة في النشر:
- 📧 support@haderos.ai
- 📱 01000000000

---

**HADEROS AI Cloud** - دليل النشر الشامل
