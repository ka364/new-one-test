# 🔒 نظام الأمان المبسط - HaderOS

## نظرة عامة

نظام أمان **مبسط وسهل الاستخدام** مصمم للنسخة المحلية من HaderOS. يركز على:
- ✅ **الفاعلية**: يعمل بدون أي مشاكل
- ✅ **السهولة**: سهل الفهم والتعديل
- ✅ **البيانات التجريبية**: جميع البيانات في الذاكرة

## الملفات المنشأة

### 1. `server/security/index.ts` (Core Manager)
محرك الأمان الرئيسي:
```typescript
class SecurityManager {
  recordLoginAttempt(username, ip, success)  // تسجيل محاولة
  getStats()                                   // احصائيات عامة
  getBlockedUserInfo(username)                // معلومات الحساب المحظور
  getBlockedIPInfo(ip)                        // معلومات IP المحظور
  unblockUser(username)                       // فك حظر يدوي
  unblockIP(ip)                               // فك حظر IP يدوي
  clearAll()                                  // مسح الكل (للاختبار)
}
```

**المعايير:**
- تحظير بعد **5 محاولات فاشلة** (15 دقيقة)
- حظر IP بعد **10 محاولات فاشلة** (30 دقيقة)
- تنظيف تلقائي كل **24 ساعة**

### 2. `server/security/routes.ts` (API Endpoints)
API سهلة وواضحة:

```bash
POST   /api/security/login-attempt     # تسجيل محاولة تسجيل دخول
GET    /api/security/stats             # احصائيات الأمان
GET    /api/security/blocked-users     # قائمة الحسابات المحظورة
GET    /api/security/blocked-ips       # قائمة IP المحظورة
POST   /api/security/unlock-user/:name # فك حظر حساب
POST   /api/security/unblock-ip/:ip    # فك حظر IP
POST   /api/security/clear-all         # مسح الكل (test)
GET    /api/security/health            # فحص الصحة
```

### 3. `frontend/src/pages/SecurityDashboard.tsx` (UI)
لوحة تحكم جميلة وعملية:
- 📊 **نظرة عامة**: إحصائيات فورية
- 👥 **إدارة الحسابات**: فك الحظر اليدوي
- 🔒 **إدارة IPs**: حظر/فك حظر العناوين

## خطوات التثبيت

### 1️⃣ Backend Integration

أضف هذا في `backend/main.py` أو `backend/api/v1/router.py`:

```python
from backend.api.v1.endpoints import security

# في router.py
api_router.include_router(
    security.router,
    prefix="/security",
    tags=["security"]
)
```

إنشء ملف جديد: `backend/api/v1/endpoints/security.py`:

```python
from fastapi import APIRouter, Request
from backend.core.security import security_manager

router = APIRouter()

@router.post("/login-attempt")
async def record_login_attempt(request: Request):
    data = await request.json()
    username = data.get("username")
    success = data.get("success", False)
    ip = request.client.host
    
    result = security_manager.recordLoginAttempt(username, ip, success)
    
    return {
        "allowed": result.allowed,
        "message": result.message
    }

@router.get("/stats")
async def get_stats():
    return {"stats": security_manager.getStats()}

# ... باقي الـ endpoints
```

### 2️⃣ Frontend Integration

أضف في `frontend/src/App.tsx`:

```typescript
import SecurityDashboard from './pages/SecurityDashboard';

// في Routes
<Route path="/security" element={<SecurityDashboard />} />
```

### 3️⃣ Login Integration

أضف في `frontend/src/pages/Login.tsx`:

```typescript
// قبل محاولة تسجيل الدخول
const response = await axios.post('http://localhost:8000/api/v1/security/login-attempt', {
  username: email,
  success: false
});

if (!response.data.allowed) {
  setError(response.data.message);
  return;
}

// بعد نجاح التسجيل
await axios.post('http://localhost:8000/api/v1/security/login-attempt', {
  username: email,
  success: true
});
```

## اختبار سريع

```bash
# Terminal 1: شغل الـ Backend
cd /Users/ahmedmohamedshawkyatta/Documents/GitHub/haderos-platform
python -m uvicorn backend.main:app --reload

# Terminal 2: شغل الـ Frontend
npm run dev

# Terminal 3: اختبر API
curl -X POST http://localhost:8000/api/v1/security/login-attempt \
  -H "Content-Type: application/json" \
  -d '{"username":"test","success":false}'

# اتجه للمتصفح
# http://localhost:3000/security
```

