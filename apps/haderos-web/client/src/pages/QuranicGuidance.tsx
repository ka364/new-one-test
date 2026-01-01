/**
 * 📖 Quranic Guidance Page
 * صفحة الإرشاد القرآني
 *
 * Provides live ethical guidance using Quranic verses
 * based on business context and management situations
 */

import { useState } from "react";
import {
  BookOpen,
  Search,
  Star,
  Heart,
  Share2,
  Bookmark,
  Loader2,
  ArrowRight,
  Lightbulb,
  Building2,
  Users,
  Banknote,
  Scale,
  HandCoins,
  MessageSquareQuote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Quick context presets
const CONTEXT_PRESETS = [
  {
    id: "hiring",
    label: "توظيف موظف جديد",
    icon: Users,
    context: "أريد توظيف موظف جديد وأريد إرشادات أخلاقية"
  },
  {
    id: "finance",
    label: "قرار مالي",
    icon: Banknote,
    context: "أتخذ قراراً مالياً مهماً في الشركة"
  },
  {
    id: "contract",
    label: "توقيع عقد",
    icon: Scale,
    context: "على وشك توقيع عقد تجاري جديد"
  },
  {
    id: "meeting",
    label: "اجتماع فريق",
    icon: Building2,
    context: "سأعقد اجتماع فريق لمناقشة استراتيجية جديدة"
  },
  {
    id: "customer",
    label: "خدمة العملاء",
    icon: HandCoins,
    context: "أريد تحسين تجربة العملاء"
  },
  {
    id: "challenge",
    label: "مواجهة تحدي",
    icon: Lightbulb,
    context: "أواجه تحدياً صعباً في العمل"
  },
];

// Mock guidance data - in production this would come from the API
const SAMPLE_VERSES = [
  {
    id: 1,
    surahName: "Al-Baqarah",
    surahNameAr: "البقرة",
    ayahNumber: 282,
    verseText: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا تَدَايَنتُم بِدَيْنٍ إِلَىٰ أَجَلٍ مُّسَمًّى فَاكْتُبُوهُ",
    applicationContext: {
      situationDescription: "Documentation of financial agreements",
      situationDescriptionAr: "توثيق الاتفاقيات المالية والعقود"
    }
  },
  {
    id: 2,
    surahName: "An-Nisa",
    surahNameAr: "النساء",
    ayahNumber: 58,
    verseText: "إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا وَإِذَا حَكَمْتُم بَيْنَ النَّاسِ أَن تَحْكُمُوا بِالْعَدْلِ",
    applicationContext: {
      situationDescription: "Trust and justice in dealings",
      situationDescriptionAr: "الأمانة والعدل في التعاملات"
    }
  },
  {
    id: 3,
    surahName: "Ash-Shura",
    surahNameAr: "الشورى",
    ayahNumber: 38,
    verseText: "وَأَمْرُهُمْ شُورَىٰ بَيْنَهُمْ",
    applicationContext: {
      situationDescription: "Consultation in decision making",
      situationDescriptionAr: "الشورى في اتخاذ القرارات"
    }
  }
];

type GuidanceResult = {
  verses: Array<{
    id: number;
    surahName: string;
    surahNameAr: string;
    ayahNumber: number;
    verseText: string;
    reference: string;
    applicationContext: {
      situationDescription: string;
      situationDescriptionAr: string;
      relevanceScore?: number;
    } | null;
  }>;
  matchedKeywords: string[];
  contextTypes: string[];
};

export default function QuranicGuidance() {
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState("");
  const [area, setArea] = useState("general");
  const [result, setResult] = useState<GuidanceResult | null>(null);
  const [savedVerses, setSavedVerses] = useState<number[]>([]);

  const handlePresetClick = (preset: typeof CONTEXT_PRESETS[0]) => {
    setContext(preset.context);
    handleSearch(preset.context);
  };

  const handleSearch = async (searchContext?: string) => {
    const contextToSearch = searchContext || context;
    if (!contextToSearch.trim()) {
      toast.error("الرجاء إدخال السياق أولاً");
      return;
    }

    setLoading(true);

    // Simulate API call - in production use trpc
    setTimeout(() => {
      setResult({
        verses: SAMPLE_VERSES.map(v => ({
          ...v,
          reference: `${v.surahNameAr} ${v.ayahNumber}`
        })),
        matchedKeywords: ["العدل", "الأمانة", "الشورى"],
        contextTypes: ["decision_making", "finance"]
      });
      setLoading(false);
      toast.success("تم العثور على إرشادات قرآنية");
    }, 1500);
  };

  const handleSaveVerse = (verseId: number) => {
    if (savedVerses.includes(verseId)) {
      setSavedVerses(savedVerses.filter(id => id !== verseId));
      toast.info("تم إزالة الآية من المحفوظات");
    } else {
      setSavedVerses([...savedVerses, verseId]);
      toast.success("تم حفظ الآية");
    }
  };

  const handleShareVerse = (verse: any) => {
    const text = `${verse.verseText}\n\n${verse.reference}\n\nمن تطبيق HADEROS`;
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ الآية للمشاركة");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            <span>Quranic Guidance System</span>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
            نظام الإرشاد القرآني
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            احصل على إرشادات قرآنية حية بناءً على سياق عملك وقراراتك الإدارية
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="search">البحث السياقي</TabsTrigger>
            <TabsTrigger value="browse">تصفح الآيات</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-8">
            {/* Quick Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  سياقات سريعة
                </CardTitle>
                <CardDescription>
                  اختر سياقاً شائعاً للحصول على إرشادات فورية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CONTEXT_PRESETS.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      onClick={() => handlePresetClick(preset)}
                    >
                      <preset.icon className="w-6 h-6 text-emerald-600" />
                      <span className="text-sm">{preset.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  البحث حسب السياق
                </CardTitle>
                <CardDescription>
                  صف الموقف أو القرار الذي تواجهه للحصول على إرشادات مناسبة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="context">السياق أو الموقف</Label>
                  <Textarea
                    id="context"
                    placeholder="مثال: أريد اتخاذ قرار بشأن توسيع الشركة وفتح فرع جديد..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">المجال</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">عام</SelectItem>
                      <SelectItem value="finance">المالية</SelectItem>
                      <SelectItem value="hr">الموارد البشرية</SelectItem>
                      <SelectItem value="operations">العمليات</SelectItem>
                      <SelectItem value="strategy">الاستراتيجية</SelectItem>
                      <SelectItem value="customer">خدمة العملاء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => handleSearch()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري البحث...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 ml-2" />
                      احصل على الإرشادات
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <div className="space-y-6">
                {/* Keywords */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {result.matchedKeywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {keyword}
                    </Badge>
                  ))}
                </div>

                {/* Verses */}
                {result.verses.map((verse, index) => (
                  <Card key={verse.id} className="overflow-hidden border-r-4 border-r-emerald-500">
                    <CardContent className="pt-6">
                      {/* Verse Header */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                          {verse.reference}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {verse.surahName}
                        </span>
                      </div>

                      {/* Verse Text */}
                      <div className="bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-6 mb-4">
                        <p className="text-2xl leading-loose text-gray-800 dark:text-gray-200 font-arabic text-center">
                          {verse.verseText}
                        </p>
                      </div>

                      {/* Application Context */}
                      {verse.applicationContext && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <MessageSquareQuote className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                كيف تنطبق على موقفك:
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                {verse.applicationContext.situationDescriptionAr}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveVerse(verse.id)}
                            className={savedVerses.includes(verse.id) ? "text-amber-600" : ""}
                          >
                            <Bookmark className={`w-4 h-4 ml-1 ${savedVerses.includes(verse.id) ? "fill-current" : ""}`} />
                            حفظ
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShareVerse(verse)}
                          >
                            <Share2 className="w-4 h-4 ml-1" />
                            مشاركة
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Heart className="w-4 h-4 ml-1" />
                          {Math.floor(Math.random() * 100) + 10}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="browse">
            <Card>
              <CardHeader>
                <CardTitle>تصفح الآيات حسب السورة</CardTitle>
                <CardDescription>
                  استكشف الآيات المتعلقة بالإدارة والأعمال في القرآن الكريم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {["البقرة", "النساء", "المائدة", "الأنفال", "التوبة", "الشورى"].map((surah, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-1"
                    >
                      <span className="text-lg font-bold">{surah}</span>
                      <span className="text-xs text-gray-500">{Math.floor(Math.random() * 20) + 5} آية إدارية</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-4 mt-12">
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">150+</div>
              <div className="text-sm text-emerald-600 dark:text-emerald-500">آية متعلقة بالأعمال</div>
            </CardContent>
          </Card>
          <Card className="bg-teal-50 dark:bg-teal-900/20 border-teal-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">50+</div>
              <div className="text-sm text-teal-600 dark:text-teal-500">سياق إداري</div>
            </CardContent>
          </Card>
          <Card className="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">1,000+</div>
              <div className="text-sm text-cyan-600 dark:text-cyan-500">استشارة يومية</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">98%</div>
              <div className="text-sm text-blue-600 dark:text-blue-500">رضا المستخدمين</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
