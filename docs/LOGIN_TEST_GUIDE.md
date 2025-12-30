# 🔐 دليل اختبار تسجيل الدخول - HaderOS AI

**التاريخ:** 26 ديسمبر 2025  
**الحالة:** جاهز للاختبار

---

## 📋 الخطوة 1: إعداد قاعدة البيانات

### في Terminal، نفذ الأوامر التالية:

```bash
# 1. Navigate to project
cd /Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD/apps/haderos-web

# 2. Run SQL script
psql -h localhost -U ahmedmohamedshawkyatta -d haderos_dev -f setup_test_account.sql
```

**النتيجة المتوقعة:**
```sql
CREATE TABLE
CREATE INDEX
CREATE INDEX
INSERT 0 1
INSERT 0 1  
INSERT 0 1

 id |   username    |    employee_name     |         email          | email_verified | is_active
----+---------------+----------------------+------------------------+----------------+-----------
  1 | ahmed.shawky  | أحمد محمد شوقي عطا   | ahmed@haderosai.com    | t              | t
  2 | islam.shawky  | إسلام شوقي          | islam@nowshoes.com     | f              | t
  3 | test          | مستخدم تجريبي       | NULL                   | f              | t
```

---

## 🔑 الخطوة 2: حسابات الاختبار المتاحة

### الحساب 1: أحمد شوقي (مع بريد مفعّل) ✅
```
Username: ahmed.shawky
Password: test123
Email: ahmed@haderosai.com (مُفعّل)
```

**سيناريو الدخول:**
1. أدخل username + password
2. سيُرسل OTP إلى البريد
3. أدخل OTP للدخول

---

### الحساب 2: إسلام شوقي (بريد غير مفعّل) ⚠️
```
Username: islam.shawky
Password: test123
Email: islam@nowshoes.com (غير مُفعّل)
```

**سيناريو الدخول:**
1. أدخل username + password
2. سيُطلب منك تسجيل بريد Gmail
3. أدخل بريدك
4. سيُرسل OTP
5. أدخل OTP للدخول

---

### الحساب 3: Test User (بدون بريد) 🆕
```
Username: test
Password: test123
Email: لا يوجد
```

**سيناريو الدخول:**
1. أدخل username + password
2. سيُطلب منك تسجيل بريد Gmail
3. أدخل بريدك
4. سيُرسل OTP
5. أدخل OTP للدخول

---

## 🧪 الخطوة 3: اختبار سيناريوهات مختلفة

### السيناريو A: تسجيل دخول مباشر (حساب بريد مفعّل)

1. افتح المتصفح: `http://localhost:3002`
2. اضغط زر "تسجيل الدخول"
3. أدخل:
   ```
   Username: ahmed.shawky
   Password: test123
   ```
4. اضغط "دخول"
5. **النتيجة المتوقعة:**
   - رسالة: "تم إرسال رمز التحقق إلى بريدك الإلكتروني"
   - شاشة إدخال OTP

**⚠️ ملاحظة:** حالياً SendGrid غير مُفعّل، لذا لن يُرسل OTP فعلياً!

**الحل المؤقت:**
- افتح قاعدة البيانات وشوف OTP المُولّد:
  ```sql
  SELECT username, employee_name, otp_code, otp_expires_at
  FROM monthly_employee_accounts
  WHERE username = 'ahmed.shawky';
  ```
- استخدم OTP من القاعدة مباشرة

---

### السيناريو B: تسجيل دخول + تسجيل بريد جديد

1. افتح المتصفح: `http://localhost:3002`
2. اضغط زر "تسجيل الدخول"
3. أدخل:
   ```
   Username: test
   Password: test123
   ```
4. اضغط "دخول"
5. **النتيجة المتوقعة:**
   - شاشة تسجيل البريد الإلكتروني
6. أدخل بريدك (مثلاً: `your-email@gmail.com`)
7. اضغط "إرسال رمز التحقق"
8. **النتيجة المتوقعة:**
   - رسالة: "تم إرسال رمز التحقق"
   - شاشة إدخال OTP

---

### السيناريو C: استعادة كلمة المرور

1. في شاشة تسجيل الدخول
2. اضغط "نسيت كلمة المرور؟"
3. أدخل:
   ```
   Username: ahmed.shawky
   ```
4. اضغط "إرسال رمز التحقق"
5. **النتيجة المتوقعة:**
   - رسالة: "تم إرسال رمز التحقق إلى بريدك"
6. أدخل OTP
7. أدخل كلمة مرور جديدة
8. **النتيجة:** تم تغيير كلمة المرور

---

## 🔧 الخطوة 4: تفعيل SendGrid (اختياري)

### لإرسال OTP فعلياً عبر Gmail:

