import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Send,
  Plus,
  X,
  Check,
  FileText,
  BarChart,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';

/**
 * 🌱 Adaptive Chat Interface - DeepSeek Style
 *
 * النظام يبدأ بسيطاً ويتطور مع الاستخدام:
 * - واجهة محادثة ذكية مع AI
 * - أيقونات ديناميكية تظهر تدريجياً حسب سلوك المستخدم
 * - إنشاء Google Sheets تلقائياً
 * - اقتراحات ذكية بناءً على الأنماط
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DynamicIcon {
  id: number;
  taskType: string;
  iconName: string;
  iconNameAr: string | null;
  iconEmoji: string;
  usageCount: number;
  isVisible: boolean;
}

interface Suggestion {
  id: number;
  suggestionType: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  confidence: string;
  status: string;
}

export default function AdaptiveChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'مرحباً! أنا مساعدك الذكي في HaderOS 🌱\n\nسأتعلم من طريقة عملك وأقترح عليك أدوات جديدة تدريجياً. ماذا تريد أن تفعل اليوم؟',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic icons
  const { data: icons = [], refetch: refetchIcons } = trpc.adaptive.getDynamicIcons.useQuery();

  // Fetch pending suggestions
  const { data: suggestions = [], refetch: refetchSuggestions } =
    trpc.adaptive.getPendingSuggestions.useQuery();

  // Mutations
  const trackBehavior = trpc.adaptive.trackBehavior.useMutation();
  const useIcon = trpc.adaptive.useIcon.useMutation();
  const acceptSuggestion = trpc.adaptive.acceptSuggestion.useMutation();
  const rejectSuggestion = trpc.adaptive.rejectSuggestion.useMutation();
  const createInvoice = trpc.adaptive.createInvoice.useMutation();
  const createDailyReport = trpc.adaptive.createDailyReport.useMutation();
  const createCustomSheet = trpc.adaptive.createCustomSheet.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Track user behavior
      await trackBehavior.mutateAsync({
        actionType: 'chat_message',
        actionData: { message: input },
      });

      // Detect intent and execute actions
      const intent = detectIntent(input);

      if (intent.type === 'create_invoice') {
        await handleCreateInvoice(intent.data);
      } else if (intent.type === 'create_report') {
        await handleCreateReport(intent.data);
      } else if (intent.type === 'general') {
        // General chat - simulate AI response
        const aiResponse: Message = {
          role: 'assistant',
          content: generateResponse(input),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ أثناء معالجة طلبك');
    } finally {
      setIsGenerating(false);
    }
  };

  // Detect user intent from message
  const detectIntent = (message: string) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('فاتورة') || lowerMessage.includes('invoice')) {
      return { type: 'create_invoice', data: {} };
    }

    if (lowerMessage.includes('تقرير') || lowerMessage.includes('report')) {
      return { type: 'create_report', data: {} };
    }

    return { type: 'general', data: {} };
  };

  // Generate AI response
  const generateResponse = (userInput: string) => {
    const responses = [
      'فهمت! دعني أساعدك في ذلك. 🎯',
      'بالتأكيد! سأعمل على هذا الآن. ✨',
      'رائع! هل تريد مني إنشاء ملف Google Sheets لهذا؟ 📊',
      'ممتاز! لاحظت أنك تقوم بهذا كثيراً. هل تريدني أن أضيف أيقونة سريعة له؟ 🚀',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Handle create invoice
  const handleCreateInvoice = async (data: any) => {
    try {
      const result = await createInvoice.mutateAsync({
        invoiceNumber: `INV-${Date.now()}`,
        customerName: 'عميل تجريبي',
        items: [
          { name: 'منتج 1', quantity: 2, price: 100 },
          { name: 'منتج 2', quantity: 1, price: 200 },
        ],
        total: 400,
      });

      const aiResponse: Message = {
        role: 'assistant',
        content: `✅ تم إنشاء الفاتورة بنجاح!\n\n📄 [عرض الفاتورة](${result.link})\n\nهل تريد مني إنشاء المزيد من الفواتير؟`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      toast.success('تم إنشاء الفاتورة بنجاح');
      refetchIcons();
    } catch (error) {
      toast.error('فشل إنشاء الفاتورة');
    }
  };

  // Handle create report
  const handleCreateReport = async (data: any) => {
    try {
      const result = await createDailyReport.mutateAsync({
        date: new Date().toISOString().split('T')[0],
        metrics: [
          { name: 'المبيعات', value: '1000 ريال' },
          { name: 'الطلبات', value: '25 طلب' },
          { name: 'العملاء الجدد', value: '5 عملاء' },
        ],
      });

      const aiResponse: Message = {
        role: 'assistant',
        content: `✅ تم إنشاء التقرير اليومي!\n\n📊 [عرض التقرير](${result.link})\n\nهل تريد جدولة تقارير يومية تلقائية؟`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      toast.success('تم إنشاء التقرير بنجاح');
      refetchIcons();
    } catch (error) {
      toast.error('فشل إنشاء التقرير');
    }
  };

  // Handle icon click
  const handleIconClick = async (icon: DynamicIcon) => {
    try {
      await useIcon.mutateAsync({ iconId: icon.id });

      const aiResponse: Message = {
        role: 'assistant',
        content: `تم فتح: ${icon.iconNameAr || icon.iconName} ✨\n\nماذا تريد أن تفعل؟`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      refetchIcons();
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  // Handle accept suggestion
  const handleAcceptSuggestion = async (suggestion: Suggestion) => {
    try {
      await acceptSuggestion.mutateAsync({ suggestionId: suggestion.id });
      toast.success('تم قبول الاقتراح!');
      refetchSuggestions();
      refetchIcons();
    } catch (error) {
      toast.error('فشل قبول الاقتراح');
    }
  };

  // Handle reject suggestion
  const handleRejectSuggestion = async (suggestion: Suggestion) => {
    try {
      await rejectSuggestion.mutateAsync({
        suggestionId: suggestion.id,
        feedback: 'Not needed',
      });
      toast.success('تم رفض الاقتراح');
      refetchSuggestions();
    } catch (error) {
      toast.error('فشل رفض الاقتراح');
    }
  };

  return (
    <div
      className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
      dir="rtl"
    >
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">حاضر AI 🌱</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              مساعدك الذكي الذي يتعلم ويتطور معك
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions Bar */}
      {suggestions.length > 0 && (
        <div className="border-b bg-blue-50 dark:bg-blue-950/20 px-6 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              اقتراحات جديدة لك
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{suggestion.titleAr || suggestion.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    ثقة: {parseFloat(suggestion.confidence).toFixed(0)}%
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAcceptSuggestion(suggestion)}
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRejectSuggestion(suggestion)}
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === 'user'
                  ? 'bg-white dark:bg-slate-800'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Streamdown>{message.content}</Streamdown>
              </div>
              <p className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString('ar-SA')}
              </p>
            </Card>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-end">
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4">
              <Loader2 className="w-5 h-5 animate-spin" />
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Icons Bar */}
      {icons.length > 0 && (
        <div className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              أدواتك السريعة
            </span>
            <Badge variant="secondary" className="mr-auto">
              {icons.length} أداة
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {icons.map((icon) => (
              <Button
                key={icon.id}
                variant="outline"
                size="sm"
                onClick={() => handleIconClick(icon)}
                className="flex items-center gap-2"
              >
                <span className="text-lg">{icon.iconEmoji}</span>
                <span>{icon.iconNameAr || icon.iconName}</span>
                <Badge variant="secondary" className="text-xs">
                  {icon.usageCount}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اكتب رسالتك هنا... (مثال: أنشئ فاتورة، أنشئ تقرير يومي)"
            className="flex-1"
            disabled={isGenerating}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="bg-gradient-to-r from-blue-500 to-purple-600"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 text-center">
          💡 النظام يتعلم من استخدامك ويقترح أدوات جديدة تلقائياً
        </p>
      </div>
    </div>
  );
}
