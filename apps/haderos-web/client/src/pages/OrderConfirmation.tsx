// @ts-nocheck
import { useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Package, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function OrderConfirmation() {
  const [, params] = useRoute('/order-confirmation/:orderId');
  const [, setLocation] = useLocation();

  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  const {
    data: order,
    isLoading,
    error,
  } = trpc.orders.getOrderById.useQuery({ orderId: orderId! }, { enabled: !!orderId });

  useEffect(() => {
    if (!orderId) {
      setLocation('/');
    }
  }, [orderId, setLocation]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold mb-2 text-destructive">خطأ</h2>
            <p className="text-muted-foreground mb-6">
              {error?.message || 'لم يتم العثور على الطلب'}
            </p>
            <Button onClick={() => setLocation('/')}>العودة للصفحة الرئيسية</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <CheckCircle2 className="h-20 w-20 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">تم إنشاء الطلب بنجاح!</h1>
        <p className="text-muted-foreground">شكراً لك! تم استلام طلبك وسيتم معالجته قريباً</p>
      </div>

      {/* Order Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              تفاصيل الطلب
            </CardTitle>
            <CardDescription>
              رقم الطلب: <span className="font-mono font-bold">{order.orderNumber}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">حالة الطلب</p>
                <p className="font-medium">
                  {order.status === 'pending' && 'قيد الانتظار'}
                  {order.status === 'confirmed' && 'مؤكد'}
                  {order.status === 'processing' && 'قيد المعالجة'}
                  {order.status === 'shipped' && 'تم الشحن'}
                  {order.status === 'delivered' && 'تم التوصيل'}
                  {order.status === 'cancelled' && 'ملغي'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">حالة الدفع</p>
                <p className="font-medium">
                  {order.paymentStatus === 'pending' && 'قيد الانتظار'}
                  {order.paymentStatus === 'paid' && 'مدفوع'}
                  {order.paymentStatus === 'failed' && 'فشل'}
                  {order.paymentStatus === 'refunded' && 'مسترد'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الطلب</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">طريقة الدفع</p>
                <p className="font-medium">الدفع عند الاستلام</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">المنتج</h3>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{order.productName}</p>
                  {order.productDescription && (
                    <p className="text-sm text-muted-foreground">{order.productDescription}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">الكمية: {order.quantity}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold">{order.totalAmount} ج.م</p>
                  <p className="text-sm text-muted-foreground">
                    {order.unitPrice} ج.م × {order.quantity}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Shipping Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              معلومات العميل والشحن
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium">{order.customerPhone || 'غير متوفر'}</p>
                </div>
              </div>
              {order.customerEmail && (
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{order.customerEmail}</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">عنوان الشحن</p>
              <p className="font-medium">{order.shippingAddress || 'غير متوفر'}</p>
            </div>
            {order.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">ملاحظات</p>
                <p className="font-medium">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>الخطوات التالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p>سنتواصل معك قريباً لتأكيد الطلب</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p>سيتم شحن طلبك خلال 2-3 أيام عمل</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p>الدفع عند استلام الطلب</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => setLocation('/nowshoes')}>متابعة التسوق</Button>
          <Button variant="outline" onClick={() => setLocation('/')}>
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
