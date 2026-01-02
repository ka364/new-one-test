/**
 * 📞 Phone Sales System Router
 * نظام المبيعات الهاتفية - tRPC Router
 *
 * Features:
 * - Agent Management (إدارة الوكلاء)
 * - Call Management (إدارة المكالمات)
 * - Lead Management (إدارة العملاء المحتملين)
 * - Follow-up Scheduling (جدولة المتابعات)
 * - Sales Pipeline (مراحل البيع)
 * - Performance Tracking (تتبع الأداء)
 * - Dial Lists (قوائم الاتصال)
 * - Call Scripts (سكريبتات المكالمات)
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { eq, and, gte, lte, desc, asc, sql, ilike, or, count, sum, avg } from 'drizzle-orm';
import {
  callCenterAgents,
  phoneCalls,
  callRecordings,
  leads,
  leadActivities,
  salesPipelines,
  followUps,
  callScripts,
  salesTargets,
  agentPerformance,
  dialLists,
  dialListMembers,
} from '../../drizzle/schema-phone-sales';

// ============================================
// INPUT SCHEMAS
// ============================================

const createAgentSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  extension: z.string().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).default(['ar']),
  dailyTarget: z.number().optional(),
  monthlyTarget: z.number().optional(),
  commissionRate: z.number().optional(),
  isTeamLead: z.boolean().optional(),
  teamId: z.string().uuid().optional(),
});

const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  fullNameAr: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  alternatePhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  city: z.string().optional(),
  governorate: z.string().optional(),
  address: z.string().optional(),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  source: z
    .enum([
      'website',
      'social_media',
      'referral',
      'cold_call',
      'advertisement',
      'trade_show',
      'partner',
      'other',
    ])
    .optional(),
  sourceDetails: z.string().optional(),
  priority: z.enum(['hot', 'warm', 'cold']).optional(),
  interestedProducts: z.array(z.string()).optional(),
  interestedCategories: z.array(z.string()).optional(),
  budgetRange: z.string().optional(),
  expectedValue: z.number().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().uuid().optional(),
});

const startCallSchema = z.object({
  agentId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  callerNumber: z.string(),
  calledNumber: z.string(),
  direction: z.enum(['inbound', 'outbound']),
});

const endCallSchema = z.object({
  callId: z.string().uuid(),
  outcome: z.enum([
    'sale',
    'appointment',
    'callback_requested',
    'not_interested',
    'no_answer',
    'busy',
    'wrong_number',
    'voicemail',
    'do_not_call',
  ]),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  mentionedProducts: z.array(z.string()).optional(),
  quotedAmount: z.number().optional(),
  scheduleFollowUp: z
    .object({
      type: z.enum(['call', 'email', 'whatsapp', 'meeting', 'site_visit']),
      scheduledAt: z.string().datetime(),
      notes: z.string().optional(),
    })
    .optional(),
});

const createFollowUpSchema = z.object({
  leadId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  agentId: z.string().uuid(),
  type: z.enum(['call', 'email', 'whatsapp', 'meeting', 'site_visit']),
  scheduledAt: z.string().datetime(),
  reminderAt: z.string().datetime().optional(),
  subject: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['hot', 'warm', 'cold']).optional(),
});

const createDialListSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['manual', 'auto', 'smart']).default('manual'),
  criteria: z
    .object({
      leadStatus: z.array(z.string()).optional(),
      priority: z.array(z.string()).optional(),
      source: z.array(z.string()).optional(),
      lastContactBefore: z.string().optional(),
      expectedValue: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      governorates: z.array(z.string()).optional(),
    })
    .optional(),
  assignedTo: z.string().uuid().optional(),
  scriptId: z.string().uuid().optional(),
});

// ============================================
// ROUTER
// ============================================

export const phoneSalesRouter = router({
  // ============================================
  // AGENT MANAGEMENT
  // ============================================

  /**
   * إنشاء وكيل جديد
   */
  createAgent: publicProcedure.input(createAgentSchema).mutation(async ({ input }) => {
    const [agent] = await db
      .insert(callCenterAgents)
      .values({
        name: input.name,
        nameAr: input.nameAr,
        email: input.email,
        phone: input.phone,
        extension: input.extension,
        skills: input.skills || [],
        languages: input.languages,
        dailyTarget: input.dailyTarget,
        monthlyTarget: input.monthlyTarget?.toString(),
        commissionRate: input.commissionRate?.toString(),
        isTeamLead: input.isTeamLead,
        teamId: input.teamId,
      })
      .returning();

    return {
      success: true,
      message: 'تم إنشاء الوكيل بنجاح',
      agent,
    };
  }),

  /**
   * الحصول على جميع الوكلاء
   */
  getAgents: publicProcedure
    .input(
      z
        .object({
          status: z
            .enum(['available', 'on_call', 'break', 'offline', 'after_call_work'])
            .optional(),
          isActive: z.boolean().optional(),
          teamId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.status) {
        conditions.push(eq(callCenterAgents.status, input.status));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(callCenterAgents.isActive, input.isActive));
      }
      if (input?.teamId) {
        conditions.push(eq(callCenterAgents.teamId, input.teamId));
      }

      const agents = await db
        .select()
        .from(callCenterAgents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(callCenterAgents.name));

      return agents;
    }),

  /**
   * تحديث حالة الوكيل
   */
  updateAgentStatus: publicProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
        status: z.enum(['available', 'on_call', 'break', 'offline', 'after_call_work']),
      })
    )
    .mutation(async ({ input }) => {
      const [agent] = await db
        .update(callCenterAgents)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(callCenterAgents.id, input.agentId))
        .returning();

      return {
        success: true,
        agent,
      };
    }),

  /**
   * الحصول على لوحة تحكم الوكيل
   */
  getAgentDashboard: publicProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
        date: z.string().optional(), // YYYY-MM-DD
      })
    )
    .query(async ({ input }) => {
      const targetDate = input.date ? new Date(input.date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // إحصائيات المكالمات اليوم
      const [callStats] = await db
        .select({
          totalCalls: count(),
          answeredCalls: sql<number>`COUNT(*) FILTER (WHERE ${phoneCalls.status} = 'completed')`,
          missedCalls: sql<number>`COUNT(*) FILTER (WHERE ${phoneCalls.status} = 'missed')`,
          totalDuration: sql<number>`COALESCE(SUM(${phoneCalls.duration}), 0)`,
          avgDuration: sql<number>`COALESCE(AVG(${phoneCalls.duration}), 0)`,
          salesCalls: sql<number>`COUNT(*) FILTER (WHERE ${phoneCalls.outcome} = 'sale')`,
        })
        .from(phoneCalls)
        .where(
          and(
            eq(phoneCalls.agentId, input.agentId),
            gte(phoneCalls.createdAt, startOfDay),
            lte(phoneCalls.createdAt, endOfDay)
          )
        );

      // المتابعات المجدولة اليوم
      const pendingFollowUps = await db
        .select()
        .from(followUps)
        .where(
          and(
            eq(followUps.agentId, input.agentId),
            eq(followUps.isCompleted, false),
            gte(followUps.scheduledAt, startOfDay),
            lte(followUps.scheduledAt, endOfDay)
          )
        )
        .orderBy(asc(followUps.scheduledAt))
        .limit(10);

      // العملاء المحتملين الجدد
      const newLeads = await db
        .select()
        .from(leads)
        .where(and(eq(leads.assignedTo, input.agentId), eq(leads.status, 'new')))
        .orderBy(desc(leads.createdAt))
        .limit(5);

      // أهداف اليوم
      const [agent] = await db
        .select()
        .from(callCenterAgents)
        .where(eq(callCenterAgents.id, input.agentId));

      const dailyTarget = agent?.dailyTarget || 50;
      const callsProgress = callStats.totalCalls
        ? (Number(callStats.totalCalls) / dailyTarget) * 100
        : 0;

      return {
        stats: {
          totalCalls: Number(callStats.totalCalls) || 0,
          answeredCalls: Number(callStats.answeredCalls) || 0,
          missedCalls: Number(callStats.missedCalls) || 0,
          totalDuration: Number(callStats.totalDuration) || 0,
          avgDuration: Math.round(Number(callStats.avgDuration) || 0),
          salesCalls: Number(callStats.salesCalls) || 0,
          conversionRate: callStats.totalCalls
            ? ((Number(callStats.salesCalls) / Number(callStats.totalCalls)) * 100).toFixed(1)
            : '0',
        },
        progress: {
          dailyTarget,
          completed: Number(callStats.totalCalls) || 0,
          percentage: Math.min(100, Math.round(callsProgress)),
        },
        pendingFollowUps,
        newLeads,
        agent,
      };
    }),

  // ============================================
  // LEAD MANAGEMENT
  // ============================================

  /**
   * إنشاء عميل محتمل جديد
   */
  createLead: publicProcedure.input(createLeadSchema).mutation(async ({ input }) => {
    const [lead] = await db
      .insert(leads)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        fullNameAr: input.fullNameAr,
        email: input.email,
        phone: input.phone,
        alternatePhone: input.alternatePhone,
        whatsappNumber: input.whatsappNumber,
        city: input.city,
        governorate: input.governorate,
        address: input.address,
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        industry: input.industry,
        source: input.source,
        sourceDetails: input.sourceDetails,
        priority: input.priority,
        interestedProducts: input.interestedProducts,
        interestedCategories: input.interestedCategories,
        budgetRange: input.budgetRange,
        expectedValue: input.expectedValue?.toString(),
        notes: input.notes,
        tags: input.tags,
        assignedTo: input.assignedTo,
      })
      .returning();

    // تسجيل النشاط
    await db.insert(leadActivities).values({
      leadId: lead.id,
      type: 'created',
      description: 'تم إنشاء العميل المحتمل',
      descriptionAr: 'تم إنشاء العميل المحتمل',
    });

    return {
      success: true,
      message: 'تم إنشاء العميل المحتمل بنجاح',
      lead,
    };
  }),

  /**
   * الحصول على العملاء المحتملين
   */
  getLeads: publicProcedure
    .input(
      z
        .object({
          status: z
            .enum([
              'new',
              'contacted',
              'qualified',
              'proposal',
              'negotiation',
              'won',
              'lost',
              'dormant',
            ])
            .optional(),
          priority: z.enum(['hot', 'warm', 'cold']).optional(),
          assignedTo: z.string().uuid().optional(),
          source: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.status) {
        conditions.push(eq(leads.status, input.status));
      }
      if (input?.priority) {
        conditions.push(eq(leads.priority, input.priority));
      }
      if (input?.assignedTo) {
        conditions.push(eq(leads.assignedTo, input.assignedTo));
      }
      if (input?.source) {
        conditions.push(eq(leads.source, input.source as any));
      }
      if (input?.search) {
        conditions.push(
          or(
            ilike(leads.firstName, `%${input.search}%`),
            ilike(leads.lastName, `%${input.search}%`),
            ilike(leads.phone, `%${input.search}%`),
            ilike(leads.email, `%${input.search}%`),
            ilike(leads.companyName, `%${input.search}%`)
          )
        );
      }

      const [leadsList, [{ total }]] = await Promise.all([
        db
          .select()
          .from(leads)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(leads.createdAt))
          .limit(input?.limit || 20)
          .offset(input?.offset || 0),
        db
          .select({ total: count() })
          .from(leads)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      return {
        leads: leadsList,
        total: Number(total),
        hasMore: (input?.offset || 0) + leadsList.length < Number(total),
      };
    }),

  /**
   * تحديث حالة العميل المحتمل
   */
  updateLeadStatus: publicProcedure
    .input(
      z.object({
        leadId: z.string().uuid(),
        status: z.enum([
          'new',
          'contacted',
          'qualified',
          'proposal',
          'negotiation',
          'won',
          'lost',
          'dormant',
        ]),
        agentId: z.string().uuid().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // الحصول على الحالة السابقة
      const [existingLead] = await db
        .select({ status: leads.status })
        .from(leads)
        .where(eq(leads.id, input.leadId));

      if (!existingLead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'العميل المحتمل غير موجود',
        });
      }

      // تحديث الحالة
      const [lead] = await db
        .update(leads)
        .set({
          status: input.status,
          updatedAt: new Date(),
          ...(input.status === 'won' ? { convertedAt: new Date() } : {}),
        })
        .where(eq(leads.id, input.leadId))
        .returning();

      // تسجيل النشاط
      await db.insert(leadActivities).values({
        leadId: input.leadId,
        agentId: input.agentId,
        type: 'status_change',
        description: `تم تغيير الحالة من ${existingLead.status} إلى ${input.status}`,
        previousValue: existingLead.status,
        newValue: input.status,
        metadata: input.notes ? { notes: input.notes } : undefined,
      });

      return {
        success: true,
        message: 'تم تحديث حالة العميل بنجاح',
        lead,
      };
    }),

  /**
   * تخصيص العميل المحتمل لوكيل
   */
  assignLead: publicProcedure
    .input(
      z.object({
        leadId: z.string().uuid(),
        agentId: z.string().uuid(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [lead] = await db
        .update(leads)
        .set({
          assignedTo: input.agentId,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.leadId))
        .returning();

      // تسجيل النشاط
      await db.insert(leadActivities).values({
        leadId: input.leadId,
        agentId: input.agentId,
        type: 'assigned',
        description: 'تم تخصيص العميل للوكيل',
        metadata: input.notes ? { notes: input.notes } : undefined,
      });

      return {
        success: true,
        message: 'تم تخصيص العميل بنجاح',
        lead,
      };
    }),

  // ============================================
  // CALL MANAGEMENT
  // ============================================

  /**
   * بدء مكالمة
   */
  startCall: publicProcedure.input(startCallSchema).mutation(async ({ input }) => {
    // تحديث حالة الوكيل
    await db
      .update(callCenterAgents)
      .set({ status: 'on_call' })
      .where(eq(callCenterAgents.id, input.agentId));

    // إنشاء سجل المكالمة
    const [call] = await db
      .insert(phoneCalls)
      .values({
        agentId: input.agentId,
        leadId: input.leadId,
        customerId: input.customerId,
        direction: input.direction,
        status: 'in_progress',
        callerNumber: input.callerNumber,
        calledNumber: input.calledNumber,
        answeredAt: new Date(),
      })
      .returning();

    // تحديث إحصائيات العميل المحتمل
    if (input.leadId) {
      await db
        .update(leads)
        .set({
          totalCalls: sql`${leads.totalCalls} + 1`,
          lastContactAt: new Date(),
          status: sql`CASE WHEN ${leads.status} = 'new' THEN 'contacted' ELSE ${leads.status} END`,
        })
        .where(eq(leads.id, input.leadId));
    }

    return {
      success: true,
      call,
    };
  }),

  /**
   * إنهاء مكالمة
   */
  endCall: publicProcedure.input(endCallSchema).mutation(async ({ input }) => {
    // الحصول على المكالمة
    const [existingCall] = await db
      .select()
      .from(phoneCalls)
      .where(eq(phoneCalls.id, input.callId));

    if (!existingCall) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'المكالمة غير موجودة',
      });
    }

    // حساب المدة
    const duration = existingCall.answeredAt
      ? Math.floor((Date.now() - existingCall.answeredAt.getTime()) / 1000)
      : 0;

    // تحديث المكالمة
    const [call] = await db
      .update(phoneCalls)
      .set({
        status: 'completed',
        outcome: input.outcome,
        notes: input.notes,
        rating: input.rating,
        mentionedProducts: input.mentionedProducts,
        quotedAmount: input.quotedAmount?.toString(),
        endedAt: new Date(),
        duration,
        updatedAt: new Date(),
      })
      .where(eq(phoneCalls.id, input.callId))
      .returning();

    // تحديث حالة الوكيل
    await db
      .update(callCenterAgents)
      .set({ status: 'after_call_work' })
      .where(eq(callCenterAgents.id, existingCall.agentId!));

    // تسجيل النشاط للعميل المحتمل
    if (existingCall.leadId) {
      await db.insert(leadActivities).values({
        leadId: existingCall.leadId,
        agentId: existingCall.agentId,
        relatedCallId: input.callId,
        type: 'call',
        description: `مكالمة ${existingCall.direction === 'inbound' ? 'واردة' : 'صادرة'} - ${input.outcome}`,
        outcome: input.outcome,
        metadata: {
          duration,
          notes: input.notes,
          rating: input.rating,
        },
      });

      // تحديث حالة العميل المحتمل بناءً على النتيجة
      if (input.outcome === 'sale') {
        await db
          .update(leads)
          .set({ status: 'won', convertedAt: new Date() })
          .where(eq(leads.id, existingCall.leadId));
      } else if (input.outcome === 'do_not_call') {
        await db.update(leads).set({ doNotCall: true }).where(eq(leads.id, existingCall.leadId));
      }
    }

    // إنشاء متابعة إذا طلبت
    if (input.scheduleFollowUp && existingCall.leadId) {
      await db.insert(followUps).values({
        leadId: existingCall.leadId,
        agentId: existingCall.agentId!,
        type: input.scheduleFollowUp.type,
        scheduledAt: new Date(input.scheduleFollowUp.scheduledAt),
        notes: input.scheduleFollowUp.notes,
      });
    }

    return {
      success: true,
      message: 'تم إنهاء المكالمة بنجاح',
      call,
    };
  }),

  /**
   * الحصول على سجل المكالمات
   */
  getCallHistory: publicProcedure
    .input(
      z
        .object({
          agentId: z.string().uuid().optional(),
          leadId: z.string().uuid().optional(),
          customerId: z.string().uuid().optional(),
          status: z
            .enum([
              'queued',
              'ringing',
              'in_progress',
              'completed',
              'missed',
              'voicemail',
              'failed',
            ])
            .optional(),
          outcome: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.agentId) {
        conditions.push(eq(phoneCalls.agentId, input.agentId));
      }
      if (input?.leadId) {
        conditions.push(eq(phoneCalls.leadId, input.leadId));
      }
      if (input?.customerId) {
        conditions.push(eq(phoneCalls.customerId, input.customerId));
      }
      if (input?.status) {
        conditions.push(eq(phoneCalls.status, input.status));
      }
      if (input?.outcome) {
        conditions.push(eq(phoneCalls.outcome, input.outcome as any));
      }
      if (input?.dateFrom) {
        conditions.push(gte(phoneCalls.createdAt, new Date(input.dateFrom)));
      }
      if (input?.dateTo) {
        conditions.push(lte(phoneCalls.createdAt, new Date(input.dateTo)));
      }

      const calls = await db
        .select()
        .from(phoneCalls)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(phoneCalls.createdAt))
        .limit(input?.limit || 20)
        .offset(input?.offset || 0);

      return calls;
    }),

  // ============================================
  // FOLLOW-UP MANAGEMENT
  // ============================================

  /**
   * إنشاء متابعة
   */
  createFollowUp: publicProcedure.input(createFollowUpSchema).mutation(async ({ input }) => {
    const [followUp] = await db
      .insert(followUps)
      .values({
        leadId: input.leadId,
        customerId: input.customerId,
        orderId: input.orderId,
        agentId: input.agentId,
        type: input.type,
        scheduledAt: new Date(input.scheduledAt),
        reminderAt: input.reminderAt ? new Date(input.reminderAt) : null,
        subject: input.subject,
        notes: input.notes,
        priority: input.priority,
      })
      .returning();

    // تحديث العميل المحتمل
    if (input.leadId) {
      await db
        .update(leads)
        .set({ nextFollowUpAt: new Date(input.scheduledAt) })
        .where(eq(leads.id, input.leadId));
    }

    return {
      success: true,
      message: 'تم جدولة المتابعة بنجاح',
      followUp,
    };
  }),

  /**
   * الحصول على المتابعات المجدولة
   */
  getFollowUps: publicProcedure
    .input(
      z
        .object({
          agentId: z.string().uuid().optional(),
          isCompleted: z.boolean().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          type: z.enum(['call', 'email', 'whatsapp', 'meeting', 'site_visit']).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.agentId) {
        conditions.push(eq(followUps.agentId, input.agentId));
      }
      if (input?.isCompleted !== undefined) {
        conditions.push(eq(followUps.isCompleted, input.isCompleted));
      }
      if (input?.type) {
        conditions.push(eq(followUps.type, input.type));
      }
      if (input?.dateFrom) {
        conditions.push(gte(followUps.scheduledAt, new Date(input.dateFrom)));
      }
      if (input?.dateTo) {
        conditions.push(lte(followUps.scheduledAt, new Date(input.dateTo)));
      }

      const result = await db
        .select()
        .from(followUps)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(followUps.scheduledAt));

      return result;
    }),

  /**
   * إتمام متابعة
   */
  completeFollowUp: publicProcedure
    .input(
      z.object({
        followUpId: z.string().uuid(),
        outcome: z.string(),
        notes: z.string().optional(),
        scheduleNext: z
          .object({
            type: z.enum(['call', 'email', 'whatsapp', 'meeting', 'site_visit']),
            scheduledAt: z.string().datetime(),
            notes: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [followUp] = await db
        .update(followUps)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          outcome: input.outcome,
          updatedAt: new Date(),
        })
        .where(eq(followUps.id, input.followUpId))
        .returning();

      // جدولة متابعة جديدة إذا طلبت
      if (input.scheduleNext && followUp.leadId) {
        const [newFollowUp] = await db
          .insert(followUps)
          .values({
            leadId: followUp.leadId,
            customerId: followUp.customerId,
            agentId: followUp.agentId,
            type: input.scheduleNext.type,
            scheduledAt: new Date(input.scheduleNext.scheduledAt),
            notes: input.scheduleNext.notes,
          })
          .returning();

        await db
          .update(followUps)
          .set({ nextFollowUpId: newFollowUp.id })
          .where(eq(followUps.id, input.followUpId));
      }

      return {
        success: true,
        message: 'تم إتمام المتابعة بنجاح',
        followUp,
      };
    }),

  // ============================================
  // DIAL LISTS
  // ============================================

  /**
   * إنشاء قائمة اتصال
   */
  createDialList: publicProcedure.input(createDialListSchema).mutation(async ({ input }) => {
    const [dialList] = await db
      .insert(dialLists)
      .values({
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        type: input.type,
        criteria: input.criteria,
        assignedTo: input.assignedTo,
        scriptId: input.scriptId,
      })
      .returning();

    // إذا كانت القائمة ذكية، أضف الأعضاء تلقائياً
    if (input.type === 'smart' && input.criteria) {
      const leadConditions = [];

      if (input.criteria.leadStatus) {
        leadConditions.push(sql`${leads.status} = ANY(${input.criteria.leadStatus})`);
      }
      if (input.criteria.priority) {
        leadConditions.push(sql`${leads.priority} = ANY(${input.criteria.priority})`);
      }
      if (input.criteria.governorates) {
        leadConditions.push(sql`${leads.governorate} = ANY(${input.criteria.governorates})`);
      }

      const matchingLeads = await db
        .select()
        .from(leads)
        .where(leadConditions.length > 0 ? and(...leadConditions) : undefined)
        .limit(500);

      if (matchingLeads.length > 0) {
        await db.insert(dialListMembers).values(
          matchingLeads.map((lead, index) => ({
            dialListId: dialList.id,
            leadId: lead.id,
            phoneNumber: lead.phone,
            name: `${lead.firstName} ${lead.lastName || ''}`.trim(),
            priority: index,
          }))
        );

        await db
          .update(dialLists)
          .set({ totalContacts: matchingLeads.length })
          .where(eq(dialLists.id, dialList.id));
      }
    }

    return {
      success: true,
      message: 'تم إنشاء قائمة الاتصال بنجاح',
      dialList,
    };
  }),

  /**
   * الحصول على قوائم الاتصال
   */
  getDialLists: publicProcedure
    .input(
      z
        .object({
          assignedTo: z.string().uuid().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.assignedTo) {
        conditions.push(eq(dialLists.assignedTo, input.assignedTo));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(dialLists.isActive, input.isActive));
      }

      const lists = await db
        .select()
        .from(dialLists)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(dialLists.createdAt));

      return lists;
    }),

  /**
   * الحصول على العضو التالي في قائمة الاتصال
   */
  getNextDialListMember: publicProcedure
    .input(
      z.object({
        dialListId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const [member] = await db
        .select()
        .from(dialListMembers)
        .where(
          and(
            eq(dialListMembers.dialListId, input.dialListId),
            eq(dialListMembers.status, 'pending')
          )
        )
        .orderBy(asc(dialListMembers.priority))
        .limit(1);

      return member || null;
    }),

  // ============================================
  // CALL SCRIPTS
  // ============================================

  /**
   * الحصول على سكريبتات المكالمات
   */
  getCallScripts: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          productCategory: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.category) {
        conditions.push(eq(callScripts.category, input.category));
      }
      if (input?.productCategory) {
        conditions.push(eq(callScripts.productCategory, input.productCategory));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(callScripts.isActive, input.isActive));
      }

      const scripts = await db
        .select()
        .from(callScripts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(callScripts.name));

      return scripts;
    }),

  /**
   * إنشاء سكريبت مكالمة
   */
  createCallScript: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        nameAr: z.string().optional(),
        category: z.string().optional(),
        productCategory: z.string().optional(),
        openingScript: z.string().optional(),
        openingScriptAr: z.string().optional(),
        qualifyingQuestions: z
          .array(
            z.object({
              question: z.string(),
              questionAr: z.string().optional(),
              expectedAnswers: z.array(z.string()),
              nextAction: z.string(),
            })
          )
          .optional(),
        objectionHandling: z
          .array(
            z.object({
              objection: z.string(),
              objectionAr: z.string().optional(),
              response: z.string(),
              responseAr: z.string().optional(),
            })
          )
          .optional(),
        closingScript: z.string().optional(),
        closingScriptAr: z.string().optional(),
        keyPoints: z.array(z.string()).optional(),
        productsToMention: z.array(z.string()).optional(),
        promotionsToMention: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [script] = await db
        .insert(callScripts)
        .values({
          name: input.name,
          nameAr: input.nameAr,
          category: input.category,
          productCategory: input.productCategory,
          openingScript: input.openingScript,
          openingScriptAr: input.openingScriptAr,
          qualifyingQuestions: input.qualifyingQuestions,
          objectionHandling: input.objectionHandling,
          closingScript: input.closingScript,
          closingScriptAr: input.closingScriptAr,
          keyPoints: input.keyPoints,
          productsToMention: input.productsToMention,
          promotionsToMention: input.promotionsToMention,
        })
        .returning();

      return {
        success: true,
        message: 'تم إنشاء السكريبت بنجاح',
        script,
      };
    }),

  // ============================================
  // PERFORMANCE & REPORTS
  // ============================================

  /**
   * الحصول على تقرير أداء الوكلاء
   */
  getAgentPerformanceReport: publicProcedure
    .input(
      z.object({
        agentId: z.string().uuid().optional(),
        teamId: z.string().uuid().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [
        gte(agentPerformance.date, new Date(input.dateFrom)),
        lte(agentPerformance.date, new Date(input.dateTo)),
      ];

      if (input.agentId) {
        conditions.push(eq(agentPerformance.agentId, input.agentId));
      }

      const performance = await db
        .select({
          agentId: agentPerformance.agentId,
          totalCalls: sql<number>`SUM(${agentPerformance.totalCalls})`,
          answeredCalls: sql<number>`SUM(${agentPerformance.answeredCalls})`,
          missedCalls: sql<number>`SUM(${agentPerformance.missedCalls})`,
          salesAmount: sql<number>`SUM(${agentPerformance.salesAmount})`,
          ordersCreated: sql<number>`SUM(${agentPerformance.ordersCreated})`,
          leadsConverted: sql<number>`SUM(${agentPerformance.leadsConverted})`,
          avgCallDuration: sql<number>`AVG(${agentPerformance.averageCallDuration})`,
          avgRating: sql<number>`AVG(${agentPerformance.averageRating})`,
        })
        .from(agentPerformance)
        .where(and(...conditions))
        .groupBy(agentPerformance.agentId);

      return performance;
    }),

  /**
   * الحصول على ملخص المبيعات اليومي
   */
  getDailySalesSummary: publicProcedure
    .input(
      z
        .object({
          date: z.string().optional(),
          teamId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const targetDate = input?.date ? new Date(input.date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // إحصائيات المكالمات
      const [callStats] = await db
        .select({
          totalCalls: count(),
          completedCalls: sql<number>`COUNT(*) FILTER (WHERE ${phoneCalls.status} = 'completed')`,
          salesCalls: sql<number>`COUNT(*) FILTER (WHERE ${phoneCalls.outcome} = 'sale')`,
          totalDuration: sql<number>`COALESCE(SUM(${phoneCalls.duration}), 0)`,
          avgDuration: sql<number>`COALESCE(AVG(${phoneCalls.duration}), 0)`,
          totalQuoted: sql<number>`COALESCE(SUM(${phoneCalls.quotedAmount}::numeric), 0)`,
        })
        .from(phoneCalls)
        .where(and(gte(phoneCalls.createdAt, startOfDay), lte(phoneCalls.createdAt, endOfDay)));

      // إحصائيات العملاء المحتملين
      const [leadStats] = await db
        .select({
          newLeads: sql<number>`COUNT(*) FILTER (WHERE ${leads.createdAt} >= ${startOfDay})`,
          contactedToday: sql<number>`COUNT(*) FILTER (WHERE ${leads.lastContactAt} >= ${startOfDay})`,
          convertedToday: sql<number>`COUNT(*) FILTER (WHERE ${leads.convertedAt} >= ${startOfDay})`,
        })
        .from(leads);

      // أفضل الوكلاء
      const topAgents = await db
        .select({
          agentId: phoneCalls.agentId,
          totalCalls: count(),
          salesCalls: sql<number>`COUNT(*) FILTER (WHERE ${phoneCalls.outcome} = 'sale')`,
        })
        .from(phoneCalls)
        .where(and(gte(phoneCalls.createdAt, startOfDay), lte(phoneCalls.createdAt, endOfDay)))
        .groupBy(phoneCalls.agentId)
        .orderBy(desc(sql`COUNT(*) FILTER (WHERE ${phoneCalls.outcome} = 'sale')`))
        .limit(5);

      return {
        calls: {
          total: Number(callStats.totalCalls) || 0,
          completed: Number(callStats.completedCalls) || 0,
          sales: Number(callStats.salesCalls) || 0,
          conversionRate: callStats.totalCalls
            ? ((Number(callStats.salesCalls) / Number(callStats.totalCalls)) * 100).toFixed(1)
            : '0',
          totalDuration: Number(callStats.totalDuration) || 0,
          avgDuration: Math.round(Number(callStats.avgDuration) || 0),
          totalQuoted: Number(callStats.totalQuoted) || 0,
        },
        leads: {
          new: Number(leadStats.newLeads) || 0,
          contacted: Number(leadStats.contactedToday) || 0,
          converted: Number(leadStats.convertedToday) || 0,
        },
        topAgents,
      };
    }),

  /**
   * الحصول على Pipeline Overview
   */
  getPipelineOverview: publicProcedure
    .input(
      z
        .object({
          agentId: z.string().uuid().optional(),
          teamId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.agentId) {
        conditions.push(eq(leads.assignedTo, input.agentId));
      }

      const pipeline = await db
        .select({
          status: leads.status,
          count: count(),
          totalValue: sql<number>`COALESCE(SUM(${leads.expectedValue}::numeric), 0)`,
          avgProbability: sql<number>`COALESCE(AVG(${leads.probability}), 0)`,
        })
        .from(leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(leads.status);

      // حساب القيمة المتوقعة المرجحة
      const weightedValue = pipeline.reduce((total, stage) => {
        return total + Number(stage.totalValue) * (Number(stage.avgProbability) / 100);
      }, 0);

      return {
        stages: pipeline,
        totalLeads: pipeline.reduce((sum, s) => sum + Number(s.count), 0),
        totalValue: pipeline.reduce((sum, s) => sum + Number(s.totalValue), 0),
        weightedValue,
      };
    }),
});

export type PhoneSalesRouter = typeof phoneSalesRouter;
