/**
 * 📞 Phone Sales Dashboard
 * لوحة تحكم المبيعات الهاتفية
 *
 * Features:
 * - Agent Dashboard with real-time stats
 * - Lead Management
 * - Call Center Controls
 * - Follow-up Calendar
 * - Performance Metrics
 */

import { useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Users,
  UserPlus,
  Clock,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  MessageSquare,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  Timer,
  Headphones,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Download,
  Settings,
  Flame,
  Thermometer,
  Snowflake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Mock Data
const MOCK_AGENT = {
  id: '1',
  name: 'أحمد محمد',
  extension: '101',
  status: 'available' as const,
  dailyTarget: 50,
  completedCalls: 32,
  salesAmount: 45000,
  monthlyTarget: 500000,
};

const MOCK_STATS = {
  totalCalls: 32,
  answeredCalls: 28,
  missedCalls: 4,
  avgDuration: 245, // seconds
  salesCalls: 8,
  conversionRate: '25%',
  totalDuration: 7840, // seconds
};

const MOCK_LEADS = [
  {
    id: '1',
    firstName: 'محمد',
    lastName: 'علي',
    phone: '01012345678',
    status: 'new',
    priority: 'hot',
    source: 'website',
    expectedValue: 15000,
    lastContactAt: null,
    city: 'القاهرة',
    companyName: 'شركة النيل',
  },
  {
    id: '2',
    firstName: 'سارة',
    lastName: 'أحمد',
    phone: '01098765432',
    status: 'contacted',
    priority: 'warm',
    source: 'social_media',
    expectedValue: 8000,
    lastContactAt: 'منذ ساعة',
    city: 'الإسكندرية',
    companyName: null,
  },
  {
    id: '3',
    firstName: 'خالد',
    lastName: 'حسن',
    phone: '01155667788',
    status: 'qualified',
    priority: 'hot',
    source: 'referral',
    expectedValue: 25000,
    lastContactAt: 'منذ يوم',
    city: 'الجيزة',
    companyName: 'مصنع الأمل',
  },
  {
    id: '4',
    firstName: 'نورا',
    lastName: 'محمود',
    phone: '01234567890',
    status: 'proposal',
    priority: 'warm',
    source: 'cold_call',
    expectedValue: 12000,
    lastContactAt: 'منذ 3 أيام',
    city: 'المنصورة',
    companyName: null,
  },
];

const MOCK_FOLLOW_UPS = [
  {
    id: '1',
    leadName: 'محمد علي',
    phone: '01012345678',
    type: 'call',
    scheduledAt: '10:30',
    priority: 'hot',
    notes: 'متابعة عرض الأسعار',
  },
  {
    id: '2',
    leadName: 'سارة أحمد',
    phone: '01098765432',
    type: 'whatsapp',
    scheduledAt: '11:00',
    priority: 'warm',
    notes: 'إرسال كتالوج المنتجات',
  },
  {
    id: '3',
    leadName: 'خالد حسن',
    phone: '01155667788',
    type: 'call',
    scheduledAt: '14:00',
    priority: 'hot',
    notes: 'التفاوض على السعر النهائي',
  },
];

const MOCK_RECENT_CALLS = [
  {
    id: '1',
    leadName: 'أحمد سمير',
    phone: '01111222333',
    direction: 'outbound',
    duration: 320,
    outcome: 'appointment',
    time: '09:45',
  },
  {
    id: '2',
    leadName: 'فاطمة علي',
    phone: '01222333444',
    direction: 'inbound',
    duration: 180,
    outcome: 'sale',
    time: '09:20',
  },
  {
    id: '3',
    leadName: 'عمر محمد',
    phone: '01333444555',
    direction: 'outbound',
    duration: 0,
    outcome: 'no_answer',
    time: '09:00',
  },
];

const MOCK_PIPELINE = [
  { status: 'new', label: 'جديد', count: 45, value: 675000, color: 'bg-blue-500' },
  { status: 'contacted', label: 'تم التواصل', count: 32, value: 480000, color: 'bg-yellow-500' },
  { status: 'qualified', label: 'مؤهل', count: 18, value: 360000, color: 'bg-orange-500' },
  { status: 'proposal', label: 'عرض سعر', count: 12, value: 300000, color: 'bg-purple-500' },
  { status: 'negotiation', label: 'تفاوض', count: 8, value: 200000, color: 'bg-pink-500' },
  { status: 'won', label: 'فاز', count: 5, value: 125000, color: 'bg-green-500' },
];

export default function PhoneSalesPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agentStatus, setAgentStatus] = useState<'available' | 'on_call' | 'break' | 'offline'>(
    'available'
  );
  const [isOnCall, setIsOnCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [currentCall, setCurrentCall] = useState<any>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'on_call':
        return 'bg-red-500';
      case 'break':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'متاح';
      case 'on_call':
        return 'في مكالمة';
      case 'break':
        return 'استراحة';
      case 'offline':
        return 'غير متصل';
      default:
        return status;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'hot':
        return <Flame className="w-4 h-4 text-red-500" />;
      case 'warm':
        return <Thermometer className="w-4 h-4 text-orange-500" />;
      case 'cold':
        return <Snowflake className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getOutcomeLabel = (outcome: string) => {
    switch (outcome) {
      case 'sale':
        return { label: 'بيع', color: 'bg-green-100 text-green-800' };
      case 'appointment':
        return { label: 'موعد', color: 'bg-blue-100 text-blue-800' };
      case 'callback_requested':
        return { label: 'معاودة اتصال', color: 'bg-purple-100 text-purple-800' };
      case 'not_interested':
        return { label: 'غير مهتم', color: 'bg-gray-100 text-gray-800' };
      case 'no_answer':
        return { label: 'لا رد', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: outcome, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleStartCall = (lead: any) => {
    setCurrentCall(lead);
    setIsOnCall(true);
    setAgentStatus('on_call');
    setCallDuration(0);
    setShowCallDialog(true);
  };

  const handleEndCall = () => {
    setIsOnCall(false);
    setAgentStatus('available');
    setShowCallDialog(false);
    setCurrentCall(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-600 text-white text-lg">
                    {MOCK_AGENT.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    'absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-white',
                    getStatusColor(agentStatus)
                  )}
                />
              </div>
              <div>
                <h1 className="font-bold text-lg">{MOCK_AGENT.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="w-3 h-3" />
                  <span>تحويلة {MOCK_AGENT.extension}</span>
                  <span className="mx-1">•</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs',
                      agentStatus === 'available' && 'bg-green-100 text-green-800',
                      agentStatus === 'on_call' && 'bg-red-100 text-red-800',
                      agentStatus === 'break' && 'bg-yellow-100 text-yellow-800',
                      agentStatus === 'offline' && 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {getStatusLabel(agentStatus)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Toggle */}
            <Select value={agentStatus} onValueChange={(v: any) => setAgentStatus(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">متاح</SelectItem>
                <SelectItem value="break">استراحة</SelectItem>
                <SelectItem value="offline">غير متصل</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick Actions */}
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="w-4 h-4" />
              العملاء المحتملين
            </TabsTrigger>
            <TabsTrigger value="calls" className="gap-2">
              <Phone className="w-4 h-4" />
              المكالمات
            </TabsTrigger>
            <TabsTrigger value="follow-ups" className="gap-2">
              <Calendar className="w-4 h-4" />
              المتابعات
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              مراحل البيع
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-12 gap-6">
              {/* Stats Cards */}
              <div className="col-span-12 grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">إجمالي المكالمات</p>
                        <p className="text-2xl font-bold">{MOCK_STATS.totalCalls}</p>
                        <p className="text-xs text-green-600">+12% من أمس</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">المبيعات</p>
                        <p className="text-2xl font-bold">{MOCK_STATS.salesCalls}</p>
                        <p className="text-xs text-gray-500">
                          معدل التحويل: {MOCK_STATS.conversionRate}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">متوسط المدة</p>
                        <p className="text-2xl font-bold">
                          {formatDuration(MOCK_STATS.avgDuration)}
                        </p>
                        <p className="text-xs text-gray-500">
                          إجمالي: {formatDuration(MOCK_STATS.totalDuration)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Timer className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">الهدف اليومي</p>
                        <p className="text-2xl font-bold">
                          {MOCK_AGENT.completedCalls}/{MOCK_AGENT.dailyTarget}
                        </p>
                        <Progress
                          value={(MOCK_AGENT.completedCalls / MOCK_AGENT.dailyTarget) * 100}
                          className="h-2 mt-2"
                        />
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Target className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Dial & Follow-ups */}
              <div className="col-span-8 grid grid-cols-2 gap-6">
                {/* Pending Follow-ups */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">المتابعات القادمة</CardTitle>
                      <Badge variant="secondary">{MOCK_FOLLOW_UPS.length} متابعة</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {MOCK_FOLLOW_UPS.map((followUp) => (
                          <div
                            key={followUp.id}
                            className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {getPriorityIcon(followUp.priority)}
                                <div>
                                  <p className="font-medium">{followUp.leadName}</p>
                                  <p className="text-sm text-gray-500">{followUp.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 ml-1" />
                                  {followUp.scheduledAt}
                                </Badge>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleStartCall(followUp)}
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">{followUp.notes}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Recent Calls */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">آخر المكالمات</CardTitle>
                      <Button variant="ghost" size="sm">
                        عرض الكل
                        <ChevronRight className="w-4 h-4 mr-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {MOCK_RECENT_CALLS.map((call) => (
                          <div
                            key={call.id}
                            className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {call.direction === 'inbound' ? (
                                  <PhoneIncoming className="w-5 h-5 text-blue-500" />
                                ) : (
                                  <PhoneOutgoing className="w-5 h-5 text-green-500" />
                                )}
                                <div>
                                  <p className="font-medium">{call.leadName}</p>
                                  <p className="text-sm text-gray-500">{call.phone}</p>
                                </div>
                              </div>
                              <div className="text-left">
                                <Badge className={getOutcomeLabel(call.outcome).color}>
                                  {getOutcomeLabel(call.outcome).label}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  {call.time} •{' '}
                                  {call.duration > 0 ? formatDuration(call.duration) : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Hot Leads */}
              <div className="col-span-4 space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setShowNewLeadDialog(true)}
                    >
                      <UserPlus className="w-4 h-4 ml-2" />
                      إضافة عميل محتمل
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Phone className="w-4 h-4 ml-2" />
                      اتصال سريع
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <MessageSquare className="w-4 h-4 ml-2" />
                      إرسال رسالة
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Calendar className="w-4 h-4 ml-2" />
                      جدولة متابعة
                    </Button>
                  </CardContent>
                </Card>

                {/* Hot Leads */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Flame className="w-5 h-5 text-red-500" />
                        عملاء ساخنين
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {MOCK_LEADS.filter((l) => l.priority === 'hot')
                        .slice(0, 3)
                        .map((lead) => (
                          <div
                            key={lead.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => setSelectedLead(lead.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {lead.firstName} {lead.lastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatCurrency(lead.expectedValue)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartCall(lead);
                                }}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>العملاء المحتملين</CardTitle>
                    <CardDescription>إدارة وتتبع العملاء المحتملين</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input placeholder="بحث..." className="w-64 pr-9" />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="new">جديد</SelectItem>
                        <SelectItem value="contacted">تم التواصل</SelectItem>
                        <SelectItem value="qualified">مؤهل</SelectItem>
                        <SelectItem value="proposal">عرض سعر</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowNewLeadDialog(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      عميل جديد
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-right p-4 font-medium">العميل</th>
                        <th className="text-right p-4 font-medium">الهاتف</th>
                        <th className="text-right p-4 font-medium">الحالة</th>
                        <th className="text-right p-4 font-medium">الأولوية</th>
                        <th className="text-right p-4 font-medium">القيمة المتوقعة</th>
                        <th className="text-right p-4 font-medium">آخر تواصل</th>
                        <th className="text-right p-4 font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_LEADS.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-t hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {lead.firstName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {lead.firstName} {lead.lastName}
                                </p>
                                {lead.companyName && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {lead.companyName}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono">{lead.phone}</td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {lead.status === 'new' && 'جديد'}
                              {lead.status === 'contacted' && 'تم التواصل'}
                              {lead.status === 'qualified' && 'مؤهل'}
                              {lead.status === 'proposal' && 'عرض سعر'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {getPriorityIcon(lead.priority)}
                              <span>
                                {lead.priority === 'hot' && 'ساخن'}
                                {lead.priority === 'warm' && 'دافئ'}
                                {lead.priority === 'cold' && 'بارد'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">{formatCurrency(lead.expectedValue)}</td>
                          <td className="p-4 text-gray-500">
                            {lead.lastContactAt || 'لم يتم التواصل'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleStartCall(lead)}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
                                  <DropdownMenuItem>تعديل</DropdownMenuItem>
                                  <DropdownMenuItem>جدولة متابعة</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">حذف</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>سجل المكالمات</CardTitle>
                      <div className="flex items-center gap-2">
                        <Select defaultValue="today">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">اليوم</SelectItem>
                            <SelectItem value="week">هذا الأسبوع</SelectItem>
                            <SelectItem value="month">هذا الشهر</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {[...MOCK_RECENT_CALLS, ...MOCK_RECENT_CALLS, ...MOCK_RECENT_CALLS].map(
                          (call, index) => (
                            <div
                              key={`${call.id}-${index}`}
                              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  {call.direction === 'inbound' ? (
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <PhoneIncoming className="w-5 h-5 text-blue-600" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                      <PhoneOutgoing className="w-5 h-5 text-green-600" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium">{call.leadName}</p>
                                    <p className="text-sm text-gray-500">{call.phone}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge className={getOutcomeLabel(call.outcome).color}>
                                    {getOutcomeLabel(call.outcome).label}
                                  </Badge>
                                  <div className="text-left">
                                    <p className="font-medium">
                                      {call.duration > 0 ? formatDuration(call.duration) : '-'}
                                    </p>
                                    <p className="text-sm text-gray-500">{call.time}</p>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    <Play className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات المكالمات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">إجمالي المكالمات</span>
                      <span className="font-bold">{MOCK_STATS.totalCalls}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">مكالمات مجابة</span>
                      <span className="font-bold text-green-600">{MOCK_STATS.answeredCalls}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">مكالمات فائتة</span>
                      <span className="font-bold text-red-600">{MOCK_STATS.missedCalls}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">معدل التحويل</span>
                      <span className="font-bold text-blue-600">{MOCK_STATS.conversionRate}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>نتائج المكالمات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>بيع</span>
                        </div>
                        <span className="font-bold">8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>موعد</span>
                        </div>
                        <span className="font-bold">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          <span>معاودة اتصال</span>
                        </div>
                        <span className="font-bold">5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span>لا رد</span>
                        </div>
                        <span className="font-bold">4</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-500" />
                          <span>غير مهتم</span>
                        </div>
                        <span className="font-bold">3</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Follow-ups Tab */}
          <TabsContent value="follow-ups">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>المتابعات المجدولة</CardTitle>
                    <CardDescription>جميع المتابعات المجدولة لهذا الأسبوع</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 ml-2" />
                    جدولة متابعة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-4">
                  {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(
                    (day, index) => (
                      <div key={day} className="border rounded-lg p-3">
                        <h3 className="font-medium text-center mb-3">{day}</h3>
                        <div className="space-y-2">
                          {index < 3 &&
                            MOCK_FOLLOW_UPS.slice(0, index + 1).map((followUp) => (
                              <div
                                key={followUp.id}
                                className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm cursor-pointer hover:bg-blue-100"
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  {getPriorityIcon(followUp.priority)}
                                  <span className="font-medium">{followUp.scheduledAt}</span>
                                </div>
                                <p className="truncate">{followUp.leadName}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>مراحل البيع (Pipeline)</CardTitle>
                    <CardDescription>تتبع تقدم العملاء المحتملين عبر مراحل البيع</CardDescription>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500">القيمة الإجمالية المتوقعة</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(MOCK_PIPELINE.reduce((sum, s) => sum + s.value, 0))}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-4">
                  {MOCK_PIPELINE.map((stage) => (
                    <div key={stage.status} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-3 h-3 rounded-full', stage.color)} />
                          <span className="font-medium">{stage.label}</span>
                        </div>
                        <Badge variant="secondary">{stage.count}</Badge>
                      </div>
                      <p className="text-lg font-bold mb-3">{formatCurrency(stage.value)}</p>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {MOCK_LEADS.filter(
                            (l) =>
                              l.status === stage.status ||
                              (stage.status === 'new' && l.status === 'new')
                          )
                            .slice(0, 5)
                            .map((lead) => (
                              <div
                                key={lead.id}
                                className="p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">
                                    {lead.firstName} {lead.lastName}
                                  </p>
                                  {getPriorityIcon(lead.priority)}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {formatCurrency(lead.expectedValue)}
                                </p>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Active Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {isOnCall ? 'مكالمة جارية' : 'إنهاء المكالمة'}
            </DialogTitle>
          </DialogHeader>
          {currentCall && (
            <div className="text-center py-6">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarFallback className="text-2xl bg-green-100 text-green-600">
                  {currentCall.firstName?.[0] || currentCall.leadName?.[0]}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">
                {currentCall.firstName
                  ? `${currentCall.firstName} ${currentCall.lastName || ''}`
                  : currentCall.leadName}
              </h3>
              <p className="text-gray-500 font-mono">{currentCall.phone}</p>

              {isOnCall && (
                <>
                  <div className="my-6">
                    <p className="text-4xl font-mono font-bold text-green-600">
                      {formatDuration(callDuration)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">مدة المكالمة</p>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-12 h-12 rounded-full"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? (
                        <MicOff className="w-5 h-5 text-red-500" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
                      onClick={handleEndCall}
                    >
                      <PhoneOff className="w-6 h-6" />
                    </Button>
                    <Button variant="outline" size="icon" className="w-12 h-12 rounded-full">
                      <Volume2 className="w-5 h-5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {!isOnCall && (
            <div className="space-y-4">
              <div>
                <Label>نتيجة المكالمة</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النتيجة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">بيع</SelectItem>
                    <SelectItem value="appointment">موعد</SelectItem>
                    <SelectItem value="callback_requested">طلب معاودة اتصال</SelectItem>
                    <SelectItem value="not_interested">غير مهتم</SelectItem>
                    <SelectItem value="no_answer">لا رد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ملاحظات</Label>
                <Textarea placeholder="أضف ملاحظات عن المكالمة..." />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCallDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={() => setShowCallDialog(false)}>حفظ وإغلاق</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Lead Dialog */}
      <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة عميل محتمل جديد</DialogTitle>
            <DialogDescription>أدخل بيانات العميل المحتمل الجديد</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الاسم الأول *</Label>
              <Input placeholder="محمد" />
            </div>
            <div>
              <Label>اسم العائلة</Label>
              <Input placeholder="أحمد" />
            </div>
            <div>
              <Label>رقم الهاتف *</Label>
              <Input placeholder="01012345678" dir="ltr" />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input type="email" placeholder="email@example.com" dir="ltr" />
            </div>
            <div>
              <Label>المحافظة</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cairo">القاهرة</SelectItem>
                  <SelectItem value="giza">الجيزة</SelectItem>
                  <SelectItem value="alex">الإسكندرية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المصدر</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المصدر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">الموقع</SelectItem>
                  <SelectItem value="social_media">وسائل التواصل</SelectItem>
                  <SelectItem value="referral">إحالة</SelectItem>
                  <SelectItem value="cold_call">مكالمة باردة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select defaultValue="warm">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">ساخن</SelectItem>
                  <SelectItem value="warm">دافئ</SelectItem>
                  <SelectItem value="cold">بارد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>القيمة المتوقعة</Label>
              <Input type="number" placeholder="10000" />
            </div>
            <div className="col-span-2">
              <Label>ملاحظات</Label>
              <Textarea placeholder="أضف أي ملاحظات..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewLeadDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={() => setShowNewLeadDialog(false)}>إضافة العميل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
