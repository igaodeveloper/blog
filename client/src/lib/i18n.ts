export const translations = {
  pt: {
    // Navigation
    nav: {
      home: "Início",
      chat: "Chat",
      profile: "Perfil",
      premium: "Premium",
      login: "Entrar",
      logout: "Sair",
    },
    // Welcome
    welcome: {
      title: "Bem-vindo ao CodeLoom",
      subtitle: "Sua comunidade de programação e tecnologia. Aprenda, compartilhe e conecte-se com desenvolvedores do mundo todo.",
      startButton: "Começar Agora",
      skipButton: "Pular",
    },
    // Auth
    auth: {
      loginTitle: "Entrar no CodeLoom",
      signupTitle: "Criar Conta",
      email: "Email",
      password: "Senha",
      confirmPassword: "Confirmar Senha",
      displayName: "Nome de Exibição",
      username: "Nome de Usuário",
      loginButton: "Entrar",
      signupButton: "Criar Conta",
      forgotPassword: "Esqueci minha senha",
      noAccount: "Não tem conta?",
      hasAccount: "Já tem conta?",
      signupLink: "Cadastre-se",
      loginLink: "Faça login",
      orContinueWith: "ou continue com",
      google: "Google",
      linkedin: "LinkedIn",
    },
    // Home
    home: {
      recentArticles: "Artigos Recentes",
      subtitle: "Descubra os melhores conteúdos sobre programação e tecnologia",
      searchPlaceholder: "Buscar artigos...",
      allCategories: "Todas Categorias",
      loadMore: "Carregar Mais Artigos",
      readTime: "min de leitura",
    },
    // Chat
    chat: {
      title: "Chat da Comunidade",
      subtitle: "Conecte-se com outros desenvolvedores em tempo real",
      onlineUsers: "usuários online",
      messagePlaceholder: "Digite sua mensagem...",
      onlineList: "Usuários Online",
    },
    // Profile
    profile: {
      editProfile: "Editar Perfil",
      articlesLiked: "Artigos Curtidos",
      comments: "Comentários",
      activeDays: "Dias Ativos",
      views: "Visualizações",
      weeklyActivity: "Atividade Semanal",
      recentActivity: "Atividade Recente",
      bio: "Biografia",
      website: "Website",
      github: "GitHub",
      linkedin: "LinkedIn",
    },
    // Premium
    premium: {
      title: "Conteúdo Premium",
      subtitle: "Acesse conteúdos exclusivos, cursos avançados e conecte-se com uma comunidade premium de desenvolvedores.",
      free: "Gratuito",
      premium: "Premium",
      pro: "Profissional",
      perMonth: "por mês",
      mostPopular: "Mais Popular",
      upgrade: "Upgrade Premium",
      choose: "Escolher",
      currentPlan: "Seu Plano Atual",
    },
    // Common
    common: {
      loading: "Carregando...",
      error: "Erro",
      success: "Sucesso",
      save: "Salvar",
      cancel: "Cancelar",
      delete: "Excluir",
      edit: "Editar",
      close: "Fechar",
    },
  },
  en: {
    // Navigation
    nav: {
      home: "Home",
      chat: "Chat",
      profile: "Profile",
      premium: "Premium",
      login: "Login",
      logout: "Logout",
    },
    // Welcome
    welcome: {
      title: "Welcome to CodeLoom",
      subtitle: "Your programming and technology community. Learn, share and connect with developers from around the world.",
      startButton: "Get Started",
      skipButton: "Skip",
    },
    // Auth
    auth: {
      loginTitle: "Login to CodeLoom",
      signupTitle: "Create Account",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      displayName: "Display Name",
      username: "Username",
      loginButton: "Login",
      signupButton: "Create Account",
      forgotPassword: "Forgot password",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      signupLink: "Sign up",
      loginLink: "Log in",
      orContinueWith: "or continue with",
      google: "Google",
      linkedin: "LinkedIn",
    },
    // Home
    home: {
      recentArticles: "Recent Articles",
      subtitle: "Discover the best content about programming and technology",
      searchPlaceholder: "Search articles...",
      allCategories: "All Categories",
      loadMore: "Load More Articles",
      readTime: "min read",
    },
    // Chat
    chat: {
      title: "Community Chat",
      subtitle: "Connect with other developers in real time",
      onlineUsers: "users online",
      messagePlaceholder: "Type your message...",
      onlineList: "Online Users",
    },
    // Profile
    profile: {
      editProfile: "Edit Profile",
      articlesLiked: "Articles Liked",
      comments: "Comments",
      activeDays: "Active Days",
      views: "Views",
      weeklyActivity: "Weekly Activity",
      recentActivity: "Recent Activity",
      bio: "Biography",
      website: "Website",
      github: "GitHub",
      linkedin: "LinkedIn",
    },
    // Premium
    premium: {
      title: "Premium Content",
      subtitle: "Access exclusive content, advanced courses and connect with a premium community of developers.",
      free: "Free",
      premium: "Premium",
      pro: "Professional",
      perMonth: "per month",
      mostPopular: "Most Popular",
      upgrade: "Upgrade Premium",
      choose: "Choose",
      currentPlan: "Your Current Plan",
    },
    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
    },
  },
};

export type TranslationKey = keyof typeof translations.pt;
export type NestedTranslationKey = {
  [K in keyof typeof translations.pt]: keyof typeof translations.pt[K];
};
