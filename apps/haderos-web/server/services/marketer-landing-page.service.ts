/**
 * Marketer Landing Page Builder Service
 * خدمة منشئ صفحات الهبوط للمسوقين
 */

import { db } from "../db";
import {
  marketerAccounts,
  marketerLandingPages,
  landingPageTemplates,
  marketerLeads,
  marketerAnalytics,
  DEFAULT_LANDING_PAGE_TEMPLATES
} from "../../drizzle/schema-marketer-tools";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";

export interface CreateLandingPageInput {
  marketerId: number;
  templateId: string;
  title: string;
  titleAr?: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
}

export interface UpdateLandingPageInput {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  content?: any;
  design?: any;
  productIds?: number[];
  showPricing?: boolean;
  showInventory?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  facebookPixelId?: string;
  googleAnalyticsId?: string;
  tiktokPixelId?: string;
  customTrackingCode?: string;
  customDomain?: string;
}

export class MarketerLandingPageService {

  /**
   * Check if marketer can create more landing pages
   */
  async canCreateLandingPage(marketerId: number): Promise<{ canCreate: boolean; reason?: string }> {
    const marketer = await db.select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (marketer.length === 0) {
      return { canCreate: false, reason: "Marketer not found" };
    }

    const m = marketer[0];

    if (!m.canCreateLandingPages) {
      return { canCreate: false, reason: "Landing page creation is disabled for your account" };
    }

    if (m.status !== "active") {
      return { canCreate: false, reason: "Your account is not active" };
    }

    // Count existing landing pages
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(marketerLandingPages)
      .where(eq(marketerLandingPages.marketerId, marketerId));

    const currentCount = Number(countResult[0]?.count || 0);
    const maxPages = m.maxLandingPages || 5;

    if (maxPages !== -1 && currentCount >= maxPages) {
      return {
        canCreate: false,
        reason: `You've reached your limit of ${maxPages} landing pages. Upgrade your tier to create more.`
      };
    }

    return { canCreate: true };
  }

  /**
   * Generate unique slug
   */
  async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let finalSlug = slug;
    let counter = 1;

    while (true) {
      const existing = await db.select({ id: marketerLandingPages.id })
        .from(marketerLandingPages)
        .where(eq(marketerLandingPages.slug, finalSlug))
        .limit(1);

      if (existing.length === 0) {
        break;
      }

      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  /**
   * Create a new landing page
   */
  async createLandingPage(input: CreateLandingPageInput) {
    // Check if marketer can create
    const canCreate = await this.canCreateLandingPage(input.marketerId);
    if (!canCreate.canCreate) {
      throw new Error(canCreate.reason);
    }

    // Generate unique slug
    const slug = await this.generateUniqueSlug(input.slug);

    // Get template defaults
    const template = DEFAULT_LANDING_PAGE_TEMPLATES.find(t => t.id === input.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check tier requirement
    const marketer = await db.select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, input.marketerId))
      .limit(1);

    const tierOrder = ["bronze", "silver", "gold", "platinum", "diamond"];
    const marketerTierIndex = tierOrder.indexOf(marketer[0].tier || "bronze");
    const templateTierIndex = tierOrder.indexOf(template.tier || "bronze");

    if (marketerTierIndex < templateTierIndex) {
      throw new Error(`This template requires ${template.tier} tier or higher`);
    }

    // Default content structure
    const defaultContent = {
      hero: {
        headline: input.title,
        headlineAr: input.titleAr || input.title,
        subheadline: input.description || "",
        subheadlineAr: input.descriptionAr || input.description || "",
        ctaText: "Order Now",
        ctaTextAr: "اطلب الآن",
        ctaLink: "#order",
        backgroundImage: "",
        backgroundVideo: ""
      },
      sections: [] as any[],
      footer: {
        text: "Powered by Haderos",
        textAr: "مدعوم من هاديروس",
        links: []
      }
    };

    // Default design
    const defaultDesign = {
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      accentColor: "#f59e0b",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      fontFamily: "Inter, sans-serif",
      fontFamilyAr: "Cairo, sans-serif",
      buttonStyle: "rounded" as const,
      direction: "ltr" as const
    };

    // Create landing page
    const [landingPage] = await db.insert(marketerLandingPages)
      .values({
        marketerId: input.marketerId,
        slug,
        title: input.title,
        titleAr: input.titleAr,
        description: input.description,
        descriptionAr: input.descriptionAr,
        templateId: input.templateId,
        content: defaultContent,
        design: defaultDesign,
        status: "draft"
      })
      .returning();

    console.log(`✅ Created landing page: ${landingPage.slug} for marketer ${input.marketerId}`);
    return landingPage;
  }

