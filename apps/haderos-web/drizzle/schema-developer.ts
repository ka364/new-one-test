// Developer Portal Schema
// Manages developer access, authentication, and permissions

import { pgTable, text, timestamp, boolean, integer, jsonb, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const developerTierEnum = pgEnum("developer_tier", [
  "tier0_super_admin",
  "tier1_admin",
  "tier2_core_dev",
  "tier3_contributor",
  "tier4_reviewer",
  "tier5_guest"
]);

export const accessLevelEnum = pgEnum("access_level", [
  "full_access",
  "read_write_deploy",
  "read_write",
  "read_review",
  "read_only"
]);

export const environmentEnum = pgEnum("environment", [
  "production",
  "staging",
  "development",
  "sandbox"
]);

// Developer Accounts
export const developers = pgTable("developers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Link to main user system
  githubId: text("github_id").unique(),
  githubUsername: text("github_username"),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  
  // Access Control
  tier: developerTierEnum("tier").notNull().default("tier5_guest"),
  accessLevel: accessLevelEnum("access_level").notNull().default("read_only"),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  
  // Security
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  ipWhitelist: jsonb("ip_whitelist").$type<string[]>(),
  apiKey: text("api_key").unique(),
  apiKeyHash: text("api_key_hash"),
  
  // Metadata
  bio: text("bio"),
  skills: jsonb("skills").$type<string[]>(),
  specializations: jsonb("specializations").$type<string[]>(),
  timezone: text("timezone").default("UTC"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  verifiedAt: timestamp("verified_at"),
});

// Developer Sessions
export const developerSessions = pgTable("developer_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  developerId: uuid("developer_id").notNull().references(() => developers.id, { onDelete: "cascade" }),
  
  token: text("token").notNull().unique(),
  refreshToken: text("refresh_token").unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: jsonb("location").$type<{ country?: string; city?: string; }>(),
  
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
});

