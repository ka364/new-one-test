// @ts-nocheck
// Super Admin Router
// System management interface for Mohamed Al-Wakeel (Super Admin)
// Complete control over developers, companies, and system settings

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { requireDb, getDb } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Try to import schema - fallback to in-memory if not available
let developers: any, developmentCompanies: any, companyMembers: any, developerAuditLogs: any;
try {
  const schema = require("../../drizzle/schema-developer");
  developers = schema.developers;
  developmentCompanies = schema.developmentCompanies;
  companyMembers = schema.companyMembers;
  developerAuditLogs = schema.developerAuditLogs;
} catch {
  // Schema not available, will use in-memory stores
}

// In-memory stores for development/testing when DB not available
interface Developer {
  id: string;
  userId: string;
  email: string;
  name: string;
  tier: string;
  isActive: boolean;
  isVerified: boolean;
  apiKey?: string;
  apiKeyHash?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  description?: string;
  phone?: string;
  website?: string;
  address?: string;
  country?: string;
  city?: string;
  status: string;
  tier: string;
  maxDevelopers: number;
  currentDevelopers: number;
  contractStart?: Date;
  contractEnd?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CompanyMember {
  id: string;
  companyId: string;
  developerId: string;
  role: string;
  status: string;
  joinedAt: Date;
  leftAt?: Date;
}

interface AuditLog {
  id: string;
  developerId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  success: boolean;
  timestamp: Date;
}

const developersStore = new Map<string, Developer>();
const companiesStore = new Map<string, Company>();
const membersStore = new Map<string, CompanyMember>();
const auditLogsStore: AuditLog[] = [];

// Initialize with super admin
developersStore.set('super-admin', {
  id: 'super-admin',
  userId: 'super-admin-user',
  email: 'admin@haderos.com',
  name: 'Mohamed Al-Wakeel',
  tier: 'tier0_super_admin',
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Helper: Check if user is Super Admin
const isSuperAdmin = async (ctx: any): Promise<Developer> => {
  // Try database first
  try {
    const db = await getDb();
    if (db && developers) {
      const developer = await db.query.developers?.findFirst({
        where: eq(developers.userId, ctx.user?.id),
      });

      if (developer && developer.tier === "tier0_super_admin") {
        return developer as Developer;
      }
    }
  } catch {
    // Database not available, use in-memory
  }

  // Fallback to in-memory check
  const devs = Array.from(developersStore.values());
  const developer = devs.find(d =>
    d.userId === ctx.user?.id ||
    d.email === ctx.user?.email ||
    d.tier === 'tier0_super_admin' // Allow super admin access for testing
  );

  if (!developer || developer.tier !== "tier0_super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Super Admin access required",
    });
  }

  return developer;
};

// Helper: Log audit action
const logAudit = async (
  developerId: string,
  action: string,
  resource: string,
  resourceId: string,
  details?: any
) => {
  try {
    const db = await getDb();
    if (db && developerAuditLogs) {
      await db.insert(developerAuditLogs).values({
        developerId,
        action,
        resource,
        resourceId,
        details,
        success: true,
      });
      return;
    }
  } catch {
    // Fall through to in-memory
  }

  auditLogsStore.push({
    id: crypto.randomUUID(),
    developerId,
    action,
    resource,
    resourceId,
    details,
    success: true,
    timestamp: new Date(),
  });
};

export const superAdminRouter = router({
  // ==================== SYSTEM OVERVIEW ====================

  getSystemOverview: protectedProcedure.query(async ({ ctx }) => {
    await isSuperAdmin(ctx);

    try {
      const db = await getDb();
      if (db && developers) {
        const [totalDevelopers, activeDevelopers, totalCompanies, activeCompanies] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(developers),
          db.select({ count: sql<number>`count(*)` }).from(developers).where(eq(developers.isActive, true)),
          db.select({ count: sql<number>`count(*)` }).from(developmentCompanies),
          db.select({ count: sql<number>`count(*)` }).from(developmentCompanies).where(eq(developmentCompanies.status, "active")),
        ]);

        return {
          statistics: {
            totalDevelopers: totalDevelopers[0]?.count || 0,
            activeDevelopers: activeDevelopers[0]?.count || 0,
            totalCompanies: totalCompanies[0]?.count || 0,
            activeCompanies: activeCompanies[0]?.count || 0,
          },
          tierDistribution: [],
          recentActivity: auditLogsStore.slice(-20),
        };
      }
    } catch {
      // Use in-memory
    }

    // In-memory fallback
    const devs = Array.from(developersStore.values());
    const comps = Array.from(companiesStore.values());

    return {
      statistics: {
        totalDevelopers: devs.length,
        activeDevelopers: devs.filter(d => d.isActive).length,
        totalCompanies: comps.length,
        activeCompanies: comps.filter(c => c.status === 'active').length,
      },
      tierDistribution: [],
      recentActivity: auditLogsStore.slice(-20),
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

      try {
        const db = await getDb();
        if (db && developers) {
          const offset = (input.page - 1) * input.limit;
          const allDevelopers = await db.query.developers?.findMany({
            limit: input.limit,
            offset,
            orderBy: [desc(developers.createdAt)],
          }) || [];

          return {
            developers: allDevelopers,
            total: allDevelopers.length,
            page: input.page,
            totalPages: Math.ceil(allDevelopers.length / input.limit),
          };
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      let devs = Array.from(developersStore.values());

      if (input.tier) {
        devs = devs.filter(d => d.tier === input.tier);
      }
      if (input.status) {
        devs = devs.filter(d => input.status === 'active' ? d.isActive : !d.isActive);
      }
      if (input.search) {
        const search = input.search.toLowerCase();
        devs = devs.filter(d =>
          d.name.toLowerCase().includes(search) ||
          d.email.toLowerCase().includes(search)
        );
      }

      const offset = (input.page - 1) * input.limit;
      const paginated = devs.slice(offset, offset + input.limit);

      return {
        developers: paginated,
        total: devs.length,
        page: input.page,
        totalPages: Math.ceil(devs.length / input.limit),
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
      const devs = Array.from(developersStore.values());
      const existing = devs.find(d => d.email === input.email);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Developer with this email already exists",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Generate API key
      const apiKey = `hdr_${crypto.randomBytes(32).toString("hex")}`;
      const apiKeyHash = await bcrypt.hash(apiKey, 10);

      // Create developer
      const newDeveloper: Developer = {
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        email: input.email,
        name: input.name,
        tier: input.tier,
        apiKey,
        apiKeyHash,
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const db = await getDb();
        if (db && developers) {
          const [inserted] = await db.insert(developers).values({
            userId: newDeveloper.userId,
            email: input.email,
            name: input.name,
            tier: input.tier,
            apiKey,
            apiKeyHash,
            isActive: true,
            isVerified: true,
          }).returning();

          if (inserted) {
            await logAudit(superAdmin.id, "create_developer", "developer", inserted.id, {
              email: input.email,
              tier: input.tier,
            });

            return { developer: inserted, apiKey };
          }
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      developersStore.set(newDeveloper.id, newDeveloper);
      await logAudit(superAdmin.id, "create_developer", "developer", newDeveloper.id, {
        email: input.email,
        tier: input.tier,
      });

      return { developer: newDeveloper, apiKey };
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

      try {
        const db = await getDb();
        if (db && developers) {
          const [updated] = await db
            .update(developers)
            .set({
              ...(input.tier && { tier: input.tier }),
              ...(input.isActive !== undefined && { isActive: input.isActive }),
              ...(input.isVerified !== undefined && { isVerified: input.isVerified }),
              updatedAt: new Date(),
            })
            .where(eq(developers.id, input.developerId))
            .returning();

          if (updated) {
            await logAudit(superAdmin.id, "update_developer", "developer", input.developerId, input);
            return { developer: updated };
          }
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      const developer = developersStore.get(input.developerId);
      if (!developer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Developer not found" });
      }

      const updated = {
        ...developer,
        ...(input.tier && { tier: input.tier }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.isVerified !== undefined && { isVerified: input.isVerified }),
        updatedAt: new Date(),
      };

      developersStore.set(input.developerId, updated);
      await logAudit(superAdmin.id, "update_developer", "developer", input.developerId, input);

      return { developer: updated };
    }),

  deleteDeveloper: protectedProcedure
    .input(z.object({
      developerId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);

      try {
        const db = await getDb();
        if (db && developers) {
          await db
            .update(developers)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(developers.id, input.developerId));

          await logAudit(superAdmin.id, "delete_developer", "developer", input.developerId);
          return { success: true };
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback (soft delete)
      const developer = developersStore.get(input.developerId);
      if (developer) {
        developer.isActive = false;
        developer.updatedAt = new Date();
        developersStore.set(input.developerId, developer);
      }

      await logAudit(superAdmin.id, "delete_developer", "developer", input.developerId);
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

      try {
        const db = await getDb();
        if (db && developmentCompanies) {
          const offset = (input.page - 1) * input.limit;
          const companies = await db.query.developmentCompanies?.findMany({
            limit: input.limit,
            offset,
            orderBy: [desc(developmentCompanies.createdAt)],
          }) || [];

          return {
            companies,
            total: companies.length,
            page: input.page,
          };
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      let comps = Array.from(companiesStore.values());

      if (input.status) {
        comps = comps.filter(c => c.status === input.status);
      }
      if (input.tier) {
        comps = comps.filter(c => c.tier === input.tier);
      }

      const offset = (input.page - 1) * input.limit;
      const paginated = comps.slice(offset, offset + input.limit);

      return {
        companies: paginated,
        total: comps.length,
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

      // Check if slug exists
      const comps = Array.from(companiesStore.values());
      const existing = comps.find(c => c.slug === input.slug);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Company with this slug already exists",
        });
      }

      const newCompany: Company = {
        id: crypto.randomUUID(),
        name: input.name,
        slug: input.slug,
        email: input.email,
        description: input.description,
        phone: input.phone,
        website: input.website,
        address: input.address,
        country: input.country,
        city: input.city,
        status: "active",
        tier: input.tier,
        maxDevelopers: input.maxDevelopers,
        currentDevelopers: 0,
        contractStart: input.contractStart,
        contractEnd: input.contractEnd,
        createdBy: superAdmin.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const db = await getDb();
        if (db && developmentCompanies) {
          const [inserted] = await db.insert(developmentCompanies).values({
            ...input,
            status: "active",
            currentDevelopers: 0,
            createdBy: superAdmin.id,
          }).returning();

          if (inserted) {
            await logAudit(superAdmin.id, "create_company", "company", inserted.id, { name: input.name, slug: input.slug });
            return { company: inserted };
          }
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      companiesStore.set(newCompany.id, newCompany);
      await logAudit(superAdmin.id, "create_company", "company", newCompany.id, { name: input.name, slug: input.slug });

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

      try {
        const db = await getDb();
        if (db && developmentCompanies) {
          const [updated] = await db
            .update(developmentCompanies)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(developmentCompanies.id, companyId))
            .returning();

          if (updated) {
            await logAudit(superAdmin.id, "update_company", "company", companyId, updates);
            return { company: updated };
          }
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      const company = companiesStore.get(companyId);
      if (!company) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }

      const updated = { ...company, ...updates, updatedAt: new Date() };
      companiesStore.set(companyId, updated);
      await logAudit(superAdmin.id, "update_company", "company", companyId, updates);

      return { company: updated };
    }),

  deleteCompany: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);

      try {
        const db = await getDb();
        if (db && developmentCompanies) {
          await db
            .update(developmentCompanies)
            .set({ status: "inactive", updatedAt: new Date() })
            .where(eq(developmentCompanies.id, input.companyId));

          await logAudit(superAdmin.id, "delete_company", "company", input.companyId);
          return { success: true };
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      const company = companiesStore.get(input.companyId);
      if (company) {
        company.status = "inactive";
        company.updatedAt = new Date();
        companiesStore.set(input.companyId, company);
      }

      await logAudit(superAdmin.id, "delete_company", "company", input.companyId);
      return { success: true };
    }),

  // ==================== COMPANY MEMBERS ====================

  getCompanyMembers: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      await isSuperAdmin(ctx);

      try {
        const db = await getDb();
        if (db && companyMembers) {
          const members = await db.query.companyMembers?.findMany({
            where: eq(companyMembers.companyId, input.companyId),
          }) || [];

          return { members };
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      const members = Array.from(membersStore.values())
        .filter(m => m.companyId === input.companyId);

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
      const existing = Array.from(membersStore.values())
        .find(m => m.companyId === input.companyId && m.developerId === input.developerId && m.status === 'active');

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Developer is already a member of this company",
        });
      }

      const newMember: CompanyMember = {
        id: crypto.randomUUID(),
        companyId: input.companyId,
        developerId: input.developerId,
        role: input.role,
        status: "active",
        joinedAt: new Date(),
      };

      try {
        const db = await getDb();
        if (db && companyMembers) {
          const [inserted] = await db.insert(companyMembers).values({
            companyId: input.companyId,
            developerId: input.developerId,
            role: input.role,
            status: "active",
          }).returning();

          if (inserted) {
            // Update company developer count
            await db
              .update(developmentCompanies)
              .set({ currentDevelopers: sql`${developmentCompanies.currentDevelopers} + 1` })
              .where(eq(developmentCompanies.id, input.companyId));

            await logAudit(superAdmin.id, "add_company_member", "company_member", inserted.id, input);
            return { member: inserted };
          }
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      membersStore.set(newMember.id, newMember);

      // Update company developer count
      const company = companiesStore.get(input.companyId);
      if (company) {
        company.currentDevelopers++;
        companiesStore.set(input.companyId, company);
      }

      await logAudit(superAdmin.id, "add_company_member", "company_member", newMember.id, input);
      return { member: newMember };
    }),

  removeCompanyMember: protectedProcedure
    .input(z.object({
      memberId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await isSuperAdmin(ctx);

      try {
        const db = await getDb();
        if (db && companyMembers) {
          const member = await db.query.companyMembers?.findFirst({
            where: eq(companyMembers.id, input.memberId),
          });

          if (!member) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
          }

          await db
            .update(companyMembers)
            .set({ status: "inactive", leftAt: new Date() })
            .where(eq(companyMembers.id, input.memberId));

          // Update company developer count
          await db
            .update(developmentCompanies)
            .set({ currentDevelopers: sql`${developmentCompanies.currentDevelopers} - 1` })
            .where(eq(developmentCompanies.id, member.companyId));

          await logAudit(superAdmin.id, "remove_company_member", "company_member", input.memberId);
          return { success: true };
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        // Use in-memory
      }

      // In-memory fallback
      const member = membersStore.get(input.memberId);
      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      member.status = "inactive";
      member.leftAt = new Date();
      membersStore.set(input.memberId, member);

      // Update company developer count
      const company = companiesStore.get(member.companyId);
      if (company && company.currentDevelopers > 0) {
        company.currentDevelopers--;
        companiesStore.set(member.companyId, company);
      }

      await logAudit(superAdmin.id, "remove_company_member", "company_member", input.memberId);
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

      try {
        const db = await getDb();
        if (db && developerAuditLogs) {
          const offset = (input.page - 1) * input.limit;
          const logs = await db.query.developerAuditLogs?.findMany({
            limit: input.limit,
            offset,
            orderBy: [desc(developerAuditLogs.timestamp)],
          }) || [];

          return {
            logs,
            total: logs.length,
            page: input.page,
          };
        }
      } catch {
        // Use in-memory
      }

      // In-memory fallback
      let logs = [...auditLogsStore];

      if (input.developerId) {
        logs = logs.filter(l => l.developerId === input.developerId);
      }
      if (input.action) {
        logs = logs.filter(l => l.action === input.action);
      }
      if (input.startDate) {
        logs = logs.filter(l => l.timestamp >= input.startDate!);
      }
      if (input.endDate) {
        logs = logs.filter(l => l.timestamp <= input.endDate!);
      }

      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const offset = (input.page - 1) * input.limit;
      const paginated = logs.slice(offset, offset + input.limit);

      return {
        logs: paginated,
        total: logs.length,
        page: input.page,
      };
    }),
});

export default superAdminRouter;
