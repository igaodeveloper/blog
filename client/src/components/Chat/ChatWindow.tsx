import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { Send, Flag } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { getChatWebSocketUrl } from "@/lib/utils";

interface ChatMessage {
  id: number;
  content: string;
  userId: number;
  roomId: string;
  createdAt: string;
  user: {
    id: number;
    displayName: string;
    avatar?: string;
  };
}

export default function ChatWindow() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ["/api/chat/messages"],
    enabled: !!user,
  });

  useEffect(() => {
    if (Array.isArray(initialMessages)) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!user) return;

    const websocket = new WebSocket(getChatWebSocketUrl(user.id));
    
    websocket.onopen = () => {
      console.log("WebSocket connected");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        setMessages(prev => [...prev, data.message]);
      }
      if (data.type === "online_users") {
        setOnlineUsers(data.users);
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };

    return () => {
      websocket.close();
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !ws || !user) return;

    ws.send(JSON.stringify({
      type: "chat_message",
      content: message,
      userId: user.id,
      roomId: "general",
    }));

    setMessage("");
  };

  const handleReportMessage = async (messageId: number) => {
    try {
      await fetch(`/api/chat/report/${messageId}`, { method: "POST" });
    } catch (error) {
      console.error("Error reporting message:", error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Faça login para acessar o chat da comunidade.</p>
      </div>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700 overflow-hidden">
      <CardHeader className="border-b border-gray-700 p-6">
        <CardTitle className="text-2xl font-bold mb-2 text-white">
          {t("chat.title")}
        </CardTitle>
        <p className="text-gray-400">{t("chat.subtitle")}</p>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400">
            {onlineUsers.length} {t("chat.onlineUsers")}
          </span>
        </div>
      </CardHeader>

      <div className="flex">
        {/* Chat Messages */}
        <div className="flex-1 p-6">
          <ScrollArea className="h-96 mb-6 pr-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3 group">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={msg.user.avatar} alt={msg.user.displayName} />
                      <AvatarFallback>
                        {msg.user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {msg.user.displayName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(msg.createdAt), "HH:mm", {
                            locale: language === "pt" ? ptBR : enUS,
                          })}
                        </span>
                        {msg.userId !== user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                            onClick={() => handleReportMessage(msg.id)}
                          >
                            <Flag className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-300">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("chat.messagePlaceholder")}
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              maxLength={500}
            />
            <Button 
              type="submit" 
              className="bg-purple-500 hover:bg-purple-600"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Online Users */}
        <div className="w-64 border-l border-gray-700 p-6">
          <h3 className="font-semibold mb-4 text-white">{t("chat.onlineList")}</h3>
          <div className="space-y-3">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                      <AvatarFallback>
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  </div>
                  <span className="text-sm text-white">{user.displayName}</span>
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" />
                      <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  </div>
                  <span className="text-sm text-white">João Silva</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b977?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" />
                      <AvatarFallback>MS</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  </div>
                  <span className="text-sm text-white">Maria Santos</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
