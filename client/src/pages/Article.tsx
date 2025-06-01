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
import { loadStripe } from "@stripe/stripe-js";

type CommentWithUser = CommentType & { user?: { avatar?: string; displayName?: string } };

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

export default function Article() {
  const params = useParams();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

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

  useEffect(() => {
    async function checkPurchase() {
      if (user && article?.isPremium && article.id) {
        const res = await fetch(`/api/users/${user.id}/purchases`);
        const purchases = await res.json();
        setHasPurchased(purchases.some((p: any) => p.articleId === article.id));
      }
    }
    checkPurchase();
  }, [user, article]);

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

  async function handleBuyArticle() {
    if (!article) return;
    setLoadingPurchase(true);
    try {
      const res = await fetch("/api/purchase-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ articleId: article.id }),
      });
      const data = await res.json();
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } finally {
      setLoadingPurchase(false);
    }
  }

  async function handleStripePayment() {
    const stripe = await stripePromise;
    if (!stripe || !clientSecret) return;
    const { error } = await stripe.confirmCardPayment(clientSecret);
    if (!error) {
      setHasPurchased(true);
      setShowPayment(false);
    }
  }

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

  if (article.isPremium && (!user || (!user.isPremium && !hasPurchased))) {
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
          <div className="my-6">
            <Button onClick={handleBuyArticle} disabled={loadingPurchase} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-8 py-3 text-lg ml-4">
              {loadingPurchase ? "Processando..." : "Comprar este artigo (R$9,90)"}
            </Button>
          </div>
          {showPayment && clientSecret && (
            <div className="mt-8">
              <Button onClick={handleStripePayment} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 text-lg">
                Finalizar Pagamento
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <article className="pt-16 px-2 sm:px-4 max-w-4xl mx-auto py-12">
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
              srcSet={article.imageUrl ? `${article.imageUrl}.webp 1x, ${article.imageUrl} 2x` : undefined}
              alt={article.title}
              loading="lazy"
              role="img"
              aria-label={article.title}
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

        {/* Busca customizada (Algolia) - Placeholder */}
        <section aria-label="Busca de artigos" className="my-8">
          {/* Integrar Algolia aqui */}
          <input type="search" placeholder="Buscar artigos..." className="w-full p-2 rounded bg-gray-800 text-white" aria-label="Buscar artigos" />
        </section>

        {/* Comentários (Disqus/API custom) - Placeholder */}
        <section aria-label="Comentários" className="my-8">
          {/* Integrar Disqus ou API custom aqui */}
          <div className="bg-gray-900 p-4 rounded-lg text-gray-400">Comentários em breve...</div>
        </section>
      </article>

      <Footer />
    </div>
  );
}
