import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { Check, Star, ArrowLeft, CreditCard, Shield, Zap } from 'lucide-react';
import { plans } from "@/components/Premium/PricingCards";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/premium?success=true`,
      },
    });

    if (error) {
      toast({
        title: "Erro no Pagamento",
        description: error.message || "Ocorreu um erro ao processar o pagamento",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pagamento Processado",
        description: "Seu upgrade premium está sendo processado!",
      });
    }

    setIsProcessing(false);
  };

  return (
    <Card className="bg-gray-900 border-gray-700 max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">
          Finalizar Assinatura Premium
        </CardTitle>
        <p className="text-gray-400">
          Complete o pagamento para desbloquear todos os recursos premium
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">CodeLoom Premium</span>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500">
                <Star className="w-3 h-3 mr-1" />
                Mais Popular
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">R$ 29</div>
            <div className="text-gray-400 text-sm">por mês</div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">O que está incluído:</h4>
            <ul className="space-y-2">
              {[
                "Acesso a todos os artigos premium",
                "Cursos práticos avançados",
                "Chat premium privado",
                "Suporte prioritário",
                "Downloads de projetos",
                "Certificações reconhecidas"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-300 text-sm">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-gray-700 rounded-lg p-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    name: '',
                    email: '',
                  }
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Pagamento seguro processado pelo Stripe</span>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 transition-all duration-300"
            disabled={!stripe || isProcessing}
            style={{
              boxShadow: "0 0 20px rgba(138, 43, 226, 0.4)",
            }}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Assinar Premium - R$ 29/mês
              </div>
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300">
              Política de Privacidade
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

function useStripePrices() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stripe/prices')
      .then(res => res.json())
      .then(setPrices)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { prices, loading, error };
}

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Buscar preços Stripe
  const { prices: stripePrices, loading: loadingPrices, error: errorPrices } = useStripePrices();

  // Obter plano da query string
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const plan = searchParams.get('plan') || 'premium';

  // Encontrar priceId do plano
  const planObj = plans.find((p: { id: string }) => p.id === plan);
  const priceId = planObj?.priceId || (stripePrices.find((p: any) => p.product?.name?.toLowerCase().includes(plan))?.id);

  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }
    if (!priceId) return;
    // Create subscription as soon as the page loads
    const createSubscription = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("POST", "/api/create-subscription", {
          userId: user.id,
          email: user.email,
          username: user.displayName,
          priceId,
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error('Subscription creation error:', error);
        setError(error.message || 'Erro ao criar assinatura');
      } finally {
        setLoading(false);
      }
    };
    createSubscription();
  }, [user, setLocation, priceId]);

  // Feedback de sucesso/erro após pagamento
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      toast({
        title: "Assinatura realizada!",
        description: "Bem-vindo ao conteúdo premium!",
      });
      setTimeout(() => {
        window.location.href = "/premium";
      }, 2000);
    }
    if (params.get('canceled')) {
      toast({
        title: "Pagamento cancelado",
        description: "Sua assinatura não foi concluída.",
        variant: "destructive",
      });
    }
  }, []);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-16 px-4 flex items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2 text-white">
              Preparando sua assinatura...
            </h2>
            <p className="text-gray-400">
              Aguarde enquanto configuramos seu plano premium
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    const isServerError = error.includes("Resposta inesperada do servidor");
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-16 px-4 flex items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-md mx-auto"
          >
            <div className={`w-16 h-16 ${isServerError ? 'bg-yellow-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <span className="text-2xl">{isServerError ? '⚠️' : '❌'}</span>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              {isServerError ? 'Erro de Conexão com o Servidor' : 'Erro na Assinatura'}
            </h2>
            <p className="text-gray-400 mb-6">
              {isServerError ? 'Não foi possível conectar ao servidor de pagamentos. Tente novamente mais tarde ou contate o suporte.' : error}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setLocation('/premium')}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:border-purple-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Tentar Novamente
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-16 px-4 flex items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">
              Problema na Configuração
            </h2>
            <p className="text-gray-400">
              Não foi possível configurar o pagamento. Tente novamente.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Exibir preços Stripe e formulário
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main role="main" className="px-2 sm:px-4">
        <div className="pt-16 px-4 py-12 max-w-2xl mx-auto">
          {/* Stripe Prices */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Planos Premium</h2>
            {loadingPrices && <div>Carregando preços...</div>}
            {errorPrices && <div className="text-red-400">Erro ao carregar preços: {errorPrices}</div>}
            <div className="grid gap-4">
              {stripePrices.map((price) => (
                <div key={price.id} className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-white">{price.product?.name || 'Produto'}</div>
                    <div className="text-gray-400 text-sm mb-1">{price.product?.description}</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-400 mt-2 md:mt-0">
                    {price.unit_amount ? (price.unit_amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: price.currency.toUpperCase() }) : '—'}
                    {price.recurring ? <span className="text-base font-normal text-gray-400 ml-1">/ {price.recurring.interval === 'month' ? 'mês' : price.recurring.interval}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm />
          </Elements>
        </div>
      </main>
      <Footer />
    </div>
  );
}
