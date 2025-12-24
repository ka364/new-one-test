import { TrendingUp, Users, DollarSign, Target, Rocket, Mail, Phone, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvestmentPitch() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Rocket className="w-4 h-4" />
            <span>فرصة استثمارية</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            استثمر في مستقبل الأعمال الأخلاقية
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            HaderOS ليس مجرد برنامج - إنه منصة تحويلية تجمع بين الذكاء الاصطناعي والامتثال الشرعي لخدمة ملايين الشركات في العالم الإسلامي
          </p>
        </div>

        {/* Current Traction */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">الإنجازات الحالية</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <Users className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle className="text-3xl font-bold">100+</CardTitle>
                <CardDescription>موظف يستخدم النظام يومياً</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle className="text-3xl font-bold">500+</CardTitle>
                <CardDescription>طلب معالج يومياً</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-3xl font-bold">1,019</CardTitle>
                <CardDescription>منتج في النظام</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <Target className="w-8 h-8 text-orange-600 mb-2" />
                <CardTitle className="text-3xl font-bold">4</CardTitle>
                <CardDescription>شركات شحن متكاملة</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Market Opportunity */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">حجم السوق والفرصة</CardTitle>
            <CardDescription>سوق ضخم غير مستغل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <h3 className="text-4xl font-bold text-purple-600 mb-2">$2.4T</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">حجم سوق التمويل الإسلامي العالمي</p>
              </div>
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h3 className="text-4xl font-bold text-blue-600 mb-2">1.8B</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">مسلم حول العالم (23% من السكان)</p>
              </div>
              <div className="text-center p-6 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <h3 className="text-4xl font-bold text-green-600 mb-2">15%</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">نمو سنوي متوقع للقطاع</p>
              </div>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-300">
              <strong>الفرصة:</strong> لا يوجد حل تقني شامل يجمع بين الذكاء الاصطناعي والامتثال الشرعي في منصة واحدة
            </p>
          </CardContent>
        </Card>

        {/* Competitive Advantage */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">الميزة التنافسية</CardTitle>
            <CardDescription>لماذا HaderOS مختلف؟</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">محرك KAIA الفريد</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      أول محرك ذكاء اصطناعي متخصص في الامتثال الشرعي - تحليل تلقائي للمعاملات المالية
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">نظام متكامل</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ليس مجرد أداة واحدة - منصة شاملة تغطي الشحن، المخزون، المالية، والموظفين
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Proven Product-Market Fit</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      يعمل فعلياً مع NOW SHOES (100 موظف، 500+ طلب يومياً) - ليس مجرد فكرة
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">تقنية متقدمة</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Visual Search بالذكاء الاصطناعي، وكلاء ذكيين للتنبؤ، تكامل Blockchain
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">قابلية التوسع</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      بنية تحتية قوية - جاهز للتوسع من 1 شركة إلى 1,000 شركة بدون إعادة بناء
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">فريق تقني قوي</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      خبرة في AI/ML، Blockchain، Enterprise Software - تنفيذ سريع وجودة عالية
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Projections */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">التوقعات المالية</CardTitle>
            <CardDescription>خطة النمو للـ 24 شهراً القادمة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4">المقياس</th>
                    <th className="text-center py-3 px-4">الشهر 6</th>
                    <th className="text-center py-3 px-4">الشهر 12</th>
                    <th className="text-center py-3 px-4">الشهر 24</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">عدد الشركات</td>
                    <td className="text-center py-3 px-4">10</td>
                    <td className="text-center py-3 px-4">50</td>
                    <td className="text-center py-3 px-4">200</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">الإيرادات الشهرية</td>
                    <td className="text-center py-3 px-4">$50K</td>
                    <td className="text-center py-3 px-4">$250K</td>
                    <td className="text-center py-3 px-4">$1M</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">الإيرادات السنوية</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4">$3M</td>
                    <td className="text-center py-3 px-4">$12M</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">هامش الربح</td>
                    <td className="text-center py-3 px-4">-20%</td>
                    <td className="text-center py-3 px-4">30%</td>
                    <td className="text-center py-3 px-4">50%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
              <strong>نموذج الإيرادات:</strong> اشتراك شهري ($5K-$10K لكل شركة حسب الحجم) + رسوم على المعاملات (0.5%)
            </p>
          </CardContent>
        </Card>

        {/* Investment Ask */}
        <Card className="mb-16 border-2 border-purple-500">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
            <CardTitle className="text-2xl">فرصة الاستثمار</CardTitle>
            <CardDescription>انضم إلينا في بناء مستقبل الأعمال الأخلاقية</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">المبلغ المطلوب</h3>
                <p className="text-3xl font-bold text-purple-600">$2M</p>
              </div>
              <div className="text-center">
                <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">التقييم</h3>
                <p className="text-3xl font-bold text-blue-600">$10M</p>
              </div>
              <div className="text-center">
                <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">حصة المستثمر</h3>
                <p className="text-3xl font-bold text-green-600">20%</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
              <h4 className="font-semibold mb-4">استخدام الأموال:</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">تطوير المنتج (AI/ML, Blockchain)</span>
                  <span className="font-semibold">40% ($800K)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">المبيعات والتسويق</span>
                  <span className="font-semibold">30% ($600K)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">توسيع الفريق (15 موظف)</span>
                  <span className="font-semibold">20% ($400K)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">العمليات والبنية التحتية</span>
                  <span className="font-semibold">10% ($200K)</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-6">
              <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400">العائد المتوقع (ROI):</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>السنة 1:</strong> الوصول إلى $3M إيرادات سنوية (1.5x من الاستثمار)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>السنة 2:</strong> الوصول إلى $12M إيرادات سنوية (6x من الاستثمار)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>السنة 3:</strong> Exit محتمل بتقييم $50M+ (25x ROI)</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">الفريق</CardTitle>
            <CardDescription>خبرة تقنية وتجارية قوية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  أ
                </div>
                <div>
                  <h4 className="font-semibold text-lg">أحمد شوقي</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Founder & CEO</p>
                  <p className="text-sm">
                    خبرة في AI/ML، Enterprise Software، والتمويل الإسلامي. بنى HaderOS من الصفر.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  ف
                </div>
                <div>
                  <h4 className="font-semibold text-lg">فريق تقني متخصص</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Engineering Team</p>
                  <p className="text-sm">
                    مطورون متخصصون في Python, TypeScript, Blockchain, ML/AI - تنفيذ سريع وجودة عالية.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">جاهز للانضمام إلينا؟</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              دعنا نناقش كيف يمكنك أن تكون جزءاً من هذه الرحلة المثيرة. تواصل معنا اليوم لترتيب اجتماع.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a href="mailto:ahmed@haderosai.com">
                <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                  <Mail className="w-5 h-5" />
                  ahmed@haderosai.com
                </Button>
              </a>
              <a href="tel:+201234567890">
                <Button size="lg" variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 w-full sm:w-auto">
                  <Phone className="w-5 h-5" />
                  +20 123 456 7890
                </Button>
              </a>
            </div>

            <Link href="/investor">
              <Button size="lg" variant="ghost" className="gap-2 text-white hover:bg-white/10">
                العودة للبوابة
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
