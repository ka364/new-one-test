import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Lock, Shield } from "lucide-react";

export default function EmployeeLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load remembered username on mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem("employee_remembered_username");
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

  const loginMutation = trpc.employeeAuth.loginWithPassword.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Store session
        localStorage.setItem("employee_session", data.sessionToken || "");
        localStorage.setItem("employee_data", JSON.stringify(data.employee));

        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem("employee_remembered_username", username);
        } else {
          localStorage.removeItem("employee_remembered_username");
        }

        setSuccess("تم تسجيل الدخول بنجاح!");
        
        // Redirect based on email status
        setTimeout(() => {
          if (data.needsEmailRegistration) {
            navigate("/employee/register-email");
          } else {
            navigate("/employee-dashboard");
          }
        }, 1000);
      } else {
        setError(data.error || "فشل تسجيل الدخول");
      }
    },
    onError: (err: any) => {
      setError(err.message || "حدث خطأ في تسجيل الدخول");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    loginMutation.mutate({ username, password });
  };

  const isLoading = loginMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل دخول الموظفين</CardTitle>
          <CardDescription>أدخل بيانات الدخول الخاصة بك</CardDescription>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <div className="relative">
                <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
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

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  تذكرني
                </Label>
              </div>
              <a
                href="/employee/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                هل نسيت كلمة المرور؟
              </a>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                type="button"
                onClick={() => navigate("/")}
                className="text-sm"
              >
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>نظام HaderOS - الأعمال الأخلاقية المدعومة بالذكاء الاصطناعي</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
