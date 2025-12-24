import { createGoogleSheet } from "./googleDrive";

/**
 * قالب جدول المحتوى الشهري
 * Monthly Content Calendar Template
 */
export async function createMonthlyContentCalendar(
  username: string,
  month: string,
  year: number
) {
  const sheetName = `Content_Calendar_${month}_${year}`;
  const folderPath = `content-calendars/${username}`;
  
  const headers = [
    "التاريخ",
    "اليوم",
    "المنصة",
    "نوع المحتوى",
    "العنوان",
    "الوصف",
    "الهاشتاجات",
    "الحالة",
    "المشاهدات",
    "التفاعل",
    "الملاحظات",
  ];
  
  // Generate days of the month
  const daysInMonth = new Date(year, getMonthNumber(month), 0).getDate();
  const rows = [headers];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, getMonthNumber(month) - 1, day);
    const dayName = date.toLocaleDateString("ar-EG", { weekday: "long" });
    rows.push([
      `${day}/${getMonthNumber(month)}/${year}`,
      dayName,
      "", // Platform
      "", // Content Type
      "", // Title
      "", // Description
      "", // Hashtags
      "مجدول", // Status
      "0", // Views
      "0%", // Engagement
      "", // Notes
    ]);
  }
  
  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * قالب التقرير اليومي
 * Daily Performance Report Template
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
  const sheetName = `Daily_Report_${date.replace(/\//g, "_")}`;
  const folderPath = `daily-reports/${username}`;
  
  const headers = [
    "اسم الحملة",
    "الميزانية",
    "المصروف",
    "الظهور",
    "النقرات",
    "CTR%",
    "التحويلات",
    "الإيرادات",
    "ROI%",
    "الحالة",
  ];
  
  const rows = [headers];
  let totalBudget = 0;
  let totalSpent = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalRevenue = 0;
  
  campaigns.forEach((campaign) => {
    const ctr = campaign.impressions > 0 
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) 
      : "0.00";
    const roi = campaign.spent > 0 
      ? (((campaign.revenue - campaign.spent) / campaign.spent) * 100).toFixed(2) 
      : "0.00";
    const status = campaign.spent >= campaign.budget ? "⚠️ تجاوز الميزانية" : "✅ نشط";
    
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
  const totalCtr = totalImpressions > 0 
    ? ((totalClicks / totalImpressions) * 100).toFixed(2) 
    : "0.00";
  const totalRoi = totalSpent > 0 
    ? (((totalRevenue - totalSpent) / totalSpent) * 100).toFixed(2) 
    : "0.00";
  
  rows.push([
    "الإجمالي",
    totalBudget.toFixed(2),
    totalSpent.toFixed(2),
    totalImpressions.toString(),
    totalClicks.toString(),
    totalCtr,
    totalConversions.toString(),
    totalRevenue.toFixed(2),
    totalRoi,
    "",
  ]);
  
  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * قالب تتبع الحملات التسويقية
 * Campaign Tracking Template
 */
export async function createCampaignTrackingSheet(
  username: string,
  campaignName: string
) {
  const sheetName = `Campaign_${campaignName.replace(/\s+/g, "_")}`;
  const folderPath = `campaign-tracking/${username}`;
  
  const headers = [
    "التاريخ",
    "المنصة",
    "الميزانية اليومية",
    "المصروف",
    "الظهور",
    "النقرات",
    "CTR%",
    "التحويلات",
    "CPA",
    "الإيرادات",
    "ROI%",
    "الملاحظات",
  ];
  
  // Generate 30 days template
  const rows = [headers];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toLocaleDateString("ar-EG");
    
    rows.push([
      dateStr,
      "", // Platform
      "", // Daily Budget
      "", // Spent
      "", // Impressions
      "", // Clicks
      "", // CTR
      "", // Conversions
      "", // CPA
      "", // Revenue
      "", // ROI
      "", // Notes
    ]);
  }
  
  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * قالب تتبع المخزون
 * Inventory Tracking Template
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
  const sheetName = `Inventory_Tracking_${new Date().toISOString().split("T")[0]}`;
  const folderPath = `inventory/${username}`;
  
  const headers = [
    "SKU",
    "اسم المنتج",
    "المخزون الحالي",
    "المبيعات الشهرية",
    "الأيام المتبقية",
    "الحالة",
    "الطلب المقترح",
    "الملاحظات",
  ];
  
  const rows = [headers];
  
  products.forEach((product) => {
    const daysRemaining = product.monthlySales > 0 
      ? Math.floor((product.currentStock / product.monthlySales) * 30) 
      : 999;
    
    let status = "✅ جيد";
    let suggestedOrder = 0;
    
    if (daysRemaining < 7) {
      status = "🔴 عاجل - يخلص خلال أسبوع";
      suggestedOrder = product.monthlySales * 2; // Order for 2 months
    } else if (daysRemaining < 14) {
      status = "⚠️ تحذير - يخلص خلال أسبوعين";
      suggestedOrder = product.monthlySales;
    } else if (daysRemaining < 30) {
      status = "⚡ متابعة - يخلص خلال شهر";
    }
    
    rows.push([
      product.sku,
      product.name,
      product.currentStock.toString(),
      product.monthlySales.toString(),
      daysRemaining.toString(),
      status,
      suggestedOrder > 0 ? suggestedOrder.toString() : "-",
      "",
    ]);
  });
  
  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * قالب تحليل المنافسين
 * Competitor Analysis Template
 */
export async function createCompetitorAnalysisSheet(
  username: string,
  competitors: string[]
) {
  const sheetName = `Competitor_Analysis_${new Date().toISOString().split("T")[0]}`;
  const folderPath = `competitor-analysis/${username}`;
  
  const headers = [
    "المنافس",
    "المنصة",
    "نوع المحتوى",
    "التكرار",
    "متوسط التفاعل",
    "أفضل الأوقات",
    "الهاشتاجات المستخدمة",
    "نقاط القوة",
    "نقاط الضعف",
    "الفرص",
  ];
  
  const rows = [headers];
  
  competitors.forEach((competitor) => {
    rows.push([
      competitor,
      "", // Platform
      "", // Content Type
      "", // Frequency
      "", // Avg Engagement
      "", // Best Times
      "", // Hashtags
      "", // Strengths
      "", // Weaknesses
      "", // Opportunities
    ]);
  });
  
  return await createGoogleSheet(sheetName, folderPath, rows);
}

/**
 * قالب ميزانية الحملات
 * Campaign Budget Template
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
    "الحملة",
    "المنصة",
    "الميزانية المخصصة",
    "المصروف حتى الآن",
    "المتبقي",
    "النسبة المستخدمة%",
    "الأداء المتوقع",
    "التوصية",
  ];
  
  const rows = [headers];
  
  // Add 23 campaigns (as mentioned by user)
  for (let i = 1; i <= 23; i++) {
    const campaignBudget = totalBudget / 23;
    rows.push([
      `حملة ${i}`,
      "", // Platform
      campaignBudget.toFixed(2),
      "", // Spent
      "", // Remaining
      "", // Percentage
      "", // Expected Performance
      "", // Recommendation
    ]);
  }
  
  // Add total row
  rows.push([
    "الإجمالي",
    "",
    totalBudget.toFixed(2),
    "",
    "",
    "",
    "",
    "",
  ]);
  
  return await createGoogleSheet(sheetName, folderPath, rows);
}

// Helper function
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
