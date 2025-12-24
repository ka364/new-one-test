// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Send, 
  Paperclip, 
  X, 
  FileText, 
  Image as ImageIcon, 
  File,
  Copy,
  Check,
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  files?: Array<{ name: string; size: number; type: string }>;
  timestamp: string;
}

interface ChatInterfaceProps {
  userRole?: 'worker' | 'manager';
}

export default function ChatInterface({ userRole = 'worker' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: userRole === 'worker' 
        ? '👋 مرحباً! أنا مساعدك الذكي في HaderOS. يمكنني مساعدتك في:\n\n- **إدارة الطلبات** والشحنات\n- **تحليل المبيعات** والماليات\n- **معالجة الصور** والمستندات\n- **الإجابة على الأسئلة** المتعلقة بالعمل\n\nكيف يمكنني مساعدتك اليوم؟ 🚀'
        : '👋 مرحباً! أنا مساعدك التنفيذي الذكي في HaderOS. يمكنني:\n\n- **تحليل الأداء** وإعداد التقارير\n- **مراقبة الفريق** والإنتاجية\n- **تحليل البيانات** المالية والتشغيلية\n- **اقتراحات استراتيجية** لتحسين الأداء\n- **إدارة الحملات** التسويقية\n\nما الذي تحتاج إليه؟ 📊',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // File upload with drag & drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    noClick: true,
    noKeyboard: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (file.type.includes('sheet') || file.type.includes('excel')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, data.aiMessage]);
      setIsLoading(false);
      setFiles([]);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setIsLoading(false);
    },
  });

  const handleSend = async () => {
    if (!input.trim() && files.length === 0) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = input;
    setInput('');
    setIsLoading(true);

    // TODO: Upload files to storage first
    const fileUrls = files.map(f => ({
      name: f.name,
      url: '', // TODO: Upload and get URL
      size: f.size,
      type: f.type,
    }));

    sendMessageMutation.mutate({
      content: messageContent,
      files: fileUrls.length > 0 ? fileUrls : undefined,
      context: {
        userRole,
        includeBusinessContext: true,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      {...getRootProps()} 
      className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      {/* Drag & Drop Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm border-4 border-dashed border-blue-500 rounded-lg">
          <div className="text-center">
            <Paperclip className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-bounce" />
            <p className="text-xl font-semibold text-blue-600">أفلت الملفات هنا</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">HaderOS AI Assistant</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? 'جاري الكتابة...' : 'متصل'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user' 
                ? 'bg-gradient-to-br from-green-400 to-blue-500' 
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              {message.role === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
              }`}>
                {/* Files */}
                {message.files && message.files.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {message.files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm opacity-90">
                        {getFileIcon(file as any)}
                        <span>{file.name}</span>
                        <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Text */}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Timestamp & Actions */}
              <div className={`flex items-center gap-2 mt-1 px-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => copyMessage(message.id, message.content)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        {/* File Previews */}
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-sm"
              >
                {getFileIcon(file)}
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Box */}
        <div className="flex gap-2">
          <input {...getInputProps()} />
          <label className="cursor-pointer p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }
              }}
            />
          </label>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا... (Enter للإرسال، Shift+Enter لسطر جديد)"
            className="flex-1 resize-none bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />

          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && files.length === 0)}
            className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          يدعم: صور (PNG, JPG), مستندات (PDF), جداول (Excel, CSV)
        </p>
      </div>
    </div>
  );
}
