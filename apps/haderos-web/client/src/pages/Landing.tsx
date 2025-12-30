/**
 * HADEROS AI CLOUD - Landing Page
 * Professional landing page for marketing and user acquisition
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Users,
  BarChart3,
  Package,
  DollarSign,
  Check,
  Star,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function Landing() {
  const scrollToSignup = () => {
    document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <div className="container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto">
            <Badge className="mb-6 px-4 py-2 text-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              وفر 97.5% من تكاليف SAP و Oracle
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
              نظام التشغيل للأعمال
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
                في الأسواق الناشئة
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              منصة متكاملة لإدارة المبيعات، المخزون، المشاريع والمصروفات
              <strong className="block mt-2 text-indigo-600">بتكلفة $290/سنوياً بدلاً من $12,000+</strong>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="text-lg px-8 py-6" onClick={scrollToSignup}>
                ابدأ مجاناً - 30 يوم تجريبي
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                شاهد العرض التوضيحي
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>بدون بطاقة ائتمانية</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>إلغاء في أي وقت</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>دعم عربي 24/7</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 max-w-6xl mx-auto">
            <div className="relative rounded-lg shadow-2xl overflow-hidden border-4 border-white">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10" />
              <img
                src="/api/placeholder/1200/800"
                alt="HADEROS Dashboard Preview"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white border-y">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 mb-8">يثق بنا أكثر من 1,000 شركة في المنطقة</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60 grayscale">
            {/* Company logos would go here */}
            <div className="text-2xl font-bold">شركة 1</div>
            <div className="text-2xl font-bold">شركة 2</div>
            <div className="text-2xl font-bold">شركة 3</div>
            <div className="text-2xl font-bold">شركة 4</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">كل ما تحتاجه لإدارة أعمالك</h2>
            <p className="text-xl text-gray-600">6 أنظمة متكاملة في منصة واحدة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <feature.icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">تسعير شفاف وعادل</h2>
            <p className="text-xl text-gray-600">وفر حتى 97.5% مقارنة بالمنافسين</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`p-8 ${plan.highlighted ? 'ring-4 ring-indigo-600 relative' : ''}`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600">
                    الأكثر شعبية
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  {plan.savings && (
                    <Badge variant="secondary" className="mb-4">
                      {plan.savings}
                    </Badge>
                  )}
                </div>

                <div className="text-center mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">/سنوياً</span>
                  {plan.perUser && <p className="text-sm text-gray-500 mt-1">{plan.perUser}</p>}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2">
                      <Check className={`h-5 w-5 mt-0.5 ${plan.highlighted ? 'text-indigo-600' : 'text-green-600'}`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${plan.highlighted ? '' : 'variant-outline'}`}
                  onClick={scrollToSignup}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">ماذا يقول عملاؤنا</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-gray-500">{testimonial.company}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta-section" className="py-24 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ابدأ رحلتك مع HADEROS اليوم
          </h2>
          <p className="text-xl mb-10 text-indigo-100 max-w-2xl mx-auto">
            انضم إلى آلاف الشركات التي تستخدم HADEROS لإدارة أعمالها بكفاءة أعلى وتكلفة أقل
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              ابدأ التجربة المجانية
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent text-white border-white hover:bg-white/10">
              تحدث مع فريق المبيعات
            </Button>
          </div>

          <p className="mt-8 text-indigo-200">
            30 يوم تجريبي مجاني • بدون بطاقة ائتمانية • إلغاء في أي وقت
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">HADEROS AI CLOUD</h3>
              <p className="text-sm">
                نظام التشغيل للأعمال في الأسواق الناشئة
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">المنتج</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">الميزات</a></li>
                <li><a href="#" className="hover:text-white">التسعير</a></li>
                <li><a href="#" className="hover:text-white">الأمان</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">الشركة</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">عن HADEROS</a></li>
                <li><a href="#" className="hover:text-white">المدونة</a></li>
                <li><a href="#" className="hover:text-white">الوظائف</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">الدعم</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">مركز المساعدة</a></li>
                <li><a href="#" className="hover:text-white">اتصل بنا</a></li>
                <li><a href="#" className="hover:text-white">الحالة</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 HADEROS AI CLOUD. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: BarChart3,
    title: 'إدارة المبيعات (CRM)',
    description: 'نظام CRM متكامل لتتبع العملاء والفرص التجارية والصفقات بكفاءة عالية',
  },
  {
    icon: Package,
    title: 'إدارة المخزون',
    description: 'تتبع دقيق للمنتجات والكميات في الوقت الفعلي مع تنبيهات ذكية',
  },
  {
    icon: TrendingUp,
    title: 'إدارة المشاريع 7×7',
    description: 'نظام ثوري لتوسيع الأعمال بشكل منهجي ومنظم',
  },
  {
    icon: DollarSign,
    title: 'إدارة المصروفات',
    description: 'تتبع شامل للمصروفات مع تقارير تفصيلية وتحليلات متقدمة',
  },
  {
    icon: Sparkles,
    title: 'المساعد الذكي AI',
    description: 'AI Co-Pilot يساعدك في اتخاذ القرارات وتحليل البيانات',
  },
  {
    icon: Shield,
    title: 'أمان من الدرجة الأولى',
    description: 'حماية بمعايير البنوك مع تشفير كامل وصلاحيات متقدمة',
  },
];

const pricingPlans = [
  {
    name: 'Odoo',
    price: '$1,200',
    perUser: 'لـ 10 مستخدمين',
    features: [
      'ميزات محدودة',
      'دعم بطيء',
      'تخصيص معقد',
      'تكاليف إضافية للموديولات',
    ],
    cta: 'مقارنة',
    highlighted: false,
  },
  {
    name: 'HADEROS',
    price: '$290',
    perUser: 'لـ 10 مستخدمين',
    savings: 'وفر 97.5% مقارنة بـ SAP',
    features: [
      'جميع الميزات مضمنة',
      'دعم فني 24/7 بالعربية',
      'تحديثات مجانية مدى الحياة',
      'تخزين غير محدود',
      'نسخ احتياطية تلقائية',
      'تكامل مع جميع الأدوات',
      'تدريب مجاني',
      'مدير حساب مخصص',
    ],
    cta: 'ابدأ الآن',
    highlighted: true,
  },
  {
    name: 'SAP / Oracle',
    price: '$12,000+',
    perUser: 'لـ 10 مستخدمين',
    features: [
      'تكلفة عالية جداً',
      'إعداد معقد ومكلف',
      'عقود طويلة الأمد',
      'تحديثات مدفوعة',
    ],
    cta: 'مقارنة',
    highlighted: false,
  },
];

const testimonials = [
  {
    quote: 'HADEROS غيّر طريقة عملنا بالكامل. وفرنا أكثر من 90% من التكاليف مقارنة بالنظام السابق.',
    name: 'أحمد محمد',
    role: 'المدير التنفيذي',
    company: 'شركة النجاح التجارية',
  },
  {
    quote: 'نظام سهل الاستخدام مع دعم فني ممتاز بالعربية. أنصح به بشدة لأي شركة ناشئة.',
    name: 'فاطمة علي',
    role: 'مديرة العمليات',
    company: 'مؤسسة الأمل',
  },
  {
    quote: 'أفضل استثمار قمنا به هذا العام. النتائج كانت فورية والعائد على الاستثمار مذهل.',
    name: 'خالد السعيد',
    role: 'مدير المبيعات',
    company: 'مجموعة الرائد',
  },
];
