# 🚀 خطة العمل لسد الفجوات وتحقيق الجاهزية الكاملة

**المشروع:** HADEROS AI CLOUD
**الهدف:** سد الفجوات الحرجة وتحقيق جاهزية 100% للإطلاق
**المدة الإجمالية:** 4-6 أسابيع
**الأولوية:** حرجة لنجاح الإطلاق

---

## 📋 المرحلة 1: الفجوات الحرجة (الأسبوع 1-2)

### 🔴 المهمة 1: نظام المصادقة الثنائية (2FA)
**الأولوية:** حرجة جداً
**المدة:** 3-5 أيام
**الجهد:** 40-50 ساعة

#### الخطوات التفصيلية:

**اليوم 1-2: البنية التحتية**
```typescript
// 1. تثبيت المكتبات المطلوبة
pnpm add speakeasy qrcode @types/qrcode

// 2. إنشاء schema قاعدة البيانات
// File: apps/haderos-web/drizzle/schema-2fa.ts
export const twoFactorSecrets = pgTable('two_factor_secrets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  secret: text('secret').notNull(),
  backupCodes: text('backup_codes').array(),
  enabled: boolean('enabled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. إنشاء خدمة 2FA
// File: apps/haderos-web/server/auth/2fa-service.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorService {
  generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `HADEROS (${email})`,
      issuer: 'HADEROS AI CLOUD',
    });
    return secret;
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return await QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });
  }

  generateBackupCodes(count = 10): string[] {
    // Generate 10 backup codes
    return Array.from({ length: count }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }
}
```

**اليوم 3: API Endpoints**
```typescript
// File: apps/haderos-web/server/routers/2fa.ts
import { router, protectedProcedure } from '../trpc';
import { TwoFactorService } from '../auth/2fa-service';

const twoFactorService = new TwoFactorService();

export const twoFactorRouter = router({
  // Setup 2FA
  setup: protectedProcedure.mutation(async ({ ctx }) => {
    const secret = twoFactorService.generateSecret(ctx.user.email);
    const qrCode = await twoFactorService.generateQRCode(secret.otpauth_url);

    // Store temp secret (not enabled yet)
    await db.insert(twoFactorSecrets).values({
      userId: ctx.user.id,
      secret: secret.base32,
      enabled: false,
    });

    return {
      secret: secret.base32,
      qrCode,
      manualEntryCode: secret.base32,
    };
  }),

  // Verify and enable 2FA
  verify: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const record = await db.query.twoFactorSecrets.findFirst({
        where: eq(twoFactorSecrets.userId, ctx.user.id),
      });

      if (!record) throw new Error('2FA not set up');

      const isValid = twoFactorService.verifyToken(record.secret, input.token);
      if (!isValid) throw new Error('Invalid token');

      // Generate backup codes
      const backupCodes = twoFactorService.generateBackupCodes();

      // Enable 2FA
      await db.update(twoFactorSecrets)
        .set({
          enabled: true,
          backupCodes: backupCodes,
        })
        .where(eq(twoFactorSecrets.userId, ctx.user.id));

      return { backupCodes };
    }),

  // Disable 2FA
  disable: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify password
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) throw new Error('Invalid password');

      await db.delete(twoFactorSecrets)
        .where(eq(twoFactorSecrets.userId, ctx.user.id));

      return { success: true };
    }),

  // Check if 2FA is enabled
  status: protectedProcedure.query(async ({ ctx }) => {
    const record = await db.query.twoFactorSecrets.findFirst({
      where: eq(twoFactorSecrets.userId, ctx.user.id),
    });

    return {
      enabled: record?.enabled ?? false,
      hasBackupCodes: (record?.backupCodes?.length ?? 0) > 0,
    };
  }),
});
```

**اليوم 4: واجهة المستخدم**
```typescript
// File: apps/haderos-web/client/src/pages/TwoFactorSetup.tsx
import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export function TwoFactorSetup() {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const setupMutation = trpc.twoFactor.setup.useMutation({
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('verify');
    },
  });

  const verifyMutation = trpc.twoFactor.verify.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep('complete');
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      {step === 'setup' && (
        <div>
          <h2>إعداد المصادقة الثنائية</h2>
          <p>احم حسابك بطبقة أمان إضافية</p>
          <button onClick={() => setupMutation.mutate()}>
            ابدأ الإعداد
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <h2>مسح رمز QR</h2>
          <img src={qrCode} alt="QR Code" />
          <p>أو أدخل الرمز يدوياً: {secret}</p>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="أدخل الرمز من التطبيق"
          />
          <button onClick={() => verifyMutation.mutate({ token })}>
            تحقق وتفعيل
          </button>
        </div>
      )}

      {step === 'complete' && (
        <div>
          <h2>✅ تم التفعيل بنجاح!</h2>
          <h3>رموز الاحتياطية (احفظها في مكان آمن)</h3>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div key={i} className="font-mono bg-gray-100 p-2">
                {code}
              </div>
            ))}
          </div>
          <button onClick={() => window.print()}>
            طباعة الرموز
          </button>
        </div>
      )}
    </div>
  );
}
```

