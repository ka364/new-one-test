# 🚀 HaderOS Platform - DigitalOcean Deployment Guide

## 📋 المتطلبات

- حساب DigitalOcean
- دومين خاص (اختياري)
- 10 دقائق من وقتك

## 🎯 خطوات النشر السريع

### 1️⃣ إنشاء Droplet على DigitalOcean

1. افتح [DigitalOcean](https://cloud.digitalocean.com)
2. اضغط **Create** → **Droplets**
3. اختر الإعدادات التالية:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/month - 2GB RAM)
   - **Datacenter**: Amsterdam أو Frankfurt (الأقرب للشرق الأوسط)
   - **Authentication**: SSH Key (أو Password)
   - **Hostname**: haderos-production

4. اضغط **Create Droplet**

### 2️⃣ الاتصال بالسيرفر

```bash
# استبدل YOUR_SERVER_IP بـ IP السيرفر
ssh root@YOUR_SERVER_IP
```

### 3️⃣ تشغيل سكريبت النشر التلقائي

```bash
# تحميل السكريبت
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/haderos-platform/master/deploy.sh -o deploy.sh

# تشغيل السكريبت
chmod +x deploy.sh
sudo ./deploy.sh
```

السكريبت سيقوم بـ:
- ✅ تثبيت Docker & Docker Compose
- ✅ تثبيت Git
- ✅ استنساخ المشروع
- ✅ إعداد قاعدة البيانات
- ✅ توليد مفاتيح أمان قوية
- ✅ إعداد الـ Firewall
- ✅ تشغيل جميع الخدمات

### 4️⃣ اختبار النظام

```bash
# التحقق من الصحة
curl http://YOUR_SERVER_IP/health

# عرض الـ Logs
docker-compose logs -f backend
```

### 5️⃣ ربط الدومين (اختياري)

1. في إعدادات الدومين، أضف:
   ```
   A Record: @ → YOUR_SERVER_IP
   A Record: www → YOUR_SERVER_IP
   ```

2. انتظر 5-10 دقائق للتفعيل

3. قم بتثبيت SSL:
   ```bash
   # تثبيت Certbot
   apt-get install -y certbot python3-certbot-nginx
   
   # الحصول على شهادة SSL
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## 🔧 أوامر مفيدة

### مراقبة النظام
```bash
# عرض حالة الخدمات
docker-compose ps

# عرض الـ Logs
docker-compose logs -f

# عرض استخدام الموارد
docker stats
```

### تحديث النظام
```bash
cd /opt/haderos-platform
git pull
docker-compose up -d --build
```

### إعادة التشغيل
```bash
# إعادة تشغيل خدمة واحدة
docker-compose restart backend

# إعادة تشغيل الكل
docker-compose restart
```

### النسخ الاحتياطي
```bash
# نسخ قاعدة البيانات
docker-compose exec postgres pg_dump -U haderos haderos_platform > backup.sql

# استعادة النسخة الاحتياطية
docker-compose exec -T postgres psql -U haderos haderos_platform < backup.sql
```

## 📊 الخدمات المتاحة

| الخدمة | المنفذ | الوصف |
|--------|-------|-------|
| **Backend API** | 8000 | FastAPI Application |
| **PostgreSQL** | 5432 | Database |
| **Redis** | 6379 | Cache |
| **Nginx** | 80, 443 | Reverse Proxy |

## 🌐 نقاط الوصول (Endpoints)

- **API Docs**: http://YOUR_SERVER_IP/api/docs
- **Health Check**: http://YOUR_SERVER_IP/health
- **Metrics**: http://YOUR_SERVER_IP/metrics (محمي)
- **Security Dashboard**: http://YOUR_SERVER_IP/api/v1/security/stats

## 🔐 الأمان

السكريبت يقوم تلقائياً بـ:
- ✅ توليد كلمات مرور قوية
- ✅ إعداد Firewall
- ✅ تفعيل HTTPS (بعد ربط الدومين)
- ✅ تقييد الوصول للـ Metrics

## 💰 التكلفة المتوقعة

### الخيار الأساسي ($12/شهر)
- 2GB RAM
- 1 vCPU
- 50GB SSD
- 2TB Transfer
- ✅ مناسب للبداية

### الخيار الموصى به ($24/شهر)
- 4GB RAM
- 2 vCPUs
- 80GB SSD
- 4TB Transfer
- ✅ مناسب للإنتاج

## 🐛 حل المشاكل

### المشكلة: Backend لا يعمل
```bash
# عرض الـ Logs
docker-compose logs backend

# إعادة التشغيل
docker-compose restart backend
```

### المشكلة: قاعدة البيانات لا تستجيب
```bash
# التحقق من حالة PostgreSQL
docker-compose exec postgres pg_isready -U haderos

# عرض الـ Logs
docker-compose logs postgres
```

### المشكلة: استهلاك ذاكرة عالي
```bash
# عرض استخدام الموارد
docker stats

# تنظيف Docker
docker system prune -a
```

## 📞 الدعم الفني

إذا واجهت أي مشكلة:
1. راجع الـ Logs: `docker-compose logs -f`
2. تحقق من الـ Health: `curl http://localhost:8000/health`
3. أعد التشغيل: `docker-compose restart`

## 🎯 الخطوات التالية

بعد النشر الناجح:
1. ✅ اختبار جميع الـ APIs
2. ✅ إعداد النسخ الاحتياطي التلقائي
3. ✅ إضافة المراقبة (Monitoring)
4. ✅ إعداد التنبيهات (Alerts)
5. ✅ تحسين الأداء

---

**مبروك! 🎉 HaderOS أصبح على الإنترنت!**
