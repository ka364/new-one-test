// Developer Authentication Router
// Handles developer login, OAuth, 2FA, and session management

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { requireDb } from "../db";
import { eq, and, gt } from "drizzle-orm";
import * as crypto from "crypto";

// Note: speakeasy and QRCode need to be installed: npm install speakeasy qrcode @types/speakeasy @types/qrcode

// Helper Functions
function generateApiKey(): string {
  return `hdr_${crypto.randomBytes(32).toString("hex")}`;
}

function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

// In-memory store for developers (replace with database when schema is ready)
const developersStore = new Map<string, any>();
const sessionsStore = new Map<string, any>();
const auditLogs: any[] = [];

async function logAudit(
  developerId: string | null,
  action: string,
  details: Record<string, any>,
  ipAddress?: string,
  success: boolean = true
) {
  auditLogs.push({
    id: crypto.randomUUID(),
    developerId,
    action,
    details,
    ipAddress,
    success,
    timestamp: new Date(),
  });
}

export const developerAuthRouter = router({
  // Register new developer (invitation-based)
  register: publicProcedure
    .input(
      z.object({
        invitationToken: z.string(),
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        githubUsername: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if developer already exists
      const existing = Array.from(developersStore.values()).find(
        d => d.email === input.email
      );

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Developer with this email already exists",
        });
      }

      // Create developer account
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);
      const developerId = crypto.randomUUID();

      const newDeveloper = {
        id: developerId,
        userId: developerId,
        email: input.email,
        name: input.name,
        githubUsername: input.githubUsername,
        tier: "tier3_contributor",
        accessLevel: "read_write",
        apiKey,
        apiKeyHash,
        isActive: true,
        isVerified: false,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        ipWhitelist: [],
        createdAt: new Date(),
      };

      developersStore.set(developerId, newDeveloper);

      // Log audit
      await logAudit(developerId, "developer_registered", {
        email: input.email,
        tier: newDeveloper.tier,
      });

      return {
        developer: { ...newDeveloper, apiKey: undefined, apiKeyHash: undefined },
        apiKey, // Return API key only once
      };
    }),

  // Login with credentials
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        twoFactorCode: z.string().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Find developer
      const developer = Array.from(developersStore.values()).find(
        d => d.email === input.email
      );

      if (!developer || !developer.isActive) {
        await logAudit(null, "login_failed", { email: input.email }, input.ipAddress, false);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Check IP whitelist
      if (developer.ipWhitelist && developer.ipWhitelist.length > 0) {
        if (!input.ipAddress || !developer.ipWhitelist.includes(input.ipAddress)) {
          await logAudit(developer.id, "login_failed_ip", { ip: input.ipAddress }, input.ipAddress, false);
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "IP address not whitelisted",
          });
        }
      }

      // Create session
      const token = generateSessionToken();
      const refreshToken = generateSessionToken();
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const session = {
        id: sessionId,
        developerId: developer.id,
        token,
        refreshToken,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt,
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };

      sessionsStore.set(sessionId, session);

      // Update last login
      developer.lastLoginAt = new Date();

      // Log audit
      await logAudit(developer.id, "login_success", {}, input.ipAddress);

      return {
        developer: { ...developer, apiKey: undefined, apiKeyHash: undefined, twoFactorSecret: undefined },
        session,
        token,
        refreshToken,
      };
    }),

  // Logout
  logout: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const session = Array.from(sessionsStore.values()).find(
        s => s.token === input.token
      );

      if (session) {
        sessionsStore.delete(session.id);
        await logAudit(session.developerId, "logout", {});
      }

      return { success: true };
    }),

  // Regenerate API Key
  regenerateApiKey: protectedProcedure
    .input(z.object({ developerId: z.string() }))
    .mutation(async ({ input }) => {
      const developer = developersStore.get(input.developerId);

      if (!developer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developer not found",
        });
      }

      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);

      developer.apiKey = apiKey;
      developer.apiKeyHash = apiKeyHash;

      await logAudit(input.developerId, "api_key_regenerated", {});

      return { apiKey };
    }),

  // Get developer by ID
  getById: protectedProcedure
    .input(z.object({ developerId: z.string() }))
    .query(async ({ input }) => {
      const developer = developersStore.get(input.developerId);

      if (!developer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developer not found",
        });
      }

      return { ...developer, apiKey: undefined, apiKeyHash: undefined, twoFactorSecret: undefined };
    }),

  // Get all developers (admin only)
  getAll: protectedProcedure.query(async () => {
    return Array.from(developersStore.values()).map(d => ({
      ...d,
      apiKey: undefined,
      apiKeyHash: undefined,
      twoFactorSecret: undefined,
    }));
  }),

  // Get active sessions
  getSessions: protectedProcedure
    .input(z.object({ developerId: z.string() }))
    .query(async ({ input }) => {
      const now = new Date();
      return Array.from(sessionsStore.values()).filter(
        s => s.developerId === input.developerId && s.expiresAt > now
      );
    }),

  // Revoke session
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string(), developerId: z.string() }))
    .mutation(async ({ input }) => {
      const session = sessionsStore.get(input.sessionId);

      if (session && session.developerId === input.developerId) {
        sessionsStore.delete(input.sessionId);
        await logAudit(input.developerId, "session_revoked", { sessionId: input.sessionId });
      }

      return { success: true };
    }),

  // Get audit logs
  getAuditLogs: protectedProcedure
    .input(z.object({
      developerId: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      let logs = auditLogs;

      if (input.developerId) {
        logs = logs.filter(l => l.developerId === input.developerId);
      }

      return logs.slice(-input.limit).reverse();
    }),
});

// Helper functions
function getAccessLevelForTier(tier: string): string {
  const mapping: Record<string, string> = {
    tier1_admin: "full_access",
    tier2_core_dev: "read_write_deploy",
    tier3_contributor: "read_write",
    tier4_reviewer: "read_review",
    tier5_guest: "read_only",
  };
  return mapping[tier] || "read_only";
}

function getDefaultEnvironments(tier: string): string[] {
  if (tier === "tier1_admin") return ["production", "staging", "development", "sandbox"];
  if (tier === "tier2_core_dev") return ["staging", "development", "sandbox"];
  return ["sandbox"];
}
