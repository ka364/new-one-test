import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "../../drizzle/db";
import { sql } from "drizzle-orm";

/**
 * Dashboards Router
 * Provides APIs for all dashboard types: Operations, Financial, HR, Marketing
 */
export const dashboardsRouter = createTRPCRouter({
  /**
   * Operations Dashboard
   * Real-time operational metrics and KPIs
   */
  getOperationsDashboard: protectedProcedure
    .input(
      z.object({
        period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { period } = input;

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get orders metrics
      const ordersMetrics = await db.execute(sql`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
          SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_orders,
          AVG(total_amount) as avg_order_value,
          SUM(total_amount) as total_revenue
        FROM orders
        WHERE created_at >= ${startDate.toISOString()}
      `);

      // Get shipment metrics
      const shipmentMetrics = await db.execute(sql`
        SELECT 
          COUNT(*) as total_shipments,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          AVG(CASE WHEN delivered_at IS NOT NULL THEN 
            TIMESTAMPDIFF(DAY, created_at, delivered_at) 
          END) as avg_delivery_days
        FROM shipments
        WHERE created_at >= ${startDate.toISOString()}
      `);

      // Get inventory metrics
      const inventoryMetrics = await db.execute(sql`
        SELECT 
          COUNT(*) as total_products,
          SUM(quantity) as total_quantity,
          SUM(CASE WHEN quantity < reorder_level THEN 1 ELSE 0 END) as low_stock_items,
          SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_items
        FROM inventory
      `);

      // Get conversion metrics
      const conversionMetrics = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT customer_id) as total_customers,
          COUNT(*) as total_visits,
          SUM(CASE WHEN converted = true THEN 1 ELSE 0 END) as conversions
        FROM customer_visits
        WHERE created_at >= ${startDate.toISOString()}
      `);

      const orders = ordersMetrics.rows[0] || {};
      const shipments = shipmentMetrics.rows[0] || {};
      const inventory = inventoryMetrics.rows[0] || {};
      const conversion = conversionMetrics.rows[0] || {};

      return {
        period,
        orders: {
          total: Number(orders.total_orders) || 0,
          completed: Number(orders.completed_orders) || 0,
          pending: Number(orders.pending_orders) || 0,
          cancelled: Number(orders.cancelled_orders) || 0,
          returned: Number(orders.returned_orders) || 0,
          avgValue: Number(orders.avg_order_value) || 0,
          totalRevenue: Number(orders.total_revenue) || 0,
        },
        shipments: {
          total: Number(shipments.total_shipments) || 0,
          delivered: Number(shipments.delivered) || 0,
          inTransit: Number(shipments.in_transit) || 0,
          pending: Number(shipments.pending) || 0,
          avgDeliveryDays: Number(shipments.avg_delivery_days) || 0,
        },
        inventory: {
          totalProducts: Number(inventory.total_products) || 0,
          totalQuantity: Number(inventory.total_quantity) || 0,
          lowStockItems: Number(inventory.low_stock_items) || 0,
          outOfStockItems: Number(inventory.out_of_stock_items) || 0,
        },
        conversion: {
          totalCustomers: Number(conversion.total_customers) || 0,
          totalVisits: Number(conversion.total_visits) || 0,
          conversions: Number(conversion.conversions) || 0,
          conversionRate: Number(conversion.total_visits) > 0
            ? (Number(conversion.conversions) / Number(conversion.total_visits)) * 100
            : 0,
        },
      };
    }),

  /**
   * Financial Dashboard
   * Financial metrics, revenue, expenses, profitability
   */
  getFinancialDashboard: protectedProcedure
    .input(
      z.object({
        period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { period } = input;

      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get revenue metrics
      const revenueMetrics = await db.execute(sql`
        SELECT 
          SUM(amount) as total_revenue,
          SUM(CASE WHEN status = 'collected' THEN amount ELSE 0 END) as collected_revenue,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_revenue,
          COUNT(*) as total_transactions,
          AVG(amount) as avg_transaction_value
        FROM revenue
        WHERE created_at >= ${startDate.toISOString()}
      `);

      // Get expense metrics
      const expenseMetrics = await db.execute(sql`
        SELECT 
          SUM(amount) as total_expenses,
          SUM(CASE WHEN category = 'advertising' THEN amount ELSE 0 END) as advertising_expenses,
          SUM(CASE WHEN category = 'operations' THEN amount ELSE 0 END) as operations_expenses,
          SUM(CASE WHEN category = 'salaries' THEN amount ELSE 0 END) as salary_expenses,
          SUM(CASE WHEN category = 'other' THEN amount ELSE 0 END) as other_expenses,
          COUNT(*) as total_expense_transactions
        FROM expenses
        WHERE created_at >= ${startDate.toISOString()}
      `);

      // Get profitability metrics
      const revenue = revenueMetrics.rows[0] || {};
      const expenses = expenseMetrics.rows[0] || {};

      const totalRevenue = Number(revenue.total_revenue) || 0;
      const collectedRevenue = Number(revenue.collected_revenue) || 0;
      const totalExpenses = Number(expenses.total_expenses) || 0;
      const grossProfit = collectedRevenue - totalExpenses;
      const profitMargin = collectedRevenue > 0 ? (grossProfit / collectedRevenue) * 100 : 0;

      // Get ROI metrics
      const advertisingExpenses = Number(expenses.advertising_expenses) || 0;
      const roi = advertisingExpenses > 0 
        ? ((collectedRevenue - totalExpenses) / advertisingExpenses) * 100 
        : 0;

      return {
        period,
        revenue: {
          total: totalRevenue,
          collected: collectedRevenue,
          pending: Number(revenue.pending_revenue) || 0,
          transactions: Number(revenue.total_transactions) || 0,
          avgTransactionValue: Number(revenue.avg_transaction_value) || 0,
        },
        expenses: {
          total: totalExpenses,
          advertising: advertisingExpenses,
          operations: Number(expenses.operations_expenses) || 0,
          salaries: Number(expenses.salary_expenses) || 0,
          other: Number(expenses.other_expenses) || 0,
          transactions: Number(expenses.total_expense_transactions) || 0,
        },
        profitability: {
          grossProfit,
          profitMargin,
          roi,
          netProfit: grossProfit,
        },
        cashFlow: {
          inflow: collectedRevenue,
          outflow: totalExpenses,
          net: grossProfit,
        },
      };
    }),

  /**
   * HR Dashboard
   * Human resources metrics, employee performance, recruitment
   */
  getHRDashboard: protectedProcedure
    .input(
      z.object({
        period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { period } = input;

      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get employee metrics
      const employeeMetrics = await db.execute(sql`
        SELECT 
          COUNT(*) as total_employees,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_employees,
          SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) as on_leave,
          SUM(CASE WHEN status = 'terminated' THEN 1 ELSE 0 END) as terminated,
          AVG(performance_score) as avg_performance_score
        FROM employees
      `);

      // Get recruitment metrics
      const recruitmentMetrics = await db.execute(sql`
        SELECT 
          COUNT(*) as total_applications,
          SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) as hired,
          SUM(CASE WHEN status = 'interviewing' THEN 1 ELSE 0 END) as interviewing,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          AVG(CASE WHEN hired_at IS NOT NULL THEN 
            TIMESTAMPDIFF(DAY, applied_at, hired_at) 
          END) as avg_time_to_hire
        FROM job_applications
        WHERE applied_at >= ${startDate.toISOString()}
      `);

      // Get training metrics
      const trainingMetrics = await db.execute(sql`
        SELECT 
          COUNT(*) as total_trainings,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trainings,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_trainings,
          AVG(completion_rate) as avg_completion_rate
        FROM employee_trainings
        WHERE created_at >= ${startDate.toISOString()}
      `);

      // Get attendance metrics
      const attendanceMetrics = await db.execute(sql`
        SELECT 
          COUNT(*) as total_days,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
        FROM attendance
        WHERE date >= ${startDate.toISOString()}
      `);

      const employees = employeeMetrics.rows[0] || {};
      const recruitment = recruitmentMetrics.rows[0] || {};
      const training = trainingMetrics.rows[0] || {};
      const attendance = attendanceMetrics.rows[0] || {};

      const totalDays = Number(attendance.total_days) || 0;
      const presentDays = Number(attendance.present_days) || 0;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        period,
        employees: {
          total: Number(employees.total_employees) || 0,
          active: Number(employees.active_employees) || 0,
          onLeave: Number(employees.on_leave) || 0,
          terminated: Number(employees.terminated) || 0,
          avgPerformanceScore: Number(employees.avg_performance_score) || 0,
        },
        recruitment: {
          totalApplications: Number(recruitment.total_applications) || 0,
          hired: Number(recruitment.hired) || 0,
          interviewing: Number(recruitment.interviewing) || 0,
          rejected: Number(recruitment.rejected) || 0,
          avgTimeToHire: Number(recruitment.avg_time_to_hire) || 0,
          hireRate: Number(recruitment.total_applications) > 0
            ? (Number(recruitment.hired) / Number(recruitment.total_applications)) * 100
            : 0,
        },
        training: {
          totalTrainings: Number(training.total_trainings) || 0,
          completed: Number(training.completed_trainings) || 0,
          inProgress: Number(training.in_progress_trainings) || 0,
          avgCompletionRate: Number(training.avg_completion_rate) || 0,
        },
        attendance: {
          totalDays,
          presentDays,
          absentDays: Number(attendance.absent_days) || 0,
          lateDays: Number(attendance.late_days) || 0,
          attendanceRate,
        },
      };
    }),

  /**
   * Marketing Dashboard
   * Marketing campaigns, ROI, conversion rates, social media metrics
   */
  getMarketingDashboard: protectedProcedure
    .input(
      z.object({
        period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { period } = input;

      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get campaign metrics
      const campaignMetrics = await db.execute(sql`
        SELECT 
          COUNT(*) as total_campaigns,
          SUM(spend) as total_spend,
          SUM(impressions) as total_impressions,
          SUM(clicks) as total_clicks,
          SUM(conversions) as total_conversions,
          SUM(revenue) as total_revenue,
          AVG(ctr) as avg_ctr,
          AVG(cpc) as avg_cpc,
          AVG(cpa) as avg_cpa
        FROM marketing_campaigns
        WHERE created_at >= ${startDate.toISOString()}
      `);

      // Get social media metrics
      const socialMetrics = await db.execute(sql`
        SELECT 
          SUM(followers) as total_followers,
          SUM(engagement) as total_engagement,
          SUM(posts) as total_posts,
          AVG(engagement_rate) as avg_engagement_rate
        FROM social_media_metrics
        WHERE date >= ${startDate.toISOString()}
      `);

      // Get conversion metrics
      const conversionMetrics = await db.execute(sql`
        SELECT 
          SUM(visits) as total_visits,
          SUM(leads) as total_leads,
          SUM(conversions) as total_conversions,
          AVG(conversion_rate) as avg_conversion_rate
        FROM conversion_metrics
        WHERE date >= ${startDate.toISOString()}
      `);

      const campaigns = campaignMetrics.rows[0] || {};
      const social = socialMetrics.rows[0] || {};
      const conversion = conversionMetrics.rows[0] || {};

      const totalSpend = Number(campaigns.total_spend) || 0;
      const totalRevenue = Number(campaigns.total_revenue) || 0;
      const totalClicks = Number(campaigns.total_clicks) || 0;
      const totalImpressions = Number(campaigns.total_impressions) || 0;
      const totalConversions = Number(campaigns.total_conversions) || 0;

      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return {
        period,
        campaigns: {
          total: Number(campaigns.total_campaigns) || 0,
          totalSpend,
          totalRevenue,
          totalImpressions,
          totalClicks,
          totalConversions,
          roi,
          ctr,
          avgCPC: Number(campaigns.avg_cpc) || 0,
          avgCPA: Number(campaigns.avg_cpa) || 0,
        },
        socialMedia: {
          totalFollowers: Number(social.total_followers) || 0,
          totalEngagement: Number(social.total_engagement) || 0,
          totalPosts: Number(social.total_posts) || 0,
          avgEngagementRate: Number(social.avg_engagement_rate) || 0,
        },
        conversion: {
          totalVisits: Number(conversion.total_visits) || 0,
          totalLeads: Number(conversion.total_leads) || 0,
          totalConversions: Number(conversion.total_conversions) || 0,
          conversionRate,
          avgConversionRate: Number(conversion.avg_conversion_rate) || 0,
        },
      };
    }),

  /**
   * Get all dashboards summary
   * Quick overview of all key metrics
   */
  getAllDashboardsSummary: protectedProcedure
    .input(
      z.object({
        period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Call all dashboard endpoints
      const [operations, financial, hr, marketing] = await Promise.all([
        ctx.procedures.dashboards.getOperationsDashboard(input),
        ctx.procedures.dashboards.getFinancialDashboard(input),
        ctx.procedures.dashboards.getHRDashboard(input),
        ctx.procedures.dashboards.getMarketingDashboard(input),
      ]);

      return {
        period: input.period,
        operations,
        financial,
        hr,
        marketing,
        generatedAt: new Date().toISOString(),
      };
    }),
});
