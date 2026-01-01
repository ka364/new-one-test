// @ts-nocheck
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  searchOrders,
  getAllTransactions,
  createTransaction,
  getTransactionById,
  updateTransactionEthicalStatus,
  getTransactionsByDateRange,
  getAllEthicalRules,
  createEthicalRule,
  getEthicalRuleById,
  updateEthicalRuleStatus,
  getActiveEthicalRules,
  getAllAuditLogs,
  getAuditLogsByEntity,
  createAuditLog,
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  getAllReports,
  createReport,
  getReportById,
  getAllCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaignMetrics,
  getAllAgentInsights,
  getAgentInsightsByType,
  getUserChatHistory,
  createChatMessage,
  getChatMessagesByConversation,
  getDashboardStats,
  getAllUsers,
  updateUserRole,
} from "./db";
import { evaluateTransactionWithKAIA } from "./kaia/engine";
import { publishEvent } from "./events/eventBus";
import { getFinancialAgent } from "./agents/financialAgent";
import { getDemandPlannerAgent } from "./agents/demandPlannerAgent";
import { getCampaignOrchestratorAgent } from "./agents/campaignOrchestratorAgent";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { adaptiveRouter } from './routers/adaptive';
import { contentCreatorRouter } from './routers/contentCreator';
import { nowshoesRouter } from "./routers/nowshoes";
import { whatsappCommerceRouter } from "./routers/whatsapp-commerce";
import { bnplRouter } from "./routers/bnpl";
import { paymentRouter } from "./routers/payment";
import { employeesRouter } from "./routers/employees";
import { shipmentsRouter } from "./routers/shipments";
import { hrRouter } from "./routers/hr";
import { visualSearchRouter } from "./routers/visual-search";
import { codRouter } from "./routers/cod.router";
import { foundersRouter } from "./routers/founders";
import { shopifyRouter } from "./routers/shopify";
import { employeeAuthRouter } from "./routers/employee-auth";
import { adminRouter } from "./routers/admin";
import { webhooksRouter } from "./routers/webhooks";
import { shippingRouter, collectionsRouter, metricsRouter } from "./routers/launch-system";
import { investorsRouter } from "./routers/investors";
import { financialRouter } from "./routers/financial";
import { kaiaRouter } from "./routers/kaia";
import { chatRouter } from "./routers/chat";
import { uploadRouter } from "./routers/upload";
import { ordersRouter } from "./routers/orders";
import { productsRouter } from "./routers/products";
import { bioDashboardRouter } from "./routers/bio-dashboard";
import { inventoryRouter } from "./routers/inventory";
import { vitalSignsRouter } from "./routers/vital-signs";
import { spreadsheetCollabRouter } from "./routers/spreadsheet-collab";
import { messagingRouter } from "./routers/messaging";
import { egyptianCommerceRouter } from "./routers/egyptian-commerce";

