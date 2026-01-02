import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface OTPVerificationProps {
  phoneNumber: string;
  email?: string;
  onVerified: () => void;
  onBack: () => void;
  sendOTP: () => Promise<{ method: 'email' | 'sms'; expiresAt: string; otpCode?: string }>;
  verifyOTP: (code: string) => Promise<{ success: boolean }>;
}

export default function OTPVerification({
  phoneNumber,
  email,
  onVerified,
  onBack,
  sendOTP,
  verifyOTP,
}: OTPVerificationProps) {
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [otpMethod, setOtpMethod] = useState<'email' | 'sms'>('email');

  // Send OTP on mount
  useEffect(() => {
    handleSendOTP();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async () => {
    setIsSending(true);
    setError('');
    try {
      const result = await sendOTP();
      setOtpMethod(result.method);
      setCountdown(300);
      setCanResend(false);

      // Development mode: show OTP
      if (result.otpCode) {
        console.log('🔐 OTP Code (DEV MODE):', result.otpCode);
      }
    } catch (err: any) {
      setError(err.message || 'فشل إرسال رمز التحقق');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyOTP(otpCode);
      if (result.success) {
        onVerified();
      }
    } catch (err: any) {
      setError(err.message || 'رمز التحقق غير صحيح');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpCode('');
    await handleSendOTP();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-center">
          <Clock className="h-5 w-5 text-blue-600" />
          التحقق من رقم الهاتف
        </CardTitle>
        <CardDescription className="text-center">
          تم إرسال رمز التحقق إلى {phoneNumber}
          {otpMethod === 'email' && email && ` و ${email}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Countdown Timer */}
        <div className="text-center">
          <div
            className={`text-5xl font-bold ${countdown > 60 ? 'text-blue-600' : 'text-red-600'}`}
          >
            {formatCountdown(countdown)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {countdown > 0 ? 'الوقت المتبقي للتحقق' : 'انتهت صلاحية الرمز'}
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-2">
          <Label htmlFor="otpCode" className="text-center block">
            أدخل رمز التحقق (6 أرقام)
          </Label>
          <Input
            id="otpCode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            className="text-center text-3xl tracking-widest font-bold"
            placeholder="000000"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && otpCode.length === 6) {
                handleVerifyOTP();
              }
            }}
          />
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleVerifyOTP}
            disabled={otpCode.length !== 6 || isVerifying || countdown === 0}
            className="w-full"
            size="lg"
          >
            {isVerifying ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              <>
                <CheckCircle2 className="ml-2 h-5 w-5" />
                تحقق
              </>
            )}
          </Button>

          <Button
            onClick={handleResendOTP}
            disabled={!canResend || isSending}
            variant="outline"
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              'إعادة إرسال الرمز'
            )}
          </Button>

          <Button onClick={onBack} variant="ghost" className="w-full">
            العودة للبيانات
          </Button>
        </div>

        <Alert>
          <AlertDescription className="text-sm text-center">
            💡 <strong>نصيحة:</strong> تحقق من صندوق البريد الإلكتروني أو الرسائل النصية
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
