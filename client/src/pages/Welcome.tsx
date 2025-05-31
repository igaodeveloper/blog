import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import LottieWelcome from "@/components/Animations/LottieWelcome";
import ParticleBackground from "@/components/Animations/ParticleBackground";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";

export default function Welcome() {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user has seen welcome screen before
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (hasSeenWelcome && user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleGetStarted = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setLocation("/");
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setLocation("/");
  };

  if (!showWelcome) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!animationComplete ? (
            <motion.div
              key="animation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <LottieWelcome onComplete={() => setAnimationComplete(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl md:text-6xl font-bold mb-6"
              >
                {t("welcome.title")}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
              >
                {t("welcome.subtitle")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button
                  size="lg"
                  className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{
                    boxShadow: "0 0 20px rgba(138, 43, 226, 0.4)",
                  }}
                  onClick={handleGetStarted}
                >
                  {t("welcome.startButton")}
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  className="text-gray-400 hover:text-white px-8 py-4 text-lg"
                  onClick={handleSkip}
                >
                  {t("welcome.skipButton")}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {[
                  {
                    icon: "💻",
                    title: "Artigos Exclusivos",
                    description: "Conteúdos técnicos aprofundados escritos por especialistas",
                  },
                  {
                    icon: "💬",
                    title: "Comunidade Ativa",
                    description: "Chat em tempo real com desenvolvedores do mundo todo",
                  },
                  {
                    icon: "🚀",
                    title: "Projetos Práticos",
                    description: "Aprenda construindo projetos reais do mercado",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 + index * 0.2 }}
                    className="text-center p-6 bg-gray-900/50 rounded-xl border border-gray-700 backdrop-blur-sm"
                  >
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-semibold mb-2 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
