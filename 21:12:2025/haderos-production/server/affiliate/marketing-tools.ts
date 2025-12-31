/**
 * Marketing Tools for Affiliates
 * أدوات التسويق للمسوقين
 * 
 * This module provides ready-to-use marketing materials for affiliates
 * to promote products effectively.
 */

export interface MarketingAsset {
  id: string;
  type: 'image' | 'video' | 'text' | 'template';
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  url?: string;
  content?: string;
  contentAr?: string;
  thumbnail?: string;
  category: 'product' | 'brand' | 'promotion' | 'social';
  tags: string[];
  downloadCount: number;
  createdAt: Date;
}

export interface SocialMediaTemplate {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'whatsapp';
  platformAr: string;
  templates: Array<{
    id: string;
    title: string;
    titleAr: string;
    content: string;
    contentAr: string;
    hashtags: string[];
    emoji: string;
  }>;
}

/**
 * Marketing Tools Manager
 */
export class MarketingToolsManager {
  private assets: Map<string, MarketingAsset> = new Map();

  constructor() {
    this.initializeDefaultAssets();
  }

  /**
   * Initialize default marketing assets
   */
  private initializeDefaultAssets(): void {
    // Sample text templates
    const textTemplates: MarketingAsset[] = [
      {
        id: 'TEXT001',
        type: 'text',
        title: 'Product Announcement',
        titleAr: 'إعلان منتج',
        content: 'Check out our amazing new product! Order now and get 10% off with my link!',
        contentAr: 'شاهد منتجنا الجديد الرائع! اطلب الآن واحصل على خصم 10% من خلال رابطي!',
        category: 'product',
        tags: ['announcement', 'discount'],
        downloadCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'TEXT002',
        type: 'text',
        title: 'Live Stream Invitation',
        titleAr: 'دعوة للبث المباشر',
        content: 'Join our LIVE stream today at 8 PM! See products being made and packed right in front of you!',
        contentAr: 'انضم لبثنا المباشر اليوم الساعة 8 مساءً! شاهد المنتجات وهي تُصنع وتُغلف أمامك مباشرة!',
        category: 'promotion',
        tags: ['live', 'stream', 'invitation'],
        downloadCount: 0,
        createdAt: new Date(),
      },
    ];

    textTemplates.forEach(asset => this.assets.set(asset.id, asset));
  }

  /**
   * Get all marketing assets
   */
  getAllAssets(): MarketingAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get assets by type
   */
  getAssetsByType(type: 'image' | 'video' | 'text' | 'template'): MarketingAsset[] {
    return Array.from(this.assets.values()).filter(asset => asset.type === type);
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category: 'product' | 'brand' | 'promotion' | 'social'): MarketingAsset[] {
    return Array.from(this.assets.values()).filter(asset => asset.category === category);
  }

