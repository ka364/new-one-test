"""

SMS Notifications Service

Supports Unifonic and Twilio for SMS delivery

"""

import os
import requests
from typing import Optional, Dict, Any


class SMSService:
    """Unified SMS service supporting multiple providers"""

    def __init__(self, provider: str = 'unifonic'):
        self.provider = provider

        if provider == 'unifonic':
            self.app_sid = os.getenv('UNIFONIC_APP_SID')
            self.auth_token = os.getenv('UNIFONIC_AUTH_TOKEN')
            self.sender_id = os.getenv('UNIFONIC_SENDER_ID', 'HaderOS')
        elif provider == 'twilio':
            self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
            self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
            self.phone_number = os.getenv('TWILIO_PHONE_NUMBER')
        else:
            raise ValueError(f"Unsupported SMS provider: {provider}")

    def send_sms(self, to: str, message: str) -> Dict[str, Any]:
        """Send SMS message"""
        if self.provider == 'unifonic':
            return self._send_unifonic_sms(to, message)
        elif self.provider == 'twilio':
            return self._send_twilio_sms(to, message)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _send_unifonic_sms(self, to: str, message: str) -> Dict[str, Any]:
        """Send SMS via Unifonic"""
        if not all([self.app_sid, self.auth_token]):
            raise Exception("Unifonic credentials not configured")

        url = f"https://api.unifonic.com/v1/messages"
        headers = {
            'Authorization': f'Bearer {self.auth_token}',
            'Content-Type': 'application/json'
        }

        data = {
            'AppSid': self.app_sid,
            'Recipient': to,
            'Body': message,
            'SenderID': self.sender_id
        }

        try:
            response = requests.post(url, json=data, headers=headers, timeout=30)
            response.raise_for_status()
            result = response.json()

            return {
                'success': result.get('success', False),
                'message_id': result.get('MessageID', ''),
                'status': result.get('Status', 'sent'),
                'provider': 'unifonic'
            }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'unifonic'
            }

    def _send_twilio_sms(self, to: str, message: str) -> Dict[str, Any]:
        """Send SMS via Twilio"""
        if not all([self.account_sid, self.auth_token, self.phone_number]):
            raise Exception("Twilio credentials not configured")

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        auth = (self.account_sid, self.auth_token)

        data = {
            'From': self.phone_number,
            'To': to,
            'Body': message
        }

        try:
            response = requests.post(url, data=data, auth=auth, timeout=30)
            response.raise_for_status()
            result = response.json()

            return {
                'success': True,
                'message_id': result.get('sid', ''),
                'status': result.get('status', 'sent'),
                'provider': 'twilio'
            }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': str(e),
                'provider': 'twilio'
            }


def get_sms_service() -> Optional[SMSService]:
    """Get configured SMS service"""
    # Try Unifonic first (preferred for Arabic)
    if os.getenv('UNIFONIC_APP_SID') and os.getenv('UNIFONIC_AUTH_TOKEN'):
        return SMSService('unifonic')
    # Fallback to Twilio
    elif os.getenv('TWILIO_ACCOUNT_SID') and os.getenv('TWILIO_AUTH_TOKEN'):
        return SMSService('twilio')

    return None


def send_order_sms(order_id: str, message: str) -> bool:
    """Send order-related SMS notification"""
    service = get_sms_service()
    if not service:
        print("SMS service not configured")
        return False

    # In a real implementation, you'd get the customer's phone from the order
    # For now, we'll assume the phone is passed in the message or stored elsewhere
    # This is a simplified version

    try:
        # Extract phone number from message or use a default for testing
        # In production, this would query the database for customer phone
        phone_number = "+966500000000"  # Placeholder

        result = service.send_sms(phone_number, message)
        return result.get('success', False)

    except Exception as e:
        print(f"SMS sending failed: {e}")
        return False