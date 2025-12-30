# 🌍 HaderOS Platform - Offline Development Guide

## ملخص الحالة

**✅ مدعوم بالكامل:** بعد التثبيت الأول، يعمل كل شيء بدون إنترنت!

---

## ✅ ما الذي يعمل بدون إنترنت (100%)

### Backend Services
- ✅ جميع API endpoints (`/api/v1/*`)
- ✅ قاعدة البيانات SQLite
- ✅ Authentication & JWT
- ✅ Database queries
- ✅ Logging & Metrics

### Business Logic
- ✅ **Sharia Compliance Engine**
  - التحقق من الربا (Riba)
  - التحقق من الغرر (Gharar)
  - التحقق من الميسر (Maysir)
  - التحقق من الأنشطة الحرام

- ✅ **Bio-Modules** (7 وحدات حية)
  - Arachnid (كشف الحالات الشاذة)
  - Corvid (التعلم من الأخطاء)
  - Mycelium (توزيع الموارد)
  - Chameleon (التسعير الديناميكي)
  - Ant (تحسين المسارات)
  - Tardigrade (المرونة والحماية)
  - Cephalopod (سلطة القرار)

- ✅ **Risk Assessment**
  - تقييم مخاطر الاستثمار
  - تصنيف المخاطر
  - التوصيات

- ✅ **ML Models** (محاكاة)
  - Pattern recognition
  - Anomaly detection
  - Predictive analytics

### Frontend Features
- ✅ جميع صفحات React
- ✅ State management (Zustand)
- ✅ API calls (axios)
- ✅ UI Components (Tailwind CSS)
- ✅ Charts & Visualizations

### Data & Storage
- ✅ SQLite Database
- ✅ Local file storage
- ✅ Session management
- ✅ Browser local storage
- ✅ Cache (في الذاكرة)

---

## ⚠️ ما الذي قد يحتاج إنترنت (اختياري)

### Integration Services (اختياري - يمكن تعطيله)

| الخدمة | الحالة | الحل |
|--------|--------|------|
| **OpenAI/ChatGPT** | اختياري | ترك `OPENAI_API_KEY` فارغة |
| **Blockchain (Ethereum)** | اختياري | ترك `ETH_RPC_URL` فارغة |
| **Polygon Network** | اختياري | ترك `POLYGON_RPC_URL` فارغة |
| **Redis Cache** | اختياري | ترك `REDIS_URL` فارغة |
| **Kafka Streams** | اختياري | ترك `KAFKA_BOOTSTRAP_SERVERS` فارغة |
| **Sentry Monitoring** | اختياري | ترك `SENTRY_DSN` فارغة |

---

## 🚀 التثبيت للعمل بدون إنترنت

### 1. التثبيت الأول (يحتاج إنترنت)

```bash
# في الموقع الذي لديك إنترنت
git clone https://github.com/ka364/haderos-platform.git
cd haderos-platform
bash run.sh setup

# يثبّت:
# ✅ Python packages من PyPI
# ✅ Node packages من npm
# ✅ جميع المتطلبات
```

**الوقت المتوقع:** 10-15 دقيقة

### 2. إعدادات الوضع بدون إنترنت

تعديل `.env`:

```bash
# ترك هذه فارغة (اختياري)
OPENAI_API_KEY=
KAIA_SERVICE_URL=
ETH_RPC_URL=
POLYGON_RPC_URL=
REDIS_URL=
KAFKA_BOOTSTRAP_SERVERS=
SENTRY_DSN=
```

---

## 🎯 التشغيل بدون إنترنت

### التشغيل المحلي

```bash
# يعمل بدون إنترنت تماماً
bash run.sh both
```

### Offline Mode Configuration

إعدادات موصى بها للعمل بدون إنترنت:

```bash
# .env
DEBUG=True
DATABASE_URL=sqlite:///./haderos_dev.db
API_V1_PREFIX=/api/v1
SECRET_KEY=<any-value>
ALGORITHM=HS256

# CORS - يعمل محلياً فقط
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# اترك هذا فارغ للعمل بدون إنترنت
OPENAI_API_KEY=
KAIA_SERVICE_URL=
REDIS_URL=
KAFKA_BOOTSTRAP_SERVERS=
```

---

## 📡 دعم العمل بدون إنترنت

### مميزات مدمجة

#### 1. Local Database
```python
# backend/core/database.py
DATABASE_URL = "sqlite:///./haderos_dev.db"  # محلي بالكامل
```

#### 2. Mock/Offline Services
```python
# backend/kinetic/ml_models/risk_assessor.py
# جميع الحسابات محلية، لا تحتاج إنترنت

# backend/kernel/theology/compliance_checker.py
# التحقق من الامتثال محلي بالكامل
```

#### 3. In-Memory Cache
```python
# Bio-Modules استخدم in-memory storage
# لا يحتاجون إلى Redis
```

### معالجة الأخطاء للخدمات الخارجية

```python
# في backend/main.py
try:
    # محاولة الاتصال بخدمة خارجية
    response = requests.get(external_url)
except requests.exceptions.ConnectionError:
    # يعمل بدون المتصل
    logger.warning("External service unavailable, using local mode")
    return default_local_response()
```

