# 🚀 دليل تفعيل الميزات المتقدمة - HADEROS AI CLOUD

**آخر تحديث:** 29 ديسمبر 2025
**الحالة:** ✅ جاهز للتفعيل والاختبار

---

## 🎯 نظرة عامة

هذا الدليل يشرح كيفية **تفعيل واختبار** الوحدات المتقدمة في HADEROS AI CLOUD:

```
✅ KAIA - محرك الامتثال الشرعي
✅ Sentinel - نظام المراقبة والتنبيهات
✅ AI Chat - الدردشة الذكية
✅ Bio-Modules - الوحدات الحيوية المستوحاة من البيولوجيا
✅ Blockchain - تكامل البلوكشين (تجريبي)
```

**جميع هذه الوحدات موجودة ومبرمجة بالكامل، فقط تحتاج للتفعيل!**

---

## 1️⃣ تفعيل KAIA (محرك الامتثال الشرعي)

### ما هو KAIA؟

**KAIA** = Knowledge-Augmented Islamic AI
- محرك ذكاء اصطناعي للامتثال الشرعي
- يفحص المعاملات المالية تلقائياً
- يكتشف: الربا، الغرر، الميسر، السلع المحرمة

### الميزات:

```
✅ كشف الربا (Interest Detection)
✅ كشف الغرر (Uncertainty Detection)
✅ كشف الميسر (Gambling Detection)
✅ فحص السلع المحرمة
✅ تقييم تلقائي للمعاملات
✅ توليد توصيات شرعية
✅ سجل تدقيق كامل
```

### خطوات التفعيل:

#### 1. تحديث ملف .env

```bash
# افتح الملف
nano apps/haderos-web/.env

# فعّل KAIA
ENABLE_KAIA=true
```

#### 2. إنشاء جداول القواعد الشرعية

```bash
# الاتصال بقاعدة البيانات
psql -U ahmedmohamedshawkyatta -d haderos_dev

# إنشاء جدول القواعد (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS ethical_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_name_ar VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    description TEXT,
    description_ar TEXT,
    logic_expression TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_review BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# إضافة قواعد أساسية
INSERT INTO ethical_rules (rule_name, rule_name_ar, category, severity, description, description_ar, is_active) VALUES
('No Interest (Riba)', 'منع الربا', 'riba', 'critical', 'Prohibit interest-bearing transactions', 'منع المعاملات الربوية', true),
('No Gambling (Maysir)', 'منع الميسر', 'maysir', 'critical', 'Prohibit gambling transactions', 'منع المعاملات القمارية', true),
('No Excessive Uncertainty (Gharar)', 'منع الغرر الفاحش', 'gharar', 'high', 'Prohibit transactions with excessive uncertainty', 'منع المعاملات ذات الغرر الفاحش', true);

\q
```

#### 3. إعادة تشغيل التطبيق

```bash
# من مجلد apps/haderos-web
pnpm dev
```

#### 4. اختبار KAIA

```bash
# استخدم API لاختبار معاملة
curl -X POST http://localhost:3000/api/trpc/kaia.evaluateTransaction \
  -H "Content-Type: application/json" \
  -d '{
    "transactionType": "purchase",
    "amount": 100,
    "description": "شراء منتج عادي"
  }'
```

### استخدام KAIA من Dashboard:

1. افتح: `http://localhost:3000/dashboard/kaia`
2. أدخل تفاصيل المعاملة
3. اضغط "تقييم"
4. شاهد النتيجة: موافق/مرفوض/يحتاج مراجعة

---

## 2️⃣ تفعيل Sentinel (نظام المراقبة)

### ما هو Sentinel؟

- نظام مراقبة في الوقت الفعلي
- كشف الأنماط الشاذة
- تنبيهات تلقائية
- مراقبة الأداء

### الميزات:

```
✅ مراقبة الأداء (Performance Monitoring)
✅ كشف الشذوذات (Anomaly Detection)
✅ تنبيهات فورية (Real-time Alerts)
✅ تتبع الأخطاء (Error Tracking)
✅ إحصائيات مباشرة (Live Metrics)
```

### خطوات التفعيل:

#### 1. تحديث .env

```bash
ENABLE_SENTINEL=true

# اختياري: إعدادات التنبيهات
SENTINEL_ALERT_EMAIL=admin@haderos.ai
SENTINEL_ALERT_WEBHOOK=https://hooks.slack.com/...
```

