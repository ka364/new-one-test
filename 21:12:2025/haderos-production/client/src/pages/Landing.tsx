import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SocialProof from "@/components/SocialProof";
import TechnicalComparison from "@/components/TechnicalComparison";
import { BRAND_STORY } from "@/../../shared/brand-story";
import { 
  ArrowRight, 
  Check, 
  Globe, 
  Shield, 
  Zap, 
  TrendingUp,
  Users,
  Target,
  Rocket,
  Star,
  Building2,
  ShoppingCart,
  Briefcase
} from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HADEROS
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">AI CLOUD</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/about">
              <Button variant="ghost">About</Button>
            </Link>
            <Link href="/showcase">
              <Button variant="ghost">Showcase</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-24 lg:py-32">
        <div className="mx-auto max-w-5xl text-center space-y-8">
          <Badge variant="outline" className="text-base px-4 py-2">
            <Rocket className="mr-2 h-4 w-4" />
            Launching 2025 • 5 Languages • 3 Continents
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">The Operating System</span>
            <span className="block text-primary mt-2">for Emerging Markets</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enterprise-grade business platform at 60-95% lower cost. 
            Built for the Middle East, Southeast Asia, and beyond.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/investor/pitch">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Investment Pitch
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>A+ Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>&lt;200ms Response</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>5 Languages</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>100% Validation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50 py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">60-95%</div>
              <div className="text-sm text-muted-foreground">Cost Savings vs Competitors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">A+</div>
              <div className="text-sm text-muted-foreground">Security Grade (95/100)</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">&lt;200ms</div>
              <div className="text-sm text-muted-foreground">Average Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">5</div>
              <div className="text-sm text-muted-foreground">Languages Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything Your Business Needs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete platform combining AI, security, and local understanding
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Enterprise Security",
              description: "A+ security grade with 12 comprehensive security features including Helmet.js, CORS, Rate Limiting, and AES-256 encryption.",
              color: "text-green-500"
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "<200ms response time with intelligent caching system. 60% faster than industry average.",
              color: "text-yellow-500"
            },
            {
              icon: Globe,
              title: "Multi-Language",
              description: "Full support for Arabic, English, Indonesian, Malay, and Chinese with RTL support and cultural adaptation.",
              color: "text-blue-500"
            },
            {
              icon: TrendingUp,
              title: "AI-Powered Analytics",
              description: "Advanced analytics and predictions powered by cutting-edge AI to support your business decisions.",
              color: "text-purple-500"
            },
            {
              icon: Users,
              title: "Team Collaboration",
              description: "Built-in team management, role-based access control, and real-time collaboration features.",
              color: "text-pink-500"
            },
            {
              icon: Target,
              title: "Local Focus",
              description: "Designed specifically for emerging markets with local payment methods, shipping, and cultural understanding.",
              color: "text-orange-500"
            }
          ].map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardHeader>
                <div className={`h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Vision 2028 Section */}
      <section className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-background py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Vision 2028</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Building an Economic Operating System
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our ambitious targets for transforming emerging market economies
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            <Card className="border-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="text-center pb-2">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {BRAND_STORY.vision2028.factories.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <p className="font-medium">Factories Onboarded</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader className="text-center pb-2">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {BRAND_STORY.vision2028.merchants.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <p className="font-medium">Merchants & Traders</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 md:col-span-2 lg:col-span-1">
              <CardHeader className="text-center pb-2">
                <Briefcase className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {BRAND_STORY.vision2028.jobsCreated.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <p className="font-medium">Jobs Created</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Comparison Section */}
      <TechnicalComparison />

      {/* Social Proof Section */}
      <SocialProof />

      {/* Pricing Section */}
      <section className="container py-24">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            60-95% lower than global competitors. No hidden fees.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {[
            {
              name: "Starter",
              price: "$49",
              period: "/month",
              description: "Perfect for small businesses",
              features: [
                "Up to 10 users",
                "Basic analytics",
                "Email support",
                "5GB storage",
                "Mobile app access"
              ]
            },
            {
              name: "Professional",
              price: "$149",
              period: "/month",
              description: "For growing businesses",
              features: [
                "Up to 50 users",
                "Advanced analytics",
                "Priority support",
                "50GB storage",
                "API access",
                "Custom integrations"
              ],
              popular: true
            },
            {
              name: "Enterprise",
              price: "$499",
              period: "/month",
              description: "For large organizations",
              features: [
                "Unlimited users",
                "AI-powered insights",
                "24/7 dedicated support",
                "Unlimited storage",
                "White-label options",
                "Custom development"
              ]
            }
          ].map((plan, index) => (
            <Card key={index} className={`border-2 ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              <CardHeader>
                {plan.popular && (
                  <Badge className="w-fit mb-2">Most Popular</Badge>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant={plan.popular ? "default" : "outline"}>
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-y bg-primary text-primary-foreground py-24">
        <div className="container text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg opacity-90">
              Join thousands of businesses already using HADEROS to grow faster and more efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HADEROS
              </div>
              <p className="text-sm text-muted-foreground">
                {BRAND_STORY.tagline}
              </p>
              <div className="flex gap-2">
                {BRAND_STORY.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang.split(' ')[0]}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/showcase"><a className="hover:text-foreground">Features</a></Link></li>
                <li><Link href="/about"><a className="hover:text-foreground">About</a></Link></li>
                <li><Link href="/investor/pitch"><a className="hover:text-foreground">Pricing</a></Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about"><a className="hover:text-foreground">About Us</a></Link></li>
                <li><Link href="/investor"><a className="hover:text-foreground">Investors</a></Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={BRAND_STORY.socialLinks.email} className="hover:text-foreground">{BRAND_STORY.socialLinks.email}</a></li>
                <li><a href={BRAND_STORY.socialLinks.github} className="hover:text-foreground">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {BRAND_STORY.name}. All rights reserved.</p>
            <p className="mt-2 text-xs">
              HAD (Built) + ER (Enabler) + OS (Operating System) | حاضر (Ready) | ض (Local Soul) | 准备就绪 (Prepared)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
