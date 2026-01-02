import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Truck,
  Search,
  Plus,
  Download,
  Printer,
  RefreshCw,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';

export default function Shipments() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock data - will be replaced with real tRPC data
  const shipments = [
    {
      id: '1',
      trackingNumber: 'NOW-12345',
      carrier: 'Bosta',
      customerName: 'أحمد محمد',
      phone: '01012345678',
      address: 'القاهرة، مصر الجديدة',
      status: 'delivered',
      cod: 450,
      createdAt: '2025-12-18',
    },
    {
      id: '2',
      trackingNumber: 'NOW-12346',
      carrier: 'J&T',
      customerName: 'فاطمة علي',
      phone: '01123456789',
      address: 'الجيزة، المهندسين',
      status: 'in_transit',
      cod: 380,
      createdAt: '2025-12-18',
    },
    {
      id: '3',
      trackingNumber: 'NOW-12347',
      carrier: 'GT Express',
      customerName: 'محمود حسن',
      phone: '01234567890',
      address: 'الإسكندرية، سموحة',
      status: 'pending',
      cod: 520,
      createdAt: '2025-12-17',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      pending: { label: 'قيد الانتظار', variant: 'secondary' },
      picked_up: { label: 'تم الاستلام', variant: 'default' },
      in_transit: { label: 'في الطريق', variant: 'default' },
      delivered: { label: 'تم التوصيل', variant: 'outline' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
      returned: { label: 'مرتجع', variant: 'destructive' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCarrierBadge = (carrier: string) => {
    const colors: Record<string, string> = {
      Bosta: 'bg-blue-100 text-blue-800',
      'J&T': 'bg-red-100 text-red-800',
      'GT Express': 'bg-green-100 text-green-800',
      Eshhnly: 'bg-purple-100 text-purple-800',
    };
    return <Badge className={colors[carrier] || 'bg-gray-100 text-gray-800'}>{carrier}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الشحنات</h1>
            <p className="text-gray-600 mt-1">
              إدارة جميع الشحنات عبر Bosta، J&T، GT Express، واشحنلي
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            شحنة جديدة
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الشحنات</p>
                <p className="text-2xl font-bold">1,289</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">في الطريق</p>
                <p className="text-2xl font-bold">47</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">قيد الانتظار</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">COD المعلق</p>
                <p className="text-2xl font-bold">21,390 ج.م</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Create Shipment Form */}
        {showCreateForm && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">إنشاء شحنة جديدة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier">شركة الشحن</Label>
                <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                  <SelectTrigger id="carrier">
                    <SelectValue placeholder="اختر شركة الشحن" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bosta">Bosta (API)</SelectItem>
                    <SelectItem value="jnt">J&T Express (API)</SelectItem>
                    <SelectItem value="gt">GT Express (Excel)</SelectItem>
                    <SelectItem value="eshhnly">اشحنلي (Excel)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">اسم العميل</Label>
                <Input id="customerName" placeholder="أدخل اسم العميل" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" placeholder="01XXXXXXXXX" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cod">المبلغ (COD)</Label>
                <Input id="cod" type="number" placeholder="0.00" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">العنوان الكامل</Label>
                <Textarea
                  id="address"
                  placeholder="المحافظة، المدينة، الشارع، رقم المبنى..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="items">عدد القطع</Label>
                <Input id="items" type="number" placeholder="1" defaultValue="1" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Input id="notes" placeholder="ملاحظات إضافية (اختياري)" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button className="flex-1">
                <Plus className="w-4 h-4 ml-2" />
                إنشاء الشحنة
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                إلغاء
              </Button>
            </div>

            {selectedCarrier === 'bosta' || selectedCarrier === 'jnt' ? (
              <p className="text-sm text-green-600 mt-4">
                ✅ سيتم إنشاء الشحنة تلقائياً عبر API وطباعة البوليصة
              </p>
            ) : (
              <p className="text-sm text-yellow-600 mt-4">
                ⚠️ سيتم تصدير البيانات لملف Excel للإرسال يدوياً
              </p>
            )}
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="ابحث برقم التتبع، اسم العميل، أو رقم الهاتف..."
                  className="pr-10"
                />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الشركات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الشركات</SelectItem>
                <SelectItem value="bosta">Bosta</SelectItem>
                <SelectItem value="jnt">J&T Express</SelectItem>
                <SelectItem value="gt">GT Express</SelectItem>
                <SelectItem value="eshhnly">اشحنلي</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="picked_up">تم الاستلام</SelectItem>
                <SelectItem value="in_transit">في الطريق</SelectItem>
                <SelectItem value="delivered">تم التوصيل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
                <SelectItem value="returned">مرتجع</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير Excel
            </Button>
          </div>
        </Card>

        {/* Shipments Table */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-6 pt-6">
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="bosta">Bosta</TabsTrigger>
                <TabsTrigger value="jnt">J&T</TabsTrigger>
                <TabsTrigger value="gt">GT Express</TabsTrigger>
                <TabsTrigger value="eshhnly">اشحنلي</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم التتبع</TableHead>
                    <TableHead className="text-right">الشركة</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">COD</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                      <TableCell>{getCarrierBadge(shipment.carrier)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {shipment.customerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {shipment.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="max-w-xs truncate">{shipment.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell className="font-semibold">{shipment.cod} ج.م</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {shipment.createdAt}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Search className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
