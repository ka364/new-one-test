import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Bot, Shield, TrendingUp, Zap, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
// import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const features = [
    {
      icon: Shield,
      title: "حوكمة أخلاقية ذكية",
      titleEn: "Ethical Governance",
      description: "محرك KAIA يضمن التزام جميع المعاملات بالمبادئ الشرعية والأخلاقية",
      descriptionEn: "KAIA engine ensures all transactions comply with Sharia and ethical principles"
    },
    {
      icon: Bot,
      title: "وكلاء ذكيين مستقلين",
      titleEn: "Autonomous AI Agents",
      description: "وكلاء متخصصون في التحليل المالي، التنبؤ بالطلب، وإدارة الحملات",
      descriptionEn: "Specialized agents for financial analysis, demand forecasting, and campaign management"
    },
    {
      icon: TrendingUp,
      title: "تحليلات متقدمة",
      titleEn: "Advanced Analytics",
      description: "رؤى تحليلية عميقة وتنبؤات دقيقة لدعم قراراتك التجارية",
      descriptionEn: "Deep analytical insights and accurate predictions to support your business decisions"
    },
    {
      icon: Zap,
      title: "أتمتة ذكية",
      titleEn: "Smart Automation",
      description: "نظام أحداث متقدم يعالج العمليات تلقائياً ويرسل التنبيهات الفورية",
      descriptionEn: "Advanced event system that processes operations automatically and sends instant alerts"
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Language Switcher */}
      {/* <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div> */}
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block">HaderOS AI نظام</span>
                <span className="block text-primary">إدارة أعمال بضمير</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                منصة ذكية متكاملة لإدارة الأعمال مع حوكمة أخلاقية مدمجة ووكلاء ذكيين يعملون لصالحك
              </p>
              <p className="text-sm text-muted-foreground">
                HaderOS AI - Powered by haderosai.com
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8">
                    الذهاب إلى لوحة التحكم
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="text-lg px-8">
                    تسجيل الدخول
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </Button>
                </a>
              )}
              <Link href="/showcase">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Platform Showcase
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  About HADEROS
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              مميزات النظام
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نظام متكامل يجمع بين الذكاء الاصطناعي والحوكمة الأخلاقية لإدارة أعمالك بكفاءة
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">
                    <div className="space-y-1">
                      <div>{feature.title}</div>
                      <div className="text-sm font-normal text-muted-foreground">
                        {feature.titleEn}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base space-y-2">
                    <p>{feature.description}</p>
                    <p className="text-xs">{feature.descriptionEn}</p>
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                جاهز للبدء؟
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                انضم إلى منصة HaderOS اليوم واستمتع بإدارة أعمالك بطريقة ذكية وأخلاقية
              </p>
              {!isAuthenticated && (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="text-lg px-8">
                    ابدأ الآن مجاناً
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground space-y-2">
          <p>© 2025 HADEROS AI CLOUD. All rights reserved.</p>
          <p>The Operating System for Emerging Market Businesses</p>
          <p className="text-xs">
            <span className="font-semibold">HADEROS</span> = HAD (Built) + ER (Enabler) + OS (Operating System) | حاضر (Ready) | ض (Local Soul)
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/about">
              <Button variant="link" size="sm">About</Button>
            </Link>
            <Link href="/showcase">
              <Button variant="link" size="sm">Showcase</Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
