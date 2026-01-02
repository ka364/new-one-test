import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function LaunchKPIs() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: metrics, isLoading } = trpc.metrics.getDailyMetrics.useQuery({ date: dateStr });

  const kpis = [
    {
      key: 'tcr',
      name: 'TCR - Total Collection Rate',
      nameAr: 'معدل التحصيل الكلي',
      value: metrics?.tcr || '0%',
      target: '40-50%',
      description: 'التحصيل ÷ الطلبات المنشأة',
      color: 'blue',
    },
    {
      key: 'tcc',
      name: 'TCC - Total Collection Cost',
      nameAr: 'تكلفة التحصيل الكلية',
      value: metrics?.tcc || '0%',
      target: '15-20%',
      description: 'المصروفات ÷ التحصيل',
      color: 'green',
    },
    {
      key: 'tcs',
      name: 'TCS - Total Collection to Spend',
      nameAr: 'التحصيل إلى الصرف',
      value: metrics?.tcs || '0%',
      target: '80-90%',
      description: 'التحصيل ÷ الصرف',
      color: 'purple',
    },
    {
      key: 'tcrn',
      name: 'TCRN - Total Collection Rate Net',
      nameAr: 'معدل التحصيل الصافي',
      value: metrics?.tcrn || '0%',
      target: '85-95%',
      description: 'التحصيل ÷ الطلبات المؤكدة',
      color: 'indigo',
    },
    {
      key: 'ocr',
      name: 'OCR - Order Confirmation Rate',
      nameAr: 'معدل تأكيد الطلبات',
      value: metrics?.ocr || '0%',
      target: '3-5%',
      description: 'الطلبات الملغية ÷ المنشأة',
      color: 'yellow',
    },
    {
      key: 'adr',
      name: 'ADR - Ads Delivery Rate',
      nameAr: 'معدل توصيل الإعلانات',
      value: metrics?.adr || '0%',
      target: '< 15%',
      description: 'المرتجعات ÷ المشحون',
      color: 'red',
    },
    {
      key: 'fdr',
      name: 'FDR - Final Delivery Rate',
      nameAr: 'معدل التسليم النهائي',
      value: metrics?.fdr || '0%',
      target: '> 50%',
      description: 'الموقع ÷ المشحون',
      color: 'emerald',
    },
  ];

  const getTrendIcon = (value: string, target: string) => {
    const numValue = parseFloat(value);
    const [min, max] = target.split('-').map((t) => parseFloat(t.replace(/[<>%]/g, '')));

    if (target.startsWith('<')) {
      return numValue < max ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-500" />
      );
    } else if (target.startsWith('>')) {
      return numValue > min ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-500" />
      );
    } else {
      return numValue >= min && numValue <= max ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-500" />
      );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة المؤشرات التشغيلية</h1>
          <p className="text-muted-foreground">المؤشرات السبعة لنظام الإطلاق</p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn('w-[240px] justify-start text-left font-normal')}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'PPP', { locale: ar }) : 'اختر التاريخ'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(7)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => (
              <Card key={kpi.key} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{kpi.nameAr}</CardTitle>
                    {getTrendIcon(kpi.value, kpi.target)}
                  </div>
                  <CardDescription className="text-xs">{kpi.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">المستهدف: {kpi.target}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">الطلبات المنشأة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.ordersCreated || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.ordersCreatedValue || '0'} جنيه
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">الطلبات المؤكدة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.ordersConfirmed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.ordersConfirmedValue || '0'} جنيه
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">التحصيل الكلي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics?.totalCollection || '0'} جنيه
                </div>
                <p className="text-xs text-muted-foreground">
                  نقدي: {metrics?.cashCollection || '0'} | بنكي: {metrics?.bankCollection || '0'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {metrics?.operatingExpenses || '0'} جنيه
                </div>
                <p className="text-xs text-muted-foreground">إعلانات: {metrics?.adSpend || '0'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل العمليات اليومية</CardTitle>
              <CardDescription>ملخص شامل للأداء</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">الطلبات المشحونة:</span>
                    <span className="font-medium">{metrics?.ordersShipped || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">الطلبات المرتجعة:</span>
                    <span className="font-medium text-red-600">{metrics?.ordersReturned || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">الطلبات الموقعة:</span>
                    <span className="font-medium text-green-600">
                      {metrics?.ordersDelivered || 0}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">قيمة المشحون:</span>
                    <span className="font-medium">{metrics?.ordersShippedValue || '0'} جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">قيمة المرتجع:</span>
                    <span className="font-medium text-red-600">
                      {metrics?.ordersReturnedValue || '0'} جنيه
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">قيمة الموقع:</span>
                    <span className="font-medium text-green-600">
                      {metrics?.ordersDeliveredValue || '0'} جنيه
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
