import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Download, Eye, RefreshCw, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch transactions
  const { data: transactions, isLoading, refetch } = trpc.transactions.list.useQuery();

  // Filter transactions
  const filteredTransactions = transactions?.filter((tx) => {
    const matchesSearch =
      tx.id.toString().includes(searchQuery) ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status === "pending" && "قيد المراجعة"}
        {status === "approved" && "موافق عليها"}
        {status === "rejected" && "مرفوضة"}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="secondary">
        {type === "income" && "دخل"}
        {type === "expense" && "مصروف"}
        {type === "transfer" && "تحويل"}
      </Badge>
    );
  };

  const getEthicalBadge = (ethicalCheckStatus: string | null) => {
    if (!ethicalCheckStatus) {
      return (
        <Badge variant="outline" className="gap-1">
          <Shield className="w-3 h-3" />
          لم يتم التحقق
        </Badge>
      );
    }

    if (ethicalCheckStatus === "approved") {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="w-3 h-3" />
          متوافق شرعياً
        </Badge>
      );
    }

    if (ethicalCheckStatus === "rejected") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          غير متوافق
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
        <Shield className="w-3 h-3" />
        قيد المراجعة
      </Badge>
    );
  };

  const handleExport = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const csv = [
      ["رقم المعاملة", "النوع", "المبلغ", "الحالة", "الحالة الأخلاقية", "التاريخ"].join(","),
      ...filteredTransactions.map((tx) =>
        [
          tx.id,
          tx.type,
          Number(tx.amount).toFixed(2),
          tx.status,
          tx.ethicalCheckStatus || "لم يتم التحقق",
          new Date(tx.createdAt).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDetailsOpen(true);
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
          <h1 className="text-3xl font-bold">إدارة المعاملات المالية</h1>
          <p className="text-muted-foreground">
            عرض وإدارة جميع المعاملات مع التحقق الأخلاقي (KAIA)
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
          <CardDescription>
            ابحث عن المعاملات وفلترها حسب النوع والحالة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ابحث عن معاملة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="نوع المعاملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="income">دخل</SelectItem>
                <SelectItem value="expense">مصروف</SelectItem>
                <SelectItem value="transfer">تحويل</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="approved">موافق عليها</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
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
          <CardTitle>
            المعاملات ({filteredTransactions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم المعاملة</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التحقق الأخلاقي</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions && filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">#{tx.id}</TableCell>
                      <TableCell>{getTypeBadge(tx.type)}</TableCell>
                      <TableCell className={tx.type === "expense" ? "text-red-600" : "text-green-600"}>
                        {tx.type === "expense" && "-"}
                        {Number(tx.amount).toFixed(2)} ج.م
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>{getEthicalBadge(tx.ethicalCheckStatus)}</TableCell>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(tx)}
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
                    <TableCell colSpan={7} className="text-center h-24">
                      لا توجد معاملات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={(open) => setIsDetailsOpen(open)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل المعاملة #{selectedTransaction?.id}</DialogTitle>
            <DialogDescription>
              معلومات كاملة عن المعاملة والتحقق الأخلاقي
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">النوع</p>
                  <div className="mt-1">{getTypeBadge(selectedTransaction.type)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الحالة</p>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">المبلغ</p>
                  <p className={`text-lg font-bold ${selectedTransaction.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                    {selectedTransaction.type === "expense" && "-"}
                    {Number(selectedTransaction.amount).toFixed(2)} ج.م
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">التحقق الأخلاقي</p>
                  <div className="mt-1">{getEthicalBadge(selectedTransaction.ethicalCheckStatus)}</div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">الوصف</p>
                  <p className="text-lg">{selectedTransaction.description || "لا يوجد وصف"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="text-lg">
                    {new Date(selectedTransaction.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">آخر تحديث</p>
                  <p className="text-lg">
                    {new Date(selectedTransaction.updatedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {selectedTransaction.metadata && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    معلومات إضافية
                  </p>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-64">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
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
