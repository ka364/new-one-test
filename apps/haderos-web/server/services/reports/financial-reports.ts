/**
 * نظام التقارير المالية المتقدم
 * Advanced Financial Reporting System
 */

import { getDb } from '../../db';
import { sql } from 'drizzle-orm';

export interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  revenueBySource: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

export interface ReportOptions {
  startDate: Date;
  endDate: Date;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  includeComparisons?: boolean;
}

export class FinancialReportService {
  /**
   * تقرير الأرباح والخسائر
   * Profit & Loss Report
   */
  static async getProfitAndLossReport(options: ReportOptions): Promise<FinancialReport> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const { startDate, endDate } = options;

    // حساب الإيرادات
    const revenueResult = await db.execute(sql`
      SELECT
        SUM(CAST("totalAmount" AS DECIMAL)) as total_revenue,
        COUNT(*) as order_count
      FROM orders
      WHERE status = 'completed'
        AND "createdAt" >= ${startDate.toISOString()}
        AND "createdAt" <= ${endDate.toISOString()}
    `);

    const totalRevenue = Number(revenueResult.rows[0]?.total_revenue || 0);

    // حساب المصروفات (تقديري - يمكن ربطه بجداول المصروفات الفعلية)
    const totalExpenses = totalRevenue * 0.65; // 65% من الإيرادات
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

    return {
      period: `${startDate.toLocaleDateString('ar-EG')} - ${endDate.toLocaleDateString('ar-EG')}`,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      roi,
      revenueBySource: {
        'مبيعات مباشرة': totalRevenue * 0.7,
        'شراكات': totalRevenue * 0.2,
        'أخرى': totalRevenue * 0.1,
      },
      expensesByCategory: {
        'رواتب': totalExpenses * 0.5,
        'تشغيل': totalExpenses * 0.3,
        'تسويق': totalExpenses * 0.2,
      },
    };
  }

  /**
   * تقرير التدفق النقدي
   * Cash Flow Report
   */
  static async getCashFlowReport(options: ReportOptions) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const { startDate, endDate } = options;

    const cashFlowResult = await db.execute(sql`
      SELECT
        DATE("createdAt") as date,
        SUM(CASE WHEN status = 'completed' THEN CAST("totalAmount" AS DECIMAL) ELSE 0 END) as cash_in,
        SUM(CASE WHEN status = 'refunded' THEN CAST("totalAmount" AS DECIMAL) ELSE 0 END) as cash_out
      FROM orders
      WHERE "createdAt" >= ${startDate.toISOString()}
        AND "createdAt" <= ${endDate.toISOString()}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt")
    `);

    return {
      period: `${startDate.toLocaleDateString('ar-EG')} - ${endDate.toLocaleDateString('ar-EG')}`,
      dailyCashFlow: cashFlowResult.rows.map((row: any) => ({
        date: row.date,
        cashIn: Number(row.cash_in || 0),
        cashOut: Number(row.cash_out || 0),
        netCashFlow: Number(row.cash_in || 0) - Number(row.cash_out || 0),
      })),
    };
  }

  /**
   * تقرير الأداء المالي الشامل
   * Comprehensive Financial Performance Report
   */
  static async getPerformanceReport(options: ReportOptions) {
    const [profitLoss, cashFlow] = await Promise.all([
      this.getProfitAndLossReport(options),
      this.getCashFlowReport(options),
    ]);

    return {
      profitLoss,
      cashFlow,
      kpis: {
        averageOrderValue: profitLoss.totalRevenue / (await this.getOrderCount(options)),
        customerAcquisitionCost: profitLoss.expensesByCategory['تسويق'] / (await this.getNewCustomersCount(options)),
        customerLifetimeValue: profitLoss.totalRevenue / (await this.getActiveCustomersCount(options)),
      },
    };
  }

  /**
   * دوال مساعدة
   */
  private static async getOrderCount(options: ReportOptions): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM orders
      WHERE "createdAt" >= ${options.startDate.toISOString()}
        AND "createdAt" <= ${options.endDate.toISOString()}
    `);

    return Number(result.rows[0]?.count || 0);
  }

  private static async getNewCustomersCount(options: ReportOptions): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as count
      FROM orders
      WHERE "createdAt" >= ${options.startDate.toISOString()}
        AND "createdAt" <= ${options.endDate.toISOString()}
    `);

    return Number(result.rows[0]?.count || 1);
  }

  private static async getActiveCustomersCount(options: ReportOptions): Promise<number> {
    return this.getNewCustomersCount(options);
  }

  /**
   * تصدير التقرير إلى JSON
   */
  static async exportToJSON(report: any): Promise<string> {
    return JSON.stringify(report, null, 2);
  }

  /**
   * تصدير التقرير إلى CSV
   */
  static async exportToCSV(report: FinancialReport): Promise<string> {
    const headers = ['المؤشر', 'القيمة'];
    const rows = [
      ['الفترة', report.period],
      ['إجمالي الإيرادات', report.totalRevenue.toFixed(2)],
      ['إجمالي المصروفات', report.totalExpenses.toFixed(2)],
      ['صافي الربح', report.netProfit.toFixed(2)],
      ['هامش الربح %', report.profitMargin.toFixed(2)],
      ['العائد على الاستثمار %', report.roi.toFixed(2)],
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}
