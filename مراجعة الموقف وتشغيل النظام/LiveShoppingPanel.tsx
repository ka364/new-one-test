import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Play, 
  Square, 
  Users, 
  ShoppingCart,
  MessageCircle,
  Heart,
  TrendingUp,
  Eye,
  DollarSign
} from 'lucide-react';

interface LiveSession {
  id: string;
  title: string;
  platform: 'youtube' | 'facebook' | 'both';
  status: 'preparing' | 'live' | 'ended';
  viewers: number;
  orders: number;
  revenue: number;
  startTime?: Date;
}

interface LiveProduct {
  id: string;
  name: string;
  price: number;
  livePrice: number;
  stock: number;
  sold: number;
}

export default function LiveShoppingPanel() {
  const [session, setSession] = useState<LiveSession>({
    id: 'session-001',
    title: 'عرض خاص - خصومات تصل إلى 50%',
    platform: 'both',
    status: 'preparing',
    viewers: 0,
    orders: 0,
    revenue: 0,
  });

  const [products, setProducts] = useState<LiveProduct[]>([
    {
      id: 'prod-001',
      name: 'Laptop Dell XPS 15',
      price: 20000,
      livePrice: 18000,
      stock: 10,
      sold: 0,
    },
    {
      id: 'prod-002',
      name: 'Wireless Mouse',
      price: 200,
      livePrice: 150,
      stock: 50,
      sold: 0,
    },
  ]);

  const [messages, setMessages] = useState([
    { id: 1, user: 'أحمد', text: 'السعر كام؟', time: '10:30' },
    { id: 2, user: 'فاطمة', text: 'متوفر اللون الأسود؟', time: '10:31' },
    { id: 3, user: 'محمد', text: '🔥🔥🔥', time: '10:32' },
  ]);

  const startSession = () => {
    setSession({
      ...session,
      status: 'live',
      startTime: new Date(),
    });
  };

  const endSession = () => {
    setSession({
      ...session,
      status: 'ended',
    });
  };

  const getPlatformBadge = (platform: LiveSession['platform']) => {
    switch (platform) {
      case 'youtube':
        return <Badge className="bg-red-500">YouTube</Badge>;
      case 'facebook':
        return <Badge className="bg-blue-500">Facebook</Badge>;
      case 'both':
        return (
          <div className="flex gap-1">
            <Badge className="bg-red-500">YouTube</Badge>
            <Badge className="bg-blue-500">Facebook</Badge>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Video className="w-8 h-8 text-purple-600" />
              Live Shopping Panel
            </h1>
            <p className="text-gray-600 mt-1">إدارة البث المباشر والمبيعات الحية</p>
          </div>
          {session.status === 'preparing' && (
            <Button onClick={startSession} className="gap-2 bg-red-600 hover:bg-red-700">
              <Play className="w-4 h-4" />
              بدء البث المباشر
            </Button>
          )}
          {session.status === 'live' && (
            <Button onClick={endSession} variant="destructive" className="gap-2">
              <Square className="w-4 h-4" />
              إنهاء البث
            </Button>
          )}
        </div>

        {/* Session Status */}
        <Card className={
          session.status === 'live' ? 'border-red-500 border-2 bg-red-50' :
          session.status === 'ended' ? 'border-gray-300 bg-gray-50' :
          'border-purple-200 bg-purple-50'
        }>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${
                  session.status === 'live' ? 'bg-red-600 animate-pulse' :
                  session.status === 'ended' ? 'bg-gray-400' :
                  'bg-purple-600'
                }`} />
                <div>
                  <h3 className="font-semibold text-lg">{session.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getPlatformBadge(session.platform)}
                    <Badge variant={
                      session.status === 'live' ? 'destructive' :
                      session.status === 'ended' ? 'secondary' :
                      'default'
                    }>
                      {session.status === 'live' ? 'مباشر الآن' :
                       session.status === 'ended' ? 'انتهى' :
                       'قيد الإعداد'}
                    </Badge>
                  </div>
                </div>
              </div>
              {session.startTime && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">بدأ في</p>
                  <p className="font-semibold">{session.startTime.toLocaleTimeString('ar-EG')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{session.viewers}</div>
                  <div className="text-sm text-gray-600">المشاهدين</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{session.orders}</div>
                  <div className="text-sm text-gray-600">الطلبات</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {session.revenue.toLocaleString('ar-EG')}
                  </div>
                  <div className="text-sm text-gray-600">الإيرادات (ج.م)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {session.orders > 0 ? ((session.orders / session.viewers) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">معدل التحويل</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>المنتجات المعروضة</CardTitle>
                <CardDescription>المنتجات المتاحة في البث المباشر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.map((product) => (
                    <div 
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-400 line-through text-sm">
                            {product.price.toLocaleString('ar-EG')} ج.م
                          </span>
                          <span className="text-red-600 font-bold">
                            {product.livePrice.toLocaleString('ar-EG')} ج.م
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            -{Math.round((1 - product.livePrice / product.price) * 100)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{product.sold}</div>
                        <div className="text-sm text-gray-600">مباع</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{product.stock}</div>
                        <div className="text-sm text-gray-600">متبقي</div>
                      </div>
                      <Button size="sm">عرض</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Chat */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  الدردشة المباشرة
                </CardTitle>
                <CardDescription>تعليقات المشاهدين</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((msg) => (
                    <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{msg.user}</span>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Input placeholder="رد على المشاهدين..." />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Session Setup (when preparing) */}
        {session.status === 'preparing' && (
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الجلسة</CardTitle>
              <CardDescription>قم بإعداد البث قبل البدء</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>عنوان البث</Label>
                <Input 
                  value={session.title}
                  onChange={(e) => setSession({ ...session, title: e.target.value })}
                />
              </div>
              <div>
                <Label>المنصة</Label>
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant={session.platform === 'youtube' ? 'default' : 'outline'}
                    onClick={() => setSession({ ...session, platform: 'youtube' })}
                  >
                    YouTube
                  </Button>
                  <Button 
                    variant={session.platform === 'facebook' ? 'default' : 'outline'}
                    onClick={() => setSession({ ...session, platform: 'facebook' })}
                  >
                    Facebook
                  </Button>
                  <Button 
                    variant={session.platform === 'both' ? 'default' : 'outline'}
                    onClick={() => setSession({ ...session, platform: 'both' })}
                  >
                    كلاهما
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
