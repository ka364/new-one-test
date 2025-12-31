/**
 * Integrated Expense Management tRPC Router
 * 
 * Manages expenses, subscriptions, and budgets for all stakeholders
 * in the 7×7 scaling system (except Founders)
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '../db';
import { 
  techVendors,
  subscriptions,
  expenses,
  vendorInvoices,
  payments,
  expenseAlerts,
  expenseBudgets,
  expenseReports,
} from '../../drizzle/schema-expenses-integrated';
import { scalingHierarchy } from '../../drizzle/schema-7x7-scaling';
import { eq, and, gte, lte, desc, sql, sum, count } from 'drizzle-orm';

export const expensesIntegratedRouter = createTRPCRouter({
  // ============================================================================
  // VENDORS MANAGEMENT
  // ============================================================================
  
  getVendors: protectedProcedure
    .query(async ({ ctx }) => {
      return await db
        .select()
        .from(techVendors)
        .orderBy(techVendors.name);
    }),

  createVendor: protectedProcedure
    .input(z.object({
      name: z.string(),
      category: z.enum(['cloud_hosting', 'ai_service', 'communication', 'software', 'database', 'cdn', 'monitoring', 'security', 'marketing_tools', 'development_tools', 'hr_software', 'crm', 'erp', 'other']),
      website: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      accountManager: z.string().optional(),
      contractStart: z.string().optional(),
      contractEnd: z.string().optional(),
      autoRenew: z.boolean().default(true),
      paymentMethod: z.string().optional(),
      billingCycle: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [vendor] = await db
        .insert(techVendors)
        .values({
          ...input,
          contractStart: input.contractStart ? new Date(input.contractStart) : undefined,
          contractEnd: input.contractEnd ? new Date(input.contractEnd) : undefined,
        })
        .returning();

      return vendor;
    }),

  updateVendor: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        category: z.enum(['cloud_hosting', 'ai_service', 'communication', 'software', 'database', 'cdn', 'monitoring', 'security', 'marketing_tools', 'development_tools', 'hr_software', 'crm', 'erp', 'other']).optional(),
        website: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        accountManager: z.string().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(techVendors)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(techVendors.id, input.id))
        .returning();

      return updated;
    }),

  // ============================================================================
  // SUBSCRIPTIONS MANAGEMENT
  // ============================================================================
  
  getSubscriptions: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      stakeholderType: z.enum(['factory', 'merchant', 'marketer', 'developer', 'employee', 'customer']).optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      let query = db
        .select({
          subscription: subscriptions,
          vendor: techVendors,
          hierarchy: scalingHierarchy,
        })
        .from(subscriptions)
        .leftJoin(techVendors, eq(subscriptions.vendorId, techVendors.id))
        .leftJoin(scalingHierarchy, eq(subscriptions.hierarchyId, scalingHierarchy.id));

      const conditions = [];
      
      if (input?.hierarchyId) {
        conditions.push(eq(subscriptions.hierarchyId, input.hierarchyId));
      }
      
      if (input?.stakeholderType) {
        conditions.push(eq(scalingHierarchy.stakeholderType, input.stakeholderType as any));
      }
      
      if (input?.isActive !== undefined) {
        conditions.push(eq(subscriptions.isActive, input.isActive));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query.orderBy(desc(subscriptions.createdAt));

      return results.map(r => ({
        ...r.subscription,
        vendor: r.vendor,
        hierarchy: r.hierarchy,
      }));
    }),

  createSubscription: protectedProcedure
    .input(z.object({
      hierarchyId: z.string(),
      vendorId: z.string().optional(),
      name: z.string(),
      description: z.string().optional(),
      subscriptionType: z.enum(['cloud_hosting', 'ai_service', 'communication', 'software', 'database', 'cdn', 'monitoring', 'security', 'marketing_tools', 'development_tools', 'hr_software', 'crm', 'erp', 'other']),
      monthlyCost: z.number(),
      annualCost: z.number().optional(),
      currency: z.enum(['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR']).default('USD'),
      startDate: z.string(),
      renewalDate: z.string(),
      isAutoRenew: z.boolean().default(true),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
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
  // EXPENSES MANAGEMENT
  // ============================================================================
  
  getExpenses: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      stakeholderType: z.enum(['factory', 'merchant', 'marketer', 'developer', 'employee', 'customer']).optional(),
      status: z.enum(['pending', 'paid', 'failed', 'refunded', 'cancelled', 'overdue']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      let query = db
        .select({
          expense: expenses,
          hierarchy: scalingHierarchy,
          subscription: subscriptions,
        })
        .from(expenses)
        .leftJoin(scalingHierarchy, eq(expenses.hierarchyId, scalingHierarchy.id))
        .leftJoin(subscriptions, eq(expenses.subscriptionId, subscriptions.id));

      const conditions = [];
      
      if (input?.hierarchyId) {
        conditions.push(eq(expenses.hierarchyId, input.hierarchyId));
      }
      
      if (input?.stakeholderType) {
        conditions.push(eq(scalingHierarchy.stakeholderType, input.stakeholderType as any));
      }
      
      if (input?.status) {
        conditions.push(eq(expenses.status, input.status));
      }
      
      if (input?.startDate) {
        conditions.push(gte(expenses.expenseDate, new Date(input.startDate)));
      }
      
      if (input?.endDate) {
        conditions.push(lte(expenses.expenseDate, new Date(input.endDate)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query.orderBy(desc(expenses.expenseDate));

      return results.map(r => ({
        ...r.expense,
        hierarchy: r.hierarchy,
        subscription: r.subscription,
      }));
    }),

  createExpense: protectedProcedure
    .input(z.object({
      hierarchyId: z.string(),
      subscriptionId: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      expenseType: z.enum(['subscription', 'one_time', 'recurring', 'operational', 'capital', 'salary', 'commission', 'marketing', 'development', 'infrastructure', 'other']),
      category: z.enum(['cloud_hosting', 'ai_service', 'communication', 'software', 'database', 'cdn', 'monitoring', 'security', 'marketing_tools', 'development_tools', 'hr_software', 'crm', 'erp', 'other']).optional(),
      amount: z.number(),
      currency: z.enum(['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR']).default('EGP'),
      expenseDate: z.string(),
      dueDate: z.string().optional(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [expense] = await db
        .insert(expenses)
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
      status: z.enum(['pending', 'paid', 'failed', 'refunded', 'cancelled', 'overdue']),
      paidDate: z.string().optional(),
      transactionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(expenses)
        .set({
          status: input.status,
          paidDate: input.paidDate ? new Date(input.paidDate) : undefined,
          transactionId: input.transactionId,
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, input.expenseId))
        .returning();

      return updated;
    }),

  // ============================================================================
  // INVOICES MANAGEMENT
  // ============================================================================
  
  getInvoices: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      vendorId: z.string().optional(),
      status: z.enum(['pending', 'paid', 'failed', 'refunded', 'cancelled', 'overdue']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      let query = db
        .select({
          invoice: vendorInvoices,
          vendor: techVendors,
          hierarchy: scalingHierarchy,
        })
        .from(vendorInvoices)
        .leftJoin(techVendors, eq(vendorInvoices.vendorId, techVendors.id))
        .leftJoin(scalingHierarchy, eq(vendorInvoices.hierarchyId, scalingHierarchy.id));

      const conditions = [];
      
      if (input?.hierarchyId) {
        conditions.push(eq(vendorInvoices.hierarchyId, input.hierarchyId));
      }
      
      if (input?.vendorId) {
        conditions.push(eq(vendorInvoices.vendorId, input.vendorId));
      }
      
      if (input?.status) {
        conditions.push(eq(vendorInvoices.status, input.status));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query.orderBy(desc(vendorInvoices.dueDate));

      return results.map(r => ({
        ...r.invoice,
        vendor: r.vendor,
        hierarchy: r.hierarchy,
      }));
    }),

  createInvoice: protectedProcedure
    .input(z.object({
      vendorId: z.string(),
      hierarchyId: z.string().optional(),
      invoiceNumber: z.string(),
      amount: z.number(),
      currency: z.enum(['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR']).default('EGP'),
      issueDate: z.string(),
      dueDate: z.string(),
      pdfUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [invoice] = await db
        .insert(vendorInvoices)
        .values({
          ...input,
          amount: input.amount.toString(),
          issueDate: new Date(input.issueDate),
          dueDate: new Date(input.dueDate),
          createdBy: ctx.user.id,
        })
        .returning();

      return invoice;
    }),

  // ============================================================================
  // PAYMENTS MANAGEMENT
  // ============================================================================
  
  recordPayment: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      invoiceId: z.string().optional(),
      subscriptionId: z.string().optional(),
      expenseId: z.string().optional(),
      amount: z.number(),
      currency: z.enum(['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR']).default('USD'),
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

      // Update invoice status if linked
      if (input.invoiceId) {
        await db
          .update(vendorInvoices)
          .set({
            status: 'paid',
            paidDate: new Date(),
          })
          .where(eq(vendorInvoices.id, input.invoiceId));
      }

      // Update expense status if linked
      if (input.expenseId) {
        await db
          .update(expenses)
          .set({
            status: 'paid',
            paidDate: new Date(),
          })
          .where(eq(expenses.id, input.expenseId));
      }

      return payment;
    }),

  // ============================================================================
  // BUDGETS MANAGEMENT
  // ============================================================================
  
  getBudgets: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      year: z.number(),
      month: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = [eq(expenseBudgets.year, input.year)];
      
      if (input.hierarchyId) {
        conditions.push(eq(expenseBudgets.hierarchyId, input.hierarchyId));
      }
      
      if (input.month) {
        conditions.push(eq(expenseBudgets.month, input.month));
      }

      const budgets = await db
        .select()
        .from(expenseBudgets)
        .where(and(...conditions))
        .orderBy(expenseBudgets.month, expenseBudgets.category);

      return budgets;
    }),

  createBudget: protectedProcedure
    .input(z.object({
      hierarchyId: z.string(),
      year: z.number(),
      month: z.number(),
      category: z.enum(['cloud_hosting', 'ai_service', 'communication', 'software', 'database', 'cdn', 'monitoring', 'security', 'marketing_tools', 'development_tools', 'hr_software', 'crm', 'erp', 'other']),
      expenseType: z.enum(['subscription', 'one_time', 'recurring', 'operational', 'capital', 'salary', 'commission', 'marketing', 'development', 'infrastructure', 'other']).optional(),
      allocatedAmount: z.number(),
      currency: z.enum(['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR']).default('USD'),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [budget] = await db
        .insert(expenseBudgets)
        .values({
          ...input,
          allocatedAmount: input.allocatedAmount.toString(),
          createdBy: ctx.user.id,
        })
        .returning();

      return budget;
    }),

  // ============================================================================
  // ALERTS MANAGEMENT
  // ============================================================================
  
  getAlerts: protectedProcedure
    .input(z.object({
      hierarchyId: z.string().optional(),
      isResolved: z.boolean().optional(),
      severity: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const conditions = [];
      
      if (input?.hierarchyId) {
        conditions.push(eq(expenseAlerts.hierarchyId, input.hierarchyId));
      }
      
      if (input?.isResolved !== undefined) {
        conditions.push(eq(expenseAlerts.isResolved, input.isResolved));
      }
      
      if (input?.severity) {
        conditions.push(eq(expenseAlerts.severity, input.severity));
      }

      const alerts = await db
        .select({
          alert: expenseAlerts,
          hierarchy: scalingHierarchy,
          subscription: subscriptions,
          expense: expenses,
        })
        .from(expenseAlerts)
        .leftJoin(scalingHierarchy, eq(expenseAlerts.hierarchyId, scalingHierarchy.id))
        .leftJoin(subscriptions, eq(expenseAlerts.subscriptionId, subscriptions.id))
        .leftJoin(expenses, eq(expenseAlerts.expenseId, expenses.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(expenseAlerts.createdAt));

      return alerts.map(a => ({
        ...a.alert,
        hierarchy: a.hierarchy,
        subscription: a.subscription,
        expense: a.expense,
      }));
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
      hierarchyId: z.string(),
      period: z.string(), // '2025-01' or '2025-Q1' or '2025'
    }))
    .query(async ({ ctx, input }) => {
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

      // Get expenses for period
      const expensesData = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.hierarchyId, input.hierarchyId),
            gte(expenses.expenseDate, startDate),
            lte(expenses.expenseDate, endDate)
          )
        );

      // Calculate totals
      const totalExpenses = expensesData.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const totalPaid = expensesData
        .filter(exp => exp.status === 'paid')
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const totalPending = expensesData
        .filter(exp => exp.status === 'pending')
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const totalOverdue = expensesData
        .filter(exp => exp.status === 'overdue')
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

      // Group by category
      const expensesByCategory = expensesData.reduce((acc, exp) => {
        const category = exp.category || 'other';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += parseFloat(exp.amount);
        return acc;
      }, {} as Record<string, number>);

      // Group by type
      const expensesByType = expensesData.reduce((acc, exp) => {
        const type = exp.expenseType;
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type] += parseFloat(exp.amount);
        return acc;
      }, {} as Record<string, number>);

      return {
        period: input.period,
        hierarchyId: input.hierarchyId,
        totalExpenses,
        totalPaid,
        totalPending,
        totalOverdue,
        expensesByCategory,
        expensesByType,
        expenseCount: expensesData.length,
      };
    }),

  getSystemExpenseOverview: protectedProcedure
    .input(z.object({
      period: z.string(), // '2025-01'
    }))
    .query(async ({ ctx, input }) => {
      const [year, month] = input.period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);

      // Get all expenses for period grouped by stakeholder type
      const expensesData = await db
        .select({
          expense: expenses,
          hierarchy: scalingHierarchy,
        })
        .from(expenses)
        .leftJoin(scalingHierarchy, eq(expenses.hierarchyId, scalingHierarchy.id))
        .where(
          and(
            gte(expenses.expenseDate, startDate),
            lte(expenses.expenseDate, endDate)
          )
        );

      // Group by stakeholder type
      const expensesByStakeholder = expensesData.reduce((acc, item) => {
        const type = item.hierarchy?.stakeholderType || 'unknown';
        if (!acc[type]) {
          acc[type] = {
            total: 0,
            paid: 0,
            pending: 0,
            count: 0,
          };
        }
        
        const amount = parseFloat(item.expense.amount);
        acc[type].total += amount;
        acc[type].count += 1;
        
        if (item.expense.status === 'paid') {
          acc[type].paid += amount;
        } else if (item.expense.status === 'pending') {
          acc[type].pending += amount;
        }
        
        return acc;
      }, {} as Record<string, any>);

      const totalExpenses = Object.values(expensesByStakeholder).reduce(
        (sum: number, item: any) => sum + item.total,
        0
      );

      return {
        period: input.period,
        totalExpenses,
        expensesByStakeholder,
      };
    }),
});
