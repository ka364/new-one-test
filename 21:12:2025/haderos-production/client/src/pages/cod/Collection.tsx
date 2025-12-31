/**
 * COD Stage 7: Collection (التحصيل)
 */

import { CODWorkflowLayout } from '@/components/CODWorkflowLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle } from 'lucide-react';

export default function CollectionPage() {
  return (
    <CODWorkflowLayout
      currentStage={7}
      title="التحصيل"
      description="تحصيل المبالغ من شركات الشحن"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>COD-1001</CardTitle>
                <Badge className="bg-green-500">تم التسليم</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">المبلغ المحصل:</span>
                  <span className="text-2xl font-bold text-green-600">1,500 ج.م</span>
                </div>
                <div className="text-sm text-gray-600">
                  تم التسليم بتاريخ: 21 ديسمبر 2025
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>رسوم الشحن:</span>
                  <span>30 ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم COD (2%):</span>
                  <span>30 ج.م</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>الصافي:</span>
                  <span className="text-green-600">1,440 ج.م</span>
                </div>
              </div>

              <Button 
                style={{ backgroundColor: '#C62822' }} 
                className="text-white w-full"
              >
                <CheckCircle className="h-4 w-4 ml-2" />
                تأكيد التحصيل
              </Button>
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
                <span>قيد التحصيل</span>
                <span className="font-bold text-orange-600">8</span>
              </div>
              <div className="flex justify-between">
                <span>تم التحصيل</span>
                <span className="font-bold text-green-600">67</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>إجمالي المحصل</span>
                  <span className="text-green-600">125,400 ج.م</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CODWorkflowLayout>
  );
}
