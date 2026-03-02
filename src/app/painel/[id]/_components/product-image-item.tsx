/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupplierPanelPhotoStatus } from "@/generated/prisma/enums";
import { authClient } from "@/lib/auth/client";
import { revalidatePath } from "@/lib/revalidate-sc";
import { cn } from "@/lib/utils";
import axios from "axios";
import {
  AlertCircle,
  Check,
  ImagePlus,
  Loader2,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductItem } from "./image-section";

export function ProductImageItem({
  product,
  supplierPanelId,
}: {
  product: ProductItem;
  supplierPanelId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isReviewing, setIsReviewing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data } = authClient.useSession();

  const isSellerView = !!data;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    try {
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
      ];

      if (
        !file.type &&
        (file.name.toLowerCase().endsWith(".heic") ||
          file.name.toLowerCase().endsWith(".heif"))
      ) {
        file = new File([file], file.name, {
          type: file.name.toLowerCase().endsWith(".heic")
            ? "image/heic"
            : "image/heif",
        });
      }

      const MAX_SIZE_BYTES = 10 * 1024 * 1024;

      if (!allowedImageTypes.includes(file.type)) {
        return toast.error("Formato de arquivo incompatível");
      }
      if (file.size > MAX_SIZE_BYTES) {
        return toast.error("Tamanho máximo de imagem permitido é 10MB");
      }

      setFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (e: any) {
      console.error("Erro ao selecionar foto:", e);
      toast.error(e?.message || "Imagem inválida para envio");
    }
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

      const { message } = await axios
        .post(
          `/api/supplier-panel/${supplierPanelId}/image/${product.spPhotoId}`,
          {
            fileKey: key,
          },
        )
        .then((res) => res.data);

      toast.success(message);
      handleRemoveFile();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data.error || "Erro ao processar a avaliação.",
      );
    } finally {
      setIsSubmitting(false);
      revalidatePath(`/painel/${supplierPanelId}`);
    }
  };

  const handleReview = async (status: SupplierPanelPhotoStatus) => {
    if (status === SupplierPanelPhotoStatus.REJECTED && !rejectReason.trim()) {
      return toast.error("Você precisa informar o motivo da recusa.");
    }

    setIsReviewing(true);
    try {
      const { message } = await axios
        .post(
          `/api/supplier-panel/${supplierPanelId}/image/${product.spPhotoId}/review`,
          {
            status,
            rejectionReason:
              status === SupplierPanelPhotoStatus.REJECTED
                ? rejectReason
                : null,
          },
        )
        .then((res) => res.data);

      toast.success(message);
      setShowRejectForm(false);
      setRejectReason("");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data.error || "Erro ao processar a avaliação.",
      );
    } finally {
      setIsReviewing(false);
      revalidatePath(`/painel/${supplierPanelId}`);
    }
  };

  const imageContainerClass =
    "relative w-full max-w-[280px] aspect-square mx-auto";

  const needsUpload =
    product.status === SupplierPanelPhotoStatus.PENDING ||
    product.status === SupplierPanelPhotoStatus.REJECTED;

  const showExistingImage =
    !!product.imageUrl &&
    (product.status === SupplierPanelPhotoStatus.SUBMITTED ||
      product.status === SupplierPanelPhotoStatus.APPROVED);

  return (
    <div className="flex flex-col gap-6 p-6 border rounded-xl bg-card shadow-sm">
      {product.name && (
        <h3 className="text-center font-bold text-lg border-b pb-4">
          {product.name}
        </h3>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            Referência
          </span>
          <div className={cn(imageContainerClass, "group")}>
            <img
              src={product.referenceUrl || "/placeholder.png"}
              alt="Produto de referência"
              className="object-cover rounded-2xl shadow-lg border border-border/50 w-full h-full"
            />
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/10">
              MODELO
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {"Sua Produção"}
          </span>

          {showExistingImage && !previewUrl && (
            <div className="aspect-square w-full flex flex-col items-center justify-center space-y-4 animate-in fade-in">
              <div className={imageContainerClass}>
                <img
                  src={product.imageUrl!}
                  alt="Foto enviada"
                  className={cn(
                    "object-cover rounded-2xl border-4 w-full h-full",
                    product.status === SupplierPanelPhotoStatus.APPROVED
                      ? "border-success/50"
                      : product.status === SupplierPanelPhotoStatus.SUBMITTED
                        ? "border-warning/50"
                        : undefined,
                  )}
                />
                {product.status === SupplierPanelPhotoStatus.APPROVED && (
                  <div className="absolute -bottom-2 -right-2 bg-success text-white p-3 rounded-full border-4 border-background shadow-lg">
                    <Check className="w-6 h-6" />
                  </div>
                )}
                {product.status === SupplierPanelPhotoStatus.SUBMITTED &&
                  !isSellerView && (
                    <div className="absolute top-3 right-3 bg-warning text-warning-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                      EM ANÁLISE
                    </div>
                  )}
              </div>

              {isSellerView &&
                product.status === SupplierPanelPhotoStatus.SUBMITTED && (
                  <div className="w-full max-w-70 mt-4 animate-in fade-in slide-in-from-top-2">
                    {!showRejectForm ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowRejectForm(true)}
                          disabled={isReviewing}
                          className="h-10 text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Recusar
                        </Button>
                        <Button
                          onClick={() => handleReview("APPROVED")}
                          disabled={isReviewing}
                          className="h-10 bg-success hover:bg-success/90 text-white"
                        >
                          {isReviewing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Aprovar
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                        <label className="text-sm font-semibold text-foreground">
                          Motivo da Recusa:
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Ex: Foto desfocada, produto errado..."
                          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectReason("");
                            }}
                            disabled={isReviewing}
                            className="flex-1 h-9"
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleReview(SupplierPanelPhotoStatus.REJECTED)
                            }
                            disabled={isReviewing || !rejectReason.trim()}
                            className="flex-1 h-9"
                          >
                            {isReviewing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Confirmar"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {previewUrl && (
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
                  className="h-10 text-sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Trocar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isSubmitting}
                  className={cn(
                    "h-10 text-sm font-semibold transition-all",
                    isSubmitting
                      ? "bg-muted text-muted-foreground"
                      : "bg-success hover:bg-primary/90 text-white",
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Input para Adicionar Foto */}
          {needsUpload && !previewUrl && (
            <label
              className={cn(
                imageContainerClass,
                "group relative flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99] cursor-pointer transition-all duration-200",
                product.status === SupplierPanelPhotoStatus.REJECTED &&
                  "border-destructive text-destructive",
              )}
            >
              <div className="flex flex-col items-center text-center p-6 space-y-3">
                <div className="p-4 rounded-full bg-muted group-hover:bg-background transition-colors">
                  <ImagePlus className="w-8 h-8 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-semibold">
                    {product.status === SupplierPanelPhotoStatus.REJECTED
                      ? "Enviar Nova Foto"
                      : "Adicionar Foto"}
                  </p>
                  <p className="text-xs mt-1 text-muted-foreground">
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
          )}

          {product.status === SupplierPanelPhotoStatus.REJECTED && (
            <div className="w-full max-w-70 bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Foto Recusada</p>
                <p className="text-destructive/80 leading-tight mt-1">
                  {product.rejectionReason ||
                    "Fora dos padrões exigidos. Envie uma nova imagem."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
