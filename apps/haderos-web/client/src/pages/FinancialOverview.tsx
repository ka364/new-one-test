import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
  Activity,
  BarChart3,
  Receipt,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { trpc } from '@/lib/trpc';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/DashboardLayout';

export default function FinancialOverview() {
  const financialSummary = trpc.financial.getSummary.useQuery();
  const kaiaStats = trpc.kaia.getComplianceStats.useQuery();
  const cashFlowData = trpc.financial.getCashFlow.useQuery({ days: 30 });

  const summary = financialSummary.data || {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalExpenses: 0,
    netProfit: 0,
    burnRate: 0,
    cashBalance: 0,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">نظرة عامة مالية</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            تحليل شامل للأداء المالي والتدفقات النقدية
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Total Revenue */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>إجمالي الإيرادات</CardDescription>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(summary.totalRevenue)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {summary.revenueGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatPercentage(summary.revenueGrowth)}
                </span>
                <span className="text-sm text-gray-500">مقارنة بالشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>إجمالي المصروفات</CardDescription>
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">
                  معدل الحرق: {formatCurrency(summary.burnRate)}/يوم
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>صافي الربح</CardDescription>
                <PiggyBank className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  summary.netProfit >= 0 ? 'text-purple-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(summary.netProfit)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-500">
                  هامش الربح: {((summary.netProfit / summary.totalRevenue) * 100 || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>التدفق النقدي (آخر 30 يوم)</CardTitle>
            <CardDescription>تتبع الإيرادات والمصروفات اليومية</CardDescription>
          </CardHeader>
          <CardContent>
            {cashFlowData.isLoading ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                جاري التحميل...
              </div>
            ) : cashFlowData.data && cashFlowData.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={cashFlowData.data}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
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
                      direction: 'rtl',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `التاريخ: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
                    formatter={(value) => (value === 'revenue' ? 'الإيرادات' : 'المصروفات')}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorExpenses)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Link href="/financial/revenue">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">تحليل الإيرادات</h3>
                    <p className="text-sm text-gray-500">اتجاهات الإيرادات والمبيعات</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/financial/expenses">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">تتبع المصروفات</h3>
                    <p className="text-sm text-gray-500">تحليل المصروفات حسب الفئة</p>
                  </div>
                  <Receipt className="w-10 h-10 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* KAIA Compliance Card */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="w-6 h-6 text-emerald-600" />
                  الامتثال الشرعي (KAIA)
                </CardTitle>
                <CardDescription className="mt-2">
                  نظام التحقق من الامتثال للشريعة الإسلامية
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {kaiaStats.isLoading ? (
              <div className="text-center py-4 text-gray-500">جاري التحميل...</div>
            ) : (
              <div className="space-y-4">
                {/* Compliance Score */}
                <div className="text-center py-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-5xl font-bold text-emerald-600">
                    {kaiaStats.data?.complianceScore.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-2">درجة الامتثال الإجمالية</div>
                </div>

                {/* Transaction Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold">حلال</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {kaiaStats.data?.halalTransactions.toLocaleString('ar-EG')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(
                        ((kaiaStats.data?.halalTransactions || 0) /
                          (kaiaStats.data?.totalTransactions || 1)) *
                        100
                      ).toFixed(1)}
                      % من الإجمالي
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-semibold">حرام</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {kaiaStats.data?.haramTransactions.toLocaleString('ar-EG')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(
                        ((kaiaStats.data?.haramTransactions || 0) /
                          (kaiaStats.data?.totalTransactions || 1)) *
                        100
                      ).toFixed(1)}
                      % من الإجمالي
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-semibold">مشبوه</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {kaiaStats.data?.mushboohTransactions.toLocaleString('ar-EG')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(
                        ((kaiaStats.data?.mushboohTransactions || 0) /
                          (kaiaStats.data?.totalTransactions || 1)) *
                        100
                      ).toFixed(1)}
                      % من الإجمالي
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-semibold">مكروه</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-600">
                      {kaiaStats.data?.makroohTransactions.toLocaleString('ar-EG')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(
                        ((kaiaStats.data?.makroohTransactions || 0) /
                          (kaiaStats.data?.totalTransactions || 1)) *
                        100
                      ).toFixed(1)}
                      % من الإجمالي
                    </div>
                  </div>
                </div>

                {/* Violations Breakdown */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-sm">المخالفات حسب النوع</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ربا (Riba)</span>
                      <span className="font-bold text-red-600">
                        {kaiaStats.data?.violationsByCategory.riba}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">غرر (Gharar)</span>
                      <span className="font-bold text-orange-600">
                        {kaiaStats.data?.violationsByCategory.gharar}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ميسر (Maysir)</span>
                      <span className="font-bold text-purple-600">
                        {kaiaStats.data?.violationsByCategory.maysir}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">سلع محرمة</span>
                      <span className="font-bold text-gray-600">
                        {kaiaStats.data?.violationsByCategory.haram_goods}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الرصيد النقدي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.cashBalance)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                يكفي لـ {Math.floor(summary.cashBalance / (summary.burnRate || 1))} يوم
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معدل النمو</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatPercentage(summary.revenueGrowth)}
              </div>
              <p className="text-sm text-gray-500 mt-2">نمو الإيرادات الشهري</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
