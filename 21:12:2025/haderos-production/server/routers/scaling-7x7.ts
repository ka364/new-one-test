/**
 * HADEROS 7×7 Scaling System Router
 * 
 * Comprehensive API for managing all stakeholders with 7×7 scaling:
 * - Factories: 7 → 49 → 343
 * - Merchants: 7 → 49 → 343
 * - Marketers: 7 → 49 → 343
 * - Developers: 7 → 49 → 343
 * - Employees: 7 → 49 → 343
 * - Customers: 7 → 49 → 343
 */

import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "../db";
import { 
  scalingHierarchy, 
  factories, 
  merchants, 
  marketers,
  developers,
  employees,
  customers,
  scalingMetrics,
  expansionPlans,
  insertScalingHierarchySchema,
  insertFactorySchema,
  insertMerchantSchema,
  insertMarketerSchema,
  insertDeveloperSchema,
  insertEmployeeSchema,
  insertCustomerSchema,
  insertScalingMetricsSchema,
  insertExpansionPlanSchema,
} from "../../drizzle/schema-7x7-scaling";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate hierarchy code based on stakeholder type and position
 * Format: {TYPE}-{LEVEL}-{POSITION}
 * Example: F-1-3 (Factory, Level 1, Position 3)
 */
function generateHierarchyCode(
  stakeholderType: string,
  level: number,
  position: number,
  parentCode?: string
): string {
  const typePrefix = stakeholderType.charAt(0).toUpperCase();
  
  if (level === 1) {
    return `${typePrefix}-1-${position}`;
  } else if (parentCode) {
    return `${parentCode}-${position}`;
  }
  
  return `${typePrefix}-${level}-${position}`;
}

/**
 * Initialize 7 entities for a stakeholder type at tier 1
 */
async function initializeTier1(stakeholderType: string) {
  const hierarchies = [];
  
  for (let i = 1; i <= 7; i++) {
    const code = generateHierarchyCode(stakeholderType, 1, i);
    const id = nanoid();
    
    hierarchies.push({
      id,
      stakeholderType: stakeholderType as any,
      tier: "tier1_initial" as const,
      parentId: null,
      level: 1,
      position: i,
      code,
      name: `${stakeholderType.charAt(0).toUpperCase() + stakeholderType.slice(1)} ${i}`,
      isActive: true,
      activatedAt: new Date(),
      metadata: {},
    });
  }
  
  await db.insert(scalingHierarchy).values(hierarchies);
  return hierarchies;
}

/**
 * Expand from tier 1 to tier 2 (7 → 49)
 */
async function expandToTier2(parentHierarchyId: string) {
  const parent = await db.query.scalingHierarchy.findFirst({
    where: eq(scalingHierarchy.id, parentHierarchyId),
  });
  
  if (!parent) {
    throw new Error("Parent hierarchy not found");
  }
  
  const children = [];
  
  for (let i = 1; i <= 7; i++) {
    const code = generateHierarchyCode(
      parent.stakeholderType,
      2,
      i,
      parent.code
    );
    const id = nanoid();
    
    children.push({
      id,
      stakeholderType: parent.stakeholderType,
      tier: "tier2_expansion" as const,
      parentId: parent.id,
      level: 2,
      position: i,
      code,
      name: `${parent.name} - Sub ${i}`,
      isActive: true,
      activatedAt: new Date(),
      metadata: {},
    });
  }
  
  await db.insert(scalingHierarchy).values(children);
  return children;
}

/**
 * Expand from tier 2 to tier 3 (49 → 343)
 */
async function expandToTier3(parentHierarchyId: string) {
  const parent = await db.query.scalingHierarchy.findFirst({
    where: eq(scalingHierarchy.id, parentHierarchyId),
  });
  
  if (!parent) {
    throw new Error("Parent hierarchy not found");
  }
  
  const children = [];
  
  for (let i = 1; i <= 7; i++) {
    const code = generateHierarchyCode(
      parent.stakeholderType,
      3,
      i,
      parent.code
    );
    const id = nanoid();
    
    children.push({
      id,
      stakeholderType: parent.stakeholderType,
      tier: "tier3_mega" as const,
      parentId: parent.id,
      level: 3,
      position: i,
      code,
      name: `${parent.name} - Sub ${i}`,
      isActive: true,
      activatedAt: new Date(),
      metadata: {},
    });
  }
  
  await db.insert(scalingHierarchy).values(children);
  return children;
}

