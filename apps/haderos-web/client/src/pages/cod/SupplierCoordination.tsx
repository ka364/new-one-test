/**
 * COD Stage 4: Supplier Coordination (التنسيق مع المورد)
 */

import { CODWorkflowLayout } from '@/components/CODWorkflowLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, CheckCircle } from 'lucide-react';

export default function SupplierCoordinationPage() {
  return (
    <CODWorkflowLayout
      currentStage={4}
      title="التنسيق مع المورد"
      description="التنسيق مع الموردين لتجهيز المنتجات"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>COD-1001</CardTitle>
                <Badge className="bg-purple-500">قيد التنسيق</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Users className="h-10 w-10 text-gray-400" />
                <div>
                  <p className="font-bold">مورد الأحذية الرياضية</p>
                  <p className="text-sm text-gray-600">01012345678</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button style={{ backgroundColor: '#C62822' }} className="text-white flex-1">
                  <Phone className="h-4 w-4 ml-2" />
                  اتصال بالمورد
                </Button>
                <Button variant="outline" className="flex-1">
                  <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                  تأكيد التوفر
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
                <span>قيد التنسيق</span>
                <span className="font-bold text-purple-600">5</span>
              </div>
              <div className="flex justify-between">
                <span>تم التأكيد</span>
                <span className="font-bold text-green-600">28</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CODWorkflowLayout>
  );
}
