import { Link } from "wouter";
import { Rocket, Shield, TrendingUp, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvestorPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Rocket className="w-4 h-4" />
            <span>مرحباً بك في HaderOS</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            منصة الذكاء الاصطناعي الأخلاقية
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            جرّب النظام بنفسك قبل اتخاذ قرار الاستثمار. استكشف كيف يعمل HaderOS في تحويل العمليات التجارية بشكل أخلاقي وذكي.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/investor/login">
              <Button size="lg" className="gap-2">
                <Shield className="w-5 h-5" />
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/investor/kaia-demo">
              <Button size="lg" variant="outline" className="gap-2">
                <Shield className="w-5 h-5" />
                جرّب KAIA (Demo)
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold text-purple-600">100+</CardTitle>
              <CardDescription>موظف يستخدم النظام</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold text-blue-600">1,019</CardTitle>
              <CardDescription>منتج في النظام</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold text-green-600">500+</CardTitle>
              <CardDescription>طلب يومياً</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold text-orange-600">4</CardTitle>
              <CardDescription>شركات شحن متكاملة</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>محرك KAIA للامتثال الشرعي</CardTitle>
              <CardDescription>
                تحقق تلقائي من المعاملات المالية للتأكد من توافقها مع الشريعة الإسلامية. كشف الربا والغرر والميسر.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/investor/kaia-demo">
                <Button variant="ghost" className="w-full gap-2">
                  جرّب الآن
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>تحليلات ذكية بالذكاء الاصطناعي</CardTitle>
              <CardDescription>
                توقعات المبيعات، تحليل الطلب، تحسين الحملات التسويقية، وكشف الأنماط المالية تلقائياً.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full gap-2">
                  عرض Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>إدارة شاملة للعمليات</CardTitle>
              <CardDescription>
                نظام متكامل للشحن، المخزون، الموظفين، والمالية. كل شيء في مكان واحد.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/nowshoes">
                <Button variant="ghost" className="w-full gap-2">
                  استكشف NOW SHOES
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* What You'll Experience */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">ماذا ستجرّب في الساعة القادمة؟</CardTitle>
            <CardDescription>رحلة تفاعلية لاستكشاف قوة HaderOS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">KAIA Compliance Checker</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      أدخل معاملة مالية وشاهد كيف يحللها KAIA للتأكد من توافقها الشرعي
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Visual Search</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      صوّر أي منتج واحصل على معلوماته فوراً باستخدام الذكاء الاصطناعي
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Live Dashboard</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      شاهد KPIs حقيقية من NOW SHOES (100 موظف، 500+ طلب يومياً)
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Shipment Tracking</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      تتبع الشحنات عبر 4 شركات (Bosta, J&T, GT Express, Eshhnly)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Financial Dashboard</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      عرض P&L، المصروفات، الاشتراكات، والمعاملات المالية
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">AI Agents</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      وكلاء ذكيين للتنبؤ المالي، تخطيط الطلب، وتحسين الحملات
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">جاهز لبدء التجربة؟</h2>
          <p className="text-lg mb-8 opacity-90">
            استكشف النظام بنفسك، ثم دعنا نتحدث عن فرصة الاستثمار
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/investor/kaia-demo">
              <Button size="lg" variant="secondary" className="gap-2">
                <Shield className="w-5 h-5" />
                ابدأ بـ KAIA Demo
              </Button>
            </Link>
            <Link href="/investor/pitch">
              <Button size="lg" variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
                <TrendingUp className="w-5 h-5" />
                اقرأ عرض الاستثمار
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
