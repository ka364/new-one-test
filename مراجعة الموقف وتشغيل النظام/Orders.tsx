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
import { Search, Download, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch orders
  const { data: orders, isLoading, refetch } = trpc.orders.list.useQuery();

  // Filter orders
  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(order.id).includes(searchQuery);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "secondary",
      completed: "default",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status === "pending" && "قيد الانتظار"}
        {status === "processing" && "قيد المعالجة"}
        {status === "completed" && "مكتمل"}
        {status === "cancelled" && "ملغي"}
      </Badge>
    );
  };

  const handleExport = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const csv = [
      ["رقم الطلب", "العميل", "المبلغ", "الحالة", "التاريخ"].join(","),
      ...filteredOrders.map((order) =>
        [
          order.id,
          order.customerName || "غير محدد",
          order.totalAmount,
          order.status,
          new Date(order.createdAt).toLocaleDateString("ar-EG"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleViewDetails = (order: any) => {