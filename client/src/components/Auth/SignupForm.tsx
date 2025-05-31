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

export default function SignupForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t("common.error"),
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        username: formData.username,
        bio: null,
        website: null,
        github: null,
        linkedin: null,
        isPremium: false,
        preferredLanguage: "pt",
        theme: "dark",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        firebaseUid: null,
        avatar: null,
      });
      toast({
        title: t("common.success"),
        description: "Conta criada com sucesso!",
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

  const handleGoogleSignup = () => {
    signInWithGoogle();
  };

  return (
    <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white">
          {t("auth.signupTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="displayName" className="text-gray-300">
              {t("auth.displayName")}
            </Label>
            <Input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="João Silva"
              required
            />
          </div>
          <div>
            <Label htmlFor="username" className="text-gray-300">
              {t("auth.username")}
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="joaosilva"
              required
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-gray-300">
              {t("auth.email")}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
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
              value={formData.password}
              onChange={handleChange}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-300">
              {t("auth.confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            {loading ? t("common.loading") : t("auth.signupButton")}
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
              onClick={handleGoogleSignup}
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

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              {t("auth.loginLink")}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
