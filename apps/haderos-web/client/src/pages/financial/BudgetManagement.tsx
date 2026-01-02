import { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BudgetItem {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  percentage: number;
  status: 'on_track' | 'warning' | 'over_budget';
}

interface Department {
  id: string;
  name: string;
  totalAllocated: number;
  totalSpent: number;
  items: BudgetItem[];
}

export default function BudgetManagement() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('hr');

  const departments: { [key: string]: Department } = {
    hr: {
      id: 'hr',
      name: 'الموارد البشرية',
      totalAllocated: 1200000,
      totalSpent: 950000,
      items: [
        {
          id: '1',
          category: 'الرواتب',
          allocated: 800000,
          spent: 800000,
          percentage: 100,
          status: 'on_track',
        },
        {
          id: '2',
          category: 'التدريب',
          allocated: 200000,
          spent: 120000,
          percentage: 60,
          status: 'on_track',
        },
        {
          id: '3',
          category: 'المزايا',
          allocated: 150000,
          spent: 30000,
          percentage: 20,
          status: 'on_track',
        },
        {
          id: '4',
          category: 'التوظيف',
          allocated: 50000,
          spent: 0,
          percentage: 0,
          status: 'on_track',
        },
      ],
    },
    operations: {
      id: 'operations',
      name: 'العمليات',
      totalAllocated: 2500000,
      totalSpent: 2100000,
      items: [
        {
          id: '1',
          category: 'المعدات',
          allocated: 1000000,
          spent: 900000,
          percentage: 90,
          status: 'on_track',
        },
        {
          id: '2',
          category: 'الصيانة',
          allocated: 800000,
          spent: 750000,
          percentage: 93.75,
          status: 'warning',
        },
        {
          id: '3',
          category: 'الإمدادات',
          allocated: 500000,
          spent: 350000,
          percentage: 70,
          status: 'on_track',
        },
        {
          id: '4',
          category: 'الطاقة',
          allocated: 200000,
          spent: 100000,
          percentage: 50,
          status: 'on_track',
        },
      ],
    },
    marketing: {
      id: 'marketing',
      name: 'التسويق',
      totalAllocated: 800000,
      totalSpent: 700000,
      items: [
        {
          id: '1',
          category: 'الإعلانات الرقمية',
          allocated: 400000,
          spent: 350000,
          percentage: 87.5,
          status: 'on_track',
        },
        {
          id: '2',
          category: 'المحتوى',
          allocated: 200000,
          spent: 180000,
          percentage: 90,
          status: 'on_track',
        },
        {
          id: '3',
          category: 'الفعاليات',
          allocated: 150000,
          spent: 150000,
          percentage: 100,
          status: 'warning',
        },
        {
          id: '4',
          category: 'البحث',
          allocated: 50000,
          spent: 20000,
          percentage: 40,
          status: 'on_track',
        },
      ],
    },
    it: {
      id: 'it',
      name: 'تقنية المعلومات',
      totalAllocated: 1500000,
      totalSpent: 1350000,
      items: [
        {
          id: '1',
          category: 'البرامج',
          allocated: 600000,
          spent: 600000,
          percentage: 100,
          status: 'on_track',
        },
        {
          id: '2',
          category: 'البنية التحتية',
          allocated: 500000,
          spent: 450000,
          percentage: 90,
          status: 'on_track',
        },
        {
          id: '3',
          category: 'الأمان',
          allocated: 300000,
          spent: 250000,
          percentage: 83.33,
          status: 'on_track',
        },
        {
          id: '4',
          category: 'الدعم',
          allocated: 100000,
          spent: 50000,
          percentage: 50,
          status: 'on_track',
        },
      ],
    },
  };

  const currentDept = departments[selectedDepartment];
  const remaining = currentDept.totalAllocated - currentDept.totalSpent;
  const percentageUsed = Math.round((currentDept.totalSpent / currentDept.totalAllocated) * 100);

  // بيانات الرسم البياني
  const chartData = currentDept.items.map((item) => ({
    name: item.category,
    مخصص: item.allocated,
    مستخدم: item.spent,
  }));

  const pieData = currentDept.items.map((item) => ({
    name: item.category,
    value: item.spent,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'over_budget':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-orange-100 text-orange-800';
      case 'over_budget':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">إدارة الميزانيات</h1>
        <p className="text-gray-600 mt-1">تتبع والتحكم في ميزانيات الأقسام المختلفة</p>
      </div>

      {/* اختيار القسم */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">اختر القسم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(departments).map(([key, dept]) => (
              <Button
                key={key}
                variant={selectedDepartment === key ? 'default' : 'outline'}
                onClick={() => setSelectedDepartment(key)}
                className="text-sm"
              >
                {dept.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* المقاييس الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">الميزانية المخصصة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(currentDept.totalAllocated / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">للفترة الحالية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">الميزانية المستخدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(currentDept.totalSpent / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">{percentageUsed}% من الإجمالي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">المتبقي</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {(remaining / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">{100 - percentageUsed}% متبقي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">عدد البنود</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{currentDept.items.length}</div>
            <p className="text-xs text-gray-500 mt-1">بند ميزانية</p>
          </CardContent>
        </Card>
      </div>

      {/* التحذيرات */}
      {currentDept.items.some((item) => item.status === 'over_budget') && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            تنبيه: هناك بنود تجاوزت الميزانية المخصصة
          </AlertDescription>
        </Alert>
      )}

      {percentageUsed > 85 && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            تحذير: استخدام الميزانية وصل إلى {percentageUsed}%
          </AlertDescription>
        </Alert>
      )}

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* مقارنة الميزانية */}
        <Card>
          <CardHeader>
            <CardTitle>مقارنة الميزانية</CardTitle>
            <CardDescription>المخصص مقابل المستخدم</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => `${(value / 1000).toFixed(0)}K`} />
                <Legend />
                <Bar dataKey="مخصص" fill="#3b82f6" />
                <Bar dataKey="مستخدم" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* توزيع الإنفاق */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع الإنفاق</CardTitle>
            <CardDescription>حسب البنود</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${(value / 1000).toFixed(0)}K`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${(value / 1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* جدول البنود التفصيلي */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل البنود</CardTitle>
          <CardDescription>بنود الميزانية المفصلة للقسم</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    البند
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    المخصص
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    المستخدم
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    المتبقي
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    النسبة
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentDept.items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(item.allocated / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">
                      {(item.spent / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {((item.allocated - item.spent) / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              item.status === 'on_track'
                                ? 'bg-green-500'
                                : item.status === 'warning'
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(item.status)}`}
                      >
                        {item.status === 'on_track'
                          ? 'متابع'
                          : item.status === 'warning'
                            ? 'تحذير'
                            : 'تجاوز'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
