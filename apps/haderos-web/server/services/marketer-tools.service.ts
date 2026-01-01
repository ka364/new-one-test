/**
 * Marketer Tools Service
 * خدمة أدوات المسوقين
 *
 * Provides:
 * 1. Ad campaign templates
 * 2. Marketing materials (images, videos, text)
 * 3. Content generation with AI
 * 4. Social media post templates
 */

import { db } from "../db";
import {
  marketerAccounts,
  adCampaignTemplates,
  marketingMaterials,
  marketerLeads,
  marketerAnalytics,
  DEFAULT_AD_TEMPLATES
} from "../../drizzle/schema-marketer-tools";
import { products } from "../../drizzle/schema";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";

export interface GenerateAdContentInput {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'google' | 'snapchat';
  campaignType: 'awareness' | 'consideration' | 'conversion' | 'traffic' | 'lead_generation';
  productId?: number;
  productName?: string;
  productDescription?: string;
  targetAudience?: string;
  language?: 'en' | 'ar' | 'both';
  tone?: 'professional' | 'casual' | 'urgent' | 'friendly';
}

export interface SocialMediaPost {
  platform: string;
  content: string;
  contentAr?: string;
  hashtags: string[];
  callToAction: string;
  callToActionAr?: string;
  imageSpecs?: {
    width: number;
    height: number;
    aspectRatio: string;
  };
}

export class MarketerToolsService {

  /**
   * Get ad templates for marketer
   */
  async getAdTemplates(marketerId: number, filters?: {
    platform?: string;
    campaignType?: string;
  }) {
    // Get marketer tier
    const [marketer] = await db.select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (!marketer) {
      throw new Error("Marketer not found");
    }

    const tierOrder = ["bronze", "silver", "gold", "platinum", "diamond"];
    const marketerTierIndex = tierOrder.indexOf(marketer.tier || "bronze");

    // Filter templates by tier and other criteria
    let templates = DEFAULT_AD_TEMPLATES.filter(template => {
      const templateTierIndex = tierOrder.indexOf("bronze"); // All default templates are bronze
      return marketerTierIndex >= templateTierIndex;
    });

    if (filters?.platform) {
      templates = templates.filter(t => t.platform === filters.platform);
    }

    if (filters?.campaignType) {
      templates = templates.filter(t => t.campaignType === filters.campaignType);
    }

    return templates;
  }

  /**
   * Get marketing materials for marketer
   */
  async getMarketingMaterials(marketerId: number, filters?: {
    type?: string;
    category?: string;
    platform?: string;
  }) {
    const [marketer] = await db.select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (!marketer) {
      throw new Error("Marketer not found");
    }

    let query = db.select()
      .from(marketingMaterials)
      .where(eq(marketingMaterials.isActive, true));

    // Additional filters would be applied here
    // For now, return all active materials

    return await query;
  }

  /**
   * Generate personalized ad content
   */
  async generateAdContent(marketerId: number, input: GenerateAdContentInput): Promise<{
    headlines: string[];
    headlinesAr: string[];
    descriptions: string[];
    descriptionsAr: string[];
    callToActions: string[];
    callToActionsAr: string[];
    tips: string[];
    tipsAr: string[];
  }> {
    const [marketer] = await db.select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (!marketer) {
      throw new Error("Marketer not found");
    }

    // Get product info if provided
    let product: any = null;
    if (input.productId) {
      const [p] = await db.select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);
      product = p;
    }

    const productName = input.productName || product?.modelCode || "Our Product";
    const productDesc = input.productDescription || "High quality product from factory";

    // Generate content based on platform and type
    const content = this.buildAdContent(input, productName, productDesc, marketer.code);

