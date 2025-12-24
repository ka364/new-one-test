/**
 * HADER Shipping Overview Page
 * Bosta-inspired design with pricing table and stats
 */

import { ShippingLayout } from '@/components/ShippingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  TruckIcon,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Star,
} from 'lucide-react';

export default function ShippingOverview() {
  // Stats data
  const stats = [
    {
      title: 'إجمالي الشحنات',
      value: '1,234',
      change: '+12%',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'قيد التوصيل',
      value: '89',
      change: '+5%',
      icon: TruckIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'تم التوصيل',
      value: '1,045',
      change: '+18%',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'إجمالي COD',
      value: '125,450 ج.م',
      change: '+23%',
      icon: DollarSign,
      color: 'text-[#C62822]',
      bgColor: 'bg-red-50',
    },
  ];

  // Loyalty tiers (like Bosta)
  const loyaltyTiers = [
    { name: 'البرونزي الأول', stars: 1, minShipments: 0 },
    { name: 'البرونزي الثاني', stars: 2, minShipments: 100 },
    { name: 'الفضي', stars: 3, minShipments: 500 },
    { name: 'الذهبي', stars: 4, minShipments: 1000 },
  ];

  // Pricing data (from Bosta API test results)
  const regions = [
    { name: 'القاهرة والجيزة', code: 'cairo' },
    { name: 'الإسكندرية والبحيرة', code: 'alex' },
    { name: 'الدلتا والقناة', code: 'delta' },
    { name: 'شمال الصعيد', code: 'north_upper' },
    { name: 'جنوب الصعيد', code: 'south_upper' },
    { name: 'سيناء والوادي الجديد', code: 'sinai' },
    { name: 'الساحل الشمالي', code: 'north_coast' },
  ];

  const sizes = [
    { name: 'حجم صغير ومتوسط', code: 'normal', dimensions: '40 × 35 × 35 سم' },
    { name: 'حجم كبير (L)', code: 'large', dimensions: '45 × 50 سم' },
    { name: 'حجم أكبر (XL)', code: 'xlarge', dimensions: '55 × 60 سم' },
    { name: 'كبيس أبيض (XXL)', code: 'xxl', dimensions: '100 × 50 سم' },
    { name: 'شحنة ضخمة', code: 'bulky', dimensions: 'أكبر من 100 × 50 سم' },
    { name: 'شحنة صخمة', code: 'huge', dimensions: '' },
    { name: 'أثاث / سجاد بضمانة', code: 'furniture', dimensions: '' },
  ];

  // Pricing matrix (simplified from Bosta)
  const pricing: Record<string, Record<string, number>> = {
    cairo: { normal: 25, large: 30, xlarge: 35, xxl: 103, bulky: 461, huge: 461, furniture: 0 },
    alex: { normal: 30, large: 35, xlarge: 40, xxl: 108, bulky: 471, huge: 471, furniture: 0 },
    delta: { normal: 35, large: 40, xlarge: 45, xxl: 113, bulky: 481, huge: 481, furniture: 0 },
    north_upper: { normal: 95, large: 100, xlarge: 105, xxl: 118, bulky: 486, huge: 486, furniture: 0 },
    south_upper: { normal: 95, large: 100, xlarge: 105, xxl: 128, bulky: 486, huge: 486, furniture: 0 },
    sinai: { normal: 95, large: 100, xlarge: 105, xxl: 133, bulky: 486, huge: 486, furniture: 0 },
    north_coast: { normal: 95, large: 100, xlarge: 105, xxl: 193, bulky: 486, huge: 486, furniture: 0 },
  };

  return (
    <ShippingLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <h3 className="text-2xl font-bold mt-2">
                        {stat.value}
                      </h3>
                      <p className="text-sm text-green-600 mt-1">
                        {stat.change} من الشهر الماضي
                      </p>
                    </div>
                    <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Loyalty Tiers (Bosta-style) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              تقارير السحب النقدي
            </CardTitle>
            <p className="text-sm text-gray-500">
              سيتم تحويل قيمة السحب النقدي إلى حسابك البنكي كل أسبوع في يوم الأربعاء
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              {loyaltyTiers.map((tier, index) => (
                <div key={tier.name} className="text-center">
                  <div className="flex justify-center mb-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-6 w-6 ${
                          i < tier.stars
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm font-medium">{tier.name}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1">
                تقييم النظام
              </Button>
              <Button className="flex-1" style={{ backgroundColor: '#C62822' }}>
                اعرف أكثر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>مقارنة خطة الأسعار للفريقيين (بالجنيه المصري)</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  يتم ترتيب أو تحديث خطتك بناءً على الحساب الأساسي
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">كيفية حساب السعر</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="calculator" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calculator">الحاسبة</TabsTrigger>
                <TabsTrigger value="table">القاهرة والجيزة</TabsTrigger>
              </TabsList>

              <TabsContent value="calculator" className="mt-6">
                <div className="text-center py-12 text-gray-500">
                  حاسبة الأسعار قريباً...
                </div>
              </TabsContent>

              <TabsContent value="table" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 text-right text-sm font-medium">
                          أحجام الشحنات
                        </th>
                        {regions.map((region) => (
                          <th
                            key={region.code}
                            className="border border-gray-200 p-3 text-center text-sm font-medium"
                          >
                            {region.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((size) => (
                        <tr key={size.code} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-3">
                            <div className="font-medium">{size.name}</div>
                            {size.dimensions && (
                              <div className="text-xs text-gray-500">
                                {size.dimensions}
                              </div>
                            )}
                          </td>
                          {regions.map((region) => (
                            <td
                              key={region.code}
                              className="border border-gray-200 p-3 text-center"
                            >
                              {pricing[region.code]?.[size.code] ? (
                                <span className="font-medium">
                                  {pricing[region.code][size.code]} ج.م
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">رسوم منح الشحنة</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        سيؤدي السماح للعميل بفتح الطرد إلى تطبيق 7 ج.م على رسوم منح الشحنة
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">أحجام الشحنات</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        40 × 35 سم: حجم صغير ومتوسط | 45 × 50 سم: حجم كبير (L) | 
                        55 × 60 سم: حجم أكبر (XL) | 100 × 50 سم: كبيس أبيض (XXL)
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 'SH-2025-001', customer: 'أحمد محمد', status: 'delivered', time: 'منذ ساعتين' },
                { id: 'SH-2025-002', customer: 'فاطمة علي', status: 'in_transit', time: 'منذ 3 ساعات' },
                { id: 'SH-2025-003', customer: 'محمود حسن', status: 'pending', time: 'منذ 5 ساعات' },
              ].map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      activity.status === 'delivered' ? 'bg-green-100' :
                      activity.status === 'in_transit' ? 'bg-orange-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.status === 'delivered' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : activity.status === 'in_transit' ? (
                        <TruckIcon className="h-5 w-5 text-orange-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{activity.id}</div>
                      <div className="text-sm text-gray-500">{activity.customer}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ShippingLayout>
  );
}
