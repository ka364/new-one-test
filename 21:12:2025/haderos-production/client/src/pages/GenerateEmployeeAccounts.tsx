import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Download, CheckCircle2, Calendar, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function GenerateEmployeeAccounts() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [employeeNames, setEmployeeNames] = useState("");
  const [success, setSuccess] = useState(false);
  const [excelData, setExcelData] = useState<{ data: string; filename: string } | null>(null);

  const generateMutation = trpc.employees.generateAccounts.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      setExcelData({ data: data.excelFile, filename: data.fileName });
      setEmployeeNames("");
      setTimeout(() => setSuccess(false), 5000);
    },
  });

  const activeAccountsQuery = trpc.employees.getActiveAccounts.useQuery(
    { month },
    { enabled: !!month }
  );

  const logsQuery = trpc.employees.getGenerationLogs.useQuery({ limit: 10 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const names = employeeNames
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) {
      alert("الرجاء إدخال أسماء الموظفين");
      return;
    }

    generateMutation.mutate({
      employeeNames: names,
      month,
    });
  };

  const handleDownloadExcel = () => {
    if (!excelData) return;

    const blob = new Blob(
      [Uint8Array.from(atob(excelData.data), c => c.charCodeAt(0))],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = excelData.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">إدارة حسابات الموظفين</h1>
          <p className="text-muted-foreground mt-2">
            توليد حسابات شهرية للموظفين وتوزيع معلومات الدخول
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Generate Form */}
          <Card>
            <CardHeader>
              <CardTitle>توليد حسابات جديدة</CardTitle>
              <CardDescription>
                إنشاء حسابات مؤقتة للموظفين لشهر محدد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      تم إنشاء الحسابات بنجاح! قم بتنزيل ملف Excel وتوزيعه على الموظفين.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="month">الشهر</Label>
                  <Input
                    id="month"
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                    disabled={generateMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="names">أسماء الموظفين (كل اسم في سطر)</Label>
                  <textarea
                    id="names"
                    className="w-full min-h-[200px] p-3 border rounded-md"
                    placeholder="أحمد محمد&#10;فاطمة علي&#10;محمود حسن&#10;..."
                    value={employeeNames}
                    onChange={(e) => setEmployeeNames(e.target.value)}
                    required
                    disabled={generateMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 أدخل اسم كل موظف في سطر منفصل
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      إنشاء الحسابات
                    </>
                  )}
                </Button>

                {excelData && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleDownloadExcel}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    تنزيل ملف Excel
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Active Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>الحسابات النشطة</CardTitle>
              <CardDescription>
                الحسابات النشطة لشهر {month}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAccountsQuery.isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : activeAccountsQuery.data && activeAccountsQuery.data.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activeAccountsQuery.data.map((account: any) => (
                    <div
                      key={account.id}
                      className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{account.employeeName}</p>
                        <p className="text-xs text-gray-600" dir="ltr">
                          {account.username}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>ينتهي في:</p>
                        <p>{new Date(account.expiresAt).toLocaleDateString("ar-EG")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد حسابات نشطة لهذا الشهر</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generation Logs */}
        <Card>
          <CardHeader>
            <CardTitle>سجل التوليد</CardTitle>
            <CardDescription>
              آخر عمليات إنشاء الحسابات
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsQuery.isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : logsQuery.data && logsQuery.data.length > 0 ? (
              <div className="space-y-2">
                {logsQuery.data.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-medium">شهر {log.month}</p>
                        <p className="text-xs text-gray-600">
                          {log.accountsGenerated} حساب
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>لا يوجد سجل بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