**اليوم 5: التكامل مع نظام تسجيل الدخول**
```typescript
// File: apps/haderos-web/server/auth/login.ts
export async function login(email: string, password: string, twoFactorToken?: string) {
  // 1. Verify email and password
  const user = await verifyCredentials(email, password);
  if (!user) throw new Error('Invalid credentials');

  // 2. Check if 2FA is enabled
  const twoFactor = await db.query.twoFactorSecrets.findFirst({
    where: eq(twoFactorSecrets.userId, user.id),
  });

  if (twoFactor?.enabled) {
    // 3. Require 2FA token
    if (!twoFactorToken) {
      return {
        requiresTwoFactor: true,
        tempToken: generateTempToken(user.id), // Valid for 5 minutes
      };
    }

    // 4. Verify 2FA token
    const isValid = twoFactorService.verifyToken(twoFactor.secret, twoFactorToken);

    // 5. Check backup codes if token invalid
    if (!isValid) {
      const isBackupCode = twoFactor.backupCodes?.includes(twoFactorToken);
      if (isBackupCode) {
        // Remove used backup code
        await removeBackupCode(user.id, twoFactorToken);
      } else {
        throw new Error('Invalid 2FA token');
      }
    }
  }

  // 6. Generate session
  return createSession(user.id);
}
```

#### معايير القبول:
- [ ] يمكن للمستخدم تفعيل 2FA من الإعدادات
- [ ] يتم توليد QR Code صحيح
- [ ] التحقق من الرموز يعمل (Google Authenticator, Authy)
- [ ] 10 رموز احتياطية لكل مستخدم
- [ ] واجهة تسجيل دخول تدعم 2FA
- [ ] يمكن تعطيل 2FA بإدخال كلمة المرور
- [ ] اختبارات Unit Tests للتحقق من الرموز

---

### 🔴 المهمة 2: Landing Page احترافية
**الأولوية:** حرجة
**المدة:** 2-3 أيام
**الجهد:** 24-36 ساعة

#### الخطوات التفصيلية:

**اليوم 1: الهيكل والـ Hero Section**
```typescript
// File: apps/haderos-web/client/src/pages/Landing.tsx
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CTASection } from '@/components/landing/CTASection';

export function Landing() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}

// File: apps/haderos-web/client/src/components/landing/HeroSection.tsx
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
            نظام التشغيل للأعمال
            <span className="block text-indigo-600">
              في الأسواق الناشئة
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            منصة متكاملة لإدارة المبيعات، المخزون، المشاريع والمصروفات
            بتكلفة أقل بنسبة 95% من المنافسين العالميين
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/signup"
              className="rounded-md bg-indigo-600 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              ابدأ مجاناً
            </a>
            <a
              href="#demo"
              className="text-lg font-semibold text-gray-900"
            >
              شاهد العرض التوضيحي <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="mt-16">
            <img
              src="/dashboard-preview.png"
              alt="HADEROS Dashboard"
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
```

