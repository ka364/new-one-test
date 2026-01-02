import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, CheckCircle2, Calendar, User, Clock } from 'lucide-react';

interface EmployeeSession {
  accountId: number;
  employeeName: string;
  month: string;
  expiresAt: string;
}

export default function EmployeeDashboard() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [dataType, setDataType] = useState('');
  const [dataContent, setDataContent] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('employeeSession');
    if (!stored) {
      setLocation('/employee/login');
      return;
    }

    const parsed = JSON.parse(stored);

    // Check if expired
    if (new Date(parsed.expiresAt) < new Date()) {
      localStorage.removeItem('employeeSession');
      setLocation('/employee/login');
      return;
    }

    setSession(parsed);
  }, [setLocation]);

  const submissionsQuery = trpc.employees.getMySubmissions.useQuery(
    { accountId: session?.accountId || 0 },
    { enabled: !!session }
  );

  const submitMutation = trpc.employees.submitData.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setDataType('');
      setDataContent('');
      submissionsQuery.refetch();
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('employeeSession');
    setLocation('/employee/login');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    try {
      const dataJson = JSON.parse(dataContent);
      submitMutation.mutate({
        accountId: session.accountId,
        dataType,
        dataJson,
      });
    } catch (error) {
      alert('خطأ: البيانات يجب أن تكون بصيغة JSON صحيحة');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">مرحباً، {session.employeeName}</h1>
              <p className="text-sm text-gray-600 mt-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                الشهر: {session.month}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Submit Form */}
          <Card>
            <CardHeader>
              <CardTitle>إدخال بيانات جديدة</CardTitle>
              <CardDescription>أدخل البيانات الخاصة بشهر {session.month}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      تم حفظ البيانات بنجاح!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="dataType">نوع البيانات</Label>
                  <Input
                    id="dataType"
                    placeholder="مثال: مبيعات، مصروفات، حضور"
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value)}
                    required
                    disabled={submitMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataContent">البيانات (JSON)</Label>
                  <Textarea
                    id="dataContent"
                    placeholder='{"المبلغ": 1000, "التاريخ": "2024-12-18", "الملاحظات": "..."}'
                    value={dataContent}
                    onChange={(e) => setDataContent(e.target.value)}
                    required
                    disabled={submitMutation.isPending}
                    rows={8}
                    className="font-mono text-sm"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">💡 أدخل البيانات بصيغة JSON</p>
                </div>

                <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ البيانات'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Submissions History */}
          <Card>
            <CardHeader>
              <CardTitle>البيانات المحفوظة</CardTitle>
              <CardDescription>جميع البيانات التي أدخلتها هذا الشهر</CardDescription>
            </CardHeader>
            <CardContent>
              {submissionsQuery.isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : submissionsQuery.data && submissionsQuery.data.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {submissionsQuery.data.map((submission: any) => (
                    <div key={submission.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{submission.dataType}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(submission.submittedAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <pre
                        className="text-xs bg-white p-2 rounded border overflow-x-auto"
                        dir="ltr"
                      >
                        {JSON.stringify(submission.dataJson, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>لم تقم بإدخال أي بيانات بعد</p>
                  <p className="text-sm mt-2">ابدأ بإدخال البيانات من النموذج</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">معلومات الحساب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">اسم الموظف</p>
                  <p className="font-medium">{session.employeeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">الشهر المخصص</p>
                  <p className="font-medium">{session.month}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">ينتهي في</p>
                  <p className="font-medium">
                    {new Date(session.expiresAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
