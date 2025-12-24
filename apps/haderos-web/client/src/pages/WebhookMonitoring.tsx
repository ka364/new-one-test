import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, CheckCircle2, XCircle, Clock, TrendingUp, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WebhookMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>();

  // Fetch webhook stats
  const { data: stats, refetch: refetchStats } = trpc.webhooks.getStats.useQuery();

  // Fetch recent logs
  const { data: logs, refetch: refetchLogs } = trpc.webhooks.getRecentLogs.useQuery({
    limit: 20,
    topic: selectedTopic,
  });

  // Fetch recent orders
  const { data: orders, refetch: refetchOrders } = trpc.webhooks.getRecentOrders.useQuery({
    limit: 10,
  });

  // Fetch order stats
  const { data: orderStats, refetch: refetchOrderStats } = trpc.webhooks.getOrderStats.useQuery();

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchStats();
      refetchLogs();
      refetchOrders();
      refetchOrderStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetchStats, refetchLogs, refetchOrders, refetchOrderStats]);

  return (
    <div className="container py-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مراقبة Webhooks</h1>
          <p className="text-muted-foreground">مراقبة حية لـ webhooks و الطلبات من Shopify</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? "default" : "outline"} className="cursor-pointer" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? "تحديث تلقائي" : "إيقاف التحديث"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي Webhooks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              آخر 24 ساعة: {stats?.last24h || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks ناجحة</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.success || 0}</div>
            <p className="text-xs text-muted-foreground">
              نسبة النجاح: {stats?.successRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks فاشلة</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">
              تحتاج إلى مراجعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات اليوم</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{orderStats?.today || 0}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي: {orderStats?.total || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            آخر الطلبات من Shopify
          </CardTitle>
          <CardDescription>الطلبات الواردة حديثاً عبر webhooks</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الطلب</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">حالة الدفع</TableHead>
                <TableHead className="text-right">حالة الشحن</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_name || `#${order.order_number}`}</TableCell>
                    <TableCell>{order.email || "غير محدد"}</TableCell>
                    <TableCell>
                      {parseFloat(order.total_price).toFixed(2)} {order.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.financial_status === "paid" ? "default" : "secondary"}>
                        {order.financial_status === "paid" ? "مدفوع" : order.financial_status || "معلق"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.fulfillment_status === "fulfilled" ? "default" : "outline"}>
                        {order.fulfillment_status === "fulfilled" ? "تم الشحن" : order.fulfillment_status || "لم يشحن"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("ar-EG")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا توجد طلبات حتى الآن
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Webhook Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                سجل Webhooks
              </CardTitle>
              <CardDescription>آخر الأحداث الواردة من Shopify</CardDescription>
            </div>
            <Select value={selectedTopic} onValueChange={(value) => setSelectedTopic(value === "all" ? undefined : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="orders/create">طلب جديد</SelectItem>
                <SelectItem value="orders/update">تحديث طلب</SelectItem>
                <SelectItem value="orders/cancelled">إلغاء طلب</SelectItem>
                <SelectItem value="orders/fulfilled">شحن طلب</SelectItem>
                <SelectItem value="inventory_levels/update">تحديث مخزون</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">Shopify ID</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">محاولات</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {log.topic === "orders/create" && "طلب جديد"}
                        {log.topic === "orders/update" && "تحديث طلب"}
                        {log.topic === "orders/cancelled" && "إلغاء طلب"}
                        {log.topic === "orders/fulfilled" && "شحن طلب"}
                        {log.topic === "inventory_levels/update" && "تحديث مخزون"}
                        {!["orders/create", "orders/update", "orders/cancelled", "orders/fulfilled", "inventory_levels/update"].includes(log.topic) && log.topic}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.shopify_id}</TableCell>
                    <TableCell>
                      {log.processed ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          نجح
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 ml-1" />
                          فشل
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.retry_count || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("ar-EG")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    لا توجد سجلات حتى الآن
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Webhook Topics Stats */}
      {stats?.topicStats && stats.topicStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              إحصائيات حسب النوع
            </CardTitle>
            <CardDescription>توزيع webhooks حسب النوع</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topicStats.map((topic: any) => (
                <div key={topic.topic} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{topic.topic}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{topic.count} مرة</div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(topic.count / (stats.total || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
