# 🤝 دليل المساهمة - HADEROS AI Cloud
# Contributing Guide

**الإصدار:** 1.0.0
**آخر تحديث:** 2 يناير 2026

---

## 📋 جدول المحتويات

1. [مقدمة](#-مقدمة)
2. [البدء السريع](#-البدء-السريع)
3. [بيئة التطوير](#-بيئة-التطوير)
4. [دليل الأسلوب](#-دليل-الأسلوب)
5. [عملية المساهمة](#-عملية-المساهمة)
6. [أنواع المساهمات](#-أنواع-المساهمات)
7. [مراجعة الكود](#-مراجعة-الكود)
8. [الإصدارات](#-الإصدارات)
9. [مجتمع المساهمين](#-مجتمع-المساهمين)

---

## 👋 مقدمة

شكراً لاهتمامك بالمساهمة في **HADEROS AI Cloud**! نحن نرحب بجميع أنواع المساهمات:

- 🐛 **إصلاح الأخطاء** - Bug fixes
- ✨ **ميزات جديدة** - New features
- 📚 **تحسين التوثيق** - Documentation improvements
- 🧪 **اختبارات** - Tests
- 🌍 **ترجمات** - Translations
- 💡 **أفكار واقتراحات** - Ideas and suggestions

### 🎯 رؤيتنا

نظام تشغيل للاقتصاد الأخلاقي - يدعم الشركات المصرية والعربية بحلول متكاملة للتجارة الإلكترونية.

### 📜 قواعد السلوك

نلتزم بـ [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). نتوقع من جميع المساهمين:

- ✅ احترام جميع المشاركين
- ✅ قبول النقد البناء
- ✅ التركيز على ما هو أفضل للمجتمع
- ✅ إظهار التعاطف تجاه الآخرين

---

## 🚀 البدء السريع

### 1. Fork المشروع

```bash
# 1. Fork من GitHub UI
# 2. Clone الـ fork
git clone https://github.com/YOUR_USERNAME/HADEROS-AI-CLOUD.git
cd HADEROS-AI-CLOUD

# 3. إضافة upstream
git remote add upstream https://github.com/ka364/HADEROS-AI-CLOUD.git
```

### 2. إعداد بيئة التطوير

```bash
# تثبيت الحزم
cd apps/haderos-web
pnpm install

# نسخ ملف البيئة
cp .env.example .env

# إعداد قاعدة البيانات
pnpm drizzle-kit push

# تشغيل التطبيق
pnpm dev
```

### 3. إنشاء Branch جديد

```bash
# من main
git checkout main
git pull upstream main

# إنشاء branch جديد
git checkout -b feature/your-feature-name
# أو
git checkout -b fix/your-bug-fix
```

### 4. تقديم المساهمة

```bash
# التأكد من الكود
pnpm lint
pnpm typecheck
pnpm test

# Commit
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/your-feature-name

# إنشاء Pull Request من GitHub UI
```

---

## 🛠️ بيئة التطوير

### المتطلبات

| الأداة | الإصدار | الغرض |
|--------|---------|--------|
| **Node.js** | 18.0+ | Runtime |
| **pnpm** | 8.0+ | Package manager |
| **PostgreSQL** | 15.0+ | Database |
| **Git** | 2.30+ | Version control |

### الأدوات الموصى بها

| الأداة | الغرض |
|--------|--------|
| **VS Code** | IDE |
| **ESLint Extension** | Linting |
| **Prettier Extension** | Formatting |
| **GitLens** | Git visualization |
| **Thunder Client** | API testing |

### إعدادات VS Code الموصى بها

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

### هيكل المشروع

```
HADEROS-AI-CLOUD/
├── apps/
│   └── haderos-web/           # التطبيق الرئيسي
│       ├── src/               # React components
│       ├── server/            # Backend (tRPC)
│       │   ├── _core/         # Core utilities
│       │   ├── routers/       # API routers
│       │   └── services/      # Business logic
│       ├── drizzle/           # Database schemas
│       └── public/            # Static files
├── docs/                      # التوثيق
├── scripts/                   # أدوات المساعدة
└── packages/                  # Shared packages
```

---

## 📐 دليل الأسلوب

### TypeScript/JavaScript

```typescript
// ✅ نستخدم const بدلاً من let عند الإمكان
const items = [];

// ✅ نستخدم arrow functions
const handleClick = () => {};

// ✅ نستخدم async/await بدلاً من .then()
const data = await fetchData();

// ✅ نستخدم optional chaining
const name = user?.profile?.name;

// ✅ نستخدم nullish coalescing
const value = data ?? 'default';

// ✅ نستخدم template literals
const message = `Hello, ${name}!`;
```

### تسمية الملفات

```
✅ kebab-case للملفات: user-profile.ts
✅ PascalCase للـ Components: UserProfile.tsx
✅ camelCase للـ functions: getUserProfile.ts
✅ SCREAMING_SNAKE_CASE للـ constants: API_BASE_URL
```

### تسمية المتغيرات

```typescript
// ✅ أسماء واضحة ووصفية
const userProfile = await getUser(id);
const orderItems = cart.getItems();
const isLoading = true;
const hasPermission = checkPermission(user);

// ❌ تجنب الاختصارات غير الواضحة
const u = await getUser(id);  // ❌
const oi = cart.getItems();   // ❌
```

### React Components

```tsx
// ✅ Functional components مع TypeScript
interface UserCardProps {
  user: User;
  onClick?: () => void;
}

export function UserCard({ user, onClick }: UserCardProps) {
  return (
    <div onClick={onClick}>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// ✅ استخدام hooks بشكل صحيح
function useUserData(userId: string) {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setData).finally(() => setLoading(false));
  }, [userId]);

  return { data, loading };
}
```

### Database Schemas (Drizzle)

```typescript
// ✅ تسمية الجداول بالجمع
export const orders = pgTable('orders', {
  // ✅ id أولاً
  id: serial('id').primaryKey(),

  // ✅ الحقول الأساسية
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),

  // ✅ العلاقات
  customerId: integer('customer_id').references(() => customers.id),

  // ✅ timestamps آخراً
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### API Routers (tRPC)

```typescript
// ✅ تنظيم واضح
export const ordersRouter = router({
  // ✅ استخدام أسماء واضحة
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return OrderService.list(input);
    }),

  // ✅ فصل المنطق في Services
  create: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ input, ctx }) => {
      return OrderService.create(input, ctx.user);
    }),
});
```

### التعليقات

```typescript
// ✅ تعليقات للتوضيح فقط عند الحاجة
// حساب الضريبة المصرية (14% VAT)
const vatAmount = subtotal * 0.14;

// ❌ لا تعليقات للكود الواضح
// increment counter by 1
counter++; // ❌ غير ضروري
```

### Git Commits

نتبع [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# الصيغة
<type>(<scope>): <description>

# الأنواع
feat:     ميزة جديدة
fix:      إصلاح خطأ
docs:     توثيق
style:    تنسيق (لا تغييرات في الكود)
refactor: إعادة هيكلة
test:     اختبارات
chore:    مهام إدارية

# أمثلة
feat(orders): add WhatsApp order creation
fix(payment): resolve InstaPay timeout issue
docs(api): update payment endpoints
refactor(shipping): simplify Bosta integration
test(auth): add login flow tests
```

---

## 🔄 عملية المساهمة

### 1. البحث عن Issue

```markdown
# تحقق من Issues الموجودة:
https://github.com/ka364/HADEROS-AI-CLOUD/issues

# أو أنشئ Issue جديد:
- Bug Report
- Feature Request
- Question
```

### 2. إنشاء Branch

```bash
# Feature
git checkout -b feature/issue-123-add-payment-method

# Bug fix
git checkout -b fix/issue-456-login-error

# Docs
git checkout -b docs/issue-789-api-reference
```

### 3. التطوير

```bash
# تأكد من أن الكود يعمل
pnpm dev

# تشغيل الاختبارات
pnpm test

# فحص الأنواع
pnpm typecheck

# فحص الأسلوب
pnpm lint
```

### 4. Commit

```bash
# Stage changes
git add .

# Commit مع رسالة واضحة
git commit -m "feat(payment): add Fawry payment gateway

- Implement Fawry API integration
- Add payment status webhooks
- Update payment router

Closes #123"
```

### 5. Push و Pull Request

```bash
# Push
git push origin feature/issue-123-add-payment-method

# إنشاء PR من GitHub UI
```

### Pull Request Template

```markdown
## 📋 الوصف
وصف موجز للتغييرات.

## 🔗 Issue المرتبط
Closes #123

## 📝 نوع التغيير
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 📚 Documentation
- [ ] ♻️ Refactoring
- [ ] 🧪 Tests

## ✅ Checklist
- [ ] الكود يتبع دليل الأسلوب
- [ ] جميع الاختبارات تمر
- [ ] لا توجد أخطاء TypeScript
- [ ] التوثيق مُحدّث (إذا لزم)
- [ ] الكود مُراجع ذاتياً

## 📸 Screenshots (إذا كان تغيير UI)
```

---

## 📦 أنواع المساهمات

### 🐛 إصلاح الأخطاء

```bash
# 1. إعادة إنتاج الخطأ
# 2. إنشاء اختبار يفشل
# 3. إصلاح الخطأ
# 4. التأكد من نجاح الاختبار
# 5. تقديم PR
```

### ✨ ميزات جديدة

```bash
# 1. مناقشة الميزة في Issue أولاً
# 2. انتظار الموافقة
# 3. التطوير والاختبار
# 4. تقديم PR
```

### 📚 التوثيق

```markdown
# مواقع التوثيق:
- docs/                 # التوثيق العام
- README.md             # نظرة عامة
- CONTRIBUTING.md       # دليل المساهمة (هذا الملف)
- CHANGELOG.md          # سجل التغييرات
```

### 🧪 الاختبارات

```typescript
// موقع الاختبارات
apps/haderos-web/__tests__/

// تشغيل الاختبارات
pnpm test

// تشغيل اختبار محدد
pnpm test -- --grep "OrderService"
```

### 🌍 الترجمات

```typescript
// ملفات الترجمة
apps/haderos-web/src/locales/
├── ar.json    # العربية
├── en.json    # الإنجليزية
└── fr.json    # الفرنسية (مستقبلاً)
```

---

## 👀 مراجعة الكود

### للمراجعين

```markdown
# نقاط المراجعة:
✅ الكود يعمل ويحقق الهدف
✅ الأسلوب متوافق مع الدليل
✅ لا توجد مشاكل أمنية
✅ الأداء مقبول
✅ الاختبارات موجودة ومناسبة
✅ التوثيق مُحدّث
```

### للمساهمين

```markdown
# عند استلام تعليقات:
1. اقرأ التعليقات بعناية
2. اسأل للتوضيح إذا لزم
3. نفذ التغييرات المطلوبة
4. رد على كل تعليق
5. اطلب إعادة المراجعة
```

### حالات المراجعة

| الحالة | المعنى | الإجراء |
|--------|--------|---------|
| ✅ Approved | موافق | يمكن الدمج |
| 🔄 Changes Requested | مطلوب تغييرات | نفذ التغييرات |
| 💬 Comment | تعليق | رد على التعليق |

---

## 🏷️ الإصدارات

### Semantic Versioning

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └── إصلاحات أخطاء
  │     └──────── ميزات جديدة (backwards compatible)
  └────────────── تغييرات كبيرة (breaking changes)
```

### أمثلة

```
1.0.0 → 1.0.1  # إصلاح خطأ
1.0.1 → 1.1.0  # ميزة جديدة
1.1.0 → 2.0.0  # تغيير كبير
```

### عملية الإصدار

```bash
# 1. تحديث CHANGELOG.md
# 2. تحديث الإصدار
pnpm version patch  # أو minor أو major

# 3. Push مع Tags
git push origin main --tags

# 4. إنشاء Release من GitHub
```

---

## 👥 مجتمع المساهمين

### قنوات التواصل

| القناة | الغرض |
|--------|--------|
| **GitHub Issues** | Bug reports, feature requests |
| **GitHub Discussions** | أسئلة ونقاشات |
| **Discord** | محادثات مباشرة (قريباً) |
| **Email** | support@haderos.ai |

### الشكر والتقدير

نشكر جميع المساهمين! كل مساهمة مهمة:

- 🌟 المساهمون يظهرون في README.md
- 🏆 المساهمون المميزون يحصلون على شكر خاص
- 📜 جميع المساهمات مُوثقة في CHANGELOG.md

### الحصول على المساعدة

```markdown
# إذا واجهت مشكلة:
1. راجع التوثيق في docs/
2. ابحث في Issues الموجودة
3. اسأل في GitHub Discussions
4. أنشئ Issue جديد
```

---

## 📄 الترخيص

بالمساهمة في HADEROS AI Cloud، أنت توافق على أن مساهماتك ستكون مرخصة تحت نفس ترخيص المشروع.

---

## 🙏 شكراً لك!

شكراً لمساهمتك في HADEROS AI Cloud! معاً نبني مستقبل الاقتصاد الأخلاقي.

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   "كل سطر كود يساهم في بناء اقتصاد أكثر عدالة"           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

**HADEROS AI Cloud** - دليل المساهمة v1.0.0
