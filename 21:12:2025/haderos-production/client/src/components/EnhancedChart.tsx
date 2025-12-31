/**
 * Enhanced Chart Component
 * 
 * Wraps any chart with AI insights and export capabilities.
 * Provides a consistent interface for all charts in the application.
 */

import React, { useRef, useState } from 'react';
import { Download, FileText, Copy, Printer, Lightbulb, TrendingUp } from 'lucide-react';
import { exportChartAsPNG, exportChartAsPDF, copyChartToClipboard, printChart } from '../utils/chart-export';

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

interface EnhancedChartProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  analysis?: ChartAnalysis;
  showInsights?: boolean;
  showExport?: boolean;
  exportFilename?: string;
  className?: string;
}

export function EnhancedChart({
  title,
  description,
  children,
  analysis,
  showInsights = true,
  showExport = true,
  exportFilename = 'chart',
  className = ''
}: EnhancedChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!chartRef.current) return;

    setExporting(true);
    setExportSuccess(false);

    try {
      if (format === 'png') {
        await exportChartAsPNG(chartRef.current, { filename: exportFilename });
      } else {
        await exportChartAsPDF(chartRef.current, { filename: exportFilename });
      }
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
      alert('فشل التصدير. يرجى المحاولة مرة أخرى.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!chartRef.current) return;

    setExporting(true);
    try {
      await copyChartToClipboard(chartRef.current);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Copy error:', error);
      alert('فشل النسخ. يرجى المحاولة مرة أخرى.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    if (!chartRef.current) return;

    try {
      await printChart(chartRef.current);
    } catch (error) {
      console.error('Print error:', error);
      alert('فشل الطباعة. يرجى المحاولة مرة أخرى.');
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'negative':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {showInsights && analysis && (
              <button
                onClick={() => setShowInsightsPanel(!showInsightsPanel)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                title="عرض الرؤى الذكية"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">رؤى ذكية</span>
              </button>
            )}

            {showExport && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExport('png')}
                  disabled={exporting}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="تصدير كصورة PNG"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="تصدير كملف PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={exporting}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="نسخ إلى الحافظة"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="طباعة"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Export Success Message */}
        {exportSuccess && (
          <div className="mt-2 text-sm text-green-600 font-medium">
            ✓ تم التصدير بنجاح
          </div>
        )}
      </div>

      {/* AI Insights Panel */}
      {showInsights && analysis && showInsightsPanel && (
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <h4 className="text-lg font-bold text-gray-900">رؤى ذكية مدعومة بالذكاء الاصطناعي</h4>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-700 mb-4">{analysis.summary}</p>

          {/* Trend */}
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">الاتجاه الحالي</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTrendIcon(analysis.trends.direction)}</span>
              <span className="text-sm text-gray-700">{analysis.trends.description}</span>
            </div>
          </div>

          {/* Predictions */}
          {analysis.predictions && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔮</span>
                <span className="text-sm font-semibold text-gray-900">التوقعات</span>
              </div>
              <div className="text-sm text-gray-700">
                <p>القيمة المتوقعة للفترة القادمة: <strong>{analysis.predictions.nextPeriod.toLocaleString('ar-EG')}</strong></p>
                <p className="text-xs text-gray-500 mt-1">
                  مستوى الثقة: {analysis.predictions.confidence}%
                </p>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getInsightTypeColor(insight.type)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{insight.icon}</span>
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm mb-1">{insight.title}</h5>
                    <p className="text-xs mb-1">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="text-xs font-medium mt-2 pt-2 border-t border-current/20">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div ref={chartRef} className="p-6">
        {children}
      </div>
    </div>
  );
}
