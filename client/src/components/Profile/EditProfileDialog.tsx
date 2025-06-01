import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function EditProfileDialog({ user, onProfileUpdated, children }: {
  user: any;
  onProfileUpdated: (newUser: any) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    displayName: user.displayName || "",
    bio: user.bio || "",
    github: user.github || "",
    linkedin: user.linkedin || "",
    website: user.website || "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erro ao atualizar perfil");
      const updated = await res.json();
      onProfileUpdated(updated);
      toast({ title: "Perfil atualizado!" });
      setOpen(false);
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível atualizar o perfil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input name="displayName" value={form.displayName} onChange={handleChange} placeholder="Nome" disabled={loading} />
          <Textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Bio" disabled={loading} />
          <Input name="github" value={form.github} onChange={handleChange} placeholder="GitHub" disabled={loading} />
          <Input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="LinkedIn" disabled={loading} />
          <Input name="website" value={form.website} onChange={handleChange} placeholder="Website" disabled={loading} />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-500 hover:bg-purple-600">{loading ? "Salvando..." : "Salvar"}</Button>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancelar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 