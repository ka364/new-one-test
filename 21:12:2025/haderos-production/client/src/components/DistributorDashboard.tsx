/**
 * Distributor Dashboard
 * لوحة تحكم الموزع
 * 
 * Dashboard for delivery distributors to manage assignments,
 * track earnings, and view performance metrics.
 */

import React, { useState } from 'react';

interface Assignment {
  id: string;
  assignmentNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryAddressAr: string;
  distance: number;
  fee: number;
  earning: number;
  status: 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered';
  assignedDate: Date;
  estimatedTime: number;
}

export function DistributorDashboard() {
  const [distributor] = useState({
    name: 'أحمد الموزع',
    tier: 'gold',
    rating: 4.8,
    totalRatings: 245,
  });

  const [stats] = useState({
    todayDeliveries: 12,
    todayEarnings: 960,
    weekDeliveries: 78,
    weekEarnings: 6240,
    monthDeliveries: 312,
    monthEarnings: 24960,
    successRate: 98.5,
    averageRating: 4.8,
    availableCapacity: 8,
    maxCapacity: 20,
  });

  const [assignments] = useState<Assignment[]>([
    {
      id: '1',
      assignmentNumber: '#ASGN001',
      customerName: 'محمد علي',
      customerPhone: '01012345678',
      deliveryAddress: '15 شارع النيل، المعادي، القاهرة',
      deliveryAddressAr: '15 شارع النيل، المعادي، القاهرة',
      distance: 8.5,
      fee: 80,
      earning: 64,
      status: 'assigned',
      assignedDate: new Date(),
      estimatedTime: 0.5,
    },
    {
      id: '2',
      assignmentNumber: '#ASGN002',
      customerName: 'فاطمة أحمد',
      customerPhone: '01098765432',
      deliveryAddress: '42 شارع الهرم، الجيزة',
      deliveryAddressAr: '42 شارع الهرم، الجيزة',
      distance: 12.3,
      fee: 100,
      earning: 80,
      status: 'picked_up',
      assignedDate: new Date(Date.now() - 30 * 60 * 1000),
      estimatedTime: 0.7,
    },
  ]);

  const statusColors = {
    assigned: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    picked_up: 'bg-yellow-100 text-yellow-700',
    in_transit: 'bg-purple-100 text-purple-700',
    delivered: 'bg-gray-100 text-gray-700',
  };

  const statusLabels = {
    assigned: 'جديد',
    accepted: 'مقبول',
    picked_up: 'تم الاستلام',
    in_transit: 'في الطريق',
    delivered: 'تم التوصيل',
  };

  const tierColors = {
    bronze: 'text-orange-600',
    silver: 'text-gray-500',
    gold: 'text-yellow-500',
    platinum: 'text-purple-600',
  };

  const tierLabels = {
    bronze: 'برونزي',
    silver: 'فضي',
    gold: 'ذهبي',
    platinum: 'بلاتيني',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">مرحباً، {distributor.name}! 🚚</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className={`text-lg font-semibold ${tierColors[distributor.tier]}`}>
            ⭐ {tierLabels[distributor.tier]}
          </span>
          <span className="text-gray-600">
            {distributor.rating} ⭐ ({distributor.totalRatings} تقييم)
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">توصيلات اليوم</span>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.todayDeliveries}</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.availableCapacity} متاح من {stats.maxCapacity}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">أرباح اليوم</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.todayEarnings} ج.م</p>
          <p className="text-sm text-gray-500 mt-1">
            {(stats.todayEarnings / stats.todayDeliveries).toFixed(0)} ج.م متوسط
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">معدل النجاح</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats.successRate}%</p>
          <p className="text-sm text-gray-500 mt-1">ممتاز!</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">أرباح الشهر</span>
            <span className="text-2xl">💵</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.monthEarnings.toLocaleString()} ج.م</p>
          <p className="text-sm text-gray-500 mt-1">{stats.monthDeliveries} توصيلة</p>
        </div>
      </div>

      {/* Active Assignments */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">📋 الطلبات النشطة ({assignments.length})</h2>

        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{assignment.assignmentNumber}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[assignment.status]}`}>
                      {statusLabels[assignment.status]}
                    </span>
                  </div>
                  <p className="text-gray-600">{assignment.customerName} - {assignment.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{assignment.earning} ج.م</p>
                  <p className="text-sm text-gray-500">{assignment.distance} كم</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">📍 عنوان التوصيل:</p>
                <p className="font-semibold">{assignment.deliveryAddressAr}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  ⏱️ وقت التوصيل المتوقع: {assignment.estimatedTime} ساعة
                </span>

                <div className="flex gap-2">
                  {assignment.status === 'assigned' && (
                    <>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                        قبول
                      </button>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
                        رفض
                      </button>
                    </>
                  )}

                  {assignment.status === 'accepted' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                      بدء الاستلام
                    </button>
                  )}

                  {assignment.status === 'picked_up' && (
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
                      في الطريق
                    </button>
                  )}

                  {assignment.status === 'in_transit' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                      تم التوصيل
                    </button>
                  )}

                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                    خريطة
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                    اتصال
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">📊 أداء الأسبوع</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">التوصيلات</span>
                <span className="text-xl font-bold text-blue-600">{stats.weekDeliveries}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 rounded-full h-3" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">85% من الهدف الأسبوعي (90 توصيلة)</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">الأرباح</span>
                <span className="text-xl font-bold text-green-600">{stats.weekEarnings.toLocaleString()} ج.م</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 rounded-full h-3" style={{ width: '80%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">80% من الهدف الأسبوعي (7,800 ج.م)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">🎯 نصائح لزيادة الأرباح</h2>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">💡 قبول المزيد من الطلبات</p>
              <p className="text-sm text-blue-700">
                لديك سعة متاحة {stats.availableCapacity} طلبات. قبول المزيد يزيد أرباحك!
              </p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-green-900 mb-1">⭐ حافظ على التقييم العالي</p>
              <p className="text-sm text-green-700">
                تقييمك الحالي {stats.averageRating} ممتاز! استمر في تقديم خدمة متميزة.
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-semibold text-purple-900 mb-1">🚀 ترقية إلى بلاتيني</p>
              <p className="text-sm text-purple-700">
                أكمل 688 توصيلة أخرى بنجاح للوصول إلى المستوى البلاتيني!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">⚡ إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">💰</div>
            <p className="font-semibold">سحب الأرباح</p>
          </button>

          <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">📊</div>
            <p className="font-semibold">التقارير</p>
          </button>

          <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">📍</div>
            <p className="font-semibold">تحديث الموقع</p>
          </button>

          <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-2">💬</div>
            <p className="font-semibold">الدعم</p>
          </button>
        </div>
      </div>
    </div>
  );
}
