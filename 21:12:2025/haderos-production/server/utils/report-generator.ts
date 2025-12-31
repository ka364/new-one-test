/**
 * Report Generator Utility
 * Generates reports in multiple formats: PDF, Excel, CSV
 */

import { writeFile } from "fs/promises";
import { join } from "path";

export interface ReportData {
  title: string;
  subtitle?: string;
  period?: {
    startDate: string;
    endDate: string;
  };
  summary?: Record<string, any>;
  sections?: ReportSection[];
  tables?: ReportTable[];
  charts?: ReportChart[];
  footer?: string;
}

export interface ReportSection {
  title: string;
  content: string | Record<string, any>;
  subsections?: ReportSection[];
}

export interface ReportTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  totals?: (string | number)[];
}

export interface ReportChart {
  title: string;
  type: "line" | "bar" | "pie" | "area";
  data: any[];
}

/**
 * Generate PDF Report
 * Uses a simple text-based format for now
 * In production, use libraries like pdfkit or puppeteer
 */
export async function generatePDFReport(data: ReportData): Promise<string> {
  const content: string[] = [];

  // Header
  content.push("=".repeat(80));
  content.push(data.title.toUpperCase());
  if (data.subtitle) {
    content.push(data.subtitle);
  }
  if (data.period) {
    content.push(`Period: ${data.period.startDate} to ${data.period.endDate}`);
  }
  content.push("=".repeat(80));
  content.push("");

  // Summary
  if (data.summary) {
    content.push("SUMMARY");
    content.push("-".repeat(80));
    Object.entries(data.summary).forEach(([key, value]) => {
      const label = key.replace(/_/g, " ").toUpperCase();
      content.push(`${label}: ${formatValue(value)}`);
    });
    content.push("");
  }

  // Sections
  if (data.sections) {
    data.sections.forEach((section) => {
      content.push(section.title.toUpperCase());
      content.push("-".repeat(80));
      if (typeof section.content === "string") {
        content.push(section.content);
      } else {
        Object.entries(section.content).forEach(([key, value]) => {
          const label = key.replace(/_/g, " ");
          content.push(`  ${label}: ${formatValue(value)}`);
        });
      }
      content.push("");

      // Subsections
      if (section.subsections) {
        section.subsections.forEach((subsection) => {
          content.push(`  ${subsection.title}`);
          if (typeof subsection.content === "string") {
            content.push(`    ${subsection.content}`);
          } else {
            Object.entries(subsection.content).forEach(([key, value]) => {
              const label = key.replace(/_/g, " ");
              content.push(`    ${label}: ${formatValue(value)}`);
            });
          }
          content.push("");
        });
      }
    });
  }

  // Tables
  if (data.tables) {
    data.tables.forEach((table) => {
      content.push(table.title.toUpperCase());
      content.push("-".repeat(80));

      // Headers
      content.push(table.headers.join(" | "));
      content.push("-".repeat(80));

      // Rows
      table.rows.forEach((row) => {
        content.push(row.map(cell => formatValue(cell)).join(" | "));
      });

      // Totals
      if (table.totals) {
        content.push("-".repeat(80));
        content.push(table.totals.map(cell => formatValue(cell)).join(" | "));
      }

      content.push("");
    });
  }

  // Charts (text representation)
  if (data.charts) {
    data.charts.forEach((chart) => {
      content.push(chart.title.toUpperCase());
      content.push(`Type: ${chart.type}`);
      content.push("-".repeat(80));
      content.push("(Chart data - visual representation in actual PDF)");
      content.push(JSON.stringify(chart.data, null, 2));
      content.push("");
    });
  }

  // Footer
  if (data.footer) {
    content.push("=".repeat(80));
    content.push(data.footer);
  }

  content.push("");
  content.push(`Generated: ${new Date().toISOString()}`);
  content.push("=".repeat(80));

  return content.join("\n");
}

/**
 * Generate Excel Report
 * Returns CSV format for now
 * In production, use libraries like exceljs
 */
export async function generateExcelReport(data: ReportData): Promise<string> {
  const content: string[] = [];

  // Header
  content.push(`"${data.title}"`);
  if (data.subtitle) {
    content.push(`"${data.subtitle}"`);
  }
  if (data.period) {
    content.push(`"Period: ${data.period.startDate} to ${data.period.endDate}"`);
  }
  content.push("");

  // Summary
  if (data.summary) {
    content.push('"SUMMARY"');
    Object.entries(data.summary).forEach(([key, value]) => {
      const label = key.replace(/_/g, " ");
      content.push(`"${label}","${formatValue(value)}"`);
    });
    content.push("");
  }

  // Tables
  if (data.tables) {
    data.tables.forEach((table) => {
      content.push(`"${table.title}"`);
      
      // Headers
      content.push(table.headers.map(h => `"${h}"`).join(","));

      // Rows
      table.rows.forEach((row) => {
        content.push(row.map(cell => `"${formatValue(cell)}"`).join(","));
      });

      // Totals
      if (table.totals) {
        content.push(table.totals.map(cell => `"${formatValue(cell)}"`).join(","));
      }

      content.push("");
    });
  }

  // Footer
  if (data.footer) {
    content.push(`"${data.footer}"`);
  }

  content.push(`"Generated: ${new Date().toISOString()}"`);

  return content.join("\n");
}

/**
 * Generate CSV Report
 * Simple CSV format
 */
