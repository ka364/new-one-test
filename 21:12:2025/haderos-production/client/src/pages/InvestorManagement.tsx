import { useState } from "react";
import { Users, Plus, Eye, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

export default function InvestorManagement() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    investmentInterest: "",
    notes: ""
  });

  const investorsQuery = trpc.investors.getAllInvestors.useQuery();
  
  const createMutation = trpc.investors.createInvestor.useMutation({
    onSuccess: (data) => {
      toast.success("تم إنشاء حساب المستثمر بنجاح", {
        description: `البريد: ${data.email}\nكلمة المرور: ${data.password}`
      });
      setShowForm(false);
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        password: "",
        investmentInterest: "",
        notes: ""
      });
      investorsQuery.refetch();
    },
    onError: (error) => {
      toast.error("خطأ في إنشاء الحساب", {
        description: error.message
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    createMutation.mutate({
      ...formData,
      investmentInterest: formData.investmentInterest ? parseFloat(formData.investmentInterest) : undefined,
      createdBy: 1, // TODO: Get from auth context
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة المستثمرين</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              إنشاء حسابات للمستثمرين وتتبع نشاطهم
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة مستثمر
          </Button>
        </div>

        {/* Create Investor Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>إنشاء حساب مستثمر جديد</CardTitle>
              <CardDescription>
                سيتم إنشاء حساب للمستثمر مع كلمة مرور يمكنك مشاركتها معه
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">الشركة</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور *</Label>
                    <Input
                      id="password"
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="8 أحرف على الأقل"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investment">مبلغ الاستثمار المتوقع</Label>
                    <Input
                      id="investment"
                      type="number"
                      value={formData.investmentInterest}
                      onChange={(e) => setFormData({...formData, investmentInterest: e.target.value})}
                      placeholder="2000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    placeholder="أي ملاحظات إضافية عن المستثمر..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Investors List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              المستثمرون
            </CardTitle>
            <CardDescription>
              {investorsQuery.data?.length || 0} مستثمر مسجل
            </CardDescription>
          </CardHeader>
          <CardContent>
            {investorsQuery.isLoading ? (
              <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
            ) : investorsQuery.data && investorsQuery.data.length > 0 ? (
              <div className="space-y-3">
                {investorsQuery.data.map((investor) => (
                  <div 
                    key={investor.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{investor.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {investor.email}
                      </p>
                      {investor.company && (
                        <p className="text-sm text-gray-500">{investor.company}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-left mr-4">
                        <p className="text-xs text-gray-500">الحالة</p>
                        <span className={`text-sm font-medium ${
                          investor.status === 'active' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {investor.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Activity className="w-4 h-4" />
                        النشاط
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا يوجد مستثمرون بعد. ابدأ بإضافة أول مستثمر!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
