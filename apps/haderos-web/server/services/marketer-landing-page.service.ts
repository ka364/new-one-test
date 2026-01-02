/**
 * @fileoverview Marketer Landing Page Builder Service
 * خدمة منشئ صفحات الهبوط للمسوقين
 *
 * @description
 * Comprehensive landing page builder for affiliate marketers. Provides template-based
 * page creation, customization, analytics tracking, and conversion optimization.
 * Supports tier-based access control and bilingual content (Arabic/English).
 *
 * منشئ صفحات هبوط شامل للمسوقين بالعمولة. يوفر إنشاء صفحات بناءً على قوالب،
 * تخصيص، تتبع التحليلات، وتحسين التحويلات. يدعم التحكم بالوصول حسب المستوى
 * والمحتوى ثنائي اللغة (عربي/إنجليزي).
 *
 * @module services/marketer-landing-page
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @requires ../db
 * @requires ../../drizzle/schema-marketer-tools
 * @requires drizzle-orm
 *
 * @example
 * ```typescript
 * import { getMarketerLandingPageService } from './marketer-landing-page.service';
 *
 * const service = getMarketerLandingPageService();
 *
 * // Create a landing page
 * const page = await service.createLandingPage({
 *   marketerId: 123,
 *   templateId: 'product-showcase',
 *   title: 'Summer Sale',
 *   titleAr: 'تخفيضات الصيف',
 *   slug: 'summer-sale-2024'
 * });
 *
 * // Publish the page
 * await service.publishLandingPage(page.id, 123);
 *
 * // Get analytics
 * const analytics = await service.getLandingPageAnalytics(page.id, 123);
 * console.log(`Conversion Rate: ${analytics.conversionRate}%`);
 * ```
 */

import { db } from '../db';
import {
  marketerAccounts,
  marketerLandingPages,
  landingPageTemplates,
  marketerLeads,
  marketerAnalytics,
  DEFAULT_LANDING_PAGE_TEMPLATES,
} from '../../drizzle/schema-marketer-tools';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';

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

/**
 * Marketer Landing Page Service Class
 * فئة خدمة صفحات الهبوط للمسوقين
 *
 * @class MarketerLandingPageService
 * @description
 * Provides CRUD operations for marketer landing pages with tier-based access control,
 * template management, analytics tracking, and conversion optimization features.
 *
 * توفر عمليات CRUD لصفحات الهبوط للمسوقين مع التحكم بالوصول حسب المستوى،
 * إدارة القوالب، تتبع التحليلات، وميزات تحسين التحويلات.
 */
export class MarketerLandingPageService {
  /**
   * Check if marketer can create more landing pages
   * التحقق من إمكانية إنشاء صفحات هبوط إضافية
   *
   * @async
   * @param {number} marketerId - Unique identifier of the marketer
   * @returns {Promise<{canCreate: boolean, reason?: string}>} Permission status with optional reason
   *
   * @example
   * ```typescript
   * const check = await service.canCreateLandingPage(123);
   * if (!check.canCreate) {
   *   console.log(`Cannot create: ${check.reason}`);
   * }
   * ```
   */
  async canCreateLandingPage(marketerId: number): Promise<{ canCreate: boolean; reason?: string }> {
    const marketer = await db
      .select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (marketer.length === 0) {
      return { canCreate: false, reason: 'Marketer not found' };
    }

    const m = marketer[0];

    if (!m.canCreateLandingPages) {
      return { canCreate: false, reason: 'Landing page creation is disabled for your account' };
    }

    if (m.status !== 'active') {
      return { canCreate: false, reason: 'Your account is not active' };
    }

    // Count existing landing pages
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(marketerLandingPages)
      .where(eq(marketerLandingPages.marketerId, marketerId));

    const currentCount = Number(countResult[0]?.count || 0);
    const maxPages = m.maxLandingPages || 5;

    if (maxPages !== -1 && currentCount >= maxPages) {
      return {
        canCreate: false,
        reason: `You've reached your limit of ${maxPages} landing pages. Upgrade your tier to create more.`,
      };
    }

    return { canCreate: true };
  }

