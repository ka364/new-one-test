import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MonthForecast {
    month: string;
    revenue: number;
    expenses: number;
    netCashFlow: number;
    cumulativeBalance: number;
    isDeficit: boolean;
}

type ScenarioType = "optimistic" | "realistic" | "pessimistic";

export default function CashFlowForecast() {
    const [scenario, setScenario] = useState<ScenarioType>("realistic");
    const [period, setPeriod] = useState<"3months" | "6months" | "12months">("6months");

    // البيانات المتنوعة حسب السيناريو
    const scenarioData: { [key in ScenarioType]: MonthForecast[] } = {
        optimistic: [
            { month: "يناير", revenue: 800000, expenses: 600000, netCashFlow: 200000, cumulativeBalance: 200000, isDeficit: false },
            { month: "فبراير", revenue: 850000, expenses: 620000, netCashFlow: 230000, cumulativeBalance: 430000, isDeficit: false },
            { month: "مارس", revenue: 900000, expenses: 640000, netCashFlow: 260000, cumulativeBalance: 690000, isDeficit: false },
            { month: "أبريل", revenue: 950000, expenses: 660000, netCashFlow: 290000, cumulativeBalance: 980000, isDeficit: false },
            { month: "مايو", revenue: 1000000, expenses: 680000, netCashFlow: 320000, cumulativeBalance: 1300000, isDeficit: false },
            { month: "يونيو", revenue: 1050000, expenses: 700000, netCashFlow: 350000, cumulativeBalance: 1650000, isDeficit: false },
            { month: "يوليو", revenue: 1100000, expenses: 720000, netCashFlow: 380000, cumulativeBalance: 2030000, isDeficit: false },
            { month: "أغسطس", revenue: 1150000, expenses: 740000, netCashFlow: 410000, cumulativeBalance: 2440000, isDeficit: false },
            { month: "سبتمبر", revenue: 1200000, expenses: 760000, netCashFlow: 440000, cumulativeBalance: 2880000, isDeficit: false },
            { month: "أكتوبر", revenue: 1250000, expenses: 780000, netCashFlow: 470000, cumulativeBalance: 3350000, isDeficit: false },
            { month: "نوفمبر", revenue: 1300000, expenses: 800000, netCashFlow: 500000, cumulativeBalance: 3850000, isDeficit: false },
            { month: "ديسمبر", revenue: 1400000, expenses: 900000, netCashFlow: 500000, cumulativeBalance: 4350000, isDeficit: false },
        ],
        realistic: [
            { month: "يناير", revenue: 700000, expenses: 600000, netCashFlow: 100000, cumulativeBalance: 100000, isDeficit: false },
            { month: "فبراير", revenue: 720000, expenses: 620000, netCashFlow: 100000, cumulativeBalance: 200000, isDeficit: false },
            { month: "مارس", revenue: 750000, expenses: 640000, netCashFlow: 110000, cumulativeBalance: 310000, isDeficit: false },
            { month: "أبريل", revenue: 780000, expenses: 660000, netCashFlow: 120000, cumulativeBalance: 430000, isDeficit: false },
            { month: "مايو", revenue: 800000, expenses: 680000, netCashFlow: 120000, cumulativeBalance: 550000, isDeficit: false },
            { month: "يونيو", revenue: 820000, expenses: 700000, netCashFlow: 120000, cumulativeBalance: 670000, isDeficit: false },
            { month: "يوليو", revenue: 850000, expenses: 720000, netCashFlow: 130000, cumulativeBalance: 800000, isDeficit: false },
            { month: "أغسطس", revenue: 880000, expenses: 740000, netCashFlow: 140000, cumulativeBalance: 940000, isDeficit: false },
            { month: "سبتمبر", revenue: 900000, expenses: 760000, netCashFlow: 140000, cumulativeBalance: 1080000, isDeficit: false },
            { month: "أكتوبر", revenue: 920000, expenses: 780000, netCashFlow: 140000, cumulativeBalance: 1220000, isDeficit: false },
            { month: "نوفمبر", revenue: 950000, expenses: 800000, netCashFlow: 150000, cumulativeBalance: 1370000, isDeficit: false },
            { month: "ديسمبر", revenue: 1000000, expenses: 900000, netCashFlow: 100000, cumulativeBalance: 1470000, isDeficit: false },
        ],
        pessimistic: [
            { month: "يناير", revenue: 600000, expenses: 650000, netCashFlow: -50000, cumulativeBalance: -50000, isDeficit: true },
            { month: "فبراير", revenue: 580000, expenses: 660000, netCashFlow: -80000, cumulativeBalance: -130000, isDeficit: true },
            { month: "مارس", revenue: 600000, expenses: 670000, netCashFlow: -70000, cumulativeBalance: -200000, isDeficit: true },
            { month: "أبريل", revenue: 620000, expenses: 680000, netCashFlow: -60000, cumulativeBalance: -260000, isDeficit: true },
            { month: "مايو", revenue: 640000, expenses: 690000, netCashFlow: -50000, cumulativeBalance: -310000, isDeficit: true },
            { month: "يونيو", revenue: 660000, expenses: 700000, netCashFlow: -40000, cumulativeBalance: -350000, isDeficit: true },
            { month: "يوليو", revenue: 680000, expenses: 710000, netCashFlow: -30000, cumulativeBalance: -380000, isDeficit: true },
            { month: "أغسطس", revenue: 700000, expenses: 720000, netCashFlow: -20000, cumulativeBalance: -400000, isDeficit: true },
            { month: "سبتمبر", revenue: 720000, expenses: 730000, netCashFlow: -10000, cumulativeBalance: -410000, isDeficit: true },
            { month: "أكتوبر", revenue: 750000, expenses: 740000, netCashFlow: 10000, cumulativeBalance: -400000, isDeficit: false },
            { month: "نوفمبر", revenue: 780000, expenses: 750000, netCashFlow: 30000, cumulativeBalance: -370000, isDeficit: false },
            { month: "ديسمبر", revenue: 850000, expenses: 800000, netCashFlow: 50000, cumulativeBalance: -320000, isDeficit: false },
        ],
    };

    const data = scenarioData[scenario];
    const displayData = period === "3months" ? data.slice(0, 3) : period === "6months" ? data.slice(0, 6) : data;

    // الحسابات
    const totalRevenue = displayData.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpenses = displayData.reduce((sum, m) => sum + m.expenses, 0);
    const netCashFlow = totalRevenue - totalExpenses;
    const deficitMonths = displayData.filter((m) => m.isDeficit).length;
    const avgMonthlyNetFlow = displayData.length > 0 ? netCashFlow / displayData.length : 0;

    return (
        <div className="space-y-6">
            {/* رأس الصفحة */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">توقعات التدفق النقدي</h1>
                <p className="text-gray-600 mt-1">توقعات التدفق النقدي المستقبلي والسيناريوهات المختلفة</p>
            </div>

            {/* خيارات السيناريو والفترة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">السيناريو</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            {(["optimistic", "realistic", "pessimistic"] as const).map((s) => (
                                <Button
                                    key={s}
                                    variant={scenario === s ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setScenario(s)}
                                    className="text-xs"
                                >
                                    {s === "optimistic" ? "متفائل" : s === "realistic" ? "واقعي" : "متشائم"}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">الفترة الزمنية</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            {(["3months", "6months", "12months"] as const).map((p) => (
                                <Button
                                    key={p}
                                    variant={period === p ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPeriod(p)}
                                    className="text-xs"
                                >
                                    {p === "3months" ? "3 أشهر" : p === "6months" ? "6 أشهر" : "12 شهر"}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* التحذيرات */}
            {deficitMonths > 0 && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        ⚠️ تحذير: يوجد {deficitMonths} شهر{deficitMonths > 1 ? "" : ""} سيشهد عجز نقدي حسب هذا السيناريو
                    </AlertDescription>
                </Alert>
            )}

            {avgMonthlyNetFlow < 0 && (
                <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        ⚠️ تحذير: متوسط التدفق النقدي الشهري سالب ({(avgMonthlyNetFlow / 1000).toFixed(0)}K)
                    </AlertDescription>
                </Alert>
            )}

            {/* المقاييس الرئيسية */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">إجمالي الإيرادات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {(totalRevenue / 1000000).toFixed(2)}M
                        </div>
                        <p className="text-xs text-gray-500 mt-1">للفترة المختارة</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">إجمالي المصروفات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {(totalExpenses / 1000000).toFixed(2)}M
                        </div>
                        <p className="text-xs text-gray-500 mt-1">للفترة المختارة</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">صافي التدفق</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {(netCashFlow / 1000000).toFixed(2)}M
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{netCashFlow >= 0 ? "فائض" : "عجز"}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">متوسط شهري</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${avgMonthlyNetFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {(avgMonthlyNetFlow / 1000).toFixed(0)}K
                        </div>
                        <p className="text-xs text-gray-500 mt-1">التدفق الشهري</p>
                    </CardContent>
                </Card>
            </div>

            {/* الرسوم البيانية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* الإيرادات والمصروفات */}
                <Card>
                    <CardHeader>
                        <CardTitle>الإيرادات والمصروفات</CardTitle>
                        <CardDescription>مقارنة شهرية</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={displayData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `${(value / 1000).toFixed(0)}K`} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#10b981" name="الإيرادات" />
                                <Bar dataKey="expenses" fill="#ef4444" name="المصروفات" />
                                <Line type="monotone" dataKey="netCashFlow" stroke="#3b82f6" name="صافي التدفق" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* الرصيد التراكمي */}
                <Card>
                    <CardHeader>
                        <CardTitle>الرصيد النقدي التراكمي</CardTitle>
                        <CardDescription>التطور الشهري</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={displayData}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `${(value / 1000000).toFixed(2)}M`} />
                                <Area type="monotone" dataKey="cumulativeBalance" stroke="#3b82f6" fill="url(#colorBalance)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* جدول التفاصيل */}
            <Card>
                <CardHeader>
                    <CardTitle>التفاصيل الشهرية</CardTitle>
                    <CardDescription>بيانات التدفق النقدي لكل شهر</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">الشهر</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">الإيرادات</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">المصروفات</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">صافي التدفق</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">الرصيد التراكمي</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData.map((month, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-900 font-medium">{month.month}</td>
                                        <td className="px-4 py-3 text-green-600">{(month.revenue / 1000).toFixed(0)}K</td>
                                        <td className="px-4 py-3 text-red-600">{(month.expenses / 1000).toFixed(0)}K</td>
                                        <td className={`px-4 py-3 font-semibold ${month.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {(month.netCashFlow / 1000).toFixed(0)}K
                                        </td>
                                        <td className={`px-4 py-3 font-medium ${month.cumulativeBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                            {(month.cumulativeBalance / 1000000).toFixed(2)}M
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${month.isDeficit ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                                                {month.isDeficit ? "عجز" : "فائض"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* التوصيات */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-900">التوصيات</CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800 space-y-2">
                    <ul className="space-y-2">
                        <li className="flex gap-2">
                            <span>✓</span>
                            <span>
                                {deficitMonths > 0
                                    ? `يجب الاستعداد لشهور العجز (${deficitMonths} شهر) بتوفير سيولة إضافية`
                                    : "التدفق النقدي إيجابي خلال الفترة المتوقعة"}
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span>✓</span>
                            <span>
                                {avgMonthlyNetFlow > 0 ? `متوسط التدفق الشهري موجب: ${(avgMonthlyNetFlow / 1000).toFixed(0)}K` : "يجب مراجعة نموذج الإيرادات والمصروفات"}
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span>✓</span>
                            <span>السيناريو الحالي: {scenario === "optimistic" ? "متفائل" : scenario === "realistic" ? "واقعي" : "متشائم"}</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
