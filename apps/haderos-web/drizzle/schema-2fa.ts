/**
 * Two-Factor Authentication Schema
 * Stores 2FA secrets and backup codes for users
 */

import { pgTable, serial, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './schema';

export const twoFactorSecrets = pgTable('two_factor_secrets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  secret: text('secret').notNull(),
  backupCodes: text('backup_codes').array(),
  enabled: boolean('enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  enabledAt: timestamp('enabled_at'),
  lastUsedAt: timestamp('last_used_at'),
});

export type TwoFactorSecret = typeof twoFactorSecrets.$inferSelect;
export type NewTwoFactorSecret = typeof twoFactorSecrets.$inferInsert;
