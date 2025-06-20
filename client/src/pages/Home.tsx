import { useState } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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

  const {
    data: articlesPages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<Article[], Error>({
    queryKey: ["/api/articles", { limit, category: categoryFilter }],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`/api/articles?limit=${limit}&offset=${Number(pageParam) * limit}${categoryFilter ? `&category=${categoryFilter}` : ""}`);
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
  });

  const filteredArticles: Article[] = articlesPages?.pages
    ? (articlesPages.pages.flat() as Article[]).filter((article: Article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

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
              {t("home.recentArticles")}
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {t("home.subtitle")}
            </p>
            <Button
              size="lg"
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                document.getElementById('articles')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              Explorar Artigos
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Articles Section */}
      <section id="articles" className="py-8 px-2 sm:px-4">
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
            <div className="grid-articles">
              {articlesPages?.pages.flat().map((article, idx) => (
                <ArticleCard key={article.id} article={article} index={idx} />
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

            {hasNextPage && filteredArticles.length > 0 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  className="bg-transparent border-gray-600 text-white hover:border-purple-500 hover:bg-purple-500/10"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? t("common.loading") : t("home.loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
