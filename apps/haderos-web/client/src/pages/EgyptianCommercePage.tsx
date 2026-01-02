/**
 * Egyptian Commerce Dashboard
 * لوحة تحكم التجارة المصرية
 *
 * Features:
 * - Egyptian Categories Management
 * - Search Synonyms (Egyptian Dialect)
 * - Dark Stores Management
 * - Micro-Zones Delivery System
 * - Egyptian Holidays & Promotions
 * - Q-Commerce Analytics
 */

import { useState } from 'react';
import {
  Store,
  MapPin,
  Search,
  Calendar,
  Truck,
  Package,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
  Plus,
  Edit,
  Eye,
  Settings,
  RefreshCw,
  ChevronRight,
  Gift,
  Tag,
  Percent,
  Building2,
  Users,
  ShoppingCart,
  Zap,
  Timer,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Globe,
  Languages,
  Sparkles,
  Moon,
  Sun,
  PartyPopper,
  Heart,
  Navigation,
  Target,
  Layers,
  Box,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface Category {
  id: string;
  code: string;
  nameAr: string;
  nameDarija: string;
  icon: string;
  productsCount: number;
  isActive: boolean;
}

interface DarkStore {
  id: string;
  code: string;
  nameAr: string;
  governorate: string;
  city: string;
  district: string;
  status: 'active' | 'busy' | 'maintenance' | 'closed';
  isOpen: boolean;
  currentOrdersCount: number;
  maxConcurrentOrders: number;
  avgPreparationTime: number;
  driversCount: number;
}

interface MicroZone {
  id: string;
  nameAr: string;
  governorate: string;
  city: string;
  district: string;
  deliverySpeed: 'express' | 'fast' | 'standard' | 'scheduled';
  estimatedDeliveryMinutes: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isCovered: boolean;
}

interface Holiday {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: 'religious' | 'national' | 'seasonal' | 'special';
  themeColor: string;
  daysUntil?: number;
}

interface Synonym {
  id: string;
  standardTerm: string;
  standardTermAr: string;
  egyptianVariants: string[];
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_CATEGORIES: Category[] = [
  {
    id: '1',
    code: 'GROCERY',
    nameAr: 'البقالة',
    nameDarija: 'البقالة',
    icon: '🛒',
    productsCount: 150,
    isActive: true,
  },
  {
    id: '2',
    code: 'VEGETABLES',
    nameAr: 'الخضروات',
    nameDarija: 'خضار',
    icon: '🥬',
    productsCount: 80,
    isActive: true,
  },
  {
    id: '3',
    code: 'FRUITS',
    nameAr: 'الفواكه',
    nameDarija: 'فاكهة',
    icon: '🍎',
    productsCount: 60,
    isActive: true,
  },
  {
    id: '4',
    code: 'MEAT',
    nameAr: 'اللحوم',
    nameDarija: 'لحمة',
    icon: '🥩',
    productsCount: 45,
    isActive: true,
  },
  {
    id: '5',
    code: 'DAIRY',
    nameAr: 'الألبان',
    nameDarija: 'لبن وجبنة',
    icon: '🧀',
    productsCount: 70,
    isActive: true,
  },
  {
    id: '6',
    code: 'BAKERY',
    nameAr: 'المخبوزات',
    nameDarija: 'عيش وفينو',
    icon: '🍞',
    productsCount: 35,
    isActive: true,
  },
  {
    id: '7',
    code: 'BEVERAGES',
    nameAr: 'المشروبات',
    nameDarija: 'مشروبات',
    icon: '🥤',
    productsCount: 90,
    isActive: true,
  },
  {
    id: '8',
    code: 'CLEANING',
    nameAr: 'منتجات التنظيف',
    nameDarija: 'منظفات',
    icon: '🧹',
    productsCount: 55,
    isActive: true,
  },
];

const MOCK_DARK_STORES: DarkStore[] = [
  {
    id: 'ds1',
    code: 'DS-MAADI-001',
    nameAr: 'مخزن المعادي',
    governorate: 'القاهرة',
    city: 'المعادي',
    district: 'المعادي الجديدة',
    status: 'active',
    isOpen: true,
    currentOrdersCount: 5,
    maxConcurrentOrders: 20,
    avgPreparationTime: 10,
    driversCount: 4,
  },
  {
    id: 'ds2',
    code: 'DS-NASR-001',
    nameAr: 'مخزن مدينة نصر',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    district: 'الحي الثامن',
    status: 'active',
    isOpen: true,
    currentOrdersCount: 12,
    maxConcurrentOrders: 25,
    avgPreparationTime: 8,
    driversCount: 6,
  },
  {
    id: 'ds3',
    code: 'DS-DOKKI-001',
    nameAr: 'مخزن الدقي',
    governorate: 'الجيزة',
    city: 'الدقي',
    district: 'الدقي',
    status: 'busy',
    isOpen: true,
    currentOrdersCount: 18,
    maxConcurrentOrders: 20,
    avgPreparationTime: 12,
    driversCount: 5,
  },
  {
    id: 'ds4',
    code: 'DS-6OCT-001',
    nameAr: 'مخزن 6 أكتوبر',
    governorate: 'الجيزة',
    city: '6 أكتوبر',
    district: 'الحي الأول',
    status: 'maintenance',
    isOpen: false,
    currentOrdersCount: 0,
    maxConcurrentOrders: 15,
    avgPreparationTime: 15,
    driversCount: 3,
  },
];

const MOCK_MICRO_ZONES: MicroZone[] = [
  {
    id: 'mz1',
    nameAr: 'المعادي الجديدة',
    governorate: 'القاهرة',
    city: 'المعادي',
    district: 'المعادي الجديدة',
    deliverySpeed: 'express',
    estimatedDeliveryMinutes: 20,
    deliveryFee: 15,
    freeDeliveryThreshold: 200,
    isCovered: true,
  },
  {
    id: 'mz2',
    nameAr: 'الحي السابع - مدينة نصر',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    district: 'الحي السابع',
    deliverySpeed: 'fast',
    estimatedDeliveryMinutes: 35,
    deliveryFee: 20,
    freeDeliveryThreshold: 250,
    isCovered: true,
  },
  {
    id: 'mz3',
    nameAr: 'الدقي',
    governorate: 'الجيزة',
    city: 'الدقي',
    district: 'الدقي',
    deliverySpeed: 'fast',
    estimatedDeliveryMinutes: 40,
    deliveryFee: 20,
    freeDeliveryThreshold: 250,
    isCovered: true,
  },
  {
    id: 'mz4',
    nameAr: 'التجمع الأول',
    governorate: 'القاهرة',
    city: 'التجمع الخامس',
    district: 'التجمع الأول',
    deliverySpeed: 'standard',
    estimatedDeliveryMinutes: 60,
    deliveryFee: 30,
    freeDeliveryThreshold: 300,
    isCovered: true,
  },
  {
    id: 'mz5',
    nameAr: 'الشيخ زايد',
    governorate: 'الجيزة',
    city: 'الشيخ زايد',
    district: 'الحي الأول',
    deliverySpeed: 'standard',
    estimatedDeliveryMinutes: 55,
    deliveryFee: 25,
    freeDeliveryThreshold: 300,
    isCovered: true,
  },
];

const MOCK_HOLIDAYS: Holiday[] = [
  {
    id: 'h1',
    code: 'RAMADAN',
    nameAr: 'شهر رمضان',
    nameEn: 'Ramadan',
    type: 'religious',
    themeColor: '#1a5f2a',
  },
  {
    id: 'h2',
    code: 'EID_FITR',
    nameAr: 'عيد الفطر المبارك',
    nameEn: 'Eid al-Fitr',
    type: 'religious',
    themeColor: '#d4af37',
  },
  {
    id: 'h3',
    code: 'MOTHERS_DAY',
    nameAr: 'عيد الأم',
    nameEn: "Mother's Day",
    type: 'special',
    themeColor: '#ff69b4',
    daysUntil: 15,
  },
  {
    id: 'h4',
    code: 'BACK_TO_SCHOOL',
    nameAr: 'موسم العودة للمدارس',
    nameEn: 'Back to School',
    type: 'seasonal',
    themeColor: '#4169e1',
  },
];

const MOCK_SYNONYMS: Synonym[] = [
  {
    id: 's1',
    standardTerm: 'bread',
    standardTermAr: 'خبز',
    egyptianVariants: ['عيش', 'عيش بلدي', 'عيش فينو', 'عيش شامي'],
  },
  { id: 's2', standardTerm: 'chicken', standardTermAr: 'دجاج', egyptianVariants: ['فراخ', 'فرخة'] },
  { id: 's3', standardTerm: 'milk', standardTermAr: 'حليب', egyptianVariants: ['لبن', 'لبنة'] },
  { id: 's4', standardTerm: 'tomato', standardTermAr: 'طماطم', egyptianVariants: ['قوطة', 'أوطة'] },
  {
    id: 's5',
    standardTerm: 'pasta',
    standardTermAr: 'معكرونة',
    egyptianVariants: ['مكرونة', 'مكرونه'],
  },
  { id: 's6', standardTerm: 'garlic', standardTermAr: 'ثوم', egyptianVariants: ['توم', 'تومة'] },
  {
    id: 's7',
    standardTerm: 'potato',
    standardTermAr: 'بطاطا',
    egyptianVariants: ['بطاطس', 'بطاطسة'],
  },
];

// ============================================
// HELPER COMPONENTS
// ============================================

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}) {
  const colorStyles = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    purple: 'bg-purple-500/10 text-purple-600',
    orange: 'bg-orange-500/10 text-orange-600',
    red: 'bg-red-500/10 text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && trendValue && (
              <div
                className={cn(
                  'flex items-center gap-1 mt-1 text-xs',
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trendValue}
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', colorStyles[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeliverySpeedBadge({ speed }: { speed: MicroZone['deliverySpeed'] }) {
  const styles = {
    express: { bg: 'bg-green-100 text-green-700', icon: Zap, label: 'إكسبريس' },
    fast: { bg: 'bg-blue-100 text-blue-700', icon: Timer, label: 'سريع' },
    standard: { bg: 'bg-gray-100 text-gray-700', icon: Clock, label: 'عادي' },
    scheduled: { bg: 'bg-purple-100 text-purple-700', icon: Calendar, label: 'مجدول' },
  };

  const style = styles[speed];
  const Icon = style.icon;

  return (
    <Badge variant="secondary" className={cn('gap-1', style.bg)}>
      <Icon className="h-3 w-3" />
      {style.label}
    </Badge>
  );
}

function StoreStatusBadge({ status }: { status: DarkStore['status'] }) {
  const styles = {
    active: { bg: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'نشط' },
    busy: { bg: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'مشغول' },
    maintenance: { bg: 'bg-orange-100 text-orange-700', icon: Settings, label: 'صيانة' },
    closed: { bg: 'bg-red-100 text-red-700', icon: XCircle, label: 'مغلق' },
  };

  const style = styles[status];
  const Icon = style.icon;

  return (
    <Badge variant="secondary" className={cn('gap-1', style.bg)}>
      <Icon className="h-3 w-3" />
      {style.label}
    </Badge>
  );
}

function HolidayTypeBadge({ type }: { type: Holiday['type'] }) {
  const styles = {
    religious: { bg: 'bg-green-100 text-green-700', icon: Moon, label: 'ديني' },
    national: { bg: 'bg-red-100 text-red-700', icon: Star, label: 'وطني' },
    seasonal: { bg: 'bg-blue-100 text-blue-700', icon: Sun, label: 'موسمي' },
    special: { bg: 'bg-pink-100 text-pink-700', icon: Heart, label: 'مناسبة خاصة' },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <Badge variant="secondary" className={cn('gap-1', style.bg)}>
      <Icon className="h-3 w-3" />
      {style.label}
    </Badge>
  );
}

// ============================================
// TAB COMPONENTS
// ============================================

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الطلبات اليوم"
          value="1,250"
          icon={ShoppingCart}
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        <StatCard
          title="الإيرادات اليوم"
          value="185,000 ج.م"
          icon={TrendingUp}
          trend="up"
          trendValue="+8%"
          color="green"
        />
        <StatCard
          title="متوسط وقت التوصيل"
          value="28 دقيقة"
          icon={Clock}
          trend="down"
          trendValue="-15%"
          color="purple"
        />
        <StatCard title="مخازن نشطة" value="3/4" icon={Store} color="orange" />
      </div>

      {/* Q-Commerce Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              أداء التوصيل السريع (Q-Commerce)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">توصيل إكسبريس (15-30 دقيقة)</span>
              <span className="font-medium">450 طلب</span>
            </div>
            <Progress value={36} className="h-2" />
            <p className="text-xs text-muted-foreground">36% من إجمالي الطلبات</p>

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">94%</p>
                <p className="text-xs text-muted-foreground">في الوقت</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">18 د</p>
                <p className="text-xs text-muted-foreground">متوسط التوصيل</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">4.8</p>
                <p className="text-xs text-muted-foreground">تقييم العملاء</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-blue-500" />
              البحث بالعامية المصرية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">نسبة استخدام البحث بالعامية</span>
              <span className="font-medium text-green-600">68%</span>
            </div>
            <Progress value={68} className="h-2" />

            <div className="space-y-2">
              <p className="text-sm font-medium">أكثر المصطلحات بحثاً:</p>
              <div className="flex flex-wrap gap-2">
                {['عيش', 'فراخ', 'لبن', 'طماطم', 'بطاطس'].map((term) => (
                  <Badge key={term} variant="secondary">
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories & Upcoming Holidays */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              أفضل الفئات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'البقالة', orders: 380, revenue: '45,000 ج.م', color: 'bg-blue-500' },
                { name: 'اللحوم', orders: 220, revenue: '55,000 ج.م', color: 'bg-red-500' },
                { name: 'الألبان', orders: 180, revenue: '22,000 ج.م', color: 'bg-yellow-500' },
                { name: 'المشروبات', orders: 150, revenue: '18,000 ج.م', color: 'bg-green-500' },
              ].map((category, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={cn('w-2 h-8 rounded-full', category.color)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">{category.orders} طلب</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Progress value={(category.orders / 380) * 100} className="h-1 flex-1 ml-4" />
                      <span className="text-sm font-medium">{category.revenue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-pink-500" />
              المناسبات القادمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_HOLIDAYS.slice(0, 3).map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderRightColor: holiday.themeColor, borderRightWidth: 4 }}
                >
                  <div>
                    <p className="font-medium">{holiday.nameAr}</p>
                    <p className="text-sm text-muted-foreground">{holiday.nameEn}</p>
                  </div>
                  <div className="text-left">
                    <HolidayTypeBadge type={holiday.type} />
                    {holiday.daysUntil && (
                      <p className="text-xs text-muted-foreground mt-1">
                        بعد {holiday.daysUntil} يوم
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = MOCK_CATEGORIES.filter(
    (cat) =>
      cat.nameAr.includes(searchQuery) ||
      cat.nameDarija.includes(searchQuery) ||
      cat.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">الفئات المصرية</h3>
          <p className="text-sm text-muted-foreground">إدارة فئات المنتجات بالأسماء المصرية</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة فئة
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث في الفئات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="text-4xl">{category.icon}</div>
                <Badge variant={category.isActive ? 'default' : 'secondary'}>
                  {category.isActive ? 'نشط' : 'معطل'}
                </Badge>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold">{category.nameAr}</h4>
                <p className="text-sm text-muted-foreground">{category.nameDarija}</p>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{category.productsCount} منتج</span>
                <code className="text-xs bg-muted px-1 rounded">{category.code}</code>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-3 w-3 ml-1" />
                  تعديل
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-3 w-3 ml-1" />
                  عرض
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SearchSynonymsTab() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">مرادفات البحث المصرية</h3>
          <p className="text-sm text-muted-foreground">
            ربط المصطلحات العامية المصرية بالكلمات الفصحى
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مرادف
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث في المرادفات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Synonyms Table */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {MOCK_SYNONYMS.map((synonym) => (
              <div key={synonym.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-bold text-lg">{synonym.standardTermAr}</p>
                      <p className="text-xs text-muted-foreground">{synonym.standardTerm}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-2">
                      {synonym.egyptianVariants.map((variant, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                          {variant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Example Search */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            مثال على البحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            عندما يبحث المستخدم عن "عيش"، النظام سيجد أيضاً:
          </p>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500">عيش</Badge>
            <span className="text-muted-foreground">=</span>
            <Badge variant="outline">خبز</Badge>
            <Badge variant="outline">عيش بلدي</Badge>
            <Badge variant="outline">عيش فينو</Badge>
            <Badge variant="outline">عيش شامي</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DarkStoresTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredStores = MOCK_DARK_STORES.filter(
    (store) => statusFilter === 'all' || store.status === statusFilter
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">مخازن الظلام (Dark Stores)</h3>
          <p className="text-sm text-muted-foreground">إدارة المخازن الصغيرة للتوصيل السريع</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مخزن
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="busy">مشغول</SelectItem>
            <SelectItem value="maintenance">صيانة</SelectItem>
            <SelectItem value="closed">مغلق</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stores Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredStores.map((store) => (
          <Card key={store.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{store.nameAr}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {store.district}، {store.city}
                  </CardDescription>
                </div>
                <StoreStatusBadge status={store.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{store.currentOrdersCount}</p>
                  <p className="text-xs text-muted-foreground">طلبات حالية</p>
                </div>
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{store.avgPreparationTime} د</p>
                  <p className="text-xs text-muted-foreground">وقت التحضير</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">السعة</span>
                  <span>
                    {store.currentOrdersCount}/{store.maxConcurrentOrders}
                  </span>
                </div>
                <Progress
                  value={(store.currentOrdersCount / store.maxConcurrentOrders) * 100}
                  className="h-2"
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {store.driversCount} سائق
                </span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{store.code}</code>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Package className="h-3 w-3 ml-1" />
                  المخزون
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-3 w-3 ml-1" />
                  إعدادات
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MicroZonesTab() {
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');

  const filteredZones = MOCK_MICRO_ZONES.filter(
    (zone) => governorateFilter === 'all' || zone.governorate === governorateFilter
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">مناطق التوصيل الصغيرة</h3>
          <p className="text-sm text-muted-foreground">إدارة مناطق التوصيل السريع</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة منطقة
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={governorateFilter} onValueChange={setGovernorateFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="المحافظة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المحافظات</SelectItem>
            <SelectItem value="القاهرة">القاهرة</SelectItem>
            <SelectItem value="الجيزة">الجيزة</SelectItem>
            <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Zones List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Navigation className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{zone.nameAr}</p>
                      <p className="text-sm text-muted-foreground">
                        {zone.governorate} - {zone.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <DeliverySpeedBadge speed={zone.deliverySpeed} />

                    <div className="text-center">
                      <p className="font-medium">{zone.estimatedDeliveryMinutes} دقيقة</p>
                      <p className="text-xs text-muted-foreground">وقت التوصيل</p>
                    </div>

                    <div className="text-center">
                      <p className="font-medium">{zone.deliveryFee} ج.م</p>
                      <p className="text-xs text-muted-foreground">رسوم التوصيل</p>
                    </div>

                    <div className="text-center">
                      <p className="font-medium">{zone.freeDeliveryThreshold} ج.م</p>
                      <p className="text-xs text-muted-foreground">توصيل مجاني</p>
                    </div>

                    <Badge variant={zone.isCovered ? 'default' : 'secondary'}>
                      {zone.isCovered ? 'مغطاة' : 'غير مغطاة'}
                    </Badge>

                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Speed Legend */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">سرعات التوصيل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-sm">إكسبريس: 15-30 دقيقة</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-600" />
              <span className="text-sm">سريع: 30-60 دقيقة</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm">عادي: 1-3 ساعات</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm">مجدول: موعد محدد</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HolidaysTab() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">الأعياد والمناسبات المصرية</h3>
          <p className="text-sm text-muted-foreground">إدارة العروض والحملات الموسمية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Gift className="h-4 w-4 ml-2" />
            إضافة عرض
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مناسبة
          </Button>
        </div>
      </div>

      {/* Holidays Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_HOLIDAYS.map((holiday) => (
          <Card key={holiday.id} className="hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-2" style={{ backgroundColor: holiday.themeColor }} />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{holiday.nameAr}</CardTitle>
                  <CardDescription>{holiday.nameEn}</CardDescription>
                </div>
                <HolidayTypeBadge type={holiday.type} />
              </div>
            </CardHeader>
            <CardContent>
              {holiday.daysUntil && (
                <div className="mb-4 p-3 rounded-lg bg-muted text-center">
                  <p className="text-2xl font-bold">{holiday.daysUntil}</p>
                  <p className="text-sm text-muted-foreground">يوم حتى المناسبة</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Gift className="h-3 w-3 ml-1" />
                  العروض
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-3 w-3 ml-1" />
                  تعديل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Promotions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-green-500" />
            العروض النشطة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: 'عروض رمضان الكريم',
                discount: '20%',
                holiday: 'رمضان',
                usageCount: 450,
                endDate: '30 مارس',
              },
              {
                name: 'عروض العيد',
                discount: '50 ج.م',
                holiday: 'عيد الفطر',
                usageCount: 120,
                endDate: '5 أبريل',
              },
            ].map((promo, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Percent className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{promo.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {promo.holiday} - ينتهي {promo.endDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    خصم {promo.discount}
                  </Badge>
                  <div className="text-center">
                    <p className="font-medium">{promo.usageCount}</p>
                    <p className="text-xs text-muted-foreground">استخدام</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EgyptianCommercePage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-blue-500">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">التجارة المصرية</h1>
                <p className="text-sm text-muted-foreground">
                  نظام متكامل للتجارة الإلكترونية في مصر
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              الفئات
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              البحث
            </TabsTrigger>
            <TabsTrigger value="darkstores" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              المخازن
            </TabsTrigger>
            <TabsTrigger value="zones" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              المناطق
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              المناسبات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>

          <TabsContent value="search">
            <SearchSynonymsTab />
          </TabsContent>

          <TabsContent value="darkstores">
            <DarkStoresTab />
          </TabsContent>

          <TabsContent value="zones">
            <MicroZonesTab />
          </TabsContent>

          <TabsContent value="holidays">
            <HolidaysTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
