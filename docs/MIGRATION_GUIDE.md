# 🚀 دليل تنفيذ Employment Plan Migration

**التاريخ:** 26 ديسمبر 2025  
**الملف:** `employment_plan_schema.sql`  
**الهدف:** إنشاء 11 جدول + بيانات أولية

---

## ⚡ الطريقة السريعة (Recommended)

### في Terminal:

```bash
cd /Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD/apps/haderos-web

# إذا كان لديك psql مثبت:
psql -h localhost -U ahmedmohamedshawkyatta -d haderos_dev -f employment_plan_schema.sql
```

**النتيجة المتوقعة:**
```sql
CREATE TABLE
CREATE TABLE
... (11 times)
CREATE INDEX
... (7 times)
CREATE VIEW
... (3 times)
INSERT 0 3
INSERT 0 3
INSERT 0 11
```

---

## 🔧 الطريقة البديلة 1: pgAdmin / DBeaver

### الخطوات:

1. افتح pgAdmin أو DBeaver
2. اتصل بـ database: `haderos_dev`
3. افتح Query Tool
4. انسخ محتوى ملف `employment_plan_schema.sql`
5. الصق في Query window
6. اضغط Execute (F5)

---

## 🔧 الطريقة البديلة 2: VS Code PostgreSQL Extension

### الخطوات:

1. افتح VS Code
2. Install extension: "PostgreSQL" by Chris Kolkman
3. اتصل بـ database
4. افتح `employment_plan_schema.sql`
5. Right-click → Execute Query

---

## 🔧 الطريقة البديلة 3: من داخل Node.js

### أنشأت لك سكريبتين:

#### Option A: CommonJS
```bash
cd /Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD/apps/haderos-web

# تثبيت pg إذا لم يكن مثبت
pnpm add pg

# تشغيل
node run_employment_migration.js
```

#### Option B: ES Modules
```bash
cd /Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD/apps/haderos-web

# تشغيل
node migrate-employment.mjs
```

---

## 📋 التحقق من النجاح

### بعد تنفيذ Migration، نفذ هذا:

```sql
-- 1. عرض الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%employment%' 
   OR table_name LIKE '%cycle%'
   OR table_name LIKE '%pod%'
   OR table_name LIKE '%decision%'
   OR table_name LIKE '%sop%'
   OR table_name LIKE '%weekly%'
   OR table_name LIKE '%incident%'
   OR table_name LIKE '%leader%'
ORDER BY table_name;
```

**يجب أن ترى 11 جدول:**
```
core_pod_members
cycle_gates
decision_log
employment_cycles
gate_criteria
incident_log
new_leaders
pod_rotations
shadow_pod_members
standard_operating_procedures
weekly_reports
```

---

### 2. عرض البيانات الأولية:

```sql
-- الدورات
SELECT * FROM employment_cycles ORDER BY cycle_number;

-- البوابات
SELECT * FROM cycle_gates ORDER BY gate_number;

-- المعايير
SELECT * FROM gate_criteria ORDER BY gate_id, id;
```

**يجب أن ترى:**
- 3 دورات (اليوم 1-90, 91-180, 181-270)
- 3 بوابات (Gate-90, Gate-180, Gate-270)
- 11 معيار (4 للأولى، 3 للثانية، 4 للثالثة)

---

### 3. اختبار الـ Views:

```sql
-- التقدم الحالي
SELECT * FROM v_cycle_progress;

-- حالة البوابات
SELECT * FROM v_gates_status;

-- القوة العاملة
SELECT * FROM v_current_workforce;
```

---

## 🎯 بعد النجاح:

### يمكنك الآن:

#### 1. إضافة Core Pod Members:
```sql
INSERT INTO core_pod_members (
  full_name,
  role,
  join_date,
  is_founder,
  status
) VALUES
('أحمد محمد شوقي عطا', 'المدير التنفيذي والعمليات', '2025-12-26', TRUE, 'active'),
('أحمد عبد الغفار', 'المدير العام', '2025-12-26', TRUE, 'active'),
('محمد ماتع', 'قائد التكنولوجيا', '2025-12-26', TRUE, 'active'),
('أحمد الديب', 'قائد المنتجات والتسويق', '2025-12-26', TRUE, 'active'),
('حسن أحمد', 'قائد المالية', '2025-12-26', TRUE, 'active');
```

#### 2. تسجيل أول قرار:
```sql
INSERT INTO decision_log (
  decision_number,
  decision_title,
  decision_description,
  decision_type,
  impact_level,
  decision_maker,
  affected_pods,
  decision_date,
  status
) VALUES (
  'DEC-2025-001',
  'بدء الدورة الأولى',
  'الموافقة على بدء الدورة الأولى من خطة التوظيف 9 أشهر',
  'strategic',
  'critical',
  'المجلس التأسيسي',
  ARRAY['core'],
  '2025-12-26',
  'approved'
);
```

#### 3. إنشاء أول SOP:
```sql
INSERT INTO standard_operating_procedures (
  sop_code,
  sop_name,
  sop_category,
  description,
  owner_role,
  approval_status
) VALUES (
  'SOP-001',
  'استقبال الطلب',
  'order',
  'إجراءات استقبال ومعالجة طلبات العملاء',
  'قائد العمليات',
  'draft'
);
```

---

## 🐛 استكشاف الأخطاء

### خطأ: "relation already exists"
**السبب:** الجداول موجودة مسبقاً  
**الحل:** لا مشكلة! تأكد بالـ SELECT

### خطأ: "permission denied"
**السبب:** صلاحيات غير كافية  
**الحل:** تأكد من user صحيح

### خطأ: "database does not exist"
**السبب:** اسم database خاطئ  
**الحل:** تأكد من: `haderos_dev`

---

## 📞 الدعم

إذا واجهت مشكلة:

1. تأكد من Server شغال:
   ```bash
   pg_isready -h localhost
   ```

2. تأكد من Database موجود:
   ```bash
   psql -h localhost -U ahmedmohamedshawkyatta -l | grep haderos
   ```

3. جرب الاتصال اليدوي:
   ```bash
   psql -h localhost -U ahmedmohamedshawkyatta -d haderos_dev
   ```

---

## ✅ Checklist

بعد التنفيذ، تحقق من:

- [ ] 11 جدول موجودة
- [ ] 7 indexes موجودة
- [ ] 3 views موجودة
- [ ] 3 دورات في employment_cycles
- [ ] 3 بوابات في cycle_gates
- [ ] 11 معيار في gate_criteria
- [ ] Views تعمل بدون أخطاء

---

## 🎉 نجح!

**الآن لديك:**
- ✅ نظام تتبع كامل للخطة
- ✅ بيانات أولية جاهزة
- ✅ Views لسهولة الاستعلام
- ✅ جاهز للبدء في التتبع الفعلي!

---

**© 2025 حاضر 2030 - جميع الحقوق محفوظة**
