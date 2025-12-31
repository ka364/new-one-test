/**
 * نظام المطورين المتقدم - HADEROS
 * 
 * يتضمن:
 * - إدارة المشاريع والمهام
 * - نظام Git Integration
 * - Code Reviews
 * - Documentation
 * - منظومة تواصل متقدمة
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  integer,
  decimal,
  varchar,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { developers } from "./schema-7x7-scaling";
import { users } from "./auth";

// ============= ENUMS =============

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "in_progress",
  "testing",
  "deployed",
  "maintenance",
  "archived",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const codeReviewStatusEnum = pgEnum("code_review_status", [
  "pending",
  "approved",
  "changes_requested",
  "rejected",
]);

export const developerSkillLevelEnum = pgEnum("developer_skill_level", [
  "junior",
  "mid",
  "senior",
  "lead",
  "architect",
]);

// ============= TABLES =============

/**
 * مشاريع المطورين
 */
export const developerProjects = pgTable("developer_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  hierarchyId: uuid("hierarchy_id").notNull(), // ربط مع scaling_hierarchy
  projectName: varchar("project_name", { length: 255 }).notNull(),
  projectCode: varchar("project_code", { length: 50 }).notNull().unique(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("planning"),
  
  // Git Integration
  gitRepository: varchar("git_repository", { length: 500 }),
  gitBranch: varchar("git_branch", { length: 100 }).default("main"),
  
  // Metadata
  technologies: jsonb("technologies").$type<string[]>(), // ["React", "Node.js", "PostgreSQL"]
  teamSize: integer("team_size").default(1),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours").default(0),
  
  // Dates
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  deadline: timestamp("deadline"),
  
  // Ownership
  leadDeveloperId: uuid("lead_developer_id"),
  createdBy: uuid("created_by").notNull(),
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  hierarchyIdx: index("developer_projects_hierarchy_idx").on(table.hierarchyId),
  statusIdx: index("developer_projects_status_idx").on(table.status),
  leadIdx: index("developer_projects_lead_idx").on(table.leadDeveloperId),
}));

/**
 * أعضاء فريق المشروع
 */
export const projectTeamMembers = pgTable("project_team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => developerProjects.id, { onDelete: "cascade" }),
  developerId: uuid("developer_id").notNull(),
  userId: uuid("user_id").notNull(),
  
  role: varchar("role", { length: 100 }), // "Frontend", "Backend", "DevOps", etc.
  skillLevel: developerSkillLevelEnum("skill_level").notNull(),
  
  // Permissions
  canCommit: boolean("can_commit").default(true),
  canReview: boolean("can_review").default(false),
  canDeploy: boolean("can_deploy").default(false),
  
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
}, (table) => ({
  projectIdx: index("project_team_members_project_idx").on(table.projectId),
  developerIdx: index("project_team_members_developer_idx").on(table.developerId),
  uniqueMember: uniqueIndex("project_team_members_unique").on(table.projectId, table.developerId),
}));

/**
 * مهام المشروع
 */
export const projectTasks = pgTable("project_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => developerProjects.id, { onDelete: "cascade" }),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  taskCode: varchar("task_code", { length: 50 }).notNull(), // "PROJ-123"
  
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  
  // Assignment
  assignedTo: uuid("assigned_to"),
  reviewedBy: uuid("reviewed_by"),
  
  // Estimation
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours").default(0),
  
  // Dependencies
  dependsOn: jsonb("depends_on").$type<string[]>(), // Task IDs
  blockedBy: jsonb("blocked_by").$type<string[]>(), // Task IDs
  
  // Git Integration
  gitBranch: varchar("git_branch", { length: 100 }),
  gitCommits: jsonb("git_commits").$type<string[]>(), // Commit hashes
  pullRequestUrl: varchar("pull_request_url", { length: 500 }),
  
  // Dates
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("project_tasks_project_idx").on(table.projectId),
  statusIdx: index("project_tasks_status_idx").on(table.status),
  assignedIdx: index("project_tasks_assigned_idx").on(table.assignedTo),
  codeIdx: uniqueIndex("project_tasks_code_idx").on(table.projectId, table.taskCode),
}));

