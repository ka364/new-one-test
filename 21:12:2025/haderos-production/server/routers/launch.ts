import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Launch & Growth Router
 * Provides access to launch plans, growth strategies, and execution roadmaps
 */
export const launchRouter = createTRPCRouter({
  /**
   * Get Launch Plan
   * Returns the comprehensive launch readiness plan
   */
  getLaunchPlan: publicProcedure.query(async () => {
    try {
      const launchPlanPath = join(process.cwd(), "LAUNCH_READY.md");
      const content = await readFile(launchPlanPath, "utf-8");

      return {
        success: true,
        title: "HADEROS Launch Plan",
        content,
        sections: parseLaunchPlan(content),
        status: "ready",
        readiness: 96,
      };
    } catch (error) {
      return {
        success: false,
        title: "HADEROS Launch Plan",
        content: "Launch plan not found",
        sections: [],
        status: "pending",
        readiness: 0,
      };
    }
  }),

  /**
   * Get 90-Day Execution Plan
   * Returns the 90-day growth and execution strategy
   */
  get90DayPlan: publicProcedure.query(async () => {
    try {
      const planPath = join(process.cwd(), "90_DAY_EXECUTION_PLAN.md");
      const content = await readFile(planPath, "utf-8");

      return {
        success: true,
        title: "90-Day Execution Plan",
        content,
        phases: parse90DayPlan(content),
        currentDay: 1,
        progress: 0,
      };
    } catch (error) {
      return {
        success: false,
        title: "90-Day Execution Plan",
        content: "Execution plan not found",
        phases: [],
        currentDay: 0,
        progress: 0,
      };
    }
  }),

  /**
   * Get Launch Checklist
   * Returns a structured checklist for launch readiness
   */
  getLaunchChecklist: protectedProcedure.query(async () => {
    const checklist = {
      technical: [
        { id: 1, item: "Database setup and migrations", completed: true, critical: true },
        { id: 2, item: "Backend APIs tested", completed: true, critical: true },
        { id: 3, item: "Frontend pages functional", completed: true, critical: true },
        { id: 4, item: "Authentication working", completed: true, critical: true },
        { id: 5, item: "KAIA Engine integrated", completed: true, critical: true },
        { id: 6, item: "Simulation system tested", completed: true, critical: true },
        { id: 7, item: "Performance optimization", completed: true, critical: false },
        { id: 8, item: "Security audit", completed: true, critical: true },
      ],
      business: [
        { id: 1, item: "Business model validated", completed: true, critical: true },
        { id: 2, item: "Pricing strategy defined", completed: true, critical: true },
        { id: 3, item: "Target market identified", completed: true, critical: true },
        { id: 4, item: "Marketing materials ready", completed: true, critical: false },
        { id: 5, item: "Sales process documented", completed: true, critical: true },
        { id: 6, item: "Customer support ready", completed: true, critical: true },
      ],
      operations: [
        { id: 1, item: "Team roles defined", completed: true, critical: true },
        { id: 2, item: "Processes documented", completed: true, critical: true },
        { id: 3, item: "Suppliers confirmed", completed: true, critical: true },
        { id: 4, item: "Inventory system ready", completed: true, critical: true },
        { id: 5, item: "Shipping partners integrated", completed: true, critical: true },
        { id: 6, item: "Quality control process", completed: true, critical: true },
      ],
      legal: [
        { id: 1, item: "Company registration", completed: true, critical: true },
        { id: 2, item: "Terms of service", completed: true, critical: true },
        { id: 3, item: "Privacy policy", completed: true, critical: true },
        { id: 4, item: "Tax compliance", completed: true, critical: true },
        { id: 5, item: "Insurance coverage", completed: false, critical: false },
      ],
    };

    // Calculate completion
    const allItems = [
      ...checklist.technical,
      ...checklist.business,
      ...checklist.operations,
      ...checklist.legal,
    ];
    const completedItems = allItems.filter((item) => item.completed).length;
    const totalItems = allItems.length;
    const completionRate = (completedItems / totalItems) * 100;

    const criticalItems = allItems.filter((item) => item.critical);
    const completedCritical = criticalItems.filter((item) => item.completed).length;
    const criticalCompletionRate = (completedCritical / criticalItems.length) * 100;

    return {
      checklist,
      summary: {
        totalItems,
        completedItems,
        completionRate,
        criticalItems: criticalItems.length,
        completedCritical,
        criticalCompletionRate,
        readyToLaunch: criticalCompletionRate === 100,
      },
    };
  }),

  /**
   * Get Growth Strategy
   * Returns growth milestones and KPIs
   */
  getGrowthStrategy: protectedProcedure.query(async () => {
    return {
      vision: "Become the leading AI-powered business management platform in MENA region",
      mission: "Empower businesses with intelligent automation and data-driven insights",
      milestones: [
        {
          id: 1,
          phase: "Launch (Month 1)",
          goals: [
            "Soft launch with 10 beta customers",
            "Achieve 90% system uptime",
            "Collect user feedback",
            "Revenue: 50,000 EGP",
          ],
          kpis: {
            customers: 10,
            revenue: 50000,
            uptime: 90,
            satisfaction: 80,
          },
          status: "in_progress",
        },
        {
          id: 2,
          phase: "Growth (Month 2-3)",
          goals: [
            "Expand to 50 customers",
            "Launch marketing campaigns",
            "Optimize operations",
            "Revenue: 250,000 EGP",
          ],
          kpis: {
            customers: 50,
            revenue: 250000,
            uptime: 95,
            satisfaction: 85,
          },
          status: "pending",
        },
        {
          id: 3,
          phase: "Scale (Month 4-6)",
          goals: [
            "Reach 200 customers",
            "Expand team",
            "Enter new markets",
            "Revenue: 1,000,000 EGP",
          ],
          kpis: {
            customers: 200,
            revenue: 1000000,
            uptime: 99,
            satisfaction: 90,
          },
          status: "pending",
        },
        {
          id: 4,
          phase: "Expansion (Month 7-12)",
          goals: [
            "Reach 1,000 customers",
            "Launch new products",
            "Regional expansion",
            "Revenue: 5,000,000 EGP",
          ],
          kpis: {
            customers: 1000,
            revenue: 5000000,
            uptime: 99.9,
            satisfaction: 95,
          },
          status: "pending",
        },
      ],
      strategies: [
        {
          area: "Customer Acquisition",
          tactics: [
            "Content marketing and SEO",
            "Social media advertising",
            "Partnership with business associations",
            "Referral program",
          ],
        },
        {
          area: "Product Development",
          tactics: [
            "Regular feature updates",
            "User feedback integration",
            "AI model improvements",
            "Mobile app development",
          ],
        },
        {
          area: "Operations",
          tactics: [
            "Process automation",
            "Team expansion",
            "Infrastructure scaling",
            "Quality assurance",
          ],
        },
        {
          area: "Financial",
          tactics: [
            "Cost optimization",
            "Revenue diversification",
            "Investor relations",
            "Cash flow management",
          ],
        },
      ],
    };
  }),

  /**
   * Update Launch Progress
   * Track progress on launch checklist items
   */
  updateLaunchProgress: protectedProcedure
    .input(
      z.object({
        category: z.enum(["technical", "business", "operations", "legal"]),
        itemId: z.number(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, this would update the database
      return {
        success: true,
        message: "Launch progress updated",
        category: input.category,
        itemId: input.itemId,
        completed: input.completed,
      };
    }),

  /**
   * Get Launch Timeline
   * Returns the launch timeline with key dates
   */
  getLaunchTimeline: publicProcedure.query(async () => {
    const today = new Date();
    const launchDate = new Date("2026-01-01");

    return {
      currentDate: today.toISOString().split("T")[0],
      launchDate: launchDate.toISOString().split("T")[0],
      daysUntilLaunch: Math.ceil((launchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      timeline: [
        {
          phase: "Pre-Launch",
          startDate: "2025-12-15",
          endDate: "2025-12-31",
          status: "in_progress",
          milestones: [
            { date: "2025-12-20", item: "System testing complete", status: "completed" },
            { date: "2025-12-25", item: "Beta testing with 5 customers", status: "completed" },
            { date: "2025-12-29", item: "Final system review", status: "in_progress" },
            { date: "2025-12-31", item: "Launch preparation complete", status: "pending" },
          ],
        },
        {
          phase: "Launch",
          startDate: "2026-01-01",
          endDate: "2026-01-15",
          status: "pending",
          milestones: [
            { date: "2026-01-01", item: "Soft launch (5% traffic)", status: "pending" },
            { date: "2026-01-05", item: "Expand to 25% traffic", status: "pending" },
            { date: "2026-01-10", item: "Expand to 50% traffic", status: "pending" },
            { date: "2026-01-15", item: "Full launch (100% traffic)", status: "pending" },
          ],
        },
        {
          phase: "Post-Launch",
          startDate: "2026-01-16",
          endDate: "2026-01-31",
          status: "pending",
          milestones: [
            { date: "2026-01-20", item: "First week review", status: "pending" },
            { date: "2026-01-25", item: "Optimization based on feedback", status: "pending" },
            { date: "2026-01-31", item: "Month 1 milestone review", status: "pending" },
          ],
        },
      ],
    };
  }),
});

/**
 * Parse Launch Plan content into structured sections
 */
function parseLaunchPlan(content: string): any[] {
  const sections: any[] = [];
  const lines = content.split("\n");

  let currentSection: any = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace("## ", "").trim(),
        content: [],
      };
    } else if (currentSection && line.trim()) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Parse 90-Day Plan content into structured phases
 */
function parse90DayPlan(content: string): any[] {
  const phases: any[] = [];
  const lines = content.split("\n");

  let currentPhase: any = null;

  for (const line of lines) {
    if (line.startsWith("### ") && line.includes("Day")) {
      if (currentPhase) {
        phases.push(currentPhase);
      }
      currentPhase = {
        title: line.replace("### ", "").trim(),
        tasks: [],
      };
    } else if (currentPhase && line.trim().startsWith("-")) {
      currentPhase.tasks.push(line.replace(/^-\s*/, "").trim());
    }
  }

  if (currentPhase) {
    phases.push(currentPhase);
  }

  return phases;
}
