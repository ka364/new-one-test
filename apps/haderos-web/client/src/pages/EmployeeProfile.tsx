// @ts-nocheck
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function EmployeeProfile() {
  const [, params] = useRoute("/hr/employee/:id");
  const [, setLocation] = useLocation();
  const employeeId = params?.id ? parseInt(params.id) : null;

  // Fetch employee details
  const { data: employee, isLoading, error } = trpc.hr.getEmployee.useQuery(
    { id: employeeId! },
    { enabled: !!employeeId }
  );

  // Fetch employee documents
  const { data: documents } = trpc.hr.getEmployeeDocuments.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  if (!employeeId) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>معرّف الموظف غير صالح</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل بيانات الموظف...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || "لم يتم العثور على الموظف"}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="ml-1 h-3 w-3" />
            تم التحقق
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="ml-1 h-3 w-3" />
            قيد المراجعة
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="ml-1 h-3 w-3" />
            مرفوض
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="ml-1 h-3 w-3" />
            غير متوفر
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي للموظف</h1>
            <p className="text-gray-600 mt-1">عرض تفاصيل الموظف وحالة وثائقه</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/hr/supervisors")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة
          </Button>
        </div>

        {/* Employee Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">الاسم الكامل</label>
                  <p className="text-lg font-semibold mt-1">{employee.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    الرقم القومي
                  </label>
                  <p className="text-lg font-mono mt-1">{employee.nationalId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    رقم الهاتف
                  </label>
                  <p className="text-lg mt-1" dir="ltr">{employee.phoneNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </label>
                  <p className="text-lg mt-1">{employee.email || "غير متوفر"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    المسمى الوظيفي
                  </label>
                  <p className="text-lg font-semibold mt-1">{employee.jobTitle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    القسم
                  </label>
                  <p className="text-lg mt-1">{employee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    الراتب
                  </label>
                  <p className="text-lg font-semibold mt-1">
                    {employee.salary ? `${employee.salary} جنيه` : "غير محدد"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    تاريخ التعيين
                  </label>
                  <p className="text-lg mt-1">
                    {new Date(employee.hireDate).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant={employee.role === "supervisor" ? "default" : "secondary"} className="text-sm">
                  {employee.role === "supervisor" ? "مشرف" : "موظف"}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {employee.contractType === "permanent" ? "عقد دائم" : "عقد مؤقت"}
                </Badge>
                {employee.parentId && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">تحت إشراف:</span> موظف رقم {employee.parentId}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              حالة الوثائق
            </CardTitle>
            <CardDescription>الوثائق المطلوبة وحالة التحقق منها</CardDescription>
          </CardHeader>
          <CardContent>
            {documents && documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">
                          {doc.documentType === "national_id" && "البطاقة الشخصية"}
                          {doc.documentType === "military_certificate" && "شهادة الخدمة العسكرية"}
                          {doc.documentType === "personal_photo" && "الصورة الشخصية"}
                          {doc.documentType === "birth_certificate" && "شهادة الميلاد"}
                          {doc.documentType === "qualification" && "المؤهل الدراسي"}
                        </p>
                        <p className="text-sm text-gray-600">
                          تم الرفع: {new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getDocumentStatusBadge(doc.verificationStatus)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>لا توجد وثائق مرفوعة حتى الآن</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Additional Notes */}
        {employee.verificationNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                ملاحظات التحقق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{employee.verificationNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
