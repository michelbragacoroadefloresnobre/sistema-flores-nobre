/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "@/lib/revalidate-sc";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Check, ImagePlus, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ImageSectionProps {
  supplierPanelId: string;
  referenceUrl: string;
  orderStatus: OrderStatus;
  imageUrl?: string | null;
}

export function ImageSection({
  supplierPanelId,
  referenceUrl,
  orderStatus,
  imageUrl,
}: ImageSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsSubmitting(true);
    try {
      const { uploadUrl, key } = await axios
        .post("/api/upload-url", {
          fileName: file.name,
          contentType: file.type,
        })
        .then((r) => r.data);

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });

      await axios.post(`/api/supplier-panel/${supplierPanelId}/image`, {
        fileKey: key,
      });

      toast.success("Foto enviada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar a foto.");
    } finally {
      setIsSubmitting(false);
      revalidatePath(`/painel/${supplierPanelId}`);
    }
  };

  const imageContainerClass =
    "relative w-full max-w-[280px] aspect-square mx-auto";

  return (
    <div className="w-full max-w-md mx-auto py-6 px-4 flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          Referência
        </span>
        <div className={cn(imageContainerClass, "group")}>
          <img
            src={referenceUrl || "/placeholder.png"}
            alt="Produto de referência"
            className="object-cover rounded-2xl shadow-lg border border-border/50"
          />
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/10">
            MODELO
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center">
        {imageUrl && orderStatus === OrderStatus.PRODUCING_CONFIRMATION ? (
          <div className="w-full flex flex-col items-center justify-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={imageContainerClass}>
              <img
                src={previewUrl || imageUrl || ""}
                alt="Foto enviada"
                className="object-cover rounded-2xl border-4 border-success/30 w-full h-full"
              />
              <div className="absolute -bottom-2 -right-2 bg-success text-white p-3 rounded-full border-4 border-background shadow-lg flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-success">
                Envio Realizado
              </h3>
              <p className="text-sm text-muted-foreground">
                Sua foto foi registrada com sucesso.
              </p>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="w-full space-y-4 animate-in zoom-in-95 duration-300">
            <div
              className={cn(
                imageContainerClass,
                "bg-muted rounded-2xl overflow-hidden border border-border shadow-sm",
              )}
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="object-cover w-full h-full"
              />
              <button
                onClick={handleRemoveFile}
                disabled={isSubmitting}
                className="absolute top-3 right-3 p-2.5 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm rounded-full transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-70 mx-auto w-full">
              <Button
                variant="outline"
                onClick={handleRemoveFile}
                disabled={isSubmitting}
                className="h-12 w-full text-base border-border hover:bg-muted"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Trocar
              </Button>

              <Button
                onClick={handleUpload}
                disabled={isSubmitting}
                className={cn(
                  "h-12 w-full text-base font-semibold transition-all",
                  isSubmitting
                    ? "bg-muted text-muted-foreground"
                    : "bg-success hover:bg-success/90 text-white shadow-md shadow-success/20",
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <span className="block text-center text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Sua Produção
            </span>
            <label
              className={cn(
                imageContainerClass,
                "group relative flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99] cursor-pointer transition-all duration-200",
              )}
            >
              <div className="flex flex-col items-center text-center p-6 space-y-3">
                <div className="p-4 rounded-full bg-muted group-hover:bg-background transition-colors">
                  <ImagePlus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Adicionar Foto
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toque para abrir a câmera
                  </p>
                </div>
              </div>
              <Input
                type="file"
                className="hidden"
                accept="image/*,capture=camera"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