  /**
   * Generate unique slug
   * إنشاء رابط فريد
   *
   * @async
   * @param {string} baseSlug - Base slug to use
   * @returns {Promise<string>} Unique slug (appends number if collision)
   *
   * @example
   * ```typescript
   * const slug = await service.generateUniqueSlug('summer-sale');
   * // Returns 'summer-sale' or 'summer-sale-2' if collision
   * ```
   */
  async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let finalSlug = slug;
    let counter = 1;

    while (true) {
      const existing = await db
        .select({ id: marketerLandingPages.id })
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
   * إنشاء صفحة هبوط جديدة
   *
   * @async
   * @param {CreateLandingPageInput} input - Landing page creation parameters
   * @param {number} input.marketerId - Marketer ID
   * @param {string} input.templateId - Template ID to use
   * @param {string} input.title - Page title in English
   * @param {string} [input.titleAr] - Page title in Arabic
   * @param {string} input.slug - URL slug for the page
   * @param {string} [input.description] - Page description in English
   * @param {string} [input.descriptionAr] - Page description in Arabic
   * @returns {Promise<LandingPage>} Created landing page record
   *
   * @throws {Error} Cannot create more landing pages (tier limit)
   * @throws {Error} Template not found
   * @throws {Error} Template requires higher tier
   *
   * @example
   * ```typescript
   * const page = await service.createLandingPage({
   *   marketerId: 123,
   *   templateId: 'product-showcase',
   *   title: 'New Product Launch',
   *   titleAr: 'إطلاق منتج جديد',
   *   slug: 'new-product-2024'
   * });
   * ```
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
    const template = DEFAULT_LANDING_PAGE_TEMPLATES.find((t) => t.id === input.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Check tier requirement
    const marketer = await db
      .select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, input.marketerId))
      .limit(1);

    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const marketerTierIndex = tierOrder.indexOf(marketer[0].tier || 'bronze');
    const templateTierIndex = tierOrder.indexOf(template.tier || 'bronze');

    if (marketerTierIndex < templateTierIndex) {
      throw new Error(`This template requires ${template.tier} tier or higher`);
    }

    // Default content structure
    const defaultContent = {
      hero: {
        headline: input.title,
        headlineAr: input.titleAr || input.title,
        subheadline: input.description || '',
        subheadlineAr: input.descriptionAr || input.description || '',
        ctaText: 'Order Now',
        ctaTextAr: 'اطلب الآن',
        ctaLink: '#order',
        backgroundImage: '',
        backgroundVideo: '',
      },
      sections: [] as any[],
      footer: {
        text: 'Powered by Haderos',
        textAr: 'مدعوم من هاديروس',
        links: [],
      },
    };

    // Default design
    const defaultDesign = {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'Inter, sans-serif',
      fontFamilyAr: 'Cairo, sans-serif',
      buttonStyle: 'rounded' as const,
      direction: 'ltr' as const,
    };

