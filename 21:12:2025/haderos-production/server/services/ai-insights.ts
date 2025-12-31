/**
 * AI-Powered Chart Insights Service
 * 
 * Analyzes chart data and provides automatic insights using AI.
 * Supports multiple chart types and generates actionable recommendations.
 */

interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

interface Insight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  icon: string;
  title: string;
  description: string;
  recommendation?: string;
}

interface ChartAnalysis {
  summary: string;
  insights: Insight[];
  trends: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    description: string;
  };
  predictions?: {
    nextPeriod: number;
    confidence: number;
  };
}

export class AIInsightsService {
  /**
   * Analyze time series data (for LineChart, AreaChart)
   */
  static analyzeTimeSeries(data: ChartDataPoint[]): ChartAnalysis {
    if (data.length < 2) {
      return {
        summary: 'بيانات غير كافية للتحليل',
        insights: [],
        trends: { direction: 'stable', percentage: 0, description: 'لا توجد بيانات كافية' }
      };
    }

    const values = data.map(d => d.value);
    const lastValue = values[values.length - 1];
    const previousValue = values[values.length - 2];
    const firstValue = values[0];
    
    // Calculate trend
    const recentChange = ((lastValue - previousValue) / previousValue) * 100;
    const overallChange = ((lastValue - firstValue) / firstValue) * 100;
    
    // Calculate average
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Calculate volatility (standard deviation)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const volatility = (stdDev / average) * 100;

    // Determine trend direction
    const direction: 'up' | 'down' | 'stable' = 
      Math.abs(recentChange) < 2 ? 'stable' : recentChange > 0 ? 'up' : 'down';

    // Generate insights
    const insights: Insight[] = [];

    // Trend insight
    if (direction === 'up' && recentChange > 10) {
      insights.push({
        type: 'positive',
        icon: '📈',
        title: 'نمو قوي',
        description: `ارتفاع بنسبة ${recentChange.toFixed(1)}% مقارنة بالفترة السابقة`,
        recommendation: 'استمر في الاستراتيجية الحالية وفكر في التوسع'
      });
    } else if (direction === 'down' && recentChange < -10) {
      insights.push({
        type: 'negative',
        icon: '📉',
        title: 'انخفاض ملحوظ',
        description: `انخفاض بنسبة ${Math.abs(recentChange).toFixed(1)}% مقارنة بالفترة السابقة`,
        recommendation: 'راجع العوامل المؤثرة واتخذ إجراءات تصحيحية'
      });
    } else if (direction === 'stable') {
      insights.push({
        type: 'neutral',
        icon: '➡️',
        title: 'استقرار',
        description: 'الأداء مستقر مع تغيرات طفيفة',
        recommendation: 'حافظ على الأداء الحالي وابحث عن فرص التحسين'
      });
    }

    // Overall performance insight
    if (overallChange > 20) {
      insights.push({
        type: 'positive',
        icon: '🎯',
        title: 'أداء ممتاز',
        description: `نمو إجمالي بنسبة ${overallChange.toFixed(1)}% خلال الفترة الكاملة`,
      });
    } else if (overallChange < -20) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'يحتاج اهتمام',
        description: `انخفاض إجمالي بنسبة ${Math.abs(overallChange).toFixed(1)}% خلال الفترة الكاملة`,
        recommendation: 'ضع خطة تحسين شاملة'
      });
    }

    // Volatility insight
    if (volatility > 30) {
      insights.push({
        type: 'warning',
        icon: '📊',
        title: 'تقلبات عالية',
        description: `البيانات تظهر تقلبات بنسبة ${volatility.toFixed(1)}%`,
        recommendation: 'ابحث عن أسباب التقلبات واعمل على الاستقرار'
      });
    }

    // Above/below average insight
    if (lastValue > average * 1.2) {
      insights.push({
        type: 'positive',
        icon: '⭐',
        title: 'فوق المتوسط',
        description: `القيمة الحالية أعلى من المتوسط بنسبة ${((lastValue / average - 1) * 100).toFixed(1)}%`,
      });
    } else if (lastValue < average * 0.8) {
      insights.push({
        type: 'negative',
        icon: '📉',
        title: 'أقل من المتوسط',
        description: `القيمة الحالية أقل من المتوسط بنسبة ${((1 - lastValue / average) * 100).toFixed(1)}%`,
        recommendation: 'اعمل على رفع الأداء للوصول إلى المتوسط'
      });
    }

    // Simple linear regression for prediction
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const nextPrediction = slope * n + intercept;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssResidual = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    const confidence = Math.max(0, Math.min(100, rSquared * 100));

    return {
      summary: `${direction === 'up' ? 'اتجاه صاعد' : direction === 'down' ? 'اتجاه هابط' : 'اتجاه مستقر'} مع ${insights.length} رؤى مهمة`,
      insights,
      trends: {
        direction,
        percentage: recentChange,
        description: `${direction === 'up' ? 'زيادة' : direction === 'down' ? 'انخفاض' : 'استقرار'} بنسبة ${Math.abs(recentChange).toFixed(1)}%`
      },
      predictions: {
        nextPeriod: Math.max(0, nextPrediction),
        confidence: Math.round(confidence)
      }
    };
  }

  /**
   * Analyze distribution data (for PieChart, BarChart)
   */
  static analyzeDistribution(data: ChartDataPoint[]): ChartAnalysis {
    if (data.length === 0) {
      return {
        summary: 'لا توجد بيانات للتحليل',
        insights: [],
        trends: { direction: 'stable', percentage: 0, description: 'لا توجد بيانات' }
      };
    }

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    const insights: Insight[] = [];

    // Top performer
    const topItem = sortedData[0];
    const topPercentage = (topItem.value / total) * 100;
    
    if (topPercentage > 50) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'تركيز عالي',
        description: `${topItem.label} يمثل ${topPercentage.toFixed(1)}% من الإجمالي`,
        recommendation: 'فكر في تنويع المصادر لتقليل المخاطر'
      });
    } else if (topPercentage > 30) {
      insights.push({
        type: 'neutral',
        icon: '📊',
        title: 'أداء متميز',
        description: `${topItem.label} هو الأعلى بنسبة ${topPercentage.toFixed(1)}%`,
      });
    }

    // Bottom performer
    const bottomItem = sortedData[sortedData.length - 1];
    const bottomPercentage = (bottomItem.value / total) * 100;
    
    if (bottomPercentage < 5 && sortedData.length > 3) {
      insights.push({
        type: 'neutral',
        icon: '💡',
        title: 'فرصة للتحسين',
        description: `${bottomItem.label} يمثل فقط ${bottomPercentage.toFixed(1)}%`,
        recommendation: 'ركز على تحسين هذا المجال أو إعادة تخصيص الموارد'
      });
    }

    // Distribution balance
    const avgValue = total / data.length;
    const balanced = data.every(d => Math.abs(d.value - avgValue) / avgValue < 0.5);
    
    if (balanced) {
      insights.push({
        type: 'positive',
        icon: '⚖️',
        title: 'توزيع متوازن',
        description: 'التوزيع متوازن بشكل جيد بين جميع الفئات',
      });
    }

    // Top 3 analysis
    const top3Total = sortedData.slice(0, 3).reduce((sum, d) => sum + d.value, 0);
    const top3Percentage = (top3Total / total) * 100;
    
    if (top3Percentage > 80) {
      insights.push({
        type: 'neutral',
        icon: '🎯',
        title: 'القاعدة 80/20',
        description: `أعلى 3 عناصر تمثل ${top3Percentage.toFixed(1)}% من الإجمالي`,
        recommendation: 'ركز جهودك على هذه العناصر الرئيسية'
      });
    }

    return {
      summary: `تحليل ${data.length} فئات بإجمالي ${total.toLocaleString('ar-EG')} وحدة`,
      insights,
      trends: {
        direction: 'stable',
        percentage: topPercentage,
        description: `${topItem.label} هو الأعلى بنسبة ${topPercentage.toFixed(1)}%`
      }
    };
  }

  /**
   * Analyze comparison data (for multi-series charts)
   */
  static analyzeComparison(
    series1: ChartDataPoint[],
    series2: ChartDataPoint[],
    series1Name: string,
    series2Name: string
  ): ChartAnalysis {
    const insights: Insight[] = [];

    const sum1 = series1.reduce((sum, d) => sum + d.value, 0);
    const sum2 = series2.reduce((sum, d) => sum + d.value, 0);
    
    const diff = ((sum1 - sum2) / sum2) * 100;

    if (Math.abs(diff) > 20) {
      insights.push({
        type: diff > 0 ? 'positive' : 'negative',
        icon: diff > 0 ? '📈' : '📉',
        title: 'فرق كبير',
        description: `${series1Name} ${diff > 0 ? 'أعلى' : 'أقل'} من ${series2Name} بنسبة ${Math.abs(diff).toFixed(1)}%`,
      });
    }

    // Correlation analysis
    if (series1.length === series2.length) {
      const n = series1.length;
      const mean1 = sum1 / n;
      const mean2 = sum2 / n;
      
      let numerator = 0;
      let denom1 = 0;
      let denom2 = 0;
      
      for (let i = 0; i < n; i++) {
        const diff1 = series1[i].value - mean1;
        const diff2 = series2[i].value - mean2;
        numerator += diff1 * diff2;
        denom1 += diff1 * diff1;
        denom2 += diff2 * diff2;
      }
      
      const correlation = numerator / Math.sqrt(denom1 * denom2);
      
      if (correlation > 0.7) {
        insights.push({
          type: 'neutral',
          icon: '🔗',
          title: 'ارتباط قوي',
          description: `${series1Name} و ${series2Name} يتحركان معاً بشكل قوي`,
        });
      } else if (correlation < -0.7) {
        insights.push({
          type: 'neutral',
          icon: '↔️',
          title: 'ارتباط عكسي',
          description: `${series1Name} و ${series2Name} يتحركان في اتجاهين متعاكسين`,
        });
      }
    }

    return {
      summary: `مقارنة بين ${series1Name} و ${series2Name}`,
      insights,
      trends: {
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
        percentage: diff,
        description: `${series1Name} ${diff > 0 ? 'أعلى' : diff < 0 ? 'أقل' : 'مساوي'} لـ ${series2Name}`
      }
    };
  }
}
