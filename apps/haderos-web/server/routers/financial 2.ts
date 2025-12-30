import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { requireDb } from "../db";
import { dailyOperationalMetrics } from "../../drizzle/schema";
import { sql, and, gte, lte, desc } from "drizzle-orm";
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const financialRouter = router({
  // Get financial summary
  getSummary: protectedProcedure
    .query(async () => {
      const db = await requireDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Get current month metrics
      const currentMonthMetrics = await db
        .select({
          totalCollection: sql<number>`COALESCE(SUM(${dailyOperationalMetrics.totalCollection}), 0)`,
          operatingExpenses: sql<number>`COALESCE(SUM(${dailyOperationalMetrics.operatingExpenses}), 0)`,
          adSpend: sql<number>`COALESCE(SUM(${dailyOperationalMetrics.adSpend}), 0)`,
        })
        .from(dailyOperationalMetrics)
        .where(
          and(
            sql`DATE(${dailyOperationalMetrics.date}) >= DATE(${currentMonthStart.toISOString()})`,
            sql`DATE(${dailyOperationalMetrics.date}) <= DATE(${currentMonthEnd.toISOString()})`
          )
        );

      // Get last month metrics
      const lastMonthMetrics = await db
        .select({
          totalCollection: sql<number>`COALESCE(SUM(${dailyOperationalMetrics.totalCollection}), 0)`,
        })
        .from(dailyOperationalMetrics)
        .where(
          and(
            sql`DATE(${dailyOperationalMetrics.date}) >= DATE(${lastMonthStart.toISOString()})`,
            sql`DATE(${dailyOperationalMetrics.date}) <= DATE(${lastMonthEnd.toISOString()})`
          )
        );

      const currentRevenue = Number(currentMonthMetrics[0]?.totalCollection || 0);
      const lastRevenue = Number(lastMonthMetrics[0]?.totalCollection || 0);
      const operatingExpenses = Number(currentMonthMetrics[0]?.operatingExpenses || 0);
      const adSpend = Number(currentMonthMetrics[0]?.adSpend || 0);
      
      const totalExpenses = operatingExpenses + adSpend;

      // Calculate revenue growth
      const revenueGrowth = lastRevenue > 0 
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 
        : 0;

      // Calculate net profit
      const netProfit = currentRevenue - totalExpenses;

      // Calculate burn rate (daily average expenses)
      const daysInMonth = Math.ceil((currentMonthEnd.getTime() - currentMonthStart.getTime()) / (1000 * 60 * 60 * 24));
      const burnRate = totalExpenses / daysInMonth;

      // Estimate cash balance (simplified - 3 months of net profit as reserve)
      const cashBalance = Math.max(netProfit * 3, 0);

      return {
        totalRevenue: currentRevenue,
        revenueGrowth,
        totalExpenses,
        netProfit,
        burnRate,
        cashBalance
      };
    }),

  // Get cash flow data for chart
  getCashFlow: protectedProcedure
    .input(z.object({
      days: z.number().default(30)
    }))
    .query(async ({ input }) => {
      const db = await requireDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const endDate = new Date();
      const startDate = subDays(endDate, input.days);

      // Get daily metrics
      const dailyMetrics = await db
        .select({
          date: sql<string>`DATE_FORMAT(${dailyOperationalMetrics.date}, '%Y-%m-%d')`,
          revenue: dailyOperationalMetrics.totalCollection,
          expenses: sql<number>`${dailyOperationalMetrics.operatingExpenses} + ${dailyOperationalMetrics.adSpend}`
        })
        .from(dailyOperationalMetrics)
        .where(
          and(
            sql`DATE(${dailyOperationalMetrics.date}) >= DATE(${startDate.toISOString()})`,
            sql`DATE(${dailyOperationalMetrics.date}) <= DATE(${endDate.toISOString()})`
          )
        )
        .orderBy(sql`DATE(${dailyOperationalMetrics.date})`);

      // Format for chart
      const chartData = dailyMetrics.map(row => {
        const [year, month, day] = row.date.split('-');
        return {
          date: `${day}/${month}`,
          revenue: Number(row.revenue),
          expenses: Number(row.expenses)
        };
      });

      return chartData;
    }),

  // Get revenue analytics
  getRevenueAnalytics: protectedProcedure
    .query(async () => {
      const db = await requireDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date();
      const last6MonthsStart = subMonths(now, 6);

      // Monthly revenue for last 6 months
      const monthlyRevenue = await db
        .select({
          month: sql<string>`DATE_FORMAT(${dailyOperationalMetrics.date}, '%Y-%m')`,
          revenue: sql<number>`COALESCE(SUM(${dailyOperationalMetrics.totalCollection}), 0)`,
          orderCount: sql<number>`COALESCE(SUM(${dailyOperationalMetrics.ordersCreated}), 0)`
        })
        .from(dailyOperationalMetrics)
        .where(sql`DATE(${dailyOperationalMetrics.date}) >= DATE(${last6MonthsStart.toISOString()})`)
        .groupBy(sql`DATE_FORMAT(${dailyOperationalMetrics.date}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${dailyOperationalMetrics.date}, '%Y-%m')`);

      return {
        monthlyRevenue: monthlyRevenue.map(row => ({
          month: row.month,
          revenue: Number(row.revenue),
          orderCount: Number(row.orderCount)
        }))
      };
    }),

  // Get expenses breakdown
  getExpensesBreakdown: protectedProcedure
    .query(async () => {
      const db = await requireDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);

      // Get expenses from dailyOperationalMetrics
      const expensesData = await db
        .select({
          operatingExpenses: sql<number>`COALESCE(SUM(${dailyOperationalMetrics.operatingExpenses}), 0)`,
          adSpend: sql<number>`COALESCE(SUM(${dailyOperationalMetrics.adSpend}), 0)`,
          treasuryPaid: sql<number>`COALESCE(SUM(${dailyOperationalMetrics.treasuryPaid}), 0)`,
        })
        .from(dailyOperationalMetrics)
        .where(
          and(
            sql`DATE(${dailyOperationalMetrics.date}) >= DATE(${currentMonthStart.toISOString()})`,
            sql`DATE(${dailyOperationalMetrics.date}) <= DATE(${currentMonthEnd.toISOString()})`
          )
        );

      const data = expensesData[0] || { operatingExpenses: 0, adSpend: 0, treasuryPaid: 0 };

      const breakdown = [
        {
          category: 'مصروفات تشغيلية',
          amount: Number(data.operatingExpenses)
        },
        {
          category: 'إعلانات',
          amount: Number(data.adSpend)
        },
        {
          category: 'مدفوعات الخزينة',
          amount: Number(data.treasuryPaid)
        }
      ];

      return breakdown.filter(item => item.amount > 0);
    }),
});
