import { TrendingUp, DollarSign, ShoppingCart, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RevenueAnalytics() {
  const revenueAnalytics = trpc.financial.getRevenueAnalytics.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const monthlyData = revenueAnalytics.data?.monthlyRevenue || [];
  
  // Calculate totals
  const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = monthlyData.reduce((sum, item) => sum + item.orderCount, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Prepare chart data
  const chartData = monthlyData.map(item => ({
    month: formatMonth(item.month),
    revenue: item.revenue,
    orders: item.orderCount,
    avgValue: item.orderCount > 0 ? item.revenue / item.orderCount : 0
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">تحليل الإيرادات</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            تتبع الإيرادات والمبيعات عبر الوقت
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>إجمالي الإيرادات (6 أشهر)</CardDescription>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>إجمالي الطلبات</CardDescription>
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {totalOrders.toLocaleString('ar-EG')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>متوسط قيمة الطلب</CardDescription>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(avgOrderValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاه الإيرادات الشهرية</CardTitle>
            <CardDescription>
              تطور الإيرادات خلال آخر 6 أشهر
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueAnalytics.isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                جاري التحميل...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
                    formatter={() => 'الإيرادات'}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Count Trend */}
        <Card>
          <CardHeader>
            <CardTitle>عدد الطلبات الشهرية</CardTitle>
            <CardDescription>
              تطور عدد الطلبات خلال آخر 6 أشهر
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueAnalytics.isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                جاري التحميل...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                    formatter={(value: number) => value.toLocaleString('ar-EG')}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
                    formatter={() => 'عدد الطلبات'}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Order Value Trend */}
        <Card>
          <CardHeader>
            <CardTitle>متوسط قيمة الطلب</CardTitle>
            <CardDescription>
              تطور متوسط قيمة الطلب خلال آخر 6 أشهر
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueAnalytics.isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                جاري التحميل...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
                    formatter={() => 'متوسط قيمة الطلب'}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgValue" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>الأداء الشهري التفصيلي</CardTitle>
            <CardDescription>
              بيانات مفصلة لكل شهر
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-semibold">الشهر</th>
                    <th className="text-right py-3 px-4 font-semibold">الإيرادات</th>
                    <th className="text-right py-3 px-4 font-semibold">عدد الطلبات</th>
                    <th className="text-right py-3 px-4 font-semibold">متوسط قيمة الطلب</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">{row.month}</td>
                      <td className="py-3 px-4 font-medium text-green-600">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="py-3 px-4">{row.orders.toLocaleString('ar-EG')}</td>
                      <td className="py-3 px-4 font-medium text-purple-600">
                        {formatCurrency(row.avgValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