**اليوم 2: Features, Pricing, Testimonials**
```typescript
// File: apps/haderos-web/client/src/components/landing/FeaturesSection.tsx
const features = [
  {
    name: 'إدارة المبيعات',
    description: 'نظام CRM متكامل لتتبع العملاء والفرص التجارية',
    icon: '📊',
  },
  {
    name: 'إدارة المخزون',
    description: 'تتبع دقيق للمنتجات والكميات في الوقت الفعلي',
    icon: '📦',
  },
  {
    name: 'إدارة المشاريع',
    description: 'نظام 7×7 الثوري لتوسيع الأعمال',
    icon: '🚀',
  },
  {
    name: 'المساعد الذكي',
    description: 'AI Co-Pilot يساعدك في اتخاذ القرارات',
    icon: '🤖',
  },
  {
    name: 'التقارير والتحليلات',
    description: 'رؤى شاملة لأداء أعمالك',
    icon: '📈',
  },
  {
    name: 'أمان من الدرجة الأولى',
    description: 'حماية بمعايير البنوك لبياناتك',
    icon: '🔒',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">كل ما تحتاجه لإدارة أعمالك</h2>
          <p className="mt-4 text-xl text-gray-600">
            6 أنظمة متكاملة في منصة واحدة
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.name} className="bg-gray-50 p-6 rounded-lg">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// File: apps/haderos-web/client/src/components/landing/PricingSection.tsx
const plans = [
  {
    name: 'HADEROS',
    price: '$290',
    period: '/سنوياً',
    features: [
      '10 مستخدمين',
      'جميع الميزات',
      'دعم فني 24/7',
      'تحديثات مجانية',
      'تخزين غير محدود',
    ],
    highlighted: true,
  },
  {
    name: 'SAP',
    price: '$12,000',
    period: '/سنوياً',
    features: [
      '10 مستخدمين',
      'ميزات محدودة',
      'دعم بطيء',
      'تحديثات مدفوعة',
      'تخزين محدود',
    ],
    highlighted: false,
    comparison: 'وفر 97.5%',
  },
];

export function PricingSection() {
  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">تسعير شفاف وعادل</h2>
          <p className="mt-4 text-xl text-gray-600">
            وفر حتى 97.5% مقارنة بالمنافسين
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg p-8 ${
                plan.highlighted
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-300'
                  : 'bg-white'
              }`}
            >
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-xl">{plan.period}</span>
              </div>
              {plan.comparison && (
                <div className="mt-2 inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  {plan.comparison}
                </div>
              )}
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <span className="mr-2">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 w-full py-3 rounded-md font-semibold ${
                  plan.highlighted
                    ? 'bg-white text-indigo-600'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                ابدأ الآن
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**اليوم 3: SEO, Analytics, النشر**
```typescript
// File: apps/haderos-web/client/src/components/landing/SEO.tsx
import { Helmet } from 'react-helmet-async';

export function LandingSEO() {
  return (
    <Helmet>
      <title>HADEROS - نظام التشغيل للأعمال في الأسواق الناشئة</title>
      <meta
        name="description"
        content="منصة متكاملة لإدارة المبيعات، المخزون، المشاريع والمصروفات بتكلفة أقل 95% من SAP وOracle"
      />
      <meta
        name="keywords"
        content="ERP, CRM, نظام إدارة, مبيعات, مخزون, السعودية, مصر"
      />
      <meta property="og:title" content="HADEROS AI CLOUD" />
      <meta property="og:description" content="وفر 97.5% من تكاليف SAP" />
      <meta property="og:image" content="/og-image.png" />
      <meta property="og:url" content="https://haderos.ai" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
```

#### معايير القبول:
- [ ] Hero section مع CTA واضحة
- [ ] عرض 6 ميزات رئيسية
- [ ] جدول مقارنة الأسعار
- [ ] شهادات العملاء (3-5)
- [ ] نموذج تسجيل مباشر
- [ ] SEO optimization كاملة
- [ ] Mobile responsive
- [ ] Page speed > 90/100

---

### 🔴 المهمة 3: تشغيل وتوثيق الاختبارات
**الأولوية:** عالية
**المدة:** 1 يوم
**الجهد:** 8 ساعات

#### الخطوات:

**الصباح: تشغيل الاختبارات الحالية**
```bash
# 1. تشغيل جميع الاختبارات
cd apps/haderos-web
pnpm test

# 2. توليد تقرير التغطية
pnpm test --coverage

# 3. حفظ النتائج
pnpm test --coverage --reporter=json > test-results.json
```

**الظهر: إضافة اختبارات للميزات الأمنية**
```typescript
// File: apps/haderos-web/tests/security/rate-limiting.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/_core/index';

describe('Rate Limiting', () => {
  it('should block after 100 requests in 15 minutes', async () => {
    const requests = Array.from({ length: 101 }, (_, i) =>
      request(app).get('/api/health')
    );

    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body.error).toContain('Too many requests');
  });

  it('should block auth attempts after 5 tries', async () => {
    const requests = Array.from({ length: 6 }, (_, i) =>
      request(app)
        .post('/api/oauth/login')
        .send({ email: 'test@test.com', password: 'wrong' })
    );

    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];

    expect(lastResponse.status).toBe(429);
  });
});

// File: apps/haderos-web/tests/security/input-validation.test.ts
describe('Input Validation', () => {
  it('should sanitize XSS attempts', () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = sanitizeString(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
  });

  it('should block SQL injection patterns', () => {
    const malicious = "'; DROP TABLE users; --";
    expect(isSQLSafe(malicious)).toBe(false);
  });
});

// File: apps/haderos-web/tests/security/encryption.test.ts
describe('Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = 'sensitive data';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });
});
```

**المساء: توثيق النتائج**
```markdown
// File: apps/haderos-web/TEST_COVERAGE_REPORT.md
# تقرير تغطية الاختبارات

**تاريخ التقرير:** 30 ديسمبر 2025

## ملخص التغطية

| الوحدة | الاختبارات | النجاح | التغطية |
|--------|-----------|--------|----------|
| Security | 15 | 15/15 (100%) | 85% |
| Cache | 8 | 8/8 (100%) | 92% |
| Auth | 12 | 12/12 (100%) | 78% |
| API Routes | 25 | 24/25 (96%) | 65% |
| **الإجمالي** | **60** | **59/60 (98.3%)** | **75%** |

## النتائج التفصيلية

### Security Tests
- ✅ Rate Limiting (5/5)
- ✅ Input Validation (4/4)
- ✅ Encryption (3/3)
- ✅ CSRF Protection (3/3)

### Cache Tests
- ✅ Get/Set operations (3/3)
- ✅ TTL expiration (2/2)
- ✅ Stats tracking (3/3)

### الاختبار الفاشل
- ❌ `api/webhooks/shopify` - timeout issue (تحت المعالجة)

## التوصيات
1. رفع التغطية إلى 80%+ بإضافة اختبارات للـ edge cases
2. إضافة E2E tests مع Playwright
3. إعداد CI/CD pipeline للاختبارات التلقائية
```

#### معايير القبول:
- [ ] تشغيل جميع الاختبارات الحالية
- [ ] تغطية > 75% للكود الأمني
- [ ] توثيق النتائج في ملف markdown
- [ ] إصلاح الاختبارات الفاشلة
- [ ] إضافة 15+ اختبار أمني جديد

---

## 📋 المرحلة 2: التحسينات المتوسطة (الأسبوع 3-4)

### 🟡 المهمة 4: نظام التوطين (i18n)
**الأولوية:** متوسطة
**المدة:** 5-7 أيام
**الجهد:** 60-80 ساعة

#### البنية الأساسية (اليوم 1-2)
```bash
# تثبيت المكتبات
pnpm add react-i18next i18next i18next-http-backend
```

```typescript
// File: apps/haderos-web/client/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en', 'zh', 'id', 'ms'],
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'sales', 'inventory'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

#### ملفات الترجمة (اليوم 3-5)
```json
// File: apps/haderos-web/public/locales/ar/common.json
{
  "app": {
    "name": "HADEROS AI CLOUD",
    "tagline": "نظام التشغيل للأعمال"
  },
  "nav": {
    "dashboard": "لوحة التحكم",
    "sales": "المبيعات",
    "inventory": "المخزون",
    "reports": "التقارير",
    "settings": "الإعدادات"
  },
  "auth": {
    "login": "تسجيل الدخول",
    "logout": "تسجيل الخروج",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "forgotPassword": "نسيت كلمة المرور؟"
  },
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "add": "إضافة",
    "search": "بحث",
    "loading": "جاري التحميل...",
    "success": "تم بنجاح",
    "error": "حدث خطأ"
  }
}

