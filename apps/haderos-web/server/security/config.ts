/**
 * Security Configuration
 * 
 * Environment-based security settings
 * - Development: Security disabled (fast and easy)
 * - Production: Security enabled (full protection)
 */

export interface SecurityConfig {
  enabled: boolean;
  rateLimiting: {
    enabled: boolean;
    maxAttempts: number;
    windowMs: number; // Time window in milliseconds
    blockDurationMs: number; // How long to block after max attempts
  };
  accountLockout: {
    enabled: boolean;
    maxFailedAttempts: number;
    lockDurationMs: number;
    notifyUser: boolean;
  };
  ipBlocking: {
    enabled: boolean;
    maxAttemptsPerIP: number;
    blockDurationMs: number;
    whitelist: string[]; // IPs that are never blocked
  };
  bruteForceProtection: {
    enabled: boolean;
    progressiveDelay: boolean; // Increase delay with each failed attempt
    captchaAfterAttempts: number;
  };
  logging: {
    enabled: boolean;
    logSuccessfulLogins: boolean;
    logFailedAttempts: boolean;
    logBlockedAttempts: boolean;
  };
}

/**
 * Get security configuration based on environment
 */
export function getSecurityConfig(): SecurityConfig {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Development: All security disabled
  if (!isProduction) {
    return {
      enabled: false,
      rateLimiting: {
        enabled: false,
        maxAttempts: 1000, // Very high limit
        windowMs: 60000,
        blockDurationMs: 1000,
      },
      accountLockout: {
        enabled: false,
        maxFailedAttempts: 1000,
        lockDurationMs: 1000,
        notifyUser: false,
      },
      ipBlocking: {
        enabled: false,
        maxAttemptsPerIP: 1000,
        blockDurationMs: 1000,
        whitelist: [],
      },
      bruteForceProtection: {
        enabled: false,
        progressiveDelay: false,
        captchaAfterAttempts: 1000,
      },
      logging: {
        enabled: true, // Keep logging even in dev
        logSuccessfulLogins: false,
        logFailedAttempts: true,
        logBlockedAttempts: true,
      },
    };
  }
  
  // Production: Full security enabled
  return {
    enabled: true,
    rateLimiting: {
      enabled: true,
      maxAttempts: 5, // 5 attempts per window
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 60 * 60 * 1000, // 1 hour block
    },
    accountLockout: {
      enabled: true,
      maxFailedAttempts: 5,
      lockDurationMs: 30 * 60 * 1000, // 30 minutes
      notifyUser: true,
    },
    ipBlocking: {
      enabled: true,
      maxAttemptsPerIP: 20, // 20 attempts from same IP
      blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours
      whitelist: [
        "127.0.0.1", // localhost
        "::1", // localhost IPv6
      ],
    },
    bruteForceProtection: {
      enabled: true,
      progressiveDelay: true,
      captchaAfterAttempts: 3,
    },
    logging: {
      enabled: true,
      logSuccessfulLogins: true,
      logFailedAttempts: true,
      logBlockedAttempts: true,
    },
  };
}

/**
 * Security configuration singleton
 */
export const securityConfig = getSecurityConfig();

/**
 * Check if security is enabled
 */
export function isSecurityEnabled(): boolean {
  return securityConfig.enabled;
}

/**
 * Get environment name
 */
export function getEnvironment(): "development" | "production" {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}
