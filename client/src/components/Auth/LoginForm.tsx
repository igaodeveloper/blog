import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { signInWithGoogle } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { FaGoogle, FaLinkedin } from "react-icons/fa";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast({
        title: t("common.success"),
        description: "Login realizado com sucesso!",
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

  const handleGoogleLogin = () => {
    signInWithGoogle();
  };

  return (
    <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white">
          {t("auth.loginTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
          <div>
            <Label htmlFor="password" className="text-gray-300">
              {t("auth.password")}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="••••••••"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-purple-500 hover:bg-purple-600"
            disabled={loading}
          >
            {loading ? t("common.loading") : t("auth.loginButton")}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">
                {t("auth.orContinueWith")}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              onClick={handleGoogleLogin}
            >
              <FaGoogle className="w-4 h-4 mr-2 text-red-400" />
              {t("auth.google")}
            </Button>
            <Button
              variant="outline"
              className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              <FaLinkedin className="w-4 h-4 mr-2 text-blue-400" />
              {t("auth.linkedin")}
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center space-y-2">
          <Link href="/forgot-password">
            <Button variant="link" className="text-purple-400 hover:text-purple-300">
              {t("auth.forgotPassword")}
            </Button>
          </Link>
          <p className="text-gray-400 text-sm">
            {t("auth.noAccount")}{" "}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300">
              {t("auth.signupLink")}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