export async function generateCSVReport(data: ReportData): Promise<string> {
  const content: string[] = [];

  // Header
  content.push(`"${data.title}"`);
  if (data.subtitle) {
    content.push(`"${data.subtitle}"`);
  }
  if (data.period) {
    content.push(`"Period","${data.period.startDate}","${data.period.endDate}"`);
  }
  content.push("");

  // Summary
  if (data.summary) {
    content.push('"Metric","Value"');
    Object.entries(data.summary).forEach(([key, value]) => {
      const label = key.replace(/_/g, " ");
      content.push(`"${label}","${formatValue(value)}"`);
    });
    content.push("");
  }

  // Tables
  if (data.tables) {
    data.tables.forEach((table) => {
      content.push(`"${table.title}"`);
      
      // Headers
      content.push(table.headers.map(h => `"${h}"`).join(","));

      // Rows
      table.rows.forEach((row) => {
        content.push(row.map(cell => `"${formatValue(cell)}"`).join(","));
      });

      // Totals
      if (table.totals) {
        content.push(table.totals.map(cell => `"${formatValue(cell)}"`).join(","));
      }

      content.push("");
    });
  }

  return content.join("\n");
}

/**
 * Save Report to File
 */
export async function saveReport(
  content: string,
  filename: string,
  directory: string = "/tmp/reports"
): Promise<string> {
  const filepath = join(directory, filename);
  await writeFile(filepath, content, "utf-8");
  return filepath;
}

/**
 * Format Value for Display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    // Format numbers with commas
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return String(value);
}

/**
 * Generate Report by Type
 */
export async function generateReport(
  data: ReportData,
  format: "pdf" | "excel" | "csv"
): Promise<string> {
  switch (format) {
    case "pdf":
      return generatePDFReport(data);
    case "excel":
      return generateExcelReport(data);
    case "csv":
      return generateCSVReport(data);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Financial Report Generator
 */
export function generateFinancialReportData(reportData: any): ReportData {
  return {
    title: "Financial Report",
    subtitle: "Profit & Loss Statement",
    period: reportData.period,
    summary: reportData.summary,
    sections: [
      {
        title: "Revenue",
        content: reportData.revenue,
      },
      {
        title: "Expenses",
        content: reportData.expenses,
      },
      {
        title: "Profitability",
        content: reportData.profitLoss,
      },
    ],
    tables: [
      {
        title: "Daily Revenue",
        headers: ["Date", "Total Revenue", "Collected", "Transactions"],
        rows: reportData.revenue.daily.map((day: any) => [
          day.date,
          day.total,
          day.collected,
          day.transactions,
        ]),
      },
      {
        title: "Expenses by Category",
        headers: ["Category", "Amount"],
        rows: Object.entries(reportData.expenses.byCategory).map(([category, amount]) => [
          category,
          amount as number,
        ]),
        totals: ["Total", reportData.expenses.total],
      },
    ],
    footer: "HADEROS Financial Report - Confidential",
  };
}

/**
 * Sales Analytics Report Generator
 */
export function generateSalesReportData(reportData: any): ReportData {
  return {
    title: "Sales Analytics Report",
    period: reportData.period,
    summary: reportData.summary,
    tables: [
      {
        title: "Sales Trends",
        headers: ["Date", "Orders", "Sales", "Avg Order Value"],
        rows: reportData.trends.map((day: any) => [
          day.date,
          day.orders,
          day.sales,
          day.avgOrderValue,
        ]),
      },
      {
        title: "Top Products",
        headers: ["Product", "SKU", "Orders", "Quantity", "Revenue"],
        rows: reportData.topProducts.map((product: any) => [
          product.name,
          product.sku,
          product.orderCount,
          product.totalQuantity,
          product.totalRevenue,
        ]),
      },
      {
        title: "Customer Segments",
        headers: ["Segment", "Customers", "Revenue", "Avg Value"],
        rows: reportData.customerSegments.map((segment: any) => [
          segment.segment,
          segment.customerCount,
          segment.totalRevenue,
          segment.avgCustomerValue,
        ]),
      },
    ],
    footer: "HADEROS Sales Analytics - Confidential",
  };
}

/**
 * Marketing Performance Report Generator
 */
export function generateMarketingReportData(reportData: any): ReportData {
  return {
    title: "Marketing Performance Report",
    period: reportData.period,
    summary: reportData.summary,
    tables: [
      {
        title: "Campaign Performance",
        headers: ["Campaign", "Platform", "Spend", "Revenue", "ROI", "CTR", "CPC"],
        rows: reportData.campaigns.map((campaign: any) => [
          campaign.name,
          campaign.platform,
          campaign.spend,
          campaign.revenue,
          `${campaign.roi.toFixed(2)}%`,
          `${campaign.ctr.toFixed(2)}%`,
          campaign.cpc,
        ]),
      },
    ],
    footer: "HADEROS Marketing Report - Confidential",
  };
}

/**
 * Operations Performance Report Generator
 */
export function generateOperationsReportData(reportData: any): ReportData {
  return {
    title: "Operations Performance Report",
    period: reportData.period,
    sections: [
      {
        title: "Order Fulfillment",
        content: reportData.orderFulfillment,
      },
      {
        title: "Delivery Performance",
        content: reportData.delivery,
      },
      {
        title: "Inventory Status",
        content: reportData.inventory,
      },
    ],
    footer: "HADEROS Operations Report - Confidential",
  };
}

/**
 * HR Performance Report Generator
 */
export function generateHRReportData(reportData: any): ReportData {
  return {
    title: "HR Performance Report",
    period: reportData.period,
    sections: [
      {
        title: "Employee Metrics",
        content: reportData.employees,
      },
      {
        title: "Attendance",
        content: reportData.attendance,
      },
      {
        title: "Training",
        content: reportData.training,
      },
    ],
    footer: "HADEROS HR Report - Confidential",
  };
}
