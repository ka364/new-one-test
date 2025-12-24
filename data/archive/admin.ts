import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, like, or, and, sql, desc } from "drizzle-orm";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can access this resource",
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Get all users with pagination and filters
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, role, isActive } = input;
      const offset = (page - 1) * pageSize;

      // Build where conditions
      const conditions = [];
      
      if (search) {
        conditions.push(
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.openId, `%${search}%`)
          )
        );
      }
      
      if (role) {
        conditions.push(eq(users.role, role));
      }
      
      if (isActive !== undefined) {
        conditions.push(eq(users.isActive, isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get users
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const usersList = await db
        .select()
        .from(users)
        .where(whereClause)
        .limit(pageSize)
        .offset(offset)
        .orderBy(desc(users.createdAt));

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause);

      return {
        users: usersList,
        total: Number(count),
        page,
        pageSize,
        totalPages: Math.ceil(Number(count) / pageSize),
      };
    }),

  // Get user by ID
  getUserById: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // Update user role
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Prevent self-demotion
      if (input.userId === ctx.user.id && input.role === "user") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot demote yourself from admin",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true, message: "User role updated successfully" };
    }),

  // Update user permissions
  updateUserPermissions: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        permissions: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await db
        .update(users)
        .set({ permissions: input.permissions, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true, message: "User permissions updated successfully" };
    }),

  // Toggle user active status
  toggleUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Prevent self-deactivation
      if (input.userId === ctx.user.id && !input.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot deactivate your own account",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await db
        .update(users)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return {
        success: true,
        message: input.isActive ? "User activated successfully" : "User deactivated successfully",
      };
    }),

  // Delete user (soft delete by deactivating)
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Prevent self-deletion
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete your own account",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true, message: "User deleted successfully" };
    }),

  // Get system statistics
  getSystemStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    
    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [activeUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    const [adminUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));

    const [recentUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);

    return {
      totalUsers: Number(totalUsers.count),
      activeUsers: Number(activeUsers.count),
      adminUsers: Number(adminUsers.count),
      recentUsers: Number(recentUsers.count),
      inactiveUsers: Number(totalUsers.count) - Number(activeUsers.count),
    };
  }),

  // Bulk activate/deactivate users
  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.number()),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Prevent self-deactivation
      if (input.userIds.includes(ctx.user.id) && !input.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot deactivate your own account",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      await db
        .update(users)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(sql`${users.id} IN (${sql.join(input.userIds.map(id => sql`${id}`), sql`, `)})`);

      return {
        success: true,
        message: `${input.userIds.length} users ${input.isActive ? "activated" : "deactivated"} successfully`,
      };
    }),
});
