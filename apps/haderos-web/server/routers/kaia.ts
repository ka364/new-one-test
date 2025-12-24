import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { requireDb } from "../db";
import { transactions, ethicalRules, auditTrail } from "../../drizzle/schema";
import { sql, and, gte, lte, eq, desc } from "drizzle-orm";
import { startOfMonth, endOfMonth } from 'date-fns';

// Sharia Compliance Rules Engine
interface ComplianceRule {
  id: string;
  name: string;
  nameAr: string;
  category: 'riba' | 'gharar' | 'maysir' | 'haram_goods';
  severity: 'critical' | 'high' | 'medium' | 'low';
  check: (transaction: any) => boolean;
  reason: string;
  reasonAr: string;
}

const SHARIA_RULES: ComplianceRule[] = [
  // Riba (Interest) Detection
  {
    id: 'RIBA_001',
    name: 'Interest-bearing transaction',
    nameAr: 'معاملة ربوية',
    category: 'riba',
    severity: 'critical',
    check: (tx) => {
      // Check if transaction has interest rate or interest amount
      const hasInterest = tx.interestRate > 0 || tx.interestAmount > 0;
      const hasFinancingFee = tx.description?.toLowerCase().includes('interest') || 
                              tx.description?.toLowerCase().includes('financing fee') ||
                              tx.description?.includes('فائدة') ||
                              tx.description?.includes('رسوم تمويل');
      return hasInterest || hasFinancingFee;
    },
    reason: 'Transaction involves interest (Riba), which is strictly prohibited in Islamic finance',
    reasonAr: 'المعاملة تتضمن فائدة (ربا)، وهو محرم شرعاً في الإسلام'
  },
  {
    id: 'RIBA_002',
    name: 'Loan with markup',
    nameAr: 'قرض بزيادة',
    category: 'riba',
    severity: 'critical',
    check: (tx) => {
      // Check if it's a loan with amount greater than principal
      const isLoan = tx.transactionType === 'loan' || tx.description?.toLowerCase().includes('loan');
      const hasMarkup = tx.amount > tx.principalAmount && tx.principalAmount > 0;
      return isLoan && hasMarkup;
    },
    reason: 'Loan with markup (Qard with Riba) is prohibited',
    reasonAr: 'القرض بزيادة (قرض ربوي) محرم شرعاً'
  },
  
  // Gharar (Uncertainty) Detection
  {
    id: 'GHARAR_001',
    name: 'Excessive uncertainty',
    nameAr: 'غرر فاحش',
    category: 'gharar',
    severity: 'high',
    check: (tx) => {
      // Check for undefined terms or uncertain outcomes
      const hasUncertainTerms = !tx.deliveryDate || !tx.specifications;
      const isSpeculative = tx.description?.toLowerCase().includes('speculation') ||
                           tx.description?.toLowerCase().includes('bet') ||
                           tx.description?.includes('مضاربة') ||
                           tx.description?.includes('رهان');
      return hasUncertainTerms || isSpeculative;
    },
    reason: 'Transaction contains excessive uncertainty (Gharar Fahish)',
    reasonAr: 'المعاملة تحتوي على غرر فاحش'
  },
  {
    id: 'GHARAR_002',
    name: 'Sale of non-existent goods',
    nameAr: 'بيع المعدوم',
    category: 'gharar',
    severity: 'high',
    check: (tx) => {
      // Check if selling something that doesn't exist yet
      const sellingNonExistent = tx.goodsStatus === 'not_yet_produced' || 
                                 tx.goodsStatus === 'not_owned';
      return sellingNonExistent && !tx.isIstisna && !tx.isSalam;
    },
    reason: 'Selling non-existent goods without proper Islamic contract (Istisna/Salam)',
    reasonAr: 'بيع المعدوم بدون عقد إسلامي صحيح (استصناع/سلم)'
  },
  
  // Maysir (Gambling) Detection
  {
    id: 'MAYSIR_001',
    name: 'Gambling transaction',
    nameAr: 'معاملة قمارية',
    category: 'maysir',
    severity: 'critical',
    check: (tx) => {
      // Check for gambling-related keywords
      const gamblingKeywords = ['casino', 'lottery', 'betting', 'gambling', 'poker', 
                                'قمار', 'مراهنة', 'يانصيب', 'كازينو'];
      const description = tx.description?.toLowerCase() || '';
      return gamblingKeywords.some(keyword => description.includes(keyword));
    },
    reason: 'Transaction involves gambling (Maysir), which is prohibited',
    reasonAr: 'المعاملة تتضمن قماراً (ميسر)، وهو محرم شرعاً'
  },
  {
    id: 'MAYSIR_002',
    name: 'Speculative derivatives',
    nameAr: 'مشتقات مالية مضاربية',
    category: 'maysir',
    severity: 'high',
    check: (tx) => {
      // Check for speculative financial instruments
      const speculativeTypes = ['option', 'future', 'swap', 'derivative'];
      const txType = tx.transactionType?.toLowerCase() || '';
      return speculativeTypes.some(type => txType.includes(type)) && !tx.isHedging;
    },
    reason: 'Speculative derivatives without hedging purpose are prohibited',
    reasonAr: 'المشتقات المالية المضاربية بدون غرض تحوط محرمة شرعاً'
  },
  
  // Haram Goods Detection
  {
    id: 'HARAM_001',
    name: 'Prohibited goods',
    nameAr: 'سلع محرمة',
    category: 'haram_goods',
    severity: 'critical',
    check: (tx) => {
      // Check for haram products
      const haramKeywords = ['alcohol', 'pork', 'wine', 'beer', 'tobacco', 'cigarette',
                            'خمر', 'خنزير', 'كحول', 'دخان', 'سجائر'];
      const description = tx.description?.toLowerCase() || '';
      const goods = tx.goods?.toLowerCase() || '';
      return haramKeywords.some(keyword => description.includes(keyword) || goods.includes(keyword));
    },
    reason: 'Transaction involves prohibited goods (alcohol, pork, etc.)',
    reasonAr: 'المعاملة تتضمن سلعاً محرمة (خمر، خنزير، إلخ)'
  }
];

