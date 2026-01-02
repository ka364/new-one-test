import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Shield, TrendingUp, Clock, Eye, LogOut, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

type InvestorSession = {
  id: number;
  name: string;
  email: string;
  company: string | null;
};

export default function InvestorDashboard() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<InvestorSession | null>(null);

  useEffect(() => {
    // Check if investor is logged in
    const stored = localStorage.getItem('investor_session');
    if (!stored) {
      setLocation('/investor/login');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setSession(parsed);
    } catch {
      setLocation('/investor/login');
    }
  }, [setLocation]);

  const activityQuery = trpc.investors.getInvestorActivity.useQuery(
    { investorId: session?.id || 0 },
    { enabled: !!session }
  );

  const handleLogout = () => {
    localStorage.removeItem('investor_session');
    toast.success('تم تسجيل الخروج بنجاح');
    setLocation('/investor/login');
  };

  if (!session) {
    return null; // Will redirect
  }

  const totalTime = activityQuery.data?.reduce((sum, a) => sum + (a.timeSpent || 0), 0) || 0;
  const pageViews = activityQuery.data?.filter((a) => a.actionType === 'page_view').length || 0;
  const kaiaTests = activityQuery.data?.filter((a) => a.actionType === 'kaia_test').length || 0;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8"
      dir="rtl"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">مرحباً، {session.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">{session.company || session.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>

        {/* Activity Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <Clock className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle className="text-2xl font-bold">
                {Math.round(totalTime / 60)} دقيقة
              </CardTitle>
              <CardDescription>إجمالي الوقت المستغرق</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Eye className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-2xl font-bold">{pageViews}</CardTitle>
              <CardDescription>الصفحات التي تمت زيارتها</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Shield className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle className="text-2xl font-bold">{kaiaTests}</CardTitle>
              <CardDescription>اختبارات KAIA المنفذة</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>استكشف HaderOS</CardTitle>
            <CardDescription>تابع رحلتك في اكتشاف المنصة</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Link href="/investor/kaia-demo">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Shield className="w-8 h-8 text-purple-600" />
                <span className="font-semibold">KAIA Demo</span>
                <span className="text-xs text-gray-500">جرّب محرك الامتثال الشرعي</span>
              </Button>
            </Link>

            <Link href="/investor/pitch">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <span className="font-semibold">عرض الاستثمار</span>
                <span className="text-xs text-gray-500">اقرأ التفاصيل الكاملة</span>
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Eye className="w-8 h-8 text-green-600" />
                <span className="font-semibold">Live Dashboard</span>
                <span className="text-xs text-gray-500">شاهد النظام الحقيقي</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>نشاطك الأخير</CardTitle>
            <CardDescription>تتبع تفاعلك مع المنصة</CardDescription>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
            ) : activityQuery.data && activityQuery.data.length > 0 ? (
              <div className="space-y-3">
                {activityQuery.data.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {activity.actionType === 'page_view' && (
                        <Eye className="w-4 h-4 text-blue-600" />
                      )}
                      {activity.actionType === 'kaia_test' && (
                        <Shield className="w-4 h-4 text-green-600" />
                      )}
                      {activity.actionType === 'pitch_view' && (
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      )}
                      {activity.actionType === 'login' && (
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {activity.pageTitle || activity.pagePath || activity.actionType}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    {activity.timeSpent && activity.timeSpent > 0 && (
                      <span className="text-xs text-gray-500">
                        {Math.round(activity.timeSpent / 60)} دقيقة
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا يوجد نشاط بعد. ابدأ باستكشاف المنصة!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl font-bold mb-4">جاهز للمناقشة؟</h3>
            <p className="mb-6 opacity-90">دعنا نتحدث عن فرصة الاستثمار بالتفصيل</p>
            <div className="flex gap-4 justify-center">
              <a href="mailto:ahmed@haderosai.com">
                <Button size="lg" variant="secondary">
                  تواصل معنا الآن
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
