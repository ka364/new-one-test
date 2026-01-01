<div align="center">

# 🧬 HADEROS AI Cloud

### نظام تشغيل للاقتصاد الأخلاقي
### Operating System for Ethical Economy

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ka364/HADEROS-AI-CLOUD/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![tRPC](https://img.shields.io/badge/tRPC-11-398CCB.svg)](https://trpc.io/)

<br>

**منصة متكاملة للتجارة الإلكترونية في مصر والشرق الأوسط**

[البدء السريع](#-البدء-السريع) •
[الميزات](#-الميزات) •
[التوثيق](#-التوثيق) •
[المساهمة](#-المساهمة)

</div>

---

## 📊 نظرة سريعة

```
┌─────────────────────────────────────────────────────────────────────┐
│                      HADEROS AI Cloud v1.0.0                        │
├─────────────────────────────────────────────────────────────────────┤
│  📁 34 Database Schemas    │  🔌 70+ API Routers                    │
│  🧬 70 Bio-Modules         │  📝 66,000+ Lines of Code              │
│  🔗 6 External Integrations│  📚 30+ Documentation Files            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✨ الميزات

<table>
<tr>
<td width="50%">

### 🛒 إدارة الطلبات
- نظام طلبات متكامل (7 حالات)
- تتبع في الوقت الفعلي
- إدارة المرتجعات
- حساب تلقائي للضرائب

</td>
<td width="50%">

### 💳 بوابات الدفع المصرية
- COD (الدفع عند الاستلام)
- InstaPay
- PayMob
- Fawry
- المحافظ الإلكترونية

</td>
</tr>
<tr>
<td>

### 🚚 نظام الشحن
- تكامل Bosta
- تكامل J&T Express
- تتبع الشحنات
- COD Collection

</td>
<td>

### 📱 WhatsApp Commerce
- إنشاء الطلبات عبر WhatsApp
- الكتالوجات التفاعلية
- الرد الآلي
- تتبع المحادثات

</td>
</tr>
<tr>
<td>

### 💰 نظام التقسيط (BNPL)
- ValU
- Sympl
- Souhoola
- Contact

</td>
<td>

### 🏪 Shopify Integration
- مزامنة ثنائية الاتجاه
- Webhooks
- إدارة المخزون
- مزامنة الطلبات

</td>
</tr>
</table>

---

## 🧬 Bio-Modules

نظام مستوحى من الطبيعة لتحقيق المرونة والذكاء:

| Module | الوظيفة | الإلهام |
|--------|---------|---------|
| 🦠 **Tardigrade** | المرونة والاستدامة | دب الماء |
| 🦎 **Chameleon** | التكيف التلقائي | الحرباء |
| 🐙 **Cephalopod** | الذكاء الموزع | الأخطبوط |
| 🍄 **Mycelium** | الشبكات والتواصل | الفطريات |
| 🐦 **Corvid** | الذكاء والتعلم | الغراب |
| 🐜 **Ant Colony** | التنظيم الجماعي | مستعمرة النمل |

---

## 🚀 البدء السريع

### المتطلبات

- **Node.js** 18.0+
- **pnpm** 8.0+
- **PostgreSQL** 15.0+
- **Git** 2.30+

### التثبيت

```bash
# 1. Clone المشروع
git clone https://github.com/ka364/HADEROS-AI-CLOUD.git
cd HADEROS-AI-CLOUD

# 2. تشغيل سكريبت الإعداد التفاعلي
chmod +x scripts/full-setup.sh
./scripts/full-setup.sh

# أو التثبيت اليدوي:
cd apps/haderos-web
pnpm install
cp .env.example .env
pnpm drizzle-kit push
pnpm dev
```

### التحقق من الصحة

```bash
./scripts/health-check.sh
```

---

## 📂 هيكل المشروع

```
HADEROS-AI-CLOUD/
├── 📁 apps/
│   └── haderos-web/           # التطبيق الرئيسي
│       ├── src/               # React Components
│       ├── server/            # Backend (tRPC)
│       │   ├── _core/         # Core utilities
│       │   ├── routers/       # 70+ API routers
│       │   └── services/      # Business logic
│       └── drizzle/           # 34 Database schemas
│
├── 📁 docs/                   # التوثيق الشامل
│   ├── QUICK_START_AR.md      # البدء السريع
│   ├── API_REFERENCE_AR.md    # مرجع الـ API
│   ├── TECHNICAL_REFERENCE_AR.md  # المرجع الفني
│   └── generated/             # توثيق مُولّد تلقائياً
│
├── 📁 scripts/                # أدوات المساعدة
│   ├── full-setup.sh          # إعداد كامل
│   ├── generate-docs.sh       # توليد التوثيق
│   └── health-check.sh        # فحص الصحة
│
├── 📁 .github/                # GitHub templates
│   ├── ISSUE_TEMPLATE/        # قوالب الـ Issues
│   └── PULL_REQUEST_TEMPLATE.md
│
├── CONTRIBUTING.md            # دليل المساهمة
├── CHANGELOG.md               # سجل التغييرات
└── README.md                  # هذا الملف
```

---

## 🛠️ التقنيات

<table>
<tr>
<td align="center" width="96">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" height="48" alt="React" />
<br>React 19
</td>
<td align="center" width="96">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript" />
<br>TypeScript
</td>
<td align="center" width="96">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="48" height="48" alt="Node.js" />
<br>Node.js
</td>
<td align="center" width="96">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="48" height="48" alt="PostgreSQL" />
<br>PostgreSQL
</td>
</tr>
<tr>
<td align="center" width="96">
<img src="https://trpc.io/img/logo.svg" width="48" height="48" alt="tRPC" />
<br>tRPC
</td>
<td align="center" width="96">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="48" height="48" alt="Redis" />
<br>Redis
</td>
<td align="center" width="96">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="48" height="48" alt="Docker" />
<br>Docker
</td>
<td align="center" width="96">
<img src="https://vitejs.dev/logo.svg" width="48" height="48" alt="Vite" />
<br>Vite
</td>
</tr>
</table>

---

## 📚 التوثيق

### للمطورين
| الوثيقة | الوصف |
|---------|-------|
| [البدء السريع](docs/QUICK_START_AR.md) | إعداد في 5 دقائق |
| [مرجع الـ API](docs/API_REFERENCE_AR.md) | جميع الـ endpoints |
| [المرجع الفني](docs/TECHNICAL_REFERENCE_AR.md) | البنية والخدمات |
| [مخططات البنية](docs/ARCHITECTURE_DIAGRAMS.md) | Mermaid diagrams |

### للمستخدمين
| الوثيقة | الوصف |
|---------|-------|
| [دليل المبيعات الهاتفية](docs/USER_MANUAL_PHONE_SALES_AR.md) | للموظفين |
| [دليل WhatsApp Commerce](docs/USER_MANUAL_WHATSAPP_COMMERCE_AR.md) | للتجار |
| [دليل التقسيط](docs/USER_MANUAL_BNPL_AR.md) | نظام BNPL |
| [دليل CRM](docs/USER_MANUAL_UNIFIED_CRM_AR.md) | إدارة العملاء |

### للتشغيل
| الوثيقة | الوصف |
|---------|-------|
| [دليل النشر](docs/DEPLOYMENT_GUIDE_AR.md) | النشر للإنتاج |
| [حل المشاكل](docs/TROUBLESHOOTING_AR.md) | المشاكل الشائعة |
| [فهرس الوثائق](docs/INDEX.md) | جميع الوثائق |

---

## 🧪 الاختبار والبناء

```bash
# فحص الأنواع
pnpm typecheck

# فحص الأسلوب
pnpm lint

# البناء
pnpm build

# التشغيل للإنتاج
pnpm start
```

---

## 🤝 المساهمة

نرحب بجميع المساهمات! راجع [CONTRIBUTING.md](CONTRIBUTING.md) للتفاصيل.

```bash
# 1. Fork المشروع
# 2. إنشاء branch جديد
git checkout -b feature/amazing-feature

# 3. Commit التغييرات
git commit -m "feat: add amazing feature"

# 4. Push
git push origin feature/amazing-feature

# 5. إنشاء Pull Request
```

---

## 📋 سجل التغييرات

راجع [CHANGELOG.md](CHANGELOG.md) للتفاصيل الكاملة.

### v1.0.0 (2026-01-02)
- ✨ الإصدار الأول الكامل
- 🛒 نظام الطلبات المتكامل
- 💳 بوابات الدفع المصرية
- 🚚 تكامل الشحن
- 📱 WhatsApp Commerce
- 💰 نظام التقسيط

---

## 👥 أنواع المستخدمين

<table>
<tr>
<td align="center">🏭<br><b>المُصنّع</b><br>إدارة المنتجات</td>
<td align="center">🏪<br><b>التاجر</b><br>إدارة الطلبات</td>
<td align="center">🚚<br><b>شركة الشحن</b><br>تتبع الشحنات</td>
</tr>
<tr>
<td align="center">👔<br><b>الموظف</b><br>المبيعات الهاتفية</td>
<td align="center">📣<br><b>المسوّق</b><br>الحملات التسويقية</td>
<td align="center">👤<br><b>العميل</b><br>التسوق</td>
</tr>
</table>

---

## 📞 الدعم

- **التوثيق:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/ka364/HADEROS-AI-CLOUD/issues)
- **Email:** support@haderos.ai

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

<div align="center">

**صُنع بـ ❤️ من فريق HADEROS**

*نظام تشغيل للاقتصاد الأخلاقي*

[![GitHub stars](https://img.shields.io/github/stars/ka364/HADEROS-AI-CLOUD?style=social)](https://github.com/ka364/HADEROS-AI-CLOUD)
[![GitHub forks](https://img.shields.io/github/forks/ka364/HADEROS-AI-CLOUD?style=social)](https://github.com/ka364/HADEROS-AI-CLOUD/fork)

</div>