export const kaiaRouter = router({
  // Check single transaction compliance
  checkCompliance: publicProcedure
    .input(z.object({
      transactionType: z.string(),
      amount: z.number(),
      description: z.string().optional(),
      interestRate: z.number().optional().default(0),
      interestAmount: z.number().optional().default(0),
      principalAmount: z.number().optional().default(0),
      deliveryDate: z.string().optional(),
      specifications: z.string().optional(),
      goodsStatus: z.string().optional(),
      goods: z.string().optional(),
      isIstisna: z.boolean().optional().default(false),
      isSalam: z.boolean().optional().default(false),
      isHedging: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      // Run all Sharia rules
      const violations: Array<{
        ruleId: string;
        ruleName: string;
        ruleNameAr: string;
        category: string;
        severity: string;
        reason: string;
        reasonAr: string;
      }> = [];

      for (const rule of SHARIA_RULES) {
        if (rule.check(input)) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleNameAr: rule.nameAr,
            category: rule.category,
            severity: rule.severity,
            reason: rule.reason,
            reasonAr: rule.reasonAr
          });
        }
      }

      // Determine compliance status
      const hasCriticalViolations = violations.some(v => v.severity === 'critical');
      const hasHighViolations = violations.some(v => v.severity === 'high');
      
      let status: 'halal' | 'haram' | 'makrooh' | 'mushbooh';
      let statusAr: string;
      
      if (hasCriticalViolations) {
        status = 'haram';
        statusAr = 'حرام';
      } else if (hasHighViolations) {
        status = 'mushbooh';
        statusAr = 'مشبوه';
      } else if (violations.length > 0) {
        status = 'makrooh';
        statusAr = 'مكروه';
      } else {
        status = 'halal';
        statusAr = 'حلال';
      }

      return {
        compliant: status === 'halal',
        status,
        statusAr,
        violations,
        violationCount: violations.length,
        complianceScore: Math.max(0, 100 - (violations.length * 15)),
        checkedAt: new Date().toISOString(),
        checkedBy: 'KAIA Engine v1.0'
      };
    }),

  // Get compliance statistics
  getComplianceStats: protectedProcedure
    .query(async () => {
      const db = await requireDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);

      // Get transaction stats (mock data for now - will be replaced with real data)
      // In production, this would query actual transactions table
      const totalTransactions = 1247;
      const halalTransactions = 1089;
      const haramTransactions = 98;
      const mushboohTransactions = 42;
      const makroohTransactions = 18;

      const complianceScore = (halalTransactions / totalTransactions) * 100;

      // Get violations breakdown
      const violationsByCategory = {
        riba: 67,
        gharar: 31,
        maysir: 18,
        haram_goods: 24
      };

      return {
        totalTransactions,
        halalTransactions,
        haramTransactions,
        mushboohTransactions,
        makroohTransactions,
        complianceScore: Math.round(complianceScore * 10) / 10,
        violationsByCategory,
        lastUpdated: new Date().toISOString()
      };
    }),

  // Get recent compliance checks
  getRecentChecks: protectedProcedure
    .input(z.object({
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      const db = await requireDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Mock data for now - will be replaced with real audit trail
      const recentChecks = [
        {
          id: 1,
          transactionId: 'TXN-2025-001',
          status: 'halal',
          statusAr: 'حلال',
          amount: 5000,
          description: 'Purchase of electronics',
          checkedAt: new Date().toISOString(),
          violationCount: 0
        },
        {
          id: 2,
          transactionId: 'TXN-2025-002',
          status: 'haram',
          statusAr: 'حرام',
          amount: 10000,
          description: 'Loan with 5% interest',
          checkedAt: new Date().toISOString(),
          violationCount: 1
        }
      ];

      return recentChecks.slice(0, input.limit);
    }),
});
