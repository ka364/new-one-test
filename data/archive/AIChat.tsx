import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Send, User } from "lucide-react";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";

export default function AIChat() {
  const { user } = useAuth();
  const [conversationId] = useState(() => nanoid());
  const [message, setMessage] = useState("");

  const { data: history, isLoading, refetch } = trpc.chat.getHistory.useQuery(
    { conversationId },
    { enabled: !!conversationId }
  );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
    },
  });

  const handleSend = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      message: message.trim(),
      conversationId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card className="h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span>مساعد HaderOS الذكي</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            اسأل عن بياناتك، احصل على رؤى تحليلية، أو استفسر عن أي شيء متعلق بأعمالك
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-20 flex-1" />
                </div>
              ))}
            </div>
          ) : history && history.length > 0 ? (
            history.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Bot className="h-16 w-16 text-muted-foreground/50" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">ابدأ محادثة جديدة</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  يمكنك سؤالي عن أي شيء متعلق بأعمالك: التقارير المالية، تحليل المبيعات،
                  التنبؤ بالطلب، أو حتى نصائح لتحسين الأداء
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
                {[
                  "ما هو إجمالي إيراداتي هذا الشهر؟",
                  "أعطني تحليل للمعاملات الأخيرة",
                  "ما هي أكثر المنتجات مبيعاً؟",
                  "هل هناك أي انتهاكات أخلاقية؟",
                ].map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="justify-start text-right"
                    onClick={() => setMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {sendMessageMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                  <div
                    className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال)"
              className="min-h-[60px] resize-none"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="icon"
              className="h-[60px] w-[60px] shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