---

## 🔍 اختبار الوضع بدون إنترنت

### اختبر الخادم

```bash
# في نافذة جديدة
curl http://localhost:8000/health

# نجاح: {"status":"healthy",...}
```

### اختبر API

```bash
# Bio-Modules
curl http://localhost:8000/api/v1/bio-modules/list

# Sharia Compliance
curl -X POST http://localhost:8000/api/v1/sharia/validate \
  -H "Content-Type: application/json" \
  -d '{...}'

# Risk Assessment
curl http://localhost:8000/api/v1/investments/risk
```

### اختبر Frontend

افتح في المتصفح:
- `http://localhost:3000`

يجب أن تعمل جميع الصفحات محلياً

---

## 💾 نقل البيانات بين الأجهزة

### نسخ قاعدة البيانات

```bash
# على جهاز به إنترنت
cp haderos_dev.db ~/Documents/haderos_backup.db

# انقل الملف إلى جهاز بدون إنترنت
# ثم ضعه في نفس الموقع
cp ~/Documents/haderos_backup.db /path/to/haderos-platform/
```

### نسخ كل شيء

```bash
# نسخة كاملة (مع المكتبات)
tar -czf haderos-offline.tar.gz .

# نسخة صغيرة (بدون node_modules و .venv)
tar -czf haderos-offline-small.tar.gz \
  --exclude='node_modules' \
  --exclude='.venv' \
  --exclude='.git' \
  .
```

---

## 🎯 Offline-First Development Workflow

### قبل الذهاب بدون إنترنت

```bash
# 1. تحديث جميع المكتبات
bash run.sh setup

# 2. اختبر الاتصال
curl http://localhost:8000/health

# 3. تأكد من كل شيء يعمل
bash run.sh both

# 4. نسخ احتياطية
cp haderos_dev.db ~/backup/
```

### أثناء العمل بدون إنترنت

```bash
# تشغيل عادي
bash run.sh both

# جميع الميزات متوفرة محلياً
# لا تحتاج إلى أي اتصال خارجي
```

### عند العودة للإنترنت

```bash
# تحديث المكتبات (اختياري)
bash run.sh clean
bash run.sh setup

# المزامنة مع Git
git pull origin main
git push origin feature-branch
```

---

## 🛠️ استكشاف الأخطاء

### المشكلة: "Connection refused"

**السبب:** محاولة الاتصال بخدمة خارجية

**الحل:** تجاهل الخطأ - يعمل النظام محلياً

```python
# يجب أن تتعامل مع هذا تلقائياً
# إذا لم يحدث، أبلغ عن المشكلة
```

### المشكلة: "API key required"

**السبب:** محاولة استخدام API خارجي بدون مفتاح

**الحل:** ترك المفتاح فارغاً في `.env`

```bash
# في .env
OPENAI_API_KEY=  # ترك فارغ
```

### المشكلة: Slowdown في Offline Mode

**السبب:** البحث عن خدمات خارجية قبل timeout

**الحل:** تقليل timeout times في `.env`

```python
# في backend/core/config.py
EXTERNAL_SERVICE_TIMEOUT = 2  # ثواني فقط
```

---

## 📊 مقاييس الأداء (Offline)

| العملية | المتوقع | الملاحظات |
|---------|---------|----------|
| تحميل الصفحة | < 500ms | محلي بالكامل |
| استدعاء API | < 100ms | SQLite سريع |
| معالجة Bio-Module | < 200ms | في الذاكرة |
| شاريا التحقق | < 50ms | حسابات محلية |
| تقييم المخاطر | < 150ms | ML محاكاة |

---

## 🔒 الأمان بدون إنترنت

### بيانات محلية فقط

```bash
# SQLite Database (محلي)
# لا تُرسل إلى أي خادم

# .env file (محلي)
# لا تُرسل إلى Git أو الإنترنت

# User sessions (محلي)
# في JWT tokens
```

### لا توجد مراقبة خارجية

```bash
# No Sentry monitoring
# No Google Analytics
# No third-party logging
# كل شيء محلي وآمن
```

---

## 💡 نصائح

1. **نسخ احتياطية منتظمة**
   ```bash
   cp haderos_dev.db ~/backup/haderos_$(date +%Y%m%d).db
   ```

2. **تحديث قبل الذهاب بدون إنترنت**
   ```bash
   git pull origin main
   bash run.sh setup
   ```

3. **اختبر الاتصال**
   ```bash
   curl -I http://example.com
   ```

4. **استخدم tmux أو screen للجلسات الدائمة**
   ```bash
   tmux new-session -d -s haderos
   tmux send-keys -t haderos "bash run.sh both" Enter
   ```

---

## 🎉 الخلاصة

| الجانب | الحالة |
|--------|--------|
| **تطوير محلي** | ✅ 100% مدعوم |
| **بدون إنترنت** | ✅ بالكامل بعد التثبيت |
| **العمل الجماعي** | ✅ عبر Git |
| **الإنتاج** | ✅ سيحتاج تهيئة إضافية |

**أنت جاهز للعمل بدون إنترنت! 🚀**

