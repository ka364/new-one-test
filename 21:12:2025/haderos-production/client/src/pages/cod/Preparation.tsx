/**
 * COD Stage 3: Preparation (التجهيز)
 */

import { CODWorkflowLayout } from '@/components/CODWorkflowLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, CheckCircle } from 'lucide-react';

export default function PreparationPage() {
  const confirmedOrders = [
    { 
      id: 'COD-1001', 
      customer: 'أحمد محمد', 
      product: 'حذاء رياضي - مقاس 42',
      quantity: 1,
      amount: 1500,
      checklist: [
        { id: 1, item: 'التحقق من توفر المنتج', done: true },
        { id: 2, item: 'فحص جودة المنتج', done: true },
        { id: 3, item: 'التغليف', done: false },
        { id: 4, item: 'إضافة الفاتورة', done: false },
      ]
    },
  ];

  return (
    <CODWorkflowLayout
      currentStage={3}
      title="تجهيز الطلبات"
      description="تجهيز وتغليف الطلبات المؤكدة"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {confirmedOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{order.id}</CardTitle>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <Badge className="bg-blue-500">قيد التجهيز</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5" />
                    <span className="font-medium">{order.product}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    الكمية: {order.quantity} | المبلغ: {order.amount.toLocaleString()} ج.م
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold">قائمة التحقق:</h4>
                  {order.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox checked={item.done} />
                      <span className={item.done ? 'line-through text-gray-500' : ''}>
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>

                <Button 
                  style={{ backgroundColor: '#C62822' }} 
                  className="text-white w-full"
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  إكمال التجهيز
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>إحصائيات التجهيز</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>قيد التجهيز</span>
                <span className="font-bold text-blue-600">8</span>
              </div>
              <div className="flex justify-between">
                <span>جاهزة</span>
                <span className="font-bold text-green-600">32</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CODWorkflowLayout>
  );
}
