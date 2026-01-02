import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Package, Clock, Star, DollarSign } from 'lucide-react';

export default function ShippingPerformance() {
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');

  // Fetch shipping companies
  const { data: companies, isLoading: companiesLoading } = trpc.cod.getShippingCompanies.useQuery();

  // Fetch performance data
  const { data: performance, isLoading: performanceLoading } =
    trpc.cod.getPerformanceByGovernorate.useQuery(
      { governorateCode: selectedGovernorate === 'all' ? undefined : selectedGovernorate },
      { enabled: !!companies }
    );

  const isLoading = companiesLoading || performanceLoading;

  // Calculate overall stats
  const overallStats = performance?.reduce(
    (acc, perf) => ({
      totalShipments: acc.totalShipments + (perf.totalShipments || 0 || 0),
      successfulShipments: acc.successfulShipments + (perf.successfulShipments || 0 || 0),
      failedShipments: acc.failedShipments + (perf.failedShipments || 0),
    }),
    { totalShipments: 0, successfulShipments: 0, failedShipments: 0 }
  );

  const overallSuccessRate =
    overallStats && overallStats.totalShipments > 0
      ? ((overallStats.successfulShipments / overallStats.totalShipments) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">أداء شركات الشحن</h1>
        <p className="text-muted-foreground mt-2">
          تحليل شامل لأداء شركات الشحن على مستوى المحافظات
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">المحافظة</label>
              <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المحافظات</SelectItem>
                  <SelectItem value="EG01">القاهرة</SelectItem>
                  <SelectItem value="EG02">الإسكندرية</SelectItem>
                  <SelectItem value="EG06">الدقهلية</SelectItem>
                  <SelectItem value="EG07">الشرقية</SelectItem>
                  <SelectItem value="EG08">القليوبية</SelectItem>
                  <SelectItem value="EG09">كفر الشيخ</SelectItem>
                  <SelectItem value="EG10">الغربية</SelectItem>
                  <SelectItem value="EG11">المنوفية</SelectItem>
                  <SelectItem value="EG12">البحيرة</SelectItem>
                  <SelectItem value="EG14">الجيزة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              إجمالي الشحنات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{overallStats?.totalShipments || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              الشحنات الناجحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {overallStats?.successfulShipments || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
              <TrendingDown className="h-4 w-4" />
              الشحنات الفاشلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {overallStats?.failedShipments || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              نسبة النجاح
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{overallSuccessRate}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Companies Performance */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : performance && performance.length > 0 ? (
          performance.map((perf) => {
            const company = companies?.find((c) => c.id === perf.companyId);
            const successRate =
              (perf.totalShipments || 0) > 0
                ? (((perf.successfulShipments || 0) / (perf.totalShipments || 0)) * 100).toFixed(1)
                : '0.0';

            const getSuccessRateColor = (rate: number) => {
              if (rate >= 80) return 'text-green-600';
              if (rate >= 60) return 'text-yellow-600';
              return 'text-red-600';
            };

            return (
              <Card key={`${perf.companyId}-${perf.governorateCode}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {company?.displayName || 'شركة غير معروفة'}
                      </CardTitle>
                      <CardDescription>{perf.governorateName}</CardDescription>
                    </div>
                    <Badge variant={company?.active ? 'default' : 'secondary'}>
                      {company?.active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Success Rate */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">نسبة النجاح</div>
                      <div
                        className={`text-2xl font-bold ${getSuccessRateColor(parseFloat(successRate))}`}
                      >
                        {successRate}%
                      </div>
                    </div>

                    {/* Total Shipments */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">إجمالي الشحنات</div>
                      <div className="text-2xl font-bold">{perf.totalShipments || 0}</div>
                    </div>

                    {/* Avg Delivery Days */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        متوسط التوصيل
                      </div>
                      <div className="text-2xl font-bold">
                        {(Number(perf.avgDeliveryDays) || 0).toFixed(1)} يوم
                      </div>
                    </div>

                    {/* Customer Satisfaction */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        رضاء العملاء
                      </div>
                      <div className="text-2xl font-bold">
                        {(Number(perf.customerSatisfaction) || 0).toFixed(1)}/5
                      </div>
                    </div>

                    {/* Avg Price */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        متوسط السعر
                      </div>
                      <div className="text-2xl font-bold">
                        {(Number(perf.avgPrice) || 0).toFixed(0)} ج.م
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-600">ناجح: {perf.successfulShipments || 0}</span>
                      <span className="text-red-600">فاشل: {perf.failedShipments}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">لا توجد بيانات أداء متاحة للمحافظة المحددة</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