    return content;
  }

  /**
   * Build ad content (non-AI version for now)
   */
  private buildAdContent(
    input: GenerateAdContentInput,
    productName: string,
    productDesc: string,
    marketerCode: string
  ) {
    const baseUrl = `https://haderos.com?ref=${marketerCode}`;

    // Platform-specific templates
    const templates: Record<string, any> = {
      facebook: {
        headlines: [
          `🔥 ${productName} - Limited Stock!`,
          `✨ Get ${productName} Today!`,
          `💯 Premium Quality ${productName}`,
          `🎁 Special Offer on ${productName}`
        ],
        headlinesAr: [
          `🔥 ${productName} - كمية محدودة!`,
          `✨ احصل على ${productName} اليوم!`,
          `💯 ${productName} جودة متميزة`,
          `🎁 عرض خاص على ${productName}`
        ],
        descriptions: [
          `${productDesc}. Factory direct prices. Order now!`,
          `High quality, fast shipping, best prices. ${productDesc}`,
          `Don't miss this amazing offer! ${productDesc}`
        ],
        descriptionsAr: [
          `${productDesc}. أسعار المصنع مباشرة. اطلب الآن!`,
          `جودة عالية، شحن سريع، أفضل الأسعار. ${productDesc}`,
          `لا تفوت هذا العرض الرائع! ${productDesc}`
        ],
        callToActions: ["Shop Now", "Learn More", "Get Offer"],
        callToActionsAr: ["تسوق الآن", "اعرف المزيد", "احصل على العرض"],
        tips: [
          "Use video content for higher engagement",
          "Target similar audiences to your existing customers",
          "Test multiple headlines to find the best performer"
        ],
        tipsAr: [
          "استخدم محتوى الفيديو لتفاعل أعلى",
          "استهدف جماهير مشابهة لعملائك الحاليين",
          "اختبر عناوين متعددة للعثور على الأفضل"
        ]
      },
      instagram: {
        headlines: [
          `✨ NEW: ${productName}`,
          `🛍️ ${productName}`,
          `💫 ${productName}`
        ],
        headlinesAr: [
          `✨ جديد: ${productName}`,
          `🛍️ ${productName}`,
          `💫 ${productName}`
        ],
        descriptions: [
          `${productDesc}\n\n📦 Fast shipping\n💰 Best prices\n\nLink in bio 👆`,
          `${productDesc}\n\nDM for details or tap the link! 💬`
        ],
        descriptionsAr: [
          `${productDesc}\n\n📦 شحن سريع\n💰 أفضل الأسعار\n\nالرابط في البايو 👆`,
          `${productDesc}\n\nراسلنا للتفاصيل أو اضغط الرابط! 💬`
        ],
        callToActions: ["Swipe Up", "Shop in Bio", "DM to Order"],
        callToActionsAr: ["اسحب للأعلى", "تسوق من البايو", "راسلنا للطلب"],
        tips: [
          "Use 9:16 aspect ratio for Stories",
          "Include user-generated content",
          "Post during peak hours (7-9 PM)"
        ],
        tipsAr: [
          "استخدم نسبة 9:16 للستوريز",
          "ضمّن محتوى من العملاء",
          "انشر في أوقات الذروة (7-9 مساءً)"
        ]
      },
      tiktok: {
        headlines: [
          `This ${productName} is going viral! 🔥`,
          `Wait for it... ${productName} 👀`,
          `${productName} check! ✅`
        ],
        headlinesAr: [
          `${productName} ينتشر بسرعة! 🔥`,
          `شوف... ${productName} 👀`,
          `${productName} تشيك! ✅`
        ],
        descriptions: [
          `#fyp #viral | ${productDesc} | Link in bio!`,
          `Factory direct 🏭 | Best quality 💯 | ${productName}`
        ],
        descriptionsAr: [
          `#fyp #viral | ${productDesc} | الرابط في البايو!`,
          `من المصنع مباشرة 🏭 | أفضل جودة 💯 | ${productName}`
        ],
        callToActions: ["Link in Bio", "Comment for Link", "Follow for More"],
        callToActionsAr: ["الرابط في البايو", "علق للرابط", "تابعنا للمزيد"],
        tips: [
          "First 3 seconds are crucial - hook viewers immediately",
          "Use trending sounds",
          "Keep videos under 60 seconds for best engagement"
        ],
        tipsAr: [
          "أول 3 ثواني مهمة جداً - اجذب المشاهدين فوراً",
          "استخدم الأصوات الرائجة",
          "اجعل الفيديو أقل من 60 ثانية للتفاعل الأفضل"
        ]
      },
      google: {
        headlines: [
          `${productName} - Factory Direct Prices`,
          `Buy ${productName} - Free Shipping`,
          `${productName} - Premium Quality`
        ],
        headlinesAr: [
          `${productName} - أسعار المصنع`,
          `اشتري ${productName} - شحن مجاني`,
          `${productName} - جودة متميزة`
        ],
        descriptions: [
          `${productDesc}. Shop now at factory prices. Fast delivery.`,
          `High-quality ${productName}. Best prices guaranteed. Order today.`
        ],
        descriptionsAr: [
          `${productDesc}. تسوق الآن بأسعار المصنع. توصيل سريع.`,
          `${productName} عالي الجودة. أفضل الأسعار مضمونة. اطلب اليوم.`
        ],
        callToActions: ["Shop Now", "Get Quote", "Learn More"],
        callToActionsAr: ["تسوق الآن", "احصل على عرض", "اعرف المزيد"],
        tips: [
          "Include keywords in headlines",
          "Use ad extensions for better visibility",
          "Set up conversion tracking"
        ],
        tipsAr: [
          "ضمّن الكلمات المفتاحية في العناوين",
          "استخدم إضافات الإعلانات لظهور أفضل",
          "قم بإعداد تتبع التحويلات"
        ]
      },
      snapchat: {
        headlines: [
          `👻 ${productName}`,
          `🔥 New: ${productName}`
        ],
        headlinesAr: [
          `👻 ${productName}`,
          `🔥 جديد: ${productName}`
        ],
        descriptions: [
          `${productDesc} 🛒 Swipe up!`,
          `Don't miss it! ${productDesc}`
        ],
        descriptionsAr: [
          `${productDesc} 🛒 اسحب للأعلى!`,
          `لا تفوتها! ${productDesc}`
        ],
        callToActions: ["Swipe Up", "Try Now"],
        callToActionsAr: ["اسحب للأعلى", "جرب الآن"],
        tips: [
          "Use vertical video (9:16)",
          "Keep it fun and casual",
          "Use Snapchat's AR filters when relevant"
        ],
        tipsAr: [
          "استخدم فيديو عمودي (9:16)",
          "اجعله ممتعاً وعفوياً",
          "استخدم فلاتر سناب شات عند الحاجة"
        ]
      }
    };

    return templates[input.platform] || templates.facebook;
  }

  /**
   * Generate social media posts
   */
  async generateSocialMediaPosts(marketerId: number, options: {
    productId?: number;
    platforms: string[];
    includeHashtags?: boolean;
  }): Promise<SocialMediaPost[]> {
    const [marketer] = await db.select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (!marketer) {
      throw new Error("Marketer not found");
    }

    let product: any = null;
    if (options.productId) {
      const [p] = await db.select()
        .from(products)
        .where(eq(products.id, options.productId))
        .limit(1);
      product = p;
    }

    const productName = product?.modelCode || "Amazing Product";
    const referralLink = `https://haderos.com?ref=${marketer.code}`;

    const posts: SocialMediaPost[] = [];

    for (const platform of options.platforms) {
      const post = this.generatePostForPlatform(platform, productName, referralLink, options.includeHashtags);
      posts.push(post);
    }

    return posts;
  }

  /**
   * Generate post for specific platform
   */
  private generatePostForPlatform(
    platform: string,
    productName: string,
    referralLink: string,
    includeHashtags: boolean = true
  ): SocialMediaPost {
    const platformConfigs: Record<string, SocialMediaPost> = {
      facebook: {
        platform: "facebook",
        content: `🔥 Check out this amazing ${productName}!\n\nHigh quality, factory direct prices. Order now and get fast shipping!\n\n👉 ${referralLink}`,
        contentAr: `🔥 شاهد ${productName} الرائع!\n\nجودة عالية، أسعار المصنع مباشرة. اطلب الآن واحصل على شحن سريع!\n\n👉 ${referralLink}`,
        hashtags: includeHashtags ? ["#Shopping", "#Quality", "#FactoryDirect", "#تسوق", "#جودة", "#مصنع"] : [],
        callToAction: "Shop Now",
        callToActionAr: "تسوق الآن",
        imageSpecs: { width: 1200, height: 628, aspectRatio: "1.91:1" }
      },
      instagram: {
        platform: "instagram",
        content: `✨ ${productName} ✨\n\nFactory direct | Best quality | Fast shipping\n\n📦 Link in bio!\n\n${includeHashtags ? "#fashion #quality #shopping #style #trendy" : ""}`,
        contentAr: `✨ ${productName} ✨\n\nمن المصنع | أفضل جودة | شحن سريع\n\n📦 الرابط في البايو!\n\n${includeHashtags ? "#موضة #جودة #تسوق #ستايل #ترند" : ""}`,
        hashtags: includeHashtags ? ["#fashion", "#quality", "#shopping", "#style", "#موضة", "#جودة"] : [],
        callToAction: "Link in Bio",
        callToActionAr: "الرابط في البايو",
        imageSpecs: { width: 1080, height: 1080, aspectRatio: "1:1" }
      },
      tiktok: {
        platform: "tiktok",
        content: `This ${productName} is 🔥🔥🔥\n\nFactory direct = Best prices 💰\n\nLink in bio! 👆\n\n${includeHashtags ? "#fyp #viral #shopping #trending" : ""}`,
        contentAr: `${productName} ده 🔥🔥🔥\n\nمن المصنع = أفضل سعر 💰\n\nالرابط في البايو! 👆\n\n${includeHashtags ? "#fyp #viral #تسوق #ترند" : ""}`,
        hashtags: includeHashtags ? ["#fyp", "#viral", "#shopping", "#trending"] : [],
        callToAction: "Check Link in Bio",
        callToActionAr: "شوف الرابط في البايو",
        imageSpecs: { width: 1080, height: 1920, aspectRatio: "9:16" }
      },
      whatsapp: {
        platform: "whatsapp",
        content: `مرحباً! 👋\n\nأنا ${productName} الرائع متوفر الآن!\n\n✅ جودة عالية\n✅ أسعار المصنع\n✅ شحن سريع\n\n🔗 للطلب: ${referralLink}\n\nلو عندك استفسار راسلني! 😊`,
        contentAr: `مرحباً! 👋\n\nمنتج ${productName} الرائع متوفر الآن!\n\n✅ جودة عالية\n✅ أسعار المصنع\n✅ شحن سريع\n\n🔗 للطلب: ${referralLink}\n\nلو عندك استفسار راسلني! 😊`,
        hashtags: [],
        callToAction: "Order Now",
        callToActionAr: "اطلب الآن"
      }
    };

    return platformConfigs[platform] || platformConfigs.facebook;
  }

  /**
   * Track lead from marketer
   */
  async trackLead(marketerId: number, leadData: {
    name?: string;
    phone?: string;
    email?: string;
    sourceType: string;
    sourceId?: number;
    message?: string;
    productInterest?: number[];
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }) {
    const [lead] = await db.insert(marketerLeads)
      .values({
        marketerId,
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        sourceType: leadData.sourceType,
        sourceId: leadData.sourceId,
        message: leadData.message,
        productInterest: leadData.productInterest || [],
        utmSource: leadData.utmSource,
        utmMedium: leadData.utmMedium,
        utmCampaign: leadData.utmCampaign,
        ipAddress: leadData.ipAddress,
        userAgent: leadData.userAgent,
        referrer: leadData.referrer,
        status: "new"
      })
      .returning();

    // Update marketer stats
    await db.update(marketerAccounts)
      .set({
        totalLeads: sql`${marketerAccounts.totalLeads} + 1`,
        updatedAt: new Date()
      })
      .where(eq(marketerAccounts.id, marketerId));

    console.log(`📋 New lead tracked for marketer ${marketerId}`);
    return lead;
  }

  /**
   * Get marketer leads
   */
  async getMarketerLeads(marketerId: number, options?: {
    status?: string;
    limit?: number;
    offset?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    let conditions = [eq(marketerLeads.marketerId, marketerId)];

    if (options?.status) {
      conditions.push(eq(marketerLeads.status, options.status));
    }

    if (options?.dateFrom) {
      conditions.push(gte(marketerLeads.createdAt, options.dateFrom));
    }

    if (options?.dateTo) {
      conditions.push(lte(marketerLeads.createdAt, options.dateTo));
    }

    let query = db.select()
      .from(marketerLeads)
      .where(and(...conditions))
      .orderBy(desc(marketerLeads.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(leadId: number, marketerId: number, status: string, notes?: string) {
    const [updated] = await db.update(marketerLeads)
      .set({
        status,
        notes,
        updatedAt: new Date()
      })
      .where(and(
        eq(marketerLeads.id, leadId),
        eq(marketerLeads.marketerId, marketerId)
      ))
      .returning();

    if (!updated) {
      throw new Error("Lead not found");
    }

    return updated;
  }

  /**
   * Convert lead to order
   */
  async convertLead(leadId: number, marketerId: number, orderId: number) {
    const [converted] = await db.update(marketerLeads)
      .set({
        status: "converted",
        convertedToOrderId: orderId,
        convertedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(marketerLeads.id, leadId),
        eq(marketerLeads.marketerId, marketerId)
      ))
      .returning();

    if (!converted) {
      throw new Error("Lead not found");
    }

    return converted;
  }

  /**
   * Get marketer dashboard stats
   */
  async getMarketerDashboardStats(marketerId: number) {
    const [marketer] = await db.select()
      .from(marketerAccounts)
      .where(eq(marketerAccounts.id, marketerId))
      .limit(1);

    if (!marketer) {
      throw new Error("Marketer not found");
    }

    // Get leads count by status
    const leadsStats = await db.select({
      status: marketerLeads.status,
      count: sql<number>`count(*)`
    })
      .from(marketerLeads)
      .where(eq(marketerLeads.marketerId, marketerId))
      .groupBy(marketerLeads.status);

    const leadsMap: Record<string, number> = {};
    for (const stat of leadsStats) {
      leadsMap[stat.status] = Number(stat.count);
    }

    return {
      tier: marketer.tier,
      commissionRate: marketer.commissionRate,
      totalSales: marketer.totalSales,
      totalCommission: marketer.totalCommission,
      pendingCommission: marketer.pendingCommission,
      paidCommission: marketer.paidCommission,
      totalOrders: marketer.totalOrders,
      totalLeads: marketer.totalLeads,
      conversionRate: marketer.conversionRate,
      leads: {
        new: leadsMap.new || 0,
        contacted: leadsMap.contacted || 0,
        interested: leadsMap.interested || 0,
        converted: leadsMap.converted || 0,
        lost: leadsMap.lost || 0
      },
      capabilities: {
        canCreateLandingPages: marketer.canCreateLandingPages,
        canCreateWebsites: marketer.canCreateWebsites,
        canConnectShopify: marketer.canConnectShopify,
        canAccessAdTemplates: marketer.canAccessAdTemplates,
        canUseAITools: marketer.canUseAITools,
        maxLandingPages: marketer.maxLandingPages,
        maxWebsites: marketer.maxWebsites
      }
    };
  }
}

// Singleton instance
let service: MarketerToolsService | null = null;

export function getMarketerToolsService(): MarketerToolsService {
  if (!service) {
    service = new MarketerToolsService();
  }
  return service;
}
