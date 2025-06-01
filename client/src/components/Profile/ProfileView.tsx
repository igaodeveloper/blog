import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { Camera, Mail, Github, Linkedin, Globe, Heart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import AvatarUploader from "./AvatarUploader";
import { EditProfileDialog } from "./EditProfileDialog";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { UserStats } from "@shared/schema";

export default function ProfileView() {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: userStats } = useQuery<UserStats | undefined>({
    queryKey: [`/api/users/${user?.id}/stats`],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Faça login para ver seu perfil.</p>
      </div>
    );
  }

  async function handleAvatarChange(newAvatar: string) {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
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
              <AvatarImage src={user.avatar || ""} alt={user.displayName} />
              <AvatarFallback className="text-2xl">
                {user.displayName.charAt(0).toUpperCase()}
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
                <AvatarUploader currentAvatar={user.avatar || undefined} displayName={user.displayName} onAvatarChange={async (avatar) => { await handleAvatarChange(avatar); setAvatarDialogOpen(false); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <CardContent className="pt-12 p-8">
        {/* Profile Info */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
            {user.isPremium && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500">
                PREMIUM
              </Badge>
            )}
            <EditProfileDialog user={user} onProfileUpdated={setUser}>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-600 text-white hover:border-purple-500"
              >
                {t("profile.editProfile")}
              </Button>
            </EditProfileDialog>
          </div>
          
          <p className="text-gray-400 mb-4">
            {user.bio || "Full Stack Developer apaixonado por React, Node.js e tecnologias emergentes. Sempre aprendendo e compartilhando conhecimento."}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </span>
            {user.github && (
              <span className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                {user.github}
              </span>
            )}
            {user.linkedin && (
              <span className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                {user.linkedin}
              </span>
            )}
            {user.website && (
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {user.website}
              </span>
            )}
          </div>
        </div>

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
