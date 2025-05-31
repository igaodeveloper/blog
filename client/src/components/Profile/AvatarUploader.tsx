import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarUploaderProps {
  currentAvatar?: string;
  displayName: string;
  onAvatarChange: (avatarUrl: string) => void;
}

export default function AvatarUploader({ currentAvatar, displayName, onAvatarChange }: AvatarUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onAvatarChange(previewUrl);
      setPreviewUrl(null);
      
      toast({
        title: "Sucesso",
        description: "Avatar atualizado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do avatar.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    onAvatarChange("");
    toast({
      title: "Sucesso",
      description: "Avatar removido com sucesso!",
    });
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Avatar className="w-32 h-32 border-4 border-gray-700">
            <AvatarImage src={previewUrl || currentAvatar || ""} alt={displayName} />
            <AvatarFallback className="text-4xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        
        <motion.button
          className="absolute bottom-0 right-0 w-10 h-10 bg-purple-500 rounded-full border-4 border-gray-900 flex items-center justify-center hover:bg-purple-600 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Camera className="w-4 h-4 text-white" />
        </motion.button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <motion.div
        className={`border-2 border-dashed rounded-lg p-6 w-full max-w-sm text-center transition-colors ${
          isDragging
            ? "border-purple-500 bg-purple-500/10"
            : "border-gray-600 hover:border-gray-500"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-400 mb-2">
          Arraste uma imagem ou clique para selecionar
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="bg-transparent border-gray-600 text-gray-300 hover:border-purple-500"
        >
          Selecionar Arquivo
        </Button>
      </motion.div>

      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-2"
          >
            <Button
              onClick={handleSaveAvatar}
              disabled={isUploading}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {isUploading ? "Salvando..." : "Salvar Avatar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewUrl(null)}
              className="border-gray-600 text-gray-300 hover:border-gray-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {currentAvatar && !previewUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveAvatar}
          className="border-red-600 text-red-400 hover:border-red-500 hover:text-red-300"
        >
          Remover Avatar
        </Button>
      )}
    </div>
  );
}
