/**
 * Account Protection
 * 
 * Account lockout and IP blocking functionality
 */

import { securityConfig, isSecurityEnabled } from "./config";
import { securityStore } from "./store";

export interface AccountLockResult {
  locked: boolean;
  reason?: string;
  expiresAt?: number;
  message?: string;
}

export interface IPBlockResult {
  blocked: boolean;
  reason?: string;
  expiresAt?: number;
  message?: string;
}

/**
 * Check if an account should be locked
 */
export function checkAccountLock(username: string): AccountLockResult {
  // If security is disabled, never lock
  if (!isSecurityEnabled() || !securityConfig.accountLockout.enabled) {
    return { locked: false };
  }

  // Check if already locked
  if (securityStore.isAccountLocked(username)) {
    const lockInfo = securityStore.getLockedAccount(username);
    if (lockInfo) {
      const remainingMs = lockInfo.expiresAt - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      
      return {
        locked: true,
        reason: lockInfo.reason,
        expiresAt: lockInfo.expiresAt,
        message: `Account is locked. Please try again in ${remainingMinutes} minutes.`,
      };
    }
  }

  return { locked: false };
}

/**
 * Lock an account after too many failed attempts
 */
export function lockAccount(username: string, ip: string): void {
  if (!isSecurityEnabled() || !securityConfig.accountLockout.enabled) {
    return;
  }

  const { lockDurationMs } = securityConfig.accountLockout;
  const failedAttempts = securityStore.getFailedAttempts(
    username,
    ip,
    securityConfig.rateLimiting.windowMs
  );

  securityStore.lockAccount(
    username,
    `Too many failed login attempts (${failedAttempts})`,
    lockDurationMs,
    failedAttempts
  );

  // TODO: Send email notification if enabled
  if (securityConfig.accountLockout.notifyUser) {
    console.log(`[Security] Account locked: ${username} (would send email in production)`);
  }
}

/**
 * Unlock an account manually
 */
export function unlockAccount(username: string): boolean {
  return securityStore.unlockAccount(username);
}

/**
 * Check if account should be locked based on failed attempts
 */
export function shouldLockAccount(username: string, ip: string): boolean {
  if (!isSecurityEnabled() || !securityConfig.accountLockout.enabled) {
    return false;
  }

  const { maxFailedAttempts } = securityConfig.accountLockout;
  const failedAttempts = securityStore.getFailedAttempts(
    username,
    ip,
    securityConfig.rateLimiting.windowMs
  );

  return failedAttempts >= maxFailedAttempts;
}

/**
 * Check if an IP should be blocked
 */
export function checkIPBlock(ip: string): IPBlockResult {
  // If security is disabled, never block
  if (!isSecurityEnabled() || !securityConfig.ipBlocking.enabled) {
    return { blocked: false };
  }

  // Check whitelist
  if (securityConfig.ipBlocking.whitelist.includes(ip)) {
    return { blocked: false };
  }

  // Check if already blocked
  if (securityStore.isIPBlocked(ip)) {
    const blockInfo = securityStore.getBlockedIP(ip);
    if (blockInfo) {
      const remainingMs = blockInfo.expiresAt - Date.now();
      const remainingHours = Math.ceil(remainingMs / 3600000);
      
      return {
        blocked: true,
        reason: blockInfo.reason,
        expiresAt: blockInfo.expiresAt,
        message: `IP address is blocked. Please try again in ${remainingHours} hours.`,
      };
    }
  }

  return { blocked: false };
}

/**
 * Block an IP address after too many attempts
 */
export function blockIP(ip: string): void {
  if (!isSecurityEnabled() || !securityConfig.ipBlocking.enabled) {
    return;
  }

  // Check whitelist
  if (securityConfig.ipBlocking.whitelist.includes(ip)) {
    console.log(`[Security] Skipping block for whitelisted IP: ${ip}`);
    return;
  }

  const { blockDurationMs } = securityConfig.ipBlocking;
  const attemptCount = securityStore.getIPAttempts(ip);

  securityStore.blockIP(
    ip,
    `Too many failed login attempts from this IP (${attemptCount})`,
    blockDurationMs
  );

  console.log(`[Security] IP blocked: ${ip} for ${blockDurationMs / 3600000} hours`);
}

/**
 * Unblock an IP address manually
 */
export function unblockIP(ip: string): boolean {
  return securityStore.unblockIP(ip);
}

/**
 * Check if IP should be blocked based on attempt count
 */
export function shouldBlockIP(ip: string): boolean {
  if (!isSecurityEnabled() || !securityConfig.ipBlocking.enabled) {
    return false;
  }

  // Check whitelist
  if (securityConfig.ipBlocking.whitelist.includes(ip)) {
    return false;
  }

  const { maxAttemptsPerIP } = securityConfig.ipBlocking;
  const attempts = securityStore.getIPAttempts(ip);

  return attempts >= maxAttemptsPerIP;
}

/**
 * Get all locked accounts
 */
export function getAllLockedAccounts() {
  return securityStore.getAllLockedAccounts();
}

/**
 * Get all blocked IPs
 */
export function getAllBlockedIPs() {
  return securityStore.getAllBlockedIPs();
}

/**
 * Get account lock info
 */
export function getAccountLockInfo(username: string) {
  return securityStore.getLockedAccount(username);
}

/**
 * Get IP block info
 */
export function getIPBlockInfo(ip: string) {
  return securityStore.getBlockedIP(ip);
}