/**
 * مراجعات الكود (Code Reviews)
 */
export const codeReviews = pgTable("code_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => developerProjects.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => projectTasks.id, { onDelete: "set null" }),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Git Integration
  pullRequestUrl: varchar("pull_request_url", { length: 500 }),
  gitBranch: varchar("git_branch", { length: 100 }),
  commitHash: varchar("commit_hash", { length: 100 }),
  
  // Review
  authorId: uuid("author_id").notNull(),
  reviewerId: uuid("reviewer_id").notNull(),
  status: codeReviewStatusEnum("status").notNull().default("pending"),
  
  // Feedback
  comments: jsonb("comments").$type<Array<{
    line: number;
    file: string;
    comment: string;
    createdAt: string;
  }>>(),
  
  // Approval
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("code_reviews_project_idx").on(table.projectId),
  statusIdx: index("code_reviews_status_idx").on(table.status),
  reviewerIdx: index("code_reviews_reviewer_idx").on(table.reviewerId),
}));

/**
 * وثائق المشروع (Documentation)
 */
export const projectDocumentation = pgTable("project_documentation", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => developerProjects.id, { onDelete: "cascade" }),
  
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: text("content").notNull(),
  
  // Organization
  category: varchar("category", { length: 100 }), // "API", "Setup", "Architecture", etc.
  order: integer("order").default(0),
  
  // Versioning
  version: varchar("version", { length: 50 }).default("1.0.0"),
  isPublished: boolean("is_published").default(false),
  
  // Authorship
  authorId: uuid("author_id").notNull(),
  lastEditedBy: uuid("last_edited_by"),
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("project_documentation_project_idx").on(table.projectId),
  slugIdx: uniqueIndex("project_documentation_slug_idx").on(table.projectId, table.slug),
  categoryIdx: index("project_documentation_category_idx").on(table.category),
}));

/**
 * محادثات المطورين (Developer Conversations)
 */
export const developerConversations = pgTable("developer_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => developerProjects.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => projectTasks.id, { onDelete: "set null" }),
  
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "general", "technical", "code_review", "standup"
  
  // Participants
  participants: jsonb("participants").$type<string[]>(), // User IDs
  
  // Status
  isActive: boolean("is_active").default(true),
  isPinned: boolean("is_pinned").default(false),
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("developer_conversations_project_idx").on(table.projectId),
  taskIdx: index("developer_conversations_task_idx").on(table.taskId),
  typeIdx: index("developer_conversations_type_idx").on(table.type),
}));

/**
 * رسائل المطورين
 */
export const developerMessages = pgTable("developer_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => developerConversations.id, { onDelete: "cascade" }),
  
  senderId: uuid("sender_id").notNull(),
  content: text("content").notNull(),
  
  // Message Type
  type: varchar("type", { length: 50 }).notNull().default("text"), // "text", "code", "file", "system"
  
  // Code Snippet
  codeLanguage: varchar("code_language", { length: 50 }),
  codeContent: text("code_content"),
  
  // File Attachment
  fileUrl: varchar("file_url", { length: 500 }),
  fileName: varchar("file_name", { length: 255 }),
  fileSize: integer("file_size"),
  
  // Reactions
  reactions: jsonb("reactions").$type<Record<string, string[]>>(), // { "👍": ["user1", "user2"], "🎉": ["user3"] }
  
  // Threading
  replyToId: uuid("reply_to_id"),
  
  // Status
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index("developer_messages_conversation_idx").on(table.conversationId),
  senderIdx: index("developer_messages_sender_idx").on(table.senderId),
  replyIdx: index("developer_messages_reply_idx").on(table.replyToId),
}));

/**
 * مؤشرات الأداء للمطورين
 */
