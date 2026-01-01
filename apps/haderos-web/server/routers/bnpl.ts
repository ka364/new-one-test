/**
 * 💳 BNPL (Buy Now Pay Later) Router
 * نظام اشتر الآن وادفع لاحقاً - tRPC Router
 *
 * Supported Providers:
 * - ValU (ڤاليو)
 * - Sympl (سيمبل)
 * - Souhoola (سهولة)
 * - Contact (كونتكت)
 *
 * Features:
 * - Calculate installments (حساب الأقساط)
 * - Submit applications (تقديم الطلبات)
 * - Track payments (تتبع المدفوعات)
 * - Manage installments (إدارة الأقساط)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../_core/trpc";
import { db } from "../db";
import { eq, and, gte, lte, desc, asc, sql, count, sum } from "drizzle-orm";
import {
  bnplProviders,
  bnplPlans,
  bnplApplications,
  bnplInstallments,
  bnplTransactions,
  bnplSettings,
} from "../../drizzle/schema-bnpl";

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateApplicationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BNPL-${timestamp}-${random}`;
}

function calculateInstallment(
  principal: number,
  annualRate: number,
  months: number,
  adminFee: number = 0
): {
  monthlyInstallment: number;
  totalInterest: number;
  totalAmount: number;
  adminFees: number;
} {
  const monthlyRate = annualRate / 100 / 12;
  let monthlyInstallment: number;
  let totalInterest: number;

  if (monthlyRate === 0) {
    // 0% فائدة
    monthlyInstallment = principal / months;
    totalInterest = 0;
  } else {
    // حساب القسط بطريقة PMT
    monthlyInstallment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    totalInterest = monthlyInstallment * months - principal;
  }

  const adminFees = adminFee;
  const totalAmount = principal + totalInterest + adminFees;

  return {
    monthlyInstallment: Math.ceil(monthlyInstallment * 100) / 100,
    totalInterest: Math.ceil(totalInterest * 100) / 100,
    totalAmount: Math.ceil(totalAmount * 100) / 100,
    adminFees,
  };
}

// ============================================
// INPUT SCHEMAS
// ============================================

const calculateInstallmentsSchema = z.object({
  amount: z.number().positive(),
  providerId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
});

const createApplicationSchema = z.object({
  providerId: z.string().uuid(),
  planId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),

  // بيانات العميل
  customerName: z.string().min(3),
  customerNameAr: z.string().optional(),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  nationalId: z.string().min(14).max(14),
  dateOfBirth: z.string().optional(),

  // العنوان
  governorate: z.string(),
  city: z.string(),
  address: z.string(),

  // بيانات العمل
  employmentType: z.enum(["employed", "self_employed", "business_owner"]),
  employerName: z.string().optional(),
  monthlyIncome: z.number().positive(),
  workPhone: z.string().optional(),

  // المبلغ
  principalAmount: z.number().positive(),
  downPayment: z.number().min(0).optional(),
});

const verifyOtpSchema = z.object({
  applicationId: z.string().uuid(),
  otp: z.string().length(6),
});

const payInstallmentSchema = z.object({
  installmentId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["card", "bank_transfer", "instapay", "vodafone_cash"]),
  paymentReference: z.string().optional(),
});

// ============================================
// ROUTER
// ============================================

export const bnplRouter = router({
  // ============================================
  // PROVIDERS & PLANS
  // ============================================

  /**
   * الحصول على المزودين المتاحين
   */
  getProviders: publicProcedure
    .input(z.object({
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.isActive !== undefined) {
        conditions.push(eq(bnplProviders.isActive, input.isActive));
      }

      const providers = await db
        .select()
        .from(bnplProviders)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(bnplProviders.name));

      return providers;
    }),

  /**
   * الحصول على خطط التقسيط
   */
  getPlans: publicProcedure
    .input(z.object({
      providerId: z.string().uuid().optional(),
      isActive: z.boolean().optional(),
      zeroInterest: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.providerId) {
        conditions.push(eq(bnplPlans.providerId, input.providerId));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(bnplPlans.isActive, input.isActive));
      }
      if (input?.zeroInterest !== undefined) {
        conditions.push(eq(bnplPlans.zeroInterest, input.zeroInterest));
      }

      const plans = await db
        .select()
        .from(bnplPlans)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(bnplPlans.tenureMonths));

      return plans;
    }),

  // ============================================
  // INSTALLMENT CALCULATION
  // ============================================

  /**
   * حساب الأقساط لجميع المزودين
   */
  calculateInstallments: publicProcedure
    .input(calculateInstallmentsSchema)
    .query(async ({ input }) => {
      // الحصول على جميع الخطط النشطة
      const conditions = [eq(bnplPlans.isActive, true)];

      if (input.providerId) {
        conditions.push(eq(bnplPlans.providerId, input.providerId));
      }
      if (input.planId) {
        conditions.push(eq(bnplPlans.id, input.planId));
      }

      const plans = await db
        .select({
          plan: bnplPlans,
          provider: bnplProviders,
        })
        .from(bnplPlans)
        .innerJoin(bnplProviders, eq(bnplPlans.providerId, bnplProviders.id))
        .where(and(...conditions));

      // حساب الأقساط لكل خطة
      const results = plans
        .filter(({ plan, provider }) => {
          const minAmount = Number(plan.minAmount || provider.minAmount || 0);
          const maxAmount = Number(plan.maxAmount || provider.maxAmount || Infinity);
          return input.amount >= minAmount && input.amount <= maxAmount;
        })
        .map(({ plan, provider }) => {
          const adminFee = Number(plan.adminFee || 0) +
            (Number(plan.adminFeePercent || 0) / 100 * input.amount);

          const calculation = calculateInstallment(
            input.amount,
            Number(plan.interestRate),
            plan.tenureMonths,
            adminFee
          );

          return {
            providerId: provider.id,
            providerName: provider.name,
            providerNameAr: provider.nameAr,
            providerLogo: provider.logoUrl,
            planId: plan.id,
            planName: plan.name,
            planNameAr: plan.nameAr,
            tenureMonths: plan.tenureMonths,
            interestRate: Number(plan.interestRate),
            zeroInterest: plan.zeroInterest,
            isPromotional: plan.isPromotional,
            principalAmount: input.amount,
            ...calculation,
          };
        })
        .sort((a, b) => a.monthlyInstallment - b.monthlyInstallment);

      return {
        amount: input.amount,
        plans: results,
        cheapestPlan: results[0] || null,
        lowestMonthly: results.length > 0 ? Math.min(...results.map(r => r.monthlyInstallment)) : 0,
      };
    }),

  /**
   * الحصول على أقل قسط شهري (للعرض على المنتج)
   */
  getLowestMonthlyPayment: publicProcedure
    .input(z.object({
      amount: z.number().positive(),
    }))
    .query(async ({ input }) => {
      const plans = await db
        .select()
        .from(bnplPlans)
        .innerJoin(bnplProviders, eq(bnplPlans.providerId, bnplProviders.id))
        .where(and(
          eq(bnplPlans.isActive, true),
          eq(bnplProviders.isActive, true)
        ));

      if (plans.length === 0) {
        return null;
      }

      let lowestMonthly = Infinity;
      let bestPlan = null;

      for (const { bnpl_plans: plan, bnpl_providers: provider } of plans) {
        const minAmount = Number(plan.minAmount || provider.minAmount || 0);
        const maxAmount = Number(plan.maxAmount || provider.maxAmount || Infinity);

        if (input.amount < minAmount || input.amount > maxAmount) {
          continue;
        }

        const calculation = calculateInstallment(
          input.amount,
          Number(plan.interestRate),
          plan.tenureMonths,
          Number(plan.adminFee || 0)
        );

        if (calculation.monthlyInstallment < lowestMonthly) {
          lowestMonthly = calculation.monthlyInstallment;
          bestPlan = {
            providerName: provider.name,
            providerNameAr: provider.nameAr,
            providerLogo: provider.logoUrl,
            tenureMonths: plan.tenureMonths,
            monthlyInstallment: calculation.monthlyInstallment,
            zeroInterest: plan.zeroInterest,
          };
        }
      }

      return bestPlan;
    }),

  // ============================================
  // APPLICATION MANAGEMENT
  // ============================================

  /**
   * إنشاء طلب تقسيط
   */
  createApplication: publicProcedure
    .input(createApplicationSchema)
    .mutation(async ({ input }) => {
      // التحقق من المزود والخطة
      const [plan] = await db
        .select()
        .from(bnplPlans)
        .where(and(
          eq(bnplPlans.id, input.planId),
          eq(bnplPlans.providerId, input.providerId),
          eq(bnplPlans.isActive, true)
        ));

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "خطة التقسيط غير موجودة أو غير نشطة",
        });
      }

      // حساب التفاصيل
      const downPayment = input.downPayment || 0;
      const financedAmount = input.principalAmount - downPayment;

      const calculation = calculateInstallment(
        financedAmount,
        Number(plan.interestRate),
        plan.tenureMonths,
        Number(plan.adminFee || 0)
      );

      // إنشاء الطلب
      const applicationNumber = generateApplicationNumber();

      const [application] = await db.insert(bnplApplications).values({
        applicationNumber,
        providerId: input.providerId,
        planId: input.planId,
        customerId: input.customerId,
        orderId: input.orderId,

        customerName: input.customerName,
        customerNameAr: input.customerNameAr,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        nationalId: input.nationalId,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,

        governorate: input.governorate,
        city: input.city,
        address: input.address,

        employmentType: input.employmentType,
        employerName: input.employerName,
        monthlyIncome: input.monthlyIncome.toString(),
        workPhone: input.workPhone,

        principalAmount: input.principalAmount.toString(),
        interestAmount: calculation.totalInterest.toString(),
        adminFees: calculation.adminFees.toString(),
        totalAmount: calculation.totalAmount.toString(),
        downPayment: downPayment.toString(),
        financedAmount: financedAmount.toString(),
        monthlyInstallment: calculation.monthlyInstallment.toString(),
        tenureMonths: plan.tenureMonths,
        remainingInstallments: plan.tenureMonths,
        remainingAmount: calculation.totalAmount.toString(),

        status: "pending",
      }).returning();

      // إنشاء OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await db
        .update(bnplApplications)
        .set({
          otp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 دقائق
        })
        .where(eq(bnplApplications.id, application.id));

      // في الإنتاج، أرسل OTP عبر SMS

      return {
        success: true,
        message: "تم إنشاء الطلب بنجاح، يرجى التحقق من رقم الهاتف",
        application: {
          id: application.id,
          applicationNumber,
          monthlyInstallment: calculation.monthlyInstallment,
          totalAmount: calculation.totalAmount,
          tenureMonths: plan.tenureMonths,
        },
      };
    }),

  /**
   * التحقق من OTP
   */
  verifyOtp: publicProcedure
    .input(verifyOtpSchema)
    .mutation(async ({ input }) => {
      const [application] = await db
        .select()
        .from(bnplApplications)
        .where(eq(bnplApplications.id, input.applicationId));

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الطلب غير موجود",
        });
      }

      if (application.otpVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "تم التحقق من هذا الطلب مسبقاً",
        });
      }

      if (!application.otp || application.otp !== input.otp) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "رمز التحقق غير صحيح",
        });
      }

      if (application.otpExpiresAt && new Date() > application.otpExpiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "رمز التحقق منتهي الصلاحية",
        });
      }

      await db
        .update(bnplApplications)
        .set({
          otpVerified: true,
          status: "submitted",
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bnplApplications.id, input.applicationId));

      return {
        success: true,
        message: "تم التحقق بنجاح، جاري مراجعة الطلب",
      };
    }),

  /**
   * إعادة إرسال OTP
   */
  resendOtp: publicProcedure
    .input(z.object({
      applicationId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const [application] = await db
        .select()
        .from(bnplApplications)
        .where(eq(bnplApplications.id, input.applicationId));

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الطلب غير موجود",
        });
      }

      if (application.otpVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "تم التحقق من هذا الطلب مسبقاً",
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await db
        .update(bnplApplications)
        .set({
          otp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        })
        .where(eq(bnplApplications.id, input.applicationId));

      // في الإنتاج، أرسل OTP عبر SMS

      return {
        success: true,
        message: "تم إرسال رمز تحقق جديد",
      };
    }),

  /**
   * الحصول على طلب تقسيط
   */
  getApplication: publicProcedure
    .input(z.object({
      applicationId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const [application] = await db
        .select()
        .from(bnplApplications)
        .where(eq(bnplApplications.id, input.applicationId));

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الطلب غير موجود",
        });
      }

      const installments = await db
        .select()
        .from(bnplInstallments)
        .where(eq(bnplInstallments.applicationId, input.applicationId))
        .orderBy(asc(bnplInstallments.installmentNumber));

      return {
        ...application,
        installments,
      };
    }),

  /**
   * الحصول على طلبات العميل
   */
  getCustomerApplications: publicProcedure
    .input(z.object({
      customerId: z.string().uuid().optional(),
      phoneNumber: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      if (!input.customerId && !input.phoneNumber) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "يجب تحديد معرف العميل أو رقم الهاتف",
        });
      }

      const conditions = [];

      if (input.customerId) {
        conditions.push(eq(bnplApplications.customerId, input.customerId));
      }
      if (input.phoneNumber) {
        conditions.push(eq(bnplApplications.customerPhone, input.phoneNumber));
      }
      if (input.status) {
        conditions.push(eq(bnplApplications.status, input.status as any));
      }

      const applications = await db
        .select()
        .from(bnplApplications)
        .where(and(...conditions))
        .orderBy(desc(bnplApplications.createdAt));

      return applications;
    }),

  // ============================================
  // INSTALLMENT MANAGEMENT
  // ============================================

  /**
   * الحصول على الأقساط
   */
  getInstallments: publicProcedure
    .input(z.object({
      applicationId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const installments = await db
        .select()
        .from(bnplInstallments)
        .where(eq(bnplInstallments.applicationId, input.applicationId))
        .orderBy(asc(bnplInstallments.installmentNumber));

      return installments;
    }),

  /**
   * دفع قسط
   */
  payInstallment: publicProcedure
    .input(payInstallmentSchema)
    .mutation(async ({ input }) => {
      const [installment] = await db
        .select()
        .from(bnplInstallments)
        .where(eq(bnplInstallments.id, input.installmentId));

      if (!installment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "القسط غير موجود",
        });
      }

      if (installment.status === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "تم دفع هذا القسط مسبقاً",
        });
      }

      const remainingAmount = Number(installment.remainingAmount || installment.totalAmount);

      if (input.amount > remainingAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "المبلغ المدفوع أكبر من المتبقي",
        });
      }

      const newPaidAmount = Number(installment.paidAmount || 0) + input.amount;
      const newRemainingAmount = remainingAmount - input.amount;
      const isFullyPaid = newRemainingAmount <= 0;

      // تحديث القسط
      await db
        .update(bnplInstallments)
        .set({
          paidAmount: newPaidAmount.toString(),
          remainingAmount: newRemainingAmount.toString(),
          status: isFullyPaid ? "paid" : "partially_paid",
          paidDate: isFullyPaid ? new Date() : null,
          paymentMethod: input.paymentMethod,
          paymentReference: input.paymentReference,
          updatedAt: new Date(),
        })
        .where(eq(bnplInstallments.id, input.installmentId));

      // إنشاء معاملة
      await db.insert(bnplTransactions).values({
        applicationId: installment.applicationId,
        installmentId: input.installmentId,
        type: "payment",
        amount: input.amount.toString(),
        status: "completed",
        paymentMethod: input.paymentMethod,
        reference: input.paymentReference,
        processedAt: new Date(),
      });

      // تحديث الطلب
      const [application] = await db
        .select()
        .from(bnplApplications)
        .where(eq(bnplApplications.id, installment.applicationId));

      const newPaidApplicationAmount = Number(application.paidAmount || 0) + input.amount;
      const newRemainingApplicationAmount = Number(application.remainingAmount || 0) - input.amount;
      const newPaidInstallments = isFullyPaid
        ? (application.paidInstallments || 0) + 1
        : application.paidInstallments || 0;
      const newRemainingInstallments = isFullyPaid
        ? (application.remainingInstallments || 0) - 1
        : application.remainingInstallments || 0;

      await db
        .update(bnplApplications)
        .set({
          paidAmount: newPaidApplicationAmount.toString(),
          remainingAmount: newRemainingApplicationAmount.toString(),
          paidInstallments: newPaidInstallments,
          remainingInstallments: newRemainingInstallments,
          status: newRemainingInstallments === 0 ? "completed" : "active",
          completedAt: newRemainingInstallments === 0 ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(bnplApplications.id, installment.applicationId));

      return {
        success: true,
        message: isFullyPaid ? "تم دفع القسط بالكامل" : "تم تسجيل الدفعة الجزئية",
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
      };
    }),

  // ============================================
  // ADMIN & ANALYTICS
  // ============================================

  /**
   * الموافقة على طلب (للإدارة)
   */
  approveApplication: publicProcedure
    .input(z.object({
      applicationId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const [application] = await db
        .select()
        .from(bnplApplications)
        .where(eq(bnplApplications.id, input.applicationId));

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الطلب غير موجود",
        });
      }

      if (application.status !== "submitted" && application.status !== "under_review") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "لا يمكن الموافقة على هذا الطلب",
        });
      }

      // حساب تواريخ الأقساط
      const now = new Date();
      const firstDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5);

      await db
        .update(bnplApplications)
        .set({
          status: "active",
          approvedAt: now,
          activatedAt: now,
          firstDueDate,
          lastDueDate: new Date(firstDueDate.getFullYear(), firstDueDate.getMonth() + application.tenureMonths - 1, 5),
          updatedAt: now,
        })
        .where(eq(bnplApplications.id, input.applicationId));

      // إنشاء الأقساط
      const monthlyInstallment = Number(application.monthlyInstallment);
      const principalPerMonth = Number(application.financedAmount) / application.tenureMonths;
      const interestPerMonth = Number(application.interestAmount) / application.tenureMonths;

      for (let i = 0; i < application.tenureMonths; i++) {
        const dueDate = new Date(firstDueDate.getFullYear(), firstDueDate.getMonth() + i, 5);

        await db.insert(bnplInstallments).values({
          applicationId: input.applicationId,
          installmentNumber: i + 1,
          principalAmount: principalPerMonth.toString(),
          interestAmount: interestPerMonth.toString(),
          totalAmount: monthlyInstallment.toString(),
          remainingAmount: monthlyInstallment.toString(),
          dueDate,
          gracePeriodEndsAt: new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 أيام
          status: i === 0 ? "due" : "pending",
        });
      }

      return {
        success: true,
        message: "تمت الموافقة على الطلب وإنشاء جدول الأقساط",
      };
    }),

  /**
   * رفض طلب (للإدارة)
   */
  rejectApplication: publicProcedure
    .input(z.object({
      applicationId: z.string().uuid(),
      reason: z.string(),
      code: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(bnplApplications)
        .set({
          status: "rejected",
          rejectedAt: new Date(),
          rejectionReason: input.reason,
          rejectionCode: input.code,
          updatedAt: new Date(),
        })
        .where(eq(bnplApplications.id, input.applicationId));

      return {
        success: true,
        message: "تم رفض الطلب",
      };
    }),

  /**
   * إحصائيات BNPL
   */
  getAnalytics: publicProcedure
    .input(z.object({
      dateFrom: z.string(),
      dateTo: z.string(),
      providerId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      const startDate = new Date(input.dateFrom);
      const endDate = new Date(input.dateTo);

      const conditions = [
        gte(bnplApplications.createdAt, startDate),
        lte(bnplApplications.createdAt, endDate),
      ];

      if (input.providerId) {
        conditions.push(eq(bnplApplications.providerId, input.providerId));
      }

      const [stats] = await db
        .select({
          totalApplications: count(),
          approvedApplications: sql<number>`COUNT(*) FILTER (WHERE ${bnplApplications.status} IN ('approved', 'active', 'completed'))`,
          rejectedApplications: sql<number>`COUNT(*) FILTER (WHERE ${bnplApplications.status} = 'rejected')`,
          pendingApplications: sql<number>`COUNT(*) FILTER (WHERE ${bnplApplications.status} IN ('pending', 'submitted', 'under_review'))`,
          totalFinancedAmount: sql<number>`COALESCE(SUM(${bnplApplications.financedAmount}::numeric) FILTER (WHERE ${bnplApplications.status} IN ('active', 'completed')), 0)`,
          totalCollectedAmount: sql<number>`COALESCE(SUM(${bnplApplications.paidAmount}::numeric), 0)`,
          activeLoans: sql<number>`COUNT(*) FILTER (WHERE ${bnplApplications.status} = 'active')`,
          completedLoans: sql<number>`COUNT(*) FILTER (WHERE ${bnplApplications.status} = 'completed')`,
          defaultedLoans: sql<number>`COUNT(*) FILTER (WHERE ${bnplApplications.status} = 'defaulted')`,
        })
        .from(bnplApplications)
        .where(and(...conditions));

      const approvalRate = stats.totalApplications > 0
        ? ((Number(stats.approvedApplications) / Number(stats.totalApplications)) * 100).toFixed(1)
        : "0";

      return {
        applications: {
          total: Number(stats.totalApplications),
          approved: Number(stats.approvedApplications),
          rejected: Number(stats.rejectedApplications),
          pending: Number(stats.pendingApplications),
          approvalRate,
        },
        financials: {
          totalFinanced: Number(stats.totalFinancedAmount),
          totalCollected: Number(stats.totalCollectedAmount),
          collectionRate: stats.totalFinancedAmount > 0
            ? ((Number(stats.totalCollectedAmount) / Number(stats.totalFinancedAmount)) * 100).toFixed(1)
            : "0",
        },
        loans: {
          active: Number(stats.activeLoans),
          completed: Number(stats.completedLoans),
          defaulted: Number(stats.defaultedLoans),
        },
      };
    }),
});

export type BnplRouter = typeof bnplRouter;
