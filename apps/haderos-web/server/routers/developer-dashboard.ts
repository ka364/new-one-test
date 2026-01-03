// Developer Dashboard Router
// Provides APIs for developer portal dashboard, analytics, and management

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import * as crypto from "crypto";

// In-memory stores (replace with database when schema is ready)
const developersStore = new Map<string, any>();
const codeReviewsStore = new Map<string, any>();
const deploymentsStore = new Map<string, any>();
const auditLogsStore: any[] = [];
const invitationsStore = new Map<string, any>();

export const developerDashboardRouter = router({
  // Get dashboard overview
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const developerId = ctx.user?.id || "default";

    // Get developer info
    let developer = developersStore.get(developerId);

    if (!developer) {
      // Create default developer for testing
      developer = {
        id: developerId,
        name: ctx.user?.name || "Developer",
        email: ctx.user?.email || "dev@haderos.ai",
        tier: "tier3_contributor",
        isActive: true,
        createdAt: new Date(),
      };
      developersStore.set(developerId, developer);
    }

    // Get stats
    const totalDevelopers = developer.tier === "tier1_admin" ? developersStore.size : null;
    const pendingReviews = Array.from(codeReviewsStore.values()).filter(
      r => r.reviewerId === developerId && r.status === "pending"
    ).length;
    const recentDeployments = Array.from(deploymentsStore.values())
      .filter(d => d.developerId === developerId)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 5);
    const recentActivities = auditLogsStore
      .filter(l => l.developerId === developerId)
      .slice(-10)
      .reverse();

    return {
      developer,
      stats: {
        totalDevelopers,
        activeSessions: 1,
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
      const allDevelopers = Array.from(developersStore.values());

      let filtered = allDevelopers;
      if (input.tier) {
        filtered = filtered.filter(d => d.tier === input.tier);
      }
      if (input.isActive !== undefined) {
        filtered = filtered.filter(d => d.isActive === input.isActive);
      }

      const offset = (input.page - 1) * input.limit;
      const paginated = filtered.slice(offset, offset + input.limit);

      return {
        developers: paginated,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / input.limit),
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
      // Check if already exists
      const existing = Array.from(developersStore.values()).find(
        d => d.email === input.email
      );

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Developer already exists",
        });
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);

      const invitation = {
        id: crypto.randomUUID(),
        email: input.email,
        tier: input.tier,
        invitedBy: ctx.user?.id,
        token,
        expiresAt,
        createdAt: new Date(),
      };

      invitationsStore.set(invitation.id, invitation);

      // Log audit
      auditLogsStore.push({
        id: crypto.randomUUID(),
        developerId: ctx.user?.id,
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
      const currentDeveloperId = ctx.user?.id || "default";
      const targetDeveloperId = input.developerId || currentDeveloperId;

      let developer = developersStore.get(targetDeveloperId);
      if (!developer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developer not found",
        });
      }

      // Update fields
      if (input.name) developer.name = input.name;
      if (input.bio !== undefined) developer.bio = input.bio;
      if (input.skills) developer.skills = input.skills;
      if (input.specializations) developer.specializations = input.specializations;
      if (input.timezone) developer.timezone = input.timezone;
      if (input.tier) developer.tier = input.tier;
      if (input.isActive !== undefined) developer.isActive = input.isActive;
      developer.updatedAt = new Date();

      developersStore.set(targetDeveloperId, developer);

      // Log audit
      auditLogsStore.push({
        id: crypto.randomUUID(),
        developerId: currentDeveloperId,
        action: "developer_updated",
        details: { targetDeveloperId, changes: input },
        timestamp: new Date(),
      });

      return developer;
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
      const developerId = ctx.user?.id || "default";

      let reviews = Array.from(codeReviewsStore.values()).filter(
        r => r.reviewerId === developerId
      );

      if (input.status) {
        reviews = reviews.filter(r => r.status === input.status);
      }

      const offset = (input.page - 1) * input.limit;
      const paginated = reviews.slice(offset, offset + input.limit);

      return {
        reviews: paginated,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: reviews.length,
          totalPages: Math.ceil(reviews.length / input.limit),
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
      const developerId = ctx.user?.id || "default";

      let deployments = Array.from(deploymentsStore.values()).filter(
        d => d.developerId === developerId
      );

      if (input.environment) {
        deployments = deployments.filter(d => d.environment === input.environment);
      }
      if (input.status) {
        deployments = deployments.filter(d => d.status === input.status);
      }

      const offset = (input.page - 1) * input.limit;
      const paginated = deployments.slice(offset, offset + input.limit);

      return {
        deployments: paginated,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: deployments.length,
          totalPages: Math.ceil(deployments.length / input.limit),
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
      const developerId = ctx.user?.id || "default";

      let logs = auditLogsStore.filter(l => l.developerId === developerId);

      if (input.action) {
        logs = logs.filter(l => l.action === input.action);
      }
      if (input.startDate) {
        logs = logs.filter(l => l.timestamp >= input.startDate!);
      }
      if (input.endDate) {
        logs = logs.filter(l => l.timestamp <= input.endDate!);
      }

      const offset = (input.page - 1) * input.limit;
      const paginated = logs.slice(offset, offset + input.limit);

      return {
        logs: paginated,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: logs.length,
          totalPages: Math.ceil(logs.length / input.limit),
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
      const developerId = ctx.user?.id || "default";

      // Get activity stats
      const filteredLogs = auditLogsStore.filter(
        l => l.developerId === developerId &&
             l.timestamp >= input.startDate &&
             l.timestamp <= input.endDate
      );

      const activities = filteredLogs.reduce((acc: Record<string, number>, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {});

      // Get deployment stats
      const filteredDeployments = Array.from(deploymentsStore.values()).filter(
        d => d.developerId === developerId &&
             d.startedAt >= input.startDate &&
             d.startedAt <= input.endDate
      );

      const deploymentStats = filteredDeployments.reduce((acc: Record<string, number>, dep) => {
        const key = `${dep.environment}-${dep.status}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      // Get review stats
      const filteredReviews = Array.from(codeReviewsStore.values()).filter(
        r => r.reviewerId === developerId &&
             r.createdAt >= input.startDate &&
             r.createdAt <= input.endDate
      );

      const reviewStats = filteredReviews.reduce((acc: Record<string, number>, rev) => {
        acc[rev.status] = (acc[rev.status] || 0) + 1;
        return acc;
      }, {});

      return {
        activities: Object.entries(activities).map(([action, count]) => ({ action, count })),
        deploymentStats: Object.entries(deploymentStats).map(([key, count]) => {
          const [environment, status] = key.split("-");
          return { environment, status, count };
        }),
        reviewStats: Object.entries(reviewStats).map(([status, count]) => ({ status, count })),
      };
    }),

  // Create deployment
  createDeployment: protectedProcedure
    .input(
      z.object({
        environment: z.enum(["production", "staging", "development", "sandbox"]),
        version: z.string(),
        commitHash: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.user?.id || "default";

      const deployment = {
        id: crypto.randomUUID(),
        developerId,
        environment: input.environment,
        version: input.version,
        commitHash: input.commitHash,
        description: input.description,
        status: "pending",
        startedAt: new Date(),
      };

      deploymentsStore.set(deployment.id, deployment);

      // Log audit
      auditLogsStore.push({
        id: crypto.randomUUID(),
        developerId,
        action: "deployment_created",
        details: { deploymentId: deployment.id, environment: input.environment },
        timestamp: new Date(),
      });

      return deployment;
    }),
});
