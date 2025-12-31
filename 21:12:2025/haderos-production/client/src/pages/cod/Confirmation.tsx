/**
 * COD Stage 2: Confirmation (مكالمة التأكيد)
 */

import { CODWorkflowLayout } from '@/components/CODWorkflowLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, CheckCircle, XCircle } from 'lucide-react';

export default function ConfirmationPage() {
  const pendingOrders = [
    { id: 'COD-1001', customer: 'أحمد محمد', phone: '01012345678', amount: 1500, city: 'القاهرة' },
    { id: 'COD-1002', customer: 'فاطمة حسن', phone: '01098765432', amount: 2300, city: 'الجيزة' },
  ];

  return (
    <CODWorkflowLayout
      currentStage={2}
      title="مكالمة التأكيد"
      description="الاتصال بالعملاء لتأكيد الطلبات والتحقق من البيانات"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {pendingOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{order.id}</h3>
                    <p className="text-gray-600">{order.customer} - {order.city}</p>
                  </div>
                  <Badge className="bg-orange-500">قيد الانتظار</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">رقم الهاتف</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {order.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">المبلغ</p>
                    <p className="font-bold text-green-600">{order.amount.toLocaleString()} ج.م</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button style={{ backgroundColor: '#C62822' }} className="text-white flex-1">
                    <Phone className="h-4 w-4 ml-2" />
                    اتصال
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                    تأكيد
                  </Button>
                  <Button variant="outline">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات التأكيد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>قيد الانتظار</span>
                <span className="font-bold text-orange-600">12</span>
              </div>
              <div className="flex justify-between">
                <span>تم التأكيد</span>
                <span className="font-bold text-green-600">45</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CODWorkflowLayout>
  );
}
