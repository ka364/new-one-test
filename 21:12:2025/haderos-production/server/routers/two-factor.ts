/**
 * Two-Factor Authentication Router
 * Integrates 2FA into the main authentication flow
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  verifyBackupCode,
} from '../security/services/two-factor-auth';
import { logger } from '../_core/logger';
import { validateRequest } from '../_core/validation';

const router = Router();

/**
 * POST /api/2fa/setup
 * Generate 2FA secret and QR code for user
 */
router.post('/setup', validateRequest({
  body: z.object({
    email: z.string().email(),
  }),
}), async (req, res) => {
  try {
    const { email } = req.body;
    
    logger.info('2FA setup initiated', { email });
    
    const twoFactorData = await generateTwoFactorSecret(email);
    
    // In production, save the secret to the user's database record
    // For now, return it to the client
    
    res.json({
      success: true,
      data: {
        qrCode: twoFactorData.qrCode,
        backupCodes: twoFactorData.backupCodes,
        // Don't send the secret to the client in production
        // It should be stored server-side
      },
    });
    
    logger.info('2FA setup completed', { email });
  } catch (error) {
    logger.error('2FA setup failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to setup 2FA',
    });
  }
});

/**
 * POST /api/2fa/verify
 * Verify 2FA token
 */
router.post('/verify', validateRequest({
  body: z.object({
    email: z.string().email(),
    token: z.string().length(6),
  }),
}), async (req, res) => {
  try {
    const { email, token } = req.body;
    
    logger.info('2FA verification initiated', { email });
    
    // In production, retrieve the secret from the user's database record
    // For now, this is a placeholder
    const userSecret = 'USER_SECRET_FROM_DATABASE';
    
    const result = verifyTwoFactorToken(userSecret, token);
    
    if (result.valid) {
      logger.info('2FA verification successful', { email });
      res.json({
        success: true,
        message: '2FA verification successful',
      });
    } else {
      logger.warn('2FA verification failed', { email });
      res.status(401).json({
        success: false,
        error: 'Invalid 2FA token',
      });
    }
  } catch (error) {
    logger.error('2FA verification error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to verify 2FA token',
    });
  }
});

/**
 * POST /api/2fa/verify-backup
 * Verify backup code
 */
router.post('/verify-backup', validateRequest({
  body: z.object({
    email: z.string().email(),
    backupCode: z.string(),
  }),
}), async (req, res) => {
  try {
    const { email, backupCode } = req.body;
    
    logger.info('2FA backup code verification initiated', { email });
    
    // In production, retrieve backup codes from the user's database record
    const userBackupCodes = ['BACKUP_CODES_FROM_DATABASE'];
    
    const isValid = verifyBackupCode(backupCode, userBackupCodes);
    
    if (isValid) {
      // In production, mark this backup code as used
      logger.info('2FA backup code verification successful', { email });
      res.json({
        success: true,
        message: 'Backup code verified successfully',
      });
    } else {
      logger.warn('2FA backup code verification failed', { email });
      res.status(401).json({
        success: false,
        error: 'Invalid backup code',
      });
    }
  } catch (error) {
    logger.error('2FA backup code verification error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to verify backup code',
    });
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA for user
 */
router.post('/disable', validateRequest({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
}), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('2FA disable initiated', { email });
    
    // In production:
    // 1. Verify password
    // 2. Remove 2FA secret from user's database record
    // 3. Remove backup codes
    
    logger.info('2FA disabled successfully', { email });
    res.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    logger.error('2FA disable error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to disable 2FA',
    });
  }
});

export default router;
