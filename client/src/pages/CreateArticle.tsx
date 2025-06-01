import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function CreateArticle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    title: "",
    content: "",
    imageUrl: "",
    tags: "",
    category: "",
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
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map(t => t.trim()),
          authorId: user.id,
        }),
      });
      if (!res.ok) throw new Error("Erro ao criar artigo");
      const article = await res.json();
      toast({ title: "Artigo publicado!" });
      navigate(`/article/${article.id}`);
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível publicar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main role="main">
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">Publicar Artigo</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input name="title" value={form.title} onChange={handleChange} placeholder="Título" required disabled={loading} />
          <Textarea name="content" value={form.content} onChange={handleChange} placeholder="Conteúdo" rows={10} required disabled={loading} />
          <Input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="URL da imagem (opcional)" disabled={loading} />
          <Input name="tags" value={form.tags} onChange={handleChange} placeholder="Tags (separadas por vírgula)" disabled={loading} />
          <Input name="category" value={form.category} onChange={handleChange} placeholder="Categoria" disabled={loading} />
          <Button type="submit" className="bg-purple-500 hover:bg-purple-600" disabled={loading}>{loading ? "Publicando..." : "Publicar"}</Button>
        </form>
      </div>
    </main>
  );
} 