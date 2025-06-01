import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Flag } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { getChatWebSocketUrl } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  const [status, setStatus] = useState(user?.status || "online");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);

  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ["/api/chat/messages"],
    enabled: !!user,
  });

  // Busca todas as conexões do usuário logado
  const { data: myConnections = [], refetch: refetchConnections } = useQuery({
    queryKey: ["/api/connections/" + user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/connections/${user.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });
  // Busca convites recebidos
  const { data: myPendingRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["/api/connections/requests/" + user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/connections/requests/${user.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Mutations para amizade
  const sendRequest = useMutation({
    mutationFn: async (targetUserId: number) => {
      if (!user) throw new Error("Usuário não autenticado");
      const token = localStorage.getItem("token");
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, targetUserId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Convite enviado!" });
      refetchConnections();
      refetchRequests();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const acceptRequest = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/connections/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Conexão aceita!" });
      refetchConnections();
      refetchRequests();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const rejectRequest = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/connections/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Convite recusado" });
      refetchRequests();
      refetchConnections();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Função utilitária para status de conexão
  function getConnectionStatus(onlineUser: any) {
    if (!user || user.id === onlineUser.id) return null;
    // Verifica se já é amigo
    const isConnected = myConnections.some((c: any) =>
      (c.userId === user.id && c.targetUserId === onlineUser.id || c.userId === onlineUser.id && c.targetUserId === user.id) && c.status === "accepted"
    );
    if (isConnected) return { status: "connected" };
    // Verifica se convite foi enviado por mim
    const sent = myConnections.find((c: any) => c.userId === user.id && c.targetUserId === onlineUser.id && c.status === "pending");
    if (sent) return { status: "sent" };
    // Verifica se convite foi recebido por mim
    const received = myPendingRequests.find((c: any) => c.userId === onlineUser.id && c.targetUserId === user.id && c.status === "pending");
    if (received) return { status: "received", id: received.id };
    // Não há relação
    return { status: "none" };
  }

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

  useEffect(() => {
    if (!user) return;
    setStatus(user.status || "online");
  }, [user]);

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

  const handleStatusChange = async (value: string) => {
    setStatus(value);
    if (user) {
      await fetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: value }),
      });
    }
  };

  // Buscar todos os usuários apenas uma vez ao focar no campo de busca
  const fetchAllUsers = async () => {
    if (usersFetched || isLoadingUsers) return;
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setAllUsers(data.users || []);
      setUsersFetched(true);
    } catch (e) {
      toast({ title: "Erro ao buscar usuários", description: String(e), variant: "destructive" });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Filtrar usuários por email ou username
  const filteredUsers = searchQuery.trim().length > 0
    ? allUsers.filter((u) =>
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
      ).filter((u) => u.email !== user?.email) // não mostrar o próprio usuário
    : [];

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
          <h3 className="font-semibold mb-4 text-white flex items-center justify-between">
            {t("chat.onlineList")}
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-28 h-8 text-xs bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">🟢 Online</SelectItem>
                <SelectItem value="busy">🔴 Ocupado</SelectItem>
                <SelectItem value="away">🟡 Ausente</SelectItem>
                <SelectItem value="offline">⚫ Offline</SelectItem>
              </SelectContent>
            </Select>
          </h3>
          {/* Busca de usuários */}
          <div className="mb-4">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={fetchAllUsers}
              placeholder="Buscar por email ou username..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none mb-2"
              maxLength={100}
            />
            {searchQuery.trim().length > 0 && (
              <div className="max-h-56 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg p-2 mt-1">
                {isLoadingUsers ? (
                  <div className="text-gray-400 text-sm p-2">Carregando usuários...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-gray-400 text-sm p-2">Nenhum usuário encontrado.</div>
                ) : (
                  filteredUsers.map((u) => {
                    const conn = getConnectionStatus(u);
                    return (
                      <div key={u.email} className="flex items-center gap-2 py-1 border-b border-gray-800 last:border-b-0">
                        <span className="text-xs text-white font-mono">{u.username}</span>
                        <span className="text-xs text-gray-400">{u.email}</span>
                        {/* Botão de amizade */}
                        {conn && conn.status === "connected" && (
                          <Button disabled size="sm" className="bg-green-600 ml-2">Conectado</Button>
                        )}
                        {conn && conn.status === "sent" && (
                          <Button disabled size="sm" variant="outline" className="border-gray-600 text-gray-400 ml-2">Convite enviado</Button>
                        )}
                        {conn && conn.status === "received" && (
                          <div className="flex gap-1 ml-2">
                            <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={() => acceptRequest.mutate(conn.id)}>Aceitar</Button>
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-400" onClick={() => rejectRequest.mutate(conn.id)}>Recusar</Button>
                          </div>
                        )}
                        {conn && conn.status === "none" && (
                          <Button size="sm" className="bg-purple-500 hover:bg-purple-600 ml-2" onClick={() => sendRequest.mutate(u.id)}>Adicionar amigo</Button>
                        )}
                        {!conn && null}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <div className="space-y-3">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((onlineUser) => (
                <div key={onlineUser.id} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={onlineUser.avatar} alt={onlineUser.displayName} />
                      <AvatarFallback>
                        {onlineUser.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${
                      onlineUser.status === "online" ? "bg-green-500" : onlineUser.status === "busy" ? "bg-red-500" : onlineUser.status === "away" ? "bg-yellow-400" : "bg-gray-500"
                    }`}></div>
                  </div>
                  <span className="text-sm text-white">{onlineUser.displayName}</span>
                  <span className="text-xs text-gray-400 capitalize">{onlineUser.status}</span>
                  {/* Botão de amizade */}
                  {(() => {
                    const conn = getConnectionStatus(onlineUser);
                    if (!conn) return null;
                    if (conn.status === "connected") {
                      return <Button disabled size="sm" className="bg-green-600 ml-2">Conectado</Button>;
                    }
                    if (conn.status === "sent") {
                      return <Button disabled size="sm" variant="outline" className="border-gray-600 text-gray-400 ml-2">Convite enviado</Button>;
                    }
                    if (conn.status === "received") {
                      return (
                        <div className="flex gap-1 ml-2">
                          <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={() => acceptRequest.mutate(conn.id)}>Aceitar</Button>
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-400" onClick={() => rejectRequest.mutate(conn.id)}>Recusar</Button>
                        </div>
                      );
                    }
                    if (conn.status === "none") {
                      return <Button size="sm" className="bg-purple-500 hover:bg-purple-600 ml-2" onClick={() => sendRequest.mutate(onlineUser.id)}>Adicionar amigo</Button>;
                    }
                    return null;
                  })()}
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm p-2">Nenhum usuário online.</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
