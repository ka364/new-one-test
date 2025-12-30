# 📊 دليل تكامل Handsontable مع نظام HADEROS

## 🎯 نظرة عامة

تم دمج **Handsontable** - مكتبة جداول بيانات متقدمة - مع نظام HADEROS لتوفير تجربة Excel/Google Sheets كاملة داخل النظام مباشرة.

---

## ✨ الميزات الرئيسية

### 1. **تجربة Excel كاملة** 📊
- ✅ تحرير مباشر في الخلايا
- ✅ Copy/Paste من وإلى Excel
- ✅ Drag & Fill (سحب وملء)
- ✅ Undo/Redo
- ✅ Sorting & Filtering
- ✅ Column Resizing
- ✅ Context Menu

### 2. **الصيغ الحسابية (Formulas)** 🧮
- ✅ صيغ Excel القياسية: `=SUM()`, `=AVERAGE()`, `=COUNT()`
- ✅ عمليات حسابية: `=A2*0.15`, `=B5+C5`
- ✅ مراجع الخلايا: `=A1`, `=B2:B10`
- ✅ إعادة حساب تلقائي عند التغيير

### 3. **التعليقات على الخلايا (Comments)** 💬
- ✅ إضافة تعليقات على أي خلية
- ✅ أنواع تعليقات: ملاحظة، سؤال، تحذير، خطأ
- ✅ ردود على التعليقات (Threading)
- ✅ ذكر مستخدمين (@mentions)
- ✅ حل التعليقات (Resolve)

### 4. **تاريخ الإصدارات (Version History)** 🕐
- ✅ حفظ تلقائي لكل تغيير
- ✅ عرض جميع الإصدارات السابقة
- ✅ استعادة أي نسخة سابقة
- ✅ مقارنة بين الإصدارات
- ✅ وسوم للإصدارات المهمة

### 5. **المشاركة والتعاون (Collaboration)** 👥
- ✅ مشاركة الجداول مع الفريق
- ✅ صلاحيات متعددة: عرض، تعليق، تحرير، إدارة
- ✅ تتبع الوصول والتعديلات
- ✅ انتهاء صلاحية المشاركة

### 6. **المخططات البيانية (Charts)** 📈
- ✅ أعمدة (Bar)
- ✅ خطي (Line)
- ✅ دائري (Pie)
- ✅ مساحي (Area)
- ✅ تحديث تلقائي عند تغيير البيانات

### 7. **الاستيراد والتصدير** 📥📤
- ✅ تصدير إلى Excel (.xlsx)
- ✅ تصدير إلى CSV
- ✅ استيراد من Excel
- ✅ استيراد من CSV

---

## 📁 الملفات المُنشأة

### 1. **Schema** (قاعدة البيانات)
```
drizzle/schema-spreadsheet-collab.ts
```

**الجداول:**
- `spreadsheet_sessions` - جلسات الجداول
- `cell_comments` - تعليقات الخلايا
- `spreadsheet_versions` - تاريخ الإصدارات
- `spreadsheet_sharing` - المشاركة والصلاحيات
- `spreadsheet_edits` - التحرير التعاوني
- `spreadsheet_formulas` - الصيغ الحسابية
- `spreadsheet_charts` - المخططات البيانية

### 2. **Router** (API)
```
server/routers/spreadsheet-collab.ts
```

**Endpoints:**
- Session Management (4 endpoints)
- Comments (5 endpoints)
- Version History (5 endpoints)
- Sharing & Permissions (5 endpoints)
- Formulas (3 endpoints)
- Charts (4 endpoints)

**الإجمالي: 26 endpoint**

### 3. **Component** (واجهة المستخدم)
```
src/components/expenses/AdvancedHandsontableSpreadsheet.tsx
```

---

## 🚀 التثبيت والإعداد

### الخطوة 1: تثبيت المكتبات

```bash
cd /home/ubuntu/haderos-mvp

# تثبيت Handsontable
pnpm add handsontable @handsontable/react

# مكتبات إضافية
pnpm add xlsx file-saver
pnpm add @radix-ui/react-dialog @radix-ui/react-tabs
pnpm add sonner  # للإشعارات
```

### الخطوة 2: تطبيق Schema

```bash
# تطبيق التغييرات على قاعدة البيانات
pnpm db:push
```

أو يدوياً:

```sql
-- تشغيل SQL من schema-spreadsheet-collab.ts
psql -U your_user -d haderos_db -f schema-spreadsheet-collab.sql
```

### الخطوة 3: تسجيل Router

```typescript
// server/routers/_app.ts
import { spreadsheetCollabRouter } from './spreadsheet-collab';

export const appRouter = createTRPCRouter({
  // ... existing routers
  spreadsheet: spreadsheetCollabRouter,
});
```

