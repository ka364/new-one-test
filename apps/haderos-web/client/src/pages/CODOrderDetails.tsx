// @ts-nocheck
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Printer,
  RefreshCw,
  Truck,
  Package,
  Phone,
  MapPin,
  Calendar,
  User,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

export default function CODOrderDetailsPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const orderId = params.id as string;

  // استخدام tRPC query
  const {
    data: order,
    isLoading,
    refetch,
  } = trpc.cod.getOrderById.useQuery({
    id: parseInt(orderId),
  });

  // tRPC mutations
  const updateStatus = trpc.cod.updateOrderStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const createShipment = trpc.cod.createBostaShipment.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">الطلب غير موجود</h2>
        <p className="text-gray-600">تعذر العثور على الطلب المطلوب</p>
        <Button onClick={() => navigate('/cod-tracking')} className="mt-4">
          العودة للقائمة
        </Button>
      </div>
    );
  }

  // استخراج بيانات الطلب
  const orderData = order?.order as any;

  // استخراج بيانات العنوان
  const shippingAddress = (orderData?.shippingAddress as any) || {};

  // استخراج المراحل
  const stages = orderData?.stages
    ? typeof orderData.stages === 'string'
      ? JSON.parse(orderData.stages)
      : orderData.stages
    : {};

  // جدول المراحل
  const stageTitles = [
    'استلام الطلب',
    'مكالمة التأكيد',
    'التجهيز',
    'التنسيق مع المورد',
    'تخصيص الشحن',
    'تتبع التسليم',
    'التحصيل',
    'التسوية',
  ];

  // بناء عنوان كامل
  const fullAddress = [
    shippingAddress.street,
    shippingAddress.building && `مبني ${shippingAddress.building}`,
    shippingAddress.floor && `دور ${shippingAddress.floor}`,
    shippingAddress.apartment && `شقة ${shippingAddress.apartment}`,
    shippingAddress.city,
    shippingAddress.governorate,
    shippingAddress.notes,
  ]
    .filter(Boolean)
    .join('، ');

  // حساب المرحلة الحالية
  const currentStageNum = parseInt(orderData?.currentStage || '1');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            طلب COD #{orderData?.orderId}
          </h1>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            تم الإنشاء في{' '}
            {new Date(orderData?.createdAt!).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          {!orderData?.trackingNumber && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                createShipment.mutate({ orderId: orderData?.id });
              }}
              disabled={createShipment.isPending}
            >
              <Truck className="w-4 h-4" />
              إنشاء شحنة
            </Button>
          )}
        </div>
      </div>

      {/* الشبكة الرئيسية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الأيسر: معلومات الطلب */}
        <div className="lg:col-span-2 space-y-6">
          {/* بطاقة معلومات العميل */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">الاسم</p>
                  <p className="font-semibold">{orderData?.customerName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">الهاتف</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {orderData?.customerPhone}
                  </p>
                </div>
                {orderData?.customerEmail && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {orderData?.customerEmail}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* بطاقة العنوان */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                عنوان التسليم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">العنوان الكامل</p>
                  <p className="font-medium leading-relaxed">{fullAddress || 'لا يوجد عنوان'}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3">
                  {shippingAddress.city && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">المدينة</p>
                      <Badge variant="outline" className="font-normal">
                        {shippingAddress.city}
                      </Badge>
                    </div>
                  )}
                  {shippingAddress.governorate && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">المحافظة</p>
                      <Badge variant="outline" className="font-normal">
                        {shippingAddress.governorate}
                      </Badge>
                    </div>
                  )}
                  {shippingAddress.area && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">المنطقة</p>
                      <Badge variant="outline" className="font-normal">
                        {shippingAddress.area}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة تفاصيل الطلب */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                تفاصيل الطلب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">مبلغ الطلب</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {parseFloat(orderData?.orderAmount).toLocaleString()} ج.م
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">مبلغ COD</p>
                    <p className="text-3xl font-bold text-primary">
                      {parseFloat(orderData?.codAmount).toLocaleString()} ج.م
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">الحالة</p>
                    <Badge
                      variant={
                        orderData?.status === 'completed'
                          ? 'default'
                          : orderData?.status === 'in_progress'
                            ? 'secondary'
                            : orderData?.status === 'cancelled'
                              ? 'destructive'
                              : 'outline'
                      }
                      className="text-sm px-3 py-1"
                    >
                      {getStatusText(orderData?.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">المرحلة الحالية</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${(currentStageNum / 8) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {currentStageNum}/8
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{stageTitles[currentStageNum - 1]}</p>
                  </div>
                </div>
              </div>

              {orderData?.trackingNumber && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">رقم التتبع</p>
                      <code className="font-mono text-sm bg-gray-100 px-3 py-1 rounded mt-1 inline-block">
                        {orderData?.trackingNumber}
                      </code>
                    </div>
                    {orderData?.shippingPartnerId && (
                      <div className="text-left">
                        <p className="text-sm text-gray-500">شركة الشحن</p>
                        <p className="font-semibold mt-1">Bosta</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline المراحل */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                مراحل الطلب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stageTitles.map((title, index) => {
                  const stageNum = index + 1;
                  const isCompleted = stageNum < currentStageNum;
                  const isCurrent = stageNum === currentStageNum;
                  const isPending = stageNum > currentStageNum;

                  return (
                    <div key={stageNum} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${isCompleted ? 'bg-green-500 text-white' : ''}
                          ${isCurrent ? 'bg-primary text-white' : ''}
                          ${isPending ? 'bg-gray-200 text-gray-500' : ''}
                        `}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : isCurrent ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-semibold">{stageNum}</span>
                          )}
                        </div>
                        {index < stageTitles.length - 1 && (
                          <div
                            className={`w-0.5 h-12 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p
                          className={`font-medium ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-500'}`}
                        >
                          {title}
                        </p>
                        {isCompleted && <p className="text-xs text-gray-500 mt-1">مكتمل</p>}
                        {isCurrent && <p className="text-xs text-primary mt-1">جاري العمل</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* العمود الأيمن: إجراءات سريعة */}
        <div className="space-y-6">
          {/* بطاقة الإجراءات */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  updateStatus.mutate({
                    id: orderData?.id,
                    status: 'in_progress',
                  });
                }}
                disabled={updateStatus.isPending || orderData?.status === 'in_progress'}
              >
                <Clock className="w-4 h-4" />
                بدء المعالجة
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  updateStatus.mutate({
                    id: orderData?.id,
                    status: 'completed',
                  });
                }}
                disabled={updateStatus.isPending || orderData?.status === 'completed'}
              >
                <CheckCircle className="w-4 h-4" />
                إكمال الطلب
              </Button>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
                onClick={() => {
                  if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
                    updateStatus.mutate({
                      id: orderData?.id,
                      status: 'cancelled',
                    });
                  }
                }}
                disabled={updateStatus.isPending || orderData?.status === 'cancelled'}
              >
                <XCircle className="w-4 h-4" />
                إلغاء الطلب
              </Button>
            </CardContent>
          </Card>

          {/* بطاقة تغيير المرحلة */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>تغيير المرحلة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((stageNum) => (
                  <Button
                    key={stageNum}
                    variant={currentStageNum === stageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      // Update stage via API
                      // updateStage.mutate({ id: orderData?.id, stage: stageNum });
                    }}
                    className="h-10"
                  >
                    {stageNum}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                المرحلة الحالية: {currentStageNum} - {stageTitles[currentStageNum - 1]}
              </p>
            </CardContent>
          </Card>

          {/* إحصائيات سريعة */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>معلومات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">وقت الإنشاء</span>
                <span className="font-medium">{formatTimeAgo(orderData?.createdAt!)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">آخر تحديث</span>
                <span className="font-medium">{formatTimeAgo(orderData?.updatedAt!)}</span>
              </div>
              {orderData?.estimatedDelivery && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">التسليم المتوقع</span>
                  <span className="font-medium">
                    {new Date(orderData?.estimatedDelivery).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// وظائف مساعدة
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'قيد الانتظار',
    in_progress: 'قيد المعالجة',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  };
  return statusMap[status] || status;
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'الآن';
  } else if (diffMins < 60) {
    return `قبل ${diffMins} دقيقة`;
  } else if (diffHours < 24) {
    return `قبل ${diffHours} ساعة`;
  } else if (diffDays === 1) {
    return 'أمس';
  } else {
    return `قبل ${diffDays} يوم`;
  }
}
