import { motion } from "framer-motion";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import ChatWindow from "@/components/Chat/ChatWindow";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main role="main">
        <div className="pt-16 px-4 max-w-7xl mx-auto py-12">
          {!user ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💬</span>
              </div>
              <h1 className="text-3xl font-bold mb-4 text-white">
                Acesso ao Chat Restrito
              </h1>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Faça login ou crie uma conta para participar das discussões da comunidade CodeLoom.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/login">
                  <Button className="bg-purple-500 hover:bg-purple-600">
                    Fazer Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:border-purple-500">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ChatWindow />
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
