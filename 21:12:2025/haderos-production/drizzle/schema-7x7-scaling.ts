/**
 * HADEROS 7×7 Scaling System Schema
 * 
 * Comprehensive scaling model for all stakeholders:
 * - Factories: 7 → 49 → 343
 * - Merchants: 7 → 49 → 343
 * - Marketers: 7 → 49 → 343
 * - Developers: 7 → 49 → 343
 * - Employees: 7 → 49 → 343
 * - Customers: 7 → 49 → 343
 * 
 * Founders remain fixed (no scaling)
 */

import { pgTable, text, integer, timestamp, boolean, jsonb, pgEnum, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const scalingTierEnum = pgEnum("scaling_tier", [
  "tier1_initial",      // Initial 7
  "tier2_expansion",    // 7×7 = 49
  "tier3_mega",         // 7×7×7 = 343
]);

export const stakeholderTypeEnum = pgEnum("stakeholder_type", [
  "factory",
  "merchant",
  "marketer",
  "developer",
  "employee",
  "customer",
  "founder",  // Fixed, no scaling
]);

export const factoryStatusEnum = pgEnum("factory_status", [
  "planning",
  "construction",
  "operational",
  "expanding",
  "suspended",
  "closed",
]);

export const merchantTypeEnum = pgEnum("merchant_type", [
  "wholesaler",
  "retailer",
  "distributor",
  "online_seller",
  "franchise",
]);

export const marketerTypeEnum = pgEnum("marketer_type", [
  "digital_marketer",
  "influencer",
  "affiliate",
  "agency",
  "brand_ambassador",
]);

export const developerLevelEnum = pgEnum("developer_level", [
  "junior",
  "mid",
  "senior",
  "lead",
  "architect",
]);

export const employeeDepartmentEnum = pgEnum("employee_department", [
  "production",
  "sales",
  "marketing",
  "hr",
  "finance",
  "logistics",
  "customer_service",
]);

export const customerTierEnum = pgEnum("customer_tier", [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "vip",
]);

// ============================================================================
// SCALING HIERARCHY
// ============================================================================

/**
 * Main scaling hierarchy table
 * Tracks the 7×7×7 expansion structure for all stakeholders
 */
export const scalingHierarchy = pgTable("scaling_hierarchy", {
  id: text("id").primaryKey(),
  stakeholderType: stakeholderTypeEnum("stakeholder_type").notNull(),
  tier: scalingTierEnum("tier").notNull(),
  
  // Hierarchy structure
  parentId: text("parent_id"), // References another scaling_hierarchy.id
  level: integer("level").notNull(), // 1, 2, or 3
  position: integer("position").notNull(), // 1-7 within parent
  
  // Identification
  code: text("code").notNull().unique(), // e.g., "F-1-3-2" (Factory, Tier1-3, Tier2-2)
  name: text("name").notNull(),
  
  // Status
  isActive: boolean("is_active").default(true),
  activatedAt: timestamp("activated_at"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// FACTORIES
// ============================================================================

export const factories = pgTable("factories", {
  id: text("id").primaryKey(),
  hierarchyId: text("hierarchy_id").notNull().references(() => scalingHierarchy.id),
  
  // Basic info
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  status: factoryStatusEnum("status").notNull().default("planning"),
  
  // Location
  country: text("country").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  coordinates: jsonb("coordinates"), // {lat, lng}
  
  // Capacity
  monthlyCapacity: integer("monthly_capacity").notNull(), // Units per month
  currentProduction: integer("current_production").default(0),
  utilizationRate: decimal("utilization_rate", { precision: 5, scale: 2 }), // Percentage
  
  // Financial
  investmentAmount: decimal("investment_amount", { precision: 15, scale: 2 }),
  operatingCost: decimal("operating_cost", { precision: 15, scale: 2 }),
  revenue: decimal("revenue", { precision: 15, scale: 2 }),
  
  // Staff
  totalEmployees: integer("total_employees").default(0),
  
  // Dates
  plannedStartDate: timestamp("planned_start_date"),
  actualStartDate: timestamp("actual_start_date"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// MERCHANTS
// ============================================================================

export const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  hierarchyId: text("hierarchy_id").notNull().references(() => scalingHierarchy.id),
  
  // Basic info
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: merchantTypeEnum("type").notNull(),
  
  // Business info
  businessName: text("business_name"),
  taxId: text("tax_id"),
  licenseNumber: text("license_number"),
  
  // Location
  country: text("country").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  
  // Performance
  monthlyOrderTarget: integer("monthly_order_target"),
  actualMonthlyOrders: integer("actual_monthly_orders").default(0),
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }), // Percentage
  
  // Status
  isActive: boolean("is_active").default(true),
  verifiedAt: timestamp("verified_at"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// MARKETERS
// ============================================================================

export const marketers = pgTable("marketers", {
  id: text("id").primaryKey(),
  hierarchyId: text("hierarchy_id").notNull().references(() => scalingHierarchy.id),
  
  // Basic info
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: marketerTypeEnum("type").notNull(),
  
  // Contact
  email: text("email").notNull(),
  phone: text("phone"),
  
  // Performance
  campaignsManaged: integer("campaigns_managed").default(0),
  totalSpend: decimal("total_spend", { precision: 15, scale: 2 }).default("0"),
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0"),
  roi: decimal("roi", { precision: 10, scale: 2 }), // Return on Investment
  
  // Commission
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  totalCommission: decimal("total_commission", { precision: 15, scale: 2 }).default("0"),
  
  // Social media
  socialMedia: jsonb("social_media"), // {platform: handle}
  followers: integer("followers"),
  
  // Status
  isActive: boolean("is_active").default(true),
  verifiedAt: timestamp("verified_at"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// DEVELOPERS
// ============================================================================

export const developers = pgTable("developers", {
  id: text("id").primaryKey(),
  hierarchyId: text("hierarchy_id").notNull().references(() => scalingHierarchy.id),
  
  // Basic info
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  email: text("email").notNull(),
  phone: text("phone"),
  
  // Professional info
  level: developerLevelEnum("level").notNull(),
  specialization: text("specialization"), // frontend, backend, fullstack, mobile, etc.
  skills: jsonb("skills"), // Array of skills
  experienceYears: integer("experience_years"),
  
  // Performance
  projectsCompleted: integer("projects_completed").default(0),
  codeQualityScore: decimal("code_quality_score", { precision: 3, scale: 2 }), // 0-100
  productivityScore: decimal("productivity_score", { precision: 3, scale: 2 }), // 0-100
  bugFixRate: decimal("bug_fix_rate", { precision: 5, scale: 2 }), // Percentage
  
  // Compensation
  monthlySalary: decimal("monthly_salary", { precision: 15, scale: 2 }),
  bonusEarned: decimal("bonus_earned", { precision: 15, scale: 2 }).default("0"),
  
  // GitHub integration
  githubUsername: text("github_username"),
  githubStats: jsonb("github_stats"), // commits, PRs, issues, etc.
  
  // Status
  isActive: boolean("is_active").default(true),
  hiredAt: timestamp("hired_at"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// EMPLOYEES
// ============================================================================

export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  hierarchyId: text("hierarchy_id").notNull().references(() => scalingHierarchy.id),
  
  // Basic info
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  email: text("email").notNull(),
  phone: text("phone"),
  nationalId: text("national_id"),
  
  // Employment info
  department: employeeDepartmentEnum("department").notNull(),
  position: text("position").notNull(),
  employmentType: text("employment_type").notNull(), // full_time, part_time, contract
  
  // Location
  assignedFactoryId: text("assigned_factory_id").references(() => factories.id),
  workLocation: text("work_location"),
  
  // Performance
  performanceScore: decimal("performance_score", { precision: 3, scale: 2 }), // 0-100
  attendanceRate: decimal("attendance_rate", { precision: 5, scale: 2 }), // Percentage
  tasksCompleted: integer("tasks_completed").default(0),
  
  // Compensation
  monthlySalary: decimal("monthly_salary", { precision: 15, scale: 2 }),
  bonuses: decimal("bonuses", { precision: 15, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 15, scale: 2 }).default("0"),
  
  // Dates
  hiredAt: timestamp("hired_at"),
  contractEndDate: timestamp("contract_end_date"),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// CUSTOMERS
// ============================================================================

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  hierarchyId: text("hierarchy_id").notNull().references(() => scalingHierarchy.id),
  
  // Basic info
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  email: text("email").notNull(),
  phone: text("phone"),
  
  // Customer classification
  tier: customerTierEnum("tier").notNull().default("bronze"),
  segment: text("segment"), // retail, wholesale, corporate
  
  // Location
  country: text("country"),
  city: text("city"),
  address: text("address"),
  
  // Purchase history
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 15, scale: 2 }).default("0"),
  averageOrderValue: decimal("average_order_value", { precision: 15, scale: 2 }),
  
  // Behavior
  lastOrderDate: timestamp("last_order_date"),
  orderFrequency: integer("order_frequency"), // Days between orders
  lifetimeValue: decimal("lifetime_value", { precision: 15, scale: 2 }),
  
  // Satisfaction
  satisfactionScore: decimal("satisfaction_score", { precision: 3, scale: 2 }), // 0-100
  npsScore: integer("nps_score"), // Net Promoter Score: -100 to 100
  
  // Loyalty
  loyaltyPoints: integer("loyalty_points").default(0),
  referralsCount: integer("referrals_count").default(0),
  
  // Status
  isActive: boolean("is_active").default(true),
  registeredAt: timestamp("registered_at"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// SCALING METRICS
// ============================================================================

/**
 * Tracks metrics and KPIs for each scaling entity
 */
export const scalingMetrics = pgTable("scaling_metrics", {
  id: text("id").primaryKey(),
  hierarchyId: text("hierarchy_id").notNull().references(() => scalingHierarchy.id),
  
  // Time period
  period: text("period").notNull(), // YYYY-MM
  
  // Financial metrics
  revenue: decimal("revenue", { precision: 15, scale: 2 }),
  cost: decimal("cost", { precision: 15, scale: 2 }),
  profit: decimal("profit", { precision: 15, scale: 2 }),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }),
  
  // Performance metrics
  ordersProcessed: integer("orders_processed"),
  customersServed: integer("customers_served"),
  productionOutput: integer("production_output"),
  
  // Efficiency metrics
  utilizationRate: decimal("utilization_rate", { precision: 5, scale: 2 }),
  errorRate: decimal("error_rate", { precision: 5, scale: 2 }),
  satisfactionScore: decimal("satisfaction_score", { precision: 3, scale: 2 }),
  
  // Growth metrics
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }),
  
  // Custom metrics
  customMetrics: jsonb("custom_metrics"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// EXPANSION PLANS
// ============================================================================

/**
 * Tracks expansion plans for moving from one tier to another
 */
export const expansionPlans = pgTable("expansion_plans", {
  id: text("id").primaryKey(),
  hierarchyId: text("hierarchy_id").notNull().references(() => scalingHierarchy.id),
  
  // Expansion details
  fromTier: scalingTierEnum("from_tier").notNull(),
  toTier: scalingTierEnum("to_tier").notNull(),
  targetCount: integer("target_count").notNull(), // How many new entities to create
  
  // Timeline
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  
  // Status
  status: text("status").notNull().default("planning"), // planning, in_progress, completed, cancelled
  progress: integer("progress").default(0), // 0-100
  
  // Financial
  estimatedCost: decimal("estimated_cost", { precision: 15, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 15, scale: 2 }),
  
  // Details
  description: text("description"),
  milestones: jsonb("milestones"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const insertScalingHierarchySchema = createInsertSchema(scalingHierarchy);
export const selectScalingHierarchySchema = createSelectSchema(scalingHierarchy);

export const insertFactorySchema = createInsertSchema(factories);
export const selectFactorySchema = createSelectSchema(factories);

export const insertMerchantSchema = createInsertSchema(merchants);
export const selectMerchantSchema = createSelectSchema(merchants);

export const insertMarketerSchema = createInsertSchema(marketers);
export const selectMarketerSchema = createSelectSchema(marketers);

export const insertDeveloperSchema = createInsertSchema(developers);
export const selectDeveloperSchema = createSelectSchema(developers);

export const insertEmployeeSchema = createInsertSchema(employees);
export const selectEmployeeSchema = createSelectSchema(employees);

export const insertCustomerSchema = createInsertSchema(customers);
export const selectCustomerSchema = createSelectSchema(customers);

export const insertScalingMetricsSchema = createInsertSchema(scalingMetrics);
export const selectScalingMetricsSchema = createSelectSchema(scalingMetrics);

export const insertExpansionPlanSchema = createInsertSchema(expansionPlans);
export const selectExpansionPlanSchema = createSelectSchema(expansionPlans);

// ============================================================================
// TYPES
// ============================================================================

export type ScalingHierarchy = typeof scalingHierarchy.$inferSelect;
export type NewScalingHierarchy = typeof scalingHierarchy.$inferInsert;

export type Factory = typeof factories.$inferSelect;
export type NewFactory = typeof factories.$inferInsert;

export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;

export type Marketer = typeof marketers.$inferSelect;
export type NewMarketer = typeof marketers.$inferInsert;

export type Developer = typeof developers.$inferSelect;
export type NewDeveloper = typeof developers.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type ScalingMetrics = typeof scalingMetrics.$inferSelect;
export type NewScalingMetrics = typeof scalingMetrics.$inferInsert;

export type ExpansionPlan = typeof expansionPlans.$inferSelect;
export type NewExpansionPlan = typeof expansionPlans.$inferInsert;