// Access Permissions
export const developerPermissions = pgTable("developer_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  developerId: uuid("developer_id").notNull().references(() => developers.id, { onDelete: "cascade" }),
  
  // Permissions
  canRead: boolean("can_read").notNull().default(true),
  canWrite: boolean("can_write").notNull().default(false),
  canDeploy: boolean("can_deploy").notNull().default(false),
  canReview: boolean("can_review").notNull().default(false),
  canManageUsers: boolean("can_manage_users").notNull().default(false),
  canManageSettings: boolean("can_manage_settings").notNull().default(false),
  
  // Environment Access
  environments: jsonb("environments").$type<string[]>().default([]),
  
  // Resource Access
  allowedRepositories: jsonb("allowed_repositories").$type<string[]>(),
  allowedBranches: jsonb("allowed_branches").$type<string[]>(),
  allowedPaths: jsonb("allowed_paths").$type<string[]>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Audit Logs
export const developerAuditLogs = pgTable("developer_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  developerId: uuid("developer_id").references(() => developers.id, { onDelete: "set null" }),
  
  action: text("action").notNull(), // login, logout, code_push, deploy, etc.
  resource: text("resource"), // file, branch, environment, etc.
  resourceId: text("resource_id"),
  
  details: jsonb("details").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Code Reviews
export const codeReviews = pgTable("code_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  pullRequestId: text("pull_request_id").notNull(),
  pullRequestUrl: text("pull_request_url"),
  
  authorId: uuid("author_id").notNull().references(() => developers.id),
  reviewerId: uuid("reviewer_id").references(() => developers.id),
  
  title: text("title").notNull(),
  description: text("description"),
  branch: text("branch").notNull(),
  targetBranch: text("target_branch").notNull().default("main"),
  
  status: text("status").notNull().default("pending"), // pending, approved, changes_requested, rejected
  filesChanged: integer("files_changed").notNull().default(0),
  linesAdded: integer("lines_added").notNull().default(0),
  linesDeleted: integer("lines_deleted").notNull().default(0),
  
  reviewNotes: text("review_notes"),
  approvedAt: timestamp("approved_at"),
  mergedAt: timestamp("merged_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Deployments
export const deployments = pgTable("deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  developerId: uuid("developer_id").notNull().references(() => developers.id),
  
  environment: environmentEnum("environment").notNull(),
  branch: text("branch").notNull(),
  commit: text("commit").notNull(),
  commitMessage: text("commit_message"),
  
  status: text("status").notNull().default("pending"), // pending, building, deploying, success, failed, rolled_back
  buildLog: text("build_log"),
  deployLog: text("deploy_log"),
  
  url: text("url"),
  version: text("version"),
  
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // in seconds
});

// Developer Invitations
// Development Companies
export const developmentCompanies = pgTable("development_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  website: text("website"),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  country: text("country"),
  city: text("city"),
  logo: text("logo"),
  
  status: text("status").notNull().default("active"), // active, suspended, inactive
  tier: text("tier").notNull().default("standard"), // enterprise, standard, startup
  
  maxDevelopers: integer("max_developers").default(10),
  currentDevelopers: integer("current_developers").default(0),
  
  contractStart: timestamp("contract_start"),
  contractEnd: timestamp("contract_end"),
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  
  createdBy: uuid("created_by").references(() => developers.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Company Members
export const companyMembers = pgTable("company_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => developmentCompanies.id, { onDelete: "cascade" }),
  developerId: uuid("developer_id").notNull().references(() => developers.id, { onDelete: "cascade" }),
  
  role: text("role").notNull().default("developer"), // owner, admin, developer
  status: text("status").notNull().default("active"), // active, inactive
  
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  leftAt: timestamp("left_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const developerInvitations = pgTable("developer_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  tier: developerTierEnum("tier").notNull(),
  invitedBy: uuid("invited_by").notNull().references(() => developers.id),
  
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod Schemas
export const insertDeveloperSchema = createInsertSchema(developers);
export const selectDeveloperSchema = createSelectSchema(developers);

export const insertDeveloperSessionSchema = createInsertSchema(developerSessions);
export const selectDeveloperSessionSchema = createSelectSchema(developerSessions);

export const insertDeveloperPermissionSchema = createInsertSchema(developerPermissions);
export const selectDeveloperPermissionSchema = createSelectSchema(developerPermissions);

export const insertDeveloperAuditLogSchema = createInsertSchema(developerAuditLogs);
export const selectDeveloperAuditLogSchema = createSelectSchema(developerAuditLogs);

export const insertCodeReviewSchema = createInsertSchema(codeReviews);
export const selectCodeReviewSchema = createSelectSchema(codeReviews);

export const insertDeploymentSchema = createInsertSchema(deployments);
export const selectDeploymentSchema = createSelectSchema(deployments);

export const insertDeveloperInvitationSchema = createInsertSchema(developerInvitations);
export const selectDeveloperInvitationSchema = createSelectSchema(developerInvitations);

// Types
export type Developer = typeof developers.$inferSelect;
export type NewDeveloper = typeof developers.$inferInsert;

export type DeveloperSession = typeof developerSessions.$inferSelect;
export type NewDeveloperSession = typeof developerSessions.$inferInsert;

export type DeveloperPermission = typeof developerPermissions.$inferSelect;
export type NewDeveloperPermission = typeof developerPermissions.$inferInsert;

export type DeveloperAuditLog = typeof developerAuditLogs.$inferSelect;
export type NewDeveloperAuditLog = typeof developerAuditLogs.$inferInsert;

export type CodeReview = typeof codeReviews.$inferSelect;
export type NewCodeReview = typeof codeReviews.$inferInsert;

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;

export type DeveloperInvitation = typeof developerInvitations.$inferSelect;
export type NewDeveloperInvitation = typeof developerInvitations.$inferInsert;

export const insertDevelopmentCompanySchema = createInsertSchema(developmentCompanies);
export const selectDevelopmentCompanySchema = createSelectSchema(developmentCompanies);

export const insertCompanyMemberSchema = createInsertSchema(companyMembers);
export const selectCompanyMemberSchema = createSelectSchema(companyMembers);

export type DevelopmentCompany = typeof developmentCompanies.$inferSelect;
export type NewDevelopmentCompany = typeof developmentCompanies.$inferInsert;

export type CompanyMember = typeof companyMembers.$inferSelect;
export type NewCompanyMember = typeof companyMembers.$inferInsert;