export const appRouter = router({
  system: systemRouter,
  founders: foundersRouter,
  shopify: shopifyRouter,
  employeeAuth: employeeAuthRouter,
  shipping: shippingRouter,
  collections: collectionsRouter,
  metrics: metricsRouter,
  investors: investorsRouter,
  financial: financialRouter,
  kaia: kaiaRouter,
  adaptive: adaptiveRouter,
  contentCreator: contentCreatorRouter,
  whatsappCommerce: whatsappCommerceRouter,
  bnpl: bnplRouter,
  payment: paymentRouter,
  nowshoes: nowshoesRouter,
  employees: employeesRouter,
  shipments: shipmentsRouter,
  hr: hrRouter,
  visualSearch: visualSearchRouter,
  admin: adminRouter,
  webhooks: webhooksRouter,
  chat: chatRouter,
  upload: uploadRouter,
  orders: ordersRouter,
  products: productsRouter,
  bio: bioDashboardRouter,
  inventory: inventoryRouter,
  vitalSigns: vitalSignsRouter,
  cod: codRouter,
  spreadsheet: spreadsheetCollabRouter,
  messaging: messagingRouter,
  egyptianCommerce: egyptianCommerceRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================
  // DASHBOARD
  // ============================================
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      const stats = await getDashboardStats();
      return stats || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingTransactions: 0,
        activeUsers: 0
      };
    }),

    recentActivity: protectedProcedure.query(async () => {
      const [orders, transactions, insights] = await Promise.all([
        getAllOrders(10),
        getAllTransactions(10),
        getAllAgentInsights(10)
      ]);
      return { orders, transactions, insights };
    }),
  }),

  // ============================================
  // ORDERS
  // ============================================
  orders: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAllOrders(input?.limit || 100);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getOrderById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        orderNumber: z.string(),
        customerName: z.string(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        productName: z.string(),
        productDescription: z.string().optional(),
        quantity: z.number().min(1),
        unitPrice: z.string(),
        totalAmount: z.string(),
        currency: z.string().default("USD"),
        shippingAddress: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const order = await createOrder({
          ...input,
          createdBy: ctx.user.id,
        });

        // Publish event
        await publishEvent({
          type: "order.created",
          data: { order: { ...input, id: order[0].insertId } },
          userId: ctx.user.id,
        });

        return { success: true, orderId: order[0].insertId };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "confirmed", "shipped", "delivered", "cancelled", "refunded"]),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateOrderStatus(input.id, input.status);

        // Create audit log
        await createAuditLog({
          entityType: "order",
          entityId: input.id,
          action: "update",
          actionDescription: `Order status updated to ${input.status}`,
          performedBy: ctx.user.id,
        });

        return { success: true };
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await searchOrders(input.query);
      }),
  }),

  // ============================================
  // TRANSACTIONS
  // ============================================
  transactions: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAllTransactions(input?.limit || 100);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getTransactionById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        transactionNumber: z.string(),
        type: z.enum(["income", "expense", "transfer", "payment", "refund", "subscription"]),
        category: z.string().optional(),
        amount: z.string(),
        currency: z.string().default("USD"),
        description: z.string().optional(),
        relatedOrderId: z.number().optional(),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Evaluate with KAIA first
        const kaiaDecision = await evaluateTransactionWithKAIA(input);

        const transaction = await createTransaction({
          ...input,
          shariaCompliant: kaiaDecision.approved,
          ethicalCheckStatus: kaiaDecision.decision === "approved" ? "approved" : 
                             kaiaDecision.decision === "rejected" ? "rejected" : "review_required",
          ethicalCheckNotes: kaiaDecision.overallReason,
          createdBy: ctx.user.id,
        });

        // Create audit log with KAIA decision
        await createAuditLog({
          entityType: "transaction",
          entityId: transaction[0].insertId,
          action: "create",
          actionDescription: "Transaction created and evaluated by KAIA",
          kaiaDecision: kaiaDecision.decision,
          appliedRules: kaiaDecision.appliedRules,
          decisionReason: kaiaDecision.overallReason,
          decisionReasonAr: kaiaDecision.overallReasonAr,
          performedBy: ctx.user.id,
        });

        // Publish event
        await publishEvent({
          type: "transaction.created",
          data: { transaction: { ...input, id: transaction[0].insertId } },
          userId: ctx.user.id,
          priority: kaiaDecision.requiresHumanReview ? 50 : 100,
        });

        return { 
          success: true, 
          transactionId: transaction[0].insertId,
          kaiaDecision 
        };
      }),

    updateEthicalStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected", "review_required"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateTransactionEthicalStatus(
          input.id,
          input.status,
          input.notes,
          ctx.user.id
        );

        await createAuditLog({
          entityType: "transaction",
          entityId: input.id,
          action: "update",
          actionDescription: `Ethical status updated to ${input.status}`,
          performedBy: ctx.user.id,
        });

        return { success: true };
      }),

    getByDateRange: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        return await getTransactionsByDateRange(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),
  }),

  // ============================================
  // ETHICAL RULES (KAIA)
  // ============================================
  ethicalRules: router({
    list: protectedProcedure.query(async () => {
      return await getAllEthicalRules();
    }),

    getActive: protectedProcedure.query(async () => {
      return await getActiveEthicalRules();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getEthicalRuleById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        ruleName: z.string(),
        ruleNameAr: z.string().optional(),
        ruleDescription: z.string(),
        ruleDescriptionAr: z.string().optional(),
        ruleType: z.enum(["sharia_financial", "sharia_commercial", "ethical_business", "compliance", "risk_management"]),
        category: z.string().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        ruleLogic: z.object({
          conditions: z.array(z.object({
            field: z.string(),
            operator: z.string(),
            value: z.any(),
          })),
          action: z.string(),
        }),
        requiresReview: z.boolean().default(false),
        priority: z.number().default(100),
        referenceSource: z.string().optional(),
        referenceSourceAr: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const rule = await createEthicalRule({
          ...input,
          createdBy: ctx.user.id,
        });

        return { success: true, ruleId: rule[0].insertId };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await updateEthicalRuleStatus(input.id, input.isActive);
        return { success: true };
      }),
  }),

  // ============================================
  // AUDIT TRAIL
  // ============================================
  auditTrail: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAllAuditLogs(input?.limit || 100);
      }),

    getByEntity: protectedProcedure
      .input(z.object({
        entityType: z.string(),
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getAuditLogsByEntity(input.entityType, input.entityId);
      }),
  }),

  // ============================================
  // NOTIFICATIONS
  // ============================================
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return await getUserNotifications(ctx.user.id, input?.limit || 50);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // CAMPAIGNS
  // ============================================
  campaigns: router({
    list: protectedProcedure.query(async () => {
      return await getAllCampaigns();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getCampaignById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        campaignName: z.string(),
        campaignNameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        type: z.enum(["email", "social_media", "sms", "multi_channel"]),
        budget: z.string().optional(),
        currency: z.string().default("USD"),
        startDate: z.string(),
        endDate: z.string().optional(),
        aiOptimizationEnabled: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const campaign = await createCampaign({
          ...input,
          startDate: new Date(input.startDate).toISOString(),
          endDate: input.endDate ? new Date(input.endDate).toISOString() : null,
          createdBy: ctx.user.id,
        });

        // Publish event
        await publishEvent({
          type: "campaign.created",
          data: { campaign: { ...input, id: campaign[0].insertId } },
          userId: ctx.user.id,
        });

        return { success: true, campaignId: campaign[0].insertId };
      }),

    updateMetrics: protectedProcedure
      .input(z.object({
        id: z.number(),
        impressions: z.number().optional(),
        clicks: z.number().optional(),
        conversions: z.number().optional(),
        revenue: z.string().optional(),
        spent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...metrics } = input;
        await updateCampaignMetrics(id, metrics);

        // Publish performance update event
        await publishEvent({
          type: "campaign.performance_update",
          data: { campaignId: id, metrics },
        });

        return { success: true };
      }),

    getPerformanceSummary: protectedProcedure.query(async () => {
      const agent = getCampaignOrchestratorAgent();
      return await agent.getCampaignPerformanceSummary();
    }),
  }),

  // ============================================
  // AGENT INSIGHTS
  // ============================================
  insights: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAllAgentInsights(input?.limit || 100);
      }),

    getByAgentType: protectedProcedure
      .input(z.object({
        agentType: z.enum(["financial", "demand_planner", "campaign_orchestrator", "ethics_gatekeeper"]),
      }))
      .query(async ({ input }) => {
        return await getAgentInsightsByType(input.agentType);
      }),
  }),

  // ============================================
  // FINANCIAL AGENT
  // ============================================
  financialAgent: router({
    forecastCashFlow: protectedProcedure
      .input(z.object({ months: z.number().default(3) }))
      .query(async ({ input }) => {
        const agent = getFinancialAgent();
        return await agent.forecastCashFlow(input.months);
      }),

    detectPatterns: protectedProcedure.query(async () => {
      const agent = getFinancialAgent();
      return await agent.detectPatterns();
    }),

    generateSummary: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        const agent = getFinancialAgent();
        return await agent.generateFinancialSummary(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),
  }),

  // ============================================
  // DEMAND PLANNER AGENT
  // ============================================
  demandPlanner: router({
    forecastDemand: protectedProcedure
      .input(z.object({
        product: z.string(),
        months: z.number().default(3),
      }))
      .query(async ({ input }) => {
        const agent = getDemandPlannerAgent();
        return await agent.forecastDemand(input.product, input.months);
      }),

    getInventoryRecommendations: protectedProcedure.query(async () => {
      const agent = getDemandPlannerAgent();
      return await agent.generateInventoryRecommendations();
    }),

    analyzeSalesTrends: protectedProcedure
      .input(z.object({ months: z.number().default(6) }))
      .query(async ({ input }) => {
        const agent = getDemandPlannerAgent();
        return await agent.analyzeSalesTrends(input.months);
      }),

    getTopProducts: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const agent = getDemandPlannerAgent();
        return await agent.getTopSellingProducts(input.limit);
      }),
  }),

  // AI CHAT router moved to server/routers/chat.ts (imported at line 67)

  // ============================================
  // REPORTS
  // ============================================
  reports: router({
    list: protectedProcedure.query(async () => {
      return await getAllReports();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getReportById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        reportName: z.string(),
        reportNameAr: z.string().optional(),
        reportType: z.enum(["sales", "financial", "orders", "transactions", "ethical_compliance", "custom"]),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        reportConfig: z.object({
          dateRange: z.object({
            start: z.string(),
            end: z.string(),
          }).optional(),
          filters: z.record(z.string(), z.any()).optional(),
          groupBy: z.array(z.string()).optional(),
          metrics: z.array(z.string()).optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const report = await createReport({
          ...input,
          createdBy: ctx.user.id,
        });

        return { success: true, reportId: report[0].insertId };
      }),
  }),

  // ============================================
  // COD TRACKING SYSTEM
  // ============================================
  cod: codRouter,
});


export type AppRouter = typeof appRouter;
