/**
 * نظام التقارير المتقدم - المركز الرئيسي
 * Advanced Reporting System - Main Hub
 *
 * يجمع جميع خدمات التقارير في مكان واحد
 * Consolidates all reporting services in one place
 */

export * from './financial-reports';
export * from './hr-reports';
export * from './operations-reports';
export * from './simulation-reports';

/**
 * دليل الاستخدام
 * Usage Guide
 *
 * التقارير المالية (Financial Reports):
 * ================================
 * import { FinancialReportService } from './reports';
 *
 * const profitLoss = await FinancialReportService.getProfitAndLossReport({
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31')
 * });
 *
 * const cashFlow = await FinancialReportService.getCashFlowReport({
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31')
 * });
 *
 *
 * التقارير البشرية (HR Reports):
 * ==============================
 * import { HRReportService } from './reports';
 *
 * const hrReport = await HRReportService.getComprehensiveHRReport({
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31')
 * });
 *
 * const performance = await HRReportService.getPerformanceReport({
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31')
 * });
 *
 *
 * التقارير التشغيلية (Operations Reports):
 * ========================================
 * import { OperationsReportService } from './reports';
 *
 * const operations = await OperationsReportService.getComprehensiveOperationsReport({
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31')
 * });
 *
 * const efficiency = await OperationsReportService.getEfficiencyReport({
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31')
 * });
 *
 *
 * تقارير المحاكاة (Simulation Reports):
 * ====================================
 * import { SimulationReportService } from './reports';
 *
 * const simulation = await SimulationReportService.getComprehensiveSimulationReport({
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31')
 * });
 *
 * const projections = await SimulationReportService.getProjectionsReport({
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31'),
 *   includeProjections: true
 * });
 *
 *
 * التصدير (Export):
 * =================
 * // تصدير إلى JSON
 * const json = await FinancialReportService.exportToJSON(profitLoss);
 *
 * // تصدير إلى CSV
 * const csv = await FinancialReportService.exportToCSV(profitLoss);
 */
