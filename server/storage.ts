import { users, articles, comments, likes, chatMessages, userStats, type User, type InsertUser, type Article, type InsertArticle, type Comment, type InsertComment, type InsertChatMessage, type ChatMessage, type UserStats } from "@shared/schema";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import OpenAI from "openai";

initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = getFirestore();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  // New method for videos and posts
  createVideo(insertVideo: any): Promise<Article>;
  getVideos(): Promise<Article[]>;
  getVideo(id: number): Promise<Article | undefined>;
  createPost(insertPost: any): Promise<Article>;
  getPosts(): Promise<Article[]>;
  getPost(id: number): Promise<Article | undefined>;

  // --- CONEXÕES (amizades estilo LinkedIn) ---
  createConnectionRequest(userId: number, targetUserId: number): Promise<any>;
  acceptConnectionRequest(id: string): Promise<any>;
  rejectConnectionRequest(id: string): Promise<any>;
  getUserConnections(userId: number): Promise<any[]>;
  getUserPendingRequests(userId: number): Promise<any[]>;
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
  private videos: Map<number, Article> | undefined;
  private posts: Map<number, Article> | undefined;

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
      status: "online",
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
      status: "online",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(1, user1);
    this.users.set(2, user2);
    this.currentUserId = 3;

    // Função utilitária para gerar artigos fake
    function gerarArtigosFake(qtd: number, autores: number[]): Article[] {
      const categorias = ["JavaScript", "Python", "DevOps", "Cloud", "Mobile", "AI", "Backend", "Frontend", "Data Science", "UI/UX"];
      const titulos = [
        "Como dominar ",
        "Guia prático de ",
        "Tendências em ",
        "O futuro de ",
        "Erros comuns em ",
        "Dicas avançadas de ",
        "Introdução a ",
        "Por que aprender ",
        "Desmistificando ",
        "Boas práticas em "
      ];
      const temas = [
        "React", "Node.js", "TypeScript", "Kubernetes", "Docker", "Flutter", "Next.js", "GraphQL", "AWS", "Firebase", "Machine Learning", "CSS", "HTML", "PostgreSQL", "MongoDB"
      ];
      const imagens = [
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
      ];
      const artigos: Article[] = [];
      for (let i = 0; i < qtd; i++) {
        const tema = temas[Math.floor(Math.random() * temas.length)];
        const categoria = categorias[Math.floor(Math.random() * categorias.length)];
        const tituloBase = titulos[Math.floor(Math.random() * titulos.length)];
        const titulo = `${tituloBase}${tema}`;
        const slug = `${tituloBase.replace(/\s+/g, "-").toLowerCase()}${tema.toLowerCase()}-${i+3}`.replace(/[^a-z0-9\-]/g, "");
        const imageUrl = imagens[Math.floor(Math.random() * imagens.length)];
        const autor = autores[i % autores.length];
        artigos.push({
          id: i + 3,
          title: titulo,
          slug: slug,
          content: `Conteúdo completo sobre ${tema} e ${categoria}. Dicas, exemplos e melhores práticas para 2024.`,
          excerpt: `Resumo do artigo sobre ${tema} (${categoria}). Aprenda os principais conceitos e técnicas modernas.`,
          imageUrl,
          category: categoria,
          tags: [tema, categoria],
          isPremium: Math.random() < 0.2, // 20% premium
          authorId: autor,
          viewCount: Math.floor(Math.random() * 200),
          likeCount: Math.floor(Math.random() * 100),
          publishedAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      return artigos;
    }

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

    // Gerar e adicionar 30 artigos fake
    const artigosFake = gerarArtigosFake(30, [1, 2]);
    for (const artigo of artigosFake) {
      this.articles.set(artigo.id, artigo);
      this.currentArticleId = artigo.id + 1;
    }

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
      status: "online",
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
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
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

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  async createVideo(insertVideo: any): Promise<Article> {
    const id = this.currentArticleId++;
    const video = { ...insertVideo, id, createdAt: new Date(), updatedAt: new Date() };
    this.videos = this.videos || new Map();
    this.videos.set(id, video);
    return video;
  }

  async getVideos(): Promise<Article[]> {
    this.videos = this.videos || new Map();
    return Array.from(this.videos.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }

  async getVideo(id: number): Promise<Article | undefined> {
    this.videos = this.videos || new Map();
    return this.videos.get(id);
  }

  async createPost(insertPost: any): Promise<Article> {
    const id = this.currentArticleId++;
    const post = { ...insertPost, id, createdAt: new Date(), updatedAt: new Date() };
    this.posts = this.posts || new Map();
    this.posts.set(id, post);
    return post;
  }

  async getPosts(): Promise<Article[]> {
    this.posts = this.posts || new Map();
    return Array.from(this.posts.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }

  async getPost(id: number): Promise<Article | undefined> {
    this.posts = this.posts || new Map();
    return this.posts.get(id);
  }

  // --- CONEXÕES (amizades estilo LinkedIn) ---
  async createConnectionRequest(userId: number, targetUserId: number): Promise<any> {
    // Em memória: não implementado
    return { id: `${userId}-${targetUserId}`, userId, targetUserId, status: "pending", createdAt: new Date() };
  }

  async acceptConnectionRequest(id: string): Promise<any> {
    // Em memória: não implementado
    return { success: true };
  }

  async rejectConnectionRequest(id: string): Promise<any> {
    // Em memória: não implementado
    return { success: true };
  }

  async getUserConnections(userId: number): Promise<any[]> {
    // Em memória: não implementado
    return [];
  }

  async getUserPendingRequests(userId: number): Promise<any[]> {
    // Em memória: não implementado
    return [];
  }
}

export const storage = new MemStorage();

export class FirestoreStorage implements IStorage {
  private usersRef = db.collection("users");
  private articlesRef = db.collection("articles");
  private commentsRef = db.collection("comments");
  private likesRef = db.collection("likes");
  private chatMessagesRef = db.collection("chat_messages");
  private userStatsRef = db.collection("user_stats");
  private videosRef = db.collection("videos");
  private postsRef = db.collection("posts");
  private connectionsRef = db.collection("connections");

  // Helper para converter doc para objeto com id numérico e datas
  private docToObj<T>(doc: any): T {
    const data = doc.data();
    // Converte id para number se possível
    let id: number | string = doc.id;
    if (!isNaN(Number(id))) id = Number(id);
    // Converte datas string/timestamp para Date
    const convertDates = (obj: any) => {
      for (const key in obj) {
        if (obj[key] && (obj[key]._seconds || obj[key] instanceof Date)) {
          obj[key] = obj[key] instanceof Date ? obj[key] : new Date(obj[key]._seconds * 1000);
        }
      }
      return obj;
    };
    return convertDates({ ...data, id }) as T;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const snapshot = await this.usersRef.doc(String(id)).get();
    return snapshot.exists ? this.docToObj<User>(snapshot) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await this.usersRef.where("email", "==", email).get();
    if (snapshot.empty) return undefined;
    return this.docToObj<User>(snapshot.docs[0]);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const snapshot = await this.usersRef.where("firebaseUid", "==", firebaseUid).get();
    if (snapshot.empty) return undefined;
    return this.docToObj<User>(snapshot.docs[0]);
  }

  async createUser(user: InsertUser): Promise<User> {
    const docRef = await this.usersRef.add({ ...user, createdAt: new Date(), updatedAt: new Date() });
    const doc = await docRef.get();
    return this.docToObj<User>(doc);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const doc = await this.usersRef.doc(id.toString()).get();
    if (!doc.exists) throw new Error("User not found");
    await this.usersRef.doc(id.toString()).update({ ...updates, updatedAt: new Date() });
    const updated = await this.usersRef.doc(id.toString()).get();
    return this.docToObj<User>(updated);
  }

  async updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    return this.updateUser(id, { stripeCustomerId, stripeSubscriptionId, isPremium: !!stripeSubscriptionId });
  }

  // Article operations
  async getArticles(limit = 10, offset = 0, category?: string, isPremium?: boolean): Promise<Article[]> {
    let query: any = this.articlesRef;
    if (category) query = query.where("category", "==", category);
    if (isPremium !== undefined) query = query.where("isPremium", "==", isPremium);
    const snapshot = await query.orderBy("publishedAt", "desc").offset(offset).limit(limit).get();
    return snapshot.docs.map((doc: any) => this.docToObj<Article>(doc));
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const doc = await this.articlesRef.doc(String(id)).get();
    return doc.exists ? this.docToObj<Article>(doc) : undefined;
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const snapshot = await this.articlesRef.where("slug", "==", slug).get();
    if (snapshot.empty) return undefined;
    return this.docToObj<Article>(snapshot.docs[0]);
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const docRef = await this.articlesRef.add({ ...article, createdAt: new Date(), updatedAt: new Date(), publishedAt: new Date(), viewCount: 0, likeCount: 0 });
    const doc = await docRef.get();
    return this.docToObj<Article>(doc);
  }

  async updateArticleStats(id: number, viewCount?: number, likeCount?: number): Promise<void> {
    const ref = this.articlesRef.doc(String(id));
    const updates: any = { updatedAt: new Date() };
    if (viewCount !== undefined) updates.viewCount = viewCount;
    if (likeCount !== undefined) updates.likeCount = likeCount;
    await ref.update(updates);
  }

  // Comment operations
  async getCommentsByArticle(articleId: number): Promise<Comment[]> {
    const snapshot = await this.commentsRef.where("articleId", "==", articleId).orderBy("createdAt").get();
    return snapshot.docs.map(doc => this.docToObj<Comment>(doc));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const docRef = await this.commentsRef.add({ ...comment, createdAt: new Date() });
    const doc = await docRef.get();
    return this.docToObj<Comment>(doc);
  }

  // Like operations
  async getLike(userId: number, articleId: number): Promise<boolean> {
    const snapshot = await this.likesRef.where("userId", "==", userId).where("articleId", "==", articleId).get();
    return !snapshot.empty;
  }

  async createLike(userId: number, articleId: number): Promise<void> {
    await this.likesRef.add({ userId, articleId, createdAt: new Date() });
  }

  async deleteLike(userId: number, articleId: number): Promise<void> {
    const snapshot = await this.likesRef.where("userId", "==", userId).where("articleId", "==", articleId).get();
    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
  }

  // Chat operations
  async getChatMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const snapshot = await this.chatMessagesRef.where("roomId", "==", roomId).where("isReported", "==", false).orderBy("createdAt", "desc").limit(limit).get();
    return snapshot.docs.map(doc => this.docToObj<ChatMessage>(doc)).reverse();
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const docRef = await this.chatMessagesRef.add({ ...message, createdAt: new Date(), isReported: false });
    const doc = await docRef.get();
    return this.docToObj<ChatMessage>(doc);
  }

  async reportChatMessage(id: number): Promise<void> {
    const ref = this.chatMessagesRef.doc(String(id));
    await ref.update({ isReported: true });
  }

  // User stats operations
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const snapshot = await this.userStatsRef.where("userId", "==", userId).get();
    if (snapshot.empty) return undefined;
    return this.docToObj<UserStats>(snapshot.docs[0]);
  }

  async updateUserStats(userId: number, stats: Partial<UserStats>): Promise<void> {
    const snapshot = await this.userStatsRef.where("userId", "==", userId).get();
    if (snapshot.empty) return;
    await snapshot.docs[0].ref.update(stats);
  }

  async getUserByStripeSubscriptionId(stripeSubscriptionId: string | undefined): Promise<User | undefined> {
    if (!stripeSubscriptionId) return undefined;
    const snapshot = await this.usersRef.where("stripeSubscriptionId", "==", stripeSubscriptionId).get();
    if (snapshot.empty) return undefined;
    return this.docToObj<User>(snapshot.docs[0]);
  }

  // New method for videos and posts
  async createVideo(video: any): Promise<Article> {
    const docRef = await this.videosRef.add({ ...video, createdAt: new Date(), updatedAt: new Date() });
    const doc = await docRef.get();
    return this.docToObj(doc);
  }

  async getVideos(): Promise<Article[]> {
    const snapshot = await this.videosRef.orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => this.docToObj(doc));
  }

  async getVideo(id: number): Promise<Article | undefined> {
    const doc = await this.videosRef.doc(String(id)).get();
    return doc.exists ? this.docToObj(doc) : undefined;
  }

  async createPost(post: any): Promise<Article> {
    const docRef = await this.postsRef.add({ ...post, createdAt: new Date(), updatedAt: new Date() });
    const doc = await docRef.get();
    return this.docToObj(doc);
  }

  async getPosts(): Promise<Article[]> {
    const snapshot = await this.postsRef.orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => this.docToObj(doc));
  }

  async getPost(id: number): Promise<Article | undefined> {
    const doc = await this.postsRef.doc(String(id)).get();
    return doc.exists ? this.docToObj(doc) : undefined;
  }

  // --- CONEXÕES (amizades estilo LinkedIn) ---
  async createConnectionRequest(userId: number, targetUserId: number) {
    // Cria convite se não existir
    const existing = await this.connectionsRef
      .where("userId", "==", userId)
      .where("targetUserId", "==", targetUserId)
      .get();
    if (!existing.empty) throw new Error("Convite já enviado");
    const doc = await this.connectionsRef.add({
      userId,
      targetUserId,
      status: "pending",
      createdAt: new Date(),
    });
    return { id: doc.id, userId, targetUserId, status: "pending", createdAt: new Date() };
  }

  async acceptConnectionRequest(id: string) {
    await this.connectionsRef.doc(id).update({ status: "accepted" });
    return { success: true };
  }

  async rejectConnectionRequest(id: string) {
    await this.connectionsRef.doc(id).update({ status: "rejected" });
    return { success: true };
  }

  async getUserConnections(userId: number) {
    // Conexões aceitas
    const sent = await this.connectionsRef.where("userId", "==", userId).where("status", "==", "accepted").get();
    const received = await this.connectionsRef.where("targetUserId", "==", userId).where("status", "==", "accepted").get();
    return [
      ...sent.docs.map(d => this.docToObj(d)),
      ...received.docs.map(d => this.docToObj(d)),
    ];
  }

  async getUserPendingRequests(userId: number) {
    // Convites recebidos pendentes
    const received = await this.connectionsRef.where("targetUserId", "==", userId).where("status", "==", "pending").get();
    return received.docs.map(d => this.docToObj(d));
  }
}

