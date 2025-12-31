/**
 * Development Lab Dashboard
 * 
 * A comprehensive dashboard for factory owners to view AI-powered insights,
 * innovation metrics, export readiness, and development recommendations.
 */

import React, { useState, useEffect } from 'react';

// ==================== Types ====================

interface InnovationMetrics {
  overallScore: number;
  dimensions: {
    productQuality: number;
    customerSatisfaction: number;
    marketCompetitiveness: number;
    innovationCapacity: number;
    exportReadiness: number;
  };
  recommendations: string[];
  nextMilestones: Milestone[];
}

interface Milestone {
  title: string;
  description: string;
  targetDate: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  requiredActions: string[];
}

interface ResearchFinding {
  topic: string;
  summary: string;
  relevanceScore: number;
  actionableInsights: string[];
  relatedSuppliers?: SupplierLead[];
}

interface SupplierLead {
  name: string;
  location: string;
  specialty: string;
  estimatedCost?: string;
  qualityRating?: number;
}

interface ExportRoadmap {
  targetMarkets: string[];
  readinessScore: number;
  gaps: Gap[];
  actionPlan: ActionItem[];
  estimatedTimeToExport: string;
}

interface Gap {
  category: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface ActionItem {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDuration: string;
}

// ==================== Component ====================

export const DevelopmentLabDashboard: React.FC<{ factoryId: string }> = ({ factoryId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'research' | 'export' | 'security'>('overview');
  const [metrics, setMetrics] = useState<InnovationMetrics | null>(null);
  const [research, setResearch] = useState<ResearchFinding[]>([]);
  const [exportRoadmap, setExportRoadmap] = useState<ExportRoadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [factoryId]);

  const loadDashboardData = async () => {
    setLoading(true);
    // In real implementation, fetch from tRPC endpoints
    // const metrics = await trpc.devLab.getMetrics.query({ factoryId });
    // const research = await trpc.devLab.getResearch.query({ factoryId });
    // const roadmap = await trpc.devLab.getExportRoadmap.query({ factoryId });
    
    // Mock data for demonstration
    setMetrics({
      overallScore: 75,
      dimensions: {
        productQuality: 80,
        customerSatisfaction: 85,
        marketCompetitiveness: 70,
        innovationCapacity: 65,
        exportReadiness: 75
      },
      recommendations: [
        'استثمر في أنظمة مراقبة الجودة لتحسين اتساق المنتج',
        'احصل على شهادات ISO لتمكين فرص التصدير',
        'قم بإجراء تحليل تسعير تنافسي وتعديل الاستراتيجية'
      ],
      nextMilestones: [
        {
          title: 'الحصول على شهادة ISO 9001',
          description: 'إكمال شهادة نظام إدارة الجودة',
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          status: 'not_started',
          requiredActions: [
            'توظيف مستشار ISO',
            'توثيق جميع العمليات',
            'تدريب الموظفين على إجراءات الجودة'
          ]
        }
      ]
    });
    
    setResearch([
      {
        topic: 'أحدث تقنيات التصنيع',
        summary: 'أنظمة مراقبة الجودة الآلية الجديدة يمكن أن تقلل العيوب بنسبة 40%',
        relevanceScore: 0.95,
        actionableInsights: [
          'فكر في الاستثمار في كاميرات فحص الجودة المدعومة بالذكاء الاصطناعي',
          'درب الموظفين على بروتوكولات مراقبة الجودة الجديدة'
        ],
        relatedSuppliers: [
          {
            name: 'TechVision Systems',
            location: 'القاهرة، مصر',
            specialty: 'معدات مراقبة الجودة بالذكاء الاصطناعي',
            estimatedCost: '50,000 - 100,000 جنيه',
            qualityRating: 4.5
          }
        ]
      }
    ]);
    
    setExportRoadmap({
      targetMarkets: ['السعودية', 'الإمارات', 'الكويت'],
      readinessScore: 75,
      gaps: [
        {
          category: 'certification',
          description: 'شهادات ISO مفقودة مطلوبة للأسواق المستهدفة',
          severity: 'high'
        }
      ],
      actionPlan: [
        {
          title: 'معالجة فجوة الشهادات',
          description: 'الحصول على شهادات ISO المطلوبة',
          priority: 'high',
          estimatedDuration: '3-6 أشهر'
        }
      ],
      estimatedTimeToExport: '6-12 شهر'
    });
    
    setLoading(false);
  };

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="dev-lab-dashboard">
      <style>{`
        .dev-lab-dashboard {
          padding: 20px;
          font-family: 'Cairo', sans-serif;
          direction: rtl;
        }
        
        .dashboard-header {
          margin-bottom: 30px;
        }
        
        .dashboard-title {
          font-size: 28px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 10px;
        }
        
        .dashboard-subtitle {
          color: #666;
          font-size: 16px;
        }
        
        .privacy-badge {
          display: inline-flex;
          align-items: center;
          background: #e8f5e9;
          color: #2e7d32;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          margin-top: 10px;
        }
        
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .tab {
          padding: 12px 24px;
          cursor: pointer;
          border: none;
          background: none;
          font-size: 16px;
          color: #666;
          transition: all 0.3s;
        }
        
        .tab.active {
          color: #1976d2;
          border-bottom: 3px solid #1976d2;
          font-weight: bold;
        }
        
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .metric-title {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        
        .metric-value {
          font-size: 36px;
          font-weight: bold;
          color: #1976d2;
        }
        
        .metric-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          margin-top: 10px;
          overflow: hidden;
        }
        
        .metric-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
          transition: width 0.5s;
        }
        
        .recommendations-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 16px;
          color: #1a1a1a;
        }
        
        .recommendation-item {
          padding: 12px;
          background: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 10px;
          border-right: 4px solid #1976d2;
        }
        
        .milestone-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 16px;
        }
        
        .milestone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .milestone-title {
          font-size: 18px;
          font-weight: bold;
          color: #1a1a1a;
        }
        
        .milestone-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .milestone-status.not_started {
          background: #ffebee;
          color: #c62828;
        }
        
        .milestone-status.in_progress {
          background: #fff3e0;
          color: #ef6c00;
        }
        
        .milestone-status.completed {
          background: #e8f5e9;
          color: #2e7d32;
        }
        
        .research-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 16px;
        }
        
        .relevance-score {
          display: inline-block;
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        
        .supplier-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        
        .supplier-card {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
        }
        
        .export-roadmap {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .readiness-meter {
          text-align: center;
          margin: 30px 0;
        }
        
        .readiness-circle {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: conic-gradient(#4caf50 0% 75%, #e0e0e0 75% 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        
        .readiness-inner {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .readiness-score {
          font-size: 48px;
          font-weight: bold;
          color: #4caf50;
        }
        
        .gap-item {
          padding: 16px;
          background: #fff3e0;
          border-radius: 8px;
          margin-bottom: 12px;
          border-right: 4px solid #ff9800;
        }
        
        .gap-severity {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .gap-severity.critical {
          background: #ffebee;
          color: #c62828;
        }
        
        .gap-severity.high {
          background: #fff3e0;
          color: #ef6c00;
        }
        
        .security-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .security-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #e8f5e9;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .security-icon {
          font-size: 32px;
        }
      `}</style>

      <div className="dashboard-header">
        <h1 className="dashboard-title">🔬 معمل التطوير الذكي</h1>
        <p className="dashboard-subtitle">مستشارك الاستراتيجي المدعوم بالذكاء الاصطناعي</p>
        <div className="privacy-badge">
          🔒 بياناتك محمية ومشفرة بالكامل - لا مشاركة مع أي طرف آخر
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          نظرة عامة
        </button>
        <button className={`tab ${activeTab === 'research' ? 'active' : ''}`} onClick={() => setActiveTab('research')}>
          الأبحاث والابتكارات
        </button>
        <button className={`tab ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}>
          خارطة التصدير
        </button>
        <button className={`tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
          الأمان والخصوصية
        </button>
      </div>

      {activeTab === 'overview' && metrics && (
        <div>
          <div className="overview-grid">
            <div className="metric-card">
              <div className="metric-title">النتيجة الإجمالية</div>
              <div className="metric-value">{metrics.overallScore}/100</div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: `${metrics.overallScore}%` }}></div>
              </div>
            </div>
            
            {Object.entries(metrics.dimensions).map(([key, value]) => (
              <div key={key} className="metric-card">
                <div className="metric-title">{getDimensionLabel(key)}</div>
                <div className="metric-value">{value}/100</div>
                <div className="metric-bar">
                  <div className="metric-bar-fill" style={{ width: `${value}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="recommendations-section">
            <h2 className="section-title">📋 التوصيات الاستراتيجية</h2>
            {metrics.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                {rec}
              </div>
            ))}
          </div>

          <h2 className="section-title">🎯 المعالم القادمة</h2>
          {metrics.nextMilestones.map((milestone, index) => (
            <div key={index} className="milestone-card">
              <div className="milestone-header">
                <div className="milestone-title">{milestone.title}</div>
                <span className={`milestone-status ${milestone.status}`}>
                  {getStatusLabel(milestone.status)}
                </span>
              </div>
              <p>{milestone.description}</p>
              <div style={{ marginTop: '12px' }}>
                <strong>الإجراءات المطلوبة:</strong>
                <ul>
                  {milestone.requiredActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'research' && (
        <div>
          <h2 className="section-title">🔍 أحدث الأبحاث والابتكارات</h2>
          {research.map((finding, index) => (
            <div key={index} className="research-card">
              <span className="relevance-score">ملاءمة: {(finding.relevanceScore * 100).toFixed(0)}%</span>
              <h3>{finding.topic}</h3>
              <p>{finding.summary}</p>
              
              <div style={{ marginTop: '16px' }}>
                <strong>رؤى قابلة للتنفيذ:</strong>
                <ul>
                  {finding.actionableInsights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>

              {finding.relatedSuppliers && finding.relatedSuppliers.length > 0 && (
                <div>
                  <strong style={{ display: 'block', marginTop: '16px', marginBottom: '12px' }}>موردون محتملون:</strong>
                  <div className="supplier-grid">
                    {finding.relatedSuppliers.map((supplier, i) => (
                      <div key={i} className="supplier-card">
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{supplier.name}</div>
                        <div style={{ fontSize: '14px', color: '#666' }}>📍 {supplier.location}</div>
                        <div style={{ fontSize: '14px', color: '#666' }}>🔧 {supplier.specialty}</div>
                        {supplier.estimatedCost && (
                          <div style={{ fontSize: '14px', color: '#666' }}>💰 {supplier.estimatedCost}</div>
                        )}
                        {supplier.qualityRating && (
                          <div style={{ fontSize: '14px', color: '#666' }}>⭐ {supplier.qualityRating}/5</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'export' && exportRoadmap && (
        <div className="export-roadmap">
          <h2 className="section-title">🌍 خارطة طريق التصدير</h2>
          
          <div className="readiness-meter">
            <div className="readiness-circle" style={{ background: `conic-gradient(#4caf50 0% ${exportRoadmap.readinessScore}%, #e0e0e0 ${exportRoadmap.readinessScore}% 100%)` }}>
              <div className="readiness-inner">
                <div className="readiness-score">{exportRoadmap.readinessScore}%</div>
                <div style={{ fontSize: '14px', color: '#666' }}>جاهزية التصدير</div>
              </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>
              الوقت المقدر للتصدير: <strong>{exportRoadmap.estimatedTimeToExport}</strong>
            </div>
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '16px' }}>الأسواق المستهدفة</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {exportRoadmap.targetMarkets.map((market, i) => (
              <span key={i} style={{ padding: '8px 16px', background: '#e3f2fd', borderRadius: '20px', color: '#1976d2' }}>
                {market}
              </span>
            ))}
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '16px' }}>الفجوات التي يجب معالجتها</h3>
          {exportRoadmap.gaps.map((gap, i) => (
            <div key={i} className="gap-item">
              <span className={`gap-severity ${gap.severity}`}>{getSeverityLabel(gap.severity)}</span>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{gap.category}</div>
              <div>{gap.description}</div>
            </div>
          ))}

          <h3 style={{ marginTop: '30px', marginBottom: '16px' }}>خطة العمل</h3>
          {exportRoadmap.actionPlan.map((action, i) => (
            <div key={i} style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong>{action.title}</strong>
                <span style={{ fontSize: '12px', color: '#666' }}>⏱️ {action.estimatedDuration}</span>
              </div>
              <div>{action.description}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="security-section">
          <h2 className="section-title">🔐 الأمان والخصوصية</h2>
          
          <div className="security-badge">
            <span className="security-icon">✅</span>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>بياناتك محمية بالكامل</div>
              <div style={{ fontSize: '14px', color: '#666' }}>جميع البيانات مشفرة ومعزولة تمامًا</div>
            </div>
          </div>

          <h3 style={{ marginBottom: '16px' }}>التزاماتنا تجاهك:</h3>
          <ul style={{ lineHeight: '2' }}>
            <li>عزل كامل للبيانات بين المصانع</li>
            <li>لا مشاركة للبيانات أو التحليلات بين المصانع</li>
            <li>جميع البيانات الحساسة مشفرة</li>
            <li>سجلات وصول كاملة للشفافية</li>
            <li>الوكيل يعمل حصريًا لأغراض التطوير</li>
            <li>لديك السيطرة الكاملة على بياناتك</li>
          </ul>

          <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>ضماناتنا:</h3>
          <ul style={{ lineHeight: '2' }}>
            <li>لن يتم مشاركة بياناتك مع المنافسين أبدًا</li>
            <li>رؤاك الاستراتيجية تبقى سرية</li>
            <li>يمكنك طلب حذف البيانات في أي وقت</li>
            <li>لديك وصول كامل لجميع سجلات التدقيق</li>
            <li>الوكيل يعمل فقط لصالحك</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    productQuality: 'جودة المنتج',
    customerSatisfaction: 'رضا العملاء',
    marketCompetitiveness: 'التنافسية في السوق',
    innovationCapacity: 'قدرة الابتكار',
    exportReadiness: 'جاهزية التصدير'
  };
  return labels[key] || key;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: 'لم يبدأ',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل'
  };
  return labels[status] || status;
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    critical: 'حرج',
    high: 'عالي',
    medium: 'متوسط',
    low: 'منخفض'
  };
  return labels[severity] || severity;
}
