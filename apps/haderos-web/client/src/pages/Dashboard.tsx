import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { BackendStatus } from '@/components/BackendStatus';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.recentActivity.useQuery();
  const { data: insights, isLoading: insightsLoading } = trpc.insights.list.useQuery({ limit: 5 });

  if (statsLoading || activityLoading || insightsLoading) {
    return (
      <div className="container py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'إجمالي الطلبات',
      titleEn: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      trend: '+12%',
      trendUp: true,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'إجمالي الإيرادات',
      titleEn: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      trend: '+8%',
      trendUp: true,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'معاملات معلقة',
      titleEn: 'Pending Transactions',
      value: stats?.pendingTransactions || 0,
      icon: AlertTriangle,
      trend: '-3%',
      trendUp: false,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'مستخدمون نشطون',
      titleEn: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: Users,
      trend: '+5%',
      trendUp: true,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="container py-8 space-y-8">
      {/* Backend Status */}
      <BackendStatus />

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">مرحباً، {user?.name || 'المستخدم'}</h1>
        <p className="text-muted-foreground">
          نظرة شاملة على أداء أعمالك وتحليلات ذكية من نظام HaderOS
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">{kpi.titleEn}</div>
                  <div className="text-sm">{kpi.title}</div>
                </div>
              </CardTitle>
              <div className={`${kpi.bgColor} p-2 rounded-lg`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {kpi.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={kpi.trendUp ? 'text-green-600' : 'text-red-600'}>{kpi.trend}</span>
                <span className="mr-1">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      {insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>رؤى ذكية من الوكلاء</CardTitle>
            <CardDescription>تحليلات وتوصيات تلقائية من نظام الذكاء الاصطناعي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 5).map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start space-x-4 space-x-reverse p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setLocation('/insights')}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      insight.priority === 'critical'
                        ? 'bg-red-100 text-red-600'
                        : insight.priority === 'high'
                          ? 'bg-orange-100 text-orange-600'
                          : insight.priority === 'medium'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{insight.titleAr || insight.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(insight.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {insight.descriptionAr || insight.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-secondary">
                        {insight.agentType === 'financial'
                          ? 'الوكيل المالي'
                          : insight.agentType === 'demand_planner'
                            ? 'مخطط الطلب'
                            : insight.agentType === 'campaign_orchestrator'
                              ? 'منسق الحملات'
                              : 'حارس الأخلاق'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full ${
                          insight.status === 'new'
                            ? 'bg-blue-100 text-blue-700'
                            : insight.status === 'reviewed'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {insight.status === 'new'
                          ? 'جديد'
                          : insight.status === 'reviewed'
                            ? 'تمت المراجعة'
                            : 'تم التنفيذ'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>آخر الطلبات</CardTitle>
            <CardDescription>أحدث 5 طلبات تم استلامها</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setLocation(`/orders/${order.id}`)}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                  </div>
                  <div className="text-left space-y-1">
                    <p className="font-medium">${order.totalAmount}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>آخر المعاملات</CardTitle>
            <CardDescription>أحدث 5 معاملات مالية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setLocation(`/transactions/${transaction.id}`)}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{transaction.transactionNumber}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {transaction.description || 'لا يوجد وصف'}
                    </p>
                  </div>
                  <div className="text-left space-y-1">
                    <p
                      className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        transaction.ethicalCheckStatus === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : transaction.ethicalCheckStatus === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {transaction.ethicalCheckStatus === 'approved'
                        ? 'موافق أخلاقياً'
                        : transaction.ethicalCheckStatus === 'rejected'
                          ? 'مرفوض'
                          : 'قيد المراجعة'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
