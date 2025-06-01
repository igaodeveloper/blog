import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Heart, MessageCircle, Share2, ArrowLeft, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import type { Article, Comment as CommentType } from "@shared/schema";

type CommentWithUser = CommentType & { user?: { avatar?: string; displayName?: string } };

export default function Article() {
  const params = useParams();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  const { data: article, isLoading } = useQuery<Article | undefined>({
    queryKey: [`/api/articles/slug/${params.slug}`],
    enabled: !!params.slug,
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<CommentWithUser[] | undefined>({
    queryKey: [`/api/articles/${article?.id}/comments`],
    enabled: !!article?.id,
  });

  const { data: likeStatus } = useQuery<{ isLiked: boolean } | undefined>({
    queryKey: [`/api/articles/${article?.id}/like/${user?.id}`],
    enabled: !!article?.id && !!user?.id,
  });

  useEffect(() => {
    if (likeStatus) setIsLiked(likeStatus.isLiked);
  }, [likeStatus]);

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/articles/${article?.id}/like`, { userId: user?.id }),
    onSuccess: () => {
      setIsLiked(!isLiked);
      if (article?.id && user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/articles/${article.id}/like/${user.id}`] });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/articles/slug/${params.slug}`] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/articles/${article?.id}/comments`, {
        content,
        userId: user?.id,
      }),
    onSuccess: () => {
      setComment("");
      if (article?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/articles/${article.id}/comments`] });
      }
      toast({
        title: t("common.success"),
        description: "Comentário adicionado com sucesso!",
      });
    },
  });

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para curtir artigos.",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para comentar.",
        variant: "destructive",
      });
      return;
    }
    if (!comment.trim()) return;
    commentMutation.mutate(comment);
  };

  const handleShare = async () => {
    if (!article) return;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.excerpt,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: t("common.success"),
        description: "Link copiado para a área de transferência!",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-16 px-4 max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-gray-700 h-8 rounded mb-4"></div>
            <div className="bg-gray-700 h-64 rounded mb-6"></div>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-gray-700 h-4 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-16 px-4 max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <Link href="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (article.isPremium && (!user || !user.isPremium)) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-16 px-4 max-w-4xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Conteúdo Premium</h1>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Este artigo é exclusivo para assinantes premium. Faça upgrade para acessar todo o conteúdo!
          </p>
          <Link href="/premium">
            <Button className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-8 py-3 text-lg">
              Assinar Premium
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <article className="pt-16 px-4 max-w-4xl mx-auto py-12">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos artigos
          </Button>
        </Link>

        {/* Article Header */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500">
              {article.category}
            </Badge>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Clock className="w-3 h-3" />
              <span>8 {t("home.readTime")}</span>
            </div>
            {article.isPremium && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">
                PREMIUM
              </Badge>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {article.title}
          </h1>

          <p className="text-xl text-gray-300 mb-6 leading-relaxed">
            {article.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48" />
                <AvatarFallback>
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-white">Autor do Artigo</div>
                <div className="text-sm text-gray-400">
                  {format(new Date(article.publishedAt!), "dd 'de' MMMM, yyyy", {
                    locale: language === "pt" ? ptBR : enUS,
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                className={`border-gray-600 ${
                  isLiked ? "bg-red-500/20 text-red-400 border-red-500" : "text-gray-300"
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {article.likeCount}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-gray-600 text-gray-300 hover:border-purple-500"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Article Image */}
        {article.imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover rounded-xl"
            />
          </motion.div>
        )}

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="prose prose-invert prose-purple max-w-none mb-12"
        >
          <div className="text-gray-300 leading-relaxed space-y-6">
            {article.content.split('\n\n').map((paragraph: string, index: number) => (
              <p key={index} className="text-lg">
                {paragraph}
              </p>
            ))}
          </div>
        </motion.div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-12"
          >
            <h3 className="text-lg font-semibold mb-4 text-white">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:border-purple-500"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Comments Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="border-t border-gray-700 pt-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Comentários ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="flex gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar || ""} alt={user.displayName} />
                  <AvatarFallback>
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Adicione um comentário..."
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="submit"
                      disabled={!comment.trim() || commentMutation.isPending}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      {commentMutation.isPending ? "Enviando..." : "Comentar"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-800 rounded-lg text-center">
              <p className="text-gray-400 mb-4">
                Faça login para participar da discussão
              </p>
              <Link href="/login">
                <Button className="bg-purple-500 hover:bg-purple-600">
                  Fazer Login
                </Button>
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex gap-4 p-4 bg-gray-800 rounded-lg"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={comment.user?.avatar || ""} alt={comment.user?.displayName || "Usuário"} />
                  <AvatarFallback>
                    {comment.user?.displayName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">
                      {comment.user?.displayName || "Usuário"}
                    </span>
                    <span className="text-sm text-gray-400">
                      {comment.createdAt ? format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm") : ""}
                    </span>
                  </div>
                  <p className="text-gray-300">{comment.content}</p>
                </div>
              </motion.div>
            ))}

            {comments.length === 0 && !isLoadingComments && (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  Seja o primeiro a comentar neste artigo!
                </p>
              </div>
            )}
          </div>
        </motion.section>
      </article>

      <Footer />
    </div>
  );
}
