import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  ShoppingCart,
  Megaphone,
  Wifi,
  Download,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function FinancialDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data - will be replaced with real tRPC data
  const summary = {
    revenue: 450000,
    expenses: 320000,
    profit: 130000,
    profitMargin: 28.9,
  };

  const expenses = {
    payroll: 180000,
    advertising: 90000,
    subscriptions: 15000,
    shipping: 25000,
    operational: 10000,
  };

  const recentTransactions = [
    {
      id: '1',
      date: '2025-12-18',
      category: 'إعلانات',
      description: 'Facebook Ads - حملة ديسمبر',
      amount: -3000,
      type: 'expense',
    },
    {
      id: '2',
      date: '2025-12-18',
      category: 'مبيعات',
      description: 'طلبات اليوم (47 طلب)',
      amount: 21390,
      type: 'revenue',
    },
    {
      id: '3',
      date: '2025-12-17',
      category: 'رواتب',
      description: 'راتب ديسمبر - فريق المبيعات',
      amount: -75000,
      type: 'expense',
    },
    {
      id: '4',
      date: '2025-12-17',
      category: 'اشتراكات',
      description: 'Manus Platform - شهري',
      amount: -500,
      type: 'expense',
    },
    {
      id: '5',
      date: '2025-12-16',
      category: 'شحن',
      description: 'Bosta - تسوية COD',
      amount: 65134,
      type: 'revenue',
    },
  ];

  const subscriptions = [
    {
      name: 'Google Workspace',
      cost: 300,
      frequency: 'شهري',
      nextBilling: '2025-01-01',
      status: 'active',
    },
    {
      name: 'Manus Platform',
      cost: 500,
      frequency: 'شهري',
      nextBilling: '2025-01-05',
      status: 'active',
    },
    {
      name: 'Facebook Ads',
      cost: 90000,
      frequency: 'شهري',
      nextBilling: '2025-12-31',
      status: 'active',
    },
    {
      name: 'Shopify',
      cost: 1200,
      frequency: 'شهري',
      nextBilling: '2025-01-10',
      status: 'pending',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">الإدارة المالية</h1>
            <p className="text-gray-600 mt-1">متابعة المصروفات، الإيرادات، والربحية</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">اليوم</SelectItem>
                <SelectItem value="week">الأسبوع</SelectItem>
                <SelectItem value="month">الشهر</SelectItem>
                <SelectItem value="quarter">الربع</SelectItem>
                <SelectItem value="year">السنة</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير تقرير
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {summary.revenue.toLocaleString()} ج.م
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المصروفات</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {summary.expenses.toLocaleString()} ج.م
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">+8.2%</span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <CreditCard className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">صافي الربح</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {summary.profit.toLocaleString()} ج.م
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">+15.8%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">هامش الربح</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{summary.profitMargin}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-600">+2.1%</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Expense Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">توزيع المصروفات</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium">الرواتب</span>
                  </div>
                  <span className="text-sm font-bold">{expenses.payroll.toLocaleString()} ج.م</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(expenses.payroll / summary.expenses) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((expenses.payroll / summary.expenses) * 100).toFixed(1)}% من المصروفات
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium">الإعلانات</span>
                  </div>
                  <span className="text-sm font-bold">
                    {expenses.advertising.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(expenses.advertising / summary.expenses) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((expenses.advertising / summary.expenses) * 100).toFixed(1)}% من المصروفات
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium">الاشتراكات</span>
                  </div>
                  <span className="text-sm font-bold">
                    {expenses.subscriptions.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(expenses.subscriptions / summary.expenses) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((expenses.subscriptions / summary.expenses) * 100).toFixed(1)}% من المصروفات
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium">الشحن</span>
                  </div>
                  <span className="text-sm font-bold">
                    {expenses.shipping.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{
                      width: `${(expenses.shipping / summary.expenses) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((expenses.shipping / summary.expenses) * 100).toFixed(1)}% من المصروفات
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">الاشتراكات الشهرية</h2>
            <div className="space-y-3">
              {subscriptions.map((sub, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Wifi className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-sm text-gray-500">
                        {sub.frequency} - التجديد: {sub.nextBilling}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{sub.cost.toLocaleString()} ج.م</p>
                    {sub.status === 'active' ? (
                      <Badge variant="outline" className="text-green-600">
                        نشط
                      </Badge>
                    ) : (
                      <Badge variant="secondary">قيد الانتظار</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <Tabs defaultValue="all" className="w-full">
            <div className="border-b px-6 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">المعاملات الأخيرة</h2>
              </div>
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="revenue">إيرادات</TabsTrigger>
                <TabsTrigger value="expense">مصروفات</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {transaction.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <span
                          className={`font-bold ${
                            transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount.toLocaleString()} ج.م
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.type === 'revenue' ? (
                          <Badge className="bg-green-100 text-green-800">إيراد</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">مصروف</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Alerts */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-900">تنبيهات مالية</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                <li>• اشتراك Shopify قيد الانتظار - يحتاج تفعيل</li>
                <li>• ميزانية الإعلانات تجاوزت 90% من الحد الشهري</li>
                <li>• تسوية COD من J&T متأخرة 3 أيام</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
