/**
 * HADER Create Shipment Page
 * Create new shipment with Bosta integration
 */

import { useState } from 'react';
import { ShippingLayout } from '@/components/ShippingLayout';
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
import {
  Package,
  User,
  MapPin,
  DollarSign,
  TruckIcon,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function CreateShipmentPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Customer Info
    customerName: '',
    customerPhone: '',
    customerEmail: '',

    // Pickup Address
    pickupCity: '',
    pickupDistrict: '',
    pickupAddress: '',

    // Delivery Address
    deliveryCity: '',
    deliveryDistrict: '',
    deliveryAddress: '',

    // Package Info
    packageType: 'normal',
    packageWeight: '',
    packageDescription: '',
    codAmount: '',

    // Additional
    notes: '',
  });

  const egyptCities = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'المنصورة',
    'طنطا',
    'الزقازيق',
    'أسيوط',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
    'بورسعيد',
    'السويس',
    'الإسماعيلية',
    'دمياط',
    'كفر الشيخ',
    'المنيا',
    'بني سويف',
    'الفيوم',
  ];

  const packageTypes = [
    { value: 'normal', label: 'حجم صغير ومتوسط (40×35×35 سم)', price: 25 },
    { value: 'large', label: 'حجم كبير L (45×50 سم)', price: 30 },
    { value: 'xlarge', label: 'حجم أكبر XL (55×60 سم)', price: 35 },
    { value: 'xxl', label: 'كبيس أبيض XXL (100×50 سم)', price: 103 },
    { value: 'bulky', label: 'شحنة ضخمة', price: 461 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Integrate with Bosta API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to shipments list
      setLocation('/shipping/shipments');
    } catch (error) {
      console.error('Error creating shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات العميل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">اسم العميل *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="أدخل اسم العميل"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">رقم الهاتف *</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="01xxxxxxxxx"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">البريد الإلكتروني (اختياري)</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="customer@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => setStep(2)}
          style={{ backgroundColor: '#C62822' }}
          className="text-white"
        >
          التالي
          <ArrowRight className="h-4 w-4 mr-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            عنوان الاستلام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupCity">المدينة *</Label>
              <Select
                value={formData.pickupCity}
                onValueChange={(value) => setFormData({ ...formData, pickupCity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  {egyptCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupDistrict">المنطقة *</Label>
              <Input
                id="pickupDistrict"
                value={formData.pickupDistrict}
                onChange={(e) => setFormData({ ...formData, pickupDistrict: e.target.value })}
                placeholder="أدخل المنطقة"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickupAddress">العنوان التفصيلي *</Label>
            <Textarea
              id="pickupAddress"
              value={formData.pickupAddress}
              onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
              placeholder="أدخل العنوان التفصيلي"
              rows={3}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            عنوان التوصيل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryCity">المدينة *</Label>
              <Select
                value={formData.deliveryCity}
                onValueChange={(value) => setFormData({ ...formData, deliveryCity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  {egyptCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDistrict">المنطقة *</Label>
              <Input
                id="deliveryDistrict"
                value={formData.deliveryDistrict}
                onChange={(e) => setFormData({ ...formData, deliveryDistrict: e.target.value })}
                placeholder="أدخل المنطقة"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">العنوان التفصيلي *</Label>
            <Textarea
              id="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              placeholder="أدخل العنوان التفصيلي"
              rows={3}
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          السابق
        </Button>
        <Button
          onClick={() => setStep(3)}
          style={{ backgroundColor: '#C62822' }}
          className="text-white"
        >
          التالي
          <ArrowRight className="h-4 w-4 mr-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            تفاصيل الشحنة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="packageType">نوع الشحنة *</Label>
            <Select
              value={formData.packageType}
              onValueChange={(value) => setFormData({ ...formData, packageType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الشحنة" />
              </SelectTrigger>
              <SelectContent>
                {packageTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} - {type.price} ج.م
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packageWeight">الوزن (كجم)</Label>
              <Input
                id="packageWeight"
                type="number"
                value={formData.packageWeight}
                onChange={(e) => setFormData({ ...formData, packageWeight: e.target.value })}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codAmount">المبلغ المطلوب تحصيله (COD) *</Label>
              <Input
                id="codAmount"
                type="number"
                value={formData.codAmount}
                onChange={(e) => setFormData({ ...formData, codAmount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageDescription">وصف المحتويات *</Label>
            <Textarea
              id="packageDescription"
              value={formData.packageDescription}
              onChange={(e) => setFormData({ ...formData, packageDescription: e.target.value })}
              placeholder="أدخل وصف المحتويات"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            ملخص التكلفة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">رسوم الشحن</span>
              <span className="font-medium">
                {packageTypes.find((t) => t.value === formData.packageType)?.price || 0} ج.م
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">المبلغ المطلوب تحصيله</span>
              <span className="font-medium">{formData.codAmount || 0} ج.م</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>الإجمالي</span>
              <span className="text-green-600">
                {(Number(formData.codAmount) || 0) +
                  (packageTypes.find((t) => t.value === formData.packageType)?.price || 0)}{' '}
                ج.م
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          السابق
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          style={{ backgroundColor: '#C62822' }}
          className="text-white"
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء الشحنة'}
          <CheckCircle className="h-4 w-4 mr-2" />
        </Button>
      </div>
    </div>
  );

  return (
    <ShippingLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إنشاء شحنة جديدة</h1>
          <p className="text-gray-500 mt-1">املأ البيانات التالية لإنشاء شحنة جديدة</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold
                  ${
                    step === stepNum
                      ? 'bg-[#C62822] text-white'
                      : step > stepNum
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {step > stepNum ? <CheckCircle className="h-5 w-5" /> : stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-20 h-1 ${step > stepNum ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </ShippingLayout>
  );
}
