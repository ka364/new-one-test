import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, CheckCircle2, AlertCircle, User, IdCard, FileText } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import OTPVerification from "@/components/OTPVerification";

export default function RegisterEmployee() {
  const [step, setStep] = useState<"upload" | "review" | "otp" | "complete">("upload");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    idFront?: File;
    idBack?: File;
    militaryCert?: File;
    photo?: File;
  }>({});

  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    dateOfBirth: "",
    gender: "",
    religion: "",
    maritalStatus: "",
    address: "",
    governorate: "",
    phoneNumber: "",
    email: "",
    jobTitle: "",
    department: "",
    salary: "",
    hireDate: new Date().toISOString().split('T')[0],
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get supervisor stats
  const { data: stats } = trpc.hr.stats.useQuery();

  // Upload document mutation
  const uploadDocument = trpc.hr.uploadDocument.useMutation();

  // Extract ID data mutation
  const extractIdData = trpc.hr.extractIdData.useMutation({
    onSuccess: (result) => {
      const data = result.data || {};
      setExtractedData(data);
      // Auto-fill form with extracted data
      setFormData({
        ...formData,
        fullName: data.fullName || data.full_name || "",
        nationalId: data.nationalId || data.national_id || "",
        dateOfBirth: data.dateOfBirth || data.date_of_birth || "",
        gender: data.gender || "",
        religion: data.religion || "",
        maritalStatus: data.maritalStatus || data.marital_status || "",
        address: data.address || "",
        governorate: data.governorate || "",
      });
      setIsExtracting(false);
      setStep("review");
      setSuccess("تم استخراج البيانات بنجاح! ✅ يرجى مراجعة البيانات قبل الحفظ");
    },
    onError: (err) => {
      setError("فشل استخراج البيانات: " + err.message);
      setIsExtracting(false);
    },
  });

  // Create employee mutation
  const createEmployee = trpc.hr.createEmployee.useMutation({
    onSuccess: () => {
      setSuccess("تم تسجيل الموظف بنجاح! ✅");
      setStep("complete");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // OTP mutations
  const sendOTPMutation = trpc.hr.sendOTP.useMutation();
  const verifyOTPMutation = trpc.hr.verifyOTP.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof uploadedFiles) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles({ ...uploadedFiles, [type]: file });
    }
  };

  const handleExtractData = async () => {
    if (!uploadedFiles.idFront) {
      setError("الرجاء رفع صورة البطاقة (الوجه الأمامي)");
      return;
    }

    setIsExtracting(true);
    setError("");

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Upload to S3 first
        const uploadResult = await uploadDocument.mutateAsync({
          employeeId: 0, // Will be set after employee creation
          documentType: "national_id",
          documentName: uploadedFiles.idFront!.name,
          fileData: base64,
          mimeType: uploadedFiles.idFront!.type,
        });

        // Extract data using AI
        await extractIdData.mutateAsync({
          documentId: uploadResult.documentId || 0,
          imageUrl: uploadResult.fileUrl,
        });
      };
      reader.readAsDataURL(uploadedFiles.idFront);
    } catch (err: any) {
      setError("خطأ في رفع الملف: " + err.message);
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName || !formData.nationalId || !formData.phoneNumber) {
      setError("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    if (formData.nationalId.length !== 14) {
      setError("الرقم القومي يجب أن يكون 14 رقم");
      return;
    }

    // Move to OTP step
    setStep("otp");
  };

  // Handle OTP send
  const handleSendOTP = async () => {
    try {
      const result = await sendOTPMutation.mutateAsync({
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        latitude: undefined,
        longitude: undefined,
      });
      return {
        method: result.method,
        expiresAt: result.expiresAt.toISOString(),
        otpCode: result.otpCode,
      };
    } catch (err: any) {
      throw new Error(err.message || "فشل إرسال رمز التحقق");
    }
  };

  // Handle OTP verify
  const handleVerifyOTP = async (code: string) => {
    try {
      const result = await verifyOTPMutation.mutateAsync({
        phoneNumber: formData.phoneNumber,
        otpCode: code,
      });
      return result;
    } catch (err: any) {
      throw new Error(err.message || "رمز التحقق غير صحيح");
    }
  };

  // Handle OTP verified - create employee
  const handleOTPVerified = async () => {
    await createEmployee.mutateAsync({
      ...formData,
      supervisorId: 1, // TODO: Get from context
      salary: formData.salary ? parseFloat(formData.salary) : undefined,
    });
  };

  const employeesCount = stats?.employees || 0;
  const remainingEmployees = 7 - employeesCount;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">تسجيل موظف جديد</h1>
            <p className="text-gray-600 mt-2">
              استخراج تلقائي للبيانات من البطاقة الشخصية باستخدام الذكاء الاصطناعي
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">الموظفين الحاليين</CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{employeesCount}/7</div>
              <p className="text-xs text-gray-600 mt-1">
                {remainingEmployees} متبقي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">الخطوة الحالية</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-600">
                {step === "upload" && "1. رفع المستندات"}
                {step === "review" && "2. مراجعة البيانات"}
                {step === "otp" && "3. التحقق بـ OTP"}
                {step === "complete" && "4. مكتمل"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">حالة الاستخراج</CardTitle>
              <IdCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {extractedData ? "✅ تم الاستخراج" : "⏳ في الانتظار"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step 1: Upload Documents */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                الخطوة 1: رفع المستندات المطلوبة
              </CardTitle>
              <CardDescription>
                قم برفع صورة البطاقة الشخصية (الوجه الأمامي والخلفي) والمستندات الأخرى
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* ID Card Front */}
              <div className="space-y-2">
                <Label htmlFor="idFront" className="text-lg font-semibold">
                  صورة البطاقة (الوجه الأمامي) * 🆔
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="idFront"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "idFront")}
                    className="flex-1"
                  />
                  {uploadedFiles.idFront && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
                {uploadedFiles.idFront && (
                  <p className="text-sm text-green-600">
                    ✅ تم رفع: {uploadedFiles.idFront.name}
                  </p>
                )}
              </div>

              {/* ID Card Back */}
              <div className="space-y-2">
                <Label htmlFor="idBack" className="text-lg font-semibold">
                  صورة البطاقة (الوجه الخلفي)
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="idBack"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "idBack")}
                    className="flex-1"
                  />
                  {uploadedFiles.idBack && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              {/* Military Certificate */}
              <div className="space-y-2">
                <Label htmlFor="militaryCert" className="text-lg font-semibold">
                  شهادة إنهاء الخدمة العسكرية (للذكور)
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="militaryCert"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "militaryCert")}
                    className="flex-1"
                  />
                  {uploadedFiles.militaryCert && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              {/* Personal Photo */}
              <div className="space-y-2">
                <Label htmlFor="photo" className="text-lg font-semibold">
                  صورة شخصية حديثة *
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "photo")}
                    className="flex-1"
                  />
                  {uploadedFiles.photo && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              {/* Extract Button */}
              <Button
                onClick={handleExtractData}
                disabled={!uploadedFiles.idFront || isExtracting}
                className="w-full"
                size="lg"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري استخراج البيانات من البطاقة...
                  </>
                ) : (
                  <>
                    <IdCard className="ml-2 h-5 w-5" />
                    استخراج البيانات تلقائياً من البطاقة
                  </>
                )}
              </Button>

              <Alert>
                <AlertDescription className="text-sm">
                  💡 <strong>نصيحة:</strong> تأكد من أن صورة البطاقة واضحة وغير مشوشة للحصول على أفضل نتائج استخراج
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review & Edit Data */}
        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                الخطوة 2: مراجعة وتعديل البيانات المستخرجة
              </CardTitle>
              <CardDescription>
                تم استخراج البيانات تلقائياً. يرجى مراجعتها وتعديل أي معلومات غير صحيحة
              </CardDescription>
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
                  {/* Extracted Data Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={extractedData?.fullName ? "border-green-500 bg-green-50" : ""}
                    />
                    {extractedData?.fullName && (
                      <p className="text-xs text-green-600">✅ مستخرج تلقائياً</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationalId">الرقم القومي * (14 رقم)</Label>
                    <Input
                      id="nationalId"
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      maxLength={14}
                      className={extractedData?.nationalId ? "border-green-500 bg-green-50" : ""}
                    />
                    {extractedData?.nationalId && (
                      <p className="text-xs text-green-600">✅ مستخرج تلقائياً</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">تاريخ الميلاد</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className={extractedData?.dateOfBirth ? "border-green-500 bg-green-50" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">الجنس</Label>
                    <Input
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className={extractedData?.gender ? "border-green-500 bg-green-50" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={extractedData?.address ? "border-green-500 bg-green-50" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="governorate">المحافظة</Label>
                    <Input
                      id="governorate"
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className={extractedData?.governorate ? "border-green-500 bg-green-50" : ""}
                    />
                  </div>

                  {/* Manual Entry Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">رقم الهاتف *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="01012345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">المسمى الوظيفي *</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">القسم *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary">الراتب (جنيه)</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hireDate">تاريخ التعيين</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("upload")}
                    className="flex-1"
                  >
                    رجوع
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEmployee.isPending}
                    className="flex-1"
                  >
                    {createEmployee.isPending ? "جاري التسجيل..." : "تسجيل الموظف"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: OTP Verification */}
        {step === "otp" && (
          <OTPVerification
            phoneNumber={formData.phoneNumber}
            email={formData.email}
            onVerified={handleOTPVerified}
            onBack={() => setStep("review")}
            sendOTP={handleSendOTP}
            verifyOTP={handleVerifyOTP}
          />
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                تم تسجيل الموظف بنجاح!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <AlertDescription>
                  ✅ تم إنشاء حساب الموظف وإرسال بيانات الدخول إليه
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => {
                  setStep("upload");
                  setExtractedData(null);
                  setUploadedFiles({});
                  setFormData({
                    fullName: "",
                    nationalId: "",
                    dateOfBirth: "",
                    gender: "",
                    religion: "",
                    maritalStatus: "",
                    address: "",
                    governorate: "",
                    phoneNumber: "",
                    email: "",
                    jobTitle: "",
                    department: "",
                    salary: "",
                    hireDate: new Date().toISOString().split('T')[0],
                  });
                }}
                className="w-full"
              >
                تسجيل موظف آخر
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
