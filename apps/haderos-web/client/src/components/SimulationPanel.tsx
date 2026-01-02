import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { Play, Pause, RotateCcw, Activity, Zap, Brain, Heart } from 'lucide-react';

interface SimulationPanelProps {
  className?: string;
}

export function SimulationPanel({ className }: SimulationPanelProps) {
  const [selectedScenario, setSelectedScenario] = useState<
    'resource_distribution' | 'stress_response' | 'learning_propagation' | 'healing'
  >('resource_distribution');
  const [intensity, setIntensity] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const runSimulation = trpc.vitalSigns.runFungalSimulation.useMutation({
    onSuccess: (data) => {
      setLastResult(data);
      setIsRunning(false);
    },
    onError: (error) => {
      console.error('Simulation error:', error);
      setIsRunning(false);
    },
  });

  const scenarios = [
    {
      id: 'resource_distribution',
      name: 'توزيع الموارد',
      nameEn: 'Resource Distribution',
      icon: Activity,
      color: 'from-green-500 to-emerald-600',
      description: 'محاكاة توزيع الموارد من العقد الغنية إلى الفقيرة',
    },
    {
      id: 'stress_response',
      name: 'الاستجابة للضغط',
      nameEn: 'Stress Response',
      icon: Zap,
      color: 'from-orange-500 to-red-600',
      description: 'محاكاة استجابة الشبكة للضغوط الخارجية',
    },
    {
      id: 'learning_propagation',
      name: 'انتشار المعرفة',
      nameEn: 'Learning Propagation',
      icon: Brain,
      color: 'from-blue-500 to-purple-600',
      description: 'محاكاة انتشار التعلم والمعرفة عبر الشبكة',
    },
    {
      id: 'healing',
      name: 'الإصلاح الذاتي',
      nameEn: 'Self-Healing',
      icon: Heart,
      color: 'from-pink-500 to-rose-600',
      description: 'محاكاة قدرة الشبكة على التعافي والإصلاح الذاتي',
    },
  ];

  const handleRunSimulation = () => {
    setIsRunning(true);
    runSimulation.mutate({
      scenario: selectedScenario,
      duration: 10,
      intensity,
    });
  };

  const selectedScenarioData = scenarios.find((s) => s.id === selectedScenario);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          محاكاة الشبكة الفطرية
        </CardTitle>
        <CardDescription>اختبر سلوك الشبكة في سيناريوهات مختلفة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* اختيار السيناريو */}
        <div className="space-y-3">
          <label className="text-sm font-medium">السيناريو</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenarios.map((scenario) => {
              const Icon = scenario.icon;
              const isSelected = scenario.id === selectedScenario;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id as any)}
                  disabled={isRunning}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all text-right
                    ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                      p-2 rounded-lg bg-gradient-to-br ${scenario.color}
                      text-white
                    `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{scenario.name}</div>
                      <div className="text-xs text-muted-foreground">{scenario.nameEn}</div>
                      <div className="text-xs mt-2 text-muted-foreground">
                        {scenario.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* التحكم في الشدة */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">شدة المحاكاة</label>
            <Badge variant="secondary">{intensity}/10</Badge>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            disabled={isRunning}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>خفيف</span>
            <span>متوسط</span>
            <span>مكثف</span>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-3">
          <Button onClick={handleRunSimulation} disabled={isRunning} className="flex-1" size="lg">
            {isRunning ? (
              <>
                <Pause className="ml-2 h-4 w-4 animate-pulse" />
                جاري التشغيل...
              </>
            ) : (
              <>
                <Play className="ml-2 h-4 w-4" />
                تشغيل المحاكاة
              </>
            )}
          </Button>
          {lastResult && (
            <Button onClick={() => setLastResult(null)} variant="outline" size="lg">
              <RotateCcw className="ml-2 h-4 w-4" />
              إعادة
            </Button>
          )}
        </div>

        {/* عرض النتائج */}
        {lastResult && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">نتائج المحاكاة</h3>
              <Badge className={`bg-gradient-to-r ${selectedScenarioData?.color}`}>
                {selectedScenarioData?.name}
              </Badge>
            </div>

            {/* المقاييس الرئيسية */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">كفاءة الموارد</div>
                <div className="text-2xl font-bold">
                  {lastResult.metrics.resourceEfficiency.toFixed(1)}%
                </div>
                <Progress value={lastResult.metrics.resourceEfficiency} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">مرونة الشبكة</div>
                <div className="text-2xl font-bold">
                  {lastResult.metrics.networkResilience.toFixed(1)}%
                </div>
                <Progress value={lastResult.metrics.networkResilience} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">سرعة التوزيع</div>
                <div className="text-2xl font-bold">
                  {lastResult.metrics.distributionSpeed.toFixed(1)}%
                </div>
                <Progress value={lastResult.metrics.distributionSpeed} className="h-1" />
              </div>
            </div>

            {/* مقارنة الحالة */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-muted-foreground">الحالة الأولية</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>عدد العقد:</span>
                    <span className="font-mono">{lastResult.startState.totalNodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>إجمالي الموارد:</span>
                    <span className="font-mono">
                      {lastResult.startState.totalResources.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>متوسط الصحة:</span>
                    <span className="font-mono">{lastResult.startState.avgHealth.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="text-sm font-medium text-primary">الحالة النهائية</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>عدد العقد:</span>
                    <span className="font-mono font-semibold">
                      {lastResult.endState.totalNodes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>إجمالي الموارد:</span>
                    <span className="font-mono font-semibold">
                      {lastResult.endState.totalResources.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>متوسط الصحة:</span>
                    <span className="font-mono font-semibold">
                      {lastResult.endState.avgHealth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* أهم الأحداث */}
            <div className="space-y-2">
              <div className="text-sm font-medium">أهم الأحداث</div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {lastResult.events.slice(0, 10).map((event: any, idx: number) => (
                  <Alert key={idx} className="py-2">
                    <AlertDescription className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex-1">{event.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {event.timestamp.toFixed(1)}s
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
              {lastResult.events.length > 10 && (
                <div className="text-xs text-muted-foreground text-center">
                  ... و {lastResult.events.length - 10} حدث آخر
                </div>
              )}
            </div>
          </div>
        )}

        {/* رسالة تفسيرية */}
        {!lastResult && (
          <Alert>
            <AlertDescription className="text-sm">
              💡 <strong>كيف يعمل:</strong> هذه المحاكاة تحاكي سلوك الشبكة الفطرية (Mycelium) في
              توزيع الموارد، الاستجابة للضغط، نشر المعرفة، والإصلاح الذاتي. اختر سيناريو واضبط الشدة
              ثم اضغط "تشغيل المحاكاة".
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
