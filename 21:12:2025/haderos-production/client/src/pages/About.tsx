import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BRAND_STORY } from "@/../../shared/brand-story";
import { 
  Globe, 
  Shield, 
  Zap, 
  Users, 
  Target, 
  TrendingUp,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function About() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {BRAND_STORY.name}
        </h1>
        <p className="text-2xl text-muted-foreground mb-6">
          {BRAND_STORY.tagline}
        </p>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {BRAND_STORY.vision.long}
        </p>
      </div>

      {/* Name Meaning Section */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            The Name: A Global Vision with a Local Soul
          </CardTitle>
          <CardDescription>
            {BRAND_STORY.vision.short}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BRAND_STORY.nameComponents.map((component, index) => (
              <Card key={index} className="border">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center">
                    {component.component}
                  </CardTitle>
                  {component.romanization && (
                    <p className="text-center text-sm text-muted-foreground">
                      ({component.romanization})
                    </p>
                  )}
                  <Badge variant="secondary" className="w-fit mx-auto">
                    {component.language}
                  </Badge>
                  {component.isUnique && (
                    <Badge variant="default" className="w-fit mx-auto mt-1">
                      Unique to Arabic
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-center mb-2">
                    "{component.meaning}"
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    {component.significance}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mission Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-blue-500" />
            Our Mission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{BRAND_STORY.mission}</p>
        </CardContent>
      </Card>

      {/* Values Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Our Values
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {BRAND_STORY.values.map((value, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Excellence */}
      <Card className="mb-8 border-2 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-green-500" />
            Technical Excellence
          </CardTitle>
          <CardDescription>
            Enterprise-grade platform with proven metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {BRAND_STORY.technicalExcellence.securityGrade}
              </div>
              <div className="text-sm text-muted-foreground">Security Grade</div>
              <div className="text-xs text-muted-foreground mt-1">
                Score: {BRAND_STORY.technicalExcellence.securityScore}/100
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                &lt;{BRAND_STORY.technicalExcellence.performanceMs}ms
              </div>
              <div className="text-sm text-muted-foreground">Response Time</div>
              <div className="text-xs text-muted-foreground mt-1">
                60% faster than competitors
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {BRAND_STORY.technicalExcellence.validationCoverage}%
              </div>
              <div className="text-sm text-muted-foreground">Validation Coverage</div>
              <div className="text-xs text-muted-foreground mt-1">
                Complete data integrity
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vision 2028 */}
      <Card className="mb-8 border-2 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-purple-500" />
            Vision 2028
          </CardTitle>
          <CardDescription>
            Building an economic operating system for emerging markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {BRAND_STORY.vision2028.factories.toLocaleString()}
              </div>
              <div className="text-sm font-medium">Factories Onboarded</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {BRAND_STORY.vision2028.merchants.toLocaleString()}
              </div>
              <div className="text-sm font-medium">Merchants & Traders</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {BRAND_STORY.vision2028.jobsCreated.toLocaleString()}
              </div>
              <div className="text-sm font-medium">Jobs Created</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg md:col-span-2">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {BRAND_STORY.vision2028.ordersProcessed.toLocaleString()}
              </div>
              <div className="text-sm font-medium">Orders Processed</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 rounded-lg">
              <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">
                {BRAND_STORY.vision2028.strategicAlliances}+
              </div>
              <div className="text-sm font-medium">Strategic Alliances</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Markets Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Globe className="h-6 w-6 text-blue-500" />
            Our Markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge>Phase 1</Badge> Initial Launch
              </h3>
              <div className="flex flex-wrap gap-2">
                {BRAND_STORY.markets.phase1.map((market) => (
                  <Badge key={market} variant="secondary">{market}</Badge>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge>Phase 2</Badge> Expansion
              </h3>
              <div className="flex flex-wrap gap-2">
                {BRAND_STORY.markets.phase2.map((market) => (
                  <Badge key={market} variant="secondary">{market}</Badge>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge>Phase 3</Badge> Global Reach
              </h3>
              <div className="flex flex-wrap gap-2">
                {BRAND_STORY.markets.phase3.map((market) => (
                  <Badge key={market} variant="secondary">{market}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-purple-500" />
            Languages Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BRAND_STORY.languages.map((lang) => (
              <Badge key={lang} variant="outline" className="text-base py-2 px-4">
                {lang}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-muted-foreground text-sm mt-12">
        <p>Founded {BRAND_STORY.founded} • {BRAND_STORY.headquarters}</p>
        <p className="mt-2">
          {BRAND_STORY.socialLinks.email} • {BRAND_STORY.socialLinks.website}
        </p>
      </div>
    </div>
  );
}
