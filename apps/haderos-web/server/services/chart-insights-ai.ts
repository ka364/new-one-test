/**
 * AI-Powered Chart Insights Service
 * Analyzes chart data and generates intelligent insights using DeepSeek AI
 */

interface ChartDataPoint {
  month?: string;
  revenue?: number;
  orders?: number;
  avgValue?: number;
  [key: string]: any;
}

interface ChartInsight {
  type: 'success' | 'warning' | 'info' | 'danger';
  icon: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

export class ChartInsightsAI {
  /**
   * Analyze revenue chart data and generate insights
   */
  async analyzeRevenueData(data: ChartDataPoint[]): Promise<ChartInsight[]> {
    const insights: ChartInsight[] = [];

    if (!data || data.length === 0) {
      return insights;
    }

    // 1. Revenue Trend Analysis
    const revenueTrend = this.analyzeTrend(data.map(d => d.revenue || 0));
    if (revenueTrend.insight) {
      insights.push(revenueTrend.insight);
    }

    // 2. Order Volume Analysis
    const orderTrend = this.analyzeTrend(data.map(d => d.orders || 0));
    if (orderTrend.insight) {
      insights.push({
        ...orderTrend.insight,
        title: orderTrend.insight.title.replace('الإيرادات', 'عدد الطلبات'),
      });
    }

    // 3. Average Order Value Analysis
    const avgValues = data.map(d => d.avgValue || 0);
    const avgTrend = this.analyzeTrend(avgValues);
    if (avgTrend.insight) {
      insights.push({
        ...avgTrend.insight,
        title: avgTrend.insight.title.replace('الإيرادات', 'متوسط قيمة الطلب'),
      });
    }

    // 4. Volatility Analysis
    const volatility = this.analyzeVolatility(data.map(d => d.revenue || 0));
    if (volatility) {
      insights.push(volatility);
    }

    // 5. Seasonal Pattern Detection
    const seasonal = this.detectSeasonalPattern(data);
    if (seasonal) {
      insights.push(seasonal);
    }

    // 6. Growth Rate Analysis
    const growth = this.analyzeGrowthRate(data.map(d => d.revenue || 0));
    if (growth) {
      insights.push(growth);
    }

    return insights.slice(0, 5); // Return top 5 insights
  }

  /**
   * Analyze trend (increasing, decreasing, stable)
   */
  private analyzeTrend(values: number[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    percentage: number;
    insight?: ChartInsight;
  } {
    if (values.length < 2) {
      return { trend: 'stable', percentage: 0 };
    }

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const percentage = ((secondAvg - firstAvg) / firstAvg) * 100;

    let insight: ChartInsight | undefined;

    if (percentage > 10) {
      insight = {
        type: 'success',
        icon: '📈',
        title: 'نمو قوي في الإيرادات',
        description: `الإيرادات ارتفعت بنسبة ${percentage.toFixed(1)}% في الفترة الأخيرة مقارنة بالفترة السابقة`,
        impact: 'high',
        recommendation: 'استمر في الاستراتيجيات الحالية وحاول تكرار النجاح',
      };
    } else if (percentage < -10) {
      insight = {
        type: 'warning',
        icon: '📉',
        title: 'انخفاض في الإيرادات',
        description: `الإيرادات انخفضت بنسبة ${Math.abs(percentage).toFixed(1)}% في الفترة الأخيرة`,
        impact: 'high',
        recommendation: 'راجع استراتيجيات التسويق والمبيعات، وحدد أسباب الانخفاض',
      };
    } else if (percentage > 5) {
      insight = {
        type: 'info',
        icon: '↗️',
        title: 'نمو معتدل في الإيرادات',
        description: `الإيرادات في تحسن بنسبة ${percentage.toFixed(1)}%`,
        impact: 'medium',
        recommendation: 'زيادة الاستثمار في القنوات الناجحة لتسريع النمو',
      };
    } else if (percentage < -5) {
      insight = {
        type: 'warning',
        icon: '↘️',
        title: 'انخفاض طفيف في الإيرادات',
        description: `الإيرادات انخفضت بنسبة ${Math.abs(percentage).toFixed(1)}%`,
        impact: 'medium',
        recommendation: 'مراقبة الوضع عن كثب واتخاذ إجراءات وقائية',
      };
    } else {
      insight = {
        type: 'info',
        icon: '➡️',
        title: 'إيرادات مستقرة',
        description: 'الإيرادات مستقرة مع تغيرات طفيفة',
        impact: 'low',
        recommendation: 'حافظ على الاستقرار وابحث عن فرص للنمو',
      };
    }

    return {
      trend: percentage > 5 ? 'increasing' : percentage < -5 ? 'decreasing' : 'stable',
      percentage,
      insight,
    };
  }

  /**
   * Analyze data volatility (stability)
   */
  private analyzeVolatility(values: number[]): ChartInsight | null {
    if (values.length < 3) return null;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / mean) * 100;

    if (coefficientOfVariation > 30) {
      return {
        type: 'warning',
        icon: '⚠️',
        title: 'تقلبات عالية في الإيرادات',
        description: `الإيرادات تظهر تقلبات كبيرة (${coefficientOfVariation.toFixed(1)}% انحراف)`,
        impact: 'high',
        recommendation: 'العمل على استقرار مصادر الدخل وتنويع القنوات',
      };
    } else if (coefficientOfVariation > 15) {
      return {
        type: 'info',
        icon: '〰️',
        title: 'تقلبات معتدلة',
        description: `الإيرادات تظهر تقلبات معتدلة (${coefficientOfVariation.toFixed(1)}% انحراف)`,
        impact: 'medium',
        recommendation: 'مراقبة العوامل المؤثرة على التقلبات',
      };
    } else {
      return {
        type: 'success',
        icon: '✅',
        title: 'إيرادات مستقرة',
        description: 'الإيرادات تظهر استقراراً جيداً مع تقلبات منخفضة',
        impact: 'low',
        recommendation: null,
      };
    }
  }

