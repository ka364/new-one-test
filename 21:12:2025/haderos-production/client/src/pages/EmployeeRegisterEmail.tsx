import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle } from "lucide-react";

export default function EmployeeRegisterEmail() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [employeeData, setEmployeeData] = useState<any>(null);

  useEffect(() => {
    // Get employee data from localStorage
    const data = localStorage.getItem("employee_data");
    if (!data) {
      navigate("/employee/login");
      return;
    }
    setEmployeeData(JSON.parse(data));
  }, [navigate]);

  const registerEmailMutation = trpc.employeeAuth.registerEmail.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
        setStep("otp");
      } else {
        setError(data.error || "فشل تسجيل البريد الإلكتروني");
      }
    },
    onError: (err: any) => {
      setError(err.message || "حدث خطأ في تسجيل البريد الإلكتروني");
    },
  });

  const verifyOTPMutation = trpc.employeeAuth.verifyOTP.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Store session
        localStorage.setItem("employee_session", data.sessionToken || "");
        localStorage.setItem("employee_data", JSON.stringify(data.employee));

        setSuccess("تم التحقق بنجاح! جاري التحويل...");
        setTimeout(() => {
          navigate("/employee-dashboard");
        }, 1500);
      } else {
        setError(data.error || "فشل التحقق من الرمز");
      }
    },
    onError: (err: any) => {
      setError(err.message || "حدث خطأ في التحقق من الرمز");
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("الرجاء إدخال البريد الإلكتروني");
      return;
    }

    if (!employeeData?.id) {
      setError("بيانات الموظف غير موجودة");
      return;
    }

    registerEmailMutation.mutate({
      employeeId: employeeData.id,
      email,
    });
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("الرجاء إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    if (!employeeData?.id) {
      setError("بيانات الموظف غير موجودة");
      return;
    }

    verifyOTPMutation.mutate({
      employeeId: employeeData.id,
      otp,
    });
  };

  const isLoading = registerEmailMutation.isPending || verifyOTPMutation.isPending;

  if (!employeeData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              {step === "email" ? (
                <Mail className="w-10 h-10 text-white" />
              ) : (
                <CheckCircle className="w-10 h-10 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "email" ? "تسجيل البريد الإلكتروني" : "التحقق من البريد"}
          </CardTitle>
          <CardDescription>
            {step === "email"
              ? "أدخل بريدك الإلكتروني (Gmail) لاستقبال رمز التحقق"
              : "أدخل رمز التحقق المرسل إلى بريدك"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني (Gmail)</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                    required
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  سيتم إرسال رمز التحقق (OTP) إلى هذا البريد
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال رمز التحقق"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">رمز التحقق (OTP)</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  disabled={isLoading}
                  dir="ltr"
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-sm text-gray-600">
                  تم إرسال الرمز إلى: <span className="font-mono">{email}</span>
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "تأكيد"
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-sm"
                  disabled={isLoading}
                >
                  تغيير البريد الإلكتروني
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>نظام HaderOS - الأعمال الأخلاقية المدعومة بالذكاء الاصطناعي</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
