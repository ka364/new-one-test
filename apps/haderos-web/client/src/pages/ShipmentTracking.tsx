import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, Search, Package, TruckIcon, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function ShipmentTracking() {
  const [company, setCompany] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  const shipmentsQuery = trpc.shipments.list.useQuery({
    company: company || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: search || undefined,
    limit,
    offset: page * limit,
  });

  const statsQuery = trpc.shipments.stats.useQuery();

  const exportMutation = trpc.shipments.export.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([Uint8Array.from(atob(data.excelFile), (c) => c.charCodeAt(0))], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  const handleExport = () => {
    exportMutation.mutate({
      company: company || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search || undefined,
    });
  };

  const handleReset = () => {
    setCompany('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">تتبع الشحنات</h1>
            <p className="text-muted-foreground mt-2">
              إدارة ومتابعة جميع الشحنات من الشركات الثلاث
            </p>
          </div>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                تصدير Excel
              </>
            )}
          </Button>
        </div>

        {/* Statistics Cards */}
        {statsQuery.data && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي الشحنات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsQuery.data.total}</div>
              </CardContent>
            </Card>

            {statsQuery.data.byCompany &&
              (statsQuery.data.byCompany as any[]).map((stat: any) => (
                <Card key={stat.company}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                      {stat.company === 'bosta'
                        ? 'Bosta'
                        : stat.company === 'gt_express'
                          ? 'GT Express'
                          : 'Eshhnly'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.count}</div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>فلترة الشحنات</CardTitle>
            <CardDescription>ابحث وفلتر الشحنات حسب الشركة والتاريخ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>الشركة</Label>
                <Select value={company} onValueChange={setCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الشركات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الشركات</SelectItem>
                    <SelectItem value="bosta">Bosta</SelectItem>
                    <SelectItem value="gt_express">GT Express</SelectItem>
                    <SelectItem value="eshhnly">Eshhnly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>إلى تاريخ</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>بحث متقدم</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="اسم العميل، رقم الهاتف، رقم التتبع، رقم الطلب..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ابحث في جميع الحقول: اسم العميل، رقم الهاتف، رقم التتبع، رقم الطلب
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                إعادة تعيين
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shipments Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الشحنات</CardTitle>
            <CardDescription>
              {shipmentsQuery.data ? `${shipmentsQuery.data.total} شحنة` : 'جاري التحميل...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shipmentsQuery.isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="text-muted-foreground mt-4">جاري تحميل الشحنات...</p>
              </div>
            ) : shipmentsQuery.data && shipmentsQuery.data.shipments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-3 font-medium">#</th>
                        <th className="text-right p-3 font-medium">الشركة</th>
                        <th className="text-right p-3 font-medium">رقم التتبع</th>
                        <th className="text-right p-3 font-medium">رقم الطلب</th>
                        <th className="text-right p-3 font-medium">العميل</th>
                        <th className="text-right p-3 font-medium">الهاتف</th>
                        <th className="text-right p-3 font-medium">الكمية</th>
                        <th className="text-right p-3 font-medium">المبلغ</th>
                        <th className="text-right p-3 font-medium">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipmentsQuery.data.shipments.map((shipment: any, index: number) => (
                        <tr key={shipment.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">{page * limit + index + 1}</td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                shipment.company === 'bosta'
                                  ? 'bg-blue-100 text-blue-800'
                                  : shipment.company === 'gt_express'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {shipment.company === 'bosta'
                                ? 'Bosta'
                                : shipment.company === 'gt_express'
                                  ? 'GT'
                                  : 'Eshhnly'}
                            </span>
                          </td>
                          <td className="p-3 text-sm font-mono">
                            {shipment.tracking_number || '-'}
                          </td>
                          <td className="p-3 text-sm font-mono">{shipment.order_number || '-'}</td>
                          <td className="p-3 text-sm">{shipment.customer_name || '-'}</td>
                          <td className="p-3 text-sm" dir="ltr">
                            {shipment.customer_phone || '-'}
                          </td>
                          <td className="p-3 text-sm">{shipment.quantity || 0}</td>
                          <td className="p-3 text-sm">{shipment.amount || 0} ج.م</td>
                          <td className="p-3 text-sm">
                            {shipment.shipment_date
                              ? new Date(shipment.shipment_date).toLocaleDateString('ar-EG')
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    عرض {page * limit + 1} -{' '}
                    {Math.min((page + 1) * limit, shipmentsQuery.data.total)} من{' '}
                    {shipmentsQuery.data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!shipmentsQuery.data.hasMore}
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mt-4">لا توجد شحنات</p>
                <p className="text-sm text-muted-foreground mt-2">
                  جرب تغيير الفلاتر أو استيراد البيانات
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
