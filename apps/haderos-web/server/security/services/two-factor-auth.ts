/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP-based 2FA using speakeasy
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { z } from 'zod';

/**
 * 2FA Secret interface
 */
export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * 2FA Verification result
 */
export interface VerificationResult {
  valid: boolean;
  delta?: number;
}

/**
 * Generate 2FA secret and QR code
 */
export const generateTwoFactorSecret = async (
  userEmail: string,
  issuer: string = 'HADEROS'
): Promise<TwoFactorSecret> => {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${userEmail})`,
    issuer,
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
};

/**
 * Verify 2FA token
 */
export const verifyTwoFactorToken = (
  token: string,
  secret: string,
  window: number = 1
): VerificationResult => {
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window, // Allow 1 step before/after for clock skew
  });

  return {
    valid: typeof verified === 'boolean' ? verified : verified !== false,
    delta: typeof verified === 'object' ? verified.delta : undefined,
  };
};

/**
 * Generate backup codes
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Array.from({ length: 8 }, () =>
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]
    ).join('');
    
    codes.push(code);
  }
  
  return codes;
};

/**
 * Verify backup code
 */
export const verifyBackupCode = (
  code: string,
  backupCodes: string[]
): boolean => {
  return backupCodes.includes(code.toUpperCase());
};

/**
 * Generate current TOTP token (for testing)
 */
export const generateCurrentToken = (secret: string): string => {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  });
};

/**
 * Validation schemas for 2FA
 */
export const twoFactorSchemas = {
  enable2FA: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
  
  verify2FA: z.object({
    token: z.string().length(6, 'Token must be 6 digits').regex(/^\d+$/, 'Token must be numeric'),
  }),
  
  disable2FA: z.object({
    password: z.string().min(1, 'Password is required'),
    token: z.string().length(6, 'Token must be 6 digits').regex(/^\d+$/, 'Token must be numeric'),
  }),
  
  verifyBackupCode: z.object({
    code: z.string().length(8, 'Backup code must be 8 characters').regex(/^[0-9A-Z]+$/, 'Invalid backup code format'),
  }),
};

/**
 * 2FA Service class
 */
export class TwoFactorAuthService {
  /**
   * Enable 2FA for a user
   */
  async enable(userEmail: string): Promise<TwoFactorSecret> {
    return generateTwoFactorSecret(userEmail);
  }

  /**
   * Verify 2FA setup
   */
  verify(token: string, secret: string): VerificationResult {
    return verifyTwoFactorToken(token, secret);
  }

  /**
   * Verify backup code
   */
  verifyBackup(code: string, backupCodes: string[]): boolean {
    return verifyBackupCode(code, backupCodes);
  }

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes(): string[] {
    return generateBackupCodes(10);
  }

  /**
   * Generate current token (for testing only)
   */
  getCurrentToken(secret: string): string {
    return generateCurrentToken(secret);
  }
}

export default new TwoFactorAuthService();
