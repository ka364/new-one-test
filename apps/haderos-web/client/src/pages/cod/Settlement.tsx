/**
 * COD Stage 8: Settlement (التسوية)
 */

import { CODWorkflowLayout } from '@/components/CODWorkflowLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Download, CheckCircle } from 'lucide-react';

export default function SettlementPage() {
  return (
    <CODWorkflowLayout
      currentStage={8}
      title="التسوية المالية"
      description="التسوية النهائية وإصدار الفواتير"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>دفعة التسوية #001</CardTitle>
                <Badge className="bg-green-500">جاهزة للتسوية</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">عدد الطلبات</p>
                    <p className="text-2xl font-bold">25</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المبلغ</p>
                    <p className="text-2xl font-bold text-green-600">45,000 ج.م</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">تفاصيل التسوية:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>إجمالي المبيعات:</span>
                    <span className="font-medium">50,000 ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>رسوم الشحن:</span>
                    <span className="font-medium text-red-600">-3,500 ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>رسوم COD:</span>
                    <span className="font-medium text-red-600">-1,500 ج.م</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>الصافي:</span>
                    <span className="text-green-600">45,000 ج.م</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button style={{ backgroundColor: '#C62822' }} className="text-white flex-1">
                  <CheckCircle className="h-4 w-4 ml-2" />
                  إتمام التسوية
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 ml-2" />
                  تحميل الفاتورة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>قيد التسوية</span>
                <span className="font-bold text-blue-600">3</span>
              </div>
              <div className="flex justify-between">
                <span>تمت التسوية</span>
                <span className="font-bold text-green-600">89</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>إجمالي الشهر</span>
                  <span className="text-green-600">450,000 ج.م</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CODWorkflowLayout>
  );
}
