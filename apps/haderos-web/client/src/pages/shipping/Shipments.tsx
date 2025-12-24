/**
 * HADER Shipments List Page
 * View and manage all shipments
 */

import { useState } from 'react';
import { ShippingLayout } from '@/components/ShippingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Search,
  Filter,
  Download,
  Eye,
  Package,
  TruckIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'wouter';

interface Shipment {
  id: string;
  trackingNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  origin: string;
  destination: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  codAmount: number;
  createdAt: string;
  estimatedDelivery: string;
}

export default function ShipmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with API call
  const shipments: Shipment[] = [
    {
      id: '1',
      trackingNumber: 'SH-2025-001',
      customer: { name: 'أحمد محمد علي', phone: '01012345678' },
      origin: 'القاهرة',
      destination: 'الإسكندرية',
      status: 'delivered',
      codAmount: 1500,
      createdAt: '2025-12-20',
      estimatedDelivery: '2025-12-21',
    },
    {
      id: '2',
      trackingNumber: 'SH-2025-002',
      customer: { name: 'فاطمة حسن', phone: '01098765432' },
      origin: 'الجيزة',
      destination: 'المنصورة',
      status: 'in_transit',
      codAmount: 2300,
      createdAt: '2025-12-20',
      estimatedDelivery: '2025-12-22',
    },
    {
      id: '3',
      trackingNumber: 'SH-2025-003',
      customer: { name: 'محمود عبدالله', phone: '01155443322' },
      origin: 'القاهرة',
      destination: 'أسيوط',
      status: 'out_for_delivery',
      codAmount: 890,
      createdAt: '2025-12-19',
      estimatedDelivery: '2025-12-21',
    },
    {
      id: '4',
      trackingNumber: 'SH-2025-004',
      customer: { name: 'سارة أحمد', phone: '01234567890' },
      origin: 'الإسكندرية',
      destination: 'القاهرة',
      status: 'pending',
      codAmount: 4500,
      createdAt: '2025-12-21',
      estimatedDelivery: '2025-12-23',
    },
    {
      id: '5',
      trackingNumber: 'SH-2025-005',
      customer: { name: 'خالد محمود', phone: '01087654321' },
      origin: 'طنطا',
      destination: 'الزقازيق',
      status: 'picked_up',
      codAmount: 1200,
      createdAt: '2025-12-21',
      estimatedDelivery: '2025-12-22',
    },
  ];

  const getStatusConfig = (status: Shipment['status']) => {
    const configs = {
      pending: {
        label: 'قيد الانتظار',
        icon: Clock,
        variant: 'secondary' as const,
        color: 'text-gray-600',
      },
      picked_up: {
        label: 'تم الاستلام',
        icon: Package,
        variant: 'secondary' as const,
        color: 'text-blue-600',
      },
      in_transit: {
        label: 'في الطريق',
        icon: TruckIcon,
        variant: 'default' as const,
        color: 'text-orange-600',
      },
      out_for_delivery: {
        label: 'خارج للتوصيل',
        icon: TruckIcon,
        variant: 'default' as const,
        color: 'text-purple-600',
      },
      delivered: {
        label: 'تم التوصيل',
        icon: CheckCircle,
        variant: 'default' as const,
        color: 'text-green-600',
      },
      cancelled: {
        label: 'ملغي',
        icon: XCircle,
        variant: 'destructive' as const,
        color: 'text-red-600',
      },
      returned: {
        label: 'مرتجع',
        icon: AlertCircle,
        variant: 'destructive' as const,
        color: 'text-red-600',
      },
    };
    return configs[status];
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.customer.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'إجمالي الشحنات', value: shipments.length, color: 'text-blue-600' },
    { label: 'قيد التوصيل', value: shipments.filter(s => ['in_transit', 'out_for_delivery'].includes(s.status)).length, color: 'text-orange-600' },
    { label: 'تم التوصيل', value: shipments.filter(s => s.status === 'delivered').length, color: 'text-green-600' },
    { label: 'قيد الانتظار', value: shipments.filter(s => s.status === 'pending').length, color: 'text-gray-600' },
  ];

  return (
    <ShippingLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">الشحنات</h1>
            <p className="text-gray-500 mt-1">إدارة ومتابعة جميع الشحنات</p>
          </div>
          <Link href="/shipping/create">
            <Button style={{ backgroundColor: '#C62822' }} className="text-white">
              <Package className="h-4 w-4 ml-2" />
              إنشاء شحنة جديدة
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className={`text-3xl font-bold mt-2 ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="ابحث برقم التتبع، اسم العميل، أو رقم الهاتف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="picked_up">تم الاستلام</SelectItem>
                  <SelectItem value="in_transit">في الطريق</SelectItem>
                  <SelectItem value="out_for_delivery">خارج للتوصيل</SelectItem>
                  <SelectItem value="delivered">تم التوصيل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                  <SelectItem value="returned">مرتجع</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shipments Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الشحنات ({filteredShipments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التتبع</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>من - إلى</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المبلغ (COD)</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>التوصيل المتوقع</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      لا توجد شحنات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShipments.map((shipment) => {
                    const statusConfig = getStatusConfig(shipment.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">
                          {shipment.trackingNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{shipment.customer.name}</div>
                            <div className="text-sm text-gray-500">{shipment.customer.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{shipment.origin}</div>
                            <div className="text-gray-500">← {shipment.destination}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {shipment.codAmount.toLocaleString()} ج.م
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {shipment.createdAt}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {shipment.estimatedDelivery}
                        </TableCell>
                        <TableCell>
                          <Link href={`/shipping/track/${shipment.trackingNumber}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 ml-1" />
                              عرض
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ShippingLayout>
  );
}
