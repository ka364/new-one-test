import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Video
} from 'lucide-react';

interface DashboardStats {
  revenue: {
    today: number;
    thisMonth: number;
    growth: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };
  sales: {
    today: number;
    thisMonth: number;
    pending: number;
  };
  customers: {
    total: number;
    new: number;
    active: number;
  };
  liveShopping: {
    activeSessions: number;
    viewers: number;
    conversionRate: number;
  };
}

export default function ERPDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: {
      today: 45600,
      thisMonth: 1250000,
      growth: 12.5,
    },
    inventory: {
      totalProducts: 150,
      lowStock: 12,
      outOfStock: 3,
    },
    sales: {
      today: 23,
      thisMonth: 456,
      pending: 5,
    },
    customers: {
      total: 1250,
      new: 45,
      active: 892,
    },
    liveShopping: {
      activeSessions: 2,
      viewers: 156,
      conversionRate: 66.7,
    },
  });

  const [kaiaStatus, setKaiaStatus] = useState({
    compliant: true,
    lastCheck: new Date(),
    violations: 0,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">HaderOS ERP</h1>
            <p className="text-gray-600 mt-1">لوحة التحكم الرئيسية</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Video className="w-4 h-4" />
              بث مباشر
            </Button>
            <Button className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              فاتورة جديدة
            </Button>
          </div>
        </div>

        {/* KAIA Status Banner */}
        {kaiaStatus.compliant ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">النظام متوافق مع KAIA</p>
                <p className="text-sm text-green-700">
                  آخر فحص: {kaiaStatus.lastCheck.toLocaleString('ar-EG')} | مخالفات: {kaiaStatus.violations}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">تنبيه: مخالفات KAIA</p>
                <p className="text-sm text-red-700">
                  عدد المخالفات: {kaiaStatus.violations} | يرجى المراجعة
                </p>
              </div>
              <Button variant="destructive" size="sm">
                عرض التفاصيل
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                الإيرادات
              </CardTitle>
              <DollarSign className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.revenue.thisMonth.toLocaleString('ar-EG')} ج.م
              </div>
              <p className="text-sm text-gray-600 mt-1">
                اليوم: {stats.revenue.today.toLocaleString('ar-EG')} ج.م
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  +{stats.revenue.growth}%
                </span>
                <span className="text-sm text-gray-500">عن الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                المخزون
              </CardTitle>
              <Package className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.inventory.totalProducts}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                إجمالي المنتجات
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-orange-600">
                  {stats.inventory.lowStock} منخفض
                </span>
                <span className="text-sm text-red-600">
                  {stats.inventory.outOfStock} نفذ
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sales Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                المبيعات
              </CardTitle>
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.sales.thisMonth}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                اليوم: {stats.sales.today} فاتورة
              </p>
              <div className="mt-2">
                <span className="text-sm text-yellow-600">
                  {stats.sales.pending} قيد الانتظار
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customers Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                العملاء
              </CardTitle>
              <Users className="w-5 h-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.customers.total}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                جديد: {stats.customers.new} | نشط: {stats.customers.active}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Shopping Section */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-600" />
              البث المباشر (Live Shopping)
            </CardTitle>
            <CardDescription>
              إحصائيات البث المباشر والمبيعات الحية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">الجلسات النشطة</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.liveShopping.activeSessions}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">المشاهدين الآن</p>
                <p className="text-3xl font-bold text-pink-600">
                  {stats.liveShopping.viewers}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">معدل التحويل</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.liveShopping.conversionRate}%
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                بدء بث جديد
              </Button>
              <Button variant="outline" className="flex-1">
                عرض الجلسات
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">إدارة المنتجات</CardTitle>
              <CardDescription>إضافة وتعديل المنتجات</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">فتح</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">إنشاء فاتورة</CardTitle>
              <CardDescription>فاتورة مبيعات جديدة</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">إنشاء</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">التقارير المالية</CardTitle>
              <CardDescription>قوائم مالية وتقارير</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">عرض</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
