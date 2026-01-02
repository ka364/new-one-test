import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch campaigns
  const { data: campaigns, isLoading, refetch } = trpc.campaigns.list.useQuery();

  // Filter campaigns
  const filteredCampaigns = campaigns?.filter((campaign) => {
    const matchesSearch =
      campaign.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.id.toString().includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || campaign.type === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      active: 'default',
      paused: 'secondary',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status === 'draft' && 'مسودة'}
        {status === 'active' && 'نشطة'}
        {status === 'paused' && 'متوقفة'}
        {status === 'completed' && 'مكتملة'}
        {status === 'cancelled' && 'ملغاة'}
      </Badge>
    );
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: 'bg-blue-600',
      instagram: 'bg-pink-600',
      tiktok: 'bg-black',
      google: 'bg-green-600',
      twitter: 'bg-sky-500',
    };
    return <Badge className={colors[platform] || 'bg-gray-600'}>{platform.toUpperCase()}</Badge>;
  };

  const handleExport = () => {
    if (!filteredCampaigns || filteredCampaigns.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    const csv = [
      ['رقم الحملة', 'الاسم', 'المنصة', 'الميزانية', 'الإنفاق', 'الحالة', 'التاريخ'].join(','),
      ...filteredCampaigns.map((campaign) =>
        [
          campaign.id,
          campaign.campaignName,
          campaign.type,
          Number(campaign.budget).toFixed(2),
          Number(campaign.spent).toFixed(2),
          campaign.status,
          new Date(campaign.startDate).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `campaigns_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير البيانات بنجاح');
  };

  const handleViewDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsDetailsOpen(true);
  };

  const calculateROI = (spent: string, revenue: string) => {
    const spentNum = Number(spent);
    const revenueNum = Number(revenue);
    if (spentNum === 0) return 0;
    return (((revenueNum - spentNum) / spentNum) * 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الحملات التسويقية</h1>
          <p className="text-muted-foreground">
            عرض وإدارة جميع الحملات التسويقية عبر المنصات المختلفة
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحملات</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحملات النشطة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.filter((c) => c.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الميزانية</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.reduce((sum, c) => sum + Number(c.budget), 0).toFixed(0)} ج.م
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإنفاق</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.reduce((sum, c) => sum + Number(c.spent), 0).toFixed(0)} ج.م
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
          <CardDescription>ابحث عن الحملات وفلترها حسب الحالة والمنصة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ابحث عن حملة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="المنصة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المنصات</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="multi_channel">Multi Channel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="paused">متوقفة</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الحملات ({filteredCampaigns?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الحملة</TableHead>
                  <TableHead className="text-right">اسم الحملة</TableHead>
                  <TableHead className="text-right">المنصة</TableHead>
                  <TableHead className="text-right">الميزانية</TableHead>
                  <TableHead className="text-right">الإنفاق</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ البدء</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns && filteredCampaigns.length > 0 ? (
                  filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">#{campaign.id}</TableCell>
                      <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                      <TableCell>{getPlatformBadge(campaign.type)}</TableCell>
                      <TableCell>{Number(campaign.budget).toFixed(2)} ج.م</TableCell>
                      <TableCell>{Number(campaign.spent).toFixed(2)} ج.م</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        {new Date(campaign.startDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(campaign)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      لا توجد حملات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={(open) => setIsDetailsOpen(open)}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.campaignName}</DialogTitle>
            <DialogDescription>تفاصيل الحملة ومقاييس الأداء</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">المنصة</p>
                  <div className="mt-1">{getPlatformBadge(selectedCampaign.type)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الحالة</p>
                  <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الميزانية</p>
                  <p className="text-lg font-bold">
                    {Number(selectedCampaign.budget).toFixed(2)} ج.م
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الإنفاق</p>
                  <p className="text-lg font-bold text-orange-600">
                    {Number(selectedCampaign.spent).toFixed(2)} ج.م
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">تاريخ البدء</p>
                  <p className="text-lg">
                    {new Date(selectedCampaign.startDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">تاريخ الانتهاء</p>
                  <p className="text-lg">
                    {selectedCampaign.endDate
                      ? new Date(selectedCampaign.endDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'مستمرة'}
                  </p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">مقاييس الأداء</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        مرات الظهور
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedCampaign.impressions?.toLocaleString() || 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        النقرات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedCampaign.clicks?.toLocaleString() || 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        التحويلات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedCampaign.conversions?.toLocaleString() || 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        العائد على الاستثمار
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {calculateROI(selectedCampaign.spent, selectedCampaign.revenue || '0')}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {selectedCampaign.metadata && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">معلومات إضافية</p>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-48">
                    {JSON.stringify(selectedCampaign.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