#### 2. إنشاء جداول المراقبة

```bash
psql -U ahmedmohamedshawkyatta -d haderos_dev

CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 2),
    metric_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    message TEXT NOT NULL,
    message_ar TEXT,
    metadata JSONB,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);

\q
```

#### 3. تشغيل Sentinel

```bash
pnpm dev
```

#### 4. عرض المراقبة

افتح: `http://localhost:3000/dashboard/sentinel`

---

## 3️⃣ تفعيل AI Chat (الدردشة الذكية)

### ما هو AI Chat؟

- دردشة ذكية مع GPT/Claude
- مساعد افتراضي للعملاء
- دعم فني تلقائي
- إجابات فورية

### الميزات:

```
✅ دعم متعدد اللغات (عربي/إنجليزي)
✅ سياق محادثة متصل
✅ ردود ذكية ومخصصة
✅ تكامل مع قاعدة البيانات
```

### خطوات التفعيل:

#### 1. الحصول على API Key

اختر أحد الخيارين:

**خيار A: OpenAI (GPT)**
```bash
# اذهب إلى: https://platform.openai.com/api-keys
# أنشئ API Key جديد
# انسخه
```

**خيار B: Anthropic (Claude)**
```bash
# اذهب إلى: https://console.anthropic.com
# أنشئ API Key جديد
# انسخه
```

#### 2. تحديث .env

```bash
# فعّل AI Chat
ENABLE_AI_CHAT=true

# أضف المفتاح (اختر واحد)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
# أو
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

#### 3. إنشاء جدول المحادثات

```bash
psql -U ahmedmohamedshawkyatta -d haderos_dev

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    model VARCHAR(50),
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_user ON chat_messages(user_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at);

\q
```

#### 4. تشغيل التطبيق

```bash
pnpm dev
```

#### 5. اختبار الدردشة

افتح: `http://localhost:3000/chat`

**مثال محادثة:**
```
أنت: مرحباً، ما هي أسعار الأحذية المتاحة؟
المساعد: مرحباً! لدينا مجموعة متنوعة من الأحذية. الأسعار تبدأ من 299 جنيه...
```

---

## 4️⃣ تفعيل Bio-Modules (الوحدات الحيوية)

### ما هي Bio-Modules؟

وحدات ذكاء اصطناعي مستوحاة من الكائنات الحية:

```
🐜 Ant - التحسين الجماعي
🕷️ Arachnid - الاستكشاف والبحث
🐙 Cephalopod - التكيف السريع
🦎 Chameleon - التمويه والحماية
🐦 Corvid - حل المشاكل المعقدة
🍄 Mycelium - التواصل الشبكي
🐻 Tardigrade - المرونة والصمود
```

### خطوات التفعيل:

#### 1. تحديث .env

```bash
ENABLE_BIO_MODULES=true
```

#### 2. تشغيل التطبيق

```bash
pnpm dev
```

#### 3. الوصول إلى Dashboard

افتح: `http://localhost:3000/dashboard/bio-modules`

#### 4. اختبار الوحدات

```bash
# اختبار سريع
curl http://localhost:3000/api/trpc/bioModules.getStatus
```

---

## 5️⃣ تفعيل Blockchain (تجريبي)

### ما هو Blockchain Integration؟

- تكامل Web3
- عقود ذكية (Smart Contracts)
- معاملات آمنة ولامركزية

### خطوات التفعيل:

#### 1. تحديث .env

```bash
ENABLE_BLOCKCHAIN=true

# إعدادات Web3 (اختياري)
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
CONTRACT_ADDRESS=0x...
```

#### 2. تشغيل التطبيق

```bash
pnpm dev
```

**⚠️ ملاحظة:** Blockchain لا يزال تجريبياً ويحتاج إعداد إضافي للعقود الذكية.

---

## 🧪 سكريبت الاختبار الشامل

### إنشاء سكريبت اختبار:

```bash
# إنشاء الملف
nano apps/haderos-web/test-advanced-features.sh
```

