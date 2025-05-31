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

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }

    // Create subscription as soon as the page loads
    const createSubscription = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("POST", "/api/create-subscription", {
          userId: user.id,
          email: user.email,
          username: user.displayName,
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
  }, [user, setLocation]);

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
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Erro na Assinatura
            </h2>
            <p className="text-gray-400 mb-6">
              {error}
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

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-16 px-4 py-12">
        {/* Back Button */}
        <div className="max-w-4xl mx-auto mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/premium')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Premium
          </Button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Upgrade para <span className="text-purple-400">Premium</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Desbloqueie todo o potencial do CodeLoom com acesso completo aos nossos recursos premium
          </p>
        </motion.div>

        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm />
          </Elements>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8 text-green-400" />,
                title: "Pagamento Seguro",
                description: "Seus dados são protegidos com criptografia de ponta"
              },
              {
                icon: <Zap className="w-8 h-8 text-purple-400" />,
                title: "Ativação Instantânea",
                description: "Acesso imediato após confirmação do pagamento"
              },
              {
                icon: <Star className="w-8 h-8 text-yellow-400" />,
                title: "Suporte Premium",
                description: "Atendimento prioritário e especializado"
              }
            ].map((item, index) => (
              <div key={index} className="text-center p-6 bg-gray-900/50 rounded-xl border border-gray-700">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
