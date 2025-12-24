/**
 * COD Stage 1: Call Center (استلام الطلب)
 * First contact with customer - order intake
 */

import { useState } from 'react';
import { CODWorkflowLayout } from '@/components/CODWorkflowLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, User, MapPin, Package, DollarSign } from 'lucide-react';

export default function CallCenterPage() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerCity: '',
    customerAddress: '',
    productName: '',
    quantity: 1,
    codAmount: 0,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Order submitted:', formData);
    alert('تم إنشاء الطلب بنجاح! سيتم الانتقال إلى مرحلة التأكيد.');
  };

  return (
    <CODWorkflowLayout
      currentStage={1}
      title="مركز الاتصالات - استلام الطلب"
      description="استقبال طلبات العملاء وتسجيل البيانات الأساسية"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>نموذج استلام الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    معلومات العميل
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">اسم العميل *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                        placeholder="أحمد محمد"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customerPhone">رقم الهاتف *</Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, customerPhone: e.target.value })
                        }
                        placeholder="01012345678"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    عنوان التوصيل
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerCity">المدينة *</Label>
                      <Select
                        value={formData.customerCity}
                        onValueChange={(value) =>
                          setFormData({ ...formData, customerCity: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المدينة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cairo">القاهرة</SelectItem>
                          <SelectItem value="giza">الجيزة</SelectItem>
                          <SelectItem value="alexandria">الإسكندرية</SelectItem>
                          <SelectItem value="mansoura">المنصورة</SelectItem>
                          <SelectItem value="tanta">طنطا</SelectItem>
                          <SelectItem value="aswan">أسوان</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="customerAddress">العنوان التفصيلي *</Label>
                      <Input
                        id="customerAddress"
                        value={formData.customerAddress}
                        onChange={(e) =>
                          setFormData({ ...formData, customerAddress: e.target.value })
                        }
                        placeholder="شارع، رقم العقار"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    معلومات المنتج
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="productName">اسم المنتج *</Label>
                      <Input
                        id="productName"
                        value={formData.productName}
                        onChange={(e) =>
                          setFormData({ ...formData, productName: e.target.value })
                        }
                        placeholder="حذاء رياضي - مقاس 42"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="quantity">الكمية *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: parseInt(e.target.value) })
                        }
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="codAmount">المبلغ المطلوب (COD) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="codAmount"
                        type="number"
                        min="0"
                        value={formData.codAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, codAmount: parseFloat(e.target.value) })
                        }
                        placeholder="0.00"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="أي ملاحظات خاصة بالطلب..."
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    style={{ backgroundColor: '#C62822' }}
                    className="text-white flex-1"
                  >
                    إنشاء الطلب والانتقال للتأكيد
                  </Button>
                  <Button type="button" variant="outline">
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Recent Orders */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>آخر الطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">COD-{1000 + i}</span>
                      <span className="text-sm text-gray-500">منذ {i * 5} دقائق</span>
                    </div>
                    <p className="text-sm text-gray-600">أحمد محمد - القاهرة</p>
                    <p className="text-sm font-bold text-green-600 mt-1">
                      {(500 + i * 100).toLocaleString()} ج.م
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إحصائيات اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي الطلبات</span>
                  <span className="font-bold">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">قيد المعالجة</span>
                  <span className="font-bold text-orange-600">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">مكتملة</span>
                  <span className="font-bold text-green-600">16</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CODWorkflowLayout>
  );
}