export const developerMetrics = pgTable("developer_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  developerId: uuid("developer_id").notNull(),
  projectId: uuid("project_id").references(() => developerProjects.id, { onDelete: "cascade" }),
  
  // Period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Metrics
  tasksCompleted: integer("tasks_completed").default(0),
  tasksInProgress: integer("tasks_in_progress").default(0),
  codeReviewsGiven: integer("code_reviews_given").default(0),
  codeReviewsReceived: integer("code_reviews_received").default(0),
  commitsCount: integer("commits_count").default(0),
  linesAdded: integer("lines_added").default(0),
  linesRemoved: integer("lines_removed").default(0),
  bugsFixed: integer("bugs_fixed").default(0),
  featuresDelivered: integer("features_delivered").default(0),
  
  // Time Tracking
  totalHoursWorked: decimal("total_hours_worked", { precision: 10, scale: 2 }).default("0"),
  averageTaskCompletionTime: decimal("average_task_completion_time", { precision: 10, scale: 2 }),
  
  // Quality
  codeQualityScore: decimal("code_quality_score", { precision: 5, scale: 2 }), // 0-100
  reviewApprovalRate: decimal("review_approval_rate", { precision: 5, scale: 2 }), // 0-100
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  developerIdx: index("developer_metrics_developer_idx").on(table.developerId),
  projectIdx: index("developer_metrics_project_idx").on(table.projectId),
  periodIdx: index("developer_metrics_period_idx").on(table.periodStart, table.periodEnd),
}));

// ============= RELATIONS =============

export const developerProjectsRelations = relations(developerProjects, ({ many }) => ({
  teamMembers: many(projectTeamMembers),
  tasks: many(projectTasks),
  codeReviews: many(codeReviews),
  documentation: many(projectDocumentation),
  conversations: many(developerConversations),
}));

export const projectTeamMembersRelations = relations(projectTeamMembers, ({ one }) => ({
  project: one(developerProjects, {
    fields: [projectTeamMembers.projectId],
    references: [developerProjects.id],
  }),
}));

export const projectTasksRelations = relations(projectTasks, ({ one, many }) => ({
  project: one(developerProjects, {
    fields: [projectTasks.projectId],
    references: [developerProjects.id],
  }),
  codeReviews: many(codeReviews),
}));

export const codeReviewsRelations = relations(codeReviews, ({ one }) => ({
  project: one(developerProjects, {
    fields: [codeReviews.projectId],
    references: [developerProjects.id],
  }),
  task: one(projectTasks, {
    fields: [codeReviews.taskId],
    references: [projectTasks.id],
  }),
}));

export const developerConversationsRelations = relations(developerConversations, ({ one, many }) => ({
  project: one(developerProjects, {
    fields: [developerConversations.projectId],
    references: [developerProjects.id],
  }),
  task: one(projectTasks, {
    fields: [developerConversations.taskId],
    references: [projectTasks.id],
  }),
  messages: many(developerMessages),
}));

export const developerMessagesRelations = relations(developerMessages, ({ one }) => ({
  conversation: one(developerConversations, {
    fields: [developerMessages.conversationId],
    references: [developerConversations.id],
  }),
  replyTo: one(developerMessages, {
    fields: [developerMessages.replyToId],
    references: [developerMessages.id],
  }),
}));

// ============= TYPES =============

export type DeveloperProject = typeof developerProjects.$inferSelect;
export type NewDeveloperProject = typeof developerProjects.$inferInsert;

export type ProjectTeamMember = typeof projectTeamMembers.$inferSelect;
export type NewProjectTeamMember = typeof projectTeamMembers.$inferInsert;

export type ProjectTask = typeof projectTasks.$inferSelect;
export type NewProjectTask = typeof projectTasks.$inferInsert;

export type CodeReview = typeof codeReviews.$inferSelect;
export type NewCodeReview = typeof codeReviews.$inferInsert;

export type ProjectDocumentation = typeof projectDocumentation.$inferSelect;
export type NewProjectDocumentation = typeof projectDocumentation.$inferInsert;

export type DeveloperConversation = typeof developerConversations.$inferSelect;
export type NewDeveloperConversation = typeof developerConversations.$inferInsert;

export type DeveloperMessage = typeof developerMessages.$inferSelect;
export type NewDeveloperMessage = typeof developerMessages.$inferInsert;

export type DeveloperMetric = typeof developerMetrics.$inferSelect;
export type NewDeveloperMetric = typeof developerMetrics.$inferInsert;
