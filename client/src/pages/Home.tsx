import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import ArticleCard from "@/components/Blog/ArticleCard";
import SearchFilters from "@/components/Blog/SearchFilters";
import ParticleBackground from "@/components/Animations/ParticleBackground";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Article } from "@shared/schema";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(0);
  const limit = 9;
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["/api/articles", { limit, offset: page * limit, category: categoryFilter }],
  });

  const filteredArticles = Array.isArray(articles)
    ? articles.filter((article: Article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    async function fetchFeed() {
      setLoading(true);
      const [postsRes, videosRes, articlesRes] = await Promise.all([
        fetch("/api/posts").then(r => r.json()),
        fetch("/api/videos").then(r => r.json()),
        fetch("/api/articles").then(r => r.json()),
      ]);
      const all = [
        ...postsRes.map((p: any) => ({ ...p, _type: "post" })),
        ...videosRes.map((v: any) => ({ ...v, _type: "video" })),
        ...articlesRes.map((a: any) => ({ ...a, _type: "article" })),
      ];
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFeed(all);
      setLoading(false);
    }
    fetchFeed();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParticleBackground />
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="mb-8"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center"
                style={{
                  boxShadow: "0 0 30px rgba(138, 43, 226, 0.6)",
                }}
              >
                <span className="text-4xl text-white">&lt;/&gt;</span>
              </div>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t("welcome.title")}
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {t("welcome.subtitle")}
            </p>
            <Button
              size="lg"
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
              style={{
                boxShadow: "0 0 20px rgba(138, 43, 226, 0.4)",
              }}
              onClick={() => {
                document.getElementById('articles')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              {t("welcome.startButton")}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Articles Section */}
      <section id="articles" className="py-16 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-white">
            {t("home.recentArticles")}
          </h2>
          <p className="text-gray-400">{t("home.subtitle")}</p>
        </motion.div>

        <SearchFilters
          onSearch={setSearchQuery}
          onCategoryFilter={setCategoryFilter}
          onSortChange={setSortBy}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-6 animate-pulse">
                <div className="bg-gray-700 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-700 h-4 rounded mb-2"></div>
                <div className="bg-gray-700 h-4 rounded w-3/4 mb-4"></div>
                <div className="bg-gray-700 h-3 rounded mb-1"></div>
                <div className="bg-gray-700 h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredArticles.map((article: Article, index: number) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  author={{
                    displayName: "Autor",
                    avatar: `https://images.unsplash.com/photo-${1507003211169 + index}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`
                  }}
                  index={index}
                />
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  Nenhum artigo encontrado
                </h3>
                <p className="text-gray-400">
                  Tente ajustar seus filtros de busca ou explorar outras categorias.
                </p>
              </motion.div>
            )}

            {filteredArticles.length > 0 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  className="bg-transparent border-gray-600 text-white hover:border-purple-500 hover:bg-purple-500/10"
                  onClick={() => setPage(page + 1)}
                >
                  {t("home.loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-white">
            {t("home.feed")}
          </h2>
          <p className="text-gray-400">{t("home.feedSubtitle")}</p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          <Button onClick={() => navigate("/create-article")} className="bg-purple-500">Novo Artigo</Button>
          <Button onClick={() => navigate("/create-video")} className="bg-purple-500">Novo Vídeo</Button>
          <Button onClick={() => navigate("/create-post")} className="bg-purple-500">Nova Postagem</Button>
        </div>

        {loading ? (
          <div>Carregando feed...</div>
        ) : (
          <div className="space-y-6">
            {feed.map(item => (
              <div key={item._type + item.id} className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                    {item.authorId ? <span>{item.authorId}</span> : <span>?</span>}
                  </div>
                  <div>
                    <div className="font-bold capitalize">{item._type}</div>
                    <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                {item._type === "post" && (
                  <div>
                    <div className="mb-2 whitespace-pre-line">{item.content}</div>
                    {item.imageUrl && <img src={item.imageUrl} alt="imagem" className="rounded mb-2 max-h-64" />}
                    {item.videoUrl && <video src={item.videoUrl} controls className="rounded mb-2 max-h-64 w-full" />}
                  </div>
                )}
                {item._type === "video" && (
                  <div>
                    <div className="font-bold text-lg mb-1">{item.title}</div>
                    <div className="mb-2 text-gray-300">{item.description}</div>
                    {item.thumbnail && <img src={item.thumbnail} alt="thumb" className="rounded mb-2 max-h-64" />}
                    {item.url && (
                      <div className="mb-2">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">Assistir vídeo</a>
                      </div>
                    )}
                  </div>
                )}
                {item._type === "article" && (
                  <div>
                    <div className="font-bold text-lg mb-1">{item.title}</div>
                    <div className="mb-2 text-gray-300">{item.excerpt}</div>
                    {item.imageUrl && <img src={item.imageUrl} alt="imagem" className="rounded mb-2 max-h-64" />}
                    <Button onClick={() => navigate(`/article/${item.id}`)} size="sm" className="bg-purple-700">Ler artigo</Button>
                  </div>
                )}
                <div className="flex gap-4 mt-4">
                  <Button size="sm" variant="outline">Curtir</Button>
                  <Button size="sm" variant="outline">Comentar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
