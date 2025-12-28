import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { VitalSignChart } from "@/components/VitalSignChart";
import { SimulationPanel } from "@/components/SimulationPanel";
import {
  Activity,
  Zap,
  Brain,
  Target,
  Network,
  Bug,
  Bird,
  Waves,
  Eye,
  Shield,
  Droplets,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

// المؤشرات الحيوية الأربعة
interface VitalSign {
  id: string;
  name: string;
  nameAr: string;
  current: number;
  target: number;
  threshold: number;
  unit: string;
  icon: any;
  color: string;
  protocol?: string;
}

// البروتوكولات الحيوية السبعة
interface BioProtocol {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  icon: any;
  color: string;
  description: string;
  metrics: {
    efficiency: number;
    reliability: number;
    adaptability: number;
  };
}

export default function VitalSignsInfographic() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // جلب البيانات من API
  const { data: vitalSignsData, isLoading: signsLoading, refetch: refetchSigns } = trpc.vitalSigns.getCurrentVitalSigns.useQuery();
  const { data: protocolsData, isLoading: protocolsLoading, refetch: refetchProtocols } = trpc.vitalSigns.getBioProtocols.useQuery();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // تحديث البيانات كل 5 ثوانٍ
      refetchSigns();
      refetchProtocols();
    }, 5000);
    return () => clearInterval(timer);
  }, [refetchSigns, refetchProtocols]);

  // ربط الأيقونات والألوان بالبيانات القادمة من API
  const iconMap: Record<string, any> = {
    decision_consistency: Brain,
    response_time: Zap,
    learning_rate: TrendingUp,
    detection_accuracy: Eye
  };

  const colorMap: Record<string, string> = {
    decision_consistency: "from-blue-500 to-cyan-500",
    response_time: "from-yellow-500 to-orange-500",
    learning_rate: "from-green-500 to-emerald-500",
    detection_accuracy: "from-purple-500 to-pink-500"
  };

  // المؤشرات الحيوية من API مع إضافة الأيقونات
  const vitalSigns: VitalSign[] = (vitalSignsData || []).map((sign: any) => ({
    ...sign,
    icon: iconMap[sign.id] || Activity,
    color: colorMap[sign.id] || "from-gray-500 to-gray-600"
  }));

  // ربط الأيقونات بالبروتوكولات
  const protocolIconMap: Record<string, any> = {
    mycelium: Network,
    ant_colony: Bug,
    corvid: Bird,
    chameleon: Waves,
    cephalopod: Target,
    arachnid: Activity,
    tardigrade: Shield
  };

  const protocolColorMap: Record<string, string> = {
    mycelium: "from-green-600 to-lime-500",
    ant_colony: "from-amber-600 to-yellow-500",
    corvid: "from-indigo-600 to-blue-500",
    chameleon: "from-teal-600 to-cyan-500",
    cephalopod: "from-violet-600 to-purple-500",
    arachnid: "from-rose-600 to-pink-500",
    tardigrade: "from-slate-600 to-gray-500"
  };

  // البروتوكولات الحيوية من API مع إضافة الأيقونات
  const bioProtocols: BioProtocol[] = (protocolsData || []).map((protocol: any) => ({
    ...protocol,
    icon: protocolIconMap[protocol.id] || Network,
    color: protocolColorMap[protocol.id] || "from-gray-600 to-gray-500"
  }));

  const getStatusColor = (current: number, target: number, threshold: number, unit: string) => {
    if (unit === "ms") {
      // For response time, lower is better
      if (current <= target) return "text-green-600";
      if (current <= threshold) return "text-yellow-600";
      return "text-red-600";
    } else {
      // For percentages, higher is better (except if threshold is 0)
      if (current >= target) return "text-green-600";
      if (current >= threshold) return "text-yellow-600";
      return "text-red-600";
    }
  };

  const getStatusIcon = (current: number, target: number, threshold: number, unit: string) => {
    const color = getStatusColor(current, target, threshold, unit);
    if (color === "text-green-600") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (color === "text-yellow-600") return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getProgressValue = (current: number, target: number, unit: string) => {
    if (unit === "ms") {
      // For response time, inverse the progress (lower is better)
      return Math.min(100, (target / current) * 100);
    } else {
      return Math.min(100, (current / target) * 100);
    }
  };

  // Loading State
  if (signsLoading || protocolsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen" dir="rtl">
        <div className="text-center space-y-4 py-8">
          <Skeleton className="h-12 w-96 mx-auto" />
          <Skeleton className="h-6 w-64 mx-auto" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-3">
          <Droplets className="h-12 w-12 text-blue-600 animate-pulse" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            HaderOS - نظام الحوكمة العضوية
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          من الإدارة الميكانيكية إلى الحوكمة الحيوية 🌱
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 animate-pulse text-green-600" />
          <span>تحديث مباشر • {currentTime.toLocaleTimeString('ar-EG')}</span>
        </div>
      </div>

      {/* المؤشرات الحيوية الأربعة */}
      <Card className="border-2 border-blue-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Activity className="h-6 w-6 text-blue-600" />
            المؤشرات الحيوية الفورية (Real-time Vital Signs)
          </CardTitle>
          <CardDescription>مؤشرات الصحة التشغيلية للنظام</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {vitalSigns.map((vital) => {
              const Icon = vital.icon;
              return (
                <Card key={vital.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2">
                  <div className={`h-2 bg-gradient-to-r ${vital.color}`} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${vital.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{vital.nameAr}</CardTitle>
                          <CardDescription className="text-xs">{vital.name}</CardDescription>
                        </div>
                      </div>
                      {getStatusIcon(vital.current, vital.target, vital.threshold, vital.unit)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className={`text-4xl font-bold ${getStatusColor(vital.current, vital.target, vital.threshold, vital.unit)}`}>
                          {vital.current}
                        </div>
                        <div className="text-sm text-muted-foreground">{vital.unit}</div>
                      </div>
                      <div className="text-left space-y-1">
                        <div className="text-xs text-muted-foreground">المستهدف</div>
                        <div className="text-lg font-semibold">{vital.unit === "ms" ? `<${vital.target}` : `>${vital.target}`}{vital.unit}</div>
                        <div className="text-xs text-red-600">إنذار: {vital.unit === "ms" ? `>${vital.threshold}` : `<${vital.threshold}`}{vital.unit}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>الأداء</span>
                        <span className="font-semibold">{getProgressValue(vital.current, vital.target, vital.unit).toFixed(0)}%</span>
                      </div>
                      <Progress
                        value={getProgressValue(vital.current, vital.target, vital.unit)}
                        className="h-2"
                      />
                    </div>
                    {vital.protocol && (
                      <Badge variant="outline" className="text-xs">
                        البروتوكول: {bioProtocols.find(p => p.id === vital.protocol)?.nameAr}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* البروتوكولات الحيوية السبعة */}
      <Card className="border-2 border-purple-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Network className="h-6 w-6 text-purple-600" />
            البروتوكولات الحيوية السبعة (7 Bio-Protocols)
          </CardTitle>
          <CardDescription>أنظمة مستوحاة من الكائنات الحية</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bioProtocols.map((protocol) => {
              const Icon = protocol.icon;
              const avgPerformance = (protocol.metrics.efficiency + protocol.metrics.reliability + protocol.metrics.adaptability) / 3;
              return (
                <Card key={protocol.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className={`h-2 bg-gradient-to-r ${protocol.color}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{protocol.emoji}</span>
                      <div className="flex-1">
                        <CardTitle className="text-sm">{protocol.nameAr}</CardTitle>
                        <CardDescription className="text-xs">{protocol.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">{protocol.description}</p>

                    {/* Overall Performance */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">الأداء الكلي</span>
                        <span className="font-bold text-green-600">{avgPerformance.toFixed(0)}%</span>
                      </div>
                      <Progress value={avgPerformance} className="h-1.5" />
                    </div>

                    {/* Detailed Metrics */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">الكفاءة</span>
                        <span className="font-semibold">{protocol.metrics.efficiency}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">الموثوقية</span>
                        <span className="font-semibold">{protocol.metrics.reliability}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">التكيف</span>
                        <span className="font-semibold">{protocol.metrics.adaptability}%</span>
                      </div>
                    </div>

                    <div className={`mt-2 p-2 rounded-lg bg-gradient-to-r ${protocol.color} bg-opacity-10`}>
                      <div className="flex items-center justify-center gap-1">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-semibold">نشط</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Health Overview */}
      <Card className="border-2 border-green-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            حالة النظام الكلية
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                  <div className="text-3xl font-bold text-green-600">
                    {vitalSigns.filter(v => {
                      const status = getStatusColor(v.current, v.target, v.threshold, v.unit);
                      return status === "text-green-600";
                    }).length}/{vitalSigns.length}
                  </div>
                  <div className="text-sm text-muted-foreground">مؤشرات سليمة</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Network className="h-12 w-12 text-purple-600 mx-auto" />
                  <div className="text-3xl font-bold text-purple-600">
                    {bioProtocols.length}
                  </div>
                  <div className="text-sm text-muted-foreground">بروتوكولات نشطة</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Activity className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
                  <div className="text-3xl font-bold text-blue-600">
                    {(bioProtocols.reduce((sum, p) => sum + (p.metrics.efficiency + p.metrics.reliability + p.metrics.adaptability) / 3, 0) / bioProtocols.length).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">متوسط الأداء</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* التاريخ الزمني للمؤشرات */}
      <Card className="border-2 border-indigo-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
            التاريخ الزمني للمؤشرات الحيوية
          </CardTitle>
          <CardDescription>تطور الأداء خلال الأسبوع الماضي</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {vitalSigns.map((sign) => (
              <VitalSignChart
                key={sign.id}
                signId={sign.id}
                signName={sign.name}
                signNameAr={sign.nameAr}
                color={sign.color}
                days={7}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fungal Network Simulation */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>🧪</span>
          محاكاة الشبكة الفطرية
        </h2>
        <SimulationPanel />
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>🌱 "من كائن ميكانيكي إلى نظام حي" - HaderOS 2025</p>
      </div>
    </div>
  );
}
