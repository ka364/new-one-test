/**
 * Two-Factor Authentication Router
 * Handles 2FA setup, verification, and management
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { twoFactorService } from '../auth/2fa-service';
import { db } from '../db';
import { twoFactorSecrets } from '../../drizzle/schema-2fa';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '../_core/security';

export const twoFactorRouter = router({
  /**
   * Get 2FA status for current user
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    try {
      const record = await db.query.twoFactorSecrets.findFirst({
        where: eq(twoFactorSecrets.userId, ctx.user.id),
      });

      return {
        enabled: record?.enabled ?? false,
        hasBackupCodes: (record?.backupCodes?.length ?? 0) > 0,
        backupCodesRemaining: record?.backupCodes?.length ?? 0,
        lastUsed: record?.lastUsedAt ?? null,
        enabledAt: record?.enabledAt ?? null,
      };
    } catch (error) {
      throw new Error('Failed to check 2FA status');
    }
  }),

  /**
   * Start 2FA setup - generate secret and QR code
   */
  setup: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const user = ctx.user;

      // Check if 2FA is already enabled
      const existing = await db.query.twoFactorSecrets.findFirst({
        where: eq(twoFactorSecrets.userId, user.id),
      });

      if (existing?.enabled) {
        throw new Error('2FA is already enabled. Disable it first to re-setup.');
      }

      // Generate new secret
      const { secret, otpauthUrl } = twoFactorService.generateSecret(user.email);
      const qrCode = await twoFactorService.generateQRCode(otpauthUrl);

      // Store temporary secret (not enabled yet)
      if (existing) {
        // Update existing record
        await db
          .update(twoFactorSecrets)
          .set({
            secret,
            enabled: false,
            backupCodes: null,
          })
          .where(eq(twoFactorSecrets.userId, user.id));
      } else {
        // Insert new record
        await db.insert(twoFactorSecrets).values({
          userId: user.id,
          secret,
          enabled: false,
        });
      }

      return {
        secret,
        qrCode,
        manualEntryCode: secret,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to setup 2FA');
    }
  }),

  /**
   * Verify token and enable 2FA
   */
  verify: protectedProcedure
    .input(
      z.object({
        token: z.string().length(6, '2FA token must be 6 digits'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the secret
        const record = await db.query.twoFactorSecrets.findFirst({
          where: eq(twoFactorSecrets.userId, ctx.user.id),
        });

        if (!record) {
          throw new Error('2FA not set up. Please setup first.');
        }

        if (record.enabled) {
          throw new Error('2FA is already enabled');
        }

        // Verify the token
        const isValid = twoFactorService.verifyToken(record.secret, input.token);

        if (!isValid) {
          throw new Error('Invalid 2FA token. Please try again.');
        }

        // Generate backup codes
        const backupCodes = twoFactorService.generateBackupCodes();

        // Enable 2FA
        await db
          .update(twoFactorSecrets)
          .set({
            enabled: true,
            backupCodes: backupCodes,
            enabledAt: new Date(),
          })
          .where(eq(twoFactorSecrets.userId, ctx.user.id));

        return {
          success: true,
          backupCodes,
          message: '2FA enabled successfully! Save your backup codes in a safe place.',
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to verify 2FA token');
      }
    }),

  /**
   * Disable 2FA (requires password confirmation)
   */
  disable: protectedProcedure
    .input(
      z.object({
        password: z.string().min(1, 'Password is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get user with password hash
        const user = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id),
        });

        if (!user || !user.passwordHash) {
          throw new Error('User not found');
        }

        // Verify password
        const isValidPassword = await verifyPassword(input.password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error('Invalid password');
        }

        // Delete 2FA secret
        await db.delete(twoFactorSecrets).where(eq(twoFactorSecrets.userId, ctx.user.id));

        return {
          success: true,
          message: '2FA disabled successfully',
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to disable 2FA');
      }
    }),

  /**
   * Regenerate backup codes (requires 2FA token)
   */
  regenerateBackupCodes: protectedProcedure
    .input(
      z.object({
        token: z.string().length(6, '2FA token must be 6 digits'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the secret
        const record = await db.query.twoFactorSecrets.findFirst({
          where: eq(twoFactorSecrets.userId, ctx.user.id),
        });

        if (!record || !record.enabled) {
          throw new Error('2FA is not enabled');
        }

        // Verify the token
        const isValid = twoFactorService.verifyToken(record.secret, input.token);

        if (!isValid) {
          throw new Error('Invalid 2FA token');
        }

        // Generate new backup codes
        const backupCodes = twoFactorService.generateBackupCodes();

        // Update backup codes
        await db
          .update(twoFactorSecrets)
          .set({
            backupCodes: backupCodes,
          })
          .where(eq(twoFactorSecrets.userId, ctx.user.id));

        return {
          success: true,
          backupCodes,
          message: 'Backup codes regenerated successfully',
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to regenerate backup codes');
      }
    }),

  /**
   * Verify 2FA token during login (public procedure)
   */
  verifyLogin: protectedProcedure
    .input(
      z.object({
        token: z.string().min(6, 'Token must be at least 6 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the secret
        const record = await db.query.twoFactorSecrets.findFirst({
          where: eq(twoFactorSecrets.userId, ctx.user.id),
        });

        if (!record || !record.enabled) {
          throw new Error('2FA is not enabled for this user');
        }

        // Try to verify as TOTP token
        let isValid = twoFactorService.verifyToken(record.secret, input.token);

        // If not valid as TOTP, check if it's a backup code
        if (!isValid && record.backupCodes) {
          const normalizedToken = input.token.toUpperCase().replace(/\s/g, '');
          const backupCodeIndex = record.backupCodes.findIndex((code) => code === normalizedToken);

          if (backupCodeIndex !== -1) {
            // Valid backup code - remove it
            const updatedBackupCodes = record.backupCodes.filter(
              (_, index) => index !== backupCodeIndex
            );

            await db
              .update(twoFactorSecrets)
              .set({
                backupCodes: updatedBackupCodes,
                lastUsedAt: new Date(),
              })
              .where(eq(twoFactorSecrets.userId, ctx.user.id));

            isValid = true;
          }
        }

        if (!isValid) {
          throw new Error('Invalid 2FA token or backup code');
        }

        // Update last used time for TOTP
        await db
          .update(twoFactorSecrets)
          .set({
            lastUsedAt: new Date(),
          })
          .where(eq(twoFactorSecrets.userId, ctx.user.id));

        return {
          success: true,
          message: '2FA verification successful',
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to verify 2FA');
      }
    }),
});