  /**
   * Get social media templates
   */
  getSocialMediaTemplates(): SocialMediaTemplate[] {
    return [
      {
        platform: 'facebook',
        platformAr: 'فيسبوك',
        templates: [
          {
            id: 'FB001',
            title: 'Product Showcase',
            titleAr: 'عرض منتج',
            content: '🔥 Amazing quality products directly from the factory!\n\n✅ Best prices\n✅ Fast shipping\n✅ 100% authentic\n\nOrder now through my link: [YOUR_LINK]',
            contentAr: '🔥 منتجات عالية الجودة مباشرة من المصنع!\n\n✅ أفضل الأسعار\n✅ شحن سريع\n✅ أصلية 100%\n\nاطلب الآن من خلال رابطي: [YOUR_LINK]',
            hashtags: ['#Fashion', '#Quality', '#FactoryDirect', '#موضة', '#جودة'],
            emoji: '🔥',
          },
          {
            id: 'FB002',
            title: 'Live Stream Announcement',
            titleAr: 'إعلان بث مباشر',
            content: '📹 LIVE STREAM TODAY at 8 PM!\n\nWatch products being made and packed LIVE!\n🎁 Special discounts during the stream\n💯 100% transparency\n\nDon\'t miss it! Join here: [YOUR_LINK]',
            contentAr: '📹 بث مباشر اليوم الساعة 8 مساءً!\n\nشاهد المنتجات وهي تُصنع وتُغلف مباشرة!\n🎁 خصومات خاصة أثناء البث\n💯 شفافية 100%\n\nلا تفوتك! انضم من هنا: [YOUR_LINK]',
            hashtags: ['#LiveStream', '#Factory', '#Transparent', '#بث_مباشر', '#شفافية'],
            emoji: '📹',
          },
        ],
      },
      {
        platform: 'instagram',
        platformAr: 'إنستغرام',
        templates: [
          {
            id: 'IG001',
            title: 'Story Template',
            titleAr: 'قالب ستوري',
            content: '✨ NEW ARRIVALS ✨\n\nSwipe up to shop!\n[YOUR_LINK]',
            contentAr: '✨ وصل حديثاً ✨\n\nاسحب للأعلى للتسوق!\n[YOUR_LINK]',
            hashtags: ['#NewArrivals', '#Fashion', '#Shop', '#جديد', '#تسوق'],
            emoji: '✨',
          },
        ],
      },
      {
        platform: 'whatsapp',
        platformAr: 'واتساب',
        templates: [
          {
            id: 'WA001',
            title: 'Personal Message',
            titleAr: 'رسالة شخصية',
            content: 'Hi! 👋\n\nI wanted to share this amazing product with you. It\'s high quality and directly from the factory at great prices!\n\nCheck it out: [YOUR_LINK]\n\nLet me know if you have any questions!',
            contentAr: 'مرحباً! 👋\n\nحبيت أشاركك هذا المنتج الرائع. جودة عالية ومباشرة من المصنع بأسعار ممتازة!\n\nشوفه من هنا: [YOUR_LINK]\n\nلو عندك أي استفسار خبرني!',
            hashtags: [],
            emoji: '👋',
          },
        ],
      },
      {
        platform: 'tiktok',
        platformAr: 'تيك توك',
        templates: [
          {
            id: 'TT001',
            title: 'Product Demo',
            titleAr: 'عرض منتج',
            content: '🔥 This is FIRE! 🔥\n\nDirect from factory, best quality!\n\nLink in bio 👆\n\n#fyp #viral #fashion #quality',
            contentAr: '🔥 هذا رهيب! 🔥\n\nمباشرة من المصنع، أفضل جودة!\n\nالرابط في البايو 👆\n\n#fyp #viral #موضة #جودة',
            hashtags: ['#fyp', '#viral', '#fashion', '#quality', '#موضة', '#جودة'],
            emoji: '🔥',
          },
        ],
      },
    ];
  }

  /**
   * Generate personalized marketing content
   */
  generatePersonalizedContent(
    affiliateCode: string,
    affiliateName: string,
    productName?: string
  ): {
    whatsappMessage: string;
    facebookPost: string;
    instagramCaption: string;
  } {
    const link = `https://haderos.com?ref=${affiliateCode}`;

    return {
      whatsappMessage: `مرحباً! 👋\n\nأنا ${affiliateName}، مسوق معتمد لمنتجات عالية الجودة مباشرة من المصنع.\n\n${productName ? `أنصحك بشدة بـ ${productName} - جودة ممتازة وسعر مناسب!` : 'عندنا تشكيلة رائعة من المنتجات بأسعار المصنع مباشرة!'}\n\n🔗 شوف المنتجات من هنا:\n${link}\n\nلو عندك أي استفسار، أنا هنا! 😊`,

      facebookPost: `🌟 مرحباً أصدقائي!\n\nأنا ${affiliateName}، وأنا متحمس أشارككم منتجات رائعة مباشرة من المصنع!\n\n${productName ? `✨ ${productName} - جودة استثنائية بسعر لا يُقاوم!` : '✨ تشكيلة واسعة من المنتجات عالية الجودة'}\n\n✅ أسعار المصنع مباشرة\n✅ شحن سريع وآمن\n✅ ضمان الجودة\n\n👉 اطلب الآن: ${link}\n\n#جودة #مصنع #تسوق #عروض`,

      instagramCaption: `✨ ${productName || 'منتجات رائعة'} ✨\n\nمباشرة من المصنع 🏭\nجودة عالية 💯\nأسعار ممتازة 💰\n\nاطلب من اللينك في البايو 👆\n\n#fashion #quality #shopping #موضة #جودة #تسوق`,
    };
  }

  /**
   * Track asset download
   */
  trackDownload(assetId: string): void {
    const asset = this.assets.get(assetId);
    if (asset) {
      asset.downloadCount += 1;
    }
  }

  /**
   * Add custom marketing asset
   */
  addAsset(asset: Omit<MarketingAsset, 'id' | 'downloadCount' | 'createdAt'>): MarketingAsset {
    const id = `CUSTOM${Date.now()}`;
    const newAsset: MarketingAsset = {
      ...asset,
      id,
      downloadCount: 0,
      createdAt: new Date(),
    };

    this.assets.set(id, newAsset);
    return newAsset;
  }
}

// Singleton instance
let marketingToolsManager: MarketingToolsManager | null = null;

/**
 * Get the marketing tools manager instance
 */
export function getMarketingToolsManager(): MarketingToolsManager {
  if (!marketingToolsManager) {
    marketingToolsManager = new MarketingToolsManager();
  }
  return marketingToolsManager;
}
