import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, DollarSign, Target, Percent } from "lucide-react";
import { toast } from "sonner";

export default function RevenueCalculator() {
  const [adSpend, setAdSpend] = useState<string>("5000");
  const [averageOrderValue, setAverageOrderValue] = useState<string>("700");
  const [shipmentRate, setShipmentRate] = useState<string>("90");
  const [deliverySuccessRate, setDeliverySuccessRate] = useState<string>("50");

  const { data: lastEfficiency } = trpc.metrics.getAdCampaignsByDate.useQuery({
    date: new Date().toISOString().split("T")[0],
  });

  const calculateRevenue = trpc.metrics.calculateExpectedRevenue.useQuery(
    {
      adSpend: parseFloat(adSpend) || 0,
      averageOrderValue: parseFloat(averageOrderValue) || 0,
      shipmentRate: parseFloat(shipmentRate) / 100 || 0,
      deliverySuccessRate: parseFloat(deliverySuccessRate) / 100 || 0,
    },
    {
      enabled: !!adSpend && !!averageOrderValue && !!shipmentRate && !!deliverySuccessRate,
    }
  );

  const saveForecast = trpc.metrics.createForecast.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ التوقع بنجاح");
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const handleSaveForecast = () => {
    if (!calculateRevenue.data) return;

    const data = calculateRevenue.data;
    saveForecast.mutate({
      date: new Date().toISOString().split("T")[0],
      adSpend,
      lastCampaignEfficiency: data.costPerResult.toString(),
      expectedOrders: data.expectedOrders,
      averageOrderValue,
      shipmentRate: (parseFloat(shipmentRate) / 100).toString(),
      deliverySuccessRate: (parseFloat(deliverySuccessRate) / 100).toString(),
      expectedRevenue: data.expectedRevenue.toString(),
    });
  };

  const result = calculateRevenue.data;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            حاسبة التحصيل المتوقع
          </h1>
          <p className="text-muted-foreground">احسب التحصيل المتوقع من المصروف الإعلاني</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>المدخلات</CardTitle>
            <CardDescription>أدخل بيانات الحملة الإعلانية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adSpend">المصروف الإعلاني اليومي (جنيه)</Label>
              <Input
                id="adSpend"
                type="number"
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                placeholder="5000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avgOrderValue">متوسط قيمة الطلب (جنيه)</Label>
              <Input
                id="avgOrderValue"
                type="number"
                value={averageOrderValue}
                onChange={(e) => setAverageOrderValue(e.target.value)}
                placeholder="700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipmentRate">نسبة الخروج الفعلي (%)</Label>
              <Input
                id="shipmentRate"
                type="number"
                value={shipmentRate}
                onChange={(e) => setShipmentRate(e.target.value)}
                placeholder="90"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                نسبة الطلبات التي يتم شحنها فعلياً
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryRate">نسبة التسليم الموقع (%)</Label>
              <Input
                id="deliveryRate"
                type="number"
                value={deliverySuccessRate}
                onChange={(e) => setDeliverySuccessRate(e.target.value)}
                placeholder="50"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                نسبة الطلبات الموقعة بعد خصم المرتجعات
              </p>
            </div>

            {lastEfficiency && lastEfficiency.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium">آخر كفاءة حملة</p>
                <p className="text-2xl font-bold text-blue-600">
                  {lastEfficiency[0].costPerResult} جنيه/نتيجة
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>النتائج المتوقعة</CardTitle>
            <CardDescription>التحصيل المتوقع بناءً على المدخلات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculateRevenue.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">جاري الحساب...</p>
              </div>
            ) : result ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">عدد الطلبات المتوقعة</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">
                      {result.expectedOrders}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Percent className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">تكلفة النتيجة</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {result.costPerResult.toFixed(2)} جنيه
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium">التحصيل المتوقع</span>
                    </div>
                    <span className="text-3xl font-bold text-green-600">
                      {result.expectedRevenue.toLocaleString()} جنيه
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                      <span className="font-medium">العائد على الاستثمار (ROI)</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">
                      {((result.expectedRevenue / parseFloat(adSpend) - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">التفاصيل:</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• الطلبات المتوقعة: {result.expectedOrders}</p>
                    <p>• بعد الخروج ({shipmentRate}%): {Math.round(result.expectedOrders * parseFloat(shipmentRate) / 100)}</p>
                    <p>• بعد التسليم ({deliverySuccessRate}%): {Math.round(result.expectedOrders * parseFloat(shipmentRate) / 100 * parseFloat(deliverySuccessRate) / 100)}</p>
                    <p>• التحصيل النهائي: {result.expectedRevenue.toLocaleString()} جنيه</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveForecast} 
                  className="w-full"
                  disabled={saveForecast.isPending}
                >
                  {saveForecast.isPending ? "جاري الحفظ..." : "حفظ التوقع"}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>أدخل البيانات لحساب التحصيل المتوقع</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formula Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>كيف يتم الحساب؟</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="font-medium">المعادلة:</p>
            <div className="bg-muted p-4 rounded-lg font-mono">
              <p>1. عدد الطلبات المتوقعة = المصروف الإعلاني ÷ تكلفة النتيجة</p>
              <p>2. الطلبات بعد الخروج = الطلبات المتوقعة × نسبة الخروج</p>
              <p>3. الطلبات الموقعة = الطلبات بعد الخروج × نسبة التسليم</p>
              <p>4. التحصيل المتوقع = الطلبات الموقعة × متوسط قيمة الطلب</p>
            </div>
            <p className="text-muted-foreground mt-4">
              * تكلفة النتيجة يتم حسابها من آخر حملة إعلانية ناجحة
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
