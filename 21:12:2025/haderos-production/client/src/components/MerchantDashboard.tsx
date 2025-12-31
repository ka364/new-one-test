/**
 * Merchant Dashboard
 * لوحة تحكم التاجر
 * 
 * Comprehensive dashboard for merchants to manage their stores,
 * track sales, monitor inventory, and view AI-powered predictions.
 */

import React, { useState } from 'react';

interface MerchantStats {
  totalInventoryValue: number;
  totalInventoryItems: number;
  lowStockItems: number;
  pendingOrders: number;
  todayOrders: number;
  todaySales: number;
  todayProfit: number;
  monthSales: number;
  monthProfit: number;
}

interface SalesPrediction {
  expectedSales: number;
  expectedOrders: number;
  expectedProfit: number;
  confidence: number;
}

interface InventoryAlert {
  productName: string;
  productNameAr: string;
  currentStock: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  daysUntilStockout: number;
  reorderQuantity: number;
}

export function MerchantDashboard() {
  const [merchant] = useState({
    name: 'محمد التاجر',
    storeName: 'متجر محمد للملابس',
    storeUrl: 'haderos.com/store/mer123',
    tier: 'gold',
  });

  const [stats] = useState<MerchantStats>({
    totalInventoryValue: 250000,
    totalInventoryItems: 850,
    lowStockItems: 12,
    pendingOrders: 8,
    todayOrders: 15,
    todaySales: 12500,
    todayProfit: 3750,
    monthSales: 185000,
    monthProfit: 55500,
  });

  const [prediction] = useState<SalesPrediction>({
    expectedSales: 14000,
    expectedOrders: 18,
    expectedProfit: 4200,
    confidence: 87,
  });

  const [alerts] = useState<InventoryAlert[]>([
    {
      productName: 'White T-Shirt',
      productNameAr: 'تيشيرت أبيض',
      currentStock: 8,
      urgency: 'critical',
      daysUntilStockout: 2,
      reorderQuantity: 50,
    },
    {
      productName: 'Blue Jeans',
      productNameAr: 'بنطلون جينز أزرق',
      currentStock: 15,
      urgency: 'high',
      daysUntilStockout: 5,
      reorderQuantity: 40,
    },
  ]);

  const urgencyColors = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-green-100 text-green-700 border-green-300',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">مرحباً، {merchant.name}! 👋</h1>
        <p className="text-gray-600 mt-2">{merchant.storeName}</p>
        <p className="text-sm text-blue-600 mt-1">{merchant.storeUrl}</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">مبيعات اليوم</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.todaySales.toLocaleString()} ج.م</p>
          <p className="text-sm text-gray-500 mt-1">{stats.todayOrders} طلب</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">ربح اليوم</span>
            <span className="text-2xl">💵</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.todayProfit.toLocaleString()} ج.م</p>
          <p className="text-sm text-gray-500 mt-1">هامش {((stats.todayProfit / stats.todaySales) * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">قيمة المخزون</span>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats.totalInventoryValue.toLocaleString()} ج.م</p>
          <p className="text-sm text-gray-500 mt-1">{stats.totalInventoryItems} قطعة</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">طلبات معلقة</span>
            <span className="text-2xl">🛒</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
          <p className="text-sm text-gray-500 mt-1">تحتاج معالجة</p>
        </div>
      </div>

      {/* AI Prediction Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">🤖</span>
          <div>
            <h2 className="text-2xl font-bold">التنبؤ بمبيعات الغد</h2>
            <p className="text-indigo-100">مدعوم بالذكاء الاصطناعي - دقة {prediction.confidence}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
            <p className="text-sm text-indigo-100 mb-1">المبيعات المتوقعة</p>
            <p className="text-2xl font-bold">{prediction.expectedSales.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
            <p className="text-sm text-indigo-100 mb-1">الطلبات المتوقعة</p>
            <p className="text-2xl font-bold">{prediction.expectedOrders} طلب</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
            <p className="text-sm text-indigo-100 mb-1">الربح المتوقع</p>
            <p className="text-2xl font-bold">{prediction.expectedProfit.toLocaleString()} ج.م</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white/10 rounded-lg">
          <p className="text-sm">
            💡 <strong>توصية:</strong> بناءً على التحليل، من المتوقع زيادة في المبيعات بنسبة 12% غداً. تأكد من توفر المنتجات الأكثر مبيعاً!
          </p>
        </div>
      </div>

      {/* Inventory Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">⚠️ تنبيهات المخزون ({alerts.length})</h2>
            <span className="text-sm text-gray-600">يحتاج انتباهك الآن</span>
          </div>

          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 ${urgencyColors[alert.urgency]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-lg">{alert.productNameAr}</p>
                    <p className="text-sm opacity-75">{alert.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{alert.currentStock}</p>
                    <p className="text-xs">قطعة متبقية</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>
                    {alert.urgency === 'critical' && '🚨 حرج'}
                    {alert.urgency === 'high' && '⚠️ عالي'}
                    {alert.urgency === 'medium' && '⚡ متوسط'}
                    {alert.urgency === 'low' && '✅ منخفض'}
                    {' - '}
                    سينفد خلال {alert.daysUntilStockout} يوم
                  </span>
                  <button className="px-4 py-2 bg-white rounded-lg font-semibold hover:shadow-md transition-shadow">
                    اطلب {alert.reorderQuantity} قطعة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">📊 أداء الشهر</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">إجمالي المبيعات</span>
                <span className="text-xl font-bold text-blue-600">{stats.monthSales.toLocaleString()} ج.م</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 rounded-full h-3" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">75% من الهدف الشهري (250,000 ج.م)</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">إجمالي الربح</span>
                <span className="text-xl font-bold text-green-600">{stats.monthProfit.toLocaleString()} ج.م</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 rounded-full h-3" style={{ width: '70%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">هامش ربح {((stats.monthProfit / stats.monthSales) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">🏆 أفضل المنتجات</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥇</span>
                <div>
                  <p className="font-semibold">تيشيرت أبيض</p>
                  <p className="text-sm text-gray-600">120 قطعة مباعة</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-600">18,000 ج.م</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥈</span>
                <div>
                  <p className="font-semibold">بنطلون جينز</p>
                  <p className="text-sm text-gray-600">85 قطعة مباعة</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-600">12,750 ج.م</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥉</span>
                <div>
                  <p className="font-semibold">جاكيت شتوي</p>
                  <p className="text-sm text-gray-600">45 قطعة مباعة</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-600">9,000 ج.م</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">⚡ إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">📦</div>
            <p className="font-semibold">طلب جملة</p>
          </button>

          <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">📊</div>
            <p className="font-semibold">تقارير مفصلة</p>
          </button>

          <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">⚙️</div>
            <p className="font-semibold">إعدادات المتجر</p>
          </button>

          <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">💬</div>
            <p className="font-semibold">دعم فني</p>
          </button>
        </div>
      </div>
    </div>
  );
}
