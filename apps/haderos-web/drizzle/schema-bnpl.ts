/**
 * 💳 BNPL (Buy Now Pay Later) Schema
 * نظام اشتر الآن وادفع لاحقاً - قاعدة البيانات
 *
 * Supported Providers:
 * - ValU (ڤاليو)
 * - Sympl (سيمبل)
 * - Souhoola (سهولة)
 * - Contact (كونتكت)
 * - Kashier (كاشير)
 *
 * Tables:
 * - bnpl_providers: مزودي خدمة التقسيط
 * - bnpl_plans: خطط التقسيط
 * - bnpl_applications: طلبات التقسيط
 * - bnpl_installments: الأقساط
 * - bnpl_transactions: المعاملات
 */

import { pgTable, text, timestamp, integer, boolean, decimal, jsonb, uuid, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const bnplProviderEnum = pgEnum("bnpl_provider", [
  "valu",      // ڤاليو
  "sympl",     // سيمبل
  "souhoola",  // سهولة
  "contact",   // كونتكت
  "kashier",   // كاشير
  "aman",      // أمان
  "premium"    // بريميم
]);

export const bnplApplicationStatusEnum = pgEnum("bnpl_application_status", [
  "pending",           // في الانتظار
  "submitted",         // تم التقديم
  "under_review",      // قيد المراجعة
  "approved",          // موافق عليه
  "rejected",          // مرفوض
  "cancelled",         // ملغي
  "expired",           // منتهي الصلاحية
  "active",            // نشط (يسدد)
  "completed",         // مكتمل
  "defaulted"          // متعثر
]);

export const bnplInstallmentStatusEnum = pgEnum("bnpl_installment_status", [
  "pending",      // في الانتظار
  "due",          // مستحق
  "paid",         // مدفوع
  "overdue",      // متأخر
  "partially_paid",// مدفوع جزئياً
  "waived"        // معفى
]);

// ============================================
// TABLES
// ============================================

/**
 * مزودي خدمة التقسيط
 */
export const bnplProviders = pgTable("bnpl_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  code: bnplProviderEnum("code").notNull().unique(),
  logoUrl: text("logo_url"),
  description: text("description"),
  descriptionAr: text("description_ar"),

  // الحدود
  minAmount: decimal("min_amount", { precision: 12, scale: 2 }).default("500"),
  maxAmount: decimal("max_amount", { precision: 12, scale: 2 }).default("100000"),
  minTenure: integer("min_tenure").default(3), // أشهر
  maxTenure: integer("max_tenure").default(60), // أشهر

  // الرسوم
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }), // نسبة الفائدة السنوية
  adminFee: decimal("admin_fee", { precision: 12, scale: 2 }).default("0"),
  adminFeePercent: decimal("admin_fee_percent", { precision: 5, scale: 2 }),
  lateFee: decimal("late_fee", { precision: 12, scale: 2 }),
  lateFeePercent: decimal("late_fee_percent", { precision: 5, scale: 2 }),

  // التكامل
  apiBaseUrl: text("api_base_url"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  merchantId: text("merchant_id"),
  webhookSecret: text("webhook_secret"),

  // الإعدادات
  isActive: boolean("is_active").default(true),
  supportedCategories: jsonb("supported_categories").$type<string[]>(),
  requiredDocuments: jsonb("required_documents").$type<string[]>(),
  eligibilityCriteria: jsonb("eligibility_criteria").$type<{
    minAge: number;
    maxAge: number;
    minIncome?: number;
    employmentTypes?: string[];
    requiredNationalId: boolean;
  }>(),

  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * خطط التقسيط
 */
export const bnplPlans = pgTable("bnpl_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id").references(() => bnplProviders.id).notNull(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  description: text("description"),

  // المدة
  tenureMonths: integer("tenure_months").notNull(),

  // التكلفة
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(), // سنوي
  monthlyRate: decimal("monthly_rate", { precision: 5, scale: 2 }), // شهري
  adminFee: decimal("admin_fee", { precision: 12, scale: 2 }).default("0"),
  adminFeePercent: decimal("admin_fee_percent", { precision: 5, scale: 2 }),

  // الحدود
  minAmount: decimal("min_amount", { precision: 12, scale: 2 }),
  maxAmount: decimal("max_amount", { precision: 12, scale: 2 }),

  // العروض
  isPromotional: boolean("is_promotional").default(false),
  promotionalEndDate: timestamp("promotional_end_date"),
  zeroInterest: boolean("zero_interest").default(false), // 0% فائدة

  // الحالة
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),

  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * طلبات التقسيط
 */
export const bnplApplications = pgTable("bnpl_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationNumber: text("application_number").notNull().unique(),
  providerId: uuid("provider_id").references(() => bnplProviders.id).notNull(),
  planId: uuid("plan_id").references(() => bnplPlans.id).notNull(),
  customerId: uuid("customer_id"),
  orderId: uuid("order_id"),

  // بيانات العميل
  customerName: text("customer_name").notNull(),
  customerNameAr: text("customer_name_ar"),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  nationalId: text("national_id"),
  dateOfBirth: timestamp("date_of_birth"),

  // العنوان
  governorate: text("governorate"),
  city: text("city"),
  address: text("address"),

  // بيانات العمل
  employmentType: text("employment_type"), // employed, self_employed, business_owner
  employerName: text("employer_name"),
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  workPhone: text("work_phone"),

  // تفاصيل التقسيط
  principalAmount: decimal("principal_amount", { precision: 12, scale: 2 }).notNull(),
  interestAmount: decimal("interest_amount", { precision: 12, scale: 2 }).default("0"),
  adminFees: decimal("admin_fees", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  downPayment: decimal("down_payment", { precision: 12, scale: 2 }).default("0"),
  financedAmount: decimal("financed_amount", { precision: 12, scale: 2 }).notNull(),
  monthlyInstallment: decimal("monthly_installment", { precision: 12, scale: 2 }).notNull(),
  tenureMonths: integer("tenure_months").notNull(),

  // الحالة
  status: bnplApplicationStatusEnum("status").default("pending"),
  providerApplicationId: text("provider_application_id"), // معرف الطلب لدى المزود

  // التواريخ
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  activatedAt: timestamp("activated_at"),
  completedAt: timestamp("completed_at"),
  firstDueDate: timestamp("first_due_date"),
  lastDueDate: timestamp("last_due_date"),

  // الرفض
  rejectionReason: text("rejection_reason"),
  rejectionCode: text("rejection_code"),

  // الوثائق
  documents: jsonb("documents").$type<{
    type: string;
    url: string;
    uploadedAt: string;
    verified: boolean;
  }[]>(),

  // التحقق
  otp: text("otp"),
  otpExpiresAt: timestamp("otp_expires_at"),
  otpVerified: boolean("otp_verified").default(false),
  contractSigned: boolean("contract_signed").default(false),
  contractSignedAt: timestamp("contract_signed_at"),
  contractUrl: text("contract_url"),

  // الإحصائيات
  paidInstallments: integer("paid_installments").default(0),
  remainingInstallments: integer("remaining_installments"),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 2 }),
  overdueAmount: decimal("overdue_amount", { precision: 12, scale: 2 }).default("0"),

  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * الأقساط
 */
export const bnplInstallments = pgTable("bnpl_installments", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => bnplApplications.id).notNull(),
  installmentNumber: integer("installment_number").notNull(),

  // المبلغ
  principalAmount: decimal("principal_amount", { precision: 12, scale: 2 }).notNull(),
  interestAmount: decimal("interest_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 2 }),
  lateFees: decimal("late_fees", { precision: 12, scale: 2 }).default("0"),

  // التواريخ
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  gracePeriodEndsAt: timestamp("grace_period_ends_at"),

  // الحالة
  status: bnplInstallmentStatusEnum("status").default("pending"),
  daysOverdue: integer("days_overdue").default(0),

  // طريقة الدفع
  paymentMethod: text("payment_method"),
  paymentReference: text("payment_reference"),
  transactionId: uuid("transaction_id"),

  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * معاملات BNPL
 */
export const bnplTransactions = pgTable("bnpl_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => bnplApplications.id).notNull(),
  installmentId: uuid("installment_id").references(() => bnplInstallments.id),
  type: text("type").notNull(), // payment, refund, late_fee, adjustment
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, completed, failed, reversed
  paymentMethod: text("payment_method"),
  providerTransactionId: text("provider_transaction_id"),
  reference: text("reference"),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * إعدادات BNPL للمتجر
 */
export const bnplSettings = pgTable("bnpl_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id").references(() => bnplProviders.id).notNull(),

  // الإعدادات
  isEnabled: boolean("is_enabled").default(false),
  displayOrder: integer("display_order").default(0),
  showOnCheckout: boolean("show_on_checkout").default(true),
  showOnProductPage: boolean("show_on_product_page").default(true),

  // الحدود المخصصة
  minOrderAmount: decimal("min_order_amount", { precision: 12, scale: 2 }),
  maxOrderAmount: decimal("max_order_amount", { precision: 12, scale: 2 }),
  allowedCategories: jsonb("allowed_categories").$type<string[]>(),
  excludedCategories: jsonb("excluded_categories").$type<string[]>(),
  allowedProducts: jsonb("allowed_products").$type<string[]>(),
  excludedProducts: jsonb("excluded_products").$type<string[]>(),

  // التخصيص
  customBadgeText: text("custom_badge_text"),
  customBadgeTextAr: text("custom_badge_text_ar"),
  customDescription: text("custom_description"),
  customDescriptionAr: text("custom_description_ar"),

  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const bnplProvidersRelations = relations(bnplProviders, ({ many }) => ({
  plans: many(bnplPlans),
  applications: many(bnplApplications),
  settings: many(bnplSettings),
}));

export const bnplPlansRelations = relations(bnplPlans, ({ one, many }) => ({
  provider: one(bnplProviders, {
    fields: [bnplPlans.providerId],
    references: [bnplProviders.id],
  }),
  applications: many(bnplApplications),
}));

export const bnplApplicationsRelations = relations(bnplApplications, ({ one, many }) => ({
  provider: one(bnplProviders, {
    fields: [bnplApplications.providerId],
    references: [bnplProviders.id],
  }),
  plan: one(bnplPlans, {
    fields: [bnplApplications.planId],
    references: [bnplPlans.id],
  }),
  installments: many(bnplInstallments),
  transactions: many(bnplTransactions),
}));

export const bnplInstallmentsRelations = relations(bnplInstallments, ({ one, many }) => ({
  application: one(bnplApplications, {
    fields: [bnplInstallments.applicationId],
    references: [bnplApplications.id],
  }),
  transactions: many(bnplTransactions),
}));

// ============================================
// TYPES
// ============================================

export type BnplProvider = typeof bnplProviders.$inferSelect;
export type NewBnplProvider = typeof bnplProviders.$inferInsert;

export type BnplPlan = typeof bnplPlans.$inferSelect;
export type NewBnplPlan = typeof bnplPlans.$inferInsert;

export type BnplApplication = typeof bnplApplications.$inferSelect;
export type NewBnplApplication = typeof bnplApplications.$inferInsert;

export type BnplInstallment = typeof bnplInstallments.$inferSelect;
export type NewBnplInstallment = typeof bnplInstallments.$inferInsert;

export type BnplTransaction = typeof bnplTransactions.$inferSelect;
export type NewBnplTransaction = typeof bnplTransactions.$inferInsert;

export type BnplSettings = typeof bnplSettings.$inferSelect;
export type NewBnplSettings = typeof bnplSettings.$inferInsert;