export async function gerarArtigoOriginalIA(tema: string, categoria: string, autorId: number) {
  // 1. Gerar texto do artigo
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Você é um redator de blog de tecnologia. Escreva artigos originais, informativos e envolventes." },
      { role: "user", content: `Escreva um artigo original, realista e detalhado sobre ${tema} na categoria ${categoria}. Inclua título, resumo e corpo do artigo. Responda no formato JSON: {\"title\":\"...\",\"excerpt\":\"...\",\"content\":\"...\"}` }
    ],
    max_tokens: 1024,
    temperature: 0.8
  });
  const resposta = completion.choices[0].message.content;
  let artigoJson: { title: string, excerpt: string, content: string };
  try {
    artigoJson = JSON.parse(resposta!);
  } catch {
    // fallback: tenta extrair manualmente
    artigoJson = { title: `Artigo sobre ${tema}`, excerpt: resposta?.slice(0, 150) || '', content: resposta || '' };
  }

  // 2. Gerar imagem original
  const image = await openai.images.generate({
    prompt: `Ilustração moderna, realista, para artigo de tecnologia sobre ${tema} (${categoria}), digital art, cores vibrantes`,
    n: 1,
    size: "1024x1024"
  });
  const imageUrl = image.data && image.data[0] ? image.data[0].url : null;

  // 3. Montar objeto artigo
  const now = new Date();
  const slug = artigoJson.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
  return {
    title: artigoJson.title,
    slug,
    content: artigoJson.content,
    excerpt: artigoJson.excerpt,
    imageUrl,
    category: categoria,
    tags: [tema, categoria],
    isPremium: false,
    authorId: autorId,
    viewCount: 0,
    likeCount: 0,
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  };
}
