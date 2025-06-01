import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Mail, Github, Linkedin, Globe, Heart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import AvatarUploader from "./AvatarUploader";
import { EditProfileDialog } from "./EditProfileDialog";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { UserStats } from "@shared/schema";

export default function ProfileView({ profileUser }: { profileUser?: any } = {}) {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const viewingOwnProfile = !profileUser || (user && profileUser && user.id === profileUser.id);
  const displayedUser = profileUser || user;

  const { data: userStats } = useQuery<UserStats | undefined>({
    queryKey: [`/api/users/${displayedUser?.id}/stats`],
    enabled: !!displayedUser?.id,
  });

  // Conexões
  const { data: connections = [], refetch: refetchConnections } = useQuery({
    queryKey: ["/api/connections/" + displayedUser?.id],
    queryFn: async () => {
      if (!displayedUser?.id) return [];
      const res = await fetch(`/api/connections/${displayedUser.id}`);
      return res.json();
    },
    enabled: !!displayedUser?.id,
  });
  // Convites recebidos (apenas se for o próprio perfil)
  const { data: pendingRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["/api/connections/requests/" + displayedUser?.id],
    queryFn: async () => {
      if (!displayedUser?.id) return [];
      const res = await fetch(`/api/connections/requests/${displayedUser.id}`);
      return res.json();
    },
    enabled: viewingOwnProfile && !!displayedUser?.id,
  });

  // Estado do convite entre user e profileUser
  const { data: myConnection, refetch: refetchMyConnection } = useQuery({
    queryKey: ["/api/connections/status", user?.id, displayedUser?.id],
    queryFn: async () => {
      if (!user?.id || !displayedUser?.id || user.id === displayedUser.id) return null;
      const res = await fetch(`/api/connections/${user.id}`);
      const all = await res.json();
      return all.find((c: any) => (c.userId === user.id && c.targetUserId === displayedUser.id) || (c.userId === displayedUser.id && c.targetUserId === user.id));
    },
    enabled: !!user?.id && !!displayedUser?.id && user.id !== displayedUser.id,
  });

  // Mutations
  const sendRequest = useMutation({
    mutationFn: async () => {
      if (!user || !displayedUser) throw new Error("Usuário não autenticado");
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, targetUserId: displayedUser.id }),
      });
      if (!res.ok) throw new Error("Erro ao enviar convite");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Convite enviado!" });
      refetchMyConnection();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const acceptRequest = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/connections/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Erro ao aceitar convite");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Conexão aceita!" });
      refetchConnections();
      refetchRequests();
      refetchMyConnection();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const rejectRequest = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/connections/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Erro ao recusar convite");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Convite recusado" });
      refetchRequests();
      refetchMyConnection();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (!displayedUser) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Faça login para ver seu perfil.</p>
      </div>
    );
  }

  async function handleAvatarChange(newAvatar: string) {
    if (!displayedUser) return;
    try {
      const res = await fetch(`/api/users/${displayedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: newAvatar }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar avatar");
      const updated = await res.json();
      setUser(updated);
      toast({ title: "Avatar atualizado!" });
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível atualizar o avatar", variant: "destructive" });
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700 overflow-hidden">
      {/* Profile Header */}
      <div className="relative h-32 bg-gradient-to-r from-purple-500 to-purple-600">
        <div className="absolute -bottom-8 left-8">
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-gray-900 bg-gray-900">
              <AvatarImage src={displayedUser.avatar || ""} alt={displayedUser.displayName} />
              <AvatarFallback className="text-2xl">
                {displayedUser.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Dialog open={isAvatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
              <DialogTrigger asChild>
                <button className="absolute bottom-0 right-0 w-6 h-6 bg-purple-500 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-purple-600 transition-colors">
                  <Camera className="w-3 h-3 text-white" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="sr-only">Alterar avatar</DialogTitle>
                </DialogHeader>
                <AvatarUploader currentAvatar={displayedUser.avatar || undefined} displayName={displayedUser.displayName} onAvatarChange={async (avatar) => { await handleAvatarChange(avatar); setAvatarDialogOpen(false); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <CardContent className="pt-12 p-8">
        {/* Profile Info */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-white">{displayedUser.displayName}</h2>
            {displayedUser.isPremium && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500">
                PREMIUM
              </Badge>
            )}
            <EditProfileDialog user={displayedUser} onProfileUpdated={setUser}>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-600 text-white hover:border-purple-500"
              >
                {t("profile.editProfile")}
              </Button>
            </EditProfileDialog>
          </div>
          
          {/* Seção de Assinatura Premium */}
          {viewingOwnProfile && (
            <div className="mb-6 p-4 rounded-xl bg-gray-800 border border-purple-700">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500">Assinatura</Badge>
                {user?.isPremium ? (
                  <span className="text-green-400 font-semibold">Ativa</span>
                ) : (
                  <span className="text-red-400 font-semibold">Inativa</span>
                )}
              </div>
              {user?.isPremium ? (
                <>
                  <p className="text-gray-300 mb-2">Você é assinante premium! Aproveite todos os benefícios exclusivos.</p>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-900/20"
                    onClick={async () => {
                      // Chamar API para cancelar assinatura
                      const res = await fetch("/api/stripe/cancel-subscription", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: user.id })
                      });
                      if (res.ok) {
                        setUser({ ...user, isPremium: false });
                        toast({ title: "Assinatura cancelada", description: "Sua assinatura premium foi cancelada." });
                      } else {
                        toast({ title: "Erro ao cancelar", description: "Tente novamente mais tarde.", variant: "destructive" });
                      }
                    }}
                  >
                    Cancelar Assinatura
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-300 mb-2">Assine para desbloquear conteúdos e benefícios premium.</p>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white font-semibold" asChild>
                    <a href="/premium">Assinar Premium</a>
                  </Button>
                </>
              )}
            </div>
          )}
          
          <p className="text-gray-400 mb-4">
            {displayedUser.bio || "Full Stack Developer apaixonado por React, Node.js e tecnologias emergentes. Sempre aprendendo e compartilhando conhecimento."}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {displayedUser.email}
            </span>
            {displayedUser.github && (
              <span className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                {displayedUser.github}
              </span>
            )}
            {displayedUser.linkedin && (
              <span className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                {displayedUser.linkedin}
              </span>
            )}
            {displayedUser.website && (
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {displayedUser.website}
              </span>
            )}
          </div>
        </div>

        {/* Botão de conexão estilo LinkedIn */}
        {!viewingOwnProfile && user && displayedUser && user.id !== displayedUser.id && (
          <div className="mb-4">
            {myConnection ? (
              myConnection.status === "pending" ? (
                myConnection.userId === user.id ? (
                  <Button disabled variant="outline" className="border-gray-600 text-gray-400">Convite enviado</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => acceptRequest.mutate(myConnection.id)} className="bg-purple-500 hover:bg-purple-600">Aceitar conexão</Button>
                    <Button onClick={() => rejectRequest.mutate(myConnection.id)} variant="outline" className="border-gray-600 text-gray-400">Recusar</Button>
                  </div>
                )
              ) : myConnection.status === "accepted" ? (
                <Button disabled className="bg-green-600">Conectado</Button>
              ) : (
                <Button disabled variant="outline" className="border-gray-600 text-gray-400">Convite recusado</Button>
              )
            ) : (
              <Button onClick={() => sendRequest.mutate()} className="bg-purple-500 hover:bg-purple-600">Conectar</Button>
            )}
          </div>
        )}

        {/* Lista de conexões */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2 text-white">Conexões</h3>
          {connections.length === 0 ? (
            <p className="text-gray-400">Nenhuma conexão ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {connections.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 bg-gray-800 rounded px-3 py-1">
                  <span className="text-sm text-white">{c.userId === displayedUser.id ? `Conectado com #${c.targetUserId}` : `Conectado com #${c.userId}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Convites recebidos (apenas no próprio perfil) */}
        {viewingOwnProfile && pendingRequests.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-white">Convites recebidos</h3>
            <div className="flex flex-col gap-2">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="flex items-center gap-2 bg-gray-800 rounded px-3 py-1">
                  <span className="text-sm text-white">Convite de usuário #{req.userId}</span>
                  <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={() => acceptRequest.mutate(req.id)}>Aceitar</Button>
                  <Button size="sm" variant="outline" className="border-gray-600 text-gray-400" onClick={() => rejectRequest.mutate(req.id)}>Recusar</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {userStats?.articlesLiked ?? 142}
            </div>
            <div className="text-sm text-gray-400">{t("profile.articlesLiked")}</div>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {userStats?.commentsCount ?? 67}
            </div>
            <div className="text-sm text-gray-400">{t("profile.comments")}</div>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {userStats?.activeDays ?? 28}
            </div>
            <div className="text-sm text-gray-400">{t("profile.activeDays")}</div>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {userStats?.totalViews ?? 5200}
            </div>
            <div className="text-sm text-gray-400">{t("profile.views")}</div>
          </motion.div>
        </div>

        {/* Activity Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-white">{t("profile.weeklyActivity")}</h3>
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-end justify-between h-32">
              {(userStats?.weeklyActivity ?? [40, 80, 60, 100, 50, 20, 70]).map((height: number, index: number) => {
                const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
                return (
                  <motion.div 
                    key={index}
                    className="flex flex-col items-center"
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  >
                    <motion.div
                      className="w-8 bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-400"
                      style={{ height: `${height}px` } as React.CSSProperties}
                      whileHover={{ scale: 1.1 }}
                    />
                    <span className="text-xs text-gray-400 mt-2">{days[index]}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">{t("profile.recentActivity")}</h3>
          <div className="space-y-4">
            <motion.div 
              className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-white">Curtiu o artigo "Guia Completo para React Hooks em 2024"</p>
                <span className="text-sm text-gray-400">2 horas atrás</span>
              </div>
            </motion.div>
            <motion.div 
              className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white">Comentou em "Machine Learning com Python: Primeiros Passos"</p>
                <span className="text-sm text-gray-400">5 horas atrás</span>
              </div>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
