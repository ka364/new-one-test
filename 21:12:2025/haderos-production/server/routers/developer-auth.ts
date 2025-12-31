// Developer Authentication Router
// Handles developer login, OAuth, 2FA, and session management

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { developers, developerSessions, developerAuditLogs, developerPermissions } from "../../drizzle/schema-developer";
import { eq, and, gt } from "drizzle-orm";
import * as crypto from "crypto";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

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

async function logAudit(
  db: any,
  developerId: string | null,
  action: string,
  details: Record<string, any>,
  ipAddress?: string,
  success: boolean = true
) {
  await db.insert(developerAuditLogs).values({
    developerId,
    action,
    details,
    ipAddress,
    success,
    timestamp: new Date(),
  });
}

export const developerAuthRouter = createTRPCRouter({
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
    .mutation(async ({ ctx, input }) => {
      // Verify invitation token
      const invitation = await ctx.db.query.developerInvitations.findFirst({
        where: and(
          eq(developerInvitations.token, input.invitationToken),
          gt(developerInvitations.expiresAt, new Date())
        ),
      });

      if (!invitation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired invitation token",
        });
      }

      // Check if developer already exists
      const existing = await ctx.db.query.developers.findFirst({
        where: eq(developers.email, input.email),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Developer with this email already exists",
        });
      }

      // Create developer account
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);

      const [newDeveloper] = await ctx.db
        .insert(developers)
        .values({
          userId: crypto.randomUUID(),
          email: input.email,
          name: input.name,
          githubUsername: input.githubUsername,
          tier: invitation.tier,
          accessLevel: getAccessLevelForTier(invitation.tier),
          apiKey,
          apiKeyHash,
          isActive: true,
          isVerified: false,
        })
        .returning();

      // Create default permissions
      await ctx.db.insert(developerPermissions).values({
        developerId: newDeveloper!.id,
        canRead: true,
        canWrite: invitation.tier !== "tier5_guest",
        canDeploy: ["tier1_admin", "tier2_core_dev"].includes(invitation.tier),
        canReview: ["tier1_admin", "tier2_core_dev", "tier4_reviewer"].includes(invitation.tier),
        canManageUsers: invitation.tier === "tier1_admin",
        canManageSettings: invitation.tier === "tier1_admin",
        environments: getDefaultEnvironments(invitation.tier),
      });

      // Mark invitation as accepted
      await ctx.db
        .update(developerInvitations)
        .set({ acceptedAt: new Date() })
        .where(eq(developerInvitations.id, invitation.id));

      // Log audit
      await logAudit(ctx.db, newDeveloper!.id, "developer_registered", {
        email: input.email,
        tier: invitation.tier,
      });

      return {
        developer: newDeveloper,
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
    .mutation(async ({ ctx, input }) => {
      // Find developer
      const developer = await ctx.db.query.developers.findFirst({
        where: eq(developers.email, input.email),
      });

      if (!developer || !developer.isActive) {
        await logAudit(ctx.db, null, "login_failed", { email: input.email }, input.ipAddress, false);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Check 2FA if enabled
      if (developer.twoFactorEnabled) {
        if (!input.twoFactorCode) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "2FA code required",
          });
        }

        const verified = speakeasy.totp.verify({
          secret: developer.twoFactorSecret!,
          encoding: "base32",
          token: input.twoFactorCode,
          window: 2,
        });

        if (!verified) {
          await logAudit(ctx.db, developer.id, "login_failed_2fa", {}, input.ipAddress, false);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid 2FA code",
          });
        }
      }

      // Check IP whitelist
      if (developer.ipWhitelist && developer.ipWhitelist.length > 0) {
        if (!input.ipAddress || !developer.ipWhitelist.includes(input.ipAddress)) {
          await logAudit(ctx.db, developer.id, "login_failed_ip", { ip: input.ipAddress }, input.ipAddress, false);
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "IP address not whitelisted",
          });
        }
      }

      // Create session
      const token = generateSessionToken();
      const refreshToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const [session] = await ctx.db
        .insert(developerSessions)
        .values({
          developerId: developer.id,
          token,
          refreshToken,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          expiresAt,
        })
        .returning();

      // Update last login
      await ctx.db
        .update(developers)
        .set({ lastLoginAt: new Date() })
        .where(eq(developers.id, developer.id));

      // Log audit
      await logAudit(ctx.db, developer.id, "login_success", {}, input.ipAddress);

      return {
        developer,
        session,
        token,
        refreshToken,
      };
    }),

  // Logout
  logout: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.query.developerSessions.findFirst({
        where: eq(developerSessions.token, input.token),
      });

      if (session) {
        await ctx.db
          .delete(developerSessions)
          .where(eq(developerSessions.id, session.id));

        await logAudit(ctx.db, session.developerId, "logout", {});
      }

      return { success: true };
    }),

  // Enable 2FA
  enable2FA: protectedProcedure.mutation(async ({ ctx }) => {
    const developerId = ctx.session.user.id;

    const secret = speakeasy.generateSecret({
      name: `HADEROS (${ctx.session.user.email})`,
      issuer: "HADEROS",
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store secret temporarily (not enabled until verified)
    await ctx.db
      .update(developers)
      .set({ twoFactorSecret: secret.base32 })
      .where(eq(developers.id, developerId));

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }),

  // Verify and activate 2FA
  verify2FA: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      const developer = await ctx.db.query.developers.findFirst({
        where: eq(developers.id, developerId),
      });

      if (!developer?.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA not initialized",
        });
      }

      const verified = speakeasy.totp.verify({
        secret: developer.twoFactorSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid 2FA code",
        });
      }

      // Enable 2FA
      await ctx.db
        .update(developers)
        .set({ twoFactorEnabled: true })
        .where(eq(developers.id, developerId));

      await logAudit(ctx.db, developerId, "2fa_enabled", {});

      return { success: true };
    }),

  // Disable 2FA
  disable2FA: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      const developer = await ctx.db.query.developers.findFirst({
        where: eq(developers.id, developerId),
      });

      if (!developer?.twoFactorEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA not enabled",
        });
      }

      const verified = speakeasy.totp.verify({
        secret: developer.twoFactorSecret!,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid 2FA code",
        });
      }

      // Disable 2FA
      await ctx.db
        .update(developers)
        .set({
          twoFactorEnabled: false,
          twoFactorSecret: null,
        })
        .where(eq(developers.id, developerId));

      await logAudit(ctx.db, developerId, "2fa_disabled", {});

      return { success: true };
    }),

  // Regenerate API Key
  regenerateApiKey: protectedProcedure.mutation(async ({ ctx }) => {
    const developerId = ctx.session.user.id;

    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    await ctx.db
      .update(developers)
      .set({ apiKey, apiKeyHash })
      .where(eq(developers.id, developerId));

    await logAudit(ctx.db, developerId, "api_key_regenerated", {});

    return { apiKey };
  }),

  // Get current developer info
  me: protectedProcedure.query(async ({ ctx }) => {
    const developerId = ctx.session.user.id;

    const developer = await ctx.db.query.developers.findFirst({
      where: eq(developers.id, developerId),
      with: {
        permissions: true,
      },
    });

    if (!developer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Developer not found",
      });
    }

    return developer;
  }),

  // Get active sessions
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const developerId = ctx.session.user.id;

    const sessions = await ctx.db.query.developerSessions.findMany({
      where: and(
        eq(developerSessions.developerId, developerId),
        gt(developerSessions.expiresAt, new Date())
      ),
      orderBy: (sessions, { desc }) => [desc(sessions.lastActivityAt)],
    });

    return sessions;
  }),

  // Revoke session
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      await ctx.db
        .delete(developerSessions)
        .where(
          and(
            eq(developerSessions.id, input.sessionId),
            eq(developerSessions.developerId, developerId)
          )
        );

      await logAudit(ctx.db, developerId, "session_revoked", { sessionId: input.sessionId });

      return { success: true };
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
