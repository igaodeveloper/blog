import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import LoginForm from "@/components/Auth/LoginForm";
import ParticleBackground from "@/components/Animations/ParticleBackground";
import { useAuth } from "@/hooks/useAuth";
import { Code } from "lucide-react";

export default function Login() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/welcome");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mx-auto flex items-center justify-center mb-4"
            whileHover={{ scale: 1.05 }}
            style={{
              boxShadow: "0 0 20px rgba(138, 43, 226, 0.5)",
            }}
          >
            <Code className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-purple-400">CodeLoom</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
}