// File: apps/haderos-web/public/locales/en/common.json
{
  "app": {
    "name": "HADEROS AI CLOUD",
    "tagline": "The Operating System for Business"
  },
  "nav": {
    "dashboard": "Dashboard",
    "sales": "Sales",
    "inventory": "Inventory",
    "reports": "Reports",
    "settings": "Settings"
  },
  // ... الترجمة الإنجليزية
}

// File: apps/haderos-web/public/locales/zh/common.json
{
  "app": {
    "name": "HADEROS AI CLOUD",
    "tagline": "企业操作系统"
  },
  "nav": {
    "dashboard": "仪表板",
    "sales": "销售",
    "inventory": "库存",
    "reports": "报告",
    "settings": "设置"
  },
  // ... الترجمة الصينية
}
```

#### التكامل في المكونات (اليوم 6-7)
```typescript
// File: apps/haderos-web/client/src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'id', name: 'Bahasa', flag: '🇮🇩' },
  { code: 'ms', name: 'Melayu', flag: '🇲🇾' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Select value={i18n.language} onValueChange={i18n.changeLanguage}>
      {languages.map((lang) => (
        <SelectItem key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </SelectItem>
      ))}
    </Select>
  );
}

// استخدام في المكونات
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('nav.dashboard')}</h1>
      <button>{t('common.add')}</button>
    </div>
  );
}
```

#### معايير القبول:
- [ ] 5 لغات مدعومة بالكامل
- [ ] 500+ مفتاح ترجمة
- [ ] مُحوّل اللغة في الواجهة
- [ ] RTL support للعربية
- [ ] حفظ اللغة المفضلة
- [ ] ترجمة رسائل الأخطاء
- [ ] ترجمة التواريخ والأرقام

---

### 🟡 المهمة 5: Playwright E2E Tests
**الأولوية:** متوسطة
**المدة:** 4-6 أيام
**الجهد:** 48-72 ساعة

#### التثبيت والإعداد (اليوم 1)
```bash
# تثبيت Playwright
pnpm add -D @playwright/test

