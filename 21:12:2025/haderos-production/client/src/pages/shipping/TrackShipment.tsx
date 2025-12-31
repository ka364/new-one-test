// @ts-nocheck
/**
 * HADER Track Shipment Page
 * Track shipment status with timeline
 */

import { useState } from 'react';
import { ShippingLayout } from '@/components/ShippingLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Package,
  TruckIcon,
  CheckCircle,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-react';
import { useRoute } from 'wouter';

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location: string;
  timestamp: string;
  completed: boolean;
}

export default function TrackShipmentPage() {
  const [, params] = useRoute('/shipping/track/:trackingNumber');
  const [trackingNumber, setTrackingNumber] = useState(params?.trackingNumber || '');
  const [loading, setLoading] = useState(false);
  const [shipmentData, setShipmentData] = useState<any>(null);

  // Mock data
  const mockShipment = {
    trackingNumber: 'SH-2025-002',
    status: 'in_transit',
    customer: {
      name: 'فاطمة حسن',
      phone: '01098765432',
    },
    origin: {
      city: 'الجيزة',
      address: 'شارع الهرم، الجيزة',
    },
    destination: {
      city: 'المنصورة',
      address: 'شارع الجلاء، المنصورة',
    },
    codAmount: 2300,
    createdAt: '2025-12-20 10:30 AM',
    estimatedDelivery: '2025-12-22',
    currentLocation: 'مركز فرز القاهرة',
    events: [
      {
        id: '1',
        status: 'تم إنشاء الشحنة',
        description: 'تم إنشاء طلب الشحن بنجاح',
        location: 'الجيزة',
        timestamp: '2025-12-20 10:30 AM',
        completed: true,
      },
      {
        id: '2',
        status: 'تم الاستلام من المرسل',
        description: 'تم استلام الشحنة من المرسل',
        location: 'الجيزة',
        timestamp: '2025-12-20 02:15 PM',
        completed: true,
      },
      {
        id: '3',
        status: 'في مركز الفرز',
        description: 'الشحنة في مركز فرز القاهرة',
        location: 'القاهرة',
        timestamp: '2025-12-20 06:45 PM',
        completed: true,
      },
      {
        id: '4',
        status: 'في الطريق للتوصيل',
        description: 'الشحنة في طريقها إلى المنصورة',
        location: 'على الطريق',
        timestamp: '2025-12-21 08:00 AM',
        completed: true,
      },
      {
        id: '5',
        status: 'خارج للتوصيل',
        description: 'الشحنة مع مندوب التوصيل',
        location: 'المنصورة',
        timestamp: 'قريباً',
        completed: false,
      },
      {
        id: '6',
        status: 'تم التوصيل',
        description: 'تم تسليم الشحنة للعميل',
        location: 'المنصورة',
        timestamp: 'قريباً',
        completed: false,
      },
    ] as TrackingEvent[],
  };

  const handleTrack = () => {
    setLoading(true);
    setTimeout(() => {
      setShipmentData(mockShipment);
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-500',
      picked_up: 'bg-blue-500',
      in_transit: 'bg-orange-500',
      out_for_delivery: 'bg-purple-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
      returned: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <ShippingLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تتبع الشحنة</h1>
          <p className="text-gray-500 mt-1">تتبع حالة شحنتك في الوقت الفعلي</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="أدخل رقم التتبع (مثال: SH-2025-002)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="pr-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                />
              </div>
              <Button
                onClick={handleTrack}
                disabled={!trackingNumber || loading}
                style={{ backgroundColor: '#C62822' }}
                className="text-white"
              >
                {loading ? 'جاري البحث...' : 'تتبع'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Details */}
        {shipmentData && (
          <>
            {/* Status Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full ${getStatusColor(shipmentData.status)} flex items-center justify-center`}>
                      <TruckIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {shipmentData.trackingNumber}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        الموقع الحالي: <span className="font-medium">{shipmentData.currentLocation}</span>
                      </p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-2" style={{ backgroundColor: '#C62822' }}>
                    في الطريق
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    معلومات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{shipmentData.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{shipmentData.customer.phone}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    معلومات الشحنة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">تاريخ الإنشاء: {shipmentData.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">التوصيل المتوقع: {shipmentData.estimatedDelivery}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="font-bold text-green-600">{shipmentData.codAmount.toLocaleString()} ج.م</span>
                  </div>
                </CardContent>
              </Card>

              {/* Origin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    من
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">{shipmentData.origin.city}</p>
                    <p className="text-sm text-gray-600">{shipmentData.origin.address}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Destination */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    إلى
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">{shipmentData.destination.city}</p>
                    <p className="text-sm text-gray-600">{shipmentData.destination.address}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  تتبع الشحنة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                  {/* Events */}
                  <div className="space-y-6">
                    {shipmentData.events.map((event: TrackingEvent, index: number) => (
                      <div key={event.id} className="relative flex gap-4">
                        {/* Icon */}
                        <div
                          className={`
                            relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                            ${event.completed
                              ? 'bg-green-500'
                              : index === shipmentData.events.findIndex((e: TrackingEvent) => !e.completed)
                              ? 'bg-orange-500 animate-pulse'
                              : 'bg-gray-300'
                            }
                          `}
                        >
                          {event.completed ? (
                            <CheckCircle className="h-5 w-5 text-white" />
                          ) : (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={`font-bold ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                {event.status}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.timestamp}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!shipmentData && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ابحث عن شحنتك
              </h3>
              <p className="text-gray-500">
                أدخل رقم التتبع في الأعلى لمتابعة حالة شحنتك
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ShippingLayout>
  );
}
