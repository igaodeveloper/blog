import { motion } from "framer-motion";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import ProfileView from "@/components/Profile/ProfileView";
import { useAuth } from "@/hooks/useAuth";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { user } = useAuth();
  const params = useParams();
  const userId = params?.userId;
  const { data: profileUser, isLoading } = useQuery({
    queryKey: ["/api/users/", userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Usuário não encontrado");
      return res.json();
    },
    enabled: !!userId,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-16 px-4 max-w-4xl mx-auto py-12">
        {!user ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">👤</span>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-white">
              Acesso ao Perfil Restrito
            </h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Faça login para acessar e personalizar seu perfil no CodeLoom.
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
            {userId ? (
              isLoading ? <div>Carregando...</div> : <ProfileView profileUser={profileUser} />
            ) : (
              <ProfileView />
            )}
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export const route = "/profile/:userId?";
