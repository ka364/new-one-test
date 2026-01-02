// @ts-nocheck
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, ShoppingBag, MapPin, User, Phone, Mail } from 'lucide-react';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  const createOrderMutation = trpc.orders.createOrder.useMutation({
    onSuccess: (data: any) => {
      toast.success('تم إنشاء الطلب بنجاح!');
      clearCart();
      setLocation(`/order-confirmation/${data.orderId}`);
    },
    onError: (error: any) => {
      toast.error(`فشل إنشاء الطلب: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('السلة فارغة!');
      return;
    }

    // Validation
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsProcessing(true);

    // Create order
    createOrderMutation.mutate({
      customerName: customerInfo.name,
      customerEmail: customerInfo.email || undefined,
      customerPhone: customerInfo.phone,
      shippingAddress: `${customerInfo.address}, ${customerInfo.city}${
        customerInfo.postalCode ? `, ${customerInfo.postalCode}` : ''
      }`,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
      })),
      totalAmount: totalPrice,
      notes: customerInfo.notes || undefined,
    });
  };

  if (items.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">السلة فارغة</h2>
            <p className="text-muted-foreground mb-6">أضف منتجات إلى السلة لإتمام الطلب</p>
            <Button onClick={() => setLocation('/nowshoes')}>تصفح المنتجات</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Customer Info Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                معلومات العميل
              </CardTitle>
              <CardDescription>أدخل معلوماتك الشخصية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    الاسم الكامل <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    رقم الهاتف <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                عنوان الشحن
              </CardTitle>
              <CardDescription>أدخل عنوان التوصيل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">
                  العنوان <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  placeholder="الشارع، رقم المبنى، الشقة"
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">الرمز البريدي (اختياري)</Label>
                  <Input
                    id="postalCode"
                    value={customerInfo.postalCode}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        postalCode: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
                <Input
                  id="notes"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  placeholder="أي ملاحظات خاصة بالتوصيل"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item) => {
                  const itemKey = `${item.productId}-${item.size}-${item.color}`;
                  return (
                    <div key={itemKey} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.quantity} × {item.price.toFixed(2)} ج.م
                        </p>
                        {item.size && (
                          <p className="text-muted-foreground text-xs">المقاس: {item.size}</p>
                        )}
                        {item.color && (
                          <p className="text-muted-foreground text-xs">اللون: {item.color}</p>
                        )}
                      </div>
                      <p className="font-medium">{(item.price * item.quantity).toFixed(2)} ج.م</p>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>المجموع الفرعي</span>
                  <span>{totalPrice.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الشحن</span>
                  <span className="text-green-600">مجاني</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>الإجمالي</span>
                <span>{totalPrice.toFixed(2)} ج.م</span>
              </div>

              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  'تأكيد الطلب'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">الدفع عند الاستلام متاح</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
