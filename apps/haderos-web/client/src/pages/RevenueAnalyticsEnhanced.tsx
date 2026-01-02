import { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Download,
  FileImage,
  FileText,
  Copy,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import {
  exportChartToPNG,
  exportChartToJPEG,
  exportChartToPDF,
  exportMultipleChartsToPDF,
  copyChartToClipboard,
} from '@/lib/chart-export';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ChartInsight {
  type: 'success' | 'warning' | 'info' | 'danger';
  icon: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

export default function RevenueAnalyticsEnhanced() {
  const revenueAnalytics = trpc.financial.getRevenueAnalytics.useQuery();
  const [insights, setInsights] = useState<ChartInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const monthlyData = revenueAnalytics.data?.monthlyRevenue || [];

  // Calculate totals
  const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = monthlyData.reduce((sum, item) => sum + item.orderCount, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Prepare chart data
  const chartData = monthlyData.map((item) => ({
    month: formatMonth(item.month),
    revenue: item.revenue,
    orders: item.orderCount,
    avgValue: item.orderCount > 0 ? item.revenue / item.orderCount : 0,
  }));

  // Generate AI Insights
  useEffect(() => {
    if (chartData.length > 0) {
      generateInsights();
    }
  }, [chartData.length]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Simulate AI analysis (replace with actual AI call)
      const aiInsights = await analyzeChartData(chartData);
      setInsights(aiInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('فشل في توليد التحليلات الذكية');
    } finally {
      setLoading(false);
    }
  };

  // Simple AI analysis function (client-side)
  const analyzeChartData = async (data: any[]): Promise<ChartInsight[]> => {
    const insights: ChartInsight[] = [];

    if (data.length < 2) return insights;

    // Revenue Trend Analysis
    const revenues = data.map((d) => d.revenue);
    const firstHalf = revenues.slice(0, Math.floor(revenues.length / 2));
    const secondHalf = revenues.slice(Math.floor(revenues.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trendPercentage = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (trendPercentage > 10) {
      insights.push({
        type: 'success',
        icon: '📈',
        title: 'نمو قوي في الإيرادات',
        description: `الإيرادات ارتفعت بنسبة ${trendPercentage.toFixed(1)}% في الفترة الأخيرة`,
        impact: 'high',
        recommendation: 'استمر في الاستراتيجيات الحالية وحاول تكرار النجاح',
      });
    } else if (trendPercentage < -10) {
      insights.push({
        type: 'warning',
        icon: '📉',
        title: 'انخفاض في الإيرادات',
        description: `الإيرادات انخفضت بنسبة ${Math.abs(trendPercentage).toFixed(1)}%`,
        impact: 'high',
        recommendation: 'راجع استراتيجيات التسويق والمبيعات',
      });
    }

    // Volatility Analysis
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const variance =
      revenues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / revenues.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100;

    if (cv > 30) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'تقلبات عالية في الإيرادات',
        description: `الإيرادات تظهر تقلبات كبيرة (${cv.toFixed(1)}% انحراف)`,
        impact: 'medium',
        recommendation: 'العمل على استقرار مصادر الدخل',
      });
    }

    // Seasonal Pattern
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues);
    const maxIndex = revenues.indexOf(maxRevenue);
    const minIndex = revenues.indexOf(minRevenue);
    const seasonalDiff = ((maxRevenue - minRevenue) / minRevenue) * 100;

    if (seasonalDiff > 50) {
      insights.push({
        type: 'info',
        icon: '📅',
        title: 'نمط موسمي واضح',
        description: `أعلى إيرادات في ${data[maxIndex].month} وأقل في ${data[minIndex].month}`,
        impact: 'medium',
        recommendation: 'خطط للحملات مسبقاً في المواسم الضعيفة',
      });
    }

    // Average Order Value
    if (avgOrderValue < 500) {
      insights.push({
        type: 'info',
        icon: '💡',
        title: 'فرصة لزيادة متوسط قيمة الطلب',
        description: 'متوسط قيمة الطلب منخفض نسبياً',
        impact: 'medium',
        recommendation: 'جرب استراتيجيات البيع المتبادل (Cross-selling)',
      });
    }

    return insights.slice(0, 5);
  };

  // Export Functions
  const handleExportPNG = async (chartId: string, chartName: string) => {
    try {
      await exportChartToPNG(chartId, {
        filename: `${chartName}-${new Date().getTime()}.png`,
        title: chartName,
      });
      toast.success('تم تصدير الرسم البياني بنجاح');
    } catch (error) {
      toast.error('فشل تصدير الرسم البياني');
    }
  };

  const handleExportPDF = async (chartId: string, chartName: string) => {
    try {
      await exportChartToPDF(chartId, {
        filename: `${chartName}-${new Date().getTime()}.pdf`,
        title: chartName,
      });
      toast.success('تم تصدير PDF بنجاح');
    } catch (error) {
      toast.error('فشل تصدير PDF');
    }
  };

  const handleExportAllPDF = async () => {
    try {
      await exportMultipleChartsToPDF(['revenue-chart', 'orders-chart', 'avg-value-chart'], {
        filename: `revenue-analytics-${new Date().getTime()}.pdf`,
        title: 'تقرير تحليل الإيرادات - HADEROS',
      });
      toast.success('تم تصدير التقرير الكامل بنجاح');
    } catch (error) {
      toast.error('فشل تصدير التقرير');
    }
  };

  const handleCopyToClipboard = async (chartId: string) => {
    try {
      await copyChartToClipboard(chartId);
      toast.success('تم نسخ الرسم البياني');
    } catch (error) {
      toast.error('فشل النسخ إلى الحافظة');
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getInsightVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'destructive';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header with Export */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">تحليل الإيرادات الذكي</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              مدعوم بالذكاء الاصطناعي - تحليلات وتوصيات تلقائية
            </p>
          </div>
          <Button onClick={handleExportAllPDF} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير التقرير الكامل
          </Button>
        </div>

        {/* AI Insights Section */}
        {insights.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <CardTitle>التحليلات الذكية</CardTitle>
              </div>
              <CardDescription>تحليلات تلقائية باستخدام الذكاء الاصطناعي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <Alert
                    key={index}
                    variant={getInsightVariant(insight.type)}
                    className="border-l-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{insight.icon}</span>
                      <div className="flex-1">
                        <AlertTitle className="mb-1">
                          {insight.title}
                          <Badge className="mr-2" variant="outline">
                            {insight.impact === 'high'
                              ? 'عالي'
                              : insight.impact === 'medium'
                                ? 'متوسط'
                                : 'منخفض'}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="text-sm">
                          {insight.description}
                          {insight.recommendation && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-900 dark:text-blue-100">
                              <strong>التوصية:</strong> {insight.recommendation}
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Monthly Revenue Chart with Export */}
        <Card id="revenue-chart">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>اتجاه الإيرادات الشهرية</CardTitle>
                <CardDescription>تطور الإيرادات خلال آخر 6 أشهر</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    تصدير
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleExportPNG('revenue-chart', 'اتجاه-الإيرادات')}
                  >
                    <FileImage className="ml-2 h-4 w-4" />
                    PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportPDF('revenue-chart', 'اتجاه الإيرادات')}
                  >
                    <FileText className="ml-2 h-4 w-4" />
                    PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyToClipboard('revenue-chart')}>
                    <Copy className="ml-2 h-4 w-4" />
                    نسخ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
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
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ direction: 'rtl', paddingTop: '20px' }}
                    formatter={() => 'الإيرادات'}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                لا توجد بيانات متاحة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Chart with Export */}
        <Card id="orders-chart">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>عدد الطلبات الشهرية</CardTitle>
                <CardDescription>تطور عدد الطلبات خلال آخر 6 أشهر</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    تصدير
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportPNG('orders-chart', 'عدد-الطلبات')}>
                    <FileImage className="ml-2 h-4 w-4" />
                    PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF('orders-chart', 'عدد الطلبات')}>
                    <FileText className="ml-2 h-4 w-4" />
                    PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyToClipboard('orders-chart')}>
                    <Copy className="ml-2 h-4 w-4" />
                    نسخ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl',
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

        {/* Average Order Value Chart with Export */}
        <Card id="avg-value-chart">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>متوسط قيمة الطلب</CardTitle>
                <CardDescription>تطور متوسط قيمة الطلب خلال آخر 6 أشهر</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    تصدير
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleExportPNG('avg-value-chart', 'متوسط-قيمة-الطلب')}
                  >
                    <FileImage className="ml-2 h-4 w-4" />
                    PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportPDF('avg-value-chart', 'متوسط قيمة الطلب')}
                  >
                    <FileText className="ml-2 h-4 w-4" />
                    PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyToClipboard('avg-value-chart')}>
                    <Copy className="ml-2 h-4 w-4" />
                    نسخ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
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
                      direction: 'rtl',
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
      </div>
    </DashboardLayout>
  );
}
