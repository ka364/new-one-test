/**
 * COD Stage 6: Delivery Tracking (تتبع التسليم)
 */

import { CODWorkflowLayout } from '@/components/CODWorkflowLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Clock } from 'lucide-react';

export default function DeliveryTrackingPage() {
  return (
    <CODWorkflowLayout
      currentStage={6}
      title="تتبع التسليم"
      description="متابعة حالة الشحنات أثناء التوصيل"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>COD-1001</CardTitle>
                <Badge className="bg-blue-500">في الطريق</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  <span>Bosta - رقم التتبع: BOS123456</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>الموقع الحالي: القاهرة - مركز التوزيع</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>الوصول المتوقع: اليوم 6:00 مساءً</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">سجل التتبع:</h4>
                <div className="space-y-2">
                  {[
                    { time: '10:00 ص', status: 'تم الاستلام من المستودع' },
                    { time: '11:30 ص', status: 'في مركز الفرز' },
                    { time: '2:00 م', status: 'خرج للتوصيل' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="text-gray-500">{log.time}</span>
                      <span>{log.status}</span>
                    </div>
                  ))}
                </div>
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
                <span>في الطريق</span>
                <span className="font-bold text-blue-600">15</span>
              </div>
              <div className="flex justify-between">
                <span>تم التسليم</span>
                <span className="font-bold text-green-600">52</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CODWorkflowLayout>
  );
}
