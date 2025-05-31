import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate sending password reset email
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSent(true);
      toast({
        title: t("common.success"),
        description: "Email de recuperação enviado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-700">
        <CardContent className="pt-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email Enviado!</h2>
            <p className="text-gray-400 text-sm">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
          </div>
          <Link href="/login">
            <Button className="w-full bg-purple-500 hover:bg-purple-600">
              Voltar ao Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <CardTitle className="text-xl font-bold text-white">
            Recuperar Senha
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 text-sm mb-6">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-300">
              {t("auth.email")}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="seu@email.com"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-purple-500 hover:bg-purple-600"
            disabled={loading}
          >
            {loading ? t("common.loading") : "Enviar Link de Recuperação"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Lembrou da senha?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              Fazer login
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
