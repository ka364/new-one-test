/**
 * Two-Factor Authentication Setup Page
 * Allows users to enable/disable 2FA for their account
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Key, Copy, Check, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

type SetupStep = 'initial' | 'scan' | 'verify' | 'backup-codes' | 'complete';

export default function TwoFactorSetup() {
  const [step, setStep] = useState<SetupStep>('initial');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [password, setPassword] = useState('');

  const { data: status, refetch: refetchStatus } = trpc.twoFactor.status.useQuery();

  const setupMutation = trpc.twoFactor.setup.useMutation({
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('scan');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyMutation = trpc.twoFactor.verify.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep('backup-codes');
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const disableMutation = trpc.twoFactor.disable.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchStatus();
      setStep('initial');
      setPassword('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStartSetup = () => {
    setupMutation.mutate();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    verifyMutation.mutate({ token });
  };

  const handleDisable = (e: React.FormEvent) => {
    e.preventDefault();
    disableMutation.mutate({ password });
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success('Backup codes copied to clipboard');
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const codesText = `HADEROS AI CLOUD - 2FA Backup Codes
Generated: ${new Date().toLocaleDateString()}

IMPORTANT: Keep these codes in a safe place!
Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

---
If you lose access to your authenticator app, you can use one of these codes to log in.
After using all codes, you'll need to disable and re-enable 2FA.
`;

    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haderos-2fa-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  const handleComplete = () => {
    setStep('complete');
    refetchStatus();
  };

  if (status?.enabled && step === 'initial') {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              المصادقة الثنائية مُفعّلة
            </CardTitle>
            <CardDescription>حسابك محمي بطبقة أمان إضافية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>آخر استخدام:</strong>{' '}
                {status.lastUsed
                  ? new Date(status.lastUsed).toLocaleString('ar')
                  : 'لم يتم الاستخدام بعد'}
                <br />
                <strong>رموز احتياطية متبقية:</strong> {status.backupCodesRemaining}
              </AlertDescription>
            </Alert>

            <form onSubmit={handleDisable} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور لتعطيل 2FA"
                  required
                />
              </div>

              <Button type="submit" variant="destructive" disabled={disableMutation.isPending}>
                {disableMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تعطيل المصادقة الثنائية
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6">
      {/* Initial Step */}
      {step === 'initial' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              إعداد المصادقة الثنائية
            </CardTitle>
            <CardDescription>احم حسابك بطبقة أمان إضافية باستخدام تطبيق المصادقة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">ما هي المصادقة الثنائية؟</h3>
              <p className="text-sm text-muted-foreground">
                المصادقة الثنائية (2FA) تضيف طبقة أمان إضافية لحسابك. بالإضافة إلى كلمة المرور،
                ستحتاج إلى إدخال رمز مؤقت من تطبيق المصادقة على هاتفك.
              </p>

              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">التطبيقات المدعومة:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Google Authenticator</li>
                  <li>• Microsoft Authenticator</li>
                  <li>• Authy</li>
                  <li>• 1Password</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={handleStartSetup}
              disabled={setupMutation.isPending}
              className="w-full"
            >
              {setupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ابدأ الإعداد
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scan QR Code Step */}
      {step === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle>مسح رمز QR</CardTitle>
            <CardDescription>استخدم تطبيق المصادقة لمسح الرمز التالي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              {qrCode && (
                <img src={qrCode} alt="QR Code" className="border rounded-lg p-4 bg-white" />
              )}

              <div className="w-full space-y-2">
                <Label>أو أدخل الرمز يدوياً:</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      toast.success('تم نسخ الرمز');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep('verify')} className="w-full">
              التالي
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verify Token Step */}
      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle>التحقق من الرمز</CardTitle>
            <CardDescription>أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">رمز التحقق</Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('scan')}
                  className="flex-1"
                >
                  رجوع
                </Button>
                <Button
                  type="submit"
                  disabled={verifyMutation.isPending || token.length !== 6}
                  className="flex-1"
                >
                  {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  تحقق وتفعيل
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes Step */}
      {step === 'backup-codes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-6 w-6" />
              رموز الاسترجاع الاحتياطية
            </CardTitle>
            <CardDescription>
              احفظ هذه الرموز في مكان آمن. يمكنك استخدامها للدخول إذا فقدت جهازك.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>مهم جداً:</strong> كل رمز يمكن استخدامه مرة واحدة فقط. لن تتمكن من رؤية هذه
                الرموز مرة أخرى!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
              {backupCodes.map((code, i) => (
                <div key={i} className="font-mono text-sm bg-white p-2 rounded border text-center">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyBackupCodes} className="flex-1">
                {copiedCodes ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                نسخ الرموز
              </Button>
              <Button variant="outline" onClick={handleDownloadBackupCodes} className="flex-1">
                تحميل
              </Button>
            </div>

            <Button onClick={handleComplete} className="w-full">
              أكملت الحفظ، متابعة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              تم التفعيل بنجاح!
            </CardTitle>
            <CardDescription>حسابك الآن محمي بالمصادقة الثنائية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                تم تفعيل المصادقة الثنائية بنجاح. في المرة القادمة التي تقوم فيها بتسجيل الدخول،
                ستحتاج إلى إدخال رمز من تطبيق المصادقة.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-semibold">الخطوات التالية:</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>✓ تأكد من حفظ رموز الاسترجاع الاحتياطية</li>
                <li>✓ جرّب تسجيل الدخول للتأكد من عمل كل شيء</li>
                <li>✓ يمكنك تعطيل 2FA في أي وقت من الإعدادات</li>
              </ul>
            </div>

            <Button onClick={() => (window.location.href = '/dashboard')} className="w-full">
              العودة إلى لوحة التحكم
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
