/**
 * 🤖 AI-Powered Recommendations Router
 * نظام التوصيات الذكية بالذكاء الاصطناعي
 *
 * Features:
 * - Personalized product recommendations (توصيات مخصصة)
 * - Frequently bought together (اشترى معه)
 * - Similar products (منتجات مشابهة)
 * - Trending products (المنتجات الرائجة)
 * - Recently viewed (شوهد مؤخراً)
 * - Predictive inventory (التنبؤ بالمخزون)
 * - Customer segmentation (تقسيم العملاء)
 */

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import {
  eq,
  and,
  desc,
  asc,
  sql,
  gte,
  lte,
  count,
  avg,
  sum,
  inArray,
  notInArray,
  ne,
} from 'drizzle-orm';
import { products, orders } from '../../drizzle/schema';

// ============================================
// TYPES
// ============================================

interface ProductScore {
  productId: string;
  score: number;
  reason: string;
}

interface CustomerSegment {
  id: string;
  name: string;
  nameAr: string;
  criteria: {
    avgOrderValue?: { min?: number; max?: number };
    orderFrequency?: { min?: number; max?: number };
    totalSpend?: { min?: number; max?: number };
    recency?: { days: number };
  };
}

// ============================================
// RECOMMENDATION ALGORITHMS
// ============================================

/**
 * Collaborative Filtering - Item-based
 * يجد المنتجات التي تُشترى معاً
 */
async function getCollaborativeRecommendations(
  productId: string,
  limit: number = 5
): Promise<ProductScore[]> {
  // في الإنتاج، سيستخدم هذا نموذج ML حقيقي
  // حالياً نستخدم خوارزمية بسيطة تعتمد على الطلبات المشتركة

  const result = await db.execute(sql`
    WITH product_orders AS (
      SELECT DISTINCT order_id
      FROM order_items
      WHERE product_id = ${productId}
    ),
    related_products AS (
      SELECT
        oi.product_id,
        COUNT(DISTINCT oi.order_id) as co_occurrence,
        AVG(oi.quantity) as avg_quantity
      FROM order_items oi
      JOIN product_orders po ON oi.order_id = po.order_id
      WHERE oi.product_id != ${productId}
      GROUP BY oi.product_id
      HAVING COUNT(DISTINCT oi.order_id) > 1
    )
    SELECT
      product_id,
      co_occurrence,
      avg_quantity,
      (co_occurrence * 0.7 + avg_quantity * 0.3) as score
    FROM related_products
    ORDER BY score DESC
    LIMIT ${limit}
  `);

  return (result.rows || []).map((row: any) => ({
    productId: row.product_id,
    score: Number(row.score) || 0,
    reason: 'frequently_bought_together',
  }));
}

/**
 * Content-based Filtering
 * يجد منتجات مشابهة بناءً على الخصائص
 */
async function getContentBasedRecommendations(
  productId: string,
  limit: number = 5
): Promise<ProductScore[]> {
  // الحصول على بيانات المنتج الأصلي
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

  if (!product) {
    return [];
  }

  // البحث عن منتجات مشابهة
  const similarProducts = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      price: products.price,
    })
    .from(products)
    .where(
      and(
        ne(products.id, productId),
        eq(products.category, product.category),
        eq(products.isActive, true)
      )
    )
    .limit(limit * 2);

  // حساب التشابه (simplified)
  return similarProducts.slice(0, limit).map((p, index) => ({
    productId: p.id,
    score: 1 - index * 0.1,
    reason: 'similar_category',
  }));
}

// ============================================
// ROUTER
// ============================================

