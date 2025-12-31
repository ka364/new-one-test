/**
 * Board Meeting Viewer Component
 * عرض اجتماعات مجلس الإدارة
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import {
  Video,
  Users,
  Calendar,
  Clock,
  FileText,
  Download,
  Eye,
  EyeOff,
  CheckCircle,
  Circle,
  PlayCircle,
  StopCircle,
} from 'lucide-react';

interface BoardMeeting {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  status: 'scheduled' | 'live' | 'ended' | 'paused';
  streamUrl: string;
  thumbnailUrl: string;
  startTime: Date;
  endTime?: Date;
  scheduledDuration: number;
  viewerCount: number;
  peakViewers: number;
  hostName: string;
  hostNameAr: string;
  attendees: MeetingAttendee[];
  agenda: AgendaItem[];
  isRecorded: boolean;
  recordingUrl?: string;
  isPublished: boolean;
  publishedAt?: Date;
  visibility: 'board_only' | 'management' | 'all_team';
  transcriptUrl?: string;
  minutesUrl?: string;
  tags: string[];
  category: 'strategic' | 'operational' | 'financial' | 'emergency' | 'other';
}

interface MeetingAttendee {
  userId: string;
  userName: string;
  userNameAr: string;
  role: 'chairman' | 'member' | 'secretary' | 'observer';
  isPresent: boolean;
  joinedAt?: Date;
  leftAt?: Date;
}

interface AgendaItem {
  id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  order: number;
  duration: number;
  presenter: string;
  presenterAr: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  startTime?: Date;
  endTime?: Date;
  decisions: Decision[];
  notes: string;
  notesAr: string;
}

interface Decision {
  id: string;
  agendaItemId: string;
  description: string;
  descriptionAr: string;
  type: 'resolution' | 'action_item' | 'information';
  assignedTo?: string[];
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: Date;
}

interface BoardMeetingViewerProps {
  meeting: BoardMeeting;
  userRole: 'board' | 'management' | 'team';
  onPublish?: (visibility: 'board_only' | 'management' | 'all_team') => void;
  onUnpublish?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export const BoardMeetingViewer: React.FC<BoardMeetingViewerProps> = ({
  meeting,
  userRole,
  onPublish,
  onUnpublish,
  onStart,
  onEnd,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: 'bg-blue-500',
      live: 'bg-red-500 animate-pulse',
      ended: 'bg-gray-500',
      paused: 'bg-yellow-500',
    };

    const labels: Record<string, string> = {
      scheduled: 'مجدول',
      live: 'مباشر',
      ended: 'انتهى',
      paused: 'متوقف مؤقتاً',
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      strategic: 'استراتيجي',
      operational: 'تشغيلي',
      financial: 'مالي',
      emergency: 'طارئ',
      other: 'أخرى',
    };
    return labels[category] || category;
  };

  const getVisibilityLabel = (visibility: string) => {
    const labels: Record<string, string> = {
      board_only: 'مجلس الإدارة فقط',
      management: 'الإدارة',
      all_team: 'جميع الفريق',
    };
    return labels[visibility] || visibility;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      chairman: 'رئيس',
      member: 'عضو',
      secretary: 'أمين سر',
      observer: 'مراقب',
    };
    return labels[role] || role;
  };

  const getAgendaStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const canControlMeeting = userRole === 'board';
  const canViewMeeting = meeting.isPublished || userRole === 'board';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{meeting.titleAr}</CardTitle>
                {getStatusBadge(meeting.status)}
              </div>
              <p className="text-sm text-gray-600">{meeting.descriptionAr}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(meeting.startTime).toLocaleDateString('ar-EG')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {meeting.scheduledDuration} دقيقة
                </span>
                <Badge variant="outline">{getCategoryLabel(meeting.category)}</Badge>
              </div>
            </div>

            {canControlMeeting && (
              <div className="flex gap-2">
                {meeting.status === 'scheduled' && onStart && (
                  <Button onClick={onStart} size="sm">
                    <PlayCircle className="w-4 h-4 ml-2" />
                    بدء الاجتماع
                  </Button>
                )}
                {meeting.status === 'live' && onEnd && (
                  <Button onClick={onEnd} size="sm" variant="destructive">
                    <StopCircle className="w-4 h-4 ml-2" />
                    إنهاء الاجتماع
                  </Button>
                )}
                {meeting.status === 'ended' && !meeting.isPublished && onPublish && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onPublish('all_team')}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      نشر للفريق
                    </Button>
                  </div>
                )}
                {meeting.isPublished && onUnpublish && (
                  <Button onClick={onUnpublish} size="sm" variant="outline">
                    <EyeOff className="w-4 h-4 ml-2" />
                    إلغاء النشر
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Video Player */}
      {canViewMeeting && (meeting.status === 'live' || meeting.recordingUrl) && (
        <Card>
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black">
              <video
                src={meeting.status === 'live' ? meeting.streamUrl : meeting.recordingUrl}
                controls
                className="w-full h-full"
                poster={meeting.thumbnailUrl}
              >
                متصفحك لا يدعم تشغيل الفيديو
              </video>
              {meeting.status === 'live' && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-red-500 animate-pulse">
                    <Video className="w-3 h-3 ml-1" />
                    مباشر
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="attendees">الحضور</TabsTrigger>
          <TabsTrigger value="agenda">جدول الأعمال</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الاجتماع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">المصنع</p>
                  <p className="font-medium">{meeting.factoryName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">المضيف</p>
                  <p className="font-medium">{meeting.hostNameAr}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">عدد المشاهدين</p>
                  <p className="font-medium">{meeting.viewerCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">أقصى عدد مشاهدين</p>
                  <p className="font-medium">{meeting.peakViewers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">مستوى الرؤية</p>
                  <p className="font-medium">{getVisibilityLabel(meeting.visibility)}</p>
                </div>
                {meeting.isPublished && meeting.publishedAt && (
                  <div>
                    <p className="text-sm text-gray-500">تاريخ النشر</p>
                    <p className="font-medium">
                      {new Date(meeting.publishedAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendees Tab */}
        <TabsContent value="attendees">
          <Card>
            <CardHeader>
              <CardTitle>الحضور ({meeting.attendees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {meeting.attendees.map((attendee) => (
                    <div
                      key={attendee.userId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            attendee.isPresent ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <div>
                          <p className="font-medium">{attendee.userNameAr}</p>
                          <p className="text-sm text-gray-500">
                            {getRoleLabel(attendee.role)}
                          </p>
                        </div>
                      </div>
                      {attendee.joinedAt && (
                        <p className="text-xs text-gray-500">
                          انضم: {new Date(attendee.joinedAt).toLocaleTimeString('ar-EG')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agenda Tab */}
        <TabsContent value="agenda">
          <Card>
            <CardHeader>
              <CardTitle>جدول الأعمال ({meeting.agenda.length} بند)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {meeting.agenda.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          {getAgendaStatusIcon(item.status)}
                          <div>
                            <p className="font-medium">{item.titleAr}</p>
                            {item.descriptionAr && (
                              <p className="text-sm text-gray-600 mt-1">
                                {item.descriptionAr}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              المقدم: {item.presenterAr} • {item.duration} دقيقة
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Decisions */}
                      {item.decisions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium">القرارات:</p>
                          {item.decisions.map((decision) => (
                            <div
                              key={decision.id}
                              className="bg-gray-50 p-2 rounded text-sm"
                            >
                              <p>{decision.descriptionAr}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {decision.type === 'resolution' && 'قرار'}
                                  {decision.type === 'action_item' && 'إجراء'}
                                  {decision.type === 'information' && 'معلومة'}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    decision.priority === 'high'
                                      ? 'border-red-500 text-red-500'
                                      : decision.priority === 'medium'
                                      ? 'border-yellow-500 text-yellow-500'
                                      : 'border-gray-500 text-gray-500'
                                  }`}
                                >
                                  {decision.priority === 'high' && 'عالي'}
                                  {decision.priority === 'medium' && 'متوسط'}
                                  {decision.priority === 'low' && 'منخفض'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>المستندات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meeting.recordingUrl && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">تسجيل الاجتماع</p>
                      <p className="text-sm text-gray-500">فيديو</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 ml-2" />
                    تحميل
                  </Button>
                </div>
              )}

              {meeting.transcriptUrl && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">النص الكامل</p>
                      <p className="text-sm text-gray-500">مُنشأ بالذكاء الاصطناعي</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 ml-2" />
                    تحميل
                  </Button>
                </div>
              )}

              {meeting.minutesUrl && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium">محضر الاجتماع</p>
                      <p className="text-sm text-gray-500">مُنشأ بالذكاء الاصطناعي</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 ml-2" />
                    تحميل
                  </Button>
                </div>
              )}

              {!meeting.recordingUrl && !meeting.transcriptUrl && !meeting.minutesUrl && (
                <p className="text-center text-gray-500 py-8">
                  لا توجد مستندات متاحة حالياً
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BoardMeetingViewer;
