import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Zap, 
  DollarSign, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Globe,
  Lock
} from "lucide-react";

interface ComparisonMetric {
  name: string;
  haderos: number;
  competitor: number;
  unit: string;
  icon: React.ElementType;
  higherIsBetter: boolean;
}

const metrics: ComparisonMetric[] = [
  {
    name: "Security Grade",
    haderos: 95,
    competitor: 72,
    unit: "/100",
    icon: Shield,
    higherIsBetter: true
  },
  {
    name: "Response Time",
    haderos: 180,
    competitor: 520,
    unit: "ms",
    icon: Zap,
    higherIsBetter: false
  },
  {
    name: "Monthly Cost",
    haderos: 149,
    competitor: 899,
    unit: "$",
    icon: DollarSign,
    higherIsBetter: false
  },
  {
    name: "Validation Coverage",
    haderos: 100,
    competitor: 65,
    unit: "%",
    icon: CheckCircle2,
    higherIsBetter: true
  },
  {
    name: "Languages Supported",
    haderos: 5,
    competitor: 2,
    unit: " langs",
    icon: Globe,
    higherIsBetter: true
  },
  {
    name: "Uptime SLA",
    haderos: 99.9,
    competitor: 99.5,
    unit: "%",
    icon: TrendingUp,
    higherIsBetter: true
  }
];

interface Feature {
  name: string;
  haderos: boolean;
  competitor: boolean;
}

const features: Feature[] = [
  { name: "Multi-language Support (5+ languages)", haderos: true, competitor: false },
  { name: "RTL Support for Arabic", haderos: true, competitor: false },
  { name: "Local Payment Methods", haderos: true, competitor: false },
  { name: "COD Management System", haderos: true, competitor: false },
  { name: "AI-Powered Analytics", haderos: true, competitor: true },
  { name: "Real-time Tracking", haderos: true, competitor: true },
  { name: "Mobile App", haderos: true, competitor: true },
  { name: "API Access", haderos: true, competitor: true },
  { name: "24/7 Local Support", haderos: true, competitor: false },
  { name: "Cultural Adaptation", haderos: true, competitor: false },
  { name: "Emerging Market Focus", haderos: true, competitor: false },
  { name: "Enterprise Security (A+)", haderos: true, competitor: false }
];

export default function TechnicalComparison() {
  const calculateImprovement = (metric: ComparisonMetric) => {
    if (metric.higherIsBetter) {
      return Math.round(((metric.haderos - metric.competitor) / metric.competitor) * 100);
    } else {
      return Math.round(((metric.competitor - metric.haderos) / metric.competitor) * 100);
    }
  };

  return (
    <section className="container py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4">Technical Comparison</Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          HADEROS vs Global Competitors
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See how we stack up against enterprise solutions like Salesforce, SAP, and Oracle
        </p>
      </div>

      {/* Metrics Comparison */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const improvement = calculateImprovement(metric);
          const haderosPercentage = metric.higherIsBetter 
            ? (metric.haderos / Math.max(metric.haderos, metric.competitor)) * 100
            : (1 - (metric.haderos / Math.max(metric.haderos, metric.competitor))) * 100;
          
          return (
            <Card key={metric.name} className="border-2 hover:border-primary transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {metric.name}
                  </CardTitle>
                  <Badge variant={improvement > 0 ? "default" : "secondary"}>
                    {improvement > 0 ? '+' : ''}{improvement}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* HADEROS */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-primary">HADEROS</span>
                      <span className="font-bold text-primary">
                        {metric.unit === "$" && metric.unit}
                        {metric.haderos}
                        {metric.unit !== "$" && metric.unit}
                      </span>
                    </div>
                    <Progress value={haderosPercentage} className="h-2" />
                  </div>

                  {/* Competitor */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Competitors</span>
                      <span className="text-muted-foreground">
                        {metric.unit === "$" && metric.unit}
                        {metric.competitor}
                        {metric.unit !== "$" && metric.unit}
                      </span>
                    </div>
                    <Progress value={100 - haderosPercentage} className="h-2 bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Comparison Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-primary">HADEROS</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Competitors</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{feature.name}</td>
                    <td className="text-center py-3 px-4">
                      {feature.haderos ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {feature.competitor ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-8 p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">The HADEROS Advantage</h3>
                <p className="text-sm text-muted-foreground">
                  HADEROS provides <strong>12 out of 12 features</strong> compared to competitors' average of 6 out of 12. 
                  We deliver enterprise-grade capabilities at 60-95% lower cost, with deep understanding of emerging market needs.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Savings Calculator */}
      <Card className="mt-8 border-2 border-primary">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Annual Cost Savings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Competitors</div>
              <div className="text-3xl font-bold text-muted-foreground">$10,788</div>
              <div className="text-xs text-muted-foreground mt-1">/year</div>
            </div>
            
            <div className="text-center p-6 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="text-sm text-primary mb-2">HADEROS</div>
              <div className="text-3xl font-bold text-primary">$1,788</div>
              <div className="text-xs text-primary mt-1">/year</div>
            </div>
            
            <div className="text-center p-6 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-500">
              <div className="text-sm text-green-600 dark:text-green-400 mb-2">You Save</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">$9,000</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">83% savings</div>
            </div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            * Based on Professional plan comparison with similar features from Salesforce, SAP, and Oracle
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
