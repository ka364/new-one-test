# 🚀 HaderOS Platform - Local Development Setup

## ⚡ تشغيل سريع (Quick Start)

```bash
# 1. إعداد أول مرة
bash run.sh setup

# 2. تشغيل النظام كاملاً (الخيار الموصى به)
bash run.sh both
```

ثم افتح:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs

---

## 📋 المتطلبات الأساسية

| المتطلب | النسخة | الفحص |
|--------|--------|------|
| Python | 3.9+ | `python3 --version` |
| Node.js | 20+ | `node --version` |
| npm أو pnpm | أي نسخة | `npm --version` أو `pnpm --version` |
| Git | أي نسخة | `git --version` |

### التثبيت:

**على macOS (Homebrew):**
```bash
brew install python@3.11
brew install node
brew install pnpm  # (اختياري لكن موصى به)
```

**على Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip nodejs npm
npm install -g pnpm  # (اختياري)
```

**على Windows:**
- Python: https://www.python.org/downloads/
- Node.js: https://nodejs.org/
- pnpm: `npm install -g pnpm` (في cmd أو PowerShell)

---

## 🛠️ خطوات التثبيت المفصلة

### 1️⃣ المرة الأولى فقط

```bash
# انسخ المشروع
git clone https://github.com/ka364/haderos-platform.git
cd haderos-platform

# اجعل script التشغيل قابل للتنفيذ
chmod +x run.sh

# إعداد البيئة
bash run.sh setup
```

**ماذا يفعل setup:**
- ✅ يتحقق من تثبيت Python و Node
- ✅ ينشئ virtual environment للـ Python
- ✅ يثبت المكتبات من requirements.txt و package.json
- ✅ ينشئ قاعدة بيانات SQLite محلية
- ✅ ينشئ ملف .env بالإعدادات الافتراضية

### 2️⃣ التشغيل اليومي

**الخيار الأول (موصى به):** تشغيل الاثنين معاً
```bash
bash run.sh both
```
سيفتح نافذتي terminal أو tmux session واحدة

**الخيار الثاني:** تشغيل منفصل

في **النافذة 1** (Backend):
```bash
bash run.sh backend
```

في **النافذة 2** (Frontend):
```bash
bash run.sh frontend
```

---

## 🌐 الروابط المتاحة

| الخدمة | الرابط | الوصف |
|--------|--------|-------|
| Frontend | http://localhost:3000 | تطبيق React |
| Backend API | http://localhost:8000 | FastAPI Server |
| API Documentation | http://localhost:8000/api/docs | Swagger UI |
| Health Check | http://localhost:8000/health | حالة الخادم |
| Prometheus Metrics | http://localhost:8000/metrics | مقاييس الأداء |

---

## 📡 العمل بدون إنترنت (Offline Mode)

**بعد التثبيت الأول، يعمل كل شيء بدون إنترنت:**

### ✅ ما يعمل محليًا:
- ✅ جميع API endpoints
- ✅ قاعدة البيانات (SQLite)
- ✅ Bio-Modules والمنطق التجاري
- ✅ التحقق من Sharia compliance
- ✅ Risk assessment
- ✅ Dynamic pricing

### ⚠️ ما يحتاج إنترنت (اختياري):
- ⚠️ OpenAI/ChatGPT integration (يمكن تعطيله)
- ⚠️ Blockchain connections (يمكن محاكاتها)
- ⚠️ بعض الخدمات الخارجية (اختيارية)

### تفعيل الوضع الكامل بدون إنترنت:

تعديل `.env`:
```bash
# اترك هذه فارغة
OPENAI_API_KEY=
KAIA_SERVICE_URL=http://localhost:8080  # محلي
ETH_RPC_URL=
POLYGON_RPC_URL=
REDIS_URL=
KAFKA_BOOTSTRAP_SERVERS=
```

---

## 🔧 الأوامر المتاحة

### البدء والإعداد
```bash
bash run.sh setup       # إعداد كامل (أول مرة فقط)
bash run.sh both        # تشغيل Backend + Frontend
bash run.sh backend     # Backend فقط
bash run.sh frontend    # Frontend فقط
```

### التنظيف والصيانة
```bash
bash run.sh clean       # حذف node_modules و .venv
bash run.sh reset-db    # حذف قاعدة البيانات (ستُعاد إنشاؤها)
```

### معلومات
```bash
bash run.sh help        # عرض المساعدة الكاملة
```

---

## 🐛 حل المشاكل الشائعة

### ❌ الخطأ: "Port 3000 is already in use"

**السبب:** تطبيق آخر يستخدم المنفذ

**الحل:**
```bash
# Unix/Mac: ابحث عن العملية واقتلها
lsof -i :3000
kill -9 <PID>

