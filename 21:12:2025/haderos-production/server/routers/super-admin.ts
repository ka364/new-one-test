// Super Admin Router
// System management interface for Mohamed Al-Wakeel (Super Admin)
// Complete control over developers, companies, and system settings

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { developers, developmentCompanies, companyMembers, developerAuditLogs } from "../../drizzle/schema-developer";
import { eq, and, desc, count, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Helper: Check if user is Super Admin
const isSuperAdmin = async (ctx: any) => {
  const developer = await ctx.db.query.developers.findFirst({
    where: eq(developers.userId, ctx.user.id),
  });
  
  if (!developer || developer.tier !== "tier0_super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Super Admin access required",
    });
  }
  
  return developer;
};

export const superAdminRouter = createTRPCRouter({
  // ==================== SYSTEM OVERVIEW ====================
  
  getSystemOverview: protectedProcedure.query(async ({ ctx }) => {
    await isSuperAdmin(ctx);
    
    // Get statistics
    const [
      totalDevelopers,
      activeDevelopers,
      totalCompanies,
      activeCompanies,
      recentActivity,
    ] = await Promise.all([
      ctx.db.select({ count: count() }).from(developers),
      ctx.db.select({ count: count() }).from(developers).where(eq(developers.isActive, true)),
      ctx.db.select({ count: count() }).from(developmentCompanies),
      ctx.db.select({ count: count() }).from(developmentCompanies).where(eq(developmentCompanies.status, "active")),
      ctx.db.query.developerAuditLogs.findMany({
        limit: 20,
        orderBy: [desc(developerAuditLogs.timestamp)],
        with: {
          developer: {
            columns: {
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
    ]);
    
    // Tier distribution
    const tierDistribution = await ctx.db
      .select({
        tier: developers.tier,
        count: count(),
      })
      .from(developers)
      .groupBy(developers.tier);
    
    return {
      statistics: {
        totalDevelopers: totalDevelopers[0]?.count || 0,
        activeDevelopers: activeDevelopers[0]?.count || 0,
        totalCompanies: totalCompanies[0]?.count || 0,
        activeCompanies: activeCompanies[0]?.count || 0,
      },
      tierDistribution,
      recentActivity,
    };
  }),
  
  // ==================== DEVELOPER MANAGEMENT ====================
  
  getAllDevelopers: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      tier: z.enum(["tier0_super_admin", "tier1_admin", "tier2_core_dev", "tier3_contributor", "tier4_reviewer", "tier5_guest"]).optional(),
      status: z.enum(["active", "inactive"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await isSuperAdmin(ctx);
      
      const offset = (input.page - 1) * input.limit;
      
      let query = ctx.db.query.developers.findMany({
        limit: input.limit,
        offset,
        orderBy: [desc(developers.createdAt)],
        with: {
          permissions: true,
        },
      });
      
      // Apply filters (simplified - in production use Drizzle filters properly)
      const allDevelopers = await query;
      
      return {
        developers: allDevelopers,
        total: allDevelopers.length,
        page: input.page,
        totalPages: Math.ceil(allDevelopers.length / input.limit),
      };
    }),
  
  createDeveloper: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      tier: z.enum(["tier0_super_admin", "tier1_admin", "tier2_core_dev", "tier3_contributor", "tier4_reviewer", "tier5_guest"]),
      password: z.string().min(8),
      companyId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);
      
      // Check if email already exists
      const existing = await ctx.db.query.developers.findFirst({
        where: eq(developers.email, input.email),
      });
      
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Developer with this email already exists",
        });
      }
      
      // Hash password (assuming you have a user system)
      const passwordHash = await bcrypt.hash(input.password, 10);
      
      // Generate API key
      const apiKey = `hdr_${crypto.randomBytes(32).toString("hex")}`;
      const apiKeyHash = await bcrypt.hash(apiKey, 10);
      
      // Create developer
      const [newDeveloper] = await ctx.db.insert(developers).values({
        userId: crypto.randomUUID(), // In production, create actual user first
        email: input.email,
        name: input.name,
        tier: input.tier,
        apiKey,
        apiKeyHash,
        isActive: true,
        isVerified: true,
      }).returning();
      
      // Add to company if specified
      if (input.companyId) {
        await ctx.db.insert(companyMembers).values({
          companyId: input.companyId,
          developerId: newDeveloper.id,
          role: "developer",
          status: "active",
        });
      }
      
      // Log action
      await ctx.db.insert(developerAuditLogs).values({
        developerId: superAdmin.id,
        action: "create_developer",
        resource: "developer",
        resourceId: newDeveloper.id,
        details: {
          email: input.email,
          tier: input.tier,
          companyId: input.companyId,
        },
        success: true,
      });
      
      return {
        developer: newDeveloper,
        apiKey, // Return once, won't be shown again
      };
    }),
  
  updateDeveloper: protectedProcedure
    .input(z.object({
      developerId: z.string().uuid(),
      tier: z.enum(["tier0_super_admin", "tier1_admin", "tier2_core_dev", "tier3_contributor", "tier4_reviewer", "tier5_guest"]).optional(),
      isActive: z.boolean().optional(),
      isVerified: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);
      
      const [updated] = await ctx.db
        .update(developers)
        .set({
          ...(input.tier && { tier: input.tier }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          ...(input.isVerified !== undefined && { isVerified: input.isVerified }),
          updatedAt: new Date(),
        })
        .where(eq(developers.id, input.developerId))
        .returning();
      
      // Log action
      await ctx.db.insert(developerAuditLogs).values({
        developerId: superAdmin.id,
        action: "update_developer",
        resource: "developer",
        resourceId: input.developerId,
        details: input,
        success: true,
      });
      
      return { developer: updated };
    }),
  
  deleteDeveloper: protectedProcedure
    .input(z.object({
      developerId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);
      
      // Soft delete by deactivating
      await ctx.db
        .update(developers)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(developers.id, input.developerId));
      
      // Log action
      await ctx.db.insert(developerAuditLogs).values({
        developerId: superAdmin.id,
        action: "delete_developer",
        resource: "developer",
        resourceId: input.developerId,
        success: true,
      });
      
      return { success: true };
    }),
  
  // ==================== COMPANY MANAGEMENT ====================
  
  getAllCompanies: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      status: z.enum(["active", "suspended", "inactive"]).optional(),
      tier: z.enum(["enterprise", "standard", "startup"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      await isSuperAdmin(ctx);
      
      const offset = (input.page - 1) * input.limit;
      
      const companies = await ctx.db.query.developmentCompanies.findMany({
        limit: input.limit,
        offset,
        orderBy: [desc(developmentCompanies.createdAt)],
      });
      
      // Get member counts
      const companiesWithCounts = await Promise.all(
        companies.map(async (company) => {
          const [memberCount] = await ctx.db
            .select({ count: count() })
            .from(companyMembers)
            .where(and(
              eq(companyMembers.companyId, company.id),
              eq(companyMembers.status, "active")
            ));
          
          return {
            ...company,
            currentDevelopers: memberCount?.count || 0,
          };
        })
      );
      
      return {
        companies: companiesWithCounts,
        total: companies.length,
        page: input.page,
      };
    }),
  
  createCompany: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      email: z.string().email(),
      phone: z.string().optional(),
      website: z.string().url().optional(),
      address: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      tier: z.enum(["enterprise", "standard", "startup"]).default("standard"),
      maxDevelopers: z.number().default(10),
      contractStart: z.date().optional(),
      contractEnd: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);
      
      // Check if slug already exists
      const existing = await ctx.db.query.developmentCompanies.findFirst({
        where: eq(developmentCompanies.slug, input.slug),
      });
      
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Company with this slug already exists",
        });
      }
      
      const [newCompany] = await ctx.db.insert(developmentCompanies).values({
        ...input,
        status: "active",
        currentDevelopers: 0,
        createdBy: superAdmin.id,
      }).returning();
      
      // Log action
      await ctx.db.insert(developerAuditLogs).values({
        developerId: superAdmin.id,
        action: "create_company",
        resource: "company",
        resourceId: newCompany.id,
        details: { name: input.name, slug: input.slug },
        success: true,
      });
      
      return { company: newCompany };
    }),
  
  updateCompany: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      name: z.string().optional(),
      description: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      website: z.string().url().optional(),
      status: z.enum(["active", "suspended", "inactive"]).optional(),
      tier: z.enum(["enterprise", "standard", "startup"]).optional(),
      maxDevelopers: z.number().optional(),
      contractStart: z.date().optional(),
      contractEnd: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);
      
      const { companyId, ...updates } = input;
      
      const [updated] = await ctx.db
        .update(developmentCompanies)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(developmentCompanies.id, companyId))
        .returning();
      
      // Log action
      await ctx.db.insert(developerAuditLogs).values({
        developerId: superAdmin.id,
        action: "update_company",
        resource: "company",
        resourceId: companyId,
        details: updates,
        success: true,
      });
      
      return { company: updated };
    }),
  
  deleteCompany: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);
      
      // Soft delete
      await ctx.db
        .update(developmentCompanies)
        .set({
          status: "inactive",
          updatedAt: new Date(),
        })
        .where(eq(developmentCompanies.id, input.companyId));
      
      // Log action
      await ctx.db.insert(developerAuditLogs).values({
        developerId: superAdmin.id,
        action: "delete_company",
        resource: "company",
        resourceId: input.companyId,
        success: true,
      });
      
      return { success: true };
    }),
  
  // ==================== COMPANY MEMBERS ====================
  
  getCompanyMembers: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      await isSuperAdmin(ctx);
      
      const members = await ctx.db.query.companyMembers.findMany({
        where: eq(companyMembers.companyId, input.companyId),
        with: {
          developer: {
            columns: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              tier: true,
              isActive: true,
            },
          },
        },
      });
      
      return { members };
    }),
  
  addCompanyMember: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      developerId: z.string().uuid(),
      role: z.enum(["owner", "admin", "developer"]).default("developer"),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);
      
      // Check if already a member
      const existing = await ctx.db.query.companyMembers.findFirst({
        where: and(
          eq(companyMembers.companyId, input.companyId),
          eq(companyMembers.developerId, input.developerId),
          eq(companyMembers.status, "active")
        ),
      });
      
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Developer is already a member of this company",
        });
      }
      
      const [newMember] = await ctx.db.insert(companyMembers).values({
        companyId: input.companyId,
        developerId: input.developerId,
        role: input.role,
        status: "active",
      }).returning();
      
      // Update company developer count
      await ctx.db
        .update(developmentCompanies)
        .set({
          currentDevelopers: sql`${developmentCompanies.currentDevelopers} + 1`,
        })
        .where(eq(developmentCompanies.id, input.companyId));
      
      // Log action
      await ctx.db.insert(developerAuditLogs).values({
        developerId: superAdmin.id,
        action: "add_company_member",
        resource: "company_member",
        resourceId: newMember.id,
        details: input,
        success: true,
      });
      
      return { member: newMember };
    }),
  
  removeCompanyMember: protectedProcedure
    .input(z.object({
      memberId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);
      
      const member = await ctx.db.query.companyMembers.findFirst({
        where: eq(companyMembers.id, input.memberId),
      });
      
      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }
      
      // Soft delete
      await ctx.db
        .update(companyMembers)
        .set({
          status: "inactive",
          leftAt: new Date(),
        })
        .where(eq(companyMembers.id, input.memberId));
      
      // Update company developer count
      await ctx.db
        .update(developmentCompanies)
        .set({
          currentDevelopers: sql`${developmentCompanies.currentDevelopers} - 1`,
        })
        .where(eq(developmentCompanies.id, member.companyId));
      
      // Log action
      await ctx.db.insert(developerAuditLogs).values({
        developerId: superAdmin.id,
        action: "remove_company_member",
        resource: "company_member",
        resourceId: input.memberId,
        success: true,
      });
      
      return { success: true };
    }),
  
  // ==================== AUDIT LOGS ====================
  
  getAuditLogs: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      developerId: z.string().uuid().optional(),
      action: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await isSuperAdmin(ctx);
      
      const offset = (input.page - 1) * input.limit;
      
      const logs = await ctx.db.query.developerAuditLogs.findMany({
        limit: input.limit,
        offset,
        orderBy: [desc(developerAuditLogs.timestamp)],
        with: {
          developer: {
            columns: {
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
      
      return {
        logs,
        total: logs.length,
        page: input.page,
      };
    }),
});
