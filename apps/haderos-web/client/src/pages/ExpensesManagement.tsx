import { AdvancedHandsontableSpreadsheet } from '@/components/expenses/AdvancedHandsontableSpreadsheet';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Table2, TrendingUp } from 'lucide-react';

export default function ExpensesManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">إدارة المصروفات المتقدمة</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            نظام متكامل لإدارة المصروفات مع تحرير Excel-like وصيغ حسابية
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">الميزات المتاحة</CardTitle>
                <Table2 className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>✅ تحرير Excel-like</li>
                <li>✅ Copy/Paste</li>
                <li>✅ Drag & Fill</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">الصيغ الحسابية</CardTitle>
                <Calculator className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>✅ =SUM(), =AVERAGE()</li>
                <li>✅ عمليات حسابية</li>
                <li>✅ مراجع خلايا</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">التعاون</CardTitle>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>✅ تعليقات على الخلايا</li>
                <li>✅ تاريخ الإصدارات</li>
                <li>✅ مشاركة مع الفريق</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Spreadsheet Component */}
        <Card>
          <CardHeader>
            <CardTitle>جدول المصروفات</CardTitle>
            <CardDescription>
              يمكنك تحرير البيانات مباشرة في الجدول، إضافة صيغ حسابية، وتعليقات على الخلايا
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvancedHandsontableSpreadsheet
              hierarchyPath="1.0.0"
              stakeholderName="المصروفات العامة"
              sessionId={null} // سيتم إنشاء جلسة جديدة
              onSaveComplete={() => {
                console.log('تم الحفظ بنجاح!');
              }}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-sm">💡 نصائح الاستخدام</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              • <strong>التحرير:</strong> انقر مرتين على أي خلية للتحرير
            </p>
            <p>
              • <strong>النسخ واللصق:</strong> Ctrl+C / Ctrl+V للنسخ واللصق
            </p>
            <p>
              • <strong>الصيغ:</strong> ابدأ بـ = لإضافة صيغة (مثل: =SUM(B2:B10))
            </p>
            <p>
              • <strong>التعليقات:</strong> انقر بالزر الأيمن واختر "إضافة تعليق"
            </p>
            <p>
              • <strong>الحفظ:</strong> يتم الحفظ تلقائياً كل 3 ثوان
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
