/**
 * 🤖 HADEROS AI CO-PILOT - Main Entry Point
 *
 * نقطة الدخول الرئيسية لنظام المساعد الذكي
 */

export { HaderosAICoPilot, haderosAI } from './core/HaderosAICoPilot';
export { SystemAnalyzer } from './core/SystemAnalyzer';
export { AICodeGenerator } from './core/AICodeGenerator';
export { SecurityAuditor } from './core/SecurityAuditor';
export { PerformanceOptimizer } from './core/PerformanceOptimizer';
export { SelfHealingEngine } from './core/SelfHealingEngine';

export type { AIAnalysisResult, Issue, Recommendation } from './core/HaderosAICoPilot';

export type { StructureAnalysis, ArchitectureAnalysis } from './core/SystemAnalyzer';

export type { CodeQualityAnalysis, CodeIssue } from './core/AICodeGenerator';

export type { SecurityAnalysis, SecurityVulnerability } from './core/SecurityAuditor';

export type { PerformanceAnalysis, PerformanceBottleneck } from './core/PerformanceOptimizer';
