/**
 * COD Tracking Dashboard
 * Main dashboard for COD order tracking and management
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, Phone, CheckCircle, Truck, DollarSign, Clock, AlertCircle } from 'lucide-react';

export default function CODTracking() {
  const [selectedStage, setSelectedStage] = useState<string | undefined>(undefined);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = trpc.cod.getDashboardStats.useQuery();

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = trpc.cod.getAllOrders.useQuery({
    limit: 50,
    offset: 0,
    stage: selectedStage,
  });

  const stageIcons: Record<string, any> = {
    pending: Clock,
    customerService: Phone,
    confirmation: CheckCircle,
    preparation: Package,
    shipping: Truck,
    delivery: Truck,
    collection: DollarSign,
    settlement: CheckCircle,
  };

  const stageColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    customerService: 'bg-blue-100 text-blue-800',
    confirmation: 'bg-green-100 text-green-800',
    preparation: 'bg-yellow-100 text-yellow-800',
    shipping: 'bg-purple-100 text-purple-800',
    delivery: 'bg-indigo-100 text-indigo-800',
    collection: 'bg-emerald-100 text-emerald-800',
    settlement: 'bg-teal-100 text-teal-800',
  };

  const stageLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    customerService: 'خدمة العملاء',
    confirmation: 'التأكيد',
    preparation: 'التحضير',
    shipping: 'الشحن',
    delivery: 'التوصيل',
    collection: 'التحصيل',
    settlement: 'التسوية',
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">متابعة طلبات COD</h1>
          <p className="text-muted-foreground">نظام متكامل لإدارة طلبات الدفع عند الاستلام</p>
        </div>
        <Button>
          <Package className="ml-2 h-4 w-4" />
          طلب جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.stageStats.reduce((sum, s) => sum + Number(s.count), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">جميع المراحل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلبات اليوم</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayOrdersCount || 0}</div>
            <p className="text-xs text-muted-foreground">طلبات جديدة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة COD الإجمالية</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(stats?.totalCODValue || 0).toLocaleString('ar-EG')} ج.م
            </div>
            <p className="text-xs text-muted-foreground">إجمالي المبالغ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.statusStats.find((s) => s.status === 'in_progress')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">طلبات نشطة</p>
          </CardContent>
        </Card>
      </div>

      {/* Stage Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats?.stageStats.map((stageStat) => {
          const Icon = stageIcons[stageStat.stage || 'pending'] || AlertCircle;
          return (
            <Card
              key={stageStat.stage}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedStage === stageStat.stage ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() =>
                setSelectedStage(
                  selectedStage === stageStat.stage ? undefined : stageStat.stage || undefined
                )
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Badge className={stageColors[stageStat.stage || 'pending']}>
                    {Number(stageStat.count)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{stageLabels[stageStat.stage || 'pending']}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>الطلبات</CardTitle>
          <CardDescription>
            {selectedStage ? `عرض طلبات مرحلة: ${stageLabels[selectedStage]}` : 'عرض جميع الطلبات'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : ordersData && ordersData.orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">المرحلة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderId}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.customerPhone}</TableCell>
                    <TableCell>{Number(order.codAmount).toLocaleString('ar-EG')} ج.م</TableCell>
                    <TableCell>
                      <Badge className={stageColors[order.currentStage || 'pending']}>
                        {stageLabels[order.currentStage || 'pending']}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'completed'
                            ? 'default'
                            : order.status === 'cancelled'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {order.status === 'completed'
                          ? 'مكتمل'
                          : order.status === 'cancelled'
                            ? 'ملغي'
                            : order.status === 'in_progress'
                              ? 'قيد التنفيذ'
                              : 'قيد الانتظار'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt || '').toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد طلبات</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
