import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Key, ArrowRight } from "lucide-react";

export default function EmployeeForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const requestResetMutation = trpc.employeeAuth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setEmployeeId(data.employeeId!);
        setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني المسجل");
        setTimeout(() => {
          setStep("otp");
          setSuccess("");
        }, 2000);
      } else {
        setError(data.error || "فشل إرسال رمز التحقق");
      }
    },
    onError: (err: any) => {
      setError(err.message || "حدث خطأ في إرسال رمز التحقق");
    },
  });

  const verifyOtpMutation = trpc.employeeAuth.verifyResetOTP.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccess("تم التحقق بنجاح! يمكنك الآن تعيين كلمة مرور جديدة");
        setTimeout(() => {
          setStep("password");
          setSuccess("");
        }, 1500);
      } else {
        setError(data.error || "رمز التحقق غير صحيح");
      }
    },
    onError: (err: any) => {
      setError(err.message || "حدث خطأ في التحقق");
    },
  });

  const resetPasswordMutation = trpc.employeeAuth.resetPassword.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccess("تم تغيير كلمة المرور بنجاح! جاري التحويل...");
        setTimeout(() => {
          navigate("/employee/login");
        }, 2000);
      } else {
        setError(data.error || "فشل تغيير كلمة المرور");
      }
    },
    onError: (err: any) => {
      setError(err.message || "حدث خطأ في تغيير كلمة المرور");
    },
  });

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username) {
      setError("الرجاء إدخال اسم المستخدم");
      return;
    }

    requestResetMutation.mutate({ username });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("الرجاء إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    if (!employeeId) {
      setError("حدث خطأ، الرجاء المحاولة مرة أخرى");
      return;
    }

    verifyOtpMutation.mutate({ employeeId, otp });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || newPassword.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    if (!employeeId) {
      setError("حدث خطأ، الرجاء المحاولة مرة أخرى");
      return;
    }

    resetPasswordMutation.mutate({ employeeId, newPassword });
  };

  const isLoading = requestResetMutation.isPending || verifyOtpMutation.isPending || resetPasswordMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Key className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "email" && "نسيت كلمة المرور"}
            {step === "otp" && "تحقق من البريد الإلكتروني"}
            {step === "password" && "تعيين كلمة مرور جديدة"}
          </CardTitle>
          <CardDescription>
            {step === "email" && "أدخل اسم المستخدم لإرسال رمز التحقق"}
            {step === "otp" && "أدخل رمز التحقق المرسل إلى بريدك"}
            {step === "password" && "أدخل كلمة المرور الجديدة"}
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

          {/* Step 1: Request Reset */}
          {step === "email" && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="sara.ahmed"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pr-10"
                    required
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    إرسال رمز التحقق
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/employee/login")}
                disabled={isLoading}
              >
                العودة لتسجيل الدخول
              </Button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">رمز التحقق (6 أرقام)</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  required
                  disabled={isLoading}
                  maxLength={6}
                  dir="ltr"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "تحقق"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep("email")}
                disabled={isLoading}
              >
                العودة
              </Button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  dir="ltr"
                />
                <p className="text-xs text-gray-500">يجب أن تكون 8 أحرف على الأقل</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  dir="ltr"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التغيير...
                  </>
                ) : (
                  "تغيير كلمة المرور"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