## سيناريوهات الاختبار

### السيناريو 1: حظر الحساب
```
1. جرّب تسجيل دخول خاطئ 5 مرات
2. يجب أن يُحظر الحساب لمدة 15 دقيقة
3. سترى الحساب في لوحة التحكم
4. اضغط "فك الحظر" لفك الحظر فوراً
```

### السيناريو 2: حظر IP
```
1. جرّب 10 محاولات فاشلة من نفس IP
2. يجب أن يُحظر IP لمدة 30 دقيقة
3. سترى IP في لوحة التحكم
```

### السيناريو 3: تنظيف الاختبار
```
1. اضغط "مسح الكل" في لوحة التحكم
2. أو: curl -X POST http://localhost:8000/api/v1/security/clear-all
3. جميع البيانات تُمسح
```

## API Response Examples

### ✅ محاولة ناجحة
```json
{
  "allowed": true,
  "message": "محاولة التسجيل مسجلة",
  "ip": "127.0.0.1",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### ❌ حساب محظور
```json
{
  "allowed": false,
  "message": "الحساب محظور حالياً - 5 محاولات فاشلة. حاول مرة أخرى في 14 دقائق",
  "ip": "127.0.0.1",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### 📊 الإحصائيات
```json
{
  "stats": {
    "totalLoginAttempts": 23,
    "failedAttempts": 8,
    "lockedAccounts": 2,
    "blockedIPs": 1,
    "recentAttempts": [...]
  }
}
```

## المميزات

### ✨ في الإصدار الحالي
- ✅ تتبع محاولات التسجيل
- ✅ حظر الحسابات والـ IPs تلقائياً
- ✅ فك الحظر اليدوي
- ✅ إحصائيات فورية
- ✅ واجهة جميلة وعملية
- ✅ تنظيف تلقائي

### 🚀 يمكن إضافته لاحقاً
- تخزين الأحداث في قاعدة البيانات
- تنبيهات البريد الإلكتروني
- سجل تدقيق شامل
- حماية ضد brute force متقدمة
- إعدادات قابلة للتخصيص

## التكوين

لتغيير معايير الحظر، عدّل `server/security/index.ts`:

```typescript
// تغيير عدد المحاولات
const MAX_FAILED_ATTEMPTS = 5;           // محاولات قبل الحظر
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 دقيقة
const MAX_ATTEMPTS_PER_IP = 10;          // محاولات IP قبل الحظر
const LOCKOUT_DURATION_IP = 30 * 60 * 1000; // 30 دقيقة
```

## Troubleshooting

### المشكلة: Security API لا تستجيب
```bash
# تحقق من أن الـ Backend يعمل
curl http://localhost:8000/health

# تحقق من الـ port
lsof -i :8000

# تفعيل Debug mode
DEBUG=true python -m uvicorn backend.main:app --reload
```

### المشكلة: Dashboard لا تحمل البيانات
```bash
# تحقق من CORS
# تأكد أن backend يسمح بـ localhost:3000

# افتح الـ console
F12 في المتصفح
```

### المشكلة: البيانات تختفي بعد إعادة التشغيل
✅ **هذا طبيعي!** البيانات في الذاكرة فقط. إذا كنت تريد الاحتفاظ بها:
- أضف قاعدة بيانات (SQLite/PostgreSQL)
- اذكر ذلك في مشروع العمل

## الملفات المعنية

```
backend/
├── api/v1/
│   ├── endpoints/
│   │   └── security.py          # (جديد) API endpoints
│   └── router.py                # (تعديل) إضافة security router
└── core/
    └── security.py              # (جديد) SecurityManager class

frontend/
├── src/
│   ├── pages/
│   │   └── SecurityDashboard.tsx # (جديد) لوحة التحكم
│   ├── App.tsx                   # (تعديل) إضافة route
│   └── pages/Login.tsx           # (تعديل) إضافة security check
```

## الخلاصة

✅ نظام أمان **بسيط وفعال** للتطوير المحلي
✅ **سهل التعديل** والتوسع
✅ **بدون تعقيدات** غير ضرورية
✅ **آمن بما يكفي** للاختبار والتطوير

---

**تم الإنشاء بواسطة:** GitHub Copilot  
**آخر تحديث:** 2024  
**الحالة:** ✅ جاهز للاستخدام
