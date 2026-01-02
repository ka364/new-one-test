import { useState } from 'react';
import { Shield, AlertCircle, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { checkKAIACompliance } from '@/lib/backend-api';

type ComplianceResult = {
  compliant: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
  details: {
    riba: boolean;
    gharar: boolean;
    maysir: boolean;
  };
};

export default function KAIADemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);

  const [formData, setFormData] = useState({
    transactionType: 'sale',
    amount: '',
    description: '',
    interestRate: '',
    contractTerms: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Call backend API
      const response = await checkKAIACompliance({
        transaction_type: formData.transactionType,
        amount: parseFloat(formData.amount),
        description: formData.description,
        interest_rate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        contract_terms: formData.contractTerms || undefined,
      });

      setResult(response);

      if (response.compliant) {
        toast.success('✅ المعاملة متوافقة', {
          description: 'هذه المعاملة تتوافق مع الشريعة الإسلامية',
        });
      } else {
        toast.error('❌ المعاملة غير متوافقة', {
          description: 'تم اكتشاف انتهاكات شرعية',
        });
      }
    } catch (error) {
      toast.error('خطأ في الاتصال', {
        description: 'تعذر الاتصال بخادم KAIA. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      transactionType: 'sale',
      amount: '',
      description: '',
      interestRate: '',
      contractTerms: '',
    });
    setResult(null);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12"
      dir="rtl"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>KAIA Theology Engine</span>
          </div>

          <h1 className="text-4xl font-bold mb-4">محرك التحقق من الامتثال الشرعي</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            أدخل تفاصيل المعاملة المالية وسيقوم KAIA بتحليلها للتأكد من توافقها مع الشريعة الإسلامية
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المعاملة</CardTitle>
              <CardDescription>أدخل معلومات المعاملة المالية</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionType">نوع المعاملة</Label>
                  <Select
                    value={formData.transactionType}
                    onValueChange={(value) => setFormData({ ...formData, transactionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">بيع</SelectItem>
                      <SelectItem value="purchase">شراء</SelectItem>
                      <SelectItem value="loan">قرض</SelectItem>
                      <SelectItem value="investment">استثمار</SelectItem>
                      <SelectItem value="partnership">شراكة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ (جنيه)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="10000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">وصف المعاملة</Label>
                  <Textarea
                    id="description"
                    placeholder="مثال: بيع أحذية رياضية بالتقسيط"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate">نسبة الفائدة (%) - اختياري</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    إذا كانت المعاملة تتضمن فائدة، أدخل النسبة هنا
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractTerms">شروط العقد - اختياري</Label>
                  <Textarea
                    id="contractTerms"
                    placeholder="مثال: دفعة أولى 30%، والباقي على 6 أشهر"
                    value={formData.contractTerms}
                    onChange={(e) => setFormData({ ...formData, contractTerms: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري التحليل...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 ml-2" />
                        تحقق من الامتثال
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    إعادة تعيين
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {!result && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">في انتظار التحليل</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    أدخل تفاصيل المعاملة واضغط "تحقق من الامتثال" لرؤية النتائج
                  </p>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                {/* Main Result */}
                <Card
                  className={
                    result.compliant
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  }
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {result.compliant ? (
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                      ) : (
                        <XCircle className="w-12 h-12 text-red-600" />
                      )}
                      <div>
                        <CardTitle
                          className={
                            result.compliant
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-red-700 dark:text-red-400'
                          }
                        >
                          {result.compliant ? '✅ المعاملة متوافقة' : '❌ المعاملة غير متوافقة'}
                        </CardTitle>
                        <CardDescription>درجة الامتثال: {result.score}%</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Detailed Checks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">التحقق التفصيلي</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium">الربا (Riba)</span>
                      {result.details.riba ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          تم اكتشافه
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          لا يوجد
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium">الغرر (Gharar)</span>
                      {result.details.gharar ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          تم اكتشافه
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          لا يوجد
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium">الميسر (Maysir)</span>
                      {result.details.maysir ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          تم اكتشافه
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          لا يوجد
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Violations */}
                {result.violations.length > 0 && (
                  <Card className="border-red-200 dark:border-red-900">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        الانتهاكات المكتشفة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.violations.map((violation, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span>{violation}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <Card className="border-blue-200 dark:border-blue-900">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <AlertCircle className="w-5 h-5" />
                        التوصيات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl font-bold mb-4">رأيت قوة KAIA بنفسك؟</h3>
            <p className="mb-6 opacity-90">
              هذا مجرد جزء صغير من قدرات HaderOS. استكشف المزيد أو اقرأ عرض الاستثمار.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/investor/pitch">
                <Button size="lg" variant="secondary" className="gap-2">
                  عرض الاستثمار
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/investor">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30"
                >
                  العودة للبوابة
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