    // Create landing page
    const [landingPage] = await db
      .insert(marketerLandingPages)
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
        status: 'draft',
      })
      .returning();

    console.log(`✅ Created landing page: ${landingPage.slug} for marketer ${input.marketerId}`);
    return landingPage;
  }

  /**
   * Update landing page
   * تحديث صفحة الهبوط
   *
   * @async
   * @param {number} id - Landing page ID
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @param {UpdateLandingPageInput} input - Update parameters
   * @returns {Promise<LandingPage>} Updated landing page record
   *
   * @throws {Error} Landing page not found or no permission
   *
   * @example
   * ```typescript
   * const updated = await service.updateLandingPage(456, 123, {
   *   title: 'Updated Title',
   *   facebookPixelId: 'FB-123456'
   * });
   * ```
   */
  async updateLandingPage(id: number, marketerId: number, input: UpdateLandingPageInput) {
    // Verify ownership
    const existing = await db
      .select()
      .from(marketerLandingPages)
      .where(and(eq(marketerLandingPages.id, id), eq(marketerLandingPages.marketerId, marketerId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Landing page not found or you don't have permission");
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
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
    if (input.googleAnalyticsId !== undefined)
      updateData.googleAnalyticsId = input.googleAnalyticsId;
    if (input.tiktokPixelId !== undefined) updateData.tiktokPixelId = input.tiktokPixelId;
    if (input.customTrackingCode !== undefined)
      updateData.customTrackingCode = input.customTrackingCode;
    if (input.customDomain !== undefined) updateData.customDomain = input.customDomain;

    const [updated] = await db
      .update(marketerLandingPages)
      .set(updateData)
      .where(eq(marketerLandingPages.id, id))
      .returning();

    console.log(`✅ Updated landing page: ${updated.slug}`);
    return updated;
  }

  /**
   * Publish landing page
   * نشر صفحة الهبوط
   *
   * @async
   * @param {number} id - Landing page ID
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @returns {Promise<LandingPage>} Published landing page record
   *
   * @throws {Error} Landing page not found or no permission
   * @throws {Error} Must have title and content before publishing
   *
   * @example
   * ```typescript
   * const published = await service.publishLandingPage(456, 123);
   * console.log(`Published at: ${published.publishedAt}`);
   * ```
   */
  async publishLandingPage(id: number, marketerId: number) {
    // Verify ownership
    const existing = await db
      .select()
      .from(marketerLandingPages)
      .where(and(eq(marketerLandingPages.id, id), eq(marketerLandingPages.marketerId, marketerId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Landing page not found or you don't have permission");
    }

    // Validate content before publishing
    const page = existing[0];
    if (!page.content || !page.title) {
      throw new Error('Landing page must have title and content before publishing');
    }

    const [published] = await db
      .update(marketerLandingPages)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(marketerLandingPages.id, id))
      .returning();

    console.log(`🚀 Published landing page: ${published.slug}`);
    return published;
  }

  /**
   * Unpublish landing page
   * إلغاء نشر صفحة الهبوط
   *
   * @async
   * @param {number} id - Landing page ID
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @returns {Promise<LandingPage>} Paused landing page record
   *
   * @throws {Error} Landing page not found or no permission
   */
  async unpublishLandingPage(id: number, marketerId: number) {
    const [paused] = await db
      .update(marketerLandingPages)
      .set({
        status: 'paused',
        updatedAt: new Date(),
      })
      .where(and(eq(marketerLandingPages.id, id), eq(marketerLandingPages.marketerId, marketerId)))
      .returning();

    if (!paused) {
      throw new Error("Landing page not found or you don't have permission");
    }

    return paused;
  }

  /**
   * Delete landing page (archives, does not permanently delete)
   * حذف صفحة الهبوط (أرشفة، ليس حذف دائم)
   *
   * @async
   * @param {number} id - Landing page ID
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @returns {Promise<LandingPage>} Archived landing page record
   *
   * @throws {Error} Landing page not found or no permission
   */
  async deleteLandingPage(id: number, marketerId: number) {
    const [archived] = await db
      .update(marketerLandingPages)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(and(eq(marketerLandingPages.id, id), eq(marketerLandingPages.marketerId, marketerId)))
      .returning();

    if (!archived) {
      throw new Error("Landing page not found or you don't have permission");
    }

    console.log(`🗑️ Archived landing page: ${archived.slug}`);
    return archived;
  }

  /**
   * Get landing page by slug (public endpoint)
   * الحصول على صفحة الهبوط بالرابط (عام)
   *
   * @async
   * @param {string} slug - Landing page URL slug
   * @returns {Promise<LandingPage|null>} Landing page if found and published, null otherwise
   *
   * @description
   * Retrieves a published landing page and increments its view count.
   * This is the public-facing method used when visitors access the page.
   *
   * @example
   * ```typescript
   * const page = await service.getLandingPageBySlug('summer-sale-2024');
   * if (page) {
   *   // Render the page
   * }
   * ```
   */
  async getLandingPageBySlug(slug: string) {
    const [page] = await db
      .select()
      .from(marketerLandingPages)
      .where(and(eq(marketerLandingPages.slug, slug), eq(marketerLandingPages.status, 'published')))
      .limit(1);

    if (!page) {
      return null;
    }

    // Increment view count
    await db
      .update(marketerLandingPages)
      .set({
        views: sql`${marketerLandingPages.views} + 1`,
      })
      .where(eq(marketerLandingPages.id, page.id));

    return page;
  }

  /**
   * Get marketer's landing pages
   * الحصول على صفحات الهبوط للمسوق
   *
   * @async
   * @param {number} marketerId - Unique identifier of the marketer
   * @param {Object} [options] - Query options
   * @param {string} [options.status] - Filter by status (draft, published, paused, archived)
   * @param {number} [options.limit] - Maximum results to return
   * @param {number} [options.offset] - Offset for pagination
   * @returns {Promise<LandingPage[]>} Array of marketer's landing pages
   *
   * @example
   * ```typescript
   * const pages = await service.getMarketerLandingPages(123, {
   *   status: 'published',
   *   limit: 10
   * });
   * ```
   */
  async getMarketerLandingPages(
    marketerId: number,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    let query = db
      .select()
      .from(marketerLandingPages)
      .where(eq(marketerLandingPages.marketerId, marketerId))
      .orderBy(desc(marketerLandingPages.createdAt));

    if (options?.status) {
      query = query.where(
        and(
          eq(marketerLandingPages.marketerId, marketerId),
          eq(marketerLandingPages.status, options.status)
        )
      );
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
   * تتبع النقر على صفحة الهبوط
   *
   * @async
   * @param {number} landingPageId - Landing page ID
   * @returns {Promise<void>}
   */
  async trackClick(landingPageId: number) {
    await db
      .update(marketerLandingPages)
      .set({
        clicks: sql`${marketerLandingPages.clicks} + 1`,
      })
      .where(eq(marketerLandingPages.id, landingPageId));
  }

  /**
   * Track conversion on landing page
   * تتبع التحويل على صفحة الهبوط
   *
   * @async
   * @param {number} landingPageId - Landing page ID
   * @param {number} revenue - Revenue amount from the conversion
   * @returns {Promise<void>}
   */
  async trackConversion(landingPageId: number, revenue: number) {
    await db
      .update(marketerLandingPages)
      .set({
        conversions: sql`${marketerLandingPages.conversions} + 1`,
        revenue: sql`${marketerLandingPages.revenue} + ${revenue}`,
      })
      .where(eq(marketerLandingPages.id, landingPageId));
  }

  /**
   * Get landing page analytics
   * الحصول على تحليلات صفحة الهبوط
   *
   * @async
   * @param {number} id - Landing page ID
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @returns {Promise<Object>} Analytics object with views, clicks, conversions, and rates
   * @returns {number} .views - Total page views
   * @returns {number} .clicks - Total CTA clicks
   * @returns {number} .conversions - Total conversions
   * @returns {number} .revenue - Total revenue generated
   * @returns {string} .clickRate - Click rate percentage
   * @returns {string} .conversionRate - Conversion rate percentage
   * @returns {string} .revenuePerView - Revenue per view
   * @returns {string} .revenuePerClick - Revenue per click
   *
   * @throws {Error} Landing page not found
   *
   * @example
   * ```typescript
   * const analytics = await service.getLandingPageAnalytics(456, 123);
   * console.log(`Views: ${analytics.views}`);
   * console.log(`Conversion Rate: ${analytics.conversionRate}%`);
   * ```
   */
  async getLandingPageAnalytics(id: number, marketerId: number) {
    const [page] = await db
      .select()
      .from(marketerLandingPages)
      .where(and(eq(marketerLandingPages.id, id), eq(marketerLandingPages.marketerId, marketerId)))
      .limit(1);

    if (!page) {
      throw new Error('Landing page not found');
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
      clickRate: views > 0 ? ((clicks / views) * 100).toFixed(2) : '0.00',
      conversionRate: clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : '0.00',
      revenuePerView: views > 0 ? (revenue / views).toFixed(2) : '0.00',
      revenuePerClick: clicks > 0 ? (revenue / clicks).toFixed(2) : '0.00',
    };
  }

  /**
   * Duplicate landing page
   * نسخ صفحة الهبوط
   *
   * @async
   * @param {number} id - Landing page ID to duplicate
   * @param {number} marketerId - Marketer ID (for ownership verification)
   * @returns {Promise<LandingPage>} Newly created duplicate page (as draft)
   *
   * @throws {Error} Cannot create more landing pages (tier limit)
   * @throws {Error} Landing page not found
   *
   * @example
   * ```typescript
   * const copy = await service.duplicateLandingPage(456, 123);
   * console.log(`Created copy: ${copy.slug}`);
   * ```
   */
  async duplicateLandingPage(id: number, marketerId: number) {
    // Check if can create new page
    const canCreate = await this.canCreateLandingPage(marketerId);
    if (!canCreate.canCreate) {
      throw new Error(canCreate.reason);
    }

    const [original] = await db
      .select()
      .from(marketerLandingPages)
      .where(and(eq(marketerLandingPages.id, id), eq(marketerLandingPages.marketerId, marketerId)))
      .limit(1);

    if (!original) {
      throw new Error('Landing page not found');
    }

    const newSlug = await this.generateUniqueSlug(`${original.slug}-copy`);

    const [duplicate] = await db
      .insert(marketerLandingPages)
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
        status: 'draft',
      })
      .returning();

    console.log(`📋 Duplicated landing page: ${original.slug} → ${duplicate.slug}`);
    return duplicate;
  }

  /**
   * Get available templates for marketer
   * الحصول على القوالب المتاحة للمسوق
   *
   * @async
   * @param {number} marketerId - Unique identifier of the marketer
   * @returns {Promise<Template[]>} Array of templates available for marketer's tier
   *
   * @throws {Error} Marketer not found
   *
   * @description
   * Returns templates that the marketer can use based on their tier level.
   * Higher tiers have access to more premium templates.
   *
   * @example
   * ```typescript
   * const templates = await service.getAvailableTemplates(123);
   * templates.forEach(t => console.log(`${t.id}: ${t.name}`));
   * ```
   */
  async getAvailableTemplates(marketerId: number) {
    const [marketer] = await db
      .select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (!marketer) {
      throw new Error('Marketer not found');
    }

    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const marketerTierIndex = tierOrder.indexOf(marketer.tier || 'bronze');

    return DEFAULT_LANDING_PAGE_TEMPLATES.filter((template) => {
      const templateTierIndex = tierOrder.indexOf(template.tier || 'bronze');
      return marketerTierIndex >= templateTierIndex;
    });
  }
}

// Singleton instance
let service: MarketerLandingPageService | null = null;

/**
 * Get singleton instance of MarketerLandingPageService
 * الحصول على نسخة واحدة من خدمة صفحات الهبوط
 *
 * @function getMarketerLandingPageService
 * @returns {MarketerLandingPageService} Singleton service instance
 *
 * @example
 * ```typescript
 * const service = getMarketerLandingPageService();
 * const pages = await service.getMarketerLandingPages(123);
 * ```
 */
export function getMarketerLandingPageService(): MarketerLandingPageService {
  if (!service) {
    service = new MarketerLandingPageService();
  }
  return service;
}