# إنشاء ملف التكوين
npx playwright install
```

```typescript
// File: apps/haderos-web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### كتابة الاختبارات (اليوم 2-5)
```typescript
// File: apps/haderos-web/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'test@haderos.ai');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('لوحة التحكم');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'wrong@test.com');
    await page.fill('[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toBeVisible();
  });

  test('should require 2FA if enabled', async ({ page }) => {
    // Login with 2FA enabled account
    await page.goto('/login');
    await page.fill('[name="email"]', '2fa@haderos.ai');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show 2FA input
    await expect(page.locator('[name="twoFactorToken"]')).toBeVisible();
  });
});

// File: apps/haderos-web/e2e/sales.spec.ts
test.describe('Sales Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@haderos.ai');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create new sale', async ({ page }) => {
    await page.goto('/sales');
    await page.click('button:has-text("إضافة عملية بيع")');

    await page.fill('[name="customer"]', 'عميل جديد');
    await page.fill('[name="amount"]', '1000');
    await page.click('button[type="submit"]');

    await expect(page.locator('.success-toast')).toBeVisible();
    await expect(page.locator('table')).toContainText('عميل جديد');
  });

  test('should filter sales by date', async ({ page }) => {
    await page.goto('/sales');

    await page.fill('[name="startDate"]', '2025-01-01');
    await page.fill('[name="endDate"]', '2025-01-31');
    await page.click('button:has-text("بحث")');

    // Verify filtered results
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(5); // Assuming 5 results
  });
});

// File: apps/haderos-web/e2e/inventory.spec.ts
test.describe('Inventory Management', () => {
  test('should add product to inventory', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/inventory');

    await page.click('button:has-text("إضافة منتج")');
    await page.fill('[name="name"]', 'منتج تجريبي');
    await page.fill('[name="sku"]', 'TEST-001');
    await page.fill('[name="quantity"]', '100');
    await page.fill('[name="price"]', '50');
    await page.click('button[type="submit"]');

    await expect(page.locator('table')).toContainText('منتج تجريبي');
  });

  test('should show low stock warning', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/inventory');

    // Product with quantity < 10 should show warning
    await expect(page.locator('.low-stock-badge')).toBeVisible();
  });
});

// File: apps/haderos-web/e2e/reports.spec.ts
test.describe('Reports', () => {
  test('should generate sales report', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');

    await page.selectOption('[name="reportType"]', 'sales');
    await page.fill('[name="startDate"]', '2025-01-01');
    await page.fill('[name="endDate"]', '2025-01-31');
    await page.click('button:has-text("توليد التقرير")');

    await expect(page.locator('.report-chart')).toBeVisible();
    await expect(page.locator('.report-summary')).toContainText('إجمالي المبيعات');
  });

  test('should export report to PDF', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');

    // Generate report first
    await page.selectOption('[name="reportType"]', 'sales');
    await page.click('button:has-text("توليد التقرير")');

    // Export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("تصدير PDF")'),
    ]);

    expect(download.suggestedFilename()).toContain('sales-report');
  });
});
```

#### معايير القبول:
- [ ] 20+ اختبار E2E
- [ ] تغطية المسارات الحرجة
- [ ] اختبارات على 3 متصفحات
- [ ] اختبارات Mobile
- [ ] تقارير بصرية للفشل
- [ ] تكامل مع CI/CD

---

## 📋 المرحلة 3: التحسينات طويلة المدى (الأسبوع 5-6)

### 🟢 المهمة 6: Security Audit
**الأولوية:** عالية على المدى الطويل
**المدة:** 3-5 أيام
**الجهد:** 40-60 ساعة

