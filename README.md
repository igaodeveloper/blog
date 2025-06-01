# Deploy Profissional na Vercel

## Estrutura
- **Front-end**: `client/` (React + Vite)
- **Back-end**: `server/` (Express, hospede externamente)

## Passos para Deploy

### 1. Front-end na Vercel
- O build do Vite gera arquivos em `dist/public`.
- O arquivo `vercel.json` já está configurado para deploy estático e proxy de API.
- Configure variáveis de ambiente no painel da Vercel (prefixo `VITE_` para uso no front).

### 2. Back-end (Express)
- Suba o conteúdo de `server/` em um serviço como Railway, Render, Fly.io, etc.
- Configure as variáveis de ambiente necessárias (veja `server/index.ts`).
- Habilite CORS para o domínio da Vercel.

### 3. Proxy de API
- O `vercel.json` faz proxy de `/api/*` para o back-end externo.
- Altere `SEU_BACKEND_URL` no `vercel.json` para a URL real do seu back-end.

### 4. PWA e SEO
- O projeto já inclui manifest, service worker e meta tags otimizadas.

### 5. Dicas Avançadas
- Use Vercel Analytics, Sentry ou LogRocket para monitoramento.
- Configure cache headers para assets estáticos.

---

Para dúvidas ou migração do back-end para serverless, consulte a documentação da Vercel ou peça ajuda aqui! 