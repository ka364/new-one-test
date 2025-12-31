// @ts-nocheck
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
import { DollarSign, CreditCard, Banknote, Plus, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function CollectionsTracking() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Fetch shipping companies for collection
  const { data: companies } = trpc.shipping.getAllCompanies.useQuery();

  // Fetch pending collections
  const { data: pendingCollections, isLoading: pendingLoading } = trpc.collections.getPending.useQuery();

  // Fetch total collection by date
  const { data: totalCollection } = trpc.collections.getTotalByDate.useQuery({ date: selectedDate });

  const confirmCollection = trpc.collections.confirm.useMutation({
    onSuccess: () => {
      toast.success("تم تأكيد التحصيل بنجاح");
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const handleConfirm = (id: number) => {
    confirmCollection.mutate({ id });
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            تتبع التحصيلات
          </h1>
          <p className="text-muted-foreground">التحصيلات النقدية والبنكية</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              تسجيل تحصيل جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تسجيل تحصيل جديد</DialogTitle>
              <DialogDescription>
                سجل التحصيلات النقدية أو التحويلات البنكية
              </DialogDescription>
            </DialogHeader>
            <CreateCollectionForm 
              companies={companies || []}
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              إجمالي التحصيل اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {totalCollection?.total || "0"} جنيه
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              التحصيل النقدي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totalCollection?.cash || "0"} جنيه
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              التحويلات البنكية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {totalCollection?.bank || "0"} جنيه
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Collections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            التحصيلات المعلقة
          </CardTitle>
          <CardDescription>التحصيلات التي تحتاج إلى تأكيد</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : pendingCollections && pendingCollections.length > 0 ? (
            <div className="space-y-4">
              {pendingCollections.map((collection: any) => (
                <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {collection.collectionType === "cash" ? (
                        <Banknote className="h-4 w-4 text-blue-600" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-purple-600" />
                      )}
                      <span className="font-medium text-lg">
                        {collection.amount} جنيه
                      </span>
                      <Badge variant={collection.collectionType === "cash" ? "default" : "secondary"}>
                        {collection.collectionType === "cash" ? "نقدي" : "بنكي"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {collection.companyName} • {format(new Date(collection.collectionDate), "PPP", { locale: ar })}
                    </p>
                    {collection.receiptNumber && (
                      <p className="text-xs text-muted-foreground">
                        إيصال: {collection.receiptNumber}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(collection.id)}
                    disabled={confirmCollection.isPending}
                  >
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                    تأكيد
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تحصيلات معلقة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collections by Company */}
      <Card>
        <CardHeader>
          <CardTitle>التحصيلات حسب الشركة</CardTitle>
          <CardDescription>ملخص التحصيلات لكل شركة شحن</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies?.map((company: any) => (
              <CompanyCollectionSummary key={company.id} company={company} date={selectedDate} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CompanyCollectionSummary({ company, date }: { company: any; date: string }) {
  const { data: collections } = trpc.collections.getByCompany.useQuery({
    companyId: company.id,
    startDate: date,
    endDate: date,
  });

  const total = collections?.reduce((sum: number, col: any) => sum + parseFloat(col.amount), 0) || 0;
  const confirmed = collections?.filter((col: any) => col.isConfirmed).length || 0;
  const pending = collections?.filter((col: any) => !col.isConfirmed).length || 0;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h4 className="font-medium">{company.nameAr || company.name}</h4>
        <p className="text-sm text-muted-foreground">
          {confirmed} مؤكد • {pending} معلق
        </p>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{total.toLocaleString()} جنيه</div>
        <p className="text-xs text-muted-foreground">{collections?.length || 0} تحصيل</p>
      </div>
    </div>
  );
}

function CreateCollectionForm({ 
  companies, 
  onSuccess 
}: { 
  companies: any[]; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    collectionType: "cash" as "cash" | "bank_transfer",
    companyId: "",
    amount: "",
    collectionDate: new Date().toISOString().split("T")[0],
    receiptNumber: "",
    bankReference: "",
    notes: "",
  });

  const createCollection = trpc.collections.create.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل التحصيل بنجاح");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCollection.mutate({
      collectionType: formData.collectionType,
      companyId: parseInt(formData.companyId),
      amount: formData.amount,
      collectionDate: formData.collectionDate,
      receiptNumber: formData.receiptNumber || undefined,
      bankReference: formData.bankReference || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="collectionType">نوع التحصيل *</Label>
          <Select
            value={formData.collectionType}
            onValueChange={(value: "cash" | "bank_transfer") => 
              setFormData({ ...formData, collectionType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">نقدي</SelectItem>
              <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
            </SelectContent>
          </Select>
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
          <Label htmlFor="amount">المبلغ *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="collectionDate">تاريخ التحصيل *</Label>
          <Input
            id="collectionDate"
            type="date"
            required
            value={formData.collectionDate}
            onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
          />
        </div>

        {formData.collectionType === "cash" ? (
          <div className="space-y-2">
            <Label htmlFor="receiptNumber">رقم الإيصال</Label>
            <Input
              id="receiptNumber"
              value={formData.receiptNumber}
              onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="bankReference">رقم المرجع البنكي</Label>
            <Input
              id="bankReference"
              value={formData.bankReference}
              onChange={(e) => setFormData({ ...formData, bankReference: e.target.value })}
            />
          </div>
        )}
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
        <Button type="submit" disabled={createCollection.isPending}>
          {createCollection.isPending ? "جاري التسجيل..." : "تسجيل تحصيل"}
        </Button>
      </div>
    </form>
  );
}