```bash
#!/bin/bash

echo "🧪 اختبار الميزات المتقدمة - HADEROS AI CLOUD"
echo "================================================"
echo ""

# 1. KAIA Test
echo "1️⃣ اختبار KAIA..."
curl -s -X POST http://localhost:3000/api/trpc/kaia.evaluateTransaction \
  -H "Content-Type: application/json" \
  -d '{"transactionType":"purchase","amount":100}' | jq '.'
echo ""

# 2. Sentinel Test
echo "2️⃣ اختبار Sentinel..."
curl -s http://localhost:3000/api/trpc/sentinel.getMetrics | jq '.'
echo ""

# 3. AI Chat Test
echo "3️⃣ اختبار AI Chat..."
curl -s -X POST http://localhost:3000/api/trpc/chat.sendMessage \
  -H "Content-Type: application/json" \
  -d '{"message":"مرحباً"}' | jq '.'
echo ""

# 4. Bio-Modules Test
echo "4️⃣ اختبار Bio-Modules..."
curl -s http://localhost:3000/api/trpc/bioModules.getStatus | jq '.'
echo ""

echo "✅ اكتمل الاختبار!"
```

```bash
# جعله قابل للتنفيذ
chmod +x apps/haderos-web/test-advanced-features.sh

# تشغيله
./apps/haderos-web/test-advanced-features.sh
```

---

## 📊 لوحة التحكم الموحدة

بعد تفعيل جميع الميزات، يمكنك الوصول إلى:

### Dashboard الرئيسي:
```
http://localhost:3000/dashboard
```

### لوحات متخصصة:
```
http://localhost:3000/dashboard/kaia       - KAIA
http://localhost:3000/dashboard/sentinel   - Sentinel
http://localhost:3000/dashboard/bio-modules - Bio-Modules
http://localhost:3000/chat                 - AI Chat
```

---

## 🔧 استكشاف الأخطاء

### KAIA لا يعمل؟

```bash
# تحقق من الجداول
psql -U ahmedmohamedshawkyatta -d haderos_dev -c "\dt ethical_rules"

# تحقق من القواعد
psql -U ahmedmohamedshawkyatta -d haderos_dev -c "SELECT * FROM ethical_rules;"
```

### AI Chat لا يعمل؟

```bash
# تحقق من API Key
echo $OPENAI_API_KEY
# أو
echo $ANTHROPIC_API_KEY

# تحقق من .env
cat apps/haderos-web/.env | grep API_KEY
```

### Bio-Modules لا تظهر؟

```bash
# تحقق من التفعيل
cat apps/haderos-web/.env | grep ENABLE_BIO_MODULES

# يجب أن يكون: ENABLE_BIO_MODULES=true
```

---

## 📋 قائمة التحقق النهائية

### قبل الإعلان عن الجاهزية:

- [ ] **KAIA**
  - [ ] `ENABLE_KAIA=true` في .env
  - [ ] جدول ethical_rules منشأ
  - [ ] قواعد شرعية أساسية مضافة
  - [ ] اختبار معاملة ناجح

- [ ] **Sentinel**
  - [ ] `ENABLE_SENTINEL=true` في .env
  - [ ] جداول system_metrics و alerts منشأة
  - [ ] يعرض المقاييس بشكل صحيح

- [ ] **AI Chat**
  - [ ] `ENABLE_AI_CHAT=true` في .env
  - [ ] API Key مضاف (OpenAI أو Anthropic)
  - [ ] جدول chat_messages منشأ
  - [ ] محادثة تجريبية ناجحة

- [ ] **Bio-Modules**
  - [ ] `ENABLE_BIO_MODULES=true` في .env
  - [ ] Dashboard يعرض الوحدات
  - [ ] حالة الوحدات: نشط

- [ ] **Blockchain** (اختياري)
  - [ ] `ENABLE_BLOCKCHAIN=true` في .env
  - [ ] تكامل Web3 مُعد

---

## 🎯 الخلاصة

### ما تم:

```
✅ دليل شامل لتفعيل جميع الميزات المتقدمة
✅ خطوات واضحة لكل وحدة
✅ سكريبتات اختبار جاهزة
✅ استكشاف أخطاء شامل
✅ قائمة تحقق نهائية
```

### النتيجة:

**جميع الوحدات المتقدمة جاهزة للتفعيل والاختبار!**

```
🟢 KAIA - جاهز 100%
🟢 Sentinel - جاهز 100%
🟢 AI Chat - جاهز (يحتاج API Key)
🟢 Bio-Modules - جاهز 100%
🟡 Blockchain - جاهز (تجريبي)
```

---

**🚀 الآن يمكنك تسليم المشروع مع جميع الميزات قابلة للتفعيل!**
