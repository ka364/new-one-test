/**
 * @fileoverview Google Sheets Templates Service
 * خدمة قوالب Google Sheets
 *
 * @description
 * Provides pre-built Google Sheets templates for business operations including
 * content calendars, campaign tracking, performance reports, inventory management,
 * competitor analysis, and budget planning. All templates support Arabic localization.
 *
 * توفر قوالب Google Sheets جاهزة للعمليات التجارية بما في ذلك جداول المحتوى،
 * تتبع الحملات، تقارير الأداء، إدارة المخزون، تحليل المنافسين، وتخطيط الميزانية.
 * جميع القوالب تدعم اللغة العربية.
 *
 * @module services/googleSheetsTemplates
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @requires ./googleDrive
 *
 * @example
 * ```typescript
 * import {
 *   createMonthlyContentCalendar,
 *   createDailyPerformanceReport,
 *   createInventoryTrackingSheet
 * } from './googleSheetsTemplates';
 *
 * // Create a content calendar
 * const calendar = await createMonthlyContentCalendar('ahmed', 'يناير', 2024);
 *
 * // Create a performance report
 * const report = await createDailyPerformanceReport('ahmed', '15/01/2024', campaigns);
 * ```
 */

import { createGoogleSheet } from './googleDrive';

/**
 * Create a monthly content calendar template
 * قالب جدول المحتوى الشهري
 *
 * @async
 * @param {string} username - Username for folder organization
 * @param {string} month - Month name (Arabic or English)
 * @param {number} year - Year (e.g., 2024)
 * @returns {Promise<{path: string, link: string}>} Path and shareable link
 *
 * @description
 * Creates a content calendar with daily entries for the specified month.
 * Includes columns for platform, content type, title, description, hashtags,
 * status, views, engagement, and notes.
 *
 * @example
 * ```typescript
 * const calendar = await createMonthlyContentCalendar('ahmed', 'يناير', 2024);
 * console.log(`Calendar link: ${calendar.link}`);
 * ```
 */
export async function createMonthlyContentCalendar(username: string, month: string, year: number) {
  const sheetName = `Content_Calendar_${month}_${year}`;
  const folderPath = `content-calendars/${username}`;

  const headers = [
    'التاريخ',
    'اليوم',
    'المنصة',
    'نوع المحتوى',
    'العنوان',
    'الوصف',
    'الهاشتاجات',
    'الحالة',
    'المشاهدات',
    'التفاعل',
    'الملاحظات',
  ];

  // Generate days of the month
  const daysInMonth = new Date(year, getMonthNumber(month), 0).getDate();
  const rows = [headers];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, getMonthNumber(month) - 1, day);
    const dayName = date.toLocaleDateString('ar-EG', { weekday: 'long' });
    rows.push([
      `${day}/${getMonthNumber(month)}/${year}`,
      dayName,
      '', // Platform
      '', // Content Type
      '', // Title
      '', // Description
      '', // Hashtags
      'مجدول', // Status
      '0', // Views
      '0%', // Engagement
      '', // Notes
    ]);
  }

  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * Create a daily performance report template
 * قالب التقرير اليومي للأداء
 *
 * @async
 * @param {string} username - Username for folder organization
 * @param {string} date - Report date
 * @param {Array<Object>} campaigns - Array of campaign data
 * @param {string} campaigns[].name - Campaign name
 * @param {number} campaigns[].budget - Campaign budget
 * @param {number} campaigns[].spent - Amount spent
 * @param {number} campaigns[].impressions - Total impressions
 * @param {number} campaigns[].clicks - Total clicks
 * @param {number} campaigns[].conversions - Total conversions
 * @param {number} campaigns[].revenue - Total revenue
 * @returns {Promise<{path: string, link: string}>} Path and shareable link
 *
 * @description
 * Creates a detailed daily performance report with campaign metrics including
 * CTR, ROI, budget status, and totals row with aggregated metrics.
 *
 * @example
 * ```typescript
 * const report = await createDailyPerformanceReport('ahmed', '15/01/2024', [
 *   { name: 'حملة فيسبوك', budget: 1000, spent: 800, impressions: 50000,
 *     clicks: 500, conversions: 25, revenue: 2500 }
 * ]);
 * ```
 */
