// Developer Dashboard Router
// Provides APIs for developer portal dashboard, analytics, and management

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  developers,
  developerSessions,
  developerAuditLogs,
  developerPermissions,
  codeReviews,
  deployments,
  developerInvitations,
} from "../../drizzle/schema-developer";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";

export const developerDashboardRouter = createTRPCRouter({
  // Get dashboard overview
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const developerId = ctx.session.user.id;

    // Get developer info
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

    // Get stats
    const [
      totalDevelopers,
      activeSessions,
      pendingReviews,
      recentDeployments,
      recentActivities,
    ] = await Promise.all([
      // Total developers (if admin)
      developer.tier === "tier1_admin"
        ? ctx.db.select({ count: count() }).from(developers).then((r) => r[0]?.count || 0)
        : Promise.resolve(null),

      // Active sessions
      ctx.db
        .select({ count: count() })
        .from(developerSessions)
        .where(
          and(
            eq(developerSessions.developerId, developerId),
            gte(developerSessions.expiresAt, new Date())
          )
        )
        .then((r) => r[0]?.count || 0),

      // Pending code reviews
      ctx.db
        .select({ count: count() })
        .from(codeReviews)
        .where(
          and(
            eq(codeReviews.reviewerId, developerId),
            eq(codeReviews.status, "pending")
          )
        )
        .then((r) => r[0]?.count || 0),

      // Recent deployments
      ctx.db.query.deployments.findMany({
        where: eq(deployments.developerId, developerId),
        orderBy: [desc(deployments.startedAt)],
        limit: 5,
      }),

      // Recent activities
      ctx.db.query.developerAuditLogs.findMany({
        where: eq(developerAuditLogs.developerId, developerId),
        orderBy: [desc(developerAuditLogs.timestamp)],
        limit: 10,
      }),
    ]);

    return {
      developer,
      stats: {
        totalDevelopers,
        activeSessions,
        pendingReviews,
      },
      recentDeployments,
      recentActivities,
    };
  }),

  // Get all developers (admin only)
  getAllDevelopers: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        tier: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      // Check if admin
      const developer = await ctx.db.query.developers.findFirst({
        where: eq(developers.id, developerId),
      });

      if (developer?.tier !== "tier1_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const offset = (input.page - 1) * input.limit;

      const allDevelopers = await ctx.db.query.developers.findMany({
        limit: input.limit,
        offset,
        orderBy: [desc(developers.createdAt)],
        with: {
          permissions: true,
        },
      });

      const total = await ctx.db
        .select({ count: count() })
        .from(developers)
        .then((r) => r[0]?.count || 0);

      return {
        developers: allDevelopers,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Invite new developer (admin only)
  inviteDeveloper: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        tier: z.enum(["tier1_admin", "tier2_core_dev", "tier3_contributor", "tier4_reviewer", "tier5_guest"]),
        expiresInDays: z.number().default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      // Check if admin
      const developer = await ctx.db.query.developers.findFirst({
        where: eq(developers.id, developerId),
      });

      if (developer?.tier !== "tier1_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Check if already invited or exists
      const existing = await ctx.db.query.developers.findFirst({
        where: eq(developers.email, input.email),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Developer already exists",
        });
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);

      const [invitation] = await ctx.db
        .insert(developerInvitations)
        .values({
          email: input.email,
          tier: input.tier,
          invitedBy: developerId,
          token,
          expiresAt,
        })
        .returning();

      // Log audit
      await ctx.db.insert(developerAuditLogs).values({
        developerId,
        action: "developer_invited",
        details: { email: input.email, tier: input.tier },
        timestamp: new Date(),
      });

      return {
        invitation,
        invitationUrl: `https://dev.haderos.ai/register?token=${token}`,
      };
    }),

  // Update developer (admin or self)
  updateDeveloper: protectedProcedure
    .input(
      z.object({
        developerId: z.string().optional(),
        name: z.string().optional(),
        bio: z.string().optional(),
        skills: z.array(z.string()).optional(),
        specializations: z.array(z.string()).optional(),
        timezone: z.string().optional(),
        tier: z.string().optional(), // Admin only
        isActive: z.boolean().optional(), // Admin only
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentDeveloperId = ctx.session.user.id;
      const targetDeveloperId = input.developerId || currentDeveloperId;

      // Check permissions
      const currentDeveloper = await ctx.db.query.developers.findFirst({
        where: eq(developers.id, currentDeveloperId),
      });

      const isAdmin = currentDeveloper?.tier === "tier1_admin";
      const isSelf = targetDeveloperId === currentDeveloperId;

      if (!isAdmin && !isSelf) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot update other developers",
        });
      }

      // Prepare update data
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.skills) updateData.skills = input.skills;
      if (input.specializations) updateData.specializations = input.specializations;
      if (input.timezone) updateData.timezone = input.timezone;

      // Admin-only fields
      if (isAdmin) {
        if (input.tier) updateData.tier = input.tier;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
      }

      updateData.updatedAt = new Date();

      const [updated] = await ctx.db
        .update(developers)
        .set(updateData)
        .where(eq(developers.id, targetDeveloperId))
        .returning();

      // Log audit
      await ctx.db.insert(developerAuditLogs).values({
        developerId: currentDeveloperId,
        action: "developer_updated",
        details: { targetDeveloperId, changes: updateData },
        timestamp: new Date(),
      });

      return updated;
    }),

  // Get code reviews
  getCodeReviews: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "changes_requested", "rejected"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      const offset = (input.page - 1) * input.limit;

      const reviews = await ctx.db.query.codeReviews.findMany({
        where: input.status
          ? and(
              eq(codeReviews.reviewerId, developerId),
              eq(codeReviews.status, input.status)
            )
          : eq(codeReviews.reviewerId, developerId),
        limit: input.limit,
        offset,
        orderBy: [desc(codeReviews.createdAt)],
      });

      const total = await ctx.db
        .select({ count: count() })
        .from(codeReviews)
        .where(
          input.status
            ? and(
                eq(codeReviews.reviewerId, developerId),
                eq(codeReviews.status, input.status)
              )
            : eq(codeReviews.reviewerId, developerId)
        )
        .then((r) => r[0]?.count || 0);

      return {
        reviews,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Get deployments
  getDeployments: protectedProcedure
    .input(
      z.object({
        environment: z.enum(["production", "staging", "development", "sandbox"]).optional(),
        status: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      const offset = (input.page - 1) * input.limit;

      let conditions = [eq(deployments.developerId, developerId)];
      if (input.environment) conditions.push(eq(deployments.environment, input.environment));
      if (input.status) conditions.push(eq(deployments.status, input.status));

      const allDeployments = await ctx.db.query.deployments.findMany({
        where: and(...conditions),
        limit: input.limit,
        offset,
        orderBy: [desc(deployments.startedAt)],
      });

      const total = await ctx.db
        .select({ count: count() })
        .from(deployments)
        .where(and(...conditions))
        .then((r) => r[0]?.count || 0);

      return {
        deployments: allDeployments,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Get audit logs
  getAuditLogs: protectedProcedure
    .input(
      z.object({
        action: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      const offset = (input.page - 1) * input.limit;

      let conditions = [eq(developerAuditLogs.developerId, developerId)];
      if (input.action) conditions.push(eq(developerAuditLogs.action, input.action));
      if (input.startDate) conditions.push(gte(developerAuditLogs.timestamp, input.startDate));
      if (input.endDate) conditions.push(lte(developerAuditLogs.timestamp, input.endDate));

      const logs = await ctx.db.query.developerAuditLogs.findMany({
        where: and(...conditions),
        limit: input.limit,
        offset,
        orderBy: [desc(developerAuditLogs.timestamp)],
      });

      const total = await ctx.db
        .select({ count: count() })
        .from(developerAuditLogs)
        .where(and(...conditions))
        .then((r) => r[0]?.count || 0);

      return {
        logs,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Get analytics
  getAnalytics: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      // Get activity stats
      const activities = await ctx.db
        .select({
          action: developerAuditLogs.action,
          count: count(),
        })
        .from(developerAuditLogs)
        .where(
          and(
            eq(developerAuditLogs.developerId, developerId),
            gte(developerAuditLogs.timestamp, input.startDate),
            lte(developerAuditLogs.timestamp, input.endDate)
          )
        )
        .groupBy(developerAuditLogs.action);

      // Get deployment stats
      const deploymentStats = await ctx.db
        .select({
          environment: deployments.environment,
          status: deployments.status,
          count: count(),
        })
        .from(deployments)
        .where(
          and(
            eq(deployments.developerId, developerId),
            gte(deployments.startedAt, input.startDate),
            lte(deployments.startedAt, input.endDate)
          )
        )
        .groupBy(deployments.environment, deployments.status);

      // Get review stats
      const reviewStats = await ctx.db
        .select({
          status: codeReviews.status,
          count: count(),
        })
        .from(codeReviews)
        .where(
          and(
            eq(codeReviews.reviewerId, developerId),
            gte(codeReviews.createdAt, input.startDate),
            lte(codeReviews.createdAt, input.endDate)
          )
        )
        .groupBy(codeReviews.status);

      return {
        activities,
        deploymentStats,
        reviewStats,
      };
    }),
});
