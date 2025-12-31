/**
 * Broadcaster Assistant Dashboard
 * 
 * A comprehensive real-time dashboard that provides the broadcaster with
 * all the tools and insights needed during a live stream.
 */

import React, { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';

interface BroadcasterAssistantProps {
  streamId: string;
}

export const BroadcasterAssistant: React.FC<BroadcasterAssistantProps> = ({ streamId }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'revenue' | 'insights'>('feed');
  
  // Real-time subscriptions
  const feedQuery = trpc.liveShowroom.getUnifiedFeed.useQuery({ streamId });
  const revenueQuery = trpc.liveShowroom.getStreamRevenue.useQuery({ streamId });
  const insightsQuery = trpc.liveShowroom.getStreamInsights.useQuery({ streamId });

  return (
    <div className="broadcaster-assistant">
      {/* Header with key metrics */}
      <div className="assistant-header">
        <div className="metric-card">
          <div className="metric-label">المشاهدون الآن</div>
          <div className="metric-value">{insightsQuery.data?.currentViewers || 0}</div>
          <div className="metric-trend positive">+12%</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">الطلبات</div>
          <div className="metric-value">{insightsQuery.data?.totalOrders || 0}</div>
          <div className="metric-change">+{insightsQuery.data?.newOrders || 0} جديد</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">الأرباح</div>
          <div className="metric-value">{revenueQuery.data?.totalRevenue || 0} جنيه</div>
          <div className="metric-breakdown">
            من {Object.keys(revenueQuery.data?.breakdown || {}).length} منصة
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">التفاعل</div>
          <div className="metric-value">{feedQuery.data?.stats.totalInteractions || 0}</div>
          <div className="metric-rate">معدل عالي</div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="assistant-tabs">
        <button 
          className={activeTab === 'feed' ? 'active' : ''}
          onClick={() => setActiveTab('feed')}
        >
          التعليقات والتفاعل
        </button>
        <button 
          className={activeTab === 'revenue' ? 'active' : ''}
          onClick={() => setActiveTab('revenue')}
        >
          الأرباح
        </button>
        <button 
          className={activeTab === 'insights' ? 'active' : ''}
          onClick={() => setActiveTab('insights')}
        >
          الرؤى الذكية
        </button>
      </div>

      {/* Content area */}
      <div className="assistant-content">
        {activeTab === 'feed' && <UnifiedFeedView streamId={streamId} />}
        {activeTab === 'revenue' && <RevenueView streamId={streamId} />}
        {activeTab === 'insights' && <InsightsView streamId={streamId} />}
      </div>

      {/* Priority alerts */}
      <PriorityAlerts streamId={streamId} />
    </div>
  );
};

// Unified Feed Component
const UnifiedFeedView: React.FC<{ streamId: string }> = ({ streamId }) => {
  const feedQuery = trpc.liveShowroom.getUnifiedFeed.useQuery({ streamId });
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  return (
    <div className="unified-feed">
      {/* Platform filters */}
      <div className="platform-filters">
        <button onClick={() => setPlatformFilter('all')}>الكل</button>
        <button onClick={() => setPlatformFilter('facebook')}>
          <img src="/icons/facebook.svg" alt="Facebook" /> فيسبوك
        </button>
        <button onClick={() => setPlatformFilter('youtube')}>
          <img src="/icons/youtube.svg" alt="YouTube" /> يوتيوب
        </button>
        <button onClick={() => setPlatformFilter('tiktok')}>
          <img src="/icons/tiktok.svg" alt="TikTok" /> تيك توك
        </button>
        <button onClick={() => setPlatformFilter('instagram')}>
          <img src="/icons/instagram.svg" alt="Instagram" /> إنستغرام
        </button>
      </div>

      {/* Interaction feed */}
      <div className="feed-list">
        {feedQuery.data?.interactions.map((interaction) => (
          <div key={interaction.id} className={`interaction-item ${interaction.type}`}>
            <div className="interaction-header">
              <img src={interaction.userAvatar} alt={interaction.username} className="user-avatar" />
              <div className="user-info">
                <span className="username">{interaction.username}</span>
                {interaction.metadata?.isVIP && <span className="vip-badge">VIP</span>}
                {interaction.metadata?.isVerified && <span className="verified-badge">✓</span>}
              </div>
              <span className="platform-badge">{interaction.platform}</span>
            </div>
            <div className="interaction-content">{interaction.content}</div>
            {interaction.type === 'order' && (
              <div className="order-details">
                طلب بقيمة {interaction.metadata?.orderValue} جنيه
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Revenue View Component
const RevenueView: React.FC<{ streamId: string }> = ({ streamId }) => {
  const revenueQuery = trpc.liveShowroom.getStreamRevenue.useQuery({ streamId });

  return (
    <div className="revenue-view">
      <div className="revenue-summary">
        <h3>إجمالي الأرباح: {revenueQuery.data?.totalRevenue || 0} جنيه</h3>
        <p>{revenueQuery.data?.transactionCount || 0} معاملة</p>
      </div>

      {/* Revenue breakdown by platform */}
      <div className="revenue-breakdown">
        <h4>التوزيع حسب المنصة</h4>
        {Object.entries(revenueQuery.data?.breakdown || {}).map(([platform, amount]) => (
          <div key={platform} className="platform-revenue">
            <span className="platform-name">{platform}</span>
            <div className="revenue-bar">
              <div 
                className="revenue-fill" 
                style={{ width: `${(amount / (revenueQuery.data?.totalRevenue || 1)) * 100}%` }}
              />
            </div>
            <span className="revenue-amount">{amount} جنيه</span>
          </div>
        ))}
      </div>

      {/* Top donor */}
      {revenueQuery.data?.topDonor && (
        <div className="top-donor">
          <h4>أكبر داعم</h4>
          <p>{revenueQuery.data.topDonor.username}: {revenueQuery.data.topDonor.amount} جنيه</p>
        </div>
      )}
    </div>
  );
};

// Insights View Component
const InsightsView: React.FC<{ streamId: string }> = ({ streamId }) => {
  const insightsQuery = trpc.liveShowroom.getStreamInsights.useQuery({ streamId });

  return (
    <div className="insights-view">
      {/* AI-powered suggestions */}
      <div className="ai-suggestions">
        <h4>🤖 اقتراحات ذكية</h4>
        <ul>
          {insightsQuery.data?.suggestions.map((suggestion, index) => (
            <li key={index} className="suggestion-item">
              <span className="suggestion-icon">{suggestion.icon}</span>
              <span className="suggestion-text">{suggestion.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Most requested products */}
      <div className="hot-products">
        <h4>🔥 المنتجات الأكثر طلباً</h4>
        <div className="product-list">
          {insightsQuery.data?.hotProducts.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} />
              <div className="product-info">
                <h5>{product.name}</h5>
                <p>{product.requestCount} طلب</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently asked questions */}
      <div className="faq-section">
        <h4>❓ الأسئلة الشائعة</h4>
        <ul>
          {insightsQuery.data?.topQuestions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Priority Alerts Component
const PriorityAlerts: React.FC<{ streamId: string }> = ({ streamId }) => {
  const [alerts, setAlerts] = useState<any[]>([]);

  // Subscribe to priority events
  useEffect(() => {
    // This would use WebSocket or SSE in production
    const subscription = trpc.liveShowroom.subscribeToPriorityEvents.useSubscription(
      { streamId },
      {
        onData: (alert) => {
          setAlerts(prev => [alert, ...prev].slice(0, 5));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [streamId]);

  if (alerts.length === 0) return null;

  return (
    <div className="priority-alerts">
      {alerts.map((alert, index) => (
        <div key={index} className={`alert alert-${alert.type}`}>
          <span className="alert-icon">{alert.icon}</span>
          <span className="alert-message">{alert.message}</span>
        </div>
      ))}
    </div>
  );
};

export default BroadcasterAssistant;
