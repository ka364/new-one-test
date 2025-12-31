/**
 * Factory Broadcast Control Panel
 * لوحة تحكم البث المباشر للمصنع
 * 
 * This component provides a complete control panel for factories
 * to manage their live streams across multiple platforms.
 */

import React, { useState, useEffect } from 'react';

interface Platform {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  isEnabled: boolean;
  status: 'connected' | 'disconnected' | 'streaming' | 'error';
  viewerCount: number;
}

interface Comment {
  id: string;
  platform: string;
  userName: string;
  message: string;
  timestamp: Date;
  isQuestion: boolean;
  isHighlighted: boolean;
}

interface StreamStats {
  totalViewers: number;
  totalComments: number;
  totalOrders: number;
  totalRevenue: number;
  peakViewers: number;
}

export function FactoryBroadcastPanel() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamTitleAr, setStreamTitleAr] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'facebook', name: 'Facebook Live', nameAr: 'فيسبوك لايف', icon: '📘', color: '#1877F2', isEnabled: true, status: 'connected', viewerCount: 0 },
    { id: 'youtube', name: 'YouTube Live', nameAr: 'يوتيوب لايف', icon: '📺', color: '#FF0000', isEnabled: true, status: 'connected', viewerCount: 0 },
    { id: 'instagram', name: 'Instagram Live', nameAr: 'انستجرام لايف', icon: '📷', color: '#E4405F', isEnabled: false, status: 'disconnected', viewerCount: 0 },
    { id: 'tiktok', name: 'TikTok Live', nameAr: 'تيك توك لايف', icon: '🎵', color: '#000000', isEnabled: false, status: 'disconnected', viewerCount: 0 },
    { id: 'haderos', name: 'HADEROS Platform', nameAr: 'منصة هاديروس', icon: '🏭', color: '#4F46E5', isEnabled: true, status: 'connected', viewerCount: 0 },
  ]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<StreamStats>({
    totalViewers: 0,
    totalComments: 0,
    totalOrders: 0,
    totalRevenue: 0,
    peakViewers: 0,
  });

  const handleStartStream = () => {
    if (!streamTitle || !streamTitleAr) {
      alert('الرجاء إدخال عنوان البث');
      return;
    }
    setIsStreaming(true);
    // TODO: Call API to start stream
  };

  const handleStopStream = () => {
    if (confirm('هل أنت متأكد من إيقاف البث؟')) {
      setIsStreaming(false);
      // TODO: Call API to stop stream
    }
  };

  const togglePlatform = (platformId: string) => {
    setPlatforms(prev =>
      prev.map(p =>
        p.id === platformId ? { ...p, isEnabled: !p.isEnabled } : p
      )
    );
  };

  const totalViewers = platforms.reduce((sum, p) => sum + p.viewerCount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🎥 لوحة تحكم البث المباشر</h1>
        <p className="text-gray-600 mt-2">إدارة البث المباشر على جميع المنصات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stream Setup */}
          {!isStreaming && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">إعداد البث</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان البث (عربي)
                  </label>
                  <input
                    type="text"
                    value={streamTitleAr}
                    onChange={(e) => setStreamTitleAr(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: عرض المنتجات الجديدة - شتاء 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان البث (English)
                  </label>
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Example: New Products Showcase - Winter 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    اختر المنصات
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          platform.isEnabled
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        disabled={platform.id === 'haderos'}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{platform.icon}</span>
                            <span className="font-medium">{platform.nameAr}</span>
                          </div>
                          {platform.isEnabled && <span className="text-green-500">✓</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartStream}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  🔴 بدء البث المباشر
                </button>
              </div>
            </div>
          )}

          {/* Live Stream View */}
          {isStreaming && (
            <div className="bg-black rounded-lg shadow-md overflow-hidden">
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">📹</div>
                  <p className="text-xl">البث المباشر جاري الآن</p>
                  <p className="text-sm text-gray-400 mt-2">قم بتوصيل الكاميرا أو OBS</p>
                </div>
              </div>
              
              <div className="bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{streamTitleAr}</h3>
                    <p className="text-sm text-gray-600">{streamTitle}</p>
                  </div>
                  <button
                    onClick={handleStopStream}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ⏹️ إيقاف البث
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Platform Status */}
          {isStreaming && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">حالة المنصات</h2>
              <div className="space-y-3">
                {platforms.filter(p => p.isEnabled).map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ borderColor: platform.color }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <p className="font-medium">{platform.nameAr}</p>
                        <p className="text-sm text-gray-600">
                          {platform.status === 'streaming' ? '🟢 بث مباشر' : '🔴 غير متصل'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold">{platform.viewerCount}</p>
                      <p className="text-sm text-gray-600">مشاهد</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📊 الإحصائيات</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي المشاهدين</span>
                <span className="text-2xl font-bold text-blue-600">{stats.totalViewers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ذروة المشاهدين</span>
                <span className="text-2xl font-bold text-purple-600">{stats.peakViewers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">التعليقات</span>
                <span className="text-2xl font-bold text-green-600">{stats.totalComments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الطلبات</span>
                <span className="text-2xl font-bold text-orange-600">{stats.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الإيرادات</span>
                <span className="text-2xl font-bold text-red-600">{stats.totalRevenue} ج.م</span>
              </div>
            </div>
          </div>

          {/* Comments */}
          {isStreaming && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">💬 التعليقات المباشرة</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد تعليقات بعد</p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-lg ${
                        comment.isHighlighted ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.userName}</span>
                            <span className="text-xs text-gray-500">{comment.platform}</span>
                            {comment.isQuestion && <span className="text-blue-500">❓</span>}
                          </div>
                          <p className="text-sm">{comment.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