### الخطوة 4: استخدام Component

```typescript
// في أي صفحة
import { AdvancedHandsontableSpreadsheet } from '~/components/expenses/AdvancedHandsontableSpreadsheet';

export default function ExpensesPage() {
  return (
    <AdvancedHandsontableSpreadsheet
      hierarchyPath="1.3.5"
      stakeholderName="مصنع الإلكترونيات"
      sessionId="session-uuid"
      onSaveComplete={() => console.log('Saved!')}
    />
  );
}
```

---

## 📖 أمثلة الاستخدام

### مثال 1: إنشاء جلسة جدول جديدة

```typescript
const { mutate: createSession } = trpc.spreadsheet.createSession.useMutation();

createSession({
  hierarchyPath: '1.3.5',
  hierarchyId: 'factory-123',
  name: 'مصروفات يناير 2025',
  description: 'جدول مصروفات المصنع لشهر يناير',
  type: 'expenses',
  config: {
    columns: ['title', 'amount', 'date', 'category'],
    filters: { category: 'operational' },
  },
});
```

### مثال 2: إضافة تعليق على خلية

```typescript
const { mutate: addComment } = trpc.spreadsheet.addComment.useMutation();

addComment({
  sessionId: 'session-uuid',
  hierarchyPath: '1.3.5',
  expenseId: 'expense-123',
  cellAddress: 'B5',
  rowIndex: 4,
  columnKey: 'amount',
  comment: 'هذا المبلغ يبدو مرتفعاً، يرجى المراجعة',
  commentType: 'question',
  mentions: ['user-456'],
});
```

### مثال 3: إضافة صيغة حسابية

```typescript
const { mutate: addFormula } = trpc.spreadsheet.addFormula.useMutation();

addFormula({
  sessionId: 'session-uuid',
  cellAddress: 'B11',
  rowIndex: 10,
  columnKey: 'total',
  formula: '=SUM(B2:B10)',
  formulaType: 'sum',
  dependencies: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'],
});
```

### مثال 4: مشاركة جدول مع مستخدم

```typescript
const { mutate: share } = trpc.spreadsheet.share.useMutation();

share({
  sessionId: 'session-uuid',
  userEmail: 'colleague@company.com',
  permission: 'edit',
  canExport: true,
  canShare: false,
  expiresAt: new Date('2025-12-31'),
});
```

### مثال 5: إنشاء مخطط

```typescript
const { mutate: createChart } = trpc.spreadsheet.createChart.useMutation();

createChart({
  sessionId: 'session-uuid',
  chartType: 'bar',
  title: 'المصروفات حسب الفئة',
  dataRange: 'A1:B10',
  config: {
    xAxis: { title: 'الفئة' },
    yAxis: { title: 'المبلغ' },
    colors: ['#3b82f6', '#10b981', '#f59e0b'],
  },
  width: 600,
  height: 400,
});
```

### مثال 6: استعادة نسخة سابقة

```typescript
const { mutate: restoreVersion } = trpc.spreadsheet.restoreVersion.useMutation();

restoreVersion({
  versionId: 'version-uuid',
});
```

---

## 🎨 التخصيص

### تخصيص الأعمدة

```typescript
const columns: Handsontable.ColumnSettings[] = [
  {
    data: 'title',
    title: 'العنوان',
    type: 'text',
    width: 200,
    validator: (value, callback) => {
      callback(value && value.length > 0);
    },
  },
  {
    data: 'amount',
    title: 'المبلغ',
    type: 'numeric',
    numericFormat: {
      pattern: '0,0.00',
      culture: 'ar-EG',
    },
    validator: (value, callback) => {
      callback(value > 0);
    },
  },
  {
    data: 'category',
    title: 'الفئة',
    type: 'dropdown',
    source: ['infrastructure', 'operational', 'marketing'],
  },
];
```

### تخصيص Cell Renderer

```typescript
const cellRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  
  // تلوين الخلايا حسب القيمة
  if (prop === 'status') {
    if (value === 'paid') {
      td.style.backgroundColor = '#d1fae5';
      td.style.color = '#065f46';
    } else if (value === 'overdue') {
      td.style.backgroundColor = '#fee2e2';
      td.style.color = '#991b1b';
    }
  }
  
  return td;
};
```

### تخصيص Context Menu

```typescript
const contextMenu = {
  items: {
    'row_above': { name: 'إدراج صف أعلى' },
    'row_below': { name: 'إدراج صف أسفل' },
    'remove_row': { name: 'حذف صف' },
    'separator1': '---------',
    'add_comment': {
      name: 'إضافة تعليق',
      callback: (key, selection) => {
        // منطق إضافة تعليق
      },
    },
    'add_formula': {
      name: 'إضافة صيغة',
      callback: (key, selection) => {
        // منطق إضافة صيغة
      },
    },
  },
};
```

