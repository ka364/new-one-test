/**
 * Security Router
 * 
 * tRPC API for security monitoring and management
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { securityConfig, getEnvironment, isSecurityEnabled } from "../security/config";
import { securityStore } from "../security/store";
import { securityLogger } from "../security/logger";
import {
  getAllLockedAccounts,
  getAllBlockedIPs,
  unlockAccount,
  unblockIP,
} from "../security/account-protection";

export const securityRouter = router({
  /**
   * Get security configuration
   */
  getConfig: publicProcedure.query(() => {
    return {
      environment: getEnvironment(),
      enabled: isSecurityEnabled(),
      config: securityConfig,
    };
  }),

  /**
   * Get security statistics
   */
  getStats: publicProcedure.query(() => {
    const storeStats = securityStore.getStats();
    const loggerStats = securityLogger.getStats();

    return {
      store: storeStats,
      logger: loggerStats,
      environment: getEnvironment(),
      enabled: isSecurityEnabled(),
    };
  }),

  /**
   * Get all locked accounts
   */
  getLockedAccounts: publicProcedure.query(() => {
    return getAllLockedAccounts();
  }),

  /**
   * Get all blocked IPs
   */
  getBlockedIPs: publicProcedure.query(() => {
    return getAllBlockedIPs();
  }),

  /**
   * Unlock an account
   */
  unlockAccount: publicProcedure
    .input(z.object({ username: z.string() }))
    .mutation(({ input }) => {
      const success = unlockAccount(input.username);
      
      if (success) {
        securityLogger.logAccountUnlocked(input.username, "admin");
      }
      
      return { success };
    }),

  /**
   * Unblock an IP
   */
  unblockIP: publicProcedure
    .input(z.object({ ip: z.string() }))
    .mutation(({ input }) => {
      const success = unblockIP(input.ip);
      
      if (success) {
        securityLogger.logIPUnblocked(input.ip, "admin");
      }
      
      return { success };
    }),

  /**
   * Get recent security events
   */
  getRecentEvents: publicProcedure
    .input(
      z.object({
        limit: z.number().optional().default(100),
        type: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return securityLogger.getRecentEvents(input.limit, input.type as any);
    }),

  /**
   * Get events by username
   */
  getEventsByUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
        limit: z.number().optional().default(100),
      })
    )
    .query(({ input }) => {
      return securityLogger.getEventsByUsername(input.username, input.limit);
    }),

  /**
   * Get events by IP
   */
  getEventsByIP: publicProcedure
    .input(
      z.object({
        ip: z.string(),
        limit: z.number().optional().default(100),
      })
    )
    .query(({ input }) => {
      return securityLogger.getEventsByIP(input.ip, input.limit);
    }),

  /**
   * Get events by severity
   */
  getEventsBySeverity: publicProcedure
    .input(
      z.object({
        severity: z.enum(["low", "medium", "high", "critical"]),
        limit: z.number().optional().default(100),
      })
    )
    .query(({ input }) => {
      return securityLogger.getEventsBySeverity(input.severity, input.limit);
    }),

  /**
   * Get events in time range
   */
  getEventsInRange: publicProcedure
    .input(
      z.object({
        startTime: z.number(),
        endTime: z.number(),
      })
    )
    .query(({ input }) => {
      return securityLogger.getEventsInRange(input.startTime, input.endTime);
    }),

  /**
   * Clear all security data (for testing only)
   */
  clearAll: publicProcedure.mutation(() => {
    if (getEnvironment() === "production") {
      throw new Error("Cannot clear security data in production");
    }
    
    securityStore.clear();
    securityLogger.clear();
    
    return { success: true };
  }),
});
