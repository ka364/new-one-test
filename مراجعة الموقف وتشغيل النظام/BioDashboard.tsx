import { useQuery } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2, Activity, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

export default function BioDashboard() {
  // Fetch dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["bio-dashboard"],
    queryFn: () => trpc.bio.getDashboard.query(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch real-time metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["bio-metrics"],
    queryFn: () => trpc.bio.getRealTimeMetrics.query(),
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  if (dashboardLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const systemHealth = dashboard?.systemHealth.overall || 0;
  const healthColor = systemHealth >= 80 ? "text-green-600" : systemHealth >= 50 ? "text-yellow-600" : "text-red-600";
  const healthBg = systemHealth >= 80 ? "bg-green-100" : systemHealth >= 50 ? "bg-yellow-100" : "bg-red-100";

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم Bio-Modules</h1>
          <p className="text-muted-foreground">مراقبة حية لنظام الذكاء الاصطناعي</p>
        </div>
        <Badge variant="outline" className="text-sm">
          آخر تحديث: {new Date(dashboard?.timestamp || Date.now()).toLocaleTimeString("ar-EG")}
        </Badge>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صحة النظام</CardTitle>
            <Activity className={`h-4 w-4 ${healthColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth}%</div>
            <p className="text-xs text-muted-foreground">
              {systemHealth >= 80 ? "ممتاز" : systemHealth >= 50 ? "جيد" : "يحتاج تحسين"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الوحدات النشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.systemHealth.activeModules || 0}/7
            </div>
            <p className="text-xs text-muted-foreground">وحدات متصلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التفاعلات</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalInteractions || 0}
            </div>
            <p className="text-xs text-muted-foreground">إجمالي الرسائل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التعارضات</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalConflicts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.resolvedConflicts || 0} تم حلها
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bio-Modules Status */}
      <Card>
        <CardHeader>
          <CardTitle>حالة الوحدات البيولوجية (Bio-Modules)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboard?.moduleHealth.map((module: any) => {
              const statusColor =
                module.status === "healthy"
                  ? "bg-green-100 text-green-800"
                  : module.status === "degraded"
                  ? "bg-yellow-100 text-yellow-800"
                  : module.status === "critical"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800";

              const moduleEmoji: Record<string, string> = {
                arachnid: "🕷️",
                chameleon: "🦎",
                ant: "🐜",
                tardigrade: "🐻",
                corvid: "🐦",
                mycelium: "🍄",
                cephalopod: "🐙",
              };

              return (
                <div
                  key={module.module}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{moduleEmoji[module.module] || "🧬"}</span>
                    <Badge className={statusColor}>
                      {module.status === "healthy"
                        ? "صحي"
                        : module.status === "degraded"
                        ? "متدهور"
                        : module.status === "critical"
                        ? "حرج"
                        : "غير متصل"}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium capitalize">{module.module}</p>
                    <p className="text-sm text-muted-foreground">
                      الصحة: {module.health}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Interactions */}
      <Card>
        <CardHeader>
          <CardTitle>التفاعلات الحية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboard?.liveInteractions.slice(0, 5).map((interaction: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {interaction.from === "arachnid" && "🕷️"}
                    {interaction.from === "chameleon" && "🦎"}
                    {interaction.from === "ant" && "🐜"}
                    {interaction.from === "tardigrade" && "🐻"}
                    {interaction.from === "corvid" && "🐦"}
                    {interaction.from === "mycelium" && "🍄"}
                    {interaction.from === "cephalopod" && "🐙"}
                  </span>
                  <div>
                    <p className="font-medium">
                      {interaction.from} → {interaction.to}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {interaction.totalMessages} رسالة
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {interaction.lastDay} اليوم
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {interaction.lastHour} الساعة الأخيرة
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Conflicts */}
      <Card>
        <CardHeader>
          <CardTitle>التعارضات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard?.recentConflicts && dashboard.recentConflicts.length > 0 ? (
            <div className="space-y-2">
              {dashboard.recentConflicts.slice(0, 5).map((conflict: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {conflict.moduleA} ⚔️ {conflict.moduleB}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {conflict.type}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {new Date(conflict.timestamp).toLocaleTimeString("ar-EG")}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              لا توجد تعارضات حالياً ✅
            </p>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">متوسط وقت الاستجابة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avgResponseTime || 0}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معدل التعارضات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.conflictRate?.toFixed(2) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معدل التصعيد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.escalatedConflicts || 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
