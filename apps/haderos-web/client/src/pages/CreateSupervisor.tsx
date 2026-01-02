import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserPlus,
  Briefcase,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Link } from 'wouter';

export default function CreateSupervisor() {
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phoneNumber: '',
    email: '',
    jobTitle: '',
    department: '',
    salary: '',
    hireDate: new Date().toISOString().split('T')[0],
    contractType: 'permanent',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get HR stats
  const { data: stats } = trpc.hr.stats.useQuery();

  // Get all supervisors
  const { data: supervisors, refetch: refetchSupervisors } = trpc.hr.getAllSupervisors.useQuery();

  // Create supervisor mutation
  const createSupervisor = trpc.hr.createSupervisor.useMutation({
    onSuccess: () => {
      setSuccess('تم إنشاء حساب المشرف بنجاح! ✅');
      setError('');
      setFormData({
        fullName: '',
        nationalId: '',
        phoneNumber: '',
        email: '',
        jobTitle: '',
        department: '',
        salary: '',
        hireDate: new Date().toISOString().split('T')[0],
        contractType: 'permanent',
      });
      refetchSupervisors();
    },
    onError: (err) => {
      setError(err.message);
      setSuccess('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.fullName || !formData.nationalId || !formData.phoneNumber) {
      setError('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.nationalId.length !== 14) {
      setError('الرقم القومي يجب أن يكون 14 رقم');
      return;
    }

    createSupervisor.mutate({
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : undefined,
    });
  };

  const supervisorsCount = supervisors?.length || 0;
  const remainingSupervisors = 7 - supervisorsCount;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المشرفين</h1>
            <p className="text-gray-600 mt-2">
              إنشاء وإدارة حسابات المشرفين (الحد الأقصى: 7 مشرفين)
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المشرفين الحاليين</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{supervisorsCount}/7</div>
              <p className="text-xs text-gray-600 mt-1">{remainingSupervisors} متبقي</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
              <Briefcase className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.employees || 0}</div>
              <p className="text-xs text-gray-600 mt-1">موظف نشط</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">الوثائق المعتمدة</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats?.verified || 0}</div>
              <p className="text-xs text-gray-600 mt-1">حساب معتمد</p>
            </CardContent>
          </Card>
        </div>

        {/* Create Supervisor Form */}
        {remainingSupervisors > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                إضافة مشرف جديد
              </CardTitle>
              <CardDescription>يمكنك إضافة {remainingSupervisors} مشرف آخر</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 text-green-900 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="أحمد محمد علي"
                      required
                    />
                  </div>

                  {/* National ID */}
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">الرقم القومي * (14 رقم)</Label>
                    <Input
                      id="nationalId"
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      placeholder="12345678901234"
                      maxLength={14}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      رقم الهاتف *
                    </Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="01012345678"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="supervisor@example.com"
                    />
                  </div>

                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">المسمى الوظيفي *</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="مشرف المبيعات"
                      required
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="department">القسم *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="قسم المبيعات"
                      required
                    />
                  </div>

                  {/* Salary */}
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      الراتب (جنيه)
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="5000"
                    />
                  </div>

                  {/* Hire Date */}
                  <div className="space-y-2">
                    <Label htmlFor="hireDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      تاريخ التعيين
                    </Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createSupervisor.isPending}>
                  {createSupervisor.isPending ? 'جاري الإنشاء...' : 'إنشاء حساب المشرف'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <AlertDescription>
              لقد وصلت للحد الأقصى من المشرفين (7 مشرفين). لا يمكن إضافة المزيد.
            </AlertDescription>
          </Alert>
        )}

        {/* Supervisors List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>قائمة المشرفين ({supervisorsCount})</CardTitle>
                <CardDescription>جميع المشرفين المسجلين في النظام</CardDescription>
              </div>
              <Link href="/hr/register">
                <Button variant="outline" size="sm">
                  <UserPlus className="ml-2 h-4 w-4" />
                  تسجيل موظف جديد
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {supervisors && supervisors.length > 0 ? (
              <div className="space-y-4">
                {supervisors.map((supervisor: any) => (
                  <div
                    key={supervisor.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {supervisor.full_name || supervisor.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {supervisor.job_title || supervisor.jobTitle} - {supervisor.department}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        📱 {supervisor.phone_number || supervisor.phoneNumber} | 🆔{' '}
                        {supervisor.national_id || supervisor.nationalId}
                      </p>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        الموظفين: {supervisor.children_count || supervisor.childrenCount || 0}/7
                      </div>
                      <div className="text-xs text-gray-500">
                        {supervisor.is_active || supervisor.isActive ? 'نشط' : 'غير نشط'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد مشرفين بعد</p>
                <p className="text-sm mt-2">ابدأ بإضافة مشرف جديد من النموذج أعلاه</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