// ============================================================================
// ROUTER
// ============================================================================

export const scaling7x7Router = router({
  
  // ==========================================================================
  // HIERARCHY MANAGEMENT
  // ==========================================================================
  
  /**
   * Initialize tier 1 for a stakeholder type (7 entities)
   */
  initializeTier1: publicProcedure
    .input(z.object({
      stakeholderType: z.enum(["factory", "merchant", "marketer", "developer", "employee", "customer"]),
    }))
    .mutation(async ({ input }) => {
      const hierarchies = await initializeTier1(input.stakeholderType);
      return {
        success: true,
        count: hierarchies.length,
        hierarchies,
      };
    }),
  
  /**
   * Expand a single entity to tier 2 (1 → 7)
   */
  expandToTier2: publicProcedure
    .input(z.object({
      parentHierarchyId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const children = await expandToTier2(input.parentHierarchyId);
      return {
        success: true,
        count: children.length,
        children,
      };
    }),
  
  /**
   * Expand a single entity to tier 3 (1 → 7)
   */
  expandToTier3: publicProcedure
    .input(z.object({
      parentHierarchyId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const children = await expandToTier3(input.parentHierarchyId);
      return {
        success: true,
        count: children.length,
        children,
      };
    }),
  
  /**
   * Expand all tier 1 entities to tier 2 (7 → 49)
   */
  expandAllToTier2: publicProcedure
    .input(z.object({
      stakeholderType: z.enum(["factory", "merchant", "marketer", "developer", "employee", "customer"]),
    }))
    .mutation(async ({ input }) => {
      const tier1Entities = await db.query.scalingHierarchy.findMany({
        where: and(
          eq(scalingHierarchy.stakeholderType, input.stakeholderType as any),
          eq(scalingHierarchy.tier, "tier1_initial")
        ),
      });
      
      let totalChildren = 0;
      for (const entity of tier1Entities) {
        const children = await expandToTier2(entity.id);
        totalChildren += children.length;
      }
      
      return {
        success: true,
        tier1Count: tier1Entities.length,
        tier2Count: totalChildren,
        message: `Expanded ${tier1Entities.length} tier 1 entities to ${totalChildren} tier 2 entities`,
      };
    }),
  
  /**
   * Expand all tier 2 entities to tier 3 (49 → 343)
   */
  expandAllToTier3: publicProcedure
    .input(z.object({
      stakeholderType: z.enum(["factory", "merchant", "marketer", "developer", "employee", "customer"]),
    }))
    .mutation(async ({ input }) => {
      const tier2Entities = await db.query.scalingHierarchy.findMany({
        where: and(
          eq(scalingHierarchy.stakeholderType, input.stakeholderType as any),
          eq(scalingHierarchy.tier, "tier2_expansion")
        ),
      });
      
      let totalChildren = 0;
      for (const entity of tier2Entities) {
        const children = await expandToTier3(entity.id);
        totalChildren += children.length;
      }
      
      return {
        success: true,
        tier2Count: tier2Entities.length,
        tier3Count: totalChildren,
        message: `Expanded ${tier2Entities.length} tier 2 entities to ${totalChildren} tier 3 entities`,
      };
    }),
  
  /**
   * Get hierarchy overview for a stakeholder type
   */
  getHierarchyOverview: publicProcedure
    .input(z.object({
      stakeholderType: z.enum(["factory", "merchant", "marketer", "developer", "employee", "customer"]),
    }))
    .query(async ({ input }) => {
      const allEntities = await db.query.scalingHierarchy.findMany({
        where: eq(scalingHierarchy.stakeholderType, input.stakeholderType as any),
      });
      
      const tier1 = allEntities.filter(e => e.tier === "tier1_initial");
      const tier2 = allEntities.filter(e => e.tier === "tier2_expansion");
      const tier3 = allEntities.filter(e => e.tier === "tier3_mega");
      
      return {
        stakeholderType: input.stakeholderType,
        total: allEntities.length,
        tier1Count: tier1.length,
        tier2Count: tier2.length,
        tier3Count: tier3.length,
        tier1Entities: tier1,
        tier2Entities: tier2,
        tier3Entities: tier3,
      };
    }),
  
  /**
   * Get complete hierarchy tree for a stakeholder type
   */
  getHierarchyTree: publicProcedure
    .input(z.object({
      stakeholderType: z.enum(["factory", "merchant", "marketer", "developer", "employee", "customer"]),
    }))
    .query(async ({ input }) => {
      const allEntities = await db.query.scalingHierarchy.findMany({
        where: eq(scalingHierarchy.stakeholderType, input.stakeholderType as any),
      });
      
      // Build tree structure
      const tier1 = allEntities.filter(e => e.tier === "tier1_initial");
      const tree = tier1.map(t1 => ({
        ...t1,
        children: allEntities
          .filter(e => e.parentId === t1.id)
          .map(t2 => ({
            ...t2,
            children: allEntities.filter(e => e.parentId === t2.id),
          })),
      }));
      
      return {
        stakeholderType: input.stakeholderType,
        tree,
      };
    }),
  
  // ==========================================================================
  // FACTORIES
  // ==========================================================================
  
  /**
   * Create a new factory
   */
  createFactory: publicProcedure
    .input(insertFactorySchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      const factory = await db.insert(factories).values({
        ...input,
        id,
      }).returning();
      
      return factory[0];
    }),
  
  /**
   * Get all factories
   */
  getFactories: publicProcedure
    .query(async () => {
      return await db.query.factories.findMany();
    }),
  
  /**
   * Get factory by ID
   */
  getFactory: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.factories.findFirst({
        where: eq(factories.id, input.id),
      });
    }),
  
  /**
   * Update factory
   */
  updateFactory: publicProcedure
    .input(z.object({
      id: z.string(),
      data: insertFactorySchema.partial().omit({ id: true, createdAt: true }),
    }))
    .mutation(async ({ input }) => {
      const updated = await db
        .update(factories)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(factories.id, input.id))
        .returning();
      
      return updated[0];
    }),
  
  // ==========================================================================
  // MERCHANTS
  // ==========================================================================
  
  /**
   * Create a new merchant
   */
  createMerchant: publicProcedure
    .input(insertMerchantSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      const merchant = await db.insert(merchants).values({
        ...input,
        id,
      }).returning();
      
      return merchant[0];
    }),
  
  /**
   * Get all merchants
   */
  getMerchants: publicProcedure
    .query(async () => {
      return await db.query.merchants.findMany();
    }),
  
  /**
   * Get merchant by ID
   */
  getMerchant: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.merchants.findFirst({
        where: eq(merchants.id, input.id),
      });
    }),
  
  /**
   * Update merchant
   */
  updateMerchant: publicProcedure
    .input(z.object({
      id: z.string(),
      data: insertMerchantSchema.partial().omit({ id: true, createdAt: true }),
    }))
    .mutation(async ({ input }) => {
      const updated = await db
        .update(merchants)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(merchants.id, input.id))
        .returning();
      
      return updated[0];
    }),
  
  // ==========================================================================
  // MARKETERS
  // ==========================================================================
  
  /**
   * Create a new marketer
   */
  createMarketer: publicProcedure
    .input(insertMarketerSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      const marketer = await db.insert(marketers).values({
        ...input,
        id,
      }).returning();
      
      return marketer[0];
    }),
  
  /**
   * Get all marketers
   */
  getMarketers: publicProcedure
    .query(async () => {
      return await db.query.marketers.findMany();
    }),
  
  /**
   * Get marketer by ID
   */
  getMarketer: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.marketers.findFirst({
        where: eq(marketers.id, input.id),
      });
    }),
  
  /**
   * Update marketer
   */
  updateMarketer: publicProcedure
    .input(z.object({
      id: z.string(),
      data: insertMarketerSchema.partial().omit({ id: true, createdAt: true }),
    }))
    .mutation(async ({ input }) => {
      const updated = await db
        .update(marketers)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(marketers.id, input.id))
        .returning();
      
      return updated[0];
    }),
  
  // ==========================================================================
  // DEVELOPERS
  // ==========================================================================
  
  /**
   * Create a new developer
   */
  createDeveloper: publicProcedure
    .input(insertDeveloperSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      const developer = await db.insert(developers).values({
        ...input,
        id,
      }).returning();
      
      return developer[0];
    }),
  
  /**
   * Get all developers
   */
  getDevelopers: publicProcedure
    .query(async () => {
      return await db.query.developers.findMany();
    }),
  
  /**
   * Get developer by ID
   */
  getDeveloper: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.developers.findFirst({
        where: eq(developers.id, input.id),
      });
    }),
  
  /**
   * Update developer
   */
  updateDeveloper: publicProcedure
    .input(z.object({
      id: z.string(),
      data: insertDeveloperSchema.partial().omit({ id: true, createdAt: true }),
    }))
    .mutation(async ({ input }) => {
      const updated = await db
        .update(developers)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(developers.id, input.id))
        .returning();
      
      return updated[0];
    }),
  
  // ==========================================================================
  // EMPLOYEES
  // ==========================================================================
  
  /**
   * Create a new employee
   */
  createEmployee: publicProcedure
    .input(insertEmployeeSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      const employee = await db.insert(employees).values({
        ...input,
        id,
      }).returning();
      
      return employee[0];
    }),
  
  /**
   * Get all employees
   */
  getEmployees: publicProcedure
    .query(async () => {
      return await db.query.employees.findMany();
    }),
  
  /**
   * Get employee by ID
   */
  getEmployee: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.employees.findFirst({
        where: eq(employees.id, input.id),
      });
    }),
  
  /**
   * Update employee
   */
  updateEmployee: publicProcedure
    .input(z.object({
      id: z.string(),
      data: insertEmployeeSchema.partial().omit({ id: true, createdAt: true }),
    }))
    .mutation(async ({ input }) => {
      const updated = await db
        .update(employees)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, input.id))
        .returning();
      
      return updated[0];
    }),
  
  // ==========================================================================
  // CUSTOMERS
  // ==========================================================================
  
  /**
   * Create a new customer
   */
  createCustomer: publicProcedure
    .input(insertCustomerSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      const customer = await db.insert(customers).values({
        ...input,
        id,
      }).returning();
      
      return customer[0];
    }),
  
  /**
   * Get all customers
   */
  getCustomers: publicProcedure
    .query(async () => {
      return await db.query.customers.findMany();
    }),
  
  /**
   * Get customer by ID
   */
  getCustomer: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.customers.findFirst({
        where: eq(customers.id, input.id),
      });
    }),
  
  /**
   * Update customer
   */
  updateCustomer: publicProcedure
    .input(z.object({
      id: z.string(),
      data: insertCustomerSchema.partial().omit({ id: true, createdAt: true }),
    }))
    .mutation(async ({ input }) => {
      const updated = await db
        .update(customers)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, input.id))
        .returning();
      
      return updated[0];
    }),
  
  // ==========================================================================
  // METRICS & ANALYTICS
  // ==========================================================================
  
  /**
   * Record metrics for a hierarchy entity
   */
  recordMetrics: publicProcedure
    .input(insertScalingMetricsSchema.omit({ id: true, createdAt: true }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      const metrics = await db.insert(scalingMetrics).values({
        ...input,
        id,
      }).returning();
      
      return metrics[0];
    }),
  
  /**
   * Get metrics for a hierarchy entity
   */
  getMetrics: publicProcedure
    .input(z.object({
      hierarchyId: z.string(),
      period: z.string().optional(),
    }))
    .query(async ({ input }) => {
      if (input.period) {
        return await db.query.scalingMetrics.findMany({
          where: and(
            eq(scalingMetrics.hierarchyId, input.hierarchyId),
            eq(scalingMetrics.period, input.period)
          ),
        });
      }
      
      return await db.query.scalingMetrics.findMany({
        where: eq(scalingMetrics.hierarchyId, input.hierarchyId),
      });
    }),
  
  /**
   * Get aggregated metrics for a stakeholder type
   */
  getAggregatedMetrics: publicProcedure
    .input(z.object({
      stakeholderType: z.enum(["factory", "merchant", "marketer", "developer", "employee", "customer"]),
      period: z.string(),
    }))
    .query(async ({ input }) => {
      // Get all hierarchies for this stakeholder type
      const hierarchies = await db.query.scalingHierarchy.findMany({
        where: eq(scalingHierarchy.stakeholderType, input.stakeholderType as any),
      });
      
      const hierarchyIds = hierarchies.map(h => h.id);
      
      // Get all metrics for these hierarchies in the specified period
      const metrics = await db.query.scalingMetrics.findMany({
        where: and(
          sql`${scalingMetrics.hierarchyId} IN ${hierarchyIds}`,
          eq(scalingMetrics.period, input.period)
        ),
      });
      
      // Aggregate metrics
      const aggregated = {
        totalRevenue: metrics.reduce((sum, m) => sum + Number(m.revenue || 0), 0),
        totalCost: metrics.reduce((sum, m) => sum + Number(m.cost || 0), 0),
        totalProfit: metrics.reduce((sum, m) => sum + Number(m.profit || 0), 0),
        totalOrders: metrics.reduce((sum, m) => sum + (m.ordersProcessed || 0), 0),
        totalCustomers: metrics.reduce((sum, m) => sum + (m.customersServed || 0), 0),
        totalProduction: metrics.reduce((sum, m) => sum + (m.productionOutput || 0), 0),
        avgUtilization: metrics.length > 0 
          ? metrics.reduce((sum, m) => sum + Number(m.utilizationRate || 0), 0) / metrics.length 
          : 0,
        avgSatisfaction: metrics.length > 0
          ? metrics.reduce((sum, m) => sum + Number(m.satisfactionScore || 0), 0) / metrics.length
          : 0,
      };
      
      return {
        stakeholderType: input.stakeholderType,
        period: input.period,
        entityCount: hierarchies.length,
        metricsCount: metrics.length,
        aggregated,
      };
    }),
  
  // ==========================================================================
  // EXPANSION PLANS
  // ==========================================================================
  
  /**
   * Create expansion plan
   */
  createExpansionPlan: publicProcedure
    .input(insertExpansionPlanSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      const id = nanoid();
      const plan = await db.insert(expansionPlans).values({
        ...input,
        id,
      }).returning();
      
      return plan[0];
    }),
  
  /**
   * Get expansion plans
   */
  getExpansionPlans: publicProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      if (input.hierarchyId) {
        return await db.query.expansionPlans.findMany({
          where: eq(expansionPlans.hierarchyId, input.hierarchyId),
        });
      }
      
      if (input.status) {
        return await db.query.expansionPlans.findMany({
          where: eq(expansionPlans.status, input.status),
        });
      }
      
      return await db.query.expansionPlans.findMany();
    }),
  
  /**
   * Update expansion plan
   */
  updateExpansionPlan: publicProcedure
    .input(z.object({
      id: z.string(),
      data: insertExpansionPlanSchema.partial().omit({ id: true, createdAt: true }),
    }))
    .mutation(async ({ input }) => {
      const updated = await db
        .update(expansionPlans)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(expansionPlans.id, input.id))
        .returning();
      
      return updated[0];
    }),
  
  // ==========================================================================
  // DASHBOARD & OVERVIEW
  // ==========================================================================
  
  /**
   * Get complete system overview
   */
  getSystemOverview: publicProcedure
    .query(async () => {
      const stakeholderTypes = ["factory", "merchant", "marketer", "developer", "employee", "customer"] as const;
      
      const overview = await Promise.all(
        stakeholderTypes.map(async (type) => {
          const entities = await db.query.scalingHierarchy.findMany({
            where: eq(scalingHierarchy.stakeholderType, type as any),
          });
          
          const tier1 = entities.filter(e => e.tier === "tier1_initial");
          const tier2 = entities.filter(e => e.tier === "tier2_expansion");
          const tier3 = entities.filter(e => e.tier === "tier3_mega");
          
          return {
            stakeholderType: type,
            total: entities.length,
            tier1: tier1.length,
            tier2: tier2.length,
            tier3: tier3.length,
            active: entities.filter(e => e.isActive).length,
          };
        })
      );
      
      return {
        overview,
        totalEntities: overview.reduce((sum, o) => sum + o.total, 0),
        totalTier1: overview.reduce((sum, o) => sum + o.tier1, 0),
        totalTier2: overview.reduce((sum, o) => sum + o.tier2, 0),
        totalTier3: overview.reduce((sum, o) => sum + o.tier3, 0),
      };
    }),
});
