"""

Email Notifications Service

Supports SendGrid and SMTP for email delivery

"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
import requests


class EmailService:
    """Unified email service supporting multiple providers"""

    def __init__(self, provider: str = 'sendgrid'):
        self.provider = provider

        if provider == 'sendgrid':
            self.api_key = os.getenv('SENDGRID_API_KEY')
            self.from_email = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@haderos.com')
            self.from_name = os.getenv('SENDGRID_FROM_NAME', 'HaderOS Platform')
        elif provider == 'smtp':
            self.server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            self.port = int(os.getenv('SMTP_PORT', '587'))
            self.username = os.getenv('SMTP_USERNAME')
            self.password = os.getenv('SMTP_PASSWORD')
            self.use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
            self.from_email = self.username
        else:
            raise ValueError(f"Unsupported email provider: {provider}")

    def send_email(self, to: str, subject: str, html_content: str, text_content: Optional[str] = None) -> Dict[str, Any]:
        """Send email message"""
        if self.provider == 'sendgrid':
            return self._send_sendgrid_email(to, subject, html_content, text_content)
        elif self.provider == 'smtp':
            return self._send_smtp_email(to, subject, html_content, text_content)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _send_sendgrid_email(self, to: str, subject: str, html_content: str, text_content: Optional[str] = None) -> Dict[str, Any]:
        """Send email via SendGrid"""
        if not self.api_key:
            raise Exception("SendGrid API key not configured")

        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        data = {
            "personalizations": [{
                "to": [{"email": to}],
                "subject": subject
            }],
            "from": {
                "email": self.from_email,
                "name": self.from_name
            },
            "content": []
        }

        # Add HTML content
        if html_content:
            data["content"].append({
                "type": "text/html",
                "value": html_content
            })

        # Add text content if provided
        if text_content:
            data["content"].append({
                "type": "text/plain",
                "value": text_content
            })

        try:
            response = requests.post(url, json=data, headers=headers, timeout=30)
            response.raise_for_status()

            return {
                'success': True,
                'message_id': response.headers.get('X-Message-Id', ''),
                'status': 'sent',
                'provider': 'sendgrid'
            }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'sendgrid'
            }

    def _send_smtp_email(self, to: str, subject: str, html_content: str, text_content: Optional[str] = None) -> Dict[str, Any]:
        """Send email via SMTP"""
        if not all([self.username, self.password]):
            raise Exception("SMTP credentials not configured")

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to

            # Add text content
            if text_content:
                msg.attach(MIMEText(text_content, 'plain', 'utf-8'))

            # Add HTML content
            if html_content:
                msg.attach(MIMEText(html_content, 'html', 'utf-8'))

            # Send email
            server = smtplib.SMTP(self.server, self.port)
            if self.use_tls:
                server.starttls()

            server.login(self.username, self.password)
            server.sendmail(self.from_email, to, msg.as_string())
            server.quit()

            return {
                'success': True,
                'status': 'sent',
                'provider': 'smtp'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'smtp'
            }


def get_email_service() -> Optional[EmailService]:
    """Get configured email service"""
    # Try SendGrid first (preferred)
    if os.getenv('SENDGRID_API_KEY'):
        return EmailService('sendgrid')
    # Fallback to SMTP
    elif os.getenv('SMTP_USERNAME') and os.getenv('SMTP_PASSWORD'):
        return EmailService('smtp')

    return None


def send_order_email(to: str, subject: str, message: str) -> bool:
    """Send order-related email notification"""
    service = get_email_service()
    if not service:
        print("Email service not configured")
        return False

    try:
        # Create HTML email template with RTL support
        html_content = f"""
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject}</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }}
                .container {{
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #2563eb;
                }}
                .content {{
                    margin: 20px 0;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">HaderOS</div>
                    <p>منصة التشغيل الاقتصادي الأخلاقي</p>
                </div>
                <div class="content">
                    {message.replace(chr(10), '<br>')}
                </div>
                <div class="footer">
                    <p>هذه الرسالة مرسلة من نظام HaderOS الآلي</p>
                    <p>للاستفسارات، يرجى التواصل معنا</p>
                </div>
            </div>
        </body>
        </html>
        """

        result = service.send_email(to, subject, html_content, message)
        return result.get('success', False)

    except Exception as e:
        print(f"Email sending failed: {e}")
        return False