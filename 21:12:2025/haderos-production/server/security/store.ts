/**
 * Security Store
 * 
 * In-memory store for security data
 * In production, this should be replaced with Redis or database
 */

export interface LoginAttempt {
  username: string;
  ip: string;
  timestamp: number;
  success: boolean;
  userAgent?: string;
}

export interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: number;
  expiresAt: number;
  attemptCount: number;
}

export interface LockedAccount {
  username: string;
  reason: string;
  lockedAt: number;
  expiresAt: number;
  failedAttempts: number;
}

/**
 * Security Store Class
 */
class SecurityStore {
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private blockedIPs: Map<string, BlockedIP> = new Map();
  private lockedAccounts: Map<string, LockedAccount> = new Map();
  private ipAttempts: Map<string, number> = new Map();

  /**
   * Record a login attempt
   */
  recordLoginAttempt(attempt: LoginAttempt): void {
    const key = `${attempt.username}:${attempt.ip}`;
    const attempts = this.loginAttempts.get(key) || [];
    attempts.push(attempt);
    
    // Keep only last 100 attempts per key
    if (attempts.length > 100) {
      attempts.shift();
    }
    
    this.loginAttempts.set(key, attempts);
  }

  /**
   * Get login attempts for a username/IP combination
   */
  getLoginAttempts(username: string, ip: string, windowMs: number): LoginAttempt[] {
    const key = `${username}:${ip}`;
    const attempts = this.loginAttempts.get(key) || [];
    const cutoff = Date.now() - windowMs;
    
    return attempts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Get failed login attempts count
   */
  getFailedAttempts(username: string, ip: string, windowMs: number): number {
    const attempts = this.getLoginAttempts(username, ip, windowMs);
    return attempts.filter(a => !a.success).length;
  }

  /**
   * Clear login attempts for a username/IP
   */
  clearLoginAttempts(username: string, ip: string): void {
    const key = `${username}:${ip}`;
    this.loginAttempts.delete(key);
  }

  /**
   * Block an IP address
   */
  blockIP(ip: string, reason: string, durationMs: number): void {
    const now = Date.now();
    this.blockedIPs.set(ip, {
      ip,
      reason,
      blockedAt: now,
      expiresAt: now + durationMs,
      attemptCount: this.ipAttempts.get(ip) || 0,
    });
  }

  /**
   * Check if an IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    const blocked = this.blockedIPs.get(ip);
    if (!blocked) return false;
    
    // Check if block has expired
    if (Date.now() > blocked.expiresAt) {
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  /**
   * Get blocked IP info
   */
  getBlockedIP(ip: string): BlockedIP | undefined {
    return this.blockedIPs.get(ip);
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ip: string): boolean {
    return this.blockedIPs.delete(ip);
  }

  /**
   * Get all blocked IPs
   */
  getAllBlockedIPs(): BlockedIP[] {
    const now = Date.now();
    const blocked: BlockedIP[] = [];
    
    for (const [ip, data] of this.blockedIPs.entries()) {
      // Remove expired blocks
      if (now > data.expiresAt) {
        this.blockedIPs.delete(ip);
      } else {
        blocked.push(data);
      }
    }
    
    return blocked;
  }

  /**
   * Increment IP attempt count
   */
  incrementIPAttempts(ip: string): number {
    const count = (this.ipAttempts.get(ip) || 0) + 1;
    this.ipAttempts.set(ip, count);
    return count;
  }

  /**
   * Get IP attempt count
   */
  getIPAttempts(ip: string): number {
    return this.ipAttempts.get(ip) || 0;
  }

  /**
   * Reset IP attempt count
   */
  resetIPAttempts(ip: string): void {
    this.ipAttempts.delete(ip);
  }

  /**
   * Lock an account
   */
  lockAccount(username: string, reason: string, durationMs: number, failedAttempts: number): void {
    const now = Date.now();
    this.lockedAccounts.set(username, {
      username,
      reason,
      lockedAt: now,
      expiresAt: now + durationMs,
      failedAttempts,
    });
  }

  /**
   * Check if an account is locked
   */
  isAccountLocked(username: string): boolean {
    const locked = this.lockedAccounts.get(username);
    if (!locked) return false;
    
    // Check if lock has expired
    if (Date.now() > locked.expiresAt) {
      this.lockedAccounts.delete(username);
      return false;
    }
    
    return true;
  }

  /**
   * Get locked account info
   */
  getLockedAccount(username: string): LockedAccount | undefined {
    return this.lockedAccounts.get(username);
  }

  /**
   * Unlock an account
   */
  unlockAccount(username: string): boolean {
    return this.lockedAccounts.delete(username);
  }

  /**
   * Get all locked accounts
   */
  getAllLockedAccounts(): LockedAccount[] {
    const now = Date.now();
    const locked: LockedAccount[] = [];
    
    for (const [username, data] of this.lockedAccounts.entries()) {
      // Remove expired locks
      if (now > data.expiresAt) {
        this.lockedAccounts.delete(username);
      } else {
        locked.push(data);
      }
    }
    
    return locked;
  }

  /**
   * Get security statistics
   */
  getStats() {
    return {
      totalLoginAttempts: Array.from(this.loginAttempts.values()).reduce((sum, arr) => sum + arr.length, 0),
      blockedIPs: this.getAllBlockedIPs().length,
      lockedAccounts: this.getAllLockedAccounts().length,
      uniqueIPs: this.ipAttempts.size,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.loginAttempts.clear();
    this.blockedIPs.clear();
    this.lockedAccounts.clear();
    this.ipAttempts.clear();
  }
}

/**
 * Global security store instance
 */
export const securityStore = new SecurityStore();
