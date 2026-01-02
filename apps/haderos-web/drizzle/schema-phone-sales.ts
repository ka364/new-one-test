/**
 * 📞 Phone Sales System Schema
 * نظام المبيعات الهاتفية - قاعدة البيانات
 *
 * Tables:
 * - call_center_agents: وكلاء مركز الاتصال
 * - phone_calls: سجل المكالمات
 * - call_recordings: تسجيلات المكالمات
 * - leads: العملاء المحتملين
 * - lead_activities: أنشطة العملاء المحتملين
 * - sales_pipelines: مراحل البيع
 * - follow_ups: المتابعات المجدولة
 * - call_scripts: سكريبتات المكالمات
 * - sales_targets: أهداف المبيعات
 * - agent_performance: أداء الوكلاء
 * - dial_lists: قوائم الاتصال
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  jsonb,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const agentStatusEnum = pgEnum('agent_status', [
  'available', // متاح
  'on_call', // في مكالمة
  'break', // استراحة
  'offline', // غير متصل
  'after_call_work', // عمل ما بعد المكالمة
]);

export const callDirectionEnum = pgEnum('call_direction', [
  'inbound', // واردة
  'outbound', // صادرة
]);

export const callStatusEnum = pgEnum('call_status', [
  'queued', // في الانتظار
  'ringing', // يرن
  'in_progress', // جاري
  'completed', // مكتمل
  'missed', // فائت
  'voicemail', // بريد صوتي
  'failed', // فشل
]);

export const callOutcomeEnum = pgEnum('call_outcome', [
  'sale', // بيع
  'appointment', // موعد
  'callback_requested', // طلب معاودة الاتصال
  'not_interested', // غير مهتم
  'no_answer', // لا رد
  'busy', // مشغول
  'wrong_number', // رقم خاطئ
  'voicemail', // بريد صوتي
  'do_not_call', // لا تتصل
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new', // جديد
  'contacted', // تم التواصل
  'qualified', // مؤهل
  'proposal', // عرض سعر
  'negotiation', // تفاوض
  'won', // فاز
  'lost', // خسر
  'dormant', // خامل
]);

export const leadSourceEnum = pgEnum('lead_source', [
  'website', // الموقع
  'social_media', // وسائل التواصل
  'referral', // إحالة
  'cold_call', // مكالمة باردة
  'advertisement', // إعلان
  'trade_show', // معرض
  'partner', // شريك
  'other', // أخرى
]);

export const leadPriorityEnum = pgEnum('lead_priority', [
  'hot', // ساخن
  'warm', // دافئ
  'cold', // بارد
]);

export const followUpTypeEnum = pgEnum('follow_up_type', [
  'call', // مكالمة
  'email', // بريد إلكتروني
  'whatsapp', // واتساب
  'meeting', // اجتماع
  'site_visit', // زيارة ميدانية
]);

// ============================================
// TABLES
// ============================================

/**
 * وكلاء مركز الاتصال
 */
