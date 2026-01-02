/**
 * Two-Factor Authentication Service
 * Handles TOTP generation, verification, and QR code creation
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

export class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   */
  generateSecret(email: string, companyName = 'HADEROS AI CLOUD') {
    const secret = speakeasy.generateSecret({
      name: `${companyName} (${email})`,
      issuer: companyName,
      length: 32,
    });

    return {
      secret: secret.base32!,
      otpauthUrl: secret.otpauth_url!,
    };
  }

  /**
   * Generate QR code data URL from otpauth URL
   */
  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token against a secret
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after (±60 seconds)
    });
  }

  /**
   * Generate backup codes for recovery
   */
  generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = randomBytes(4)
        .toString('hex')
        .toUpperCase()
        .match(/.{1,4}/g)!
        .join('-');
      codes.push(code);
    }

    return codes;
  }

  /**
   * Validate backup code format
   */
  isValidBackupCodeFormat(code: string): boolean {
    // Format: XXXX-XXXX (8 hex characters with hyphen)
    return /^[0-9A-F]{4}-[0-9A-F]{4}$/.test(code.toUpperCase());
  }

  /**
   * Generate a temporary token for 2FA setup
   * Valid for 5 minutes
   */
  generateTempToken(userId: number): string {
    const payload = {
      userId,
      exp: Date.now() + 5 * 60 * 1000, // 5 minutes
      type: '2fa-setup',
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Verify and decode temporary token
   */
  verifyTempToken(token: string): { userId: number } | null {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

      if (payload.exp < Date.now()) {
        return null; // Expired
      }

      if (payload.type !== '2fa-setup') {
        return null; // Invalid type
      }

      return { userId: payload.userId };
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const twoFactorService = new TwoFactorService();