export async function createDailyPerformanceReport(
  username: string,
  date: string,
  campaigns: Array<{
    name: string;
    budget: number;
    spent: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>
) {
  const sheetName = `Daily_Report_${date.replace(/\//g, '_')}`;
  const folderPath = `daily-reports/${username}`;

  const headers = [
    'اسم الحملة',
    'الميزانية',
    'المصروف',
    'الظهور',
    'النقرات',
    'CTR%',
    'التحويلات',
    'الإيرادات',
    'ROI%',
    'الحالة',
  ];

  const rows = [headers];
  let totalBudget = 0;
  let totalSpent = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  campaigns.forEach((campaign) => {
    const ctr =
      campaign.impressions > 0
        ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
        : '0.00';
    const roi =
      campaign.spent > 0
        ? (((campaign.revenue - campaign.spent) / campaign.spent) * 100).toFixed(2)
        : '0.00';
    const status = campaign.spent >= campaign.budget ? '⚠️ تجاوز الميزانية' : '✅ نشط';

    rows.push([
      campaign.name,
      campaign.budget.toFixed(2),
      campaign.spent.toFixed(2),
      campaign.impressions.toString(),
      campaign.clicks.toString(),
      ctr,
      campaign.conversions.toString(),
      campaign.revenue.toFixed(2),
      roi,
      status,
    ]);

    totalBudget += campaign.budget;
    totalSpent += campaign.spent;
    totalImpressions += campaign.impressions;
    totalClicks += campaign.clicks;
    totalConversions += campaign.conversions;
    totalRevenue += campaign.revenue;
  });

  // Add totals row
  const totalCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const totalRoi =
    totalSpent > 0 ? (((totalRevenue - totalSpent) / totalSpent) * 100).toFixed(2) : '0.00';

  rows.push([
    'الإجمالي',
    totalBudget.toFixed(2),
    totalSpent.toFixed(2),
    totalImpressions.toString(),
    totalClicks.toString(),
    totalCtr,
    totalConversions.toString(),
    totalRevenue.toFixed(2),
    totalRoi,
    '',
  ]);

  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * Create a campaign tracking template
 * قالب تتبع الحملات التسويقية
 *
 * @async
 * @param {string} username - Username for folder organization
 * @param {string} campaignName - Name of the campaign
 * @returns {Promise<{path: string, link: string}>} Path and shareable link
 *
 * @description
 * Creates a 30-day campaign tracking sheet with columns for daily metrics
 * including budget, spend, impressions, clicks, CTR, conversions, CPA, revenue, and ROI.
 *
 * @example
 * ```typescript
 * const tracker = await createCampaignTrackingSheet('ahmed', 'Summer Sale 2024');
 * console.log(`Tracker link: ${tracker.link}`);
 * ```
 */
export async function createCampaignTrackingSheet(username: string, campaignName: string) {
  const sheetName = `Campaign_${campaignName.replace(/\s+/g, '_')}`;
  const folderPath = `campaign-tracking/${username}`;

  const headers = [
    'التاريخ',
    'المنصة',
    'الميزانية اليومية',
    'المصروف',
    'الظهور',
    'النقرات',
    'CTR%',
    'التحويلات',
    'CPA',
    'الإيرادات',
    'ROI%',
    'الملاحظات',
  ];

  // Generate 30 days template
  const rows = [headers];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toLocaleDateString('ar-EG');

    rows.push([
      dateStr,
      '', // Platform
      '', // Daily Budget
      '', // Spent
      '', // Impressions
      '', // Clicks
      '', // CTR
      '', // Conversions
      '', // CPA
      '', // Revenue
      '', // ROI
      '', // Notes
    ]);
  }

  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * Create an inventory tracking template
 * قالب تتبع المخزون
 *
 * @async
 * @param {string} username - Username for folder organization
 * @param {Array<Object>} products - Array of product data
 * @param {string} products[].sku - Product SKU
 * @param {string} products[].name - Product name
 * @param {number} products[].currentStock - Current stock quantity
 * @param {number} products[].monthlySales - Average monthly sales
 * @returns {Promise<{path: string, link: string}>} Path and shareable link
 *
 * @description
 * Creates an inventory tracking sheet with automatic calculations for:
 * - Days remaining based on sales velocity
 * - Status indicators (urgent/warning/good)
 * - Suggested reorder quantities
 *
 * Status levels:
 * - 🔴 عاجل: Stock will run out within 1 week
 * - ⚠️ تحذير: Stock will run out within 2 weeks
 * - ⚡ متابعة: Stock will run out within 1 month
 * - ✅ جيد: Sufficient stock
 *
 * @example
 * ```typescript
 * const inventory = await createInventoryTrackingSheet('ahmed', [
 *   { sku: 'PRD-001', name: 'منتج أ', currentStock: 50, monthlySales: 100 },
 *   { sku: 'PRD-002', name: 'منتج ب', currentStock: 200, monthlySales: 50 }
 * ]);
 * ```
 */
export async function createInventoryTrackingSheet(
  username: string,
  products: Array<{
    sku: string;
    name: string;
    currentStock: number;
    monthlySales: number;
  }>
) {
  const sheetName = `Inventory_Tracking_${new Date().toISOString().split('T')[0]}`;
  const folderPath = `inventory/${username}`;

  const headers = [
    'SKU',
    'اسم المنتج',
    'المخزون الحالي',
    'المبيعات الشهرية',
    'الأيام المتبقية',
    'الحالة',
    'الطلب المقترح',
    'الملاحظات',
  ];

  const rows = [headers];

  products.forEach((product) => {
    const daysRemaining =
      product.monthlySales > 0
        ? Math.floor((product.currentStock / product.monthlySales) * 30)
        : 999;

    let status = '✅ جيد';
    let suggestedOrder = 0;

    if (daysRemaining < 7) {
      status = '🔴 عاجل - يخلص خلال أسبوع';
      suggestedOrder = product.monthlySales * 2; // Order for 2 months
    } else if (daysRemaining < 14) {
      status = '⚠️ تحذير - يخلص خلال أسبوعين';
      suggestedOrder = product.monthlySales;
    } else if (daysRemaining < 30) {
      status = '⚡ متابعة - يخلص خلال شهر';
    }

    rows.push([
      product.sku,
      product.name,
      product.currentStock.toString(),
      product.monthlySales.toString(),
      daysRemaining.toString(),
      status,
      suggestedOrder > 0 ? suggestedOrder.toString() : '-',
      '',
    ]);
  });

  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * Create a competitor analysis template
 * قالب تحليل المنافسين
 *
 * @async
 * @param {string} username - Username for folder organization
 * @param {string[]} competitors - Array of competitor names
 * @returns {Promise<{path: string, link: string}>} Path and shareable link
 *
 * @description
 * Creates a competitor analysis sheet with columns for platform, content type,
 * posting frequency, average engagement, best times, hashtags used,
 * strengths, weaknesses, and opportunities.
 *
 * @example
 * ```typescript
 * const analysis = await createCompetitorAnalysisSheet('ahmed', [
 *   'منافس أ',
 *   'منافس ب',
 *   'منافس ج'
 * ]);
 * ```
 */
export async function createCompetitorAnalysisSheet(username: string, competitors: string[]) {
  const sheetName = `Competitor_Analysis_${new Date().toISOString().split('T')[0]}`;
  const folderPath = `competitor-analysis/${username}`;

  const headers = [
    'المنافس',
    'المنصة',
    'نوع المحتوى',
    'التكرار',
    'متوسط التفاعل',
    'أفضل الأوقات',
    'الهاشتاجات المستخدمة',
    'نقاط القوة',
    'نقاط الضعف',
    'الفرص',
  ];

  const rows = [headers];

  competitors.forEach((competitor) => {
    rows.push([
      competitor,
      '', // Platform
      '', // Content Type
      '', // Frequency
      '', // Avg Engagement
      '', // Best Times
      '', // Hashtags
      '', // Strengths
      '', // Weaknesses
      '', // Opportunities
    ]);
  });

  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * Create a campaign budget template
 * قالب ميزانية الحملات
 *
 * @async
 * @param {string} username - Username for folder organization
 * @param {string} month - Month name
 * @param {number} year - Year
 * @param {number} totalBudget - Total monthly budget
 * @returns {Promise<{path: string, link: string}>} Path and shareable link
 *
 * @description
 * Creates a budget planning sheet for 23 campaigns with columns for
 * platform, allocated budget, spent amount, remaining budget,
 * usage percentage, expected performance, and recommendations.
 *
 * @example
 * ```typescript
 * const budget = await createCampaignBudgetSheet('ahmed', 'يناير', 2024, 50000);
 * console.log(`Budget sheet: ${budget.link}`);
 * ```
 */
export async function createCampaignBudgetSheet(
  username: string,
  month: string,
  year: number,
  totalBudget: number
) {
  const sheetName = `Budget_${month}_${year}`;
  const folderPath = `budgets/${username}`;

  const headers = [
    'الحملة',
    'المنصة',
    'الميزانية المخصصة',
    'المصروف حتى الآن',
    'المتبقي',
    'النسبة المستخدمة%',
    'الأداء المتوقع',
    'التوصية',
  ];

  const rows = [headers];

  // Add 23 campaigns (as mentioned by user)
  for (let i = 1; i <= 23; i++) {
    const campaignBudget = totalBudget / 23;
    rows.push([
      `حملة ${i}`,
      '', // Platform
      campaignBudget.toFixed(2),
      '', // Spent
      '', // Remaining
      '', // Percentage
      '', // Expected Performance
      '', // Recommendation
    ]);
  }

  // Add total row
  rows.push(['الإجمالي', '', totalBudget.toFixed(2), '', '', '', '', '']);

  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * Convert month name to number
 * تحويل اسم الشهر إلى رقم
 *
 * @private
 * @param {string} month - Month name in Arabic or English
 * @returns {number} Month number (1-12), defaults to 1 if not found
 *
 * @example
 * ```typescript
 * getMonthNumber('يناير');  // Returns 1
 * getMonthNumber('January'); // Returns 1
 * ```
 */
function getMonthNumber(month: string): number {
  const months: { [key: string]: number } = {
    يناير: 1,
    فبراير: 2,
    مارس: 3,
    أبريل: 4,
    مايو: 5,
    يونيو: 6,
    يوليو: 7,
    أغسطس: 8,
    سبتمبر: 9,
    أكتوبر: 10,
    نوفمبر: 11,
    ديسمبر: 12,
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };
  return months[month] || 1;
}
