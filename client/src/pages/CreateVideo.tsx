import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function CreateVideo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    thumbnail: "",
    tags: "",
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
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map(t => t.trim()),
          authorId: user.id,
        }),
      });
      if (!res.ok) throw new Error("Erro ao publicar vídeo");
      toast({ title: "Vídeo publicado!" });
      navigate("/videos");
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível publicar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Publicar Vídeo</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input name="title" value={form.title} onChange={handleChange} placeholder="Título" required disabled={loading} />
        <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Descrição" rows={5} disabled={loading} />
        <Input name="url" value={form.url} onChange={handleChange} placeholder="URL do vídeo (YouTube, Vimeo, etc)" required disabled={loading} />
        <Input name="thumbnail" value={form.thumbnail} onChange={handleChange} placeholder="URL da thumbnail (opcional)" disabled={loading} />
        <Input name="tags" value={form.tags} onChange={handleChange} placeholder="Tags (separadas por vírgula)" disabled={loading} />
        <Button type="submit" className="bg-purple-500 hover:bg-purple-600" disabled={loading}>{loading ? "Publicando..." : "Publicar"}</Button>
      </form>
    </div>
  );
} 