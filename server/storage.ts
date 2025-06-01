import { users, articles, comments, likes, chatMessages, userStats, type User, type InsertUser, type Article, type InsertArticle, type Comment, type InsertComment, type InsertChatMessage, type ChatMessage, type UserStats } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;

  // Article operations
  getArticles(limit?: number, offset?: number, category?: string, isPremium?: boolean): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticleStats(id: number, viewCount?: number, likeCount?: number): Promise<void>;

  // Comment operations
  getCommentsByArticle(articleId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Like operations
  getLike(userId: number, articleId: number): Promise<boolean>;
  createLike(userId: number, articleId: number): Promise<void>;
  deleteLike(userId: number, articleId: number): Promise<void>;

  // Chat operations
  getChatMessages(roomId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  reportChatMessage(id: number): Promise<void>;

  // User stats operations
  getUserStats(userId: number): Promise<UserStats | undefined>;
  updateUserStats(userId: number, stats: Partial<UserStats>): Promise<void>;

  // New method
  getUserByStripeSubscriptionId(stripeSubscriptionId: string | undefined): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private articles: Map<number, Article>;
  private comments: Map<number, Comment>;
  private likes: Set<string>;
  private chatMessages: Map<number, ChatMessage>;
  private userStats: Map<number, UserStats>;
  private currentUserId: number;
  private currentArticleId: number;
  private currentCommentId: number;
  private currentChatMessageId: number;

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.comments = new Map();
    this.likes = new Set();
    this.chatMessages = new Map();
    this.userStats = new Map();
    this.currentUserId = 1;
    this.currentArticleId = 1;
    this.currentCommentId = 1;
    this.currentChatMessageId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users
    const user1: User = {
      id: 1,
      email: "joao@codeloom.dev",
      username: "joaosilva",
      password: "hashed_password",
      displayName: "João Silva",
      avatar: null,
      bio: null,
      website: null,
      github: null,
      linkedin: null,
      isPremium: false as boolean | null,
      preferredLanguage: "pt",
      theme: "dark",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      firebaseUid: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user2: User = {
      id: 2,
      email: "maria@codeloom.dev",
      username: "mariasantos",
      password: "hashed_password",
      displayName: "Maria Santos",
      avatar: null,
      bio: null,
      website: null,
      github: null,
      linkedin: null,
      isPremium: true as boolean | null,
      preferredLanguage: "pt",
      theme: "dark",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      firebaseUid: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(1, user1);
    this.users.set(2, user2);
    this.currentUserId = 3;

    // Create sample articles
    const article1: Article = {
      id: 1,
      title: "Guia Completo para React Hooks em 2024",
      slug: "guia-completo-react-hooks-2024",
      content: "React Hooks revolucionaram a forma como escrevemos componentes...",
      excerpt: "Aprenda tudo sobre React Hooks, desde o básico até técnicas avançadas para criar aplicações modernas e eficientes.",
      imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
      category: "JavaScript",
      tags: ["React", "Hooks", "JavaScript", "Frontend"],
      isPremium: false,
      authorId: 1,
      viewCount: 142,
      likeCount: 42,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const article2: Article = {
      id: 2,
      title: "Machine Learning com Python: Primeiros Passos",
      slug: "machine-learning-python-primeiros-passos",
      content: "Machine Learning está transformando o mundo da tecnologia...",
      excerpt: "Descubra como começar sua jornada em Machine Learning usando Python e as principais bibliotecas do mercado.",
      imageUrl: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
      category: "Python",
      tags: ["Python", "Machine Learning", "Data Science", "AI"],
      isPremium: false,
      authorId: 2,
      viewCount: 89,
      likeCount: 67,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.articles.set(1, article1);
    this.articles.set(2, article2);
    this.currentArticleId = 3;

    // Create sample user stats
    const stats1: UserStats = {
      id: 1,
      userId: 1,
      articlesLiked: 142,
      commentsCount: 67,
      activeDays: 28,
      totalViews: 5200,
      weeklyActivity: [40, 80, 60, 100, 50, 20, 70],
      lastActiveAt: new Date(),
    };

    this.userStats.set(1, stats1);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      password: insertUser.password ?? null,
      avatar: insertUser.avatar ?? null,
      bio: insertUser.bio ?? null,
      website: insertUser.website ?? null,
      github: insertUser.github ?? null,
      linkedin: insertUser.linkedin ?? null,
      stripeCustomerId: insertUser.stripeCustomerId ?? null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId ?? null,
      firebaseUid: insertUser.firebaseUid ?? null,
      isPremium: insertUser.isPremium ?? false,
      preferredLanguage: insertUser.preferredLanguage ?? null,
      theme: insertUser.theme ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);

    // Create initial user stats
    const stats: UserStats = {
      id: this.userStats.size + 1,
      userId: id,
      articlesLiked: 0,
      commentsCount: 0,
      activeDays: 1,
      totalViews: 0,
      weeklyActivity: [0, 0, 0, 0, 0, 0, 1],
      lastActiveAt: new Date(),
    };
    this.userStats.set(id, stats);

    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId || user.stripeSubscriptionId,
      isPremium: !!stripeSubscriptionId,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getArticles(limit = 10, offset = 0, category?: string, isPremium?: boolean): Promise<Article[]> {
    let articles = Array.from(this.articles.values());
    
    if (category) {
      articles = articles.filter(article => article.category === category);
    }
    
    if (isPremium !== undefined) {
      articles = articles.filter(article => article.isPremium === isPremium);
    }

    return articles
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
      .slice(offset, offset + limit);
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    return Array.from(this.articles.values()).find(article => article.slug === slug);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = this.currentArticleId++;
    const article: Article = {
      ...insertArticle,
      id,
      imageUrl: insertArticle.imageUrl ?? null,
      tags: insertArticle.tags ?? [],
      isPremium: insertArticle.isPremium ?? false,
      viewCount: 0,
      likeCount: 0,
      authorId: insertArticle.authorId ?? null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.articles.set(id, article);
    return article;
  }

  async updateArticleStats(id: number, viewCount?: number, likeCount?: number): Promise<void> {
    const article = this.articles.get(id);
    if (!article) return;

    const updatedArticle = {
      ...article,
      viewCount: viewCount !== undefined ? viewCount : article.viewCount,
      likeCount: likeCount !== undefined ? likeCount : article.likeCount,
      updatedAt: new Date(),
    };
    this.articles.set(id, updatedArticle);
  }

  async getCommentsByArticle(articleId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.articleId === articleId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const comment: Comment = {
      ...insertComment,
      id,
      articleId: insertComment.articleId ?? null,
      userId: insertComment.userId ?? null,
      parentId: insertComment.parentId ?? null,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getLike(userId: number, articleId: number): Promise<boolean> {
    return this.likes.has(`${userId}-${articleId}`);
  }

  async createLike(userId: number, articleId: number): Promise<void> {
    this.likes.add(`${userId}-${articleId}`);
  }

  async deleteLike(userId: number, articleId: number): Promise<void> {
    this.likes.delete(`${userId}-${articleId}`);
  }

  async getChatMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.roomId === roomId && !message.isReported)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit)
      .reverse();
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      userId: insertMessage.userId ?? null,
      roomId: insertMessage.roomId ?? null,
      isReported: false,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async reportChatMessage(id: number): Promise<void> {
    const message = this.chatMessages.get(id);
    if (message) {
      this.chatMessages.set(id, { ...message, isReported: true });
    }
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return this.userStats.get(userId);
  }

  async updateUserStats(userId: number, stats: Partial<UserStats>): Promise<void> {
    const currentStats = this.userStats.get(userId);
    if (currentStats) {
      this.userStats.set(userId, { ...currentStats, ...stats });
    }
  }

  async getUserByStripeSubscriptionId(stripeSubscriptionId: string | undefined): Promise<User | undefined> {
    if (typeof stripeSubscriptionId !== 'string') return undefined;
    return Array.from(this.users.values()).find(user => user.stripeSubscriptionId === stripeSubscriptionId);
  }
}

export const storage = new MemStorage();
