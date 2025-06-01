import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import Stripe from "stripe";
import { storage, gerarArtigoOriginalIA } from "./storage";
import { insertUserSchema, insertCommentSchema, insertChatMessageSchema } from "@shared/schema";
import express from "express";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found, payment features will be disabled');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer });
  const clients = new Map();

  function broadcastOnlineUsers() {
    const onlineUserIds = Array.from(clients.keys());
    Promise.all(onlineUserIds.map(async (id) => await storage.getUser(Number(id))))
      .then(users => {
        const filtered = users.filter(Boolean);
        clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'online_users', users: filtered }));
          }
        });
      });
  }

  wss.on('connection', (ws, req) => {
    const userId = req.url?.split('userId=')[1];
    if (userId) {
      clients.set(userId, ws);
      broadcastOnlineUsers();
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'chat_message') {
          const chatMessage = await storage.createChatMessage({
            content: message.content,
            userId: parseInt(message.userId),
            roomId: message.roomId || 'general',
          });

          // Broadcast to all connected clients
          const messageWithUser = {
            ...chatMessage,
            user: await storage.getUser(chatMessage.userId!),
          };

          clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
              client.send(JSON.stringify({
                type: 'new_message',
                message: messageWithUser,
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
        broadcastOnlineUsers();
      }
    });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/firebase", async (req, res) => {
    try {
      const { firebaseUid, email, displayName, avatar } = req.body;
      
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        // Create new user from Firebase auth
        user = await storage.createUser({
          email,
          username: email.split('@')[0],
          displayName,
          avatar,
          firebaseUid,
          password: null, // Firebase users don't need password
          bio: null,
          website: null,
          github: null,
          linkedin: null,
          isPremium: false,
          preferredLanguage: "pt",
          theme: "dark",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(parseInt(req.params.id), updates);
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats(parseInt(req.params.id));
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = storage.getAllUsers();
      const data = users.map(user => ({
        email: user.email,
        password: user.password,
        username: user.username,
        displayName: user.displayName
      }));
      res.json({ users: data });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Article routes
  app.get("/api/articles", async (req, res) => {
    try {
      const { limit = "10", offset = "0", category, premium } = req.query;
      const articles = await storage.getArticles(
        parseInt(limit as string),
        parseInt(offset as string),
        category as string,
        premium === "true" ? true : premium === "false" ? false : undefined
      );
      res.json(articles);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticle(parseInt(req.params.id));
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Increment view count
      if (article.viewCount !== null) {
        await storage.updateArticleStats(article.id, article.viewCount + 1);
      }
      
      res.json(article);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/articles/slug/:slug", async (req, res) => {
    try {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Increment view count
      if (article.viewCount !== null) {
        await storage.updateArticleStats(article.id, article.viewCount + 1);
      }
      
      res.json(article);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Comment routes
  app.get("/api/articles/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByArticle(parseInt(req.params.id));
      const commentsWithUsers = await Promise.all(
        comments.map(async (comment) => ({
          ...comment,
          user: await storage.getUser(comment.userId!),
        }))
      );
      res.json(commentsWithUsers);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/articles/:id/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse({
        ...req.body,
        articleId: parseInt(req.params.id),
      });
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Like routes
  app.get("/api/articles/:id/like/:userId", async (req, res) => {
    try {
      const isLiked = await storage.getLike(
        parseInt(req.params.userId),
        parseInt(req.params.id)
      );
      res.json({ isLiked });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/articles/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      const articleId = parseInt(req.params.id);
      
      const isLiked = await storage.getLike(userId, articleId);
      
      if (isLiked) {
        await storage.deleteLike(userId, articleId);
        const article = await storage.getArticle(articleId);
        if (article) {
          if (article.likeCount !== null) {
            await storage.updateArticleStats(articleId, undefined, article.likeCount - 1);
          }
        }
        res.json({ isLiked: false });
      } else {
        await storage.createLike(userId, articleId);
        const article = await storage.getArticle(articleId);
        if (article) {
          if (article.likeCount !== null) {
            await storage.updateArticleStats(articleId, undefined, article.likeCount + 1);
          }
        }
        res.json({ isLiked: true });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Chat routes
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const { roomId = "general", limit = "50" } = req.query;
      const messages = await storage.getChatMessages(
        roomId as string,
        parseInt(limit as string)
      );
      
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => ({
          ...message,
          user: await storage.getUser(message.userId!),
        }))
      );
      
      res.json(messagesWithUsers);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/chat/report/:id", async (req, res) => {
    try {
      await storage.reportChatMessage(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stripe payment routes
  if (stripe) {
    app.post("/api/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "brl",
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });

    app.post("/api/create-subscription", async (req, res) => {
      try {
        const { userId, email, username, priceId } = req.body;
        
        let user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          res.json({
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          });
          return;
        }

        const customer = await stripe.customers.create({
          email: email || user.email,
          name: username || user.displayName,
        });

        user = await storage.updateUserStripeInfo(userId, customer.id);

        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{
            price: priceId || process.env.STRIPE_PRICE_ID || "price_1234567890", // Usa priceId se enviado
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    app.get("/api/stripe/prices", async (req, res) => {
      try {
        const prices = await stripe.prices.list({ active: true, expand: ["data.product"] });
        res.json(prices.data.map(price => ({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          product: (typeof price.product === 'object' && price.product.object === 'product') ? {
            id: price.product.id,
            name: (price.product as Stripe.Product).name,
            description: (price.product as Stripe.Product).description,
            images: (price.product as Stripe.Product).images,
          } : price.product
        })));
      } catch (error: any) {
        res.status(500).json({ message: "Error fetching Stripe prices: " + error.message });
      }
    });

    // Webhook Stripe
    app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
      const sig = req.headers['stripe-signature'];
      if (!sig) {
        return res.status(400).send('Missing Stripe signature header');
      }
      if (!process.env.STRIPE_WEBHOOK_SECRET || typeof process.env.STRIPE_WEBHOOK_SECRET !== 'string') {
        return res.status(500).send('Stripe webhook secret not configured');
      }
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        const errorMsg = (err instanceof Error) ? err.message : String(err);
        console.error("Webhook signature verification failed.", errorMsg);
        return res.status(400).send(`Webhook Error: ${errorMsg}`);
      }

      // Handle the event
      switch (event.type) {
        case 'invoice.paid': {
          const invoice: any = event.data.object;
          const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
          if (subscriptionId) {
            const user = await storage.getUserByStripeSubscriptionId(subscriptionId);
            if (user) {
              await storage.updateUser(user.id, { isPremium: true });
            }
          }
          break;
        }
        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const user = await storage.getUserByStripeSubscriptionId(subscription.id);
          if (user) {
            const isActive = subscription.status === 'active' || subscription.status === 'trialing';
            await storage.updateUser(user.id, { isPremium: isActive });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const user = await storage.getUserByStripeSubscriptionId(subscription.id);
          if (user) {
            await storage.updateUser(user.id, { isPremium: false });
          }
          break;
        }
        default:
          // Unexpected event type
          break;
      }
      res.json({ received: true });
    });

    app.post("/api/stripe/cancel-subscription", async (req, res) => {
      try {
        // O userId deve ser enviado no corpo da requisição
        const userId = req.body.userId;
        if (!userId) return res.status(401).json({ message: "Não autenticado" });
        const user = await storage.getUser(userId);
        if (!user || !user.stripeSubscriptionId) return res.status(404).json({ message: "Assinatura não encontrada" });
        await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true });
        await storage.updateUser(user.id, { isPremium: false });
        res.json({ message: "Assinatura cancelada" });
      } catch (error) {
        res.status(400).json({ message: "Erro ao cancelar assinatura" });
      }
    });
  }

  // Video routes
  app.post("/api/videos", async (req, res) => {
    try {
      const video = await storage.createVideo(req.body);
      res.json(video);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(parseInt(req.params.id));
      if (!video) return res.status(404).json({ message: "Video not found" });
      res.json(video);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  // Post routes
  app.post("/api/posts", async (req, res) => {
    try {
      const post = await storage.createPost(req.body);
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(parseInt(req.params.id));
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // --- ROTAS DE CONEXÃO (amizade estilo LinkedIn) ---
  app.post("/api/connections/request", async (req, res) => {
    try {
      const { userId, targetUserId } = req.body;
      if (userId === targetUserId) return res.status(400).json({ message: "Não pode se conectar consigo mesmo" });
      const result = await storage.createConnectionRequest(userId, targetUserId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/connections/accept", async (req, res) => {
    try {
      const { id } = req.body;
      const result = await storage.acceptConnectionRequest(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/connections/reject", async (req, res) => {
    try {
      const { id } = req.body;
      const result = await storage.rejectConnectionRequest(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/connections/:userId", async (req, res) => {
    try {
      const connections = await storage.getUserConnections(parseInt(req.params.userId));
      res.json(connections);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/connections/requests/:userId", async (req, res) => {
    try {
      const requests = await storage.getUserPendingRequests(parseInt(req.params.userId));
      res.json(requests);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Endpoint para gerar artigo original com IA
  app.post("/api/generate-article", async (req, res) => {
    try {
      const { tema, categoria, authorId } = req.body;
      if (!tema || !categoria || !authorId) {
        return res.status(400).json({ message: "tema, categoria e authorId são obrigatórios" });
      }
      const artigo = await gerarArtigoOriginalIA(tema, categoria, authorId);
      const artigoSalvo = await storage.createArticle(artigo);
      res.json(artigoSalvo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