1. **احصل على SendGrid API Key:**
   - سجّل على [SendGrid.com](https://sendgrid.com)
   - أنشئ API Key

2. **أضف الـ API Key للـ .env:**
   ```bash
   # في ملف .env
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   SENDGRID_FROM_EMAIL=noreply@haderosai.com
   SENDGRID_FROM_NAME=HaderOS AI
   ```

3. **أعد تشغيل Server:**
   ```bash
   pnpm dev
   ```

4. **اختبر إرسال OTP:**
   - جرب تسجيل الدخول
   - يجب أن يصل OTP فعلياً لبريدك!

---

## 🐛 الخطوة 5: استكشاف الأخطاء

### المشكلة: لا يصل OTP

**السبب:** SendGrid غير مفعّل

**الحل:**
```sql
-- في psql:
SELECT otp_code FROM monthly_employee_accounts 
WHERE username = 'ahmed.shawky';
```
استخدم الـ OTP المعروض مباشرة

---

### المشكلة: "اسم المستخدم أو كلمة المرور غير صحيحة"

**الحلول:**
1. تأكد من تنفيذ `setup_test_account.sql`
2. تأكد من كتابة Username بالضبط: `ahmed.shawky`
3. كلمة المرور: `test123`

---

### المشكلة: "حدث خطأ في تسجيل الدخول"

**الحلول:**
1. تأكد من Server شغال: `http://localhost:3002`
2. تأكد من Database متصلة
3. افتح Browser Console (F12) وشوف الأخطاء

---

## 📊 الخطوة 6: فحص Logs

### في Terminal (حيث Server شغال):

**سترى Logs مثل:**
```
[Employee Auth] Login attempt: ahmed.shawky
[Employee Auth] Password valid
[Employee Auth] Email verified, sending OTP
[Email] Sending OTP to ahmed@haderosai.com
[Email] OTP: 123456 (expires in 10 min)
```

---

## 🎯 الخطوة 7: بعد تسجيل الدخول بنجاح

**ستدخل لـ Dashboard الرئيسي:**
```
✅ لوحة التحكم
✅ مرحباً، أحمد محمد شوقي عطا
✅ قائمة جانبية (Sidebar)
✅ أقسام:
   - Dashboard
   - الطلبات
   - المنتجات
   - المخزون
   - التقارير
   - الإعدادات
```

---

## 🚀 الخطوة 8: ماذا بعد؟

### بعد تسجيل الدخول بنجاح، يمكنك:

1. **استكشاف Dashboard:**
   - KPIs
   - Charts
   - Recent orders

2. **اختبار NOW SHOES Features:**
   - إضافة طلب جديد
   - تحديث المخزون
   - شحن طلب

3. **اختبار KAIA (Ethical Kernel):**
   - إنشاء معاملة
   - فحص التوافق الأخلاقي
   - عرض التوصيات

---

## 📝 ملاحظات مهمة

### ✅ ما يعمل:
- ✅ تسجيل الدخول بـ username/password
- ✅ التحقق من كلمة المرور (bcrypt)
- ✅ توليد OTP (6 digits)
- ✅ حفظ OTP في Database
- ✅ التحقق من OTP
- ✅ Session management

### ⚠️ ما يحتاج تفعيل:
- ⚠️ إرسال OTP عبر Email (SendGrid)
- ⚠️ Twilio للـ SMS OTP
- ⚠️ OAuth integration

### 🔜 قريباً:
- 🔜 Two-Factor Authentication (2FA)
- 🔜 Social Login (Google, Facebook)
- 🔜 Biometric authentication

---

## 🎓 كيف يعمل نظام المصادقة؟

### Flow Chart:

```
User
  ↓
[Login Page]
  ↓
Enter username + password
  ↓
[Backend: Check credentials]
  ↓
Valid? ──NO──> Error: "خطأ في البيانات"
  ↓ YES
  ↓
Email registered? ──NO──> [Ask for email]
  ↓ YES                      ↓
  ↓                    [Save email + Send OTP]
Generate OTP (6 digits)      ↓
  ↓                          ↓
Save OTP in DB          [Enter OTP]
  ↓                          ↓
Send OTP via Email           ↓
  ↓                          ↓
[Enter OTP] <────────────────┘
  ↓
Verify OTP
  ↓
Valid? ──NO──> Error + Increment attempts
  ↓ YES
  ↓
Mark email as verified
  ↓
Generate session token
  ↓
[Dashboard]
```

---

## 💾 بنية قاعدة البيانات

```sql
monthly_employee_accounts
├── id (PK)
├── username (UNIQUE)
├── password_hash (bcrypt)
├── employee_name
├── email
├── email_verified (BOOLEAN)
├── is_active (BOOLEAN)
├── otp_code (6 digits)
├── otp_expires_at (10 min)
├── otp_attempts (max 5)
├── created_at
├── last_login_at
└── updated_at
```

---

## 🔐 الأمان

### ✅ ممارسات الأمان المطبقة:

1. **Password Hashing:**
   - bcrypt مع cost factor 10
   - لا يتم تخزين كلمات مرور نصية

2. **OTP Security:**
   - 6 digits random
   - Expires بعد 10 دقائق
   - Max 5 attempts
   - Deleted بعد الاستخدام

3. **Session Security:**
   - Random 32-byte token
   - Stored securely
   - Auto-expire

4. **Rate Limiting:**
   - Max 5 OTP attempts
   - Account lock بعد فشل متكرر

---

## 📞 الدعم

### إذا واجهت مشكلة:

1. افتح Browser Console (F12)
2. شوف الأخطاء في Console
3. شوف Network tab للـ API calls
4. شوف Server logs في Terminal

---

**جاهز للاختبار؟ ابدأ الآن! 🚀**

**الخطوة الأولى:**
```bash
cd /Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD/apps/haderos-web
psql -h localhost -U ahmedmohamedshawkyatta -d haderos_dev -f setup_test_account.sql
```

**ثم افتح:** `http://localhost:3002`

---

**© 2025 HaderOS AI - جميع الحقوق محفوظة**
