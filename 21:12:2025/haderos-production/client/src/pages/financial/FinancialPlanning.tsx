import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Plus, Edit2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FinancialPlan {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    budgetTarget: number;
    actualBudget: number;
    objectives: string[];
    status: "active" | "completed" | "archived";
    progress: number;
}

export default function FinancialPlanning() {
    const [plans, setPlans] = useState<FinancialPlan[]>([
        {
            id: "1",
            name: "خطة 2025",
            description: "خطة العام المالي 2025",
            startDate: "2025-01-01",
            endDate: "2025-12-31",
            budgetTarget: 5000000,
            actualBudget: 3200000,
            objectives: ["زيادة الإيرادات بـ 25%", "تقليل المصروفات بـ 15%", "تحسين الربحية"],
            status: "active",
            progress: 64,
        },
        {
            id: "2",
            name: "خطة التوسع",
            description: "خطة توسع العمليات الجديدة",
            startDate: "2025-03-01",
            endDate: "2025-09-30",
            budgetTarget: 2000000,
            actualBudget: 1100000,
            objectives: ["فتح فروع جديدة", "توظيف موظفي تسويق", "تطوير منتجات جديدة"],
            status: "active",
            progress: 55,
        },
    ]);

    const [showForm, setShowForm] = useState(false);

    // بيانات للرسم البياني
    const chartData = plans.map((plan) => ({
        name: plan.name,
        مستهدف: plan.budgetTarget,
        فعلي: plan.actualBudget,
    }));

    const progressData = plans.map((plan) => ({
        name: plan.name,
        "نسبة الإنجاز": plan.progress,
    }));

    const totalTarget = plans.reduce((sum, p) => sum + p.budgetTarget, 0);
    const totalActual = plans.reduce((sum, p) => sum + p.actualBudget, 0);
    const totalProgress = Math.round((totalActual / totalTarget) * 100);

    const statusData = [
        { name: "نشط", value: plans.filter((p) => p.status === "active").length },
        { name: "مكتمل", value: plans.filter((p) => p.status === "completed").length },
        { name: "مؤرشف", value: plans.filter((p) => p.status === "archived").length },
    ];

    const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

    const handleDelete = (id: string) => {
        setPlans(plans.filter((p) => p.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* رأس الصفحة */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">التخطيط المالي</h1>
                    <p className="text-gray-600 mt-1">إدارة وتتبع الخطط المالية الاستراتيجية</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    خطة جديدة
                </Button>
            </div>

            {/* المقاييس الرئيسية */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">إجمالي الميزانية المستهدفة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {(totalTarget / 1000000).toFixed(1)}M
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{plans.length} خطة نشطة</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">الميزانية المستخدمة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {(totalActual / 1000000).toFixed(1)}M
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{totalProgress}% من الإجمالي</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">المتبقي</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {((totalTarget - totalActual) / 1000000).toFixed(1)}M
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{100 - totalProgress}% متبقي</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">نسبة الإنجاز</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{totalProgress}%</div>
                        <p className="text-xs text-gray-500 mt-1">متوسط التقدم</p>
                    </CardContent>
                </Card>
            </div>

            {/* الرسوم البيانية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* مقارنة الميزانية */}
                <Card>
                    <CardHeader>
                        <CardTitle>مقارنة الميزانية</CardTitle>
                        <CardDescription>المستهدف مقابل الفعلي</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `${(value / 1000000).toFixed(1)}M`} />
                                <Legend />
                                <Bar dataKey="مستهدف" fill="#3b82f6" />
                                <Bar dataKey="فعلي" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* نسبة الإنجاز */}
                <Card>
                    <CardHeader>
                        <CardTitle>نسب الإنجاز</CardTitle>
                        <CardDescription>تقدم كل خطة</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={progressData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip formatter={(value: any) => `${value}%`} />
                                <Legend />
                                <Line type="monotone" dataKey="نسبة الإنجاز" stroke="#9333ea" strokeWidth={2} dot={{ fill: "#9333ea" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* حالة الخطط */}
                <Card>
                    <CardHeader>
                        <CardTitle>حالة الخطط</CardTitle>
                        <CardDescription>توزيع الخطط</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} (${value})`} outerRadius={80} fill="#8884d8" dataKey="value">
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* الأهداف العامة */}
                <Card>
                    <CardHeader>
                        <CardTitle>الأهداف الرئيسية</CardTitle>
                        <CardDescription>الأهداف الاستراتيجية للعام</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {plans.flatMap((p) => p.objectives).map((obj, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span className="text-gray-700">{obj}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* قائمة الخطط */}
            <Card>
                <CardHeader>
                    <CardTitle>الخطط المالية</CardTitle>
                    <CardDescription>إدارة جميع الخطط النشطة</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {plans.map((plan) => (
                            <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                                        <p className="text-sm text-gray-600">{plan.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                    <div>
                                        <p className="text-xs text-gray-600">المدة</p>
                                        <p className="text-sm font-medium">{plan.startDate} إلى {plan.endDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">الميزانية المستهدفة</p>
                                        <p className="text-sm font-medium">{(plan.budgetTarget / 1000000).toFixed(1)}M</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">المستخدم</p>
                                        <p className="text-sm font-medium text-green-600">{(plan.actualBudget / 1000000).toFixed(1)}M</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">الحالة</p>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${plan.status === "active" ? "bg-blue-100 text-blue-800" :
                                                plan.status === "completed" ? "bg-green-100 text-green-800" :
                                                    "bg-gray-100 text-gray-800"
                                            }`}>
                                            {plan.status === "active" ? "نشط" : plan.status === "completed" ? "مكتمل" : "مؤرشف"}
                                        </span>
                                    </div>
                                </div>

                                {/* شريط التقدم */}
                                <div className="mb-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-gray-700">نسبة الإنجاز</span>
                                        <span className="text-xs font-bold text-gray-900">{plan.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${plan.progress}%` }}></div>
                                    </div>
                                </div>

                                {/* التحذير إذا كان الإنفاق عالي */}
                                {(plan.actualBudget / plan.budgetTarget) > 0.85 && (
                                    <Alert className="bg-orange-50 border-orange-200">
                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                        <AlertDescription className="text-orange-800">
                                            تنبيه: الإنفاق قريب من الحد المستهدف ({Math.round((plan.actualBudget / plan.budgetTarget) * 100)}%)
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* نموذج إضافة خطة جديدة */}
            {showForm && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-900">خطة مالية جديدة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 text-sm">
                            ستتمكن قريباً من إضافة خطط مالية جديدة من هنا
                        </p>
                        <div className="mt-4 space-y-2">
                            <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
