/* eslint-disable @next/next/no-img-element */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Payment,
  PaymentStatus,
  PaymentType,
  Role,
} from "@/generated/prisma/browser";
import { authClient } from "@/lib/auth/client";
import { PaymentUtils } from "@/lib/payment-utils";
import { revalidatePath } from "@/lib/revalidate-sc";
import {
  cn,
  convertCurrencyInput,
  hasRoles,
  safeCopyToClipboard,
} from "@/lib/utils";
import { PopoverClose } from "@radix-ui/react-popover";
import axios from "axios";
import {
  Check,
  Copy,
  DollarSign,
  Download,
  ImageIcon,
  Loader2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import Dropzone from "react-dropzone";
import { toast } from "sonner";

const formatCurrency = (value: string | number) => {
  const numericValue = Number(value);
  if (isNaN(numericValue)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
};

interface PaymentActionButtonsProps {
  payment: Payment;
}

export function PaymentsSectionActionButtons({
  payment,
}: PaymentActionButtonsProps) {
  const SubmitProofOfPaymentButton = () => {
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    if (payment.type !== PaymentType.PIX_CNPJ) return;

    const processFile = (file: File) => {
      try {
        const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

        const MAX_SIZE_MB = 10;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

        if (!allowedImageTypes.includes(file.type))
          return toast.error("Formato de arquivo incompatível");
        else if (file.size > MAX_SIZE_BYTES)
          return toast.error("Tamanho máximo de imagem permitido é 10MB");
        setImageFile(file);

        const imageUrl = URL.createObjectURL(file);
        setImagePreview(imageUrl);
      } catch (e: any) {
        console.error("Erro ao selecionar foto:", e);
        toast.error(e?.message || "Imagem invalido para envio");
      }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    };

    const handleDrop = (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        processFile(acceptedFiles[0]);
      }
    };

    const handleConfirm = async () => {
      if (!imagePreview || !imageFile) return;
      setIsUploading(true);

      try {
        const { uploadUrl, key } = await axios
          .post("/api/upload-url", {
            fileName: `${imageFile.name}`,
            path: "/proof-of-payment",
            contentType: imageFile.type,
          })
          .then((r) => r.data);

        await axios.put(uploadUrl, imageFile, {
          headers: { "Content-Type": imageFile.type },
        });

        const { message } = await axios
          .post(`/api/payments/${payment.id}/proof-of-payment`, {
            fileKey: key,
          })
          .then((res) => res.data);

        toast.success(message);
      } catch (error: any) {
        console.error("Error to send Proof of Payment:", error);
        toast.error(error.response?.data.error || "Erro ao enviar comprovante");
      } finally {
        revalidatePath(`/pedidos/${payment.orderId}`);
        setIsUploading(false);
      }
    };

    const handleCopy = async () => {
      const result = await safeCopyToClipboard(payment.text || payment.url);
      if (!result) return toast.error("Erro ao copiar pagamento");
      toast.success("Pagamento copiado!");
    };

    const handleRemoveImage = () => {
      setImagePreview(null);
    };

    const image = payment.proofOfPaymentUrl || imagePreview;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={
              (payment.status !== PaymentStatus.ACTIVE &&
                payment.status !== PaymentStatus.PAID) ||
              isUploading
            }
            className="h-7 w-7"
          >
            <Upload className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverClose className="absolute right-2 top-2" />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Comprovante de Pagamento</h4>

            <div className="flex flex-col items-center justify-center">
              {image ? (
                <div className="relative w-full">
                  <img
                    src={image}
                    alt="Preview"
                    className="w-full aspect-square object-cover rounded-lg border"
                  />
                  {!payment.proofOfPaymentUrl && (
                    <Button
                      variant="destructive"
                      size="icon"
                      type="button"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ) : (
                <Dropzone
                  onDrop={(acceptedFiles: File[]) => handleDrop(acceptedFiles)}
                  noClick={true}
                >
                  {({ getRootProps, getInputProps }) => (
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center aspect-square w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="flex flex-col items-center justify-center pt-5 pb-6"
                        {...getRootProps()}
                      >
                        <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Clique para selecionar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG ou PDF
                        </p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleImageChange}
                        {...getInputProps()}
                      />
                    </label>
                  )}
                </Dropzone>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                type="button"
                onClick={handleConfirm}
                disabled={
                  !!payment.proofOfPaymentUrl || !imagePreview || isUploading
                }
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {payment.proofOfPaymentUrl ? "Enviado" : "Confirmar"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                type="button"
                onClick={handleCopy}
                disabled={!payment.text}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const SubmitPaidStatusButton = () => {
    const [isSubmittingPaidStatus, setIsSubmittingPaidStatus] =
      useState<boolean>();

    const submitPaidPayment = async () => {
      toast.info("Enviando pagamento...");
      setIsSubmittingPaidStatus(true);
      try {
        const { message } = await axios
          .post(`/api/payments/${payment.id}/confirm`)
          .then((res) => res.data);
        toast.success(message);
      } catch (e: any) {
        toast.error(e.response?.data?.error || "Erro ao enviar pagamento");
      } finally {
        setIsSubmittingPaidStatus(false);
        revalidatePath(`/pedidos/${payment.orderId}`);
      }
    };

    switch (payment.type) {
      case PaymentType.MONEY:
      case PaymentType.PATNERSHIP:
        return (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => submitPaidPayment()}
            disabled={
              payment.status !== PaymentStatus.ACTIVE || isSubmittingPaidStatus
            }
            className="h-7 w-7"
          >
            <Check className="h-3 w-3 " />
          </Button>
        );
    }
  };

  const DownloadPaymentButton = () => {
    const downloadPayment = async () => {
      try {
        toast.info("Fazendo download do pagamento...");
        const response = await axios.post(
          "/download",
          {
            url: payment.url,
            filename: `boleto-${payment.id}.pdf`,
            type: "pdf",
          },
          { responseType: "blob" },
        );
        const blob = await response.data;

        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `p-${payment.id}.pdf`;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        toast.success("Download concluido com sucesso");
      } catch (err) {}
    };

    switch (payment.type) {
      case PaymentType.BOLETO:
        return (
          <Button
            variant="ghost"
            size="icon"
            disabled={!payment.url || payment.status !== PaymentStatus.ACTIVE}
            className="h-7 w-7"
            onClick={() => downloadPayment()}
          >
            <Download className="size-3.5" />
          </Button>
        );
    }
  };

  const CopyPaymentContentButton = () => {
    const copyPaymentContent = async () => {
      const result = await safeCopyToClipboard(payment.text || payment.url);
      if (!result) return toast.error("Erro ao copiar pagamento");
      toast.success("Pagamento copiado!");
    };

    switch (payment.type) {
      case PaymentType.CARD_CREDIT:
      case PaymentType.PIX:
        return (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            disabled={
              !(payment.text || payment.url) ||
              payment.status !== PaymentStatus.ACTIVE
            }
            className="h-7 w-7"
            onClick={() => copyPaymentContent()}
          >
            <Copy className="h-3 w-3" />
          </Button>
        );
    }
  };

  const canRefundPayment = () => {
    const isPaidOrPartiallyRefunded =
      payment.status === PaymentStatus.PAID ||
      PaymentUtils.isRefunded(payment) === "partially";

    return isPaidOrPartiallyRefunded && !!payment.externalId;
  };

  const RefundPaymentButton = () => {
    const { data } = authClient.useSession();

    const [isRefundingPayment, setIsRefundingPayment] = useState(false);
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [step, setStep] = useState<"type" | "confirm">("type");
    const [refundType, setRefundType] = useState<"full" | "partial">("full");
    const [refundAmount, setRefundAmount] = useState("");
    const [refundReason, setRefundReason] = useState("");

    if (!canRefundPayment() || !data?.user.role) return;

    const isAllowed = hasRoles(
      [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
      data?.user.role as Role,
    );

    if (!isAllowed) return;

    const remainingValue = PaymentUtils.getPaymentValue(payment);
    const paymentAmount = Number(payment.amount);

    const resetDialog = () => {
      setStep("type");
      setRefundType("full");
      setRefundAmount("");
      setRefundReason("");
    };

    const handleOpenChange = (open: boolean) => {
      if (!open) resetDialog();
      setRefundDialogOpen(open);
    };

    const handleNext = () => {
      if (refundType === "partial") {
        const amount = Number(refundAmount);
        if (!amount || amount <= 0) {
          return toast.error("Informe um valor válido para o estorno");
        }
        if (amount > remainingValue) {
          return toast.error(
            `O valor máximo para estorno é ${formatCurrency(remainingValue)}`,
          );
        }
      }
      setStep("confirm");
    };

    const handleBack = () => {
      setStep("type");
    };

    const handleRefundPayment = async () => {
      if (!refundReason.trim()) {
        return toast.error("Informe o motivo do estorno");
      }

      const amount =
        refundType === "full" ? remainingValue : Number(refundAmount);

      toast.info("Estornando pagamento...");
      setIsRefundingPayment(true);

      try {
        const { message } = await axios
          .post(`/api/payments/${payment.id}/refund`, {
            amount,
            reason: refundReason.trim(),
          })
          .then((res) => res.data);

        handleOpenChange(false);
        toast.success(message);
      } catch (e: any) {
        toast.error(e.response?.data?.error || "Erro ao estornar pagamento");
      } finally {
        setIsRefundingPayment(false);
        revalidatePath(`/pedidos/${payment.orderId}`);
      }
    };

    return (
      <>
        <div>
          <Dialog open={refundDialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Estornar Pagamento
                </DialogTitle>
                <DialogDescription>
                  {step === "type"
                    ? "Escolha o tipo de estorno e informe o motivo. Esta ação não pode ser desfeita."
                    : "Confirme os dados do estorno abaixo."}
                </DialogDescription>
              </DialogHeader>

              {step === "type" ? (
                <div className="space-y-5 py-1">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      Valor do Pagamento:
                    </span>
                    <span className="text-base font-semibold">
                      {formatCurrency(paymentAmount)}
                    </span>
                  </div>

                  {Number(payment.refundAmount) > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                      <span className="text-sm text-blue-700">
                        Já estornado:
                      </span>
                      <span className="text-base font-semibold text-blue-700">
                        {formatCurrency(Number(payment.refundAmount))}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Tipo de Estorno
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRefundType("full")}
                        className={cn(
                          "flex w-full rounded-lg border p-4 text-left transition-colors",
                          refundType === "full"
                            ? "border-emerald-500"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium">Estorno Total</p>
                          <p className="text-xs text-muted-foreground">
                            Estornar o valor completo de{" "}
                            {formatCurrency(remainingValue)}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRefundType("partial")}
                        className={cn(
                          "flex w-full rounded-lg border p-4 text-left transition-colors",
                          refundType === "partial"
                            ? "border-emerald-500"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium">Estorno Parcial</p>
                          <p className="text-xs text-muted-foreground">
                            Especificar um valor menor que o total
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {refundType === "partial" && (
                    <div className="space-y-2">
                      <Label htmlFor="refund-amount">Valor do Estorno</Label>
                      <Input
                        id="refund-amount"
                        type="text"
                        placeholder="R$ 0,00"
                        value={refundAmount ? "R$ " + refundAmount : ""}
                        onChange={(e) => {
                          const input = convertCurrencyInput(e.target.value);
                          if (input) setRefundAmount(input);
                          else setRefundAmount("");
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="refund-reason">Motivo do Estorno</Label>
                    <Textarea
                      id="refund-reason"
                      placeholder="Descreva o motivo do estorno..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-emerald-700 hover:bg-emerald-800"
                    >
                      Próximo
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-5 py-1">
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Tipo:
                      </span>
                      <span className="text-sm font-medium">
                        {refundType === "full"
                          ? "Estorno Total"
                          : "Estorno Parcial"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Valor do estorno:
                      </span>
                      <span className="text-base font-semibold text-red-600">
                        {formatCurrency(
                          refundType === "full"
                            ? remainingValue
                            : Number(refundAmount),
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Valor restante após estorno:
                      </span>
                      <span className="text-base font-semibold">
                        {formatCurrency(
                          refundType === "full"
                            ? 0
                            : remainingValue - Number(refundAmount),
                        )}
                      </span>
                    </div>
                    {refundReason && (
                      <div className="border-t pt-3">
                        <span className="text-xs text-muted-foreground">
                          Motivo:
                        </span>
                        <p className="text-sm mt-1">{refundReason}</p>
                      </div>  
                    )}
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isRefundingPayment}
                      onClick={handleRefundPayment}
                    >
                      {isRefundingPayment && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Confirmar Estorno
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Button
          className="h-7 w-7 p-0"
          size="icon"
          variant="ghost"
          type="button"
          disabled={isRefundingPayment}
          onClick={() => setRefundDialogOpen(true)}
        >
          <Undo2 className="size-3.5" />
        </Button>
      </>
    );
  };

  const CancelPaymentButton = () => {
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    const handleCancelPayment = async () => {
      toast.info(
        "Cancelando pagamento no valor de " +
          formatCurrency(PaymentUtils.getPaymentValue(payment)),
      );

      try {
        const { message } = await axios
          .delete(`/api/payments/${payment.id}`)
          .then((res) => res.data);

        setCancelDialogOpen(false);
        toast.success(message);
      } catch (e: any) {
        toast.error(e.response?.data?.error || "Erro ao cancelar pagamento");
      } finally {
        revalidatePath(`/pedidos/${payment.orderId}`);
      }
    };

    const canCancelPayment = () => {
      if (payment.status === PaymentStatus.PAID) return false;
      if (payment.status !== PaymentStatus.ACTIVE) return false;

      switch (payment.type) {
        case PaymentType.PIX:
        case PaymentType.CARD_CREDIT:
        case PaymentType.BOLETO:
        case PaymentType.MONEY:
        case PaymentType.PATNERSHIP:
        case PaymentType.PIX_CNPJ:
          return true;
        default:
          return false;
      }
    };

    if (!canCancelPayment()) return;

    return (
      <>
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Pagamento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar este pagamento de{" "}
                {formatCurrency(PaymentUtils.getPaymentValue(payment))}? Esta
                ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCancelDialogOpen(false)}>
                Voltar
              </AlertDialogCancel>
              <Button variant={"destructive"} asChild>
                <AlertDialogAction onClick={handleCancelPayment}>
                  Confirmar Cancelamento
                </AlertDialogAction>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          className="h-7 w-7 p-0"
          size={"icon"}
          variant={"ghost"}
          type="button"
          onClick={() => setCancelDialogOpen(true)}
        >
          <X className="size-3.5" />
        </Button>
      </>
    );
  };

  return (
    <>
      <SubmitProofOfPaymentButton />
      <SubmitPaidStatusButton />
      <DownloadPaymentButton />
      <CopyPaymentContentButton />
      <RefundPaymentButton />
      <CancelPaymentButton />
    </>
  );
}
