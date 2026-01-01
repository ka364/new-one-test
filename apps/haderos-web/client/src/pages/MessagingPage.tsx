/**
 * 📨 Unified Messaging Page
 * صفحة الرسائل الموحدة
 *
 * Supports:
 * - Team Communication
 * - Customer Support Tickets
 * - AI Assistant
 */

import { useState } from "react";
import {
  MessageSquare,
  Users,
  HeadphonesIcon,
  Bot,
  Search,
  Plus,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  Star,
  Archive,
  Trash2,
  Filter,
  Check,
  CheckCheck,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Mock conversations data
const MOCK_CONVERSATIONS = {
  team: [
    {
      id: "1",
      title: "فريق المبيعات",
      type: "team" as const,
      lastMessage: "تم تحقيق الهدف الشهري!",
      lastMessageTime: "منذ 5 دقائق",
      unreadCount: 3,
      participants: [
        { id: 1, name: "أحمد محمد", avatar: null },
        { id: 2, name: "سارة خالد", avatar: null },
        { id: 3, name: "محمود علي", avatar: null },
      ],
      isOnline: true,
    },
    {
      id: "2",
      title: "فريق التطوير",
      type: "team" as const,
      lastMessage: "تم إصلاح المشكلة في الإنتاج",
      lastMessageTime: "منذ ساعة",
      unreadCount: 0,
      participants: [
        { id: 4, name: "علي حسن", avatar: null },
        { id: 5, name: "نورا أحمد", avatar: null },
      ],
      isOnline: true,
    },
  ],
  support: [
    {
      id: "3",
      title: "استفسار عن طلب #12345",
      type: "support" as const,
      ticketNumber: "TICKET-12345",
      status: "open" as const,
      priority: "high" as const,
      lastMessage: "متى سيصل الطلب؟",
      lastMessageTime: "منذ 10 دقائق",
      unreadCount: 1,
      customer: { name: "عميل جديد", email: "customer@example.com" },
    },
    {
      id: "4",
      title: "مشكلة في الدفع",
      type: "support" as const,
      ticketNumber: "TICKET-12346",
      status: "in_progress" as const,
      priority: "medium" as const,
      lastMessage: "تم حل المشكلة",
      lastMessageTime: "منذ ساعتين",
      unreadCount: 0,
      customer: { name: "محمد علي", email: "ali@example.com" },
    },
  ],
  ai: [
    {
      id: "5",
      title: "مساعد HADEROS",
      type: "ai" as const,
      lastMessage: "كيف يمكنني مساعدتك اليوم؟",
      lastMessageTime: "الآن",
      unreadCount: 0,
      aiModel: "GPT-4",
    },
  ],
};

// Mock messages
const MOCK_MESSAGES = [
  {
    id: "m1",
    senderId: 1,
    senderName: "أحمد محمد",
    content: "السلام عليكم جميعاً!",
    timestamp: "10:00",
    isRead: true,
  },
  {
    id: "m2",
    senderId: 2,
    senderName: "سارة خالد",
    content: "وعليكم السلام، صباح الخير",
    timestamp: "10:01",
    isRead: true,
  },
  {
    id: "m3",
    senderId: 1,
    senderName: "أحمد محمد",
    content: "أريد إبلاغكم أننا حققنا الهدف الشهري! 🎉",
    timestamp: "10:05",
    isRead: true,
  },
  {
    id: "m4",
    senderId: 3,
    senderName: "محمود علي",
    content: "ممتاز! عمل رائع من الجميع",
    timestamp: "10:06",
    isRead: true,
  },
  {
    id: "m5",
    senderId: 2,
    senderName: "سارة خالد",
    content: "مبروك لنا جميعاً! 💪",
    timestamp: "10:07",
    isRead: false,
  },
];

export default function MessagingPage() {
  const [activeTab, setActiveTab] = useState("team");
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUserId = 1; // Mock current user

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // In production, use tRPC to send message
    console.log("Sending:", messageInput);
    setMessageInput("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-yellow-500";
      case "in_progress": return "bg-blue-500";
      case "resolved": return "bg-green-500";
      case "closed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-100";
      case "high": return "text-orange-600 bg-orange-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const conversations = activeTab === "team"
    ? MOCK_CONVERSATIONS.team
    : activeTab === "support"
    ? MOCK_CONVERSATIONS.support
    : MOCK_CONVERSATIONS.ai;

  return (
    <div className="h-[calc(100vh-80px)] flex" dir="rtl">
      {/* Sidebar */}
      <div className="w-80 border-l flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">الرسائل</h1>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="team" className="text-xs">
                <Users className="w-4 h-4 ml-1" />
                الفريق
              </TabsTrigger>
              <TabsTrigger value="support" className="text-xs">
                <HeadphonesIcon className="w-4 h-4 ml-1" />
                الدعم
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs">
                <Bot className="w-4 h-4 ml-1" />
                AI
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors",
                  selectedConversation === conv.id
                    ? "bg-blue-50 dark:bg-blue-900/30"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {conv.type === "ai" ? "🤖" : conv.title[0]}
                      </AvatarFallback>
                    </Avatar>
                    {conv.type === "team" && (conv as any).isOnline && (
                      <Circle className="absolute bottom-0 left-0 w-3 h-3 fill-green-500 text-green-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{conv.title}</span>
                      <span className="text-xs text-gray-500">{conv.lastMessageTime}</span>
                    </div>

                    {conv.type === "support" && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getPriorityColor((conv as any).priority)}>
                          {(conv as any).priority === "high" ? "عاجل" : "متوسط"}
                        </Badge>
                        <span className={cn("w-2 h-2 rounded-full", getStatusColor((conv as any).status))} />
                      </div>
                    )}

                    <p className="text-sm text-gray-500 truncate mt-1">{conv.lastMessage}</p>
                  </div>

                  {/* Unread Badge */}
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center p-0 text-xs">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* New Conversation Button */}
        <div className="p-3 border-t">
          <Button className="w-full" variant="outline">
            <Plus className="w-4 h-4 ml-2" />
            محادثة جديدة
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    ف
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">فريق المبيعات</h2>
                  <p className="text-xs text-gray-500">3 أعضاء • 2 متصل</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Info className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {MOCK_MESSAGES.map((message) => {
                  const isOwn = message.senderId === currentUserId;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isOwn ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          isOwn
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white dark:bg-gray-800 rounded-bl-none shadow-sm"
                        )}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                            {message.senderName}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          isOwn ? "justify-start" : "justify-end"
                        )}>
                          <span className={cn(
                            "text-xs",
                            isOwn ? "text-blue-200" : "text-gray-500"
                          )}>
                            {message.timestamp}
                          </span>
                          {isOwn && (
                            message.isRead
                              ? <CheckCheck className="w-3 h-3 text-blue-200" />
                              : <Check className="w-3 h-3 text-blue-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  placeholder="اكتب رسالتك..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Smile className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600">اختر محادثة</h3>
              <p className="text-sm text-gray-500">اختر محادثة من القائمة للبدء</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