  /**
   * Update landing page
   */
  async updateLandingPage(id: number, marketerId: number, input: UpdateLandingPageInput) {
    // Verify ownership
    const existing = await db.select()
      .from(marketerLandingPages)
      .where(and(
        eq(marketerLandingPages.id, id),
        eq(marketerLandingPages.marketerId, marketerId)
      ))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Landing page not found or you don't have permission");
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.titleAr !== undefined) updateData.titleAr = input.titleAr;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.descriptionAr !== undefined) updateData.descriptionAr = input.descriptionAr;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.design !== undefined) updateData.design = input.design;
    if (input.productIds !== undefined) updateData.productIds = input.productIds;
    if (input.showPricing !== undefined) updateData.showPricing = input.showPricing;
    if (input.showInventory !== undefined) updateData.showInventory = input.showInventory;
    if (input.metaTitle !== undefined) updateData.metaTitle = input.metaTitle;
    if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription;
    if (input.metaKeywords !== undefined) updateData.metaKeywords = input.metaKeywords;
    if (input.ogImage !== undefined) updateData.ogImage = input.ogImage;
    if (input.facebookPixelId !== undefined) updateData.facebookPixelId = input.facebookPixelId;
    if (input.googleAnalyticsId !== undefined) updateData.googleAnalyticsId = input.googleAnalyticsId;
    if (input.tiktokPixelId !== undefined) updateData.tiktokPixelId = input.tiktokPixelId;
    if (input.customTrackingCode !== undefined) updateData.customTrackingCode = input.customTrackingCode;
    if (input.customDomain !== undefined) updateData.customDomain = input.customDomain;

    const [updated] = await db.update(marketerLandingPages)
      .set(updateData)
      .where(eq(marketerLandingPages.id, id))
      .returning();

    console.log(`✅ Updated landing page: ${updated.slug}`);
    return updated;
  }

  /**
   * Publish landing page
   */
  async publishLandingPage(id: number, marketerId: number) {
    // Verify ownership
    const existing = await db.select()
      .from(marketerLandingPages)
      .where(and(
        eq(marketerLandingPages.id, id),
        eq(marketerLandingPages.marketerId, marketerId)
      ))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Landing page not found or you don't have permission");
    }

    // Validate content before publishing
    const page = existing[0];
    if (!page.content || !page.title) {
      throw new Error("Landing page must have title and content before publishing");
    }

    const [published] = await db.update(marketerLandingPages)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(marketerLandingPages.id, id))
      .returning();

    console.log(`🚀 Published landing page: ${published.slug}`);
    return published;
  }

  /**
   * Unpublish landing page
   */
  async unpublishLandingPage(id: number, marketerId: number) {
    const [paused] = await db.update(marketerLandingPages)
      .set({
        status: "paused",
        updatedAt: new Date()
      })
      .where(and(
        eq(marketerLandingPages.id, id),
        eq(marketerLandingPages.marketerId, marketerId)
      ))
      .returning();

    if (!paused) {
      throw new Error("Landing page not found or you don't have permission");
    }

    return paused;
  }

  /**
   * Delete landing page
   */
  async deleteLandingPage(id: number, marketerId: number) {
    const [archived] = await db.update(marketerLandingPages)
      .set({
        status: "archived",
        updatedAt: new Date()
      })
      .where(and(
        eq(marketerLandingPages.id, id),
        eq(marketerLandingPages.marketerId, marketerId)
      ))
      .returning();

    if (!archived) {
      throw new Error("Landing page not found or you don't have permission");
    }

    console.log(`🗑️ Archived landing page: ${archived.slug}`);
    return archived;
  }

  /**
   * Get landing page by slug (public)
   */
  async getLandingPageBySlug(slug: string) {
    const [page] = await db.select()
      .from(marketerLandingPages)
      .where(and(
        eq(marketerLandingPages.slug, slug),
        eq(marketerLandingPages.status, "published")
      ))
      .limit(1);

    if (!page) {
      return null;
    }

    // Increment view count
    await db.update(marketerLandingPages)
      .set({
        views: sql`${marketerLandingPages.views} + 1`
      })
      .where(eq(marketerLandingPages.id, page.id));

    return page;
  }

  /**
   * Get marketer's landing pages
   */
  async getMarketerLandingPages(marketerId: number, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = db.select()
      .from(marketerLandingPages)
      .where(eq(marketerLandingPages.marketerId, marketerId))
      .orderBy(desc(marketerLandingPages.createdAt));

    if (options?.status) {
      query = query.where(and(
        eq(marketerLandingPages.marketerId, marketerId),
        eq(marketerLandingPages.status, options.status)
      ));
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  /**
   * Track click on landing page
   */
  async trackClick(landingPageId: number) {
    await db.update(marketerLandingPages)
      .set({
        clicks: sql`${marketerLandingPages.clicks} + 1`
      })
      .where(eq(marketerLandingPages.id, landingPageId));
  }

  /**
   * Track conversion on landing page
   */
  async trackConversion(landingPageId: number, revenue: number) {
    await db.update(marketerLandingPages)
      .set({
        conversions: sql`${marketerLandingPages.conversions} + 1`,
        revenue: sql`${marketerLandingPages.revenue} + ${revenue}`
      })
      .where(eq(marketerLandingPages.id, landingPageId));
  }

  /**
   * Get landing page analytics
   */
  async getLandingPageAnalytics(id: number, marketerId: number) {
    const [page] = await db.select()
      .from(marketerLandingPages)
      .where(and(
        eq(marketerLandingPages.id, id),
        eq(marketerLandingPages.marketerId, marketerId)
      ))
      .limit(1);

    if (!page) {
      throw new Error("Landing page not found");
    }

    const views = page.views || 0;
    const clicks = page.clicks || 0;
    const conversions = page.conversions || 0;
    const revenue = Number(page.revenue) || 0;

    return {
      views,
      clicks,
      conversions,
      revenue,
      clickRate: views > 0 ? ((clicks / views) * 100).toFixed(2) : "0.00",
      conversionRate: clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : "0.00",
      revenuePerView: views > 0 ? (revenue / views).toFixed(2) : "0.00",
      revenuePerClick: clicks > 0 ? (revenue / clicks).toFixed(2) : "0.00"
    };
  }

  /**
   * Duplicate landing page
   */
  async duplicateLandingPage(id: number, marketerId: number) {
    // Check if can create new page
    const canCreate = await this.canCreateLandingPage(marketerId);
    if (!canCreate.canCreate) {
      throw new Error(canCreate.reason);
    }

    const [original] = await db.select()
      .from(marketerLandingPages)
      .where(and(
        eq(marketerLandingPages.id, id),
        eq(marketerLandingPages.marketerId, marketerId)
      ))
      .limit(1);

    if (!original) {
      throw new Error("Landing page not found");
    }

    const newSlug = await this.generateUniqueSlug(`${original.slug}-copy`);

    const [duplicate] = await db.insert(marketerLandingPages)
      .values({
        marketerId,
        slug: newSlug,
        title: `${original.title} (Copy)`,
        titleAr: original.titleAr ? `${original.titleAr} (نسخة)` : null,
        description: original.description,
        descriptionAr: original.descriptionAr,
        templateId: original.templateId,
        content: original.content,
        design: original.design,
        productIds: original.productIds,
        showPricing: original.showPricing,
        showInventory: original.showInventory,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        status: "draft"
      })
      .returning();

    console.log(`📋 Duplicated landing page: ${original.slug} → ${duplicate.slug}`);
    return duplicate;
  }

  /**
   * Get available templates for marketer
   */
  async getAvailableTemplates(marketerId: number) {
    const [marketer] = await db.select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (!marketer) {
      throw new Error("Marketer not found");
    }

    const tierOrder = ["bronze", "silver", "gold", "platinum", "diamond"];
    const marketerTierIndex = tierOrder.indexOf(marketer.tier || "bronze");

    return DEFAULT_LANDING_PAGE_TEMPLATES.filter(template => {
      const templateTierIndex = tierOrder.indexOf(template.tier || "bronze");
      return marketerTierIndex >= templateTierIndex;
    });
  }
}

// Singleton instance
let service: MarketerLandingPageService | null = null;

export function getMarketerLandingPageService(): MarketerLandingPageService {
  if (!service) {
    service = new MarketerLandingPageService();
  }
  return service;
}
