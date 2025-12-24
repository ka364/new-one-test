import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  TrendingUp,
  Box,
  DollarSign
} from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

export default function NowShoesDashboard() {
  // const { toast } = useToast();
  const [selectedDate] = useState<Date>(new Date());

  // Fetch data
  const { data: products = [], isLoading: loadingProducts } = trpc.nowshoes.getAllProducts.useQuery();
  const { data: inventory = [], isLoading: loadingInventory } = trpc.nowshoes.getInventory.useQuery();
  const { data: lowStock = [], isLoading: loadingLowStock } = trpc.nowshoes.getLowStockItems.useQuery();
  const { data: orders = [], isLoading: loadingOrders } = trpc.nowshoes.getAllOrders.useQuery();
  const { data: topProducts = [], isLoading: loadingTop } = trpc.nowshoes.getTopSellingProducts.useQuery({ limit: 5 });
  const { data: dailyStats } = trpc.nowshoes.getDailySalesStats.useQuery({ date: selectedDate }, { enabled: !!selectedDate });

  const isLoading = loadingProducts || loadingInventory || loadingLowStock || loadingOrders || loadingTop;

  // Calculate stats
  const totalProducts = products.length;
  const totalInventory = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockCount = lowStock.length;
  const todayOrders = orders.filter(order => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt);
    return orderDate.toDateString() === selectedDate.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              NOW SHOES Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              لوحة التحكم الرئيسية - إدارة المخزون والطلبات
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                موديل مختلف
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المخزون الكلي</CardTitle>
              <Box className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalInventory}</div>
              <p className="text-xs text-muted-foreground mt-1">
                قطعة متاحة
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تنبيهات المخزون</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{lowStockCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                منتج يحتاج إعادة توريد
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات اليوم</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dailyStats?.totalRevenue ? `${Number(dailyStats.totalRevenue).toFixed(0)} جنيه` : 'لا توجد مبيعات'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                تنبيه: منتجات تحتاج إعادة توريد
              </CardTitle>
              <CardDescription className="text-red-600 dark:text-red-300">
                {lowStockCount} منتج وصل للحد الأدنى من المخزون
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStock.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium">{item.productCode}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.size && `مقاس ${item.size}`} {item.color && `- ${item.color}`}
                      </p>
                    </div>
                    <div className="text-left">
                      <Badge variant="destructive">
                        {item.quantity} قطعة
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        الحد الأدنى: {item.minStockLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockCount > 5 && (
                <Button variant="outline" className="w-full mt-4">
                  عرض جميع المنتجات ({lowStockCount})
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              أكثر المنتجات مبيعاً
            </CardTitle>
            <CardDescription>
              أفضل 5 منتجات من حيث المبيعات
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTop ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : topProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد بيانات مبيعات</div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{product.productCode}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.totalQuantity} قطعة مباعة
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xl font-bold text-green-600">
                        {Number(product.totalRevenue).toFixed(0)} جنيه
                      </p>
                      <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              آخر الطلبات
            </CardTitle>
            <CardDescription>
              أحدث {orders.slice(0, 10).length} طلب
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد طلبات</div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.city}</p>
                    </div>
                    <div className="text-left">
                      <Badge variant={
                        order.status === 'pending' ? 'secondary' :
                        order.status === 'confirmed' ? 'default' :
                        order.status === 'cancelled' ? 'destructive' : 'outline'
                      }>
                        {order.status}
                      </Badge>
                      <p className="text-sm font-semibold mt-1">
                        {Number(order.totalAmount).toFixed(0)} جنيه
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
