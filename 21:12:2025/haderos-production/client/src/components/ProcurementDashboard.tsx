/**
 * Procurement Dashboard
 * لوحة تحكم فريق المشتريات
 * 
 * Dashboard for the procurement team to manage "Fetch for Me" requests.
 */

import React, { useState } from 'react';

interface FetchRequest {
  id: string;
  requestNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productNameAr: string;
  productUrl?: string;
  quantity: number;
  sourceName: string;
  sourceLocation: string;
  estimatedProductPrice: number;
  totalEstimatedCost: number;
  status: 'paid' | 'procurement' | 'purchased' | 'shipping' | 'delivered';
  requestDate: Date;
  assignedTo?: string;
}

export function ProcurementDashboard() {
  const [requests] = useState<FetchRequest[]>([
    {
      id: '1',
      requestNumber: '#F12345678',
      customerName: 'أحمد محمد',
      customerPhone: '01012345678',
      productName: 'iPhone 15 Pro Max',
      productNameAr: 'آيفون 15 برو ماكس',
      productUrl: 'https://example.com/iphone',
      quantity: 1,
      sourceName: 'متجر أبل',
      sourceLocation: 'القاهرة - مول مصر',
      estimatedProductPrice: 45000,
      totalEstimatedCost: 51975,
      status: 'paid',
      requestDate: new Date(),
    },
    {
      id: '2',
      requestNumber: '#F87654321',
      customerName: 'فاطمة علي',
      customerPhone: '01098765432',
      productName: 'Samsung Galaxy Watch 6',
      productNameAr: 'ساعة سامسونج جالاكسي 6',
      quantity: 1,
      sourceName: 'متجر سامسونج',
      sourceLocation: 'الإسكندرية - سان ستيفانو',
      estimatedProductPrice: 8000,
      totalEstimatedCost: 9380,
      status: 'procurement',
      requestDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      assignedTo: 'EMP001',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'paid' | 'procurement' | 'purchased'>('all');

  const statusColors = {
    paid: 'bg-blue-100 text-blue-700 border-blue-300',
    procurement: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    purchased: 'bg-green-100 text-green-700 border-green-300',
    shipping: 'bg-purple-100 text-purple-700 border-purple-300',
    delivered: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const statusLabels = {
    paid: 'مدفوع - جاهز للشراء',
    procurement: 'جاري الشراء',
    purchased: 'تم الشراء',
    shipping: 'جاري الشحن',
    delivered: 'تم التوصيل',
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const stats = {
    pending: requests.filter(r => r.status === 'paid').length,
    inProgress: requests.filter(r => r.status === 'procurement').length,
    purchased: requests.filter(r => r.status === 'purchased').length,
    totalValue: requests.reduce((sum, r) => sum + r.totalEstimatedCost, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم فريق المشتريات 🛍️</h1>
        <p className="text-gray-600 mt-2">إدارة طلبات خدمة "أحضر لي"</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">طلبات جديدة</span>
            <span className="text-2xl">🆕</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
          <p className="text-sm text-gray-500 mt-1">تحتاج شراء</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">جاري الشراء</span>
            <span className="text-2xl">🛒</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
          <p className="text-sm text-gray-500 mt-1">قيد التنفيذ</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">تم الشراء</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.purchased}</p>
          <p className="text-sm text-gray-500 mt-1">جاهز للشحن</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">إجمالي القيمة</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats.totalValue.toLocaleString()} ج.م</p>
          <p className="text-sm text-gray-500 mt-1">طلبات نشطة</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            الكل ({requests.length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'paid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            جديد ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('procurement')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'procurement' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            جاري الشراء ({stats.inProgress})
          </button>
          <button
            onClick={() => setFilter('purchased')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'purchased' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            تم الشراء ({stats.purchased})
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-xl">{request.requestNumber}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${statusColors[request.status]}`}>
                    {statusLabels[request.status]}
                  </span>
                </div>
                <p className="text-gray-600">
                  {request.customerName} - {request.customerPhone}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{request.totalEstimatedCost.toLocaleString()} ج.م</p>
                <p className="text-sm text-gray-500">مدفوع مسبقاً ✅</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">📦 المنتج المطلوب:</p>
                <p className="font-semibold text-lg">{request.productNameAr}</p>
                <p className="text-sm text-gray-600">{request.productName}</p>
                {request.productUrl && (
                  <a href={request.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                    🔗 رابط المنتج
                  </a>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">🏪 مكان الشراء:</p>
                <p className="font-semibold text-lg">{request.sourceName}</p>
                <p className="text-sm text-gray-600">📍 {request.sourceLocation}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">💵 السعر المتوقع:</p>
                <p className="font-semibold text-lg">{request.estimatedProductPrice.toLocaleString()} ج.م</p>
                <p className="text-sm text-gray-600">الكمية: {request.quantity}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">📅 تاريخ الطلب:</p>
                <p className="font-semibold">{request.requestDate.toLocaleString('ar-EG')}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {request.status === 'paid' && (
                <>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    تعيين لي
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                    تفاصيل
                  </button>
                </>
              )}

              {request.status === 'procurement' && (
                <>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                    تأكيد الشراء
                  </button>
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700">
                    رفع الفاتورة
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                    ملاحظات
                  </button>
                </>
              )}

              {request.status === 'purchased' && (
                <>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
                    إرسال للشحن
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                    عرض الفاتورة
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">لا توجد طلبات في هذه الفئة</p>
        </div>
      )}
    </div>
  );
}