export const callCenterAgents = pgTable('call_center_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id'), // ربط بجدول الموظفين
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  extension: text('extension'), // رقم التحويلة
  status: agentStatusEnum('status').default('offline'),
  skills: jsonb('skills').$type<string[]>().default([]), // المهارات
  languages: jsonb('languages').$type<string[]>().default(['ar']), // اللغات
  maxConcurrentCalls: integer('max_concurrent_calls').default(1),
  isTeamLead: boolean('is_team_lead').default(false),
  teamId: uuid('team_id'),
  dailyTarget: integer('daily_target').default(50), // عدد المكالمات اليومية
  monthlyTarget: decimal('monthly_target', { precision: 12, scale: 2 }).default('50000'), // هدف المبيعات الشهري
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('5'), // نسبة العمولة
  workingHoursStart: text('working_hours_start').default('09:00'),
  workingHoursEnd: text('working_hours_end').default('17:00'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * سجل المكالمات
 */
export const phoneCalls = pgTable('phone_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  callSid: text('call_sid').unique(), // معرف Twilio/provider
  agentId: uuid('agent_id').references(() => callCenterAgents.id),
  leadId: uuid('lead_id').references(() => leads.id),
  customerId: uuid('customer_id'),
  orderId: uuid('order_id'),

  // تفاصيل المكالمة
  direction: callDirectionEnum('direction').notNull(),
  status: callStatusEnum('status').default('queued'),
  callerNumber: text('caller_number').notNull(),
  calledNumber: text('called_number').notNull(),

  // الأوقات
  queuedAt: timestamp('queued_at'),
  ringingAt: timestamp('ringing_at'),
  answeredAt: timestamp('answered_at'),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // بالثواني

  // النتيجة
  outcome: callOutcomeEnum('outcome'),
  notes: text('notes'),
  rating: integer('rating'), // تقييم المكالمة 1-5

  // البيانات الإضافية
  recordingUrl: text('recording_url'),
  transcription: text('transcription'),
  sentiment: text('sentiment'), // positive, negative, neutral
  keyPhrases: jsonb('key_phrases').$type<string[]>(),

  // المنتجات المذكورة
  mentionedProducts: jsonb('mentioned_products').$type<string[]>(),
  quotedAmount: decimal('quoted_amount', { precision: 12, scale: 2 }),

  // التحويل
  wasTransferred: boolean('was_transferred').default(false),
  transferredFrom: uuid('transferred_from'),
  transferredTo: uuid('transferred_to'),

  // البيانات التقنية
  callQualityScore: integer('call_quality_score'), // 0-100
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * تسجيلات المكالمات
 */
export const callRecordings = pgTable('call_recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id')
    .references(() => phoneCalls.id)
    .notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'), // bytes
  duration: integer('duration'), // seconds
  format: text('format').default('mp3'),
  isTranscribed: boolean('is_transcribed').default(false),
  transcription: text('transcription'),
  transcriptionConfidence: decimal('transcription_confidence', { precision: 5, scale: 2 }),
  language: text('language').default('ar'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * العملاء المحتملين (Leads)
 */
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  // البيانات الأساسية
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  fullNameAr: text('full_name_ar'),
  email: text('email'),
  phone: text('phone').notNull(),
  alternatePhone: text('alternate_phone'),
  whatsappNumber: text('whatsapp_number'),

  // العنوان
  city: text('city'),
  governorate: text('governorate'),
  address: text('address'),

  // الشركة (B2B)
  companyName: text('company_name'),
  jobTitle: text('job_title'),
  industry: text('industry'),
  companySize: text('company_size'),

  // حالة الـ Lead
  status: leadStatusEnum('status').default('new'),
  priority: leadPriorityEnum('priority').default('warm'),
  score: integer('score').default(0), // 0-100

  // المصدر
  source: leadSourceEnum('source'),
  sourceDetails: text('source_details'),
  campaignId: text('campaign_id'),
  referredBy: uuid('referred_by'),

  // التخصيص
  assignedTo: uuid('assigned_to').references(() => callCenterAgents.id),
  teamId: uuid('team_id'),

  // الاهتمامات
  interestedProducts: jsonb('interested_products').$type<string[]>(),
  interestedCategories: jsonb('interested_categories').$type<string[]>(),
  budgetRange: text('budget_range'),
  expectedPurchaseDate: timestamp('expected_purchase_date'),

  // تفاصيل إضافية
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>(),
  customFields: jsonb('custom_fields').$type<Record<string, any>>(),

  // القيمة المتوقعة
  expectedValue: decimal('expected_value', { precision: 12, scale: 2 }),
  probability: integer('probability').default(50), // نسبة احتمال الإغلاق

  // الأوقات
  firstContactAt: timestamp('first_contact_at'),
  lastContactAt: timestamp('last_contact_at'),
  nextFollowUpAt: timestamp('next_follow_up_at'),
  convertedAt: timestamp('converted_at'),
  convertedOrderId: uuid('converted_order_id'),

  // الإحصائيات
  totalCalls: integer('total_calls').default(0),
  totalEmails: integer('total_emails').default(0),
  totalWhatsappMessages: integer('total_whatsapp_messages').default(0),

  // Do Not Contact
  doNotCall: boolean('do_not_call').default(false),
  doNotEmail: boolean('do_not_email').default(false),
  doNotWhatsapp: boolean('do_not_whatsapp').default(false),

  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * أنشطة العملاء المحتملين
 */
export const leadActivities = pgTable('lead_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .references(() => leads.id)
    .notNull(),
  agentId: uuid('agent_id').references(() => callCenterAgents.id),
  type: text('type').notNull(), // call, email, whatsapp, note, status_change, etc.
  subType: text('sub_type'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  outcome: text('outcome'),
  previousValue: text('previous_value'),
  newValue: text('new_value'),
  relatedCallId: uuid('related_call_id').references(() => phoneCalls.id),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * مراحل البيع (Pipeline Stages)
 */
export const salesPipelines = pgTable('sales_pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  description: text('description'),
  stages: jsonb('stages').$type<
    {
      id: string;
      name: string;
      nameAr: string;
      order: number;
      probability: number;
      color: string;
      daysLimit?: number;
    }[]
  >(),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * المتابعات المجدولة
 */
export const followUps = pgTable('follow_ups', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').references(() => leads.id),
  customerId: uuid('customer_id'),
  orderId: uuid('order_id'),
  agentId: uuid('agent_id')
    .references(() => callCenterAgents.id)
    .notNull(),

  type: followUpTypeEnum('type').notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  reminderAt: timestamp('reminder_at'),

  subject: text('subject'),
  notes: text('notes'),
  priority: leadPriorityEnum('priority').default('warm'),

  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  outcome: text('outcome'),
  nextFollowUpId: uuid('next_follow_up_id'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * سكريبتات المكالمات
 */
export const callScripts = pgTable('call_scripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  category: text('category'), // sales, support, follow_up, etc.
  productCategory: text('product_category'),

  // المحتوى
  openingScript: text('opening_script'),
  openingScriptAr: text('opening_script_ar'),
  qualifyingQuestions: jsonb('qualifying_questions').$type<
    {
      question: string;
      questionAr: string;
      expectedAnswers: string[];
      nextAction: string;
    }[]
  >(),
  objectionHandling: jsonb('objection_handling').$type<
    {
      objection: string;
      objectionAr: string;
      response: string;
      responseAr: string;
    }[]
  >(),
  closingScript: text('closing_script'),
  closingScriptAr: text('closing_script_ar'),

  // المعلومات
  keyPoints: jsonb('key_points').$type<string[]>(),
  productsToMention: jsonb('products_to_mention').$type<string[]>(),
  promotionsToMention: jsonb('promotions_to_mention').$type<string[]>(),

  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * أهداف المبيعات
 */
export const salesTargets = pgTable('sales_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').references(() => callCenterAgents.id),
  teamId: uuid('team_id'),
  period: text('period').notNull(), // daily, weekly, monthly, quarterly
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),

  // الأهداف
  callsTarget: integer('calls_target'),
  salesTarget: decimal('sales_target', { precision: 12, scale: 2 }),
  ordersTarget: integer('orders_target'),
  conversionRateTarget: decimal('conversion_rate_target', { precision: 5, scale: 2 }),
  newLeadsTarget: integer('new_leads_target'),

  // الإنجاز
  callsAchieved: integer('calls_achieved').default(0),
  salesAchieved: decimal('sales_achieved', { precision: 12, scale: 2 }).default('0'),
  ordersAchieved: integer('orders_achieved').default(0),
  newLeadsAchieved: integer('new_leads_achieved').default(0),

  // المكافآت
  bonusThreshold: decimal('bonus_threshold', { precision: 5, scale: 2 }), // نسبة الإنجاز للمكافأة
  bonusAmount: decimal('bonus_amount', { precision: 12, scale: 2 }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * أداء الوكلاء
 */
export const agentPerformance = pgTable('agent_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .references(() => callCenterAgents.id)
    .notNull(),
  date: timestamp('date').notNull(),

  // إحصائيات المكالمات
  totalCalls: integer('total_calls').default(0),
  inboundCalls: integer('inbound_calls').default(0),
  outboundCalls: integer('outbound_calls').default(0),
  answeredCalls: integer('answered_calls').default(0),
  missedCalls: integer('missed_calls').default(0),
  averageCallDuration: integer('average_call_duration'), // seconds
  totalTalkTime: integer('total_talk_time'), // seconds

  // إحصائيات المبيعات
  salesAmount: decimal('sales_amount', { precision: 12, scale: 2 }).default('0'),
  ordersCreated: integer('orders_created').default(0),
  leadsConverted: integer('leads_converted').default(0),
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }),

  // إحصائيات العملاء
  newLeads: integer('new_leads').default(0),
  followUpsCompleted: integer('follow_ups_completed').default(0),
  appointmentsSet: integer('appointments_set').default(0),

  // جودة الخدمة
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  firstCallResolution: decimal('first_call_resolution', { precision: 5, scale: 2 }),
  averageWaitTime: integer('average_wait_time'), // seconds
  averageAfterCallWork: integer('average_after_call_work'), // seconds

  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * قوائم الاتصال
 */
export const dialLists = pgTable('dial_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  description: text('description'),
  type: text('type'), // manual, auto, smart
  criteria: jsonb('criteria').$type<{
    leadStatus?: string[];
    priority?: string[];
    source?: string[];
    lastContactBefore?: string;
    expectedValue?: { min?: number; max?: number };
    governorates?: string[];
  }>(),
  assignedTo: uuid('assigned_to').references(() => callCenterAgents.id),
  teamId: uuid('team_id'),
  scriptId: uuid('script_id').references(() => callScripts.id),

  // الإحصائيات
  totalContacts: integer('total_contacts').default(0),
  calledCount: integer('called_count').default(0),
  successCount: integer('success_count').default(0),

  isActive: boolean('is_active').default(true),
  scheduledAt: timestamp('scheduled_at'),
  completedAt: timestamp('completed_at'),

  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * أعضاء قوائم الاتصال
 */
export const dialListMembers = pgTable('dial_list_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  dialListId: uuid('dial_list_id')
    .references(() => dialLists.id)
    .notNull(),
  leadId: uuid('lead_id').references(() => leads.id),
  customerId: uuid('customer_id'),
  phoneNumber: text('phone_number').notNull(),
  name: text('name'),
  priority: integer('priority').default(0),
  status: text('status').default('pending'), // pending, called, success, failed, skip
  attempts: integer('attempts').default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
  lastCallId: uuid('last_call_id').references(() => phoneCalls.id),
  outcome: text('outcome'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const callCenterAgentsRelations = relations(callCenterAgents, ({ many }) => ({
  calls: many(phoneCalls),
  leads: many(leads),
  followUps: many(followUps),
  performance: many(agentPerformance),
  targets: many(salesTargets),
  activities: many(leadActivities),
}));

export const phoneCallsRelations = relations(phoneCalls, ({ one, many }) => ({
  agent: one(callCenterAgents, {
    fields: [phoneCalls.agentId],
    references: [callCenterAgents.id],
  }),
  lead: one(leads, {
    fields: [phoneCalls.leadId],
    references: [leads.id],
  }),
  recordings: many(callRecordings),
  activities: many(leadActivities),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedAgent: one(callCenterAgents, {
    fields: [leads.assignedTo],
    references: [callCenterAgents.id],
  }),
  calls: many(phoneCalls),
  activities: many(leadActivities),
  followUps: many(followUps),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  agent: one(callCenterAgents, {
    fields: [followUps.agentId],
    references: [callCenterAgents.id],
  }),
  lead: one(leads, {
    fields: [followUps.leadId],
    references: [leads.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type CallCenterAgent = typeof callCenterAgents.$inferSelect;
export type NewCallCenterAgent = typeof callCenterAgents.$inferInsert;

export type PhoneCall = typeof phoneCalls.$inferSelect;
export type NewPhoneCall = typeof phoneCalls.$inferInsert;

export type CallRecording = typeof callRecordings.$inferSelect;
export type NewCallRecording = typeof callRecordings.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type LeadActivity = typeof leadActivities.$inferSelect;
export type NewLeadActivity = typeof leadActivities.$inferInsert;

export type SalesPipeline = typeof salesPipelines.$inferSelect;
export type NewSalesPipeline = typeof salesPipelines.$inferInsert;

export type FollowUp = typeof followUps.$inferSelect;
export type NewFollowUp = typeof followUps.$inferInsert;

export type CallScript = typeof callScripts.$inferSelect;
export type NewCallScript = typeof callScripts.$inferInsert;

export type SalesTarget = typeof salesTargets.$inferSelect;
export type NewSalesTarget = typeof salesTargets.$inferInsert;

export type AgentPerformance = typeof agentPerformance.$inferSelect;
export type NewAgentPerformance = typeof agentPerformance.$inferInsert;

export type DialList = typeof dialLists.$inferSelect;
export type NewDialList = typeof dialLists.$inferInsert;

export type DialListMember = typeof dialListMembers.$inferSelect;
export type NewDialListMember = typeof dialListMembers.$inferInsert;
