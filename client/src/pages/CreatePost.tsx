import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    content: "",
    imageUrl: "",
    videoUrl: "",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          authorId: user.id,
        }),
      });
      if (!res.ok) throw new Error("Erro ao publicar post");
      toast({ title: "Post publicado!" });
      navigate("/feed");
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível publicar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main role="main">
      <div className="max-w-xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">Nova Postagem</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Textarea name="content" value={form.content} onChange={handleChange} placeholder="O que você quer compartilhar?" rows={4} required disabled={loading} />
          <Input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="URL da imagem (opcional)" disabled={loading} />
          <Input name="videoUrl" value={form.videoUrl} onChange={handleChange} placeholder="URL do vídeo (opcional)" disabled={loading} />
          <Button type="submit" className="bg-purple-500 hover:bg-purple-600" disabled={loading}>{loading ? "Publicando..." : "Publicar"}</Button>
        </form>
      </div>
    </main>
  );
} 