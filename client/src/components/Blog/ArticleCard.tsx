import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Clock } from "lucide-react";
import { Article } from "@shared/schema";
import { motion } from "framer-motion";

interface ArticleCardProps {
  article: Article;
  author?: {
    displayName: string;
    avatar?: string;
  };
  index?: number;
}

export default function ArticleCard({ article, author, index = 0 }: ArticleCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      JavaScript: "bg-yellow-500/20 text-yellow-400",
      Python: "bg-green-500/20 text-green-400",
      React: "bg-blue-500/20 text-blue-400",
      DevOps: "bg-purple-500/20 text-purple-400",
      "Machine Learning": "bg-pink-500/20 text-pink-400",
    };
    return colors[category] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Card className="bg-gray-900 border-gray-700 overflow-hidden hover:border-purple-500 transition-all duration-300">
        <Link href={`/article/${article.slug}`}>
          <div className="relative">
            <img
              src={article.imageUrl || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"}
              srcSet={article.imageUrl ? `${article.imageUrl}.webp 1x, ${article.imageUrl} 2x` : undefined}
              alt={article.title}
              loading="lazy"
              role="img"
              aria-label={article.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {article.isPremium && (
              <Badge className="absolute top-2 right-2 bg-purple-500/20 text-purple-400 border-purple-500">
                PREMIUM
              </Badge>
            )}
          </div>
        </Link>
        
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={getCategoryColor(article.category)}>
              {article.category}
            </Badge>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Clock className="w-3 h-3" />
              <span>5 min de leitura</span>
            </div>
          </div>
          
          <Link href={`/article/${article.slug}`}>
            <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors cursor-pointer">
              {article.title}
            </h3>
          </Link>
          
          <p className="text-gray-400 mb-4 line-clamp-3">
            {article.excerpt}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={author?.avatar} alt={author?.displayName} />
                <AvatarFallback>
                  {author?.displayName?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-300">
                {author?.displayName || "Autor"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{article.likeCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