#### الأدوات والخطوات:

**اليوم 1: Automated Security Scanning**
```bash
# 1. npm audit
npm audit --audit-level=moderate

# 2. Snyk
pnpm add -D snyk
npx snyk test
npx snyk monitor

# 3. OWASP Dependency Check
docker run --rm -v $(pwd):/src owasp/dependency-check \
  --scan /src --format ALL

# 4. Security Headers Check
npx securityheaders https://haderos.ai
```

**اليوم 2-3: OWASP ZAP Scanning**
```bash
# تشغيل ZAP في وضع Daemon
docker run -u zap -p 8080:8080 -d owasp/zap2docker-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080

# Spider + Active Scan
zap-cli quick-scan --self-contained \
  --start-options '-config api.disablekey=true' \
  http://localhost:3000

# توليد التقرير
zap-cli report -o security-report.html -f html
```

**اليوم 4-5: Manual Penetration Testing**
- SQL Injection attempts
- XSS attempts
- CSRF testing
- Authentication bypass
- Session hijacking
- Rate limiting bypass

#### Deliverables:
```markdown
// File: SECURITY_AUDIT_REPORT.md
# تقرير التدقيق الأمني

## النتائج

| الفئة | الحرجة | عالية | متوسطة | منخفضة |
|------|--------|------|--------|---------|
| Dependencies | 0 | 0 | 2 | 5 |
| OWASP Top 10 | 0 | 0 | 1 | 3 |
| Headers | 0 | 0 | 0 | 0 |
| **الإجمالي** | **0** | **0** | **3** | **8** |

## الدرجة النهائية: A+ (95/100)

### النقاط الحرجة (تم حلها)
- ✅ SQL Injection - محمي بالكامل (Parameterized queries)
- ✅ XSS - محمي بالكامل (Input sanitization)
- ✅ CSRF - محمي بالكامل (Token-based)

### التوصيات
1. تحديث 2 مكتبات قديمة (غير حرجة)
2. إضافة Content-Security-Policy-Report-Only
3. تفعيل Subresource Integrity
```

---

### 🟢 المهمة 7: Performance Monitoring
**الأولوية:** متوسطة
**المدة:** 2-3 أيام

```typescript
// File: apps/haderos-web/server/_core/performance.ts
import promClient from 'prom-client';

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Middleware
export function performanceMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path, status: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path,
      status: res.statusCode,
    });
  });

  next();
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

---

## 📊 جدول زمني شامل

| الأسبوع | المهمة | الحالة | الأولوية |
|---------|--------|--------|----------|
| **1** | 2FA Implementation | 🔴 حرجة | P0 |
| **1** | Landing Page | 🔴 حرجة | P0 |
| **1** | Test Documentation | 🔴 عالية | P1 |
| **2-3** | i18n System | 🟡 متوسطة | P2 |
| **3-4** | Playwright E2E | 🟡 متوسطة | P2 |
| **4** | Performance Metrics | 🟢 منخفضة | P3 |
| **5** | Security Audit | 🟢 منخفضة | P3 |
| **6** | Load Testing | 🟢 منخفضة | P4 |

---

## ✅ معايير الجاهزية للإطلاق

### Must Have (P0)
- [ ] 2FA مُنفّذة ومختبرة
- [ ] Landing Page منشورة
- [ ] 60+ اختبار تعمل بنجاح
- [ ] Security headers مُفعّلة
- [ ] SSL/TLS مُكوّن

### Should Have (P1-P2)
- [ ] i18n لـ 3 لغات على الأقل
- [ ] 20+ E2E tests
- [ ] Performance monitoring
- [ ] CI/CD pipeline

### Nice to Have (P3-P4)
- [ ] Security audit كامل
- [ ] Load testing
- [ ] 5 لغات كاملة

---

## 🎯 الخلاصة

**الوقت الإجمالي:** 4-6 أسابيع
**الجهد الإجمالي:** 200-300 ساعة
**الفريق المقترح:** 2-3 مطورين

**الجاهزية بعد الانتهاء:** 95%+

**ROI المتوقع:**
- تخفيض الثغرات الأمنية بنسبة 90%
- زيادة معدل التحويل بنسبة 40% (Landing Page)
- تقليل الأخطاء في الإنتاج بنسبة 70% (Tests)
- توسيع السوق إلى 5 دول (i18n)

---

**تاريخ الإنشاء:** 30 ديسمبر 2025
**الحالة:** جاهز للتنفيذ
**الموافقة المطلوبة:** إدارة المشروع