export const aiRecommendationsRouter = router({
  // ============================================
  // PRODUCT RECOMMENDATIONS
  // ============================================

  /**
   * توصيات مخصصة للعميل
   */
  getPersonalizedRecommendations: publicProcedure
    .input(
      z.object({
        customerId: z.string().uuid().optional(),
        sessionId: z.string().optional(),
        limit: z.number().default(10),
        excludeProductIds: z.array(z.string().uuid()).optional(),
      })
    )
    .query(async ({ input }) => {
      let recommendations: ProductScore[] = [];

      if (input.customerId) {
        // الحصول على سجل الشراء للعميل
        const customerOrders = await db.execute(sql`
          SELECT DISTINCT oi.product_id, COUNT(*) as purchase_count
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE o.customer_id = ${input.customerId}
          GROUP BY oi.product_id
          ORDER BY purchase_count DESC
          LIMIT 10
        `);

        // الحصول على توصيات بناءً على المشتريات السابقة
        for (const row of (customerOrders.rows || []).slice(0, 3)) {
          const related = await getCollaborativeRecommendations((row as any).product_id, 5);
          recommendations.push(...related);
        }
      }

      // إزالة المنتجات المستبعدة
      if (input.excludeProductIds?.length) {
        recommendations = recommendations.filter(
          (r) => !input.excludeProductIds!.includes(r.productId)
        );
      }

      // إزالة التكرارات وترتيب حسب النقاط
      const uniqueRecs = new Map<string, ProductScore>();
      for (const rec of recommendations) {
        if (!uniqueRecs.has(rec.productId)) {
          uniqueRecs.set(rec.productId, rec);
        } else {
          const existing = uniqueRecs.get(rec.productId)!;
          if (rec.score > existing.score) {
            uniqueRecs.set(rec.productId, rec);
          }
        }
      }

      const sortedRecs = Array.from(uniqueRecs.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, input.limit);

      // الحصول على بيانات المنتجات
      if (sortedRecs.length === 0) {
        // إذا لم تكن هناك توصيات، أعد المنتجات الأكثر مبيعاً
        const topProducts = await db
          .select()
          .from(products)
          .where(eq(products.isActive, true))
          .orderBy(desc(products.salesCount))
          .limit(input.limit);

        return {
          products: topProducts,
          algorithm: 'trending',
          reason: 'no_personalization_data',
        };
      }

      const productIds = sortedRecs.map((r) => r.productId);
      const productData = await db.select().from(products).where(inArray(products.id, productIds));

      // ترتيب المنتجات حسب النقاط
      const productMap = new Map(productData.map((p) => [p.id, p]));
      const orderedProducts = sortedRecs
        .map((rec) => productMap.get(rec.productId))
        .filter(Boolean);

      return {
        products: orderedProducts,
        algorithm: 'collaborative_filtering',
        recommendations: sortedRecs,
      };
    }),

  /**
   * منتجات تُشترى معاً (Frequently Bought Together)
   */
  getFrequentlyBoughtTogether: publicProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      const recommendations = await getCollaborativeRecommendations(input.productId, input.limit);

      if (recommendations.length === 0) {
        return { products: [], message: 'لا توجد بيانات كافية' };
      }

      const productIds = recommendations.map((r) => r.productId);
      const productData = await db
        .select()
        .from(products)
        .where(and(inArray(products.id, productIds), eq(products.isActive, true)));

      return {
        products: productData,
        recommendations,
      };
    }),

  /**
   * منتجات مشابهة (Similar Products)
   */
  getSimilarProducts: publicProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      const recommendations = await getContentBasedRecommendations(input.productId, input.limit);

      if (recommendations.length === 0) {
        return { products: [] };
      }

      const productIds = recommendations.map((r) => r.productId);
      const productData = await db
        .select()
        .from(products)
        .where(and(inArray(products.id, productIds), eq(products.isActive, true)));

      return {
        products: productData,
        recommendations,
      };
    }),

  /**
   * المنتجات الرائجة (Trending)
   */
  getTrendingProducts: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        categoryId: z.string().uuid().optional(),
        period: z.enum(['day', 'week', 'month']).default('week'),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // المنتجات الأكثر طلباً في الفترة
      const trendingQuery = sql`
        SELECT
          oi.product_id,
          COUNT(DISTINCT oi.order_id) as order_count,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.total) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= ${startDate}
        ${input.categoryId ? sql`AND oi.category_id = ${input.categoryId}` : sql``}
        GROUP BY oi.product_id
        ORDER BY order_count DESC, total_quantity DESC
        LIMIT ${input.limit}
      `;

      const trending = await db.execute(trendingQuery);

      if ((trending.rows || []).length === 0) {
        // fallback للمنتجات الأكثر مبيعاً
        const conditions = [eq(products.isActive, true)];
        if (input.categoryId) {
          conditions.push(eq(products.category, input.categoryId));
        }

        const fallbackProducts = await db
          .select()
          .from(products)
          .where(and(...conditions))
          .orderBy(desc(products.salesCount))
          .limit(input.limit);

        return {
          products: fallbackProducts,
          period: input.period,
          isFallback: true,
        };
      }

      const productIds = (trending.rows || []).map((row: any) => row.product_id);
      const productData = await db.select().from(products).where(inArray(products.id, productIds));

      // ترتيب حسب الـ trending
      const productMap = new Map(productData.map((p) => [p.id, p]));
      const orderedProducts = productIds.map((id: string) => productMap.get(id)).filter(Boolean);

      return {
        products: orderedProducts,
        period: input.period,
        stats: (trending.rows || []).map((row: any) => ({
          productId: row.product_id,
          orderCount: Number(row.order_count),
          totalQuantity: Number(row.total_quantity),
          totalRevenue: Number(row.total_revenue),
        })),
      };
    }),

  /**
   * المنتجات الأكثر مبيعاً (Best Sellers)
   */
  getBestSellers: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        categoryId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(products.isActive, true)];

      if (input.categoryId) {
        conditions.push(eq(products.category, input.categoryId));
      }

      const bestSellers = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.salesCount))
        .limit(input.limit);

      return { products: bestSellers };
    }),

  /**
   * المنتجات الجديدة (New Arrivals)
   */
  getNewArrivals: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        categoryId: z.string().uuid().optional(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const conditions = [eq(products.isActive, true), gte(products.createdAt, startDate)];

      if (input.categoryId) {
        conditions.push(eq(products.category, input.categoryId));
      }

      const newProducts = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(input.limit);

      return { products: newProducts };
    }),

  // ============================================
  // PREDICTIVE ANALYTICS
  // ============================================

  /**
   * التنبؤ بالطلب (Demand Forecasting)
   */
  getDemandForecast: publicProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      // تحليل المبيعات السابقة
      const historicalData = await db.execute(sql`
        SELECT
          DATE_TRUNC('day', o.created_at) as date,
          SUM(oi.quantity) as quantity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = ${input.productId}
          AND o.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('day', o.created_at)
        ORDER BY date
      `);

      const history = (historicalData.rows || []).map((row: any) => ({
        date: row.date,
        quantity: Number(row.quantity),
      }));

      // حساب المتوسط والانحراف المعياري
      const quantities = history.map((h) => h.quantity);
      const avgQuantity =
        quantities.length > 0 ? quantities.reduce((a, b) => a + b, 0) / quantities.length : 0;

      // حساب trend بسيط
      let trend = 0;
      if (quantities.length >= 7) {
        const firstWeek = quantities.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
        const lastWeek = quantities.slice(-7).reduce((a, b) => a + b, 0) / 7;
        trend = ((lastWeek - firstWeek) / firstWeek) * 100;
      }

      // التنبؤ البسيط (في الإنتاج، استخدم نموذج ML)
      const forecast = [];
      let currentPrediction = avgQuantity;

      for (let i = 1; i <= input.days; i++) {
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        // تطبيق الـ trend
        currentPrediction *= 1 + trend / 100 / 30;

        // تعديلات موسمية بسيطة (نهاية الأسبوع)
        const dayOfWeek = date.getDay();
        let seasonalFactor = 1;
        if (dayOfWeek === 5 || dayOfWeek === 6) {
          seasonalFactor = 1.2; // 20% زيادة في نهاية الأسبوع
        }

        forecast.push({
          date: date.toISOString().split('T')[0],
          predictedQuantity: Math.round(currentPrediction * seasonalFactor),
          confidence: 0.7, // 70% confidence
        });
      }

      // توصية المخزون
      const totalPredicted = forecast.reduce((a, b) => a + b.predictedQuantity, 0);
      const safetyStock = Math.ceil(avgQuantity * 7); // أسبوع safety stock

      return {
        productId: input.productId,
        history,
        forecast,
        summary: {
          avgDailyDemand: Math.round(avgQuantity * 10) / 10,
          trend: Math.round(trend * 10) / 10,
          totalPredicted,
          recommendedStock: totalPredicted + safetyStock,
          safetyStock,
        },
      };
    }),

  /**
   * المنتجات التي تحتاج إعادة طلب (Reorder Alerts)
   */
  getReorderAlerts: publicProcedure
    .input(
      z.object({
        threshold: z.number().default(7), // أيام المخزون المتبقية
      })
    )
    .query(async ({ input }) => {
      // المنتجات ذات المخزون المنخفض
      const lowStockProducts = await db.execute(sql`
        SELECT
          p.id,
          p.name,
          p.name_ar,
          p.sku,
          p.stock_quantity,
          COALESCE(sales.avg_daily_sales, 0) as avg_daily_sales,
          CASE
            WHEN COALESCE(sales.avg_daily_sales, 0) > 0
            THEN p.stock_quantity / sales.avg_daily_sales
            ELSE 999
          END as days_of_stock
        FROM products p
        LEFT JOIN (
          SELECT
            oi.product_id,
            SUM(oi.quantity) / 30.0 as avg_daily_sales
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at >= NOW() - INTERVAL '30 days'
          GROUP BY oi.product_id
        ) sales ON p.id = sales.product_id
        WHERE p.is_active = true
          AND p.stock_quantity > 0
          AND (
            sales.avg_daily_sales IS NULL
            OR p.stock_quantity / NULLIF(sales.avg_daily_sales, 0) < ${input.threshold}
          )
        ORDER BY days_of_stock ASC
        LIMIT 50
      `);

      return {
        alerts: (lowStockProducts.rows || []).map((row: any) => ({
          productId: row.id,
          name: row.name,
          nameAr: row.name_ar,
          sku: row.sku,
          currentStock: Number(row.stock_quantity),
          avgDailySales: Math.round(Number(row.avg_daily_sales) * 10) / 10,
          daysOfStock: Math.round(Number(row.days_of_stock)),
          urgency: Number(row.days_of_stock) <= 3 ? 'critical' : 'warning',
          recommendedOrderQty: Math.ceil(Number(row.avg_daily_sales) * 30), // شهر
        })),
        threshold: input.threshold,
      };
    }),

  // ============================================
  // CUSTOMER ANALYTICS
  // ============================================

  /**
   * تقسيم العملاء (Customer Segmentation)
   */
  getCustomerSegments: publicProcedure.query(async () => {
    // تحليل RFM (Recency, Frequency, Monetary)
    const rfmAnalysis = await db.execute(sql`
      WITH customer_rfm AS (
        SELECT
          customer_id,
          MAX(created_at) as last_order_date,
          COUNT(*) as order_count,
          SUM(total) as total_spend,
          AVG(total) as avg_order_value,
          EXTRACT(DAYS FROM NOW() - MAX(created_at)) as recency_days
        FROM orders
        WHERE customer_id IS NOT NULL
          AND status NOT IN ('cancelled', 'refunded')
        GROUP BY customer_id
      )
      SELECT
        CASE
          WHEN recency_days <= 30 AND order_count >= 3 AND total_spend >= 5000 THEN 'champions'
          WHEN recency_days <= 60 AND order_count >= 2 AND total_spend >= 2000 THEN 'loyal'
          WHEN recency_days <= 30 AND order_count = 1 THEN 'new'
          WHEN recency_days <= 90 AND total_spend >= 3000 THEN 'potential'
          WHEN recency_days > 90 AND order_count >= 2 THEN 'at_risk'
          WHEN recency_days > 180 THEN 'lost'
          ELSE 'others'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spend) as avg_total_spend,
        AVG(order_count) as avg_orders,
        AVG(recency_days) as avg_recency
      FROM customer_rfm
      GROUP BY segment
      ORDER BY avg_total_spend DESC
    `);

    const segments: CustomerSegment[] = [
      {
        id: 'champions',
        name: 'Champions',
        nameAr: 'الأبطال',
        criteria: { recency: { days: 30 }, orderFrequency: { min: 3 }, totalSpend: { min: 5000 } },
      },
      {
        id: 'loyal',
        name: 'Loyal Customers',
        nameAr: 'العملاء الأوفياء',
        criteria: { recency: { days: 60 }, orderFrequency: { min: 2 }, totalSpend: { min: 2000 } },
      },
      {
        id: 'new',
        name: 'New Customers',
        nameAr: 'العملاء الجدد',
        criteria: { recency: { days: 30 }, orderFrequency: { min: 1, max: 1 } },
      },
      {
        id: 'potential',
        name: 'Potential Loyalists',
        nameAr: 'محتملون للولاء',
        criteria: { recency: { days: 90 }, totalSpend: { min: 3000 } },
      },
      {
        id: 'at_risk',
        name: 'At Risk',
        nameAr: 'معرضون للخطر',
        criteria: { recency: { days: 180 }, orderFrequency: { min: 2 } },
      },
      {
        id: 'lost',
        name: 'Lost Customers',
        nameAr: 'عملاء مفقودون',
        criteria: { recency: { days: 365 } },
      },
    ];

    const segmentStats = new Map(
      (rfmAnalysis.rows || []).map((row: any) => [
        row.segment,
        {
          customerCount: Number(row.customer_count),
          avgTotalSpend: Math.round(Number(row.avg_total_spend)),
          avgOrders: Math.round(Number(row.avg_orders) * 10) / 10,
          avgRecency: Math.round(Number(row.avg_recency)),
        },
      ])
    );

    return {
      segments: segments.map((seg) => ({
        ...seg,
        stats: segmentStats.get(seg.id) || {
          customerCount: 0,
          avgTotalSpend: 0,
          avgOrders: 0,
          avgRecency: 0,
        },
      })),
      totalCustomers: (rfmAnalysis.rows || []).reduce(
        (sum: number, row: any) => sum + Number(row.customer_count),
        0
      ),
    };
  }),

  /**
   * توقع قيمة العميل مدى الحياة (CLV Prediction)
   */
  predictCustomerCLV: publicProcedure
    .input(
      z.object({
        customerId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      // الحصول على بيانات العميل
      const customerData = await db.execute(sql`
        SELECT
          customer_id,
          COUNT(*) as total_orders,
          SUM(total) as total_spend,
          AVG(total) as avg_order_value,
          MIN(created_at) as first_order_date,
          MAX(created_at) as last_order_date,
          EXTRACT(DAYS FROM MAX(created_at) - MIN(created_at)) as customer_age_days
        FROM orders
        WHERE customer_id = ${input.customerId}
          AND status NOT IN ('cancelled', 'refunded')
        GROUP BY customer_id
      `);

      if ((customerData.rows || []).length === 0) {
        return {
          customerId: input.customerId,
          clv: 0,
          message: 'لا توجد طلبات لهذا العميل',
        };
      }

      const data = (customerData.rows || [])[0] as any;
      const totalOrders = Number(data.total_orders);
      const totalSpend = Number(data.total_spend);
      const avgOrderValue = Number(data.avg_order_value);
      const customerAgeDays = Number(data.customer_age_days) || 1;

      // حساب معدل الشراء
      const purchaseFrequency = totalOrders / (customerAgeDays / 30); // طلبات شهرياً

      // توقع CLV لسنة قادمة (simplified)
      const predictedOrdersPerYear = purchaseFrequency * 12;
      const predictedCLV = predictedOrdersPerYear * avgOrderValue;

      // تقدير احتمالية الـ churn
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(data.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const churnProbability = Math.min(1, daysSinceLastOrder / 180);

      // CLV المعدل
      const adjustedCLV = predictedCLV * (1 - churnProbability);

      return {
        customerId: input.customerId,
        historicalData: {
          totalOrders,
          totalSpend: Math.round(totalSpend),
          avgOrderValue: Math.round(avgOrderValue),
          customerAgeDays,
          purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
        },
        predictions: {
          predictedOrdersPerYear: Math.round(predictedOrdersPerYear * 10) / 10,
          rawCLV: Math.round(predictedCLV),
          churnProbability: Math.round(churnProbability * 100),
          adjustedCLV: Math.round(adjustedCLV),
        },
        segment:
          churnProbability < 0.2
            ? 'high_value'
            : churnProbability < 0.5
              ? 'medium_value'
              : 'at_risk',
      };
    }),

  // ============================================
  // SEARCH & DISCOVERY
  // ============================================

  /**
   * بحث ذكي مع اقتراحات (Smart Search)
   */
  getSearchSuggestions: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const searchQuery = input.query.toLowerCase();

      // البحث في المنتجات
      const productSuggestions = await db.execute(sql`
        SELECT
          id,
          name,
          name_ar,
          category,
          price,
          image_url,
          sales_count,
          similarity(LOWER(name), ${searchQuery}) as name_score,
          similarity(LOWER(name_ar), ${searchQuery}) as name_ar_score
        FROM products
        WHERE is_active = true
          AND (
            LOWER(name) LIKE ${`%${searchQuery}%`}
            OR LOWER(name_ar) LIKE ${`%${searchQuery}%`}
            OR LOWER(sku) LIKE ${`%${searchQuery}%`}
          )
        ORDER BY
          GREATEST(
            similarity(LOWER(name), ${searchQuery}),
            similarity(LOWER(name_ar), ${searchQuery})
          ) DESC,
          sales_count DESC
        LIMIT ${input.limit}
      `);

      // اقتراحات الكلمات المفتاحية (من البحث السابق)
      const keywordSuggestions = await db.execute(sql`
        SELECT DISTINCT
          search_term,
          COUNT(*) as search_count
        FROM search_history
        WHERE LOWER(search_term) LIKE ${`${searchQuery}%`}
        GROUP BY search_term
        ORDER BY search_count DESC
        LIMIT 5
      `);

      return {
        products: (productSuggestions.rows || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          nameAr: row.name_ar,
          category: row.category,
          price: Number(row.price),
          imageUrl: row.image_url,
          relevanceScore: Math.max(Number(row.name_score) || 0, Number(row.name_ar_score) || 0),
        })),
        keywords: (keywordSuggestions.rows || []).map((row: any) => ({
          term: row.search_term,
          count: Number(row.search_count),
        })),
      };
    }),
});

export type AIRecommendationsRouter = typeof aiRecommendationsRouter;
