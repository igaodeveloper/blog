import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { Check, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    price: 0,
    popular: false,
    features: [
      "Acesso a artigos básicos",
      "Chat da comunidade",
      "Perfil personalizado",
      "Suporte da comunidade",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 29,
    popular: true,
    features: [
      "Todos os recursos gratuitos",
      "Artigos e tutoriais exclusivos",
      "Cursos práticos avançados",
      "Chat premium privado",
      "Suporte prioritário",
      "Downloads de projetos",
    ],
  },
  {
    id: "pro",
    name: "Profissional",
    price: 79,
    popular: false,
    features: [
      "Todos os recursos Premium",
      "Mentorias 1:1 mensais",
      "Acesso a projetos reais",
      "Certificações reconhecidas",
      "Networking exclusivo",
      "Consultoria técnica",
    ],
  },
];

export default function PricingCards() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === "free") return;
    
    setLoading(planId);
    try {
      // Simulate plan selection
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Redirect to subscription page or handle payment
    } catch (error) {
      console.error("Error selecting plan:", error);
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (planId: string) => {
    if (planId === "free" && !user?.isPremium) return true;
    if (planId === "premium" && user?.isPremium) return true;
    return false;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map((plan, index) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
        >
          <Card 
            className={`relative ${
              plan.popular
                ? "bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500"
                : "bg-gray-900 border-gray-700"
            } hover:border-purple-500 transition-all duration-300`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-500 text-white px-4 py-1 font-medium">
                  <Star className="w-3 h-3 mr-1" />
                  {t("premium.mostPopular")}
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold text-white mb-2">
                {plan.name}
              </CardTitle>
              <div className="text-3xl font-bold mb-1 text-white">
                R$ {plan.price}
              </div>
              <div className="text-gray-400">{t("premium.perMonth")}</div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li 
                    key={featureIndex}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: (index * 0.1) + (featureIndex * 0.05) }}
                  >
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-white text-sm">{feature}</span>
                  </motion.li>
                ))}
              </ul>
              
              {isCurrentPlan(plan.id) ? (
                <Button 
                  className="w-full bg-gray-700 text-gray-300 cursor-not-allowed"
                  disabled
                >
                  {t("premium.currentPlan")}
                </Button>
              ) : plan.id === "premium" ? (
                <Link href="/subscribe">
                  <Button 
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold shadow-lg shadow-purple-500/25"
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? "Carregando..." : t("premium.upgrade")}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  className="w-full bg-transparent border-gray-600 text-white hover:border-purple-500 hover:bg-purple-500/10"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? "Carregando..." : t("premium.choose")}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
