import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Lightbulb,
  Activity,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

export default function ManagerDashboard() {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // Fetch all users (we'll use a mock for now since we don't have this endpoint yet)
  // TODO: Add users router with getAll endpoint
  const users: any[] = []; // const { data: users = [] } = trpc.users.getAll.useQuery();

  // Fetch adaptive system stats
  const { data: allPatterns = [] } = trpc.adaptive.getAllPatterns.useQuery({ limit: 100 });
  const { data: allSuggestions = [] } = trpc.adaptive.getAllSuggestions.useQuery({ limit: 100 });
  const { data: allIcons = [] } = trpc.adaptive.getAllIcons.useQuery({ limit: 100 });

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.isActive).length;
  const totalPatterns = allPatterns.length;
  const pendingSuggestions = allSuggestions.filter((s: any) => s.status === 'pending').length;
  const acceptedSuggestions = allSuggestions.filter((s: any) => s.status === 'accepted').length;
  const acceptanceRate =
    allSuggestions.length > 0
      ? ((acceptedSuggestions / allSuggestions.length) * 100).toFixed(1)
      : '0';

  // Group patterns by task type
  const patternsByType = allPatterns.reduce((acc: any, pattern: any) => {
    const type = pattern.taskType || 'other';
    if (!acc[type]) {
      acc[type] = { count: 0, totalFrequency: 0 };
    }
    acc[type].count++;
    acc[type].totalFrequency += pattern.frequency || 0;
    return acc;
  }, {});

  const topPatterns = Object.entries(patternsByType)
    .map(([type, data]: [string, any]) => ({
      type,
      count: data.count,
      frequency: data.totalFrequency,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  // Group icons by user
  const iconsByUser = allIcons.reduce((acc: any, icon: any) => {
    const userId = icon.userId;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(icon);
    return acc;
  }, {});

  // Most used icons
  const mostUsedIcons = [...allIcons]
    .sort((a: any, b: any) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, 10);

  return (
    <div className="container py-8 space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">لوحة تحكم المدير</h1>
        <p className="text-muted-foreground mt-2">
          عرض شامل لأنماط استخدام الموظفين والنظام التكيفي
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">{activeUsers} نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأنماط المكتشفة</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatterns}</div>
            <p className="text-xs text-muted-foreground">من جميع الموظفين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاقتراحات المعلقة</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSuggestions}</div>
            <p className="text-xs text-muted-foreground">تحتاج مراجعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل القبول</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {acceptedSuggestions} من {allSuggestions.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">الموظفون</TabsTrigger>
          <TabsTrigger value="patterns">الأنماط</TabsTrigger>
          <TabsTrigger value="suggestions">الاقتراحات</TabsTrigger>
          <TabsTrigger value="icons">الأيقونات</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليل الموظفين</CardTitle>
              <CardDescription>أنماط الاستخدام والإنتاجية لكل موظف</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user: any) => {
                  const userPatterns = allPatterns.filter((p: any) => p.userId === user.id);
                  const userSuggestions = allSuggestions.filter((s: any) => s.userId === user.id);
                  const userIcons = iconsByUser[user.id] || [];
                  const totalUsage = userIcons.reduce(
                    (sum: number, icon: any) => sum + (icon.usageCount || 0),
                    0
                  );

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>

                        {selectedUser === user.id && (
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">الأنماط</p>
                              <p className="text-lg font-bold">{userPatterns.length}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">الاقتراحات</p>
                              <p className="text-lg font-bold">{userSuggestions.length}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">الأيقونات</p>
                              <p className="text-lg font-bold">{userIcons.length}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">الاستخدام الكلي</p>
                              <p className="text-lg font-bold">{totalUsage}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{userPatterns.length} نمط</Badge>
                        <Badge variant="outline">{userIcons.length} أيقونة</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الأنماط الأكثر تكراراً</CardTitle>
              <CardDescription>المهام المتكررة في الشركة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPatterns.map((pattern, index) => (
                  <div
                    key={pattern.type}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{pattern.type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pattern.count} موظف يستخدم هذا النمط
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold">{pattern.frequency}</p>
                      <p className="text-xs text-muted-foreground">مرات التكرار</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الاقتراحات المعلقة</CardTitle>
              <CardDescription>اقتراحات النظام التكيفي للموظفين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allSuggestions
                  .filter((s: any) => s.status === 'pending')
                  .slice(0, 10)
                  .map((suggestion: any) => {
                    const user = users.find((u: any) => u.id === suggestion.userId);
                    const data =
                      typeof suggestion.suggestionData === 'string'
                        ? JSON.parse(suggestion.suggestionData)
                        : suggestion.suggestionData;

                    return (
                      <div
                        key={suggestion.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{user?.name || 'Unknown'}</h3>
                            <Badge>{data?.taskType || 'Unknown'}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(suggestion.createdAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{data?.confidence || 0}% ثقة</Badge>
                        </div>
                      </div>
                    );
                  })}

                {pendingSuggestions === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد اقتراحات معلقة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Icons Tab */}
        <TabsContent value="icons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الأيقونات الأكثر استخداماً</CardTitle>
              <CardDescription>الأيقونات الديناميكية عبر جميع الموظفين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mostUsedIcons.map((icon: any, index) => {
                  const user = users.find((u: any) => u.id === icon.userId);

                  return (
                    <div
                      key={icon.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div className="text-2xl">{icon.iconEmoji}</div>
                        <div>
                          <h3 className="font-semibold">{icon.iconNameAr || icon.iconName}</h3>
                          <p className="text-sm text-muted-foreground">{user?.name}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold">{icon.usageCount || 0}</p>
                        <p className="text-xs text-muted-foreground">مرات الاستخدام</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Insights */}
      <Card>
        <CardHeader>
          <CardTitle>رؤى النظام</CardTitle>
          <CardDescription>توصيات لتحسين العمليات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {acceptanceRate < '50' && (
              <div className="flex items-start gap-3 p-4 border border-yellow-500/50 rounded-lg bg-yellow-500/10">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">معدل قبول منخفض</h4>
                  <p className="text-sm text-muted-foreground">
                    معدل قبول الاقتراحات أقل من 50%. قد تحتاج إلى مراجعة خوارزمية التعلم.
                  </p>
                </div>
              </div>
            )}

            {pendingSuggestions > 10 && (
              <div className="flex items-start gap-3 p-4 border border-blue-500/50 rounded-lg bg-blue-500/10">
                <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">اقتراحات معلقة كثيرة</h4>
                  <p className="text-sm text-muted-foreground">
                    هناك {pendingSuggestions} اقتراح معلق. راجعها لتحسين تجربة الموظفين.
                  </p>
                </div>
              </div>
            )}

            {topPatterns.length > 0 && (
              <div className="flex items-start gap-3 p-4 border border-green-500/50 rounded-lg bg-green-500/10">
                <BarChart3 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">نمط شائع: {topPatterns[0].type}</h4>
                  <p className="text-sm text-muted-foreground">
                    هذا النمط يتكرر {topPatterns[0].frequency} مرة. يمكن أتمتته لتوفير الوقت.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