---

## 🔒 الأمان والصلاحيات

### مستويات الصلاحيات

| الصلاحية | العرض | التعليق | التحرير | الحذف | التصدير | المشاركة |
|----------|-------|---------|---------|--------|---------|----------|
| **view** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **comment** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **edit** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### التحقق من الصلاحيات

```typescript
// في Router
const checkPermission = async (sessionId: string, userId: string, requiredPermission: string) => {
  const sharing = await db.select()
    .from(spreadsheetSharing)
    .where(and(
      eq(spreadsheetSharing.sessionId, sessionId),
      eq(spreadsheetSharing.userId, userId),
      eq(spreadsheetSharing.isActive, true)
    ))
    .limit(1);
  
  if (!sharing.length) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'ليس لديك صلاحية الوصول' });
  }
  
  const permissionLevels = ['view', 'comment', 'edit', 'admin'];
  const userLevel = permissionLevels.indexOf(sharing[0].permission);
  const requiredLevel = permissionLevels.indexOf(requiredPermission);
  
  if (userLevel < requiredLevel) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'صلاحيات غير كافية' });
  }
  
  return true;
};
```

---

## 📊 الأداء والتحسين

### 1. **Lazy Loading**
```typescript
// تحميل البيانات تدريجياً
const { data, fetchNextPage } = trpc.expenses.getExpenses.useInfiniteQuery({
  hierarchyPath,
  limit: 100,
});
```

### 2. **Virtualization**
```typescript
// تفعيل Virtualization في Handsontable
<HotTable
  data={data}
  height={600}
  renderAllRows={false}  // تفعيل virtualization
  viewportRowRenderingOffset={30}
/>
```

### 3. **Debouncing للحفظ التلقائي**
```typescript
const debouncedSave = useMemo(
  () => debounce((changes) => {
    handleSaveChanges(changes);
  }, 3000),
  []
);
```

### 4. **Indexing في قاعدة البيانات**
```sql
-- Indexes موجودة في Schema
CREATE INDEX cell_comments_session_id_idx ON cell_comments(session_id);
CREATE INDEX spreadsheet_versions_session_id_idx ON spreadsheet_versions(session_id);
CREATE INDEX spreadsheet_sharing_session_id_idx ON spreadsheet_sharing(session_id);
```

---

## 🐛 استكشاف الأخطاء

### مشكلة: Handsontable لا يظهر

**الحل:**
```typescript
// تأكد من استيراد CSS
import "handsontable/dist/handsontable.full.css";

// تأكد من تسجيل Modules
import { registerAllModules } from 'handsontable/registry';
registerAllModules();
```

### مشكلة: الصيغ لا تعمل

**الحل:**
```typescript
// تفعيل Formulas plugin
<HotTable
  formulas={true}
  // أو
  formulas={{
    engine: HyperFormula,
  }}
/>
```

### مشكلة: RTL لا يعمل

**الحل:**
```typescript
<HotTable
  language="ar-AR"
  layoutDirection="rtl"
/>
```

---

## 📚 الموارد الإضافية

### الوثائق الرسمية
- [Handsontable Docs](https://handsontable.com/docs/)
- [Handsontable React](https://handsontable.com/docs/react-data-grid/)
- [Formulas Plugin](https://handsontable.com/docs/formulas/)

### أمثلة
- [Handsontable Examples](https://handsontable.com/examples)
- [React Examples](https://handsontable.com/docs/react-data-grid/basic-example/)

---

## ✅ قائمة التحقق

- [ ] تثبيت المكتبات
- [ ] تطبيق Schema
- [ ] تسجيل Router
- [ ] إنشاء Component
- [ ] اختبار الميزات:
  - [ ] التحرير المباشر
  - [ ] الصيغ الحسابية
  - [ ] التعليقات
  - [ ] تاريخ الإصدارات
  - [ ] المشاركة
  - [ ] المخططات
  - [ ] الاستيراد/التصدير
- [ ] تطبيق الصلاحيات
- [ ] تحسين الأداء
- [ ] اختبار على بيئة الإنتاج

---

## 🎯 الخطوات التالية

1. ✅ **اختبار شامل** لجميع الميزات
2. ✅ **تحسين الأداء** للجداول الكبيرة
3. ✅ **إضافة Realtime Collaboration** (WebSockets)
4. ✅ **دعم المزيد من أنواع المخططات**
5. ✅ **تحسين UX** للموبايل

---

**النظام جاهز للاستخدام! 🎉**
