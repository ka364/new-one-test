/**
 * Security Logger
 * 
 * Comprehensive logging for security events
 */

import { securityConfig, getEnvironment } from "./config";

export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "login_blocked"
  | "account_locked"
  | "account_unlocked"
  | "ip_blocked"
  | "ip_unblocked"
  | "rate_limit_exceeded"
  | "captcha_required"
  | "suspicious_activity";

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  username?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Security Logger Class
 */
class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events in memory

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, "timestamp">): void {
    if (!securityConfig.logging.enabled) {
      return;
    }

    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Add to in-memory store
    this.events.push(fullEvent);
    
    // Keep only last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Console log in development
    if (getEnvironment() === "development") {
      this.consoleLog(fullEvent);
    }

    // TODO: In production, send to external logging service (e.g., Sentry, LogRocket)
  }

  /**
   * Console log with colors
   */
  private consoleLog(event: SecurityEvent): void {
    const colors = {
      low: "\x1b[32m", // Green
      medium: "\x1b[33m", // Yellow
      high: "\x1b[31m", // Red
      critical: "\x1b[35m", // Magenta
    };
    const reset = "\x1b[0m";
    const color = colors[event.severity];

    console.log(
      `${color}[Security ${event.severity.toUpperCase()}]${reset} ${event.type}`,
      event.username ? `user: ${event.username}` : "",
      event.ip ? `ip: ${event.ip}` : "",
      event.details ? JSON.stringify(event.details) : ""
    );
  }

  /**
   * Log successful login
   */
  logLoginSuccess(username: string, ip: string, userAgent?: string): void {
    if (!securityConfig.logging.logSuccessfulLogins) {
      return;
    }

    this.log({
      type: "login_success",
      username,
      ip,
      userAgent,
      severity: "low",
    });
  }

  /**
   * Log failed login
   */
  logLoginFailed(username: string, ip: string, reason: string, userAgent?: string): void {
    if (!securityConfig.logging.logFailedAttempts) {
      return;
    }

    this.log({
      type: "login_failed",
      username,
      ip,
      userAgent,
      details: { reason },
      severity: "medium",
    });
  }

  /**
   * Log blocked login attempt
   */
  logLoginBlocked(username: string, ip: string, reason: string, userAgent?: string): void {
    if (!securityConfig.logging.logBlockedAttempts) {
      return;
    }

    this.log({
      type: "login_blocked",
      username,
      ip,
      userAgent,
      details: { reason },
      severity: "high",
    });
  }

  /**
   * Log account locked
   */
  logAccountLocked(username: string, ip: string, failedAttempts: number): void {
    this.log({
      type: "account_locked",
      username,
      ip,
      details: { failedAttempts },
      severity: "high",
    });
  }

  /**
   * Log account unlocked
   */
  logAccountUnlocked(username: string, unlockedBy?: string): void {
    this.log({
      type: "account_unlocked",
      username,
      details: { unlockedBy },
      severity: "low",
    });
  }

  /**
   * Log IP blocked
   */
  logIPBlocked(ip: string, attemptCount: number): void {
    this.log({
      type: "ip_blocked",
      ip,
      details: { attemptCount },
      severity: "critical",
    });
  }

  /**
   * Log IP unblocked
   */
  logIPUnblocked(ip: string, unblockedBy?: string): void {
    this.log({
      type: "ip_unblocked",
      ip,
      details: { unblockedBy },
      severity: "low",
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(username: string, ip: string, remainingTime: number): void {
    this.log({
      type: "rate_limit_exceeded",
      username,
      ip,
      details: { remainingTime },
      severity: "medium",
    });
  }

  /**
   * Log CAPTCHA required
   */
  logCaptchaRequired(username: string, ip: string, failedAttempts: number): void {
    this.log({
      type: "captcha_required",
      username,
      ip,
      details: { failedAttempts },
      severity: "medium",
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(description: string, username?: string, ip?: string, details?: any): void {
    this.log({
      type: "suspicious_activity",
      username,
      ip,
      details: { description, ...details },
      severity: "high",
    });
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100, type?: SecurityEventType): SecurityEvent[] {
    let events = this.events.slice(-limit);
    
    if (type) {
      events = events.filter(e => e.type === type);
    }
    
    return events.reverse(); // Most recent first
  }

  /**
   * Get events by username
   */
  getEventsByUsername(username: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(e => e.username === username)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get events by IP
   */
  getEventsByIP(ip: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(e => e.ip === ip)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: SecurityEvent["severity"], limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(e => e.severity === severity)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get events in time range
   */
  getEventsInRange(startTime: number, endTime: number): SecurityEvent[] {
    return this.events
      .filter(e => e.timestamp >= startTime && e.timestamp <= endTime)
      .reverse();
  }

  /**
   * Get statistics
   */
  getStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recentEvents = this.events.filter(e => e.timestamp > last24h);

    return {
      total: this.events.length,
      last24h: recentEvents.length,
      byType: this.getEventCountByType(recentEvents),
      bySeverity: this.getEventCountBySeverity(recentEvents),
      topIPs: this.getTopIPs(recentEvents, 10),
      topUsers: this.getTopUsers(recentEvents, 10),
    };
  }

  /**
   * Get event count by type
   */
  private getEventCountByType(events: SecurityEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of events) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * Get event count by severity
   */
  private getEventCountBySeverity(events: SecurityEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of events) {
      counts[event.severity] = (counts[event.severity] || 0) + 1;
    }
    return counts;
  }

  /**
   * Get top IPs
   */
  private getTopIPs(events: SecurityEvent[], limit: number): Array<{ ip: string; count: number }> {
    const counts: Record<string, number> = {};
    for (const event of events) {
      if (event.ip) {
        counts[event.ip] = (counts[event.ip] || 0) + 1;
      }
    }
    
    return Object.entries(counts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get top users
   */
  private getTopUsers(events: SecurityEvent[], limit: number): Array<{ username: string; count: number }> {
    const counts: Record<string, number> = {};
    for (const event of events) {
      if (event.username) {
        counts[event.username] = (counts[event.username] || 0) + 1;
      }
    }
    
    return Object.entries(counts)
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Clear all events (for testing)
   */
  clear(): void {
    this.events = [];
  }
}

/**
 * Global security logger instance
 */
export const securityLogger = new SecurityLogger();
