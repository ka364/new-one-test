import { CreditCard, TrendingDown, PieChart as PieChartIcon, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function ExpensesTracking() {
  const expensesBreakdown = trpc.financial.getExpensesBreakdown.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const expenses = expensesBreakdown.data || [];
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  // Prepare pie chart data
  const pieData = expenses.map(item => ({
    name: item.category,
    value: item.amount,
    percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">تتبع المصروفات</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            تحليل شامل للمصروفات حسب الفئة
          </p>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">إجمالي المصروفات (الشهر الحالي)</CardTitle>
                <CardDescription className="mt-2">
                  مجموع جميع المصروفات التشغيلية
                </CardDescription>
              </div>
              <CreditCard className="w-12 h-12 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>

        {/* Expenses Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع المصروفات</CardTitle>
              <CardDescription>
                نسبة كل فئة من إجمالي المصروفات
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expensesBreakdown.isLoading ? (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  جاري التحميل...
                </div>
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        direction: 'rtl'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend 
                      wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
                      formatter={(value) => value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  لا توجد مصروفات مسجلة
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Cards */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>المصروفات حسب الفئة</CardTitle>
                <CardDescription>
                  تفصيل المصروفات لكل فئة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-semibold">{expense.category}</p>
                          <p className="text-sm text-gray-500">
                            {((expense.amount / totalExpenses) * 100).toFixed(1)}% من الإجمالي
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {expenses.length === 0 && !expensesBreakdown.isLoading && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد مصروفات مسجلة للشهر الحالي
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>جدول المصروفات التفصيلي</CardTitle>
            <CardDescription>
              قائمة كاملة بجميع المصروفات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-semibold">الفئة</th>
                    <th className="text-right py-3 px-4 font-semibold">المبلغ</th>
                    <th className="text-right py-3 px-4 font-semibold">النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {expense.category}
                      </td>
                      <td className="py-3 px-4 font-medium text-red-600">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 px-4">
                        {((expense.amount / totalExpenses) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {expenses.length > 0 && (
                    <tr className="border-t-2 font-bold">
                      <td className="py-3 px-4">الإجمالي</td>
                      <td className="py-3 px-4 text-red-600">
                        {formatCurrency(totalExpenses)}
                      </td>
                      <td className="py-3 px-4">100%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
