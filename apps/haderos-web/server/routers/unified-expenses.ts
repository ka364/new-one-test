// @ts-nocheck
/**
 * Unified Expense Management tRPC Router
 *
 * Supports tracking at two levels:
 * 1. Individual Entity Level (specific factory, merchant, etc.)
 * 2. Department Level (entire merchants department, marketing department, etc.)
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { requireDb } from '../db';
const createTRPCRouter = router; // alias for compatibility
const db = requireDb(); // get db instance
import { 
  vendors,
  departmentBudgets,
  unifiedExpenses,
  subscriptions,
  expenseRequests,
  invoices,
  payments,
  expenseAlerts,
  expenseReports,
} from '../../drizzle/schema-unified-expenses';
import { scalingHierarchy } from '../../drizzle/schema-7x7-scaling';
import { eq, and, gte, lte, desc, sql, sum, count, or, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const departmentEnum = z.enum(['merchants', 'marketing', 'developers', 'operations', 'hr', 'finance', 'sales', 'customer_support', 'other']);
const categoryEnum = z.enum(['cloud_hosting', 'ai_service', 'communication', 'software', 'database', 'cdn', 'monitoring', 'security', 'inventory', 'shipping', 'payment_processing', 'marketplace_fees', 'advertising', 'social_media', 'content_creation', 'influencers', 'development_tools', 'apis_services', 'hosting', 'office_supplies', 'equipment', 'maintenance', 'utilities', 'salaries', 'benefits', 'training', 'team_building', 'other']);
const expenseTypeEnum = z.enum(['subscription', 'one_time', 'recurring', 'operational', 'capital', 'salary', 'commission', 'marketing', 'development', 'infrastructure', 'other']);
const statusEnum = z.enum(['draft', 'submitted', 'pending', 'approved', 'rejected', 'paid', 'failed', 'refunded', 'cancelled', 'overdue']);
const currencyEnum = z.enum(['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR']);

export const unifiedExpensesRouter = createTRPCRouter({
  // ============================================================================
  // VENDORS
  // ============================================================================
  
  getVendors: protectedProcedure
    .input(z.object({
      department: departmentEnum.optional(),
    }).optional())
    .query(async ({ input }) => {
      let query = db.select().from(vendors);
      
      if (input?.department) {
        query = query.where(eq(vendors.primaryDepartment, input.department)) as any;
      }
      
      return await query.orderBy(vendors.name);
    }),

  createVendor: protectedProcedure
    .input(z.object({
      name: z.string(),
      category: categoryEnum.optional(),
      primaryDepartment: departmentEnum.optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      website: z.string().optional(),
      paymentMethod: z.string().optional(),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [vendor] = await db.insert(vendors).values(input).returning();
      return vendor;
    }),

  // ============================================================================
  // DEPARTMENT BUDGETS
  // ============================================================================
  
  getDepartmentBudgets: protectedProcedure
    .input(z.object({
      department: departmentEnum.optional(),
      year: z.number(),
      month: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(departmentBudgets.year, input.year)];
      
      if (input.department) {
        conditions.push(eq(departmentBudgets.department, input.department));
      }
      
      if (input.month) {
        conditions.push(eq(departmentBudgets.month, input.month));
      }
      
      return await db
        .select()
        .from(departmentBudgets)
        .where(and(...conditions))
        .orderBy(departmentBudgets.month, departmentBudgets.category);
    }),

  createDepartmentBudget: protectedProcedure
    .input(z.object({
      department: departmentEnum,
      year: z.number(),
      month: z.number(),
      category: categoryEnum,
      allocatedAmount: z.number(),
      currency: currencyEnum.default('EGP'),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [budget] = await db
        .insert(departmentBudgets)
        .values({
          ...input,
          allocatedAmount: input.allocatedAmount.toString(),
          createdBy: ctx.user.id,
        })
        .returning();
      
      return budget;
    }),

  updateBudgetSpending: protectedProcedure
    .input(z.object({
      budgetId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Recalculate spent amount from expenses
      const budget = await db.query.departmentBudgets.findFirst({
        where: eq(departmentBudgets.id, input.budgetId),
      });
      
      if (!budget) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Budget not found' });
      }
      
      const expenses = await db
        .select()
        .from(unifiedExpenses)
        .where(
          and(
            eq(unifiedExpenses.department, budget.department),
            eq(unifiedExpenses.category, budget.category),
            gte(unifiedExpenses.expenseDate, new Date(budget.year, budget.month - 1, 1)),
            lte(unifiedExpenses.expenseDate, new Date(budget.year, budget.month, 0))
          )
        );
      
      const spentAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const allocatedAmount = parseFloat(budget.allocatedAmount);
      const remainingAmount = allocatedAmount - spentAmount;
      const utilizationPercentage = (spentAmount / allocatedAmount) * 100;
      
      const [updated] = await db
        .update(departmentBudgets)
        .set({
          spentAmount: spentAmount.toString(),
          remainingAmount: remainingAmount.toString(),
          utilizationPercentage: utilizationPercentage.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(departmentBudgets.id, input.budgetId))
        .returning();
      
      return updated;
    }),

  // ============================================================================
  // UNIFIED EXPENSES
  // ============================================================================
  
  getExpenses: protectedProcedure
    .input(z.object({
      // Level 1: Entity
      hierarchyId: z.string().optional(),
      stakeholderType: z.enum(['factory', 'merchant', 'marketer', 'developer', 'employee', 'customer']).optional(),
      
      // Level 2: Department
      department: departmentEnum.optional(),
      
      // Filters
      status: statusEnum.optional(),
      category: categoryEnum.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let query = db
        .select({
          expense: unifiedExpenses,
          hierarchy: scalingHierarchy,
          vendor: vendors,
        })
        .from(unifiedExpenses)
        .leftJoin(scalingHierarchy, eq(unifiedExpenses.hierarchyId, scalingHierarchy.id))
        .leftJoin(vendors, eq(unifiedExpenses.vendorId, vendors.id));
      
      const conditions = [];
      
      if (input?.hierarchyId) {
        conditions.push(eq(unifiedExpenses.hierarchyId, input.hierarchyId));
      }
      
      if (input?.stakeholderType) {
        conditions.push(eq(scalingHierarchy.stakeholderType, input.stakeholderType as any));
      }
      
      if (input?.department) {
        conditions.push(eq(unifiedExpenses.department, input.department));
      }
      
      if (input?.status) {
        conditions.push(eq(unifiedExpenses.status, input.status));
      }
      
      if (input?.category) {
        conditions.push(eq(unifiedExpenses.category, input.category));
      }
      
      if (input?.startDate) {
        conditions.push(gte(unifiedExpenses.expenseDate, new Date(input.startDate)));
      }
      
      if (input?.endDate) {
        conditions.push(lte(unifiedExpenses.expenseDate, new Date(input.endDate)));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const results = await query.orderBy(desc(unifiedExpenses.expenseDate));
      
      return results.map(r => ({
        ...r.expense,
        hierarchy: r.hierarchy,
        vendor: r.vendor,
      }));
    }),

  createExpense: protectedProcedure
    .input(z.object({
      // Level (at least one required)
      hierarchyId: z.string().optional(),
      department: departmentEnum.optional(),
      
      title: z.string(),
      description: z.string().optional(),
      expenseType: expenseTypeEnum,
      category: categoryEnum,
      amount: z.number(),
      currency: currencyEnum.default('EGP'),
      expenseDate: z.string(),
      dueDate: z.string().optional(),
      vendorId: z.string().optional(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.hierarchyId && !input.department) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either hierarchyId or department must be provided',
        });
      }
      
      const [expense] = await db
        .insert(unifiedExpenses)
        .values({
          ...input,
          amount: input.amount.toString(),
          expenseDate: new Date(input.expenseDate),
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          createdBy: ctx.user.id,
        })
        .returning();
      
      return expense;
    }),

  updateExpenseStatus: protectedProcedure
    .input(z.object({
      expenseId: z.string(),
      status: statusEnum,
      paidDate: z.string().optional(),
      transactionId: z.string().optional(),
      rejectedReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {
        status: input.status,
        updatedAt: new Date(),
      };
      
      if (input.status === 'paid') {
        updateData.paidDate = input.paidDate ? new Date(input.paidDate) : new Date();
        updateData.transactionId = input.transactionId;
      }
      
      if (input.status === 'approved') {
        updateData.approvedBy = ctx.user.id;
        updateData.approvedAt = new Date();
      }
      
      if (input.status === 'rejected') {
        updateData.rejectedBy = ctx.user.id;
        updateData.rejectedAt = new Date();
        updateData.rejectedReason = input.rejectedReason;
      }
      
      const [updated] = await db
        .update(unifiedExpenses)
        .set(updateData)
        .where(eq(unifiedExpenses.id, input.expenseId))
        .returning();
      
      return updated;
    }),

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================
  
  getSubscriptions: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      department: departmentEnum.optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [];
      
      if (input?.hierarchyId) {
        conditions.push(eq(subscriptions.hierarchyId, input.hierarchyId));
      }
      
      if (input?.department) {
        conditions.push(eq(subscriptions.department, input.department));
      }
      
      if (input?.isActive !== undefined) {
        conditions.push(eq(subscriptions.isActive, input.isActive));
      }
      
      let query = db
        .select({
          subscription: subscriptions,
          hierarchy: scalingHierarchy,
          vendor: vendors,
        })
        .from(subscriptions)
        .leftJoin(scalingHierarchy, eq(subscriptions.hierarchyId, scalingHierarchy.id))
        .leftJoin(vendors, eq(subscriptions.vendorId, vendors.id));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const results = await query.orderBy(desc(subscriptions.createdAt));
      
      return results.map(r => ({
        ...r.subscription,
        hierarchy: r.hierarchy,
        vendor: r.vendor,
      }));
    }),

  createSubscription: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      department: departmentEnum.optional(),
      vendorId: z.string().optional(),
      name: z.string(),
      description: z.string().optional(),
      category: categoryEnum,
      monthlyCost: z.number(),
      annualCost: z.number().optional(),
      currency: currencyEnum.default('USD'),
      startDate: z.string(),
      renewalDate: z.string(),
      isAutoRenew: z.boolean().default(true),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.hierarchyId && !input.department) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either hierarchyId or department must be provided',
        });
      }
      
      const [subscription] = await db
        .insert(subscriptions)
        .values({
          ...input,
          monthlyCost: input.monthlyCost.toString(),
          annualCost: input.annualCost?.toString(),
          startDate: new Date(input.startDate),
          renewalDate: new Date(input.renewalDate),
          nextBillingDate: new Date(input.renewalDate),
          createdBy: ctx.user.id,
        })
        .returning();
      
      return subscription;
    }),

  // ============================================================================
  // EXPENSE REQUESTS
  // ============================================================================
  
  getExpenseRequests: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      department: departmentEnum.optional(),
      status: statusEnum.optional(),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [];
      
      if (input?.hierarchyId) {
        conditions.push(eq(expenseRequests.hierarchyId, input.hierarchyId));
      }
      
      if (input?.department) {
        conditions.push(eq(expenseRequests.department, input.department));
      }
      
      if (input?.status) {
        conditions.push(eq(expenseRequests.status, input.status));
      }
      
      let query = db.select().from(expenseRequests);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query.orderBy(desc(expenseRequests.createdAt));
    }),

  createExpenseRequest: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      department: departmentEnum.optional(),
      title: z.string(),
      description: z.string().optional(),
      justification: z.string().optional(),
      amount: z.number(),
      currency: currencyEnum.default('EGP'),
      expenseType: expenseTypeEnum,
      category: categoryEnum,
      expectedDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [request] = await db
        .insert(expenseRequests)
        .values({
          ...input,
          amount: input.amount.toString(),
          expectedDate: input.expectedDate ? new Date(input.expectedDate) : undefined,
          requestedBy: ctx.user.id,
        })
        .returning();
      
      return request;
    }),

  approveExpenseRequest: protectedProcedure
    .input(z.object({
      requestId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(expenseRequests)
        .set({
          status: 'approved',
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        })
        .where(eq(expenseRequests.id, input.requestId))
        .returning();
      
      return updated;
    }),

  rejectExpenseRequest: protectedProcedure
    .input(z.object({
      requestId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(expenseRequests)
        .set({
          status: 'rejected',
          rejectedBy: ctx.user.id,
          rejectedAt: new Date(),
          rejectedReason: input.reason,
        })
        .where(eq(expenseRequests.id, input.requestId))
        .returning();
      
      return updated;
    }),

  // ============================================================================
  // PAYMENTS
  // ============================================================================
  
  recordPayment: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      department: departmentEnum.optional(),
      invoiceId: z.string().optional(),
      subscriptionId: z.string().optional(),
      expenseId: z.string().optional(),
      amount: z.number(),
      currency: currencyEnum.default('USD'),
      paymentMethod: z.string(),
      transactionId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [payment] = await db
        .insert(payments)
        .values({
          ...input,
          amount: input.amount.toString(),
          processedBy: ctx.user.id,
        })
        .returning();
      
      // Update related expense status
      if (input.expenseId) {
        await db
          .update(unifiedExpenses)
          .set({
            status: 'paid',
            paidDate: new Date(),
          })
          .where(eq(unifiedExpenses.id, input.expenseId));
      }
      
      return payment;
    }),

  // ============================================================================
  // ALERTS
  // ============================================================================
  
  getAlerts: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      department: departmentEnum.optional(),
      isResolved: z.boolean().optional(),
      severity: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [];
      
      if (input?.hierarchyId) {
        conditions.push(eq(expenseAlerts.hierarchyId, input.hierarchyId));
      }
      
      if (input?.department) {
        conditions.push(eq(expenseAlerts.department, input.department));
      }
      
      if (input?.isResolved !== undefined) {
        conditions.push(eq(expenseAlerts.isResolved, input.isResolved));
      }
      
      if (input?.severity) {
        conditions.push(eq(expenseAlerts.severity, input.severity));
      }
      
      let query = db.select().from(expenseAlerts);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query.orderBy(desc(expenseAlerts.createdAt));
    }),

  resolveAlert: protectedProcedure
    .input(z.object({
      alertId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(expenseAlerts)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
        })
        .where(eq(expenseAlerts.id, input.alertId));
    }),

  // ============================================================================
  // REPORTS & ANALYTICS
  // ============================================================================
  
  getExpenseSummary: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      department: departmentEnum.optional(),
      period: z.string(), // '2025-01' or '2025-Q1' or '2025'
    }))
    .query(async ({ input }) => {
      // Parse period
      const [year, monthOrQuarter] = input.period.split('-');
      const isQuarter = monthOrQuarter?.startsWith('Q');
      const isYear = !monthOrQuarter;
      
      let startDate: Date;
      let endDate: Date;
      
      if (isYear) {
        startDate = new Date(parseInt(year), 0, 1);
        endDate = new Date(parseInt(year), 11, 31);
      } else if (isQuarter) {
        const quarter = parseInt(monthOrQuarter.substring(1));
        startDate = new Date(parseInt(year), (quarter - 1) * 3, 1);
        endDate = new Date(parseInt(year), quarter * 3, 0);
      } else {
        const month = parseInt(monthOrQuarter);
        startDate = new Date(parseInt(year), month - 1, 1);
        endDate = new Date(parseInt(year), month, 0);
      }
      
      // Build conditions
      const conditions = [
        gte(unifiedExpenses.expenseDate, startDate),
        lte(unifiedExpenses.expenseDate, endDate),
      ];
      
      if (input.hierarchyId) {
        conditions.push(eq(unifiedExpenses.hierarchyId, input.hierarchyId));
      }
      
      if (input.department) {
        conditions.push(eq(unifiedExpenses.department, input.department));
      }
      
      const expensesData = await db
        .select()
        .from(unifiedExpenses)
        .where(and(...conditions));
      
      // Calculate totals
      const totalExpenses = expensesData.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const totalPaid = expensesData
        .filter(exp => exp.status === 'paid')
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const totalPending = expensesData
        .filter(exp => exp.status === 'pending' || exp.status === 'submitted')
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const totalOverdue = expensesData
        .filter(exp => exp.status === 'overdue')
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      
      // Group by category
      const expensesByCategory = expensesData.reduce((acc, exp) => {
        const category = exp.category;
        if (!acc[category]) acc[category] = 0;
        acc[category] += parseFloat(exp.amount);
        return acc;
      }, {} as Record<string, number>);
      
      // Group by type
      const expensesByType = expensesData.reduce((acc, exp) => {
        const type = exp.expenseType;
        if (!acc[type]) acc[type] = 0;
        acc[type] += parseFloat(exp.amount);
        return acc;
      }, {} as Record<string, number>);
      
      return {
        period: input.period,
        hierarchyId: input.hierarchyId,
        department: input.department,
        totalExpenses,
        totalPaid,
        totalPending,
        totalOverdue,
        expensesByCategory,
        expensesByType,
        expenseCount: expensesData.length,
      };
    }),

  getSystemOverview: protectedProcedure
    .input(z.object({
      period: z.string(),
    }))
    .query(async ({ input }) => {
      const [year, month] = input.period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      const expensesData = await db
        .select({
          expense: unifiedExpenses,
          hierarchy: scalingHierarchy,
        })
        .from(unifiedExpenses)
        .leftJoin(scalingHierarchy, eq(unifiedExpenses.hierarchyId, scalingHierarchy.id))
        .where(
          and(
            gte(unifiedExpenses.expenseDate, startDate),
            lte(unifiedExpenses.expenseDate, endDate)
          )
        );
      
      // Group by department
      const expensesByDepartment = expensesData.reduce((acc, item) => {
        const dept = item.expense.department || 'unassigned';
        if (!acc[dept]) {
          acc[dept] = { total: 0, paid: 0, pending: 0, count: 0 };
        }
        
        const amount = parseFloat(item.expense.amount);
        acc[dept].total += amount;
        acc[dept].count += 1;
        
        if (item.expense.status === 'paid') {
          acc[dept].paid += amount;
        } else if (item.expense.status === 'pending' || item.expense.status === 'submitted') {
          acc[dept].pending += amount;
        }
        
        return acc;
      }, {} as Record<string, any>);
      
      // Group by stakeholder type
      const expensesByStakeholder = expensesData.reduce((acc, item) => {
        const type = item.hierarchy?.stakeholderType || 'unassigned';
        if (!acc[type]) {
          acc[type] = { total: 0, paid: 0, pending: 0, count: 0 };
        }
        
        const amount = parseFloat(item.expense.amount);
        acc[type].total += amount;
        acc[type].count += 1;
        
        if (item.expense.status === 'paid') {
          acc[type].paid += amount;
        } else if (item.expense.status === 'pending' || item.expense.status === 'submitted') {
          acc[type].pending += amount;
        }
        
        return acc;
      }, {} as Record<string, any>);
      
      const totalExpenses = Object.values(expensesByDepartment).reduce(
        (sum: number, item: any) => sum + item.total,
        0
      );
      
      return {
        period: input.period,
        totalExpenses,
        expensesByDepartment,
        expensesByStakeholder,
      };
    }),
});