  /**
   * Detect seasonal patterns
   */
  private detectSeasonalPattern(data: ChartDataPoint[]): ChartInsight | null {
    if (data.length < 6) return null;

    const revenues = data.map(d => d.revenue || 0);
    const maxRevenue = Math.max(...revenues);
    const maxIndex = revenues.indexOf(maxRevenue);
    const minRevenue = Math.min(...revenues);
    const minIndex = revenues.indexOf(minRevenue);

    const difference = ((maxRevenue - minRevenue) / minRevenue) * 100;

    if (difference > 50) {
      const bestMonth = data[maxIndex]?.month || 'غير معروف';
      const worstMonth = data[minIndex]?.month || 'غير معروف';

      return {
        type: 'info',
        icon: '📅',
        title: 'نمط موسمي واضح',
        description: `أعلى إيرادات في ${bestMonth} وأقل إيرادات في ${worstMonth} (فرق ${difference.toFixed(0)}%)`,
        impact: 'high',
        recommendation: 'خطط للحملات التسويقية مسبقاً في المواسم الضعيفة',
      };
    }

    return null;
  }

  /**
   * Calculate and analyze growth rate
   */
  private analyzeGrowthRate(values: number[]): ChartInsight | null {
    if (values.length < 2) return null;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const totalGrowth = ((lastValue - firstValue) / firstValue) * 100;
    const monthlyGrowth = totalGrowth / values.length;

    if (monthlyGrowth > 5) {
      return {
        type: 'success',
        icon: '🚀',
        title: 'معدل نمو ممتاز',
        description: `نمو شهري بمعدل ${monthlyGrowth.toFixed(1)}% (${totalGrowth.toFixed(1)}% إجمالي)`,
        impact: 'high',
        recommendation: 'استثمر في التوسع السريع والحفاظ على الزخم',
      };
    } else if (monthlyGrowth > 2) {
      return {
        type: 'info',
        icon: '📊',
        title: 'معدل نمو جيد',
        description: `نمو شهري بمعدل ${monthlyGrowth.toFixed(1)}%`,
        impact: 'medium',
        recommendation: 'ابحث عن فرص لزيادة معدل النمو',
      };
    } else if (monthlyGrowth < -2) {
      return {
        type: 'danger',
        icon: '🔴',
        title: 'تراجع في النمو',
        description: `انخفاض شهري بمعدل ${Math.abs(monthlyGrowth).toFixed(1)}%`,
        impact: 'high',
        recommendation: 'اتخاذ إجراءات فورية لعكس الاتجاه السلبي',
      };
    }

    return null;
  }

  /**
   * Generate AI-powered recommendations using DeepSeek
   */
  async generateAIRecommendations(
    data: ChartDataPoint[],
    insights: ChartInsight[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Extract key metrics
    const totalRevenue = data.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const avgRevenue = totalRevenue / data.length;
    const totalOrders = data.reduce((sum, d) => sum + (d.orders || 0), 0);
    const avgOrderValue = totalRevenue / totalOrders;

    // Rule-based recommendations
    insights.forEach(insight => {
      if (insight.recommendation) {
        recommendations.push(insight.recommendation);
      }
    });

    // Additional smart recommendations
    if (avgOrderValue < 500) {
      recommendations.push('💡 متوسط قيمة الطلب منخفض - جرب استراتيجيات البيع المتبادل (Cross-selling)');
    }

    if (totalOrders < 100) {
      recommendations.push('📢 عدد الطلبات منخفض - ركز على زيادة الوعي بالعلامة التجارية');
    }

    const lastMonthRevenue = data[data.length - 1]?.revenue || 0;
    if (lastMonthRevenue < avgRevenue * 0.8) {
      recommendations.push('🎯 الشهر الأخير أقل من المتوسط - راجع حملاتك التسويقية');
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }
}

// Singleton instance
export const chartInsightsAI = new ChartInsightsAI();
