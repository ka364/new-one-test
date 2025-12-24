/**
 * COD Stage 5: Shipping Allocation (تخصيص الشحن)
 */

import { CODWorkflowLayout } from '@/components/CODWorkflowLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin } from 'lucide-react';

export default function ShippingAllocationPage() {
  return (
    <CODWorkflowLayout
      currentStage={5}
      title="تخصيص الشحن"
      description="تخصيص شركة الشحن المناسبة لكل طلب"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>COD-1001</CardTitle>
                <Badge className="bg-indigo-500">جاهز للشحن</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>القاهرة - مدينة نصر</span>
              </div>
              
              <div className="space-y-2">
                <p className="font-bold">شركات الشحن المتاحة:</p>
                <div className="grid gap-2">
                  {['Bosta', 'Aramex', 'DHL'].map((company) => (
                    <div key={company} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        <span className="font-medium">{company}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">30 ج.م</span>
                        <Button size="sm" style={{ backgroundColor: '#C62822' }} className="text-white">
                          اختيار
                        </Button>
                      </div>
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
                <span>قيد التخصيص</span>
                <span className="font-bold text-indigo-600">6</span>
              </div>
              <div className="flex justify-between">
                <span>تم التخصيص</span>
                <span className="font-bold text-green-600">41</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CODWorkflowLayout>
  );
}
