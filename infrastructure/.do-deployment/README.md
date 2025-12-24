# 🚀 HaderOS Platform - DigitalOcean Deployment

> **الهدف**: نشر آمن ومستقل عن GitHub - مسار نشر منفصل مع GitHub كمصدر كود فقط

## 📁 محتويات المجلد

```
.do-deployment/
├── app.yaml              # إعدادات DigitalOcean App Platform
├── deploy.sh            # سكريبت النشر التلقائي
├── .env.production      # متغيرات البيئة للإنتاج
└── README.md            # هذا الملف
```

---

## 🔐 السياسة الأمنية

- ✅ `app.yaml` و `.env.production` موجودة **محلياً فقط** (في `.gitignore`)
- ✅ GitHub تحتوي على **الكود المصدري فقط** (pull-only)
- ✅ النشر يتم **يدويًا من محطتك** (لا توجد CI/CD تلقائية)
- ✅ لا توجد **credentials أو secrets** على GitHub

---

## ⚙️ الإعداد الأولي

### 1️⃣ تثبيت الأدوات المطلوبة

```bash
# DigitalOcean CLI
brew install doctl

# Authenticate
doctl auth init
# اتبع الخطوات، أدخل digitalocean.com API token

# تثبيت jq (معالج JSON)
brew install jq
```

### 2️⃣ تحديث متغيرات البيئة

```bash
cd .do-deployment

# حرّر ملف .env.production
nano .env.production

# أضف القيم الفعلية:
# - DATABASE_URL (من DigitalOcean Database Cluster)
# - SECRET_KEY (مفتاح عشوائي قوي)
# - KAIA_API_KEY (إن كان مطلوبًا)
# - إلخ...
```

### 3️⃣ تحديث app.yaml (إن لزم الأمر)

```bash
# عدّل إذا كانت لديك متطلبات خاصة
nano app.yaml
```

---

## 🚀 خطوات النشر

### الخيار 1: النشر الكامل (حذف القديم + إنشاء جديد) ✨

```bash
cd .do-deployment
chmod +x deploy.sh
./deploy.sh

# اختر: 1 (Delete old app and deploy fresh)
```

### الخيار 2: النشر البسيط (إنشاء فقط)

```bash
cd .do-deployment
./deploy.sh

# اختر: 2 (Create new app)
```

### الخيار 3: إعادة النشر (الحالي)

```bash
cd .do-deployment
./deploy.sh

# اختر: 3 (Redeploy current app)
```

---

## 📊 عرض الحالة

```bash
cd .do-deployment
./deploy.sh

# اختر: 4 (View current app status)
```

أو من Dashboard:
```bash
# فتح حالة التطبيق
doctl apps list --format Name,ID,Status,UpdatedAt

# فتح السجلات
doctl apps logs <app-id> --tail 100
```

---

## 🗑️ حذف التطبيق (احذر!)

```bash
cd .do-deployment
./deploy.sh

# اختر: 6 (Delete app)
```

⚠️ **ملاحظة**: حذف التطبيق **لن يحذف** قاعدة البيانات أو النطاق. ستحتفظ بهما.

---

## 🧪 اختبار بعد النشر

```bash
# تحقق من الصحة
curl https://haderosai.com/health

# عرض API docs
https://haderosai.com/api/docs

# اختبار نقطة نهاية أمان
curl https://haderosai.com/api/v1/security/stats
```

---

## 📋 ملاحظات مهمة

### التكلفة الشهرية
- 💰 $5/month - App Platform (Basic XXS)
- 💰 $15/month - PostgreSQL Managed Database
- **المجموع**: $20/month

### متطلبات DigitalOcean الموجودة
- ✅ Database Cluster: `app-0aa8268b-e1c8-4121-adfe-11a37780bc7b`
- ✅ Domain: `haderosai.com`
- ✅ Region: Frankfurt (FRA)

### GitHub
- ✅ Repository: `ka364/haderos-platform`
- ✅ Branch: `master`
- ✅ Role: **Source code only** (read-only)

---

## 🔄 Workflow النموذجي

```
1. طور الميزات locally
2. Push إلى GitHub (master)
3. اسحب التحديثات (git pull)
4. اختبر locally
5. انشر إلى DigitalOcean باستخدام deploy.sh
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: "doctl: command not found"
```bash
brew install doctl
doctl auth init
```

### المشكلة: "Not authenticated"
```bash
doctl auth init  # أدخل token جديد
```

### المشكلة: تعطل التطبيق بعد النشر
```bash
# عرض السجلات
doctl apps logs <app-id>

# تحقق من متغيرات البيئة
doctl apps get <app-id> --format Spec
```

### المشكلة: قاعدة البيانات غير متصلة
```bash
# تحقق من DATABASE_URL
# تأكد من أنه يتطابق مع cluster ID: app-0aa8268b-e1c8-4121-adfe-11a37780bc7b
```

---

## 📞 الدعم

للمزيد من المعلومات:
- 📖 [DigitalOcean Docs](https://docs.digitalocean.com)
- 🔧 [doctl CLI Docs](https://docs.digitalocean.com/reference/doctl)
- 🚀 [FastAPI Deployment](https://fastapi.tiangolo.com/deployment)

---

**آخر تحديث**: 2024-12-24 🕐
