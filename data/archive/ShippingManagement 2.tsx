import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Truck, MapPin, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ShippingManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch shipping companies
  const { data: companies, isLoading: companiesLoading } = trpc.shipping.getAllCompanies.useQuery();

  // Fetch shipments (we'll need to add this query)
  const { data: shipments, isLoading: shipmentsLoading } = trpc.shipping.getShipmentsByOrder.useQuery(
    { orderId: 1 }, // This should be dynamic based on selected order
    { enabled: false } // Disable for now until we have proper order selection
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      picked_up: "bg-blue-500",
      in_transit: "bg-purple-500",
      out_for_delivery: "bg-indigo-500",
      delivered: "bg-green-500",
      returned: "bg-red-500",
      lost: "bg-gray-500",
      cancelled: "bg-gray-400",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "قيد الانتظار",
      picked_up: "تم الاستلام",
      in_transit: "في الطريق",
      out_for_delivery: "خارج للتوصيل",
      delivered: "تم التوصيل",
      returned: "مرتجع",
      lost: "مفقود",
      cancelled: "ملغي",
    };
    return texts[status] || status;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8" />
            إدارة الشحنات
          </h1>
          <p className="text-muted-foreground">توزيع وتتبع الشحنات</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إنشاء شحنة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء شحنة جديدة</DialogTitle>
              <DialogDescription>
                أدخل بيانات الشحنة وحدد شركة الشحن
              </DialogDescription>
            </DialogHeader>
            <CreateShipmentForm 
              companies={companies || []}
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Shipping Companies Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {companiesLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          companies?.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {company.nameAr || company.name}
                </CardTitle>
                <CardDescription className="text-xs">{company.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">نشط</span>
                  <Badge variant={company.isActive ? "default" : "secondary"}>
                    {company.isActive ? "نشط" : "غير نشط"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>الشحنات</CardTitle>
          <CardDescription>جميع الشحنات النشطة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم التتبع أو رقم الطلب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="شركة الشحن" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الشركات</SelectItem>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.nameAr || company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shipments Table */}
          <div className="rounded-md border">
            <div className="p-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد شحنات حالياً</p>
              <p className="text-sm mt-2">قم بإنشاء شحنة جديدة للبدء</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Pricing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            مناطق الشحن والأسعار
          </CardTitle>
          <CardDescription>الأسعار حسب المنطقة لكل شركة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {companies?.map((company) => (
              <div key={company.id} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{company.nameAr || company.name}</h4>
                <div className="space-y-1 text-sm">
                  {company.zonesConfig && typeof company.zonesConfig === 'object' && (
                    Object.entries(company.zonesConfig as Record<string, any>).map(([zone, price]) => (
                      <div key={zone} className="flex justify-between">
                        <span className="text-muted-foreground">{zone}:</span>
                        <span className="font-medium">{price} جنيه</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateShipmentForm({ 
  companies, 
  onSuccess 
}: { 
  companies: any[]; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    orderId: "",
    companyId: "",
    trackingNumber: "",
    zoneId: "",
    weight: "",
    shippingCost: "",
    codFee: "",
    insuranceFee: "",
    totalCost: "",
    notes: "",
  });

  const createShipment = trpc.shipping.createShipment.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الشحنة بنجاح");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShipment.mutate({
      orderId: parseInt(formData.orderId),
      companyId: parseInt(formData.companyId),
      trackingNumber: formData.trackingNumber || undefined,
      zoneId: parseInt(formData.zoneId),
      weight: formData.weight,
      shippingCost: formData.shippingCost,
      codFee: formData.codFee || undefined,
      insuranceFee: formData.insuranceFee || undefined,
      totalCost: formData.totalCost,
      notes: formData.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="orderId">رقم الطلب *</Label>
          <Input
            id="orderId"
            type="number"
            required
            value={formData.orderId}
            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyId">شركة الشحن *</Label>
          <Select
            value={formData.companyId}
            onValueChange={(value) => setFormData({ ...formData, companyId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر شركة الشحن" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.nameAr || company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trackingNumber">رقم التتبع</Label>
          <Input
            id="trackingNumber"
            value={formData.trackingNumber}
            onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">الوزن (كجم) *</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            required
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shippingCost">تكلفة الشحن *</Label>
          <Input
            id="shippingCost"
            type="number"
            step="0.01"
            required
            value={formData.shippingCost}
            onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalCost">التكلفة الإجمالية *</Label>
          <Input
            id="totalCost"
            type="number"
            step="0.01"
            required
            value={formData.totalCost}
            onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          إلغاء
        </Button>
        <Button type="submit" disabled={createShipment.isPending}>
          {createShipment.isPending ? "جاري الإنشاء..." : "إنشاء شحنة"}
        </Button>
      </div>
    </form>
  );
}
