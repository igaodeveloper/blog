import { motion } from "framer-motion";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import PricingCards from "@/components/Premium/PricingCards";
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Premium() {
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      toast({
        title: "Assinatura realizada!",
        description: "Bem-vindo ao conteúdo premium!",
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main role="main">
        <div className="pt-16 px-4 max-w-6xl mx-auto py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Conteúdo <span className="text-purple-400">Premium</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              {t("premium.subtitle")}
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <PricingCards />
          </motion.div>

          {/* Premium Content Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6 text-white">
              Conteúdo Premium Exclusivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-700 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500">
                    PREMIUM
                  </Badge>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150"
                  alt="Advanced React development"
                  className="w-full h-24 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold mb-2 text-white">
                  Arquitetura Avançada com React
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Curso completo sobre patterns avançados, micro-frontends e performance.
                </p>
                <div className="blur-sm pointer-events-none">
                  <p className="text-xs text-gray-500">
                    Este conteúdo está disponível apenas para assinantes premium. Aprenda sobre:
                    • Clean Architecture no React
                    • Micro-frontends com Module Federation
                    • Performance optimization avançada
                    • State management complexo
                    • Testing strategies
                  </p>
                </div>
              </div>

              <div className="border border-gray-700 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500">
                    PREMIUM
                  </Badge>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1606863142996-d8426de63ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150"
                  alt="DevOps and automation tools"
                  className="w-full h-24 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold mb-2 text-white">
                  DevOps Completo: CI/CD na Prática
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Do desenvolvimento ao deploy automatizado em produção.
                </p>
                <div className="blur-sm pointer-events-none">
                  <p className="text-xs text-gray-500">
                    Este conteúdo está disponível apenas para assinantes premium. Conteúdo inclui:
                    • Docker e Kubernetes avançado
                    • GitHub Actions e GitLab CI
                    • Infrastructure as Code
                    • Monitoring e observability
                    • Security best practices
                  </p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-400 mb-4">
                Desbloqueie +50 cursos exclusivos, projetos práticos e muito mais!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "React Avançado",
                  "Node.js Expert",
                  "DevOps Master",
                  "System Design",
                  "Microserviços",
                  "Blockchain",
                  "AI/ML",
                  "Mobile Development"
                ].map((topic, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-purple-500/30 text-purple-400"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: "🎯",
                title: "Conteúdo Focado",
                description: "Cursos práticos e direto ao ponto, sem enrolação"
              },
              {
                icon: "👥",
                title: "Comunidade Premium",
                description: "Acesso exclusivo ao chat premium com mentores"
              },
              {
                icon: "🏆",
                title: "Certificações",
                description: "Certificados reconhecidos pelo mercado"
              }
            ].map((benefit, index) => (
              <div
                key={index}
                className="text-center p-6 bg-gray-900/50 rounded-xl border border-gray-700"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
