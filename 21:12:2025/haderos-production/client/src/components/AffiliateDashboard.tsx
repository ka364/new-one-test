/**
 * Affiliate Dashboard
 * لوحة تحكم المسوق
 * 
 * This component provides a comprehensive dashboard for affiliates/marketers
 * to track their performance, commissions, and access marketing tools.
 */

import React, { useState } from 'react';

interface AffiliateStats {
  totalSales: number;
  totalOrders: number;
  totalCommission: number;
  paidCommission: number;
  unpaidCommission: number;
  pendingCommission: number;
  averageOrderValue: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTier?: string;
  salesUntilNextTier?: number;
}

interface AffiliateOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  orderAmount: number;
  commissionAmount: number;
  status: 'pending' | 'confirmed' | 'paid';
  orderDate: Date;
}

interface Affiliate {
  id: string;
  code: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  commissionRate: number;
}

const TIER_INFO = {
  bronze: { name: 'برونزي', nameEn: 'Bronze', color: '#CD7F32', icon: '🥉' },
  silver: { name: 'فضي', nameEn: 'Silver', color: '#C0C0C0', icon: '🥈' },
  gold: { name: 'ذهبي', nameEn: 'Gold', color: '#FFD700', icon: '🥇' },
  platinum: { name: 'بلاتيني', nameEn: 'Platinum', color: '#E5E4E2', icon: '💎' },
};

export function AffiliateDashboard() {
  // Mock data - in real app, fetch from API
  const [affiliate] = useState<Affiliate>({
    id: 'AFF123',
    code: 'AHME5678',
    name: 'أحمد محمد',
    tier: 'silver',
    commissionRate: 12,
  });

  const [stats] = useState<AffiliateStats>({
    totalSales: 75000,
    totalOrders: 45,
    totalCommission: 9000,
    paidCommission: 5000,
    unpaidCommission: 4000,
    pendingCommission: 500,
    averageOrderValue: 1667,
    tier: 'silver',
    nextTier: 'gold',
    salesUntilNextTier: 75000,
  });

  const [recentOrders] = useState<AffiliateOrder[]>([
    {
      id: '1',
      orderNumber: '#12345',
      customerName: 'محمد علي',
      orderAmount: 2500,
      commissionAmount: 300,
      status: 'confirmed',
      orderDate: new Date(),
    },
    {
      id: '2',
      orderNumber: '#12344',
      customerName: 'فاطمة أحمد',
      orderAmount: 1800,
      commissionAmount: 216,
      status: 'paid',
      orderDate: new Date(Date.now() - 86400000),
    },
  ]);

  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const tierInfo = TIER_INFO[affiliate.tier];
  const progressToNextTier = stats.nextTier && stats.salesUntilNextTier
    ? ((stats.totalSales / (stats.totalSales + stats.salesUntilNextTier)) * 100)
    : 100;

  const copyAffiliateLink = () => {
    const link = `https://haderos.com?ref=${affiliate.code}`;
    navigator.clipboard.writeText(link);
    alert('تم نسخ الرابط!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">مرحباً، {affiliate.name}! 👋</h1>
        <p className="text-gray-600 mt-2">لوحة تحكم المسوق</p>
      </div>

      {/* Affiliate Info Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 mb-2">كود المسوق الخاص بك</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{affiliate.code}</span>
              <button
                onClick={copyAffiliateLink}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                📋 نسخ الرابط
              </button>
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-2">{tierInfo.icon}</div>
            <p className="text-xl font-bold">{tierInfo.name}</p>
            <p className="text-blue-100">عمولة {affiliate.commissionRate}%</p>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {stats.nextTier && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>التقدم نحو {TIER_INFO[stats.nextTier as keyof typeof TIER_INFO].name}</span>
              <span>{stats.salesUntilNextTier?.toLocaleString()} ج.م متبقية</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${progressToNextTier}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">إجمالي المبيعات</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.totalSales.toLocaleString()} ج.م</p>
          <p className="text-sm text-gray-500 mt-1">{stats.totalOrders} طلب</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">العمولة الكلية</span>
            <span className="text-2xl">💵</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.totalCommission.toLocaleString()} ج.م</p>
          <p className="text-sm text-gray-500 mt-1">إجمالي ما كسبته</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">متاح للسحب</span>
            <span className="text-2xl">💳</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats.unpaidCommission.toLocaleString()} ج.م</p>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="mt-2 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            طلب سحب
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">متوسط قيمة الطلب</span>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.averageOrderValue.toLocaleString()} ج.م</p>
          <p className="text-sm text-gray-500 mt-1">لكل طلب</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">الطلبات الأخيرة</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">رقم الطلب</th>
                <th className="text-right py-3 px-4">العميل</th>
                <th className="text-right py-3 px-4">قيمة الطلب</th>
                <th className="text-right py-3 px-4">عمولتك</th>
                <th className="text-right py-3 px-4">الحالة</th>
                <th className="text-right py-3 px-4">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                  <td className="py-3 px-4">{order.customerName}</td>
                  <td className="py-3 px-4">{order.orderAmount.toLocaleString()} ج.م</td>
                  <td className="py-3 px-4 text-green-600 font-semibold">
                    {order.commissionAmount.toLocaleString()} ج.م
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        order.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {order.status === 'paid' ? 'مدفوع' : order.status === 'confirmed' ? 'مؤكد' : 'قيد الانتظار'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {order.orderDate.toLocaleDateString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marketing Tools */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">أدوات التسويق</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="font-semibold">صور المنتجات</p>
            <p className="text-sm text-gray-600">تحميل صور عالية الجودة</p>
          </button>

          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">🎥</div>
            <p className="font-semibold">فيديوهات ترويجية</p>
            <p className="text-sm text-gray-600">مقاطع جاهزة للنشر</p>
          </button>

          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">📝</div>
            <p className="font-semibold">نصوص تسويقية</p>
            <p className="text-sm text-gray-600">محتوى جاهز للنسخ</p>
          </button>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">طلب سحب العمولة</h3>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">المبلغ المتاح للسحب:</p>
              <p className="text-3xl font-bold text-green-600">{stats.unpaidCommission.toLocaleString()} ج.م</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة الدفع
              </label>
              <select className="w-full px-4 py-2 border rounded-lg">
                <option>تحويل بنكي</option>
                <option>كاش</option>
                <option>محفظة إلكترونية</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  alert('تم إرسال طلب السحب! سنتواصل معك قريباً.');
                  setShowPayoutModal(false);
                }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                تأكيد الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
