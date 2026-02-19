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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from "@/generated/prisma/browser";
import { PaymentUtils } from "@/lib/payment-utils";
import { revalidatePath } from "@/lib/revalidate-sc";
import { safeCopyToClipboard } from "@/lib/utils";
import { PopoverClose } from "@radix-ui/react-popover";
import axios from "axios";
import {
  Check,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
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

    if (payment.type !== PaymentType.PIX_CNPJ) return;

    const processFile = (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      if (!imagePreview) return;
      setIsUploading(true);
      try {
        const { message } = await axios
          .post(`/api/payments/${payment.id}/proof-of-payment`, {
            imagePreview,
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
                  <Image
                    src={image}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="w-full aspect-square object-cover rounded-lg border"
                  />
                  {!payment.proofOfPaymentUrl && (
                    <Button
                      variant="destructive"
                      size="icon"
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
    return (
      // PaymentUtils.isRefunded(payment) === "partially") &&
      payment.status === PaymentStatus.PAID &&
      [PaymentType.PIX, PaymentType.CARD_CREDIT].includes(
        payment.type as any,
      ) &&
      !!payment.externalId
    );
  };

  // const RefundPaymentButton = () => {
  //   const { data: auth } = authClient.useSession();

  //   const [isRefundingPayment, setIsRefundingPayment] =
  //     useState<boolean>(false);
  //   const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  //   if (!canRefundPayment() || !auth?.user.role) return;

  //   const isAllowed = hasRoles([Role.SUPERVISOR], auth.user.role as Role);

  //   const handleRefundPayment = async (
  //     paymentId: string,
  //     amount: string,
  //     reason: string,
  //   ) => {
  //     toast.info("Estornando pagamento...");

  //     setIsRefundingPayment(true);
  //     const res = await refundPayment(paymentId, reason, amount);

  //     if (res.error || !res.data)
  //       return toast.error(res.error || "Erro ao estornar pagamento");

  //     updatePaymentView(res.data);

  //     setRefundDialogOpen(false);
  //     setIsRefundingPayment(false);

  //     toast.success(res.success);
  //   };
  //   return (
  //     <>
  //       <RefundDialog
  //         open={refundDialogOpen}
  //         onOpenChange={() => {}}
  //         onConfirm={handleRefundPayment}
  //         isAllowed={isAllowed}
  //         payment={payment}
  //       />
  //       <Button
  //         className="h-7 w-7 p-0"
  //         size={"icon"}
  //         variant={"ghost"}
  //         disabled={isRefundingPayment}
  //         onClick={() => {
  //           setRefundDialogOpen(true);
  //         }}
  //       >
  //         <Undo2 className="size-3.5" />
  //       </Button>
  //     </>
  //   );
  // };

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
      switch (payment.type) {
        case PaymentType.PIX:
        case PaymentType.CARD_CREDIT:
          if (payment.status === PaymentStatus.ACTIVE) return true;
          if (payment.status === PaymentStatus.PAID && !payment.externalId)
            return true;
          return false;
        case PaymentType.BOLETO:
          if (payment.status === PaymentStatus.ACTIVE) return true;
          return false;
        case PaymentType.MONEY:
        case PaymentType.PATNERSHIP:
        case PaymentType.PIX_CNPJ:
          switch (payment.status) {
            case PaymentStatus.ACTIVE:
            case PaymentStatus.PAID:
              return true;
          }
          return false;
        default:
          return false;
      }
    };

    const isVisible = () => {
      switch (payment.type) {
        case PaymentType.PIX:
        case PaymentType.CARD_CREDIT:
          if (canRefundPayment()) return false;
          return true;
        case PaymentType.BOLETO:
        case PaymentType.MONEY:
        case PaymentType.PATNERSHIP:
        case PaymentType.PIX_CNPJ:
          return true;
        default:
          return false;
      }
    };

    if (!isVisible()) return;

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
          disabled={!canCancelPayment()}
          onClick={() => {
            setCancelDialogOpen(true);
          }}
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
      {/* <RefundPaymentButton /> */}
      <CancelPaymentButton />
    </>
  );
}
