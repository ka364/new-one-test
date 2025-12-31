/**
 * Live Showroom Viewer
 * واجهة مشاهدة المعرض المباشر للعملاء
 * 
 * This component allows customers to watch the live stream,
 * see orders being prepared in real-time, and place their own orders.
 */

import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  image: string;
  inStock: boolean;
}

interface LiveOrderDisplay {
  orderNumber: string;
  customerName: string;
  status: string;
  statusAr: string;
  products: string[];
}

interface StreamInfo {
  title: string;
  titleAr: string;
  factoryName: string;
  viewerCount: number;
  isLive: boolean;
}

export function LiveShowroomViewer() {
  const [stream, setStream] = useState<StreamInfo>({
    title: 'New Products Showcase - Winter 2025',
    titleAr: 'عرض المنتجات الجديدة - شتاء 2025',
    factoryName: 'مصنع النور للملابس',
    viewerCount: 234,
    isLive: true,
  });

  const [currentOrder, setCurrentOrder] = useState<LiveOrderDisplay | null>({
    orderNumber: '#12345678',
    customerName: 'أحمد محمد',
    status: 'Packing order on camera',
    statusAr: 'جاري تغليف الطلب أمام الكاميرا',
    products: ['قميص قطن أبيض x2', 'بنطلون جينز x1'],
  });

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([
    { id: '1', name: 'White Cotton Shirt', nameAr: 'قميص قطن أبيض', price: 250, image: '/products/shirt.jpg', inStock: true },
    { id: '2', name: 'Blue Jeans', nameAr: 'بنطلون جينز أزرق', price: 450, image: '/products/jeans.jpg', inStock: true },
    { id: '3', name: 'Black Jacket', nameAr: 'جاكيت أسود', price: 600, image: '/products/jacket.jpg', inStock: false },
  ]);

  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const addToCart = (productId: string) => {
    const newCart = new Map(cart);
    newCart.set(productId, (newCart.get(productId) || 0) + 1);
    setCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = new Map(cart);
    const current = newCart.get(productId) || 0;
    if (current > 1) {
      newCart.set(productId, current - 1);
    } else {
      newCart.delete(productId);
    }
    setCart(newCart);
  };

  const getTotalAmount = () => {
    let total = 0;
    cart.forEach((quantity, productId) => {
      const product = featuredProducts.find(p => p.id === productId);
      if (product) {
        total += product.price * quantity;
      }
    });
    return total;
  };

  const handlePlaceOrder = () => {
    if (!customerName || !customerPhone) {
      alert('الرجاء إدخال الاسم ورقم الهاتف');
      return;
    }

    if (cart.size === 0) {
      alert('الرجاء إضافة منتجات إلى السلة');
      return;
    }

    // TODO: Call API to place order
    alert(`تم إرسال طلبك! سنتصل بك على ${customerPhone} لتأكيد الطلب وسيتم تحضيره أمام الكاميرا مباشرة!`);
    setCart(new Map());
    setShowOrderForm(false);
    setCustomerName('');
    setCustomerPhone('');
  };

  const cartItemCount = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{stream.factoryName}</h1>
              <p className="text-gray-600">{stream.titleAr}</p>
            </div>
            <div className="flex items-center gap-4">
              {stream.isLive && (
                <div className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full">
                  <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                  <span className="font-semibold">مباشر</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <span>👥</span>
                <span className="font-semibold">{stream.viewerCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stream */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden shadow-lg">
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">📹</div>
                  <p className="text-xl">البث المباشر</p>
                  <p className="text-sm text-gray-400 mt-2">شاهد المنتجات والطلبات يتم تحضيرها أمامك مباشرة</p>
                </div>
              </div>
            </div>

            {/* Current Order Being Prepared */}
            {currentOrder && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📦</span>
                  <div>
                    <h3 className="text-xl font-bold">جاري تحضير طلب الآن!</h3>
                    <p className="text-purple-100">شاهد كيف نحضر الطلبات بشفافية كاملة</p>
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">رقم الطلب: {currentOrder.orderNumber}</span>
                    <span className="font-semibold">العميل: {currentOrder.customerName}</span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm text-purple-100 mb-1">المنتجات:</p>
                    {currentOrder.products.map((product, index) => (
                      <p key={index} className="text-sm">• {product}</p>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-2xl">✨</span>
                    <span className="font-semibold">{currentOrder.statusAr}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Featured Products */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">المنتجات المعروضة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-4xl">👕</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{product.nameAr}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-blue-600">{product.price} ج.م</span>
                      {product.inStock ? (
                        <button
                          onClick={() => addToCart(product.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          إضافة للسلة
                        </button>
                      ) : (
                        <span className="text-red-600 font-semibold">غير متوفر</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shopping Cart */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">🛒 سلة المشتريات</h2>
                {cartItemCount > 0 && (
                  <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                    {cartItemCount}
                  </span>
                )}
              </div>

              {cart.size === 0 ? (
                <p className="text-gray-500 text-center py-8">السلة فارغة</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {Array.from(cart.entries()).map(([productId, quantity]) => {
                      const product = featuredProducts.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className="flex items-center justify-between border-b pb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.nameAr}</p>
                            <p className="text-xs text-gray-600">{product.price} ج.م</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(productId)}
                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="font-semibold">{quantity}</span>
                            <button
                              onClick={() => addToCart(productId)}
                              className="w-6 h-6 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-center justify-between text-xl font-bold">
                      <span>الإجمالي:</span>
                      <span className="text-blue-600">{getTotalAmount()} ج.م</span>
                    </div>
                  </div>

                  {!showOrderForm ? (
                    <button
                      onClick={() => setShowOrderForm(true)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      📱 إتمام الطلب
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="الاسم"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="tel"
                        placeholder="رقم الهاتف (واتساب)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        dir="ltr"
                      />
                      <button
                        onClick={handlePlaceOrder}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        ✅ تأكيد الطلب
                      </button>
                      <button
                        onClick={() => setShowOrderForm(false)}
                        className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>شفافية كاملة!</strong> سنتصل بك لتأكيد الطلب، ثم سنحضره ونغلفه أمام الكاميرا مباشرة!
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold mb-4">لماذا تثق بنا؟</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📹</span>
                  <div>
                    <p className="font-semibold">شفافية كاملة</p>
                    <p className="text-sm text-gray-600">شاهد طلبك يُحضر أمامك</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold">جودة مضمونة</p>
                    <p className="text-sm text-gray-600">منتجات أصلية من المصنع</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚚</span>
                  <div>
                    <p className="font-semibold">شحن سريع</p>
                    <p className="text-sm text-gray-600">توصيل خلال 2-3 أيام</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
