/**
 * Rate Limiter Middleware
 * 
 * Prevents brute force attacks by limiting login attempts
 */

import { securityConfig, isSecurityEnabled } from "./config";
import { securityStore } from "./store";

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime?: number;
  message?: string;
}

/**
 * Check if a login attempt is allowed based on rate limiting
 */
export function checkRateLimit(username: string, ip: string): RateLimitResult {
  // If security is disabled, always allow
  if (!isSecurityEnabled() || !securityConfig.rateLimiting.enabled) {
    return {
      allowed: true,
      remainingAttempts: 999,
    };
  }

  const { maxAttempts, windowMs, blockDurationMs } = securityConfig.rateLimiting;
  
  // Get failed attempts in the current window
  const failedAttempts = securityStore.getFailedAttempts(username, ip, windowMs);
  
  // Check if limit exceeded
  if (failedAttempts >= maxAttempts) {
    const oldestAttempt = securityStore.getLoginAttempts(username, ip, windowMs)[0];
    const resetTime = oldestAttempt ? oldestAttempt.timestamp + blockDurationMs : Date.now() + blockDurationMs;
    
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime,
      message: `Too many failed attempts. Please try again in ${Math.ceil(blockDurationMs / 60000)} minutes.`,
    };
  }
  
  return {
    allowed: true,
    remainingAttempts: maxAttempts - failedAttempts,
  };
}

/**
 * Calculate progressive delay based on failed attempts
 */
export function calculateProgressiveDelay(failedAttempts: number): number {
  if (!isSecurityEnabled() || !securityConfig.bruteForceProtection.progressiveDelay) {
    return 0;
  }
  
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, ...
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds max
  
  const delay = Math.min(baseDelay * Math.pow(2, failedAttempts - 1), maxDelay);
  return delay;
}

/**
 * Check if CAPTCHA should be required
 */
export function shouldRequireCaptcha(username: string, ip: string): boolean {
  if (!isSecurityEnabled() || !securityConfig.bruteForceProtection.enabled) {
    return false;
  }
  
  const { captchaAfterAttempts } = securityConfig.bruteForceProtection;
  const failedAttempts = securityStore.getFailedAttempts(
    username,
    ip,
    securityConfig.rateLimiting.windowMs
  );
  
  return failedAttempts >= captchaAfterAttempts;
}

/**
 * Record a login attempt
 */
export function recordLoginAttempt(
  username: string,
  ip: string,
  success: boolean,
  userAgent?: string
): void {
  securityStore.recordLoginAttempt({
    username,
    ip,
    timestamp: Date.now(),
    success,
    userAgent,
  });
  
  // If failed, increment IP attempts
  if (!success) {
    securityStore.incrementIPAttempts(ip);
  } else {
    // If successful, clear attempts
    securityStore.clearLoginAttempts(username, ip);
    securityStore.resetIPAttempts(ip);
  }
}

/**
 * Get rate limit info for display
 */
export function getRateLimitInfo(username: string, ip: string) {
  const { maxAttempts, windowMs } = securityConfig.rateLimiting;
  const failedAttempts = securityStore.getFailedAttempts(username, ip, windowMs);
  const attempts = securityStore.getLoginAttempts(username, ip, windowMs);
  
  return {
    failedAttempts,
    maxAttempts,
    remainingAttempts: Math.max(0, maxAttempts - failedAttempts),
    windowMinutes: windowMs / 60000,
    recentAttempts: attempts.slice(-10), // Last 10 attempts
  };
}