# أو شغّل Frontend على منفذ آخر
PORT=3001 pnpm dev
```

---

### ❌ الخطأ: "ModuleNotFoundError"

**السبب:** المكتبات لم تثبت بشكل صحيح

**الحل:**
```bash
bash run.sh clean    # حذف كل شيء
bash run.sh setup    # إعادة تثبيت
```

---

### ❌ الخطأ: "Database is locked"

**السبب:** قاعدة البيانات مفتوحة في عملية أخرى

**الحل:**
```bash
# أوقف جميع نوافذ Backend
bash run.sh reset-db
bash run.sh backend
```

---

### ❌ الخطأ: "Command not found: python3"

**الحل:** ثبّت Python 3.9+

```bash
# macOS
brew install python@3.11

# Ubuntu
sudo apt install python3.11 python3.11-venv

# Windows
# حمّل من https://www.python.org/downloads/
```

---

## 📊 هيكل المشروع

```
haderos-platform/
├── backend/                    # FastAPI Backend
│   ├── main.py                # نقطة البدء
│   ├── api/v1/                # API endpoints
│   ├── core/                  # Core configs
│   ├── kernel/                # Business logic
│   ├── kinetic/               # ML models
│   ├── ledger/                # Blockchain
│   └── requirements.txt        # Python deps
│
├── haderos-mvp/               # React Frontend
│   ├── src/                   # Source code
│   ├── package.json           # Node deps
│   └── vite.config.ts         # Vite config
│
├── smart-contracts/           # Solidity contracts
├── run.sh                      # تشغيل سريع
├── .env                        # الإعدادات المحلية
└── README.md
```

---

## 🧪 اختبار التثبيت

تحقق من أن كل شيء يعمل:

```bash
# 1. تشغيل النظام
bash run.sh both

# 2. في نافذة جديدة، اختبر Backend
curl http://localhost:8000/health

# يجب أن تحصل على:
# {"status":"healthy","service":"haderos-platform","version":"1.0.0",...}

# 3. اختبر Frontend
curl http://localhost:3000

# 4. اختبر API endpoints
curl http://localhost:8000/api/v1/bio-modules/list

# 5. افتح المتصفح
# - Frontend: http://localhost:3000
# - API Docs: http://localhost:8000/api/docs
```

---

## 💡 نصائح الإنتاجية

### استخدام VSCode Terminal المدمج
```bash
# Ctrl + ` لفتح terminal
# يمكنك تقسيم الـ terminal وتشغيل backend و frontend
```

### استخدام tmux (متقدم)

```bash
# تشغيل في tmux
tmux new-session -d -s haderos
tmux new-window -t haderos:0 -c "$PWD" -n backend
tmux send-keys -t haderos:backend "bash run.sh backend" Enter

tmux new-window -t haderos:1 -c "$PWD" -n frontend
tmux send-keys -t haderos:frontend "bash run.sh frontend" Enter

# الالتقاء بـ session
tmux attach -t haderos

# التنقل بين النوافذ
# Ctrl+B ثم الأسهم
```

### متابعة الـ Logs

```bash
# Backend logs (في terminal Backend)
# ستشاهد جميع الطلبات والأخطاء

# Frontend logs (في terminal Frontend)
# ستشاهد رسائل Vite و React
```

### إعادة تشغيل سريعة

```bash
# Backend: سيعيد التحميل تلقائياً عند تعديل الملفات
# Frontend: سيحدّث الصفحة تلقائياً (Hot Module Replacement)
```

---

## 🔒 إعدادات الأمان

⚠️ **الإعدادات الحالية آمنة فقط للتطوير المحلي**

للإنتاج، غيّر:
```bash
# في .env
SECRET_KEY=<استخدم قيمة عشوائية طويلة قوية>
DEBUG=False
CORS_ORIGINS=<استخدم فقط النطاقات المأذون بها>
```

---

## 📞 الدعم والمساعدة

إذا واجهتك مشكلة:

1. **تحقق من المتطلبات:** `bash run.sh help`
2. **نظّف وأعد التثبيت:** `bash run.sh clean && bash run.sh setup`
3. **ابدأ من جديد:** `bash run.sh reset-db && bash run.sh setup`

---

## 🎉 خطوات اضافية (اختيارية)

### تثبيت أدوات إضافية

```bash
# لاختبار API
brew install httpie  # أفضل من curl

# للمراقبة
brew install htop

# للـ database viewing
brew install db-browser-for-sqlite
```

### استخدام Docker (متقدم)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

---

**الآن انت جاهز للعمل! 🚀**

```bash
bash run.sh both
# ثم افتح http://localhost:3000
```

