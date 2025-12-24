/**
 * Email Service using SendGrid
 * Sends OTP and notification emails
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@haderos.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'HaderOS';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[Email] SendGrid initialized');
} else {
  console.warn('[Email] SendGrid API key not found - emails will not be sent');
}

/**
 * Send OTP email to employee
 */
export async function sendOTPEmail(
  to: string,
  otpCode: string,
  employeeName?: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.log(`[Email] Would send OTP ${otpCode} to ${to} (SendGrid not configured)`);
    return false;
  }

  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `رمز التحقق الخاص بك - HaderOS`,
      text: `مرحباً${employeeName ? ' ' + employeeName : ''},\n\nرمز التحقق الخاص بك هو: ${otpCode}\n\nهذا الرمز صالح لمدة 10 دقائق.\n\nإذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.\n\nمع تحيات فريق HaderOS`,
      html: generateOTPEmailHTML(otpCode, employeeName),
    };

    await sgMail.send(msg);
    console.log(`[Email] OTP sent successfully to ${to}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send OTP:', error.response?.body || error.message);
    return false;
  }
}

/**
 * Send email verification email (first time setup)
 */
export async function sendEmailVerificationOTP(
  email: string,
  otpCode: string,
  employeeName: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.log(`[Email] Would send verification OTP ${otpCode} to ${email} (SendGrid not configured)`);
    return false;
  }

  try {
    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `تأكيد البريد الإلكتروني - HaderOS`,
      text: `مرحباً ${employeeName},\n\nشكراً لتسجيلك في نظام HaderOS!\n\nرمز التحقق لتأكيد بريدك الإلكتروني: ${otpCode}\n\nهذا الرمز صالح لمدة 10 دقائق.\n\nمع تحيات فريق HaderOS`,
      html: generateVerificationEmailHTML(otpCode, employeeName),
    };

    await sgMail.send(msg);
    console.log(`[Email] Verification OTP sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send verification OTP:', error.response?.body || error.message);
    return false;
  }
}

/**
 * Generate professional HTML email template for OTP
 */
function generateOTPEmailHTML(otpCode: string, employeeName?: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رمز التحقق - HaderOS</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🔐 HaderOS</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">نظام الأعمال الأخلاقية المدعوم بالذكاء الاصطناعي</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">${employeeName ? `مرحباً ${employeeName}،` : 'مرحباً،'}</h2>
              <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">لقد طلبت رمز تحقق للوصول إلى حسابك في HaderOS. استخدم الرمز التالي لإتمام عملية تسجيل الدخول:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="background-color: #f7fafc; border: 2px dashed #cbd5e0; border-radius: 8px; padding: 30px;">
                    <div style="font-size: 42px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</div>
                    <p style="margin: 15px 0 0 0; color: #718096; font-size: 14px;">صالح لمدة <strong>10 دقائق</strong></p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff5f5; border-right: 4px solid #fc8181; border-radius: 6px; padding: 20px; margin: 0 0 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 1.6;"><strong>⚠️ تنبيه أمني:</strong><br>إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة. لا تشارك هذا الرمز مع أي شخص.</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">إذا كنت بحاجة إلى مساعدة، يرجى التواصل مع فريق الدعم الفني.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 13px;">© 2025 HaderOS - جميع الحقوق محفوظة</p>
              <p style="margin: 0; color: #cbd5e0; font-size: 12px;">منصة ذكية متكاملة لإدارة الأعمال مع حوكمة أخلاقية مدمجة ووكلاء ذكيين يعملون لصالحك</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email template for email verification
 */
function generateVerificationEmailHTML(otpCode: string, employeeName: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني - HaderOS</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✉️ HaderOS</h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">تأكيد البريد الإلكتروني</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">مرحباً ${employeeName}،</h2>
              <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">شكراً لتسجيلك في نظام HaderOS! لتأكيد بريدك الإلكتروني، استخدم الرمز التالي:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 8px; padding: 30px;">
                    <div style="font-size: 42px; font-weight: 700; color: #10b981; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</div>
                    <p style="margin: 15px 0 0 0; color: #065f46; font-size: 14px;">صالح لمدة <strong>10 دقائق</strong></p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #dbeafe; border-right: 4px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 0 0 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;"><strong>✅ بعد التأكيد:</strong><br>سيتم إرسال رموز تسجيل الدخول تلقائياً إلى هذا البريد في كل مرة تقوم فيها بتسجيل الدخول.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; color: #a0aec0; font-size: 13px;">© 2025 HaderOS - جميع الحقوق محفوظة</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Test SendGrid connection
 */
export async function testSendGridConnection(): Promise<{ success: boolean; message: string }> {
  if (!SENDGRID_API_KEY) {
    return {
      success: false,
      message: 'SendGrid API key not configured',
    };
  }

  try {
    const msg = {
      to: FROM_EMAIL,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: 'SendGrid Connection Test - HaderOS',
      text: 'This is a test email to verify SendGrid integration.',
      html: '<p>This is a test email to verify SendGrid integration.</p>',
    };

    await sgMail.send(msg);
    return {
      success: true,
      message: 'SendGrid connection successful',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.body?.errors?.[0]?.message || error.message || 'Unknown error',
    };
  }
}
